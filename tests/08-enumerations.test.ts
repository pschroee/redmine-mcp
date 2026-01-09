import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("enumerations", () => {
  describe("list_issue_priorities", () => {
    it("should list all priorities", async () => {
      const result = await client.listIssuePriorities();

      expect(result.issue_priorities).toBeDefined();
      expect(Array.isArray(result.issue_priorities)).toBe(true);
      expect(result.issue_priorities.length).toBeGreaterThan(0);

      // Store the default priority ID for other tests
      const defaultPriority = result.issue_priorities.find((p) => p.is_default);
      if (defaultPriority) {
        state.priorityId = defaultPriority.id;
      }
    });

    it("should have exactly one default priority", async () => {
      const result = await client.listIssuePriorities();

      const defaultPriorities = result.issue_priorities.filter(
        (p) => p.is_default
      );
      expect(defaultPriorities.length).toBe(1);
    });
  });

  describe("list_time_entry_activities", () => {
    it("should list all activities", async () => {
      const result = await client.listTimeEntryActivities();

      expect(result.time_entry_activities).toBeDefined();
      expect(Array.isArray(result.time_entry_activities)).toBe(true);
      expect(result.time_entry_activities.length).toBeGreaterThan(0);

      // Store an activity ID for other tests (prefer default, or use first)
      const defaultActivity = result.time_entry_activities.find(
        (a) => a.is_default
      );
      state.activityId = defaultActivity?.id || result.time_entry_activities[0].id;
    });
  });

  describe("list_document_categories", () => {
    it("should list all document categories", async () => {
      const result = await client.listDocumentCategories();

      expect(result.document_categories).toBeDefined();
      expect(Array.isArray(result.document_categories)).toBe(true);
      expect(result.document_categories.length).toBeGreaterThan(0);
    });
  });
});
