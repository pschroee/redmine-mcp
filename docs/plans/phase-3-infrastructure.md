# Phase 3: Infrastructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tool-Registry, CLI-Parameter und Server-Anpassung für dynamisches Tool-Loading.

**Architecture:** Registry-Pattern für Tool-Gruppen, CLI-Parsing für --tools/--exclude, Server nutzt Registry.

**Tech Stack:** TypeScript

**Abhängigkeiten:** Phase 1 und 2 müssen abgeschlossen sein.

**Parallelisierung:** Task 3.1, 3.2 und 3.3 können parallel ausgeführt werden.

---

## Task 3.1: Tool-Registry

**Files:**
- Create: `src/tools/index.ts`

**Step 1: Erstelle Tool-Registry**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedmineClient } from "../redmine/client.js";

// Tool registration function type
export type ToolRegistrationFn = (server: McpServer, client: RedmineClient) => void;

// Placeholder functions - will be replaced in Phase 4
const registerCoreTools: ToolRegistrationFn = () => {};
const registerMetadataTools: ToolRegistrationFn = () => {};
const registerWikiTools: ToolRegistrationFn = () => {};
const registerFilesTools: ToolRegistrationFn = () => {};
const registerRelationsTools: ToolRegistrationFn = () => {};
const registerSearchTools: ToolRegistrationFn = () => {};
const registerAccountTools: ToolRegistrationFn = () => {};

export const toolGroups: Record<string, ToolRegistrationFn> = {
  core: registerCoreTools,
  metadata: registerMetadataTools,
  wiki: registerWikiTools,
  files: registerFilesTools,
  relations: registerRelationsTools,
  search: registerSearchTools,
  account: registerAccountTools,
};

export type ToolGroup = keyof typeof toolGroups;

export const ALL_GROUPS: ToolGroup[] = Object.keys(toolGroups) as ToolGroup[];

export function isValidToolGroup(group: string): group is ToolGroup {
  return group in toolGroups;
}

export function validateToolGroups(groups: string[]): ToolGroup[] {
  const invalid = groups.filter((g) => !isValidToolGroup(g));
  if (invalid.length > 0) {
    throw new Error(`Invalid tool group(s): ${invalid.join(", ")}. Valid groups: ${ALL_GROUPS.join(", ")}`);
  }
  return groups as ToolGroup[];
}

export function resolveGroups(
  include?: string[],
  exclude?: string[]
): ToolGroup[] {
  let groups: ToolGroup[];

  if (include && include.length > 0) {
    groups = validateToolGroups(include);
  } else {
    groups = [...ALL_GROUPS];
  }

  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(validateToolGroups(exclude));
    groups = groups.filter((g) => !excludeSet.has(g));
  }

  if (groups.length === 0) {
    throw new Error("No tool groups selected. At least one group must be enabled.");
  }

  return groups;
}

export function registerTools(
  server: McpServer,
  client: RedmineClient,
  groups: ToolGroup[]
): void {
  for (const group of groups) {
    toolGroups[group](server, client);
  }
}
```

**Step 2: Build testen**

Run: `npm run build`
Expected: Erfolgreich (Placeholders sind valide)

---

## Task 3.2: CLI-Parameter erweitern

**Files:**
- Modify: `src/index.ts`

**Step 1: Erweitere parseArgs für Tool-Gruppen**

Ersetze die gesamte Datei:

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RedmineClient } from "./redmine/client.js";
import { createServer } from "./server.js";
import { resolveGroups, ALL_GROUPS, type ToolGroup } from "./tools/index.js";

interface Config {
  url: string;
  apiKey: string;
  toolGroups: ToolGroup[];
}

function printHelp(): void {
  console.log(`
Redmine MCP Server

Usage: redmine-mcp [options]

Options:
  --url=<url>           Redmine URL (or set REDMINE_URL)
  --api-key=<key>       API Key (or set REDMINE_API_KEY)
  --tools=<groups>      Comma-separated list of tool groups to enable
  --exclude=<groups>    Comma-separated list of tool groups to exclude
  --help                Show this help message

Tool Groups:
  ${ALL_GROUPS.join(", ")}

Examples:
  redmine-mcp --url=https://redmine.example.com --api-key=abc123
  redmine-mcp --tools=core,metadata
  redmine-mcp --exclude=wiki,files
`);
}

function parseArgs(): Config {
  const args = process.argv.slice(2);
  let url: string | undefined;
  let apiKey: string | undefined;
  let toolsArg: string | undefined;
  let excludeArg: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (arg.startsWith("--url=")) {
      url = arg.slice(6);
    } else if (arg === "--api-key" && args[i + 1]) {
      apiKey = args[++i];
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.slice(10);
    } else if (arg === "--tools" && args[i + 1]) {
      toolsArg = args[++i];
    } else if (arg.startsWith("--tools=")) {
      toolsArg = arg.slice(8);
    } else if (arg === "--exclude" && args[i + 1]) {
      excludeArg = args[++i];
    } else if (arg.startsWith("--exclude=")) {
      excludeArg = arg.slice(10);
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
    console.error("Error: API key required. Use --api-key or set REDMINE_API_KEY");
    process.exit(1);
  }

  // Parse tool groups
  const include = toolsArg ? toolsArg.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  const exclude = excludeArg ? excludeArg.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  let toolGroups: ToolGroup[];
  try {
    toolGroups = resolveGroups(include, exclude);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  return { url, apiKey, toolGroups };
}

async function main(): Promise<void> {
  const config = parseArgs();
  const client = new RedmineClient(config.url, config.apiKey);
  const server = createServer(client, config.toolGroups);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 2: Build testen**

Run: `npm run build`
Expected: Fehler wegen server.ts (wird in Task 3.3 gefixt)

---

## Task 3.3: Server anpassen

**Files:**
- Modify: `src/server.ts`

**Step 1: Passe createServer an für Tool-Gruppen**

Ersetze die gesamte Datei:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RedmineClient } from "./redmine/client.js";
import { registerTools, type ToolGroup } from "./tools/index.js";

export function createServer(
  redmineClient: RedmineClient,
  toolGroups: ToolGroup[]
): McpServer {
  const server = new McpServer({
    name: "redmine-mcp",
    version: "0.2.0",
  });

  registerTools(server, redmineClient, toolGroups);

  return server;
}
```

**Step 2: Build testen**

Run: `npm run build`
Expected: Erfolgreich

---

## Verification

Nach Abschluss dieser Phase:
1. `npm run build` muss erfolgreich sein
2. `node dist/index.js --help` zeigt Hilfe mit Tool-Gruppen
3. Ungültige Gruppen werden mit Fehlermeldung abgelehnt
