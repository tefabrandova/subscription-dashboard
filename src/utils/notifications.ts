import { differenceInDays, addDays } from 'date-fns';
import type { Account, Customer, Subscription, Package } from '../types';

export interface ExpiryNotification {
  id: string;
  type: 'account' | 'package';
  name: string;
  daysRemaining: number;
  expiryDate: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export const checkExpiringAccounts = (accounts: Account[]): ExpiryNotification[] => {
  const today = new Date();
  const fiveDaysFromNow = addDays(today, 5);
  
  return accounts
    .filter(account => {
      const expiryDate = new Date(account.expiryDate);
      return expiryDate <= fiveDaysFromNow && expiryDate > today;
    })
    .map(account => ({
      id: account.id,
      type: 'account',
      name: account.name,
      daysRemaining: differenceInDays(new Date(account.expiryDate), today),
      expiryDate: account.expiryDate
    }));
};

export const checkExpiringPackages = (
  customers: Customer[],
  packages: Package[]
): ExpiryNotification[] => {
  const today = new Date();
  const fiveDaysFromNow = addDays(today, 5);
  
  return customers.flatMap(customer => 
    customer.subscriptionHistory
      .filter(subscription => {
        const expiryDate = new Date(subscription.endDate);
        return (
          subscription.status === 'active' &&
          expiryDate <= fiveDaysFromNow && 
          expiryDate > today
        );
      })
      .map(subscription => {
        const pkg = packages.find(p => p.id === subscription.packageId);
        return {
          id: subscription.id,
          type: 'package',
          name: pkg?.name || 'Unknown Package',
          daysRemaining: differenceInDays(new Date(subscription.endDate), today),
          expiryDate: subscription.endDate,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone
        };
      })
  );
};

export const getWhatsAppLink = (phone: string, notification: ExpiryNotification) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const message = `Dear ${notification.customerName},\n\nYour subscription for ${notification.name} will expire in ${notification.daysRemaining} days (${notification.expiryDate}).\n\nPlease contact us to renew your subscription.\n\nBest regards`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const getMailtoLink = (email: string, subject: string, body: string) => {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};