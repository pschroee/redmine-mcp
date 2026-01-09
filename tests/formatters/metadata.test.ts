import { describe, expect, test } from "vitest";
import {
  formatTrackerList,
  formatStatusList,
  formatCategoryList,
  formatPriorityList,
  formatActivityList,
  formatRoleList,
  formatRole,
} from "../../src/formatters/metadata.js";

// === TRACKER TESTS ===

describe("formatTrackerList", () => {
  test("formats empty tracker list", () => {
    const response = { trackers: [] };
    const result = formatTrackerList(response);

    expect(result).toContain("# Trackers");
    expect(result).toContain("No trackers found.");
  });

  test("formats single tracker", () => {
    const response = {
      trackers: [{ id: 1, name: "Bug" }],
    };
    const result = formatTrackerList(response);

    expect(result).toContain("# Trackers");
    expect(result).toContain("| ID | Name |");
    expect(result).toContain("| 1 | Bug |");
  });

  test("formats multiple trackers", () => {
    const response = {
      trackers: [
        { id: 1, name: "Bug" },
        { id: 2, name: "Feature" },
        { id: 3, name: "Support" },
      ],
    };
    const result = formatTrackerList(response);

    expect(result).toContain("| 1 | Bug |");
    expect(result).toContain("| 2 | Feature |");
    expect(result).toContain("| 3 | Support |");
  });
});

// === STATUS TESTS ===

describe("formatStatusList", () => {
  test("formats empty status list", () => {
    const response = { issue_statuses: [] };
    const result = formatStatusList(response);

    expect(result).toContain("# Issue Statuses");
    expect(result).toContain("No statuses found.");
  });

  test("formats single status", () => {
    const response = {
      issue_statuses: [{ id: 1, name: "New", is_closed: false }],
    };
    const result = formatStatusList(response);

    expect(result).toContain("# Issue Statuses");
    expect(result).toContain("| ID | Name | Closed |");
    expect(result).toContain("| 1 | New | No |");
  });

  test("formats closed status", () => {
    const response = {
      issue_statuses: [{ id: 5, name: "Closed", is_closed: true }],
    };
    const result = formatStatusList(response);

    expect(result).toContain("| 5 | Closed | Yes |");
  });

  test("formats multiple statuses", () => {
    const response = {
      issue_statuses: [
        { id: 1, name: "New", is_closed: false },
        { id: 2, name: "In Progress", is_closed: false },
        { id: 5, name: "Closed", is_closed: true },
      ],
    };
    const result = formatStatusList(response);

    expect(result).toContain("| 1 | New | No |");
    expect(result).toContain("| 2 | In Progress | No |");
    expect(result).toContain("| 5 | Closed | Yes |");
  });
});

// === CATEGORY TESTS ===

describe("formatCategoryList", () => {
  test("formats empty category list", () => {
    const response = { issue_categories: [] };
    const result = formatCategoryList(response);

    expect(result).toContain("# Issue Categories");
    expect(result).toContain("No categories found.");
  });

  test("formats single category without assigned_to", () => {
    const response = {
      issue_categories: [{ id: 1, name: "Backend" }],
    };
    const result = formatCategoryList(response);

    expect(result).toContain("# Issue Categories");
    expect(result).toContain("| ID | Name | Assigned To |");
    expect(result).toContain("| 1 | Backend |  |");
  });

  test("formats category with assigned_to", () => {
    const response = {
      issue_categories: [
        { id: 1, name: "Backend", assigned_to: { id: 5, name: "John Smith" } },
      ],
    };
    const result = formatCategoryList(response);

    expect(result).toContain("| 1 | Backend | John Smith |");
  });

  test("formats multiple categories", () => {
    const response = {
      issue_categories: [
        { id: 1, name: "Backend", assigned_to: { id: 5, name: "John" } },
        { id: 2, name: "Frontend" },
        { id: 3, name: "Database", assigned_to: { id: 6, name: "Jane" } },
      ],
    };
    const result = formatCategoryList(response);

    expect(result).toContain("| 1 | Backend | John |");
    expect(result).toContain("| 2 | Frontend |  |");
    expect(result).toContain("| 3 | Database | Jane |");
  });
});

// === PRIORITY TESTS ===

describe("formatPriorityList", () => {
  test("formats empty priority list", () => {
    const response = { issue_priorities: [] };
    const result = formatPriorityList(response);

    expect(result).toContain("# Issue Priorities");
    expect(result).toContain("No priorities found.");
  });

  test("formats single priority", () => {
    const response = {
      issue_priorities: [{ id: 2, name: "Normal", is_default: true }],
    };
    const result = formatPriorityList(response);

    expect(result).toContain("# Issue Priorities");
    expect(result).toContain("| ID | Name | Default |");
    expect(result).toContain("| 2 | Normal | Yes |");
  });

  test("formats non-default priority", () => {
    const response = {
      issue_priorities: [{ id: 4, name: "High", is_default: false }],
    };
    const result = formatPriorityList(response);

    expect(result).toContain("| 4 | High | No |");
  });

  test("formats multiple priorities", () => {
    const response = {
      issue_priorities: [
        { id: 1, name: "Low", is_default: false },
        { id: 2, name: "Normal", is_default: true },
        { id: 3, name: "High", is_default: false },
        { id: 4, name: "Urgent", is_default: false },
      ],
    };
    const result = formatPriorityList(response);

    expect(result).toContain("| 1 | Low | No |");
    expect(result).toContain("| 2 | Normal | Yes |");
    expect(result).toContain("| 3 | High | No |");
    expect(result).toContain("| 4 | Urgent | No |");
  });
});

