import type { RedmineAttachment, RedmineFilesResponse } from "../redmine/types.js";
import { formatDate, formatDateShort } from "./utils.js";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatAttachment(response: { attachment: RedmineAttachment }): string {
  const att = response.attachment;
  const lines: string[] = [];

  lines.push(`# ${att.filename}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| ID | ${att.id} |`);
  lines.push(`| Size | ${formatFileSize(att.filesize)} |`);
  lines.push(`| Type | ${att.content_type} |`);
  lines.push(`| Author | ${att.author.name} |`);
  lines.push(`| Created | ${formatDate(att.created_on)} |`);
  if (att.description) {
    lines.push(`| Description | ${att.description} |`);
  }
  lines.push("");
  lines.push(`**Download:** ${att.content_url}`);

  if (att.thumbnail_url) {
    lines.push("");
    lines.push(`**Thumbnail:** ${att.thumbnail_url}`);
  }

  return lines.join("\n");
}

export function formatFileList(response: RedmineFilesResponse): string {
  const files = response.files;

  if (files.length === 0) {
    return "No files found.";
  }

  const lines: string[] = [];
  const hasVersion = files.some((f) => f.version !== undefined);

  lines.push(`# Project Files (${files.length})`);
  lines.push("");

  if (hasVersion) {
    lines.push("| Filename | Size | Version | Downloads | Author | Date |");
    lines.push("|----------|------|---------|-----------|--------|------|");
  } else {
    lines.push("| Filename | Size | Downloads | Author | Date |");
    lines.push("|----------|------|-----------|--------|------|");
  }

  for (const file of files) {
    const size = formatFileSize(file.filesize);
    const date = formatDateShort(file.created_on);
    if (hasVersion) {
      const version = file.version?.name || "";
      lines.push(`| ${file.filename} | ${size} | ${version} | ${file.downloads} | ${file.author.name} | ${date} |`);
    } else {
      lines.push(`| ${file.filename} | ${size} | ${file.downloads} | ${file.author.name} | ${date} |`);
    }
  }

  return lines.join("\n");
}
