import type { CalendarEvent, EventCategory, EventFlexibility, Notification } from '../types'

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
  { date: '2026-04-27', start: '00:20', durationMin: 40, title: 'Slide Deck Polish Pass', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-04-27', '09:00') },
  { date: '2026-04-27', start: '06:00', durationMin: 45, title: 'Mobility + Breathwork', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-27', start: '07:50', durationMin: 40, title: 'Commute to Innovation Hub', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Innovation Hub' },
  { date: '2026-04-27', start: '09:10', durationMin: 70, title: 'Sponsor Alignment Check-In', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 5 },
  { date: '2026-04-27', start: '11:00', durationMin: 55, title: 'Poster Pickup and Supplies', category: 'errand', flexibility: 'flexible', locationLabel: 'Print Center' },
  { date: '2026-04-27', start: '12:20', durationMin: 60, title: 'Team Lunch Huddle', category: 'meal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-04-27', start: '14:00', durationMin: 110, title: 'Focus Block: Demo Narrative', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-27', start: '20:10', durationMin: 90, title: 'Presentation Rehearsal Round 1', category: 'class', flexibility: 'fixed' },

  { date: '2026-04-28', start: '00:15', durationMin: 35, title: 'Overnight Build Verification', category: 'other', flexibility: 'fixed' },
  { date: '2026-04-28', start: '05:55', durationMin: 50, title: 'Tempo Run: Speed Intervals', category: 'exercise', flexibility: 'flexible', locationLabel: 'River Loop' },
  { date: '2026-04-28', start: '08:05', durationMin: 35, title: 'Campus Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Apartment -> Campus' },
  { date: '2026-04-28', start: '09:00', durationMin: 80, title: 'Faculty Review Session', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-04-28', start: '11:10', durationMin: 60, title: 'Lunch and Annotate Feedback', category: 'meal', flexibility: 'semi_flexible' },
  { date: '2026-04-28', start: '13:00', durationMin: 105, title: 'Focus Block: Prototype Stabilization', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-28', start: '16:20', durationMin: 70, title: 'A/V Equipment Dry Run', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-04-28', start: '21:20', durationMin: 75, title: 'Study Session: Q&A Prep', category: 'class', flexibility: 'flexible' },

  { date: '2026-04-29', start: '00:10', durationMin: 30, title: 'Checklist Sync and Notes', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-04-29', '08:30') },
  { date: '2026-04-29', start: '06:20', durationMin: 40, title: 'Recovery Stretch', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-29', start: '08:00', durationMin: 45, title: 'Downtown Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Conference Hall' },
  { date: '2026-04-29', start: '09:10', durationMin: 90, title: 'Partner Integration Standup', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 8 },
  { date: '2026-04-29', start: '11:45', durationMin: 55, title: 'Networking Lunch', category: 'personal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-04-29', start: '13:15', durationMin: 120, title: 'Focus Block: Final Bug Sweep', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-29', start: '17:10', durationMin: 70, title: 'Errands: Cables + Batteries', category: 'errand', flexibility: 'flexible' },
  { date: '2026-04-29', start: '20:30', durationMin: 95, title: 'Panel Simulation Practice', category: 'class', flexibility: 'fixed' },

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

  { date: '2026-04-30', start: '00:20', durationMin: 35, title: 'After-Hours Log Review', category: 'other', flexibility: 'fixed' },
  { date: '2026-04-30', start: '05:40', durationMin: 50, title: 'Sunrise Cardio', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-04-30', start: '07:55', durationMin: 40, title: 'Morning Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Downtown Office' },
  { date: '2026-04-30', start: '09:15', durationMin: 75, title: 'Project Kickoff Meeting', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 9 },
  { date: '2026-04-30', start: '11:30', durationMin: 60, title: 'Mentor Session', category: 'research_meeting', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-04-30', start: '13:00', durationMin: 60, title: 'Lunch Break', category: 'meal', flexibility: 'flexible' },
  { date: '2026-04-30', start: '15:00', durationMin: 120, title: 'Focus Block: Integration Work', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-04-30', start: '18:20', durationMin: 70, title: 'Grocery and Supplies', category: 'errand', flexibility: 'flexible', locationLabel: 'Neighborhood Market' },
  { date: '2026-04-30', start: '21:30', durationMin: 90, title: 'Evening Study Group', category: 'class', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 5 },
  { date: '2026-04-30', start: '23:35', durationMin: 24, title: 'Prep for May 1 Deadline', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-05-01', '09:00') },

  { date: '2026-05-01', start: '00:30', durationMin: 30, title: 'Release Health Check', category: 'work_meeting', flexibility: 'fixed' },
  { date: '2026-05-01', start: '06:15', durationMin: 45, title: 'Mobility Routine', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-01', start: '08:10', durationMin: 35, title: 'Transit to Campus', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Campus' },
  { date: '2026-05-01', start: '09:00', durationMin: 80, title: 'Design Review', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 7 },
  { date: '2026-05-01', start: '11:00', durationMin: 70, title: 'Applied ML Lecture', category: 'class', flexibility: 'fixed', locationLabel: 'Engineering 302' },
  { date: '2026-05-01', start: '12:45', durationMin: 60, title: 'Lunch with Team', category: 'meal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-05-01', start: '14:15', durationMin: 105, title: 'Deep Work: Reporting Draft', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-01', start: '17:40', durationMin: 65, title: 'Pick Up Prescriptions', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-01', start: '19:20', durationMin: 95, title: 'Dinner with Friends', category: 'personal', flexibility: 'semi_flexible' },
  { date: '2026-05-01', start: '22:30', durationMin: 75, title: 'Code Cleanup Session', category: 'research_meeting', flexibility: 'flexible' },

  { date: '2026-05-02', start: '00:15', durationMin: 30, title: 'Late Night Notes', category: 'personal', flexibility: 'flexible' },
  { date: '2026-05-02', start: '05:55', durationMin: 55, title: 'Tempo Run', category: 'exercise', flexibility: 'flexible', locationLabel: 'City Park Loop' },
  { date: '2026-05-02', start: '08:00', durationMin: 45, title: 'Weekend Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Library' },
  { date: '2026-05-02', start: '09:30', durationMin: 90, title: 'Capstone Work Session', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-02', start: '12:00', durationMin: 60, title: 'Lunch and Planning', category: 'meal', flexibility: 'flexible' },
  { date: '2026-05-02', start: '13:30', durationMin: 80, title: 'Research Collaboration Call', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-05-02', start: '16:00', durationMin: 75, title: 'Workshop Office Hours', category: 'class', flexibility: 'fixed' },
  { date: '2026-05-02', start: '18:10', durationMin: 70, title: 'Household Errands', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-02', start: '20:00', durationMin: 90, title: 'Weekly Review + Next Week Plan', category: 'deadline_task', flexibility: 'semi_flexible', deadlineUtc: toLocalIso('2026-05-03', '22:00') },
  { date: '2026-05-02', start: '23:20', durationMin: 35, title: 'Shutdown Routine', category: 'other', flexibility: 'flexible' },

  { date: '2026-05-03', start: '00:25', durationMin: 35, title: 'Post-Week Wrap Notes', category: 'personal', flexibility: 'flexible' },
  { date: '2026-05-03', start: '06:05', durationMin: 45, title: 'Trail Recovery Run', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-03', start: '08:10', durationMin: 35, title: 'Transit to Library', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Central Library' },
  { date: '2026-05-03', start: '09:00', durationMin: 80, title: 'Independent Study Block', category: 'class', flexibility: 'fixed' },
  { date: '2026-05-03', start: '11:10', durationMin: 60, title: 'Lunch and Weekly Priorities', category: 'meal', flexibility: 'flexible' },
  { date: '2026-05-03', start: '13:00', durationMin: 110, title: 'Focus Block: Slide Story Refinement', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-03', start: '16:30', durationMin: 75, title: 'Advisor Strategy Call', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-05-03', start: '20:15', durationMin: 90, title: 'Presentation Coaching Session', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 4 },

  { date: '2026-05-04', start: '00:15', durationMin: 30, title: 'Release Notes Review', category: 'other', flexibility: 'fixed' },
  { date: '2026-05-04', start: '06:10', durationMin: 50, title: 'Strength Circuit', category: 'exercise', flexibility: 'flexible', locationLabel: 'Campus Gym' },
  { date: '2026-05-04', start: '08:00', durationMin: 40, title: 'Office Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Apartment -> Office' },
  { date: '2026-05-04', start: '09:00', durationMin: 30, title: 'Daily Standup', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 7 },
  { date: '2026-05-04', start: '10:00', durationMin: 80, title: 'Stakeholder Demo Review', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 9 },
  { date: '2026-05-04', start: '12:15', durationMin: 55, title: 'Lunch Break', category: 'meal', flexibility: 'flexible' },
  { date: '2026-05-04', start: '14:00', durationMin: 120, title: 'Focus Block: Implementation Sprint', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-04', start: '20:40', durationMin: 80, title: 'Evening Seminar Prep', category: 'class', flexibility: 'flexible' },

  { date: '2026-05-05', start: '00:20', durationMin: 30, title: 'Midnight Metrics Check', category: 'other', flexibility: 'fixed' },
  { date: '2026-05-05', start: '06:00', durationMin: 40, title: 'Breathing + Mobility', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-05', start: '07:55', durationMin: 35, title: 'Shuttle Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Research Park' },
  { date: '2026-05-05', start: '09:05', durationMin: 85, title: 'Cross-Team Architecture Sync', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-05-05', start: '11:30', durationMin: 60, title: 'Lunch with Mentor', category: 'personal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-05-05', start: '13:15', durationMin: 100, title: 'Focus Block: Speaker Notes', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-05', start: '17:20', durationMin: 65, title: 'Print Handouts', category: 'errand', flexibility: 'flexible', locationLabel: 'Copy Center' },
  { date: '2026-05-05', start: '20:00', durationMin: 95, title: 'Mock Demo Panel', category: 'class', flexibility: 'fixed' },

  { date: '2026-05-06', start: '00:30', durationMin: 30, title: 'Checklist Finalization', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-05-06', '09:00') },
  { date: '2026-05-06', start: '06:15', durationMin: 45, title: 'Tempo Recovery Walk', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-06', start: '08:05', durationMin: 45, title: 'Conference Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Convention Center' },
  { date: '2026-05-06', start: '09:20', durationMin: 75, title: 'Morning Presentation Slot', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 12 },
  { date: '2026-05-06', start: '11:30', durationMin: 55, title: 'Lunch and Debrief', category: 'meal', flexibility: 'semi_flexible' },
  { date: '2026-05-06', start: '13:00', durationMin: 120, title: 'Focus Block: Follow-Up Deliverables', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-06', start: '17:30', durationMin: 70, title: 'Research Debrief with Advisor', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-05-06', start: '21:00', durationMin: 80, title: 'Evening Personal Reset', category: 'personal', flexibility: 'flexible' },

  { date: '2026-05-07', start: '00:10', durationMin: 35, title: 'Post-Conference Notes', category: 'personal', flexibility: 'flexible' },
  { date: '2026-05-07', start: '06:05', durationMin: 45, title: 'Cardio Session', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-07', start: '08:00', durationMin: 40, title: 'Campus Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Campus' },
  { date: '2026-05-07', start: '09:00', durationMin: 90, title: 'Graduate Seminar', category: 'class', flexibility: 'fixed' },
  { date: '2026-05-07', start: '11:30', durationMin: 60, title: 'Lunch and Team Retrospective', category: 'meal', flexibility: 'flexible' },
  { date: '2026-05-07', start: '13:15', durationMin: 105, title: 'Focus Block: Backlog Burn-Down', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-07', start: '17:15', durationMin: 75, title: 'Hardware Return Errand', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-07', start: '20:20', durationMin: 90, title: 'Collaboration Night Session', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 5 },

  { date: '2026-05-08', start: '00:20', durationMin: 30, title: 'Deployment Health Snapshot', category: 'other', flexibility: 'fixed' },
  { date: '2026-05-08', start: '06:10', durationMin: 50, title: 'Long Walk + Podcast', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-08', start: '08:10', durationMin: 35, title: 'Office Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Office' },
  { date: '2026-05-08', start: '09:00', durationMin: 80, title: 'Feature Review Meeting', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-05-08', start: '11:15', durationMin: 60, title: 'Lunch with Product Team', category: 'meal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-05-08', start: '13:00', durationMin: 120, title: 'Focus Block: Reporting and Docs', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-08', start: '17:25', durationMin: 70, title: 'Groceries and Meal Prep', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-08', start: '20:30', durationMin: 90, title: 'Community Tech Talk', category: 'class', flexibility: 'fixed' },

  { date: '2026-05-09', start: '00:25', durationMin: 35, title: 'Week Reflection Journal', category: 'personal', flexibility: 'flexible' },
  { date: '2026-05-09', start: '06:00', durationMin: 45, title: 'Tempo Endurance Run', category: 'exercise', flexibility: 'flexible', locationLabel: 'Lakeside Loop' },
  { date: '2026-05-09', start: '08:20', durationMin: 40, title: 'Weekend Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Makerspace' },
  { date: '2026-05-09', start: '09:15', durationMin: 95, title: 'Build Sprint: Demo Enhancements', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-09', start: '12:00', durationMin: 60, title: 'Lunch and Schedule Review', category: 'meal', flexibility: 'flexible' },
  { date: '2026-05-09', start: '13:40', durationMin: 85, title: 'Research Collaboration Session', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-05-09', start: '17:10', durationMin: 70, title: 'Presentation Supply Run', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-09', start: '20:00', durationMin: 95, title: 'Final Rehearsal and Timing', category: 'deadline_task', flexibility: 'fixed', deadlineUtc: toLocalIso('2026-05-10', '10:00') },

  { date: '2026-05-10', start: '07:20', durationMin: 50, title: 'Morning Long Run', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-11', start: '09:10', durationMin: 80, title: 'Team Roadmap Sync', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 8 },
  { date: '2026-05-12', start: '12:15', durationMin: 55, title: 'Lunch and Mentorship Chat', category: 'meal', flexibility: 'semi_flexible', hasExternalAttendees: true, attendeeCount: 2 },
  { date: '2026-05-13', start: '14:00', durationMin: 110, title: 'Focus Block: API Refactor', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-14', start: '18:40', durationMin: 70, title: 'Store Pickup and Errands', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-15', start: '22:10', durationMin: 60, title: 'Applied AI Study Session', category: 'class', flexibility: 'flexible' },
  { date: '2026-05-16', start: '08:30', durationMin: 45, title: 'Weekend Commute', category: 'commute', flexibility: 'fixed', locationLabel: 'Home -> Library' },
  { date: '2026-05-17', start: '10:00', durationMin: 85, title: 'Research Writing Sprint', category: 'research_meeting', flexibility: 'semi_flexible' },
  { date: '2026-05-18', start: '13:30', durationMin: 95, title: 'Design Review Workshop', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 6 },
  { date: '2026-05-19', start: '20:30', durationMin: 85, title: 'Project Deep Work Session', category: 'focus_block', flexibility: 'flexible' },
  { date: '2026-05-20', start: '23:05', durationMin: 40, title: 'End-of-Day Reflection', category: 'personal', flexibility: 'flexible' },
  { date: '2026-05-21', start: '06:40', durationMin: 45, title: 'Strength Circuit', category: 'exercise', flexibility: 'flexible' },
  { date: '2026-05-22', start: '11:20', durationMin: 60, title: 'Client Office Hours', category: 'work_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 3 },
  { date: '2026-05-23', start: '16:10', durationMin: 75, title: 'Community Seminar', category: 'class', flexibility: 'fixed' },
  { date: '2026-05-24', start: '19:15', durationMin: 90, title: 'Family Dinner Night', category: 'personal', flexibility: 'fixed' },
  { date: '2026-05-25', start: '00:30', durationMin: 35, title: 'Overnight System Check', category: 'other', flexibility: 'fixed' },
  { date: '2026-05-26', start: '09:45', durationMin: 70, title: 'Research Collaboration Call', category: 'research_meeting', flexibility: 'fixed', hasExternalAttendees: true, attendeeCount: 4 },
  { date: '2026-05-27', start: '15:30', durationMin: 105, title: 'Focus Block: Finalize Demo', category: 'focus_block', flexibility: 'semi_flexible' },
  { date: '2026-05-28', start: '17:55', durationMin: 65, title: 'Household Supply Run', category: 'errand', flexibility: 'flexible' },
  { date: '2026-05-29', start: '21:40', durationMin: 75, title: 'Evening Literature Review', category: 'class', flexibility: 'flexible' },
  { date: '2026-05-30', start: '13:00', durationMin: 120, title: 'Monthly Planning Block', category: 'deadline_task', flexibility: 'semi_flexible', deadlineUtc: toLocalIso('2026-05-31', '22:00') },
]

export const EXAMPLE_ACCOUNT_EVENTS: CalendarEvent[] = SPECS.map((spec, index) =>
  seedEvent(`demo-e${index + 1}`, spec)
)

function findSeedEventId(date: string, start: string, title: string): string | undefined {
  const startUtc = toLocalIso(date, start)
  return EXAMPLE_ACCOUNT_EVENTS.find((event) => event.startUtc === startUtc && event.title === title)?.id
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const DEMO_EVENT_IDS = {
  sponsorAlignment: findSeedEventId('2026-04-27', '09:10', 'Sponsor Alignment Check-In'),
  stakeholderReview: findSeedEventId('2026-05-04', '10:00', 'Stakeholder Demo Review'),
  morningPresentation: findSeedEventId('2026-05-06', '09:20', 'Morning Presentation Slot'),
  finalRehearsal: findSeedEventId('2026-05-09', '20:00', 'Final Rehearsal and Timing'),
}

export const EXAMPLE_ACCOUNT_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-n1',
    type: 'reminder',
    title: 'Presentation Week Kickoff',
    body: 'Sponsor Alignment Check-In starts soon. Open the event to review notes and attendees.',
    eventId: DEMO_EVENT_IDS.sponsorAlignment,
    action: {
      route: '/',
      eventId: DEMO_EVENT_IDS.sponsorAlignment,
      viewMode: 'day',
      ctaLabel: 'Open event',
    },
    read: false,
    createdAt: minutesAgoIso(12),
  },
  {
    id: 'demo-n2',
    type: 'suggestion',
    title: 'AI Suggestion: Reserve Buffer Time',
    body: 'Add a short buffer before Stakeholder Demo Review to stabilize setup and transitions.',
    eventId: DEMO_EVENT_IDS.stakeholderReview,
    action: {
      route: '/',
      eventId: DEMO_EVENT_IDS.stakeholderReview,
      viewMode: 'day',
      openAIPanel: true,
      ctaLabel: 'Review suggestion',
    },
    read: false,
    createdAt: minutesAgoIso(35),
  },
  {
    id: 'demo-n3',
    type: 'ai',
    title: 'Tempo AI Ready to Help',
    body: 'Ask Tempo AI to optimize presentation-day pacing and travel buffers across your calendar.',
    action: {
      route: '/',
      openAIPanel: true,
      ctaLabel: 'Open assistant',
    },
    read: false,
    createdAt: minutesAgoIso(70),
  },
  {
    id: 'demo-n4',
    type: 'reminder',
    title: 'Presentation Slot Tomorrow',
    body: 'Morning Presentation Slot is tomorrow. Open the event to confirm timing and location.',
    eventId: DEMO_EVENT_IDS.morningPresentation,
    action: {
      route: '/',
      eventId: DEMO_EVENT_IDS.morningPresentation,
      viewMode: 'day',
      ctaLabel: 'Review details',
    },
    read: true,
    createdAt: minutesAgoIso(140),
  },
  {
    id: 'demo-n5',
    type: 'insight',
    title: 'Strong Prep Consistency',
    body: 'You kept 8 prep-focused sessions this week. Check insights for category trends.',
    action: {
      route: '/insights',
      ctaLabel: 'View insights',
    },
    read: true,
    createdAt: minutesAgoIso(240),
  },
  {
    id: 'demo-n6',
    type: 'reminder',
    title: 'Final Rehearsal Scheduled',
    body: 'Final Rehearsal and Timing is on your calendar. Open it to verify checklist items.',
    eventId: DEMO_EVENT_IDS.finalRehearsal,
    action: {
      route: '/',
      eventId: DEMO_EVENT_IDS.finalRehearsal,
      viewMode: 'day',
      ctaLabel: 'Open rehearsal',
    },
    read: false,
    createdAt: minutesAgoIso(320),
  },
]
