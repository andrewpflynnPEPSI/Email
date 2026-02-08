'use client';

import { useEmailStore } from '@/store/email-store';
import { cn } from '@/lib/utils';
import {
  X, RefreshCw, Clock,
  ArrowUpCircle, Trash2, SkipForward, AlertTriangle,
} from 'lucide-react';

const ACTION_ICONS = {
  created: ArrowUpCircle,
  updated: RefreshCw,
  deleted: Trash2,
  skipped: SkipForward,
  error: AlertTriangle,
};

const ACTION_COLORS = {
  created: 'text-emerald-400',
  updated: 'text-blue-400',
  deleted: 'text-red-400',
  skipped: 'text-zinc-500',
  error: 'text-amber-400',
};

export default function SyncStatusPanel() {
  const {
    isSyncStatusOpen, setSyncStatusOpen,
    syncRules, syncLogs, activeSyncJob,
  } = useEmailStore();

  if (!isSyncStatusOpen) return null;

  const handleClose = () => setSyncStatusOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Sync Status</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {syncRules.length} rule{syncRules.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Active Job */}
        {activeSyncJob && activeSyncJob.status === 'running' && (
          <div className="px-6 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-indigo-400 animate-spin" />
              <span className="text-sm text-indigo-300 font-medium">Sync in progress...</span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-indigo-300/60">
              <span>{activeSyncJob.eventsCreated} created</span>
              <span>{activeSyncJob.eventsUpdated} updated</span>
              <span>{activeSyncJob.eventsDeleted} deleted</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-zinc-800">
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">
              {syncRules.filter(r => r.status === 'active').length}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Rules</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">
              {syncLogs.filter(l => l.action === 'created' || l.action === 'updated').length}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Events Synced</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-400">
              {syncLogs.filter(l => l.action === 'error').length}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Errors</p>
          </div>
        </div>

        {/* Sync Log */}
        <div className="flex-1 overflow-y-auto">
          {syncLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Clock size={32} className="text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No sync activity yet</p>
              <p className="text-xs mt-1">Sync logs will appear here after the first sync</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {syncLogs.slice(0, 50).map((log) => {
                const Icon = ACTION_ICONS[log.action];
                const color = ACTION_COLORS[log.action];
                const ruleName = syncRules.find(r => r.id === log.syncRuleId)?.name || 'Unknown rule';

                return (
                  <div key={log.id} className="px-4 py-3 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <Icon size={14} className={cn('mt-0.5 flex-shrink-0', color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">{log.sourceEventTitle}</p>
                          <span className={cn(
                            'text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full flex-shrink-0',
                            log.action === 'created' ? 'bg-emerald-500/10 text-emerald-400' :
                            log.action === 'updated' ? 'bg-blue-500/10 text-blue-400' :
                            log.action === 'deleted' ? 'bg-red-500/10 text-red-400' :
                            log.action === 'error' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-700/50 text-zinc-500'
                          )}>
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                          <span>{ruleName}</span>
                          <span>·</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
