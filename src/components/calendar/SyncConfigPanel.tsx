'use client';

import { useState, useMemo } from 'react';
import { useEmailStore } from '@/store/email-store';
import { SyncDirection, SyncPrivacyLevel, SyncRule } from '@/types';
import { cn } from '@/lib/utils';
import {
  X, ArrowRight, ArrowLeftRight, Shield, ShieldCheck, ShieldOff,
  Plus, Trash2, Play, Pause, RefreshCw, Clock, AlertCircle, CheckCircle,
} from 'lucide-react';

const PRIVACY_OPTIONS: { level: SyncPrivacyLevel; label: string; description: string; icon: typeof Shield }[] = [
  { level: 'busy-only', label: 'Busy Only', description: 'Only blocks time — no event details shared', icon: ShieldCheck },
  { level: 'title-only', label: 'Title Only', description: 'Shows event title and time only', icon: Shield },
  { level: 'full', label: 'Full Details', description: 'Copies title, description, location, and time', icon: ShieldOff },
];

const DIRECTION_OPTIONS: { direction: SyncDirection; label: string; description: string; icon: typeof ArrowRight }[] = [
  { direction: 'one-way', label: 'One Way', description: 'Source → Destination only', icon: ArrowRight },
  { direction: 'two-way', label: 'Two Way', description: 'Sync events in both directions', icon: ArrowLeftRight },
];

