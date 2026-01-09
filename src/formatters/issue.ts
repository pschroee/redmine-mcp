import type { RedmineIssue, RedmineIssuesResponse } from "../redmine/types.js";
import { formatJournals, type NameLookup } from "./journals.js";
import { formatDate, formatDateShort } from "./utils.js";

/**
 * Options for formatting issues
 */
export interface IssueFormatOptions {
  includeDescriptionDiffs?: boolean;
}

/**
 * Format an issue as complete Markdown
 */
export function formatIssue(issue: RedmineIssue, lookup: NameLookup = {}, options: IssueFormatOptions = {}): string {
  const lines: string[] = [];

  // Title
  lines.push(`# #${issue.id}: ${issue.subject}`);
  lines.push("");

  // Status line
  const statusParts: string[] = [];
  statusParts.push(`**Status:** ${issue.status.name}`);
  statusParts.push(`**Priority:** ${issue.priority.name}`);
  if (issue.tracker) {
    statusParts.push(`**Tracker:** ${issue.tracker.name}`);
  }
  if (issue.assigned_to) {
    statusParts.push(`**Assigned:** ${issue.assigned_to.name}`);
  }
  lines.push(statusParts.join(" | "));
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Project | ${issue.project.name} |`);
  lines.push(`| Author | ${issue.author.name} |`);
  lines.push(`| Created | ${formatDate(issue.created_on)} |`);
  lines.push(`| Updated | ${formatDate(issue.updated_on)} |`);
  if (issue.closed_on) {
    lines.push(`| Closed | ${formatDate(issue.closed_on)} |`);
  }
  if (issue.start_date) {
    lines.push(`| Start Date | ${issue.start_date} |`);
  }
  if (issue.due_date) {
    lines.push(`| Due Date | ${issue.due_date} |`);
  }
  if (issue.estimated_hours) {
    lines.push(`| Estimated | ${issue.estimated_hours}h |`);
  }
  if (issue.spent_hours) {
    lines.push(`| Spent | ${issue.spent_hours}h |`);
  }
  if (issue.done_ratio !== undefined) {
    lines.push(`| Progress | ${issue.done_ratio}% |`);
  }
  if (issue.category) {
    lines.push(`| Category | ${issue.category.name} |`);
  }
  if (issue.fixed_version) {
    lines.push(`| Version | ${issue.fixed_version.name} |`);
  }
  if (issue.parent) {
    lines.push(`| Parent | #${issue.parent.id} |`);
  }
  lines.push("");

  // Custom fields
  if (issue.custom_fields && issue.custom_fields.length > 0) {
    lines.push("## Custom Fields");
    lines.push("");
    for (const cf of issue.custom_fields) {
      const value = Array.isArray(cf.value) ? cf.value.join(", ") : cf.value;
      if (value) {
        lines.push(`- **${cf.name}:** ${value}`);
      }
    }
    lines.push("");
  }

  // Description
  if (issue.description) {
    lines.push("## Description");
    lines.push("");
    lines.push(issue.description);
    lines.push("");
  }

  // Children
  if (issue.children && issue.children.length > 0) {
    lines.push("## Subtasks");
    lines.push("");
    for (const child of issue.children) {
      lines.push(`- #${child.id}: ${child.subject} (${child.tracker.name})`);
    }
    lines.push("");
  }

  // Relations
  if (issue.relations && issue.relations.length > 0) {
    lines.push("## Relations");
    lines.push("");
    for (const rel of issue.relations) {
      const target = rel.issue_id === issue.id ? rel.issue_to_id : rel.issue_id;
      lines.push(`- ${rel.relation_type} #${target}`);
    }
    lines.push("");
  }

  // Attachments
  if (issue.attachments && issue.attachments.length > 0) {
    lines.push("## Attachments");
    lines.push("");
    for (const att of issue.attachments) {
      lines.push(`- [${att.filename}](${att.content_url}) (${att.filesize} bytes)`);
    }
    lines.push("");
  }

  // Watchers
  if (issue.watchers && issue.watchers.length > 0) {
    lines.push("## Watchers");
    lines.push("");
    lines.push(issue.watchers.map(w => w.name).join(", "));
    lines.push("");
  }

  // Journals (history)
  if (issue.journals && issue.journals.length > 0) {
    lines.push(formatJournals(issue.journals, lookup, {
      includeDescriptionDiffs: options.includeDescriptionDiffs,
    }));
  }

  return lines.join("\n");
}

/**
 * Format an issue API response as Markdown
 */
export function formatIssueResponse(response: { issue: RedmineIssue }, lookup: NameLookup = {}, options: IssueFormatOptions = {}): string {
  return formatIssue(response.issue, lookup, options);
}

/**
 * Format a list of issues as a Markdown table
 */
export function formatIssueList(response: RedmineIssuesResponse): string {
  const { issues, total_count, offset, limit } = response;
  const lines: string[] = [];

  // Header with count
  lines.push(`# Issues (${issues.length} of ${total_count})`);
  lines.push("");

  // Pagination info if needed
  if (offset > 0 || total_count > limit) {
    const start = offset + 1;
    const end = offset + issues.length;
    lines.push(`_Showing ${start}-${end} of ${total_count}_`);
    lines.push("");
  }

  // Empty case
  if (issues.length === 0) {
    lines.push("No issues found.");
    return lines.join("\n");
  }

  // Collect all unique custom field names (preserving order by ID)
  const customFieldMap = new Map<number, string>(); // id -> name
  for (const issue of issues) {
    if (issue.custom_fields) {
      for (const cf of issue.custom_fields) {
        if (!customFieldMap.has(cf.id)) {
          customFieldMap.set(cf.id, cf.name);
        }
      }
    }
  }
  const customFieldIds = Array.from(customFieldMap.keys()).sort((a, b) => a - b);
  const customFieldNames = customFieldIds.map(id => customFieldMap.get(id)!);

  // Check if any issue has tags
  const hasTags = issues.some(issue => issue.tags && issue.tags.length > 0);

  // Table header
  const headerCols = ["ID", "Subject", "Status", "Priority", "Assigned", "Version", "Created", "Updated"];
  if (hasTags) {
    headerCols.push("Tags");
  }
  headerCols.push(...customFieldNames);
  lines.push("| " + headerCols.join(" | ") + " |");
  lines.push("|" + headerCols.map(() => "---").join("|") + "|");

  // Table rows
  for (const issue of issues) {
    const id = `#${issue.id}`;
    const subject = issue.subject;
    const status = issue.status.name;
    const priority = issue.priority.name;
    const assigned = issue.assigned_to?.name ?? "_(unassigned)_";
    const version = issue.fixed_version?.name ?? "";
    const created = formatDateShort(issue.created_on);
    const updated = formatDateShort(issue.updated_on);
    const tags = issue.tags?.map(t => t.name).join(", ") ?? "";

    // Build custom field values in order
    const cfValues: string[] = [];
    for (const cfId of customFieldIds) {
      const cf = issue.custom_fields?.find(f => f.id === cfId);
      if (cf) {
        const value = Array.isArray(cf.value) ? cf.value.join(", ") : cf.value;
        cfValues.push(value || "");
      } else {
        cfValues.push("");
      }
    }

    const cols = [id, subject, status, priority, assigned, version, created, updated];
    if (hasTags) {
      cols.push(tags);
    }
    cols.push(...cfValues);
    lines.push("| " + cols.join(" | ") + " |");
  }

  return lines.join("\n");
}
