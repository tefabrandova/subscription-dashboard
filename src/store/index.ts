import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { logActivity } from './activityStore';
import type { Account, Package, Customer, PriceDuration } from '../types';

interface State {
  accounts: Account[];
  packages: Package[];
  customers: Customer[];
  logo: string | null;
  addAccount: (account: Account) => Promise<void>;
  addPackage: (pkg: Package) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
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

  addAccount: async (account) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          id: account.id,
          type: account.type,
          name: account.name,
          details: account.details,
          subscription_date: account.subscriptionDate,
          expiry_date: account.expiryDate,
          price: account.price,
          linked_packages: account.linkedPackages,
          user_id: userData.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ accounts: [...state.accounts, account] }));
      logActivity(
        'create',
        'account',
        account.id,
        account.name,
        `Created new account: ${account.name}`
      );
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  },

  addPackage: async (pkg) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert([{
          id: pkg.id,
          account_id: pkg.accountId,
          type: pkg.type,
          name: pkg.name,
          details: pkg.details,
          price: pkg.price,
          subscribed_customers: pkg.subscribedCustomers || 0
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => {
        const updatedAccounts = state.accounts.map(account => {
          if (account.id === pkg.accountId) {
            return {
              ...account,
              linkedPackages: account.linkedPackages + 1
            };
          }
          return account;
        });

        return {
          accounts: updatedAccounts,
          packages: [...state.packages, pkg]
        };
      });

      logActivity(
        'create',
        'package',
        pkg.id,
        pkg.name,
        `Created new package: ${pkg.name}`
      );
    } catch (error) {
      console.error('Error adding package:', error);
      throw error;
    }
  },

  addCustomer: async (customer) => {
    try {
      // First insert customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Then insert subscriptions
      const subscriptionPromises = customer.subscriptionHistory.map(subscription => 
        supabase
          .from('subscriptions')
          .insert([{
            id: subscription.id,
            customer_id: customer.id,
            package_id: subscription.packageId,
            start_date: subscription.startDate,
            end_date: subscription.endDate,
            duration: subscription.duration,
            status: subscription.status
          }])
      );

      await Promise.all(subscriptionPromises);

      set((state) => ({ customers: [...state.customers, customer] }));
      logActivity(
        'create',
        'customer',
        customer.id,
        customer.name,
        `Created new customer: ${customer.name}`
      );
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

  updateAccount: async (id, account) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          type: account.type,
          name: account.name,
          details: account.details,
          subscription_date: account.subscriptionDate,
          expiry_date: account.expiryDate,
          price: account.price,
          linked_packages: account.linkedPackages
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? { ...a, ...account } : a
        ),
      }));

      const updatedAccount = get().accounts.find(a => a.id === id);
      if (updatedAccount) {
        logActivity(
          'update',
          'account',
          id,
          updatedAccount.name,
          `Updated account: ${updatedAccount.name}`
        );
      }
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  updatePackage: async (id, pkg) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          type: pkg.type,
          name: pkg.name,
          details: pkg.details,
          price: pkg.price,
          subscribed_customers: pkg.subscribedCustomers
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        packages: state.packages.map((p) =>
          p.id === id ? { ...p, ...pkg } : p
        ),
      }));

      const updatedPackage = get().packages.find(p => p.id === id);
      if (updatedPackage) {
        logActivity(
          'update',
          'package',
          id,
          updatedPackage.name,
          `Updated package: ${updatedPackage.name}`
        );
      }
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  },

  updateCustomer: async (id, customer) => {
    try {
      // Update customer info
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        })
        .eq('id', id);

      if (customerError) throw customerError;

      // Update subscriptions if provided
      if (customer.subscriptionHistory) {
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert(
            customer.subscriptionHistory.map(sub => ({
              id: sub.id,
              customer_id: id,
              package_id: sub.packageId,
              start_date: sub.startDate,
              end_date: sub.endDate,
              duration: sub.duration,
              status: sub.status
            }))
          );

        if (subscriptionError) throw subscriptionError;
      }

      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...customer } : c
        ),
      }));

      const updatedCustomer = get().customers.find(c => c.id === id);
      if (updatedCustomer) {
        logActivity(
          'update',
          'customer',
          id,
          updatedCustomer.name,
          `Updated customer: ${updatedCustomer.name}`
        );
      }
    } catch (error) {
      console.error('Error updating customer:', error);
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

      set((state) => {
        if (!packageToDelete) return state;

        const updatedAccounts = state.accounts.map(account => {
          if (account.id === packageToDelete.accountId) {
            return {
              ...account,
              linkedPackages: Math.max(0, account.linkedPackages - 1)
            };
          }
          return account;
        });

        return {
          accounts: updatedAccounts,
          packages: state.packages.filter((p) => p.id !== id),
        };
      });

      if (packageToDelete) {
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
      throw error;
    }
  },

  updateLogo: (logo) => {
    set({ logo });
    localStorage.setItem('appLogo', logo || '');
    logActivity(
      'update',
      'settings',
      'logo',
      'System Logo',
      logo ? 'Updated system logo' : 'Removed system logo'
    );
  },
}));