import { Client } from '@microsoft/microsoft-graph-client';
import { Email, EmailThread, MailboxType, EmailAddress, EmailAttachment } from '@/types';

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

const FOLDER_MAP: Record<MailboxType, string> = {
  inbox: 'inbox',
  starred: 'inbox', // Outlook uses flagged instead of starred
  sent: 'sentitems',
  drafts: 'drafts',
  trash: 'deleteditems',
  spam: 'junkemail',
  all: 'allmailfolders',
};

function parseGraphAddress(addr: any): EmailAddress {
  return {
    name: addr?.emailAddress?.name || '',
    email: addr?.emailAddress?.address || '',
  };
}

function parseGraphMessage(msg: any, accountId: string): Email {
  const from = msg.from ? parseGraphAddress(msg.from) : { email: '' };
  const to = (msg.toRecipients || []).map(parseGraphAddress);
  const cc = (msg.ccRecipients || []).map(parseGraphAddress);
  const bcc = (msg.bccRecipients || []).map(parseGraphAddress);

  const labels: string[] = [];
  if (!msg.isRead) labels.push('UNREAD');
  if (msg.flag?.flagStatus === 'flagged') labels.push('STARRED');
  (msg.categories || []).forEach((c: string) => labels.push(c));

  const attachments: EmailAttachment[] = (msg.attachments || []).map((a: any) => ({
    id: a.id,
    filename: a.name || 'attachment',
    mimeType: a.contentType || 'application/octet-stream',
    size: a.size || 0,
  }));

  return {
    id: msg.id,
    threadId: msg.conversationId || msg.id,
    accountId,
    from,
    to,
    cc,
    bcc,
    subject: msg.subject || '(no subject)',
    snippet: msg.bodyPreview || '',
    body: msg.body?.content || '',
    date: msg.receivedDateTime || msg.sentDateTime || new Date().toISOString(),
    isRead: msg.isRead !== false,
    isStarred: msg.flag?.flagStatus === 'flagged',
    labels,
    attachments,
    provider: 'microsoft',
  };
}

export async function fetchOutlookThreads(
  accessToken: string,
  accountId: string,
  mailbox: MailboxType = 'inbox',
  maxResults: number = 50,
  skip: number = 0,
  query?: string
): Promise<{ threads: EmailThread[]; nextSkip?: number }> {
  const client = getGraphClient(accessToken);

  let endpoint: string;
  if (mailbox === 'all') {
    endpoint = '/me/messages';
  } else {
    endpoint = `/me/mailFolders/${FOLDER_MAP[mailbox]}/messages`;
  }

  let request = client.api(endpoint)
    .top(maxResults)
    .skip(skip)
    .orderby('receivedDateTime desc')
    .select('id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,flag,categories,hasAttachments');

  if (query) {
    request = request.filter(`contains(subject,'${query}') or contains(body/content,'${query}')`);
  }

  if (mailbox === 'starred') {
    request = request.filter("flag/flagStatus eq 'flagged'");
  }

  const response = await request.get();
  const messages: any[] = response.value || [];

  // Group by conversation
  const conversationMap = new Map<string, Email[]>();
  for (const msg of messages) {
    const email = parseGraphMessage(msg, accountId);
    const key = email.threadId;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, []);
    }
    conversationMap.get(key)!.push(email);
  }

  const threads: EmailThread[] = Array.from(conversationMap.entries()).map(([threadId, msgs]) => {
    msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastMessage = msgs[msgs.length - 1];
    const participants = new Map<string, EmailAddress>();
    msgs.forEach(m => {
      if (m.from.email) participants.set(m.from.email, m.from);
      m.to.forEach(addr => { if (addr.email) participants.set(addr.email, addr); });
    });

    return {
      id: threadId,
      accountId,
      messages: msgs,
      subject: lastMessage?.subject || '(no subject)',
      snippet: lastMessage?.snippet || '',
      lastMessageDate: lastMessage?.date || new Date().toISOString(),
      isRead: msgs.every(m => m.isRead),
      isStarred: msgs.some(m => m.isStarred),
      labels: [...new Set(msgs.flatMap(m => m.labels))],
      participants: Array.from(participants.values()),
      provider: 'microsoft',
    };
  });

  return {
    threads,
    nextSkip: messages.length === maxResults ? skip + maxResults : undefined,
  };
}

export async function fetchOutlookMessage(
  accessToken: string,
  accountId: string,
  messageId: string
): Promise<Email> {
  const client = getGraphClient(accessToken);
  const msg = await client.api(`/me/messages/${messageId}`)
    .select('id,conversationId,subject,body,bodyPreview,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,flag,categories,hasAttachments,attachments')
    .expand('attachments')
    .get();

  return parseGraphMessage(msg, accountId);
}

export async function fetchOutlookThread(
  accessToken: string,
  accountId: string,
  conversationId: string
): Promise<EmailThread> {
  const client = getGraphClient(accessToken);
  const response = await client.api('/me/messages')
    .filter(`conversationId eq '${conversationId}'`)
    .orderby('receivedDateTime asc')
    .select('id,conversationId,subject,body,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,flag,categories,hasAttachments')
    .top(100)
    .get();

  const messages: Email[] = (response.value || []).map((msg: any) => parseGraphMessage(msg, accountId));
  const lastMessage = messages[messages.length - 1];
  const participants = new Map<string, EmailAddress>();
  messages.forEach((m) => {
    if (m.from.email) participants.set(m.from.email, m.from);
    m.to.forEach(addr => { if (addr.email) participants.set(addr.email, addr); });
  });

  return {
    id: conversationId,
    accountId,
    messages,
    subject: lastMessage?.subject || '(no subject)',
    snippet: lastMessage?.snippet || '',
    lastMessageDate: lastMessage?.date || new Date().toISOString(),
    isRead: messages.every(m => m.isRead),
    isStarred: messages.some(m => m.isStarred),
    labels: [...new Set(messages.flatMap(m => m.labels))],
    participants: Array.from(participants.values()),
    provider: 'microsoft',
  };
}

export async function sendOutlookMessage(
  accessToken: string,
  to: string[],
  subject: string,
  body: string,
  cc?: string[],
  bcc?: string[],
  replyToId?: string
): Promise<string> {
  const client = getGraphClient(accessToken);

  if (replyToId) {
    const response = await client.api(`/me/messages/${replyToId}/reply`).post({
      message: {
        body: { contentType: 'HTML', content: body },
      },
    });
    return response?.id || replyToId;
  }

  const message = {
    subject,
    body: { contentType: 'HTML', content: body },
    toRecipients: to.map(email => ({ emailAddress: { address: email } })),
    ccRecipients: cc?.map(email => ({ emailAddress: { address: email } })) || [],
    bccRecipients: bcc?.map(email => ({ emailAddress: { address: email } })) || [],
  };

  const response = await client.api('/me/sendMail').post({ message, saveToSentItems: true });
  return response?.id || 'sent';
}

export async function modifyOutlookMessage(
  accessToken: string,
  messageId: string,
  updates: { isRead?: boolean; flag?: { flagStatus: string }; categories?: string[] }
): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/me/messages/${messageId}`).patch(updates);
}

export async function trashOutlookMessage(accessToken: string, messageId: string): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/me/messages/${messageId}/move`).post({
    destinationId: 'deleteditems',
  });
}
