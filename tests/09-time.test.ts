import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("time entries", () => {
  describe("create_time_entry", () => {
    it("should create with issue_id", async () => {
      const result = await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 1.5,
        activity_id: state.activityId,
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBeGreaterThan(0);
      expect(result.time_entry.hours).toBe(1.5);
      expect(result.time_entry.issue).toBeDefined();
      expect(result.time_entry.issue.id).toBe(state.issueId);

      state.timeEntryId = result.time_entry.id;
    });

    it("should create additional entry for same issue", async () => {
      // Create another time entry for the same issue (tests that multiple entries work)
      const result = await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 2.0,
        activity_id: state.activityId,
        comments: "Additional time logged",
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBeGreaterThan(0);
      expect(result.time_entry.hours).toBe(2.0);
      expect(result.time_entry.issue.id).toBe(state.issueId);
      expect(result.time_entry.comments).toBe("Additional time logged");
    });

    it("should create with all fields (comments, activity_id, spent_on)", async () => {
      const result = await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 3.5,
        comments: "Test time entry with all fields",
        activity_id: state.activityId,
        spent_on: "2024-06-15",
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBeGreaterThan(0);
      expect(result.time_entry.hours).toBe(3.5);
      expect(result.time_entry.comments).toBe("Test time entry with all fields");
      expect(result.time_entry.activity).toBeDefined();
      expect(result.time_entry.activity.id).toBe(state.activityId);
      expect(result.time_entry.spent_on).toBe("2024-06-15");
    });

    it("should fail without hours (422)", async () => {
      const result = (await client.createTimeEntry({
        issue_id: state.issueId,
      } as { issue_id: number; hours: number })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail without issue_id or project_id (422)", async () => {
      const result = (await client.createTimeEntry({
        hours: 1.0,
      } as { hours: number; issue_id?: number; project_id?: string | number })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent issue (422)", async () => {
      const result = (await client.createTimeEntry({
        issue_id: 999999999,
        hours: 1.0,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent project (422)", async () => {
      const result = (await client.createTimeEntry({
        project_id: "nonexistent-project-xyz-12345",
        hours: 1.0,
        activity_id: state.activityId,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("list_time_entries", () => {
    it("should list all", async () => {
      const result = await client.listTimeEntries({});

      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
      expect(result.time_entries.length).toBeGreaterThan(0);
    });

    it("should filter by project_id", async () => {
      const result = await client.listTimeEntries({
        project_id: state.projectId,
      });

      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
    });

    it("should filter by user_id=me", async () => {
      const result = await client.listTimeEntries({
        user_id: "me",
      });

      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
    });

    it("should filter by date range (from, to)", async () => {
      const result = await client.listTimeEntries({
        from: "2024-01-01",
        to: "2024-12-31",
      });

      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
    });
  });

  describe("get_time_entry", () => {
    it("should get by id", async () => {
      const result = await client.getTimeEntry(state.timeEntryId!);

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBe(state.timeEntryId);
    });

    it("should fail for nonexistent (404)", async () => {
      const result = (await client.getTimeEntry(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_time_entry", () => {
    it("should update hours and comments", async () => {
      const result = await client.updateTimeEntry(state.timeEntryId!, {
        hours: 2.5,
        comments: "Updated time entry comment",
      });

      expect(result).toBeDefined();

      // Verify the update
      const getResult = await client.getTimeEntry(state.timeEntryId!);
      expect(getResult.time_entry.hours).toBe(2.5);
      expect(getResult.time_entry.comments).toBe("Updated time entry comment");
    });

    it("should fail for nonexistent (404)", async () => {
      const result = (await client.updateTimeEntry(999999999, {
        hours: 1.0,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_time_entry", () => {
    it("should delete", async () => {
      await expect(
        client.deleteTimeEntry(state.timeEntryId!)
      ).resolves.not.toThrow();

      state.timeEntryId = undefined;
    });

    it("should fail for nonexistent (404)", async () => {
      const result = (await client.deleteTimeEntry(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
