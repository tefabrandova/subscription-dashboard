import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';
import type { Account, Package, Customer, PriceDuration } from '../types';

interface State {
  accounts: Account[];
  packages: Package[];
  customers: Customer[];
  logo: string | null;
  loading: boolean;
  error: string | null;
  
  // Data fetching
  fetchAccounts: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  
  // CRUD operations
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  addPackage: (pkg: Omit<Package, 'id'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  updatePackage: (id: string, pkg: Partial<Package>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateLogo: (logo: string | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: [],
      packages: [],
      customers: [],
      logo: localStorage.getItem('appLogo'),
      loading: false,
      error: null,

      fetchAccounts: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.getAccounts();
          if (response.success) {
            // Transform PHP data to match our types
            const transformedAccounts = response.data.map((account: any) => ({
              id: account.id,
              type: account.type as 'subscription' | 'purchase',
              name: account.name,
              details: account.details || [],
              subscriptionDate: account.subscription_date,
              expiryDate: account.expiry_date,
              price: account.price,
              linkedPackages: account.linked_packages || 0
            }));
            
            set({ accounts: transformedAccounts, loading: false });
          }
        } catch (error: any) {
          console.error('Error fetching accounts:', error);
          set({ error: error.message, loading: false });
        }
      },

      fetchPackages: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.getPackages();
          if (response.success) {
            // Transform PHP data to match our types
            const transformedPackages = response.data.map((pkg: any) => ({
              id: pkg.id,
              accountId: pkg.account_id,
              type: pkg.type as 'subscription' | 'purchase',
              name: pkg.name,
              details: pkg.details || [],
              accountDetails: '', // This field might not exist in PHP
              price: pkg.price,
              subscribedCustomers: pkg.subscribed_customers || 0
            }));
            
            set({ packages: transformedPackages, loading: false });
          }
        } catch (error: any) {
          console.error('Error fetching packages:', error);
          set({ error: error.message, loading: false });
        }
      },

      fetchCustomers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.getCustomers();
          if (response.success) {
            set({ customers: response.data, loading: false });
          }
        } catch (error: any) {
          console.error('Error fetching customers:', error);
          set({ error: error.message, loading: false });
        }
      },

      addAccount: async (account) => {
        try {
          const accountData = {
            type: account.type,
            name: account.name,
            details: account.details,
            subscriptionDate: account.subscriptionDate,
            expiryDate: account.expiryDate,
            price: account.price,
            linkedPackages: account.linkedPackages || 0
          };

          const response = await api.createAccount(accountData);
          if (response.success) {
            await get().fetchAccounts(); // Refresh data
          }
        } catch (error: any) {
          console.error('Error adding account:', error);
          set({ error: error.message });
          throw error;
        }
      },

      addPackage: async (pkg) => {
        try {
          const packageData = {
            accountId: pkg.accountId,
            type: pkg.type,
            name: pkg.name,
            details: pkg.details,
            price: pkg.price,
            subscribedCustomers: pkg.subscribedCustomers || 0
          };

          const response = await api.createPackage(packageData);
          if (response.success) {
            await Promise.all([
              get().fetchPackages(),
              get().fetchAccounts() // Refresh to update linked packages count
            ]);
          }
        } catch (error: any) {
          console.error('Error adding package:', error);
          set({ error: error.message });
          throw error;
        }
      },

      addCustomer: async (customer) => {
        try {
          const customerData = {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            packageId: customer.packageId,
            subscriptionDuration: customer.subscriptionDuration,
            subscriptionDate: customer.subscriptionDate,
            expiryDate: customer.expiryDate
          };

          const response = await api.createCustomer(customerData);
          if (response.success) {
            await Promise.all([
              get().fetchCustomers(),
              get().fetchPackages() // Refresh to update subscriber counts
            ]);
          }
        } catch (error: any) {
          console.error('Error adding customer:', error);
          set({ error: error.message });
          throw error;
        }
      },

      updateAccount: async (id, updates) => {
        try {
          const updateData = {
            type: updates.type,
            name: updates.name,
            details: updates.details,
            subscriptionDate: updates.subscriptionDate,
            expiryDate: updates.expiryDate,
            price: updates.price,
            linkedPackages: updates.linkedPackages
          };

          const response = await api.updateAccount(id, updateData);
          if (response.success) {
            await get().fetchAccounts();
          }
        } catch (error: any) {
          console.error('Error updating account:', error);
          set({ error: error.message });
          throw error;
        }
      },

      updatePackage: async (id, updates) => {
        try {
          const updateData = {
            accountId: updates.accountId,
            type: updates.type,
            name: updates.name,
            details: updates.details,
            price: updates.price,
            subscribedCustomers: updates.subscribedCustomers
          };

          const response = await api.updatePackage(id, updateData);
          if (response.success) {
            await get().fetchPackages();
          }
        } catch (error: any) {
          console.error('Error updating package:', error);
          set({ error: error.message });
          throw error;
        }
      },

      updateCustomer: async (id, updates) => {
        try {
          const updateData = {
            name: updates.name,
            phone: updates.phone,
            email: updates.email,
            subscriptionHistory: updates.subscriptionHistory
          };

          const response = await api.updateCustomer(id, updateData);
          if (response.success) {
            await get().fetchCustomers();
          }
        } catch (error: any) {
          console.error('Error updating customer:', error);
          set({ error: error.message });
          throw error;
        }
      },

      deleteAccount: async (id) => {
        try {
          const response = await api.deleteAccount(id);
          if (response.success) {
            await Promise.all([
              get().fetchAccounts(),
              get().fetchPackages() // Refresh to remove associated packages
            ]);
          }
        } catch (error: any) {
          console.error('Error deleting account:', error);
          set({ error: error.message });
          throw error;
        }
      },

      deletePackage: async (id) => {
        try {
          const response = await api.deletePackage(id);
          if (response.success) {
            await Promise.all([
              get().fetchPackages(),
              get().fetchAccounts() // Refresh to update linked packages count
            ]);
          }
        } catch (error: any) {
          console.error('Error deleting package:', error);
          set({ error: error.message });
          throw error;
        }
      },

      deleteCustomer: async (id) => {
        try {
          const response = await api.deleteCustomer(id);
          if (response.success) {
            await Promise.all([
              get().fetchCustomers(),
              get().fetchPackages() // Refresh to update subscriber counts
            ]);
          }
        } catch (error: any) {
          console.error('Error deleting customer:', error);
          set({ error: error.message });
          throw error;
        }
      },

      updateLogo: (logo) => {
        set({ logo });
        if (logo) {
          localStorage.setItem('appLogo', logo);
        } else {
          localStorage.removeItem('appLogo');
        }
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({ logo: state.logo }), // Only persist logo
    }
  )
);