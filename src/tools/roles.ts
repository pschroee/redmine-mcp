import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerRolesTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_roles",
    {
      description: "List all available roles (Manager, Developer, Reporter, etc.)",
    },
    async () => {
      const result = await client.listRoles();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_role",
    {
      description: "Get role details including permissions",
      inputSchema: {
        role_id: z.number().describe("Role ID"),
      },
    },
    async (params) => {
      const result = await client.getRole(params.role_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
