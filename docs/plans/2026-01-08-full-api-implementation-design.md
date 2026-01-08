# Redmine MCP Server - Full API Implementation Design

## Overview

Erweitere den bestehenden MCP-Server um alle relevanten Redmine REST API Ressourcen mit konfigurierbaren Tool-Gruppen.

## Tool-Gruppen

| Gruppe | Tools | Beschreibung |
|--------|-------|--------------|
| `core` | Issues, Projects | Kernfunktionalität |
| `metadata` | Trackers, Statuses, Categories, CustomFields, Queries | Referenzdaten |
| `wiki` | Wiki Pages | Wiki-Verwaltung |
| `files` | Attachments, Files | Datei-Operationen |
| `relations` | Issue Relations, Versions | Verknüpfungen & Releases |
| `search` | Search | Globale Suche |
| `account` | My Account | Benutzerkontext |

### CLI-Nutzung

```bash
# Alle Tools (Standard)
npx @pschroee/mcp-server

# Nur bestimmte Gruppen
npx @pschroee/mcp-server --tools=core,metadata

# Gruppen ausschließen
npx @pschroee/mcp-server --exclude=wiki,files
```

---

## Gruppe: core

### Issues (erweitert)

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_issues` | GET | `project_id?`, `status_id?`, `assigned_to_id?`, `tracker_id?`, `priority_id?`, `author_id?`, `category_id?`, `fixed_version_id?`, `parent_id?`, `sort?`, `include?`, `created_on?`, `updated_on?`, `limit?`, `offset?` |
| `get_issue` | GET | `issue_id`, `include?` (attachments, relations, journals, watchers, children, changesets, allowed_statuses) |
| `create_issue` | POST | `project_id`, `subject`, `description?`, `tracker_id?`, `priority_id?`, `assigned_to_id?`, `category_id?`, `fixed_version_id?`, `parent_issue_id?`, `custom_fields?`, `watcher_user_ids?`, `is_private?`, `estimated_hours?`, `start_date?`, `due_date?`, `uploads?` |
| `update_issue` | PUT | `issue_id`, `subject?`, `description?`, `status_id?`, `tracker_id?`, `priority_id?`, `assigned_to_id?`, `category_id?`, `fixed_version_id?`, `done_ratio?`, `notes?`, `private_notes?`, `uploads?` |
| `delete_issue` | DELETE | `issue_id` |
| `add_issue_watcher` | POST | `issue_id`, `user_id` |
| `remove_issue_watcher` | DELETE | `issue_id`, `user_id` |

**Sortierung:** `sort=category:desc,updated_on:desc`

### Projects (erweitert)

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_projects` | GET | `include?`, `limit?`, `offset?` |
| `get_project` | GET | `project_id`, `include?` (trackers, issue_categories, enabled_modules, time_entry_activities, issue_custom_fields) |
| `create_project` | POST | `name`, `identifier`, `description?`, `homepage?`, `is_public?`, `parent_id?`, `inherit_members?`, `default_assigned_to_id?`, `default_version_id?`, `tracker_ids?`, `enabled_module_names?`, `issue_custom_field_ids?` |
| `update_project` | PUT | `project_id`, alle Felder wie create |
| `delete_project` | DELETE | `project_id` |
| `archive_project` | PUT | `project_id` |
| `unarchive_project` | PUT | `project_id` |

---

## Gruppe: metadata

### Trackers

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_trackers` | GET | - |

### Issue Statuses

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_issue_statuses` | GET | - |

### Issue Categories

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_issue_categories` | GET | `project_id` |
| `get_issue_category` | GET | `category_id` |
| `create_issue_category` | POST | `project_id`, `name`, `assigned_to_id?` |
| `update_issue_category` | PUT | `category_id`, `name?`, `assigned_to_id?` |
| `delete_issue_category` | DELETE | `category_id`, `reassign_to_id?` |

### Custom Fields

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_custom_fields` | GET | - (Admin) |

### Queries

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_queries` | GET | - |

---

## Gruppe: wiki

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_wiki_pages` | GET | `project_id` |
| `get_wiki_page` | GET | `project_id`, `page_name`, `version?`, `include?` (attachments) |
| `create_wiki_page` | PUT | `project_id`, `page_name`, `text`, `comments?`, `parent_page?`, `uploads?` |
| `update_wiki_page` | PUT | `project_id`, `page_name`, `text`, `comments?`, `version?`, `uploads?` |
| `delete_wiki_page` | DELETE | `project_id`, `page_name` |

---

## Gruppe: files

