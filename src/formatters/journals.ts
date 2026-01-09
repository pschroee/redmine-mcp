import { diffLines } from "diff";
import type { RedmineJournal } from "../redmine/types.js";
import { formatDate } from "./utils.js";

/**
 * Lookup map for resolving IDs to names
 * Key: field name (e.g., "status_id"), Value: map of ID -> name
 */
export type NameLookup = Record<string, Record<string, string>>;

/**
 * Options for formatting journals
 */
export interface JournalFormatOptions {
  includeDescriptionDiffs?: boolean;
}

/**
 * Fields that contain large text and should use diff formatting
 */
const LARGE_TEXT_FIELDS = ["description"];

/**
 * Checklist item structure from JSON
 */
interface ChecklistItem {
  id?: number;
  subject: string;
  is_done: boolean;
  position?: number;
}

/**
 * Format checklist changes as a readable diff
 * Only shows items that changed between old and new state
 */
function formatChecklistDiff(oldValue: string, newValue: string): string {
  let oldItems: ChecklistItem[] = [];
  let newItems: ChecklistItem[] = [];

  try {
    oldItems = JSON.parse(oldValue || "[]");
  } catch {
    // Invalid JSON, fall back to raw display
    return null as unknown as string;
  }

  try {
    newItems = JSON.parse(newValue || "[]");
  } catch {
    return null as unknown as string;
  }

  // Create maps for easy lookup by subject (more reliable than ID for diffing)
  const oldBySubject = new Map(oldItems.map(item => [item.subject, item]));
  const newBySubject = new Map(newItems.map(item => [item.subject, item]));

  const changes: string[] = [];

  // Find changed and added items
  for (const newItem of newItems) {
    const oldItem = oldBySubject.get(newItem.subject);
    
    if (!oldItem) {
      // New item added
      const status = newItem.is_done ? "✅" : "❌";
      changes.push(`  - ➕ ${newItem.subject}: ${status}`);
    } else if (oldItem.is_done !== newItem.is_done) {
      // Status changed
      const oldStatus = oldItem.is_done ? "✅" : "❌";
      const newStatus = newItem.is_done ? "✅" : "❌";
      changes.push(`  - ${newItem.subject}: ${oldStatus} → ${newStatus}`);
    }
    // If subject and status are same, no change to report
  }

  // Find removed items
  for (const oldItem of oldItems) {
    if (!newBySubject.has(oldItem.subject)) {
      const status = oldItem.is_done ? "✅" : "❌";
      changes.push(`  - ➖ ${oldItem.subject}: ${status}`);
    }
  }

  if (changes.length === 0) {
    return null as unknown as string; // No meaningful changes
  }

  return changes.join("\n");
}

/**
 * Field name mappings for display (remove _id suffix)
 */
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  status_id: "status",
  tracker_id: "tracker",
  priority_id: "priority",
  assigned_to_id: "assigned_to",
  category_id: "category",
  fixed_version_id: "version",
  parent_id: "parent",
  project_id: "project",
};

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
 * Resolve an ID value to a display string with name
 */
function resolveValue(fieldName: string, value: string | undefined, lookup: NameLookup): string {
  if (!value) return "_(empty)_";

  const fieldLookup = lookup[fieldName];
  if (fieldLookup && fieldLookup[value]) {
    return `${fieldLookup[value]} (${value})`;
  }

  // For parent_id, show as issue reference
  if (fieldName === "parent_id") {
    return `#${value}`;
  }

  return value;
}

/**
 * Format a single journal detail (field change)
 */
function formatDetail(detail: { property: string; name: string; old_value?: string; new_value?: string }, lookup: NameLookup, options: JournalFormatOptions = {}): string {
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
    // Checklist changes get special formatting
    if (name === "checklist") {
      const checklistDiff = formatChecklistDiff(old_value || "", new_value || "");
      if (checklistDiff) {
        return `- checklist:\n${checklistDiff}`;
      }
      // Fall through to default formatting if parsing failed
    }

    // Large text fields get diff formatting (only if option enabled)
    if (LARGE_TEXT_FIELDS.includes(name) && old_value && new_value) {
      if (!options.includeDescriptionDiffs) {
        return `- ${name}: _(changed - use include_description_diffs to see diff)_`;
      }
      const diff = generateDiff(old_value, new_value);
      return `- ${name}:\n\`\`\`diff\n${diff}\n\`\`\``;
    }

    // Get display name for the field
    const displayName = FIELD_DISPLAY_NAMES[name] || name;

    // Resolve ID fields to names
    if (name.endsWith("_id") && lookup[name]) {
      const oldDisplay = resolveValue(name, old_value, lookup);
      const newDisplay = resolveValue(name, new_value, lookup);
      return `- ${displayName}: ${oldDisplay} → ${newDisplay}`;
    }

    // Simple field changes
    const oldDisplay = old_value || "_(empty)_";
    const newDisplay = new_value || "_(empty)_";
    return `- ${displayName}: ${oldDisplay} → ${newDisplay}`;
  }

  // Fallback for unknown property types
  return `- ${property}.${name}: ${old_value || "_(empty)_"} → ${new_value || "_(empty)_"}`;
}

/**
 * Format a single journal entry as Markdown
 */
function formatJournalEntry(journal: RedmineJournal, index: number, lookup: NameLookup, options: JournalFormatOptions = {}): string {
  const lines: string[] = [];

  // Header with note number, date and user
  const noteNum = index + 1;
  const date = formatDate(journal.created_on);
  const user = journal.user.name;
  const privateTag = journal.private_notes ? " 🔒" : "";
  
  lines.push(`### #${noteNum} - ${date} - ${user}${privateTag}`);
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
      lines.push(formatDetail(detail, lookup, options));
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format an array of journal entries as Markdown
 * Entries are displayed in reverse chronological order (newest first)
 * Note numbers are preserved (1 = oldest, highest = newest)
 */
export function formatJournals(journals: RedmineJournal[], lookup: NameLookup = {}, options: JournalFormatOptions = {}): string {
  if (!journals || journals.length === 0) {
    return "";
  }

  const header = `## History (${journals.length} entries)\n\n`;
  
  // Format entries with their original indices (for note numbers), then reverse for display
  const formattedEntries = journals.map((j, i) => formatJournalEntry(j, i, lookup, options));
  const entries = formattedEntries.reverse().join("\n---\n\n");

  return header + entries;
}
