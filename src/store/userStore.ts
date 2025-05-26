import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { logActivity } from './activityStore';

interface UserState {
  users: User[];
  currentUser: User | null;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (user: User | null) => void;
}

// Create default admin user if none exists
const defaultAdmin: User = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  password: 'admin123', // In production, this should be hashed
  role: 'admin',
  createdAt: new Date().toISOString()
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [defaultAdmin],
      currentUser: null,
      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }));
        logActivity(
          'create',
          'user',
          user.id,
          user.name,
          `Created new user: ${user.name} (${user.role})`
        );
      },
      updateUser: (id, user) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...user } : u
          ),
        }));
        const updatedUser = get().users.find(u => u.id === id);
        if (updatedUser) {
          logActivity(
            'update',
            'user',
            id,
            updatedUser.name,
            `Updated user information for ${updatedUser.name}`
          );
        }
      },
      deleteUser: (id) => {
        const userToDelete = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
        if (userToDelete) {
          logActivity(
            'delete',
            'user',
            id,
            userToDelete.name,
            `Deleted user: ${userToDelete.name} (${userToDelete.role})`
          );
        }
      },
      setCurrentUser: (user) => {
        set({ currentUser: user });
        if (user) {
          logActivity(
            'login',
            'user',
            user.id,
            user.name,
            `User logged in: ${user.name}`
          );
        } else {
          const currentUser = get().currentUser;
          if (currentUser) {
            logActivity(
              'logout',
              'user',
              currentUser.id,
              currentUser.name,
              `User logged out: ${currentUser.name}`
            );
          }
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);