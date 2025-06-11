import { useEffect } from 'react';
import { useStore } from '../store/phpStore';
import { getRemainingDays } from '../utils/date';
import { sendExpiryNotification } from '../utils/notifications';

export function useNotifications() {
  const customers = useStore((state) => state.customers);

  useEffect(() => {
    const checkExpiringSubscriptions = () => {
      customers.forEach((customer) => {
        const daysRemaining = getRemainingDays(customer.expiryDate);
        if (daysRemaining <= 7 && daysRemaining > 0) {
          sendExpiryNotification(customer.email, daysRemaining);
        }
      });
    };

    // Check daily
    const interval = setInterval(checkExpiringSubscriptions, 24 * 60 * 60 * 1000);
    checkExpiringSubscriptions(); // Initial check

    return () => clearInterval(interval);
  }, [customers]);
}