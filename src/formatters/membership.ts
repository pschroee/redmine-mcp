import type { RedmineMembership, RedmineMembershipsResponse } from "../redmine/types.js";

function formatRoles(roles: RedmineMembership["roles"]): string {
  return roles
    .map((r) => (r.inherited ? `${r.name} (inherited)` : r.name))
    .join(", ");
}

export function formatMembership(response: { membership: RedmineMembership }): string {
  const mem = response.membership;
  const lines: string[] = [];

  lines.push(`# Membership #${mem.id}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Project | ${mem.project.name} |`);
  if (mem.user) {
    lines.push(`| User | ${mem.user.name} |`);
  }
  if (mem.group) {
    lines.push(`| Group | ${mem.group.name} |`);
  }
  lines.push(`| Roles | ${formatRoles(mem.roles)} |`);

  return lines.join("\n");
}

export function formatMembershipList(response: RedmineMembershipsResponse): string {
  const memberships = response.memberships;
  const totalCount = response.total_count;

  if (memberships.length === 0) {
    return "No memberships found.";
  }

  const lines: string[] = [];

  lines.push(`# Project Memberships (${totalCount})`);
  lines.push("");
  lines.push("| ID | User/Group | Type | Roles |");
  lines.push("|----|------------|------|-------|");

  for (const mem of memberships) {
    const name = mem.user?.name || mem.group?.name || "Unknown";
    const type = mem.user ? "User" : "Group";
    const roles = formatRoles(mem.roles);
    lines.push(`| ${mem.id} | ${name} | ${type} | ${roles} |`);
  }

  return lines.join("\n");
}
