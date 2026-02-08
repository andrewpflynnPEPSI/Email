'use client';

import { useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import { CalendarEvent } from '@/types';
import {
  format, isSameDay, isToday, differenceInMinutes, parseISO,
  addDays, subDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64;

function getEventPosition(event: CalendarEvent, dayStart: Date) {
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const startMinutes = differenceInMinutes(start, dayStart);
  const duration = differenceInMinutes(end, start);
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((duration / 60) * HOUR_HEIGHT, 24),
  };
}

export default function DayView() {
  const {
    calendarDate, setCalendarDate, calendarEvents,
    setSelectedEvent, accounts, setCreateEventOpen, setCreateEventData,
  } = useEmailStore();

  const currentDate = new Date(calendarDate);
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEvents = useMemo(() => {
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    calendarEvents.forEach(event => {
      if (isSameDay(parseISO(event.start), currentDate)) {
        if (event.allDay) allDay.push(event);
        else timed.push(event);
      }
    });
    return { allDay, timed };
  }, [calendarEvents, currentDate]);

  const goToPrev = () => setCalendarDate(subDays(currentDate, 1).toISOString());
  const goToNext = () => setCalendarDate(addDays(currentDate, 1).toISOString());
  const goToToday = () => setCalendarDate(new Date().toISOString());

  const getAccountColor = (accountId: string) =>
    accounts.find(a => a.id === accountId)?.color || '#6366f1';

  const now = new Date();
  const currentTimeTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  const handleTimeSlotClick = (hour: number) => {
    const start = new Date(currentDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(hour + 1, 0, 0, 0);
    setCreateEventData({ start: start.toISOString(), end: end.toISOString(), allDay: false });
    setCreateEventOpen(true);
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
          <h2 className="text-sm font-semibold text-white">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          {isToday(currentDate) && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600/20 text-indigo-400 rounded-full">Today</span>
          )}
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

      {/* All-day events */}
      {dayEvents.allDay.length > 0 && (
        <div className="border-b border-zinc-800 px-16 py-2 space-y-1">
          {dayEvents.allDay.map(event => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="block w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium truncate bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
            >
              {event.title}
            </button>
          ))}
        </div>
      )}

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0 relative">
            {HOURS.map(hour => (
              <div key={hour} className="absolute w-full pr-2 text-right" style={{ top: `${hour * HOUR_HEIGHT}px` }}>
                <span className="text-[10px] text-zinc-500 leading-none -translate-y-1/2 inline-block">
                  {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day Column */}
          <div className="flex-1 relative border-l border-zinc-800">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full border-t border-zinc-800/50 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                onClick={() => handleTimeSlotClick(hour)}
              />
            ))}

            {isToday(currentDate) && (
              <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5" />
                  <div className="flex-1 h-[2px] bg-red-500" />
                </div>
              </div>
            )}

            {dayEvents.timed.map(event => {
              const pos = getEventPosition(event, dayStart);
              const color = getAccountColor(event.accountId);
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  style={{
                    top: `${pos.top}px`,
                    height: `${pos.height}px`,
                    backgroundColor: `${color}20`,
                    borderLeftColor: color,
                  }}
                  className="absolute left-2 right-2 rounded-lg border-l-4 px-3 py-1.5 overflow-hidden cursor-pointer hover:brightness-125 transition-all z-10 text-left"
                >
                  <p className="text-sm font-medium text-white truncate">{event.title}</p>
                  {pos.height > 36 && (
                    <p className="text-xs text-zinc-400">{format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}</p>
                  )}
                  {pos.height > 56 && event.location && (
                    <p className="text-xs text-zinc-500 truncate">{event.location}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
