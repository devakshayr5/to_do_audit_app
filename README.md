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

The acting user is sent in the `X-User` request header.

## Audit design note
Every change to a to-do is logged by MySQL itself, using triggers. The Node.js code
never writes to the audit table.

**Tables**
- `todos` holds the to-do items.
- `todo_audit` holds the history: to-do id, action (INSERT / UPDATE / DELETE),
  old values, new values, who changed it and when. Old and new values are stored as JSON.

**Triggers**
There are three triggers on `todos`: AFTER INSERT, AFTER UPDATE and AFTER DELETE.
Each one adds a row to `todo_audit`. The update trigger skips updates where nothing
actually changed.

**Who made the change**
The React app sends the user's name in an `X-User` header. Before each write, the backend
runs `SET @app_user = '<name>'` on the database connection, and the trigger reads
`@app_user` to fill the "changed by" column. The backend uses one connection and one
transaction for this, because a session variable only exists on a single connection.
If no user is set (for example, someone edits the table directly in Workbench), the
trigger saves the database login instead.

**Other choices**
- `todo_audit` has no foreign key to `todos`, so the history is kept after a to-do is deleted.
- The user name is not verified, since there is no login in this project. In a real
  app it would come from a login token.

