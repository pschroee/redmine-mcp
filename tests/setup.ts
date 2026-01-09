import { config } from "dotenv";
import { RedmineClient } from "../src/redmine/client.js";
import { state } from "./state.js";

config();

if (!process.env.REDMINE_URL || !process.env.REDMINE_API_KEY) {
  throw new Error("Missing REDMINE_URL or REDMINE_API_KEY in environment");
}

export const client = new RedmineClient(
  process.env.REDMINE_URL,
  process.env.REDMINE_API_KEY
);

// Initialize state from environment (set by globalSetup)
if (process.env.TEST_PROJECT_ID) {
  state.projectId = process.env.TEST_PROJECT_ID;
}
if (process.env.TEST_PROJECT_NUMERIC_ID) {
  state.projectNumericId = parseInt(process.env.TEST_PROJECT_NUMERIC_ID, 10);
}
