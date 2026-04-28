import { addDays, addHours, format, startOfWeek, setHours, setMinutes } from 'date-fns';
import type { CalendarEvent, User, InsightsData, Notification } from '../types';

const now = new Date();
const weekStart = startOfWeek(now, { weekStartsOn: 1 });

function makeEvent(
  id: string,
  title: string,
  category: CalendarEvent['category'],
  flexibility: CalendarEvent['flexibility'],
  dayOffset: number,
  startHour: number,
  durationHours: number,
  opts: Partial<CalendarEvent> = {}
): CalendarEvent {
  const start = setMinutes(setHours(addDays(weekStart, dayOffset), startHour), 0);
  const end = addHours(start, durationHours);
  return {
    id,
    title,
    category,
    flexibility,
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    isRecurring: false,
    hasExternalAttendees: false,
    attendeeCount: 1,
    isCompleted: false,
    aiGenerated: false,
    ...opts,
  };
}

export const MOCK_EVENTS: CalendarEvent[] = [
  makeEvent('e1', 'Research Meeting', 'research_meeting', 'fixed', 0, 10, 1.5, {
    hasExternalAttendees: true,
    attendeeCount: 4,
    isRecurring: true,
    description: 'Weekly lab sync with the team',
  }),
  makeEvent('e2', 'CS 4870 Lecture', 'class', 'fixed', 0, 13, 1.5, {
    isRecurring: true,
    locationLabel: 'Room 204, Engineering Building',
    description: 'Machine Learning lecture',
  }),
  makeEvent('e3', 'Gym Session', 'exercise', 'flexible', 0, 17, 1, {
    locationLabel: 'Campus Rec Center',
  }),
  makeEvent('e4', 'Project Deep Work', 'focus_block', 'semi_flexible', 1, 9, 2, {
    description: 'Finish the agentic scheduling module',
    deadlineUtc: addDays(now, 3).toISOString(),
  }),
  makeEvent('e5', 'Team Standup', 'work_meeting', 'fixed', 1, 11, 0.5, {
    hasExternalAttendees: true,
    attendeeCount: 6,
    isRecurring: true,
  }),
  makeEvent('e6', 'Lunch', 'meal', 'flexible', 1, 12, 1, {
    locationLabel: 'Campus Dining Hall',
  }),
  makeEvent('e7', 'Capstone Presentation Prep', 'focus_block', 'semi_flexible', 1, 14, 2.5, {
    description: 'Rehearse and polish the demo',
    deadlineUtc: addDays(now, 5).toISOString(),
  }),
  makeEvent('e8', 'Advisor Meeting', 'research_meeting', 'fixed', 2, 10, 1, {
    hasExternalAttendees: true,
    attendeeCount: 2,
    description: 'Monthly progress review',
  }),
  makeEvent('e9', 'Submit Assignment 4', 'deadline_task', 'fixed', 2, 23, 0.5, {
    deadlineUtc: setHours(addDays(weekStart, 2), 23).toISOString(),
    description: 'Deep learning assignment',
  }),
  makeEvent('e10', 'Gym Session', 'exercise', 'flexible', 2, 17, 1, {
    locationLabel: 'Campus Rec Center',
    isRecurring: true,
  }),
  makeEvent('e11', 'Coffee Chat', 'personal', 'flexible', 3, 15, 0.5, {
    locationLabel: 'Campus Coffee Shop',
  }),
  makeEvent('e12', 'CS 4870 Lecture', 'class', 'fixed', 3, 13, 1.5, {
    isRecurring: true,
    locationLabel: 'Room 204, Engineering Building',
  }),
  makeEvent('e13', 'Sprint Planning', 'work_meeting', 'semi_flexible', 4, 9, 2, {
    hasExternalAttendees: true,
    attendeeCount: 8,
    description: 'Q2 sprint planning session',
  }),
  makeEvent('e14', 'Grocery Run', 'errand', 'flexible', 4, 17, 1, {
    locationLabel: 'Whole Foods Market',
  }),
  makeEvent('e15', 'Personal Project', 'focus_block', 'flexible', 5, 10, 3, {
    description: 'Side project development',
  }),
  makeEvent('e16', 'Morning Run', 'exercise', 'flexible', 5, 7, 1, {
    isRecurring: true,
  }),
  makeEvent('e17', 'Family Dinner', 'personal', 'semi_flexible', 6, 18, 2, {
    hasExternalAttendees: false,
    attendeeCount: 5,
    locationLabel: 'Home',
  }),
];

export const MOCK_USER: User = {
  id: 'u1',
  email: 'haris@tempo.app',
  displayName: 'Haris',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  workdayStart: '08:00',
  workdayEnd: '22:00',
  quietStart: '23:00',
  quietEnd: '07:00',
  travelBufferMinutes: 30,
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'conflict',
    title: 'Schedule Conflict Detected',
    body: 'Gym Session overlaps with Team Standup tomorrow.',
    eventId: 'e3',
    action: {
      route: '/',
      viewMode: 'day',
      eventId: 'e3',
      openAIPanel: true,
      openConflictResolver: true,
      ctaLabel: 'Resolve now',
    },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    type: 'suggestion',
    title: 'AI Suggestion',
    body: 'Move "Grocery Run" to Saturday morning - you typically complete errands then.',
    eventId: 'e14',
    action: {
      route: '/',
      eventId: 'e14',
      viewMode: 'day',
      openAIPanel: true,
      ctaLabel: 'Review option',
    },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Deadline Tomorrow',
    body: 'Assignment 4 is due tomorrow at 11:59 PM.',
    eventId: 'e9',
    action: {
      route: '/',
      eventId: 'e9',
      viewMode: 'day',
      ctaLabel: 'Open deadline',
    },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n4',
    type: 'insight',
    title: 'Weekly Insight',
    body: 'You completed 87% of your focus blocks this week - your best streak yet!',
    action: {
      route: '/insights',
      ctaLabel: 'View insights',
    },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export const MOCK_INSIGHTS: InsightsData = {
  completionRate: 0.83,
  totalEventsThisWeek: 17,
  completedEvents: 14,
  rescheduledEvents: 3,
  topCategory: 'focus_block',
  streakDays: 12,
  procrastinationScore: 22,
  weeklyHeatmap: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      if (hour < 7 || hour > 22) return 0;
      if (day >= 5) return Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0;
      return Math.random() < 0.5 ? Math.floor(Math.random() * 4) + 1 : 0;
    })
  ),
  categoryBreakdown: [
    { category: 'focus_block', count: 5, completionRate: 0.9 },
    { category: 'research_meeting', count: 3, completionRate: 1.0 },
    { category: 'class', count: 4, completionRate: 1.0 },
    { category: 'exercise', count: 3, completionRate: 0.67 },
    { category: 'work_meeting', count: 2, completionRate: 1.0 },
  ],
  productivityTrend: Array.from({ length: 14 }, (_, i) => ({
    date: format(addDays(addDays(now, -13), i), 'MMM d'),
    score: Math.floor(55 + Math.random() * 40),
  })),
};
