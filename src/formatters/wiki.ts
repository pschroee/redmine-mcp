import type { RedmineWikiPage, RedmineWikiPageIndex, RedmineWikiPagesResponse } from "../redmine/types.js";

/**
 * Format a date string to readable format (YYYY-MM-DD)
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 10);
}

/**
 * Format a single wiki page as Markdown
 */
export function formatWikiPage(response: { wiki_page: RedmineWikiPage }): string {
  const page = response.wiki_page;
  const lines: string[] = [];

  // Title
  lines.push(`# ${page.title}`);
  lines.push("");

  // Metadata line
  const metaParts: string[] = [];
  metaParts.push(`**Version:** ${page.version}`);
  metaParts.push(`**Author:** ${page.author.name}`);
  metaParts.push(`**Updated:** ${formatDate(page.updated_on)}`);
  if (page.parent) {
    metaParts.push(`**Parent:** ${page.parent.title}`);
  }
  lines.push(metaParts.join(" | "));
  lines.push("");

  // Separator
  lines.push("---");
  lines.push("");

  // Content
  lines.push(page.text);
  lines.push("");

  // Attachments
  if (page.attachments && page.attachments.length > 0) {
    lines.push("## Attachments");
    lines.push("");
    for (const att of page.attachments) {
      lines.push(`- [${att.filename}](${att.content_url}) (${att.filesize} bytes)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Build a tree structure from flat wiki page list
 */
function buildWikiTree(pages: RedmineWikiPageIndex[]): Map<string | null, RedmineWikiPageIndex[]> {
  const tree = new Map<string | null, RedmineWikiPageIndex[]>();

  for (const page of pages) {
    const parentTitle = page.parent?.title ?? null;
    if (!tree.has(parentTitle)) {
      tree.set(parentTitle, []);
    }
    tree.get(parentTitle)!.push(page);
  }

  return tree;
}

/**
 * Recursively format wiki pages as tree
 */
function formatWikiTree(
  tree: Map<string | null, RedmineWikiPageIndex[]>,
  parentTitle: string | null,
  indent: number
): string[] {
  const lines: string[] = [];
  const children = tree.get(parentTitle) || [];

  for (const page of children) {
    const prefix = "  ".repeat(indent);
    lines.push(`${prefix}- **${page.title}** (v${page.version})`);
    
    // Recursively add children
    const childLines = formatWikiTree(tree, page.title, indent + 1);
    lines.push(...childLines);
  }

  return lines;
}

/**
 * Format wiki pages list as Markdown
 */
export function formatWikiPageList(response: RedmineWikiPagesResponse): string {
  const pages = response.wiki_pages;
  const lines: string[] = [];

  // Header
  lines.push(`# Wiki Pages (${pages.length})`);
  lines.push("");

  // Empty case
  if (pages.length === 0) {
    lines.push("No wiki pages found.");
    return lines.join("\n");
  }

  // Build tree and format
  const tree = buildWikiTree(pages);
  const treeLines = formatWikiTree(tree, null, 0);
  lines.push(...treeLines);

  return lines.join("\n");
}
