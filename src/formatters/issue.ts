import type { RedmineIssue } from "../redmine/types.js";
import { formatJournals } from "./journals.js";

/**
 * Format a date string to readable format
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Format an issue as complete Markdown
 */
export function formatIssue(issue: RedmineIssue): string {
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
    lines.push(formatJournals(issue.journals));
  }

  return lines.join("\n");
}

/**
 * Format an issue API response as Markdown
 */
export function formatIssueResponse(response: { issue: RedmineIssue }): string {
  return formatIssue(response.issue);
}
