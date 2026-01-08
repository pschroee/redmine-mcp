import type {
  RedmineIssue,
  RedmineIssuesResponse,
  RedmineProject,
  RedmineProjectsResponse,
  RedmineResult,
  RedmineError,
} from "./types.js";

export class RedmineClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<RedmineResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "X-Redmine-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
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

      return (await response.json()) as T;
    } catch (err) {
      const errorResponse: RedmineError = {
        error: true,
        status: 0,
        message: err instanceof Error ? err.message : "Unknown error",
      };
      return errorResponse;
    }
  }

  // Issues
  async listIssues(params?: {
    project_id?: string | number;
    status_id?: string;
    assigned_to_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineIssuesResponse>> {
    const query = new URLSearchParams();
    if (params?.project_id) query.set("project_id", String(params.project_id));
    if (params?.status_id) query.set("status_id", params.status_id);
    if (params?.assigned_to_id) query.set("assigned_to_id", String(params.assigned_to_id));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/issues.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineIssuesResponse>("GET", path);
  }

  async getIssue(id: number): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("GET", `/issues/${id}.json`);
  }

  async createIssue(data: {
    project_id: number | string;
    subject: string;
    description?: string;
    tracker_id?: number;
    priority_id?: number;
    assigned_to_id?: number;
  }): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("POST", "/issues.json", {
      issue: data,
    });
  }

  async updateIssue(
    id: number,
    data: {
      subject?: string;
      description?: string;
      status_id?: number;
      assigned_to_id?: number;
      notes?: string;
    }
  ): Promise<RedmineResult<{ issue: RedmineIssue }>> {
    return this.request<{ issue: RedmineIssue }>("PUT", `/issues/${id}.json`, {
      issue: data,
    });
  }

  // Projects
  async listProjects(params?: {
    limit?: number;
    offset?: number;
  }): Promise<RedmineResult<RedmineProjectsResponse>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const queryString = query.toString();
    const path = `/projects.json${queryString ? `?${queryString}` : ""}`;
    return this.request<RedmineProjectsResponse>("GET", path);
  }

  async getProject(
    id: string | number
  ): Promise<RedmineResult<{ project: RedmineProject }>> {
    return this.request<{ project: RedmineProject }>("GET", `/projects/${id}.json`);
  }

  async createProject(data: {
    name: string;
    identifier: string;
    description?: string;
    is_public?: boolean;
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
      is_public?: boolean;
    }
  ): Promise<RedmineResult<{ project: RedmineProject }>> {
    return this.request<{ project: RedmineProject }>(
      "PUT",
      `/projects/${id}.json`,
      { project: data }
    );
  }
}
