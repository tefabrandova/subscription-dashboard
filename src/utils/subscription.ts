import { differenceInDays, addDays, format, parseISO } from 'date-fns';
import type { Subscription, Package } from '../types';

export const getSubscriptionStatus = (subscription: Subscription): 'active' | 'expired' | 'sold' => {
  if (subscription.status === 'sold') return 'sold';
  return new Date(subscription.endDate) < new Date() ? 'expired' : 'active';
};

export const calculateExpiryDate = (startDate: string, duration: number) => {
  const date = parseISO(startDate);
  // Calculate expiry by adding duration * 30 days
  const daysToAdd = duration * 30;
  return format(addDays(date, daysToAdd), 'yyyy-MM-dd');
};

export const getRemainingTime = (startDate: string, endDate: string, unit: string = 'days') => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (now < start) {
    return `${differenceInDays(end, start)} ${unit}`;
  }

  const remaining = differenceInDays(end, now);
  return remaining > 0 ? `${remaining} ${unit}` : '0 days';
};

export const getMonthDays = (months: number): number => {
  return months * 30;
};

export const getRemainingDays = (subscription: Subscription, pkg?: Package) => {
  if (!pkg || pkg.type !== 'subscription') return null;
  
  const status = getSubscriptionStatus(subscription);
  if (status !== 'active') return null;

  const now = new Date();
  const end = new Date(subscription.endDate);
  const remaining = differenceInDays(end, now);
  
  return remaining > 0 ? `${remaining} days` : '0 days';
};

export const filterSubscriptionsByStatus = (subscriptions: Subscription[], statusFilter: string) => {
  if (!statusFilter) return subscriptions;
  
  return subscriptions.filter(subscription => {
    const status = getSubscriptionStatus(subscription);
    return status === statusFilter;
  });
};

export const filterSubscriptionsByPackage = (subscriptions: Subscription[], packageName: string, packages: Package[]) => {
  if (!packageName) return subscriptions;
  
  return subscriptions.filter(subscription => {
    const pkg = packages.find(p => p.id === subscription.packageId);
    return pkg?.name.toLowerCase() === packageName.toLowerCase();
  });
};