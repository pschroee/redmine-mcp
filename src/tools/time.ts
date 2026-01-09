import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatTimeEntry, formatTimeEntryList } from "../formatters/index.js";

export function registerTimeTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_time_entries",
    {
      description: "List time entries with optional filters",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).optional().describe("Filter by project ID or identifier"),
        user_id: z.union([z.number(), z.string()]).optional().describe("Filter by user ID or 'me'"),
        spent_on: z.string().optional().describe("Filter by exact date (YYYY-MM-DD)"),
        from: z.string().optional().describe("Filter from date (YYYY-MM-DD)"),
        to: z.string().optional().describe("Filter to date (YYYY-MM-DD)"),
        limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const result = await client.listTimeEntries(params);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatTimeEntryList(result) }],
      };
    }
  );

  server.registerTool(
    "get_time_entry",
    {
      description: "Get details of a specific time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID"),
      },
    },
    async (params) => {
      const result = await client.getTimeEntry(params.time_entry_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatTimeEntry(result) }],
      };
    }
  );

  server.registerTool(
    "create_time_entry",
    {
      description: "Log time on an issue or project",
      inputSchema: {
        issue_id: z.number().optional().describe("Issue ID to log time on (either issue_id or project_id required)"),
        project_id: z.union([z.string(), z.number()]).optional().describe("Project ID to log time on (either issue_id or project_id required)"),
        hours: z.number().describe("Number of hours spent"),
        activity_id: z.number().optional().describe("Activity ID (use list_time_entry_activities to get IDs)"),
        spent_on: z.string().optional().describe("Date spent (YYYY-MM-DD, defaults to today)"),
        comments: z.string().optional().describe("Description of work done (max 255 chars)"),
        user_id: z.number().optional().describe("User ID to log time for (admin only)"),
      },
    },
    async (params) => {
      const result = await client.createTimeEntry(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_time_entry",
    {
      description: "Update an existing time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID to update"),
        hours: z.number().optional().describe("New hours value"),
        activity_id: z.number().optional().describe("New activity ID"),
        spent_on: z.string().optional().describe("New date (YYYY-MM-DD)"),
        comments: z.string().optional().describe("New comments"),
      },
    },
    async (params) => {
      const { time_entry_id, ...data } = params;
      const result = await client.updateTimeEntry(time_entry_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_time_entry",
    {
      description: "Delete a time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteTimeEntry(params.time_entry_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
