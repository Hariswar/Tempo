import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent, ViewMode, Notification, AIMessage, User, ConflictResolution } from '../types';
import { MOCK_EVENTS, MOCK_NOTIFICATIONS, MOCK_USER } from '../data/mockData';
import { detectConflict, resolveConflict } from '../lib/scheduling';

interface AppState {
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

  // Actions
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
}

let eventCounter = MOCK_EVENTS.length + 1;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      events: MOCK_EVENTS,
      viewMode: 'week',
      selectedDate: new Date().toISOString(),
      selectedEvent: null,
      isEventModalOpen: false,
      editingEvent: null,
      isAIPanelOpen: false,
      aiMessages: [],
      pendingConflict: null,
      notifications: MOCK_NOTIFICATIONS,
      user: MOCK_USER,
      isSidebarCollapsed: false,

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
        }
        return newEvent;
      },

      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      completeEvent: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, isCompleted: true, completedAt: new Date().toISOString() } : e
          ),
        })),

      moveEvent: (id, startUtc, endUtc) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, startUtc, endUtc } : e)),
          pendingConflict: null,
        })),

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

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addNotification: (n) => {
        const id = `notif-${Date.now()}`;
        set((s) => ({
          notifications: [
            { ...n, id, createdAt: new Date().toISOString() },
            ...s.notifications,
          ],
        }));
      },

      toggleSidebar: () =>
        set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
    }),
    {
      name: 'tempo-storage',
      partialize: (state) => ({
        events: state.events,
        viewMode: state.viewMode,
        user: state.user,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
