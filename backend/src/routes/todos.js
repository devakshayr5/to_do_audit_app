// todos.js - REST API for to-dos
const express = require('express');
const { pool, runAsUser } = require('../db');

const router = express.Router();
const STATUSES = ['pending', 'completed'];

// Check the request body. Returns { errors, values }.
function validateTodo(body) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push('title is required');
  if (title.length > 255) errors.push('title must be 255 characters or fewer');

  const description = body.description ? String(body.description).trim() : null;

  const status = body.status || 'pending';
  if (!STATUSES.includes(status)) errors.push('status must be "pending" or "completed"');

  const dueDate = body.due_date || null;
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push('due_date must be YYYY-MM-DD');

  return { errors, values: { title, description, status, due_date: dueDate } };
}

async function findTodo(id, conn = pool) {
  const [rows] = await conn.query('SELECT * FROM todos WHERE id = ?', [id]);
  return rows[0];
}

// GET /api/todos?status=pending|completed   -> list (optionally filtered)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status filter must be "pending" or "completed"' });
    }
    const [rows] = status
      ? await pool.query('SELECT * FROM todos WHERE status = ? ORDER BY id DESC', [status])
      : await pool.query('SELECT * FROM todos ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/todos/:id   -> one to-do
router.get('/:id', async (req, res, next) => {
  try {
    const todo = await findTodo(req.params.id);
    if (!todo) return res.status(404).json({ error: 'To-do not found' });
    res.json(todo);
  } catch (err) { next(err); }
});

// POST /api/todos   -> create
router.post('/', async (req, res, next) => {
  try {
    const { errors, values } = validateTodo(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const todo = await runAsUser(req.user, async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO todos (title, description, status, due_date) VALUES (?, ?, ?, ?)',
        [values.title, values.description, values.status, values.due_date]
      );
      return findTodo(result.insertId, conn);
    });
    res.status(201).json(todo);
  } catch (err) { next(err); }
});

// PUT /api/todos/:id   -> edit all fields
router.put('/:id', async (req, res, next) => {
  try {
    const { errors, values } = validateTodo(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const todo = await runAsUser(req.user, async (conn) => {
      const [result] = await conn.query(
        'UPDATE todos SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ?',
        [values.title, values.description, values.status, values.due_date, req.params.id]
      );
      if (result.affectedRows === 0) return null;
      return findTodo(req.params.id, conn);
    });
    if (!todo) return res.status(404).json({ error: 'To-do not found' });
    res.json(todo);
  } catch (err) { next(err); }
});

// PATCH /api/todos/:id/status   -> mark pending / completed
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be "pending" or "completed"' });
    }
    const todo = await runAsUser(req.user, async (conn) => {
      const [result] = await conn.query('UPDATE todos SET status = ? WHERE id = ?', [status, req.params.id]);
      if (result.affectedRows === 0) return null;
      return findTodo(req.params.id, conn);
    });
    if (!todo) return res.status(404).json({ error: 'To-do not found' });
    res.json(todo);
  } catch (err) { next(err); }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await runAsUser(req.user, async (conn) => {
      const [result] = await conn.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
      return result.affectedRows > 0;
    });
    if (!deleted) return res.status(404).json({ error: 'To-do not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /api/todos/:id/audit   -> change history of one to-do (newest first)
// Works even for deleted to-dos, because audit rows are kept.
router.get('/:id/audit', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM todo_audit WHERE todo_id = ? ORDER BY audit_id DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
