import { useCallback, useEffect, useState } from 'react';
import * as api from './api';
import TodoForm from './components/TodoForm.jsx';
import TodoList from './components/TodoList.jsx';
import AuditHistory from './components/AuditHistory.jsx';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('');          // '' = all, 'pending', 'completed'
  const [view, setView] = useState('todos');         // 'todos' or 'activity'
  const [editing, setEditing] = useState(null);      // the todo being edited
  const [historyOf, setHistoryOf] = useState(null);  // the todo whose history is open
  const [user, setUserName] = useState(api.getUser());
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);        // bumps after every reload so open history re-fetches

  // Fetch the list from the server (re-created only when `filter` changes)
  const refresh = useCallback(async () => {
    try {
      setTodos(await api.listTodos(filter));
      setVersion((v) => v + 1);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [filter]);

  // Run `refresh` on first load and whenever the filter changes
  useEffect(() => { refresh(); }, [refresh]);

  function changeUser(name) {
    setUserName(name);
    api.setUser(name);
  }

  // Wrap each action: do it, then reload the list, show errors if any
  async function run(action) {
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Called by the form: create when not editing, update when editing
  async function handleSave(data) {
    if (editing) await api.updateTodo(editing.id, data);
    else await api.createTodo(data);
    setEditing(null);
    await refresh();
  }

  const handleToggle = (todo) =>
    run(() => api.setTodoStatus(todo.id, todo.status === 'completed' ? 'pending' : 'completed'));

  const handleDelete = (todo) => {
    if (window.confirm(`Delete "${todo.title}"? Its history will be kept.`)) {
      run(() => api.deleteTodo(todo.id));
    }
  };

  return (
    <main className="app">
      <header className="top">
        <h1>To-dos</h1>
        <label className="who">
          Acting as
          <input value={user} onChange={(e) => changeUser(e.target.value)} />
        </label>
      </header>

      <nav className="tabs">
        <button className={view === 'todos' ? 'active' : ''} onClick={() => setView('todos')}>To-dos</button>
        <button className={view === 'activity' ? 'active' : ''} onClick={() => setView('activity')}>All activity</button>
      </nav>

      {error && <p className="error">{error}</p>}

      {view === 'activity' ? (
        <AuditHistory />
      ) : (
        <div className="layout">
          <div>
            <TodoForm
              key={editing ? editing.id : 'new'}  // new key = form resets
              todo={editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
          <div>
            <div className="filters">
              {[['', 'All'], ['pending', 'Pending'], ['completed', 'Completed']].map(([value, label]) => (
                <button key={label} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onEdit={setEditing}
              onDelete={handleDelete}
              onHistory={setHistoryOf}
            />
            {historyOf && <AuditHistory key={`${historyOf.id}-${version}`} todo={historyOf} onClose={() => setHistoryOf(null)} />}
          </div>
        </div>
      )}
    </main>
  );
}
