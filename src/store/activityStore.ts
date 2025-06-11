import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';
import type { ActivityLog, ActivityType, ObjectType } from '../types/activity';
import { useUserStore } from './userStore';

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  getLogs: () => ActivityLog[];
  clearLogs: () => void;
  syncToDatabase: () => Promise<void>;
  fetchFromDatabase: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: async (log) => {
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

        // Save to backend API
        try {
          await api.post('/activity', {
            user_id: currentUser.id,
            action_type: log.actionType,
            object_type: log.objectType,
            object_id: log.objectId,
            object_name: log.objectName,
            details: log.details
          });
        } catch (error) {
          console.error('Failed to save activity log to backend:', error);
        }
      },
      getLogs: () => get().logs,
      clearLogs: () => set({ logs: [] }),
      syncToDatabase: async () => {
        const { logs } = get();
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          const logsToSync = logs.map(log => ({
            user_id: log.userId,
            action_type: log.actionType,
            object_type: log.objectType,
            object_id: log.objectId,
            object_name: log.objectName,
            details: log.details,
            created_at: log.timestamp
          }));

          await api.post('/activity/bulk', { logs: logsToSync });
        } catch (error) {
          console.error('Failed to sync activity logs:', error);
        }
      },
      fetchFromDatabase: async () => {
        try {
          const response = await api.get('/activity');
          const data = response.data;

          const logs: ActivityLog[] = data.map((log: any) => ({
            id: log.id,
            userId: log.user_id,
            userName: log.user_name || 'User',
            userRole: log.user_role || 'user',
            actionType: log.action_type as ActivityType,
            objectType: log.object_type as ObjectType,
            objectId: log.object_id,
            objectName: log.object_name,
            details: log.details,
            timestamp: log.created_at
          }));

          set({ logs });
        } catch (error) {
          console.error('Failed to fetch activity logs:', error);
        }
      }
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