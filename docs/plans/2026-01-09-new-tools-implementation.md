# New Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 26 new MCP tools for Time Entries, Enumerations, Users, Groups, Memberships, and Roles.

**Architecture:** Each phase contains independent tasks that can run in parallel. Phase dependencies are sequential (Phase N must complete before Phase N+1).

**Tech Stack:** TypeScript, Zod schemas, MCP SDK, Vitest

---

## Phase 1: Types (1 Task - Sequential)

All new types must be added before client/tools can be implemented.

### Task 1.1: Add all new types to types.ts

**Files:**
- Modify: `src/redmine/types.ts`

**Add these types at the end of the file:**

```typescript
// === TIME ENTRIES ===

export interface RedmineTimeEntry {
  id: number;
  project: { id: number; name: string };
  issue?: { id: number };
  user: { id: number; name: string };
  activity: { id: number; name: string };
  hours: number;
  comments?: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
  custom_fields?: RedmineCustomFieldValue[];
}

export interface RedmineTimeEntriesResponse {
  time_entries: RedmineTimeEntry[];
  total_count: number;
  offset: number;
  limit: number;
}

// === ENUMERATIONS ===

export interface RedmineEnumeration {
  id: number;
  name: string;
  is_default: boolean;
}

export interface RedmineIssuePrioritiesResponse {
  issue_priorities: RedmineEnumeration[];
}

export interface RedmineTimeEntryActivitiesResponse {
  time_entry_activities: RedmineEnumeration[];
}

export interface RedmineDocumentCategoriesResponse {
  document_categories: RedmineEnumeration[];
}

// === USERS ===

export interface RedmineUser {
  id: number;
  login: string;
  admin?: boolean;
  firstname: string;
  lastname: string;
  mail?: string;
  created_on: string;
  updated_on?: string;
  last_login_on?: string;
  passwd_changed_on?: string;
  api_key?: string;
  status?: number;
  custom_fields?: RedmineCustomFieldValue[];
  memberships?: RedmineMembership[];
  groups?: { id: number; name: string }[];
}

export interface RedmineUsersResponse {
  users: RedmineUser[];
  total_count: number;
  offset: number;
  limit: number;
}

// === GROUPS ===

export interface RedmineGroup {
  id: number;
  name: string;
  users?: { id: number; name: string }[];
  memberships?: RedmineMembership[];
}

export interface RedmineGroupsResponse {
  groups: RedmineGroup[];
  total_count: number;
  offset: number;
  limit: number;
}

// === MEMBERSHIPS ===

export interface RedmineMembership {
  id: number;
  project: { id: number; name: string };
  user?: { id: number; name: string };
  group?: { id: number; name: string };
  roles: { id: number; name: string; inherited?: boolean }[];
}

export interface RedmineMembershipsResponse {
  memberships: RedmineMembership[];
  total_count: number;
  offset: number;
  limit: number;
}

// === ROLES ===

export interface RedmineRole {
  id: number;
  name: string;
  assignable?: boolean;
  issues_visibility?: string;
  time_entries_visibility?: string;
  users_visibility?: string;
  permissions?: string[];
}

export interface RedmineRolesResponse {
  roles: RedmineRole[];
}
```

**Verify:**
```bash
npm run build
```
Expected: Build succeeds with no errors.

**Commit:**
```bash
git add src/redmine/types.ts
git commit -m "feat: add types for time entries, enumerations, users, groups, memberships, roles"
```

---

## Phase 2: Client Methods (5 Parallel Tasks)

Each task adds client methods for one resource type. All can run in parallel.

### Task 2.1: Add Time Entries client methods

**Files:**
- Modify: `src/redmine/client.ts`

**Add imports at top:**
```typescript
import type {
  // ... existing imports ...
  RedmineTimeEntry,
  RedmineTimeEntriesResponse,
} from "./types.js";
```

