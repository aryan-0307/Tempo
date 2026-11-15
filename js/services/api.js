/**
 * Tempo Frontend API Client (Phase 5: Authentication & Security)
 * Communicates with the Node.js / Express REST API via standard Fetch API
 * with automatic JWT Authorization header injection.
 */

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'tempo_auth_token';

function getAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {}
  return headers;
}

export const api = {
  // Token Management
  getToken() {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },

  clearToken() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  },

  // Check backend server availability
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Authentication endpoints
  async register({ username, email, password, fullName }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, fullName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    if (json.data && json.data.token) {
      this.setToken(json.data.token);
    }
    return json.data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    if (json.data && json.data.token) {
      this.setToken(json.data.token);
    }
    return json.data;
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      this.clearToken();
    }
  },

  // 1. GET /api/tasks (with query parameters)
  async getTasks({ status, view, search, sort } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (view && view !== 'dashboard') params.set('view', view);
    if (search) params.set('search', search);
    if (sort && sort !== 'default') params.set('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/tasks${queryString}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch tasks`);
    const json = await res.json();
    return json.data;
  },

  // 2. GET /api/tasks/:id
  async getTaskById(id) {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Task not found`);
    const json = await res.json();
    return json.data;
  },

  // 3. POST /api/tasks
  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP Error ${res.status}: Failed to create task`);
    }
    const json = await res.json();
    return json.data;
  },

  // 4. PUT /api/tasks/:id
  async updateTask(id, updates) {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP Error ${res.status}: Failed to update task`);
    }
    const json = await res.json();
    return json.data;
  },

  // 5. PATCH /api/tasks/:id/toggle
  async toggleTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to toggle task`);
    const json = await res.json();
    return json.data;
  },

  // 6. DELETE /api/tasks/:id
  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to delete task`);
    const json = await res.json();
    return json.data;
  },

  // 7. POST /api/tasks/reorder
  async reorderTasks(sourceId, targetId, position = 'before') {
    const res = await fetch(`${API_BASE}/tasks/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sourceId, targetId, position })
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to reorder tasks`);
    const json = await res.json();
    return json.data;
  },

  // 8. GET /api/projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch projects`);
    const json = await res.json();
    return json.data;
  },

  // 9. POST /api/projects
  async createProject(projectData) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP Error ${res.status}: Failed to create project`);
    }
    const json = await res.json();
    return json.data;
  },

  // 10. GET /api/stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch stats`);
    const json = await res.json();
    return json.data;
  }
};
