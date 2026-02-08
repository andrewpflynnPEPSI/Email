'use client';

import { useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import { CalendarEvent } from '@/types';
import {
  format, parseISO, isToday, isTomorrow, addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPin, Users, Video, Clock, Plus, Calendar } from 'lucide-react';

function EventCard({ event, accountColor, onClick }: {
  event: CalendarEvent;
  accountColor: string;
  onClick: () => void;
}) {
  const startTime = event.allDay ? 'All day' : format(parseISO(event.start), 'h:mm a');
  const endTime = event.allDay ? '' : format(parseISO(event.end), 'h:mm a');

  return (
    <button
      onClick={onClick}
      className="w-full flex gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all text-left group"
    >
      {/* Color Bar */}
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: accountColor }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
          {event.title}
        </p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={11} />
            {startTime}{endTime && ` - ${endTime}`}
          </span>

          {event.location && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 truncate">
              <MapPin size={11} />
              {event.location}
            </span>
          )}

          {event.conferenceLink && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <Video size={11} />
              Join
            </span>
          )}

          {event.attendees.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Users size={11} />
              {event.attendees.length}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      {event.status === 'tentative' && (
        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full self-start">
          Tentative
        </span>
      )}
    </button>
  );
}

export default function AgendaView() {
  const {
    visibleCalendarEvents, setSelectedEvent, accounts,
    setCreateEventOpen, calendarLoading,
  } = useEmailStore();

  const calendarEvents = visibleCalendarEvents();

  const getAccountColor = (accountId: string) =>
    accounts.find(a => a.id === accountId)?.color || '#6366f1';

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, { label: string; events: CalendarEvent[] }>();

    const sorted = [...calendarEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    sorted.forEach(event => {
      const date = parseISO(event.start);
      const key = format(date, 'yyyy-MM-dd');

      if (!groups.has(key)) {
        let label = format(date, 'EEEE, MMMM d');
        if (isToday(date)) label = 'Today';
        else if (isTomorrow(date)) label = 'Tomorrow';
        groups.set(key, { label, events: [] });
      }

      groups.get(key)!.events.push(event);
    });

    return Array.from(groups.entries());
  }, [calendarEvents]);

  if (calendarLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-white">Upcoming Events</h2>
        <button
          onClick={() => setCreateEventOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
        >
          <Plus size={14} /> Event
        </button>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Calendar size={40} className="text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-zinc-400">No upcoming events</p>
            <p className="text-xs mt-1">Your schedule is clear</p>
          </div>
        ) : (
          groupedEvents.map(([key, { label, events }]) => (
            <div key={key}>
              <h3 className={cn(
                'text-xs font-semibold uppercase tracking-wider mb-2 px-1',
                label === 'Today' ? 'text-indigo-400' : 'text-zinc-500'
              )}>
                {label}
              </h3>
              <div className="space-y-2">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    accountColor={getAccountColor(event.accountId)}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
