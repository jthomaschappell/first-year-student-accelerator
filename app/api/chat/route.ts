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
      description: "Get ratings for BYU teachers with detailed student reviews, comments, tags, and grades. Always requires a specific teacher name - cannot query by department.",
      parameters: {
        type: "object",
        properties: {
          teacher_name: { type: "string", description: "Teacher's first or last name (REQUIRED - cannot search by department)" },
        },
        required: ["teacher_name"],
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
      const ratingsPath = join(process.cwd(), "data", "teacher_ratings.json");
      const reviewsPath = join(process.cwd(), "data", "professor_reviews.json");
      const ratingsData = JSON.parse(readFileSync(ratingsPath, "utf-8"));
      const reviewsData = JSON.parse(readFileSync(reviewsPath, "utf-8"));
      
      if (!args.teacher_name) {
        return {
          error: "Teacher name is required. Please specify a professor's name.",
          message: "Cannot query by department alone. Please provide a specific professor name."
        };
      }
      
      const searchTerms = args.teacher_name.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const filtered = ratingsData.filter((t: any) => {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
        const firstName = t.firstName.toLowerCase();
        const lastName = t.lastName.toLowerCase();
        
        // Check if all search terms are found in the full name
        return searchTerms.every((term: string) => {
          // First try exact full name match
          if (fullName.includes(term)) return true;
          
          // Then try partial matches - check if term is a substring of first or last name
          if (firstName.includes(term) || lastName.includes(term)) return true;
          
          // For multi-word terms, check if they span across first and last names
          // e.g., "Riley Nelson" should match "Charles Riley Nelson"
          if (term.includes(' ')) {
            const termParts = term.split(' ');
            if (termParts.length === 2) {
              const [firstPart, lastPart] = termParts;
              return (firstName.includes(firstPart) && lastName.includes(lastPart)) ||
                     (firstName.includes(lastPart) && lastName.includes(firstPart));
            }
          }
          
          return false;
        });
      });
      
      // Merge review data with ratings
      const enriched = filtered.map((teacher: any) => {
        const review = reviewsData.find((r: any) => {
          const prof = r.data.node;
          return prof.firstName.toLowerCase() === teacher.firstName.toLowerCase() &&
                 prof.lastName.toLowerCase() === teacher.lastName.toLowerCase();
        });
        
        if (review) {
          const prof = review.data.node;
          return {
            ...teacher,
            aggregatedTags: prof.teacherRatingTags?.map((tag: any) => ({
              tagName: tag.tagName,
              tagCount: tag.tagCount,
            })) || [],
            reviews: prof.ratings?.edges?.slice(0, 10).map((edge: any) => {
              const r = edge.node;
              return {
                class: r.class,
                comment: r.comment,
                grade: r.grade,
                date: r.date,
                clarityRating: r.clarityRating,
                helpfulRating: r.helpfulRating,
                difficultyRating: r.difficultyRating,
                wouldTakeAgain: r.wouldTakeAgain,
                tags: r.ratingTags ? r.ratingTags.split("--").filter((t: string) => t.trim()) : [],
                attendanceMandatory: r.attendanceMandatory,
              };
            }) || [],
          };
        }
        
        return { ...teacher, aggregatedTags: [], reviews: [] };
      });
      
      return enriched;
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
      content: `You are a helpful assistant for BYU students. Today's date is November 11, 2025. When users ask about 'this week', use dates from November 11-17, 2025. Format dates as YYYY-MM-DD when calling tools.

CRITICAL PRIORITY RULE - AUTO-LOOKUP PROFESSORS: Whenever a user's message mentions what could be a professor's name (any proper name that isn't obviously a student or other person), you MUST immediately use the get_teacher_ratings tool to look up that professor. This is HIGHEST PRIORITY. Even if they're asking about something else (like courses, schedules, assignments), if a professor name is mentioned, ALWAYS look up their ratings first and display them. Examples:
- "I'm taking a class with Professor Smith" → Look up Smith
- "What does Kimball teach?" → Look up Kimball  
- "Is Campbell's class hard?" → Look up Campbell
- "I have Roberts for math" → Look up Roberts
- Any mention of a professor name → Look up their ratings

IMPORTANT RULE: When users ask about professor ratings, you MUST require a specific professor name. NEVER query by department alone. If they only mention a department, politely ask them to specify which professor in that department they'd like to know about.

⚠️ CRITICAL DISPLAY RULE: When showing artifacts (events or professors), NEVER duplicate information that's inside the artifacts. Don't create summaries or lists with ratings, dates, percentages, etc. The artifacts are complete and beautiful - just show them with a brief intro like "Here are the ratings:" or "Here are some events:". Let the artifacts speak for themselves.

EVENTS: When displaying event information from the query_events tool, format each event as an artifact using this EXACT HTML structure INCLUDING the Add to Calendar button at the bottom (it's REQUIRED). You can add a brief intro message before the artifacts, then list each event with the COMPLETE template below:

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
  <button class="add-to-calendar-btn" data-event-title="[EVENT TITLE]" data-event-date="[EVENT DATE]" data-event-time="[EVENT TIME]" data-event-location="[EVENT LOCATION]" data-event-description="[EVENT DESCRIPTION]" style="margin-top: 16px; width: 100%; background: white; color: #1F2937; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)';" onmouseout="this.style.background='white'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.15)';">
    <span style="font-size: 18px;">📅</span>
    <span>Add to Calendar</span>
  </button>
</div>

CRITICAL RULES FOR EVENTS:
1. ALL event information (especially the TITLE) must be INSIDE the event-artifact div
2. The title goes in the blue header div at the top of each artifact
3. Do NOT list event titles separately outside the artifacts
4. Each event should be its own complete self-contained artifact
5. NEVER duplicate information that's in the artifacts - no lists of event names, dates, times, or descriptions outside
6. MANDATORY: Every event artifact MUST include the "Add to Calendar" button at the bottom (line 318-321 in template) with all event data in data attributes
7. Keep intro text minimal: "Here are some events:" or "Check out these events:" - that's it, then show artifacts
8. The button is part of the artifact - do NOT omit it or the user won't be able to add events to their calendar

PROFESSOR RATINGS: ALWAYS look up professors when their names are mentioned in ANY context. When displaying professor information from get_teacher_ratings, you MUST use the EXACT data returned from the tool. DO NOT make up or hallucinate any values. NOTE: Professor artifacts do NOT have calendar buttons (only event artifacts have those).

The tool returns JSON with these fields for each professor:
- firstName: Use this EXACTLY
- lastName: Use this EXACTLY  
- department: Use this EXACTLY (do NOT change or guess the department)
- avgRating: Use this EXACT number (do NOT round or change it)
- avgDifficulty: Use this EXACT number (do NOT round or change it)
- numRatings: Use this EXACT number (do NOT change it)
- wouldTakeAgainPercent: Use this EXACT number (do NOT change it)

Format each professor as an artifact using this structure and ONLY the data from the tool result:

<div class="professor-artifact" style="background: linear-gradient(to bottom right, #1F2937, #111827); border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid rgba(75, 85, 99, 0.3); backdrop-filter: blur(8px); max-height: 600px; overflow-y: auto;">
  <div style="background: linear-gradient(to right, #2563EB, #1D4ED8); color: white; padding: 16px; border-radius: 12px 12px 0 0; margin: -20px -20px 16px -20px; font-weight: 600; font-size: 18px; letter-spacing: 0.025em; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">
    {firstName} {lastName}
  </div>
  
  <div style="color: #E5E7EB; font-size: 15px; line-height: 1.6; display: grid; gap: 16px;">
    <!-- Department - USE EXACT department FIELD -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <strong style="color: #60A5FA; min-width: 100px;">Department:</strong>
      <span>{department}</span>
    </div>
    
    <!-- Rating with Stars - USE EXACT avgRating VALUE -->
    <div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <strong style="color: #60A5FA; min-width: 100px;">Rating:</strong>
        <span>{avgRating} / 5.0</span>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; font-size: 24px;">
        {CALCULATE STARS BASED ON avgRating - round to nearest 0.5}
      </div>
      <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Based on {numRatings} ratings</div>
    </div>
    
    <!-- Difficulty Bar - USE EXACT avgDifficulty VALUE -->
    <div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <strong style="color: #60A5FA; min-width: 100px;">Difficulty:</strong>
        <span>{avgDifficulty} / 5.0</span>
      </div>
      <div style="background: #374151; height: 12px; border-radius: 999px; overflow: hidden; position: relative;">
        <div style="background: linear-gradient(to right, #EF4444, #DC2626); height: 100%; width: {(avgDifficulty / 5.0) * 100}%; border-radius: 999px; transition: width 0.3s;"></div>
      </div>
    </div>
    
    <!-- Would Take Again Pie Chart - USE EXACT wouldTakeAgainPercent -->
    <div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <strong style="color: #60A5FA; min-width: 100px;">Would Take Again:</strong>
        <span>{wouldTakeAgainPercent}%</span>
      </div>
      <div style="display: flex; gap: 16px; align-items: center;">
        <div style="width: 100px; height: 100px; border-radius: 50%; background: conic-gradient(#10B981 0% {wouldTakeAgainPercent}%, #EF4444 {wouldTakeAgainPercent}% 100%); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);"></div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #10B981; border-radius: 4px;"></div>
            <span style="font-size: 14px;">Would take again: {wouldTakeAgainPercent}%</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; background: #EF4444; border-radius: 4px;"></div>
            <span style="font-size: 14px;">Would not: {100 - wouldTakeAgainPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Student Reviews Section -->
  <div style="margin-top: 20px; border-top: 1px solid #374151; padding-top: 16px;">
    <div style="color: #60A5FA; font-weight: 600; font-size: 15px; margin-bottom: 12px;">Student Reviews</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      {FOR EACH review IN reviews array:}
      <div style="background: #374151; border-radius: 8px; padding: 12px; border: 1px solid #4B5563;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: #1F2937; color: #93C5FD; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">{review.class || 'N/A'}</span>
            {IF review.grade exists:}
            <span style="background: #065F46; color: #6EE7B7; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">Grade: {review.grade}</span>
            {END IF}
          </div>
        </div>
        {IF review.tags exists and has items:}
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
          {FOR EACH tag IN review.tags:}
          <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 3px 8px; border-radius: 9999px; font-size: 11px;">{tag}</span>
          {END FOR}
        </div>
        {END IF}
        <p style="color: #D1D5DB; font-size: 12px; line-height: 1.5; margin: 0;">{review.comment}</p>
      </div>
      {END FOR}
    </div>
  </div>
</div>

CRITICAL RULES FOR PROFESSORS:
1. USE ONLY THE EXACT DATA FROM THE TOOL RESULT - DO NOT MAKE UP VALUES
2. The tool now returns a "reviews" array with student comments. ALWAYS include the Student Reviews section if reviews exist. Loop through each review and display:
   - Course code (review.class)
   - Grade if exists (review.grade)
   - Tags from review.tags array
   - Comment text (review.comment)
3. For star display - ALWAYS show EXACTLY 5 star symbols total. Round avgRating to nearest 0.5:
   - ★ = full star (yellow: #FCD34D)
   - ⯨ = half star (yellow: #FCD34D)  
   - ☆ = empty star (gray: #4B5563)
   
   STAR CALCULATION EXAMPLES (ALWAYS 5 STARS TOTAL):
   - 1.0-1.2 → 1.0: <span style="color: #FCD34D;">★</span><span style="color: #4B5563;">☆☆☆☆</span>
   - 1.3-1.7 → 1.5: <span style="color: #FCD34D;">★⯨</span><span style="color: #4B5563;">☆☆☆</span>
   - 1.8-2.2 → 2.0: <span style="color: #FCD34D;">★★</span><span style="color: #4B5563;">☆☆☆</span>
   - 2.3-2.7 → 2.5: <span style="color: #FCD34D;">★★⯨</span><span style="color: #4B5563;">☆☆</span>
   - 2.8-3.2 → 3.0: <span style="color: #FCD34D;">★★★</span><span style="color: #4B5563;">☆☆</span>
   - 3.3-3.7 → 3.5: <span style="color: #FCD34D;">★★★⯨</span><span style="color: #4B5563;">☆</span>
   - 3.8-4.2 → 4.0: <span style="color: #FCD34D;">★★★★</span><span style="color: #4B5563;">☆</span>
   - 4.3-4.7 → 4.5: <span style="color: #FCD34D;">★★★★⯨</span>
   - 4.8-5.0 → 5.0: <span style="color: #FCD34D;">★★★★★</span>
   
   Examples with REAL data:
   - 4.1 → rounds to 4.0 → <span style="color: #FCD34D;">★★★★</span><span style="color: #4B5563;">☆</span> (4 full + 1 empty = 5 total)
   - 4.7 → rounds to 4.5 → <span style="color: #FCD34D;">★★★★⯨</span> (4 full + 1 half = 5 total)
   - 1.9 → rounds to 2.0 → <span style="color: #FCD34D;">★★</span><span style="color: #4B5563;">☆☆☆</span> (2 full + 3 empty = 5 total)

4. Difficulty bar width = (avgDifficulty / 5.0) * 100
5. Would not percentage = 100 - wouldTakeAgainPercent
6. Never query by department only - always require specific professor names
7. ALL professor info must be inside the professor-artifact div
8. NEVER hallucinate or change the data - use EXACT values from the JSON
9. PROACTIVELY look up ANY professor name mentioned - this provides crucial context for students
10. ALWAYS include the Student Reviews section at the bottom - it shows real comments from students

11. ABSOLUTELY CRITICAL - NO DUPLICATE INFORMATION: 
   DO NOT write summaries, lists, or any text that repeats data from the artifacts.
   DO NOT mention: ratings numbers, difficulty numbers, "would take again" percentages, department names
   
   ❌ WRONG: "Benjamin Webb: Rating 4.4, Difficulty 3.5, Would Take Again 92.3%"
   ❌ WRONG: "Based on his high rating and the percentage of students who would take him again"
   ❌ WRONG: "Mark Kempton has a higher overall rating"
   
   ✅ CORRECT: "Here are the ratings for MATH 320 instructors:" [then show artifacts]
   ✅ CORRECT: "I found ratings for these professors:" [then show artifacts]
   ✅ CORRECT: Simply show the artifacts without extra commentary
   
   The artifacts are beautiful and complete - they don't need explanation. Just show them.

EXAMPLE: If tool returns {
  "firstName": "Albert", 
  "lastName": "Tay", 
  "department": "Information Technology", 
  "avgRating": 1.9, 
  "avgDifficulty": 3.4, 
  "numRatings": 17, 
  "wouldTakeAgainPercent": 29.4118,
  "reviews": [
    {
      "class": "IT 101",
      "comment": "Very tough class but learned a lot. Attendance is required.",
      "grade": "B+",
      "tags": ["Tough grader", "Skip class? You won't pass."]
    },
    {
      "class": "IT 202", 
      "comment": "Great insights but too much homework.",
      "grade": "A",
      "tags": ["Lots of homework", "Caring"]
    }
  ]
}

Display as:
- Name: Albert Tay (NOT Physics, NOT 4.5 rating, NOT 65 ratings)
- Department: Information Technology
- Rating: 1.9 / 5.0 with <span style="color: #FCD34D;">★★</span><span style="color: #4B5563;">☆☆☆</span> (exactly 5 stars)
- Based on 17 ratings
- Difficulty: 3.4 / 5.0 with bar at 68%
- Would Take Again: 29.4118% (Would not: 70.5882%)
- Student Reviews section with scrollable review boxes showing each comment with course, grade, and tags

NOTE: The entire professor artifact is scrollable (overflow-y: auto on the main div), so users can scroll through stats and reviews naturally together.

ACTUAL HTML FOR REVIEWS SECTION (replace pseudocode with this):
  <div style="margin-top: 20px; border-top: 1px solid #374151; padding-top: 16px;">
    <div style="color: #60A5FA; font-weight: 600; font-size: 15px; margin-bottom: 12px;">Student Reviews</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background: #374151; border-radius: 8px; padding: 12px; border: 1px solid #4B5563;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: #1F2937; color: #93C5FD; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">IT 101</span>
            <span style="background: #065F46; color: #6EE7B7; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">Grade: B+</span>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
          <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 3px 8px; border-radius: 9999px; font-size: 11px;">Tough grader</span>
          <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 3px 8px; border-radius: 9999px; font-size: 11px;">Skip class? You won't pass.</span>
        </div>
        <p style="color: #D1D5DB; font-size: 12px; line-height: 1.5; margin: 0;">Very tough class but learned a lot. Attendance is required.</p>
      </div>
      <div style="background: #374151; border-radius: 8px; padding: 12px; border: 1px solid #4B5563;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: #1F2937; color: #93C5FD; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">IT 202</span>
            <span style="background: #065F46; color: #6EE7B7; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">Grade: A</span>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
          <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 3px 8px; border-radius: 9999px; font-size: 11px;">Lots of homework</span>
          <span style="background: rgba(37, 99, 235, 0.2); color: #93C5FD; padding: 3px 8px; border-radius: 9999px; font-size: 11px;">Caring</span>
        </div>
        <p style="color: #D1D5DB; font-size: 12px; line-height: 1.5; margin: 0;">Great insights but too much homework.</p>
      </div>
    </div>
  </div>`
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

