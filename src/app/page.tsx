'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useEmailStore } from '@/store/email-store';
import Sidebar from '@/components/layout/Sidebar';
import { useIsElectron } from '@/components/layout/ElectronTitleBar';
import EmailList from '@/components/email/EmailList';
import EmailDetail from '@/components/email/EmailDetail';
import ComposeModal from '@/components/compose/ComposeModal';
import SearchOverlay from '@/components/common/SearchOverlay';
import CommandPalette from '@/components/common/CommandPalette';
import AccountManager from '@/components/common/AccountManager';
import KeyboardShortcuts from '@/components/common/KeyboardShortcuts';
import CalendarView from '@/components/calendar/CalendarView';
import { cn } from '@/lib/utils';
import { Plus, Zap } from 'lucide-react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addDays,
} from 'date-fns';

function EmailApp() {
  const { data: session, status } = useSession();
  const {
    accounts, addAccount,
    threads, setThreads, setNextPageToken,
    currentMailbox, searchQuery,
    selectedThread, splitView,
    setLoading,
    currentView,
    calendarDate, calendarViewMode,
    setCalendarEvents, setCalendars, setCalendarLoading,
  } = useEmailStore();

  const isElectron = useIsElectron();
  const [isAccountManagerOpen, setAccountManagerOpen] = useState(false);

  // Sync session to accounts store
  useEffect(() => {
    if (session && (session as any).accessToken) {
      const s = session as any;
      const existingAccount = accounts.find(a =>
        a.id === s.providerAccountId ||
        a.email === s.user?.email
      );

      if (!existingAccount) {
        addAccount({
          id: s.providerAccountId || s.user?.email || 'default',
          email: s.user?.email || '',
          name: s.user?.name || '',
          provider: s.provider === 'azure-ad' ? 'microsoft' : 'google',
          accessToken: s.accessToken,
          refreshToken: s.refreshToken || '',
          image: s.user?.image || undefined,
        });
      }
    }
  }, [session]);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!session || !(session as any).accessToken) return;
    if (currentView !== 'mail') return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        mailbox: currentMailbox,
      });
      if (searchQuery) params.set('query', searchQuery);

      const response = await fetch(`/api/emails?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setThreads(data.threads || []);
      setNextPageToken(data.nextPageToken || null);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMailbox, searchQuery, session, currentView]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    if (!session || !(session as any).accessToken) return;
    if (currentView !== 'calendar') return;

    setCalendarLoading(true);
    try {
      const current = new Date(calendarDate);
      let timeMin: string;
      let timeMax: string;

      if (calendarViewMode === 'day') {
        timeMin = new Date(current.getFullYear(), current.getMonth(), current.getDate()).toISOString();
        timeMax = addDays(new Date(timeMin), 1).toISOString();
      } else if (calendarViewMode === 'week') {
        timeMin = startOfWeek(current).toISOString();
        timeMax = endOfWeek(current).toISOString();
      } else if (calendarViewMode === 'month') {
        timeMin = startOfMonth(current).toISOString();
        timeMax = endOfMonth(current).toISOString();
      } else {
        // agenda: show next 14 days
        timeMin = new Date().toISOString();
        timeMax = addDays(new Date(), 14).toISOString();
      }

      const [eventsRes, calendarsRes] = await Promise.all([
        fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`),
        fetch('/api/calendar/calendars'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setCalendarEvents(eventsData.events || []);
      }

      if (calendarsRes.ok) {
        const calendarsData = await calendarsRes.json();
        setCalendars(calendarsData.calendars || []);
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    } finally {
      setCalendarLoading(false);
    }
  }, [session, currentView, calendarDate, calendarViewMode]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  if (status === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950" style={isElectron ? { WebkitAppRegion: 'drag' } as React.CSSProperties : undefined}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If no accounts connected yet, show onboarding
  if (accounts.length === 0 && status !== 'authenticated') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Velocity</h1>
          <p className="text-zinc-400 mb-8">Connect your email accounts to get started with the fastest email experience</p>

          <button
            onClick={() => setAccountManagerOpen(true)}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            <Plus size={18} />
            Add Your First Account
          </button>

          <AccountManager isOpen={isAccountManagerOpen} onClose={() => setAccountManagerOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <KeyboardShortcuts />

      {/* Electron: draggable title bar region for macOS traffic lights */}
      {isElectron && (
        <div
          className="h-8 w-full flex-shrink-0 bg-zinc-950 border-b border-zinc-800/50"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        {currentView === 'mail' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Email List */}
            <div className={cn(
              'flex flex-col border-r border-zinc-800 overflow-hidden transition-all',
              splitView
                ? 'w-[400px] min-w-[350px]'
                : selectedThread ? 'hidden' : 'flex-1'
            )}>
              {/* List Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white capitalize">{currentMailbox}</h2>
                  {threads.length > 0 && (
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {threads.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAccountManagerOpen(true)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Manage accounts"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <EmailList />
            </div>

            {/* Email Detail */}
            <div className={cn(
              'flex-1 overflow-hidden',
              !splitView && !selectedThread && 'hidden'
            )}>
              <EmailDetail />
            </div>
          </div>
        ) : (
          <CalendarView />
        )}
      </div>

      {/* Overlays */}
      <ComposeModal />
      <SearchOverlay />
      <CommandPalette />
      <AccountManager isOpen={isAccountManagerOpen} onClose={() => setAccountManagerOpen(false)} />
    </div>
  );
}

export default function Home() {
  return <EmailApp />;
}
