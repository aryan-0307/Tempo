/**
 * Tempo Application State Management (Phase 3)
 * Reactive centralized state store with Node.js/Express REST API synchronization
 * and LocalStorage fallback persistence.
 */

import { api } from './services/api.js';

export const STORAGE_KEY = 'tempo_tasks_v2';
export const PROJECTS_STORAGE_KEY = 'tempo_projects_v2';

function getTasksStorageKey(userId) {
  return userId ? `tempo_tasks_user_${userId}` : 'tempo_tasks_guest';
}

function getProjectsStorageKey(userId) {
  return userId ? `tempo_projects_user_${userId}` : 'tempo_projects_guest';
}

const DEFAULT_PROJECTS = [
  { id: 'work', name: 'Work', color: '#C6F55A', dotClass: 'dot-work' },
  { id: 'personal', name: 'Personal', color: '#FA779C', dotClass: 'dot-personal' },
  { id: 'design', name: 'Design System', color: '#8051F5', dotClass: 'dot-design' }
];

function getISODateOffset(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Review and finalize sprint roadmap',
    priority: 'high',
    dueDate: getISODateOffset(0), // Today
    project: 'Work',
    completed: false,
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: 'task-2',
    title: 'Submit Q4 department budget proposal',
    priority: 'high',
    dueDate: getISODateOffset(-2), // Overdue
    project: 'Work',
    completed: false,
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'task-3',
    title: 'Update design tokens documentation',
    priority: 'medium',
    dueDate: getISODateOffset(1), // Upcoming
    project: 'Design System',
    completed: false,
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'task-4',
    title: 'Renew annual cloud infrastructure subscription',
    priority: 'low',
    dueDate: getISODateOffset(0), // Today
    project: 'Personal',
    completed: false,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'task-5',
    title: 'Refactor sidebar navigation to semantic HTML',
    priority: 'medium',
    dueDate: getISODateOffset(-1), // Completed
    project: 'Work',
    completed: true,
    createdAt: Date.now() - 3600000 * 1
  },
  {
    id: 'task-6',
    title: 'Schedule weekly team retrospective meeting',
    priority: 'low',
    dueDate: getISODateOffset(-3), // Completed
    project: 'Personal',
    completed: true,
    createdAt: Date.now()
  }
];

class StateManager {
  constructor() {
    this.currentUser = null;
    this.tasks = [];
    this.projects = [];
    this.activeView = 'dashboard';
    this.statusFilter = 'all'; // 'all' | 'pending' | 'completed'
    this.searchQuery = '';
    this.sortBy = 'default'; // 'default' | 'due-date' | 'priority' | 'title'
    this.listeners = new Set();
    this.lastDeletedTask = null;
    this.lastDeletedIndex = -1;
    this.isBackendOnline = false;

    this.loadFromStorage();
    this.loadProjects();
  }

  getTodayString() {
    return getISODateOffset(0);
  }

  switchUser(user) {
    this.currentUser = user || null;
    this.tasks = [];
    this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    this.loadFromStorage();
    this.loadProjects();
    this.notify();
  }

  clearUserData() {
    this.currentUser = null;
    this.tasks = [];
    this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    this.loadFromStorage();
    this.loadProjects();
    this.notify();
  }

  async syncWithBackend() {
    try {
      const isOnline = await api.checkHealth();
      this.isBackendOnline = isOnline;
      if (!isOnline) return;

      const token = api.getToken();
      if (!token) {
        // Unauthenticated visitor: do not fetch protected backend data
        return;
      }

      // 1. Sync tasks for the authenticated user (empty list [] is valid and clears previous user's tasks)
      const remoteTasks = await api.getTasks();
      if (Array.isArray(remoteTasks)) {
        this.tasks = remoteTasks;
        this.saveToStorage();
      }

      // 2. Sync projects for the authenticated user
      try {
        const remoteProjects = await api.getProjects();
        if (Array.isArray(remoteProjects)) {
          if (remoteProjects.length > 0) {
            this.projects = remoteProjects.map(rp => ({
              id: rp.id,
              name: rp.name,
              color: rp.color || '#C6F55A',
              isCustom: !['work', 'personal', 'design'].includes(String(rp.id).toLowerCase())
            }));
          } else {
            this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
          }
          this.saveProjects();
        }
      } catch (projErr) {
        console.warn('[StateManager] Backend projects sync error:', projErr.message);
      }

      this.notify();
      const statusEl = document.getElementById('system-status-text');
      if (statusEl) {
        statusEl.textContent = 'Tempo Connected • Node.js/Express Backend Active';
      }
    } catch (e) {
      console.log('[StateManager] Running in standalone/offline mode:', e.message);
    }
  }

