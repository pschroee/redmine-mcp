import type { RedmineProject, RedmineProjectsResponse } from "../redmine/types.js";
import { formatDate } from "./utils.js";

const PROJECT_STATUS: Record<number, string> = {
  1: "Active",
  5: "Closed",
  9: "Archived",
};

/**
 * Format a single project as complete Markdown
 */
export function formatProject(response: { project: RedmineProject }): string {
  const project = response.project;
  const lines: string[] = [];

  // Title
  lines.push(`# ${project.name}`);
  lines.push("");

  // Status line
  const statusParts: string[] = [];
  statusParts.push(`**Identifier:** ${project.identifier}`);
  statusParts.push(`**Status:** ${PROJECT_STATUS[project.status] || "Unknown"}`);
  statusParts.push(`**Public:** ${project.is_public ? "Yes" : "No"}`);
  lines.push(statusParts.join(" | "));
  lines.push("");

  // Description
  if (project.description) {
    lines.push("## Description");
    lines.push("");
    lines.push(project.description);
    lines.push("");
  }

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  if (project.parent) {
    lines.push(`| Parent | ${project.parent.name} |`);
  }
  if (project.homepage) {
    lines.push(`| Homepage | ${project.homepage} |`);
  }
  lines.push(`| Created | ${formatDate(project.created_on)} |`);
  lines.push(`| Updated | ${formatDate(project.updated_on)} |`);
  lines.push("");

  // Trackers
  if (project.trackers && project.trackers.length > 0) {
    lines.push("## Trackers");
    lines.push("");
    for (const tracker of project.trackers) {
      lines.push(`- ${tracker.name}`);
    }
    lines.push("");
  }

  // Enabled modules
  if (project.enabled_modules && project.enabled_modules.length > 0) {
    lines.push("## Enabled Modules");
    lines.push("");
    for (const mod of project.enabled_modules) {
      lines.push(`- ${mod.name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format a list of projects as Markdown
 */
export function formatProjectList(response: RedmineProjectsResponse): string {
  const lines: string[] = [];

  lines.push(`# Projects (${response.total_count})`);
  lines.push("");

  if (response.projects.length === 0) {
    lines.push("No projects found.");
    return lines.join("\n");
  }

  // Table header
  lines.push("| Name | Identifier | Status | Public |");
  lines.push("|------|------------|--------|--------|");

  for (const project of response.projects) {
    const status = PROJECT_STATUS[project.status] || "Unknown";
    const isPublic = project.is_public ? "Yes" : "No";
    lines.push(`| ${project.name} | ${project.identifier} | ${status} | ${isPublic} |`);
  }

  return lines.join("\n");
}
