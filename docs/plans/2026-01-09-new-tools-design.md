# New Tools Implementation Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 26 new MCP tools for Time Entries, Enumerations, Users, Groups, Memberships, and Roles.

**Architecture:** Extend existing tool group pattern with 5 new groups. Admin-only tools separated into `admin` group for optional loading.

**Tech Stack:** TypeScript, Zod schemas, MCP SDK, Vitest

---

## New Tool Groups

### `time` (5 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_time_entries` | `GET /time_entries.json` | List with filters (project, user, date range) |
| `get_time_entry` | `GET /time_entries/:id.json` | Get single entry |
| `create_time_entry` | `POST /time_entries.json` | Log time (issue_id OR project_id + hours) |
| `update_time_entry` | `PUT /time_entries/:id.json` | Update entry |
| `delete_time_entry` | `DELETE /time_entries/:id.json` | Delete entry |

#### `list_time_entries` Parameters
```typescript
{
  project_id?: string | number,
  user_id?: number | "me",
  spent_on?: string,           // YYYY-MM-DD
  from?: string,               // Date range start
  to?: string,                 // Date range end
  limit?: number,
  offset?: number
}
```

#### `create_time_entry` Parameters
```typescript
{
  issue_id?: number,           // Either issue_id OR project_id required
  project_id?: string | number,
  hours: number,               // Required
  activity_id?: number,        // Required unless default exists
  spent_on?: string,           // YYYY-MM-DD, defaults to today
  comments?: string,           // Max 255 chars
  user_id?: number             // Admin only: log time for another user
}
```

---

### `enumerations` (3 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_issue_priorities` | `GET /enumerations/issue_priorities.json` | Get priority IDs |
| `list_time_entry_activities` | `GET /enumerations/time_entry_activities.json` | Get activity IDs |
| `list_document_categories` | `GET /enumerations/document_categories.json` | Get doc category IDs |

All return arrays with `{ id, name, is_default }` objects.

---

### `admin` (11 Tools) - Admin Only

#### Users (5 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_users` | `GET /users.json` | List users with filters |
| `get_user` | `GET /users/:id.json` | Get user details |
| `create_user` | `POST /users.json` | Create new user |
| `update_user` | `PUT /users/:id.json` | Update user |
| `delete_user` | `DELETE /users/:id.json` | Delete user |

#### `list_users` Parameters
```typescript
{
  status?: number,             // 0=all, 1=active, 2=registered, 3=locked
  name?: string,               // Search login, firstname, lastname, mail
  group_id?: number,
  limit?: number,
  offset?: number
}
```

#### `create_user` Parameters
```typescript
{
  login: string,               // Required
  firstname: string,           // Required
  lastname: string,            // Required
  mail: string,                // Required
  password?: string,
  generate_password?: boolean,
  must_change_passwd?: boolean,
  auth_source_id?: number,
  mail_notification?: string,
  admin?: boolean,
  send_information?: boolean
}
```

#### Groups (6 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_groups` | `GET /groups.json` | List all groups |
| `get_group` | `GET /groups/:id.json` | Get group with members |
| `create_group` | `POST /groups.json` | Create group |
| `delete_group` | `DELETE /groups/:id.json` | Delete group |
| `add_user_to_group` | `POST /groups/:id/users.json` | Add user |
| `remove_user_from_group` | `DELETE /groups/:id/users/:user_id.json` | Remove user |

#### `create_group` Parameters
```typescript
{
  name: string,                // Required
  user_ids?: number[]          // Optional: initial members
}
```

---

### `memberships` (5 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_project_memberships` | `GET /projects/:id/memberships.json` | List members |
| `get_membership` | `GET /memberships/:id.json` | Get membership |
| `create_project_membership` | `POST /projects/:id/memberships.json` | Add member |
| `update_membership` | `PUT /memberships/:id.json` | Update roles |
| `delete_membership` | `DELETE /memberships/:id.json` | Remove member |

#### `create_project_membership` Parameters
```typescript
{
  project_id: string | number,
  user_id: number,             // User OR Group ID
  role_ids: number[]           // Required: at least one role
}
```

---

### `roles` (2 Tools)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `list_roles` | `GET /roles.json` | List all roles |
| `get_role` | `GET /roles/:id.json` | Get role with permissions |

---

## Tests

### `08-enumerations.test.ts` (4 Tests)
- `list_issue_priorities`: should list all priorities
- `list_issue_priorities`: should have exactly one default priority
- `list_time_entry_activities`: should list all activities
- `list_document_categories`: should list all document categories

