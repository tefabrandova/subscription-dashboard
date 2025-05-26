import React, { useState } from 'react';
import { Bell, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExpiryNotification } from '../utils/notifications';
import { formatDate } from '../utils/date';
import { getWhatsAppLink, getMailtoLink } from '../utils/notifications';

interface NotificationBellProps {
  notifications: ExpiryNotification[];
  onViewAll?: () => void;
}

export default function NotificationBell({ notifications, onViewAll }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (notifications.length === 0) return null;

  const handleContactCustomer = (notification: ExpiryNotification, method: 'whatsapp' | 'email') => {
    if (!notification.customerEmail && !notification.customerPhone) return;

    if (method === 'whatsapp' && notification.customerPhone) {
      window.open(getWhatsAppLink(notification.customerPhone, notification), '_blank');
    } else if (method === 'email' && notification.customerEmail) {
      const subject = `Subscription Expiry Reminder - ${notification.name}`;
      const body = `Dear ${notification.customerName},\n\nYour subscription for ${notification.name} will expire on ${formatDate(notification.expiryDate)}.\n\nPlease contact us to renew your subscription.\n\nBest regards,\nYour Team`;
      window.open(getMailtoLink(notification.customerEmail, subject, body), '_blank');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Bell className="h-6 w-6 text-gray-500" />
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 z-40 mt-2 w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Notifications ({notifications.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {notifications.map((notification) => (
                    <div
                      key={`${notification.type}-${notification.id}`}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.type === 'account' ? 'Account Expiring' : 'Package Expiring'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.name}
                          {notification.customerName && (
                            <span className="block text-xs">
                              Customer: {notification.customerName}
                            </span>
                          )}
                        </p>
                        <div className="mt-1 text-xs text-gray-500">
                          <span>Expires in {notification.daysRemaining} days</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(notification.expiryDate)}</span>
                        </div>
                        {(notification.customerEmail || notification.customerPhone) && (
                          <div className="mt-2 flex space-x-2">
                            {notification.customerPhone && (
                              <button
                                onClick={() => handleContactCustomer(notification, 'whatsapp')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                WhatsApp
                              </button>
                            )}
                            {notification.customerEmail && (
                              <button
                                onClick={() => handleContactCustomer(notification, 'email')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.daysRemaining <= 2
                            ? 'bg-red-100 text-red-800'
                            : notification.daysRemaining <= 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {notification.daysRemaining} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {onViewAll && (
                  <button
                    onClick={() => {
                      onViewAll();
                      setIsOpen(false);
                    }}
                    className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}