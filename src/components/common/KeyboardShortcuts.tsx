'use client';

import { useEffect, useRef } from 'react';
import { useEmailStore } from '@/store/email-store';

export default function KeyboardShortcuts() {
  const {
    setComposeOpen, setSearchOpen, setCommandPaletteOpen,
    setCurrentMailbox, moveSelection,
    isComposeOpen, isSearchOpen, isCommandPaletteOpen,
  } = useEmailStore();

  const gPrefixRef = useRef(false);
  const gTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Always handle Escape
      if (e.key === 'Escape') {
        if (isComposeOpen) useEmailStore.getState().setComposeOpen(false);
        if (isSearchOpen) useEmailStore.getState().setSearchOpen(false);
        if (isCommandPaletteOpen) useEmailStore.getState().setCommandPaletteOpen(false);
        return;
      }

      // Don't handle shortcuts when typing
      if (isInput || isComposeOpen || isSearchOpen || isCommandPaletteOpen) return;

      // Cmd/Ctrl + K = Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      const isMailView = useEmailStore.getState().currentView === 'mail';

      // G prefix for navigation (mail view only)
      if (gPrefixRef.current && isMailView) {
        gPrefixRef.current = false;
        clearTimeout(gTimeoutRef.current);
        switch (e.key.toLowerCase()) {
          case 'i': e.preventDefault(); setCurrentMailbox('inbox'); return;
          case 's': e.preventDefault(); setCurrentMailbox('starred'); return;
          case 't': e.preventDefault(); setCurrentMailbox('sent'); return;
          case 'd': e.preventDefault(); setCurrentMailbox('drafts'); return;
          case 'a': e.preventDefault(); setCurrentMailbox('all'); return;
        }
        return;
      }
      gPrefixRef.current = false;

      if (isMailView && e.key === 'g') {
        gPrefixRef.current = true;
        gTimeoutRef.current = setTimeout(() => { gPrefixRef.current = false; }, 1000);
        return;
      }

      switch (e.key) {
        case 'c':
          if (!isMailView) break;
          e.preventDefault();
          setComposeOpen(true);
          break;
        case '/':
          if (!isMailView) break;
          e.preventDefault();
          setSearchOpen(true);
          break;
        case 'j':
        case 'ArrowDown':
          if (!isMailView) break;
          e.preventDefault();
          moveSelection('down');
          break;
        case 'k':
        case 'ArrowUp':
          if (!isMailView) break;
          e.preventDefault();
          moveSelection('up');
          break;
        case 'Enter':
        case 'o': {
          if (!isMailView) break;
          e.preventDefault();
          const state = useEmailStore.getState();
          const thread = state.threads[state.selectedIndex];
          if (thread) {
            state.setSelectedThreadId(thread.id);
            state.setSelectedThread(thread);
          }
          break;
        }
        case 'u': {
          if (!isMailView) break;
          e.preventDefault();
          const state = useEmailStore.getState();
          state.setSelectedThread(null);
          state.setSelectedThreadId(null);
          break;
        }
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isComposeOpen, isSearchOpen, isCommandPaletteOpen]);

  return null;
}
