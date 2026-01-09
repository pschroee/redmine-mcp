import { describe, it, expect } from "vitest";
import { formatSearchResults } from "../../src/formatters/search.js";
import type { RedmineSearchResponse } from "../../src/redmine/types.js";

describe("formatSearchResults", () => {
  it("should format empty results", () => {
    const response: RedmineSearchResponse = {
      results: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("# Search Results (0 of 0)");
    expect(result).toContain("No results found.");
  });

  it("should format search results with header showing count", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test Issue",
          type: "issue",
          url: "/issues/1",
          description: "This is a test issue",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 10,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("# Search Results (1 of 10)");
  });

  it("should show offset message when starting from non-zero offset", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test Issue",
          type: "issue",
          url: "/issues/1",
          description: "This is a test issue",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 100,
      offset: 25,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("_Starting from result 26_");
  });

  it("should not show offset message when offset is zero", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test Issue",
          type: "issue",
          url: "/issues/1",
          description: "Test description",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).not.toContain("_Starting from result");
  });

  it("should format issue type with ticket icon", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Bug Report",
          type: "issue",
          url: "/issues/1",
          description: "A bug description",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("### \u{1F3AB} Bug Report");
    expect(result).toContain("**Type:** issue");
  });

  it("should format wiki-page type with page icon", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Wiki Page",
          type: "wiki-page",
          url: "/wiki/Page",
          description: "Wiki content",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("### \u{1F4C4} Wiki Page");
    expect(result).toContain("**Type:** wiki-page");
  });

  it("should format project type with folder icon", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "My Project",
          type: "project",
          url: "/projects/my-project",
          description: "Project description",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("### \u{1F4C1} My Project");
    expect(result).toContain("**Type:** project");
  });

  it("should format unknown type with clipboard icon", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Unknown Item",
          type: "unknown",
          url: "/unknown/1",
          description: "Unknown description",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("### \u{1F4CB} Unknown Item");
    expect(result).toContain("**Type:** unknown");
  });

  it("should format date as YYYY-MM-DD", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test",
          type: "issue",
          url: "/issues/1",
          description: "Test",
          datetime: "2024-03-25T14:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("**Date:** 2024-03-25");
  });

  it("should truncate long descriptions to 200 characters with ellipsis", () => {
    const longDescription = "A".repeat(250);
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test",
          type: "issue",
          url: "/issues/1",
          description: longDescription,
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("A".repeat(200) + "...");
    expect(result).not.toContain("A".repeat(201));
  });

  it("should not truncate descriptions under 200 characters", () => {
    const description = "Short description";
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test",
          type: "issue",
          url: "/issues/1",
          description: description,
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain(description);
    expect(result).not.toContain(description + "...");
  });

  it("should format multiple results", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Issue One",
          type: "issue",
          url: "/issues/1",
          description: "First issue",
          datetime: "2024-01-15T10:30:00Z",
        },
        {
          id: 2,
          title: "Wiki Page",
          type: "wiki-page",
          url: "/wiki/Page",
          description: "A wiki page",
          datetime: "2024-01-16T11:00:00Z",
        },
        {
          id: 3,
          title: "Project",
          type: "project",
          url: "/projects/test",
          description: "A project",
          datetime: "2024-01-17T12:00:00Z",
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("# Search Results (3 of 3)");
    expect(result).toContain("### \u{1F3AB} Issue One");
    expect(result).toContain("### \u{1F4C4} Wiki Page");
    expect(result).toContain("### \u{1F4C1} Project");
  });

  it("should handle results without description", () => {
    const response: RedmineSearchResponse = {
      results: [
        {
          id: 1,
          title: "Test Issue",
          type: "issue",
          url: "/issues/1",
          description: "",
          datetime: "2024-01-15T10:30:00Z",
        },
      ],
      total_count: 1,
      offset: 0,
      limit: 25,
    };

    const result = formatSearchResults(response);

    expect(result).toContain("### \u{1F3AB} Test Issue");
    expect(result).toContain("**Type:** issue | **Date:** 2024-01-15");
  });
});
