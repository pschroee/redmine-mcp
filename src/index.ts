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
