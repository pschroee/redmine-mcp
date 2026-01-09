import { describe, expect, test } from "vitest";
import { formatChecklist, formatChecklistList } from "../../src/formatters/checklist.js";
import type { RedmineChecklist, RedmineChecklistsResponse } from "../../src/redmine/types.js";

const baseChecklistItem: RedmineChecklist = {
  id: 1,
  issue_id: 100,
  subject: "Review code changes",
  is_done: false,
  position: 1,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T14:45:00Z",
};

describe("formatChecklist", () => {
  test("formats pending checklist item", () => {
    const result = formatChecklist({ checklist: baseChecklistItem });

    expect(result).toContain("# Checklist Item #1");
    expect(result).toContain("| Field | Value |");
    expect(result).toContain("|-------|-------|");
    expect(result).toContain("| Subject | Review code changes |");
    expect(result).toContain("| Status | Pending |");
    expect(result).toContain("| Issue | #100 |");
    expect(result).toContain("| Position | 1 |");
  });

  test("formats done checklist item", () => {
    const item: RedmineChecklist = { ...baseChecklistItem, is_done: true };
    const result = formatChecklist({ checklist: item });

    expect(result).toContain("| Status | Done |");
  });

  test("formats checklist item with different position", () => {
    const item: RedmineChecklist = { ...baseChecklistItem, id: 5, position: 3 };
    const result = formatChecklist({ checklist: item });

    expect(result).toContain("# Checklist Item #5");
    expect(result).toContain("| Position | 3 |");
  });

  test("formats checklist item with different issue", () => {
    const item: RedmineChecklist = { ...baseChecklistItem, issue_id: 999 };
    const result = formatChecklist({ checklist: item });

    expect(result).toContain("| Issue | #999 |");
  });
});

describe("formatChecklistList", () => {
  test("formats empty checklist list", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [],
    };
    const result = formatChecklistList(response);

    expect(result).toBe("No checklist items found.");
  });

  test("formats single pending item", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [baseChecklistItem],
    };
    const result = formatChecklistList(response);

    expect(result).toContain("# Checklist (1 items)");
    expect(result).toContain("_0/1 completed_");
    expect(result).toContain("- [ ] Review code changes");
  });

  test("formats single done item", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [{ ...baseChecklistItem, is_done: true }],
    };
    const result = formatChecklistList(response);

    expect(result).toContain("_1/1 completed_");
    expect(result).toContain("- [x] Review code changes");
  });

  test("formats mixed done/pending items", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [
        { ...baseChecklistItem, id: 1, subject: "First task", is_done: true, position: 1 },
        { ...baseChecklistItem, id: 2, subject: "Second task", is_done: false, position: 2 },
        { ...baseChecklistItem, id: 3, subject: "Third task", is_done: true, position: 3 },
      ],
    };
    const result = formatChecklistList(response);

    expect(result).toContain("# Checklist (3 items)");
    expect(result).toContain("_2/3 completed_");
    expect(result).toContain("- [x] First task");
    expect(result).toContain("- [ ] Second task");
    expect(result).toContain("- [x] Third task");
  });

  test("sorts items by position", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [
        { ...baseChecklistItem, id: 3, subject: "Third", position: 3 },
        { ...baseChecklistItem, id: 1, subject: "First", position: 1 },
        { ...baseChecklistItem, id: 2, subject: "Second", position: 2 },
      ],
    };
    const result = formatChecklistList(response);
    const lines = result.split("\n");

    const firstIndex = lines.findIndex((l) => l.includes("First"));
    const secondIndex = lines.findIndex((l) => l.includes("Second"));
    const thirdIndex = lines.findIndex((l) => l.includes("Third"));

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  test("counts completion correctly with all done", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [
        { ...baseChecklistItem, id: 1, is_done: true, position: 1 },
        { ...baseChecklistItem, id: 2, is_done: true, position: 2 },
      ],
    };
    const result = formatChecklistList(response);

    expect(result).toContain("_2/2 completed_");
  });

  test("counts completion correctly with none done", () => {
    const response: RedmineChecklistsResponse = {
      checklists: [
        { ...baseChecklistItem, id: 1, is_done: false, position: 1 },
        { ...baseChecklistItem, id: 2, is_done: false, position: 2 },
      ],
    };
    const result = formatChecklistList(response);

    expect(result).toContain("_0/2 completed_");
  });
});
