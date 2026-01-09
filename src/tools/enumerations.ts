import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";

export function registerEnumerationsTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_issue_priorities",
    {
      description: "List all issue priorities with their IDs (Low, Normal, High, Urgent, Immediate)",
    },
    async () => {
      const result = await client.listIssuePriorities();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "list_time_entry_activities",
    {
      description: "List all time entry activities with their IDs (Design, Development, etc.)",
    },
    async () => {
      const result = await client.listTimeEntryActivities();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "list_document_categories",
    {
      description: "List all document categories with their IDs",
    },
    async () => {
      const result = await client.listDocumentCategories();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
