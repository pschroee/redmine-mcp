import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatIssueResponse, formatIssueList, formatProject, formatProjectList, type NameLookup } from "../formatters/index.js";

export function registerCoreTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ISSUES ===

  server.registerTool(
    "list_issues",
    {
      description: "List issues from Redmine with optional filters and sorting",
      inputSchema: {
        project_id: z.string().optional().describe("Filter by project identifier"),
        tracker_id: z.number().optional().describe("Filter by tracker ID"),
        status_id: z.union([z.string(), z.number()]).optional().describe("Filter by status: 'open', 'closed', '*', or status ID"),
        assigned_to_id: z.union([z.number(), z.string()]).optional().describe("Filter by assigned user ID or 'me'"),
        author_id: z.union([z.number(), z.string()]).optional().describe("Filter by author user ID or 'me'"),
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
        query_id: z.number().optional().describe("Use a saved query ID to filter issues (get IDs from list_queries). For project-specific queries, project_id is automatically fetched from the query if not provided."),
        tags: z.string().optional().describe("Filter by tags (comma-separated tag names, requires redmine_tags plugin)"),
      },
    },
    async (params) => {
      const result = await client.listIssues(params);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatIssueList(result) }],
      };
    }
  );

  server.registerTool(
    "get_issue",
    {
      description: "Get details of a specific issue by ID. Returns Markdown-formatted response.",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
        include: z.string().optional().describe("Include: attachments, relations, journals, watchers, children, changesets, allowed_statuses"),
        include_description_diffs: z.boolean().optional().default(true).describe("Include full description diffs in history (can be verbose)"),
      },
    },
    async (params) => {
      // Fetch issue and enumerations in parallel
      const [result, statusesResult, trackersResult, prioritiesResult] = await Promise.all([
        client.getIssue(params.issue_id, params.include),
        client.listIssueStatuses(),
        client.listTrackers(),
        client.listIssuePriorities(),
      ]);

      // Check if this is an error response
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Build lookup map for ID -> name resolution
      const lookup: NameLookup = {
        status_id: {},
        tracker_id: {},
        priority_id: {},
      };

      if (!("error" in statusesResult)) {
        for (const s of statusesResult.issue_statuses) {
          lookup.status_id[String(s.id)] = s.name;
        }
      }

      if (!("error" in trackersResult)) {
        for (const t of trackersResult.trackers) {
          lookup.tracker_id[String(t.id)] = t.name;
        }
      }

      if (!("error" in prioritiesResult)) {
        for (const p of prioritiesResult.issue_priorities) {
          lookup.priority_id[String(p.id)] = p.name;
        }
      }

      // Format response as Markdown
      return {
        content: [{ type: "text", text: formatIssueResponse(result, lookup, {
          includeDescriptionDiffs: params.include_description_diffs,
        }) }],
      };
    }
  );

  server.registerTool(
    "create_issue",
    {
      description: "Create a new issue in Redmine",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
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
    },
    async (params) => {
      const result = await client.createIssue(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_issue",
    {
      description: "Update an existing issue",
      inputSchema: {
        issue_id: z.number().describe("The issue ID to update"),
        subject: z.string().optional().describe("New subject/title"),
        description: z.string().optional().describe("New description"),
        project_id: z.string().optional().describe("Move to different project"),
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
        done_ratio: z.number().optional().describe("Update % done (0-100). Note: For parent issues with children, this may be calculated automatically depending on Redmine configuration"),
        start_date: z.string().optional().describe("Update start date"),
        due_date: z.string().optional().describe("Update due date"),
      },
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.updateIssue(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_issue",
    {
      description: "Delete an issue permanently",
      inputSchema: {
        issue_id: z.number().describe("The issue ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteIssue(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "add_issue_watcher",
    {
      description: "Add a user as watcher to an issue",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
        user_id: z.number().describe("The user ID to add as watcher"),
      },
    },
    async (params) => {
      const result = await client.addIssueWatcher(params.issue_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "remove_issue_watcher",
    {
      description: "Remove a user from issue watchers",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
        user_id: z.number().describe("The user ID to remove from watchers"),
      },
    },
    async (params) => {
      const result = await client.removeIssueWatcher(params.issue_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === PROJECTS ===

  server.registerTool(
    "list_projects",
    {
      description: "List all accessible projects from Redmine",
      inputSchema: {
        include: z.string().optional().describe("Include: trackers, issue_categories, enabled_modules, time_entry_activities, issue_custom_fields"),
        limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const result = await client.listProjects(params);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatProjectList(result) }],
      };
    }
  );

  server.registerTool(
    "get_project",
    {
      description: "Get details of a specific project",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
        include: z.string().optional().describe("Include: trackers, issue_categories, enabled_modules, time_entry_activities, issue_custom_fields"),
      },
    },
    async (params) => {
      const result = await client.getProject(params.project_id, params.include);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatProject(result) }],
      };
    }
  );

  server.registerTool(
    "create_project",
    {
      description: "Create a new project in Redmine",
      inputSchema: {
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
    },
    async (params) => {
      const result = await client.createProject(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_project",
    {
      description: "Update an existing project",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
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
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.updateProject(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_project",
    {
      description: "Delete a project permanently (requires admin privileges)",
      inputSchema: {
        project_id: z.string().describe("Project identifier to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "archive_project",
    {
      description: "Archive a project (Redmine 5.0+)",
      inputSchema: {
        project_id: z.string().describe("Project identifier to archive"),
      },
    },
    async (params) => {
      const result = await client.archiveProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "unarchive_project",
    {
      description: "Unarchive a project (Redmine 5.0+)",
      inputSchema: {
        project_id: z.string().describe("Project identifier to unarchive"),
      },
    },
    async (params) => {
      const result = await client.unarchiveProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
