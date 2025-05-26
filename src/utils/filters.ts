import type { Package, Subscription, Customer } from '../types';

export const createPackageFilterOptions = (packages: Package[]) => {
  const uniquePackages = new Map<string, Package>();
  packages.forEach(pkg => {
    uniquePackages.set(pkg.name.toLowerCase(), pkg);
  });
  
  return Array.from(uniquePackages.values()).map(pkg => ({
    value: pkg.name.toLowerCase(),
    label: pkg.name
  }));
};

export const filterCustomersByPackage = (
  customers: Customer[],
  packageFilter: string,
  packages: Package[]
): Customer[] => {
  if (!packageFilter) return customers;

  return customers.filter(customer => {
    return customer.subscriptionHistory.some(subscription => {
      const pkg = packages.find(p => p.id === subscription.packageId);
      return pkg?.name.toLowerCase() === packageFilter.toLowerCase();
    });
  });
};

export const filterSubscriptionsByPackage = (
  subscriptions: Subscription[],
  packageFilter: string,
  packages: Package[]
): Subscription[] => {
  if (!packageFilter) return subscriptions;

  return subscriptions.filter(subscription => {
    const pkg = packages.find(p => p.id === subscription.packageId);
    return pkg?.name.toLowerCase() === packageFilter.toLowerCase();
  });
};