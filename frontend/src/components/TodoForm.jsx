import { useState } from 'react';

// Used for both "add" and "edit". If `todo` is passed we are editing.
export default function TodoForm({ todo, onSave, onCancel }) {
  // useState keeps the value of each input inside React
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [dueDate, setDueDate] = useState(todo?.due_date || '');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    if (!title.trim()) return setError('Please enter a title.');
    try {
      await onSave({
        title,
        description,
        due_date: dueDate || null,
        status: todo?.status || 'pending',
      });
      if (!todo) { setTitle(''); setDescription(''); setDueDate(''); } // clear after adding
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>{todo ? 'Edit to-do' : 'Add a to-do'}</h2>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
      </label>
      <label>
        Description
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Due date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" className="primary">{todo ? 'Save changes' : 'Add to-do'}</button>
        {todo && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
