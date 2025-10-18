import OpenAI from "openai";
import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: "function" as const,
    function: {
      name: "query_events",
      description: "Query events from the BYU events API based on filters.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          category: { type: "array", items: { type: "number" }, description: "Event category IDs" },
          price: { type: "number", description: "Price filter" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_category_event_counts",
      description: "Get a list of the number of events by event category name and ID.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          price: { type: "number", description: "Price filter" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_event_categories",
      description: "Get a list of all event categories with their names and IDs.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_teacher_ratings",
      description: "Get ratings for BYU teachers. Optionally filter by teacher name.",
      parameters: {
        type: "object",
        properties: {
          teacher_name: { type: "string", description: "Teacher's first or last name" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_assignments",
      description: "Get current assignments for courses. Optionally filter by course code.",
      parameters: {
        type: "object",
        properties: {
          course: { type: "string", description: "Course code (e.g., 'MATH 320')" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_courses",
      description: "Search BYU courses by course code, title, or instructor name. Returns course details including sections, times, and locations.",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string", description: "Course code to search (e.g., 'A HTG 100', 'MATH')" },
          instructor: { type: "string", description: "Instructor name to filter by" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_calendar_event",
      description: "Create a new event in Google Calendar. Dates should be in ISO 8601 format (e.g., 2025-10-18T15:00:00-06:00).",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Event title/summary" },
          description: { type: "string", description: "Event description" },
          start_time: { type: "string", description: "Start date/time in ISO 8601 format" },
          end_time: { type: "string", description: "End date/time in ISO 8601 format" },
          location: { type: "string", description: "Event location" },
          time_zone: { type: "string", description: "Time zone (e.g., 'America/Denver'). Default: America/Denver" },
        },
        required: ["summary", "start_time", "end_time"],
      },
    },
  },
];

function appendParam(url: URL, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== null && String(value) !== "") {
    url.searchParams.append(key, String(value));
  }
}

async function callTool(name: string, args: any) {
  switch (name) {
    case "query_events": {
      const { start_date, end_date, category, price } = args;
      const base = "https://calendar.byu.edu/api/Events.json";
      const url = new URL(base);
      if (category && category.length > 0) {
        url.searchParams.set("categories", category.map(String).join("+"));
      } else {
        url.searchParams.set("categories", "all");
      }
      appendParam(url, "event[min][date]", start_date);
      appendParam(url, "event[max][date]", end_date);
      if (price !== undefined) appendParam(url, "price", price);
      
      const res = await fetch(url.toString());
      return await res.json();
    }
    
    case "get_category_event_counts": {
      const { start_date, end_date, price } = args;
      const base = "https://calendar.byu.edu/api/AllCategoryCounts.json";
      const url = new URL(base);
      appendParam(url, "event[min][date]", start_date);
      appendParam(url, "event[max][date]", end_date);
      if (price !== undefined) appendParam(url, "price", price);
      
      const res = await fetch(url.toString());
      return await res.json();
    }
    
    case "get_event_categories": {
      const res = await fetch("https://calendar.byu.edu/api/AllCategories.json");
      return await res.json();
    }
    
    case "get_teacher_ratings": {
      const dataPath = join(process.cwd(), "data", "teacher_ratings.json");
      const data = JSON.parse(readFileSync(dataPath, "utf-8"));
      
      if (args.teacher_name) {
        const searchTerms = args.teacher_name.toLowerCase().split(/\s+/);
        return data.filter((t: any) => {
          const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
          return searchTerms.every((term: string) => fullName.includes(term));
        });
      }
      return data;
    }
    
    case "get_assignments": {
      const dataPath = join(process.cwd(), "data", "current_assignments.json");
      const data = JSON.parse(readFileSync(dataPath, "utf-8"));
      
      if (args.course) {
        const filtered = data.events.filter((e: any) => 
          e.course.toLowerCase().includes(args.course.toLowerCase())
        );
        return { ...data, events: filtered };
      }
      return data;
    }
    
    case "search_courses": {
      const dataPath = join(process.cwd(), "data", "courses.json");
      const data = JSON.parse(readFileSync(dataPath, "utf-8"));
      
      let filtered = data;
      
      if (args.course_code) {
        const search = args.course_code.toLowerCase();
        filtered = filtered.filter((c: any) => 
          c.course_name.toLowerCase().includes(search) ||
          c.full_title.toLowerCase().includes(search)
        );
      }
      
      if (args.instructor) {
        const search = args.instructor.toLowerCase();
        filtered = filtered.map((c: any) => ({
          ...c,
          sections: c.sections.filter((s: any) =>
            s.instructor_name.toLowerCase().includes(search)
          )
        })).filter((c: any) => c.sections.length > 0);
      }
      
      return filtered;
    }
    
    case "create_calendar_event": {
      // Check if Google Calendar is configured
      const hasGoogleCreds = process.env.GOOGLE_OAUTH_CREDENTIALS || process.env.GOOGLE_CALENDAR_CREDENTIALS;
      
      if (!hasGoogleCreds) {
        return {
          success: false,
          message: "Google Calendar is not configured. To enable:\n1. Create OAuth credentials at https://console.cloud.google.com\n2. Set GOOGLE_OAUTH_CREDENTIALS in .env.local\n3. Install: npm install @modelcontextprotocol/sdk @cocal/google-calendar-mcp"
        };
      }
      
      try {
        // Dynamic import of Google Calendar MCP
        const { GoogleCalendarMCP } = await import("../../../calendar/src/calendarMcpClient.js");
        
        const gcal = new GoogleCalendarMCP(
          process.env.GOOGLE_OAUTH_CREDENTIALS || process.env.GOOGLE_CALENDAR_CREDENTIALS!
        );
        
        await gcal.connect();
        
        const result = await gcal.createEvent({
          summary: args.summary,
          description: args.description,
          start: {
            dateTime: args.start_time,
            timeZone: args.time_zone || "America/Denver"
          },
          end: {
            dateTime: args.end_time,
            timeZone: args.time_zone || "America/Denver"
          },
          location: args.location,
        });
        
        await gcal.close();
        
        return {
          success: true,
          event: result,
          message: "Calendar event created successfully"
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: "Failed to create calendar event. Make sure Google Calendar MCP is properly configured."
        };
      }
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const systemMessage = {
      role: "system" as const,
      content: `You are a helpful assistant for BYU students. Today's date is October 18, 2025. When users ask about 'this week', use dates from October 18-24, 2025. Format dates as YYYY-MM-DD when calling tools.

IMPORTANT: When displaying event information from the query_events tool, format each event as an artifact using this EXACT HTML structure. You can add a friendly intro message before the artifacts, then list each event:

<div class="event-artifact" style="background: linear-gradient(to bottom right, #1F2937, #111827); border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid rgba(75, 85, 99, 0.3); backdrop-filter: blur(8px);">
  <div style="background: linear-gradient(to right, #2563EB, #1D4ED8); color: white; padding: 16px; border-radius: 12px 12px 0 0; margin: -20px -20px 16px -20px; font-weight: 600; font-size: 18px; letter-spacing: 0.025em; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">
    [EVENT TITLE]
  </div>
  <div style="margin-bottom: 16px;">
    <img src="[EVENT IMAGE URL]" alt="[EVENT TITLE]" style="width: 100%; height: 240px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);" />
  </div>
  <div style="color: #E5E7EB; font-size: 15px; line-height: 1.6; display: grid; gap: 12px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Date:</strong>
      <span>[EVENT DATE]</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Time:</strong>
      <span>[EVENT TIME]</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Location:</strong>
      <span>[EVENT LOCATION]</span>
    </div>
    <div style="display: flex; align-items: start; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Description:</strong>
      <span style="flex: 1;">[EVENT DESCRIPTION]</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Category:</strong>
      <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 4px 12px; border-radius: 9999px; font-size: 14px;">[EVENT CATEGORY]</span>
    </div>
  </div>
</div>

CRITICAL RULES:
1. ALL event information (especially the TITLE) must be INSIDE the event-artifact div
2. The title goes in the blue header div at the top of each artifact
3. Do NOT list event titles separately outside the artifacts
4. Each event should be its own complete self-contained artifact
5. Add friendly intro/outro text outside the artifacts, but never duplicate event titles outside`
    };

    const messagesWithSystem = [systemMessage, ...messages];

    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesWithSystem,
      tools,
    });

    let responseMessage = response.choices[0].message;

    while (responseMessage.tool_calls) {
      const toolCalls = responseMessage.tool_calls;
      const toolMessages = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await callTool(functionName, functionArgs);
        
        toolMessages.push({
          role: "tool" as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      messagesWithSystem.push(responseMessage);
      messagesWithSystem.push(...toolMessages);

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesWithSystem,
        tools,
      });

      responseMessage = response.choices[0].message;
    }

    // Process response content
    let processedContent = responseMessage.content || '';
    
    // The AI will now format events as HTML artifacts directly, so no additional processing needed
    // The event artifacts are already properly formatted in the response

    return Response.json({ 
      message: {
        ...responseMessage,
        content: processedContent
      }
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

