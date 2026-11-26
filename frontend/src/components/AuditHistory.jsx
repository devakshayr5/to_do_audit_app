import { useEffect, useState } from 'react';
import { getTodoAudit, getRecentAudit } from '../api';

// MySQL gives "2026-11-25 10:30:00.123" in UTC; turn it into local time.
function formatTime(value) {
  const date = new Date(value.replace(' ', 'T') + 'Z');
  return date.toLocaleString();
}

// For an UPDATE, list only the fields that changed.
function changedFields(oldV, newV) {
  return Object.keys(newV).filter((key) => oldV[key] !== newV[key]);
}

function Entry({ row, showTodoId }) {
  const { action, old_values: oldV, new_values: newV } = row;
  return (
    <li className="audit-entry">
      <div className="audit-head">
        <span className={`badge ${action}`}>{action}</span>
        <span>
          {showTodoId && `To-do #${row.todo_id} · `}
          by <strong>{row.changed_by}</strong>
        </span>
        <time>{formatTime(row.changed_at)}</time>
      </div>

      {action === 'UPDATE' &&
        changedFields(oldV, newV).map((key) => (
          <p key={key} className="diff">
            <b>{key}:</b> <del>{String(oldV[key] ?? '(empty)')}</del> → <ins>{String(newV[key] ?? '(empty)')}</ins>
          </p>
        ))}

      {action === 'INSERT' && <p className="diff">Created “{newV.title}” ({newV.status})</p>}
      {action === 'DELETE' && <p className="diff">Deleted “{oldV.title}” ({oldV.status})</p>}
    </li>
  );
}

// If `todo` is given: history of that to-do. Otherwise: recent activity of everything.
export default function AuditHistory({ todo, onClose }) {
  const [rows, setRows] = useState(null); // null = still loading
  const [error, setError] = useState('');

  // useEffect runs after the component appears (and again if `todo` changes)
  useEffect(() => {
    const load = todo ? getTodoAudit(todo.id) : getRecentAudit();
    load.then(setRows).catch((err) => setError(err.message));
  }, [todo]);

  return (
    <section className="panel">
      <div className="row between">
        <h2>{todo ? `History of “${todo.title}”` : 'Recent activity (all to-dos)'}</h2>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p>Loading…</p>}
      {rows && rows.length === 0 && <p className="empty">No changes recorded yet.</p>}
      {rows && (
        <ul className="audit-list">
          {rows.map((row) => <Entry key={row.audit_id} row={row} showTodoId={!todo} />)}
        </ul>
      )}
    </section>
  );
}
