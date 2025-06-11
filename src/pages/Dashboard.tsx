import React from 'react';
import { Users, Package, UserCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/phpStore';
import { useUserStore } from '../store/userStore';
import { calculateTotalRevenue } from '../utils/revenue';
import { getSubscriptionStatus } from '../utils/subscription';
import { format, subMonths } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function Dashboard() {
  const { accounts, packages, customers } = useStore();
  const { users } = useUserStore();

  // Calculate total accounts and growth
  const totalAccounts = accounts.length;
  const lastMonthAccounts = accounts.filter(account => 
    new Date(account.subscriptionDate) > subMonths(new Date(), 1)
  ).length;
  const accountsGrowth = totalAccounts > 0 
    ? ((lastMonthAccounts / totalAccounts) * 100).toFixed(2)
    : '0.00';

  // Calculate active packages and growth
  const activePackages = packages.filter(pkg => pkg.subscribedCustomers > 0).length;
  const totalPackages = packages.length;
  const packagesGrowth = totalPackages > 0
    ? ((activePackages / totalPackages) * 100).toFixed(2)
    : '0.00';

  // Calculate total customers and growth
  const totalCustomers = customers.length;
  const lastMonthCustomers = customers.filter(customer => 
    new Date(customer.subscriptionDate) > subMonths(new Date(), 1)
  ).length;
  const customersGrowth = totalCustomers > 0
    ? ((lastMonthCustomers / totalCustomers) * 100).toFixed(2)
    : '0.00';

  // Calculate total revenue and growth
  const allSubscriptions = customers.flatMap(customer => customer.subscriptionHistory);
  const totalRevenue = calculateTotalRevenue(packages, allSubscriptions);
  const lastMonthRevenue = calculateTotalRevenue(
    packages,
    allSubscriptions.filter(sub => new Date(sub.startDate) > subMonths(new Date(), 1))
  );
  const revenueGrowth = totalRevenue > 0
    ? ((lastMonthRevenue / totalRevenue) * 100).toFixed(2)
    : '0.00';

  const stats = [
    {
      name: 'Total Accounts',
      value: totalAccounts,
      icon: Users,
      trend: `${accountsGrowth}%`,
      up: lastMonthAccounts > 0,
      color: 'bg-[#8a246c]'
    },
    {
      name: 'Active Packages',
      value: activePackages,
      icon: Package,
      trend: `${packagesGrowth}%`,
      up: activePackages > 0,
      color: 'bg-[#8a246c]'
    },
    {
      name: 'Total Customers',
      value: totalCustomers,
      icon: UserCircle,
      trend: `${customersGrowth}%`,
      up: lastMonthCustomers > 0,
      color: 'bg-[#8a246c]'
    },
    {
      name: 'Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: `${revenueGrowth}%`,
      up: lastMonthRevenue > 0,
      color: 'bg-[#8a246c]'
    }
  ];

  // Get recent activity
  const recentActivity = customers
    .flatMap(customer => 
      customer.subscriptionHistory.map(subscription => ({
        type: 'subscription',
        customer: customer.name,
        package: packages.find(p => p.id === subscription.packageId)?.name || 'Unknown Package',
        date: subscription.startDate,
        status: getSubscriptionStatus(subscription)
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-full overflow-hidden"
    >
      <div className="mb-6">
        <motion.h1 
          className="text-3xl font-bold text-[#8a246c]"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Dashboard Overview
        </motion.h1>
        <motion.p 
          className="mt-2 text-sm text-gray-600"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Monitor your business metrics and performance indicators
        </motion.p>
      </div>

      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        variants={containerVariants}
      >
        {stats.map((item, index) => {
          const Icon = item.icon;
          const TrendIcon = item.up ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={item.name}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 rounded-lg relative overflow-hidden transform transition-all duration-200 hover:shadow-lg border border-gray-100"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${item.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-center sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-center text-sm font-semibold ${
                    item.up ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon className="self-center flex-shrink-0 h-5 w-5 text-current" />
                  <span className="ml-1">{item.trend}</span>
                </p>
              </dd>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        variants={containerVariants}
        className="bg-white shadow rounded-lg p-6"
      >
        <h2 className="text-lg font-medium text-[#8a246c] mb-4">Recent Activity</h2>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={`${activity.customer}-${activity.date}-${index}`}
              variants={itemVariants}
              whileHover={{ backgroundColor: 'rgba(138, 36, 108, 0.05)' }}
              className="py-4 transition-colors duration-200"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <UserCircle className="h-8 w-8 text-[#8a246c] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">New customer subscription</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">{activity.customer}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{activity.package}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    activity.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : activity.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(activity.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}