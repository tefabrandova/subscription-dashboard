import { create } from 'zustand';
import { logActivity } from './activityStore';
import type { Account, Package, Customer, PriceDuration } from '../types';

interface State {
  accounts: Account[];
  packages: Package[];
  customers: Customer[];
  logo: string | null;
  addAccount: (account: Account) => void;
  addPackage: (pkg: Package) => void;
  addCustomer: (customer: Customer) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  updatePackage: (id: string, pkg: Partial<Package>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteAccount: (id: string) => void;
  deletePackage: (id: string) => void;
  deleteCustomer: (id: string) => void;
  updateLogo: (logo: string | null) => void;
}

export const useStore = create<State>((set, get) => ({
  accounts: [],
  packages: [],
  customers: [],
  logo: localStorage.getItem('appLogo'),
  addAccount: (account) => {
    set((state) => ({ accounts: [...state.accounts, account] }));
    logActivity(
      'create',
      'account',
      account.id,
      account.name,
      `Created new account: ${account.name}`
    );
  },
  addPackage: (pkg) => {
    // Ensure price is properly formatted
    const formattedPackage = {
      ...pkg,
      price: Array.isArray(pkg.price) 
        ? pkg.price.map(p => ({
            duration: Number(p.duration),
            unit: p.unit,
            price: Number(p.price)
          }))
        : Number(pkg.price),
      subscribedCustomers: Number(pkg.subscribedCustomers) || 0
    };
    
    set((state) => {
      // Update the linked packages count for the associated account
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
        packages: [...state.packages, formattedPackage]
      };
    });

    logActivity(
      'create',
      'package',
      pkg.id,
      pkg.name,
      `Created new package: ${pkg.name}`
    );
  },
  addCustomer: (customer) => {
    set((state) => ({ customers: [...state.customers, customer] }));
    logActivity(
      'create',
      'customer',
      customer.id,
      customer.name,
      `Created new customer: ${customer.name}`
    );
  },
  updateAccount: (id, account) => {
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
  },
  updatePackage: (id, pkg) => {
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
  },
  updateCustomer: (id, customer) => {
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
  },
  deleteAccount: (id) => {
    const accountToDelete = get().accounts.find(a => a.id === id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      // When deleting an account, also delete all associated packages
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
  },
  deletePackage: (id) => {
    const packageToDelete = get().packages.find(p => p.id === id);
    set((state) => {
      if (!packageToDelete) return state;

      // Update the linked packages count for the associated account
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
  },
  deleteCustomer: (id) => {
    const customerToDelete = get().customers.find(c => c.id === id);
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