**Add methods before closing brace:**
```typescript
  // ==================== TIME ENTRIES ====================

  async listTimeEntries(params?: {
    project_id?: string | number;
    user_id?: number | string;
    spent_on?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineTimeEntriesResponse>> {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", String(params.project_id));
    if (params?.user_id) query.set("user_id", String(params.user_id));
    if (params?.spent_on) query.set("spent_on", params.spent_on);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/time_entries.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineTimeEntriesResponse>("GET", path);
  }

  async getTimeEntry(id: number): Promise<RedmineResult<{ time_entry: RedmineTimeEntry }>> {
    return this.request<{ time_entry: RedmineTimeEntry }>("GET", `/time_entries/${id}.json`);
  }

  async createTimeEntry(data: {
    issue_id?: number;
    project_id?: string | number;
    hours: number;
    activity_id?: number;
    spent_on?: string;
    comments?: string;
    user_id?: number;
  }): Promise<RedmineResult<{ time_entry: RedmineTimeEntry }>> {
    return this.request<{ time_entry: RedmineTimeEntry }>("POST", "/time_entries.json", {
      time_entry: data,
    });
  }

  async updateTimeEntry(
    id: number,
    data: {
      hours?: number;
      activity_id?: number;
      spent_on?: string;
      comments?: string;
    }
  ): Promise<RedmineResult<void>> {
    return this.request<void>("PUT", `/time_entries/${id}.json`, {
      time_entry: data,
    });
  }

  async deleteTimeEntry(id: number): Promise<RedmineResult<void>> {
    return this.request<void>("DELETE", `/time_entries/${id}.json`);
  }
```

---

### Task 2.2: Add Enumerations client methods

**Files:**
- Modify: `src/redmine/client.ts`

**Add imports:**
```typescript
import type {
  // ... existing imports ...
  RedmineIssuePrioritiesResponse,
  RedmineTimeEntryActivitiesResponse,
  RedmineDocumentCategoriesResponse,
} from "./types.js";
```

**Add methods:**
```typescript
  // ==================== ENUMERATIONS ====================

  async listIssuePriorities(): Promise<RedmineResult<RedmineIssuePrioritiesResponse>> {
    return this.request<RedmineIssuePrioritiesResponse>("GET", "/enumerations/issue_priorities.json");
  }

  async listTimeEntryActivities(): Promise<RedmineResult<RedmineTimeEntryActivitiesResponse>> {
    return this.request<RedmineTimeEntryActivitiesResponse>("GET", "/enumerations/time_entry_activities.json");
  }

  async listDocumentCategories(): Promise<RedmineResult<RedmineDocumentCategoriesResponse>> {
    return this.request<RedmineDocumentCategoriesResponse>("GET", "/enumerations/document_categories.json");
  }
```

---

### Task 2.3: Add Users client methods

**Files:**
- Modify: `src/redmine/client.ts`

**Add imports:**
```typescript
import type {
  // ... existing imports ...
  RedmineUser,
  RedmineUsersResponse,
} from "./types.js";
```

**Add methods:**
```typescript
  // ==================== USERS ====================

  async listUsers(params?: {
    status?: number;
    name?: string;
    group_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineUsersResponse>> {
    const query = new URLSearchParams();
    if (params?.status !== undefined) query.set("status", String(params.status));
    if (params?.name) query.set("name", params.name);
    if (params?.group_id) query.set("group_id", String(params.group_id));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/users.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineUsersResponse>("GET", path);
  }

  async getUser(
    id: number | "current",
    include?: string
  ): Promise<RedmineResult<{ user: RedmineUser }>> {
    const query = include ? `?include=${include}` : "";
    return this.request<{ user: RedmineUser }>("GET", `/users/${id}.json${query}`);
  }

  async createUser(data: {
    login: string;
    firstname: string;
    lastname: string;
    mail: string;
    password?: string;
    generate_password?: boolean;
    must_change_passwd?: boolean;
    auth_source_id?: number;
    mail_notification?: string;
    admin?: boolean;
    send_information?: boolean;
  }): Promise<RedmineResult<{ user: RedmineUser }>> {
    return this.request<{ user: RedmineUser }>("POST", "/users.json", {
      user: data,
    });
  }

  async updateUser(
    id: number,
    data: {
      login?: string;
      firstname?: string;
      lastname?: string;
      mail?: string;
      password?: string;
      admin?: boolean;
      status?: number;
    }
  ): Promise<RedmineResult<void>> {
    return this.request<void>("PUT", `/users/${id}.json`, {
      user: data,
    });
  }

  async deleteUser(id: number): Promise<RedmineResult<void>> {
    return this.request<void>("DELETE", `/users/${id}.json`);
  }
```

---

### Task 2.4: Add Groups client methods

**Files:**
- Modify: `src/redmine/client.ts`

**Add imports:**
```typescript
import type {
  // ... existing imports ...
  RedmineGroup,
  RedmineGroupsResponse,
} from "./types.js";
```

