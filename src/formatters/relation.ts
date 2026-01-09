import type { RedmineRelation, RedmineRelationsResponse } from "../redmine/types.js";

const RELATION_LABELS: Record<string, string> = {
  relates: "relates",
  duplicates: "duplicates",
  duplicated: "duplicated by",
  blocks: "blocks",
  blocked: "blocked by",
  precedes: "precedes",
  follows: "follows",
  copied_to: "copied to",
  copied_from: "copied from",
};

export function formatRelation(response: { relation: RedmineRelation }): string {
  const rel = response.relation;
  const lines: string[] = [];

  lines.push(`# Relation #${rel.id}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Issue | #${rel.issue_id} |`);
  lines.push(`| Type | ${RELATION_LABELS[rel.relation_type] || rel.relation_type} |`);
  lines.push(`| Related To | #${rel.issue_to_id} |`);
  if (rel.delay !== undefined && rel.delay > 0) {
    lines.push(`| Delay | ${rel.delay} days |`);
  }

  return lines.join("\n");
}

export function formatRelationList(response: RedmineRelationsResponse): string {
  const relations = response.relations;

  if (relations.length === 0) {
    return "No relations found.";
  }

  const lines: string[] = [];
  const hasDelay = relations.some((r) => r.delay !== undefined && r.delay > 0);

  lines.push(`# Issue Relations (${relations.length})`);
  lines.push("");

  if (hasDelay) {
    lines.push("| ID | Issue | Type | Related To | Delay |");
    lines.push("|----|-------|------|------------|-------|");
  } else {
    lines.push("| ID | Issue | Type | Related To |");
    lines.push("|----|-------|------|------------|");
  }

  for (const rel of relations) {
    const type = RELATION_LABELS[rel.relation_type] || rel.relation_type;
    if (hasDelay) {
      const delay = rel.delay ? `${rel.delay} days` : "";
      lines.push(`| ${rel.id} | #${rel.issue_id} | ${type} | #${rel.issue_to_id} | ${delay} |`);
    } else {
      lines.push(`| ${rel.id} | #${rel.issue_id} | ${type} | #${rel.issue_to_id} |`);
    }
  }

  return lines.join("\n");
}
