import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerIssueTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "list_issues",
    "List issues from Redmine with optional filters",
    {
      project_id: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Filter by project ID or identifier"),
      status_id: z
        .string()
        .optional()
        .describe("Filter by status: open, closed, or status ID"),
      assigned_to_id: z
        .number()
        .optional()
        .describe("Filter by assigned user ID"),
      limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
      offset: z.number().optional().describe("Skip first N results"),
    },
    async (params) => {
      const result = await client.listIssues(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_issue",
    "Get details of a specific issue by ID",
    {
      issue_id: z.number().describe("The issue ID"),
    },
    async (params) => {
      const result = await client.getIssue(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_issue",
    "Create a new issue in Redmine",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
      subject: z.string().describe("Issue subject/title"),
      description: z.string().optional().describe("Issue description"),
      tracker_id: z.number().optional().describe("Tracker ID (e.g., Bug, Feature)"),
      priority_id: z.number().optional().describe("Priority ID"),
      assigned_to_id: z.number().optional().describe("User ID to assign"),
    },
    async (params) => {
      const result = await client.createIssue(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_issue",
    "Update an existing issue",
    {
      issue_id: z.number().describe("The issue ID to update"),
      subject: z.string().optional().describe("New subject/title"),
      description: z.string().optional().describe("New description"),
      status_id: z.number().optional().describe("New status ID"),
      assigned_to_id: z.number().optional().describe("New assignee user ID"),
      notes: z.string().optional().describe("Add a comment/note to the issue"),
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.updateIssue(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