**Add methods:**
```typescript
  // ==================== GROUPS ====================

  async listGroups(): Promise<RedmineResult<RedmineGroupsResponse>> {
    return this.request<RedmineGroupsResponse>("GET", "/groups.json");
  }

  async getGroup(
    id: number,
    include?: string
  ): Promise<RedmineResult<{ group: RedmineGroup }>> {
    const query = include ? `?include=${include}` : "";
    return this.request<{ group: RedmineGroup }>("GET", `/groups/${id}.json${query}`);
  }

  async createGroup(data: {
    name: string;
    user_ids?: number[];
  }): Promise<RedmineResult<{ group: RedmineGroup }>> {
    return this.request<{ group: RedmineGroup }>("POST", "/groups.json", {
      group: data,
    });
  }

  async deleteGroup(id: number): Promise<RedmineResult<void>> {
    return this.request<void>("DELETE", `/groups/${id}.json`);
  }

  async addUserToGroup(groupId: number, userId: number): Promise<RedmineResult<void>> {
    return this.request<void>("POST", `/groups/${groupId}/users.json`, {
      user_id: userId,
    });
  }

  async removeUserFromGroup(groupId: number, userId: number): Promise<RedmineResult<void>> {
    return this.request<void>("DELETE", `/groups/${groupId}/users/${userId}.json`);
  }
```

---

### Task 2.5: Add Memberships & Roles client methods

**Files:**
- Modify: `src/redmine/client.ts`

**Add imports:**
```typescript
import type {
  // ... existing imports ...
  RedmineMembership,
  RedmineMembershipsResponse,
  RedmineRole,
  RedmineRolesResponse,
} from "./types.js";
```

**Add methods:**
```typescript
  // ==================== MEMBERSHIPS ====================

  async listProjectMemberships(
    projectId: string | number,
    params?: { limit?: number; offset?: number }
  ): Promise<RedmineResult<RedmineMembershipsResponse>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/projects/${projectId}/memberships.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineMembershipsResponse>("GET", path);
  }

  async getMembership(id: number): Promise<RedmineResult<{ membership: RedmineMembership }>> {
    return this.request<{ membership: RedmineMembership }>("GET", `/memberships/${id}.json`);
  }

  async createProjectMembership(
    projectId: string | number,
    data: {
      user_id: number;
      role_ids: number[];
    }
  ): Promise<RedmineResult<{ membership: RedmineMembership }>> {
    return this.request<{ membership: RedmineMembership }>(
      "POST",
      `/projects/${projectId}/memberships.json`,
      { membership: data }
    );
  }

  async updateMembership(
    id: number,
    data: { role_ids: number[] }
  ): Promise<RedmineResult<void>> {
    return this.request<void>("PUT", `/memberships/${id}.json`, {
      membership: data,
    });
  }

  async deleteMembership(id: number): Promise<RedmineResult<void>> {
    return this.request<void>("DELETE", `/memberships/${id}.json`);
  }

  // ==================== ROLES ====================

  async listRoles(): Promise<RedmineResult<RedmineRolesResponse>> {
    return this.request<RedmineRolesResponse>("GET", "/roles.json");
  }

  async getRole(id: number): Promise<RedmineResult<{ role: RedmineRole }>> {
    return this.request<{ role: RedmineRole }>("GET", `/roles/${id}.json`);
  }
```

**After all Phase 2 tasks complete:**
```bash
npm run build
git add src/redmine/client.ts
git commit -m "feat: add client methods for time entries, enumerations, users, groups, memberships, roles"
```

---

## Phase 3: Tools (5 Parallel Tasks)

Each task creates one tool file. All can run in parallel.

### Task 3.1: Create time.ts tools

**Files:**
- Create: `src/tools/time.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerTimeTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_time_entries",
    {
      description: "List time entries with optional filters",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).optional().describe("Filter by project ID or identifier"),
        user_id: z.union([z.number(), z.string()]).optional().describe("Filter by user ID or 'me'"),
        spent_on: z.string().optional().describe("Filter by exact date (YYYY-MM-DD)"),
        from: z.string().optional().describe("Filter from date (YYYY-MM-DD)"),
        to: z.string().optional().describe("Filter to date (YYYY-MM-DD)"),
        limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const result = await client.listTimeEntries(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_time_entry",
    {
      description: "Get details of a specific time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID"),
      },
    },
    async (params) => {
      const result = await client.getTimeEntry(params.time_entry_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_time_entry",
    {
      description: "Log time on an issue or project",
      inputSchema: {
        issue_id: z.number().optional().describe("Issue ID to log time on (either issue_id or project_id required)"),
        project_id: z.union([z.string(), z.number()]).optional().describe("Project ID to log time on (either issue_id or project_id required)"),
        hours: z.number().describe("Number of hours spent"),
        activity_id: z.number().optional().describe("Activity ID (use list_time_entry_activities to get IDs)"),
        spent_on: z.string().optional().describe("Date spent (YYYY-MM-DD, defaults to today)"),
        comments: z.string().optional().describe("Description of work done (max 255 chars)"),
        user_id: z.number().optional().describe("User ID to log time for (admin only)"),
      },
    },
    async (params) => {
      const result = await client.createTimeEntry(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_time_entry",
    {
      description: "Update an existing time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID to update"),
        hours: z.number().optional().describe("New hours value"),
        activity_id: z.number().optional().describe("New activity ID"),
        spent_on: z.string().optional().describe("New date (YYYY-MM-DD)"),
        comments: z.string().optional().describe("New comments"),
      },
    },
    async (params) => {
      const { time_entry_id, ...data } = params;
      const result = await client.updateTimeEntry(time_entry_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_time_entry",
    {
      description: "Delete a time entry",
      inputSchema: {
        time_entry_id: z.number().describe("The time entry ID to delete"),
      },
    },
    async (params) => {
      const result = await client.deleteTimeEntry(params.time_entry_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result ?? { success: true }, null, 2) }],
      };
    }
  );
}
```

