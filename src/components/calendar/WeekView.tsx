'use client';

import { useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import { CalendarEvent } from '@/types';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay,
  isToday, differenceInMinutes, parseISO, addDays, subDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

function getEventPosition(event: CalendarEvent, dayStart: Date) {
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const startMinutes = differenceInMinutes(start, dayStart);
  const duration = differenceInMinutes(end, start);

  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((duration / 60) * HOUR_HEIGHT, 20),
  };
}

function getEventColor(event: CalendarEvent, accountColor?: string): string {
  if (event.color) return event.color;
  return accountColor || '#6366f1';
}

function AllDayEvents({ events, onSelect }: { events: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  if (events.length === 0) return null;

  return (
    <div className="border-b border-zinc-800 px-1 py-1 space-y-0.5">
      {events.map(event => (
        <button
          key={event.id}
          onClick={() => onSelect(event)}
          className="block w-full text-left px-2 py-0.5 rounded text-xs font-medium truncate bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          {event.title}
        </button>
      ))}
    </div>
  );
}

function TimeEvent({ event, dayStart, accountColor, onClick }: {
  event: CalendarEvent;
  dayStart: Date;
  accountColor?: string;
  onClick: () => void;
}) {
  const pos = getEventPosition(event, dayStart);
  const color = getEventColor(event, accountColor);
  const startTime = format(parseISO(event.start), 'h:mm a');

  return (
    <button
      onClick={onClick}
      style={{
        top: `${pos.top}px`,
        height: `${pos.height}px`,
        backgroundColor: `${color}20`,
        borderLeftColor: color,
      }}
      className="absolute left-1 right-1 rounded-md border-l-3 px-2 py-0.5 overflow-hidden cursor-pointer hover:brightness-125 transition-all z-10 text-left"
    >
      <p className="text-xs font-medium text-white truncate leading-tight">{event.title}</p>
      {pos.height > 30 && (
        <p className="text-[10px] text-zinc-400 truncate">{startTime}</p>
      )}
      {pos.height > 50 && event.location && (
        <p className="text-[10px] text-zinc-500 truncate">{event.location}</p>
      )}
    </button>
  );
}

export default function WeekView() {
  const {
    calendarDate, setCalendarDate, calendarEvents,
    setSelectedEvent, accounts, setCreateEventOpen, setCreateEventData,
  } = useEmailStore();

  const currentDate = new Date(calendarDate);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, { allDay: CalendarEvent[]; timed: CalendarEvent[] }>();
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, { allDay: [], timed: [] });
    });

    calendarEvents.forEach(event => {
      const eventDate = format(parseISO(event.start), 'yyyy-MM-dd');
      const bucket = map.get(eventDate);
      if (bucket) {
        if (event.allDay) {
          bucket.allDay.push(event);
        } else {
          bucket.timed.push(event);
        }
      }
    });

    return map;
  }, [weekDays, calendarEvents]);

  const goToPrevWeek = () => setCalendarDate(subDays(currentDate, 7).toISOString());
  const goToNextWeek = () => setCalendarDate(addDays(currentDate, 7).toISOString());
  const goToToday = () => setCalendarDate(new Date().toISOString());

  const getAccountColor = (accountId: string) =>
    accounts.find(a => a.id === accountId)?.color;

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(hour + 1, 0, 0, 0);
    setCreateEventData({
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
    });
    setCreateEventOpen(true);
  };

  // Current time indicator
  const now = new Date();
  const currentTimeTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={goToPrevWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToNextWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
          <h2 className="text-sm font-semibold text-white">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCreateEventOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Event
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="flex border-b border-zinc-800">
        <div className="w-16 flex-shrink-0" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            onClick={() => setCalendarDate(day.toISOString())}
            className={cn(
              'flex-1 py-2 text-center border-l border-zinc-800 cursor-pointer transition-colors',
              isSameDay(day, currentDate) && 'bg-zinc-900/50',
            )}
          >
            <p className={cn(
              'text-xs font-medium',
              isToday(day) ? 'text-indigo-400' : 'text-zinc-500'
            )}>
              {format(day, 'EEE')}
            </p>
            <p className={cn(
              'text-lg font-bold',
              isToday(day)
                ? 'text-indigo-400'
                : isSameDay(day, currentDate)
                  ? 'text-white'
                  : 'text-zinc-300'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="flex border-b border-zinc-800">
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-zinc-500">ALL DAY</span>
        </div>
        {weekDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(key);
          return (
            <div key={key} className="flex-1 border-l border-zinc-800 min-h-[28px]">
              <AllDayEvents
                events={dayEvents?.allDay || []}
                onSelect={setSelectedEvent}
              />
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0 relative">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full pr-2 text-right"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] text-zinc-500 leading-none -translate-y-1/2 inline-block">
                  {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(key);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);

            return (
              <div
                key={key}
                className={cn(
                  'flex-1 relative border-l border-zinc-800',
                  isSameDay(day, currentDate) && 'bg-zinc-900/20'
                )}
              >
                {/* Hour Lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-zinc-800/50 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                    style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                    onClick={() => handleTimeSlotClick(day, hour)}
                  />
                ))}

                {/* Current Time Line */}
                {isToday(day) && (
                  <div
                    className="absolute w-full z-20 pointer-events-none"
                    style={{ top: `${currentTimeTop}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayEvents?.timed.map(event => (
                  <TimeEvent
                    key={event.id}
                    event={event}
                    dayStart={dayStart}
                    accountColor={getAccountColor(event.accountId)}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
