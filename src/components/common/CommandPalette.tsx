'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import {
  Inbox, Star, Send, FileEdit, Trash2, Mail, Search,
  Plus, Archive, MailOpen, Tag, ChevronRight, Command, Calendar,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: typeof Inbox;
  category: string;
  action: () => void;
}

export default function CommandPalette() {
  const {
    isCommandPaletteOpen, setCommandPaletteOpen,
    setCurrentMailbox, setComposeOpen, setSearchOpen,
    setCurrentView, setCalendarViewMode, setCreateEventOpen,
  } = useEmailStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(() => [
    { id: 'compose', label: 'Compose new email', shortcut: 'C', icon: Plus, category: 'Actions', action: () => { setCommandPaletteOpen(false); setComposeOpen(true); } },
    { id: 'search', label: 'Search emails', shortcut: '/', icon: Search, category: 'Actions', action: () => { setCommandPaletteOpen(false); setSearchOpen(true); } },
    { id: 'inbox', label: 'Go to Inbox', shortcut: 'G I', icon: Inbox, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('inbox'); } },
    { id: 'starred', label: 'Go to Starred', shortcut: 'G S', icon: Star, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('starred'); } },
    { id: 'sent', label: 'Go to Sent', shortcut: 'G T', icon: Send, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('sent'); } },
    { id: 'drafts', label: 'Go to Drafts', shortcut: 'G D', icon: FileEdit, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('drafts'); } },
    { id: 'trash', label: 'Go to Trash', icon: Trash2, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('trash'); } },
    { id: 'all', label: 'Go to All Mail', shortcut: 'G A', icon: Mail, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentMailbox('all'); } },
    { id: 'archive', label: 'Archive selected', shortcut: 'E', icon: Archive, category: 'Email Actions', action: () => { setCommandPaletteOpen(false); } },
    { id: 'mark-read', label: 'Mark as read', shortcut: 'Shift+I', icon: MailOpen, category: 'Email Actions', action: () => { setCommandPaletteOpen(false); } },
    { id: 'mark-unread', label: 'Mark as unread', shortcut: 'Shift+U', icon: Mail, category: 'Email Actions', action: () => { setCommandPaletteOpen(false); } },
    { id: 'label', label: 'Apply label', shortcut: 'L', icon: Tag, category: 'Email Actions', action: () => { setCommandPaletteOpen(false); } },
    { id: 'calendar', label: 'Go to Calendar', shortcut: 'G C', icon: Calendar, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); } },
    { id: 'cal-day', label: 'Calendar: Day view', icon: Calendar, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); setCalendarViewMode('day'); } },
    { id: 'cal-week', label: 'Calendar: Week view', icon: Calendar, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); setCalendarViewMode('week'); } },
    { id: 'cal-month', label: 'Calendar: Month view', icon: Calendar, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); setCalendarViewMode('month'); } },
    { id: 'cal-agenda', label: 'Calendar: Agenda view', icon: Calendar, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); setCalendarViewMode('agenda'); } },
    { id: 'new-event', label: 'Create new event', icon: Plus, category: 'Calendar', action: () => { setCommandPaletteOpen(false); setCurrentView('calendar'); setCreateEventOpen(true); } },
    { id: 'go-mail', label: 'Go to Mail', shortcut: 'G M', icon: Mail, category: 'Navigation', action: () => { setCommandPaletteOpen(false); setCurrentView('mail'); } },
  ], [setCommandPaletteOpen, setComposeOpen, setCurrentMailbox, setSearchOpen, setCurrentView, setCalendarViewMode, setCreateEventOpen]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(lower) || c.category.toLowerCase().includes(lower));
  }, [query, commands]);

  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Command size={16} className="text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="px-4 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {category}
              </p>
              {items.map((item) => {
                globalIndex++;
                const idx = globalIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                      selectedIndex === idx
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    <item.icon size={16} className="text-zinc-400 flex-shrink-0" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-zinc-600 font-mono">{item.shortcut}</span>
                    )}
                    <ChevronRight size={12} className="text-zinc-600" />
                  </button>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No commands found</p>
          )}
        </div>

        <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">&uarr;&darr;</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">Enter</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
