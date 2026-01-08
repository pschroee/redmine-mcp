# Phase 2: Client-Erweiterung

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** RedmineClient mit allen HTTP-Methoden für die neuen API-Ressourcen erweitern.

**Architecture:** Erweiterung der bestehenden client.ts mit Methoden für Wiki, Attachments, Relations, Versions, Metadata, Search und Account.

**Tech Stack:** TypeScript, fetch API

**Abhängigkeiten:** Phase 1 (Types) muss abgeschlossen sein.

---

## Task 2.1: Client-Methoden erweitern

**Files:**
- Modify: `src/redmine/client.ts`

**Step 1: Imports erweitern**

Füge am Anfang der Datei alle neuen Type-Imports hinzu:

```typescript
import type {
  RedmineIssue,
  RedmineIssuesResponse,
  RedmineProject,
  RedmineProjectsResponse,
  RedmineResult,
  RedmineError,
  RedmineWikiPage,
  RedmineWikiPagesResponse,
  RedmineAttachment,
  RedmineUploadResponse,
  RedmineFile,
  RedmineFilesResponse,
  RedmineRelation,
  RedmineRelationsResponse,
  RedmineVersion,
  RedmineVersionsResponse,
  RedmineTracker,
  RedmineTrackersResponse,
  RedmineIssueStatus,
  RedmineIssueStatusesResponse,
  RedmineCategory,
  RedmineCategoriesResponse,
  RedmineCustomField,
  RedmineCustomFieldsResponse,
  RedmineQuery,
  RedmineQueriesResponse,
  RedmineSearchResponse,
  RedmineMyAccount,
  RedmineMyAccountResponse,
} from "./types.js";
```

**Step 2: Erweitere listIssues mit allen Filtern**

```typescript
async listIssues(params?: {
  project_id?: string | number;
  subproject_id?: string;
  tracker_id?: number;
  status_id?: string | number;
  assigned_to_id?: number | string;
  parent_id?: number;
  author_id?: number;
  category_id?: number;
  fixed_version_id?: number;
  subject?: string;
  created_on?: string;
  updated_on?: string;
  sort?: string;
  include?: string;
  limit?: number;
  offset?: number;
}): Promise<RedmineResult<RedmineIssuesResponse>> {
  const query = new URLSearchParams();
  if (params?.project_id) query.set("project_id", String(params.project_id));
  if (params?.subproject_id) query.set("subproject_id", params.subproject_id);
  if (params?.tracker_id) query.set("tracker_id", String(params.tracker_id));
  if (params?.status_id) query.set("status_id", String(params.status_id));
  if (params?.assigned_to_id) query.set("assigned_to_id", String(params.assigned_to_id));
  if (params?.parent_id) query.set("parent_id", String(params.parent_id));
  if (params?.author_id) query.set("author_id", String(params.author_id));
  if (params?.category_id) query.set("category_id", String(params.category_id));
  if (params?.fixed_version_id) query.set("fixed_version_id", String(params.fixed_version_id));
  if (params?.subject) query.set("subject", params.subject);
  if (params?.created_on) query.set("created_on", params.created_on);
  if (params?.updated_on) query.set("updated_on", params.updated_on);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.include) query.set("include", params.include);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const queryString = query.toString();
  const path = `/issues.json${queryString ? `?${queryString}` : ""}`;
  return this.request<RedmineIssuesResponse>("GET", path);
}
```

**Step 3: Erweitere getIssue mit include Parameter**

```typescript
async getIssue(
  id: number,
  include?: string
): Promise<RedmineResult<{ issue: RedmineIssue }>> {
  const query = include ? `?include=${include}` : "";
  return this.request<{ issue: RedmineIssue }>("GET", `/issues/${id}.json${query}`);
}
```

**Step 4: Erweitere createIssue mit allen Feldern**

```typescript
async createIssue(data: {
  project_id: number | string;
  subject: string;
  description?: string;
  tracker_id?: number;
  status_id?: number;
  priority_id?: number;
  assigned_to_id?: number;
  category_id?: number;
  fixed_version_id?: number;
  parent_issue_id?: number;
  custom_fields?: { id: number; value: string | string[] }[];
  watcher_user_ids?: number[];
  is_private?: boolean;
  estimated_hours?: number;
  start_date?: string;
  due_date?: string;
  uploads?: { token: string; filename: string; content_type?: string; description?: string }[];
}): Promise<RedmineResult<{ issue: RedmineIssue }>> {
  return this.request<{ issue: RedmineIssue }>("POST", "/issues.json", {
    issue: data,
  });
}
```

