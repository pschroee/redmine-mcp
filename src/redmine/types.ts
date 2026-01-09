// === COMMON TYPES ===

export interface RedmineError {
  error: true;
  status: number;
  message: string;
}

export type RedmineResult<T> = T | RedmineError;

// === CUSTOM FIELDS ===

export interface RedmineCustomFieldValue {
  id: number;
  name: string;
  value: string | string[];
  multiple?: boolean;
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

// === TRACKERS ===

export interface RedmineTracker {
  id: number;
  name: string;
  default_status?: { id: number; name: string };
  description?: string;
}

export interface RedmineTrackersResponse {
  trackers: RedmineTracker[];
}

// === ISSUE STATUSES ===

export interface RedmineIssueStatus {
  id: number;
  name: string;
  is_closed: boolean;
}

export interface RedmineIssueStatusesResponse {
  issue_statuses: RedmineIssueStatus[];
}

// === CATEGORIES ===

export interface RedmineCategory {
  id: number;
  project?: { id: number; name: string };
  name: string;
  assigned_to?: { id: number; name: string };
}

export interface RedmineCategoriesResponse {
  issue_categories: RedmineCategory[];
}

// === ACTIVITIES ===

export interface RedmineActivity {
  id: number;
  name: string;
  is_default: boolean;
  active: boolean;
}

// === QUERIES ===

export interface RedmineQuery {
  id: number;
  name: string;
  is_public: boolean;
  project_id?: number;
}

export interface RedmineQueriesResponse {
  queries: RedmineQuery[];
}

// === ATTACHMENTS ===

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

export interface RedmineUploadResponse {
  upload: { token: string };
}

// === FILES ===

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

// === JOURNALS ===

export interface RedmineJournalDetail {
  property: string;
  name: string;
  old_value?: string;
  new_value?: string;
}

export interface RedmineJournal {
  id: number;
  user: { id: number; name: string };
  notes?: string;
  private_notes: boolean;
  created_on: string;
  details: RedmineJournalDetail[];
}

// === CHANGESETS ===

export interface RedmineChangeset {
  revision: string;
  user?: { id: number; name: string };
  comments?: string;
  committed_on: string;
}

// === RELATIONS ===

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

// === VERSIONS ===

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

// === ISSUES ===

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

export interface RedmineIssuesResponse {
  issues: RedmineIssue[];
  total_count: number;
  offset: number;
  limit: number;
}

// === PROJECTS ===

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

export interface RedmineProjectsResponse {
  projects: RedmineProject[];
  total_count: number;
  offset: number;
  limit: number;
}

// === WIKI ===

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

// === SEARCH ===

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

// === ACCOUNT ===

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

// === TIME ENTRIES ===

export interface RedmineTimeEntry {
  id: number;
  project: { id: number; name: string };
  issue?: { id: number };
  user: { id: number; name: string };
  activity: { id: number; name: string };
  hours: number;
  comments?: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
  custom_fields?: RedmineCustomFieldValue[];
}

export interface RedmineTimeEntriesResponse {
  time_entries: RedmineTimeEntry[];
  total_count: number;
  offset: number;
  limit: number;
}

// === ENUMERATIONS ===

export interface RedmineEnumeration {
  id: number;
  name: string;
  is_default: boolean;
}

export interface RedmineIssuePrioritiesResponse {
  issue_priorities: RedmineEnumeration[];
}

export interface RedmineTimeEntryActivitiesResponse {
  time_entry_activities: RedmineEnumeration[];
}

export interface RedmineDocumentCategoriesResponse {
  document_categories: RedmineEnumeration[];
}

// === USERS ===

export interface RedmineUser {
  id: number;
  login: string;
  admin?: boolean;
  firstname: string;
  lastname: string;
  mail?: string;
  created_on: string;
  updated_on?: string;
  last_login_on?: string;
  passwd_changed_on?: string;
  api_key?: string;
  status?: number;
  custom_fields?: RedmineCustomFieldValue[];
  memberships?: RedmineMembership[];
  groups?: { id: number; name: string }[];
}

export interface RedmineUsersResponse {
  users: RedmineUser[];
  total_count: number;
  offset: number;
  limit: number;
}

// === GROUPS ===

export interface RedmineGroup {
  id: number;
  name: string;
  users?: { id: number; name: string }[];
  memberships?: RedmineMembership[];
}

export interface RedmineGroupsResponse {
  groups: RedmineGroup[];
  total_count: number;
  offset: number;
  limit: number;
}

// === MEMBERSHIPS ===

export interface RedmineMembership {
  id: number;
  project: { id: number; name: string };
  user?: { id: number; name: string };
  group?: { id: number; name: string };
  roles: { id: number; name: string; inherited?: boolean }[];
}

export interface RedmineMembershipsResponse {
  memberships: RedmineMembership[];
  total_count: number;
  offset: number;
  limit: number;
}

// === ROLES ===

export interface RedmineRole {
  id: number;
  name: string;
  assignable?: boolean;
  issues_visibility?: string;
  time_entries_visibility?: string;
  users_visibility?: string;
  permissions?: string[];
}

export interface RedmineRolesResponse {
  roles: RedmineRole[];
}

// === CHECKLISTS (Plugin: redmine_checklists) ===

export interface RedmineChecklist {
  id: number;
  issue_id: number;
  subject: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RedmineChecklistsResponse {
  checklists: RedmineChecklist[];
}

// === AGILE (Plugin: redmine_agile) ===

export interface RedmineAgileSprint {
  id: number;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  sharing?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RedmineAgileSprintsResponse {
  agile_sprints: RedmineAgileSprint[];
}

export interface RedmineAgileData {
  id: number;
  issue_id: number;
  position: number;
  story_points?: number;
  agile_sprint_id?: number;
}

export interface RedmineAgileDataResponse {
  agile_data: RedmineAgileData;
}
