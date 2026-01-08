# Integration Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 130 integration tests for all 44 MCP tools against a real Redmine instance.

**Architecture:** Vitest with sequential test files sharing state. Tests run in order: account → core → metadata → relations → wiki → files → search. Shared state stores IDs between tests. Cleanup deletes test project at end.

**Tech Stack:** Vitest, dotenv, TypeScript

---

## Phase 1: Setup & Configuration

> All tasks in this phase can be executed in **parallel**.

---

### Task 1.1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install vitest and dotenv as dev dependencies**

Run:
```bash
npm install -D vitest dotenv
```

**Step 2: Verify installation**

Run:
```bash
npm ls vitest dotenv
```

Expected: Both packages listed

---

### Task 1.2: Create Vitest Config

**Files:**
- Create: `vitest.config.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    sequence: { shuffle: false },
    testTimeout: 10000,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/account.test.ts",
      "tests/core.test.ts",
      "tests/metadata.test.ts",
      "tests/relations.test.ts",
      "tests/wiki.test.ts",
      "tests/files.test.ts",
      "tests/search.test.ts",
    ],
  },
});
```

---

### Task 1.3: Create Environment Files

**Files:**
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create .env with test credentials**

```
REDMINE_URL=http://192.168.10.42:10083
REDMINE_API_KEY=6ca6813690818d9f63ad0c4038e4b069dfd666c7
```

**Step 2: Create .env.example template**

```
REDMINE_URL=http://your-redmine-instance
REDMINE_API_KEY=your-api-key
```

**Step 3: Add .env to .gitignore**

Append to `.gitignore`:
```
.env
```

---

### Task 1.4: Add npm Scripts

**Files:**
- Modify: `package.json`

**Step 1: Add test scripts to package.json**

Add to "scripts":
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## Phase 2: Test Infrastructure

> All tasks in this phase can be executed in **parallel**.

---

### Task 2.1: Create Test Setup

**Files:**
- Create: `tests/setup.ts`

**Step 1: Create tests/setup.ts**

```typescript
import { config } from "dotenv";
import { RedmineClient } from "../src/redmine/client.js";

config();

if (!process.env.REDMINE_URL || !process.env.REDMINE_API_KEY) {
  throw new Error("Missing REDMINE_URL or REDMINE_API_KEY in environment");
}

export const client = new RedmineClient(
  process.env.REDMINE_URL,
  process.env.REDMINE_API_KEY
);
```

---

### Task 2.2: Create Shared State

**Files:**
- Create: `tests/state.ts`

**Step 1: Create tests/state.ts**

```typescript
export const state = {
  // Project IDs
  projectId: "",
  projectNumericId: 0,
  secondProjectId: "",

  // Issue IDs
  issueId: 0,
  secondIssueId: 0,
  childIssueId: 0,

  // Other IDs
  versionId: 0,
  secondVersionId: 0,
  categoryId: 0,
  secondCategoryId: 0,
  relationId: 0,
  attachmentId: 0,
  uploadToken: "",
  wikiPageName: "",
  childWikiPageName: "",

  // Metadata from Redmine
  adminUserId: 0,
  trackerId: 0,
  secondTrackerId: 0,
  statusOpenId: 0,
  statusClosedId: 0,
  priorityId: 0,
};
```

---

## Phase 3: Test Files

> All tasks in this phase can be executed in **parallel**.
> Each task creates one complete test file.

---

### Task 3.1: Create Account Tests

**Files:**
- Create: `tests/account.test.ts`

