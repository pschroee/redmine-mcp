import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import type { RedmineClient } from "../redmine/client.js";

export function registerFilesTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === ATTACHMENTS ===

  server.registerTool(
    "get_attachment",
    {
      description: "Get metadata of a specific attachment",
      inputSchema: {
        attachment_id: z.number().describe("The attachment ID"),
      },
    },
    async (params) => {
      const result = await client.getAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_attachment",
    {
      description: "Delete an attachment",
      inputSchema: {
        attachment_id: z.number().describe("The attachment ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteAttachment(params.attachment_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "upload_file",
    {
      description: "Upload a file to Redmine (returns token for attaching to issues/wiki)",
      inputSchema: {
        file_path: z.string().describe("Local file path to upload"),
        filename: z.string().describe("Filename to use in Redmine"),
        content_type: z.string().optional().describe("MIME type (auto-detected if not provided)"),
      },
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

  server.registerTool(
    "list_project_files",
    {
      description: "List all files attached to a project",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      },
    },
    async (params) => {
      const result = await client.listProjectFiles(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "upload_project_file",
    {
      description: "Attach an uploaded file to a project",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        token: z.string().describe("Upload token from upload_file"),
        version_id: z.number().optional().describe("Associated version ID"),
        filename: z.string().optional().describe("Override filename"),
        description: z.string().optional().describe("File description"),
      },
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
