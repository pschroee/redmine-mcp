import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatMembership, formatMembershipList } from "../formatters/index.js";

export function registerMembershipsTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_project_memberships",
    {
      description: "List all memberships (users and groups) for a project",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
        limit: z.number().optional().describe("Maximum results"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const { project_id, ...rest } = params;
      const result = await client.listProjectMemberships(project_id, rest);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatMembershipList(result) }],
      };
    }
  );

  server.registerTool(
    "get_membership",
    {
      description: "Get details of a specific membership",
      inputSchema: {
        membership_id: z.number().describe("Membership ID"),
      },
    },
    async (params) => {
      const result = await client.getMembership(params.membership_id);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatMembership(result) }],
      };
    }
  );

  server.registerTool(
    "create_project_membership",
    {
      description: "Add a user or group to a project with specified roles",
      inputSchema: {
        project_id: z.string().describe("Project identifier"),
        user_id: z.number().describe("User ID or Group ID to add"),
        role_ids: z.array(z.number()).describe("Role IDs to assign (use list_roles to get IDs)"),
      },
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.createProjectMembership(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_membership",
    {
      description: "Update roles for a membership (cannot change user/project)",
      inputSchema: {
        membership_id: z.number().describe("Membership ID to update"),
        role_ids: z.array(z.number()).describe("New role IDs"),
      },
    },
    async (params) => {
      const { membership_id, ...data } = params;
      const result = await client.updateMembership(membership_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_membership",
    {
      description: "Remove a user or group from a project",
      inputSchema: {
        membership_id: z.number().describe("Membership ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteMembership(params.membership_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
