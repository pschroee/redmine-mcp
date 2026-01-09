import { diffLines } from "diff";
import type { RedmineJournal } from "../redmine/types.js";

/**
 * Fields that contain large text and should use diff formatting
 */
const LARGE_TEXT_FIELDS = ["description"];

/**
 * Format a date string to a readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Generate a unified diff for large text changes
 */
function generateDiff(oldValue: string, newValue: string): string {
  const changes = diffLines(oldValue || "", newValue || "");
  const lines: string[] = [];

  for (const change of changes) {
    const prefix = change.added ? "+" : change.removed ? "-" : " ";
    const text = change.value.replace(/\n$/, "");

    // Skip unchanged parts that are too long (context)
    if (!change.added && !change.removed && text.length > 200) {
      lines.push("  [...]");
      continue;
    }

    for (const line of text.split("\n")) {
      if (line || change.added || change.removed) {
        lines.push(`${prefix} ${line}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format a single journal detail (field change)
 */
function formatDetail(detail: { property: string; name: string; old_value?: string; new_value?: string }): string {
  const { property, name, old_value, new_value } = detail;

  // Handle attachment additions/removals
  if (property === "attachment") {
    if (new_value && !old_value) {
      return `- Added attachment: ${new_value}`;
    }
    if (old_value && !new_value) {
      return `- Removed attachment: ${old_value}`;
    }
  }

  // Handle relation changes
  if (property === "relation") {
    if (new_value && !old_value) {
      return `- Added relation: ${name} → #${new_value}`;
    }
    if (old_value && !new_value) {
      return `- Removed relation: ${name} → #${old_value}`;
    }
  }

  // Handle custom fields
  if (property === "cf") {
    const fieldName = name;
    if (!old_value && new_value) {
      return `- ${fieldName}: _(empty)_ → ${new_value}`;
    }
    if (old_value && !new_value) {
      return `- ${fieldName}: ${old_value} → _(empty)_`;
    }
    return `- ${fieldName}: ${old_value} → ${new_value}`;
  }

  // Handle attribute changes
  if (property === "attr") {
    // Large text fields get diff formatting
    if (LARGE_TEXT_FIELDS.includes(name) && old_value && new_value) {
      const diff = generateDiff(old_value, new_value);
      return `- ${name}:\n\`\`\`diff\n${diff}\n\`\`\``;
    }

    // Simple field changes
    const oldDisplay = old_value || "_(empty)_";
    const newDisplay = new_value || "_(empty)_";
    return `- ${name}: ${oldDisplay} → ${newDisplay}`;
  }

  // Fallback for unknown property types
  return `- ${property}.${name}: ${old_value || "_(empty)_"} → ${new_value || "_(empty)_"}`;
}

/**
 * Format a single journal entry as Markdown
 */
function formatJournalEntry(journal: RedmineJournal): string {
  const lines: string[] = [];

  // Header with date and user
  const date = formatDate(journal.created_on);
  const user = journal.user.name;
  const privateTag = journal.private_notes ? " 🔒" : "";
  lines.push(`### ${date} - ${user}${privateTag}`);
  lines.push("");

  // Notes (if any)
  if (journal.notes && journal.notes.trim()) {
    lines.push(journal.notes.trim());
    lines.push("");
  }

  // Details (field changes)
  if (journal.details && journal.details.length > 0) {
    lines.push("**Changes:**");
    for (const detail of journal.details) {
      lines.push(formatDetail(detail));
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format an array of journal entries as Markdown
 */
export function formatJournals(journals: RedmineJournal[]): string {
  if (!journals || journals.length === 0) {
    return "";
  }

  const header = `## History (${journals.length} entries)\n\n`;
  const entries = journals.map(formatJournalEntry).join("\n---\n\n");

  return header + entries;
}
