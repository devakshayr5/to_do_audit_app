// api.js - every call to the backend lives here, so components stay simple.

// The "acting user" is remembered in the browser and sent with every request.
export const getUser = () => localStorage.getItem('todo_user') || 'anonymous';
export const setUser = (name) => localStorage.setItem('todo_user', name);

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User': getUser(), // the backend passes this to MySQL for the audit trigger
    },
  });
  if (res.status === 204) return null; // "No Content" (used by DELETE)
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const listTodos = (status) =>
  request(status ? `/api/todos?status=${status}` : '/api/todos');
export const createTodo = (todo) =>
  request('/api/todos', { method: 'POST', body: JSON.stringify(todo) });
export const updateTodo = (id, todo) =>
  request(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(todo) });
export const setTodoStatus = (id, status) =>
  request(`/api/todos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteTodo = (id) => request(`/api/todos/${id}`, { method: 'DELETE' });
export const getTodoAudit = (id) => request(`/api/todos/${id}/audit`);
export const getRecentAudit = () => request('/api/audit?limit=100');
