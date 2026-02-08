'use client';

import { useEmailStore } from '@/store/email-store';
import { CalendarAttendee } from '@/types';
import { format, parseISO } from 'date-fns';
import { cn, getInitials, sanitizeHtml } from '@/lib/utils';
import {
  X, MapPin, Clock, Users, Video, ExternalLink,
  Calendar, Check, HelpCircle, XCircle, Edit, Trash2,
} from 'lucide-react';

const STATUS_ICONS: Record<CalendarAttendee['status'], typeof Check> = {
  accepted: Check,
  declined: XCircle,
  tentative: HelpCircle,
  needsAction: HelpCircle,
};

const STATUS_COLORS: Record<CalendarAttendee['status'], string> = {
  accepted: 'text-emerald-400',
  declined: 'text-red-400',
  tentative: 'text-amber-400',
  needsAction: 'text-zinc-500',
};

export default function EventDetail() {
  const { selectedEvent, setSelectedEvent, accounts } = useEmailStore();

  if (!selectedEvent) return null;

  const account = accounts.find(a => a.id === selectedEvent.accountId);
  const startDate = parseISO(selectedEvent.start);
  const endDate = parseISO(selectedEvent.end);

  const handleClose = () => setSelectedEvent(null);

  const handleRsvp = async (response: 'accepted' | 'declined' | 'tentative') => {
    try {
      await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          response,
          calendarId: selectedEvent.calendarId,
        }),
      });
    } catch (error) {
      console.error('RSVP failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/calendar/events/${selectedEvent.id}?calendarId=${selectedEvent.calendarId}`, {
        method: 'DELETE',
      });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 min-w-0">
            {account && (
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: account.color }}
                />
                <span className="text-xs text-zinc-500">{account.email}</span>
              </div>
            )}
            <h2 className="text-xl font-bold text-white pr-8">{selectedEvent.title}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
              <Edit size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Clock size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
            <div>
              {selectedEvent.allDay ? (
                <p className="text-sm text-white">
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                  <span className="text-zinc-500 ml-2">All day</span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-white">
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </p>
                </>
              )}
              {selectedEvent.recurring && (
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Calendar size={11} /> Recurring event
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {selectedEvent.location && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-300">{selectedEvent.location}</p>
            </div>
          )}

          {/* Conference Link */}
          {selectedEvent.conferenceLink && (
            <div className="flex items-start gap-3">
              <Video size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <a
                href={selectedEvent.conferenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Join video call
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Description */}
          {selectedEvent.description && (
            <div className="border-t border-zinc-800 pt-4">
              <div
                className="text-sm text-zinc-300 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEvent.description) }}
              />
            </div>
          )}

          {/* Attendees */}
          {selectedEvent.attendees.length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-400" />
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {selectedEvent.attendees.length} attendee{selectedEvent.attendees.length !== 1 && 's'}
                </span>
              </div>
              <div className="space-y-2">
                {/* Organizer */}
                {selectedEvent.organizer && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30">
                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {getInitials(selectedEvent.organizer.name, selectedEvent.organizer.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {selectedEvent.organizer.name || selectedEvent.organizer.email}
                      </p>
                      <p className="text-xs text-zinc-500">Organizer</p>
                    </div>
                  </div>
                )}

                {selectedEvent.attendees.map((attendee, i) => {
                  const StatusIcon = STATUS_ICONS[attendee.status];
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                        {getInitials(attendee.name, attendee.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">
                          {attendee.name || attendee.email}
                        </p>
                        {attendee.name && (
                          <p className="text-xs text-zinc-500 truncate">{attendee.email}</p>
                        )}
                      </div>
                      <StatusIcon size={14} className={STATUS_COLORS[attendee.status]} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RSVP */}
          {selectedEvent.attendees.length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Your Response</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRsvp('accepted')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-600/20 text-sm font-medium transition-colors"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => handleRsvp('tentative')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 border border-amber-600/20 text-sm font-medium transition-colors"
                >
                  <HelpCircle size={14} /> Maybe
                </button>
                <button
                  onClick={() => handleRsvp('declined')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-600/20 text-sm font-medium transition-colors"
                >
                  <XCircle size={14} /> Decline
                </button>
              </div>
            </div>
          )}

          {/* Open in provider */}
          {selectedEvent.htmlLink && (
            <div className="pt-2">
              <a
                href={selectedEvent.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Open in {selectedEvent.provider === 'google' ? 'Google Calendar' : 'Outlook'}
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
