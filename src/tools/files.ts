import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import type { RedmineClient } from "../redmine/client.js";

export function registerFilesTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ATTACHMENTS ===

  server.tool(
    "get_attachment",
    "Get metadata of a specific attachment",
    {
      attachment_id: z.number().describe("The attachment ID"),
    },
    async (params) => {
      const result = await client.getAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_attachment",
    "Delete an attachment",
    {
      attachment_id: z.number().describe("The attachment ID to delete"),
    },
    async (params) => {
      const result = await client.deleteAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.tool(
    "upload_file",
    "Upload a file to Redmine (returns token for attaching to issues/wiki)",
    {
      file_path: z.string().describe("Local file path to upload"),
      filename: z.string().describe("Filename to use in Redmine"),
      content_type: z.string().optional().describe("MIME type (auto-detected if not provided)"),
    },
    async (params) => {
      const content = await readFile(params.file_path);
      const contentType = params.content_type || "application/octet-stream";
      const result = await client.uploadFile(params.filename, contentType, content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === PROJECT FILES ===

  server.tool(
    "list_project_files",
    "List all files attached to a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.listProjectFiles(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "upload_project_file",
    "Attach an uploaded file to a project",
    {
      project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      token: z.string().describe("Upload token from upload_file"),
      version_id: z.number().optional().describe("Associated version ID"),
      filename: z.string().optional().describe("Override filename"),
      description: z.string().optional().describe("File description"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.uploadProjectFile(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
