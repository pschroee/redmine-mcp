# redmine-mcp

MCP server for Redmine - access issues and projects from Claude.

## Installation

```bash
claude mcp add redmine-mcp --scope user -- npx redmine-mcp --url https://your-redmine.com --api-key YOUR_API_KEY
```

Or with environment variables:

```bash
export REDMINE_URL=https://your-redmine.com
export REDMINE_API_KEY=your_api_key
claude mcp add redmine-mcp --scope user -- npx redmine-mcp
```

## Available Tools

### Issues

- `list_issues` - List issues with optional filters (project, status, assignee)
- `get_issue` - Get details of a specific issue
- `create_issue` - Create a new issue
- `update_issue` - Update an existing issue

### Projects

- `list_projects` - List all accessible projects
- `get_project` - Get details of a specific project
- `create_project` - Create a new project
- `update_project` - Update an existing project

## Configuration

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `--url` | `REDMINE_URL` | Redmine base URL |
| `--api-key` | `REDMINE_API_KEY` | Your Redmine API key |

CLI arguments take precedence over environment variables.

## Getting your API Key

1. Log into your Redmine instance
2. Go to My Account (usually `/my/account`)
3. Find "API access key" in the sidebar
4. Click "Show" or generate a new key

## License

MIT
