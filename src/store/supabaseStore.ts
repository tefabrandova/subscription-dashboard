import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { logActivity } from './activityStore';
import type { Database } from '../lib/database.types';

// Type definitions
type Account = Database['public']['Tables']['accounts']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface SupabaseState {
  accounts: Account[];
  packages: Package[];
  customers: Customer[];
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAccounts: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  
  addPackage: (pkg: Omit<Package, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Package>;
  updatePackage: (id: string, updates: Partial<Package>) => Promise<Package>;
  deletePackage: (id: string) => Promise<void>;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  
  addSubscription: (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Subscription>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSupabaseStore = create<SupabaseState>((set, get) => ({
  accounts: [],
  packages: [],
  customers: [],
  subscriptions: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ accounts: data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPackages: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ packages: data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ customers: data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSubscriptions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ subscriptions: data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addAccount: async (accountData) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert(accountData)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        accounts: [data, ...state.accounts]
      }));
      
      logActivity(
        'create',
        'account',
        data.id,
        data.name,
        `Created new account: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        accounts: state.accounts.map(account => 
          account.id === id ? data : account
        )
      }));
      
      logActivity(
        'update',
        'account',
        data.id,
        data.name,
        `Updated account: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteAccount: async (id) => {
    try {
      const account = get().accounts.find(a => a.id === id);
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        accounts: state.accounts.filter(account => account.id !== id)
      }));
      
      if (account) {
        logActivity(
          'delete',
          'account',
          id,
          account.name,
          `Deleted account: ${account.name}`
        );
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addPackage: async (packageData) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert(packageData)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        packages: [data, ...state.packages]
      }));
      
      logActivity(
        'create',
        'package',
        data.id,
        data.name,
        `Created new package: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updatePackage: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        packages: state.packages.map(pkg => 
          pkg.id === id ? data : pkg
        )
      }));
      
      logActivity(
        'update',
        'package',
        data.id,
        data.name,
        `Updated package: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePackage: async (id) => {
    try {
      const pkg = get().packages.find(p => p.id === id);
      
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        packages: state.packages.filter(pkg => pkg.id !== id)
      }));
      
      if (pkg) {
        logActivity(
          'delete',
          'package',
          id,
          pkg.name,
          `Deleted package: ${pkg.name}`
        );
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addCustomer: async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        customers: [data, ...state.customers]
      }));
      
      logActivity(
        'create',
        'customer',
        data.id,
        data.name,
        `Created new customer: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        customers: state.customers.map(customer => 
          customer.id === id ? data : customer
        )
      }));
      
      logActivity(
        'update',
        'customer',
        data.id,
        data.name,
        `Updated customer: ${data.name}`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const customer = get().customers.find(c => c.id === id);
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        customers: state.customers.filter(customer => customer.id !== id)
      }));
      
      if (customer) {
        logActivity(
          'delete',
          'customer',
          id,
          customer.name,
          `Deleted customer: ${customer.name}`
        );
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addSubscription: async (subscriptionData) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        subscriptions: [data, ...state.subscriptions]
      }));
      
      logActivity(
        'create',
        'subscription',
        data.id,
        `Subscription ${data.id}`,
        `Created new subscription`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateSubscription: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        subscriptions: state.subscriptions.map(subscription => 
          subscription.id === id ? data : subscription
        )
      }));
      
      logActivity(
        'update',
        'subscription',
        data.id,
        `Subscription ${data.id}`,
        `Updated subscription`
      );
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteSubscription: async (id) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        subscriptions: state.subscriptions.filter(subscription => subscription.id !== id)
      }));
      
      logActivity(
        'delete',
        'subscription',
        id,
        `Subscription ${id}`,
        `Deleted subscription`
      );
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));