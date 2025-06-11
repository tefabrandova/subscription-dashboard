import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useStore } from '../store/phpStore';
import { useExpenseStore } from '../store/expenseStore';
import { calculateTotalRevenue, calculateTotalExpenses, calculateNetProfit, calculateMonthlyRevenue } from '../utils/revenue';
import { format, subMonths } from 'date-fns';

export default function Revenue() {
  const { packages, customers } = useStore();
  const { expenses } = useExpenseStore();

  // Get all subscriptions from all customers
  const allSubscriptions = customers.flatMap(customer => customer.subscriptionHistory);
  
  // Calculate totals
  const totalRevenue = calculateTotalRevenue(packages, allSubscriptions);
  const totalExpenses = calculateTotalExpenses(expenses);
  const netProfit = calculateNetProfit(totalRevenue, totalExpenses);

  // Calculate monthly data
  const monthlyData = calculateMonthlyRevenue(packages, allSubscriptions);

  // Calculate trends
  const lastMonthRevenue = calculateTotalRevenue(
    packages,
    allSubscriptions.filter(sub => new Date(sub.startDate) > subMonths(new Date(), 1))
  );
  const lastMonthExpenses = expenses
    .filter(expense => new Date(expense.date) > subMonths(new Date(), 1))
    .reduce((total, expense) => total + expense.amount, 0);
  const lastMonthProfit = lastMonthRevenue - lastMonthExpenses;

  const revenueTrend = totalRevenue > 0
    ? ((lastMonthRevenue / totalRevenue) * 100).toFixed(2)
    : '0.00';
  const expensesTrend = totalExpenses > 0
    ? ((lastMonthExpenses / totalExpenses) * 100).toFixed(2)
    : '0.00';
  const profitTrend = netProfit > 0
    ? ((lastMonthProfit / netProfit) * 100).toFixed(2)
    : '0.00';

  const activeSubscriptions = allSubscriptions.filter(sub => 
    new Date(sub.endDate) > new Date() && sub.status === 'active'
  ).length;

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: `${revenueTrend}%`,
      up: lastMonthRevenue > 0,
      color: 'bg-green-500'
    },
    {
      name: 'Total Expenses',
      value: `$${totalExpenses.toFixed(2)}`,
      icon: TrendingDown,
      trend: `${expensesTrend}%`,
      up: false,
      color: 'bg-red-500'
    },
    {
      name: 'Net Profit',
      value: `$${netProfit.toFixed(2)}`,
      icon: TrendingUp,
      trend: `${profitTrend}%`,
      up: lastMonthProfit > 0,
      color: 'bg-indigo-500'
    },
    {
      name: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: Package,
      trend: '+10.2%',
      up: true,
      color: 'bg-blue-500'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Revenue Overview</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track your revenue, expenses, and profit metrics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${item.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.up ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.up ? (
                    <TrendingUp className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                  )}
                  <span className="ml-1">{item.trend}</span>
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Revenue']}
                labelStyle={{ color: '#111827' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#4F46E5" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}