# Markdown Output Formatters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all tool outputs from raw JSON to human-readable Markdown format for better LLM consumption.

**Architecture:** Create dedicated formatter functions in `src/formatters/` for each entity type. Each formatter transforms Redmine API responses into structured Markdown with tables, lists, and headers. Tools import and use these formatters instead of `JSON.stringify()`.

**Tech Stack:** TypeScript, existing formatter pattern from `src/formatters/issue.ts`

---

## Current State

- **64 Tools** total across 14 tool files
- **1 Tool** (`get_issue`) already uses Markdown via `formatIssueResponse()`
- **63 Tools** return raw JSON via `JSON.stringify(result, null, 2)`

## Scope

**Phase 1 (Priority):** Read-only list/get tools that return large data → 15 tools
**Phase 2:** Write operation confirmations → 20+ tools  
**Phase 3:** Remaining metadata/admin tools → 28+ tools

---

## Task 1: Create `formatIssueList()` Formatter

**Files:**
- Modify: `src/formatters/issue.ts`
- Modify: `src/formatters/index.ts`
- Test: `tests/formatters/issue.test.ts` (create)

**Step 1: Write the failing test**

Create `tests/formatters/issue.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatIssueList } from "../src/formatters/issue.js";

describe("formatIssueList", () => {
  it("should format issue list as markdown table", () => {
    const response = {
      issues: [
        {
          id: 123,
          subject: "Fix login bug",
          status: { id: 1, name: "New" },
          priority: { id: 2, name: "Normal" },
          project: { id: 1, name: "My Project" },
          author: { id: 1, name: "John" },
          assigned_to: { id: 2, name: "Jane" },
          updated_on: "2026-01-09T10:00:00Z",
          created_on: "2026-01-08T10:00:00Z",
        },
        {
          id: 124,
          subject: "Add feature X",
          status: { id: 2, name: "In Progress" },
          priority: { id: 3, name: "High" },
          project: { id: 1, name: "My Project" },
          author: { id: 1, name: "John" },
          updated_on: "2026-01-09T11:00:00Z",
          created_on: "2026-01-07T10:00:00Z",
        },
      ],
      total_count: 50,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("# Issues (2 of 50)");
    expect(result).toContain("| #123 |");
    expect(result).toContain("| Fix login bug |");
    expect(result).toContain("| New |");
    expect(result).toContain("| Jane |");
    expect(result).toContain("| #124 |");
    expect(result).toContain("| _(unassigned)_ |");
  });

  it("should handle empty issue list", () => {
    const response = {
      issues: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("No issues found");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/formatters/issue.test.ts`
Expected: FAIL with "formatIssueList is not exported"

**Step 3: Write minimal implementation**

Add to `src/formatters/issue.ts`:

```typescript
import type { RedmineIssuesResponse } from "../redmine/types.js";

/**
 * Format a date string to readable format
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 10);
}

/**
 * Format an issue list as Markdown table
 */
export function formatIssueList(response: RedmineIssuesResponse): string {
  const { issues, total_count, offset, limit } = response;

  if (issues.length === 0) {
    return "No issues found.";
  }

  const lines: string[] = [];

  // Header with count
  lines.push(`# Issues (${issues.length} of ${total_count})`);
  if (offset > 0 || total_count > limit) {
    lines.push(`_Showing ${offset + 1}-${offset + issues.length} of ${total_count}_`);
  }
  lines.push("");

  // Table header
  lines.push("| ID | Subject | Status | Priority | Assigned | Updated |");
  lines.push("|---:|---------|--------|----------|----------|---------|");

  // Table rows
  for (const issue of issues) {
    const assigned = issue.assigned_to?.name || "_(unassigned)_";
    const updated = formatDate(issue.updated_on);
    lines.push(
      `| #${issue.id} | ${issue.subject} | ${issue.status.name} | ${issue.priority.name} | ${assigned} | ${updated} |`
    );
  }

  return lines.join("\n");
}
```

**Step 4: Export from index**

Add to `src/formatters/index.ts`:

```typescript
export { formatJournals, type NameLookup } from "./journals.js";
export { formatIssue, formatIssueResponse, formatIssueList } from "./issue.js";
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/formatters/issue.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/formatters/issue.ts src/formatters/index.ts tests/formatters/issue.test.ts
git commit -m "feat: add formatIssueList() for markdown issue tables"
```

---

## Task 2: Wire `list_issues` to Use Formatter

**Files:**
- Modify: `src/tools/core.ts:35-40`

**Step 1: Update import**

In `src/tools/core.ts`, change line 4:

```typescript
// Before:
import { formatIssueResponse, type NameLookup } from "../formatters/index.js";

