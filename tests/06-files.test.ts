import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("files", () => {
  describe("upload_file", () => {
    it("should upload file", async () => {
      const content = await readFile("tests/fixtures/test-file.txt");
      const result = await client.uploadFile(
        "test-file.txt",
        "text/plain",
        content
      );

      expect(result.upload).toBeDefined();
      expect(result.upload.token).toBeDefined();

      state.uploadToken = result.upload.token;
    });

    it("should upload file with different content type", async () => {
      const content = Buffer.from("binary content");
      const result = await client.uploadFile(
        "binary-file.bin",
        "application/octet-stream",
        content
      );

      expect(result.upload.token).toBeDefined();
    });
  });

  describe("list_project_files", () => {
    it("should list project files (initially empty)", async () => {
      const result = await client.listProjectFiles(state.projectId);

      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });
  });

  describe("upload_project_file", () => {
    it("should attach file to project", async () => {
      const content = await readFile("tests/fixtures/test-file.txt");
      const upload = await client.uploadFile("project-file.txt", "text/plain", content);

      const result = await client.uploadProjectFile(state.projectId, {
        token: upload.upload.token,
        filename: "project-file.txt",
      });

      expect(result).toBeDefined();
    });

    it("should attach file with description", async () => {
      const content = Buffer.from("file with description");
      const upload = await client.uploadFile("described-file.txt", "text/plain", content);

      const result = await client.uploadProjectFile(state.projectId, {
        token: upload.upload.token,
        filename: "described-file.txt",
        description: "A test file with description",
      });

      expect(result).toBeDefined();
    });

    it("should fail with invalid token", async () => {
      const result = await client.uploadProjectFile(state.projectId, {
        token: "invalid-token-xyz",
      }) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("list_project_files (with files)", () => {
    it("should list uploaded files", async () => {
      const result = await client.listProjectFiles(state.projectId);

      expect(result.files.length).toBeGreaterThan(0);

      if (result.files.length > 0) {
        state.attachmentId = result.files[0].id;
      }
    });
  });

  describe("get_attachment", () => {
    it("should get attachment metadata", async () => {
      const result = await client.getAttachment(state.attachmentId);

      expect(result.attachment).toBeDefined();
      expect(result.attachment.id).toBe(state.attachmentId);
    });

    it("should fail for nonexistent attachment", async () => {
      const result = await client.getAttachment(999999) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_attachment", () => {
    it("should delete attachment", async () => {
      const result = await client.deleteAttachment(state.attachmentId);

      expect(result).toBeDefined();
    });

    it("should fail for nonexistent attachment", async () => {
      const result = await client.deleteAttachment(999999) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
