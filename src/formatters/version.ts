import type { RedmineVersion, RedmineVersionsResponse } from "../redmine/types.js";

const STATUS_BADGE: Record<string, string> = {
  open: "Open",
  locked: "Locked",
  closed: "Closed",
};

/**
 * Format a status badge
 */
function formatStatusBadge(status: string): string {
  return STATUS_BADGE[status] || status;
}

/**
 * Calculate progress percentage from estimated/spent hours
 */
function formatProgress(estimated?: number, spent?: number): string {
  if (!estimated || estimated === 0) {
    return spent ? `${spent}h spent` : "-";
  }
  const percentage = Math.round((spent || 0) / estimated * 100);
  return `${percentage}%`;
}

/**
 * Format a single version as complete Markdown
 */
export function formatVersion(response: { version: RedmineVersion }): string {
  const version = response.version;
  const lines: string[] = [];

  // Title with status badge
  lines.push(`# ${version.name} [${formatStatusBadge(version.status)}]`);
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Project | ${version.project.name} |`);
  if (version.due_date) {
    lines.push(`| Due Date | ${version.due_date} |`);
  }
  lines.push(`| Status | ${formatStatusBadge(version.status)} |`);
  if (version.estimated_hours !== undefined || version.spent_hours !== undefined) {
    const est = version.estimated_hours !== undefined ? `${version.estimated_hours}h` : "-";
    const spent = version.spent_hours !== undefined ? `${version.spent_hours}h` : "-";
    lines.push(`| Est/Spent Hours | ${est} / ${spent} |`);
  }
  if (version.description) {
    lines.push(`| Description | ${version.description} |`);
  }
  if (version.wiki_page_title) {
    lines.push(`| Wiki Page | ${version.wiki_page_title} |`);
  }
  lines.push(`| Sharing | ${version.sharing} |`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Format a list of versions as Markdown table
 */
export function formatVersionList(response: RedmineVersionsResponse): string {
  const lines: string[] = [];

  lines.push(`# Versions (${response.total_count})`);
  lines.push("");

  if (response.versions.length === 0) {
    lines.push("No versions found.");
    return lines.join("\n");
  }

  // Table header
  lines.push("| Name | Status | Due Date | Progress |");
  lines.push("|------|--------|----------|----------|");

  for (const version of response.versions) {
    const status = formatStatusBadge(version.status);
    const dueDate = version.due_date || "-";
    const progress = formatProgress(version.estimated_hours, version.spent_hours);
    lines.push(`| ${version.name} | ${status} | ${dueDate} | ${progress} |`);
  }

  return lines.join("\n");
}
