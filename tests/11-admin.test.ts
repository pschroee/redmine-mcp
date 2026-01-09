import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

// ============================================================================
// USERS
// ============================================================================

describe("Users", () => {
  describe("create user", () => {
    it("should create a user with required fields", async () => {
      const timestamp = Date.now();
      const result = await client.createUser({
        login: `test-user-${timestamp}`,
        firstname: "Test",
        lastname: "User",
        mail: `test-user-${timestamp}@example.com`,
        generate_password: true,
      });

      expect(result.user).toBeDefined();
      expect(result.user.login).toBe(`test-user-${timestamp}`);
      expect(result.user.firstname).toBe("Test");
      expect(result.user.lastname).toBe("User");
      expect(result.user.id).toBeGreaterThan(0);

      state.testUserId = result.user.id;
    });

    it("should create a second user with generate_password", async () => {
      const timestamp = Date.now();
      const result = await client.createUser({
        login: `test-user2-${timestamp}`,
        firstname: "Second",
        lastname: "User",
        mail: `test-user2-${timestamp}@example.com`,
        generate_password: true,
      });

      expect(result.user).toBeDefined();
      expect(result.user.login).toBe(`test-user2-${timestamp}`);
      expect(result.user.firstname).toBe("Second");
      expect(result.user.id).toBeGreaterThan(0);

      state.secondTestUserId = result.user.id;
    });

    it("should fail without login", async () => {
      const timestamp = Date.now();
      const result = (await client.createUser({
        login: "",
        firstname: "No",
        lastname: "Login",
        mail: `no-login-${timestamp}@example.com`,
        generate_password: true,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail without mail", async () => {
      const timestamp = Date.now();
      const result = (await client.createUser({
        login: `no-mail-${timestamp}`,
        firstname: "No",
        lastname: "Mail",
        mail: "",
        generate_password: true,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail with duplicate login", async () => {
      const timestamp = Date.now();
      // First, create a user
      const firstResult = await client.createUser({
        login: `dup-user-${timestamp}`,
        firstname: "First",
        lastname: "Duplicate",
        mail: `dup-user-${timestamp}@example.com`,
        generate_password: true,
      });
      expect(firstResult.user).toBeDefined();

      // Try to create another user with the same login
      const result = (await client.createUser({
        login: `dup-user-${timestamp}`,
        firstname: "Second",
        lastname: "Duplicate",
        mail: `dup-user2-${timestamp}@example.com`,
        generate_password: true,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);

      // Clean up the first user
      await client.deleteUser(firstResult.user.id);
    });

    it("should fail with invalid email", async () => {
      const timestamp = Date.now();
      const result = (await client.createUser({
        login: `invalid-email-${timestamp}`,
        firstname: "Invalid",
        lastname: "Email",
        mail: "not-an-email",
        generate_password: true,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("list users", () => {
    it("should list all active users", async () => {
      const result = await client.listUsers({});

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      // status: 0 returns all users (active, locked, etc.)
      const result = await client.listUsers({ status: 0 });

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
    });

    it("should filter by name", async () => {
      const result = await client.listUsers({ name: "Test" });

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
    });

    it("should filter by group_id", async () => {
      // This test assumes state.groupId will be set by a previous test
      // If not set yet, we'll use a dummy group id
      const groupId = state.groupId || 1;
      const result = await client.listUsers({ group_id: groupId });

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe("get user", () => {
    it("should get user by id", async () => {
      const result = await client.getUser(state.testUserId!);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(state.testUserId);
    });

    it("should get user with includes", async () => {
      const result = await client.getUser(state.testUserId!, "memberships,groups");

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(state.testUserId);
    });

    it("should get current user", async () => {
      const result = await client.getUser("current");

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeGreaterThan(0);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.getUser(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update user", () => {
    it("should update firstname", async () => {
      const newFirstname = `Updated-${Date.now()}`;
      await client.updateUser(state.testUserId!, {
        firstname: newFirstname,
      });

      const result = await client.getUser(state.testUserId!);
      expect(result.user).toBeDefined();
      expect(result.user.firstname).toBe(newFirstname);
    });

    it("should lock user", async () => {
      // status: 3 = locked
      await client.updateUser(state.secondTestUserId!, {
        status: 3,
      });

      const result = await client.getUser(state.secondTestUserId!);
      expect(result.user).toBeDefined();
      expect(result.user.status).toBe(3);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.updateUser(999999999, {
        firstname: "Should Fail",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});

// ============================================================================
// GROUPS
// ============================================================================

describe("Groups", () => {
  describe("create group", () => {
    it("should create a group", async () => {
      const timestamp = Date.now();
      const result = await client.createGroup({
        name: `Test Group ${timestamp}`,
      });

      expect(result.group).toBeDefined();
      expect(result.group.name).toBe(`Test Group ${timestamp}`);
      expect(result.group.id).toBeGreaterThan(0);

      state.groupId = result.group.id;
    });

    it("should create a group with initial users", async () => {
      const timestamp = Date.now();
      const result = await client.createGroup({
        name: `Group With Users ${timestamp}`,
        user_ids: [state.testUserId!],
      });

      expect(result.group).toBeDefined();
      expect(result.group.name).toBe(`Group With Users ${timestamp}`);
      expect(result.group.id).toBeGreaterThan(0);

      // Clean up - delete this group
      await client.deleteGroup(result.group.id);
    });

    it("should fail without name", async () => {
      const result = (await client.createGroup({
        name: "",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail with duplicate name", async () => {
      const timestamp = Date.now();
      const groupName = `Duplicate Group ${timestamp}`;

      // First, create a group
      const firstResult = await client.createGroup({
        name: groupName,
      });
      expect(firstResult.group).toBeDefined();

      // Try to create another group with the same name
      const result = (await client.createGroup({
        name: groupName,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);

      // Clean up the first group
      await client.deleteGroup(firstResult.group.id);
    });
  });

  describe("list groups", () => {
    it("should list all groups", async () => {
      const result = await client.listGroups();

      expect(result.groups).toBeDefined();
      expect(Array.isArray(result.groups)).toBe(true);
      expect(result.groups.length).toBeGreaterThan(0);
    });
  });

  describe("get group", () => {
    it("should get group by id", async () => {
      const result = await client.getGroup(state.groupId!);

      expect(result.group).toBeDefined();
      expect(result.group.id).toBe(state.groupId);
    });

    it("should get group with users include", async () => {
      const result = await client.getGroup(state.groupId!, "users");

      expect(result.group).toBeDefined();
      expect(result.group.id).toBe(state.groupId);
    });

    it("should fail for nonexistent group", async () => {
      const result = (await client.getGroup(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("add user to group", () => {
    it("should add user to group", async () => {
      await expect(
        client.addUserToGroup(state.groupId!, state.testUserId!)
      ).resolves.not.toThrow();

      // Verify user is in group
      const result = await client.getGroup(state.groupId!, "users");
      expect(result.group).toBeDefined();
      expect(result.group.users).toBeDefined();
      expect(
        result.group.users.some(
          (user: { id: number }) => user.id === state.testUserId
        )
      ).toBe(true);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.addUserToGroup(
        state.groupId!,
        999999999
      )) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      // Redmine returns 422 for invalid user_id in group operations
      expect(result.status).toBe(422);
    });
  });

  describe("remove user from group", () => {
    it("should remove user from group", async () => {
      await expect(
        client.removeUserFromGroup(state.groupId!, state.testUserId!)
      ).resolves.not.toThrow();

      // Verify user is no longer in group
      const result = await client.getGroup(state.groupId!, "users");
      expect(result.group).toBeDefined();
      if (result.group.users) {
        expect(
          result.group.users.some(
            (user: { id: number }) => user.id === state.testUserId
          )
        ).toBe(false);
      }
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.removeUserFromGroup(
        state.groupId!,
        999999999
      )) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete group", () => {
    it("should delete group", async () => {
      await expect(client.deleteGroup(state.groupId!)).resolves.not.toThrow();
      state.groupId = undefined;
    });

    it("should fail for nonexistent group", async () => {
      const result = (await client.deleteGroup(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});

// ============================================================================
// DELETE USERS (partial cleanup - testUserId is kept for membership tests)
// ============================================================================

describe("Delete Users", () => {
  describe("delete user", () => {
    it("should delete second user", async () => {
      await expect(
        client.deleteUser(state.secondTestUserId!)
      ).resolves.not.toThrow();
      state.secondTestUserId = undefined;
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.deleteUser(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });

    // Note: testUserId is NOT deleted here - it's used by membership tests
    // and will be cleaned up by 12-memberships.test.ts
  });
});
