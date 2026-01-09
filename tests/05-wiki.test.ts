import { describe, it, expect } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

describe("wiki", () => {
  describe("list_wiki_pages", () => {
    it("should list wiki pages (initially empty)", async () => {
      const result = await client.listWikiPages(state.projectId);

      expect(result.wiki_pages).toBeDefined();
      expect(Array.isArray(result.wiki_pages)).toBe(true);
    });

    it("should fail for nonexistent project", async () => {
      const result = (await client.listWikiPages("nonexistent-xyz")) as {
        error?: boolean;
        status?: number;
      };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("create_wiki_page", () => {
    it("should create wiki page", async () => {
      const result = (await client.createOrUpdateWikiPage(
        state.projectId,
        "TestPage",
        { text: "# Test Wiki Page\n\nThis is content." }
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
      state.wikiPageName = "TestPage";

      // Verify by fetching
      const page = await client.getWikiPage(state.projectId, "TestPage", {});
      expect(page.wiki_page).toBeDefined();
      expect(page.wiki_page.text).toContain("Test Wiki Page");
    });

    it("should create wiki page with comment", async () => {
      const result = (await client.createOrUpdateWikiPage(
        state.projectId,
        "PageWithComment",
        {
          text: "Content with comment",
          comments: "Initial creation",
        }
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);

      // Verify by fetching
      const page = await client.getWikiPage(state.projectId, "PageWithComment", {});
      expect(page.wiki_page).toBeDefined();
    });

    it("should create child wiki page", async () => {
      const result = (await client.createOrUpdateWikiPage(
        state.projectId,
        "ChildPage",
        {
          text: "Child page content",
          parent_title: "TestPage",
        }
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
      state.childWikiPageName = "ChildPage";

      // Verify by fetching
      const page = await client.getWikiPage(state.projectId, "ChildPage", {});
      expect(page.wiki_page).toBeDefined();
    });
  });

  describe("list_wiki_pages (with data)", () => {
    it("should list created wiki pages", async () => {
      const result = await client.listWikiPages(state.projectId);

      expect(result.wiki_pages).toBeDefined();
      expect(result.wiki_pages.length).toBeGreaterThan(0);
    });
  });

  describe("get_wiki_page", () => {
    it("should get wiki page", async () => {
      const result = await client.getWikiPage(state.projectId, state.wikiPageName, {});

      expect(result.wiki_page).toBeDefined();
      expect(result.wiki_page.title).toBe(state.wikiPageName);
      expect(result.wiki_page.text).toContain("Test Wiki Page");
    });

    it("should get wiki page with attachments include", async () => {
      const result = await client.getWikiPage(
        state.projectId,
        state.wikiPageName,
        { include: "attachments" }
      );

      expect(result.wiki_page).toBeDefined();
      expect(result.wiki_page.attachments).toBeDefined();
    });

    it("should fail for nonexistent page", async () => {
      const result = (await client.getWikiPage(
        state.projectId,
        "NonexistentPage123",
        {}
      )) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });

  describe("update_wiki_page", () => {
    it("should update wiki page", async () => {
      const result = (await client.createOrUpdateWikiPage(
        state.projectId,
        state.wikiPageName,
        { text: "# Updated Content\n\nNew text." }
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);

      // Verify by fetching
      const page = await client.getWikiPage(state.projectId, state.wikiPageName, {});
      expect(page.wiki_page.text).toContain("Updated Content");
    });

    it("should update with comment", async () => {
      const result = (await client.createOrUpdateWikiPage(
        state.projectId,
        state.wikiPageName,
        {
          text: "# Final Content",
          comments: "Updated via test",
        }
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);

      // Verify by fetching
      const page = await client.getWikiPage(state.projectId, state.wikiPageName, {});
      expect(page.wiki_page.text).toContain("Final Content");
    });
  });

  describe("delete_wiki_page", () => {
    it("should delete child wiki page", async () => {
      const result = (await client.deleteWikiPage(
        state.projectId,
        state.childWikiPageName
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should delete wiki page with comment", async () => {
      const result = (await client.deleteWikiPage(
        state.projectId,
        "PageWithComment"
      )) as { error?: boolean };

      expect(result.error).not.toBe(true);
    });

    it("should fail for nonexistent page", async () => {
      const result = (await client.deleteWikiPage(
        state.projectId,
        "NonexistentPage999"
      )) as { error?: boolean; status?: number };
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
});
