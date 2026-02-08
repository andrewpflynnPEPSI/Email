import { google } from 'googleapis';
import { CalendarEvent, CalendarInfo, CalendarAttendee } from '@/types';

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

function parseAttendee(a: any): CalendarAttendee {
  return {
    email: a.email || '',
    name: a.displayName || undefined,
    status: a.responseStatus || 'needsAction',
    organizer: a.organizer || false,
  };
}

function parseEvent(event: any, accountId: string, calendarId: string): CalendarEvent {
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';
  const allDay = !event.start?.dateTime;

  const attendees: CalendarAttendee[] = (event.attendees || []).map(parseAttendee);
  const organizer: CalendarAttendee | undefined = event.organizer
    ? { email: event.organizer.email, name: event.organizer.displayName, status: 'accepted', organizer: true }
    : undefined;

  // Extract conference link (Google Meet, Zoom, etc.)
  let conferenceLink: string | undefined;
  if (event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find((e: any) => e.entryPointType === 'video');
    conferenceLink = videoEntry?.uri;
  }
  if (!conferenceLink && event.hangoutLink) {
    conferenceLink = event.hangoutLink;
  }

  return {
    id: event.id,
    accountId,
    calendarId,
    title: event.summary || '(No title)',
    description: event.description || '',
    location: event.location || undefined,
    start,
    end,
    allDay,
    recurring: !!event.recurringEventId,
    recurrenceRule: event.recurrence?.[0],
    status: event.status || 'confirmed',
    attendees,
    organizer,
    htmlLink: event.htmlLink,
    conferenceLink,
    color: event.colorId ? `google-color-${event.colorId}` : undefined,
    provider: 'google',
  };
}

export async function fetchGoogleCalendars(
  accessToken: string,
  accountId: string
): Promise<CalendarInfo[]> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list({ minAccessRole: 'reader' });
  const items = response.data.items || [];

  return items.map((cal) => ({
    id: cal.id!,
    accountId,
    name: cal.summary || 'Unnamed Calendar',
    color: cal.backgroundColor || '#4285f4',
    primary: cal.primary || false,
    visible: true,
    provider: 'google' as const,
  }));
}

export async function fetchGoogleEvents(
  accessToken: string,
  accountId: string,
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return (response.data.items || []).map((event) =>
    parseEvent(event, accountId, calendarId)
  );
}

export async function fetchGoogleEvent(
  accessToken: string,
  accountId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.events.get({
    calendarId,
    eventId,
  });
  return parseEvent(response.data, accountId, calendarId);
}

export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
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
  const calendar = getCalendarClient(accessToken);

  const startObj = options.allDay
    ? { date: start.split('T')[0] }
    : { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };

  const endObj = options.allDay
    ? { date: end.split('T')[0] }
    : { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      description: options.description,
      location: options.location,
      start: startObj,
      end: endObj,
      attendees: options.attendees?.map(email => ({ email })),
    },
  });

  return response.data.id!;
}

export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
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
  const calendar = getCalendarClient(accessToken);

  const requestBody: any = {};
  if (updates.title !== undefined) requestBody.summary = updates.title;
  if (updates.description !== undefined) requestBody.description = updates.description;
  if (updates.location !== undefined) requestBody.location = updates.location;

  if (updates.start) {
    requestBody.start = updates.allDay
      ? { date: updates.start.split('T')[0] }
      : { dateTime: updates.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }
  if (updates.end) {
    requestBody.end = updates.allDay
      ? { date: updates.end.split('T')[0] }
      : { dateTime: updates.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody,
  });
}

export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({ calendarId, eventId });
}

export async function respondToGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  response: 'accepted' | 'declined' | 'tentative',
  email: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken);

  const event = await calendar.events.get({ calendarId, eventId });
  const attendees = (event.data.attendees || []).map((a) => {
    if (a.email === email) {
      return { ...a, responseStatus: response };
    }
    return a;
  });

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: { attendees },
  });
}
