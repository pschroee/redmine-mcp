// Types
interface RedmineTracker {
  id: number;
  name: string;
  description?: string;
}

interface RedmineTrackersResponse {
  trackers: RedmineTracker[];
}

interface RedmineIssueStatus {
  id: number;
  name: string;
  is_closed: boolean;
}

interface RedmineIssueStatusesResponse {
  issue_statuses: RedmineIssueStatus[];
}

interface RedmineCategory {
  id: number;
  name: string;
  project?: { id: number; name: string };
  assigned_to?: { id: number; name: string };
}

interface RedmineCategoriesResponse {
  issue_categories: RedmineCategory[];
}

interface RedminePriority {
  id: number;
  name: string;
  is_default: boolean;
}

interface RedminePrioritiesResponse {
  issue_priorities: RedminePriority[];
}

interface RedmineActivity {
  id: number;
  name: string;
  is_default: boolean;
  active?: boolean;
}

interface RedmineActivitiesResponse {
  time_entry_activities: RedmineActivity[];
}

interface RedmineRole {
  id: number;
  name: string;
  assignable?: boolean;
  permissions?: string[];
}

interface RedmineRolesResponse {
  roles: RedmineRole[];
}

interface RedmineCustomField {
  id: number;
  name: string;
  customized_type: string;
  field_format: string;
  is_required: boolean;
  is_filter: boolean;
  searchable: boolean;
}

interface RedmineCustomFieldsResponse {
  custom_fields: RedmineCustomField[];
}

interface RedmineQuery {
  id: number;
  name: string;
  is_public: boolean;
  project_id?: number;
}

interface RedmineQueriesResponse {
  queries: RedmineQuery[];
}

interface RedmineDocumentCategory {
  id: number;
  name: string;
  is_default: boolean;
}

interface RedmineDocumentCategoriesResponse {
  document_categories: RedmineDocumentCategory[];
}

/**
 * Format a list of trackers as a Markdown table
 */
