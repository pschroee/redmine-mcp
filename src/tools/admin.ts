import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatUser, formatUserList } from "../formatters/index.js";

export function registerAdminTools(
  server: McpServer,
  client: RedmineClient
): void {
  // === USERS ===

  server.registerTool(
    "list_users",
    {
      description: "List all users (admin only)",
      inputSchema: {
        status: z.number().optional().describe("Filter by status: 0=all, 1=active (default), 2=registered, 3=locked"),
        name: z.string().optional().describe("Search in login, firstname, lastname, mail"),
        group_id: z.number().optional().describe("Filter by group membership"),
        limit: z.number().optional().describe("Maximum results"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const result = await client.listUsers(params);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatUserList(result) }],
      };
    }
  );

  server.registerTool(
    "get_user",
    {
      description: "Get user details by ID or 'current' for authenticated user",
      inputSchema: {
        user_id: z.union([z.number(), z.literal("current")]).describe("User ID or 'current'"),
        include: z.string().optional().describe("Include: memberships, groups"),
      },
    },
    async (params) => {
      const result = await client.getUser(params.user_id, params.include);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatUser(result) }],
      };
    }
  );

  server.registerTool(
    "create_user",
    {
      description: "Create a new user (admin only)",
      inputSchema: {
        login: z.string().describe("Login name (required)"),
        firstname: z.string().describe("First name (required)"),
        lastname: z.string().describe("Last name (required)"),
        mail: z.string().describe("Email address (required)"),
        password: z.string().optional().describe("Password (optional if generate_password=true)"),
        generate_password: z.boolean().optional().describe("Generate random password"),
        must_change_passwd: z.boolean().optional().describe("Force password change on first login"),
        auth_source_id: z.number().optional().describe("External authentication source ID"),
        mail_notification: z.string().optional().describe("Email notification preference"),
        admin: z.boolean().optional().describe("Grant admin privileges"),
        send_information: z.boolean().optional().describe("Send account info email to user"),
      },
    },
    async (params) => {
      const result = await client.createUser(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_user",
    {
      description: "Update an existing user (admin only)",
      inputSchema: {
        user_id: z.number().describe("User ID to update"),
        login: z.string().optional().describe("New login name"),
        firstname: z.string().optional().describe("New first name"),
        lastname: z.string().optional().describe("New last name"),
        mail: z.string().optional().describe("New email address"),
        password: z.string().optional().describe("New password"),
        admin: z.boolean().optional().describe("Change admin status"),
        status: z.number().optional().describe("Change status: 1=active, 2=registered, 3=locked"),
      },
    },
    async (params) => {
      const { user_id, ...data } = params;
      const result = await client.updateUser(user_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_user",
    {
      description: "Delete a user permanently (admin only)",
      inputSchema: {
        user_id: z.number().describe("User ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteUser(params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  // === GROUPS ===

  server.registerTool(
    "list_groups",
    {
      description: "List all groups (admin only)",
    },
    async () => {
      const result = await client.listGroups();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_group",
    {
      description: "Get group details (admin only)",
      inputSchema: {
        group_id: z.number().describe("Group ID"),
        include: z.string().optional().describe("Include: users, memberships"),
      },
    },
    async (params) => {
      const result = await client.getGroup(params.group_id, params.include);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_group",
    {
      description: "Create a new group (admin only)",
      inputSchema: {
        name: z.string().describe("Group name (required)"),
        user_ids: z.array(z.number()).optional().describe("Initial member user IDs"),
      },
    },
    async (params) => {
      const result = await client.createGroup(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_group",
    {
      description: "Delete a group (admin only)",
      inputSchema: {
        group_id: z.number().describe("Group ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteGroup(params.group_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "add_user_to_group",
    {
      description: "Add a user to a group (admin only)",
      inputSchema: {
        group_id: z.number().describe("Group ID"),
        user_id: z.number().describe("User ID to add"),
      },
    },
    async (params) => {
      const result = await client.addUserToGroup(params.group_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "remove_user_from_group",
    {
      description: "Remove a user from a group (admin only)",
      inputSchema: {
        group_id: z.number().describe("Group ID"),
        user_id: z.number().describe("User ID to remove"),
      },
    },
    async (params) => {
      const result = await client.removeUserFromGroup(params.group_id, params.user_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
