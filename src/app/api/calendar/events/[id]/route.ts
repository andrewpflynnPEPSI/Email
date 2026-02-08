import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGoogleEvent, updateGoogleEvent, deleteGoogleEvent, respondToGoogleEvent } from '@/lib/google-calendar';
import { fetchOutlookEvent, updateOutlookEvent, deleteOutlookEvent, respondToOutlookEvent } from '@/lib/microsoft-calendar';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendarId') || 'primary';
  const provider = session.provider;
  const accountId = session.providerAccountId;

  try {
    if (provider === 'google') {
      const event = await fetchGoogleEvent(session.accessToken, accountId, params.id, calendarId);
      return NextResponse.json(event);
    } else if (provider === 'azure-ad') {
      const event = await fetchOutlookEvent(session.accessToken, accountId, params.id);
      return NextResponse.json(event);
    }
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, calendarId, ...updates } = body;
  const provider = session.provider;

  try {
    if (action === 'respond') {
      const { response: rsvp } = body;
      if (provider === 'google') {
        await respondToGoogleEvent(session.accessToken, calendarId || 'primary', params.id, rsvp, session.user?.email);
      } else if (provider === 'azure-ad') {
        await respondToOutlookEvent(session.accessToken, params.id, rsvp);
      }
    } else {
      if (provider === 'google') {
        await updateGoogleEvent(session.accessToken, calendarId || 'primary', params.id, updates);
      } else if (provider === 'azure-ad') {
        await updateOutlookEvent(session.accessToken, params.id, updates);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendarId') || 'primary';
  const provider = session.provider;

  try {
    if (provider === 'google') {
      await deleteGoogleEvent(session.accessToken, calendarId, params.id);
    } else if (provider === 'azure-ad') {
      await deleteOutlookEvent(session.accessToken, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
