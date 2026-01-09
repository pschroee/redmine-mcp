import { describe, expect, test } from "vitest";
import { formatVersion, formatVersionList } from "../../src/formatters/version.js";
import type { RedmineVersion, RedmineVersionsResponse } from "../../src/redmine/types.js";

const baseVersion: RedmineVersion = {
  id: 1,
  project: { id: 1, name: "Test Project" },
  name: "v1.0.0",
  status: "open",
  sharing: "none",
  created_on: "2024-01-15T10:30:00Z",
  updated_on: "2024-01-20T14:45:00Z",
};

describe("formatVersion", () => {
  test("formats basic version", () => {
    const result = formatVersion({ version: baseVersion });

    expect(result).toContain("# v1.0.0 [Open]");
    expect(result).toContain("| Project | Test Project |");
    expect(result).toContain("| Status | Open |");
    expect(result).toContain("| Sharing | none |");
  });

  test("formats version with locked status", () => {
    const version: RedmineVersion = { ...baseVersion, status: "locked" };
    const result = formatVersion({ version });

    expect(result).toContain("# v1.0.0 [Locked]");
    expect(result).toContain("| Status | Locked |");
  });

  test("formats version with closed status", () => {
    const version: RedmineVersion = { ...baseVersion, status: "closed" };
    const result = formatVersion({ version });

    expect(result).toContain("# v1.0.0 [Closed]");
    expect(result).toContain("| Status | Closed |");
  });

  test("formats version with due date", () => {
    const version: RedmineVersion = { ...baseVersion, due_date: "2024-06-30" };
    const result = formatVersion({ version });

    expect(result).toContain("| Due Date | 2024-06-30 |");
  });

  test("formats version with estimated and spent hours", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      estimated_hours: 100,
      spent_hours: 45,
    };
    const result = formatVersion({ version });

    expect(result).toContain("| Est/Spent Hours | 100h / 45h |");
  });

  test("formats version with only estimated hours", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      estimated_hours: 50,
    };
    const result = formatVersion({ version });

    expect(result).toContain("| Est/Spent Hours | 50h / - |");
  });

  test("formats version with only spent hours", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      spent_hours: 25,
    };
    const result = formatVersion({ version });

    expect(result).toContain("| Est/Spent Hours | - / 25h |");
  });

  test("formats version with description", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      description: "This is the first major release.",
    };
    const result = formatVersion({ version });

    expect(result).toContain("| Description | This is the first major release. |");
  });

  test("formats version with wiki page", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      wiki_page_title: "Release_Notes_v1",
    };
    const result = formatVersion({ version });

    expect(result).toContain("| Wiki Page | Release_Notes_v1 |");
  });

  test("formats full version with all fields", () => {
    const version: RedmineVersion = {
      ...baseVersion,
      status: "open",
      due_date: "2024-12-31",
      description: "Final release of the year",
      wiki_page_title: "Releases",
      estimated_hours: 200,
      spent_hours: 150,
      sharing: "descendants",
    };
    const result = formatVersion({ version });

    expect(result).toContain("# v1.0.0 [Open]");
    expect(result).toContain("| Project | Test Project |");
    expect(result).toContain("| Due Date | 2024-12-31 |");
    expect(result).toContain("| Status | Open |");
    expect(result).toContain("| Est/Spent Hours | 200h / 150h |");
    expect(result).toContain("| Description | Final release of the year |");
    expect(result).toContain("| Wiki Page | Releases |");
    expect(result).toContain("| Sharing | descendants |");
  });
});

describe("formatVersionList", () => {
  test("formats empty version list", () => {
    const response: RedmineVersionsResponse = {
      versions: [],
      total_count: 0,
    };
    const result = formatVersionList(response);

    expect(result).toContain("# Versions (0)");
    expect(result).toContain("No versions found.");
  });

  test("formats single version list", () => {
    const response: RedmineVersionsResponse = {
      versions: [baseVersion],
      total_count: 1,
    };
    const result = formatVersionList(response);

    expect(result).toContain("# Versions (1)");
    expect(result).toContain("| Name | Status | Due Date | Progress |");
    expect(result).toContain("| v1.0.0 | Open | - | - |");
  });

  test("formats version with due date in list", () => {
    const response: RedmineVersionsResponse = {
      versions: [{ ...baseVersion, due_date: "2024-06-30" }],
      total_count: 1,
    };
    const result = formatVersionList(response);

    expect(result).toContain("| v1.0.0 | Open | 2024-06-30 | - |");
  });

  test("formats version with progress percentage", () => {
    const response: RedmineVersionsResponse = {
      versions: [{
        ...baseVersion,
        estimated_hours: 100,
        spent_hours: 50,
      }],
      total_count: 1,
    };
    const result = formatVersionList(response);

    expect(result).toContain("| v1.0.0 | Open | - | 50% |");
  });

  test("formats version with spent hours but no estimate", () => {
    const response: RedmineVersionsResponse = {
      versions: [{
        ...baseVersion,
        spent_hours: 25,
      }],
      total_count: 1,
    };
    const result = formatVersionList(response);

    expect(result).toContain("| v1.0.0 | Open | - | 25h spent |");
  });

  test("formats multiple versions", () => {
    const response: RedmineVersionsResponse = {
      versions: [
        { ...baseVersion, name: "v1.0.0", status: "closed", due_date: "2024-01-31" },
        { ...baseVersion, id: 2, name: "v1.1.0", status: "locked", due_date: "2024-03-31" },
        { ...baseVersion, id: 3, name: "v2.0.0", status: "open", due_date: "2024-06-30" },
      ],
      total_count: 3,
    };
    const result = formatVersionList(response);

    expect(result).toContain("# Versions (3)");
    expect(result).toContain("| v1.0.0 | Closed | 2024-01-31 | - |");
    expect(result).toContain("| v1.1.0 | Locked | 2024-03-31 | - |");
    expect(result).toContain("| v2.0.0 | Open | 2024-06-30 | - |");
  });

  test("uses total_count from response", () => {
    const response: RedmineVersionsResponse = {
      versions: [baseVersion],
      total_count: 100,
    };
    const result = formatVersionList(response);

    expect(result).toContain("# Versions (100)");
  });

  test("handles unknown status in list", () => {
    const response: RedmineVersionsResponse = {
      versions: [{ ...baseVersion, status: "custom_status" }],
      total_count: 1,
    };
    const result = formatVersionList(response);

    expect(result).toContain("| v1.0.0 | custom_status | - | - |");
  });
});
