export type EmailProvider = 'google' | 'microsoft';

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: EmailProvider;
  accessToken: string;
  refreshToken: string;
  image?: string;
  color: string;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface Email {
  id: string;
  threadId: string;
  accountId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: EmailAttachment[];
  provider: EmailProvider;
}

export interface EmailThread {
  id: string;
  accountId: string;
  messages: Email[];
  subject: string;
  snippet: string;
  lastMessageDate: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  participants: EmailAddress[];
  provider: EmailProvider;
}

export interface ComposeEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  replyToId?: string;
  threadId?: string;
  accountId: string;
}

export type MailboxType = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash' | 'spam' | 'all';

export interface SearchFilters {
  query: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  dateAfter?: string;
  dateBefore?: string;
  label?: string;
}
