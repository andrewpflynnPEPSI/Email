import { formatDistanceToNowStrict, format, isToday, isYesterday, isThisYear } from 'date-fns';

export function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisYear(date)) {
    return format(date, 'MMM d');
  }
  return format(date, 'MMM d, yyyy');
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: true });
}

export function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
  }
  if (email) {
    return email[0]?.toUpperCase() || '?';
  }
  return '?';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '\u2026';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeHtml(html: string): string {
  // Remove script/style/iframe/object/embed tags and their contents
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Sanitize href/src to block javascript: protocol
  clean = clean.replace(/(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (match, attr, dblVal, sglVal) => {
    const val = (dblVal || sglVal || '').trim().toLowerCase();
    if (val.startsWith('javascript:') || val.startsWith('data:text/html') || val.startsWith('vbscript:')) {
      return `${attr}="#"`;
    }
    return match;
  });

  // Force links to open in new tab safely
  clean = clean.replace(/<a\s/gi, '<a rel="noopener noreferrer" target="_blank" ');

  return clean;
}
