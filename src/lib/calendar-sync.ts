import { CalendarEvent, SyncRule, SyncedEvent, SyncLogEntry, SyncJob, SyncPrivacyLevel } from '@/types';
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, fetchGoogleEvents } from './google-calendar';
import { createOutlookEvent, updateOutlookEvent, deleteOutlookEvent, fetchOutlookEvents } from './microsoft-calendar';

// --------------- Hashing & Diff ---------------

function hashEvent(event: CalendarEvent): string {
  // Hash relevant fields to detect changes
  const data = [
    event.title,
    event.start,
    event.end,
    event.allDay ? '1' : '0',
    event.location || '',
    event.description || '',
    event.status,
  ].join('|');

  // Simple hash for change detection
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return hash.toString(36);
}

function buildBlockerEvent(
  sourceEvent: CalendarEvent,
  rule: SyncRule
): {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
} {
  let title: string;
  let description = '';
  let location: string | undefined;

  switch (rule.privacyLevel) {
    case 'busy-only':
      title = rule.blockerTitle || 'Busy';
      break;
    case 'title-only':
      title = rule.blockerTitle
        ? rule.blockerTitle.replace('{title}', sourceEvent.title)
        : sourceEvent.title;
      break;
    case 'full':
      title = sourceEvent.title;
      description = sourceEvent.description || '';
      location = sourceEvent.location;
      break;
  }

  return {
    title,
    description,
    start: sourceEvent.start,
    end: sourceEvent.end,
    allDay: sourceEvent.allDay,
    location,
  };
}

// --------------- Sync Engine ---------------

interface AccountTokenMap {
  [accountId: string]: {
    accessToken: string;
    provider: 'google' | 'microsoft';
  };
}

export interface SyncResult {
  job: SyncJob;
  logs: SyncLogEntry[];
  updatedSyncedEvents: SyncedEvent[];
}

async function fetchEventsForAccount(
  accessToken: string,
  provider: 'google' | 'microsoft',
  accountId: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  if (provider === 'google') {
    return fetchGoogleEvents(accessToken, accountId, timeMin, timeMax, calendarId);
  } else {
    return fetchOutlookEvents(accessToken, accountId, timeMin, timeMax, calendarId);
  }
}

async function createEventForAccount(
  accessToken: string,
  provider: 'google' | 'microsoft',
  calendarId: string,
  title: string,
  start: string,
  end: string,
  options: { description?: string; location?: string; allDay?: boolean },
): Promise<string> {
  if (provider === 'google') {
    return createGoogleEvent(accessToken, calendarId, title, start, end, options);
  } else {
    return createOutlookEvent(accessToken, calendarId, title, start, end, options);
  }
}

async function updateEventForAccount(
  accessToken: string,
  provider: 'google' | 'microsoft',
  calendarId: string,
  eventId: string,
  updates: { title?: string; description?: string; location?: string; start?: string; end?: string; allDay?: boolean },
): Promise<void> {
  if (provider === 'google') {
    await updateGoogleEvent(accessToken, calendarId, eventId, updates);
  } else {
    await updateOutlookEvent(accessToken, eventId, updates);
  }
}

async function deleteEventForAccount(
  accessToken: string,
  provider: 'google' | 'microsoft',
  calendarId: string,
  eventId: string,
): Promise<void> {
  if (provider === 'google') {
    await deleteGoogleEvent(accessToken, calendarId, eventId);
  } else {
    await deleteOutlookEvent(accessToken, eventId);
  }
}

// --------------- Main Sync Function ---------------

