import { describe, expect, test } from "vitest";
import { formatGroup, formatGroupList } from "../../src/formatters/group.js";
import type { RedmineGroup, RedmineGroupsResponse } from "../../src/redmine/types.js";

const baseGroup: RedmineGroup = {
  id: 1,
  name: "Developers",
};

describe("formatGroup", () => {
  test("formats basic group", () => {
    const result = formatGroup({ group: baseGroup });

    expect(result).toContain("# Developers");
  });

  test("formats group with users", () => {
    const group: RedmineGroup = {
      ...baseGroup,
      users: [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Jane Doe" },
      ],
    };
    const result = formatGroup({ group });

    expect(result).toContain("## Users");
    expect(result).toContain("- John Smith");
    expect(result).toContain("- Jane Doe");
  });

  test("does not show Users section when no users", () => {
    const result = formatGroup({ group: baseGroup });

    expect(result).not.toContain("## Users");
  });

  test("does not show Users section when users array is empty", () => {
    const group: RedmineGroup = {
      ...baseGroup,
      users: [],
    };
    const result = formatGroup({ group });

    expect(result).not.toContain("## Users");
  });

  test("formats group with memberships", () => {
    const group: RedmineGroup = {
      ...baseGroup,
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
    const result = formatGroup({ group });

    expect(result).toContain("## Project Memberships");
    expect(result).toContain("- **Project Alpha:** Developer, Reporter");
    expect(result).toContain("- **Project Beta:** Manager");
  });

  test("does not show Project Memberships section when no memberships", () => {
    const result = formatGroup({ group: baseGroup });

    expect(result).not.toContain("## Project Memberships");
  });

  test("does not show Project Memberships section when memberships array is empty", () => {
    const group: RedmineGroup = {
      ...baseGroup,
      memberships: [],
    };
    const result = formatGroup({ group });

    expect(result).not.toContain("## Project Memberships");
  });

  test("formats full group with all fields", () => {
    const group: RedmineGroup = {
      id: 5,
      name: "Core Team",
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      memberships: [
        {
          id: 1,
          project: { id: 1, name: "Main Project" },
          roles: [{ id: 1, name: "Admin" }],
        },
      ],
    };
    const result = formatGroup({ group });

    expect(result).toContain("# Core Team");
    expect(result).toContain("## Users");
    expect(result).toContain("- Alice");
    expect(result).toContain("- Bob");
    expect(result).toContain("## Project Memberships");
    expect(result).toContain("- **Main Project:** Admin");
  });
});

describe("formatGroupList", () => {
  test("formats empty group list", () => {
    const response: RedmineGroupsResponse = {
      groups: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };
    const result = formatGroupList(response);

    expect(result).toContain("# Groups (0)");
    expect(result).toContain("No groups found.");
  });

  test("formats single group list", () => {
    const response: RedmineGroupsResponse = {
      groups: [baseGroup],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatGroupList(response);

    expect(result).toContain("# Groups (1)");
    expect(result).toContain("| ID | Name | Members |");
    expect(result).toContain("| 1 | Developers | - |");
  });

  test("formats group with user count", () => {
    const response: RedmineGroupsResponse = {
      groups: [
        {
          ...baseGroup,
          users: [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
            { id: 3, name: "Bob" },
          ],
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatGroupList(response);

    expect(result).toContain("| 1 | Developers | 3 |");
  });

  test("formats multiple groups", () => {
    const response: RedmineGroupsResponse = {
      groups: [
        baseGroup,
        {
          id: 2,
          name: "Testers",
          users: [{ id: 1, name: "Tester" }],
        },
        {
          id: 3,
          name: "Admins",
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };
    const result = formatGroupList(response);

    expect(result).toContain("# Groups (3)");
    expect(result).toContain("| 1 | Developers | - |");
    expect(result).toContain("| 2 | Testers | 1 |");
    expect(result).toContain("| 3 | Admins | - |");
  });

  test("uses total_count from response", () => {
    const response: RedmineGroupsResponse = {
      groups: [baseGroup],
      total_count: 50,
      offset: 0,
      limit: 25,
    };
    const result = formatGroupList(response);

    expect(result).toContain("# Groups (50)");
  });
});
