# Redmine MCP Server Design

## Overview

Ein stdio MCP Server für Redmine, der Issues und Projects über die Redmine REST API verfügbar macht. Kann via `npx` ausgeführt und mit `claude mcp add` hinzugefügt werden.

## Konfiguration

**CLI-Argumente (Vorrang) mit Fallback auf Umgebungsvariablen:**

- `--url <url>` / `REDMINE_URL` – Redmine Base-URL
- `--api-key <key>` / `REDMINE_API_KEY` – Redmine API Key

**Nutzung:**
```bash
claude mcp add redmine-mcp --scope user -- npx redmine-mcp --url https://redmine.example.com --api-key YOUR_KEY
```

## Projektstruktur

```
redmine-mcp/
├── src/
│   ├── index.ts          # Entry point, CLI parsing, Server-Start
│   ├── server.ts         # MCP Server Konfiguration
│   ├── tools/
│   │   ├── issues.ts     # Issue-Tools
│   │   └── projects.ts   # Project-Tools
│   └── redmine/
│       ├── client.ts     # HTTP Client für Redmine API
│       └── types.ts      # TypeScript Typen
├── package.json
├── tsconfig.json
└── README.md
```

## Tools

### Issue-Tools

| Tool | Beschreibung | Parameter |
|------|--------------|-----------|
| `list_issues` | Issues auflisten mit Filtern | `project_id?`, `status?`, `assigned_to_id?`, `limit?`, `offset?` |
| `get_issue` | Einzelnes Issue abrufen | `issue_id` |
| `create_issue` | Neues Issue erstellen | `project_id`, `subject`, `description?`, `tracker_id?`, `priority_id?`, `assigned_to_id?` |
| `update_issue` | Issue bearbeiten | `issue_id`, `subject?`, `description?`, `status_id?`, `assigned_to_id?`, `notes?` |

### Project-Tools

| Tool | Beschreibung | Parameter |
|------|--------------|-----------|
| `list_projects` | Alle Projekte auflisten | `limit?`, `offset?` |
| `get_project` | Einzelnes Projekt abrufen | `project_id` |
| `create_project` | Neues Projekt erstellen | `name`, `identifier`, `description?`, `is_public?` |
| `update_project` | Projekt bearbeiten | `project_id`, `name?`, `description?`, `is_public?` |

## Operationen

- Lesen (list, get)
- Erstellen (create)
- Bearbeiten (update)
- **Kein Löschen** (bewusst ausgeschlossen für Sicherheit)

## Technologie

- **Runtime:** Node.js 18+
- **Sprache:** TypeScript (kompiliert zu JavaScript)
- **Dependencies:**
  - `@modelcontextprotocol/sdk` – Offizielles MCP SDK
  - `zod` – Schema-Validierung für Tool-Parameter

## Redmine Client

```typescript
class RedmineClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "X-Redmine-API-Key": this.apiKey,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        error: true,
        status: response.status,
        message: error.errors?.join(", ") || `HTTP ${response.status}`
      } as T;
    }
    return response.json();
  }
}
```

## Error Handling

Strukturierte Fehler für Claude:

```json
{
  "error": true,
  "status": 404,
  "message": "Issue not found"
}
```

## MCP Server Setup

- Verwendet `StdioServerTransport` für stdio-Kommunikation
- Shebang `#!/usr/bin/env node` für npx-Ausführung
- Tools werden via `McpServer` registriert
