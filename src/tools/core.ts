import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerCoreTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ISSUES ===

  server.tool(
    "list_issues",
    "List issues from Redmine with optional filters and sorting",
    {
      project_id: z.union([z.string(), z.number()]).optional().describe("Filter by project ID or identifier"),
      tracker_id: z.number().optional().describe("Filter by tracker ID"),
      status_id: z.union([z.string(), z.number()]).optional().describe("Filter by status: 'open', 'closed', '*', or status ID"),
      assigned_to_id: z.union([z.number(), z.string()]).optional().describe("Filter by assigned user ID or 'me'"),
      author_id: z.number().optional().describe("Filter by author user ID"),
      category_id: z.number().optional().describe("Filter by category ID"),
      fixed_version_id: z.number().optional().describe("Filter by version ID"),
      parent_id: z.number().optional().describe("Filter by parent issue ID"),
      subject: z.string().optional().describe("Filter by subject (use ~ for contains)"),
      created_on: z.string().optional().describe("Filter by created date (e.g., '>=2023-01-01', '><2023-01-01|2023-12-31')"),
      updated_on: z.string().optional().describe("Filter by updated date"),
      sort: z.string().optional().describe("Sort by field:direction (e.g., 'updated_on:desc,priority:asc')"),
      include: z.string().optional().describe("Include associated data: attachments, relations, journals, watchers, children"),
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
      include: z.string().optional().describe("Include: attachments, relations, journals, watchers, children, changesets, allowed_statuses"),
    },
    async (params) => {
      const result = await client.getIssue(params.issue_id, params.include);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_issue",
    "Create a new issue in Redmine",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      subject: z.string().describe("Issue subject/title"),
      description: z.string().optional().describe("Issue description (supports Textile/Markdown)"),
      tracker_id: z.number().optional().describe("Tracker ID (e.g., Bug, Feature)"),
      status_id: z.number().optional().describe("Status ID"),
      priority_id: z.number().optional().describe("Priority ID"),
      assigned_to_id: z.number().optional().describe("User ID to assign"),
      category_id: z.number().optional().describe("Category ID"),
      fixed_version_id: z.number().optional().describe("Target version ID"),
      parent_issue_id: z.number().optional().describe("Parent issue ID for subtasks"),
      custom_fields: z.array(z.object({
        id: z.number(),
        value: z.union([z.string(), z.array(z.string())]),
      })).optional().describe("Custom field values"),
      watcher_user_ids: z.array(z.number()).optional().describe("User IDs to add as watchers"),
      is_private: z.boolean().optional().describe("Make issue private"),
      estimated_hours: z.number().optional().describe("Estimated hours"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
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
      project_id: z.union([z.string(), z.number()]).optional().describe("Move to different project"),
      tracker_id: z.number().optional().describe("Change tracker"),
      status_id: z.number().optional().describe("Change status"),
      priority_id: z.number().optional().describe("Change priority"),
      assigned_to_id: z.union([z.number(), z.string()]).optional().describe("Change assignee (ID or '' to unassign)"),
      category_id: z.number().optional().describe("Change category"),
      fixed_version_id: z.union([z.number(), z.string()]).optional().describe("Change target version (ID or '' to clear)"),
      parent_issue_id: z.union([z.number(), z.string()]).optional().describe("Change parent (ID or '' to clear)"),
      custom_fields: z.array(z.object({
        id: z.number(),
        value: z.union([z.string(), z.array(z.string())]),
      })).optional().describe("Update custom fields"),
      notes: z.string().optional().describe("Add a comment/note to the issue"),
      private_notes: z.boolean().optional().describe("Make the note private"),
      is_private: z.boolean().optional().describe("Change private flag"),
      estimated_hours: z.number().optional().describe("Update estimated hours"),
      done_ratio: z.number().optional().describe("Update % done (0-100)"),
      start_date: z.string().optional().describe("Update start date"),
      due_date: z.string().optional().describe("Update due date"),
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.updateIssue(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_issue",
    "Delete an issue permanently",
    {
      issue_id: z.number().describe("The issue ID to delete"),
    },
    async (params) => {
      const result = await client.deleteIssue(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "add_issue_watcher",
    "Add a user as watcher to an issue",
    {
      issue_id: z.number().describe("The issue ID"),
      user_id: z.number().describe("The user ID to add as watcher"),
    },
    async (params) => {
      const result = await client.addIssueWatcher(params.issue_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "remove_issue_watcher",
    "Remove a user from issue watchers",
    {
      issue_id: z.number().describe("The issue ID"),
      user_id: z.number().describe("The user ID to remove from watchers"),
    },
    async (params) => {
      const result = await client.removeIssueWatcher(params.issue_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === PROJECTS ===

  server.tool(
    "list_projects",
    "List all accessible projects from Redmine",
    {
      include: z.string().optional().describe("Include: trackers, issue_categories, enabled_modules, time_entry_activities, issue_custom_fields"),
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
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      include: z.string().optional().describe("Include: trackers, issue_categories, enabled_modules, time_entry_activities, issue_custom_fields"),
    },
    async (params) => {
      const result = await client.getProject(params.project_id, params.include);
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
      identifier: z.string().describe("Unique identifier (lowercase, no spaces, used in URLs)"),
      description: z.string().optional().describe("Project description"),
      homepage: z.string().optional().describe("Project homepage URL"),
      is_public: z.boolean().optional().describe("Whether project is public (default true)"),
      parent_id: z.union([z.string(), z.number()]).optional().describe("Parent project ID or identifier"),
      inherit_members: z.boolean().optional().describe("Inherit members from parent project"),
      default_assigned_to_id: z.number().optional().describe("Default assignee user ID"),
      default_version_id: z.number().optional().describe("Default version ID"),
      tracker_ids: z.array(z.number()).optional().describe("Enabled tracker IDs"),
      enabled_module_names: z.array(z.string()).optional().describe("Enabled module names"),
      issue_custom_field_ids: z.array(z.number()).optional().describe("Enabled custom field IDs"),
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
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New description"),
      homepage: z.string().optional().describe("New homepage URL"),
      is_public: z.boolean().optional().describe("Change public visibility"),
      parent_id: z.union([z.string(), z.number()]).optional().describe("Change parent project"),
      inherit_members: z.boolean().optional().describe("Change inherit members"),
      default_assigned_to_id: z.number().optional().describe("Change default assignee"),
      default_version_id: z.number().optional().describe("Change default version"),
      tracker_ids: z.array(z.number()).optional().describe("Update enabled trackers"),
      enabled_module_names: z.array(z.string()).optional().describe("Update enabled modules"),
      issue_custom_field_ids: z.array(z.number()).optional().describe("Update enabled custom fields"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.updateProject(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_project",
    "Delete a project permanently (requires admin privileges)",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier to delete"),
    },
    async (params) => {
      const result = await client.deleteProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "archive_project",
    "Archive a project (Redmine 5.0+)",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier to archive"),
    },
    async (params) => {
      const result = await client.archiveProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "unarchive_project",
    "Unarchive a project (Redmine 5.0+)",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier to unarchive"),
    },
    async (params) => {
      const result = await client.unarchiveProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
