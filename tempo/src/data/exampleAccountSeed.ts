import type { CalendarEvent, EventCategory, EventFlexibility } from '../types'

export const EXAMPLE_ACCOUNT = {
  id: 'u-demo',
  name: 'Tempo Demo',
  email: 'demo@tempo.app',
  password: 'tempo123',
  createdAt: '2026-04-01T12:00:00.000Z',
} as const

export const EXAMPLE_ACCOUNT_PROFILE = {
  timezone: 'America/Chicago',
  workdayStart: '07:00',
  workdayEnd: '22:00',
  quietStart: '23:00',
  quietEnd: '06:00',
  travelBufferMinutes: 20,
} as const

type EventSeedSpec = {
  date: string
  start: string
  durationMin: number
  title: string
  category: EventCategory
  flexibility: EventFlexibility
  description?: string
  locationLabel?: string
  hasExternalAttendees?: boolean
  attendeeCount?: number
  deadlineUtc?: string
}

function toLocalIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

function seedEvent(id: string, spec: EventSeedSpec): CalendarEvent {
  const startUtc = toLocalIso(spec.date, spec.start)
  const endUtc = addMinutes(startUtc, spec.durationMin)
  return {
    id,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    flexibility: spec.flexibility,
    startUtc,
    endUtc,
    isRecurring: false,
    hasExternalAttendees: spec.hasExternalAttendees ?? false,
    attendeeCount: spec.attendeeCount ?? 1,
    deadlineUtc: spec.deadlineUtc,
    locationLabel: spec.locationLabel,
    isCompleted: false,
    aiGenerated: false,
  }
}

