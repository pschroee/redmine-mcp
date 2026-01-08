import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerWikiTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_wiki_pages",
    {
      description: "List all wiki pages in a project",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
      },
    },
    async (params) => {
      const result = await client.listWikiPages(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_wiki_page",
    {
      description: "Get content of a specific wiki page",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        page_name: z.string().describe("Wiki page name/title"),
        version: z.number().optional().describe("Specific version number to retrieve"),
        include: z.string().optional().describe("Include: attachments"),
      },
    },
    async (params) => {
      const result = await client.getWikiPage(params.project_id, params.page_name, {
        version: params.version,
        include: params.include,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_wiki_page",
    {
      description: "Create a new wiki page in a project",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        page_name: z.string().describe("Wiki page name/title (used in URL)"),
        text: z.string().describe("Page content (supports Textile/Markdown)"),
        comments: z.string().optional().describe("Edit comment for version history"),
        parent_title: z.string().optional().describe("Parent page title for hierarchy"),
      },
    },
    async (params) => {
      const { project_id, page_name, ...data } = params;
      const result = await client.createOrUpdateWikiPage(project_id, page_name, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_wiki_page",
    {
      description: "Update an existing wiki page",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        page_name: z.string().describe("Wiki page name/title"),
        text: z.string().describe("New page content"),
        comments: z.string().optional().describe("Edit comment for version history"),
        version: z.number().optional().describe("Expected version for conflict detection"),
      },
    },
    async (params) => {
      const { project_id, page_name, ...data } = params;
      const result = await client.createOrUpdateWikiPage(project_id, page_name, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_wiki_page",
    {
      description: "Delete a wiki page and all its history",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        page_name: z.string().describe("Wiki page name/title to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteWikiPage(params.project_id, params.page_name);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
