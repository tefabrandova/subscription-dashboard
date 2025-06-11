import { create } from 'zustand';
import api from '../api';
import type { ActivityLog, ActivityType, ObjectType } from '../types/activity';
import { useUserStore } from './userStore';

interface ActivityState {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  getLogs: () => ActivityLog[];
  clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getActivityLogs();
      if (response.success) {
        set({ logs: response.data, loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      set({ error: error.message, loading: false });
    }
  },

  addLog: (log) => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      ...log
    };

    set((state) => ({
      logs: [newLog, ...state.logs]
    }));

    // Note: Activity logging is handled by the PHP backend
    // This local log is just for immediate UI feedback
  },

  getLogs: () => get().logs,
  clearLogs: () => set({ logs: [] })
}));

// Helper function to create activity logs (for compatibility)
export const logActivity = (
  actionType: ActivityType,
  objectType: ObjectType,
  objectId: string,
  objectName: string,
  details: string
) => {
  useActivityStore.getState().addLog({
    actionType,
    objectType,
    objectId,
    objectName,
    details
  });
};