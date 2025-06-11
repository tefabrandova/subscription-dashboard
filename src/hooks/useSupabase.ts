import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logActivity } from '../store/activityStore';
import type { Database } from '../lib/database.types';

// Type definitions for easier use
type Account = Database['public']['Tables']['accounts']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

// Accounts
export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: Database['public']['Tables']['accounts']['Insert']) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'create',
        'account',
        data.id,
        data.name,
        `Created new account: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['accounts']['Update'] }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'update',
        'account',
        data.id,
        data.name,
        `Updated account: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get account name before deletion for logging
      const { data: account } = await supabase
        .from('accounts')
        .select('name')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (account) {
        logActivity(
          'delete',
          'account',
          id,
          account.name,
          `Deleted account: ${account.name}`
        );
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });
};

// Packages
export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useAddPackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pkg: Database['public']['Tables']['packages']['Insert']) => {
      const { data, error } = await supabase
        .from('packages')
        .insert(pkg)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'create',
        'package',
        data.id,
        data.name,
        `Created new package: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['packages']['Update'] }) => {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'update',
        'package',
        data.id,
        data.name,
        `Updated package: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get package name before deletion for logging
      const { data: pkg } = await supabase
        .from('packages')
        .select('name')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (pkg) {
        logActivity(
          'delete',
          'package',
          id,
          pkg.name,
          `Deleted package: ${pkg.name}`
        );
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

// Customers
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          subscriptions (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Database['public']['Tables']['customers']['Insert']) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'create',
        'customer',
        data.id,
        data.name,
        `Created new customer: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['customers']['Update'] }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'update',
        'customer',
        data.id,
        data.name,
        `Updated customer: ${data.name}`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get customer name before deletion for logging
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (customer) {
        logActivity(
          'delete',
          'customer',
          id,
          customer.name,
          `Deleted customer: ${customer.name}`
        );
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });
};

// Subscriptions
export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          customers (*),
          packages (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useAddSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscription: Database['public']['Tables']['subscriptions']['Insert']) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single();
      
      if (error) throw error;
      
      logActivity(
        'create',
        'subscription',
        data.id,
        `Subscription ${data.id}`,
        `Created new subscription`
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

// Expenses
export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: Database['public']['Tables']['expenses']['Insert']) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
};