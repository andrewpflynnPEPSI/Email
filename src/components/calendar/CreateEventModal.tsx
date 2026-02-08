'use client';

import { useState, useEffect } from 'react';
import { useEmailStore } from '@/store/email-store';
import { format, addHours } from 'date-fns';
import { X, MapPin, Clock, Users, AlignLeft, Calendar } from 'lucide-react';

export default function CreateEventModal() {
  const {
    isCreateEventOpen, setCreateEventOpen,
    createEventData, setCreateEventData,
    accounts, activeAccountId,
  } = useEmailStore();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId || accounts[0]?.id || '');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isCreateEventOpen) {
      const now = createEventData?.start ? new Date(createEventData.start) : new Date();
      const end = createEventData?.end ? new Date(createEventData.end) : addHours(now, 1);

      setStartDate(format(now, 'yyyy-MM-dd'));
      setStartTime(format(now, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setAllDay(createEventData?.allDay || false);
      setTitle(createEventData?.title || '');
      setDescription(createEventData?.description || '');
      setLocation(createEventData?.location || '');
      setSelectedAccountId(createEventData?.accountId || activeAccountId || accounts[0]?.id || '');
    }
  }, [isCreateEventOpen, createEventData, activeAccountId, accounts]);

  if (!isCreateEventOpen) return null;

  const handleClose = () => {
    setCreateEventOpen(false);
    setCreateEventData(null);
    setTitle('');
    setLocation('');
    setDescription('');
    setAttendees('');
    setIsSending(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsSending(true);

    try {
      const start = allDay ? startDate : `${startDate}T${startTime}:00`;
      const end = allDay ? endDate : `${endDate}T${endTime}:00`;
      const attendeeList = attendees
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          start,
          end,
          description: description || undefined,
          location: location || undefined,
          attendees: attendeeList.length > 0 ? attendeeList : undefined,
          allDay,
        }),
      });

      handleClose();
    } catch (error) {
      console.error('Create event failed:', error);
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">New Event</h2>
          <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full text-xl font-medium text-white bg-transparent outline-none placeholder:text-zinc-600"
            autoFocus
          />

          {/* Account Selector */}
          {accounts.length > 1 && (
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-zinc-400 flex-shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="flex-1 bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id} className="bg-zinc-900">
                    {account.name} ({account.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  All day
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-7">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                />
              )}
              <span className="text-zinc-500 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1 bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-3">
            <Users size={16} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Add guests (comma-separated emails)"
              className="flex-1 bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <AlignLeft size={16} className="text-zinc-400 flex-shrink-0 mt-2.5" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
              className="flex-1 bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 placeholder:text-zinc-600 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isSending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
