import { describe, expect, test } from "vitest";
import { formatMembership, formatMembershipList } from "../../src/formatters/membership.js";
import type { RedmineMembership, RedmineMembershipsResponse } from "../../src/redmine/types.js";

const baseMembership: RedmineMembership = {
  id: 1,
  project: { id: 10, name: "Test Project" },
  user: { id: 5, name: "John Doe" },
  roles: [{ id: 1, name: "Developer" }],
};

describe("formatMembership", () => {
  test("formats user membership", () => {
    const result = formatMembership({ membership: baseMembership });

    expect(result).toContain("# Membership #1");
    expect(result).toContain("| Project | Test Project |");
    expect(result).toContain("| User | John Doe |");
    expect(result).toContain("| Roles | Developer |");
    expect(result).not.toContain("| Group |");
  });

  test("formats group membership", () => {
    const membership: RedmineMembership = {
      id: 2,
      project: { id: 10, name: "Test Project" },
      group: { id: 100, name: "Development Team" },
      roles: [{ id: 1, name: "Developer" }],
    };
    const result = formatMembership({ membership });

    expect(result).toContain("# Membership #2");
    expect(result).toContain("| Group | Development Team |");
    expect(result).not.toContain("| User |");
  });

  test("formats membership with multiple roles", () => {
    const membership: RedmineMembership = {
      ...baseMembership,
      roles: [
        { id: 1, name: "Developer" },
        { id: 2, name: "Reporter" },
        { id: 3, name: "Manager" },
      ],
    };
    const result = formatMembership({ membership });

    expect(result).toContain("| Roles | Developer, Reporter, Manager |");
  });

  test("formats membership with inherited roles", () => {
    const membership: RedmineMembership = {
      ...baseMembership,
      roles: [
        { id: 1, name: "Developer", inherited: true },
        { id: 2, name: "Reporter" },
      ],
    };
    const result = formatMembership({ membership });

    expect(result).toContain("| Roles | Developer (inherited), Reporter |");
  });

  test("formats membership with all inherited roles", () => {
    const membership: RedmineMembership = {
      ...baseMembership,
      roles: [
        { id: 1, name: "Developer", inherited: true },
        { id: 2, name: "Reporter", inherited: true },
      ],
    };
    const result = formatMembership({ membership });

    expect(result).toContain("| Roles | Developer (inherited), Reporter (inherited) |");
  });

  test("formats membership with single role", () => {
    const result = formatMembership({ membership: baseMembership });

    expect(result).toContain("| Roles | Developer |");
  });
});

describe("formatMembershipList", () => {
  test("formats empty membership list", () => {
    const response: RedmineMembershipsResponse = {
      memberships: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toBe("No memberships found.");
  });

  test("formats single user membership in list", () => {
    const response: RedmineMembershipsResponse = {
      memberships: [baseMembership],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("# Project Memberships (1)");
    expect(result).toContain("| ID | User/Group | Type | Roles |");
    expect(result).toContain("| 1 | John Doe | User | Developer |");
  });

  test("formats single group membership in list", () => {
    const membership: RedmineMembership = {
      id: 2,
      project: { id: 10, name: "Test Project" },
      group: { id: 100, name: "QA Team" },
      roles: [{ id: 3, name: "Tester" }],
    };
    const response: RedmineMembershipsResponse = {
      memberships: [membership],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("| 2 | QA Team | Group | Tester |");
  });

  test("formats mixed user and group memberships", () => {
    const response: RedmineMembershipsResponse = {
      memberships: [
        baseMembership,
        {
          id: 2,
          project: { id: 10, name: "Test Project" },
          group: { id: 100, name: "Admins" },
          roles: [{ id: 4, name: "Administrator" }],
        },
        {
          id: 3,
          project: { id: 10, name: "Test Project" },
          user: { id: 6, name: "Jane Smith" },
          roles: [{ id: 2, name: "Manager" }],
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("# Project Memberships (3)");
    expect(result).toContain("| 1 | John Doe | User | Developer |");
    expect(result).toContain("| 2 | Admins | Group | Administrator |");
    expect(result).toContain("| 3 | Jane Smith | User | Manager |");
  });

  test("formats membership with multiple roles in list", () => {
    const membership: RedmineMembership = {
      ...baseMembership,
      roles: [
        { id: 1, name: "Developer" },
        { id: 2, name: "Reporter" },
      ],
    };
    const response: RedmineMembershipsResponse = {
      memberships: [membership],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("| Roles |");
    expect(result).toContain("Developer, Reporter");
  });

  test("formats membership with inherited roles in list", () => {
    const membership: RedmineMembership = {
      ...baseMembership,
      roles: [
        { id: 1, name: "Developer", inherited: true },
        { id: 2, name: "Reporter" },
      ],
    };
    const response: RedmineMembershipsResponse = {
      memberships: [membership],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("Developer (inherited), Reporter");
  });

  test("uses total_count from response", () => {
    const response: RedmineMembershipsResponse = {
      memberships: [baseMembership],
      total_count: 100,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    expect(result).toContain("# Project Memberships (100)");
  });

  test("handles membership without user or group gracefully", () => {
    const membership: RedmineMembership = {
      id: 99,
      project: { id: 10, name: "Test Project" },
      roles: [{ id: 1, name: "Developer" }],
    };
    const response: RedmineMembershipsResponse = {
      memberships: [membership],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatMembershipList(response);

    // Should show "Unknown" and default to "Group" type when no user
    expect(result).toContain("| 99 | Unknown | Group | Developer |");
  });
});