**Step 1: Create tests/account.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("account", () => {
  describe("get_my_account", () => {
    it("should return current user info", async () => {
      const result = await client.getMyAccount();

      expect(result.user).toBeDefined();
      expect(result.user.login).toBe("admin");
      expect(result.user.id).toBeGreaterThan(0);

      state.adminUserId = result.user.id;
    });
  });
});
```

---

### Task 3.2: Create Core Tests

**Files:**
- Create: `tests/core.test.ts`

**Step 1: Create tests/core.test.ts**

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("core", () => {
  // ==================== PROJECTS ====================

  describe("projects", () => {
    describe("create_project", () => {
      it("should create project with minimal params", async () => {
        const identifier = `test-${Date.now()}`;
        const result = await client.createProject({
          name: "Test Project",
          identifier,
        });

        expect(result.project).toBeDefined();
        expect(result.project.id).toBeGreaterThan(0);
        expect(result.project.identifier).toBe(identifier);

        state.projectId = identifier;
        state.projectNumericId = result.project.id;
      });

      it("should create project with full params", async () => {
        const identifier = `test-full-${Date.now()}`;
        const result = await client.createProject({
          name: "Test Project Full",
          identifier,
          description: "A test project with all params",
          homepage: "https://example.com",
          is_public: false,
          enabled_module_names: ["issue_tracking", "wiki", "files"],
        });

        expect(result.project.description).toBe("A test project with all params");
        expect(result.project.is_public).toBe(false);

        state.secondProjectId = identifier;
      });

      it("should create subproject", async () => {
        const identifier = `test-sub-${Date.now()}`;
        const result = await client.createProject({
          name: "Test Subproject",
          identifier,
          parent_id: state.projectId,
        });

        expect(result.project.parent).toBeDefined();
        expect(result.project.parent.id).toBe(state.projectNumericId);

        // Clean up subproject immediately
        await client.deleteProject(identifier);
      });

      it("should fail with duplicate identifier", async () => {
        await expect(
          client.createProject({
            name: "Duplicate",
            identifier: state.projectId,
          })
        ).rejects.toThrow();
      });
    });

    describe("list_projects", () => {
      it("should list all projects", async () => {
        const result = await client.listProjects({});

        expect(result.projects).toBeDefined();
        expect(Array.isArray(result.projects)).toBe(true);
        expect(result.projects.length).toBeGreaterThan(0);
      });

      it("should list projects with limit", async () => {
        const result = await client.listProjects({ limit: 1 });

        expect(result.projects.length).toBe(1);
      });

      it("should list projects with offset", async () => {
        const first = await client.listProjects({ limit: 1 });
        const second = await client.listProjects({ limit: 1, offset: 1 });

        if (second.projects.length > 0) {
          expect(second.projects[0].id).not.toBe(first.projects[0].id);
        }
      });

      it("should include trackers", async () => {
        const result = await client.listProjects({ include: "trackers" });

        expect(result.projects[0].trackers).toBeDefined();
      });

      it("should include issue_categories", async () => {
        const result = await client.listProjects({ include: "issue_categories" });

        expect(result.projects[0].issue_categories).toBeDefined();
      });

      it("should include enabled_modules", async () => {
        const result = await client.listProjects({ include: "enabled_modules" });

        expect(result.projects[0].enabled_modules).toBeDefined();
      });
    });

    describe("get_project", () => {
      it("should get project by identifier", async () => {
        const result = await client.getProject(state.projectId);

        expect(result.project.identifier).toBe(state.projectId);
      });

      it("should get project by numeric id", async () => {
        const result = await client.getProject(state.projectNumericId);

        expect(result.project.id).toBe(state.projectNumericId);
      });

      it("should get project with includes", async () => {
        const result = await client.getProject(state.projectId, "trackers,issue_categories");

        expect(result.project.trackers).toBeDefined();
        expect(result.project.issue_categories).toBeDefined();
      });

      it("should fail for nonexistent project", async () => {
        await expect(
          client.getProject("nonexistent-project-xyz-999")
        ).rejects.toThrow();
      });
    });

    describe("update_project", () => {
      it("should update project name", async () => {
        const result = await client.updateProject(state.projectId, {
          name: "Updated Test Project",
        });

        expect(result).toBeDefined();
      });

      it("should update project description", async () => {
        const result = await client.updateProject(state.projectId, {
          description: "Updated description",
        });

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent project", async () => {
        await expect(
          client.updateProject("nonexistent-xyz", { name: "Test" })
        ).rejects.toThrow();
      });
    });

    describe("archive_project", () => {
      it("should archive project", async () => {
        const result = await client.archiveProject(state.secondProjectId);
        expect(result).toBeDefined();
      });
    });

    describe("unarchive_project", () => {
      it("should unarchive project", async () => {
        const result = await client.unarchiveProject(state.secondProjectId);
        expect(result).toBeDefined();
      });
    });

    describe("delete_project", () => {
      it("should delete second project", async () => {
        const result = await client.deleteProject(state.secondProjectId);
        expect(result).toBeDefined();
      });

      it("should fail for nonexistent project", async () => {
        await expect(
          client.deleteProject("nonexistent-xyz-999")
        ).rejects.toThrow();
      });
    });
  });

  // ==================== ISSUES ====================

  describe("issues", () => {
    describe("create_issue", () => {
      it("should create issue with minimal params", async () => {
        const result = await client.createIssue({
          project_id: state.projectId,
          subject: "Test Issue Minimal",
        });

        expect(result.issue).toBeDefined();
        expect(result.issue.id).toBeGreaterThan(0);
        expect(result.issue.subject).toBe("Test Issue Minimal");

        state.issueId = result.issue.id;
      });

      it("should create issue with full params", async () => {
        const result = await client.createIssue({
          project_id: state.projectId,
          subject: "Test Issue Full",
          description: "A detailed description",
          tracker_id: state.trackerId || undefined,
          priority_id: state.priorityId || undefined,
          assigned_to_id: state.adminUserId,
          start_date: "2026-01-01",
          due_date: "2026-12-31",
          estimated_hours: 10,
        });

        expect(result.issue.description).toBe("A detailed description");
        expect(result.issue.estimated_hours).toBe(10);

        state.secondIssueId = result.issue.id;
      });

      it("should create private issue", async () => {
        const result = await client.createIssue({
          project_id: state.projectId,
          subject: "Private Issue",
          is_private: true,
        });

        expect(result.issue.is_private).toBe(true);

        // Delete it to keep things clean
        await client.deleteIssue(result.issue.id);
      });

      it("should create child issue", async () => {
        const result = await client.createIssue({
          project_id: state.projectId,
          subject: "Child Issue",
          parent_issue_id: state.issueId,
        });

        expect(result.issue.parent).toBeDefined();
        expect(result.issue.parent.id).toBe(state.issueId);

        state.childIssueId = result.issue.id;
      });
    });

    describe("get_issue", () => {
      it("should get issue by id", async () => {
        const result = await client.getIssue(state.issueId);

        expect(result.issue.id).toBe(state.issueId);
      });

      it("should include attachments", async () => {
        const result = await client.getIssue(state.issueId, "attachments");

        expect(result.issue.attachments).toBeDefined();
      });

      it("should include relations", async () => {
        const result = await client.getIssue(state.issueId, "relations");

        expect(result.issue.relations).toBeDefined();
      });

      it("should include journals", async () => {
        const result = await client.getIssue(state.issueId, "journals");

        expect(result.issue.journals).toBeDefined();
      });

      it("should include watchers", async () => {
        const result = await client.getIssue(state.issueId, "watchers");

        expect(result.issue.watchers).toBeDefined();
      });

      it("should include children", async () => {
        const result = await client.getIssue(state.issueId, "children");

        expect(result.issue.children).toBeDefined();
      });

      it("should include allowed_statuses", async () => {
        const result = await client.getIssue(state.issueId, "allowed_statuses");

        expect(result.issue.allowed_statuses).toBeDefined();
      });

      it("should include multiple includes", async () => {
        const result = await client.getIssue(
          state.issueId,
          "attachments,relations,journals,watchers,children"
        );

        expect(result.issue.attachments).toBeDefined();
        expect(result.issue.relations).toBeDefined();
        expect(result.issue.journals).toBeDefined();
      });

      it("should fail for nonexistent issue", async () => {
        await expect(client.getIssue(999999)).rejects.toThrow();
      });
    });

    describe("list_issues", () => {
      it("should list all issues", async () => {
        const result = await client.listIssues({});

        expect(result.issues).toBeDefined();
        expect(Array.isArray(result.issues)).toBe(true);
      });

      it("should filter by project_id", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
        });

        expect(result.issues.length).toBeGreaterThan(0);
        result.issues.forEach((issue) => {
          expect(issue.project.id).toBe(state.projectNumericId);
        });
      });

      it("should filter by status open", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          status_id: "open",
        });

        expect(result.issues).toBeDefined();
      });

      it("should filter by status closed", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          status_id: "closed",
        });

        expect(result.issues).toBeDefined();
      });

      it("should filter by status all", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          status_id: "*",
        });

        expect(result.issues).toBeDefined();
      });

      it("should filter by assigned_to_id me", async () => {
        const result = await client.listIssues({
          assigned_to_id: "me",
        });

        expect(result.issues).toBeDefined();
      });

      it("should filter by author_id", async () => {
        const result = await client.listIssues({
          author_id: state.adminUserId,
        });

        expect(result.issues).toBeDefined();
      });

      it("should filter by subject contains", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          subject: "~Test",
        });

        expect(result.issues).toBeDefined();
      });

      it("should sort by updated_on desc", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          sort: "updated_on:desc",
        });

        expect(result.issues).toBeDefined();
      });

      it("should sort by priority asc", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          sort: "priority:asc",
        });

        expect(result.issues).toBeDefined();
      });

      it("should limit results", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          limit: 1,
        });

        expect(result.issues.length).toBeLessThanOrEqual(1);
      });

      it("should offset results", async () => {
        const first = await client.listIssues({
          project_id: state.projectId,
          limit: 1,
        });
        const second = await client.listIssues({
          project_id: state.projectId,
          limit: 1,
          offset: 1,
        });

        if (first.issues.length > 0 && second.issues.length > 0) {
          expect(second.issues[0].id).not.toBe(first.issues[0].id);
        }
      });

      it("should include relations and attachments", async () => {
        const result = await client.listIssues({
          project_id: state.projectId,
          include: "relations,attachments",
        });

        expect(result.issues).toBeDefined();
      });
    });

    describe("update_issue", () => {
      it("should update subject", async () => {
        const result = await client.updateIssue(state.issueId, {
          subject: "Updated Subject",
        });

        expect(result).toBeDefined();
      });

      it("should add note", async () => {
        const result = await client.updateIssue(state.issueId, {
          notes: "This is a test note",
        });

        expect(result).toBeDefined();
      });

      it("should add private note", async () => {
        const result = await client.updateIssue(state.issueId, {
          notes: "This is a private note",
          private_notes: true,
        });

        expect(result).toBeDefined();
      });

      it("should update done_ratio", async () => {
        const result = await client.updateIssue(state.issueId, {
          done_ratio: 50,
        });

        expect(result).toBeDefined();

        const issue = await client.getIssue(state.issueId);
        expect(issue.issue.done_ratio).toBe(50);
      });

      it("should update dates", async () => {
        const result = await client.updateIssue(state.issueId, {
          start_date: "2026-02-01",
          due_date: "2026-06-30",
        });

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent issue", async () => {
        await expect(
          client.updateIssue(999999, { subject: "Test" })
        ).rejects.toThrow();
      });
    });

    describe("add_issue_watcher", () => {
      it("should add watcher", async () => {
        const result = await client.addIssueWatcher(state.issueId, state.adminUserId);

        expect(result).toBeDefined();
      });
    });

    describe("remove_issue_watcher", () => {
      it("should remove watcher", async () => {
        const result = await client.removeIssueWatcher(state.issueId, state.adminUserId);

        expect(result).toBeDefined();
      });
    });

    describe("delete_issue", () => {
      it("should delete child issue", async () => {
        const result = await client.deleteIssue(state.childIssueId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent issue", async () => {
        await expect(client.deleteIssue(999999)).rejects.toThrow();
      });
    });
  });
});
```

