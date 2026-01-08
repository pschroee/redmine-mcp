import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerRelationsTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ISSUE RELATIONS ===

  server.registerTool(
    "list_issue_relations",
    {
      description: "List all relations for an issue",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
      },
    },
    async (params) => {
      const result = await client.listIssueRelations(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_relation",
    {
      description: "Get details of a specific relation",
      inputSchema: {
        relation_id: z.number().describe("The relation ID"),
      },
    },
    async (params) => {
      const result = await client.getRelation(params.relation_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_issue_relation",
    {
      description: "Create a relation between two issues",
      inputSchema: {
        issue_id: z.number().describe("The source issue ID"),
        issue_to_id: z.number().describe("The target issue ID"),
        relation_type: z
          .enum([
            "relates",
            "duplicates",
            "duplicated",
            "blocks",
            "blocked",
            "precedes",
            "follows",
            "copied_to",
            "copied_from",
          ])
          .describe("Type of relation"),
        delay: z
          .number()
          .optional()
          .describe("Delay in days (only for precedes/follows)"),
      },
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.createIssueRelation(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_relation",
    {
      description: "Delete an issue relation",
      inputSchema: {
        relation_id: z.number().describe("The relation ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteRelation(params.relation_id);
      return {
        content: [
          { type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) },
        ],
      };
    }
  );

  // === VERSIONS ===

  server.registerTool(
    "list_versions",
    {
      description: "List all versions (milestones) for a project",
      inputSchema: {
        project_id: z
          .union([z.string(), z.number()])
          .describe("Project ID or identifier"),
      },
    },
    async (params) => {
      const result = await client.listVersions(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_version",
    {
      description: "Get details of a specific version",
      inputSchema: {
        version_id: z.number().describe("The version ID"),
      },
    },
    async (params) => {
      const result = await client.getVersion(params.version_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_version",
    {
      description: "Create a new version (milestone) in a project",
      inputSchema: {
        project_id: z
          .union([z.string(), z.number()])
          .describe("Project ID or identifier"),
        name: z.string().describe("Version name"),
        status: z
          .enum(["open", "locked", "closed"])
          .optional()
          .describe("Version status"),
        sharing: z
          .enum(["none", "descendants", "hierarchy", "tree", "system"])
          .optional()
          .describe("Sharing scope"),
        due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Version description"),
        wiki_page_title: z.string().optional().describe("Associated wiki page"),
      },
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createVersion(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_version",
    {
      description: "Update an existing version",
      inputSchema: {
        version_id: z.number().describe("The version ID to update"),
        name: z.string().optional().describe("New version name"),
        status: z
          .enum(["open", "locked", "closed"])
          .optional()
          .describe("New status"),
        sharing: z
          .enum(["none", "descendants", "hierarchy", "tree", "system"])
          .optional()
          .describe("New sharing scope"),
        due_date: z.string().optional().describe("New due date"),
        description: z.string().optional().describe("New description"),
        wiki_page_title: z.string().optional().describe("New associated wiki page"),
      },
    },
    async (params) => {
      const { version_id, ...data } = params;
      const result = await client.updateVersion(version_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_version",
    {
      description: "Delete a version",
      inputSchema: {
        version_id: z.number().describe("The version ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteVersion(params.version_id);
      return {
        content: [
          { type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) },
        ],
      };
    }
  );
}
