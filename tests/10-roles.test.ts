import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("Roles", () => {
  describe("list_roles", () => {
    it("should list all roles", async () => {
      const result = await client.listRoles();
      expect(result).toHaveProperty("roles");
      expect(Array.isArray(result.roles)).toBe(true);
    });

    it("should have at least one role", async () => {
      const result = await client.listRoles();
      expect(result.roles.length).toBeGreaterThan(0);
      // Store first role ID for use in memberships tests
      state.roleId = result.roles[0].id;
    });
  });

  describe("get_role", () => {
    it("should get role with permissions", async () => {
      const result = await client.getRole(state.roleId!);
      expect(result).toHaveProperty("role");
      expect(result.role).toHaveProperty("id", state.roleId);
      expect(result.role).toHaveProperty("permissions");
      expect(Array.isArray(result.role.permissions)).toBe(true);
    });

    it("should fail for nonexistent role", async () => {
      const result = (await client.getRole(999999)) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
