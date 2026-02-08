'use client';

import { useState, useRef, useEffect } from 'react';
import { useEmailStore } from '@/store/email-store';
import { cn } from '@/lib/utils';
import {
  X, Minus, Maximize2, Minimize2, Send, Paperclip,
  Bold, Italic, Underline, List, Link, Image,
} from 'lucide-react';

export default function ComposeModal() {
  const { isComposeOpen, setComposeOpen, composeData, setComposeData, accounts, activeAccountId } = useEmailStore();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId || accounts[0]?.id || '');
  const bodyRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (composeData) {
      setTo(composeData.to?.join(', ') || '');
      setCc(composeData.cc?.join(', ') || '');
      setBcc(composeData.bcc?.join(', ') || '');
      setSubject(composeData.subject || '');
      setBody(composeData.body || '');
      if (composeData.accountId) setSelectedAccountId(composeData.accountId);
      if (composeData.cc?.length) setShowCc(true);
      if (composeData.bcc?.length) setShowBcc(true);
    }
  }, [composeData]);

  useEffect(() => {
    if (isComposeOpen && toRef.current && !composeData?.to?.length) {
      setTimeout(() => toRef.current?.focus(), 100);
    }
  }, [isComposeOpen]);

  if (!isComposeOpen) return null;

  const handleSend = async () => {
    // Send email via API
    try {
      const threadId = composeData?.threadId;
      const endpoint = threadId ? `/api/emails/${threadId}` : '/api/emails/send';

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.split(',').map(s => s.trim()).filter(Boolean),
          cc: cc ? cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          bcc: bcc ? bcc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          subject,
          content: body,
          replyToId: composeData?.replyToId,
        }),
      });

      handleClose();
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleClose = () => {
    setComposeOpen(false);
    setComposeData(null);
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setShowCc(false);
    setShowBcc(false);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  return (
    <div className={cn(
      'fixed z-50 bg-zinc-900 border border-zinc-700 rounded-t-xl shadow-2xl shadow-black/50 flex flex-col',
      isMaximized
        ? 'inset-4 rounded-xl'
        : isMinimized
          ? 'bottom-0 right-4 w-80 h-10 rounded-t-xl'
          : 'bottom-0 right-4 w-[600px] h-[500px]'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 rounded-t-xl border-b border-zinc-700 cursor-move">
        <span className="text-sm font-medium text-white flex-1 truncate">
          {composeData?.replyToId ? 'Reply' : 'New Message'}
        </span>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={handleClose}
          className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Account Selector */}
          {accounts.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-500">From:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white border-none outline-none cursor-pointer"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id} className="bg-zinc-900">
                    {account.name} &lt;{account.email}&gt;
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* To */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 w-8">To:</span>
            <input
              ref={toRef}
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              placeholder="Recipients"
            />
            <div className="flex gap-1">
              {!showCc && (
                <button onClick={() => setShowCc(true)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                  Cc
                </button>
              )}
              {!showBcc && (
                <button onClick={() => setShowBcc(true)} className="text-xs text-zinc-500 hover:text-white transition-colors">
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 w-8">Cc:</span>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                placeholder="Cc recipients"
                autoFocus
              />
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 w-8">Bcc:</span>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                placeholder="Bcc recipients"
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              placeholder="Subject"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-zinc-800">
            {[
              { icon: Bold, title: 'Bold' },
              { icon: Italic, title: 'Italic' },
              { icon: Underline, title: 'Underline' },
              { icon: List, title: 'List' },
              { icon: Link, title: 'Link' },
              { icon: Image, title: 'Image' },
            ].map(({ icon: Icon, title }) => (
              <button
                key={title}
                title={title}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div
              ref={bodyRef}
              contentEditable
              className="px-4 py-3 text-sm text-zinc-200 outline-none min-h-full"
              dangerouslySetInnerHTML={{ __html: body }}
              onInput={(e) => setBody((e.target as HTMLElement).innerHTML)}
              suppressContentEditableWarning
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send size={14} />
              Send
            </button>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <Paperclip size={16} />
            </button>
            <span className="flex-1" />
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
