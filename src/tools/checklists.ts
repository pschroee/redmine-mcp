import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatChecklist, formatChecklistList } from "../formatters/index.js";

export function registerChecklistsTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_checklist_items",
    {
      description: "List all checklist items for an issue (requires redmine_checklists plugin)",
      inputSchema: {
        issue_id: z.number().describe("The issue ID to get checklists for"),
      },
    },
    async (params) => {
      const result = await client.listChecklists(params.issue_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatChecklistList(result) }],
      };
    }
  );

  server.registerTool(
    "get_checklist_item",
    {
      description: "Get a specific checklist item by ID (requires redmine_checklists plugin)",
      inputSchema: {
        checklist_id: z.number().describe("The checklist item ID"),
      },
    },
    async (params) => {
      const result = await client.getChecklist(params.checklist_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatChecklist(result) }],
      };
    }
  );

  server.registerTool(
    "create_checklist_item",
    {
      description: "Create a new checklist item for an issue (requires redmine_checklists plugin)",
      inputSchema: {
        issue_id: z.number().describe("The issue ID to add the checklist item to"),
        subject: z.string().describe("The checklist item text"),
        is_done: z.boolean().optional().describe("Whether the item is completed (default: false)"),
        position: z.number().optional().describe("Position in the checklist (1-based)"),
      },
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.createChecklist(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_checklist_item",
    {
      description: "Update an existing checklist item (requires redmine_checklists plugin)",
      inputSchema: {
        checklist_id: z.number().describe("The checklist item ID to update"),
        subject: z.string().optional().describe("New text for the checklist item"),
        is_done: z.boolean().optional().describe("Mark as done/undone"),
        position: z.number().optional().describe("New position in the checklist"),
      },
    },
    async (params) => {
      const { checklist_id, ...data } = params;
      const result = await client.updateChecklist(checklist_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_checklist_item",
    {
      description: "Delete a checklist item (requires redmine_checklists plugin)",
      inputSchema: {
        checklist_id: z.number().describe("The checklist item ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteChecklist(params.checklist_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
