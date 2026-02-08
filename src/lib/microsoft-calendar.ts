import { Client } from '@microsoft/microsoft-graph-client';
import { CalendarEvent, CalendarInfo, CalendarAttendee } from '@/types';

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

const RESPONSE_MAP: Record<string, CalendarAttendee['status']> = {
  accepted: 'accepted',
  declined: 'declined',
  tentativelyAccepted: 'tentative',
  notResponded: 'needsAction',
  none: 'needsAction',
};

function parseAttendee(a: any): CalendarAttendee {
  return {
    email: a.emailAddress?.address || '',
    name: a.emailAddress?.name || undefined,
    status: RESPONSE_MAP[a.status?.response] || 'needsAction',
    organizer: false,
  };
}

function parseEvent(event: any, accountId: string, calendarId: string): CalendarEvent {
  const allDay = event.isAllDay || false;
  const start = allDay
    ? event.start?.dateTime?.split('T')[0] || event.start?.dateTime || ''
    : event.start?.dateTime || '';
  const end = allDay
    ? event.end?.dateTime?.split('T')[0] || event.end?.dateTime || ''
    : event.end?.dateTime || '';

  const attendees: CalendarAttendee[] = (event.attendees || []).map(parseAttendee);

  const organizer: CalendarAttendee | undefined = event.organizer
    ? {
        email: event.organizer.emailAddress?.address || '',
        name: event.organizer.emailAddress?.name || undefined,
        status: 'accepted',
        organizer: true,
      }
    : undefined;

  // Extract online meeting link
  let conferenceLink: string | undefined;
  if (event.onlineMeeting?.joinUrl) {
    conferenceLink = event.onlineMeeting.joinUrl;
  } else if (event.onlineMeetingUrl) {
    conferenceLink = event.onlineMeetingUrl;
  }

  const statusMap: Record<string, CalendarEvent['status']> = {
    free: 'confirmed',
    busy: 'confirmed',
    tentative: 'tentative',
    oof: 'confirmed',
    workingElsewhere: 'confirmed',
    unknown: 'confirmed',
  };

  return {
    id: event.id,
    accountId,
    calendarId,
    title: event.subject || '(No title)',
    description: event.body?.content || '',
    location: event.location?.displayName || undefined,
    start,
    end,
    allDay,
    recurring: !!event.seriesMasterId,
    recurrenceRule: event.recurrence ? JSON.stringify(event.recurrence) : undefined,
    status: event.isCancelled ? 'cancelled' : (statusMap[event.showAs] || 'confirmed'),
    attendees,
    organizer,
    htmlLink: event.webLink,
    conferenceLink,
    provider: 'microsoft',
  };
}

export async function fetchOutlookCalendars(
  accessToken: string,
  accountId: string
): Promise<CalendarInfo[]> {
  const client = getGraphClient(accessToken);

  const response = await client.api('/me/calendars')
    .select('id,name,color,isDefaultCalendar,canEdit')
    .get();

  const OUTLOOK_COLORS: Record<string, string> = {
    auto: '#0078d4',
    lightBlue: '#71afe5',
    lightGreen: '#7ed321',
    lightOrange: '#f5a623',
    lightGray: '#a0a0a0',
    lightYellow: '#f8e71c',
    lightTeal: '#50e3c2',
    lightPink: '#ff6b81',
    lightBrown: '#8b572a',
    lightRed: '#d0021b',
    maxColor: '#0078d4',
  };

  return (response.value || []).map((cal: any) => ({
    id: cal.id,
    accountId,
    name: cal.name || 'Unnamed Calendar',
    color: OUTLOOK_COLORS[cal.color] || '#0078d4',
    primary: cal.isDefaultCalendar || false,
    visible: true,
    provider: 'microsoft' as const,
  }));
}

export async function fetchOutlookEvents(
  accessToken: string,
  accountId: string,
  timeMin: string,
  timeMax: string,
  calendarId?: string
): Promise<CalendarEvent[]> {
  const client = getGraphClient(accessToken);

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/calendarView`
    : '/me/calendarView';

  const response = await client.api(endpoint)
    .query({
      startDateTime: timeMin,
      endDateTime: timeMax,
    })
    .select('id,subject,body,start,end,location,attendees,organizer,isAllDay,isCancelled,showAs,onlineMeeting,onlineMeetingUrl,webLink,seriesMasterId,recurrence')
    .orderby('start/dateTime')
    .top(250)
    .get();

  return (response.value || []).map((event: any) =>
    parseEvent(event, accountId, calendarId || 'default')
  );
}

export async function fetchOutlookEvent(
  accessToken: string,
  accountId: string,
  eventId: string
): Promise<CalendarEvent> {
  const client = getGraphClient(accessToken);
  const event = await client.api(`/me/events/${eventId}`)
    .select('id,subject,body,start,end,location,attendees,organizer,isAllDay,isCancelled,showAs,onlineMeeting,onlineMeetingUrl,webLink,seriesMasterId,recurrence')
    .get();

  return parseEvent(event, accountId, 'default');
}

export async function createOutlookEvent(
  accessToken: string,
  calendarId: string | undefined,
  title: string,
  start: string,
  end: string,
  options: {
    description?: string;
    location?: string;
    attendees?: string[];
    allDay?: boolean;
  } = {}
): Promise<string> {
  const client = getGraphClient(accessToken);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const event: any = {
    subject: title,
    body: options.description
      ? { contentType: 'HTML', content: options.description }
      : undefined,
    start: {
      dateTime: start,
      timeZone: tz,
    },
    end: {
      dateTime: end,
      timeZone: tz,
    },
    isAllDay: options.allDay || false,
    attendees: options.attendees?.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    })),
  };

  if (options.location) {
    event.location = { displayName: options.location };
  }

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/events`
    : '/me/events';

  const response = await client.api(endpoint).post(event);
  return response.id;
}

export async function updateOutlookEvent(
  accessToken: string,
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    location?: string;
    start?: string;
    end?: string;
    allDay?: boolean;
  }
): Promise<void> {
  const client = getGraphClient(accessToken);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const patch: any = {};
  if (updates.title !== undefined) patch.subject = updates.title;
  if (updates.description !== undefined) {
    patch.body = { contentType: 'HTML', content: updates.description };
  }
  if (updates.location !== undefined) {
    patch.location = { displayName: updates.location };
  }
  if (updates.start) {
    patch.start = { dateTime: updates.start, timeZone: tz };
  }
  if (updates.end) {
    patch.end = { dateTime: updates.end, timeZone: tz };
  }
  if (updates.allDay !== undefined) {
    patch.isAllDay = updates.allDay;
  }

  await client.api(`/me/events/${eventId}`).patch(patch);
}

export async function deleteOutlookEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const client = getGraphClient(accessToken);
  await client.api(`/me/events/${eventId}`).delete();
}

export async function respondToOutlookEvent(
  accessToken: string,
  eventId: string,
  response: 'accepted' | 'declined' | 'tentative'
): Promise<void> {
  const client = getGraphClient(accessToken);
  const endpoint = `/me/events/${eventId}/${response === 'accepted' ? 'accept' : response === 'declined' ? 'decline' : 'tentativelyAccept'}`;
  await client.api(endpoint).post({ sendResponse: true });
}
