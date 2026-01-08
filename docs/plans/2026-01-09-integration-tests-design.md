# Integration Tests Design

## Ziel

Alle 44 MCP-Tools gegen eine echte Redmine-Instanz testen - inklusive aller Parameter, Filter und Sortieroptionen.

## Technologie

- **Test Framework:** Vitest
- **Environment:** dotenv für .env-Dateien

## Projektstruktur

```
tests/
├── setup.ts          # Client-Initialisierung, .env laden
├── state.ts          # Geteilter State (IDs)
├── account.test.ts   # My Account (1 Tool)
├── metadata.test.ts  # Trackers, Statuses, Categories... (9 Tools)
├── core.test.ts      # Projects & Issues (14 Tools)
├── relations.test.ts # Relations & Versions (9 Tools)
├── wiki.test.ts      # Wiki Pages (5 Tools)
├── files.test.ts     # Attachments & Project Files (5 Tools)
├── search.test.ts    # Search (1 Tool)

.env                  # REDMINE_URL, REDMINE_API_KEY (gitignored)
.env.example          # Template ohne echte Werte
vitest.config.ts      # Vitest Konfiguration
```

## Geteilter State

```typescript
export const state = {
  // IDs
  projectId: "",
  projectNumericId: 0,
  secondProjectId: "",
  issueId: 0,
  secondIssueId: 0,
  childIssueId: 0,
  versionId: 0,
  categoryId: 0,
  relationId: 0,
  attachmentId: 0,
  uploadToken: "",
  wikiPageName: "",

  // Metadata (aus Redmine geladen)
  adminUserId: 0,
  trackerId: 0,
  statusOpenId: 0,
  statusClosedId: 0,
  priorityId: 0,
};
```

---

## Vollständiger Testplan

### 1. account.test.ts (1 Tool, 1 Test)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get current user | `get_my_account` | - | user.login === "admin", speichert adminUserId |

---

### 2. metadata.test.ts (9 Tools, 12 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| list all trackers | `list_trackers` | - | Array mit mindestens Bug, Feature, Support; speichert trackerId |
| list all statuses | `list_issue_statuses` | - | Array mit New, In Progress, etc.; speichert statusOpenId, statusClosedId |
| list custom fields | `list_custom_fields` | - | Array (evtl. leer bei blankem Redmine) |
| list saved queries | `list_queries` | - | Array (evtl. leer) |
| list categories (empty) | `list_issue_categories` | project_id | Leeres Array (noch keine Kategorien) |
| create category | `create_issue_category` | project_id, name | category.id > 0; speichert categoryId |
| create category with assignee | `create_issue_category` | project_id, name, assigned_to_id | category.assigned_to.id === adminUserId |
| get category | `get_issue_category` | category_id | category.name korrekt |
| update category | `update_issue_category` | category_id, name | success: true |
| list categories (with data) | `list_issue_categories` | project_id | Array enthält erstellte Kategorien |
| delete category | `delete_issue_category` | category_id | success: true |
| delete category with reassign | `delete_issue_category` | category_id, reassign_to_id | success: true |

---

### 3. core.test.ts (14 Tools, 45 Tests)

#### Projects (8 Tools, 18 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| create project minimal | `create_project` | name, identifier | project.id > 0; speichert projectId |
| create project full | `create_project` | name, identifier, description, homepage, is_public, enabled_module_names | Alle Felder gesetzt |
| create subproject | `create_project` | name, identifier, parent_id | project.parent.id vorhanden |
| list projects | `list_projects` | - | Array enthält erstellte Projekte |
| list projects with limit | `list_projects` | limit: 1 | Array.length === 1 |
| list projects with offset | `list_projects` | offset: 1 | Anderes erstes Element |
| list projects with include trackers | `list_projects` | include: "trackers" | projects[].trackers vorhanden |
| list projects with include categories | `list_projects` | include: "issue_categories" | projects[].issue_categories vorhanden |
| list projects with include modules | `list_projects` | include: "enabled_modules" | projects[].enabled_modules vorhanden |
| get project by identifier | `get_project` | project_id (string) | project.identifier korrekt |
| get project by numeric id | `get_project` | project_id (number) | project.id korrekt |
| get project with include | `get_project` | project_id, include: "trackers,issue_categories" | trackers und issue_categories vorhanden |
| update project name | `update_project` | project_id, name | success: true |
| update project description | `update_project` | project_id, description | success: true |
| update project modules | `update_project` | project_id, enabled_module_names | success: true |
| archive project | `archive_project` | project_id (secondProject) | success: true |
| unarchive project | `unarchive_project` | project_id | success: true |
| delete project | `delete_project` | project_id (secondProject) | success: true |