  loadProjects() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = getProjectsStorageKey(this.currentUser?.id);
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.projects = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage read projects failed:', e);
    }
    this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
    this.saveProjects();
  }

  saveProjects() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = getProjectsStorageKey(this.currentUser?.id);
        window.localStorage.setItem(key, JSON.stringify(this.projects));
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage save projects failed:', e);
    }
  }

  getProjects() {
    return this.projects;
  }

  async addProject({ name, color }) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return null;

    const exists = this.projects.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      throw new Error(`Project "${trimmedName}" already exists`);
    }

    const cleanKey = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectKey = `${cleanKey}-${Date.now().toString(36)}`;
    const chosenColor = color || '#C6F55A';

    const newProject = {
      id: cleanKey,
      project_key: projectKey,
      name: trimmedName,
      color: chosenColor,
      isCustom: true
    };

    this.projects.push(newProject);
    this.saveProjects();

    if (this.isBackendOnline) {
      try {
        await api.createProject({ name: trimmedName, color: chosenColor });
      } catch (e) {
        console.warn('[StateManager] Backend project create error:', e.message);
      }
    }

    this.notify();
    return newProject;
  }

  loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = getTasksStorageKey(this.currentUser?.id);
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.tasks = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage read failed:', e);
    }
    // If authenticated user has no saved tasks, initialize as empty [] (no stale/demo tasks)
    if (this.currentUser && this.currentUser.id) {
      this.tasks = [];
      this.saveToStorage();
    } else {
      this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
      this.saveToStorage();
    }
  }

  saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = getTasksStorageKey(this.currentUser?.id);
        window.localStorage.setItem(key, JSON.stringify(this.tasks));
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage save failed:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.saveToStorage();
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('[StateManager] Listener error:', err);
      }
    }
  }

  getTasks() {
    return this.tasks;
  }

  getTaskById(id) {
    return this.tasks.find(t => t.id === id) || null;
  }

  // --- CRUD Operations ---

  // 1. CREATE
  addTask({ title, priority = 'medium', dueDate, project = 'Work' }) {
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) return null;

    const newTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: trimmedTitle,
      priority: priority.toLowerCase(),
      dueDate: dueDate || this.getTodayString(),
      project: project || 'Work',
      completed: false,
      createdAt: Date.now()
    };

    this.tasks.unshift(newTask);
    this.notify();

    // Async Backend Sync
    if (this.isBackendOnline) {
      api.createTask(newTask).catch(err => {
        console.warn('[StateManager] API createTask error:', err.message);
      });
    }

    return newTask;
  }

  // 2. UPDATE
  updateTask(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    if (updates.title !== undefined) {
      const cleanTitle = updates.title.trim();
      if (cleanTitle) task.title = cleanTitle;
    }
    if (updates.priority !== undefined) {
      task.priority = updates.priority.toLowerCase();
    }
    if (updates.dueDate !== undefined) {
      task.dueDate = updates.dueDate;
    }
    if (updates.project !== undefined) {
      task.project = updates.project;
    }
    if (updates.completed !== undefined) {
      task.completed = Boolean(updates.completed);
    }

    this.notify();

    // Async Backend Sync
    if (this.isBackendOnline) {
      api.updateTask(id, updates).catch(err => {
        console.warn('[StateManager] API updateTask error:', err.message);
      });
    }

    return task;
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.notify();

      // Async Backend Sync
      if (this.isBackendOnline) {
        api.toggleTask(id).catch(err => {
          console.warn('[StateManager] API toggleTask error:', err.message);
        });
      }

      return task;
    }
    return null;
  }

  // 3. DELETE
  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.lastDeletedTask = { ...this.tasks[index] };
      this.lastDeletedIndex = index;
      this.tasks.splice(index, 1);
      this.notify();

      // Async Backend Sync
      if (this.isBackendOnline) {
        api.deleteTask(id).catch(err => {
          console.warn('[StateManager] API deleteTask error:', err.message);
        });
      }

      return this.lastDeletedTask;
    }
    return null;
  }

  // 4. RESTORE (Undo Delete)
  restoreLastDeletedTask() {
    if (!this.lastDeletedTask) return null;
    const taskToRestore = this.lastDeletedTask;
    const targetIndex = Math.min(Math.max(this.lastDeletedIndex, 0), this.tasks.length);
    this.tasks.splice(targetIndex, 0, taskToRestore);
    this.lastDeletedTask = null;
    this.lastDeletedIndex = -1;
    this.notify();

    // Async Backend Sync
    if (this.isBackendOnline) {
      api.createTask(taskToRestore).catch(err => {
        console.warn('[StateManager] API restoreTask error:', err.message);
      });
    }

    return taskToRestore;
  }

  // --- Filtering & Views ---

  setViewFilter(view) {
    if (this.activeView !== view) {
      this.activeView = view;
      this.notify();
    }
  }

  setStatusFilter(status) {
    if (this.statusFilter !== status) {
      this.statusFilter = status;
      this.notify();
    }
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.notify();
  }

  // --- Sorting ---

  setSort(sortBy) {
    if (this.sortBy !== sortBy) {
      this.sortBy = sortBy;
      this.notify();
    }
  }

  // --- Drag-and-Drop Reordering ---

  reorderTasks(sourceId, targetId, position = 'before') {
    if (sourceId === targetId) return;

    const sourceIndex = this.tasks.findIndex(t => t.id === sourceId);
    const targetIndex = this.tasks.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [movedTask] = this.tasks.splice(sourceIndex, 1);
    
    // Recalculate target index after splice
    const newTargetIndex = this.tasks.findIndex(t => t.id === targetId);
    const insertIndex = position === 'after' ? newTargetIndex + 1 : newTargetIndex;

    this.tasks.splice(insertIndex, 0, movedTask);
    this.notify();

    // Async Backend Sync
    if (this.isBackendOnline) {
      api.reorderTasks(sourceId, targetId, position).catch(err => {
        console.warn('[StateManager] API reorderTasks error:', err.message);
      });
    }
  }

  // --- Metric Calculations ---

  getStats() {
    const today = this.getTodayString();
    let total = this.tasks.length;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    for (const task of this.tasks) {
      if (task.completed) {
        completed++;
      } else {
        pending++;
        if (task.dueDate && task.dueDate < today) {
          overdue++;
        }
      }
    }

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate
    };
  }

  // --- Filtered and Sorted Tasks Query ---

  getFilteredTasks() {
    const today = this.getTodayString();

    // 1. Filtering
    let result = this.tasks.filter(task => {
      // Filter by Active Sidebar View
      if (this.activeView === 'my-tasks') {
        if (task.completed) return false;
      } else if (this.activeView === 'upcoming') {
        if (task.completed || task.dueDate <= today) return false;
      } else if (this.activeView === 'completed') {
        if (!task.completed) return false;
      } else if (this.activeView === 'project-work') {
        if (task.project !== 'Work') return false;
      } else if (this.activeView === 'project-personal') {
        if (task.project !== 'Personal') return false;
      } else if (this.activeView === 'project-design') {
        if (task.project !== 'Design System') return false;
      } else if (this.activeView.startsWith('project-')) {
        const projKey = this.activeView.replace('project-', '').toLowerCase();
        const foundProj = (this.projects || []).find(p =>
          p.id.toLowerCase() === projKey ||
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === projKey ||
          p.name.toLowerCase() === projKey
        );
        if (foundProj) {
          if (task.project.toLowerCase() !== foundProj.name.toLowerCase()) return false;
        }
      }

      // Filter by Task Status Tab
      if (this.statusFilter === 'pending' && task.completed) {
        return false;
      }
      if (this.statusFilter === 'completed' && !task.completed) {
        return false;
      }

      // Filter by Search Query
      if (this.searchQuery) {
        const matchTitle = task.title.toLowerCase().includes(this.searchQuery);
        const matchProject = task.project.toLowerCase().includes(this.searchQuery);
        const matchPriority = task.priority.toLowerCase().includes(this.searchQuery);
        if (!matchTitle && !matchProject && !matchPriority) {
          return false;
        }
      }

      return true;
    });

    // 2. Sorting
    if (this.sortBy === 'due-date') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (this.sortBy === 'priority') {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      result.sort((a, b) => {
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        return weightB - weightA;
      });
    } else if (this.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }
}

export const state = new StateManager();
