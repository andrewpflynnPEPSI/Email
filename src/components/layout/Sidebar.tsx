'use client';

import { useEmailStore } from '@/store/email-store';
import { MailboxType } from '@/types';
import { cn } from '@/lib/utils';
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  Trash2,
  AlertOctagon,
  Mail,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Command,
  Calendar,
} from 'lucide-react';

const MAILBOXES: { type: MailboxType; label: string; icon: typeof Inbox; shortcut: string }[] = [
  { type: 'inbox', label: 'Inbox', icon: Inbox, shortcut: 'G I' },
  { type: 'starred', label: 'Starred', icon: Star, shortcut: 'G S' },
  { type: 'sent', label: 'Sent', icon: Send, shortcut: 'G T' },
  { type: 'drafts', label: 'Drafts', icon: FileEdit, shortcut: 'G D' },
  { type: 'trash', label: 'Trash', icon: Trash2, shortcut: '' },
  { type: 'spam', label: 'Spam', icon: AlertOctagon, shortcut: '' },
  { type: 'all', label: 'All Mail', icon: Mail, shortcut: 'G A' },
];

export default function Sidebar() {
  const {
    currentMailbox, setCurrentMailbox,
    accounts, activeAccountId, setActiveAccount,
    isSidebarCollapsed, toggleSidebar,
    setComposeOpen, setSearchOpen, setCommandPaletteOpen,
    currentView, setCurrentView,
  } = useEmailStore();

  return (
    <aside className={cn(
      'flex flex-col bg-zinc-950 border-r border-zinc-800 transition-all duration-200',
      isSidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!isSidebarCollapsed && (
          <h1 className="text-lg font-bold text-white tracking-tight">Velocity</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* View Switcher */}
      <div className="p-3 border-b border-zinc-800">
        {isSidebarCollapsed ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setCurrentView('mail')}
              className={cn(
                'p-2.5 rounded-lg flex items-center justify-center transition-colors',
                currentView === 'mail'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
              title="Mail"
            >
              <Mail size={18} />
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={cn(
                'p-2.5 rounded-lg flex items-center justify-center transition-colors',
                currentView === 'calendar'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
              title="Calendar"
            >
              <Calendar size={18} />
            </button>
          </div>
        ) : (
          <div className="flex bg-zinc-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentView('mail')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                currentView === 'mail'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Mail size={14} />
              Mail
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                currentView === 'calendar'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Calendar size={14} />
              Calendar
            </button>
          </div>
        )}
      </div>

      {/* Compose / New Event Button */}
      <div className="p-3">
        <button
          onClick={() => {
            if (currentView === 'mail') {
              setComposeOpen(true);
            } else {
              useEmailStore.getState().setCreateEventOpen(true);
            }
          }}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors',
            isSidebarCollapsed ? 'p-2.5 justify-center' : 'px-4 py-2.5'
          )}
        >
          <Plus size={18} />
          {!isSidebarCollapsed && (
            <span>{currentView === 'mail' ? 'Compose' : 'New Event'}</span>
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pb-2 flex gap-1">
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors',
            isSidebarCollapsed ? 'p-2.5 w-full justify-center' : 'p-2'
          )}
          title="Search (/ or Cmd+K)"
        >
          <Search size={16} />
        </button>
        {!isSidebarCollapsed && (
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Command Palette (Cmd+K)"
          >
            <Command size={16} />
          </button>
        )}
      </div>

      {/* Mailboxes (only in mail view) */}
      {currentView === 'mail' && (
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {MAILBOXES.map(({ type, label, icon: Icon, shortcut }) => (
              <button
                key={type}
                onClick={() => setCurrentMailbox(type)}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg transition-all duration-150',
                  isSidebarCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2',
                  currentMailbox === type
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                )}
                title={isSidebarCollapsed ? label : undefined}
              >
                <Icon size={18} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{label}</span>
                    {shortcut && (
                      <span className="text-xs text-zinc-600">{shortcut}</span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Calendar view spacer */}
      {currentView === 'calendar' && (
        <div className="flex-1" />
      )}

      {/* Accounts */}
      <div className="border-t border-zinc-800 p-3">
        {!isSidebarCollapsed && (
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-3">
            Accounts
          </p>
        )}
        <div className="space-y-1">
          <button
            onClick={() => setActiveAccount(null)}
            className={cn(
              'flex items-center gap-2 w-full rounded-lg transition-colors',
              isSidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-2',
              activeAccountId === null
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            )}
            title="All Accounts"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Mail size={12} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <span className="text-sm">All Accounts</span>
            )}
          </button>

          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setActiveAccount(account.id)}
              className={cn(
                'flex items-center gap-2 w-full rounded-lg transition-colors',
                isSidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-2',
                activeAccountId === account.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
              title={account.email}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: account.color }}
              >
                {account.email[0]?.toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left truncate">
                  <span className="text-sm truncate block">{account.name || account.email}</span>
                  <span className="text-xs text-zinc-500 truncate block">{account.email}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-zinc-800 p-3">
        <button
          className={cn(
            'flex items-center gap-2 w-full rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors',
            isSidebarCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2'
          )}
        >
          <Settings size={18} />
          {!isSidebarCollapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
