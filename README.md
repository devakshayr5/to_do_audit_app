# To-Do App with Database-Level Auditing

React (Vite) + Node.js/Express REST API + MySQL. Every change to a to-do is recorded
in a `todo_audit` table by **MySQL triggers** — the Node.js code never writes audit rows.

## Project layout
```
database/   01_schema.sql, 02_audit_table.sql, 03_triggers.sql
backend/    Express API (src/server.js, db.js, routes/, middleware/)
frontend/   React app built with Vite
```

## Prerequisites
Node.js 18+, MySQL 8.0+ (JSON column + triggers), npm.

## Setup
### 1. Database
```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_audit_table.sql
mysql -u root -p < database/03_triggers.sql
```
(Use the `mysql` command-line client for the trigger file: it understands `DELIMITER`.)

### 2. Backend
```bash
cd backend
cp .env.example .env      # then put your MySQL password in .env
npm install
npm run dev               # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```
Open http://localhost:5173. Type a name in **Acting as** (top right) and start adding to-dos.

## API
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/todos?status=pending\|completed` | List, optional filter |
| GET | `/api/todos/:id` | One to-do |
| POST | `/api/todos` | Create |
| PUT | `/api/todos/:id` | Edit |
| PATCH | `/api/todos/:id/status` | Mark pending / completed |
| DELETE | `/api/todos/:id` | Delete |
| GET | `/api/todos/:id/audit` | History of one to-do |
| GET | `/api/audit?limit=100` | Recent changes of all to-dos (incl. deleted) |

The acting user is sent in the `X-User` request header.

## Audit design note
* **Table `todo_audit`**: `todo_id`, `action` (INSERT/UPDATE/DELETE), `old_values` and
  `new_values` (JSON), `changed_by`, `changed_at` (millisecond precision).
* **Triggers** `AFTER INSERT/UPDATE/DELETE` on `todos` build the JSON with `JSON_OBJECT`.
  Because they run inside MySQL, the audit cannot be skipped by a bug in the app, and it also
  captures changes made from other tools (Workbench, scripts). UPDATE triggers skip no-op
  updates using the NULL-safe `<=>` operator.
* **Who changed it**: the API sets the session variable `@app_user` before each write and the
  triggers read it. `runAsUser()` in `backend/src/db.js` borrows ONE pooled connection, sets the
  variable, runs the write in a transaction on that same connection, then clears the variable.
  If `@app_user` is not set, the trigger falls back to `CONCAT('db:', CURRENT_USER())`.
* **No foreign key** from `todo_audit.todo_id` to `todos.id`, so history survives deletion.
* **Limitation**: the user name comes from a header and is not authenticated. In production,
  derive it from a login token (JWT/session).

## Quick check of the triggers
```bash
curl -X POST localhost:5000/api/todos -H "Content-Type: application/json" -H "X-User: alice" -d '{"title":"Test"}'
curl -X PATCH localhost:5000/api/todos/1/status -H "Content-Type: application/json" -H "X-User: bob" -d '{"status":"completed"}'
mysql -u root -p -e "SELECT * FROM todo_app.todo_audit\G"
```