---

### Task 3.2: Create enumerations.ts tools

**Files:**
- Create: `src/tools/enumerations.ts`

```typescript
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
```

---

### Task 3.3: Create admin.ts tools

**Files:**
- Create: `src/tools/admin.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

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
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
```

---

### Task 3.4: Create memberships.ts tools

**Files:**
- Create: `src/tools/memberships.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerMembershipsTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "list_project_memberships",
    {
      description: "List all memberships (users and groups) for a project",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
        limit: z.number().optional().describe("Maximum results"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const { project_id, ...rest } = params;
      const result = await client.listProjectMemberships(project_id, rest);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_project_membership",
    {
      description: "Add a user or group to a project with specified roles",
      inputSchema: {
        project_id: z.union([z.string(), z.number()]).describe("Project ID or identifier"),
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
```

---

### Task 3.5: Create roles.ts tools

**Files:**
- Create: `src/tools/roles.ts`

```typescript
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
```

---

### Task 3.6: Update index.ts to register new tools

**Files:**
- Modify: `src/tools/index.ts`

**Add imports:**
```typescript
import { registerTimeTools } from "./time.js";
import { registerEnumerationsTools } from "./enumerations.js";
import { registerAdminTools } from "./admin.js";
import { registerMembershipsTools } from "./memberships.js";
import { registerRolesTools } from "./roles.js";
```

**Update toolGroups object:**
```typescript
export const toolGroups: Record<string, ToolRegistrationFn> = {
  core: registerCoreTools,
  metadata: registerMetadataTools,
  wiki: registerWikiTools,
  files: registerFilesTools,
  relations: registerRelationsTools,
  search: registerSearchTools,
  account: registerAccountTools,
  time: registerTimeTools,
  enumerations: registerEnumerationsTools,
  admin: registerAdminTools,
  memberships: registerMembershipsTools,
  roles: registerRolesTools,
};
```

**After all Phase 3 tasks complete:**
```bash
npm run build
git add src/tools/
git commit -m "feat: add tools for time entries, enumerations, admin, memberships, roles"
```

---

## Phase 4: Tests (5 Parallel Tasks)

Each task creates one test file. All can run in parallel.

### Task 4.1: Create enumerations tests

**Files:**
- Create: `tests/08-enumerations.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("enumerations", () => {
  describe("list_issue_priorities", () => {
    it("should list all priorities", async () => {
      const result = await client.listIssuePriorities();

      expect(result.issue_priorities).toBeDefined();
      expect(Array.isArray(result.issue_priorities)).toBe(true);
      expect(result.issue_priorities.length).toBeGreaterThan(0);

      const priority = result.issue_priorities[0];
      expect(priority.id).toBeDefined();
      expect(priority.name).toBeDefined();
      expect(typeof priority.is_default).toBe("boolean");

      // Store for other tests
      state.priorityId = priority.id;
    });

    it("should have exactly one default priority", async () => {
      const result = await client.listIssuePriorities();

      const defaults = result.issue_priorities.filter((p) => p.is_default);
      expect(defaults.length).toBe(1);
    });
  });

  describe("list_time_entry_activities", () => {
    it("should list all activities", async () => {
      const result = await client.listTimeEntryActivities();

      expect(result.time_entry_activities).toBeDefined();
      expect(Array.isArray(result.time_entry_activities)).toBe(true);
      expect(result.time_entry_activities.length).toBeGreaterThan(0);

      const activity = result.time_entry_activities[0];
      expect(activity.id).toBeDefined();
      expect(activity.name).toBeDefined();

      // Store for time entry tests
      state.activityId = activity.id;
    });
  });

  describe("list_document_categories", () => {
    it("should list all document categories", async () => {
      const result = await client.listDocumentCategories();

      expect(result.document_categories).toBeDefined();
      expect(Array.isArray(result.document_categories)).toBe(true);
    });
  });
});
```

