import { config } from "dotenv";
import { RedmineClient } from "../src/redmine/client.js";

config();

// Track created resources for cleanup
const createdProjects: string[] = [];

export default async function globalSetup() {
  const client = new RedmineClient(
    process.env.REDMINE_URL!,
    process.env.REDMINE_API_KEY!
  );

  // Clean up any leftover test projects from previous runs
  const projects = await client.listProjects({});
  if (projects.projects) {
    for (const project of projects.projects) {
      if (
        project.identifier.startsWith("test-project-") ||
        project.identifier.startsWith("full-project-") ||
        project.identifier.startsWith("subproject-")
      ) {
        try {
          await client.deleteProject(project.identifier);
        } catch {
          // Ignore errors
        }
      }
    }
  }

  // Create main test project with all modules enabled
  const identifier = `test-project-${Date.now()}`;
  const result = await client.createProject({
    name: `Test Project ${Date.now()}`,
    identifier,
    enabled_module_names: ["issue_tracking", "wiki", "files"],
  });

  if (!result.project) {
    throw new Error("Failed to create test project");
  }

  createdProjects.push(identifier);

  // Store in environment for test files to access
  process.env.TEST_PROJECT_ID = identifier;
  process.env.TEST_PROJECT_NUMERIC_ID = String(result.project.id);

  // Return teardown function
  return async () => {
    // Delete all test projects
    const projectsToDelete = await client.listProjects({});
    if (projectsToDelete.projects) {
      for (const project of projectsToDelete.projects) {
        if (
          project.identifier.startsWith("test-project-") ||
          project.identifier.startsWith("full-project-") ||
          project.identifier.startsWith("subproject-")
        ) {
          try {
            await client.deleteProject(project.identifier);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  };
}
