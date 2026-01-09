import { describe, it, expect } from "vitest";
import { formatIssueList } from "../../src/formatters/issue.js";
import type { RedmineIssuesResponse, RedmineIssue } from "../../src/redmine/types.js";

function createMockIssue(overrides: Partial<RedmineIssue> = {}): RedmineIssue {
  return {
    id: 1,
    project: { id: 1, name: "Test Project" },
    tracker: { id: 1, name: "Bug" },
    status: { id: 1, name: "New" },
    priority: { id: 2, name: "Normal" },
    author: { id: 1, name: "John Doe" },
    subject: "Test Issue",
    created_on: "2024-01-15T10:30:00Z",
    updated_on: "2024-01-16T14:45:00Z",
    ...overrides,
  };
}

describe("formatIssueList", () => {
  it("should format issue list as markdown table with multiple issues", () => {
    const response: RedmineIssuesResponse = {
      issues: [
        createMockIssue({
          id: 1,
          subject: "First issue",
          status: { id: 1, name: "New" },
          priority: { id: 2, name: "Normal" },
          assigned_to: { id: 1, name: "Alice" },
          updated_on: "2024-01-16T14:45:00Z",
        }),
        createMockIssue({
          id: 2,
          subject: "Second issue",
          status: { id: 2, name: "In Progress" },
          priority: { id: 3, name: "High" },
          assigned_to: { id: 2, name: "Bob" },
          updated_on: "2024-01-17T09:00:00Z",
        }),
        createMockIssue({
          id: 3,
          subject: "Third issue",
          status: { id: 3, name: "Resolved" },
          priority: { id: 1, name: "Low" },
          assigned_to: { id: 3, name: "Charlie" },
          updated_on: "2024-01-18T16:30:00Z",
        }),
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("# Issues (3 of 3)");
    expect(result).toContain("| ID | Subject | Status | Priority | Assigned | Updated |");
    expect(result).toContain("| #1 | First issue | New | Normal | Alice | 2024-01-16 |");
    expect(result).toContain("| #2 | Second issue | In Progress | High | Bob | 2024-01-17 |");
    expect(result).toContain("| #3 | Third issue | Resolved | Low | Charlie | 2024-01-18 |");
    // No pagination info when showing all
    expect(result).not.toContain("_Showing");
  });

  it("should handle empty issue list", () => {
    const response: RedmineIssuesResponse = {
      issues: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("# Issues (0 of 0)");
    expect(result).toContain("No issues found.");
    expect(result).not.toContain("| ID |");
  });

  it("should handle unassigned issues", () => {
    const response: RedmineIssuesResponse = {
      issues: [
        createMockIssue({
          id: 5,
          subject: "Unassigned task",
          assigned_to: undefined,
          updated_on: "2024-02-01T12:00:00Z",
        }),
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("_(unassigned)_");
    expect(result).toContain("| #5 | Unassigned task | New | Normal | _(unassigned)_ | 2024-02-01 |");
  });

  it("should show pagination info when offset > 0", () => {
    const response: RedmineIssuesResponse = {
      issues: [
        createMockIssue({ id: 26, subject: "Issue 26", updated_on: "2024-01-20T10:00:00Z" }),
        createMockIssue({ id: 27, subject: "Issue 27", updated_on: "2024-01-20T11:00:00Z" }),
      ],
      total_count: 50,
      offset: 25,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("# Issues (2 of 50)");
    expect(result).toContain("_Showing 26-27 of 50_");
  });

  it("should show pagination info when total > limit", () => {
    const response: RedmineIssuesResponse = {
      issues: [
        createMockIssue({ id: 1, subject: "Issue 1", updated_on: "2024-01-20T10:00:00Z" }),
        createMockIssue({ id: 2, subject: "Issue 2", updated_on: "2024-01-20T11:00:00Z" }),
      ],
      total_count: 100,
      offset: 0,
      limit: 25,
    };

    const result = formatIssueList(response);

    expect(result).toContain("# Issues (2 of 100)");
    expect(result).toContain("_Showing 1-2 of 100_");
  });
});
