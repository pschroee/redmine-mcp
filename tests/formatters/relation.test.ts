import { describe, expect, test } from "vitest";
import { formatRelation, formatRelationList } from "../../src/formatters/relation.js";

describe("formatRelation", () => {
  test("formats basic relation", () => {
    const response = {
      relation: {
        id: 1,
        issue_id: 100,
        issue_to_id: 200,
        relation_type: "relates",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("# Relation #1");
    expect(result).toContain("| Issue | #100 |");
    expect(result).toContain("| Type | relates |");
    expect(result).toContain("| Related To | #200 |");
    expect(result).not.toContain("Delay");
  });

  test("formats duplicates relation", () => {
    const response = {
      relation: {
        id: 2,
        issue_id: 101,
        issue_to_id: 102,
        relation_type: "duplicates",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | duplicates |");
  });

  test("formats duplicated relation", () => {
    const response = {
      relation: {
        id: 3,
        issue_id: 102,
        issue_to_id: 101,
        relation_type: "duplicated",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | duplicated by |");
  });

  test("formats blocks relation", () => {
    const response = {
      relation: {
        id: 4,
        issue_id: 103,
        issue_to_id: 104,
        relation_type: "blocks",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | blocks |");
  });

  test("formats blocked relation", () => {
    const response = {
      relation: {
        id: 5,
        issue_id: 104,
        issue_to_id: 103,
        relation_type: "blocked",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | blocked by |");
  });

  test("formats precedes relation with delay", () => {
    const response = {
      relation: {
        id: 6,
        issue_id: 105,
        issue_to_id: 106,
        relation_type: "precedes",
        delay: 5,
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | precedes |");
    expect(result).toContain("| Delay | 5 days |");
  });

  test("formats follows relation with delay", () => {
    const response = {
      relation: {
        id: 7,
        issue_id: 106,
        issue_to_id: 105,
        relation_type: "follows",
        delay: 3,
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | follows |");
    expect(result).toContain("| Delay | 3 days |");
  });

  test("formats copied_to relation", () => {
    const response = {
      relation: {
        id: 8,
        issue_id: 107,
        issue_to_id: 108,
        relation_type: "copied_to",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | copied to |");
  });

  test("formats copied_from relation", () => {
    const response = {
      relation: {
        id: 9,
        issue_id: 108,
        issue_to_id: 107,
        relation_type: "copied_from",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | copied from |");
  });

  test("formats unknown relation type as-is", () => {
    const response = {
      relation: {
        id: 10,
        issue_id: 109,
        issue_to_id: 110,
        relation_type: "custom_relation",
      },
    };
    const result = formatRelation(response);

    expect(result).toContain("| Type | custom_relation |");
  });

  test("does not show delay when delay is 0", () => {
    const response = {
      relation: {
        id: 11,
        issue_id: 111,
        issue_to_id: 112,
        relation_type: "precedes",
        delay: 0,
      },
    };
    const result = formatRelation(response);

    expect(result).not.toContain("Delay");
  });

  test("does not show delay when delay is undefined", () => {
    const response = {
      relation: {
        id: 12,
        issue_id: 113,
        issue_to_id: 114,
        relation_type: "precedes",
      },
    };
    const result = formatRelation(response);

    expect(result).not.toContain("Delay");
  });
});

describe("formatRelationList", () => {
  test("formats empty relation list", () => {
    const response = { relations: [] };
    const result = formatRelationList(response);

    expect(result).toBe("No relations found.");
  });

  test("formats single relation without delay", () => {
    const response = {
      relations: [
        {
          id: 1,
          issue_id: 100,
          issue_to_id: 200,
          relation_type: "relates",
        },
      ],
    };
    const result = formatRelationList(response);

    expect(result).toContain("# Issue Relations (1)");
    expect(result).toContain("| ID | Issue | Type | Related To |");
    expect(result).toContain("| 1 | #100 | relates | #200 |");
    expect(result).not.toContain("Delay");
  });

  test("formats multiple relations without delay", () => {
    const response = {
      relations: [
        { id: 1, issue_id: 100, issue_to_id: 200, relation_type: "relates" },
        { id: 2, issue_id: 100, issue_to_id: 300, relation_type: "blocks" },
        { id: 3, issue_id: 100, issue_to_id: 400, relation_type: "duplicates" },
      ],
    };
    const result = formatRelationList(response);

    expect(result).toContain("# Issue Relations (3)");
    expect(result).toContain("| 1 | #100 | relates | #200 |");
    expect(result).toContain("| 2 | #100 | blocks | #300 |");
    expect(result).toContain("| 3 | #100 | duplicates | #400 |");
  });

  test("formats relations with delay column when any has delay", () => {
    const response = {
      relations: [
        { id: 1, issue_id: 100, issue_to_id: 200, relation_type: "relates" },
        { id: 2, issue_id: 100, issue_to_id: 300, relation_type: "precedes", delay: 5 },
      ],
    };
    const result = formatRelationList(response);

    expect(result).toContain("| ID | Issue | Type | Related To | Delay |");
    expect(result).toContain("| 1 | #100 | relates | #200 |  |");
    expect(result).toContain("| 2 | #100 | precedes | #300 | 5 days |");
  });

  test("formats all relation types correctly", () => {
    const response = {
      relations: [
        { id: 1, issue_id: 100, issue_to_id: 101, relation_type: "relates" },
        { id: 2, issue_id: 100, issue_to_id: 102, relation_type: "duplicates" },
        { id: 3, issue_id: 100, issue_to_id: 103, relation_type: "duplicated" },
        { id: 4, issue_id: 100, issue_to_id: 104, relation_type: "blocks" },
        { id: 5, issue_id: 100, issue_to_id: 105, relation_type: "blocked" },
        { id: 6, issue_id: 100, issue_to_id: 106, relation_type: "precedes", delay: 2 },
        { id: 7, issue_id: 100, issue_to_id: 107, relation_type: "follows", delay: 3 },
        { id: 8, issue_id: 100, issue_to_id: 108, relation_type: "copied_to" },
        { id: 9, issue_id: 100, issue_to_id: 109, relation_type: "copied_from" },
      ],
    };
    const result = formatRelationList(response);

    expect(result).toContain("# Issue Relations (9)");
    expect(result).toContain("| 1 | #100 | relates | #101 |");
    expect(result).toContain("| 2 | #100 | duplicates | #102 |");
    expect(result).toContain("| 3 | #100 | duplicated by | #103 |");
    expect(result).toContain("| 4 | #100 | blocks | #104 |");
    expect(result).toContain("| 5 | #100 | blocked by | #105 |");
    expect(result).toContain("| 6 | #100 | precedes | #106 | 2 days |");
    expect(result).toContain("| 7 | #100 | follows | #107 | 3 days |");
    expect(result).toContain("| 8 | #100 | copied to | #108 |");
    expect(result).toContain("| 9 | #100 | copied from | #109 |");
  });

  test("does not include delay column when all delays are 0", () => {
    const response = {
      relations: [
        { id: 1, issue_id: 100, issue_to_id: 200, relation_type: "precedes", delay: 0 },
        { id: 2, issue_id: 100, issue_to_id: 300, relation_type: "follows", delay: 0 },
      ],
    };
    const result = formatRelationList(response);

    expect(result).toContain("| ID | Issue | Type | Related To |");
    expect(result).not.toContain("Delay");
  });
});
