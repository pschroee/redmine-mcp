import { describe, expect, test } from "vitest";
import { formatAttachment, formatFileList } from "../../src/formatters/file.js";
import type { RedmineAttachment, RedmineFile, RedmineFilesResponse } from "../../src/redmine/types.js";
import { expectedDate, expectedDateShort } from "../helpers.js";

const baseAttachment: RedmineAttachment = {
  id: 123,
  filename: "document.pdf",
  filesize: 1024,
  content_type: "application/pdf",
  content_url: "https://redmine.example.com/attachments/download/123/document.pdf",
  author: { id: 1, name: "John Doe" },
  created_on: "2024-03-15T10:30:00Z",
};

const baseFile: RedmineFile = {
  id: 456,
  filename: "release.zip",
  filesize: 2048576,
  content_type: "application/zip",
  content_url: "https://redmine.example.com/attachments/download/456/release.zip",
  author: { id: 1, name: "Jane Smith" },
  created_on: "2024-03-20T14:00:00Z",
  digest: "abc123",
  downloads: 42,
};

describe("formatAttachment", () => {
  test("formats basic attachment", () => {
    const result = formatAttachment({ attachment: baseAttachment });

    expect(result).toContain("# document.pdf");
    expect(result).toContain("| ID | 123 |");
    expect(result).toContain("| Size | 1 KB |");
    expect(result).toContain("| Type | application/pdf |");
    expect(result).toContain("| Author | John Doe |");
    expect(result).toContain(`| Created | ${expectedDate("2024-03-15T10:30:00Z")} |`);
    expect(result).toContain("**Download:** https://redmine.example.com/attachments/download/123/document.pdf");
  });

  test("formats attachment with description", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      description: "Important project document",
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Description | Important project document |");
  });

  test("formats attachment with thumbnail", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      thumbnail_url: "https://redmine.example.com/attachments/thumbnail/123",
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("**Thumbnail:** https://redmine.example.com/attachments/thumbnail/123");
  });

  test("formats attachment with description and thumbnail", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      description: "Screenshot of the bug",
      thumbnail_url: "https://redmine.example.com/attachments/thumbnail/123",
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Description | Screenshot of the bug |");
    expect(result).toContain("**Thumbnail:**");
  });

  test("formats file size in bytes", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      filesize: 500,
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Size | 500 B |");
  });

  test("formats file size in KB", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      filesize: 10240,
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Size | 10 KB |");
  });

  test("formats file size in MB", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      filesize: 5242880,
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Size | 5.00 MB |");
  });

  test("formats file size in MB with decimals", () => {
    const attachment: RedmineAttachment = {
      ...baseAttachment,
      filesize: 1572864, // 1.5 MB
    };
    const result = formatAttachment({ attachment });

    expect(result).toContain("| Size | 1.50 MB |");
  });
});

describe("formatFileList", () => {
  test("formats empty file list", () => {
    const response: RedmineFilesResponse = {
      files: [],
    };
    const result = formatFileList(response);

    expect(result).toBe("No files found.");
  });

  test("formats single file without version", () => {
    const response: RedmineFilesResponse = {
      files: [baseFile],
    };
    const result = formatFileList(response);

    expect(result).toContain("# Project Files (1)");
    expect(result).toContain("| Filename | Size | Downloads | Author | Date |");
    expect(result).toContain("| release.zip | 1.95 MB | 42 | Jane Smith | 2024-03-20 |");
    expect(result).not.toContain("Version");
  });

  test("formats file with version", () => {
    const file: RedmineFile = {
      ...baseFile,
      version: { id: 1, name: "v1.0.0" },
    };
    const response: RedmineFilesResponse = {
      files: [file],
    };
    const result = formatFileList(response);

    expect(result).toContain("| Filename | Size | Version | Downloads | Author | Date |");
    expect(result).toContain("| release.zip | 1.95 MB | v1.0.0 | 42 | Jane Smith | 2024-03-20 |");
  });

  test("formats multiple files without versions", () => {
    const response: RedmineFilesResponse = {
      files: [
        baseFile,
        {
          ...baseFile,
          id: 457,
          filename: "docs.zip",
          filesize: 512000,
          downloads: 10,
          author: { id: 2, name: "Bob Wilson" },
          created_on: "2024-03-21T09:00:00Z",
        },
      ],
    };
    const result = formatFileList(response);

    expect(result).toContain("# Project Files (2)");
    expect(result).toContain("| release.zip | 1.95 MB | 42 | Jane Smith | 2024-03-20 |");
    expect(result).toContain("| docs.zip | 500 KB | 10 | Bob Wilson | 2024-03-21 |");
  });

  test("formats multiple files with versions", () => {
    const response: RedmineFilesResponse = {
      files: [
        { ...baseFile, version: { id: 1, name: "v1.0.0" } },
        {
          ...baseFile,
          id: 457,
          filename: "update.zip",
          version: { id: 2, name: "v1.1.0" },
          downloads: 25,
          created_on: "2024-04-01T12:00:00Z",
        },
      ],
    };
    const result = formatFileList(response);

    expect(result).toContain("| v1.0.0 |");
    expect(result).toContain("| v1.1.0 |");
  });

  test("formats mixed files with and without versions (shows version column)", () => {
    const response: RedmineFilesResponse = {
      files: [
        { ...baseFile, version: { id: 1, name: "v1.0.0" } },
        { ...baseFile, id: 457, filename: "unversioned.zip" }, // No version
      ],
    };
    const result = formatFileList(response);

    // Should have Version column because at least one file has a version
    expect(result).toContain("| Filename | Size | Version | Downloads | Author | Date |");
    expect(result).toContain("| v1.0.0 |");
    // The unversioned file should have empty version cell
    expect(result).toContain("| unversioned.zip |");
  });

  test("formats file with zero downloads", () => {
    const response: RedmineFilesResponse = {
      files: [{ ...baseFile, downloads: 0 }],
    };
    const result = formatFileList(response);

    expect(result).toContain("| 0 |");
  });
});
