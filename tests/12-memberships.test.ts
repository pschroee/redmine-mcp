import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("Memberships", () => {
  describe("list_project_memberships", () => {
    it("should list memberships for project", async () => {
      const result = await client.listProjectMemberships(state.projectId, {});
      expect(result).toHaveProperty("memberships");
      expect(Array.isArray(result.memberships)).toBe(true);
    });

    it("should fail for nonexistent project", async () => {
      const result = (await client.listProjectMemberships(
        "nonexistent-project-12345",
        {}
      )) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("create_project_membership", () => {
    it("should add user with role", async () => {
      const result = await client.createProjectMembership(state.projectId, {
        user_id: state.testUserId!,
        role_ids: [state.roleId],
      });
      expect(result).toHaveProperty("membership");
      expect(result.membership).toHaveProperty("id");
      expect(result.membership.id).toBeGreaterThan(0);
      state.membershipId = result.membership.id;
    });

    it("should fail without role_ids", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: state.testUserId!,
        role_ids: [],
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: 999999,
        role_ids: [state.roleId],
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent role", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: state.testUserId!,
        role_ids: [999999],
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("get_membership", () => {
    it("should get membership by id", async () => {
      const result = await client.getMembership(state.membershipId!);
      expect(result).toHaveProperty("membership");
      expect(result.membership).toHaveProperty("id", state.membershipId);
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.getMembership(999999)) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_membership", () => {
    it("should update roles", async () => {
      // updateMembership returns void on success (Redmine returns 204 No Content)
      await expect(
        client.updateMembership(state.membershipId!, {
          role_ids: [state.roleId],
        })
      ).resolves.not.toThrow();

      // Verify by fetching the membership
      const result = await client.getMembership(state.membershipId!);
      expect(result.membership).toBeDefined();
      expect(result.membership.roles).toBeDefined();
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.updateMembership(999999, {
        role_ids: [state.roleId],
      })) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_membership", () => {
    it("should remove membership", async () => {
      await expect(
        client.deleteMembership(state.membershipId!)
      ).resolves.not.toThrow();
      state.membershipId = undefined;
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.deleteMembership(999999)) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});

// ============================================================================
// CLEANUP - Delete testUserId created by 11-admin.test.ts
// ============================================================================

describe("Cleanup", () => {
  it("should delete test user", async () => {
    if (state.testUserId) {
      await expect(client.deleteUser(state.testUserId)).resolves.not.toThrow();
      state.testUserId = undefined;
    }
  });
});
