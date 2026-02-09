import { DateTime } from "luxon";

export type ICalInput = {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  uid?: string;
  domain?: string;
};

/**
 * Escape special characters for iCal (RFC 5545) text values.
 * - Backslash, comma, semicolon are escaped with backslash
 * - Newlines are converted to literal \n
 */
const escapeText = (str: string): string =>
  str.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");

/**
 * Format a Date as iCal local timestamp (TZID=timezone:YYYYMMDDTHHMMSS).
 */
const toCalDav = (date: Date): string => {
  // Output time in Europe/Helsinki timezone
  return DateTime.fromJSDate(date)
    .setZone("Europe/Helsinki")
    .toFormat("yyyyMMdd'T'HHmmss");
};

/**
 * Generate an iCal formatted string from the given input.
 *
 * @param input object containing event details
 * @returns iCal formatted string
 *
 */

const generateICal = (input: ICalInput): string => {
  const {
    title,
    start,
    end,
    description,
    location,
    uid,
    domain = "example-domain.com",
  } = input;

  const finalUid = uid || `${crypto.randomUUID()}@${domain}`;
  const now = toCalDav(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Standardized ICal Lib//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Helsinki",
    "BEGIN:STANDARD",
    "DTSTART:20241027T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0200",
    "TZNAME:EET",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:20240331T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0300",
    "TZNAME:EEST",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${finalUid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Helsinki:${toCalDav(start)}`,
    `DTEND;TZID=Europe/Helsinki:${toCalDav(end)}`,
    `SUMMARY:${escapeText(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`);
  }
  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`);
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  // Join with CRLF as required by RFC 5545
  return lines.join("\r\n");
};

export { generateICal };
