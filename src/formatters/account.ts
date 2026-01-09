import type { RedmineMyAccountResponse } from "../redmine/types.js";

const USER_STATUS: Record<number, string> = {
  1: "Active",
  2: "Registered",
  3: "Locked",
};

function formatDate(isoDate: string): string {
  return isoDate.slice(0, 16).replace("T", " ");
}

export function formatMyAccount(response: RedmineMyAccountResponse): string {
  const user = response.user;
  const lines: string[] = [];

  lines.push(`# ${user.firstname} ${user.lastname}`);
  lines.push("");

  const statusParts: string[] = [];
  statusParts.push(`**Login:** ${user.login}`);
  if (user.status !== undefined) {
    statusParts.push(`**Status:** ${USER_STATUS[user.status] || "Unknown"}`);
  }
  if (user.admin) {
    statusParts.push(`**Role:** Admin`);
  }
  lines.push(statusParts.join(" | "));
  lines.push("");

  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Email | ${user.mail} |`);
  lines.push(`| Created | ${formatDate(user.created_on)} |`);
  if (user.last_login_on) {
    lines.push(`| Last Login | ${formatDate(user.last_login_on)} |`);
  }
  if (user.twofa_scheme) {
    lines.push(`| 2FA | ${user.twofa_scheme} |`);
  }
  if (user.api_key) {
    lines.push(`| API Key | ${user.api_key} |`);
  }
  lines.push("");

  if (user.custom_fields && user.custom_fields.length > 0) {
    lines.push("## Custom Fields");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("|-------|-------|");
    for (const cf of user.custom_fields) {
      const value = Array.isArray(cf.value) ? cf.value.join(", ") : cf.value;
      lines.push(`| ${cf.name} | ${value} |`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
