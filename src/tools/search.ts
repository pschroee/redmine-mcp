import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RedmineClient } from "../redmine/client.js";
import { formatSearchResults } from "../formatters/index.js";

export function registerSearchTools(
  server: McpServer,
  client: RedmineClient
): void {
  server.registerTool(
    "search",
    {
      description: "Search across Redmine (issues, wiki, news, etc.)",
      inputSchema: {
        q: z.string().describe("Search query"),
        scope: z.enum(["all", "my_projects", "subprojects"]).optional().describe("Search scope"),
        all_words: z.boolean().optional().describe("Match all words (default true)"),
        titles_only: z.boolean().optional().describe("Search only in titles"),
        open_issues: z.boolean().optional().describe("Only open issues"),
        attachments: z.enum(["0", "1", "only"]).optional().describe("Search attachments: 0=no, 1=yes, only=only attachments"),
        issues: z.boolean().optional().describe("Include issues in results"),
        news: z.boolean().optional().describe("Include news in results"),
        documents: z.boolean().optional().describe("Include documents in results"),
        changesets: z.boolean().optional().describe("Include changesets in results"),
        wiki_pages: z.boolean().optional().describe("Include wiki pages in results"),
        messages: z.boolean().optional().describe("Include forum messages in results"),
        projects: z.boolean().optional().describe("Include projects in results"),
        limit: z.number().optional().describe("Maximum results"),
        offset: z.number().optional().describe("Skip first N results"),
      },
    },
    async (params) => {
      const result = await client.search(params);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
      return {
        content: [{ type: "text", text: formatSearchResults(result) }],
      };
    }
  );
}
