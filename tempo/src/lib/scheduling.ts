/**
 * JavaScript port of the C# Tempo.AgenticScheduling engine core algorithms.
 * Mirrors: EventStabilityScorer, CandidateWindowGenerator, ChoiceOptionSelector
 */
import type { CalendarEvent, RescheduleOption, ConflictResolution, User } from '../types';
import { addDays, startOfDay, setHours, setMinutes } from 'date-fns';

// ── Category base scores (mirrors EventStabilityScorer) ──────────────────────
const CATEGORY_BASE: Record<CalendarEvent['category'], number> = {
  research_meeting: 5.0,
  work_meeting: 4.5,
  class: 4.5,
  deadline_task: 4.0,
  focus_block: 3.0,
  exercise: 2.0,
  personal: 2.0,
  errand: 1.5,
  meal: 1.5,
  commute: 1.0,
  other: 1.0,
};

const FLEXIBILITY_ADJ: Record<CalendarEvent['flexibility'], number> = {
  fixed: 3.0,
  semi_flexible: 1.0,
  flexible: 0.0,
};

export function scoreEventStability(event: CalendarEvent, now: Date): number {
  let score = CATEGORY_BASE[event.category];
  score += FLEXIBILITY_ADJ[event.flexibility];

  if (event.hasExternalAttendees) score += 2.0;
  if (event.attendeeCount >= 3) score += 1.0;
  if (event.isRecurring) score += 0.5;

  if (event.deadlineUtc) {
    const hoursUntilDeadline = (new Date(event.deadlineUtc).getTime() - now.getTime()) / 3_600_000;
    if (hoursUntilDeadline <= 48) score += 2.0;
  }

  return score;
}

export function detectConflict(
  incoming: CalendarEvent,
  existingEvents: CalendarEvent[]
): CalendarEvent | null {
  const inStart = new Date(incoming.startUtc).getTime();
  const inEnd = new Date(incoming.endUtc).getTime();

  for (const ev of existingEvents) {
    if (ev.id === incoming.id) continue;
    const evStart = new Date(ev.startUtc).getTime();
    const evEnd = new Date(ev.endUtc).getTime();
    if (inStart < evEnd && inEnd > evStart) return ev;
  }
  return null;
}

export function generateCandidateWindows(
  eventToMove: CalendarEvent,
  allEvents: CalendarEvent[],
  user: User,
  now: Date,
  horizonDays = 7
): Array<{ start: Date; end: Date }> {
  const duration =
    new Date(eventToMove.endUtc).getTime() - new Date(eventToMove.startUtc).getTime();
  const candidates: Array<{ start: Date; end: Date }> = [];
  const increment = 30 * 60_000; // 30 min

  const [wsH, wsM] = user.workdayStart.split(':').map(Number);
  const [weH, weM] = user.workdayEnd.split(':').map(Number);

  const blockedRanges = allEvents
    .filter((e) => e.id !== eventToMove.id)
    .map((e) => ({ start: new Date(e.startUtc).getTime(), end: new Date(e.endUtc).getTime() }))
    .sort((a, b) => a.start - b.start);

  for (let day = 0; day <= horizonDays; day++) {
    const base = addDays(startOfDay(now), day);
    const dayStartMs = setMinutes(setHours(base, wsH), wsM).getTime();
    const dayEndMs = setMinutes(setHours(base, weH), weM).getTime();

    let cursor = Math.max(dayStartMs, now.getTime());

    for (const block of blockedRanges) {
      if (block.start >= dayEndMs || block.end <= dayStartMs) continue;
      const gapEnd = block.start - 30 * 60_000; // travel buffer
      for (let t = cursor; t + duration <= gapEnd; t += increment) {
        if (t >= dayStartMs) candidates.push({ start: new Date(t), end: new Date(t + duration) });
      }
      cursor = Math.max(cursor, block.end + 30 * 60_000);
    }

    for (let t = cursor; t + duration <= dayEndMs; t += increment) {
      if (t >= dayStartMs) candidates.push({ start: new Date(t), end: new Date(t + duration) });
    }
  }

  return candidates.slice(0, 40); // cap
}

function scoreCandidateSlot(
  eventToMove: CalendarEvent,
  candidate: { start: Date; end: Date },
  now: Date
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const hour = candidate.start.getHours();
  const originalHour = new Date(eventToMove.startUtc).getHours();
  const disruptionHours = Math.abs(hour - originalHour);

  score -= Math.min(disruptionHours / 2, 4);
  if (disruptionHours <= 6) {
    score += 1;
    reasons.push('Close to original time');
  }

  // Prefer preferred time-of-day for each category
  if (eventToMove.category === 'exercise' && (hour === 7 || hour === 18)) {
    score += 2;
    reasons.push('Typical workout time');
  }
  if ((eventToMove.category === 'focus_block' || eventToMove.category === 'deadline_task') && hour >= 9 && hour <= 12) {
    score += 2;
    reasons.push('Peak focus hours');
  }
  if (eventToMove.category === 'meal' && (hour === 12 || hour === 18)) {
    score += 1.5;
    reasons.push('Standard meal time');
  }

  // Penalize very early or late
  if (hour < 7 || hour > 21) {
    score -= 3;
    reasons.push('Outside productive hours');
  }

  // Penalize how far in the future
  const dayOffset = Math.max(0, (candidate.start.getTime() - now.getTime()) / 86_400_000);
  score -= dayOffset * 0.5;

  return { score, reasons };
}

