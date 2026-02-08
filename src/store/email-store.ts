import { create } from 'zustand';
import { EmailAccount, EmailThread, MailboxType, ComposeEmail } from '@/types';

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
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Accounts
  accounts: [],
  activeAccountId: null,
  addAccount: (account) => set((state) => {
    const color = ACCOUNT_COLORS[state.accounts.length % ACCOUNT_COLORS.length];
    return { accounts: [...state.accounts, { ...account, color }] };
  }),
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter(a => a.id !== id),
    activeAccountId: state.activeAccountId === id ? (state.accounts[0]?.id || null) : state.activeAccountId,
  })),
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
}));
