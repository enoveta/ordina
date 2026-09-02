/**
 * ORDINA Tasks Store
 * Zustand store with seed data matching the UI mockups.
 * SQLite persistence will be wired in Phase 2 (Authentication & Database).
 */

import { create } from 'zustand';

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
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TasksState {
  tasks: Task[];
  getTaskById: (id: string) => Task | undefined;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
}

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const aug29 = '2026-08-29';
const aug30 = '2026-08-30';

const SEED_TASKS: Task[] = [
  {
    id: '1',
    title: 'React Project refactoring',
    description: 'Refactor state management and component structure.',
    status: 'in_progress',
    priority: 'high',
    category: 'work',
    projectId: 'p1',
    dueDate: today,
    startTime: '09:00',
    endTime: '11:00',
    duration: '2h',
    reminder: true,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '2',
    title: 'Review PostgreSQL schema',
    description: 'Review and validate the current database schema.',
    status: 'in_progress',
    priority: 'medium',
    category: 'database',
    dueDate: today,
    startTime: '11:00',
    endTime: '13:00',
    duration: '2h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '3',
    title: 'Finish React project integration',
    description: 'Complete the React frontend integration with the API.',
    status: 'in_progress',
    priority: 'high',
    category: 'work',
    projectId: 'p1',
    dueDate: today,
    startTime: '09:00',
    endTime: '10:30',
    duration: '1h 30m',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '4',
    title: 'Study PostgreSQL fundamentals',
    description: 'Go through the PostgreSQL documentation and practice queries.',
    status: 'todo',
    priority: 'medium',
    category: 'learning',
    dueDate: today,
    startTime: '11:00',
    endTime: '13:00',
    duration: '2h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '5',
    title: 'Prepare weekly status presentation',
    description: 'Prepare slides for the weekly team status update.',
    status: 'todo',
    priority: 'medium',
    category: 'work',
    dueDate: tomorrow,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '6',
    title: 'Review mockups with Sarah',
    description: 'Go through the latest design mockups with Sarah.',
    status: 'todo',
    priority: 'medium',
    category: 'design',
    dueDate: aug29,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '7',
    title: 'Buy replacement gym bands',
    description: '',
    status: 'todo',
    priority: 'low',
    category: 'personal',
    dueDate: aug30,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '8',
    title: 'Call John',
    description: 'Scheduled call with John.',
    status: 'todo',
    priority: 'high',
    category: 'personal',
    dueDate: today,
    startTime: '16:00',
    endTime: '16:30',
    duration: '30m',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '9',
    title: 'Gym session',
    description: 'Evening gym workout.',
    status: 'todo',
    priority: 'medium',
    category: 'health',
    dueDate: today,
    startTime: '18:30',
    endTime: '19:30',
    duration: '1h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '10',
    title: 'Fix responsive sidebar wrapping',
    description: 'Fix the sidebar wrapping issue on smaller screen sizes.',
    status: 'in_progress',
    priority: 'high',
    category: 'work',
    projectId: 'p1',
    dueDate: today,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '11',
    title: 'React Project completion',
    description: 'Complete the entire React project deliverable.',
    status: 'in_progress',
    priority: 'high',
    category: 'work',
    projectId: 'p1',
    dueDate: today,
    startTime: '09:00',
    endTime: '11:00',
    duration: '2h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '12',
    title: 'PostgreSQL intensive study',
    description: '2-hour intensive PostgreSQL study session.',
    status: 'todo',
    priority: 'medium',
    category: 'learning',
    projectId: 'p1',
    dueDate: today,
    startTime: '11:00',
    endTime: '13:00',
    duration: '2h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '13',
    title: 'Gym workout',
    description: 'Evening gym workout session.',
    status: 'todo',
    priority: 'medium',
    category: 'health',
    dueDate: today,
    startTime: '18:30',
    endTime: '19:30',
    duration: '1h',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '14',
    title: 'Refactor state management core',
    description: 'Refactor the state management logic across the app.',
    status: 'todo',
    priority: 'medium',
    category: 'work',
    projectId: 'p1',
    dueDate: tomorrow,
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '15',
    title: 'Update dependency packages',
    description: 'Update all outdated npm packages.',
    status: 'completed',
    priority: 'low',
    category: 'work',
    projectId: 'p1',
    dueDate: aug29,
    completed: true,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '16',
    title: 'Design baseline layouts',
    description: 'Set up the baseline layout designs.',
    status: 'completed',
    priority: 'medium',
    category: 'design',
    projectId: 'p1',
    dueDate: '2026-08-24',
    completed: true,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '17',
    title: 'Design settings architecture',
    description:
      'Create the settings pane layout wireframes, mapping preferences, notifications toggle arrays, and account management lists.',
    status: 'todo',
    priority: 'medium',
    category: 'design',
    projectId: 'p1',
    dueDate: '2026-08-28',
    startTime: '10:00',
    duration: '1h 30m',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '19',
    title: 'Design system presentation',
    description: 'Present the updated design system.',
    status: 'todo',
    priority: 'medium',
    category: 'design',
    dueDate: tomorrow,
    startTime: '10:00',
    completed: false,
    createdAt: today,
    updatedAt: today,
  },
  {
    id: '18',
    title: 'React Project-completion',
    description: 'Final wrap-up and delivery of the React project.',
    status: 'completed',
    priority: 'medium',
    category: 'work',
    projectId: 'p1',
    dueDate: tomorrow,
    completed: true,
    createdAt: today,
    updatedAt: today,
  },
];

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: SEED_TASKS,

  getTaskById: (id) => get().tasks.find((task) => task.id === id),

  addTask: (taskData) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...taskData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  toggleComplete: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              status: !t.completed ? 'completed' : 'in_progress',
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
}));
