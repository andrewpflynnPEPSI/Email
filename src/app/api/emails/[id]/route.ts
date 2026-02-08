import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchGmailThread, modifyGmailMessage, trashGmailMessage, sendGmailMessage } from '@/lib/google-mail';
import { fetchOutlookThread, modifyOutlookMessage, trashOutlookMessage, sendOutlookMessage } from '@/lib/microsoft-mail';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provider = session.provider;
  const accountId = session.providerAccountId;

  try {
    if (provider === 'google') {
      const thread = await fetchGmailThread(session.accessToken, accountId, params.id);
      return NextResponse.json(thread);
    } else if (provider === 'azure-ad') {
      const thread = await fetchOutlookThread(session.accessToken, accountId, params.id);
      return NextResponse.json(thread);
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
  const { action, messageId } = body;
  const provider = session.provider;

  try {
    if (provider === 'google') {
      if (action === 'markRead') {
        await modifyGmailMessage(session.accessToken, messageId || params.id, undefined, ['UNREAD']);
      } else if (action === 'markUnread') {
        await modifyGmailMessage(session.accessToken, messageId || params.id, ['UNREAD']);
      } else if (action === 'star') {
        await modifyGmailMessage(session.accessToken, messageId || params.id, ['STARRED']);
      } else if (action === 'unstar') {
        await modifyGmailMessage(session.accessToken, messageId || params.id, undefined, ['STARRED']);
      } else if (action === 'trash') {
        await trashGmailMessage(session.accessToken, messageId || params.id);
      } else if (action === 'archive') {
        await modifyGmailMessage(session.accessToken, messageId || params.id, undefined, ['INBOX']);
      }
    } else if (provider === 'azure-ad') {
      if (action === 'markRead') {
        await modifyOutlookMessage(session.accessToken, messageId || params.id, { isRead: true });
      } else if (action === 'markUnread') {
        await modifyOutlookMessage(session.accessToken, messageId || params.id, { isRead: false });
      } else if (action === 'star') {
        await modifyOutlookMessage(session.accessToken, messageId || params.id, { flag: { flagStatus: 'flagged' } });
      } else if (action === 'unstar') {
        await modifyOutlookMessage(session.accessToken, messageId || params.id, { flag: { flagStatus: 'notFlagged' } });
      } else if (action === 'trash') {
        await trashOutlookMessage(session.accessToken, messageId || params.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { to, subject, content, cc, bcc, replyToId } = body;
  const provider = session.provider;

  try {
    let messageId: string;
    if (provider === 'google') {
      messageId = await sendGmailMessage(session.accessToken, to, subject, content, cc, bcc, params.id, replyToId);
    } else if (provider === 'azure-ad') {
      messageId = await sendOutlookMessage(session.accessToken, to, subject, content, cc, bcc, replyToId);
    } else {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.json({ id: messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
