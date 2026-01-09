import { describe, expect, test } from "vitest";
import { formatUser, formatUserList } from "../../src/formatters/user.js";
import type { RedmineUser, RedmineUsersResponse } from "../../src/redmine/types.js";

const baseUser: RedmineUser = {
  id: 1,
  login: "jsmith",
  firstname: "John",
  lastname: "Smith",
  mail: "john.smith@example.com",
  admin: false,
  status: 1,
  created_on: "2024-01-15T10:30:00Z",
};

describe("formatUser", () => {
  test("formats basic user", () => {
    const result = formatUser({ user: baseUser });

    expect(result).toContain("# John Smith");
    expect(result).toContain("**Login:** jsmith");
    expect(result).toContain("**Status:** Active");
    expect(result).toContain("| Email | john.smith@example.com |");
    expect(result).toContain("| Created | 2024-01-15 10:30 |");
  });

  test("formats admin user", () => {
    const user: RedmineUser = { ...baseUser, admin: true };
    const result = formatUser({ user });

    expect(result).toContain("**Role:** Admin");
  });

  test("does not show Role for non-admin", () => {
    const result = formatUser({ user: baseUser });

    expect(result).not.toContain("**Role:**");
  });

  test("formats registered user status", () => {
    const user: RedmineUser = { ...baseUser, status: 2 };
    const result = formatUser({ user });

    expect(result).toContain("**Status:** Registered");
  });

  test("formats locked user status", () => {
    const user: RedmineUser = { ...baseUser, status: 3 };
    const result = formatUser({ user });

    expect(result).toContain("**Status:** Locked");
  });

  test("formats unknown status", () => {
    const user: RedmineUser = { ...baseUser, status: 99 };
    const result = formatUser({ user });

    expect(result).toContain("**Status:** Unknown");
  });

  test("formats user with last login", () => {
    const user: RedmineUser = {
      ...baseUser,
      last_login_on: "2024-03-10T14:22:00Z",
    };
    const result = formatUser({ user });

    expect(result).toContain("| Last Login | 2024-03-10 14:22 |");
  });

  test("formats user without email", () => {
    const user: RedmineUser = { ...baseUser, mail: undefined };
    const result = formatUser({ user });

    expect(result).not.toContain("| Email |");
  });

  test("formats user with groups", () => {
    const user: RedmineUser = {
      ...baseUser,
      groups: [
        { id: 1, name: "Developers" },
        { id: 2, name: "Testers" },
      ],
    };
    const result = formatUser({ user });

    expect(result).toContain("## Groups");
    expect(result).toContain("- Developers");
    expect(result).toContain("- Testers");
  });

  test("formats user with memberships", () => {
    const user: RedmineUser = {
      ...baseUser,
      memberships: [
        {
          id: 1,
          project: { id: 1, name: "Project Alpha" },
          roles: [
            { id: 1, name: "Developer" },
            { id: 2, name: "Reporter" },
          ],
        },
        {
          id: 2,
          project: { id: 2, name: "Project Beta" },
          roles: [{ id: 3, name: "Manager" }],
        },
      ],
    };
    const result = formatUser({ user });

    expect(result).toContain("## Project Memberships");
    expect(result).toContain("- **Project Alpha:** Developer, Reporter");
    expect(result).toContain("- **Project Beta:** Manager");
  });

  test("formats full user with all fields", () => {
    const user: RedmineUser = {
      ...baseUser,
      admin: true,
      last_login_on: "2024-03-10T14:22:00Z",
      groups: [{ id: 1, name: "Admins" }],
      memberships: [
        {
          id: 1,
          project: { id: 1, name: "Main Project" },
          roles: [{ id: 1, name: "Admin" }],
        },
      ],
    };
    const result = formatUser({ user });

    expect(result).toContain("# John Smith");
    expect(result).toContain("**Login:** jsmith");
    expect(result).toContain("**Status:** Active");
    expect(result).toContain("**Role:** Admin");
    expect(result).toContain("| Email | john.smith@example.com |");
    expect(result).toContain("| Last Login | 2024-03-10 14:22 |");
    expect(result).toContain("## Groups");
    expect(result).toContain("- Admins");
    expect(result).toContain("## Project Memberships");
    expect(result).toContain("- **Main Project:** Admin");
  });
});

describe("formatUserList", () => {
  test("formats empty user list", () => {
    const response: RedmineUsersResponse = {
      users: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("# Users (0)");
    expect(result).toContain("No users found.");
  });

  test("formats single user list", () => {
    const response: RedmineUsersResponse = {
      users: [baseUser],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("# Users (1)");
    expect(result).toContain("| Name | Login | Email | Status | Role |");
    expect(result).toContain("| John Smith | jsmith | john.smith@example.com | Active | User |");
  });

  test("formats admin in list", () => {
    const response: RedmineUsersResponse = {
      users: [{ ...baseUser, admin: true }],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("| John Smith | jsmith | john.smith@example.com | Active | Admin |");
  });

  test("formats multiple users", () => {
    const response: RedmineUsersResponse = {
      users: [
        baseUser,
        {
          ...baseUser,
          id: 2,
          login: "admin",
          firstname: "Admin",
          lastname: "User",
          mail: "admin@example.com",
          admin: true,
          status: 1,
        },
        {
          ...baseUser,
          id: 3,
          login: "locked",
          firstname: "Locked",
          lastname: "Account",
          mail: "locked@example.com",
          status: 3,
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("# Users (3)");
    expect(result).toContain("| John Smith | jsmith | john.smith@example.com | Active | User |");
    expect(result).toContain("| Admin User | admin | admin@example.com | Active | Admin |");
    expect(result).toContain("| Locked Account | locked | locked@example.com | Locked | User |");
  });

  test("uses total_count from response", () => {
    const response: RedmineUsersResponse = {
      users: [baseUser],
      total_count: 100,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("# Users (100)");
  });

  test("handles user without email in list", () => {
    const response: RedmineUsersResponse = {
      users: [{ ...baseUser, mail: undefined }],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("| John Smith | jsmith |  | Active | User |");
  });

  test("handles unknown status in list", () => {
    const response: RedmineUsersResponse = {
      users: [{ ...baseUser, status: 99 }],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatUserList(response);

    expect(result).toContain("| John Smith | jsmith | john.smith@example.com | Unknown | User |");
  });
});
