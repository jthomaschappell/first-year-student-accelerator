import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";

// Helper to build query params safely
function appendParam(url: URL, key: string, value: string | number | undefined) {
  if (value !== undefined && value !== null && String(value) !== "") {
    url.searchParams.append(key, String(value));
  }
}

const handler = createMcpHandler(
  async (server: any) => {
    // query_events(start_date?: string, end_date?: string, category?: number[], price?: number)
    server.tool(
      "query_events",
      "Query events from the BYU events API based on filters.",
      {
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        category: z.array(z.number()).optional(),
        price: z.number().optional(),
      },
      async (args: { start_date?: string; end_date?: string; category?: number[]; price?: number }) => {
        const { start_date, end_date, category, price } = args;
        const base = "https://calendar.byu.edu/api/Events.json";
        // Build URL with categories param (BYU API expects categories=all or a plus-separated list)
        const url = new URL(base);
        if (category && category.length > 0) {
          url.searchParams.set("categories", category.map(String).join("+"));
        } else {
          url.searchParams.set("categories", "all");
        }

        appendParam(url, "event[min][date]", start_date as string | undefined);
        appendParam(url, "event[max][date]", end_date as string | undefined);
        if (price !== undefined) {
          appendParam(url, "price", price as number);
        }

        const res = await fetch(url.toString());
        const json = await res.json();
        return { content: [{ type: "json", json }] };
      },
    );

    // get_category_event_counts(start_date?: string, end_date?: string, price?: number)
    server.tool(
      "get_category_event_counts",
      "Get a list of the number of events by event category name and ID.",
      {
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        price: z.number().optional(),
      },
      async (args: { start_date?: string; end_date?: string; price?: number }) => {
        const { start_date, end_date, price } = args;
        const base = "https://calendar.byu.edu/api/AllCategoryCounts.json";
        const url = new URL(base);
        appendParam(url, "event[min][date]", start_date);
        appendParam(url, "event[max][date]", end_date);
        if (price !== undefined) appendParam(url, "price", price);

        const res = await fetch(url.toString());
        const json = await res.json();
        return { content: [{ type: "json", json }] };
      },
    );

    // get_event_categories()
    server.tool(
      "get_event_categories",
      "Get a list of all event categories with their names and IDs.",
      {},
      async () => {
        const res = await fetch("https://calendar.byu.edu/api/AllCategories.json");
        const json = await res.json();
        return { content: [{ type: "json", json }] };
      },
    );

    // get_teacher_ratings(teacher_name?: string)
    server.tool(
      "get_teacher_ratings",
      "Get ratings for BYU teachers with detailed reviews, comments, tags, and grades. Optionally filter by teacher name (first or last).",
      {
        teacher_name: z.string().optional(),
      },
      async (args: { teacher_name?: string }) => {
        const ratingsPath = join(process.cwd(), "data", "teacher_ratings.json");
        const reviewsPath = join(process.cwd(), "data", "professor_reviews.json");
        const ratingsData = JSON.parse(readFileSync(ratingsPath, "utf-8"));
        const reviewsData = JSON.parse(readFileSync(reviewsPath, "utf-8"));
        
        let filtered = ratingsData;
        
        if (args.teacher_name) {
          const searchTerms = args.teacher_name.toLowerCase().split(/\s+/).filter(term => term.length > 0);
          filtered = filtered.filter((t: any) => {
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
        }
        
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
        
        return { content: [{ type: "json", json: enriched }] };
      },
    );

    // get_assignments(course?: string)
    server.tool(
      "get_assignments",
      "Get current assignments for courses. Optionally filter by course code (e.g., 'MATH 320').",
      {
        course: z.string().optional(),
      },
      async (args: { course?: string }) => {
        const dataPath = join(process.cwd(), "data", "current_assignments.json");
        const data = JSON.parse(readFileSync(dataPath, "utf-8"));
        
        if (args.course) {
          const filtered = data.events.filter((e: any) => 
            e.course.toLowerCase().includes(args.course!.toLowerCase())
          );
          return { content: [{ type: "json", json: { ...data, events: filtered } }] };
        }
        
        return { content: [{ type: "json", json: data }] };
      },
    );

    // search_courses(course_code?: string, instructor?: string)
    server.tool(
      "search_courses",
      "Search BYU courses by course code, title, or instructor name. Returns course details including sections, times, and locations.",
      {
        course_code: z.string().optional(),
        instructor: z.string().optional(),
      },
      async (args: { course_code?: string; instructor?: string }) => {
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
        
        return { content: [{ type: "json", json: filtered }] };
      },
    );

  },
  {
    capabilities: {
      tools: {
        query_events: { description: "Query events from the BYU events API based on filters." },
        get_category_event_counts: { description: "Get a list of the number of events by event category name and ID." },
        get_event_categories: { description: "Get a list of all event categories with their names and IDs." },
        get_teacher_ratings: { description: "Get ratings for BYU teachers with detailed reviews. Optionally filter by teacher name." },
        get_assignments: { description: "Get current assignments for courses. Optionally filter by course code." },
        search_courses: { description: "Search BYU courses by course code, title, or instructor name." }
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
