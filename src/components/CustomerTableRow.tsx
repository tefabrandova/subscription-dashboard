import React from 'react';
import { ExternalLink, User, Package as PackageIcon, Pencil, Trash2 } from 'lucide-react';
import type { Customer, Package, Subscription } from '../types';
import { formatDate } from '../utils/date';
import { formatPrice } from '../utils/format';
import { getSubscriptionStatus, getRemainingDays } from '../utils/subscription';

interface CustomerTableRowProps {
  customer: Customer;
  packages: Package[];
  filteredSubscriptions: Subscription[];
  onViewProfile: (customer: Customer) => void;
  onAddPackage: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onEditPackage: (customer: Customer, subscriptionId: string) => void;
}

const CustomerTableRow: React.FC<CustomerTableRowProps> = ({
  customer,
  packages,
  filteredSubscriptions,
  onViewProfile,
  onAddPackage,
  onEdit,
  onDelete,
  onEditPackage
}) => {
  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const getPackagePrice = (subscription: Subscription, pkg: Package) => {
    if (!pkg) return '$0.00';
    
    if (pkg.type === 'purchase') {
      return formatPrice(Array.isArray(pkg.price) ? pkg.price[0]?.price || 0 : pkg.price);
    }

    if (Array.isArray(pkg.price)) {
      const priceOption = pkg.price.find(p => p.duration === subscription.duration);
      return formatPrice(priceOption?.price || 0);
    }

    return formatPrice(pkg.price);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {customer.name}
          </div>
          <div className="text-xs text-gray-500">
            ID: {customer.id.slice(0, 8)}
          </div>
          <div className="text-sm text-gray-500">{customer.email}</div>
          <a
            href={getWhatsAppLink(customer.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
          >
            {customer.phone}
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => {
            const pkg = packages.find(p => p.id === subscription.packageId);
            if (!pkg) return null;
            
            const status = getSubscriptionStatus(subscription);
            const remainingDays = getRemainingDays(subscription, pkg);
            
            return (
              <div key={subscription.id} className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                    <span className="text-xs text-gray-500">#{subscription.id.slice(0, 4)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {pkg.type === 'subscription' ? (
                      <>
                        {subscription.duration} months
                        <span className="mx-1">•</span>
                        {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                      </>
                    ) : (
                      <>
                        One-time purchase
                        <span className="mx-1">•</span>
                        {formatDate(subscription.startDate)}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getPackagePrice(subscription, pkg)}
                    </span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {status === 'sold' ? 'Sold' : status === 'expired' ? 'Expired' : 'Active'}
                    </span>
                    {remainingDays && (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        parseInt(remainingDays) > 30
                          ? 'bg-green-100 text-green-800'
                          : parseInt(remainingDays) > 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {remainingDays}
                      </span>
                    )}
                    <button
                      onClick={() => onEditPackage(customer, subscription.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Package"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-6 py-6 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => onViewProfile(customer)}
            className="text-gray-600 hover:text-gray-900"
            title="View Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAddPackage(customer)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Add New Package"
          >
            <PackageIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit Customer Info"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(customer.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CustomerTableRow;