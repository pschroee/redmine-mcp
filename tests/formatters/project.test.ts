import { describe, expect, test } from "vitest";
import { formatProject, formatProjectList } from "../../src/formatters/project.js";
import type { RedmineProject, RedmineProjectsResponse } from "../../src/redmine/types.js";

const baseProject: RedmineProject = {
  id: 1,
  name: "Test Project",
  identifier: "test-project",
  status: 1,
  is_public: true,
  created_on: "2024-01-15T10:30:00Z",
  updated_on: "2024-01-20T14:45:00Z",
};

describe("formatProject", () => {
  test("formats basic project", () => {
    const result = formatProject({ project: baseProject });

    expect(result).toContain("# Test Project");
    expect(result).toContain("**Identifier:** test-project");
    expect(result).toContain("**Status:** Active");
    expect(result).toContain("**Public:** Yes");
    expect(result).toContain("| Created | 2024-01-15 10:30 |");
    expect(result).toContain("| Updated | 2024-01-20 14:45 |");
  });

  test("formats private project", () => {
    const project: RedmineProject = { ...baseProject, is_public: false };
    const result = formatProject({ project });

    expect(result).toContain("**Public:** No");
  });

  test("formats closed project", () => {
    const project: RedmineProject = { ...baseProject, status: 5 };
    const result = formatProject({ project });

    expect(result).toContain("**Status:** Closed");
  });

  test("formats archived project", () => {
    const project: RedmineProject = { ...baseProject, status: 9 };
    const result = formatProject({ project });

    expect(result).toContain("**Status:** Archived");
  });

  test("formats unknown status", () => {
    const project: RedmineProject = { ...baseProject, status: 99 };
    const result = formatProject({ project });

    expect(result).toContain("**Status:** Unknown");
  });

  test("formats project with description", () => {
    const project: RedmineProject = {
      ...baseProject,
      description: "This is a test project description.",
    };
    const result = formatProject({ project });

    expect(result).toContain("## Description");
    expect(result).toContain("This is a test project description.");
  });

  test("formats project with parent", () => {
    const project: RedmineProject = {
      ...baseProject,
      parent: { id: 2, name: "Parent Project" },
    };
    const result = formatProject({ project });

    expect(result).toContain("| Parent | Parent Project |");
  });

  test("formats project with homepage", () => {
    const project: RedmineProject = {
      ...baseProject,
      homepage: "https://example.com",
    };
    const result = formatProject({ project });

    expect(result).toContain("| Homepage | https://example.com |");
  });

  test("formats project with trackers", () => {
    const project: RedmineProject = {
      ...baseProject,
      trackers: [
        { id: 1, name: "Bug" },
        { id: 2, name: "Feature" },
        { id: 3, name: "Support" },
      ],
    };
    const result = formatProject({ project });

    expect(result).toContain("## Trackers");
    expect(result).toContain("- Bug");
    expect(result).toContain("- Feature");
    expect(result).toContain("- Support");
  });

  test("formats project with enabled modules", () => {
    const project: RedmineProject = {
      ...baseProject,
      enabled_modules: [
        { id: 1, name: "issue_tracking" },
        { id: 2, name: "wiki" },
        { id: 3, name: "time_tracking" },
      ],
    };
    const result = formatProject({ project });

    expect(result).toContain("## Enabled Modules");
    expect(result).toContain("- issue_tracking");
    expect(result).toContain("- wiki");
    expect(result).toContain("- time_tracking");
  });

  test("formats full project with all fields", () => {
    const project: RedmineProject = {
      ...baseProject,
      description: "Full project description",
      homepage: "https://full.example.com",
      parent: { id: 10, name: "Full Parent" },
      trackers: [{ id: 1, name: "Bug" }],
      enabled_modules: [{ id: 1, name: "wiki" }],
    };
    const result = formatProject({ project });

    expect(result).toContain("# Test Project");
    expect(result).toContain("**Identifier:** test-project");
    expect(result).toContain("## Description");
    expect(result).toContain("Full project description");
    expect(result).toContain("| Parent | Full Parent |");
    expect(result).toContain("| Homepage | https://full.example.com |");
    expect(result).toContain("## Trackers");
    expect(result).toContain("- Bug");
    expect(result).toContain("## Enabled Modules");
    expect(result).toContain("- wiki");
  });
});

describe("formatProjectList", () => {
  test("formats empty project list", () => {
    const response: RedmineProjectsResponse = {
      projects: [],
      total_count: 0,
      offset: 0,
      limit: 25,
    };
    const result = formatProjectList(response);

    expect(result).toContain("# Projects (0)");
    expect(result).toContain("No projects found.");
  });

  test("formats single project list", () => {
    const response: RedmineProjectsResponse = {
      projects: [baseProject],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatProjectList(response);

    expect(result).toContain("# Projects (1)");
    expect(result).toContain("| Name | Identifier | Status | Public |");
    expect(result).toContain("| Test Project | test-project | Active | Yes |");
  });

  test("formats multiple projects", () => {
    const response: RedmineProjectsResponse = {
      projects: [
        baseProject,
        {
          ...baseProject,
          id: 2,
          name: "Second Project",
          identifier: "second-project",
          is_public: false,
          status: 5,
        },
        {
          ...baseProject,
          id: 3,
          name: "Third Project",
          identifier: "third-project",
          status: 9,
        },
      ],
      total_count: 3,
      offset: 0,
      limit: 25,
    };
    const result = formatProjectList(response);

    expect(result).toContain("# Projects (3)");
    expect(result).toContain("| Test Project | test-project | Active | Yes |");
    expect(result).toContain("| Second Project | second-project | Closed | No |");
    expect(result).toContain("| Third Project | third-project | Archived | Yes |");
  });

  test("uses total_count from response", () => {
    const response: RedmineProjectsResponse = {
      projects: [baseProject],
      total_count: 100,
      offset: 0,
      limit: 25,
    };
    const result = formatProjectList(response);

    expect(result).toContain("# Projects (100)");
  });

  test("handles unknown status in list", () => {
    const response: RedmineProjectsResponse = {
      projects: [{ ...baseProject, status: 99 }],
      total_count: 1,
      offset: 0,
      limit: 25,
    };
    const result = formatProjectList(response);

    expect(result).toContain("| Test Project | test-project | Unknown | Yes |");
  });
});