---

### Task 4.2: Create time entry tests

**Files:**
- Create: `tests/09-time.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("time entries", () => {
  describe("create_time_entry", () => {
    it("should create time entry with issue_id", async () => {
      const result = await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 1.5,
        activity_id: state.activityId,
        comments: "Test time entry",
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBeGreaterThan(0);
      expect(result.time_entry.hours).toBe(1.5);

      state.timeEntryId = result.time_entry.id;
    });

    it("should create time entry with project_id", async () => {
      const result = await client.createTimeEntry({
        project_id: state.projectId,
        hours: 2.0,
        activity_id: state.activityId,
        comments: "Project time entry",
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.hours).toBe(2.0);

      state.secondTimeEntryId = result.time_entry.id;
    });

    it("should create time entry with all fields", async () => {
      const result = await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 0.5,
        activity_id: state.activityId,
        spent_on: "2024-06-15",
        comments: "Full time entry",
      });

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.spent_on).toBe("2024-06-15");
    });

    it("should fail without hours", async () => {
      const result = (await client.createTimeEntry({
        issue_id: state.issueId,
        hours: 0, // Invalid
        activity_id: state.activityId,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail without issue_id or project_id", async () => {
      const result = (await client.createTimeEntry({
        hours: 1.0,
        activity_id: state.activityId,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent project", async () => {
      const result = (await client.createTimeEntry({
        project_id: "nonexistent-project-xyz",
        hours: 1.0,
        activity_id: state.activityId,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
    });
  });

  describe("list_time_entries", () => {
    it("should list all time entries", async () => {
      const result = await client.listTimeEntries({});

      expect(result.time_entries).toBeDefined();
      expect(Array.isArray(result.time_entries)).toBe(true);
    });

    it("should filter by project_id", async () => {
      const result = await client.listTimeEntries({
        project_id: state.projectId,
      });

      expect(result.time_entries).toBeDefined();
    });

    it("should filter by user_id=me", async () => {
      const result = await client.listTimeEntries({
        user_id: "me",
      });

      expect(result.time_entries).toBeDefined();
    });

    it("should filter by date range", async () => {
      const result = await client.listTimeEntries({
        from: "2024-01-01",
        to: "2024-12-31",
      });

      expect(result.time_entries).toBeDefined();
    });
  });

  describe("get_time_entry", () => {
    it("should get time entry by id", async () => {
      const result = await client.getTimeEntry(state.timeEntryId);

      expect(result.time_entry).toBeDefined();
      expect(result.time_entry.id).toBe(state.timeEntryId);
    });

    it("should fail for nonexistent entry", async () => {
      const result = (await client.getTimeEntry(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_time_entry", () => {
    it("should update hours and comments", async () => {
      const updateResult = (await client.updateTimeEntry(state.timeEntryId, {
        hours: 3.0,
        comments: "Updated comment",
      })) as { error?: boolean };

      expect(updateResult.error).not.toBe(true);

      const result = await client.getTimeEntry(state.timeEntryId);
      expect(result.time_entry.hours).toBe(3.0);
      expect(result.time_entry.comments).toBe("Updated comment");
    });

    it("should fail for nonexistent entry", async () => {
      const result = (await client.updateTimeEntry(999999999, {
        hours: 1.0,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_time_entry", () => {
    it("should delete time entry", async () => {
      await expect(
        client.deleteTimeEntry(state.secondTimeEntryId!)
      ).resolves.not.toThrow();

      state.secondTimeEntryId = undefined;
    });

    it("should fail for nonexistent entry", async () => {
      const result = (await client.deleteTimeEntry(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
```

---

### Task 4.3: Create roles tests

**Files:**
- Create: `tests/10-roles.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("roles", () => {
  describe("list_roles", () => {
    it("should list all roles", async () => {
      const result = await client.listRoles();

      expect(result.roles).toBeDefined();
      expect(Array.isArray(result.roles)).toBe(true);
    });

    it("should have at least one role", async () => {
      const result = await client.listRoles();

      expect(result.roles.length).toBeGreaterThan(0);

      const role = result.roles[0];
      expect(role.id).toBeDefined();
      expect(role.name).toBeDefined();

      // Store for membership tests
      state.roleId = role.id;
      if (result.roles.length > 1) {
        state.secondRoleId = result.roles[1].id;
      }
    });
  });

  describe("get_role", () => {
    it("should get role with permissions", async () => {
      const result = await client.getRole(state.roleId);

      expect(result.role).toBeDefined();
      expect(result.role.id).toBe(state.roleId);
      expect(result.role.name).toBeDefined();
    });

    it("should fail for nonexistent role", async () => {
      const result = (await client.getRole(999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
```