// After:
import { formatIssueResponse, formatIssueList, type NameLookup } from "../formatters/index.js";
```

**Step 2: Update list_issues handler**

Replace lines 35-40:

```typescript
// Before:
async (params) => {
  const result = await client.listIssues(params);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// After:
async (params) => {
  const result = await client.listIssues(params);
  if ("error" in result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: formatIssueList(result) }],
  };
}
```

**Step 3: Run existing tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/tools/core.ts
git commit -m "feat: list_issues now returns markdown table"
```

---

## Task 3: Create `formatProject()` and `formatProjectList()` Formatters

**Files:**
- Create: `src/formatters/project.ts`
- Modify: `src/formatters/index.ts`
- Test: `tests/formatters/project.test.ts` (create)

**Step 1: Write the failing test**

Create `tests/formatters/project.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatProject, formatProjectList } from "../src/formatters/project.js";

describe("formatProject", () => {
  it("should format single project as markdown", () => {
    const response = {
      project: {
        id: 1,
        name: "My Project",
        identifier: "my-project",
        description: "A test project",
        status: 1,
        is_public: true,
        created_on: "2026-01-01T10:00:00Z",
        updated_on: "2026-01-09T10:00:00Z",
      },
    };

    const result = formatProject(response);

    expect(result).toContain("# My Project");
    expect(result).toContain("my-project");
    expect(result).toContain("A test project");
  });
});

describe("formatProjectList", () => {
  it("should format project list as markdown table", () => {
    const response = {
      projects: [
        {
          id: 1,
          name: "Project A",
          identifier: "project-a",
          status: 1,
          is_public: true,
          created_on: "2026-01-01T10:00:00Z",
          updated_on: "2026-01-09T10:00:00Z",
        },
        {
          id: 2,
          name: "Project B",
          identifier: "project-b",
          status: 1,
          is_public: false,
          created_on: "2026-01-02T10:00:00Z",
          updated_on: "2026-01-08T10:00:00Z",
        },
      ],
      total_count: 2,
      offset: 0,
      limit: 25,
    };

    const result = formatProjectList(response);

    expect(result).toContain("# Projects (2)");
    expect(result).toContain("| Project A |");
    expect(result).toContain("| project-a |");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/formatters/project.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write implementation**

Create `src/formatters/project.ts`:

```typescript
import type { RedmineProject, RedmineProjectsResponse } from "../redmine/types.js";

const PROJECT_STATUS: Record<number, string> = {
  1: "Active",
  5: "Closed",
  9: "Archived",
};

/**
 * Format a single project as Markdown
 */
