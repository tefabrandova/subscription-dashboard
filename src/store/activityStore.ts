import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityLog, ActivityType, ObjectType } from '../types/activity';
import { useUserStore } from './userStore';

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  getLogs: () => ActivityLog[];
  clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      logs: [],
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
      },
      getLogs: () => get().logs,
      clearLogs: () => set({ logs: [] })
    }),
    {
      name: 'activity-log-storage'
    }
  )
);

// Helper function to create activity logs
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