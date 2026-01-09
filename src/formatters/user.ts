import type { RedmineUser, RedmineUsersResponse } from "../redmine/types.js";

const USER_STATUS: Record<number, string> = {
  1: "Active",
  2: "Registered",
  3: "Locked",
};

/**
 * Format a date string to readable format
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Format a single user as complete Markdown
 */
export function formatUser(response: { user: RedmineUser }): string {
  const user = response.user;
  const lines: string[] = [];

  // Header
  lines.push(`# ${user.firstname} ${user.lastname}`);
  lines.push("");

  // Status line
  const statusParts: string[] = [];
  statusParts.push(`**Login:** ${user.login}`);
  const status = user.status !== undefined ? USER_STATUS[user.status] || "Unknown" : "Unknown";
  statusParts.push(`**Status:** ${status}`);
  if (user.admin) {
    statusParts.push(`**Role:** Admin`);
  }
  lines.push(statusParts.join(" | "));
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  if (user.mail) {
    lines.push(`| Email | ${user.mail} |`);
  }
  lines.push(`| Created | ${formatDate(user.created_on)} |`);
  if (user.last_login_on) {
    lines.push(`| Last Login | ${formatDate(user.last_login_on)} |`);
  }
  lines.push("");

  // Groups
  if (user.groups && user.groups.length > 0) {
    lines.push("## Groups");
    lines.push("");
    for (const group of user.groups) {
      lines.push(`- ${group.name}`);
    }
    lines.push("");
  }

  // Project Memberships
  if (user.memberships && user.memberships.length > 0) {
    lines.push("## Project Memberships");
    lines.push("");
    for (const membership of user.memberships) {
      const roles = membership.roles.map((r) => r.name).join(", ");
      lines.push(`- **${membership.project.name}:** ${roles}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Format a list of users as Markdown table
 */
export function formatUserList(response: RedmineUsersResponse): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Users (${response.total_count})`);
  lines.push("");

  // Empty case
  if (response.users.length === 0) {
    lines.push("No users found.");
    return lines.join("\n");
  }

  // Table header
  lines.push("| Name | Login | Email | Status | Role |");
  lines.push("|------|-------|-------|--------|------|");

  // Table rows
  for (const user of response.users) {
    const name = `${user.firstname} ${user.lastname}`;
    const email = user.mail || "";
    const status = user.status !== undefined ? USER_STATUS[user.status] || "Unknown" : "Unknown";
    const role = user.admin ? "Admin" : "User";
    lines.push(`| ${name} | ${user.login} | ${email} | ${status} | ${role} |`);
  }

  return lines.join("\n");
}
