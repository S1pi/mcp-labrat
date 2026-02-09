// source: https://github.com/cwlsn/ics-to-json

import { DateTime } from 'luxon';

const NEW_LINE = /\r\n|\n|\r/;

const EVENT = 'VEVENT';
const EVENT_START = 'BEGIN';
const EVENT_END = 'END';
const START_DATE = 'DTSTART';
const END_DATE = 'DTEND';
const DESCRIPTION = 'DESCRIPTION';
const SUMMARY = 'SUMMARY';
const LOCATION = 'LOCATION';
const ALARM = 'VALARM';

const keyMap = {
  [START_DATE]: 'startDate',
  [END_DATE]: 'endDate',
  [DESCRIPTION]: 'description',
  [SUMMARY]: 'summary',
  [LOCATION]: 'location',
} as const;

type KeyMapKey = keyof typeof keyMap;

/** Represents a parsed ICS calendar event with known fields */
export interface ICSEvent {
  startDate?: string;
  endDate?: string;
  description?: string;
  summary?: string;
  location?: string;
  /** Allow additional fields that may be added in the future */
  [key: string]: string | undefined;
}

const iscToDateString = (icsDate: string): string => {
  return DateTime.fromFormat(icsDate, "yyyyMMdd'T'HHmmss").toISO() ?? '';
};

const clean = (string: string | undefined): string => {
  if (string == undefined) {
    return '';
  }
  // Wrap decodeURI in try/catch since ICS values aren't guaranteed to be URI-encoded
  try {
    return decodeURI(string).trim();
  } catch {
    return string.trim();
  }
};

const unfoldLines = (raw: string): string[] => {
  const lines = raw.split(NEW_LINE);
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith(' ') && result.length > 0) {
      result[result.length - 1] += line.slice(1);
    } else {
      result.push(line);
    }
  }

  return result;
};

const parseLine = (line: string): { parsedKey: string; value: string } => {
  const colonIndex = line.indexOf(':');
  const key = colonIndex === -1 ? line : line.slice(0, colonIndex);
  const value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);

  const semicolonIndex = key.indexOf(';');
  const parsedKey = semicolonIndex === -1 ? key : key.slice(0, semicolonIndex);

  return { parsedKey, value };
};

export const icsToJson = (icsData: string): ICSEvent[] => {
  const array: ICSEvent[] = [];
  let currentObj: ICSEvent = {};
  let isAlarm = false;

  const lines = unfoldLines(icsData);

  for (const line of lines) {
    const { parsedKey, value } = parseLine(line);

    switch (parsedKey) {
      case EVENT_START:
        if (value === EVENT) {
          currentObj = {};
        } else if (value === ALARM) {
          isAlarm = true;
        }
        continue;
      case EVENT_END:
        isAlarm = false;
        if (value === EVENT) array.push(currentObj);
        continue;
    }

    if (!(parsedKey in keyMap)) {
      continue;
    }

    if (parsedKey === DESCRIPTION && isAlarm) {
      continue;
    }

    const prop = keyMap[parsedKey as KeyMapKey];
    const shouldClean =
      parsedKey === DESCRIPTION ||
      parsedKey === SUMMARY ||
      parsedKey === LOCATION;

    const shouldFormatDate = parsedKey === START_DATE || parsedKey === END_DATE;

    currentObj[prop] = shouldClean
      ? clean(value)
      : shouldFormatDate
        ? iscToDateString(value)
        : value;
  }
  return array;
};
