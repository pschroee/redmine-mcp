import { describe, it, expect } from "vitest";
import { formatWikiPage, formatWikiPageList } from "../../src/formatters/wiki.js";
import type { RedmineWikiPage, RedmineWikiPagesResponse } from "../../src/redmine/types.js";

describe("formatWikiPage", () => {
  it("formats a basic wiki page", () => {
    const response = {
      wiki_page: {
        title: "Getting Started",
        text: "This is the wiki content.\n\nWith multiple paragraphs.",
        version: 3,
        author: { id: 1, name: "John Doe" },
        created_on: "2024-01-15T10:30:00Z",
        updated_on: "2024-01-20T14:45:00Z",
      } as RedmineWikiPage,
    };

    const result = formatWikiPage(response);

    expect(result).toContain("# Getting Started");
    expect(result).toContain("**Version:** 3");
    expect(result).toContain("**Author:** John Doe");
    expect(result).toContain("**Updated:** 2024-01-20");
    expect(result).toContain("---");
    expect(result).toContain("This is the wiki content.");
    expect(result).toContain("With multiple paragraphs.");
  });

  it("formats a wiki page with parent", () => {
    const response = {
      wiki_page: {
        title: "Installation",
        parent: { title: "Getting Started" },
        text: "Installation instructions here.",
        version: 1,
        author: { id: 2, name: "Jane Smith" },
        created_on: "2024-02-01T08:00:00Z",
        updated_on: "2024-02-01T08:00:00Z",
      } as RedmineWikiPage,
    };

    const result = formatWikiPage(response);

    expect(result).toContain("# Installation");
    expect(result).toContain("**Parent:** Getting Started");
    expect(result).toContain("**Version:** 1");
    expect(result).toContain("**Author:** Jane Smith");
  });

  it("formats a wiki page with attachments", () => {
    const response = {
      wiki_page: {
        title: "Screenshots",
        text: "See the attached screenshots.",
        version: 2,
        author: { id: 1, name: "John Doe" },
        created_on: "2024-01-10T09:00:00Z",
        updated_on: "2024-01-12T11:30:00Z",
        attachments: [
          {
            id: 101,
            filename: "screenshot1.png",
            filesize: 45678,
            content_type: "image/png",
            content_url: "https://redmine.example.com/attachments/download/101/screenshot1.png",
            author: { id: 1, name: "John Doe" },
            created_on: "2024-01-10T09:00:00Z",
          },
          {
            id: 102,
            filename: "diagram.pdf",
            filesize: 123456,
            content_type: "application/pdf",
            content_url: "https://redmine.example.com/attachments/download/102/diagram.pdf",
            author: { id: 1, name: "John Doe" },
            created_on: "2024-01-12T11:30:00Z",
          },
        ],
      } as RedmineWikiPage,
    };

    const result = formatWikiPage(response);

    expect(result).toContain("## Attachments");
    expect(result).toContain("- [screenshot1.png](https://redmine.example.com/attachments/download/101/screenshot1.png) (45678 bytes)");
    expect(result).toContain("- [diagram.pdf](https://redmine.example.com/attachments/download/102/diagram.pdf) (123456 bytes)");
  });

  it("formats metadata on a single line with pipes", () => {
    const response = {
      wiki_page: {
        title: "Test Page",
        text: "Content",
        version: 5,
        author: { id: 1, name: "Admin" },
        created_on: "2024-03-01T00:00:00Z",
        updated_on: "2024-03-15T12:00:00Z",
      } as RedmineWikiPage,
    };

    const result = formatWikiPage(response);

    // Check that metadata is on a single line separated by pipes
    expect(result).toMatch(/\*\*Version:\*\* 5 \| \*\*Author:\*\* Admin \| \*\*Updated:\*\* 2024-03-15/);
  });
});

describe("formatWikiPageList", () => {
  it("formats an empty wiki page list", () => {
    const response: RedmineWikiPagesResponse = {
      wiki_pages: [],
    };

    const result = formatWikiPageList(response);

    expect(result).toContain("# Wiki Pages (0)");
    expect(result).toContain("No wiki pages found.");
  });

  it("formats a flat list of wiki pages", () => {
    const response: RedmineWikiPagesResponse = {
      wiki_pages: [
        { title: "Wiki", version: 1 },
        { title: "Getting Started", version: 2 },
        { title: "FAQ", version: 5 },
      ],
    };

    const result = formatWikiPageList(response);

    expect(result).toContain("# Wiki Pages (3)");
    expect(result).toContain("- **Wiki** (v1)");
    expect(result).toContain("- **Getting Started** (v2)");
    expect(result).toContain("- **FAQ** (v5)");
  });

  it("formats a hierarchical wiki page list", () => {
    const response: RedmineWikiPagesResponse = {
      wiki_pages: [
        { title: "Wiki", version: 1 },
        { title: "Getting Started", parent: { title: "Wiki" }, version: 2 },
        { title: "Installation", parent: { title: "Getting Started" }, version: 1 },
        { title: "Configuration", parent: { title: "Getting Started" }, version: 3 },
        { title: "FAQ", version: 5 },
      ],
    };

    const result = formatWikiPageList(response);
    const lines = result.split("\n");

    expect(result).toContain("# Wiki Pages (5)");
    
    // Check hierarchy with indentation
    expect(lines.some(l => l === "- **Wiki** (v1)")).toBe(true);
    expect(lines.some(l => l === "  - **Getting Started** (v2)")).toBe(true);
    expect(lines.some(l => l === "    - **Installation** (v1)")).toBe(true);
    expect(lines.some(l => l === "    - **Configuration** (v3)")).toBe(true);
    expect(lines.some(l => l === "- **FAQ** (v5)")).toBe(true);
  });

  it("handles multiple root pages with children", () => {
    const response: RedmineWikiPagesResponse = {
      wiki_pages: [
        { title: "User Guide", version: 1 },
        { title: "Introduction", parent: { title: "User Guide" }, version: 2 },
        { title: "Developer Guide", version: 1 },
        { title: "API Reference", parent: { title: "Developer Guide" }, version: 4 },
      ],
    };

    const result = formatWikiPageList(response);
    const lines = result.split("\n");

    expect(result).toContain("# Wiki Pages (4)");
    expect(lines.some(l => l === "- **User Guide** (v1)")).toBe(true);
    expect(lines.some(l => l === "  - **Introduction** (v2)")).toBe(true);
    expect(lines.some(l => l === "- **Developer Guide** (v1)")).toBe(true);
    expect(lines.some(l => l === "  - **API Reference** (v4)")).toBe(true);
  });
});