export async function executeSyncRule(
  rule: SyncRule,
  accountTokens: AccountTokenMap,
  existingSyncedEvents: SyncedEvent[],
  syncWindowDays: number = 30,
): Promise<SyncResult> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const logs: SyncLogEntry[] = [];
  const updatedSyncedEvents: SyncedEvent[] = [];

  const job: SyncJob = {
    id: jobId,
    syncRuleId: rule.id,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [],
  };

  const sourceAccount = accountTokens[rule.sourceAccountId];
  const destAccount = accountTokens[rule.destinationAccountId];

  if (!sourceAccount || !destAccount) {
    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.errors.push('Missing account tokens for sync');
    return { job, logs, updatedSyncedEvents };
  }

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + syncWindowDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Fetch source events
    const sourceEvents = await fetchEventsForAccount(
      sourceAccount.accessToken,
      sourceAccount.provider,
      rule.sourceAccountId,
      rule.sourceCalendarId,
      timeMin,
      timeMax,
    );

    // 2. Build map of existing synced events for this rule
    const syncedBySourceId = new Map<string, SyncedEvent>();
    for (const se of existingSyncedEvents) {
      if (se.syncRuleId === rule.id) {
        syncedBySourceId.set(se.sourceEventId, se);
      }
    }

    // 3. Track which source events still exist (for deletion detection)
    const currentSourceIds = new Set(sourceEvents.map(e => e.id));

    // 4. Process each source event
    for (const sourceEvent of sourceEvents) {
      // Skip cancelled events
      if (sourceEvent.status === 'cancelled') continue;

      const eventHash = hashEvent(sourceEvent);
      const existingSynced = syncedBySourceId.get(sourceEvent.id);

      try {
        if (!existingSynced) {
          // CREATE: New event, create blocker in destination
          const blocker = buildBlockerEvent(sourceEvent, rule);

          const destEventId = await createEventForAccount(
            destAccount.accessToken,
            destAccount.provider,
            rule.destinationCalendarId,
            blocker.title,
            blocker.start,
            blocker.end,
            {
              description: blocker.description || undefined,
              location: blocker.location,
              allDay: blocker.allDay,
            },
          );

          const syncedEvent: SyncedEvent = {
            id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            syncRuleId: rule.id,
            sourceEventId: sourceEvent.id,
            sourceCalendarId: rule.sourceCalendarId,
            sourceAccountId: rule.sourceAccountId,
            destinationEventId: destEventId,
            destinationCalendarId: rule.destinationCalendarId,
            destinationAccountId: rule.destinationAccountId,
            lastSyncedAt: new Date().toISOString(),
            sourceHash: eventHash,
          };

          updatedSyncedEvents.push(syncedEvent);
          job.eventsCreated++;

          logs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            syncRuleId: rule.id,
            timestamp: new Date().toISOString(),
            action: 'created',
            sourceEventTitle: sourceEvent.title,
            details: `Created blocker "${blocker.title}" in destination calendar`,
          });
        } else if (existingSynced.sourceHash !== eventHash) {
          // UPDATE: Source event changed, update blocker
          const blocker = buildBlockerEvent(sourceEvent, rule);

          await updateEventForAccount(
            destAccount.accessToken,
            destAccount.provider,
            rule.destinationCalendarId,
            existingSynced.destinationEventId,
            {
              title: blocker.title,
              description: blocker.description || undefined,
              location: blocker.location,
              start: blocker.start,
              end: blocker.end,
              allDay: blocker.allDay,
            },
          );

          updatedSyncedEvents.push({
            ...existingSynced,
            lastSyncedAt: new Date().toISOString(),
            sourceHash: eventHash,
          });
          job.eventsUpdated++;

          logs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            syncRuleId: rule.id,
            timestamp: new Date().toISOString(),
            action: 'updated',
            sourceEventTitle: sourceEvent.title,
            details: `Updated blocker for changed event`,
          });
        } else {
          // No change, keep existing synced event record
          updatedSyncedEvents.push(existingSynced);

          logs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            syncRuleId: rule.id,
            timestamp: new Date().toISOString(),
            action: 'skipped',
            sourceEventTitle: sourceEvent.title,
            details: 'No changes detected',
          });
        }
      } catch (eventError: any) {
        const errMsg = eventError?.message || 'Unknown error';
        job.errors.push(`Event "${sourceEvent.title}": ${errMsg}`);
        logs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          syncRuleId: rule.id,
          timestamp: new Date().toISOString(),
          action: 'error',
          sourceEventTitle: sourceEvent.title,
          details: errMsg,
        });
      }
    }

    // 5. Delete blockers for source events that no longer exist
    for (const synced of existingSyncedEvents) {
      if (synced.syncRuleId !== rule.id) continue;
      if (currentSourceIds.has(synced.sourceEventId)) continue;

      try {
        await deleteEventForAccount(
          destAccount.accessToken,
          destAccount.provider,
          rule.destinationCalendarId,
          synced.destinationEventId,
        );

        job.eventsDeleted++;
        logs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          syncRuleId: rule.id,
          timestamp: new Date().toISOString(),
          action: 'deleted',
          sourceEventTitle: '(deleted event)',
          details: `Removed blocker for deleted source event`,
        });
      } catch (deleteError: any) {
        // Event may already be deleted, just log
        logs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          syncRuleId: rule.id,
          timestamp: new Date().toISOString(),
          action: 'error',
          sourceEventTitle: '(cleanup)',
          details: `Failed to delete blocker: ${deleteError?.message || 'Unknown error'}`,
        });
      }
    }

    // 6. Two-way sync: reverse direction
    if (rule.direction === 'two-way') {
      const reverseResult = await executeSyncRule(
        {
          ...rule,
          id: `${rule.id}-reverse`,
          direction: 'one-way', // Prevent infinite recursion
          sourceCalendarId: rule.destinationCalendarId,
          sourceAccountId: rule.destinationAccountId,
          destinationCalendarId: rule.sourceCalendarId,
          destinationAccountId: rule.sourceAccountId,
        },
        accountTokens,
        existingSyncedEvents.filter(se => se.syncRuleId === `${rule.id}-reverse`),
        syncWindowDays,
      );

      // Merge reverse results
      job.eventsCreated += reverseResult.job.eventsCreated;
      job.eventsUpdated += reverseResult.job.eventsUpdated;
      job.eventsDeleted += reverseResult.job.eventsDeleted;
      job.errors.push(...reverseResult.job.errors);
      logs.push(...reverseResult.logs);
      updatedSyncedEvents.push(...reverseResult.updatedSyncedEvents);
    }

    job.status = job.errors.length > 0 ? 'failed' : 'completed';
  } catch (error: any) {
    job.status = 'failed';
    job.errors.push(error?.message || 'Sync failed');
  }

  job.completedAt = new Date().toISOString();
  return { job, logs, updatedSyncedEvents };
}

// --------------- Utility: Privacy level description ---------------

export function getPrivacyDescription(level: SyncPrivacyLevel): string {
  switch (level) {
    case 'busy-only':
      return 'Only shows "Busy" — no event details shared';
    case 'title-only':
      return 'Shows event title and time — no description or attendees';
    case 'full':
      return 'Copies all event details including description and location';
  }
}