#### Issues (6 Tools, 27 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| create issue minimal | `create_issue` | project_id, subject | issue.id > 0; speichert issueId |
| create issue full | `create_issue` | project_id, subject, description, tracker_id, priority_id, assigned_to_id, start_date, due_date, estimated_hours | Alle Felder korrekt |
| create issue private | `create_issue` | project_id, subject, is_private: true | issue.is_private === true |
| create child issue | `create_issue` | project_id, subject, parent_issue_id | issue.parent.id === issueId |
| create second issue for tests | `create_issue` | project_id, subject | speichert secondIssueId |
| get issue | `get_issue` | issue_id | issue.subject korrekt |
| get issue with attachments | `get_issue` | issue_id, include: "attachments" | attachments Array vorhanden |
| get issue with relations | `get_issue` | issue_id, include: "relations" | relations Array vorhanden |
| get issue with journals | `get_issue` | issue_id, include: "journals" | journals Array vorhanden |
| get issue with watchers | `get_issue` | issue_id, include: "watchers" | watchers Array vorhanden |
| get issue with children | `get_issue` | issue_id, include: "children" | children Array vorhanden |
| get issue with allowed_statuses | `get_issue` | issue_id, include: "allowed_statuses" | allowed_statuses Array vorhanden |
| get issue with all includes | `get_issue` | issue_id, include: "attachments,relations,journals,watchers,children" | Alle Arrays vorhanden |
| list issues | `list_issues` | - | Array enthält erstellte Issues |
| list issues by project | `list_issues` | project_id | Nur Issues aus Projekt |
| list issues by tracker | `list_issues` | tracker_id | Nur Issues mit Tracker |
| list issues by status open | `list_issues` | status_id: "open" | Nur offene Issues |
| list issues by status closed | `list_issues` | status_id: "closed" | Nur geschlossene Issues |
| list issues by status all | `list_issues` | status_id: "*" | Alle Issues |
| list issues by assigned_to me | `list_issues` | assigned_to_id: "me" | Nur eigene Issues |
| list issues by author | `list_issues` | author_id | Nur Issues vom Autor |
| list issues with subject filter | `list_issues` | subject: "~Test" | Subject enthält "Test" |
| list issues sort by updated desc | `list_issues` | sort: "updated_on:desc" | Neueste zuerst |
| list issues sort by priority asc | `list_issues` | sort: "priority:asc" | Niedrigste Priorität zuerst |
| list issues with limit | `list_issues` | limit: 1 | Array.length === 1 |
| list issues with offset | `list_issues` | offset: 1, limit: 1 | Anderes Issue |
| list issues with include | `list_issues` | include: "relations,attachments" | Includes vorhanden |
| update issue subject | `update_issue` | issue_id, subject | success: true |
| update issue with note | `update_issue` | issue_id, notes | Journal erstellt |
| update issue with private note | `update_issue` | issue_id, notes, private_notes: true | Private Note erstellt |
| update issue status | `update_issue` | issue_id, status_id | Status geändert |
| update issue done_ratio | `update_issue` | issue_id, done_ratio: 50 | 50% done |
| update issue dates | `update_issue` | issue_id, start_date, due_date | Daten gesetzt |
| add watcher | `add_issue_watcher` | issue_id, user_id | success: true |
| remove watcher | `remove_issue_watcher` | issue_id, user_id | success: true |
| delete issue | `delete_issue` | issue_id (childIssue) | success: true |

---

### 4. relations.test.ts (9 Tools, 18 Tests)

#### Versions (6 Tools, 10 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| create version minimal | `create_version` | project_id, name | version.id > 0; speichert versionId |
| create version full | `create_version` | project_id, name, status, sharing, due_date, description, wiki_page_title | Alle Felder gesetzt |
| list versions | `list_versions` | project_id | Array enthält Version |
| get version | `get_version` | version_id | version.name korrekt |
| update version name | `update_version` | version_id, name | success: true |
| update version status | `update_version` | version_id, status: "locked" | Status geändert |
| update version status closed | `update_version` | version_id, status: "closed" | Status geschlossen |
| update version sharing | `update_version` | version_id, sharing: "descendants" | Sharing geändert |
| assign issue to version | `update_issue` | issue_id, fixed_version_id | Version zugewiesen |
| delete version | `delete_version` | version_id | success: true |

