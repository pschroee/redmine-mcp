import { describe, expect, test } from "vitest";
import { formatTimeEntry, formatTimeEntryList } from "../../src/formatters/time.js";
import type { RedmineTimeEntry, RedmineTimeEntriesResponse } from "../../src/redmine/types.js";

const baseTimeEntry: RedmineTimeEntry = {
  id: 42,
  project: { id: 1, name: "Test Project" },
  user: { id: 5, name: "John Doe" },
  activity: { id: 9, name: "Development" },
  hours: 2.5,
  spent_on: "2024-01-15",
  created_on: "2024-01-15T10:30:00Z",
  updated_on: "2024-01-15T14:45:00Z",
};

describe("formatTimeEntry", () => {
  test("formats basic time entry with header", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("# Time Entry #42");
  });

  test("formats metadata table with project", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("| Field | Value |");
    expect(result).toContain("|-------|-------|");
    expect(result).toContain("| Project | Test Project |");
  });

  test("formats metadata table with user", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("| User | John Doe |");
  });

  test("formats metadata table with activity", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("| Activity | Development |");
  });

  test("formats metadata table with hours", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("| Hours | 2.5 |");
  });

  test("formats metadata table with date", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).toContain("| Date | 2024-01-15 |");
  });

  test("formats time entry with issue", () => {
    const entry: RedmineTimeEntry = {
      ...baseTimeEntry,
      issue: { id: 123 },
    };
    const result = formatTimeEntry({ time_entry: entry });

    expect(result).toContain("| Issue | #123 |");
  });

  test("formats time entry without issue", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).not.toContain("| Issue |");
  });

  test("formats time entry with comments", () => {
    const entry: RedmineTimeEntry = {
      ...baseTimeEntry,
      comments: "Worked on feature implementation",
    };
    const result = formatTimeEntry({ time_entry: entry });

    expect(result).toContain("| Comments | Worked on feature implementation |");
  });

  test("formats time entry without comments", () => {
    const result = formatTimeEntry({ time_entry: baseTimeEntry });

    expect(result).not.toContain("| Comments |");
  });

  test("formats full time entry with all fields", () => {
    const entry: RedmineTimeEntry = {
      ...baseTimeEntry,
      issue: { id: 456 },
      comments: "Full entry with all fields",
    };
    const result = formatTimeEntry({ time_entry: entry });

    expect(result).toContain("# Time Entry #42");
    expect(result).toContain("| Project | Test Project |");
    expect(result).toContain("| Issue | #456 |");
    expect(result).toContain("| User | John Doe |");
    expect(result).toContain("| Activity | Development |");
    expect(result).toContain("| Hours | 2.5 |");
    expect(result).toContain("| Date | 2024-01-15 |");
    expect(result).toContain("| Comments | Full entry with all fields |");
  });
});

describe("formatTimeEntryList", () => {
  test("formats empty time entry list", () => {
    const response: RedmineTimeEntriesResponse = {
      time_entries: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("# Time Entries (0)");
    expect(result).toContain("No time entries found.");
  });

  test("formats list with table headers", () => {
    const response: RedmineTimeEntriesResponse = {
      time_entries: [baseTimeEntry],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("| ID | Date | Hours | User | Activity | Issue | Comments |");
    expect(result).toContain("|");
  });

  test("formats single time entry in list", () => {
    const response: RedmineTimeEntriesResponse = {
      time_entries: [baseTimeEntry],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("# Time Entries (1)");
    expect(result).toContain("| 42 | 2024-01-15 | 2.5 | John Doe | Development | - | - |");
  });

  test("formats time entry with issue in list", () => {
    const entry: RedmineTimeEntry = {
      ...baseTimeEntry,
      issue: { id: 789 },
    };
    const response: RedmineTimeEntriesResponse = {
      time_entries: [entry],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("| 42 | 2024-01-15 | 2.5 | John Doe | Development | #789 | - |");
  });

  test("formats time entry with comments in list", () => {
    const entry: RedmineTimeEntry = {
      ...baseTimeEntry,
      comments: "Some work done",
    };
    const response: RedmineTimeEntriesResponse = {
      time_entries: [entry],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("| 42 | 2024-01-15 | 2.5 | John Doe | Development | - | Some work done |");
  });

  test("formats multiple time entries", () => {
    const response: RedmineTimeEntriesResponse = {
      time_entries: [
        baseTimeEntry,
        {
          ...baseTimeEntry,
          id: 43,
          hours: 1.0,
          spent_on: "2024-01-16",
          issue: { id: 100 },
          comments: "Bug fix",
        },
        {
          ...baseTimeEntry,
          id: 44,
          hours: 4.0,
          spent_on: "2024-01-17",
          user: { id: 6, name: "Jane Smith" },
          activity: { id: 10, name: "Testing" },
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("# Time Entries (3)");
    expect(result).toContain("| 42 | 2024-01-15 | 2.5 | John Doe | Development | - | - |");
    expect(result).toContain("| 43 | 2024-01-16 | 1 | John Doe | Development | #100 | Bug fix |");
    expect(result).toContain("| 44 | 2024-01-17 | 4 | Jane Smith | Testing | - | - |");
  });

  test("uses total_count from response", () => {
    const response: RedmineTimeEntriesResponse = {
      time_entries: [baseTimeEntry],
      total_count: 150,
      offset: 0,
      limit: 25,
    };
    const result = formatTimeEntryList(response);

    expect(result).toContain("# Time Entries (150)");
  });
});
