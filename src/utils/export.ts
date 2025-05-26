import { format } from 'date-fns';
import type { Account, Package, Customer, Subscription } from '../types';
import type { ActivityLog } from '../types/activity';
import type { User } from '../types/user';
import type { Expense } from '../types/expense';

type ExportFormat = 'csv' | 'json';

const formatDate = (date: string) => format(new Date(date), 'yyyy-MM-dd HH:mm:ss');

const getPackageDetails = (subscription: Subscription, packages: Package[]) => {
  const pkg = packages.find(p => p.id === subscription.packageId);
  return {
    name: pkg ? pkg.name : 'Unknown Package',
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    status: subscription.status
  };
};

const convertToCSV = (data: any[], headers: string[], type: string, packages?: Package[]) => {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(item => {
    if (type === 'customers' && packages) {
      // For customers, create a row for each package subscription
      const customerPackages = item.subscriptionHistory.map(sub => getPackageDetails(sub, packages));
      
      if (customerPackages.length === 0) {
        // If no packages, add a single row with customer info
        const values = headers.map(header => {
          const value = item[header];
          if (typeof value === 'string') {
            return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
          }
          return '';
        });
        csvRows.push(values.join(','));
      } else {
        // Add a row for each package
        customerPackages.forEach(pkg => {
          const values = headers.map(header => {
            let value;
            switch (header) {
              case 'id':
              case 'name':
              case 'phone':
              case 'email':
                value = item[header];
                break;
              case 'package':
                value = pkg.name;
                break;
              case 'startDate':
                value = pkg.startDate;
                break;
              case 'endDate':
                value = pkg.endDate;
                break;
              case 'status':
                value = pkg.status;
                break;
              default:
                value = '';
            }
            
            if (typeof value === 'string') {
              return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
            }
            return value || '';
          });
          csvRows.push(values.join(','));
        });
      }
    } else {
      // For other types, process normally
      const values = headers.map(header => {
        let value = item[header];
        if (typeof value === 'string') {
          return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
        }
        if (value instanceof Date) {
          return formatDate(value.toISOString());
        }
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
  });
  
  return csvRows.join('\n');
};

export const exportData = (data: any[], type: string, format: ExportFormat = 'csv', packages?: Package[]) => {
  let exportData: string;
  let filename: string;
  const timestamp = formatDate(new Date().toISOString());

  if (format === 'csv') {
    let headers: string[] = [];
    
    switch (type) {
      case 'accounts':
        headers = ['id', 'name', 'type', 'subscriptionDate', 'expiryDate', 'price', 'linkedPackages'];
        break;
      case 'packages':
        headers = ['id', 'name', 'accountId', 'type', 'price', 'subscribedCustomers'];
        break;
      case 'customers':
        headers = ['id', 'name', 'phone', 'email', 'package', 'startDate', 'endDate', 'status'];
        break;
      case 'activity':
        headers = ['timestamp', 'userName', 'userRole', 'actionType', 'objectType', 'objectName', 'details'];
        break;
      case 'expenses':
        headers = ['date', 'category', 'description', 'amount'];
        break;
      case 'users':
        headers = ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin'];
        break;
      default:
        headers = Object.keys(data[0] || {});
    }
    
    exportData = convertToCSV(data, headers, type, packages);
    filename = `${type}_export_${timestamp}.csv`;
  } else {
    exportData = JSON.stringify(data, null, 2);
    filename = `${type}_export_${timestamp}.json`;
  }

  const blob = new Blob([exportData], { 
    type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};