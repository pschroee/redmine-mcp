#!/usr/bin/env node

import { createRequire } from "module";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RedmineClient } from "./redmine/client.js";
import { createServer } from "./server.js";
import { resolveGroups, ALL_GROUPS, PLUGIN_GROUPS, type ToolGroup } from "./tools/index.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { name: string; version: string };

interface Config {
  url: string;
  apiKey: string;
  toolGroups: ToolGroup[];
}

function printVersion(): void {
  console.log(`${packageJson.name} v${packageJson.version}`);
}

function printHelp(): void {
  console.log(`
Redmine MCP Server v${packageJson.version}

Usage: redmine-mcp [options]

Options:
  --url=<url>           Redmine URL (or set REDMINE_URL)
  --api-key=<key>       API Key (or set REDMINE_API_KEY)
  --tools=<groups>      Comma-separated list of tool groups to enable
  --exclude=<groups>    Comma-separated list of tool groups to exclude
  --version, -v         Show version number
  --help                Show this help message

Tool Groups (all enabled by default):
  ${ALL_GROUPS.join(", ")}

Note: Plugin groups (${PLUGIN_GROUPS.join(", ")}) require RedmineUP plugins installed.

Examples:
  redmine-mcp --url=https://redmine.example.com --api-key=abc123
  redmine-mcp --tools=core,metadata
  redmine-mcp --exclude=wiki,files,plugin_checklists,plugin_agile
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

    if (arg === "--version" || arg === "-v") {
      printVersion();
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
  const server = createServer(client, config.toolGroups, packageJson.version);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