export function formatProject(response: { project: RedmineProject }): string {
  const p = response.project;
  const lines: string[] = [];

  lines.push(`# ${p.name}`);
  lines.push("");

  // Status line
  const statusParts: string[] = [];
  statusParts.push(`**Identifier:** ${p.identifier}`);
  statusParts.push(`**Status:** ${PROJECT_STATUS[p.status] || p.status}`);
  statusParts.push(`**Public:** ${p.is_public ? "Yes" : "No"}`);
  lines.push(statusParts.join(" | "));
  lines.push("");

  // Description
  if (p.description) {
    lines.push("## Description");
    lines.push("");
    lines.push(p.description);
    lines.push("");
  }

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  if (p.parent) {
    lines.push(`| Parent | ${p.parent.name} |`);
  }
  if (p.homepage) {
    lines.push(`| Homepage | ${p.homepage} |`);
  }
  lines.push(`| Created | ${p.created_on.slice(0, 10)} |`);
  lines.push(`| Updated | ${p.updated_on.slice(0, 10)} |`);
  lines.push("");

  // Trackers
  if (p.trackers && p.trackers.length > 0) {
    lines.push("## Trackers");
    lines.push(p.trackers.map(t => t.name).join(", "));
    lines.push("");
  }

  // Enabled modules
  if (p.enabled_modules && p.enabled_modules.length > 0) {
    lines.push("## Enabled Modules");
    lines.push(p.enabled_modules.map(m => m.name).join(", "));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format a project list as Markdown table
 */
export function formatProjectList(response: RedmineProjectsResponse): string {
  const { projects, total_count } = response;

  if (projects.length === 0) {
    return "No projects found.";
  }

  const lines: string[] = [];

  lines.push(`# Projects (${total_count})`);
  lines.push("");

  lines.push("| Name | Identifier | Status | Public |");
  lines.push("|------|------------|--------|--------|");

  for (const p of projects) {
    const status = PROJECT_STATUS[p.status] || String(p.status);
    lines.push(`| ${p.name} | ${p.identifier} | ${status} | ${p.is_public ? "Yes" : "No"} |`);
  }

  return lines.join("\n");
}
```

**Step 4: Export from index**

Update `src/formatters/index.ts`:

```typescript
export { formatJournals, type NameLookup } from "./journals.js";
export { formatIssue, formatIssueResponse, formatIssueList } from "./issue.js";
export { formatProject, formatProjectList } from "./project.js";
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/formatters/project.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/formatters/project.ts src/formatters/index.ts tests/formatters/project.test.ts
git commit -m "feat: add formatProject() and formatProjectList() formatters"
```

---

## Task 4: Wire Project Tools to Use Formatters

**Files:**
- Modify: `src/tools/core.ts`

**Step 1: Update imports**

Add to imports in `src/tools/core.ts`:

```typescript
import { formatIssueResponse, formatIssueList, type NameLookup } from "../formatters/index.js";
import { formatProject, formatProjectList } from "../formatters/index.js";
```

Or combine into one import:

```typescript
import { 
  formatIssueResponse, 
  formatIssueList, 
  formatProject, 
  formatProjectList, 
  type NameLookup 
} from "../formatters/index.js";
```

**Step 2: Update list_projects handler**

Find the `list_projects` handler and update:

```typescript
// Before:
async (params) => {
  const result = await client.listProjects(params);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// After:
async (params) => {
  const result = await client.listProjects(params);
  if ("error" in result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: formatProjectList(result) }],
  };
}
```

**Step 3: Update get_project handler**

Find the `get_project` handler and update:

```typescript
// Before:
async (params) => {
  const result = await client.getProject(params.project_id, params.include);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// After:
async (params) => {
  const result = await client.getProject(params.project_id, params.include);
  if ("error" in result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: formatProject(result) }],
  };
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/tools/core.ts
git commit -m "feat: list_projects and get_project now return markdown"
```

---

## Task 5: Create `formatUser()` and `formatUserList()` Formatters

**Files:**
- Create: `src/formatters/user.ts`
- Modify: `src/formatters/index.ts`
- Test: `tests/formatters/user.test.ts` (create)

**Step 1: Write the failing test**

Create `tests/formatters/user.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatUser, formatUserList } from "../src/formatters/user.js";

describe("formatUser", () => {
  it("should format single user as markdown", () => {
    const response = {
      user: {
        id: 1,
        login: "jdoe",
        firstname: "John",
        lastname: "Doe",
        mail: "john@example.com",
        admin: false,
        status: 1,
        created_on: "2026-01-01T10:00:00Z",
        last_login_on: "2026-01-09T10:00:00Z",
      },
    };

    const result = formatUser(response);

    expect(result).toContain("# John Doe");
    expect(result).toContain("jdoe");
    expect(result).toContain("john@example.com");
  });
});

