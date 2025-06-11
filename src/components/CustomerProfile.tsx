import React from 'react';
import { Dialog } from '@headlessui/react';
import { X, Package as PackageIcon, Phone, Mail, Clock, CheckCircle, XCircle, Tag, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../store/phpStore';
import { formatDate } from '../utils/date';
import { formatPrice } from '../utils/format';
import { getSubscriptionStatus, getRemainingDays } from '../utils/subscription';
import CustomerModal from './modals/CustomerModal';
import ConfirmDialog from './dialogs/ConfirmDialog';
import type { Customer, Subscription, Package } from '../types';

interface CustomerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEditPackage: (customer: Customer, subscriptionId?: string) => void;
}

export default function CustomerProfile({ isOpen, onClose, customer, onEditPackage }: CustomerProfileProps) {
  const [isPackageModalOpen, setIsPackageModalOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<{
    isOpen: boolean;
    subscriptionId: string;
  }>({ isOpen: false, subscriptionId: '' });

  const packages = useStore((state) => state.packages);
  const updateCustomer = useStore((state) => state.updateCustomer);
  const updatePackage = useStore((state) => state.updatePackage);

  const getPackage = (id: string) => packages.find(p => p.id === id);

  const handleEditPackage = (subscription: Subscription) => {
    onEditPackage(customer, subscription.id);
  };

  const handleAddNewPackage = () => {
    onEditPackage(customer);
  };

  const handleDeletePackage = (subscription: Subscription) => {
    setConfirmDelete({
      isOpen: true,
      subscriptionId: subscription.id
    });
  };

  const confirmDeletePackage = () => {
    const subscription = customer.subscriptionHistory.find(s => s.id === confirmDelete.subscriptionId);
    if (subscription) {
      const updatedHistory = customer.subscriptionHistory.filter(s => s.id !== subscription.id);
      updateCustomer(customer.id, { subscriptionHistory: updatedHistory });

      const pkg = packages.find(p => p.id === subscription.packageId);
      if (pkg) {
        updatePackage(pkg.id, {
          subscribedCustomers: Math.max(0, pkg.subscribedCustomers - 1)
        });
      }
    }
    setConfirmDelete({ isOpen: false, subscriptionId: '' });
  };

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
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-5xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Customer Profile
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer ID</p>
                      <p className="mt-1 text-sm text-gray-900">{customer.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <a
                        href={getWhatsAppLink(customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        {customer.phone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{customer.email}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Active Packages</h3>
                    <button
                      onClick={handleAddNewPackage}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PackageIcon className="h-4 w-4 mr-2" />
                      Add New Package
                    </button>
                  </div>
                  <div className="space-y-4">
                    {customer.subscriptionHistory
                      .filter(sub => getSubscriptionStatus(sub) === 'active')
                      .map(subscription => {
                        const pkg = getPackage(subscription.packageId);
                        if (!pkg) return null;

                        const remainingDays = getRemainingDays(subscription, pkg);

                        return (
                          <div key={subscription.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-base font-medium text-gray-900">{pkg.name}</h4>
                                  <span className="text-xs text-gray-500">#{subscription.id.slice(0, 4)}</span>
                                </div>
                                <p className="text-sm text-gray-500 capitalize mt-1">{pkg.type}</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                {remainingDays && (
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                                  onClick={() => handleEditPackage(subscription)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit Package"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePackage(subscription)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Package"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <span className="ml-2 text-gray-900">
                                  {pkg.type === 'subscription' ? `${subscription.duration} months` : 'One-time purchase'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Start Date:</span>
                                <span className="ml-2 text-gray-900">{formatDate(subscription.startDate)}</span>
                              </div>
                              {pkg.type === 'subscription' && (
                                <>
                                  <div>
                                    <span className="text-gray-500">End Date:</span>
                                    <span className="ml-2 text-gray-900">{formatDate(subscription.endDate)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Price:</span>
                                    <span className="ml-2 text-gray-900">
                                      {getPackagePrice(subscription, pkg)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Package History</h3>
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                Package
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                Duration
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                Dates
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                Price
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                Remaining
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {customer.subscriptionHistory.map((subscription) => {
                              const pkg = getPackage(subscription.packageId);
                              const status = getSubscriptionStatus(subscription);
                              const remainingDays = getRemainingDays(subscription, pkg);
                              
                              return (
                                <tr key={subscription.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <div className="text-sm font-medium text-gray-900">{pkg?.name || 'Unknown Package'}</div>
                                      <span className="text-xs text-gray-500">#{subscription.id.slice(0, 4)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">{pkg?.type}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {pkg?.type === 'subscription' ? `${subscription.duration} months` : 'One-time purchase'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {pkg?.type === 'subscription' ? (
                                        <>
                                          <div>Start: {formatDate(subscription.startDate)}</div>
                                          <div>End: {formatDate(subscription.endDate)}</div>
                                        </>
                                      ) : (
                                        <div>Purchase: {formatDate(subscription.startDate)}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {status === 'active' ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : status === 'expired' ? (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      ) : (
                                        <Tag className="h-4 w-4 text-blue-600" />
                                      )}
                                      <span className={`ml-2 inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                                        status === 'active'
                                          ? 'bg-green-100 text-green-800'
                                          : status === 'expired'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pkg && getPackagePrice(subscription, pkg)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {remainingDays && (
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        parseInt(remainingDays) > 30
                                          ? 'bg-green-100 text-green-800'
                                          : parseInt(remainingDays) > 7
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {remainingDays}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleEditPackage(subscription)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Edit Package"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePackage(subscription)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete Package"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, subscriptionId: '' })}
        onConfirm={confirmDeletePackage}
        title="Delete Package"
        message="Are you sure you want to delete this package subscription? This action cannot be undone."
        type="error"
        confirmText="Delete"
      />
    </>
  );
}