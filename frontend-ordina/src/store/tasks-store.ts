import { create } from 'zustand';

import { api } from '@/services/api';

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'design' | 'database';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category: Category;
  projectId?: string;
  dueDate?: string; // ISO date string
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  duration?: string; // "1h 30m"
  reminder?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  goalId?: string;
  parentTaskId?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TasksState {
  tasks: Task[];
  loadTasks: () => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeTask(task: any): Task {
  return {
    id: String(task.id ?? generateId()),
    title: task.title ?? 'Untitled task',
    description: task.description ?? '',
    status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'todo',
    priority: task.priority === 'high' || task.priority === 3 ? 'high' : task.priority === 'medium' || task.priority === 2 ? 'medium' : 'low',
    category: (task.category ?? 'work') as Category,
    projectId: task.projectId ? String(task.projectId) : undefined,
    dueDate: task.dueDate ?? task.due_at ?? undefined,
    startTime: task.startTime ?? undefined,
    endTime: task.endTime ?? undefined,
    duration: task.duration ?? '1h',
    reminder: task.reminder ?? false,
    recurrence: task.recurrence ?? 'none',
    goalId: task.goalId ? String(task.goalId) : undefined,
    parentTaskId: task.parentTaskId ? String(task.parentTaskId) : undefined,
    completed: Boolean(task.completed),
    createdAt: task.createdAt ?? new Date().toISOString(),
    updatedAt: task.updatedAt ?? new Date().toISOString(),
  };
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],

  getTaskById: (id) => get().tasks.find((task) => task.id === id),

  loadTasks: async () => {
    try {
      const { data } = await api.get('/api/tasks');
      const tasks = Array.isArray(data?.tasks) ? data.tasks.map(normalizeTask) : [];
      set({ tasks });
    } catch {
      set({ tasks: [] });
    }
  },

  addTask: async (taskData) => {
    await api.post('/api/tasks', taskData);
    await get().loadTasks();
  },

  updateTask: async (id, updates) => {
    await api.patch(`/api/tasks/${id}`, {
      ...updates,
      projectId: updates.projectId === undefined ? undefined : updates.projectId || null,
    });
    await get().loadTasks();
  },

  deleteTask: async (id) => {
    await api.delete(`/api/tasks/${id}`);
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return;
    await api.patch(`/api/tasks/${id}/complete`, { completed: !task.completed });
    await get().loadTasks();
  },
}));
