import type { Package, Subscription } from '../types';

export const calculateTotalRevenue = (packages: Package[], subscriptions: Subscription[]): number => {
  return subscriptions.reduce((total, subscription) => {
    const pkg = packages.find(p => p.id === subscription.packageId);
    if (!pkg) return total;

    if (pkg.type === 'purchase') {
      return total + (Array.isArray(pkg.price) ? pkg.price[0]?.price || 0 : pkg.price);
    }

    if (Array.isArray(pkg.price)) {
      const priceOption = pkg.price.find(p => p.duration === subscription.duration);
      return total + (priceOption?.price || 0);
    }

    return total + pkg.price;
  }, 0);
};

export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

export const calculateNetProfit = (revenue: number, expenses: number): number => {
  return revenue - expenses;
};

export const calculateMonthlyRevenue = (packages: Package[], subscriptions: Subscription[]): { month: string; revenue: number }[] => {
  const monthlyData = new Map<string, number>();

  subscriptions.forEach(subscription => {
    const pkg = packages.find(p => p.id === subscription.packageId);
    if (!pkg) return;

    const startDate = new Date(subscription.startDate);
    const month = startDate.toLocaleString('default', { month: 'short' });
    
    let price = 0;
    if (pkg.type === 'purchase') {
      price = Array.isArray(pkg.price) ? pkg.price[0]?.price || 0 : pkg.price;
    } else if (Array.isArray(pkg.price)) {
      const priceOption = pkg.price.find(p => p.duration === subscription.duration);
      price = priceOption?.price || 0;
    } else {
      price = pkg.price;
    }

    monthlyData.set(month, (monthlyData.get(month) || 0) + price);
  });

  return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
    month,
    revenue
  }));
};