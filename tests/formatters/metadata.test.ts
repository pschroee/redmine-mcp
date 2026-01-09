import { describe, expect, test } from "vitest";
import {
  formatTrackerList,
  formatStatusList,
  formatCategoryList,
  formatPriorityList,
  formatActivityList,
  formatRoleList,
  formatRole,
  formatCategory,
  formatCustomFieldList,
  formatQueryList,
  formatDocumentCategoryList,
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

// === CATEGORY (SINGLE) TESTS ===

describe("formatCategory", () => {
  test("formats basic category", () => {
    const response = {
      issue_category: { id: 1, name: "Backend" },
    };
    const result = formatCategory(response);

    expect(result).toContain("# Backend");
    expect(result).toContain("| Field | Value |");
    expect(result).toContain("| ID | 1 |");
  });

  test("formats category with project", () => {
    const response = {
      issue_category: {
        id: 2,
        name: "Frontend",
        project: { id: 5, name: "Web App" },
      },
    };
    const result = formatCategory(response);

    expect(result).toContain("# Frontend");
    expect(result).toContain("| ID | 2 |");
    expect(result).toContain("| Project | Web App |");
  });

  test("formats category with assigned_to", () => {
    const response = {
      issue_category: {
        id: 3,
        name: "Database",
        assigned_to: { id: 10, name: "Jane Smith" },
      },
    };
    const result = formatCategory(response);

    expect(result).toContain("# Database");
    expect(result).toContain("| ID | 3 |");
    expect(result).toContain("| Default Assignee | Jane Smith |");
  });

  test("formats category with project and assigned_to", () => {
    const response = {
      issue_category: {
        id: 4,
        name: "API",
        project: { id: 5, name: "Web App" },
        assigned_to: { id: 11, name: "John Doe" },
      },
    };
    const result = formatCategory(response);

    expect(result).toContain("# API");
    expect(result).toContain("| ID | 4 |");
    expect(result).toContain("| Project | Web App |");
    expect(result).toContain("| Default Assignee | John Doe |");
  });
});

// === CUSTOM FIELDS TESTS ===

describe("formatCustomFieldList", () => {
  test("formats empty custom field list", () => {
    const response = { custom_fields: [] };
    const result = formatCustomFieldList(response);

    expect(result).toBe("No custom fields found.");
  });

  test("formats single custom field", () => {
    const response = {
      custom_fields: [
        {
          id: 1,
          name: "Sprint",
          customized_type: "issue",
          field_format: "string",
          is_required: false,
          is_filter: true,
          searchable: true,
        },
      ],
    };
    const result = formatCustomFieldList(response);

    expect(result).toContain("# Custom Fields (1)");
    expect(result).toContain("| ID | Name | Type | Format | Required |");
    expect(result).toContain("| 1 | Sprint | issue | string | No |");
  });

  test("formats required custom field", () => {
    const response = {
      custom_fields: [
        {
          id: 2,
          name: "Priority Level",
          customized_type: "issue",
          field_format: "list",
          is_required: true,
          is_filter: true,
          searchable: true,
        },
      ],
    };
    const result = formatCustomFieldList(response);

    expect(result).toContain("| 2 | Priority Level | issue | list | Yes |");
  });

  test("formats multiple custom fields", () => {
    const response = {
      custom_fields: [
        {
          id: 1,
          name: "External ID",
          customized_type: "issue",
          field_format: "string",
          is_required: false,
          is_filter: true,
          searchable: true,
        },
        {
          id: 2,
          name: "Company",
          customized_type: "project",
          field_format: "string",
          is_required: true,
          is_filter: false,
          searchable: false,
        },
        {
          id: 3,
          name: "Phone",
          customized_type: "user",
          field_format: "string",
          is_required: false,
          is_filter: false,
          searchable: true,
        },
      ],
    };
    const result = formatCustomFieldList(response);

    expect(result).toContain("# Custom Fields (3)");
    expect(result).toContain("| 1 | External ID | issue | string | No |");
    expect(result).toContain("| 2 | Company | project | string | Yes |");
    expect(result).toContain("| 3 | Phone | user | string | No |");
  });

  test("formats custom fields with different formats", () => {
    const response = {
      custom_fields: [
        {
          id: 1,
          name: "Date Field",
          customized_type: "issue",
          field_format: "date",
          is_required: false,
          is_filter: true,
          searchable: true,
        },
        {
          id: 2,
          name: "Boolean Field",
          customized_type: "issue",
          field_format: "bool",
          is_required: false,
          is_filter: true,
          searchable: false,
        },
        {
          id: 3,
          name: "Link Field",
          customized_type: "issue",
          field_format: "link",
          is_required: false,
          is_filter: false,
          searchable: false,
        },
      ],
    };
    const result = formatCustomFieldList(response);

    expect(result).toContain("| 1 | Date Field | issue | date | No |");
    expect(result).toContain("| 2 | Boolean Field | issue | bool | No |");
    expect(result).toContain("| 3 | Link Field | issue | link | No |");
  });
});

// === QUERIES TESTS ===

describe("formatQueryList", () => {
  test("formats empty query list", () => {
    const response = { queries: [] };
    const result = formatQueryList(response);

    expect(result).toBe("No queries found.");
  });

  test("formats single public global query", () => {
    const response = {
      queries: [
        {
          id: 1,
          name: "Open Issues",
          is_public: true,
        },
      ],
    };
    const result = formatQueryList(response);

    expect(result).toContain("# Saved Queries (1)");
    expect(result).toContain("| ID | Name | Project | Project Identifier | Visibility |");
    expect(result).toContain("| 1 | Open Issues |  |  | Public |");
  });

  test("formats single private global query", () => {
    const response = {
      queries: [
        {
          id: 2,
          name: "My Tasks",
          is_public: false,
        },
      ],
    };
    const result = formatQueryList(response);

    expect(result).toContain("| 2 | My Tasks |  |  | Private |");
  });

  test("formats query with project_id without lookup", () => {
    const response = {
      queries: [
        {
          id: 3,
          name: "Project Bugs",
          is_public: true,
          project_id: 5,
        },
      ],
    };
    const result = formatQueryList(response);

    expect(result).toContain("| 3 | Project Bugs | #5 | #5 | Public |");
  });

  test("formats query with project_id with lookup", () => {
    const response = {
      queries: [
        {
          id: 3,
          name: "Project Bugs",
          is_public: true,
          project_id: 5,
        },
      ],
    };
    const projectLookup = { 5: { name: "My Project", identifier: "my-project" } };
    const result = formatQueryList(response, projectLookup);

    expect(result).toContain("| 3 | Project Bugs | My Project | my-project | Public |");
  });

  test("formats multiple queries with lookup", () => {
    const response = {
      queries: [
        { id: 1, name: "All Open Issues", is_public: true },
        { id: 2, name: "Assigned to Me", is_public: false },
        { id: 3, name: "High Priority", is_public: true },
        { id: 4, name: "Due This Week", is_public: false, project_id: 1 },
      ],
    };
    const projectLookup = { 1: { name: "Main Project", identifier: "main-project" } };
    const result = formatQueryList(response, projectLookup);

    expect(result).toContain("# Saved Queries (4)");
    expect(result).toContain("| 1 | All Open Issues |  |  | Public |");
    expect(result).toContain("| 2 | Assigned to Me |  |  | Private |");
    expect(result).toContain("| 3 | High Priority |  |  | Public |");
    expect(result).toContain("| 4 | Due This Week | Main Project | main-project | Private |");
  });
});

// === DOCUMENT CATEGORIES TESTS ===

describe("formatDocumentCategoryList", () => {
  test("formats empty document category list", () => {
    const response = { document_categories: [] };
    const result = formatDocumentCategoryList(response);

    expect(result).toBe("No document categories found.");
  });

  test("formats single document category", () => {
    const response = {
      document_categories: [
        {
          id: 1,
          name: "User Documentation",
          is_default: false,
        },
      ],
    };
    const result = formatDocumentCategoryList(response);

    expect(result).toContain("# Document Categories (1)");
    expect(result).toContain("| ID | Name | Default |");
    expect(result).toContain("| 1 | User Documentation | No |");
  });

  test("formats default document category", () => {
    const response = {
      document_categories: [
        {
          id: 2,
          name: "Technical Documentation",
          is_default: true,
        },
      ],
    };
    const result = formatDocumentCategoryList(response);

    expect(result).toContain("| 2 | Technical Documentation | Yes |");
  });

  test("formats multiple document categories", () => {
    const response = {
      document_categories: [
        { id: 1, name: "User Documentation", is_default: false },
        { id: 2, name: "Technical Documentation", is_default: true },
        { id: 3, name: "API Documentation", is_default: false },
        { id: 4, name: "Release Notes", is_default: false },
      ],
    };
    const result = formatDocumentCategoryList(response);

    expect(result).toContain("# Document Categories (4)");
    expect(result).toContain("| 1 | User Documentation | No |");
    expect(result).toContain("| 2 | Technical Documentation | Yes |");
    expect(result).toContain("| 3 | API Documentation | No |");
    expect(result).toContain("| 4 | Release Notes | No |");
  });
});