---

### Task 4.4: Create memberships tests

**Files:**
- Create: `tests/11-memberships.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

// Local state for membership tests
let testUserId: number;

describe("memberships", () => {
  // Create a test user for membership tests
  beforeAll(async () => {
    const result = await client.createUser({
      login: `member-test-${Date.now()}`,
      firstname: "Member",
      lastname: "Test",
      mail: `member-test-${Date.now()}@example.com`,
      password: "password123",
    });
    if (result.user) {
      testUserId = result.user.id;
    }
  });

  describe("list_project_memberships", () => {
    it("should list memberships for project", async () => {
      const result = await client.listProjectMemberships(state.projectId);

      expect(result.memberships).toBeDefined();
      expect(Array.isArray(result.memberships)).toBe(true);
    });

    it("should fail for nonexistent project", async () => {
      const result = (await client.listProjectMemberships(
        "nonexistent-project-xyz"
      )) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("create_project_membership", () => {
    it("should add user to project with role", async () => {
      const result = await client.createProjectMembership(state.projectId, {
        user_id: testUserId,
        role_ids: [state.roleId],
      });

      expect(result.membership).toBeDefined();
      expect(result.membership.id).toBeGreaterThan(0);

      state.membershipId = result.membership.id;
    });

    it("should fail without role_ids", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: testUserId,
        role_ids: [],
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: 999999,
        role_ids: [state.roleId],
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail for nonexistent role", async () => {
      const result = (await client.createProjectMembership(state.projectId, {
        user_id: testUserId,
        role_ids: [999999],
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("get_membership", () => {
    it("should get membership by id", async () => {
      const result = await client.getMembership(state.membershipId);

      expect(result.membership).toBeDefined();
      expect(result.membership.id).toBe(state.membershipId);
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.getMembership(999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_membership", () => {
    it("should update roles", async () => {
      if (!state.secondRoleId) {
        // Skip if only one role exists
        return;
      }

      const result = (await client.updateMembership(state.membershipId, {
        role_ids: [state.secondRoleId],
      })) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.updateMembership(999999, {
        role_ids: [state.roleId],
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_membership", () => {
    it("should remove membership", async () => {
      await expect(
        client.deleteMembership(state.membershipId)
      ).resolves.not.toThrow();
    });

    it("should fail for nonexistent membership", async () => {
      const result = (await client.deleteMembership(999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
```

---

### Task 4.5: Create admin tests