#### Relations (3 Tools, 8 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| create relation relates | `create_issue_relation` | issue_id, issue_to_id, relation_type: "relates" | relation.id > 0; speichert relationId |
| create relation blocks | `create_issue_relation` | issue_id, issue_to_id, relation_type: "blocks" | relation erstellt |
| create relation precedes | `create_issue_relation` | issue_id, issue_to_id, relation_type: "precedes" | relation erstellt |
| create relation precedes with delay | `create_issue_relation` | issue_id, issue_to_id, relation_type: "precedes", delay: 3 | delay === 3 |
| list issue relations | `list_issue_relations` | issue_id | Array enthält Relations |
| get relation | `get_relation` | relation_id | relation.relation_type korrekt |
| delete relation | `delete_relation` | relation_id | success: true |
| list relations after delete | `list_issue_relations` | issue_id | Relation entfernt |

---

### 5. wiki.test.ts (5 Tools, 10 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| list wiki pages (empty) | `list_wiki_pages` | project_id | Leeres Array |
| create wiki page | `create_wiki_page` | project_id, page_name, text | Page erstellt; speichert wikiPageName |
| create wiki page with comment | `create_wiki_page` | project_id, page_name, text, comments | Page mit Comment |
| create child wiki page | `create_wiki_page` | project_id, page_name, text, parent_title | parent gesetzt |
| list wiki pages | `list_wiki_pages` | project_id | Array enthält Pages |
| get wiki page | `get_wiki_page` | project_id, page_name | text korrekt |
| get wiki page with attachments | `get_wiki_page` | project_id, page_name, include: "attachments" | attachments Array |
| update wiki page | `update_wiki_page` | project_id, page_name, text | text geändert |
| update wiki page with version check | `update_wiki_page` | project_id, page_name, text, version | Version-Conflict-Detection |
| delete wiki page | `delete_wiki_page` | project_id, page_name | success: true |

---

### 6. files.test.ts (5 Tools, 8 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| upload file | `upload_file` | file_path, filename | upload.token vorhanden; speichert uploadToken |
| upload file with content_type | `upload_file` | file_path, filename, content_type | Token erhalten |
| list project files (empty) | `list_project_files` | project_id | Leeres Array |
| upload project file | `upload_project_file` | project_id, token | File attached |
| upload project file with description | `upload_project_file` | project_id, token, description | Mit Beschreibung |
| list project files | `list_project_files` | project_id | Array enthält File |
| get attachment | `get_attachment` | attachment_id | attachment.filename korrekt |
| delete attachment | `delete_attachment` | attachment_id | success: true |

---

### 7. search.test.ts (1 Tool, 12 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| search basic | `search` | q: "Test" | results Array |
| search all_words true | `search` | q: "Test Issue", all_words: true | Nur exakte Matches |
| search all_words false | `search` | q: "Test Issue", all_words: false | Mehr Results |
| search titles_only | `search` | q: "Test", titles_only: true | Nur Titel-Matches |
| search open_issues only | `search` | q: "Test", open_issues: true | Nur offene Issues |
| search issues only | `search` | q: "Test", issues: true, wiki_pages: false | Nur Issues |
| search wiki only | `search` | q: "Test", issues: false, wiki_pages: true | Nur Wiki |
| search projects only | `search` | q: "Test", projects: true, issues: false | Nur Projekte |
| search scope my_projects | `search` | q: "Test", scope: "my_projects" | Nur eigene Projekte |
| search with limit | `search` | q: "Test", limit: 1 | Max 1 Result |
| search with offset | `search` | q: "Test", offset: 1 | Skip first |
| search no results | `search` | q: "xyznonexistent123" | Leeres Array |

---

