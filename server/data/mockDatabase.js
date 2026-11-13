/**
 * Tempo In-Memory Data Store (Phase 3)
 * Represents the server-side data layer before Phase 4 MySQL integration.
 */

function getISODateOffset(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SEED_PROJECTS = [
  { id: 'proj-1', name: 'Work', color: '#6BAFA4' },
  { id: 'proj-2', name: 'Personal', color: '#80B9A0' },
  { id: 'proj-3', name: 'Design System', color: '#88AFC2' }
];

const SEED_TASKS = [
  {
    id: 'task-1',
    title: 'Review and finalize sprint roadmap',
    priority: 'high',
    dueDate: getISODateOffset(0),
    project: 'Work',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'task-2',
    title: 'Submit Q4 department budget proposal',
    priority: 'high',
    dueDate: getISODateOffset(-2),
    project: 'Work',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'task-3',
    title: 'Update design tokens documentation',
    priority: 'medium',
    dueDate: getISODateOffset(1),
    project: 'Design System',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'task-4',
    title: 'Renew annual cloud infrastructure subscription',
    priority: 'low',
    dueDate: getISODateOffset(0),
    project: 'Personal',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'task-5',
    title: 'Refactor sidebar navigation to semantic HTML',
    priority: 'medium',
    dueDate: getISODateOffset(-1),
    project: 'Work',
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'task-6',
    title: 'Schedule weekly team retrospective meeting',
    priority: 'low',
    dueDate: getISODateOffset(-3),
    project: 'Personal',
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class MockDatabase {
  constructor() {
    this.tasks = JSON.parse(JSON.stringify(SEED_TASKS));
    this.projects = JSON.parse(JSON.stringify(SEED_PROJECTS));
  }

  // Tasks Methods
  findAllTasks({ status, view, search, sort }) {
    const today = getISODateOffset(0);
    let results = [...this.tasks];

    // 1. Filter by Status
    if (status === 'pending') {
      results = results.filter(t => !t.completed);
    } else if (status === 'completed') {
      results = results.filter(t => t.completed);
    }

    // 2. Filter by View
    if (view === 'my-tasks') {
      results = results.filter(t => !t.completed);
    } else if (view === 'upcoming') {
      results = results.filter(t => !t.completed && t.dueDate > today);
    } else if (view === 'completed') {
      results = results.filter(t => t.completed);
    } else if (view === 'project-work' || view === 'work') {
      results = results.filter(t => t.project.toLowerCase() === 'work');
    } else if (view === 'project-personal' || view === 'personal') {
      results = results.filter(t => t.project.toLowerCase() === 'personal');
    } else if (view === 'project-design' || view === 'design system') {
      results = results.filter(t => t.project.toLowerCase() === 'design system');
    }

    // 3. Filter by Search Keyword
    if (search) {
      const q = search.trim().toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.project.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    if (sort === 'due-date') {
      results.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sort === 'priority') {
      const weights = { high: 3, medium: 2, low: 1 };
      results.sort((a, b) => (weights[b.priority] || 0) - (weights[a.priority] || 0));
    } else if (sort === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }

    return results;
  }

  findTaskById(id) {
    return this.tasks.find(t => t.id === id) || null;
  }

  createTask({ title, priority = 'medium', dueDate, project = 'Work' }) {
    const newTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      priority: priority.toLowerCase(),
      dueDate: dueDate || getISODateOffset(0),
      project: project || 'Work',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  updateTask(id, updates) {
    const task = this.findTaskById(id);
    if (!task) return null;

    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.priority !== undefined) task.priority = updates.priority.toLowerCase();
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.project !== undefined) task.project = updates.project;
    if (updates.completed !== undefined) task.completed = Boolean(updates.completed);
    task.updatedAt = new Date().toISOString();

    return task;
  }

  toggleTask(id) {
    const task = this.findTaskById(id);
    if (!task) return null;
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    const [deleted] = this.tasks.splice(index, 1);
    return deleted;
  }

  reorderTasks(sourceId, targetId, position = 'before') {
    const sourceIndex = this.tasks.findIndex(t => t.id === sourceId);
    const targetIndex = this.tasks.findIndex(t => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceId === targetId) return false;

    const [moved] = this.tasks.splice(sourceIndex, 1);
    const newTargetIndex = this.tasks.findIndex(t => t.id === targetId);
    const insertIndex = position === 'after' ? newTargetIndex + 1 : newTargetIndex;
    this.tasks.splice(insertIndex, 0, moved);
    return true;
  }

  // Projects & Stats Methods
  findAllProjects() {
    return this.projects.map(proj => {
      const taskCount = this.tasks.filter(t => t.project.toLowerCase() === proj.name.toLowerCase()).length;
      const pendingCount = this.tasks.filter(t => t.project.toLowerCase() === proj.name.toLowerCase() && !t.completed).length;
      return {
        ...proj,
        taskCount,
        pendingCount
      };
    });
  }

  getStats() {
    const today = getISODateOffset(0);
    const total = this.tasks.length;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    for (const t of this.tasks) {
      if (t.completed) {
        completed++;
      } else {
        pending++;
        if (t.dueDate && t.dueDate < today) {
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

  reset() {
    this.tasks = JSON.parse(JSON.stringify(SEED_TASKS));
    this.projects = JSON.parse(JSON.stringify(SEED_PROJECTS));
  }
}

export const db = new MockDatabase();

