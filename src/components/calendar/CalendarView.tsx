'use client';

import { useEmailStore } from '@/store/email-store';
import { cn } from '@/lib/utils';
import WeekView from './WeekView';
import DayView from './DayView';
import MonthView from './MonthView';
import AgendaView from './AgendaView';
import MiniCalendar from './MiniCalendar';
import EventDetail from './EventDetail';
import CreateEventModal from './CreateEventModal';
import SyncConfigPanel from './SyncConfigPanel';
import SyncStatusPanel from './SyncStatusPanel';
import { CalendarViewMode } from '@/types';

const VIEW_MODES: { mode: CalendarViewMode; label: string }[] = [
  { mode: 'day', label: 'Day' },
  { mode: 'week', label: 'Week' },
  { mode: 'month', label: 'Month' },
  { mode: 'agenda', label: 'Agenda' },
];

export default function CalendarView() {
  const {
    calendarViewMode, setCalendarViewMode,
    calendars, toggleCalendarVisibility,
    isSidebarCollapsed,
    syncRules, setSyncConfigOpen, setSyncStatusOpen,
  } = useEmailStore();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Calendar Sidebar */}
      {!isSidebarCollapsed && (
        <div className="w-56 border-r border-zinc-800 flex flex-col overflow-hidden">
          {/* View Mode Tabs */}
          <div className="p-3 border-b border-zinc-800">
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              {VIEW_MODES.map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setCalendarViewMode(mode)}
                  className={cn(
                    'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all',
                    calendarViewMode === mode
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Calendars List & Sync */}
          <div className="flex-1 overflow-y-auto border-t border-zinc-800 p-3">
            {calendars.length > 0 && (
              <>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  Calendars
                </p>
                <div className="space-y-1">
                  {calendars.map((cal) => (
                    <button
                      key={cal.id}
                      onClick={() => toggleCalendarVisibility(cal.id)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm border-2 flex-shrink-0 transition-colors',
                          cal.visible ? 'border-transparent' : 'border-zinc-600 bg-transparent'
                        )}
                        style={cal.visible ? { backgroundColor: cal.color, borderColor: cal.color } : undefined}
                      >
                        {cal.visible && (
                          <svg viewBox="0 0 12 12" className="w-full h-full text-white">
                            <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs truncate',
                        cal.visible ? 'text-zinc-300' : 'text-zinc-500'
                      )}>
                        {cal.name}
                      </span>
                      {cal.primary && (
                        <span className="text-[9px] text-zinc-600 ml-auto">Primary</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Sync Section — always visible */}
            <div className={cn(calendars.length > 0 && 'mt-4 pt-3 border-t border-zinc-800')}>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                Sync
              </p>
              <button
                onClick={() => setSyncConfigOpen(true)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 8a6 6 0 0 1 10.2-4.3M14 8a6 6 0 0 1-10.2 4.3" />
                  <path d="M12 2v2.5h-2.5M4 14v-2.5h2.5" />
                </svg>
                <span className="text-xs">Sync Rules</span>
                {syncRules.length > 0 && (
                  <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                    {syncRules.filter(r => r.status === 'active').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSyncStatusOpen(true)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 13V7M8 13V3M13 13V9" />
                </svg>
                <span className="text-xs">Sync Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {calendarViewMode === 'week' && <WeekView />}
        {calendarViewMode === 'day' && <DayView />}
        {calendarViewMode === 'month' && <MonthView />}
        {calendarViewMode === 'agenda' && <AgendaView />}
      </div>

      {/* Overlays */}
      <EventDetail />
      <CreateEventModal />
      <SyncConfigPanel />
      <SyncStatusPanel />
    </div>
  );
}
