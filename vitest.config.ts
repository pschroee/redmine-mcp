import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    sequence: { shuffle: false },
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
    ],
  },
});
