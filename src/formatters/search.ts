import type { RedmineSearchResponse, RedmineSearchResult } from "../redmine/types.js";
import { formatDateShort, truncate } from "./utils.js";

/**
 * Get icon for search result type
 */
function getTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "issue":
      return "\u{1F3AB}"; // ticket
    case "wiki-page":
      return "\u{1F4C4}"; // page
    case "project":
      return "\u{1F4C1}"; // folder
    default:
      return "\u{1F4CB}"; // clipboard
  }
}

/**
 * Format a single search result as Markdown
 */
function formatSearchResult(result: RedmineSearchResult): string {
  const lines: string[] = [];
  const icon = getTypeIcon(result.type);

  // Title with icon
  lines.push(`### ${icon} ${result.title}`);

  // Type and date metadata
  lines.push(`**Type:** ${result.type} | **Date:** ${formatDateShort(result.datetime)}`);

  // Description (truncated)
  if (result.description) {
    lines.push("");
    lines.push(truncate(result.description, 200));
  }

  return lines.join("\n");
}

/**
 * Format search results as Markdown
 */
export function formatSearchResults(response: RedmineSearchResponse): string {
  const { results, total_count, offset } = response;
  const lines: string[] = [];

  // Header with count
  lines.push(`# Search Results (${results.length} of ${total_count})`);
  lines.push("");

  // Offset info if applicable
  if (offset > 0) {
    lines.push(`_Starting from result ${offset + 1}_`);
    lines.push("");
  }

  // Empty case
  if (results.length === 0) {
    lines.push("No results found.");
    return lines.join("\n");
  }

  // Format each result
  for (let i = 0; i < results.length; i++) {
    if (i > 0) {
      lines.push("");
    }
    lines.push(formatSearchResult(results[i]));
  }

  return lines.join("\n");
}
