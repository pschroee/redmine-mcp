import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";

export function registerAccountTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "get_my_account",
    {
      description: "Get current user account information",
    },
    async () => {
      const result = await client.getMyAccount();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
