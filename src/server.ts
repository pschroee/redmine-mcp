import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RedmineClient } from "./redmine/client.js";
import { registerTools, type ToolGroup } from "./tools/index.js";

export function createServer(
  redmineClient: RedmineClient,
  toolGroups: ToolGroup[]
): McpServer {
  const server = new McpServer({
    name: "redmine-mcp",
    version: "0.4.1",
  });

  registerTools(server, redmineClient, toolGroups);

  return server;
}
