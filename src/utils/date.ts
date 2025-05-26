import { format, differenceInDays, isValid } from 'date-fns';

export const formatDate = (date: string | null | undefined) => {
  if (!date) return 'Not set';
  const parsedDate = new Date(date);
  return isValid(parsedDate) ? format(parsedDate, 'MMM dd, yyyy') : 'Invalid date';
};

export const getRemainingDays = (expiryDate: string) => {
  const parsedDate = new Date(expiryDate);
  if (!isValid(parsedDate)) return 0;
  const days = differenceInDays(parsedDate, new Date());
  return days > 0 ? days : 0;
};

export const isExpired = (expiryDate: string) => {
  return getRemainingDays(expiryDate) === 0;
};