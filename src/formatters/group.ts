import type { RedmineGroup, RedmineGroupsResponse } from "../redmine/types.js";

/**
 * Format a single group as complete Markdown
 */
export function formatGroup(response: { group: RedmineGroup }): string {
  const group = response.group;
  const lines: string[] = [];

  // Header
  lines.push(`# ${group.name}`);
  lines.push("");

  // Users
  if (group.users && group.users.length > 0) {
    lines.push("## Users");
    lines.push("");
    for (const user of group.users) {
      lines.push(`- ${user.name}`);
    }
    lines.push("");
  }

  // Project Memberships
  if (group.memberships && group.memberships.length > 0) {
    lines.push("## Project Memberships");
    lines.push("");
    for (const membership of group.memberships) {
      const roles = membership.roles.map((r) => r.name).join(", ");
      lines.push(`- **${membership.project.name}:** ${roles}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Format a list of groups as Markdown table
 */
export function formatGroupList(response: RedmineGroupsResponse): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Groups (${response.total_count})`);
  lines.push("");

  // Empty case
  if (response.groups.length === 0) {
    lines.push("No groups found.");
    return lines.join("\n");
  }

  // Table header
  lines.push("| ID | Name | Members |");
  lines.push("|----|------|---------|");

  // Table rows
  for (const group of response.groups) {
    const members = group.users && group.users.length > 0 ? String(group.users.length) : "-";
    lines.push(`| ${group.id} | ${group.name} | ${members} |`);
  }

  return lines.join("\n");
}
