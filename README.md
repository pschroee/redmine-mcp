# Redmine MCP Server

A Model Context Protocol (MCP) server for interacting with Redmine project management.

## Installation

```bash
npm install -g @pschroee/mcp-server
```

Or use directly with npx:

```bash
npx @pschroee/mcp-server --url=https://your-redmine.com --api-key=your-api-key
```

## Configuration

### Required

- `--url` or `REDMINE_URL`: Your Redmine instance URL
- `--api-key` or `REDMINE_API_KEY`: Your Redmine API key

### Optional

- `--tools=<groups>`: Comma-separated list of tool groups to enable
- `--exclude=<groups>`: Comma-separated list of tool groups to exclude
- `--help`: Show usage information

## Tool Groups

| Group | Tools | Description |
|-------|-------|-------------|
| `core` | 14 | Issues & Projects (CRUD, watchers, archive) |
| `metadata` | 9 | Trackers, Statuses, Categories, Custom Fields, Queries |
| `wiki` | 5 | Wiki Pages (CRUD, versioning) |
| `files` | 5 | Attachments & Project Files |
| `relations` | 9 | Issue Relations & Versions |
| `search` | 1 | Global Search |
| `account` | 1 | Current User Account |
| `time` | 5 | Time Entry tracking (CRUD, filtering) |
| `enumerations` | 3 | Issue Priorities, Time Entry Activities, Document Categories |
| `memberships` | 5 | Project Memberships (CRUD) |
| `roles` | 2 | Roles listing and details |
| `admin` | 11 | Users & Groups management (admin only) |

**Total: 70 Tools**

## Usage Examples

### Load all tools (default)

```bash
npx @pschroee/mcp-server --url=https://redmine.example.com --api-key=abc123
```

### Load only specific groups

```bash
npx @pschroee/mcp-server --tools=core,metadata
```

### Exclude specific groups

```bash
npx @pschroee/mcp-server --exclude=wiki,files
```

## Claude Configuration

### Quick Setup with Claude CLI

**macOS / Linux:**

```bash
claude mcp add redmine -s user -- npx -y @pschroee/mcp-server \
  --url=https://your-redmine.com --api-key=your-api-key
```

**Windows:**

```bash
claude mcp add redmine -s user -- cmd /c npx -y @pschroee/mcp-server \
  --url=https://your-redmine.com --api-key=your-api-key
```

### With Tool Groups

**macOS / Linux:**

```bash
claude mcp add redmine -s user -- npx -y @pschroee/mcp-server \
  --url=https://your-redmine.com --api-key=your-api-key \
  --tools=core,metadata,search
```

**Windows:**

```bash
claude mcp add redmine -s user -- cmd /c npx -y @pschroee/mcp-server \
  --url=https://your-redmine.com --api-key=your-api-key \
  --tools=core,metadata,search
```

### Manual Configuration (Claude Desktop)

#### macOS / Linux

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": [
        "@pschroee/mcp-server",
        "--url=https://your-redmine.com",
        "--api-key=your-api-key"
      ]
    }
  }
}
```

#### Windows

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "@pschroee/mcp-server",
        "--url=https://your-redmine.com",
        "--api-key=your-api-key"
      ]
    }
  }
}
```

#### With Tool Groups

**macOS / Linux:**

```json
{
  "mcpServers": {
    "redmine": {
      "command": "npx",
      "args": [
        "@pschroee/mcp-server",
        "--url=https://your-redmine.com",
        "--api-key=your-api-key",
        "--tools=core,metadata,search"
      ]
    }
  }
}
```

**Windows:**

```json
{
  "mcpServers": {
    "redmine": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "@pschroee/mcp-server",
        "--url=https://your-redmine.com",
        "--api-key=your-api-key",
        "--tools=core,metadata,search"
      ]
    }
  }
}
```

## Available Tools

### Core (Issues & Projects)

- `list_issues` - List issues with filters and sorting
- `get_issue` - Get issue details with optional includes
- `create_issue` - Create new issue
- `update_issue` - Update issue (including adding notes)
- `delete_issue` - Delete issue
- `add_issue_watcher` - Add watcher to issue
- `remove_issue_watcher` - Remove watcher from issue
- `list_projects` - List all projects
- `get_project` - Get project details
- `create_project` - Create new project
- `update_project` - Update project
- `delete_project` - Delete project
- `archive_project` - Archive project (Redmine 5.0+)
- `unarchive_project` - Unarchive project (Redmine 5.0+)

