// src/calendarMcpClient.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

type CreateEventInput = {
  calendarId?: string; // default primary if server supports it
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: { email: string }[];
  recurrence?: string[]; // e.g. ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE"]
};

export class GoogleCalendarMCP {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(
    private credsPath: string, // path to gcp-oauth.keys.json
    private command: string = "npx",
    private args: string[] = ["@cocal/google-calendar-mcp"] // server package
  ) {}

  async connect() {
    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      env: {
        ...process.env,
        GOOGLE_OAUTH_CREDENTIALS: this.credsPath,
      },
    });

    this.client = new Client(
      { name: "calendar-mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await this.client.connect(this.transport);

    // Verify expected calendar tools are available
    const tools = await this.client.request(
      { method: "tools/list" },
      ListToolsResultSchema
    );
    const names = tools.tools.map((t: any) => t.name);
    const expected = [
      "list-events",
      "create-event",
      "delete-event",
      "get-freebusy",
    ];
    const missing = expected.filter((t) => !names.includes(t));
    if (missing.length) {
      throw new Error(
        `Missing tools: ${missing.join(", ")}. Available: ${names.join(", ")}`
      );
    }
  }

  async listEvents(params: {
    calendarIds?: string[]; // some servers support multi-calendar
    timeMin?: string; // ISO
    timeMax?: string; // ISO
    query?: string;
  }) {
    const result = await this.client!.request(
      {
        method: "tools/call",
        params: {
          name: "list-events",
          arguments: params,
        },
      },
      CallToolResultSchema
    );
    return result.content;
  }

  async createEvent(input: CreateEventInput) {
    const result = await this.client!.request(
      {
        method: "tools/call",
        params: {
          name: "create-event",
          arguments: input,
        },
      },
      CallToolResultSchema
    );
    return result.content; // expect event payload incl. id
  }

  async deleteEvent(params: { calendarId?: string; eventId: string }) {
    const result = await this.client!.request(
      {
        method: "tools/call",
        params: {
          name: "delete-event",
          arguments: params,
        },
      },
      CallToolResultSchema
    );
    return result.content;
  }

  async listAvailableTools() {
    const tools = await this.client!.request(
      { method: "tools/list" },
      ListToolsResultSchema
    );
    return tools.tools; // full tool metadata (name, description, input schema)
  }

  async callTool<T = unknown>(name: string, args?: unknown): Promise<T> {
    const result = await this.client!.request(
      {
        method: "tools/call",
        params: { name, arguments: args ?? {} },
      },
      CallToolResultSchema
    );
    return result.content as T;
  }

  async getFreeBusy(params: {
    calendarIds: string[];
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  }) {
    const result = await this.client!.request(
      {
        method: "tools/call",
        params: { name: "get-freebusy", arguments: params },
      },
      CallToolResultSchema
    );
    return result.content;
  }

  async close() {
    if (this.transport) await this.transport.close();
  }
}

// Small demo CLI (optional)
if (require.main === module) {
  (async () => {
    const creds = process.argv[2] || "/secure/keys/gcp-oauth.keys.json";
    const gcal = new GoogleCalendarMCP(creds);
    await gcal.connect();

    // Create an event
    const created = await gcal.createEvent({
      summary: "MCP test meeting",
      start: { dateTime: "2025-10-20T15:00:00-06:00", timeZone: "America/Denver" },
      end: { dateTime: "2025-10-20T15:30:00-06:00", timeZone: "America/Denver" },
      description: "Created via MCP client",
    });
    console.log("Created:", created);

    // List this week
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const listed = await gcal.listEvents({
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
    });
    console.log("Events:", listed);

    // If you want to delete, pass returned eventId:
    // await gcal.deleteEvent({ eventId: "<id from created>" });

    await gcal.close();
  })().catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
}
