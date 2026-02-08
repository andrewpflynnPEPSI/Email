'use client';

import { useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import { CalendarEvent } from '@/types';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const MAX_VISIBLE_EVENTS = 3;

export default function MonthView() {
  const {
    calendarDate, setCalendarDate, setCalendarViewMode,
    calendarEvents, setSelectedEvent, accounts, setCreateEventOpen,
  } = useEmailStore();

  const currentDate = new Date(calendarDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    calendarEvents.forEach(event => {
      const key = format(parseISO(event.start), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [calendarEvents]);

  const goToPrev = () => setCalendarDate(subMonths(currentDate, 1).toISOString());
  const goToNext = () => setCalendarDate(addMonths(currentDate, 1).toISOString());
  const goToToday = () => setCalendarDate(new Date().toISOString());

  const getAccountColor = (accountId: string) =>
    accounts.find(a => a.id === accountId)?.color || '#6366f1';

  const handleDayClick = (day: Date) => {
    setCalendarDate(day.toISOString());
    setCalendarViewMode('day');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={goToPrev} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToNext} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
          <h2 className="text-base font-semibold text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            Today
          </button>
          <button
            onClick={() => setCreateEventOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Plus size={14} /> Event
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium text-zinc-500 border-r border-zinc-800 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvts = eventsByDay.get(key) || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const visibleEvents = dayEvts.slice(0, MAX_VISIBLE_EVENTS);
          const moreCount = dayEvts.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={key}
              className={cn(
                'border-r border-b border-zinc-800 last:border-r-0 p-1 min-h-[100px] cursor-pointer transition-colors',
                !inMonth && 'bg-zinc-950/50',
                today && 'bg-zinc-900/30',
              )}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex items-center justify-center mb-1">
                <span className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                  today
                    ? 'bg-indigo-600 text-white'
                    : inMonth
                      ? 'text-zinc-300'
                      : 'text-zinc-600'
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5">
                {visibleEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                    className="block w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-colors hover:brightness-125"
                    style={{
                      backgroundColor: `${getAccountColor(event.accountId)}20`,
                      color: getAccountColor(event.accountId),
                    }}
                  >
                    {!event.allDay && (
                      <span className="text-zinc-500 mr-1">{format(parseISO(event.start), 'h:mm')}</span>
                    )}
                    {event.title}
                  </button>
                ))}
                {moreCount > 0 && (
                  <p className="text-[10px] text-zinc-500 px-1.5">+{moreCount} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