**Files:**
- Create: `tests/12-admin.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("admin", () => {
  // === USERS ===

  describe("create_user", () => {
    it("should create user with required fields", async () => {
      const login = `test-user-${Date.now()}`;
      const result = await client.createUser({
        login,
        firstname: "Test",
        lastname: "User",
        mail: `${login}@example.com`,
        password: "password123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeGreaterThan(0);
      expect(result.user.login).toBe(login);

      state.testUserId = result.user.id;
    });

    it("should create user with generate_password", async () => {
      const login = `gen-user-${Date.now()}`;
      const result = await client.createUser({
        login,
        firstname: "Generated",
        lastname: "Password",
        mail: `${login}@example.com`,
        generate_password: true,
      });

      expect(result.user).toBeDefined();
      state.secondTestUserId = result.user.id;
    });

    it("should fail without login", async () => {
      const result = (await client.createUser({
        login: "",
        firstname: "No",
        lastname: "Login",
        mail: "nologin@example.com",
        password: "password123",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail without mail", async () => {
      const result = (await client.createUser({
        login: `nomail-${Date.now()}`,
        firstname: "No",
        lastname: "Mail",
        mail: "",
        password: "password123",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail with duplicate login", async () => {
      const result = (await client.createUser({
        login: "admin", // Already exists
        firstname: "Duplicate",
        lastname: "Admin",
        mail: "duplicate@example.com",
        password: "password123",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail with invalid email", async () => {
      const result = (await client.createUser({
        login: `invalid-${Date.now()}`,
        firstname: "Invalid",
        lastname: "Email",
        mail: "not-an-email",
        password: "password123",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("list_users", () => {
    it("should list all active users", async () => {
      const result = await client.listUsers({});

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const result = await client.listUsers({ status: 1 }); // Active

      expect(result.users).toBeDefined();
      result.users.forEach((user) => {
        expect(user.status).toBe(1);
      });
    });

    it("should filter by name", async () => {
      const result = await client.listUsers({ name: "admin" });

      expect(result.users).toBeDefined();
    });

    it("should filter by group_id", async () => {
      // This test may return empty if no groups exist
      const result = await client.listUsers({ group_id: 999999 });

      expect(result.users).toBeDefined();
      expect(result.users.length).toBe(0);
    });
  });

  describe("get_user", () => {
    it("should get user by id", async () => {
      const result = await client.getUser(state.testUserId);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(state.testUserId);
    });

    it("should get user with includes", async () => {
      const result = await client.getUser(state.testUserId, "memberships,groups");

      expect(result.user).toBeDefined();
    });

    it("should get current user", async () => {
      const result = await client.getUser("current");

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeGreaterThan(0);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.getUser(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_user", () => {
    it("should update user firstname", async () => {
      const result = (await client.updateUser(state.testUserId, {
        firstname: "Updated",
      })) as { error?: boolean };

      expect(result.error).not.toBe(true);

      const verify = await client.getUser(state.testUserId);
      expect(verify.user.firstname).toBe("Updated");
    });

    it("should lock user", async () => {
      const result = (await client.updateUser(state.secondTestUserId!, {
        status: 3, // Locked
      })) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.updateUser(999999999, {
        firstname: "Should Fail",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  // === GROUPS ===

  describe("create_group", () => {
    it("should create group", async () => {
      const result = await client.createGroup({
        name: `Test Group ${Date.now()}`,
      });

      expect(result.group).toBeDefined();
      expect(result.group.id).toBeGreaterThan(0);

      state.testGroupId = result.group.id;
    });

    it("should create group with initial users", async () => {
      const result = await client.createGroup({
        name: `Group With Users ${Date.now()}`,
        user_ids: [state.testUserId],
      });

      expect(result.group).toBeDefined();
      state.secondTestGroupId = result.group.id;
    });

    it("should fail without name", async () => {
      const result = (await client.createGroup({
        name: "",
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });

    it("should fail with duplicate name", async () => {
      // First create a group
      const name = `Duplicate Group ${Date.now()}`;
      await client.createGroup({ name });

      // Try to create another with same name
      const result = (await client.createGroup({
        name,
      })) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
    });
  });

  describe("list_groups", () => {
    it("should list all groups", async () => {
      const result = await client.listGroups();

      expect(result.groups).toBeDefined();
      expect(Array.isArray(result.groups)).toBe(true);
    });
  });

  describe("get_group", () => {
    it("should get group by id", async () => {
      const result = await client.getGroup(state.testGroupId);

      expect(result.group).toBeDefined();
      expect(result.group.id).toBe(state.testGroupId);
    });

    it("should get group with users include", async () => {
      const result = await client.getGroup(state.testGroupId, "users");

      expect(result.group).toBeDefined();
    });

    it("should fail for nonexistent group", async () => {
      const result = (await client.getGroup(999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("add_user_to_group", () => {
    it("should add user to group", async () => {
      const result = (await client.addUserToGroup(
        state.testGroupId,
        state.testUserId
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.addUserToGroup(
        state.testGroupId,
        999999999
      )) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
    });
  });

  describe("remove_user_from_group", () => {
    it("should remove user from group", async () => {
      const result = (await client.removeUserFromGroup(
        state.testGroupId,
        state.testUserId
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.removeUserFromGroup(
        state.testGroupId,
        999999999
      )) as { error?: boolean; status?: number };

      expect(result.error).toBe(true);
    });
  });

  describe("delete_user", () => {
    it("should delete user", async () => {
      await expect(
        client.deleteUser(state.secondTestUserId!)
      ).resolves.not.toThrow();

      state.secondTestUserId = undefined;
    });

    it("should fail for nonexistent user", async () => {
      const result = (await client.deleteUser(999999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("delete_group", () => {
    it("should delete group", async () => {
      await expect(
        client.deleteGroup(state.secondTestGroupId!)
      ).resolves.not.toThrow();

      state.secondTestGroupId = undefined;
    });

    it("should fail for nonexistent group", async () => {
      const result = (await client.deleteGroup(999999)) as {
        error?: boolean;
        status?: number;
      };

      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
```

---

### Task 4.6: Update state.ts with new fields

**Files:**
- Modify: `tests/state.ts`

**Add new fields to type and initial values:**

