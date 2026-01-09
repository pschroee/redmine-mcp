import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerAgileTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === SPRINTS ===

  server.registerTool(
    "list_agile_sprints",
    {
      description: "List all agile sprints for a project (requires redmine_agile plugin)",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      },
    },
    async (params) => {
      const result = await client.listAgileSprints(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_agile_sprint",
    {
      description: "Get details of a specific agile sprint (requires redmine_agile plugin)",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        sprint_id: z.number().describe("The sprint ID"),
      },
    },
    async (params) => {
      const result = await client.getAgileSprint(params.project_id, params.sprint_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_agile_sprint",
    {
      description: "Create a new agile sprint for a project (requires redmine_agile plugin)",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        name: z.string().describe("Sprint name"),
        status: z.string().optional().describe("Sprint status: open, active, closed"),
        start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Sprint description"),
        sharing: z.string().optional().describe("Sharing level"),
      },
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createAgileSprint(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_agile_sprint",
    {
      description: "Update an existing agile sprint (requires redmine_agile plugin)",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        sprint_id: z.number().describe("The sprint ID to update"),
        name: z.string().optional().describe("New sprint name"),
        status: z.string().optional().describe("Sprint status: open, active, closed"),
        start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Sprint description"),
        sharing: z.string().optional().describe("Sharing level"),
      },
    },
    async (params) => {
      const { project_id, sprint_id, ...data } = params;
      const result = await client.updateAgileSprint(project_id, sprint_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_agile_sprint",
    {
      description: "Delete an agile sprint (requires redmine_agile plugin)",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        sprint_id: z.number().describe("The sprint ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteAgileSprint(params.project_id, params.sprint_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === AGILE DATA (Issue attributes) ===

  server.registerTool(
    "get_issue_agile_data",
    {
      description: "Get agile data for an issue (position, story points, sprint) (requires redmine_agile plugin)",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
      },
    },
    async (params) => {
      const result = await client.getIssueAgileData(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_issue_agile_data",
    {
      description: "Update agile data for an issue (position, story points, sprint assignment) (requires redmine_agile plugin)",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
        position: z.number().optional().describe("Position on the agile board"),
        story_points: z.number().optional().describe("Story points for the issue"),
        agile_sprint_id: z.number().nullable().optional().describe("Sprint ID to assign (null to unassign)"),
      },
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.updateIssueAgileData(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
