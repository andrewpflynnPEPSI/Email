'use client';

import { useEffect, useRef } from 'react';
import { useEmailStore } from '@/store/email-store';
import { EmailThread } from '@/types';
import { formatEmailDate, getInitials, cn, truncate } from '@/lib/utils';
import { Paperclip, Star } from 'lucide-react';

function ThreadRow({ thread, isSelected, onClick, accountColor }: {
  thread: EmailThread;
  isSelected: boolean;
  onClick: () => void;
  accountColor?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const lastMessage = thread.messages[thread.messages.length - 1];
  const hasAttachments = thread.messages.some(m => m.attachments.length > 0);
  const messageCount = thread.messages.length;

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-zinc-800/50 transition-all duration-100',
        isSelected
          ? 'bg-zinc-800/80 border-l-2 border-l-indigo-500'
          : 'hover:bg-zinc-900/50 border-l-2 border-l-transparent',
        !thread.isRead && 'bg-zinc-900/30'
      )}
    >
      {/* Account indicator */}
      {accountColor && (
        <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accountColor }} />
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
          !thread.isRead ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'
        )}>
          {getInitials(lastMessage?.from.name, lastMessage?.from.email)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-sm truncate',
            !thread.isRead ? 'font-semibold text-white' : 'text-zinc-300'
          )}>
            {lastMessage?.from.name || lastMessage?.from.email || 'Unknown'}
          </span>
          {messageCount > 1 && (
            <span className="text-xs text-zinc-500 flex-shrink-0">({messageCount})</span>
          )}
          <span className="flex-1" />
          <span className={cn(
            'text-xs flex-shrink-0',
            !thread.isRead ? 'text-indigo-400' : 'text-zinc-500'
          )}>
            {formatEmailDate(thread.lastMessageDate)}
          </span>
        </div>

        <div className={cn(
          'text-sm truncate mb-0.5',
          !thread.isRead ? 'text-zinc-200' : 'text-zinc-400'
        )}>
          {thread.subject}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 truncate flex-1">
            {truncate(thread.snippet, 100)}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {thread.isStarred && (
              <Star size={12} className="text-amber-400 fill-amber-400" />
            )}
            {hasAttachments && (
              <Paperclip size={12} className="text-zinc-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailList() {
  const {
    threads, selectedIndex, setSelectedIndex,
    setSelectedThreadId, setSelectedThread,
    isLoading, accounts, activeAccountId,
    nextPageToken, setThreads, setNextPageToken, setLoading,
    currentMailbox, searchQuery,
  } = useEmailStore();

  const handleSelectThread = (thread: EmailThread, index: number) => {
    setSelectedIndex(index);
    setSelectedThreadId(thread.id);
    setSelectedThread(thread);
  };

  const getAccountColor = (accountId: string): string | undefined => {
    if (activeAccountId !== null) return undefined;
    return accounts.find(a => a.id === accountId)?.color;
  };

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <span className="text-sm">Loading emails...</span>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">No emails here</p>
        <p className="text-xs text-zinc-600 mt-1">You&apos;re all caught up!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((thread, index) => (
        <ThreadRow
          key={`${thread.accountId}-${thread.id}`}
          thread={thread}
          isSelected={selectedIndex === index}
          onClick={() => handleSelectThread(thread, index)}
          accountColor={getAccountColor(thread.accountId)}
        />
      ))}

      {nextPageToken && (
        <div className="p-4 text-center">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const params = new URLSearchParams({ mailbox: currentMailbox, pageToken: nextPageToken });
                if (searchQuery) params.set('query', searchQuery);
                const res = await fetch(`/api/emails?${params}`);
                if (res.ok) {
                  const data = await res.json();
                  setThreads([...threads, ...(data.threads || [])]);
                  setNextPageToken(data.nextPageToken || null);
                }
              } catch (error) {
                console.error('Load more failed:', error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={isLoading}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more...'}
          </button>
        </div>
      )}
    </div>
  );
}
