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

// Calendar Types
export type AppView = 'mail' | 'calendar';
export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  organizer?: boolean;
}

export interface CalendarEvent {
  id: string;
  accountId: string;
  calendarId: string;
  title: string;
  description: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  recurring: boolean;
  recurrenceRule?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees: CalendarAttendee[];
  organizer?: CalendarAttendee;
  htmlLink?: string;
  conferenceLink?: string;
  color?: string;
  provider: EmailProvider;
}

export interface CalendarInfo {
  id: string;
  accountId: string;
  name: string;
  color: string;
  primary: boolean;
  visible: boolean;
  provider: EmailProvider;
}

export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  attendees?: string[];
  calendarId?: string;
  accountId: string;
}

// Calendar Sync Types (OneCal-style)
export type SyncDirection = 'one-way' | 'two-way';
export type SyncPrivacyLevel = 'full' | 'title-only' | 'busy-only';
export type SyncRuleStatus = 'active' | 'paused' | 'error';

export interface SyncRule {
  id: string;
  name: string;
  sourceCalendarId: string;
  sourceAccountId: string;
  destinationCalendarId: string;
  destinationAccountId: string;
  direction: SyncDirection;
  privacyLevel: SyncPrivacyLevel;
  blockerTitle: string; // Template: "Busy", "Blocked", or "{title}" for full copy
  syncFrequencyMinutes: number;
  status: SyncRuleStatus;
  createdAt: string;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface SyncedEvent {
  id: string;
  syncRuleId: string;
  sourceEventId: string;
  sourceCalendarId: string;
  sourceAccountId: string;
  destinationEventId: string;
  destinationCalendarId: string;
  destinationAccountId: string;
  lastSyncedAt: string;
  sourceHash: string; // Hash of source event data to detect changes
}

export interface SyncLogEntry {
  id: string;
  syncRuleId: string;
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'skipped' | 'error';
  sourceEventTitle: string;
  details: string;
}

export interface SyncJob {
  id: string;
  syncRuleId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}
