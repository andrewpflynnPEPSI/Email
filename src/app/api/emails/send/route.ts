import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendGmailMessage } from '@/lib/google-mail';
import { sendOutlookMessage } from '@/lib/microsoft-mail';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { to, subject, content, cc, bcc } = body;
  const provider = session.provider;

  try {
    let messageId: string;
    if (provider === 'google') {
      messageId = await sendGmailMessage(session.accessToken, to, subject, content, cc, bcc);
    } else if (provider === 'azure-ad') {
      messageId = await sendOutlookMessage(session.accessToken, to, subject, content, cc, bcc);
    } else {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ id: messageId });
  } catch (error: any) {
    console.error('Send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