## Test-Reihenfolge (Vitest Sequence)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    sequence: { shuffle: false },
    include: [
      "tests/account.test.ts",    // 1. Keine Abhängigkeiten
      "tests/metadata.test.ts",   // 2. Braucht projectId für Categories
      "tests/core.test.ts",       // 3. Erstellt Project + Issues
      "tests/relations.test.ts",  // 4. Braucht projectId, issueId
      "tests/wiki.test.ts",       // 5. Braucht projectId
      "tests/files.test.ts",      // 6. Braucht projectId
      "tests/search.test.ts",     // 7. Braucht erstellte Daten
    ],
  },
});
```

**Hinweis:** metadata.test.ts braucht projectId für Categories, daher muss core.test.ts zuerst das Projekt erstellen. Die Reihenfolge wird angepasst:

1. account.test.ts
2. core.test.ts (erstellt Projekt zuerst, dann Issues)
3. metadata.test.ts (nutzt projectId für Categories)
4. relations.test.ts
5. wiki.test.ts
6. files.test.ts
7. search.test.ts

---

## Cleanup

Am Ende von **search.test.ts** (letzter Test-File):

```typescript
afterAll(async () => {
  // Projekt löschen → löscht automatisch Issues, Wiki, Versions, Categories
  if (state.projectId) {
    await client.deleteProject(state.projectId);
  }
});
```

---

## Error Tests (Negative Tests)

Tests die erwartungsgemäß fehlschlagen sollen.

### core.test.ts - Error Tests (+8 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get nonexistent issue | `get_issue` | issue_id: 999999 | Error: 404 Not Found |
| update nonexistent issue | `update_issue` | issue_id: 999999, subject | Error: 404 Not Found |
| delete nonexistent issue | `delete_issue` | issue_id: 999999 | Error: 404 Not Found |
| get nonexistent project | `get_project` | project_id: "nonexistent-xxx" | Error: 404 Not Found |
| update nonexistent project | `update_project` | project_id: "nonexistent-xxx", name | Error: 404 Not Found |
| delete nonexistent project | `delete_project` | project_id: "nonexistent-xxx" | Error: 404 Not Found |
| create issue without project | `create_issue` | subject (missing project_id) | Error: Validation |
| create project duplicate identifier | `create_project` | name, identifier (existing) | Error: 422 Unprocessable |

### metadata.test.ts - Error Tests (+4 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get nonexistent category | `get_issue_category` | category_id: 999999 | Error: 404 Not Found |
| update nonexistent category | `update_issue_category` | category_id: 999999, name | Error: 404 Not Found |
| delete nonexistent category | `delete_issue_category` | category_id: 999999 | Error: 404 Not Found |
| list categories nonexistent project | `list_issue_categories` | project_id: "nonexistent" | Error: 404 Not Found |

### relations.test.ts - Error Tests (+6 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get nonexistent version | `get_version` | version_id: 999999 | Error: 404 Not Found |
| update nonexistent version | `update_version` | version_id: 999999, name | Error: 404 Not Found |
| delete nonexistent version | `delete_version` | version_id: 999999 | Error: 404 Not Found |
| get nonexistent relation | `get_relation` | relation_id: 999999 | Error: 404 Not Found |
| delete nonexistent relation | `delete_relation` | relation_id: 999999 | Error: 404 Not Found |
| create relation to same issue | `create_issue_relation` | issue_id, issue_to_id (same) | Error: 422 Unprocessable |

### wiki.test.ts - Error Tests (+3 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get nonexistent wiki page | `get_wiki_page` | project_id, page_name: "nonexistent" | Error: 404 Not Found |
| delete nonexistent wiki page | `delete_wiki_page` | project_id, page_name: "nonexistent" | Error: 404 Not Found |
| list wiki nonexistent project | `list_wiki_pages` | project_id: "nonexistent" | Error: 404 Not Found |

### files.test.ts - Error Tests (+3 Tests)

| Test | Tool | Parameter | Erwartung |
|------|------|-----------|-----------|
| get nonexistent attachment | `get_attachment` | attachment_id: 999999 | Error: 404 Not Found |
| delete nonexistent attachment | `delete_attachment` | attachment_id: 999999 | Error: 404 Not Found |
| upload with invalid token | `upload_project_file` | project_id, token: "invalid" | Error: 422 Unprocessable |

---

## Zusammenfassung

| Test-Datei | Tools | Success Tests | Error Tests | Total |
|------------|-------|---------------|-------------|-------|
| account.test.ts | 1 | 1 | 0 | 1 |
| core.test.ts | 14 | 45 | 8 | 53 |
| metadata.test.ts | 9 | 12 | 4 | 16 |
| relations.test.ts | 9 | 18 | 6 | 24 |
| wiki.test.ts | 5 | 10 | 3 | 13 |
| files.test.ts | 5 | 8 | 3 | 11 |
| search.test.ts | 1 | 12 | 0 | 12 |
| **Gesamt** | **44** | **106** | **24** | **130** |

---

## Konfiguration

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    sequence: { shuffle: false },
    testTimeout: 10000,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/account.test.ts",
      "tests/core.test.ts",
      "tests/metadata.test.ts",
      "tests/relations.test.ts",
      "tests/wiki.test.ts",
      "tests/files.test.ts",
      "tests/search.test.ts",
    ],
  },
});
```

### .env

```
REDMINE_URL=http://192.168.10.42:10083
REDMINE_API_KEY=6ca6813690818d9f63ad0c4038e4b069dfd666c7
```

### .env.example

```
REDMINE_URL=http://your-redmine-instance
REDMINE_API_KEY=your-api-key
```

### package.json Scripts

```json
"test": "vitest run",
"test:watch": "vitest"
```

### DevDependencies

- `vitest`
- `dotenv`