### Metadata

- `list_trackers` - List all trackers
- `list_issue_statuses` - List all issue statuses
- `list_issue_categories` - List categories for a project
- `get_issue_category` - Get category details
- `create_issue_category` - Create category
- `update_issue_category` - Update category
- `delete_issue_category` - Delete category
- `list_custom_fields` - List custom fields (admin)
- `list_queries` - List saved queries

### Wiki

- `list_wiki_pages` - List wiki pages in project
- `get_wiki_page` - Get wiki page content
- `create_wiki_page` - Create wiki page
- `update_wiki_page` - Update wiki page
- `delete_wiki_page` - Delete wiki page

### Files

- `get_attachment` - Get attachment metadata
- `delete_attachment` - Delete attachment
- `upload_file` - Upload file (returns token)
- `list_project_files` - List project files
- `upload_project_file` - Attach file to project

### Relations

- `list_issue_relations` - List relations for issue
- `get_relation` - Get relation details
- `create_issue_relation` - Create relation
- `delete_relation` - Delete relation
- `list_versions` - List project versions
- `get_version` - Get version details
- `create_version` - Create version
- `update_version` - Update version
- `delete_version` - Delete version

### Search

- `search` - Search across Redmine

### Account

- `get_my_account` - Get current user info

### Time Entries

- `list_time_entries` - List time entries with filters (project, user, date range)
- `get_time_entry` - Get time entry details
- `create_time_entry` - Log time on issue or project
- `update_time_entry` - Update time entry
- `delete_time_entry` - Delete time entry

### Enumerations

- `list_issue_priorities` - List all issue priorities
- `list_time_entry_activities` - List all time entry activities
- `list_document_categories` - List all document categories

### Memberships

- `list_project_memberships` - List project members
- `get_membership` - Get membership details
- `create_project_membership` - Add member to project
- `update_membership` - Update member roles
- `delete_membership` - Remove member from project

### Roles

- `list_roles` - List all roles
- `get_role` - Get role with permissions

### Admin (Users & Groups)

- `list_users` - List users with filters
- `get_user` - Get user details
- `create_user` - Create new user
- `update_user` - Update user
- `delete_user` - Delete user
- `list_groups` - List all groups
- `get_group` - Get group details
- `create_group` - Create group
- `delete_group` - Delete group
- `add_user_to_group` - Add user to group
- `remove_user_from_group` - Remove user from group

## Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Fix lint errors
npm run lint:fix

# Build
npm run build
```

## Testing

The project includes comprehensive integration tests that run against a real Redmine instance.

### Setup

1. Create a `.env` file in the project root:

```bash
REDMINE_URL=http://your-redmine-instance:port
REDMINE_API_KEY=your-api-key
```

2. Run the tests:

```bash
npm test
```

### Test Coverage

The test suite includes 195 tests across 12 test files:

| Test File | Tests | Description |
|-----------|-------|-------------|
| `account.test.ts` | 1 | Current user account |
| `core.test.ts` | 48 | Projects and Issues CRUD |
| `metadata.test.ts` | 14 | Trackers, Statuses, Categories |
| `relations.test.ts` | 24 | Versions and Issue Relations |
| `wiki.test.ts` | 14 | Wiki Pages CRUD |
| `files.test.ts` | 11 | File uploads and attachments |
| `search.test.ts` | 12 | Global search functionality |
| `enumerations.test.ts` | 4 | Issue priorities, activities, document categories |
| `time.test.ts` | 17 | Time entry CRUD operations |
| `roles.test.ts` | 4 | Roles listing and details |
| `admin.test.ts` | 33 | Users and Groups management |
| `memberships.test.ts` | 13 | Project membership operations |

Tests are run sequentially and share state. A global setup creates the test project with all required modules enabled, and a global teardown cleans up all test data.

## Getting your API Key

1. Log into your Redmine instance
2. Go to My Account (usually `/my/account`)
3. Find "API access key" in the sidebar
4. Click "Show" or generate a new key

## License

MIT
