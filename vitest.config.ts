import { defineConfig } from "vitest/config";
import type { TestSequencer, WorkspaceSpec } from "vitest/node";

// Custom sequencer to run tests in the exact order specified in include
class OrderedSequencer implements TestSequencer {
  sort(files: WorkspaceSpec[]): WorkspaceSpec[] | Promise<WorkspaceSpec[]> {
    const order = [
      "01-account",
      "02-core",
      "03-metadata",
      "04-relations",
      "05-wiki",
      "06-files",
      "07-search",
      "08-enumerations",
      "09-time",
      "10-roles",
      "11-admin",
      "12-memberships",
    ];

    return files.sort((a, b) => {
      const aName = a.moduleId.split("/").pop()?.replace(".test.ts", "") || "";
      const bName = b.moduleId.split("/").pop()?.replace(".test.ts", "") || "";
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }

  shard(files: WorkspaceSpec[]): WorkspaceSpec[] | Promise<WorkspaceSpec[]> {
    return files;
  }
}

export default defineConfig({
  test: {
    isolate: false,
    fileParallelism: false,
    sequence: {
      sequencer: OrderedSequencer,
    },
    testTimeout: 10000,
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/01-account.test.ts",
      "tests/02-core.test.ts",
      "tests/03-metadata.test.ts",
      "tests/04-relations.test.ts",
      "tests/05-wiki.test.ts",
      "tests/06-files.test.ts",
      "tests/07-search.test.ts",
      "tests/08-enumerations.test.ts",
      "tests/09-time.test.ts",
      "tests/10-roles.test.ts",
      "tests/11-admin.test.ts",
      "tests/12-memberships.test.ts",
    ],
  },
});
