import { describe, expect, test } from "vitest";
import { formatMyAccount } from "../../src/formatters/account.js";
import type { RedmineMyAccountResponse } from "../../src/redmine/types.js";
import { expectedDate } from "../helpers.js";

const baseAccount: RedmineMyAccountResponse = {
  user: {
    id: 1,
    login: "jsmith",
    admin: false,
    firstname: "John",
    lastname: "Smith",
    mail: "john.smith@example.com",
    created_on: "2024-01-15T10:30:00Z",
  },
};

describe("formatMyAccount", () => {
  test("formats basic account", () => {
    const result = formatMyAccount(baseAccount);

    expect(result).toContain("# John Smith");
    expect(result).toContain("**Login:** jsmith");
    expect(result).toContain("| Email | john.smith@example.com |");
    expect(result).toContain(`| Created | ${expectedDate("2024-01-15T10:30:00Z")} |`);
  });

  test("formats account with status", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, status: 1 },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("**Status:** Active");
  });

  test("formats registered status", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, status: 2 },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("**Status:** Registered");
  });

  test("formats locked status", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, status: 3 },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("**Status:** Locked");
  });

  test("formats unknown status", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, status: 99 },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("**Status:** Unknown");
  });

  test("formats admin account", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, admin: true },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("**Role:** Admin");
  });

  test("does not show Role for non-admin", () => {
    const result = formatMyAccount(baseAccount);

    expect(result).not.toContain("**Role:**");
  });

  test("formats account with last login", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, last_login_on: "2024-03-10T14:22:00Z" },
    };
    const result = formatMyAccount(response);

    expect(result).toContain(`| Last Login | ${expectedDate("2024-03-10T14:22:00Z")} |`);
  });

  test("formats account with 2FA", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, twofa_scheme: "totp" },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("| 2FA | totp |");
  });

  test("formats account with API key", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, api_key: "abc123xyz789" },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("| API Key | abc123xyz789 |");
  });

  test("does not show optional fields when absent", () => {
    const result = formatMyAccount(baseAccount);

    expect(result).not.toContain("| Last Login |");
    expect(result).not.toContain("| 2FA |");
    expect(result).not.toContain("| API Key |");
  });

  test("formats account with custom fields", () => {
    const response: RedmineMyAccountResponse = {
      user: {
        ...baseAccount.user,
        custom_fields: [
          { id: 1, name: "Department", value: "Engineering" },
          { id: 2, name: "Phone", value: "+1234567890" },
        ],
      },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("## Custom Fields");
    expect(result).toContain("| Department | Engineering |");
    expect(result).toContain("| Phone | +1234567890 |");
  });

  test("formats custom field with array value", () => {
    const response: RedmineMyAccountResponse = {
      user: {
        ...baseAccount.user,
        custom_fields: [{ id: 1, name: "Skills", value: ["JavaScript", "TypeScript", "Python"] }],
      },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("| Skills | JavaScript, TypeScript, Python |");
  });

  test("does not show custom fields section when empty", () => {
    const response: RedmineMyAccountResponse = {
      user: { ...baseAccount.user, custom_fields: [] },
    };
    const result = formatMyAccount(response);

    expect(result).not.toContain("## Custom Fields");
  });

  test("formats full account with all fields", () => {
    const response: RedmineMyAccountResponse = {
      user: {
        ...baseAccount.user,
        admin: true,
        status: 1,
        last_login_on: "2024-03-10T14:22:00Z",
        twofa_scheme: "totp",
        api_key: "secretkey123",
        custom_fields: [{ id: 1, name: "Team", value: "Backend" }],
      },
    };
    const result = formatMyAccount(response);

    expect(result).toContain("# John Smith");
    expect(result).toContain("**Login:** jsmith");
    expect(result).toContain("**Status:** Active");
    expect(result).toContain("**Role:** Admin");
    expect(result).toContain("| Email | john.smith@example.com |");
    expect(result).toContain(`| Created | ${expectedDate("2024-01-15T10:30:00Z")} |`);
    expect(result).toContain(`| Last Login | ${expectedDate("2024-03-10T14:22:00Z")} |`);
    expect(result).toContain("| 2FA | totp |");
    expect(result).toContain("| API Key | secretkey123 |");
    expect(result).toContain("## Custom Fields");
    expect(result).toContain("| Team | Backend |");
  });
});