export default function SyncConfigPanel() {
  const {
    isSyncConfigOpen, setSyncConfigOpen,
    accounts, calendars, syncRules,
    addSyncRule, updateSyncRule, removeSyncRule,
  } = useEmailStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSourceAccount, setFormSourceAccount] = useState('');
  const [formSourceCalendar, setFormSourceCalendar] = useState('');
  const [formDestAccount, setFormDestAccount] = useState('');
  const [formDestCalendar, setFormDestCalendar] = useState('');
  const [formDirection, setFormDirection] = useState<SyncDirection>('one-way');
  const [formPrivacy, setFormPrivacy] = useState<SyncPrivacyLevel>('busy-only');
  const [formBlockerTitle, setFormBlockerTitle] = useState('Busy');
  const [formFrequency, setFormFrequency] = useState(15);

  const sourceCalendars = useMemo(
    () => calendars.filter(c => c.accountId === formSourceAccount),
    [calendars, formSourceAccount]
  );

  const destCalendars = useMemo(
    () => calendars.filter(c => c.accountId === formDestAccount),
    [calendars, formDestAccount]
  );

  if (!isSyncConfigOpen) return null;

  const handleClose = () => {
    setSyncConfigOpen(false);
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormSourceAccount('');
    setFormSourceCalendar('');
    setFormDestAccount('');
    setFormDestCalendar('');
    setFormDirection('one-way');
    setFormPrivacy('busy-only');
    setFormBlockerTitle('Busy');
    setFormFrequency(15);
  };

  const handleCreate = async () => {
    if (!formSourceCalendar || !formDestCalendar || !formSourceAccount || !formDestAccount) return;

    const sourceCal = calendars.find(c => c.id === formSourceCalendar);
    const destCal = calendars.find(c => c.id === formDestCalendar);

    const ruleName = formName || `${sourceCal?.name || 'Source'} → ${destCal?.name || 'Dest'}`;

    try {
      const res = await fetch('/api/calendar/sync/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName,
          sourceCalendarId: formSourceCalendar,
          sourceAccountId: formSourceAccount,
          destinationCalendarId: formDestCalendar,
          destinationAccountId: formDestAccount,
          direction: formDirection,
          privacyLevel: formPrivacy,
          blockerTitle: formBlockerTitle,
          syncFrequencyMinutes: formFrequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addSyncRule(data.rule);
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create sync rule:', error);
    }
  };

  const handleToggleRule = async (rule: SyncRule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await fetch('/api/calendar/sync/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, status: newStatus }),
      });
      updateSyncRule(rule.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/calendar/sync/rules?id=${ruleId}`, { method: 'DELETE' });
      removeSyncRule(ruleId);
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleTriggerSync = async (rule: SyncRule) => {
    const accountTokens: Record<string, { accessToken: string; provider: 'google' | 'microsoft' }> = {};
    for (const account of accounts) {
      accountTokens[account.id] = {
        accessToken: account.accessToken,
        provider: account.provider,
      };
    }

    try {
      const res = await fetch('/api/calendar/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule, accountTokens }),
      });

      if (res.ok) {
        const data = await res.json();
        updateSyncRule(rule.id, {
          lastSyncAt: new Date().toISOString(),
          lastError: data.job.errors.length > 0 ? data.job.errors[0] : null,
        });
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const getCalendarLabel = (calId: string) => {
    const cal = calendars.find(c => c.id === calId);
    return cal?.name || calId;
  };

  const getAccountLabel = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc?.email || accId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Calendar Sync</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Sync events between your connected calendars</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing Rules */}
          {syncRules.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Active Sync Rules</h3>
              <div className="space-y-3">
                {syncRules.map((rule) => (
                  <div key={rule.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            rule.status === 'active' ? 'bg-emerald-400' :
                            rule.status === 'paused' ? 'bg-amber-400' : 'bg-red-400'
                          )} />
                          <p className="text-sm font-medium text-white truncate">{rule.name}</p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {getAccountLabel(rule.sourceAccountId)} / {getCalendarLabel(rule.sourceCalendarId)}
                          <span className="text-zinc-600 mx-2">
                            {rule.direction === 'two-way' ? '↔' : '→'}
                          </span>
                          {getAccountLabel(rule.destinationAccountId)} / {getCalendarLabel(rule.destinationCalendarId)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Shield size={10} />
                            {rule.privacyLevel === 'busy-only' ? 'Busy only' : rule.privacyLevel === 'title-only' ? 'Title only' : 'Full details'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Every {rule.syncFrequencyMinutes}m
                          </span>
                          {rule.lastSyncAt && (
                            <span className="flex items-center gap-1">
                              <CheckCircle size={10} className="text-emerald-500" />
                              Last sync: {new Date(rule.lastSyncAt).toLocaleTimeString()}
                            </span>
                          )}
                          {rule.lastError && (
                            <span className="flex items-center gap-1 text-red-400">
                              <AlertCircle size={10} />
                              Error
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleTriggerSync(rule)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 rounded-lg hover:bg-zinc-700 transition-colors"
                          title="Sync now"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                          title={rule.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {rule.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Rule */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">Create New Sync Rule</span>
            </button>
          ) : (
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">New Sync Rule</h3>
                <button
                  onClick={() => { setShowCreateForm(false); resetForm(); }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Rule Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rule Name (optional)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Work → Personal blockers"
                  className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                />
              </div>

              {/* Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Source Account</label>
                  <select
                    value={formSourceAccount}
                    onChange={(e) => { setFormSourceAccount(e.target.value); setFormSourceCalendar(''); }}
                    className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="" className="bg-zinc-900">Select account...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-zinc-900">
                        {acc.name || acc.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Source Calendar</label>
                  <select
                    value={formSourceCalendar}
                    onChange={(e) => setFormSourceCalendar(e.target.value)}
                    disabled={!formSourceAccount}
                    className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="" className="bg-zinc-900">Select calendar...</option>
                    {sourceCalendars.map((cal) => (
                      <option key={cal.id} value={cal.id} className="bg-zinc-900">
                        {cal.name} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Sync Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {DIRECTION_OPTIONS.map(({ direction, label, description, icon: Icon }) => (
                    <button
                      key={direction}
                      onClick={() => setFormDirection(direction)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                        formDirection === direction
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                      )}
                    >
                      <Icon size={16} className={formDirection === direction ? 'text-indigo-400' : ''} />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-[10px] text-zinc-500">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destination Account</label>
                  <select
                    value={formDestAccount}
                    onChange={(e) => { setFormDestAccount(e.target.value); setFormDestCalendar(''); }}
                    className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="" className="bg-zinc-900">Select account...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-zinc-900">
                        {acc.name || acc.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destination Calendar</label>
                  <select
                    value={formDestCalendar}
                    onChange={(e) => setFormDestCalendar(e.target.value)}
                    disabled={!formDestAccount}
                    className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="" className="bg-zinc-900">Select calendar...</option>
                    {destCalendars.map((cal) => (
                      <option key={cal.id} value={cal.id} className="bg-zinc-900">
                        {cal.name} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Privacy Level */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Privacy Level</label>
                <div className="space-y-2">
                  {PRIVACY_OPTIONS.map(({ level, label, description, icon: Icon }) => (
                    <button
                      key={level}
                      onClick={() => setFormPrivacy(level)}
                      className={cn(
                        'flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left',
                        formPrivacy === level
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                      )}
                    >
                      <Icon size={16} className={cn(
                        formPrivacy === level ? 'text-indigo-400' : 'text-zinc-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-[10px] text-zinc-500">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocker Title */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Blocker Event Title
                  {formPrivacy === 'title-only' && (
                    <span className="text-zinc-600 ml-1">(use {'{title}'} for original title)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formBlockerTitle}
                  onChange={(e) => setFormBlockerTitle(e.target.value)}
                  placeholder={formPrivacy === 'busy-only' ? 'Busy' : formPrivacy === 'title-only' ? '[Blocked] {title}' : 'Event title'}
                  className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                />
              </div>

              {/* Sync Frequency */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sync Frequency</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(Number(e.target.value))}
                  className="w-full bg-zinc-800 text-sm text-white border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value={5} className="bg-zinc-900">Every 5 minutes</option>
                  <option value={15} className="bg-zinc-900">Every 15 minutes</option>
                  <option value={30} className="bg-zinc-900">Every 30 minutes</option>
                  <option value={60} className="bg-zinc-900">Every hour</option>
                </select>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={!formSourceCalendar || !formDestCalendar}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Sync Rule
              </button>
            </div>
          )}

          {/* Help Text */}
          {syncRules.length === 0 && !showCreateForm && (
            <div className="text-center py-8">
              <RefreshCw size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No sync rules configured</p>
              <p className="text-xs text-zinc-600 mt-1">
                Create a sync rule to automatically block time across your calendars
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
