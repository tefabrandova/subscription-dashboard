import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useStore } from '../store/phpStore';
import { formatDate } from '../utils/date';
import { formatPrice } from '../utils/format';
import type { Package, Account, Credential, AccountType, PriceDuration } from '../types';

interface InfoCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data?: Package | Account;
  type: 'package' | 'account';
}

const renderCredentialsTable = (details: Credential[], type: AccountType) => {
  if (!details || details.length === 0) {
    return <div className="text-gray-500">No credentials available</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {type === 'subscription' ? (
              <>
                <th scope="col\" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Username</th>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Password</th>
              </>
            ) : (
              <>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Type</th>
                <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Info</th>
              </>
            )}
            <th scope="col" className="w-1/2 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {details.map((credential, index) => (
            <tr key={index}>
              {type === 'subscription' ? (
                <>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{(credential as SubscriptionCredential).username}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{(credential as SubscriptionCredential).password}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{(credential as PurchaseCredential).type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{(credential as PurchaseCredential).info}</td>
                </>
              )}
              <td className="px-4 py-3 text-sm text-gray-900 whitespace-pre-wrap">{credential.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderPriceTable = (price: number | PriceDuration[]) => {
  if (typeof price === 'number') {
    return (
      <div className="text-lg font-semibold">
        ${price.toFixed(2)}
      </div>
    );
  }

  if (!Array.isArray(price) || price.length === 0) {
    return <div className="text-gray-500">No pricing available</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {price.map((p, index) => (
            <tr key={index}>
              <td className="px-4 py-3 text-sm text-gray-900">
                {p.duration} {p.unit}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                ${p.price.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function InfoCard({ isOpen, onClose, title, data, type }: InfoCardProps) {
  const accounts = useStore((state) => state.accounts);

  if (!data) return null;

  const getAccountName = (accountId: string) => {
    return accounts.find(account => account.id === accountId)?.name || 'Unknown Account';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4 overflow-y-auto flex-grow">
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.id}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{data.name}</dd>
              </div>

              {type === 'package' && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getAccountName((data as Package).accountId)}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    data.type === 'subscription'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {data.type}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Credentials</dt>
                <dd className="mt-1">
                  {renderCredentialsTable(data.details, data.type)}
                </dd>
              </div>

              {type === 'account' && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subscription Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate((data as Account).subscriptionDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate((data as Account).expiryDate)}
                      </dd>
                    </div>
                  </div>
                </>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Pricing</dt>
                <dd className="mt-1">
                  {renderPriceTable(data.price)}
                </dd>
              </div>

              {type === 'account' && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Linked Packages</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(data as Account).linkedPackages}
                  </dd>
                </div>
              )}

              {type === 'package' && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subscribed Customers</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(data as Package).subscribedCustomers}
                  </dd>
                </div>
              )}
            </dl>
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
  );
}