function diverseSelect(
  ranked: Array<{ option: RescheduleOption }>,
  count: number
): RescheduleOption[] {
  const selected: RescheduleOption[] = [];
  for (const { option } of ranked) {
    const isDiverse = selected.every((s) => {
      const sepMs = Math.abs(
        new Date(option.proposedStartUtc).getTime() - new Date(s.proposedStartUtc).getTime()
      );
      return sepMs >= 90 * 60_000 || new Date(option.proposedStartUtc).toDateString() !== new Date(s.proposedStartUtc).toDateString();
    });
    if (selected.length === 0 || isDiverse) selected.push(option);
    if (selected.length === count) break;
  }
  return selected;
}

export function resolveConflict(
  incoming: CalendarEvent,
  existing: CalendarEvent,
  allEvents: CalendarEvent[],
  user: User,
  now: Date
): ConflictResolution {
  const inScore = scoreEventStability(incoming, now);
  const exScore = scoreEventStability(existing, now);

  const keepIncoming = inScore >= exScore;
  const eventToKeep = keepIncoming ? incoming : existing;
  const eventToMove = keepIncoming ? existing : incoming;
  const keepScore = keepIncoming ? inScore : exScore;
  const moveScore = keepIncoming ? exScore : inScore;

  const reasons: string[] = [];
  if (eventToKeep.flexibility === 'fixed') reasons.push('Is a fixed commitment');
  if (eventToKeep.hasExternalAttendees) reasons.push('Has external attendees');
  if (eventToKeep.attendeeCount >= 3) reasons.push('Involves multiple people');
  if (eventToKeep.isRecurring) reasons.push('Is a recurring event');
  if (reasons.length === 0) reasons.push('Higher priority category');

  const candidates = generateCandidateWindows(eventToMove, allEvents, user, now, 7);
  const scored = candidates
    .map((c) => {
      const { score, reasons: r } = scoreCandidateSlot(eventToMove, c, now);
      return {
        option: {
          proposedStartUtc: c.start.toISOString(),
          proposedEndUtc: c.end.toISOString(),
          score,
          reasons: r,
        } as RescheduleOption,
      };
    })
    .sort((a, b) => b.option.score - a.option.score);

  const choiceOptions = diverseSelect(scored, 2);

  return { eventToKeep, eventToMove, keepScore, moveScore, decisionReasons: reasons, choiceOptions };
}

// ── AI response simulation ────────────────────────────────────────────────────
export function simulateAIResponse(
  userMessage: string,
  events: CalendarEvent[],
  now: Date
): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('conflict') || lower.includes('overlap')) {
    return "I've scanned your schedule and found 1 potential overlap: your Gym Session may conflict with an upcoming meeting. I've generated two alternative time slots — would you like to see them?";
  }
  if (lower.includes('optimize') || lower.includes('reschedule')) {
    return "Looking at your week, I'd suggest moving your Grocery Run to Saturday morning (9–10 AM) since you typically complete errands then. Your focus blocks could shift earlier to take advantage of your peak productivity window (9–11 AM). Want me to apply these changes?";
  }
  if (lower.includes('deadline') || lower.includes('due')) {
    const deadlined = events.filter((e) => e.deadlineUtc && new Date(e.deadlineUtc) > now);
    if (deadlined.length > 0) {
      return `You have ${deadlined.length} upcoming deadline(s): ${deadlined.map((e) => e.title).join(', ')}. I recommend blocking 2–3 hours tomorrow morning for focused work on these.`;
    }
    return "You're all clear on deadlines this week! Great job staying on top of things. 🎉";
  }
  if (lower.includes('free') || lower.includes('available') || lower.includes('when')) {
    return "Based on your schedule, you have free windows tomorrow: 8–9 AM and 2–3 PM. Thursday afternoon also looks open from 3:30 PM onwards. Want me to suggest something productive for those slots?";
  }
  if (lower.includes('add') || lower.includes('schedule') || lower.includes('create')) {
    if (lower.includes('test')) {
      return JSON.stringify({
        content: "I've added the test event.",
        mutations: [
          {
            type: "CREATE_EVENT",
            title: "AI Test Event",
            startUtc: new Date(now.getTime() + 3600000).toISOString(),
            endUtc: new Date(now.getTime() + 7200000).toISOString(),
            category: "focus_block"
          }
        ]
      })
    }
    return "Sure! I can help you schedule that. Could you tell me the title, preferred time, and how flexible the timing is? I'll check for conflicts and find the best slot automatically.";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm your Tempo scheduling assistant. I can help you schedule events, resolve conflicts, optimize your week, or give you productivity insights. What would you like to do today?`;
  }
  if (lower.includes('insight') || lower.includes('productiv')) {
    return "This week you've completed 83% of your scheduled events — that's above your monthly average of 76%. Your focus blocks have the highest completion rate. Your peak productivity window appears to be 9 AM–12 PM based on your completion patterns.";
  }

  return "I'm here to help optimize your schedule! You can ask me to find free time, resolve conflicts, reschedule events, or give you productivity insights. What would you like to do?";
}