### Attachments

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `get_attachment` | GET | `attachment_id` |
| `delete_attachment` | DELETE | `attachment_id` |
| `upload_file` | POST | `filename`, `content_type`, `file_path` oder `base64_content` |

### Project Files

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_project_files` | GET | `project_id` |
| `upload_project_file` | POST | `project_id`, `token`, `version_id?`, `filename?`, `description?` |

---

## Gruppe: relations

### Issue Relations

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_issue_relations` | GET | `issue_id` |
| `get_relation` | GET | `relation_id` |
| `create_issue_relation` | POST | `issue_id`, `issue_to_id`, `relation_type`, `delay?` |
| `delete_relation` | DELETE | `relation_id` |

**Relation Types:** `relates`, `duplicates`, `duplicated`, `blocks`, `blocked`, `precedes`, `follows`, `copied_to`, `copied_from`

### Versions

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `list_versions` | GET | `project_id` |
| `get_version` | GET | `version_id` |
| `create_version` | POST | `project_id`, `name`, `status?`, `sharing?`, `due_date?`, `description?`, `wiki_page_title?` |
| `update_version` | PUT | `version_id`, alle Felder wie create |
| `delete_version` | DELETE | `version_id` |

---

## Gruppe: search

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `search` | GET | `q`, `scope?`, `all_words?`, `titles_only?`, `open_issues?`, `attachments?`, `issues?`, `news?`, `documents?`, `changesets?`, `wiki_pages?`, `messages?`, `projects?`, `limit?`, `offset?` |

---

## Gruppe: account

| Tool | Operation | Parameter |
|------|-----------|-----------|
| `get_my_account` | GET | - |

---

## Projektstruktur

```
src/
├── index.ts                 # CLI mit --tools/--exclude
├── server.ts                # MCP Server Factory
├── redmine/
│   ├── client.ts            # HTTP Client
│   └── types.ts             # TypeScript Interfaces
└── tools/
    ├── index.ts             # Tool-Registry
    ├── core.ts              # Issues, Projects
    ├── metadata.ts          # Trackers, Statuses, Categories, CustomFields, Queries
    ├── wiki.ts              # Wiki Pages
    ├── files.ts             # Attachments, Files
    ├── relations.ts         # Issue Relations, Versions
    ├── search.ts            # Search
    └── account.ts           # My Account
```

## TypeScript Interfaces

