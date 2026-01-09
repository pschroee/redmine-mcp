import type {
  RedmineAgileSprint,
  RedmineAgileSprintsResponse,
  RedmineAgileDataResponse,
} from "../redmine/types.js";

export function formatSprint(response: { agile_sprint: RedmineAgileSprint }): string {
  const sprint = response.agile_sprint;
  const lines: string[] = [];

  lines.push(`# ${sprint.name}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| ID | ${sprint.id} |`);
  lines.push(`| Status | ${sprint.status} |`);
  if (sprint.start_date) {
    lines.push(`| Start Date | ${sprint.start_date} |`);
  }
  if (sprint.end_date) {
    lines.push(`| End Date | ${sprint.end_date} |`);
  }
  if (sprint.description) {
    lines.push(`| Description | ${sprint.description} |`);
  }

  return lines.join("\n");
}

export function formatSprintList(response: RedmineAgileSprintsResponse): string {
  const sprints = response.agile_sprints;

  if (sprints.length === 0) {
    return "No sprints found.";
  }

  const lines: string[] = [];

  lines.push(`# Agile Sprints (${sprints.length})`);
  lines.push("");
  lines.push("| ID | Name | Status | Start | End |");
  lines.push("|----|------|--------|-------|-----|");

  for (const sprint of sprints) {
    const start = sprint.start_date || "-";
    const end = sprint.end_date || "-";
    lines.push(`| ${sprint.id} | ${sprint.name} | ${sprint.status} | ${start} | ${end} |`);
  }

  return lines.join("\n");
}

export function formatAgileData(response: RedmineAgileDataResponse): string {
  const data = response.agile_data;
  const lines: string[] = [];

  lines.push(`# Agile Data for Issue #${data.issue_id}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Position | ${data.position} |`);
  if (data.story_points !== undefined) {
    lines.push(`| Story Points | ${data.story_points} |`);
  }
  if (data.agile_sprint_id !== undefined) {
    lines.push(`| Sprint ID | ${data.agile_sprint_id} |`);
  }

  return lines.join("\n");
}
