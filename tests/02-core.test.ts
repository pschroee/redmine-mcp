import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

// ============================================================================
// PROJECTS
// ============================================================================

describe("Projects", () => {
  describe("create project", () => {
    it("should create a project with minimal fields", async () => {
      const identifier = `test-project-${Date.now()}`;
      const result = await client.createProject({
        name: `Test Project ${Date.now()}`,
        identifier,
        enabled_module_names: ["issue_tracking", "wiki", "files", "time_tracking"],
      });

      expect(result.project).toBeDefined();
      expect(result.project.name).toContain("Test Project");
      expect(result.project.identifier).toBe(identifier);
      expect(result.project.id).toBeGreaterThan(0);

      state.projectId = identifier;
      state.projectNumericId = result.project.id;
    });

    it("should create a project with all fields", async () => {
      const identifier = `full-project-${Date.now()}`;
      const result = await client.createProject({
        name: `Full Project ${Date.now()}`,
        identifier,
        description: "A project with all fields populated",
        homepage: "https://example.com",
        is_public: false,
        inherit_members: true,
      });

      expect(result.project).toBeDefined();
      expect(result.project.name).toContain("Full Project");
      expect(result.project.description).toBe("A project with all fields populated");
      expect(result.project.is_public).toBe(false);

      state.secondProjectId = identifier;
    });

    it("should create a subproject", async () => {
      const identifier = `subproject-${Date.now()}`;
      const result = await client.createProject({
        name: `Subproject ${Date.now()}`,
        identifier,
        parent_id: state.projectNumericId,
      });

      expect(result.project).toBeDefined();
      expect(result.project.parent).toBeDefined();

      state.subprojectId = identifier;
    });

    it("should return error for duplicate identifier", async () => {
      const result = (await client.createProject({
        name: "Duplicate Project",
        identifier: state.projectId,
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("list projects", () => {
    it("should list projects", async () => {
      const result = await client.listProjects({});

      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeGreaterThan(0);
    });

    it("should list projects with limit", async () => {
      const result = await client.listProjects({
        limit: 1,
      });

      expect(result.projects).toBeDefined();
      expect(result.projects.length).toBeLessThanOrEqual(1);
    });

    it("should list projects with offset", async () => {
      const result = await client.listProjects({
        offset: 1,
        limit: 10,
      });

      expect(result.projects).toBeDefined();
      expect(result.offset).toBe(1);
    });

    it("should list projects with includes", async () => {
      const result = await client.listProjects({
        include: "trackers,issue_categories",
      });

      expect(result.projects).toBeDefined();
    });
  });

  describe("get project", () => {
    it("should get project by identifier", async () => {
      const result = await client.getProject(state.projectId);

      expect(result.project).toBeDefined();
      expect(result.project.identifier).toBe(state.projectId);
    });

    it("should get project by numeric id", async () => {
      const result = await client.getProject(state.projectNumericId);

      expect(result.project).toBeDefined();
      expect(result.project.id).toBe(state.projectNumericId);
    });

    it("should get project with includes", async () => {
      const result = await client.getProject(
        state.projectId,
        "trackers,issue_categories,enabled_modules"
      );

      expect(result.project).toBeDefined();
    });

    it("should return error for nonexistent project", async () => {
      const result = (await client.getProject(
        "nonexistent-project-12345"
      )) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update project", () => {
    it("should update project name", async () => {
      const newName = `Updated Project ${Date.now()}`;
      await client.updateProject(state.projectId, {
        name: newName,
      });

      const result = await client.getProject(state.projectId);
      expect(result.project).toBeDefined();
      expect(result.project.name).toBe(newName);
    });

    it("should update project description", async () => {
      await client.updateProject(state.projectId, {
        description: "Updated description for the project",
      });

      const result = await client.getProject(state.projectId);
      expect(result.project).toBeDefined();
      expect(result.project.description).toBe("Updated description for the project");
    });

    it("should return error for nonexistent project", async () => {
      const result = (await client.updateProject("nonexistent-project-12345", {
        name: "Should Fail",
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("archive and unarchive project", () => {
    it("should archive project", async () => {
      await expect(
        client.archiveProject(state.secondProjectId)
      ).resolves.not.toThrow();
    });

    it("should unarchive project", async () => {
      await expect(
        client.unarchiveProject(state.secondProjectId)
      ).resolves.not.toThrow();
    });
  });

  describe("delete project", () => {
    it("should delete project", async () => {
      await expect(
        client.deleteProject(state.secondProjectId)
      ).resolves.not.toThrow();
      state.secondProjectId = undefined;
    });

    it("should return error for nonexistent project", async () => {
      const result = (await client.deleteProject(
        "nonexistent-project-12345"
      )) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});

// ============================================================================
// ISSUES
// ============================================================================

describe("Issues", () => {
  describe("create issue", () => {
    it("should create an issue with minimal fields", async () => {
      const subject = `Test Issue ${Date.now()}`;
      const result = await client.createIssue({
        project_id: state.projectId,
        subject,
        tracker_id: 1,
      });

      expect(result.issue).toBeDefined();
      expect(result.issue.subject).toBe(subject);
      expect(result.issue.id).toBeGreaterThan(0);

      state.issueId = result.issue.id;
    });

    it("should create an issue with all fields", async () => {
      const subject = `Full Issue ${Date.now()}`;
      const result = await client.createIssue({
        project_id: state.projectId,
        subject,
        tracker_id: 1,
        description: "A detailed description of the issue",
        priority_id: 2,
        status_id: 1,
        start_date: "2024-01-01",
        due_date: "2024-12-31",
        estimated_hours: 8,
        done_ratio: 25,
      });

      expect(result.issue).toBeDefined();
      expect(result.issue.subject).toBe(subject);
      expect(result.issue.description).toBe("A detailed description of the issue");
      expect(result.issue.estimated_hours).toBe(8);
      expect(result.issue.done_ratio).toBe(25);

      state.secondIssueId = result.issue.id;
    });

    it("should create a private issue", async () => {
      const result = await client.createIssue({
        project_id: state.projectId,
        subject: `Private Issue ${Date.now()}`,
        tracker_id: 1,
        is_private: true,
      });

      expect(result.issue).toBeDefined();
      expect(result.issue.is_private).toBe(true);

      state.privateIssueId = result.issue.id;
    });

    it("should create a child issue", async () => {
      const result = await client.createIssue({
        project_id: state.projectId,
        subject: `Child Issue ${Date.now()}`,
        tracker_id: 1,
        parent_issue_id: state.issueId,
      });

      expect(result.issue).toBeDefined();
      expect(result.issue.parent).toBeDefined();
      expect(result.issue.parent.id).toBe(state.issueId);

      state.childIssueId = result.issue.id;
    });
  });

  describe("get issue", () => {
    it("should get issue by id", async () => {
      const result = await client.getIssue(state.issueId);

      expect(result.issue).toBeDefined();
      expect(result.issue.id).toBe(state.issueId);
    });

    it("should get issue with children include", async () => {
      const result = await client.getIssue(state.issueId, "children");

      expect(result.issue).toBeDefined();
      expect(result.issue.children).toBeDefined();
      expect(Array.isArray(result.issue.children)).toBe(true);
    });

    it("should get issue with attachments include", async () => {
      const result = await client.getIssue(state.issueId, "attachments");

      expect(result.issue).toBeDefined();
      expect(result.issue.attachments).toBeDefined();
    });

    it("should get issue with journals include", async () => {
      const result = await client.getIssue(state.issueId, "journals");

      expect(result.issue).toBeDefined();
      expect(result.issue.journals).toBeDefined();
    });

    it("should get issue with watchers include", async () => {
      const result = await client.getIssue(state.issueId, "watchers");

      expect(result.issue).toBeDefined();
      expect(result.issue.watchers).toBeDefined();
    });

    it("should get issue with multiple includes", async () => {
      const result = await client.getIssue(
        state.issueId,
        "children,attachments,journals,watchers,relations"
      );

      expect(result.issue).toBeDefined();
    });

    it("should return error for nonexistent issue", async () => {
      const result = (await client.getIssue(999999999)) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("list issues", () => {
    it("should list issues", async () => {
      const result = await client.listIssues({});

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it("should list issues filtered by project", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
      });

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      result.issues.forEach((issue: { project: { id: number } }) => {
        expect(issue.project.id).toBe(state.projectNumericId);
      });
    });

    it("should list issues filtered by status", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        status_id: "open",
      });

      expect(result.issues).toBeDefined();
    });

    it("should list issues filtered by assigned_to", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        assigned_to_id: "me",
      });

      expect(result.issues).toBeDefined();
    });

    it("should list issues filtered by author", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        author_id: "me",
      });

      expect(result.issues).toBeDefined();
    });

    it("should list issues filtered by subject", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        subject: "Test Issue",
      });

      expect(result.issues).toBeDefined();
    });

    it("should list issues with sorting", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        sort: "created_on:desc",
      });

      expect(result.issues).toBeDefined();
    });

    it("should list issues with limit and offset", async () => {
      const result = await client.listIssues({
        project_id: state.projectId,
        limit: 2,
        offset: 0,
      });

      expect(result.issues).toBeDefined();
      expect(result.issues.length).toBeLessThanOrEqual(2);
    });
  });

  describe("update issue", () => {
    it("should update issue subject", async () => {
      const newSubject = `Updated Issue ${Date.now()}`;
      await client.updateIssue(state.issueId, {
        subject: newSubject,
      });

      const result = await client.getIssue(state.issueId);
      expect(result.issue).toBeDefined();
      expect(result.issue.subject).toBe(newSubject);
    });

    it("should update issue with notes", async () => {
      await expect(
        client.updateIssue(state.issueId, {
          notes: "This is an update note",
        })
      ).resolves.not.toThrow();
    });

    it("should update issue with private notes", async () => {
      await expect(
        client.updateIssue(state.issueId, {
          notes: "This is a private note",
          private_notes: true,
        })
      ).resolves.not.toThrow();
    });

    it("should update issue done_ratio", async () => {
      // Use privateIssueId since it has no children (parent issues may calculate done_ratio from children)
      const updateResult = await client.updateIssue(state.privateIssueId, {
        done_ratio: 50,
      }) as { error?: boolean };
      expect(updateResult.error).not.toBe(true);

      const result = await client.getIssue(state.privateIssueId);
      expect(result.issue).toBeDefined();
      expect(result.issue.done_ratio).toBe(50);
    });

    it("should update issue dates", async () => {
      // Use privateIssueId since it has no children
      const updateResult = await client.updateIssue(state.privateIssueId, {
        start_date: "2024-06-01",
        due_date: "2024-06-30",
      }) as { error?: boolean };
      expect(updateResult.error).not.toBe(true);

      const result = await client.getIssue(state.privateIssueId);
      expect(result.issue).toBeDefined();
      expect(result.issue.start_date).toBe("2024-06-01");
      expect(result.issue.due_date).toBe("2024-06-30");
    });

    it("should return error for nonexistent issue", async () => {
      const result = (await client.updateIssue(999999999, {
        subject: "Should Fail",
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("issue watchers", () => {
    it("should add watcher to issue", async () => {
      await expect(
        client.addIssueWatcher(state.issueId, 1)
      ).resolves.not.toThrow();
    });

    it("should remove watcher from issue", async () => {
      await expect(
        client.removeIssueWatcher(state.issueId, 1)
      ).resolves.not.toThrow();
    });
  });

  describe("delete issue", () => {
    it("should delete issue", async () => {
      await expect(
        client.deleteIssue(state.secondIssueId)
      ).resolves.not.toThrow();
      state.secondIssueId = undefined;
    });

    it("should return error for nonexistent issue", async () => {
      const result = (await client.deleteIssue(999999999)) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});

