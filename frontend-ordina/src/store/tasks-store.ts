import { create } from 'zustand';

import { createTaskApi, deleteTaskApi, fetchTasks, updateTaskApi } from '@/services/api';

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
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  reminder?: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  load: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const tasks = await fetchTasks();
      set({ tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTask: async (taskData) => {
    const task = await createTaskApi(taskData);
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  updateTask: async (id, updates) => {
    const task = await updateTaskApi(id, updates);
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? task : t)) }));
  },

  deleteTask: async (id) => {
    await deleteTaskApi(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  toggleComplete: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    const task = await updateTaskApi(id, { completed: !current.completed });
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? task : t)) }));
  },
}));
