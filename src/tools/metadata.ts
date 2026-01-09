import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatTrackerList, formatStatusList, formatCategoryList, formatCategory, formatCustomFieldList, formatQueryList, type ProjectLookup } from "../formatters/index.js";

export function registerMetadataTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === TRACKERS ===

  server.registerTool(
    "list_trackers",
    {
      description: "List all available trackers (issue types like Bug, Feature, etc.)",
    },
    async () => {
      const result = await client.listTrackers();
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatTrackerList(result) }],
      };
    }
  );

  // === ISSUE STATUSES ===

  server.registerTool(
    "list_issue_statuses",
    {
      description: "List all available issue statuses (New, In Progress, Closed, etc.)",
    },
    async () => {
      const result = await client.listIssueStatuses();
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatStatusList(result) }],
      };
    }
  );

  // === ISSUE CATEGORIES ===

  server.registerTool(
    "list_issue_categories",
    {
      description: "List all issue categories for a project",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
      },
    },
    async (params) => {
      const result = await client.listIssueCategories(params.project_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatCategoryList(result) }],
      };
    }
  );

  server.registerTool(
    "get_issue_category",
    {
      description: "Get details of a specific issue category",
      inputSchema: {
        category_id: z.number().describe("The category ID"),
      },
    },
    async (params) => {
      const result = await client.getIssueCategory(params.category_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatCategory(result) }],
      };
    }
  );

  server.registerTool(
    "create_issue_category",
    {
      description: "Create a new issue category in a project",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
        name: z.string().describe("Category name"),
        assigned_to_id: z.number().optional().describe("Default assignee user ID for this category"),
      },
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createIssueCategory(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_issue_category",
    {
      description: "Update an existing issue category",
      inputSchema: {
        category_id: z.number().describe("The category ID to update"),
        name: z.string().optional().describe("New category name"),
        assigned_to_id: z.number().optional().describe("New default assignee user ID"),
      },
    },
    async (params) => {
      const { category_id, ...data } = params;
      const result = await client.updateIssueCategory(category_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_issue_category",
    {
      description: "Delete an issue category",
      inputSchema: {
        category_id: z.number().describe("The category ID to delete"),
        reassign_to_id: z.number().optional().describe("Category ID to reassign issues to before deletion"),
      },
    },
    async (params) => {
      const result = await client.deleteIssueCategory(params.category_id, params.reassign_to_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === CUSTOM FIELDS ===

  server.registerTool(
    "list_custom_fields",
    {
      description: "List all custom field definitions (requires admin privileges)",
    },
    async () => {
      const result = await client.listCustomFields();
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatCustomFieldList(result) }],
      };
    }
  );

  // === QUERIES ===

  server.registerTool(
    "list_queries",
    {
      description: "List all saved issue queries (public and private)",
      inputSchema: {
        project_id: z.string().optional().describe("Filter queries by project identifier"),
      },
    },
    async (params: { project_id?: string | number }) => {
      const result = await client.listQueries(params.project_id ? { project_id: params.project_id } : undefined);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Build project lookup for resolving project names
      const projectLookup: ProjectLookup = {};
      const projectIds = new Set(result.queries.map(q => q.project_id).filter((id): id is number => id != null));
      if (projectIds.size > 0) {
        const projectsResult = await client.listProjects({ limit: 100 });
        if (!("error" in projectsResult)) {
          for (const project of projectsResult.projects) {
            if (projectIds.has(project.id)) {
              projectLookup[project.id] = project.name;
            }
          }
        }
      }

      return {
        content: [{ type: "text", text: formatQueryList(result, projectLookup) }],
      };
    }
  );
}
