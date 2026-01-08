# Phase 1: Foundation (Types)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Alle TypeScript-Interfaces für die Redmine API definieren.

**Architecture:** Erweiterung der bestehenden types.ts mit allen neuen Interfaces für Wiki, Attachments, Relations, Versions, Metadata, Search und Account.

**Tech Stack:** TypeScript

**Abhängigkeiten:** Keine - dies ist die Basis für alle weiteren Phasen.

---

## Task 1.1: Types erweitern

**Files:**
- Modify: `src/redmine/types.ts`

**Step 1: Erweitere RedmineIssue Interface**

```typescript
export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker?: { id: number; name: string };
  status: { id: number; name: string; is_closed?: boolean };
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
  total_estimated_hours?: number;
  total_spent_hours?: number;
  custom_fields?: RedmineCustomFieldValue[];
  created_on: string;
  updated_on: string;
  closed_on?: string;
  attachments?: RedmineAttachment[];
  relations?: RedmineRelation[];
  journals?: RedmineJournal[];
  watchers?: { id: number; name: string }[];
  children?: { id: number; tracker: { id: number; name: string }; subject: string }[];
  changesets?: RedmineChangeset[];
  allowed_statuses?: { id: number; name: string }[];
}
```

**Step 2: Erweitere RedmineProject Interface**

```typescript
export interface RedmineProject {
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
  time_entry_activities?: RedmineActivity[];
  issue_custom_fields?: RedmineCustomField[];
  created_on: string;
  updated_on: string;
}
```

**Step 3: Füge Wiki Interfaces hinzu**

```typescript
export interface RedmineWikiPage {
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

export interface RedmineWikiPageIndex {
  title: string;
  parent?: { title: string };
  version: number;
}

export interface RedmineWikiPagesResponse {
  wiki_pages: RedmineWikiPageIndex[];
}
```

**Step 4: Füge Attachment & File Interfaces hinzu**

```typescript
export interface RedmineAttachment {
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

export interface RedmineFile {
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

export interface RedmineFilesResponse {
  files: RedmineFile[];
}

export interface RedmineUploadResponse {
  upload: { token: string };
}
```

**Step 5: Füge Relation & Version Interfaces hinzu**

```typescript
export interface RedmineRelation {
  id: number;
  issue_id: number;
  issue_to_id: number;
  relation_type: string;
  delay?: number;
}

export interface RedmineRelationsResponse {
  relations: RedmineRelation[];
}

export interface RedmineVersion {
  id: number;
  project: { id: number; name: string };
  name: string;
  description?: string;
  status: string;
  sharing: string;
  due_date?: string;
  wiki_page_title?: string;
  estimated_hours?: number;
  spent_hours?: number;
  created_on: string;
  updated_on: string;
}

export interface RedmineVersionsResponse {
  versions: RedmineVersion[];
  total_count: number;
}
```

**Step 6: Füge Metadata Interfaces hinzu**

```typescript
export interface RedmineTracker {
  id: number;
  name: string;
  default_status?: { id: number; name: string };
  description?: string;
}

export interface RedmineTrackersResponse {
  trackers: RedmineTracker[];
}

export interface RedmineIssueStatus {
  id: number;
  name: string;
  is_closed: boolean;
}

export interface RedmineIssueStatusesResponse {
  issue_statuses: RedmineIssueStatus[];
}

export interface RedmineCategory {
  id: number;
  project?: { id: number; name: string };
  name: string;
  assigned_to?: { id: number; name: string };
}

export interface RedmineCategoriesResponse {
  issue_categories: RedmineCategory[];
}

export interface RedmineCustomField {
  id: number;
  name: string;
  customized_type: string;
  field_format: string;
  regexp?: string;
  min_length?: number;
  max_length?: number;
  is_required: boolean;
  is_filter: boolean;
  searchable: boolean;
  multiple: boolean;
  default_value?: string;
  visible: boolean;
  possible_values?: { value: string; label?: string }[];
  trackers?: { id: number; name: string }[];
  roles?: { id: number; name: string }[];
}

export interface RedmineCustomFieldsResponse {
  custom_fields: RedmineCustomField[];
}

export interface RedmineCustomFieldValue {
  id: number;
  name: string;
  value: string | string[];
  multiple?: boolean;
}

export interface RedmineQuery {
  id: number;
  name: string;
  is_public: boolean;
  project_id?: number;
}

export interface RedmineQueriesResponse {
  queries: RedmineQuery[];
}

export interface RedmineActivity {
  id: number;
  name: string;
  is_default: boolean;
  active: boolean;
}
```

**Step 7: Füge Search Interface hinzu**

```typescript
export interface RedmineSearchResult {
  id: number;
  title: string;
  type: string;
  url: string;
  description: string;
  datetime: string;
}

export interface RedmineSearchResponse {
  results: RedmineSearchResult[];
  total_count: number;
  offset: number;
  limit: number;
}
```

**Step 8: Füge Account Interface hinzu**

```typescript
export interface RedmineMyAccount {
  id: number;
  login: string;
  admin: boolean;
  firstname: string;
  lastname: string;
  mail: string;
  created_on: string;
  updated_on?: string;
  last_login_on?: string;
  passwd_changed_on?: string;
  twofa_scheme?: string;
  api_key?: string;
  status?: number;
  custom_fields?: RedmineCustomFieldValue[];
}

export interface RedmineMyAccountResponse {
  user: RedmineMyAccount;
}
```

**Step 9: Füge Journal & Changeset Interfaces hinzu**

```typescript
export interface RedmineJournal {
  id: number;
  user: { id: number; name: string };
  notes?: string;
  private_notes: boolean;
  created_on: string;
  details: RedmineJournalDetail[];
}

export interface RedmineJournalDetail {
  property: string;
  name: string;
  old_value?: string;
  new_value?: string;
}

export interface RedmineChangeset {
  revision: string;
  user?: { id: number; name: string };
  comments?: string;
  committed_on: string;
}
```

**Step 10: Build testen**

Run: `npm run build`
Expected: Keine TypeScript-Fehler

---

## Verification

Nach Abschluss dieser Phase:
1. `npm run build` muss erfolgreich sein
2. Alle Interfaces in `src/redmine/types.ts` exportiert
