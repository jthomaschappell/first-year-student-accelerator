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
        const search = args.teacher_name.toLowerCase();
        return data.filter((t: any) => 
          t.firstName.toLowerCase().includes(search) || 
          t.lastName.toLowerCase().includes(search)
        );
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
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  let response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
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

    messages.push(responseMessage);
    messages.push(...toolMessages);

    response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
    });

    responseMessage = response.choices[0].message;
  }

  return Response.json({ message: responseMessage });
}

