import { describe, it, expect } from "vitest";
import { formatJournals } from "../../src/formatters/journals.js";
import type { RedmineJournal } from "../../src/redmine/types.js";

function createMockJournal(overrides: Partial<RedmineJournal> = {}): RedmineJournal {
  return {
    id: 1,
    user: { id: 1, name: "John Doe" },
    notes: "",
    created_on: "2024-01-15T10:30:00Z",
    private_notes: false,
    details: [],
    ...overrides,
  };
}

describe("formatJournals", () => {
  it("should return empty string for empty journals", () => {
    const result = formatJournals([]);
    expect(result).toBe("");
  });

  it("should format journal with notes", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        notes: "This is a comment",
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("## History (1 entries)");
    expect(result).toContain("#1 -");
    expect(result).toContain("John Doe");
    expect(result).toContain("This is a comment");
  });

  it("should format journal with status change", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "attr",
            name: "status_id",
            old_value: "1",
            new_value: "2",
          },
        ],
      }),
    ];

    const lookup = {
      status_id: { "1": "New", "2": "In Progress" },
    };

    const result = formatJournals(journals, lookup);

    expect(result).toContain("**Changes:**");
    expect(result).toContain("status: New (1) → In Progress (2)");
  });

  describe("description diffs", () => {
    const journalsWithDescriptionChange: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "attr",
            name: "description",
            old_value: "Original description",
            new_value: "Updated description with more details",
          },
        ],
      }),
    ];

    it("should hide description diff by default", () => {
      const result = formatJournals(journalsWithDescriptionChange);

      expect(result).toContain("description: _(changed - use include_description_diffs to see diff)_");
      expect(result).not.toContain("```diff");
      expect(result).not.toContain("Original description");
    });

    it("should hide description diff when includeDescriptionDiffs is false", () => {
      const result = formatJournals(journalsWithDescriptionChange, {}, { includeDescriptionDiffs: false });

      expect(result).toContain("description: _(changed - use include_description_diffs to see diff)_");
      expect(result).not.toContain("```diff");
    });

    it("should show description diff when includeDescriptionDiffs is true", () => {
      const result = formatJournals(journalsWithDescriptionChange, {}, { includeDescriptionDiffs: true });

      expect(result).toContain("```diff");
      expect(result).toContain("Original description");
      expect(result).toContain("Updated description");
      expect(result).not.toContain("use include_description_diffs");
    });
  });

  it("should mark private notes", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        private_notes: true,
        notes: "Private note",
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("🔒");
    expect(result).toContain("Private note");
  });

  it("should format attachment additions", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "attachment",
            name: "123",
            new_value: "screenshot.png",
          },
        ],
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("Added attachment: screenshot.png");
  });

  it("should format attachment removals", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "attachment",
            name: "123",
            old_value: "old-file.pdf",
          },
        ],
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("Removed attachment: old-file.pdf");
  });

  it("should format relation additions", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "relation",
            name: "relates",
            new_value: "456",
          },
        ],
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("Added relation: relates → #456");
  });

  it("should format custom field changes", () => {
    const journals: RedmineJournal[] = [
      createMockJournal({
        details: [
          {
            property: "cf",
            name: "Sprint",
            old_value: "Sprint 1",
            new_value: "Sprint 2",
          },
        ],
      }),
    ];

    const result = formatJournals(journals);

    expect(result).toContain("Sprint: Sprint 1 → Sprint 2");
  });

  describe("note numbering", () => {
    it("should show note numbers in header", () => {
      const journals: RedmineJournal[] = [
        createMockJournal({ notes: "First note" }),
        createMockJournal({ notes: "Second note" }),
        createMockJournal({ notes: "Third note" }),
      ];

      const result = formatJournals(journals);

      expect(result).toContain("### #1 -");
      expect(result).toContain("### #2 -");
      expect(result).toContain("### #3 -");
    });
  });
});