**Step 5: Erweitere updateIssue mit allen Feldern**

```typescript
async updateIssue(
  id: number,
  data: {
    subject?: string;
    description?: string;
    project_id?: number | string;
    tracker_id?: number;
    status_id?: number;
    priority_id?: number;
    assigned_to_id?: number | string;
    category_id?: number;
    fixed_version_id?: number | string;
    parent_issue_id?: number | string;
    custom_fields?: { id: number; value: string | string[] }[];
    notes?: string;
    private_notes?: boolean;
    is_private?: boolean;
    estimated_hours?: number;
    done_ratio?: number;
    start_date?: string;
    due_date?: string;
    uploads?: { token: string; filename: string; content_type?: string; description?: string }[];
  }
): Promise<RedmineResult<void>> {
  return this.request<void>("PUT", `/issues/${id}.json`, {
    issue: data,
  });
}
```

**Step 6: Füge deleteIssue und Watcher-Methoden hinzu**

```typescript
async deleteIssue(id: number): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/issues/${id}.json`);
}

async addIssueWatcher(
  issueId: number,
  userId: number
): Promise<RedmineResult<void>> {
  return this.request<void>("POST", `/issues/${issueId}/watchers.json`, {
    user_id: userId,
  });
}

async removeIssueWatcher(
  issueId: number,
  userId: number
): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/issues/${issueId}/watchers/${userId}.json`);
}
```

**Step 7: Erweitere Project-Methoden**

```typescript
async listProjects(params?: {
  include?: string;
  limit?: number;
  offset?: number;
}): Promise<RedmineResult<RedmineProjectsResponse>> {
  const query = new URLSearchParams();
  if (params?.include) query.set("include", params.include);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const queryString = query.toString();
  const path = `/projects.json${queryString ? `?${queryString}` : ""}`;
  return this.request<RedmineProjectsResponse>("GET", path);
}

async getProject(
  id: string | number,
  include?: string
): Promise<RedmineResult<{ project: RedmineProject }>> {
  const query = include ? `?include=${include}` : "";
  return this.request<{ project: RedmineProject }>("GET", `/projects/${id}.json${query}`);
}

async createProject(data: {
  name: string;
  identifier: string;
  description?: string;
  homepage?: string;
  is_public?: boolean;
  parent_id?: number | string;
  inherit_members?: boolean;
  default_assigned_to_id?: number;
  default_version_id?: number;
  tracker_ids?: number[];
  enabled_module_names?: string[];
  issue_custom_field_ids?: number[];
  custom_fields?: { id: number; value: string | string[] }[];
}): Promise<RedmineResult<{ project: RedmineProject }>> {
  return this.request<{ project: RedmineProject }>("POST", "/projects.json", {
    project: data,
  });
}

async updateProject(
  id: string | number,
  data: {
    name?: string;
    description?: string;
    homepage?: string;
    is_public?: boolean;
    parent_id?: number | string;
    inherit_members?: boolean;
    default_assigned_to_id?: number;
    default_version_id?: number;
    tracker_ids?: number[];
    enabled_module_names?: string[];
    issue_custom_field_ids?: number[];
    custom_fields?: { id: number; value: string | string[] }[];
  }
): Promise<RedmineResult<void>> {
  return this.request<void>("PUT", `/projects/${id}.json`, { project: data });
}

async deleteProject(id: string | number): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/projects/${id}.json`);
}

async archiveProject(id: string | number): Promise<RedmineResult<void>> {
  return this.request<void>("PUT", `/projects/${id}/archive.json`);
}

async unarchiveProject(id: string | number): Promise<RedmineResult<void>> {
  return this.request<void>("PUT", `/projects/${id}/unarchive.json`);
}
```

**Step 8: Füge Wiki-Methoden hinzu**

```typescript
// Wiki
async listWikiPages(
  projectId: string | number
): Promise<RedmineResult<RedmineWikiPagesResponse>> {
  return this.request<RedmineWikiPagesResponse>("GET", `/projects/${projectId}/wiki/index.json`);
}

async getWikiPage(
  projectId: string | number,
  pageName: string,
  options?: { version?: number; include?: string }
): Promise<RedmineResult<{ wiki_page: RedmineWikiPage }>> {
  const query = new URLSearchParams();
  if (options?.include) query.set("include", options.include);
  const queryString = query.toString();
  const versionPath = options?.version ? `/${options.version}` : "";
  const path = `/projects/${projectId}/wiki/${encodeURIComponent(pageName)}${versionPath}.json${queryString ? `?${queryString}` : ""}`;
  return this.request<{ wiki_page: RedmineWikiPage }>("GET", path);
}

