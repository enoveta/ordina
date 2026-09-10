import { create } from 'zustand';

import { createProjectApi, deleteProjectApi, fetchProjects, updateProjectApi } from '@/services/api';

export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  subtitle?: string;
  status: ProjectStatus;
  progress: number;
  color: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

function mapProject(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    subtitle: raw.subtitle ? String(raw.subtitle) : undefined,
    status: 'active',
    progress: Number(raw.progress ?? 0),
    color: String(raw.color ?? '#8B5CF6'),
    tasksTotal: Number(raw.tasksTotal ?? 0),
    tasksCompleted: Number(raw.tasksCompleted ?? 0),
    tasksOverdue: Number(raw.tasksOverdue ?? 0),
    dueDate: raw.dueDate ? String(raw.dueDate).slice(0, 10) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

interface ProjectsState {
  projects: Project[];
  load: () => Promise<void>;
  addProject: (project: { name: string; subtitle?: string; color?: string }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],

  load: async () => {
    try {
      const projects = await fetchProjects();
      set({ projects: (projects as Record<string, unknown>[]).map(mapProject) });
    } catch {
      set({ projects: [] });
    }
  },

  addProject: async (projectData) => {
    const project = await createProjectApi(projectData);
    set((state) => ({ projects: [mapProject(project), ...state.projects] }));
  },

  updateProject: async (id, updates) => {
    const updated = await updateProjectApi(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? mapProject(updated) : p)),
    }));
  },

  deleteProject: async (id) => {
    await deleteProjectApi(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },
}));
