import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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
  },
  {
    capabilities: {
      tools: {
        query_events: { description: "Query events from the BYU events API based on filters." },
        get_category_event_counts: { description: "Get a list of the number of events by event category name and ID." },
        get_event_categories: { description: "Get a list of all event categories with their names and IDs." },
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
