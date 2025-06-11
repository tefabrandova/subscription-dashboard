import { create } from 'zustand';

interface SubscriptionState {
  workspace: {
    id: string;
    name: string;
    status: 'active' | 'suspended' | 'expired';
    subscription: {
      planId: string;
      planName: string;
      billingCycle: 'monthly' | 'yearly';
      startDate: string;
      endDate: string;
      autoRenew: boolean;
    } | null;
  } | null;
  setWorkspace: (workspace: SubscriptionState['workspace']) => void;
  clearWorkspace: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  workspace: null,
  setWorkspace: (workspace) => set({ workspace }),
  clearWorkspace: () => set({ workspace: null })
}));