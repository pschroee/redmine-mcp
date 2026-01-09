import { describe, expect, test } from "vitest";
import { formatSprint, formatSprintList, formatAgileData } from "../../src/formatters/agile.js";
import type {
  RedmineAgileSprint,
  RedmineAgileSprintsResponse,
  RedmineAgileDataResponse,
} from "../../src/redmine/types.js";

const baseSprint: RedmineAgileSprint = {
  id: 1,
  name: "Sprint 1",
  status: "open",
};

describe("formatSprint", () => {
  test("formats basic sprint", () => {
    const result = formatSprint({ agile_sprint: baseSprint });

    expect(result).toContain("# Sprint 1");
    expect(result).toContain("| Field | Value |");
    expect(result).toContain("|-------|-------|");
    expect(result).toContain("| ID | 1 |");
    expect(result).toContain("| Status | open |");
  });

  test("formats sprint with start date", () => {
    const sprint: RedmineAgileSprint = { ...baseSprint, start_date: "2024-01-01" };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("| Start Date | 2024-01-01 |");
  });

  test("formats sprint with end date", () => {
    const sprint: RedmineAgileSprint = { ...baseSprint, end_date: "2024-01-14" };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("| End Date | 2024-01-14 |");
  });

  test("formats sprint with description", () => {
    const sprint: RedmineAgileSprint = { ...baseSprint, description: "First sprint of the project" };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("| Description | First sprint of the project |");
  });

  test("formats sprint without optional fields", () => {
    const result = formatSprint({ agile_sprint: baseSprint });

    expect(result).not.toContain("| Start Date |");
    expect(result).not.toContain("| End Date |");
    expect(result).not.toContain("| Description |");
  });

  test("formats active sprint", () => {
    const sprint: RedmineAgileSprint = { ...baseSprint, status: "active" };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("| Status | active |");
  });

  test("formats closed sprint", () => {
    const sprint: RedmineAgileSprint = { ...baseSprint, status: "closed" };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("| Status | closed |");
  });

  test("formats full sprint with all fields", () => {
    const sprint: RedmineAgileSprint = {
      ...baseSprint,
      start_date: "2024-01-01",
      end_date: "2024-01-14",
      description: "Full sprint",
    };
    const result = formatSprint({ agile_sprint: sprint });

    expect(result).toContain("# Sprint 1");
    expect(result).toContain("| ID | 1 |");
    expect(result).toContain("| Status | open |");
    expect(result).toContain("| Start Date | 2024-01-01 |");
    expect(result).toContain("| End Date | 2024-01-14 |");
    expect(result).toContain("| Description | Full sprint |");
  });
});

describe("formatSprintList", () => {
  test("formats empty sprint list", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [],
    };
    const result = formatSprintList(response);

    expect(result).toBe("No sprints found.");
  });

  test("formats single sprint", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [baseSprint],
    };
    const result = formatSprintList(response);

    expect(result).toContain("# Agile Sprints (1)");
    expect(result).toContain("| ID | Name | Status | Start | End |");
    expect(result).toContain("|----|------|--------|-------|-----|");
    expect(result).toContain("| 1 | Sprint 1 | open | - | - |");
  });

  test("formats sprint with dates in list", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [
        { ...baseSprint, start_date: "2024-01-01", end_date: "2024-01-14" },
      ],
    };
    const result = formatSprintList(response);

    expect(result).toContain("| 1 | Sprint 1 | open | 2024-01-01 | 2024-01-14 |");
  });

  test("formats multiple sprints", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [
        { id: 1, name: "Sprint 1", status: "closed", start_date: "2024-01-01", end_date: "2024-01-14" },
        { id: 2, name: "Sprint 2", status: "active", start_date: "2024-01-15", end_date: "2024-01-28" },
        { id: 3, name: "Sprint 3", status: "open" },
      ],
    };
    const result = formatSprintList(response);

    expect(result).toContain("# Agile Sprints (3)");
    expect(result).toContain("| 1 | Sprint 1 | closed | 2024-01-01 | 2024-01-14 |");
    expect(result).toContain("| 2 | Sprint 2 | active | 2024-01-15 | 2024-01-28 |");
    expect(result).toContain("| 3 | Sprint 3 | open | - | - |");
  });

  test("handles sprint with only start date", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [{ ...baseSprint, start_date: "2024-01-01" }],
    };
    const result = formatSprintList(response);

    expect(result).toContain("| 1 | Sprint 1 | open | 2024-01-01 | - |");
  });

  test("handles sprint with only end date", () => {
    const response: RedmineAgileSprintsResponse = {
      agile_sprints: [{ ...baseSprint, end_date: "2024-01-14" }],
    };
    const result = formatSprintList(response);

    expect(result).toContain("| 1 | Sprint 1 | open | - | 2024-01-14 |");
  });
});

describe("formatAgileData", () => {
  test("formats basic agile data", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 100,
        position: 5,
      },
    };
    const result = formatAgileData(response);

    expect(result).toContain("# Agile Data for Issue #100");
    expect(result).toContain("| Field | Value |");
    expect(result).toContain("|-------|-------|");
    expect(result).toContain("| Position | 5 |");
  });

  test("formats agile data with story points", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 100,
        position: 5,
        story_points: 8,
      },
    };
    const result = formatAgileData(response);

    expect(result).toContain("| Story Points | 8 |");
  });

  test("formats agile data with sprint assignment", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 100,
        position: 5,
        agile_sprint_id: 3,
      },
    };
    const result = formatAgileData(response);

    expect(result).toContain("| Sprint ID | 3 |");
  });

  test("formats agile data without optional fields", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 100,
        position: 5,
      },
    };
    const result = formatAgileData(response);

    expect(result).not.toContain("| Story Points |");
    expect(result).not.toContain("| Sprint ID |");
  });

  test("formats full agile data with all fields", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 200,
        position: 10,
        story_points: 5,
        agile_sprint_id: 7,
      },
    };
    const result = formatAgileData(response);

    expect(result).toContain("# Agile Data for Issue #200");
    expect(result).toContain("| Position | 10 |");
    expect(result).toContain("| Story Points | 5 |");
    expect(result).toContain("| Sprint ID | 7 |");
  });

  test("handles zero story points", () => {
    const response: RedmineAgileDataResponse = {
      agile_data: {
        id: 1,
        issue_id: 100,
        position: 5,
        story_points: 0,
      },
    };
    const result = formatAgileData(response);

    expect(result).toContain("| Story Points | 0 |");
  });
});
