import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";
import { formatMyAccount } from "../formatters/index.js";

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
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatMyAccount(result) }],
      };
    }
  );
}
