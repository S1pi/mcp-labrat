# MCP Calendar Lab - AI Coding Guidelines

## Architecture Overview

This is an Express.js application implementing a voice-controlled calendar assistant using the Model Context Protocol (MCP):

- **MCP Server** (`/api/v1/mcp`): Exposes calendar tools backed by CalDAV (tsdav library)
- **MCP Client** (`/api/v1/client`): Calls OpenAI-compatible API with MCP tools for natural language processing
- **Frontend** (`/public`): Records audio, transcribes via Whisper API, sends prompts to MCP client
- **CalDAV Backend**: Uses Radicale server for development (localhost:5232)

## Key Components

### Calendar Tools (MCP Server)

- `createEvent`: Creates events with title, start/end times, description, location
- `listEvents`: Lists all calendar events
- `listEventsByRange`: Lists events within date range

### Date/Time Handling

- **Timezone**: All dates in `Europe/Helsinki` (use Luxon `DateTime.setZone("Europe/Helsinki")`)
- **Format**: ISO 8601 datetime strings (`YYYY-MM-DDTHH:MM:SS`) for API inputs
- **Parsing**: ICS files parsed to JSON using custom `icsToJson()` utility
- **Generation**: Events created as iCal format using `generateICal()` utility

### Validation & Types

- Use Zod schemas for all tool inputs (defined in `src/mcp-server/index.ts`)
- Custom error class in `src/classes/CustomError.ts`
- TypeScript strict mode with path mapping (`@/*` → `src/*`)

## Development Workflow

### Local Setup

1. Install dependencies: `npm install`
2. Copy `.env-sample` to `.env` and configure:
   - `OPENAI_PROXY_URL`: Base URL for OpenAI-compatible API
   - `MCP_SERVER_URL`: `http://localhost:3000/api/v1/mcp`
   - `CALDAV_SERVER_URL`: `http://localhost:5232/` (Radicale)
3. Start Radicale CalDAV server (see README.md for platform-specific commands)
4. Run dev server: `npm run dev` (uses nodemon + ts-node + tsconfig-paths)
5. Build for production: `npm run build` (tsc + tsc-alias)
6. Test: `npm test` (Jest)

### Adding Calendar Tools

1. Define Zod schema in `src/mcp-server/index.ts`
2. Register tool with `mcpServer.registerTool(name, {title, description, inputSchema}, handler)`
3. Handler calls CalDAV functions from `src/calDav/calendarClient.ts`
4. Update MCP client system prompt if needed

### Frontend Integration

- Audio recording uses Web Audio API (`MediaRecorder`)
- Transcription via `/v1/audio/transcriptions` endpoint
- Results sent to `/api/v1/client` as JSON `{"prompt": "transcribed text"}`

## Code Patterns

### CalDAV Operations

```typescript
// Always get authenticated client first
const { client, calendar } = await getPrimaryCalendar();

// Create event
const eventUrl = await createEvent({
  start: new Date(),
  end: new Date(),
  title: "Meeting",
  description: "Discuss project",
  location: "Office",
});

// List events
const events = await listEvents();
const parsedEvents = events.map((e) => icsToJson(e.data));
```

### Date Handling

```typescript
// Parse user input to Helsinki time
const startDate = DateTime.fromISO(input.start, {
  zone: "Europe/Helsinki",
}).toJSDate();

// Format for iCal
const icalTime = DateTime.fromJSDate(date)
  .setZone("Europe/Helsinki")
  .toFormat("yyyyMMdd'T'HHmmss");
```

### Error Handling

```typescript
try {
  // operation
} catch (error) {
  next(new CustomError((error as Error).message, 500));
}
```

### Testing

- Integration tests in `tests/` use real CalDAV server
- Mock external APIs for unit tests
- Test calendar operations end-to-end

## File Structure Reference

- `src/mcp-server/index.ts`: Tool definitions and MCP server setup
- `src/mcp-client/index.ts`: OpenAI integration with tool calling
- `src/calDav/calendarClient.ts`: CalDAV operations (tsdav library)
- `src/utils/ical-lib.ts`: Generate iCal format from event data
- `src/utils/ics-to-json.ts`: Parse iCal to JSON objects
- `src/utils/fetchData.ts`: HTTP client for external APIs
- `public/main.js`: Frontend audio recording and API calls</content>
  <parameter name="filePath">c:\Users\miika_ikw8ntx\Desktop\Pääaine\uudet-teknologiat\mcp-lab-26\.github\copilot-instructions.md
