export type EventCategory =
  | 'other'
  | 'research_meeting'
  | 'work_meeting'
  | 'class'
  | 'focus_block'
  | 'exercise'
  | 'personal'
  | 'errand'
  | 'meal'
  | 'commute'
  | 'deadline_task';

export type EventFlexibility = 'fixed' | 'semi_flexible' | 'flexible';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  flexibility: EventFlexibility;
  startUtc: string; // ISO 8601
  endUtc: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  hasExternalAttendees: boolean;
  attendeeCount: number;
  deadlineUtc?: string;
  locationLabel?: string;
  isCompleted: boolean;
  completedAt?: string;
  aiGenerated: boolean;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  timezone: string;
  workdayStart: string;
  workdayEnd: string;
  quietStart: string;
  quietEnd: string;
  travelBufferMinutes: number;
}

export interface RescheduleOption {
  proposedStartUtc: string;
  proposedEndUtc: string;
  score: number;
  reasons: string[];
}

export interface ConflictResolution {
  eventToKeep: CalendarEvent;
  eventToMove: CalendarEvent;
  keepScore: number;
  moveScore: number;
  decisionReasons: string[];
  choiceOptions: RescheduleOption[];
}

export interface Notification {
  id: string;
  type: 'conflict' | 'suggestion' | 'reminder' | 'insight' | 'ai';
  title: string;
  body: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
  conflictResolution?: ConflictResolution;
}

export interface InsightsData {
  completionRate: number;
  totalEventsThisWeek: number;
  completedEvents: number;
  rescheduledEvents: number;
  topCategory: EventCategory;
  streakDays: number;
  procrastinationScore: number;
  weeklyHeatmap: number[][];
  categoryBreakdown: { category: EventCategory; count: number; completionRate: number }[];
  productivityTrend: { date: string; score: number }[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: AIAction[];
}

export interface AIAction {
  type: 'create_event' | 'move_event' | 'complete_event' | 'view_conflict';
  label: string;
  payload?: unknown;
}

export type ViewMode = 'week' | 'day' | 'month';
