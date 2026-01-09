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
    it("should list all saved queries", async () => {
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
        const result = await client.listIssueCategories("nonexistent-xyz") as { error?: boolean; status?: number };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
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
        // Use admin user ID (default 1 in fresh Redmine) if not set from account test
        const assigneeId = state.adminUserId || 1;
        const result = await client.createIssueCategory(state.projectId, {
          name: "Category With Assignee",
          assigned_to_id: assigneeId,
        });

        expect(result.issue_category.assigned_to).toBeDefined();
        expect(result.issue_category.assigned_to.id).toBe(assigneeId);

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
        const result = await client.getIssueCategory(999999) as { error?: boolean; status?: number };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
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
        const result = await client.updateIssueCategory(999999, { name: "Test" }) as { error?: boolean; status?: number };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });

    describe("delete_issue_category", () => {
      it("should delete category", async () => {
        const result = await client.deleteIssueCategory(state.secondCategoryId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent category", async () => {
        const result = await client.deleteIssueCategory(999999) as { error?: boolean; status?: number };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });
  });
});
