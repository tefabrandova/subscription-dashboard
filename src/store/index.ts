import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { logActivity } from './activityStore';
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

export const useStore = create<State>((set, get) => ({
  accounts: [],
  packages: [],
  customers: [],
  logo: localStorage.getItem('appLogo'),
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
      
      // Transform Supabase data to match our types
      const transformedAccounts = data.map(account => ({
        id: account.id,
        type: account.type as 'subscription' | 'purchase',
        name: account.name,
        details: account.details as any[],
        subscriptionDate: account.subscription_date,
        expiryDate: account.expiry_date,
        price: account.price as number | PriceDuration[],
        linkedPackages: account.linked_packages
      }));
      
      set({ accounts: transformedAccounts, loading: false });
    } catch (error) {
      console.error('Error fetching accounts:', error);
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
      
      // Transform Supabase data to match our types
      const transformedPackages = data.map(pkg => ({
        id: pkg.id,
        accountId: pkg.account_id,
        type: pkg.type as 'subscription' | 'purchase',
        name: pkg.name,
        details: pkg.details as any[],
        accountDetails: '', // This field might not exist in Supabase
        price: pkg.price as number | PriceDuration[],
        subscribedCustomers: pkg.subscribed_customers
      }));
      
      set({ packages: transformedPackages, loading: false });
    } catch (error) {
      console.error('Error fetching packages:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customersError) throw customersError;
      
      // Fetch subscriptions for each customer
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subscriptionsError) throw subscriptionsError;
      
      // Transform and combine data
      const transformedCustomers = customersData.map(customer => {
        const customerSubscriptions = subscriptionsData
          .filter(sub => sub.customer_id === customer.id)
          .map(sub => ({
            id: sub.id,
            packageId: sub.package_id,
            startDate: sub.start_date,
            endDate: sub.end_date,
            duration: sub.duration,
            status: sub.status as 'active' | 'expired' | 'sold'
          }));
        
        // Get the most recent subscription for backward compatibility
        const latestSubscription = customerSubscriptions[0];
        
        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          packageId: latestSubscription?.packageId || '',
          subscriptionDuration: latestSubscription?.duration || 0,
          subscriptionDate: latestSubscription?.startDate || '',
          expiryDate: latestSubscription?.endDate || '',
          subscriptionHistory: customerSubscriptions
        };
      });
      
      set({ customers: transformedCustomers, loading: false });
    } catch (error) {
      console.error('Error fetching customers:', error);
      set({ error: error.message, loading: false });
    }
  },

  addAccount: async (account) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          type: account.type,
          name: account.name,
          details: account.details,
          subscription_date: account.subscriptionDate,
          expiry_date: account.expiryDate,
          price: account.price,
          linked_packages: account.linkedPackages || 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform and add to state
      const transformedAccount = {
        id: data.id,
        type: data.type as 'subscription' | 'purchase',
        name: data.name,
        details: data.details as any[],
        subscriptionDate: data.subscription_date,
        expiryDate: data.expiry_date,
        price: data.price as number | PriceDuration[],
        linkedPackages: data.linked_packages
      };
      
      set((state) => ({ accounts: [transformedAccount, ...state.accounts] }));
      
      logActivity(
        'create',
        'account',
        data.id,
        data.name,
        `Created new account: ${data.name}`
      );
    } catch (error) {
      console.error('Error adding account:', error);
      set({ error: error.message });
      throw error;
    }
  },

  addPackage: async (pkg) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert({
          account_id: pkg.accountId,
          type: pkg.type,
          name: pkg.name,
          details: pkg.details,
          price: pkg.price,
          subscribed_customers: pkg.subscribedCustomers || 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform and add to state
      const transformedPackage = {
        id: data.id,
        accountId: data.account_id,
        type: data.type as 'subscription' | 'purchase',
        name: data.name,
        details: data.details as any[],
        accountDetails: '',
        price: data.price as number | PriceDuration[],
        subscribedCustomers: data.subscribed_customers
      };
      
      set((state) => ({ packages: [transformedPackage, ...state.packages] }));
      
      // Update linked packages count
      await get().updateAccount(pkg.accountId, { 
        linkedPackages: (get().accounts.find(a => a.id === pkg.accountId)?.linkedPackages || 0) + 1 
      });
      
      logActivity(
        'create',
        'package',
        data.id,
        data.name,
        `Created new package: ${data.name}`
      );
    } catch (error) {
      console.error('Error adding package:', error);
      set({ error: error.message });
      throw error;
    }
  },

  addCustomer: async (customer) => {
    try {
      // First, add the customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        })
        .select()
        .single();
      
      if (customerError) throw customerError;
      
      // Then add the subscription if there's package info
      let subscriptionData = null;
      if (customer.packageId && customer.subscriptionDate) {
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: customerData.id,
            package_id: customer.packageId,
            start_date: customer.subscriptionDate,
            end_date: customer.expiryDate,
            duration: customer.subscriptionDuration,
            status: 'active'
          })
          .select()
          .single();
        
        if (subError) throw subError;
        subscriptionData = subData;
      }
      
      // Transform and add to state
      const transformedCustomer = {
        id: customerData.id,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || '',
        packageId: customer.packageId || '',
        subscriptionDuration: customer.subscriptionDuration || 0,
        subscriptionDate: customer.subscriptionDate || '',
        expiryDate: customer.expiryDate || '',
        subscriptionHistory: subscriptionData ? [{
          id: subscriptionData.id,
          packageId: subscriptionData.package_id,
          startDate: subscriptionData.start_date,
          endDate: subscriptionData.end_date,
          duration: subscriptionData.duration,
          status: subscriptionData.status as 'active' | 'expired' | 'sold'
        }] : []
      };
      
      set((state) => ({ customers: [transformedCustomer, ...state.customers] }));
      
      logActivity(
        'create',
        'customer',
        customerData.id,
        customerData.name,
        `Created new customer: ${customerData.name}`
      );
    } catch (error) {
      console.error('Error adding customer:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          type: updates.type,
          name: updates.name,
          details: updates.details,
          subscription_date: updates.subscriptionDate,
          expiry_date: updates.expiryDate,
          price: updates.price,
          linked_packages: updates.linkedPackages
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform and update state
      const transformedAccount = {
        id: data.id,
        type: data.type as 'subscription' | 'purchase',
        name: data.name,
        details: data.details as any[],
        subscriptionDate: data.subscription_date,
        expiryDate: data.expiry_date,
        price: data.price as number | PriceDuration[],
        linkedPackages: data.linked_packages
      };
      
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? transformedAccount : a
        ),
      }));
      
      logActivity(
        'update',
        'account',
        id,
        data.name,
        `Updated account: ${data.name}`
      );
    } catch (error) {
      console.error('Error updating account:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updatePackage: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          account_id: updates.accountId,
          type: updates.type,
          name: updates.name,
          details: updates.details,
          price: updates.price,
          subscribed_customers: updates.subscribedCustomers
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform and update state
      const transformedPackage = {
        id: data.id,
        accountId: data.account_id,
        type: data.type as 'subscription' | 'purchase',
        name: data.name,
        details: data.details as any[],
        accountDetails: '',
        price: data.price as number | PriceDuration[],
        subscribedCustomers: data.subscribed_customers
      };
      
      set((state) => ({
        packages: state.packages.map((p) =>
          p.id === id ? transformedPackage : p
        ),
      }));
      
      logActivity(
        'update',
        'package',
        id,
        data.name,
        `Updated package: ${data.name}`
      );
    } catch (error) {
      console.error('Error updating package:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      // Update customer basic info
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email
        })
        .eq('id', id)
        .select()
        .single();
      
      if (customerError) throw customerError;
      
      // Handle subscription history updates if provided
      if (updates.subscriptionHistory) {
        // This is a complex operation - for now, we'll handle it in the component
        // In a real app, you'd want to sync the subscription changes to the subscriptions table
      }
      
      // Update state
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
      
      logActivity(
        'update',
        'customer',
        id,
        customerData.name,
        `Updated customer: ${customerData.name}`
      );
    } catch (error) {
      console.error('Error updating customer:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteAccount: async (id) => {
    try {
      const accountToDelete = get().accounts.find(a => a.id === id);
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
        packages: state.packages.filter((p) => p.accountId !== id),
      }));
      
      if (accountToDelete) {
        logActivity(
          'delete',
          'account',
          id,
          accountToDelete.name,
          `Deleted account: ${accountToDelete.name}`
        );
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deletePackage: async (id) => {
    try {
      const packageToDelete = get().packages.find(p => p.id === id);
      
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        packages: state.packages.filter((p) => p.id !== id),
      }));
      
      // Update linked packages count
      if (packageToDelete) {
        await get().updateAccount(packageToDelete.accountId, { 
          linkedPackages: Math.max(0, (get().accounts.find(a => a.id === packageToDelete.accountId)?.linkedPackages || 1) - 1)
        });
        
        logActivity(
          'delete',
          'package',
          id,
          packageToDelete.name,
          `Deleted package: ${packageToDelete.name}`
        );
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const customerToDelete = get().customers.find(c => c.id === id);
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
      
      if (customerToDelete) {
        logActivity(
          'delete',
          'customer',
          id,
          customerToDelete.name,
          `Deleted customer: ${customerToDelete.name}`
        );
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateLogo: (logo) => {
    set({ logo });
    logActivity(
      'update',
      'settings',
      'logo',
      'System Logo',
      logo ? 'Updated system logo' : 'Removed system logo'
    );
  },
}));