import type { RedmineTimeEntry, RedmineTimeEntriesResponse } from "../redmine/types.js";

/**
 * Format a single time entry as complete Markdown
 */
export function formatTimeEntry(response: { time_entry: RedmineTimeEntry }): string {
  const entry = response.time_entry;
  const lines: string[] = [];

  // Header
  lines.push(`# Time Entry #${entry.id}`);
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Project | ${entry.project.name} |`);
  if (entry.issue) {
    lines.push(`| Issue | #${entry.issue.id} |`);
  }
  lines.push(`| User | ${entry.user.name} |`);
  lines.push(`| Activity | ${entry.activity.name} |`);
  lines.push(`| Hours | ${entry.hours} |`);
  lines.push(`| Date | ${entry.spent_on} |`);
  if (entry.comments) {
    lines.push(`| Comments | ${entry.comments} |`);
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Format a list of time entries as Markdown
 */
export function formatTimeEntryList(response: RedmineTimeEntriesResponse): string {
  const lines: string[] = [];

  lines.push(`# Time Entries (${response.total_count})`);
  lines.push("");

  if (response.time_entries.length === 0) {
    lines.push("No time entries found.");
    return lines.join("\n");
  }

  // Table header
  lines.push("| ID | Date | Hours | User | Activity | Issue | Comments |");
  lines.push("|----|------|-------|------|----------|-------|----------|");

  for (const entry of response.time_entries) {
    const issue = entry.issue ? `#${entry.issue.id}` : "-";
    const comments = entry.comments || "-";
    lines.push(`| ${entry.id} | ${entry.spent_on} | ${entry.hours} | ${entry.user.name} | ${entry.activity.name} | ${issue} | ${comments} |`);
  }

  return lines.join("\n");
}
