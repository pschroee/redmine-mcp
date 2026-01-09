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
