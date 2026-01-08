# Redmine MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a stdio MCP server that exposes Redmine issues and projects via `npx redmine-mcp`.

**Architecture:** Single Node.js process using the official MCP SDK with stdio transport. RedmineClient handles all API calls, tools are registered on the MCP server and delegate to the client.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, zod, Node.js 18+ native fetch

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "redmine-mcp",
  "version": "0.1.0",
  "description": "MCP server for Redmine issues and projects",
  "type": "module",
  "bin": {
    "redmine-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["mcp", "redmine", "claude"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

**Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: initialize project with TypeScript and MCP SDK"
```

---

## Task 2: Redmine Types

**Files:**
- Create: `src/redmine/types.ts`

**Step 1: Create Redmine type definitions**

```typescript
export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker?: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  done_ratio?: number;
  created_on: string;
  updated_on: string;
}

export interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  status: number;
  is_public: boolean;
  created_on: string;
  updated_on: string;
}

export interface RedmineIssuesResponse {
  issues: RedmineIssue[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface RedmineProjectsResponse {
  projects: RedmineProject[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface RedmineError {
  error: true;
  status: number;
  message: string;
}

export type RedmineResult<T> = T | RedmineError;
```

**Step 2: Commit**

```bash
git add src/redmine/types.ts
git commit -m "feat: add Redmine API type definitions"
```

---

## Task 3: Redmine Client

**Files:**
- Create: `src/redmine/client.ts`

**Step 1: Create RedmineClient class**

```typescript
import type {
  RedmineIssue,
  RedmineIssuesResponse,
  RedmineProject,
  RedmineProjectsResponse,
  RedmineResult,
  RedmineError,
} from "./types.js";

export class RedmineClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<RedmineResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "X-Redmine-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorResponse: RedmineError = {
          error: true,
          status: response.status,
          message:
            (errorData as { errors?: string[] }).errors?.join(", ") ||
            `HTTP ${response.status}`,
        };
        return errorResponse;
      }

      return (await response.json()) as T;
    } catch (err) {
      const errorResponse: RedmineError = {
        error: true,
        status: 0,
        message: err instanceof Error ? err.message : "Unknown error",
      };
      return errorResponse;
    }
  }

  // Issues
  async listIssues(params?: {
    project_id?: string | number;
    status_id?: string;
    assigned_to_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineIssuesResponse>> {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", String(params.project_id));
    if (params?.status_id) query.set("status_id", params.status_id);
    if (params?.assigned_to_id) query.set("assigned_to_id", String(params.assigned_to_id));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/issues.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineIssuesResponse>("GET", path);
  }

  async getIssue(id: number): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("GET", `/issues/${id}.json`);
  }

  async createIssue(data: {
    project_id: number | string;
    subject: string;
    description?: string;
    tracker_id?: number;
    priority_id?: number;
    assigned_to_id?: number;
  }): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("POST", "/issues.json", {
      issue: data,
    });
  }

  async updateIssue(
    id: number,
    data: {
      subject?: string;
      description?: string;
      status_id?: number;
      assigned_to_id?: number;
      notes?: string;
    }
  ): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("PUT", `/issues/${id}.json`, {
      issue: data,
    });
  }

  // Projects
  async listProjects(params?: {
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineProjectsResponse>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/projects.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineProjectsResponse>("GET", path);
  }

  async getProject(
    id: string | number
  ): Promise<RedmineResult<{ project: RedmineProject }>> {
    return this.request<{ project: RedmineProject }>("GET", `/projects/${id}.json`);
  }

  async createProject(data: {
    name: string;
    identifier: string;
    description?: string;
    is_public?: boolean;
  }): Promise<RedmineResult<{ project: RedmineProject }>> {
    return this.request<{ project: RedmineProject }>("POST", "/projects.json", {
      project: data,
    });
  }

  async updateProject(
    id: string | number,
    data: {
      name?: string;
      description?: string;
      is_public?: boolean;
    }
  ): Promise<RedmineResult<{ project: RedmineProject }>> {
    return this.request<{ project: RedmineProject }>(
      "PUT",
      `/projects/${id}.json`,
      { project: data }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/redmine/client.ts
git commit -m "feat: add RedmineClient for API communication"
```

---

## Task 4: Issue Tools

**Files:**
- Create: `src/tools/issues.ts`

**Step 1: Create issue tools registration**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerIssueTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "list_issues",
    "List issues from Redmine with optional filters",
    {
      project_id: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Filter by project ID or identifier"),
      status_id: z
        .string()
        .optional()
        .describe("Filter by status: open, closed, or status ID"),
      assigned_to_id: z
        .number()
        .optional()
        .describe("Filter by assigned user ID"),
      limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
      offset: z.number().optional().describe("Skip first N results"),
    },
    async (params) => {
      const result = await client.listIssues(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_issue",
    "Get details of a specific issue by ID",
    {
      issue_id: z.number().describe("The issue ID"),
    },
    async (params) => {
      const result = await client.getIssue(params.issue_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_issue",
    "Create a new issue in Redmine",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
      subject: z.string().describe("Issue subject/title"),
      description: z.string().optional().describe("Issue description"),
      tracker_id: z.number().optional().describe("Tracker ID (e.g., Bug, Feature)"),
      priority_id: z.number().optional().describe("Priority ID"),
      assigned_to_id: z.number().optional().describe("User ID to assign"),
    },
    async (params) => {
      const result = await client.createIssue(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_issue",
    "Update an existing issue",
    {
      issue_id: z.number().describe("The issue ID to update"),
      subject: z.string().optional().describe("New subject/title"),
      description: z.string().optional().describe("New description"),
      status_id: z.number().optional().describe("New status ID"),
      assigned_to_id: z.number().optional().describe("New assignee user ID"),
      notes: z.string().optional().describe("Add a comment/note to the issue"),
    },
    async (params) => {
      const { issue_id, ...data } = params;
      const result = await client.updateIssue(issue_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

**Step 2: Commit**

```bash
git add src/tools/issues.ts
git commit -m "feat: add MCP tools for Redmine issues"
```

---

## Task 5: Project Tools

**Files:**
- Create: `src/tools/projects.ts`

**Step 1: Create project tools registration**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";

export function registerProjectTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.tool(
    "list_projects",
    "List all accessible projects from Redmine",
    {
      limit: z.number().optional().describe("Maximum results (default 25, max 100)"),
      offset: z.number().optional().describe("Skip first N results"),
    },
    async (params) => {
      const result = await client.listProjects(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_project",
    "Get details of a specific project",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
    },
    async (params) => {
      const result = await client.getProject(params.project_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_project",
    "Create a new project in Redmine",
    {
      name: z.string().describe("Project name"),
      identifier: z
        .string()
        .describe("Unique identifier (lowercase, no spaces, used in URLs)"),
      description: z.string().optional().describe("Project description"),
      is_public: z.boolean().optional().describe("Whether project is public (default true)"),
    },
    async (params) => {
      const result = await client.createProject(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_project",
    "Update an existing project",
    {
      project_id: z
        .union([z.string(), z.number()])
        .describe("Project ID or identifier"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New description"),
      is_public: z.boolean().optional().describe("Change public visibility"),
    },
    async (params) => {
      const { project_id, ...data } = params;
      const result = await client.updateProject(project_id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

**Step 2: Commit**

```bash
git add src/tools/projects.ts
git commit -m "feat: add MCP tools for Redmine projects"
```

---

## Task 6: MCP Server

**Files:**
- Create: `src/server.ts`

**Step 1: Create server setup**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RedmineClient } from "./redmine/client.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerProjectTools } from "./tools/projects.js";

export function createServer(redmineClient: RedmineClient): McpServer {
  const server = new McpServer({
    name: "redmine-mcp",
    version: "0.1.0",
  });

  registerIssueTools(server, redmineClient);
  registerProjectTools(server, redmineClient);

  return server;
}
```

**Step 2: Commit**

```bash
git add src/server.ts
git commit -m "feat: add MCP server factory"
```

---

## Task 7: Entry Point with CLI

**Files:**
- Create: `src/index.ts`

**Step 1: Create entry point with argument parsing**

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RedmineClient } from "./redmine/client.js";
import { createServer } from "./server.js";

function parseArgs(): { url: string; apiKey: string } {
  const args = process.argv.slice(2);
  let url: string | undefined;
  let apiKey: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (arg.startsWith("--url=")) {
      url = arg.slice(6);
    } else if (arg === "--api-key" && args[i + 1]) {
      apiKey = args[++i];
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.slice(10);
    }
  }

  // Fallback to environment variables
  url = url || process.env.REDMINE_URL;
  apiKey = apiKey || process.env.REDMINE_API_KEY;

  if (!url) {
    console.error("Error: Redmine URL required. Use --url or set REDMINE_URL");
    process.exit(1);
  }

  if (!apiKey) {
    console.error(
      "Error: API key required. Use --api-key or set REDMINE_API_KEY"
    );
    process.exit(1);
  }

  return { url, apiKey };
}

async function main(): Promise<void> {
  const config = parseArgs();
  const client = new RedmineClient(config.url, config.apiKey);
  const server = createServer(client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with argument parsing"
```

---

## Task 8: Build and Test

**Step 1: Build the project**

Run: `npm run build`
Expected: `dist/` folder created with compiled JavaScript files

**Step 2: Verify executable permissions**

Run: `chmod +x dist/index.js`

**Step 3: Test CLI help (should show error for missing config)**

Run: `node dist/index.js`
Expected: Error message about missing URL/API key

**Step 4: Commit build artifacts to gitignore check**

Run: `git status`
Expected: No files in `dist/` shown (already in .gitignore)

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify build works correctly"
```

---

## Task 9: README

**Files:**
- Create: `README.md`

**Step 1: Create README**

```markdown
# redmine-mcp

MCP server for Redmine - access issues and projects from Claude.

## Installation

```bash
claude mcp add redmine-mcp --scope user -- npx redmine-mcp --url https://your-redmine.com --api-key YOUR_API_KEY
```

Or with environment variables:

```bash
export REDMINE_URL=https://your-redmine.com
export REDMINE_API_KEY=your_api_key
claude mcp add redmine-mcp --scope user -- npx redmine-mcp
```

## Available Tools

### Issues

- `list_issues` - List issues with optional filters (project, status, assignee)
- `get_issue` - Get details of a specific issue
- `create_issue` - Create a new issue
- `update_issue` - Update an existing issue

### Projects

- `list_projects` - List all accessible projects
- `get_project` - Get details of a specific project
- `create_project` - Create a new project
- `update_project` - Update an existing project

## Configuration

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `--url` | `REDMINE_URL` | Redmine base URL |
| `--api-key` | `REDMINE_API_KEY` | Your Redmine API key |

CLI arguments take precedence over environment variables.

## Getting your API Key

1. Log into your Redmine instance
2. Go to My Account (usually `/my/account`)
3. Find "API access key" in the sidebar
4. Click "Show" or generate a new key

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation and usage instructions"
```

---

## Summary

After completing all tasks you will have:

- A working MCP server for Redmine
- 8 tools: list/get/create/update for both issues and projects
- CLI with `--url` and `--api-key` arguments
- Environment variable fallback
- Ready for `npm publish` and `npx` usage
