import { describe, it, expect, beforeAll } from "vitest";
import { client } from "./setup.js";
import { state } from "./state.js";

// Local state for relation tests - we need two issues
let relationIssue1: number;
let relationIssue2: number;

describe("relations", () => {
  // Create issues for relation tests
  beforeAll(async () => {
    // Create first issue for relations
    const result1 = await client.createIssue({
      project_id: state.projectId,
      subject: `Relations Test Issue 1 - ${Date.now()}`,
      tracker_id: 1,
    });
    if (result1.issue) {
      relationIssue1 = result1.issue.id;
    }

    // Create second issue for relations
    const result2 = await client.createIssue({
      project_id: state.projectId,
      subject: `Relations Test Issue 2 - ${Date.now()}`,
      tracker_id: 1,
    });
    if (result2.issue) {
      relationIssue2 = result2.issue.id;
    }
  });

  describe("versions", () => {
    describe("create_version", () => {
      it("should create version with minimal fields", async () => {
        const result = await client.createVersion(state.projectId, {
          name: "v1.0.0",
        });

        expect(result.version).toBeDefined();
        expect(result.version.id).toBeGreaterThan(0);
        expect(result.version.name).toBe("v1.0.0");
        expect(result.version.status).toBe("open");

        state.versionId = result.version.id;
      });

      it("should create version with all fields", async () => {
        const result = await client.createVersion(state.projectId, {
          name: "v2.0.0",
          status: "open",
          sharing: "none",
          due_date: "2025-12-31",
          description: "Second major version",
          wiki_page_title: "Version_2_0_0",
        });

        expect(result.version).toBeDefined();
        expect(result.version.id).toBeGreaterThan(0);
        expect(result.version.name).toBe("v2.0.0");
        expect(result.version.description).toBe("Second major version");
        expect(result.version.due_date).toBe("2025-12-31");

        state.secondVersionId = result.version.id;
      });
    });

    describe("list_versions", () => {
      it("should list project versions", async () => {
        const result = await client.listVersions(state.projectId);

        expect(result.versions).toBeDefined();
        expect(Array.isArray(result.versions)).toBe(true);
        expect(result.versions.length).toBeGreaterThanOrEqual(2);

        const versionIds = result.versions.map((v) => v.id);
        expect(versionIds).toContain(state.versionId);
        expect(versionIds).toContain(state.secondVersionId);
      });
    });

    describe("get_version", () => {
      it("should get version by id", async () => {
        const result = await client.getVersion(state.versionId);

        expect(result.version).toBeDefined();
        expect(result.version.id).toBe(state.versionId);
        expect(result.version.name).toBe("v1.0.0");
      });

      it("should fail for nonexistent version", async () => {
        const result = (await client.getVersion(999999)) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });

    describe("update_version", () => {
      it("should update version name", async () => {
        const result = await client.updateVersion(state.versionId, {
          name: "v1.0.1",
        });

        expect(result).toBeDefined();

        const verify = await client.getVersion(state.versionId);
        expect(verify.version.name).toBe("v1.0.1");
      });

      it("should update version status to locked", async () => {
        const result = await client.updateVersion(state.versionId, {
          status: "locked",
        });

        expect(result).toBeDefined();

        const verify = await client.getVersion(state.versionId);
        expect(verify.version.status).toBe("locked");
      });

      it("should update version status to closed", async () => {
        const result = await client.updateVersion(state.versionId, {
          status: "closed",
        });

        expect(result).toBeDefined();

        const verify = await client.getVersion(state.versionId);
        expect(verify.version.status).toBe("closed");
      });

      it("should update version sharing", async () => {
        const result = await client.updateVersion(state.secondVersionId, {
          sharing: "descendants",
        });

        expect(result).toBeDefined();

        const verify = await client.getVersion(state.secondVersionId);
        expect(verify.version.sharing).toBe("descendants");
      });

      it("should fail for nonexistent version", async () => {
        const result = (await client.updateVersion(999999, { name: "Test" })) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });

    describe("assign_issue_to_version", () => {
      it("should assign issue to version", async () => {
        const result = await client.updateIssue(relationIssue1, {
          fixed_version_id: state.secondVersionId,
        });

        expect(result).toBeDefined();

        const verify = await client.getIssue(relationIssue1);
        expect(verify.issue.fixed_version).toBeDefined();
        expect(verify.issue.fixed_version.id).toBe(state.secondVersionId);
      });
    });

    describe("delete_version", () => {
      it("should delete version", async () => {
        const result = await client.deleteVersion(state.versionId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent version", async () => {
        const result = (await client.deleteVersion(999999)) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });
  });

  describe("issue_relations", () => {
    describe("create_issue_relation", () => {
      it("should create relates relation", async () => {
        const result = await client.createIssueRelation(relationIssue1, {
          issue_to_id: relationIssue2,
          relation_type: "relates",
        });

        expect(result.relation).toBeDefined();
        expect(result.relation.id).toBeGreaterThan(0);
        expect(result.relation.issue_id).toBe(relationIssue1);
        expect(result.relation.issue_to_id).toBe(relationIssue2);
        expect(result.relation.relation_type).toBe("relates");

        state.relationId = result.relation.id;
      });

      it("should fail to create relation to same issue", async () => {
        const result = (await client.createIssueRelation(relationIssue1, {
          issue_to_id: relationIssue1,
          relation_type: "relates",
        })) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(422);
      });
    });

    describe("list_issue_relations", () => {
      it("should list issue relations", async () => {
        const result = await client.listIssueRelations(relationIssue1);

        expect(result.relations).toBeDefined();
        expect(Array.isArray(result.relations)).toBe(true);
        expect(result.relations.length).toBeGreaterThanOrEqual(1);

        const relationIds = result.relations.map((r) => r.id);
        expect(relationIds).toContain(state.relationId);
      });
    });

    describe("get_relation", () => {
      it("should get relation by id", async () => {
        const result = await client.getRelation(state.relationId);

        expect(result.relation).toBeDefined();
        expect(result.relation.id).toBe(state.relationId);
        expect(result.relation.relation_type).toBe("relates");
      });

      it("should fail for nonexistent relation", async () => {
        const result = (await client.getRelation(999999)) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });

    describe("delete_relation", () => {
      it("should delete relation", async () => {
        const result = await client.deleteRelation(state.relationId);

        expect(result).toBeDefined();
      });

      it("should fail for nonexistent relation", async () => {
        const result = (await client.deleteRelation(999999)) as {
          error?: boolean;
          status?: number;
        };
        expect(result.error).toBe(true);
        expect(result.status).toBe(404);
      });
    });

    describe("list_issue_relations (after delete)", () => {
      it("should return empty relations after delete", async () => {
        const result = await client.listIssueRelations(relationIssue1);

        expect(result.relations).toBeDefined();
        expect(Array.isArray(result.relations)).toBe(true);
        expect(result.relations.length).toBe(0);
      });
    });

    describe("create_relation_types", () => {
      it("should create blocks relation", async () => {
        const result = await client.createIssueRelation(relationIssue1, {
          issue_to_id: relationIssue2,
          relation_type: "blocks",
        });

        expect(result.relation).toBeDefined();
        expect(result.relation.relation_type).toBe("blocks");

        await client.deleteRelation(result.relation.id);
      });

      it("should create precedes relation", async () => {
        const result = await client.createIssueRelation(relationIssue1, {
          issue_to_id: relationIssue2,
          relation_type: "precedes",
        });

        expect(result.relation).toBeDefined();
        expect(result.relation.relation_type).toBe("precedes");

        await client.deleteRelation(result.relation.id);
      });

      it("should create precedes relation with delay", async () => {
        const result = await client.createIssueRelation(relationIssue1, {
          issue_to_id: relationIssue2,
          relation_type: "precedes",
          delay: 3,
        });

        expect(result.relation).toBeDefined();
        expect(result.relation.relation_type).toBe("precedes");
        expect(result.relation.delay).toBe(3);

        await client.deleteRelation(result.relation.id);
      });
    });
  });
});
