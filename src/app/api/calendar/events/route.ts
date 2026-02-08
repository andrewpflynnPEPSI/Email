import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGoogleEvents, createGoogleEvent } from '@/lib/google-calendar';
import { fetchOutlookEvents, createOutlookEvent } from '@/lib/microsoft-calendar';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get('timeMin') || new Date().toISOString();
  const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const calendarId = searchParams.get('calendarId') || undefined;
  const provider = session.provider;
  const accountId = session.providerAccountId;

  try {
    if (provider === 'google') {
      const events = await fetchGoogleEvents(session.accessToken, accountId, timeMin, timeMax, calendarId || 'primary');
      return NextResponse.json({ events });
    } else if (provider === 'azure-ad') {
      const events = await fetchOutlookEvents(session.accessToken, accountId, timeMin, timeMax, calendarId);
      return NextResponse.json({ events });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (error: any) {
    console.error('Calendar events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, start, end, description, location, attendees, calendarId, allDay } = body;
  const provider = session.provider;

  try {
    let eventId: string;
    if (provider === 'google') {
      eventId = await createGoogleEvent(session.accessToken, calendarId || 'primary', title, start, end, {
        description,
        location,
        attendees,
        allDay,
      });
    } else if (provider === 'azure-ad') {
      eventId = await createOutlookEvent(session.accessToken, calendarId, title, start, end, {
        description,
        location,
        attendees,
        allDay,
      });
    } else {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ id: eventId });
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
