import { create } from 'zustand';

import { api } from '@/services/api';

export type Goal = { id: number; title: string; description?: string; target: number; current: number; dueDate?: string; completed: boolean };
export type Reminder = { id: number; title: string; remindAt: string; completed: boolean };
export type Notification = { id: number; title: string; message: string; type: string; read: boolean; createdAt: string };

type ProductivityState = {
  goals: Goal[];
  reminders: Reminder[];
  notifications: Notification[];
  loadGoals: () => Promise<void>;
  loadReminders: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  addGoal: (payload: { title: string; description?: string; target?: number; dueDate?: string }) => Promise<void>;
  addReminder: (payload: { title: string; remindAt: string }) => Promise<void>;
  completeGoal: (id: number, completed: boolean) => Promise<void>;
  completeReminder: (id: number, completed: boolean) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  deleteReminder: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  goals: [],
  reminders: [],
  notifications: [],
  loadGoals: async () => { const { data } = await api.get('/api/goals'); set({ goals: data.goals ?? [] }); },
  loadReminders: async () => { const { data } = await api.get('/api/reminders'); set({ reminders: data.reminders ?? [] }); },
  loadNotifications: async () => { const { data } = await api.get('/api/notifications'); set({ notifications: data.notifications ?? [] }); },
  addGoal: async (payload) => { await api.post('/api/goals', payload); await get().loadGoals(); },
  addReminder: async (payload) => { await api.post('/api/reminders', payload); await get().loadReminders(); },
  completeGoal: async (id, completed) => { await api.patch(`/api/goals/${id}`, { completed }); await get().loadGoals(); },
  completeReminder: async (id, completed) => { await api.patch(`/api/reminders/${id}`, { completed }); await get().loadReminders(); },
  deleteGoal: async (id) => { await api.delete(`/api/goals/${id}`); set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })); },
  deleteReminder: async (id) => { await api.delete(`/api/reminders/${id}`); set((state) => ({ reminders: state.reminders.filter((reminder) => reminder.id !== id) })); },
  markAllNotificationsRead: async () => { await api.post('/api/notifications/read-all'); set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })); },
}));
