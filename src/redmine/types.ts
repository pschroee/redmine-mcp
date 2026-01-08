export interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker?: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  done_ratio?: number;
  created_on: string;
  updated_on: string;
}

export interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  status: number;
  is_public: boolean;
  created_on: string;
  updated_on: string;
}

export interface RedmineIssuesResponse {
  issues: RedmineIssue[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface RedmineProjectsResponse {
  projects: RedmineProject[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface RedmineError {
  error: true;
  status: number;
  message: string;
}

export type RedmineResult<T> = T | RedmineError;
