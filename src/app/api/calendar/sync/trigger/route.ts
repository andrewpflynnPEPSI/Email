import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeSyncRule } from '@/lib/calendar-sync';
import { SyncRule, SyncedEvent } from '@/types';

// In-memory synced events store (would be a database in production)
const syncedEventsStore = new Map<string, SyncedEvent[]>();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { rule, accountTokens } = body as {
    rule: SyncRule;
    accountTokens: Record<string, { accessToken: string; provider: 'google' | 'microsoft' }>;
  };

  if (!rule || !accountTokens) {
    return NextResponse.json({ error: 'Missing rule or accountTokens' }, { status: 400 });
  }

  try {
    const existingSyncedEvents = syncedEventsStore.get(rule.id) || [];

    const result = await executeSyncRule(
      rule,
      accountTokens,
      existingSyncedEvents,
    );

    // Update synced events store
    syncedEventsStore.set(rule.id, result.updatedSyncedEvents);

    return NextResponse.json({
      job: result.job,
      logs: result.logs,
      syncedEventsCount: result.updatedSyncedEvents.length,
    });
  } catch (error: any) {
    console.error('Sync trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
