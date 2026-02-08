import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGoogleCalendars } from '@/lib/google-calendar';
import { fetchOutlookCalendars } from '@/lib/microsoft-calendar';

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provider = session.provider;
  const accountId = session.providerAccountId;

  try {
    if (provider === 'google') {
      const calendars = await fetchGoogleCalendars(session.accessToken, accountId);
      return NextResponse.json({ calendars });
    } else if (provider === 'azure-ad') {
      const calendars = await fetchOutlookCalendars(session.accessToken, accountId);
      return NextResponse.json({ calendars });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (error: any) {
    console.error('Calendar list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
