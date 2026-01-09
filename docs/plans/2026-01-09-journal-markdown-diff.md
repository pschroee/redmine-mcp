# Issue Markdown Formatting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Format `get_issue` response entirely as readable Markdown instead of JSON to improve LLM readability and reduce token usage by ~80-95%.

**Architecture:** Create a `formatters/` module with functions to format issues and journals as Markdown. Large text changes in journals use line-by-line diff. The formatter is always applied in `get_issue` tool.

**Tech Stack:** TypeScript, `diff` npm package for text diffing

---

### Task 1: Install diff dependency

**Files:**
- Modify: `package.json`

**Step 1: Install the diff package**

Run: `npm install diff`
Expected: Package added to dependencies

**Step 2: Install types for diff**

Run: `npm install -D @types/diff`
Expected: Types added to devDependencies

**Step 3: Verify installation**

Run: `npm ls diff`
Expected: Shows diff package in dependency tree

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add diff dependency for journal formatting"
```

---

### Task 2: Create formatJournals utility function

**Files:**
- Create: `src/formatters/journals.ts`

**Step 1: Create the formatters directory and journals.ts file**

```typescript
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/formatters/journals.ts
git commit -m "feat: add journal markdown formatter with diff support"
```

---

### Task 3: Create formatIssue utility for full Markdown output

**Files:**
- Create: `src/formatters/issue.ts`
- Create: `src/formatters/index.ts`

**Step 1: Create issue.ts formatter**

```typescript
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
```

**Step 2: Create index.ts to export formatters**

```typescript
export { formatJournals } from "./journals.js";
export { formatIssue, formatIssueResponse } from "./issue.js";
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/formatters/
git commit -m "feat: add full issue markdown formatter"
```

---

### Task 4: Integrate formatter into get_issue tool

**Files:**
- Modify: `src/tools/core.ts`

**Step 1: Add import for formatter**

At the top of `src/tools/core.ts`, add:

```typescript
import { formatIssueResponse } from "../formatters/index.js";
```

**Step 2: Update get_issue tool handler**

Replace the `get_issue` tool registration (around line 42-57) with:

```typescript
  server.registerTool(
    "get_issue",
    {
      description: "Get details of a specific issue by ID. Returns Markdown-formatted response.",
      inputSchema: {
        issue_id: z.number().describe("The issue ID"),
        include: z.string().optional().describe("Include: attachments, relations, journals, watchers, children, changesets, allowed_statuses"),
      },
    },
    async (params) => {
      const result = await client.getIssue(params.issue_id, params.include);

      // Check if this is an error response
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Format response as Markdown
      return {
        content: [{ type: "text", text: formatIssueResponse(result) }],
      };
    }
  );
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/tools/core.ts
git commit -m "feat: integrate markdown formatter into get_issue"
```

---

### Task 5: Run tests and verify

**Files:**
- Modify: `package.json`
- Modify: `src/server.ts`

**Step 1: Run the existing test suite**

Run: `npm test`
Expected: All 198 tests pass

**Step 2: If tests fail, fix issues and re-run**

Common issues:
- Type errors: Ensure RedmineIssue type includes optional fields
- Import errors: Check relative paths use `.js` extension

**Step 3: Bump version**

Update `package.json` version to `0.4.3`
Update `src/server.ts` version to `0.4.3`

**Step 4: Final commit**

```bash
git add package.json src/server.ts
git commit -m "chore: bump version to 0.4.3"
```

---

## Example Output

**Before (JSON):** ~124,000 characters for issue with 56 journal entries

**After (Markdown):**
```markdown
# #20121: Implementierung der Kundenportal-API

**Status:** In Bearbeitung | **Priority:** Hoch | **Tracker:** Feature | **Assigned:** Max Mustermann

| Field | Value |
|-------|-------|
| Project | Kundenportal |
| Author | Anna Schmidt |
| Created | 2026-01-05 09:30 |
| Updated | 2026-01-09 14:22 |
| Estimated | 40h |
| Spent | 12h |
| Progress | 30% |

## Description

Implementierung der REST-API für das Kundenportal...

## History (56 entries)

### 2026-01-07 10:41 - Tim Dilger

Status geändert.

**Changes:**
- status: Neu → In Bearbeitung
- description:
```diff
- |Smart Assist|S018| | | |
+ |Smart Assist|S018|✅|handler@krone-bw.de|✅|
```

---

### 2026-01-06 15:22 - Anna Schmidt

Erste Implementierung begonnen.

...
```

**Estimated size:** ~5,000-8,000 characters (95% reduction)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install diff dependency | package.json |
| 2 | Create journal formatter | src/formatters/journals.ts |
| 3 | Create issue formatter | src/formatters/issue.ts, index.ts |
| 4 | Integrate into get_issue | src/tools/core.ts |
| 5 | Test and version bump | package.json, server.ts |

**Expected result:** `get_issue` always returns Markdown-formatted response, reducing response size by ~80-95% and improving LLM readability.
