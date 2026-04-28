import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent, ViewMode, Notification, AIMessage, User, ConflictResolution } from '../types';
import { MOCK_EVENTS, MOCK_NOTIFICATIONS, MOCK_USER } from '../data/mockData';
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

const USER_DATA_KEY_PREFIX = 'tempo-user-data::';

function normalizeEmail(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null;
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
  };
}

function defaultScopedState(authUser: AuthUser | null): UserScopedState {
  return {
    events: [...MOCK_EVENTS],
    notifications: [...MOCK_NOTIFICATIONS],
    user: buildStoreUser(authUser),
  };
}

function readScopedState(authUser: AuthUser | null): UserScopedState {
  if (!authUser) return defaultScopedState(null);

  const key = userDataStorageKey(authUser.email);
  const raw = localStorage.getItem(key);
  if (!raw) return defaultScopedState(authUser);

  try {
    const parsed = JSON.parse(raw) as Partial<UserScopedState>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [...MOCK_EVENTS],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [...MOCK_NOTIFICATIONS],
      user: parsed.user
        ? { ...buildStoreUser(authUser), ...parsed.user }
        : buildStoreUser(authUser),
    };
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
        selectedDate: new Date().toISOString(),
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
            selectedDate: new Date().toISOString(),
          });
          persistScopedState(email, scoped);
        },

        setViewMode: (mode) => set({ viewMode: mode }),
        setSelectedDate: (date) => set({ selectedDate: date }),
        selectEvent: (event) => set({ selectedEvent: event }),

        openEventModal: (event) =>
          set({ isEventModalOpen: true, editingEvent: event ?? null }),
        closeEventModal: () =>
          set({ isEventModalOpen: false, editingEvent: null }),

        createEvent: (eventData) => {
          const id = `e${eventCounter++}`;
          const newEvent: CalendarEvent = { ...eventData, id };
          const { events, user } = get();
          const now = new Date();

          // Auto-detect conflicts
          const conflict = detectConflict(newEvent, events);
          if (conflict) {
            const resolution = resolveConflict(newEvent, conflict, events, user, now);
            set((s) => ({
              events: [...s.events, newEvent],
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
            set((s) => ({ events: [...s.events, newEvent] }));
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
      name: 'tempo-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
