import { create } from 'zustand';
import { EmailAccount, EmailThread, MailboxType, ComposeEmail, AppView, CalendarViewMode, CalendarEvent, CalendarInfo, CreateEventData, SyncRule, SyncedEvent, SyncLogEntry, SyncJob } from '@/types';

const ACCOUNT_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
];

interface EmailStore {
  // Accounts
  accounts: EmailAccount[];
  activeAccountId: string | null;
  addAccount: (account: Omit<EmailAccount, 'color'>) => void;
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string | null) => void;

  // Threads
  threads: EmailThread[];
  setThreads: (threads: EmailThread[]) => void;
  appendThreads: (threads: EmailThread[]) => void;
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
  selectedThread: EmailThread | null;
  setSelectedThread: (thread: EmailThread | null) => void;

  // Navigation
  currentMailbox: MailboxType;
  setCurrentMailbox: (mailbox: MailboxType) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: 'up' | 'down') => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Compose
  isComposeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  composeData: Partial<ComposeEmail> | null;
  setComposeData: (data: Partial<ComposeEmail> | null) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  splitView: boolean;
  toggleSplitView: () => void;
  nextPageToken: string | null;
  setNextPageToken: (token: string | null) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // App View (mail vs calendar)
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Calendar
  calendarViewMode: CalendarViewMode;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  calendarDate: string; // ISO date string for the current focused date
  setCalendarDate: (date: string) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;
  appendCalendarEvents: (events: CalendarEvent[]) => void;
  visibleCalendarEvents: () => CalendarEvent[];
  calendars: CalendarInfo[];
  setCalendars: (calendars: CalendarInfo[]) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  isCreateEventOpen: boolean;
  setCreateEventOpen: (open: boolean) => void;
  createEventData: Partial<CreateEventData> | null;
  setCreateEventData: (data: Partial<CreateEventData> | null) => void;
  calendarLoading: boolean;
  setCalendarLoading: (loading: boolean) => void;

  // Calendar Sync
  syncRules: SyncRule[];
  setSyncRules: (rules: SyncRule[]) => void;
  addSyncRule: (rule: SyncRule) => void;
  updateSyncRule: (id: string, updates: Partial<SyncRule>) => void;
  removeSyncRule: (id: string) => void;
  syncedEvents: SyncedEvent[];
  setSyncedEvents: (events: SyncedEvent[]) => void;
  syncLogs: SyncLogEntry[];
  setSyncLogs: (logs: SyncLogEntry[]) => void;
  appendSyncLogs: (logs: SyncLogEntry[]) => void;
  activeSyncJob: SyncJob | null;
  setActiveSyncJob: (job: SyncJob | null) => void;
  isSyncConfigOpen: boolean;
  setSyncConfigOpen: (open: boolean) => void;
  isSyncStatusOpen: boolean;
  setSyncStatusOpen: (open: boolean) => void;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Accounts
  accounts: [],
  activeAccountId: null,
  addAccount: (account) => set((state) => {
    const color = ACCOUNT_COLORS[state.accounts.length % ACCOUNT_COLORS.length];
    return { accounts: [...state.accounts, { ...account, color }] };
  }),
  removeAccount: (id) => set((state) => {
    const remaining = state.accounts.filter(a => a.id !== id);
    return {
      accounts: remaining,
      activeAccountId: state.activeAccountId === id ? (remaining[0]?.id || null) : state.activeAccountId,
    };
  }),
  setActiveAccount: (id) => set({ activeAccountId: id, threads: [], selectedThreadId: null, selectedThread: null, selectedIndex: 0 }),

  // Threads
  threads: [],
  setThreads: (threads) => set({ threads }),
  appendThreads: (newThreads) => set((state) => ({
    threads: [...state.threads, ...newThreads],
  })),
  selectedThreadId: null,
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
  selectedThread: null,
  setSelectedThread: (thread) => set({ selectedThread: thread }),

  // Navigation
  currentMailbox: 'inbox',
  setCurrentMailbox: (mailbox) => set({ currentMailbox: mailbox, threads: [], selectedThreadId: null, selectedThread: null, selectedIndex: 0 }),
  selectedIndex: 0,
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  moveSelection: (direction) => {
    const state = get();
    const maxIndex = state.threads.length - 1;
    if (maxIndex < 0) return;
    const newIndex = direction === 'up'
      ? Math.max(0, state.selectedIndex - 1)
      : Math.min(maxIndex, state.selectedIndex + 1);
    set({ selectedIndex: newIndex });
  },

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  // Compose
  isComposeOpen: false,
  setComposeOpen: (open) => set({ isComposeOpen: open }),
  composeData: null,
  setComposeData: (data) => set({ composeData: data }),

  // UI State
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  splitView: true,
  toggleSplitView: () => set((state) => ({ splitView: !state.splitView })),
  nextPageToken: null,
  setNextPageToken: (token) => set({ nextPageToken: token }),

  // Command Palette
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  // App View
  currentView: 'mail',
  setCurrentView: (view) => set({ currentView: view }),

  // Calendar
  calendarViewMode: 'week',
  setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
  calendarDate: new Date().toISOString(),
  setCalendarDate: (date) => set({ calendarDate: date }),
  calendarEvents: [],
  setCalendarEvents: (events) => set({ calendarEvents: events }),
  appendCalendarEvents: (events) => set((state) => ({
    calendarEvents: [...state.calendarEvents, ...events],
  })),
  visibleCalendarEvents: () => {
    const state = get();
    const hiddenCalIds = new Set(state.calendars.filter(c => !c.visible).map(c => c.id));
    if (hiddenCalIds.size === 0) return state.calendarEvents;
    return state.calendarEvents.filter(e => !hiddenCalIds.has(e.calendarId));
  },
  calendars: [],
  setCalendars: (calendars) => set({ calendars }),
  toggleCalendarVisibility: (calendarId) => set((state) => ({
    calendars: state.calendars.map(c =>
      c.id === calendarId ? { ...c, visible: !c.visible } : c
    ),
  })),
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  isCreateEventOpen: false,
  setCreateEventOpen: (open) => set({ isCreateEventOpen: open }),
  createEventData: null,
  setCreateEventData: (data) => set({ createEventData: data }),
  calendarLoading: false,
  setCalendarLoading: (loading) => set({ calendarLoading: loading }),

  // Calendar Sync
  syncRules: [],
  setSyncRules: (rules) => set({ syncRules: rules }),
  addSyncRule: (rule) => set((state) => ({ syncRules: [...state.syncRules, rule] })),
  updateSyncRule: (id, updates) => set((state) => ({
    syncRules: state.syncRules.map(r => r.id === id ? { ...r, ...updates } : r),
  })),
  removeSyncRule: (id) => set((state) => ({
    syncRules: state.syncRules.filter(r => r.id !== id),
  })),
  syncedEvents: [],
  setSyncedEvents: (events) => set({ syncedEvents: events }),
  syncLogs: [],
  setSyncLogs: (logs) => set({ syncLogs: logs }),
  appendSyncLogs: (logs) => set((state) => ({
    syncLogs: [...logs, ...state.syncLogs].slice(0, 200), // Keep last 200 entries
  })),
  activeSyncJob: null,
  setActiveSyncJob: (job) => set({ activeSyncJob: job }),
  isSyncConfigOpen: false,
  setSyncConfigOpen: (open) => set({ isSyncConfigOpen: open }),
  isSyncStatusOpen: false,
  setSyncStatusOpen: (open) => set({ isSyncStatusOpen: open }),
}));
