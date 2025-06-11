import React from 'react';
import { Bell, Calendar, User, Package } from 'lucide-react';
import { useStore } from '../store';
import { useUserStore } from '../store/userStore';
import { checkExpiringAccounts, checkExpiringPackages } from '../utils/notifications';
import { formatDate } from '../utils/date';

export default function Notifications() {
  const { currentUser } = useUserStore();
  const { accounts, packages, customers } = useStore();
  
  const isAdmin = currentUser?.role === 'admin';
  const expiringAccounts = isAdmin ? checkExpiringAccounts(accounts) : [];
  const expiringPackages = checkExpiringPackages(customers, packages);
  
  const notifications = [
    ...(isAdmin ? expiringAccounts : []),
    ...expiringPackages
  ];

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-700">
            View all system notifications and alerts
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={`${notification.type}-${notification.id}`}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`rounded-full p-2 ${
                    notification.type === 'account' 
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.type === 'account' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.type === 'account' ? 'Account Expiring' : 'Package Expiring'}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <p className="font-medium text-gray-900">{notification.name}</p>
                      {notification.customerName && (
                        <p className="mt-1">
                          Customer: {notification.customerName}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                      Expires in {notification.daysRemaining} days ({formatDate(notification.expiryDate)})
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.daysRemaining <= 2
                        ? 'bg-red-100 text-red-800'
                        : notification.daysRemaining <= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {notification.daysRemaining} days remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You're all caught up! There are no pending notifications at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}