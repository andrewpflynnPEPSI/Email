'use client';

import { signIn } from 'next-auth/react';
import { useEmailStore } from '@/store/email-store';
import { Plus, X, Trash2 } from 'lucide-react';

export default function AccountManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { accounts, removeAccount } = useEmailStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Manage Accounts</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Accounts */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.email[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{account.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{account.email}</p>
                    <p className="text-xs text-zinc-500 capitalize">{account.provider === 'google' ? 'Google' : 'Microsoft'}</p>
                  </div>
                  <button
                    onClick={() => removeAccount(account.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Account Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Add Account</p>

            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-750 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Google / Gmail</p>
                <p className="text-xs text-zinc-400">Connect your Google Workspace or Gmail account</p>
              </div>
              <Plus size={16} className="text-zinc-400 ml-auto" />
            </button>

            <button
              onClick={() => signIn('azure-ad')}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-750 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#00a4ef] flex items-center justify-center">
                <svg viewBox="0 0 23 23" className="w-4 h-4">
                  <path fill="white" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Microsoft / Outlook</p>
                <p className="text-xs text-zinc-400">Connect your Microsoft 365 or Outlook account</p>
              </div>
              <Plus size={16} className="text-zinc-400 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