```typescript
export const state: {
  // ... existing fields ...

  // New fields for new tests
  activityId: number;
  timeEntryId: number;
  secondTimeEntryId: number | undefined;
  roleId: number;
  secondRoleId: number | undefined;
  membershipId: number;
  testUserId: number;
  secondTestUserId: number | undefined;
  testGroupId: number;
  secondTestGroupId: number | undefined;
} = {
  // ... existing initial values ...

  // New initial values
  activityId: 0,
  timeEntryId: 0,
  secondTimeEntryId: undefined,
  roleId: 0,
  secondRoleId: undefined,
  membershipId: 0,
  testUserId: 0,
  secondTestUserId: undefined,
  testGroupId: 0,
  secondTestGroupId: undefined,
};
```

---

### Task 4.7: Update vitest.config.ts

**Files:**
- Modify: `vitest.config.ts`

**Update include array:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
    testTimeout: 10000,
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/01-account.test.ts",
      "tests/02-core.test.ts",
      "tests/03-metadata.test.ts",
      "tests/04-relations.test.ts",
      "tests/05-wiki.test.ts",
      "tests/06-files.test.ts",
      "tests/07-search.test.ts",
      "tests/08-enumerations.test.ts",
      "tests/09-time.test.ts",
      "tests/10-roles.test.ts",
      "tests/11-memberships.test.ts",
      "tests/12-admin.test.ts",
    ],
  },
});
```

**After all Phase 4 tasks complete:**
```bash
npm test
git add tests/ vitest.config.ts
git commit -m "test: add tests for time entries, enumerations, roles, memberships, admin"
```

---

## Phase 5: Documentation & Finish (Sequential)

### Task 5.1: Update README.md

**Files:**
- Modify: `README.md`

**Update Tool Groups table:**

```markdown
## Tool Groups

| Group | Tools | Description |
|-------|-------|-------------|
| `core` | 14 | Issues & Projects (CRUD, watchers, archive) |
| `metadata` | 9 | Trackers, Statuses, Categories, Custom Fields, Queries |
| `wiki` | 5 | Wiki Pages (CRUD, versioning) |
| `files` | 5 | Attachments & Project Files |
| `relations` | 9 | Issue Relations & Versions |
| `search` | 1 | Global Search |
| `account` | 1 | Current User Account |
| `time` | 5 | Time Entries (CRUD, filtering) |
| `enumerations` | 3 | Priorities, Activities, Document Categories |
| `admin` | 11 | Users & Groups (Admin only) |
| `memberships` | 5 | Project Memberships |
| `roles` | 2 | Roles & Permissions |

**Total: 70 Tools**
```

**Add new tools to Available Tools section:**

```markdown
### Time Entries

- `list_time_entries` - List time entries with filters
- `get_time_entry` - Get time entry details
- `create_time_entry` - Log time on issue or project
- `update_time_entry` - Update time entry
- `delete_time_entry` - Delete time entry

### Enumerations

- `list_issue_priorities` - List issue priorities
- `list_time_entry_activities` - List time entry activities
- `list_document_categories` - List document categories

### Admin (requires admin privileges)

- `list_users` - List all users
- `get_user` - Get user details
- `create_user` - Create new user
- `update_user` - Update user
- `delete_user` - Delete user
- `list_groups` - List all groups
- `get_group` - Get group details
- `create_group` - Create group
- `delete_group` - Delete group
- `add_user_to_group` - Add user to group
- `remove_user_from_group` - Remove user from group

### Memberships

- `list_project_memberships` - List project members
- `get_membership` - Get membership details
- `create_project_membership` - Add member to project
- `update_membership` - Update member roles
- `delete_membership` - Remove member from project

### Roles

- `list_roles` - List available roles
- `get_role` - Get role with permissions
```

**Add usage example:**

```markdown
### Load without admin tools (for non-admin users)

```bash
npx @pschroee/mcp-server --exclude=admin
```

### Load only time tracking tools

```bash
npx @pschroee/mcp-server --tools=time,enumerations,core
```
```

**Update test count:**

```markdown
The test suite includes 187 tests across 12 test files
```

---

### Task 5.2: Update package.json version

**Files:**
- Modify: `package.json`

**Change version:**
```json
"version": "0.3.0"
```

---

### Task 5.3: Final commit

```bash
npm run build
npm test
git add README.md package.json package-lock.json
git commit -m "chore: update README and bump version to 0.3.0"
```

---

## Summary

| Phase | Tasks | Parallel? | Description |
|-------|-------|-----------|-------------|
| 1 | 1 | No | Add types |
| 2 | 5 | Yes | Add client methods |
| 3 | 6 | Yes | Create tools |
| 4 | 7 | Yes | Create tests |
| 5 | 3 | No | Documentation & finish |

**Total: 22 Tasks**
**New Tools: 26**
**New Tests: 63**
**Final Tool Count: 70**
**Final Test Count: 187**