export function formatTrackerList(response: RedmineTrackersResponse): string {
  const lines: string[] = [];

  lines.push("# Trackers");
  lines.push("");

  if (response.trackers.length === 0) {
    lines.push("No trackers found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name |");
  lines.push("|----|------|");

  for (const tracker of response.trackers) {
    lines.push(`| ${tracker.id} | ${tracker.name} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of issue statuses as a Markdown table
 */
export function formatStatusList(response: RedmineIssueStatusesResponse): string {
  const lines: string[] = [];

  lines.push("# Issue Statuses");
  lines.push("");

  if (response.issue_statuses.length === 0) {
    lines.push("No statuses found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name | Closed |");
  lines.push("|----|------|--------|");

  for (const status of response.issue_statuses) {
    const closed = status.is_closed ? "Yes" : "No";
    lines.push(`| ${status.id} | ${status.name} | ${closed} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of issue categories as a Markdown table
 */
export function formatCategoryList(response: RedmineCategoriesResponse): string {
  const lines: string[] = [];

  lines.push("# Issue Categories");
  lines.push("");

  if (response.issue_categories.length === 0) {
    lines.push("No categories found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name | Assigned To |");
  lines.push("|----|------|-------------|");

  for (const category of response.issue_categories) {
    const assignedTo = category.assigned_to?.name || "";
    lines.push(`| ${category.id} | ${category.name} | ${assignedTo} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of issue priorities as a Markdown table
 */
export function formatPriorityList(response: RedminePrioritiesResponse): string {
  const lines: string[] = [];

  lines.push("# Issue Priorities");
  lines.push("");

  if (response.issue_priorities.length === 0) {
    lines.push("No priorities found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name | Default |");
  lines.push("|----|------|---------|");

  for (const priority of response.issue_priorities) {
    const isDefault = priority.is_default ? "Yes" : "No";
    lines.push(`| ${priority.id} | ${priority.name} | ${isDefault} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of time entry activities as a Markdown table
 */
export function formatActivityList(response: RedmineActivitiesResponse): string {
  const lines: string[] = [];

  lines.push("# Time Entry Activities");
  lines.push("");

  if (response.time_entry_activities.length === 0) {
    lines.push("No activities found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name | Default | Active |");
  lines.push("|----|------|---------|--------|");

  for (const activity of response.time_entry_activities) {
    const isDefault = activity.is_default ? "Yes" : "No";
    const isActive = activity.active === undefined ? "" : activity.active ? "Yes" : "No";
    lines.push(`| ${activity.id} | ${activity.name} | ${isDefault} | ${isActive} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of roles as a Markdown table
 */
export function formatRoleList(response: RedmineRolesResponse): string {
  const lines: string[] = [];

  lines.push("# Roles");
  lines.push("");

  if (response.roles.length === 0) {
    lines.push("No roles found.");
    return lines.join("\n");
  }

  lines.push("| ID | Name | Assignable |");
  lines.push("|----|------|------------|");

  for (const role of response.roles) {
    const assignable = role.assignable === undefined ? "" : role.assignable ? "Yes" : "No";
    lines.push(`| ${role.id} | ${role.name} | ${assignable} |`);
  }

  return lines.join("\n");
}

/**
 * Format a single role with details as Markdown
 */
export function formatRole(response: { role: RedmineRole }): string {
  const role = response.role;
  const lines: string[] = [];

  lines.push(`# ${role.name}`);
  lines.push("");

  lines.push(`**ID:** ${role.id}`);
  if (role.assignable !== undefined) {
    lines.push(`**Assignable:** ${role.assignable ? "Yes" : "No"}`);
  }
  lines.push("");

  if (role.permissions && role.permissions.length > 0) {
    lines.push("## Permissions");
    lines.push("");
    for (const permission of role.permissions) {
      lines.push(`- ${permission}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Format a single issue category as Markdown
 */
export function formatCategory(response: { issue_category: RedmineCategory }): string {
  const cat = response.issue_category;
  const lines: string[] = [];

  lines.push(`# ${cat.name}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| ID | ${cat.id} |`);
  if (cat.project) {
    lines.push(`| Project | ${cat.project.name} |`);
  }
  if (cat.assigned_to) {
    lines.push(`| Default Assignee | ${cat.assigned_to.name} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of custom fields as a Markdown table
 */
export function formatCustomFieldList(response: RedmineCustomFieldsResponse): string {
  const fields = response.custom_fields;

  if (fields.length === 0) {
    return "No custom fields found.";
  }

  const lines: string[] = [];
  lines.push(`# Custom Fields (${fields.length})`);
  lines.push("");
  lines.push("| ID | Name | Type | Format | Required |");
  lines.push("|----|------|------|--------|----------|");

  for (const field of fields) {
    const required = field.is_required ? "Yes" : "No";
    lines.push(`| ${field.id} | ${field.name} | ${field.customized_type} | ${field.field_format} | ${required} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of saved queries as a Markdown table
 */
export function formatQueryList(response: RedmineQueriesResponse): string {
  const queries = response.queries;

  if (queries.length === 0) {
    return "No queries found.";
  }

  const lines: string[] = [];
  lines.push(`# Saved Queries (${queries.length})`);
  lines.push("");
  lines.push("| ID | Name | Visibility |");
  lines.push("|----|------|------------|");

  for (const query of queries) {
    const visibility = query.is_public ? "Public" : "Private";
    lines.push(`| ${query.id} | ${query.name} | ${visibility} |`);
  }

  return lines.join("\n");
}

/**
 * Format a list of document categories as a Markdown table
 */
export function formatDocumentCategoryList(response: RedmineDocumentCategoriesResponse): string {
  const categories = response.document_categories;

  if (categories.length === 0) {
    return "No document categories found.";
  }

  const lines: string[] = [];
  lines.push(`# Document Categories (${categories.length})`);
  lines.push("");
  lines.push("| ID | Name | Default |");
  lines.push("|----|------|---------|");

  for (const cat of categories) {
    const isDefault = cat.is_default ? "Yes" : "No";
    lines.push(`| ${cat.id} | ${cat.name} | ${isDefault} |`);
  }

  return lines.join("\n");
}