const SPECS: EventSeedSpec[] = [
  { date: '2026-04-03', start: '00:30', durationMin: 45, title: 'Late-Night Journal Review', category: 'personal', flexibility: 'flexible', description: 'Reflection and planning notes for the weekend.' },
  { date: '2026-04-03', start: '05:45', durationMin: 60, title: 'Sunrise Run', category: 'exercise', flexibility: 'flexible', locationLabel: 'River Trail' },
  { date: '2026-04-03', start: '08:00', durationMin: 45, title: 'Morning Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home → Campus' },
  { date: '2026-04-03', start: '10:00', durationMin: 90, title: 'Research Lab Sync', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-04-03', start: '12:30', durationMin: 60, title: 'Lunch + Walking Break', category: 'meal', flexibility: 'flexible', locationLabel: 'Student Center' },
  { date: '2026-04-03', start: '15:00', durationMin: 120, title: 'Focus Block: Experiment Analysis', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-03', start: '18:30', durationMin: 75, title: 'Grocery Restock', category: 'errand', flexibility: 'flexible', locationLabel: 'Market District' },
  { date: '2026-04-03', start: '22:15', durationMin: 60, title: 'Reading Session', category: 'class', flexibility: 'flexible', description: 'Read two chapters and annotate key ideas.' },

  { date: '2026-04-04', start: '00:15', durationMin: 35, title: 'Night Release Monitoring', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-04-04', start: '06:30', durationMin: 60, title: 'Morning Yoga Class', category: 'class', flexibility: 'fixed', locationLabel: 'City Studio' },
  { date: '2026-04-04', start: '08:30', durationMin: 50, title: 'Breakfast Prep', category: 'meal', flexibility: 'flexible' },
  { date: '2026-04-04', start: '10:15', durationMin: 105, title: 'Sprint Planning', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 8 },
  { date: '2026-04-04', start: '13:00', durationMin: 90, title: 'Project Architecture Review', category: 'research_meeting', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-04-04', start: '16:00', durationMin: 120, title: 'Focus Block: Capstone Build', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-04', start: '19:30', durationMin: 90, title: 'Family Dinner', category: 'personal', flexibility: 'fixed' },
  { date: '2026-04-04', start: '23:10', durationMin: 40, title: 'Prep Monday Deadline', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-04-05', '09:00') },

  { date: '2026-04-05', start: '00:20', durationMin: 30, title: 'Travel Price Check', category: 'other', flexibility: 'flexible' },
  { date: '2026-04-05', start: '05:30', durationMin: 45, title: 'Mobility Routine', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-05', start: '07:45', durationMin: 40, title: 'Airport Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home → Airport' },
  { date: '2026-04-05', start: '10:00', durationMin: 70, title: 'Cloud Ops Workshop', category: 'class', flexibility: 'fixed' },
  { date: '2026-04-05', start: '12:15', durationMin: 55, title: 'Lunch with Alumni', category: 'meal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-04-05', start: '14:00', durationMin: 100, title: 'Deep Work: Draft Results Section', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-05', start: '17:30', durationMin: 80, title: 'Home Reset + Laundry', category: 'errand', flexibility: 'flexible' },
  { date: '2026-04-05', start: '22:40', durationMin: 50, title: 'Plan Monday Agenda', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-04-06', '08:00') },

  { date: '2026-04-06', start: '01:00', durationMin: 30, title: 'Post-Deploy Check', category: 'work_meeting', flexibility: 'fixed' },
  { date: '2026-04-06', start: '06:15', durationMin: 45, title: 'Strength Training', category: 'exercise', flexibility: 'flexible', locationLabel: 'Campus Gym' },
  { date: '2026-04-06', start: '08:05', durationMin: 40, title: 'Office Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Apartment → Office' },
  { date: '2026-04-06', start: '09:00', durationMin: 30, title: 'Daily Standup', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 7 },
  { date: '2026-04-06', start: '11:00', durationMin: 60, title: 'Client Discovery Call', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-04-06', start: '13:00', durationMin: 60, title: 'Lunch Break', category: 'meal', flexibility: 'flexible' },
  { date: '2026-04-06', start: '15:00', durationMin: 105, title: 'Research Writing Session', category: 'research_meeting', flexibility: 'semi_flexible' },
  { date: '2026-04-06', start: '21:30', durationMin: 90, title: 'Study Review', category: 'class', flexibility: 'flexible' },

  { date: '2026-04-07', start: '00:40', durationMin: 35, title: 'Overnight Backup Audit', category: 'other', flexibility: 'fixed' },
  { date: '2026-04-07', start: '05:50', durationMin: 50, title: 'Interval Run', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-07', start: '08:20', durationMin: 35, title: 'Campus Commute', category: 'commute', flexibility: 'fixed' },
  { date: '2026-04-07', start: '09:00', durationMin: 90, title: 'Machine Learning Lecture', category: 'class', flexibility: 'fixed', locationLabel: 'Engineering Hall 204' },
  { date: '2026-04-07', start: '11:15', durationMin: 45, title: 'Advisor Office Hours', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-04-07', start: '14:00', durationMin: 90, title: 'Focus Block: Product Demo Prep', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-07', start: '18:45', durationMin: 75, title: 'Dinner Meetup', category: 'personal', flexibility: 'semi_flexible' },
  { date: '2026-04-07', start: '22:20', durationMin: 60, title: 'Bug Triage', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 5 },

  { date: '2026-04-08', start: '00:25', durationMin: 40, title: 'Incident Review Notes', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-04-08', '10:00') },
  { date: '2026-04-08', start: '06:10', durationMin: 40, title: 'Recovery Walk', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-08', start: '07:50', durationMin: 35, title: 'Train Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'North Line' },
  { date: '2026-04-08', start: '09:30', durationMin: 60, title: 'Quarterly Planning', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 10 },
  { date: '2026-04-08', start: '12:00', durationMin: 60, title: 'Lunch & Learn', category: 'class', flexibility: 'semi_flexible' },
  { date: '2026-04-08', start: '14:15', durationMin: 90, title: 'Interview Panel', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-04-08', start: '17:40', durationMin: 70, title: 'Pharmacy + Supplies', category: 'errand', flexibility: 'flexible' },
  { date: '2026-04-08', start: '20:15', durationMin: 95, title: 'Side Project Build', category: 'focus_block', flexibility: 'flexible' },

  { date: '2026-04-09', start: '00:10', durationMin: 30, title: 'Post-Release Monitoring', category: 'work_meeting', flexibility: 'fixed' },
  { date: '2026-04-09', start: '06:30', durationMin: 30, title: 'Stretch Session', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-09', start: '08:00', durationMin: 45, title: 'School Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home → Campus' },
  { date: '2026-04-09', start: '09:00', durationMin: 70, title: 'Research Presentation', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 5 },
  { date: '2026-04-09', start: '11:30', durationMin: 60, title: 'Team Lunch', category: 'meal', flexibility: 'semi_flexible' },
  { date: '2026-04-09', start: '13:00', durationMin: 120, title: 'Focus Block: Thesis Draft', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-09', start: '16:15', durationMin: 60, title: 'Career Coaching Call', category: 'personal', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-04-09', start: '19:00', durationMin: 90, title: 'Evening Seminar', category: 'class', flexibility: 'fixed' },
  { date: '2026-04-09', start: '21:30', durationMin: 55, title: 'Pack for Weekend Trip', category: 'errand', flexibility: 'flexible' },
  { date: '2026-04-09', start: '23:30', durationMin: 29, title: 'Reflect + Shutdown', category: 'personal', flexibility: 'flexible' },
]

export const EXAMPLE_ACCOUNT_EVENTS: CalendarEvent[] = SPECS.map((spec, index) =>
  seedEvent(`demo-e${index + 1}`, spec)
)