describe("formatUserList", () => {
  it("should format user list as markdown table", () => {
    const response = {
      users: [
        {
          id: 1,
          login: "jdoe",
          firstname: "John",
          lastname: "Doe",
          mail: "john@example.com",
          admin: false,
          status: 1,
          created_on: "2026-01-01T10:00:00Z",
        },
        {
          id: 2,
          login: "jane",
          firstname: "Jane",
          lastname: "Smith",
          mail: "jane@example.com",
          admin: true,
          status: 1,
          created_on: "2026-01-02T10:00:00Z",
        },
      ],
      total_count: 2,
      offset: 0,
      limit: 25,
    };

    const result = formatUserList(response);

    expect(result).toContain("# Users (2)");
    expect(result).toContain("| John Doe |");
    expect(result).toContain("| jdoe |");
    expect(result).toContain("| Admin |"); // Jane is admin
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/formatters/user.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `src/formatters/user.ts`:

```typescript
import type { RedmineUser, RedmineUsersResponse } from "../redmine/types.js";

const USER_STATUS: Record<number, string> = {
  1: "Active",
  2: "Registered",
  3: "Locked",
};

/**
 * Format a single user as Markdown
 */
export function formatUser(response: { user: RedmineUser }): string {
  const u = response.user;
  const lines: string[] = [];

  lines.push(`# ${u.firstname} ${u.lastname}`);
  lines.push("");

  // Status line
  const statusParts: string[] = [];
  statusParts.push(`**Login:** ${u.login}`);
  statusParts.push(`**Status:** ${USER_STATUS[u.status] || u.status}`);
  if (u.admin) {
    statusParts.push("**Role:** Admin");
  }
  lines.push(statusParts.join(" | "));
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Email | ${u.mail} |`);
  lines.push(`| Created | ${u.created_on.slice(0, 10)} |`);
  if (u.last_login_on) {
    lines.push(`| Last Login | ${u.last_login_on.slice(0, 10)} |`);
  }
  lines.push("");

  // Groups
  if (u.groups && u.groups.length > 0) {
    lines.push("## Groups");
    lines.push(u.groups.map(g => g.name).join(", "));
    lines.push("");
  }

  // Memberships
  if (u.memberships && u.memberships.length > 0) {
    lines.push("## Project Memberships");
    for (const m of u.memberships) {
      const roles = m.roles.map(r => r.name).join(", ");
      lines.push(`- **${m.project.name}:** ${roles}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format a user list as Markdown table
 */
export function formatUserList(response: RedmineUsersResponse): string {
  const { users, total_count } = response;

  if (users.length === 0) {
    return "No users found.";
  }

  const lines: string[] = [];

  lines.push(`# Users (${total_count})`);
  lines.push("");

  lines.push("| Name | Login | Email | Status | Role |");
  lines.push("|------|-------|-------|--------|------|");

  for (const u of users) {
    const name = `${u.firstname} ${u.lastname}`;
    const status = USER_STATUS[u.status] || String(u.status);
    const role = u.admin ? "Admin" : "User";
    lines.push(`| ${name} | ${u.login} | ${u.mail} | ${status} | ${role} |`);
  }

  return lines.join("\n");
}
```

**Step 4: Export from index**

Update `src/formatters/index.ts`:

```typescript
export { formatJournals, type NameLookup } from "./journals.js";
export { formatIssue, formatIssueResponse, formatIssueList } from "./issue.js";
export { formatProject, formatProjectList } from "./project.js";
export { formatUser, formatUserList } from "./user.js";
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/formatters/user.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/formatters/user.ts src/formatters/index.ts tests/formatters/user.test.ts
git commit -m "feat: add formatUser() and formatUserList() formatters"
```

---

## Task 6: Wire User Tools to Use Formatters

**Files:**
- Modify: `src/tools/admin.ts`

**Step 1: Add import**

Add at top of `src/tools/admin.ts`:

```typescript
import { formatUser, formatUserList } from "../formatters/index.js";
```

**Step 2: Update list_users handler**

```typescript
// Before:
async (params) => {
  const result = await client.listUsers(params);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// After:
async (params) => {
  const result = await client.listUsers(params);
  if ("error" in result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: formatUserList(result) }],
  };
}
```

**Step 3: Update get_user handler**

```typescript
// Before:
async (params) => {
  const result = await client.getUser(params.user_id, params.include);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

// After:
async (params) => {
  const result = await client.getUser(params.user_id, params.include);
  if ("error" in result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: formatUser(result) }],
  };
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/tools/admin.ts
git commit -m "feat: list_users and get_user now return markdown"
```

---

## Task 7: Create Wiki Formatter

**Files:**
- Create: `src/formatters/wiki.ts`
- Modify: `src/formatters/index.ts`

**Step 1: Write test**

Create `tests/formatters/wiki.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatWikiPage, formatWikiPageList } from "../src/formatters/wiki.js";

describe("formatWikiPage", () => {
  it("should format wiki page as markdown", () => {
    const response = {
      wiki_page: {
        title: "Start",
        text: "# Welcome\n\nThis is the start page.",
        version: 5,
        author: { id: 1, name: "John" },
        created_on: "2026-01-01T10:00:00Z",
        updated_on: "2026-01-09T10:00:00Z",
      },
    };

    const result = formatWikiPage(response);

    expect(result).toContain("# Start");
    expect(result).toContain("Version 5");
    expect(result).toContain("John");
    expect(result).toContain("# Welcome");
  });
});

describe("formatWikiPageList", () => {
  it("should format wiki page index as list", () => {
    const response = {
      wiki_pages: [
        { title: "Start", version: 1 },
        { title: "FAQ", parent: { title: "Start" }, version: 3 },
        { title: "Install", parent: { title: "Start" }, version: 2 },
      ],
    };

    const result = formatWikiPageList(response);

    expect(result).toContain("# Wiki Pages (3)");
    expect(result).toContain("Start");
    expect(result).toContain("FAQ");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/formatters/wiki.test.ts`

**Step 3: Write implementation**

Create `src/formatters/wiki.ts`:

```typescript
import type { RedmineWikiPage, RedmineWikiPagesResponse } from "../redmine/types.js";

/**
 * Format a single wiki page as Markdown
 */
export function formatWikiPage(response: { wiki_page: RedmineWikiPage }): string {
  const p = response.wiki_page;
  const lines: string[] = [];

  lines.push(`# ${p.title}`);
  lines.push("");

  // Metadata
  const meta: string[] = [];
  meta.push(`**Version:** ${p.version}`);
  meta.push(`**Author:** ${p.author.name}`);
  meta.push(`**Updated:** ${p.updated_on.slice(0, 10)}`);
  if (p.parent) {
    meta.push(`**Parent:** ${p.parent.title}`);
  }
  lines.push(meta.join(" | "));
  lines.push("");

  // Content
  lines.push("---");
  lines.push("");
  lines.push(p.text);

  // Attachments
  if (p.attachments && p.attachments.length > 0) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Attachments");
    for (const att of p.attachments) {
      lines.push(`- [${att.filename}](${att.content_url})`);
    }
  }

  return lines.join("\n");
}

/**
 * Format wiki page list as Markdown
 */
export function formatWikiPageList(response: RedmineWikiPagesResponse): string {
  const pages = response.wiki_pages;

  if (pages.length === 0) {
    return "No wiki pages found.";
  }

  const lines: string[] = [];

  lines.push(`# Wiki Pages (${pages.length})`);
  lines.push("");

  // Build tree structure
  const roots = pages.filter(p => !p.parent);
  const children = new Map<string, typeof pages>();
  
  for (const page of pages) {
    if (page.parent) {
      const parentTitle = page.parent.title;
      if (!children.has(parentTitle)) {
        children.set(parentTitle, []);
      }
      children.get(parentTitle)!.push(page);
    }
  }

  function renderPage(page: typeof pages[0], indent: string): void {
    lines.push(`${indent}- **${page.title}** (v${page.version})`);
    const kids = children.get(page.title) || [];
    for (const child of kids) {
      renderPage(child, indent + "  ");
    }
  }

  for (const root of roots) {
    renderPage(root, "");
  }

  return lines.join("\n");
}
```

**Step 4: Export from index**

Update `src/formatters/index.ts`:

```typescript
export { formatJournals, type NameLookup } from "./journals.js";
export { formatIssue, formatIssueResponse, formatIssueList } from "./issue.js";
export { formatProject, formatProjectList } from "./project.js";
export { formatUser, formatUserList } from "./user.js";
export { formatWikiPage, formatWikiPageList } from "./wiki.js";
```

**Step 5: Run test**

Run: `npm test -- tests/formatters/wiki.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/formatters/wiki.ts src/formatters/index.ts tests/formatters/wiki.test.ts
git commit -m "feat: add formatWikiPage() and formatWikiPageList() formatters"
```

---

## Task 8: Wire Wiki Tools to Use Formatters

**Files:**
- Modify: `src/tools/wiki.ts`

**Step 1: Add import**

```typescript
import { formatWikiPage, formatWikiPageList } from "../formatters/index.js";
```

**Step 2: Update list_wiki_pages and get_wiki_page handlers**

(Same pattern as previous tasks)

**Step 3: Run tests and commit**

```bash
git add src/tools/wiki.ts
git commit -m "feat: wiki tools now return markdown"
```

---

## Task 9: Create Search Results Formatter

**Files:**
- Create: `src/formatters/search.ts`
- Modify: `src/formatters/index.ts`

**Step 1: Write test**

Create `tests/formatters/search.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatSearchResults } from "../src/formatters/search.js";

describe("formatSearchResults", () => {
  it("should format search results as markdown", () => {
    const response = {
      results: [
        {
          id: 123,
          title: "Issue #123: Fix login bug",
          type: "issue",
          url: "/issues/123",
          description: "Login fails when...",
          datetime: "2026-01-09T10:00:00Z",
        },
        {
          id: 1,
          title: "Wiki: Start",
          type: "wiki-page",
          url: "/projects/test/wiki/Start",
          description: "Welcome to the wiki",
          datetime: "2026-01-08T10:00:00Z",
        },
      ],
      total_count: 50,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("# Search Results (2 of 50)");
    expect(result).toContain("Issue #123");
    expect(result).toContain("Wiki: Start");
  });
});
```

**Step 2: Write implementation**

Create `src/formatters/search.ts`:

```typescript
import type { RedmineSearchResponse } from "../redmine/types.js";

/**
 * Format search results as Markdown
 */
export function formatSearchResults(response: RedmineSearchResponse): string {
  const { results, total_count, offset } = response;

  if (results.length === 0) {
    return "No results found.";
  }

  const lines: string[] = [];

  lines.push(`# Search Results (${results.length} of ${total_count})`);
  if (offset > 0) {
    lines.push(`_Starting from result ${offset + 1}_`);
  }
  lines.push("");

  for (const r of results) {
    const typeIcon = r.type === "issue" ? "🎫" : r.type === "wiki-page" ? "📄" : "📁";
    lines.push(`### ${typeIcon} ${r.title}`);
    lines.push(`**Type:** ${r.type} | **Date:** ${r.datetime.slice(0, 10)}`);
    if (r.description) {
      lines.push("");
      lines.push(r.description.slice(0, 200) + (r.description.length > 200 ? "..." : ""));
    }
    lines.push("");
  }

  return lines.join("\n");
}
```

**Step 3: Export and test**

**Step 4: Commit**

```bash
git add src/formatters/search.ts src/formatters/index.ts tests/formatters/search.test.ts
git commit -m "feat: add formatSearchResults() formatter"
```

---

## Task 10: Wire Search Tool

**Files:**
- Modify: `src/tools/search.ts`

Same pattern as before.

---

## Task 11-15: Remaining Formatters

Create formatters for remaining entity types following the same pattern:

| Task | Formatter File | Entities |
|------|----------------|----------|
| 11 | `time.ts` | `formatTimeEntry()`, `formatTimeEntryList()` |
| 12 | `version.ts` | `formatVersion()`, `formatVersionList()` |
| 13 | `sprint.ts` | `formatSprint()`, `formatSprintList()` |
| 14 | `group.ts` | `formatGroup()`, `formatGroupList()` |
| 15 | `metadata.ts` | `formatTrackerList()`, `formatStatusList()`, etc. |

Each task follows the same TDD pattern:
1. Write failing test
2. Run test to verify failure
3. Write implementation
4. Run test to verify pass
5. Wire to tool
6. Commit

---

## Final Task: Version Bump and Release

**Step 1: Update version**

In `package.json` and `src/server.ts`:
```
0.4.5 → 0.5.0
```

**Step 2: Run all tests**

```bash
npm test
```

**Step 3: Build**

```bash
npm run build
```

**Step 4: Commit and tag**

```bash
git add -A
git commit -m "feat: all tools now return markdown output

BREAKING CHANGE: Tool outputs changed from JSON to Markdown.
Use raw API calls if you need JSON.

- Add formatters for issues, projects, users, wiki, search, time, versions
- All list/get tools return human-readable markdown tables
- Reduces token usage significantly for LLM consumers
- Bump version to 0.5.0"

git tag v0.5.0
```

**Step 5: Publish**

```bash
npm publish
git push && git push --tags
```

---

## Summary

| Phase | Tasks | Tools Converted |
|-------|-------|-----------------|
| 1 | Tasks 1-10 | 10 tools (issues, projects, users, wiki, search) |
| 2 | Tasks 11-15 | 10 tools (time, versions, sprints, groups, metadata) |
| 3 | Final | Version bump, release |

**Estimated Time:** ~4-6 hours
**Token Savings:** ~50-80% reduction in output tokens for typical queries
