import { z } from "zod";
import { DateTime } from "luxon";
import {
  createEvent,
  getEventByUrl,
  listEvents,
  listEventsByDateRange,
} from "@/calDav/calendarClient";
import { icsToJson } from "@/utils/ics-to-json";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// tool schemas
const createEventInputSchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    .describe(
      "Start date and time of the event as ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS) in Europe/Helsinki timezone"
    ),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    .optional()
    .describe(
      "End date and time of the event as ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS) in Europe/Helsinki timezone. If not provided, defaults to one hour after start time"
    ),
  title: z.string().describe("Short title of the event"),
  description: z.string().optional().describe("Optional detailed description"),
  location: z.string().optional().describe("Optional location of the event"),
});

const listEventsByDateRangeInputSchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    .describe(
      "Start date and time of the range as ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS) in Europe/Helsinki timezone"
    ),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    .describe(
      "End date and time of the range as ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS) in Europe/Helsinki timezone"
    ),
});

// input types
type CreateEventInput = z.infer<typeof createEventInputSchema>;
type ListEventsByDateRangeInput = z.infer<
  typeof listEventsByDateRangeInputSchema
>;

const mcpServer = new McpServer({
  name: "calendar-server",
  version: "1.0.0",
});

mcpServer.registerTool(
  "createEvent",
  {
    title: "Create a new Calendar Event",
    description:
      "Creates a new event in the calendar with the provided details.",
    inputSchema: createEventInputSchema,
  },
  async (input: CreateEventInput) => {
    const { start, end, title, description, location } = input;
    const startDate = DateTime.fromISO(start, {
      zone: "Europe/Helsinki",
    }).toJSDate();
    const endDate = end
      ? DateTime.fromISO(end, { zone: "Europe/Helsinki" }).toJSDate()
      : new Date(startDate.getTime() + 60 * 60 * 1000);
    try {
      const eventUrl = await createEvent({
        start: startDate,
        end: endDate,
        title,
        description,
        location,
      });
      const newEvent = await getEventByUrl(eventUrl);
      const newEventObject = icsToJson(newEvent.data);
      if (!newEventObject[0].startDate || !newEventObject[0].endDate) {
        throw new Error("Event not created");
      }

      return {
        content: [
          {
            type: "text",
            text: `Event created successfully for "${title}" from ${newEventObject[0].startDate} to ${newEventObject[0].endDate}.`,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating event:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create event: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

mcpServer.registerTool(
  "listEvents",
  {
    title: "List Calendar Events",
    description:
      'Lists all events from CalDav calendar. Returns parsed event data including title, start/end times, location, and description as JSON. Example: [{"summary":"Meeting","startDate":"2024-10-01T10:00:00Z","endDate":"2024-10-01T11:00:00Z","location":"Office","description":"Discuss project status."}]',
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const rawEvents = await listEvents();
      const parsedEvents = rawEvents.map((event) => icsToJson(event.data));

      console.log("Eventit:", parsedEvents);

      return {
        content: [
          {
            type: "text",
            text: `Events retrieved successfully: ${JSON.stringify(parsedEvents)}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error listing events:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to list events: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

mcpServer.registerTool(
  "listEventsByRange",
  {
    title: "List Calendar Events by Date Range",
    description:
      'Lists events from CalDav calendar within the specified date range. Returns parsed event data including title, start/end times, location, and description as JSON. Example: [{"summary":"Meeting","startDate":"2024-10-01T10:00:00Z","endDate":"2024-10-01T11:00:00Z","location":"Office","description":"Discuss project status."}]',
    inputSchema: listEventsByDateRangeInputSchema,
  },
  async (input: ListEventsByDateRangeInput) => {
    const { start, end } = input;
    try {
      const startDate = DateTime.fromISO(start, {
        zone: "Europe/Helsinki",
      }).toJSDate();
      const endDate = DateTime.fromISO(end, {
        zone: "Europe/Helsinki",
      }).toJSDate();
      const rawEvents = await listEventsByDateRange(startDate, endDate);
      const parsedEvents = rawEvents.map((event) => icsToJson(event.data));

      console.log("Events by date range:", parsedEvents);

      return {
        content: [
          {
            type: "text",
            text: `Events retrieved successfully for range ${start} to ${end}: ${JSON.stringify(parsedEvents)}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error listing events by date range:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to list events by date range: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

export { mcpServer };
