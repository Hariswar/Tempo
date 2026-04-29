import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent, ViewMode, Notification, AIMessage, User, ConflictResolution } from '../types';
import { MOCK_EVENTS, MOCK_NOTIFICATIONS, MOCK_USER } from '../data/mockData';
import { EXAMPLE_ACCOUNT, EXAMPLE_ACCOUNT_EVENTS, EXAMPLE_ACCOUNT_NOTIFICATIONS } from '../data/exampleAccountSeed';
import { detectConflict, resolveConflict } from '../lib/scheduling';
import { getCurrentAuthUser, type AuthUser } from '../services/authService';

interface UserScopedState {
  events: CalendarEvent[];
  notifications: Notification[];
  user: User;
}

interface AppState {
  // Session
  activeUserEmail: string | null;

  // Calendar
  events: CalendarEvent[];
  viewMode: ViewMode;
  selectedDate: string; // ISO date string
  selectedEvent: CalendarEvent | null;
  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;

  // AI Panel
  isAIPanelOpen: boolean;
  aiMessages: AIMessage[];
  pendingConflict: ConflictResolution | null;

  // Notifications
  notifications: Notification[];

  // User
  user: User;

  // UI
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;

  // Actions
  switchAuthUser: (authUser: AuthUser | null) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  openEventModal: (event?: CalendarEvent) => void;
  closeEventModal: () => void;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  completeEvent: (id: string) => void;
  moveEvent: (id: string, startUtc: string, endUtc: string) => void;

  toggleAIPanel: () => void;
  addAIMessage: (message: AIMessage) => void;
  clearAIMessages: () => void;
  setPendingConflict: (resolution: ConflictResolution | null) => void;
  acceptRescheduleOption: (eventId: string, startUtc: string, endUtc: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;

  toggleSidebar: () => void;
  toggleTheme: () => void;
}

const USER_DATA_KEY_PREFIX = 'tempo-user-data-v2::';

function normalizeEmail(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null;
}

function isExampleAccountEmail(email?: string | null): boolean {
  return normalizeEmail(email) === EXAMPLE_ACCOUNT.email.toLowerCase();
}

function getInitialSelectedDate(_authUser: AuthUser | null, _events: CalendarEvent[]): string {
  return new Date().toISOString();
}

function userDataStorageKey(email: string): string {
  return `${USER_DATA_KEY_PREFIX}${normalizeEmail(email)}`;
}

function buildStoreUser(authUser: AuthUser | null): User {
  return {
    ...MOCK_USER,
    id: authUser?.id ?? MOCK_USER.id,
    email: authUser?.email ?? MOCK_USER.email,
    displayName: authUser?.name ?? MOCK_USER.displayName,
    timezone: authUser?.profile?.timezone ?? MOCK_USER.timezone,
    workdayStart: authUser?.profile?.workdayStart ?? MOCK_USER.workdayStart,
    workdayEnd: authUser?.profile?.workdayEnd ?? MOCK_USER.workdayEnd,
    quietStart: authUser?.profile?.quietStart ?? MOCK_USER.quietStart,
    quietEnd: authUser?.profile?.quietEnd ?? MOCK_USER.quietEnd,
    travelBufferMinutes: authUser?.profile?.travelBufferMinutes ?? MOCK_USER.travelBufferMinutes,
  };
}

function defaultScopedState(authUser: AuthUser | null): UserScopedState {
  const isExampleAccount = isExampleAccountEmail(authUser?.email);
  return {
    events: isExampleAccount ? [...EXAMPLE_ACCOUNT_EVENTS] : [],
    notifications: isExampleAccount ? [...EXAMPLE_ACCOUNT_NOTIFICATIONS] : [],
    user: buildStoreUser(authUser),
  };
}

function eventSeedMergeKey(event: CalendarEvent): string {
  return `${event.title.trim().toLowerCase()}|${event.startUtc}|${event.endUtc}`;
}

function mergeMissingExampleSeedEvents(events: CalendarEvent[]): CalendarEvent[] {
  const existingKeys = new Set(events.map((event) => eventSeedMergeKey(event)));
  const missing = EXAMPLE_ACCOUNT_EVENTS.filter((seedEvent) => !existingKeys.has(eventSeedMergeKey(seedEvent)));
  if (missing.length === 0) return events;
  return [...events, ...missing];
}

function notificationSeedMergeKey(notification: Notification): string {
  return `${notification.type}|${notification.title.trim().toLowerCase()}|${notification.eventId ?? ''}|${notification.body.trim().toLowerCase()}`;
}

function mergeMissingExampleSeedNotifications(notifications: Notification[]): Notification[] {
  const existingKeys = new Set(notifications.map((notification) => notificationSeedMergeKey(notification)));
  const missing = EXAMPLE_ACCOUNT_NOTIFICATIONS.filter(
    (seedNotification) => !existingKeys.has(notificationSeedMergeKey(seedNotification))
  );
  if (missing.length === 0) return notifications;
  return [...missing, ...notifications];
}

function readScopedState(authUser: AuthUser | null): UserScopedState {
  if (!authUser) return defaultScopedState(null);

  const key = userDataStorageKey(authUser.email);
  const raw = localStorage.getItem(key);
  if (!raw) return defaultScopedState(authUser);

  try {
    const parsed = JSON.parse(raw) as Partial<UserScopedState>;
    const authUserProfile = buildStoreUser(authUser);
    const persistedUser = parsed.user;
    const isExampleAccount = isExampleAccountEmail(authUser.email);
    const parsedEvents = Array.isArray(parsed.events)
      ? parsed.events
      : isExampleAccount
        ? [...EXAMPLE_ACCOUNT_EVENTS]
        : [...MOCK_EVENTS];
    const parsedNotifications = Array.isArray(parsed.notifications)
      ? parsed.notifications
      : isExampleAccount
        ? [...EXAMPLE_ACCOUNT_NOTIFICATIONS]
        : [...MOCK_NOTIFICATIONS];
    const mergedEvents = isExampleAccount ? mergeMissingExampleSeedEvents(parsedEvents) : parsedEvents;
    const mergedNotifications = isExampleAccount
      ? mergeMissingExampleSeedNotifications(parsedNotifications)
      : parsedNotifications;
    const scoped: UserScopedState = {
      events: mergedEvents,
      notifications: mergedNotifications,
      user: persistedUser
        ? {
            ...authUserProfile,
            timezone: persistedUser.timezone ?? authUserProfile.timezone,
            workdayStart: persistedUser.workdayStart ?? authUserProfile.workdayStart,
            workdayEnd: persistedUser.workdayEnd ?? authUserProfile.workdayEnd,
            quietStart: persistedUser.quietStart ?? authUserProfile.quietStart,
            quietEnd: persistedUser.quietEnd ?? authUserProfile.quietEnd,
            travelBufferMinutes: persistedUser.travelBufferMinutes ?? authUserProfile.travelBufferMinutes,
          }
        : authUserProfile,
    };

    if (
      isExampleAccount &&
      (mergedEvents.length !== parsedEvents.length || mergedNotifications.length !== parsedNotifications.length)
    ) {
      persistScopedState(authUser.email, scoped);
    }

    return scoped;
  } catch {
    return defaultScopedState(authUser);
  }
}

function persistScopedState(email: string | null, scoped: UserScopedState) {
  if (!email) return;
  localStorage.setItem(
    userDataStorageKey(email),
    JSON.stringify({
      events: scoped.events,
      notifications: scoped.notifications,
      user: scoped.user,
    })
  );
}

function normalizeEventTitle(title: string | undefined, sequence: number): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  return `Untitled Event ${sequence}`;
}

