import type { RedmineChecklist, RedmineChecklistsResponse } from "../redmine/types.js";

export function formatChecklist(response: { checklist: RedmineChecklist }): string {
  const item = response.checklist;
  const lines: string[] = [];

  lines.push(`# Checklist Item #${item.id}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Subject | ${item.subject} |`);
  lines.push(`| Status | ${item.is_done ? "Done" : "Pending"} |`);
  lines.push(`| Issue | #${item.issue_id} |`);
  lines.push(`| Position | ${item.position} |`);

  return lines.join("\n");
}

export function formatChecklistList(response: RedmineChecklistsResponse): string {
  const items = response.checklists;

  if (items.length === 0) {
    return "No checklist items found.";
  }

  const sorted = [...items].sort((a, b) => a.position - b.position);
  const doneCount = items.filter((i) => i.is_done).length;

  const lines: string[] = [];

  lines.push(`# Checklist (${items.length} items)`);
  lines.push(`_${doneCount}/${items.length} completed_`);
  lines.push("");

  for (const item of sorted) {
    const checkbox = item.is_done ? "[x]" : "[ ]";
    lines.push(`- ${checkbox} ${item.subject}`);
  }

  return lines.join("\n");
}
