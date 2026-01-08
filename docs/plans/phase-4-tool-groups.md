# Phase 4: Tool-Gruppen

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Alle 7 Tool-Gruppen implementieren.

**Architecture:** Jede Gruppe in eigener Datei, registriert Tools beim MCP-Server.

**Tech Stack:** TypeScript, Zod für Schema-Validierung

**Abhängigkeiten:** Phase 1, 2 und 3 müssen abgeschlossen sein.

**Parallelisierung:** Alle 7 Tasks (4.1-4.7) können parallel ausgeführt werden.

---

## Task 4.1: Core Tools (Issues & Projects)

**Files:**
- Create: `src/tools/core.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle core.ts**

```typescript
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
```

**Step 2: Update tools/index.ts Import**

Ersetze den Placeholder-Import in `src/tools/index.ts`:

```typescript
import { registerCoreTools } from "./core.js";
```

Und ersetze `const registerCoreTools: ToolRegistrationFn = () => {};` durch das Import.

---

## Task 4.2: Metadata Tools

**Files:**
- Create: `src/tools/metadata.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle metadata.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerMetadataTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === TRACKERS ===

  server.tool(
    "list_trackers",
    "List all available trackers (issue types like Bug, Feature, etc.)",
    {},
    async () => {
      const result = await client.listTrackers();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === ISSUE STATUSES ===

  server.tool(
    "list_issue_statuses",
    "List all available issue statuses (New, In Progress, Closed, etc.)",
    {},
    async () => {
      const result = await client.listIssueStatuses();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === ISSUE CATEGORIES ===

  server.tool(
    "list_issue_categories",
    "List all issue categories for a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.listIssueCategories(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_issue_category",
    "Get details of a specific issue category",
    {
      category_id: z.number().describe("The category ID"),
    },
    async (params) => {
      const result = await client.getIssueCategory(params.category_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_issue_category",
    "Create a new issue category in a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      name: z.string().describe("Category name"),
      assigned_to_id: z.number().optional().describe("Default assignee user ID for this category"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createIssueCategory(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_issue_category",
    "Update an existing issue category",
    {
      category_id: z.number().describe("The category ID to update"),
      name: z.string().optional().describe("New category name"),
      assigned_to_id: z.number().optional().describe("New default assignee user ID"),
    },
    async (params) => {
      const { category_id, ...data } = params;
      const result = await client.updateIssueCategory(category_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_issue_category",
    "Delete an issue category",
    {
      category_id: z.number().describe("The category ID to delete"),
      reassign_to_id: z.number().optional().describe("Category ID to reassign issues to before deletion"),
    },
    async (params) => {
      const result = await client.deleteIssueCategory(params.category_id, params.reassign_to_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === CUSTOM FIELDS ===

  server.tool(
    "list_custom_fields",
    "List all custom field definitions (requires admin privileges)",
    {},
    async () => {
      const result = await client.listCustomFields();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === QUERIES ===

  server.tool(
    "list_queries",
    "List all saved issue queries (public and private)",
    {},
    async () => {
      const result = await client.listQueries();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

Füge Import hinzu und ersetze Placeholder.

---

## Task 4.3: Wiki Tools

**Files:**
- Create: `src/tools/wiki.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle wiki.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerWikiTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "list_wiki_pages",
    "List all wiki pages in a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.listWikiPages(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_wiki_page",
    "Get content of a specific wiki page",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      page_name: z.string().describe("Wiki page name/title"),
      version: z.number().optional().describe("Specific version number to retrieve"),
      include: z.string().optional().describe("Include: attachments"),
    },
    async (params) => {
      const result = await client.getWikiPage(params.project_id, params.page_name, {
        version: params.version,
        include: params.include,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_wiki_page",
    "Create a new wiki page in a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      page_name: z.string().describe("Wiki page name/title (used in URL)"),
      text: z.string().describe("Page content (supports Textile/Markdown)"),
      comments: z.string().optional().describe("Edit comment for version history"),
      parent_title: z.string().optional().describe("Parent page title for hierarchy"),
    },
    async (params) => {
      const { project_id, page_name, ...data } = params;
      const result = await client.createOrUpdateWikiPage(project_id, page_name, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_wiki_page",
    "Update an existing wiki page",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      page_name: z.string().describe("Wiki page name/title"),
      text: z.string().describe("New page content"),
      comments: z.string().optional().describe("Edit comment for version history"),
      version: z.number().optional().describe("Expected version for conflict detection"),
    },
    async (params) => {
      const { project_id, page_name, ...data } = params;
      const result = await client.createOrUpdateWikiPage(project_id, page_name, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_wiki_page",
    "Delete a wiki page and all its history",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      page_name: z.string().describe("Wiki page name/title to delete"),
    },
    async (params) => {
      const result = await client.deleteWikiPage(params.project_id, params.page_name);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

---

## Task 4.4: Files Tools

**Files:**
- Create: `src/tools/files.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle files.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import type { RedmineClient } from "../redmine/client.js";

export function registerFilesTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ATTACHMENTS ===

  server.tool(
    "get_attachment",
    "Get metadata of a specific attachment",
    {
      attachment_id: z.number().describe("The attachment ID"),
    },
    async (params) => {
      const result = await client.getAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_attachment",
    "Delete an attachment",
    {
      attachment_id: z.number().describe("The attachment ID to delete"),
    },
    async (params) => {
      const result = await client.deleteAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "upload_file",
    "Upload a file to Redmine (returns token for attaching to issues/wiki)",
    {
      file_path: z.string().describe("Local file path to upload"),
      filename: z.string().describe("Filename to use in Redmine"),
      content_type: z.string().optional().describe("MIME type (auto-detected if not provided)"),
    },
    async (params) => {
      const content = await readFile(params.file_path);
      const contentType = params.content_type || "application/octet-stream";
      const result = await client.uploadFile(params.filename, contentType, content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === PROJECT FILES ===

  server.tool(
    "list_project_files",
    "List all files attached to a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.listProjectFiles(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "upload_project_file",
    "Attach an uploaded file to a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      token: z.string().describe("Upload token from upload_file"),
      version_id: z.number().optional().describe("Associated version ID"),
      filename: z.string().optional().describe("Override filename"),
      description: z.string().optional().describe("File description"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.uploadProjectFile(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

---

## Task 4.5: Relations Tools

**Files:**
- Create: `src/tools/relations.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle relations.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerRelationsTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ISSUE RELATIONS ===

  server.tool(
    "list_issue_relations",
    "List all relations for an issue",
    {
      issue_id: z.number().describe("The issue ID"),
    },
    async (params) => {
      const result = await client.listIssueRelations(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_relation",
    "Get details of a specific relation",
    {
      relation_id: z.number().describe("The relation ID"),
    },
    async (params) => {
      const result = await client.getRelation(params.relation_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_issue_relation",
    "Create a relation between two issues",
    {
      issue_id: z.number().describe("The source issue ID"),
      issue_to_id: z.number().describe("The target issue ID"),
      relation_type: z.enum([
        "relates",
        "duplicates",
        "duplicated",
        "blocks",
        "blocked",
        "precedes",
        "follows",
        "copied_to",
        "copied_from",
      ]).describe("Type of relation"),
      delay: z.number().optional().describe("Delay in days (only for precedes/follows)"),
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.createIssueRelation(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_relation",
    "Delete an issue relation",
    {
      relation_id: z.number().describe("The relation ID to delete"),
    },
    async (params) => {
      const result = await client.deleteRelation(params.relation_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === VERSIONS ===

  server.tool(
    "list_versions",
    "List all versions (milestones) for a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.listVersions(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_version",
    "Get details of a specific version",
    {
      version_id: z.number().describe("The version ID"),
    },
    async (params) => {
      const result = await client.getVersion(params.version_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_version",
    "Create a new version (milestone) in a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      name: z.string().describe("Version name"),
      status: z.enum(["open", "locked", "closed"]).optional().describe("Version status"),
      sharing: z.enum(["none", "descendants", "hierarchy", "tree", "system"]).optional().describe("Sharing scope"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Version description"),
      wiki_page_title: z.string().optional().describe("Associated wiki page"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createVersion(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_version",
    "Update an existing version",
    {
      version_id: z.number().describe("The version ID to update"),
      name: z.string().optional().describe("New version name"),
      status: z.enum(["open", "locked", "closed"]).optional().describe("New status"),
      sharing: z.enum(["none", "descendants", "hierarchy", "tree", "system"]).optional().describe("New sharing scope"),
      due_date: z.string().optional().describe("New due date"),
      description: z.string().optional().describe("New description"),
      wiki_page_title: z.string().optional().describe("New associated wiki page"),
    },
    async (params) => {
      const { version_id, ...data } = params;
      const result = await client.updateVersion(version_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_version",
    "Delete a version",
    {
      version_id: z.number().describe("The version ID to delete"),
    },
    async (params) => {
      const result = await client.deleteVersion(params.version_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

---

## Task 4.6: Search Tools

**Files:**
- Create: `src/tools/search.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle search.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerSearchTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "search",
    "Search across Redmine (issues, wiki, news, etc.)",
    {
      q: z.string().describe("Search query"),
      scope: z.enum(["all", "my_projects", "subprojects"]).optional().describe("Search scope"),
      all_words: z.boolean().optional().describe("Match all words (default true)"),
      titles_only: z.boolean().optional().describe("Search only in titles"),
      open_issues: z.boolean().optional().describe("Only open issues"),
      attachments: z.enum(["0", "1", "only"]).optional().describe("Search attachments: 0=no, 1=yes, only=only attachments"),
      issues: z.boolean().optional().describe("Include issues in results"),
      news: z.boolean().optional().describe("Include news in results"),
      documents: z.boolean().optional().describe("Include documents in results"),
      changesets: z.boolean().optional().describe("Include changesets in results"),
      wiki_pages: z.boolean().optional().describe("Include wiki pages in results"),
      messages: z.boolean().optional().describe("Include forum messages in results"),
      projects: z.boolean().optional().describe("Include projects in results"),
      limit: z.number().optional().describe("Maximum results"),
      offset: z.number().optional().describe("Skip first N results"),
    },
    async (params) => {
      const result = await client.search(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

---

## Task 4.7: Account Tools

**Files:**
- Create: `src/tools/account.ts`
- Modify: `src/tools/index.ts` (Import hinzufügen)

**Step 1: Erstelle account.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";

export function registerAccountTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "get_my_account",
    "Get current user account information",
    {},
    async () => {
      const result = await client.getMyAccount();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

**Step 2: Update tools/index.ts Import**

---

## Final Step: Update tools/index.ts mit allen Imports

Nach Abschluss aller Tasks muss `src/tools/index.ts` so aussehen:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";
import { registerCoreTools } from "./core.js";
import { registerMetadataTools } from "./metadata.js";
import { registerWikiTools } from "./wiki.js";
import { registerFilesTools } from "./files.js";
import { registerRelationsTools } from "./relations.js";
import { registerSearchTools } from "./search.js";
import { registerAccountTools } from "./account.js";

export type ToolRegistrationFn = (server: McpServer, client: RedmineClient) => void;

export const toolGroups: Record<string, ToolRegistrationFn> = {
  core: registerCoreTools,
  metadata: registerMetadataTools,
  wiki: registerWikiTools,
  files: registerFilesTools,
  relations: registerRelationsTools,
  search: registerSearchTools,
  account: registerAccountTools,
};

export type ToolGroup = keyof typeof toolGroups;

export const ALL_GROUPS: ToolGroup[] = Object.keys(toolGroups) as ToolGroup[];

export function isValidToolGroup(group: string): group is ToolGroup {
  return group in toolGroups;
}

export function validateToolGroups(groups: string[]): ToolGroup[] {
  const invalid = groups.filter((g) => !isValidToolGroup(g));
  if (invalid.length > 0) {
    throw new Error(`Invalid tool group(s): ${invalid.join(", ")}. Valid groups: ${ALL_GROUPS.join(", ")}`);
  }
  return groups as ToolGroup[];
}

export function resolveGroups(
  include?: string[],
  exclude?: string[]
): ToolGroup[] {
  let groups: ToolGroup[];

  if (include && include.length > 0) {
    groups = validateToolGroups(include);
  } else {
    groups = [...ALL_GROUPS];
  }

  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(validateToolGroups(exclude));
    groups = groups.filter((g) => !excludeSet.has(g));
  }

  if (groups.length === 0) {
    throw new Error("No tool groups selected. At least one group must be enabled.");
  }

  return groups;
}

export function registerTools(
  server: McpServer,
  client: RedmineClient,
  groups: ToolGroup[]
): void {
  for (const group of groups) {
    toolGroups[group](server, client);
  }
}
```

---

## Verification

Nach Abschluss aller Tasks in Phase 4:
1. `npm run build` muss erfolgreich sein
2. Alle 7 Tool-Dateien existieren
3. tools/index.ts importiert alle Tool-Gruppen