type RepeatRule = 'daily' | 'bi-daily' | 'weekly' | 'bi-weekly' | 'monthly';
const RECURRING_SERIES_OCCURRENCES = 24;

function normalizeRepeatRule(rule: string | undefined): RepeatRule | null {
  if (rule === 'daily' || rule === 'bi-daily' || rule === 'weekly' || rule === 'bi-weekly' || rule === 'monthly') {
    return rule;
  }
  return null;
}

function shiftRecurringWindow(startUtc: string, endUtc: string, rule: RepeatRule, step: number): { startUtc: string; endUtc: string } {
  const start = new Date(startUtc);
  const end = new Date(endUtc);

  if (rule === 'monthly') {
    start.setMonth(start.getMonth() + step);
    end.setMonth(end.getMonth() + step);
  } else {
    const dayStep =
      rule === 'daily' ? step :
      rule === 'bi-daily' ? step * 2 :
      rule === 'weekly' ? step * 7 :
      step * 14;
    start.setDate(start.getDate() + dayStep);
    end.setDate(end.getDate() + dayStep);
  }

  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

const initialAuthUser = getCurrentAuthUser();
const initialScopedState = readScopedState(initialAuthUser);
let eventCounter = initialScopedState.events.length + 1;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const persistActiveScopedState = () => {
        const s = get();
        persistScopedState(s.activeUserEmail, {
          events: s.events,
          notifications: s.notifications,
          user: s.user,
        });
      };

      return {
        activeUserEmail: normalizeEmail(initialAuthUser?.email),
        events: initialScopedState.events,
        viewMode: 'week',
        selectedDate: getInitialSelectedDate(initialAuthUser, initialScopedState.events),
        selectedEvent: null,
        isEventModalOpen: false,
        editingEvent: null,
        isAIPanelOpen: false,
        aiMessages: [],
        pendingConflict: null,
        notifications: initialScopedState.notifications,
        user: initialScopedState.user,
        isSidebarCollapsed: false,
        isDarkMode: true,

        switchAuthUser: (authUser) => {
          const scoped = readScopedState(authUser);
          const email = normalizeEmail(authUser?.email);
          eventCounter = scoped.events.length + 1;
          set({
            activeUserEmail: email,
            events: scoped.events,
            notifications: scoped.notifications,
            user: scoped.user,
            selectedEvent: null,
            isEventModalOpen: false,
            editingEvent: null,
            isAIPanelOpen: false,
            aiMessages: [],
            pendingConflict: null,
            selectedDate: getInitialSelectedDate(authUser, scoped.events),
          });
          persistScopedState(email, scoped);
        },

        updateUserProfile: (updates) => {
          set((s) => ({
            user: {
              ...s.user,
              ...updates,
            },
          }));
          persistActiveScopedState();
        },

        setViewMode: (mode) => set({ viewMode: mode }),
        setSelectedDate: (date) => set({ selectedDate: date }),
        selectEvent: (event) => set({ selectedEvent: event }),

        openEventModal: (event) =>
          set({ isEventModalOpen: true, editingEvent: event ?? null }),
        closeEventModal: () =>
          set({ isEventModalOpen: false, editingEvent: null }),

        createEvent: (eventData) => {
          const repeatRule = normalizeRepeatRule(eventData.recurrenceRule);
          const normalizedInput: Omit<CalendarEvent, 'id'> = {
            ...eventData,
            isRecurring: Boolean(repeatRule),
            recurrenceRule: repeatRule ?? undefined,
          };

          const sequence = eventCounter;
          const id = `e${eventCounter++}`;
          const newEvent: CalendarEvent = {
            ...normalizedInput,
            title: normalizeEventTitle(normalizedInput.title, sequence),
            id,
          };

          const seriesEvents: CalendarEvent[] = [newEvent];
          if (repeatRule) {
            for (let step = 1; step <= RECURRING_SERIES_OCCURRENCES; step += 1) {
              const shifted = shiftRecurringWindow(newEvent.startUtc, newEvent.endUtc, repeatRule, step);
              const nextId = `e${eventCounter++}`;
              seriesEvents.push({
                ...newEvent,
                id: nextId,
                startUtc: shifted.startUtc,
                endUtc: shifted.endUtc,
              });
            }
          }

          const { events, user } = get();
          const now = new Date();

          // Auto-detect conflicts
          const conflict = detectConflict(newEvent, events);
          if (conflict) {
            const resolution = resolveConflict(newEvent, conflict, events, user, now);
            set((s) => ({
              events: [...s.events, ...seriesEvents],
              pendingConflict: resolution,
              isAIPanelOpen: true,
            }));
            persistActiveScopedState();
            get().addNotification({
              type: 'conflict',
              title: 'Conflict Detected',
              body: `"${newEvent.title}" conflicts with "${conflict.title}". Tap to resolve.`,
              eventId: newEvent.id,
              read: false,
              conflictResolution: resolution,
            });
          } else {
            set((s) => ({ events: [...s.events, ...seriesEvents] }));
            persistActiveScopedState();
          }
          return newEvent;
        },

        updateEvent: (id, updates) => {
          set((s) => ({
            events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          }));
          persistActiveScopedState();
        },

        deleteEvent: (id) => {
          set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
          persistActiveScopedState();
        },

        completeEvent: (id) => {
          set((s) => ({
            events: s.events.map((e) =>
              e.id === id ? { ...e, isCompleted: true, completedAt: new Date().toISOString() } : e
            ),
          }));
          persistActiveScopedState();
        },

        moveEvent: (id, startUtc, endUtc) => {
          set((s) => ({
            events: s.events.map((e) => (e.id === id ? { ...e, startUtc, endUtc } : e)),
            pendingConflict: null,
          }));
          persistActiveScopedState();
        },

        toggleAIPanel: () => set((s) => ({ isAIPanelOpen: !s.isAIPanelOpen })),
        addAIMessage: (message) =>
          set((s) => ({ aiMessages: [...s.aiMessages, message] })),
        clearAIMessages: () => set({ aiMessages: [] }),
        setPendingConflict: (resolution) => set({ pendingConflict: resolution }),

        acceptRescheduleOption: (eventId, startUtc, endUtc) => {
          get().moveEvent(eventId, startUtc, endUtc);
          get().addNotification({
            type: 'suggestion',
            title: 'Event Rescheduled',
            body: 'Event moved to new time slot by AI.',
            eventId,
            read: false,
          });
        },

        markNotificationRead: (id) => {
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          }));
          persistActiveScopedState();
        },

        markAllNotificationsRead: () => {
          set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          }));
          persistActiveScopedState();
        },

        addNotification: (n) => {
          const id = `notif-${Date.now()}`;
          const normalizedAction = n.action ?? (n.eventId ? { eventId: n.eventId } : undefined);
          set((s) => ({
            notifications: [
              { ...n, action: normalizedAction, id, createdAt: new Date().toISOString() },
              ...s.notifications,
            ],
          }));
          persistActiveScopedState();
        },

        toggleSidebar: () =>
          set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

        toggleTheme: () =>
          set((s) => {
            const next = !s.isDarkMode;
            if (next) {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
            return { isDarkMode: next };
          }),
      };
    },
    {
      name: 'tempo-ui-storage-v2',
      partialize: (state) => ({
        viewMode: state.viewMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isDarkMode: state.isDarkMode,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        return {
          ...currentState,
          viewMode: persisted?.viewMode ?? currentState.viewMode,
          isSidebarCollapsed: persisted?.isSidebarCollapsed ?? currentState.isSidebarCollapsed,
          isDarkMode: persisted?.isDarkMode ?? currentState.isDarkMode,
        };
      },
    }
  )
);
