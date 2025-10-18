import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json();

    // Check if Google Calendar is configured
    const hasGoogleCreds = process.env.GOOGLE_OAUTH_CREDENTIALS || process.env.GOOGLE_CALENDAR_CREDENTIALS;
    
    if (!hasGoogleCreds) {
      return Response.json({
        success: false,
        message: "Google Calendar is not configured. To enable:\n1. Create OAuth credentials at https://console.cloud.google.com\n2. Set GOOGLE_OAUTH_CREDENTIALS in .env.local\n3. Install: npm install @modelcontextprotocol/sdk @cocal/google-calendar-mcp"
      }, { status: 400 });
    }
    
    try {
      // Dynamic import of Google Calendar MCP
      const { GoogleCalendarMCP } = await import("../../../calendar/src/calendarMcpClient.js");
      
      const gcal = new GoogleCalendarMCP(
        process.env.GOOGLE_OAUTH_CREDENTIALS || process.env.GOOGLE_CALENDAR_CREDENTIALS!
      );
      
      await gcal.connect();
      
      const result = await gcal.createEvent({
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.start_time,
          timeZone: eventData.time_zone || "America/Denver"
        },
        end: {
          dateTime: eventData.end_time,
          timeZone: eventData.time_zone || "America/Denver"
        },
        location: eventData.location,
      });
      
      await gcal.close();
      
      return Response.json({
        success: true,
        event: result,
        message: "Calendar event created successfully"
      });
    } catch (error: any) {
      console.error("Calendar error:", error);
      return Response.json({
        success: false,
        error: error.message,
        message: "Failed to create calendar event. Make sure Google Calendar MCP is properly configured."
      }, { status: 500 });
    }
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

