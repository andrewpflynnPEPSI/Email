'use client';

import { useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MiniCalendar() {
  const { calendarDate, setCalendarDate, calendarEvents } = useEmailStore();
  const currentDate = new Date(calendarDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    calendarEvents.forEach(event => {
      dates.add(format(new Date(event.start), 'yyyy-MM-dd'));
    });
    return dates;
  }, [calendarEvents]);

  const goToPrev = () => setCalendarDate(subMonths(currentDate, 1).toISOString());
  const goToNext = () => setCalendarDate(addMonths(currentDate, 1).toISOString());
  const goToToday = () => setCalendarDate(new Date().toISOString());

  return (
    <div className="p-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={goToToday}
          className="text-sm font-medium text-white hover:text-indigo-400 transition-colors"
        >
          {format(currentDate, 'MMMM yyyy')}
        </button>
        <button
          onClick={goToNext}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-zinc-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasEvents = eventDates.has(dateStr);
          const selected = isSameDay(day, currentDate);
          const today = isToday(day);
          const inMonth = isSameMonth(day, currentDate);

          return (
            <button
              key={dateStr}
              onClick={() => setCalendarDate(day.toISOString())}
              className={cn(
                'relative flex flex-col items-center justify-center h-7 text-[11px] rounded-md transition-all',
                selected
                  ? 'bg-indigo-600 text-white font-bold'
                  : today
                    ? 'bg-zinc-800 text-indigo-400 font-bold'
                    : inMonth
                      ? 'text-zinc-300 hover:bg-zinc-800'
                      : 'text-zinc-600 hover:bg-zinc-800/50'
              )}
            >
              {format(day, 'd')}
              {hasEvents && !selected && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
