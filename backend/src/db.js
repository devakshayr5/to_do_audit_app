// db.js - one shared connection pool + the helper that sets the audit user
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_app',
  connectionLimit: 10,
  dateStrings: true, // return DATE/TIMESTAMP as plain strings (avoids timezone surprises)
});

// Make every connection use UTC so timestamps are consistent.
pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));

/**
 * Run database work "as" a given user.
 *
 * Why this exists: a session variable (@app_user) only lives on ONE connection.
 * A pool hands out different connections, so we must:
 *   1. borrow a single connection,
 *   2. SET @app_user on it,
 *   3. run our INSERT/UPDATE/DELETE on that SAME connection (the triggers read @app_user),
 *   4. clear the variable and give the connection back.
 */
async function runAsUser(user, work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET @app_user = ?', [user]);
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    // Never leak one user's name to the next request that reuses this connection.
    await conn.query('SET @app_user = NULL').catch(() => {});
    conn.release();
  }
}

module.exports = { pool, runAsUser };
