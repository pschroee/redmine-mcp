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
