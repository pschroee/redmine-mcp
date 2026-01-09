import { describe, it, expect } from "vitest";
import { client } from "./setup.js";

describe("search", () => {
  describe("search", () => {
    it("should search with basic query", async () => {
      const result = await client.search({ q: "Test" });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should search with all_words true", async () => {
      const result = await client.search({
        q: "Test Issue",
        all_words: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with all_words false", async () => {
      const result = await client.search({
        q: "Test Issue",
        all_words: false,
      });

      expect(result.results).toBeDefined();
    });

    it("should search titles only", async () => {
      const result = await client.search({
        q: "Test",
        titles_only: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search open issues only", async () => {
      const result = await client.search({
        q: "Test",
        open_issues: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search issues only", async () => {
      const result = await client.search({
        q: "Test",
        issues: true,
        wiki_pages: false,
        projects: false,
      });

      expect(result.results).toBeDefined();
    });

    it("should search wiki only", async () => {
      const result = await client.search({
        q: "Test",
        issues: false,
        wiki_pages: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search projects only", async () => {
      const result = await client.search({
        q: "Test",
        issues: false,
        projects: true,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with scope my_projects", async () => {
      const result = await client.search({
        q: "Test",
        scope: "my_projects",
      });

      expect(result.results).toBeDefined();
    });

    it("should search with limit", async () => {
      const result = await client.search({
        q: "Test",
        limit: 1,
      });

      expect(result.results).toBeDefined();
    });

    it("should search with offset", async () => {
      const result = await client.search({
        q: "Test",
        offset: 1,
      });

      expect(result.results).toBeDefined();
    });

    it("should return empty for nonexistent query", async () => {
      const result = await client.search({
        q: "xyznonexistent123456789",
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(0);
    });
  });
});
