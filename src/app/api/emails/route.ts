import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGmailThreads } from '@/lib/google-mail';
import { fetchOutlookThreads } from '@/lib/microsoft-mail';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mailbox = (searchParams.get('mailbox') || 'inbox') as any;
  const query = searchParams.get('query') || undefined;
  const pageToken = searchParams.get('pageToken') || undefined;
  const provider = session.provider;
  const accountId = session.providerAccountId;

  try {
    if (provider === 'google') {
      const result = await fetchGmailThreads(session.accessToken, accountId, mailbox, 50, pageToken, query);
      return NextResponse.json(result);
    } else if (provider === 'azure-ad') {
      const skip = pageToken ? parseInt(pageToken) : 0;
      const result = await fetchOutlookThreads(session.accessToken, accountId, mailbox, 50, skip, query);
      return NextResponse.json({
        threads: result.threads,
        nextPageToken: result.nextSkip?.toString(),
      });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (error: any) {
    console.error('Email fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
