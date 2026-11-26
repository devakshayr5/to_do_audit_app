// audit.js - read-only view of recent changes across ALL to-dos
// (this is how you can still see deleted to-dos). The app never writes here;
// only the MySQL triggers do.
const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/audit?limit=100
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const [rows] = await pool.query('SELECT * FROM todo_audit ORDER BY audit_id DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
