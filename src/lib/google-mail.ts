import { google } from 'googleapis';
import { Email, EmailThread, MailboxType, EmailAddress, EmailAttachment } from '@/types';

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

const LABEL_MAP: Record<MailboxType, string> = {
  inbox: 'INBOX',
  starred: 'STARRED',
  sent: 'SENT',
  drafts: 'DRAFT',
  trash: 'TRASH',
  spam: 'SPAM',
  all: '',
};

function parseEmailAddress(raw: string): EmailAddress {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBody(body: { data?: string }): string {
  if (!body?.data) return '';
  return Buffer.from(body.data, 'base64url').toString('utf-8');
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBody(payload.body);
  }
  if (payload.parts) {
    // Prefer HTML, fall back to plain text
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart) return extractBody(htmlPart);
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart) return extractBody(textPart);
    // Recurse into multipart
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith('multipart/')) {
        const result = extractBody(part);
        if (result) return result;
      }
    }
  }
  return '';
}

function extractAttachments(payload: any): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }
      if (part.parts) {
        attachments.push(...extractAttachments(part));
      }
    }
  }
  return attachments;
}

function parseMessage(msg: any, accountId: string): Email {
  const headers = msg.payload?.headers || [];
  const from = parseEmailAddress(getHeader(headers, 'From'));
  const toRaw = getHeader(headers, 'To');
  const ccRaw = getHeader(headers, 'Cc');
  const to = toRaw ? toRaw.split(',').map((s: string) => parseEmailAddress(s)) : [];
  const cc = ccRaw ? ccRaw.split(',').map((s: string) => parseEmailAddress(s)) : [];
  const labels = msg.labelIds || [];

  return {
    id: msg.id,
    threadId: msg.threadId,
    accountId,
    from,
    to,
    cc,
    subject: getHeader(headers, 'Subject') || '(no subject)',
    snippet: msg.snippet || '',
    body: extractBody(msg.payload || {}),
    date: getHeader(headers, 'Date') || new Date(parseInt(msg.internalDate)).toISOString(),
    isRead: !labels.includes('UNREAD'),
    isStarred: labels.includes('STARRED'),
    labels,
    attachments: extractAttachments(msg.payload || {}),
    provider: 'google',
  };
}

export async function fetchGmailThreads(
  accessToken: string,
  accountId: string,
  mailbox: MailboxType = 'inbox',
  maxResults: number = 50,
  pageToken?: string,
  query?: string
): Promise<{ threads: EmailThread[]; nextPageToken?: string }> {
  const gmail = getGmailClient(accessToken);

  const labelIds = LABEL_MAP[mailbox] ? [LABEL_MAP[mailbox]] : undefined;
  const q = query || undefined;

  const listResponse = await gmail.users.threads.list({
    userId: 'me',
    labelIds,
    maxResults,
    pageToken,
    q,
  });

  const threadIds = listResponse.data.threads || [];
  const nextPageToken = listResponse.data.nextPageToken || undefined;

  const threads: EmailThread[] = await Promise.all(
    threadIds.map(async (t) => {
      const threadResponse = await gmail.users.threads.get({
        userId: 'me',
        id: t.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Cc', 'Subject', 'Date'],
      });

      const messages = (threadResponse.data.messages || []).map(msg => parseMessage(msg, accountId));
      const lastMessage = messages[messages.length - 1];
      const participants = new Map<string, EmailAddress>();
      messages.forEach(m => {
        participants.set(m.from.email, m.from);
        m.to.forEach(addr => participants.set(addr.email, addr));
      });

      return {
        id: t.id!,
        accountId,
        messages,
        subject: lastMessage?.subject || '(no subject)',
        snippet: lastMessage?.snippet || '',
        lastMessageDate: lastMessage?.date || new Date().toISOString(),
        isRead: messages.every(m => m.isRead),
        isStarred: messages.some(m => m.isStarred),
        labels: [...new Set(messages.flatMap(m => m.labels))],
        participants: Array.from(participants.values()),
        provider: 'google',
      };
    })
  );

  return { threads, nextPageToken };
}

export async function fetchGmailMessage(
  accessToken: string,
  accountId: string,
  messageId: string
): Promise<Email> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return parseMessage(response.data, accountId);
}

export async function fetchGmailThread(
  accessToken: string,
  accountId: string,
  threadId: string
): Promise<EmailThread> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const messages = (response.data.messages || []).map(msg => parseMessage(msg, accountId));
  const lastMessage = messages[messages.length - 1];
  const participants = new Map<string, EmailAddress>();
  messages.forEach(m => {
    participants.set(m.from.email, m.from);
    m.to.forEach(addr => participants.set(addr.email, addr));
  });

  return {
    id: threadId,
    accountId,
    messages,
    subject: lastMessage?.subject || '(no subject)',
    snippet: lastMessage?.snippet || '',
    lastMessageDate: lastMessage?.date || new Date().toISOString(),
    isRead: messages.every(m => m.isRead),
    isStarred: messages.some(m => m.isStarred),
    labels: [...new Set(messages.flatMap(m => m.labels))],
    participants: Array.from(participants.values()),
    provider: 'google',
  };
}

export async function sendGmailMessage(
  accessToken: string,
  to: string[],
  subject: string,
  body: string,
  cc?: string[],
  bcc?: string[],
  threadId?: string,
  replyToId?: string
): Promise<string> {
  const gmail = getGmailClient(accessToken);

  let headers = `To: ${to.join(', ')}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n`;
  if (cc?.length) headers += `Cc: ${cc.join(', ')}\n`;
  if (bcc?.length) headers += `Bcc: ${bcc.join(', ')}\n`;
  if (replyToId) headers += `In-Reply-To: ${replyToId}\nReferences: ${replyToId}\n`;

  const raw = Buffer.from(`${headers}\n${body}`).toString('base64url');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  });

  return response.data.id!;
}

export async function modifyGmailMessage(
  accessToken: string,
  messageId: string,
  addLabels?: string[],
  removeLabels?: string[]
): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: addLabels,
      removeLabelIds: removeLabels,
    },
  });
}

export async function trashGmailMessage(accessToken: string, messageId: string): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.trash({ userId: 'me', id: messageId });
}
