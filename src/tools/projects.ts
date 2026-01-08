import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerProjectTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "list_projects",
    "List all accessible projects from Redmine",
    {
      limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
      offset: z.number().optional().describe("Skip first N results"),
    },
    async (params) => {
      const result = await client.listProjects(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_project",
    "Get details of a specific project",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.getProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_project",
    "Create a new project in Redmine",
    {
      name: z.string().describe("Project name"),
      identifier: z
        .string()
        .describe("Unique identifier (lowercase, no spaces, used in URLs)"),
      description: z.string().optional().describe("Project description"),
      is_public: z.boolean().optional().describe("Whether project is public (default true)"),
    },
    async (params) => {
      const result = await client.createProject(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_project",
    "Update an existing project",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New description"),
      is_public: z.boolean().optional().describe("Change public visibility"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.updateProject(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
