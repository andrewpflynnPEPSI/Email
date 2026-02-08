'use client';

import { useState, useRef, useEffect } from 'react';
import { useEmailStore } from '@/store/email-store';
import { Search, X, Filter, Calendar, Paperclip, Mail } from 'lucide-react';

export default function SearchOverlay() {
  const { isSearchOpen, setSearchOpen, setSearchQuery } = useEmailStore();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const handleSearch = () => {
    setSearchQuery(query);
    setSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
      />

      {/* Search Box */}
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Main Input */}
        <div className="flex items-center gap-3 px-4 py-4">
          <Search size={20} className="text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-zinc-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <Filter size={12} />
            Filters
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
            <Paperclip size={12} />
            Has attachment
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
            <Mail size={12} />
            Unread
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
            <Calendar size={12} />
            Date range
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">From</label>
              <input
                type="text"
                placeholder="sender@email.com"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-white border border-zinc-700 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">To</label>
              <input
                type="text"
                placeholder="recipient@email.com"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-white border border-zinc-700 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="Subject contains..."
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-white border border-zinc-700 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Label</label>
              <input
                type="text"
                placeholder="Label name"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-sm text-white border border-zinc-700 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">Enter</kbd> to search
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
