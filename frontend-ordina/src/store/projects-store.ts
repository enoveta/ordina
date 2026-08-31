/**
 * ORDINA Projects Store
 * Zustand store with seed projects matching the UI mockups.
 */

import { create } from 'zustand';

export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  subtitle?: string;
  status: ProjectStatus;
  progress: number; // 0–100
  color: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

const today = new Date().toISOString().split('T')[0];

const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'React Dashboard Rebuild',
    subtitle: 'Engineering Team • Q3 Goals',
    status: 'active',
    progress: 65,
    color: '#5C4DF2',
    tasksTotal: 8,
    tasksCompleted: 3,
    tasksOverdue: 2,
    dueDate: '2026-09-15',
    createdAt: today,
    updatedAt: today,
  },
  {
    id: 'p2',
    name: 'PostgreSQL Migration',
    subtitle: 'Database Team • Q3 Goals',
    status: 'active',
    progress: 40,
    color: '#22C55E',
    tasksTotal: 5,
    tasksCompleted: 2,
    tasksOverdue: 0,
    dueDate: '2026-09-30',
    createdAt: today,
    updatedAt: today,
  },
  {
    id: 'p3',
    name: 'Design System Update',
    subtitle: 'Design Team • Q3 Goals',
    status: 'active',
    progress: 80,
    color: '#F59E0B',
    tasksTotal: 6,
    tasksCompleted: 5,
    tasksOverdue: 0,
    dueDate: '2026-09-10',
    createdAt: today,
    updatedAt: today,
  },
];

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: SEED_PROJECTS,

  addProject: (projectData) =>
    set((state) => ({
      projects: [
        ...state.projects,
        {
          ...projectData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));