---

### Task 3.3: Create Metadata Tests

**Files:**
- Create: `tests/metadata.test.ts`

**Step 1: Create tests/metadata.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("metadata", () => {
  describe("list_trackers", () => {
    it("should list all trackers", async () => {
      const result = await client.listTrackers();

      expect(result.trackers).toBeDefined();
      expect(Array.isArray(result.trackers)).toBe(true);
      expect(result.trackers.length).toBeGreaterThan(0);

      // Save first tracker for later tests
      state.trackerId = result.trackers[0].id;
      if (result.trackers.length > 1) {
        state.secondTrackerId = result.trackers[1].id;
      }
    });
  });

  describe("list_issue_statuses", () => {
    it("should list all statuses", async () => {
      const result = await client.listIssueStatuses();

      expect(result.issue_statuses).toBeDefined();
      expect(Array.isArray(result.issue_statuses)).toBe(true);
      expect(result.issue_statuses.length).toBeGreaterThan(0);

      // Find open and closed status
      const openStatus = result.issue_statuses.find((s) => !s.is_closed);
      const closedStatus = result.issue_statuses.find((s) => s.is_closed);

      if (openStatus) state.statusOpenId = openStatus.id;
      if (closedStatus) state.statusClosedId = closedStatus.id;
    });
  });

  describe("list_custom_fields", () => {
    it("should list custom fields", async () => {
      const result = await client.listCustomFields();

      expect(result.custom_fields).toBeDefined();
      expect(Array.isArray(result.custom_fields)).toBe(true);
    });
  });

  describe("list_queries", () => {
    it("should list saved queries", async () => {
      const result = await client.listQueries();

      expect(result.queries).toBeDefined();
      expect(Array.isArray(result.queries)).toBe(true);
    });
  });

  describe("issue_categories", () => {
    describe("list_issue_categories", () => {
      it("should list categories (initially empty)", async () => {
        const result = await client.listIssueCategories(state.projectId);

        expect(result.issue_categories).toBeDefined();
        expect(Array.isArray(result.issue_categories)).toBe(true);
      });

      it("should fail for nonexistent project", async () => {
        await expect(
          client.listIssueCategories("nonexistent-xyz")
        ).rejects.toThrow();
      });
    });

    describe("create_issue_category", () => {
      it("should create category", async () => {
        const result = await client.createIssueCategory(state.projectId, {
          name: "Test Category",
        });

        expect(result.issue_category).toBeDefined();
        expect(result.issue_category.id).toBeGreaterThan(0);

        state.categoryId = result.issue_category.id;
      });

      it("should create category with assignee", async () => {
        const result = await client.createIssueCategory(state.projectId, {
          name: "Category With Assignee",
          assigned_to_id: state.adminUserId,
        });

        expect(result.issue_category.assigned_to).toBeDefined();
        expect(result.issue_category.assigned_to.id).toBe(state.adminUserId);

        state.secondCategoryId = result.issue_category.id;
      });
    });

    describe("get_issue_category", () => {
      it("should get category", async () => {
        const result = await client.getIssueCategory(state.categoryId);

        expect(result.issue_category.id).toBe(state.categoryId);
        expect(result.issue_category.name).toBe("Test Category");
      });

      it("should fail for nonexistent category", async () => {
        await expect(client.getIssueCategory(999999)).rejects.toThrow();
      });
    });

    describe("update_issue_category", () => {
      it("should update category name", async () => {
        const result = await client.updateIssueCategory(state.categoryId, {
          name: "Updated Category",
        });

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent category", async () => {
        await expect(
          client.updateIssueCategory(999999, { name: "Test" })
        ).rejects.toThrow();
      });
    });

    describe("delete_issue_category", () => {
      it("should delete category", async () => {
        const result = await client.deleteIssueCategory(state.secondCategoryId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent category", async () => {
        await expect(client.deleteIssueCategory(999999)).rejects.toThrow();
      });
    });
  });
});
```

---

### Task 3.4: Create Relations Tests

**Files:**
- Create: `tests/relations.test.ts`

**Step 1: Create tests/relations.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("relations", () => {
  // ==================== VERSIONS ====================

  describe("versions", () => {
    describe("create_version", () => {
      it("should create version with minimal params", async () => {
        const result = await client.createVersion(state.projectId, {
          name: "v1.0.0",
        });

        expect(result.version).toBeDefined();
        expect(result.version.id).toBeGreaterThan(0);

        state.versionId = result.version.id;
      });

      it("should create version with full params", async () => {
        const result = await client.createVersion(state.projectId, {
          name: "v2.0.0",
          status: "open",
          sharing: "none",
          due_date: "2026-12-31",
          description: "Major release",
        });

        expect(result.version.description).toBe("Major release");
        expect(result.version.status).toBe("open");

        state.secondVersionId = result.version.id;
      });
    });

    describe("list_versions", () => {
      it("should list versions", async () => {
        const result = await client.listVersions(state.projectId);

        expect(result.versions).toBeDefined();
        expect(result.versions.length).toBeGreaterThan(0);
      });
    });

    describe("get_version", () => {
      it("should get version", async () => {
        const result = await client.getVersion(state.versionId);

        expect(result.version.id).toBe(state.versionId);
        expect(result.version.name).toBe("v1.0.0");
      });

      it("should fail for nonexistent version", async () => {
        await expect(client.getVersion(999999)).rejects.toThrow();
      });
    });

    describe("update_version", () => {
      it("should update version name", async () => {
        const result = await client.updateVersion(state.versionId, {
          name: "v1.0.1",
        });

        expect(result).toBeDefined();
      });

      it("should update version status to locked", async () => {
        const result = await client.updateVersion(state.secondVersionId, {
          status: "locked",
        });

        expect(result).toBeDefined();
      });

      it("should update version status to closed", async () => {
        const result = await client.updateVersion(state.secondVersionId, {
          status: "closed",
        });

        expect(result).toBeDefined();
      });

      it("should update version sharing", async () => {
        const result = await client.updateVersion(state.versionId, {
          sharing: "descendants",
        });

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent version", async () => {
        await expect(
          client.updateVersion(999999, { name: "Test" })
        ).rejects.toThrow();
      });
    });

    describe("assign issue to version", () => {
      it("should assign issue to version", async () => {
        const result = await client.updateIssue(state.issueId, {
          fixed_version_id: state.versionId,
        });

        expect(result).toBeDefined();

        const issue = await client.getIssue(state.issueId);
        expect(issue.issue.fixed_version).toBeDefined();
        expect(issue.issue.fixed_version.id).toBe(state.versionId);
      });
    });

    describe("delete_version", () => {
      it("should delete version", async () => {
        const result = await client.deleteVersion(state.secondVersionId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent version", async () => {
        await expect(client.deleteVersion(999999)).rejects.toThrow();
      });
    });
  });

  // ==================== ISSUE RELATIONS ====================

  describe("issue_relations", () => {
    describe("create_issue_relation", () => {
      it("should create relates relation", async () => {
        const result = await client.createIssueRelation(state.issueId, {
          issue_to_id: state.secondIssueId,
          relation_type: "relates",
        });

        expect(result.relation).toBeDefined();
        expect(result.relation.id).toBeGreaterThan(0);

        state.relationId = result.relation.id;
      });

      it("should fail for relation to same issue", async () => {
        await expect(
          client.createIssueRelation(state.issueId, {
            issue_to_id: state.issueId,
            relation_type: "relates",
          })
        ).rejects.toThrow();
      });
    });

    describe("list_issue_relations", () => {
      it("should list relations", async () => {
        const result = await client.listIssueRelations(state.issueId);

        expect(result.relations).toBeDefined();
        expect(result.relations.length).toBeGreaterThan(0);
      });
    });

    describe("get_relation", () => {
      it("should get relation", async () => {
        const result = await client.getRelation(state.relationId);

        expect(result.relation.id).toBe(state.relationId);
        expect(result.relation.relation_type).toBe("relates");
      });

      it("should fail for nonexistent relation", async () => {
        await expect(client.getRelation(999999)).rejects.toThrow();
      });
    });

    describe("delete_relation", () => {
      it("should delete relation", async () => {
        const result = await client.deleteRelation(state.relationId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent relation", async () => {
        await expect(client.deleteRelation(999999)).rejects.toThrow();
      });
    });

    describe("list relations after delete", () => {
      it("should show empty relations", async () => {
        const result = await client.listIssueRelations(state.issueId);

        expect(result.relations).toBeDefined();
        expect(result.relations.length).toBe(0);
      });
    });

    describe("create more relation types", () => {
      it("should create blocks relation", async () => {
        const result = await client.createIssueRelation(state.issueId, {
          issue_to_id: state.secondIssueId,
          relation_type: "blocks",
        });

        expect(result.relation.relation_type).toBe("blocks");

        // Clean up
        await client.deleteRelation(result.relation.id);
      });

      it("should create precedes relation", async () => {
        const result = await client.createIssueRelation(state.issueId, {
          issue_to_id: state.secondIssueId,
          relation_type: "precedes",
        });

        expect(result.relation.relation_type).toBe("precedes");

        // Clean up
        await client.deleteRelation(result.relation.id);
      });

      it("should create precedes relation with delay", async () => {
        const result = await client.createIssueRelation(state.issueId, {
          issue_to_id: state.secondIssueId,
          relation_type: "precedes",
          delay: 3,
        });

        expect(result.relation.delay).toBe(3);

        // Clean up
        await client.deleteRelation(result.relation.id);
      });
    });
  });
});
```

---

### Task 3.5: Create Wiki Tests

**Files:**
- Create: `tests/wiki.test.ts`

**Step 1: Create tests/wiki.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("wiki", () => {
  describe("list_wiki_pages", () => {
    it("should list wiki pages (initially empty)", async () => {
      const result = await client.listWikiPages(state.projectId);

      expect(result.wiki_pages).toBeDefined();
      expect(Array.isArray(result.wiki_pages)).toBe(true);
    });

    it("should fail for nonexistent project", async () => {
      await expect(
        client.listWikiPages("nonexistent-xyz")
      ).rejects.toThrow();
    });
  });

  describe("create_wiki_page", () => {
    it("should create wiki page", async () => {
      const result = await client.createOrUpdateWikiPage(
        state.projectId,
        "TestPage",
        { text: "# Test Wiki Page\n\nThis is content." }
      );

      expect(result.wiki_page).toBeDefined();

      state.wikiPageName = "TestPage";
    });

    it("should create wiki page with comment", async () => {
      const result = await client.createOrUpdateWikiPage(
        state.projectId,
        "PageWithComment",
        {
          text: "Content with comment",
          comments: "Initial creation",
        }
      );

      expect(result.wiki_page).toBeDefined();
    });

    it("should create child wiki page", async () => {
      const result = await client.createOrUpdateWikiPage(
        state.projectId,
        "ChildPage",
        {
          text: "Child page content",
          parent_title: "TestPage",
        }
      );

      expect(result.wiki_page).toBeDefined();

      state.childWikiPageName = "ChildPage";
    });
  });

  describe("list_wiki_pages (with data)", () => {
    it("should list created wiki pages", async () => {
      const result = await client.listWikiPages(state.projectId);

      expect(result.wiki_pages.length).toBeGreaterThan(0);
    });
  });

  describe("get_wiki_page", () => {
    it("should get wiki page", async () => {
      const result = await client.getWikiPage(state.projectId, state.wikiPageName, {});

      expect(result.wiki_page).toBeDefined();
      expect(result.wiki_page.title).toBe(state.wikiPageName);
      expect(result.wiki_page.text).toContain("Test Wiki Page");
    });

    it("should get wiki page with attachments include", async () => {
      const result = await client.getWikiPage(
        state.projectId,
        state.wikiPageName,
        { include: "attachments" }
      );

      expect(result.wiki_page.attachments).toBeDefined();
    });

    it("should fail for nonexistent page", async () => {
      await expect(
        client.getWikiPage(state.projectId, "NonexistentPage123", {})
      ).rejects.toThrow();
    });
  });

  describe("update_wiki_page", () => {
    it("should update wiki page", async () => {
      const result = await client.createOrUpdateWikiPage(
        state.projectId,
        state.wikiPageName,
        { text: "# Updated Content\n\nNew text." }
      );

      expect(result.wiki_page).toBeDefined();

      // Verify update
      const page = await client.getWikiPage(state.projectId, state.wikiPageName, {});
      expect(page.wiki_page.text).toContain("Updated Content");
    });

    it("should update with comment", async () => {
      const result = await client.createOrUpdateWikiPage(
        state.projectId,
        state.wikiPageName,
        {
          text: "# Final Content",
          comments: "Updated via test",
        }
      );

      expect(result.wiki_page).toBeDefined();
    });
  });

  describe("delete_wiki_page", () => {
    it("should delete child wiki page", async () => {
      const result = await client.deleteWikiPage(state.projectId, state.childWikiPageName);

      expect(result).toBeDefined();
    });

    it("should delete wiki page with comment", async () => {
      const result = await client.deleteWikiPage(state.projectId, "PageWithComment");

      expect(result).toBeDefined();
    });

    it("should fail for nonexistent page", async () => {
      await expect(
        client.deleteWikiPage(state.projectId, "NonexistentPage999")
      ).rejects.toThrow();
    });
  });
});
```

---

### Task 3.6: Create Files Tests

**Files:**
- Create: `tests/files.test.ts`
- Create: `tests/fixtures/test-file.txt`

**Step 1: Create test fixture file**

Create `tests/fixtures/test-file.txt`:
```
This is a test file for upload testing.
```

**Step 2: Create tests/files.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("files", () => {
  describe("upload_file", () => {
    it("should upload file", async () => {
      const content = await readFile("tests/fixtures/test-file.txt");
      const result = await client.uploadFile(
        "test-file.txt",
        "text/plain",
        content
      );

      expect(result.upload).toBeDefined();
      expect(result.upload.token).toBeDefined();

      state.uploadToken = result.upload.token;
    });

    it("should upload file with different content type", async () => {
      const content = Buffer.from("binary content");
      const result = await client.uploadFile(
        "binary-file.bin",
        "application/octet-stream",
        content
      );

      expect(result.upload.token).toBeDefined();
    });
  });

  describe("list_project_files", () => {
    it("should list project files (initially empty)", async () => {
      const result = await client.listProjectFiles(state.projectId);

      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });
  });

  describe("upload_project_file", () => {
    it("should attach file to project", async () => {
      // Upload a fresh file first
      const content = await readFile("tests/fixtures/test-file.txt");
      const upload = await client.uploadFile("project-file.txt", "text/plain", content);

      const result = await client.uploadProjectFile(state.projectId, {
        token: upload.upload.token,
        filename: "project-file.txt",
      });

      expect(result).toBeDefined();
    });

    it("should attach file with description", async () => {
      const content = Buffer.from("file with description");
      const upload = await client.uploadFile("described-file.txt", "text/plain", content);

      const result = await client.uploadProjectFile(state.projectId, {
        token: upload.upload.token,
        filename: "described-file.txt",
        description: "A test file with description",
      });

      expect(result).toBeDefined();
    });

    it("should fail with invalid token", async () => {
      await expect(
        client.uploadProjectFile(state.projectId, {
          token: "invalid-token-xyz",
        })
      ).rejects.toThrow();
    });
  });

  describe("list_project_files (with files)", () => {
    it("should list uploaded files", async () => {
      const result = await client.listProjectFiles(state.projectId);

      expect(result.files.length).toBeGreaterThan(0);

      // Save first attachment ID
      if (result.files.length > 0) {
        state.attachmentId = result.files[0].id;
      }
    });
  });

  describe("get_attachment", () => {
    it("should get attachment metadata", async () => {
      const result = await client.getAttachment(state.attachmentId);

      expect(result.attachment).toBeDefined();
      expect(result.attachment.id).toBe(state.attachmentId);
    });

    it("should fail for nonexistent attachment", async () => {
      await expect(client.getAttachment(999999)).rejects.toThrow();
    });
  });

  describe("delete_attachment", () => {
    it("should delete attachment", async () => {
      const result = await client.deleteAttachment(state.attachmentId);

      expect(result).toBeDefined();
    });

    it("should fail for nonexistent attachment", async () => {
      await expect(client.deleteAttachment(999999)).rejects.toThrow();
    });
  });
});
```

---

### Task 3.7: Create Search Tests

**Files:**
- Create: `tests/search.test.ts`

**Step 1: Create tests/search.test.ts**

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("search", () => {
  describe("search", () => {
    it("should search with basic query", async () => {
      const result = await client.search({ q: "Test" });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should search with all_words true", async () => {
      const result = await client.search({
        q: "Test Issue",
        all_words: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with all_words false", async () => {
      const result = await client.search({
        q: "Test Issue",
        all_words: false,
      });

      expect(result.results).toBeDefined();
    });

    it("should search titles only", async () => {
      const result = await client.search({
        q: "Test",
        titles_only: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search open issues only", async () => {
      const result = await client.search({
        q: "Test",
        open_issues: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search issues only", async () => {
      const result = await client.search({
        q: "Test",
        issues: true,
        wiki_pages: false,
        projects: false,
      });

      expect(result.results).toBeDefined();
    });

    it("should search wiki only", async () => {
      const result = await client.search({
        q: "Test",
        issues: false,
        wiki_pages: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search projects only", async () => {
      const result = await client.search({
        q: "Test",
        issues: false,
        projects: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with scope my_projects", async () => {
      const result = await client.search({
        q: "Test",
        scope: "my_projects",
      });

      expect(result.results).toBeDefined();
    });

    it("should search with limit", async () => {
      const result = await client.search({
        q: "Test",
        limit: 1,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with offset", async () => {
      const result = await client.search({
        q: "Test",
        offset: 1,
      });

      expect(result.results).toBeDefined();
    });

    it("should return empty for nonexistent query", async () => {
      const result = await client.search({
        q: "xyznonexistent123456789",
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(0);
    });
  });

  // Cleanup at the end of all tests
  afterAll(async () => {
    // Delete main test project - this cascades to issues, wiki, versions, etc.
    if (state.projectId) {
      try {
        await client.deleteProject(state.projectId);
      } catch {
        // Ignore errors during cleanup
      }
    }
  });
});
```

---

## Phase 4: Verification & Commit

> This phase runs after all test files are created.

---

### Task 4.1: Run Tests

**Step 1: Build the project first**

Run:
```bash
npm run build
```

**Step 2: Run all tests**

Run:
```bash
npm test
```

Expected: All 130 tests pass

**Step 3: If tests fail, fix issues**

Check error messages and fix any issues in test files or client code.

---

### Task 4.2: Update README

**Files:**
- Modify: `README.md`

**Step 1: Add Testing section to README**

Add after the "Development" section:

```markdown
## Testing

Integration tests run against a real Redmine instance.

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Redmine credentials:
   ```
   REDMINE_URL=http://your-redmine-instance
   REDMINE_API_KEY=your-api-key
   ```

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **44 tools** tested
- **130 tests** total (106 success + 24 error cases)
- Tests cover all parameters, filters, and sorting options
```

---

### Task 4.3: Commit All Changes

**Step 1: Add all files**

Run:
```bash
git add -A
```

**Step 2: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat: add comprehensive integration tests

- 130 tests covering all 44 MCP tools
- Vitest with sequential execution
- Tests for success cases and error handling
- Shared state between test files
- Automatic cleanup after tests
- Updated README with testing documentation
EOF
)"
```

---

## Summary

| Phase | Tasks | Parallel? |
|-------|-------|-----------|
| Phase 1: Setup | 4 tasks | Yes |
| Phase 2: Infrastructure | 2 tasks | Yes |
| Phase 3: Test Files | 7 tasks | Yes |
| Phase 4: Verification | 3 tasks | No (sequential) |

**Total: 16 tasks, 130 tests**
