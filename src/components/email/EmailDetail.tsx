'use client';

import { useState } from 'react';
import { useEmailStore } from '@/store/email-store';
import { Email } from '@/types';
import { formatFullDate, formatRelativeDate, getInitials, cn } from '@/lib/utils';
import {
  Reply, ReplyAll, Forward, Star, Archive, Trash2,
  MoreHorizontal, ChevronDown, ChevronUp, Paperclip,
  ArrowLeft, Mail, MailOpen,
} from 'lucide-react';

function MessageView({ message, isLast, onReply }: {
  message: Email;
  isLast: boolean;
  onReply: (message: Email) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(isLast);

  return (
    <div className={cn(
      'border-b border-zinc-800/50 last:border-0',
      isExpanded ? '' : 'hover:bg-zinc-900/30 cursor-pointer'
    )}>
      {/* Message Header */}
      <div
        onClick={() => !isExpanded && setIsExpanded(true)}
        className="flex items-start gap-3 px-6 py-4"
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          !message.isRead ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'
        )}>
          {getInitials(message.from.name, message.from.email)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              {message.from.name || message.from.email}
            </span>
            <span className="text-xs text-zinc-500">
              &lt;{message.from.email}&gt;
            </span>
            <span className="flex-1" />
            <span className="text-xs text-zinc-500" title={formatFullDate(message.date)}>
              {formatRelativeDate(message.date)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {isExpanded && (
            <div className="text-xs text-zinc-500 mt-1">
              <span>To: {message.to.map(a => a.name || a.email).join(', ')}</span>
              {message.cc && message.cc.length > 0 && (
                <span className="ml-2">Cc: {message.cc.map(a => a.name || a.email).join(', ')}</span>
              )}
            </div>
          )}

          {!isExpanded && (
            <p className="text-sm text-zinc-500 truncate mt-0.5">{message.snippet}</p>
          )}
        </div>
      </div>

      {/* Message Body */}
      {isExpanded && (
        <>
          <div className="px-6 pb-4">
            <div
              className="prose prose-invert prose-sm max-w-none text-zinc-300
                         prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                         prose-headings:text-white prose-strong:text-white
                         prose-blockquote:border-l-zinc-600 prose-blockquote:text-zinc-400
                         prose-code:text-indigo-300 prose-pre:bg-zinc-800"
              dangerouslySetInnerHTML={{ __html: message.body }}
            />

            {/* Attachments */}
            {message.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Paperclip size={12} />
                  {message.attachments.length} attachment{message.attachments.length !== 1 && 's'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 cursor-pointer transition-colors"
                    >
                      <Paperclip size={14} className="text-zinc-500" />
                      <span className="truncate max-w-[200px]">{att.filename}</span>
                      <span className="text-xs text-zinc-500">
                        {(att.size / 1024).toFixed(0)}KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Reply Actions */}
          {isLast && (
            <div className="px-6 pb-4 flex items-center gap-2">
              <button
                onClick={() => onReply(message)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white text-sm transition-colors"
              >
                <Reply size={14} />
                Reply
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white text-sm transition-colors">
                <ReplyAll size={14} />
                Reply All
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white text-sm transition-colors">
                <Forward size={14} />
                Forward
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EmailDetail() {
  const {
    selectedThread, setSelectedThread, setSelectedThreadId,
    setComposeOpen, setComposeData, splitView,
  } = useEmailStore();

  if (!selectedThread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
          <Mail size={32} className="text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">Select an email to read</p>
        <p className="text-xs text-zinc-600 mt-1">Use arrow keys or click to select</p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
          {[
            { key: 'J/K', desc: 'Navigate' },
            { key: 'Enter', desc: 'Open' },
            { key: 'C', desc: 'Compose' },
            { key: '/', desc: 'Search' },
            { key: 'E', desc: 'Archive' },
            { key: '#', desc: 'Delete' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">{key}</kbd>
              <span className="text-zinc-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleReply = (message: Email) => {
    setComposeData({
      to: [message.from.email],
      subject: message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`,
      replyToId: message.id,
      threadId: message.threadId,
      accountId: message.accountId,
    });
    setComposeOpen(true);
  };

  const handleBack = () => {
    setSelectedThread(null);
    setSelectedThreadId(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Thread Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        {!splitView && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <h2 className="text-base font-semibold text-white flex-1 truncate">
          {selectedThread.subject}
        </h2>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Archive (E)">
            <Archive size={16} />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Delete (#)">
            <Trash2 size={16} />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors" title="Star (S)">
            <Star size={16} className={selectedThread.isStarred ? 'fill-amber-400 text-amber-400' : ''} />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Mark unread (U)">
            <MailOpen size={16} />
          </button>
          <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {selectedThread.messages.map((message, index) => (
          <MessageView
            key={message.id}
            message={message}
            isLast={index === selectedThread.messages.length - 1}
            onReply={handleReply}
          />
        ))}
      </div>
    </div>
  );
}