### `09-time.test.ts` (15 Tests)
- `create_time_entry`: should create with issue_id
- `create_time_entry`: should create with project_id
- `create_time_entry`: should create with all fields
- `create_time_entry`: should fail without hours (422)
- `create_time_entry`: should fail without issue_id or project_id (422)
- `create_time_entry`: should fail for nonexistent issue (422)
- `create_time_entry`: should fail for nonexistent project (404)
- `list_time_entries`: should list all
- `list_time_entries`: should filter by project_id
- `list_time_entries`: should filter by user_id=me
- `list_time_entries`: should filter by date range
- `get_time_entry`: should get by id
- `get_time_entry`: should fail for nonexistent (404)
- `update_time_entry`: should update hours and comments
- `update_time_entry`: should fail for nonexistent (404)
- `delete_time_entry`: should delete
- `delete_time_entry`: should fail for nonexistent (404)

### `10-roles.test.ts` (4 Tests)
- `list_roles`: should list all roles
- `list_roles`: should have at least one role
- `get_role`: should get role with permissions
- `get_role`: should fail for nonexistent (404)

### `11-memberships.test.ts` (12 Tests)
- `list_project_memberships`: should list for project
- `list_project_memberships`: should fail for nonexistent project (404)
- `create_project_membership`: should add user with role
- `create_project_membership`: should fail without role_ids (422)
- `create_project_membership`: should fail for nonexistent user (422)
- `create_project_membership`: should fail for nonexistent role (422)
- `get_membership`: should get by id
- `get_membership`: should fail for nonexistent (404)
- `update_membership`: should update roles
- `update_membership`: should fail for nonexistent (404)
- `delete_membership`: should remove
- `delete_membership`: should fail for nonexistent (404)

### `12-admin.test.ts` (28 Tests)
- `create_user`: should create with required fields
- `create_user`: should create with generate_password
- `create_user`: should fail without login (422)
- `create_user`: should fail without mail (422)
- `create_user`: should fail with duplicate login (422)
- `create_user`: should fail with invalid email (422)
- `list_users`: should list all active
- `list_users`: should filter by status
- `list_users`: should filter by name
- `list_users`: should filter by group_id
- `get_user`: should get by id
- `get_user`: should get with includes
- `get_user`: should get current user
- `get_user`: should fail for nonexistent (404)
- `update_user`: should update firstname
- `update_user`: should lock user (status=3)
- `update_user`: should fail for nonexistent (404)
- `create_group`: should create
- `create_group`: should create with initial users
- `create_group`: should fail without name (422)
- `create_group`: should fail with duplicate name (422)
- `list_groups`: should list all
- `get_group`: should get by id
- `get_group`: should get with users include
- `get_group`: should fail for nonexistent (404)
- `add_user_to_group`: should add user
- `add_user_to_group`: should fail for nonexistent user (404)
- `remove_user_from_group`: should remove user
- `remove_user_from_group`: should fail for nonexistent user (404)
- `delete_user`: should delete
- `delete_user`: should fail for nonexistent (404)
- `delete_group`: should delete
- `delete_group`: should fail for nonexistent (404)

---

## Implementation Phases

### Phase 1: Client Extension
1. Add types to `src/redmine/types.ts`
2. Add client methods to `src/redmine/client.ts`
   - Time Entries (5 methods)
   - Enumerations (3 methods)
   - Users (5 methods)
   - Groups (6 methods)
   - Memberships (5 methods)
   - Roles (2 methods)

### Phase 2: Tools Implementation
1. Create `src/tools/time.ts` (5 tools)
2. Create `src/tools/enumerations.ts` (3 tools)
3. Create `src/tools/admin.ts` (11 tools)
4. Create `src/tools/memberships.ts` (5 tools)
5. Create `src/tools/roles.ts` (2 tools)
6. Update `src/tools/index.ts` (register new groups)

### Phase 3: Tests
1. Create `tests/08-enumerations.test.ts` (4 tests)
2. Create `tests/09-time.test.ts` (15 tests)
3. Create `tests/10-roles.test.ts` (4 tests)
4. Create `tests/11-memberships.test.ts` (12 tests)
5. Create `tests/12-admin.test.ts` (28 tests)
6. Extend `tests/state.ts` (new state fields)
7. Update `vitest.config.ts` (include new test files)

### Phase 4: Documentation & Finish
1. Run build (`npm run build`)
2. Run all tests (`npm test`)
3. Update `README.md`:
   - Extend tool groups table
   - Document new tools
   - Add usage examples for `--exclude=admin`
4. Version bump in `package.json` (0.2.0 → 0.3.0)
5. Commit all changes

---

## Summary

| Metric | Count |
|--------|-------|
| New client methods | 26 |
| New tool files | 5 |
| New tools | 26 |
| New tests | 63 |
| **Total tools** | **70** |
| **Total tests** | **187** |
