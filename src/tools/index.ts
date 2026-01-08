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
