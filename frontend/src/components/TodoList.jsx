// Shows the list. It does not talk to the server itself: it calls the
// functions (props) that App gives it.
export default function TodoList({ todos, onToggle, onEdit, onDelete, onHistory }) {
  if (todos.length === 0) {
    return <p className="empty">No to-dos here yet. Add one using the form.</p>;
  }
  return (
    <ul className="list">
      {todos.map((todo) => (
        <li key={todo.id} className={`item ${todo.status}`}>
          <input
            type="checkbox"
            checked={todo.status === 'completed'}
            onChange={() => onToggle(todo)}
            aria-label={`Mark "${todo.title}" as ${todo.status === 'completed' ? 'pending' : 'completed'}`}
          />
          <div className="item-body">
            <strong className="item-title">{todo.title}</strong>
            {todo.description && <p>{todo.description}</p>}
            <small>
              {todo.due_date ? `Due ${todo.due_date}` : 'No due date'} · {todo.status}
            </small>
          </div>
          <div className="item-actions">
            <button onClick={() => onHistory(todo)}>History</button>
            <button onClick={() => onEdit(todo)}>Edit</button>
            <button className="danger" onClick={() => onDelete(todo)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