// === ACTIVITY TESTS ===

describe("formatActivityList", () => {
  test("formats empty activity list", () => {
    const response = { time_entry_activities: [] };
    const result = formatActivityList(response);

    expect(result).toContain("# Time Entry Activities");
    expect(result).toContain("No activities found.");
  });

  test("formats single activity", () => {
    const response = {
      time_entry_activities: [
        { id: 1, name: "Development", is_default: true, active: true },
      ],
    };
    const result = formatActivityList(response);

    expect(result).toContain("# Time Entry Activities");
    expect(result).toContain("| ID | Name | Default | Active |");
    expect(result).toContain("| 1 | Development | Yes | Yes |");
  });

  test("formats inactive activity", () => {
    const response = {
      time_entry_activities: [
        { id: 2, name: "Design", is_default: false, active: false },
      ],
    };
    const result = formatActivityList(response);

    expect(result).toContain("| 2 | Design | No | No |");
  });

  test("formats activity without active field", () => {
    const response = {
      time_entry_activities: [
        { id: 3, name: "Testing", is_default: false },
      ],
    };
    const result = formatActivityList(response);

    expect(result).toContain("| 3 | Testing | No |  |");
  });

  test("formats multiple activities", () => {
    const response = {
      time_entry_activities: [
        { id: 1, name: "Development", is_default: true, active: true },
        { id: 2, name: "Design", is_default: false, active: true },
        { id: 3, name: "Testing", is_default: false, active: true },
        { id: 4, name: "Legacy", is_default: false, active: false },
      ],
    };
    const result = formatActivityList(response);

    expect(result).toContain("| 1 | Development | Yes | Yes |");
    expect(result).toContain("| 2 | Design | No | Yes |");
    expect(result).toContain("| 3 | Testing | No | Yes |");
    expect(result).toContain("| 4 | Legacy | No | No |");
  });
});

// === ROLE TESTS ===

describe("formatRoleList", () => {
  test("formats empty role list", () => {
    const response = { roles: [] };
    const result = formatRoleList(response);

    expect(result).toContain("# Roles");
    expect(result).toContain("No roles found.");
  });

  test("formats single role without assignable", () => {
    const response = {
      roles: [{ id: 1, name: "Manager" }],
    };
    const result = formatRoleList(response);

    expect(result).toContain("# Roles");
    expect(result).toContain("| ID | Name | Assignable |");
    expect(result).toContain("| 1 | Manager |  |");
  });

  test("formats assignable role", () => {
    const response = {
      roles: [{ id: 2, name: "Developer", assignable: true }],
    };
    const result = formatRoleList(response);

    expect(result).toContain("| 2 | Developer | Yes |");
  });

  test("formats non-assignable role", () => {
    const response = {
      roles: [{ id: 3, name: "Non-member", assignable: false }],
    };
    const result = formatRoleList(response);

    expect(result).toContain("| 3 | Non-member | No |");
  });

  test("formats multiple roles", () => {
    const response = {
      roles: [
        { id: 1, name: "Manager", assignable: true },
        { id: 2, name: "Developer", assignable: true },
        { id: 3, name: "Reporter", assignable: true },
        { id: 4, name: "Non-member", assignable: false },
      ],
    };
    const result = formatRoleList(response);

    expect(result).toContain("| 1 | Manager | Yes |");
    expect(result).toContain("| 2 | Developer | Yes |");
    expect(result).toContain("| 3 | Reporter | Yes |");
    expect(result).toContain("| 4 | Non-member | No |");
  });
});

describe("formatRole", () => {
  test("formats role without permissions", () => {
    const response = {
      role: { id: 1, name: "Manager" },
    };
    const result = formatRole(response);

    expect(result).toContain("# Manager");
    expect(result).toContain("**ID:** 1");
    expect(result).not.toContain("## Permissions");
  });

  test("formats role with assignable true", () => {
    const response = {
      role: { id: 1, name: "Developer", assignable: true },
    };
    const result = formatRole(response);

    expect(result).toContain("# Developer");
    expect(result).toContain("**ID:** 1");
    expect(result).toContain("**Assignable:** Yes");
  });

  test("formats role with assignable false", () => {
    const response = {
      role: { id: 3, name: "Non-member", assignable: false },
    };
    const result = formatRole(response);

    expect(result).toContain("**Assignable:** No");
  });

  test("formats role with permissions", () => {
    const response = {
      role: {
        id: 2,
        name: "Developer",
        assignable: true,
        permissions: ["view_issues", "add_issues", "edit_issues"],
      },
    };
    const result = formatRole(response);

    expect(result).toContain("# Developer");
    expect(result).toContain("**ID:** 2");
    expect(result).toContain("**Assignable:** Yes");
    expect(result).toContain("## Permissions");
    expect(result).toContain("- view_issues");
    expect(result).toContain("- add_issues");
    expect(result).toContain("- edit_issues");
  });

  test("formats role with many permissions", () => {
    const response = {
      role: {
        id: 1,
        name: "Manager",
        assignable: true,
        permissions: [
          "view_project",
          "manage_members",
          "view_issues",
          "add_issues",
          "edit_issues",
          "delete_issues",
          "manage_issue_relations",
        ],
      },
    };
    const result = formatRole(response);

    expect(result).toContain("## Permissions");
    expect(result).toContain("- view_project");
    expect(result).toContain("- manage_members");
    expect(result).toContain("- delete_issues");
    expect(result).toContain("- manage_issue_relations");
  });
});