async createOrUpdateWikiPage(
  projectId: string | number,
  pageName: string,
  data: {
    text: string;
    comments?: string;
    version?: number;
    parent_title?: string;
    uploads?: { token: string; filename: string; content_type?: string; description?: string }[];
  }
): Promise<RedmineResult<{ wiki_page: RedmineWikiPage }>> {
  return this.request<{ wiki_page: RedmineWikiPage }>(
    "PUT",
    `/projects/${projectId}/wiki/${encodeURIComponent(pageName)}.json`,
    { wiki_page: data }
  );
}

async deleteWikiPage(
  projectId: string | number,
  pageName: string
): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/projects/${projectId}/wiki/${encodeURIComponent(pageName)}.json`);
}
```

**Step 9: Füge Attachment-Methoden hinzu**

```typescript
// Attachments
async getAttachment(id: number): Promise<RedmineResult<{ attachment: RedmineAttachment }>> {
  return this.request<{ attachment: RedmineAttachment }>("GET", `/attachments/${id}.json`);
}

async deleteAttachment(id: number): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/attachments/${id}.json`);
}

async uploadFile(
  filename: string,
  contentType: string,
  content: Buffer
): Promise<RedmineResult<RedmineUploadResponse>> {
  try {
    const response = await fetch(`${this.baseUrl}/uploads.json?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
      headers: {
        "X-Redmine-API-Key": this.apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: content,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorResponse: RedmineError = {
        error: true,
        status: response.status,
        message:
          (errorData as { errors?: string[] }).errors?.join(", ") ||
          `HTTP ${response.status}`,
      };
      return errorResponse;
    }

    return (await response.json()) as RedmineUploadResponse;
  } catch (err) {
    const errorResponse: RedmineError = {
      error: true,
      status: 0,
      message: err instanceof Error ? err.message : "Unknown error",
    };
    return errorResponse;
  }
}
```

**Step 10: Füge Files-Methoden hinzu**

```typescript
// Project Files
async listProjectFiles(
  projectId: string | number
): Promise<RedmineResult<RedmineFilesResponse>> {
  return this.request<RedmineFilesResponse>("GET", `/projects/${projectId}/files.json`);
}

async uploadProjectFile(
  projectId: string | number,
  data: {
    token: string;
    version_id?: number;
    filename?: string;
    description?: string;
  }
): Promise<RedmineResult<void>> {
  return this.request<void>("POST", `/projects/${projectId}/files.json`, {
    file: data,
  });
}
```

**Step 11: Füge Relation-Methoden hinzu**

```typescript
// Issue Relations
async listIssueRelations(issueId: number): Promise<RedmineResult<RedmineRelationsResponse>> {
  return this.request<RedmineRelationsResponse>("GET", `/issues/${issueId}/relations.json`);
}

async getRelation(id: number): Promise<RedmineResult<{ relation: RedmineRelation }>> {
  return this.request<{ relation: RedmineRelation }>("GET", `/relations/${id}.json`);
}

async createIssueRelation(
  issueId: number,
  data: {
    issue_to_id: number;
    relation_type: string;
    delay?: number;
  }
): Promise<RedmineResult<{ relation: RedmineRelation }>> {
  return this.request<{ relation: RedmineRelation }>("POST", `/issues/${issueId}/relations.json`, {
    relation: data,
  });
}

async deleteRelation(id: number): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/relations/${id}.json`);
}
```

**Step 12: Füge Version-Methoden hinzu**

```typescript
// Versions
async listVersions(projectId: string | number): Promise<RedmineResult<RedmineVersionsResponse>> {
  return this.request<RedmineVersionsResponse>("GET", `/projects/${projectId}/versions.json`);
}

async getVersion(id: number): Promise<RedmineResult<{ version: RedmineVersion }>> {
  return this.request<{ version: RedmineVersion }>("GET", `/versions/${id}.json`);
}

async createVersion(
  projectId: string | number,
  data: {
    name: string;
    status?: string;
    sharing?: string;
    due_date?: string;
    description?: string;
    wiki_page_title?: string;
  }
): Promise<RedmineResult<{ version: RedmineVersion }>> {
  return this.request<{ version: RedmineVersion }>("POST", `/projects/${projectId}/versions.json`, {
    version: data,
  });
}

async updateVersion(
  id: number,
  data: {
    name?: string;
    status?: string;
    sharing?: string;
    due_date?: string;
    description?: string;
    wiki_page_title?: string;
  }
): Promise<RedmineResult<{ version: RedmineVersion }>> {
  return this.request<{ version: RedmineVersion }>("PUT", `/versions/${id}.json`, {
    version: data,
  });
}

async deleteVersion(id: number): Promise<RedmineResult<void>> {
  return this.request<void>("DELETE", `/versions/${id}.json`);
}
```

**Step 13: Füge Metadata-Methoden hinzu**

```typescript
// Trackers
async listTrackers(): Promise<RedmineResult<RedmineTrackersResponse>> {
  return this.request<RedmineTrackersResponse>("GET", "/trackers.json");
}

// Issue Statuses
async listIssueStatuses(): Promise<RedmineResult<RedmineIssueStatusesResponse>> {
  return this.request<RedmineIssueStatusesResponse>("GET", "/issue_statuses.json");
}

// Issue Categories
async listIssueCategories(
  projectId: string | number
): Promise<RedmineResult<RedmineCategoriesResponse>> {
  return this.request<RedmineCategoriesResponse>("GET", `/projects/${projectId}/issue_categories.json`);
}

async getIssueCategory(id: number): Promise<RedmineResult<{ issue_category: RedmineCategory }>> {
  return this.request<{ issue_category: RedmineCategory }>("GET", `/issue_categories/${id}.json`);
}

async createIssueCategory(
  projectId: string | number,
  data: {
    name: string;
    assigned_to_id?: number;
  }
): Promise<RedmineResult<{ issue_category: RedmineCategory }>> {
  return this.request<{ issue_category: RedmineCategory }>(
    "POST",
    `/projects/${projectId}/issue_categories.json`,
    { issue_category: data }
  );
}

async updateIssueCategory(
  id: number,
  data: {
    name?: string;
    assigned_to_id?: number;
  }
): Promise<RedmineResult<{ issue_category: RedmineCategory }>> {
  return this.request<{ issue_category: RedmineCategory }>("PUT", `/issue_categories/${id}.json`, {
    issue_category: data,
  });
}

async deleteIssueCategory(
  id: number,
  reassignToId?: number
): Promise<RedmineResult<void>> {
  const query = reassignToId ? `?reassign_to_id=${reassignToId}` : "";
  return this.request<void>("DELETE", `/issue_categories/${id}.json${query}`);
}

// Custom Fields
async listCustomFields(): Promise<RedmineResult<RedmineCustomFieldsResponse>> {
  return this.request<RedmineCustomFieldsResponse>("GET", "/custom_fields.json");
}

// Queries
async listQueries(): Promise<RedmineResult<RedmineQueriesResponse>> {
  return this.request<RedmineQueriesResponse>("GET", "/queries.json");
}
```

**Step 14: Füge Search-Methode hinzu**

```typescript
// Search
async search(params: {
  q: string;
  scope?: string;
  all_words?: boolean;
  titles_only?: boolean;
  open_issues?: boolean;
  attachments?: string;
  issues?: boolean;
  news?: boolean;
  documents?: boolean;
  changesets?: boolean;
  wiki_pages?: boolean;
  messages?: boolean;
  projects?: boolean;
  limit?: number;
  offset?: number;
}): Promise<RedmineResult<RedmineSearchResponse>> {
  const query = new URLSearchParams();
  query.set("q", params.q);
  if (params.scope) query.set("scope", params.scope);
  if (params.all_words !== undefined) query.set("all_words", params.all_words ? "1" : "0");
  if (params.titles_only !== undefined) query.set("titles_only", params.titles_only ? "1" : "0");
  if (params.open_issues !== undefined) query.set("open_issues", params.open_issues ? "1" : "0");
  if (params.attachments) query.set("attachments", params.attachments);
  if (params.issues) query.set("issues", "1");
  if (params.news) query.set("news", "1");
  if (params.documents) query.set("documents", "1");
  if (params.changesets) query.set("changesets", "1");
  if (params.wiki_pages) query.set("wiki_pages", "1");
  if (params.messages) query.set("messages", "1");
  if (params.projects) query.set("projects", "1");
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  return this.request<RedmineSearchResponse>("GET", `/search.json?${query.toString()}`);
}
```

**Step 15: Füge MyAccount-Methode hinzu**

```typescript
// My Account
async getMyAccount(): Promise<RedmineResult<RedmineMyAccountResponse>> {
  return this.request<RedmineMyAccountResponse>("GET", "/my/account.json");
}
```

**Step 16: Build testen**

Run: `npm run build`
Expected: Keine TypeScript-Fehler

---

## Verification

Nach Abschluss dieser Phase:
1. `npm run build` muss erfolgreich sein
2. Alle Client-Methoden vorhanden und typisiert