```typescript
// Erweiterte Issue
interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker?: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  category?: { id: number; name: string };
  fixed_version?: { id: number; name: string };
  parent?: { id: number };
  subject: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  done_ratio?: number;
  is_private?: boolean;
  estimated_hours?: number;
  spent_hours?: number;
  custom_fields?: RedmineCustomFieldValue[];
  created_on: string;
  updated_on: string;
  closed_on?: string;
  attachments?: RedmineAttachment[];
  relations?: RedmineRelation[];
  journals?: RedmineJournal[];
  watchers?: { id: number; name: string }[];
  children?: { id: number; tracker: { id: number; name: string }; subject: string }[];
}

// Erweiterte Project
interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  homepage?: string;
  status: number;
  is_public: boolean;
  inherit_members?: boolean;
  parent?: { id: number; name: string };
  default_assigned_to?: { id: number; name: string };
  default_version?: { id: number; name: string };
  trackers?: RedmineTracker[];
  issue_categories?: RedmineCategory[];
  enabled_modules?: { id: number; name: string }[];
  time_entry_activities?: { id: number; name: string; is_default: boolean }[];
  issue_custom_fields?: RedmineCustomField[];
  created_on: string;
  updated_on: string;
}

// Wiki
interface RedmineWikiPage {
  title: string;
  parent?: { title: string };
  text: string;
  version: number;
  author: { id: number; name: string };
  comments?: string;
  created_on: string;
  updated_on: string;
  attachments?: RedmineAttachment[];
}

interface RedmineWikiPageIndex {
  title: string;
  parent?: { title: string };
  version: number;
}

// Attachments & Files
interface RedmineAttachment {
  id: number;
  filename: string;
  filesize: number;
  content_type: string;
  description?: string;
  content_url: string;
  thumbnail_url?: string;
  author: { id: number; name: string };
  created_on: string;
}

interface RedmineFile {
  id: number;
  filename: string;
  filesize: number;
  content_type: string;
  description?: string;
  content_url: string;
  author: { id: number; name: string };
  created_on: string;
  version?: { id: number; name: string };
  digest: string;
  downloads: number;
}

interface RedmineUploadResponse {
  upload: { token: string };
}

// Relations & Versions
interface RedmineRelation {
  id: number;
  issue_id: number;
  issue_to_id: number;
  relation_type: string;
  delay?: number;
}

interface RedmineVersion {
  id: number;
  project: { id: number; name: string };
  name: string;
  description?: string;
  status: string;
  sharing: string;
  due_date?: string;
  wiki_page_title?: string;
  created_on: string;
  updated_on: string;
}

// Metadata
interface RedmineTracker {
  id: number;
  name: string;
  default_status: { id: number; name: string };
  description?: string;
}

interface RedmineIssueStatus {
  id: number;
  name: string;
  is_closed: boolean;
}

interface RedmineCategory {
  id: number;
  project?: { id: number; name: string };
  name: string;
  assigned_to?: { id: number; name: string };
}

interface RedmineCustomField {
  id: number;
  name: string;
  customized_type: string;
  field_format: string;
  is_required: boolean;
  is_filter: boolean;
  searchable: boolean;
  multiple: boolean;
  visible: boolean;
  possible_values?: { value: string; label?: string }[];
}

interface RedmineCustomFieldValue {
  id: number;
  name: string;
  value: string | string[];
}

interface RedmineQuery {
  id: number;
  name: string;
  is_public: boolean;
  project_id?: number;
}

// Search
interface RedmineSearchResult {
  id: number;
  title: string;
  type: string;
  url: string;
  description: string;
  datetime: string;
}

interface RedmineSearchResponse {
  results: RedmineSearchResult[];
  total_count: number;
  offset: number;
  limit: number;
}

// Account
interface RedmineMyAccount {
  id: number;
  login: string;
  admin: boolean;
  firstname: string;
  lastname: string;
  mail: string;
  created_on: string;
  last_login_on?: string;
  api_key?: string;
  custom_fields?: RedmineCustomFieldValue[];
}

// Journals
interface RedmineJournal {
  id: number;
  user: { id: number; name: string };
  notes?: string;
  private_notes: boolean;
  created_on: string;
  details: RedmineJournalDetail[];
}

interface RedmineJournalDetail {
  property: string;
  name: string;
  old_value?: string;
  new_value?: string;
}
```

## Tool-Registry Implementation

```typescript
// tools/index.ts
import { registerCoreTools } from "./core.js";
import { registerMetadataTools } from "./metadata.js";
import { registerWikiTools } from "./wiki.js";
import { registerFilesTools } from "./files.js";
import { registerRelationsTools } from "./relations.js";
import { registerSearchTools } from "./search.js";
import { registerAccountTools } from "./account.js";

export const toolGroups = {
  core: registerCoreTools,
  metadata: registerMetadataTools,
  wiki: registerWikiTools,
  files: registerFilesTools,
  relations: registerRelationsTools,
  search: registerSearchTools,
  account: registerAccountTools,
} as const;

export type ToolGroup = keyof typeof toolGroups;
export const ALL_GROUPS: ToolGroup[] = Object.keys(toolGroups) as ToolGroup[];

export function registerTools(
  server: McpServer,
  client: RedmineClient,
  groups: ToolGroup[]
): void {
  for (const group of groups) {
    toolGroups[group](server, client);
  }
}

export function resolveGroups(
  include?: string[],
  exclude?: string[]
): ToolGroup[] {
  let groups = include ? include as ToolGroup[] : ALL_GROUPS;
  if (exclude) {
    groups = groups.filter(g => !exclude.includes(g));
  }
  return groups;
}
```

## Tool-Übersicht (43 Tools)

| Gruppe | Anzahl | Tools |
|--------|--------|-------|
| core | 14 | list_issues, get_issue, create_issue, update_issue, delete_issue, add_issue_watcher, remove_issue_watcher, list_projects, get_project, create_project, update_project, delete_project, archive_project, unarchive_project |
| metadata | 9 | list_trackers, list_issue_statuses, list_issue_categories, get_issue_category, create_issue_category, update_issue_category, delete_issue_category, list_custom_fields, list_queries |
| wiki | 5 | list_wiki_pages, get_wiki_page, create_wiki_page, update_wiki_page, delete_wiki_page |
| files | 5 | get_attachment, delete_attachment, upload_file, list_project_files, upload_project_file |
| relations | 8 | list_issue_relations, get_relation, create_issue_relation, delete_relation, list_versions, get_version, create_version, update_version, delete_version |
| search | 1 | search |
| account | 1 | get_my_account |

**Gesamt: 43 Tools**
