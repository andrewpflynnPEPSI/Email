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

          {/* Calendars List */}
          {calendars.length > 0 && (
            <div className="flex-1 overflow-y-auto border-t border-zinc-800 p-3">
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
            </div>
          )}
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
    </div>
  );
}
