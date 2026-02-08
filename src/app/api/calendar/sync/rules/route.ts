import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SyncRule } from '@/types';

// In-memory store for sync rules (would be a database in production)
const syncRulesStore = new Map<string, SyncRule>();

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rules = Array.from(syncRulesStore.values());
  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    sourceCalendarId,
    sourceAccountId,
    destinationCalendarId,
    destinationAccountId,
    direction = 'one-way',
    privacyLevel = 'busy-only',
    blockerTitle = 'Busy',
    syncFrequencyMinutes = 15,
  } = body;

  if (!sourceCalendarId || !destinationCalendarId || !sourceAccountId || !destinationAccountId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Prevent syncing a calendar to itself
  if (sourceCalendarId === destinationCalendarId && sourceAccountId === destinationAccountId) {
    return NextResponse.json({ error: 'Cannot sync a calendar to itself' }, { status: 400 });
  }

  const rule: SyncRule = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || `Sync ${sourceCalendarId} → ${destinationCalendarId}`,
    sourceCalendarId,
    sourceAccountId,
    destinationCalendarId,
    destinationAccountId,
    direction,
    privacyLevel,
    blockerTitle,
    syncFrequencyMinutes,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastSyncAt: null,
    lastError: null,
  };

  syncRulesStore.set(rule.id, rule);
  return NextResponse.json({ rule });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing rule ID' }, { status: 400 });
  }

  const existing = syncRulesStore.get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const updated: SyncRule = { ...existing, ...updates, id: existing.id };
  syncRulesStore.set(id, updated);
  return NextResponse.json({ rule: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing rule ID' }, { status: 400 });
  }

  syncRulesStore.delete(id);
  return NextResponse.json({ success: true });
}
