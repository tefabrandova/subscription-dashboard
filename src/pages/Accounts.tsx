import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Package as PackageIcon, Info } from 'lucide-react';
import { useStore } from '../store/phpStore';
import AccountModal from '../components/modals/AccountModal';
import InfoCard from '../components/InfoCard';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import TableFilter from '../components/TableFilter';
import TableSearch from '../components/TableSearch';
import { useTableSort } from '../hooks/useTableSort';
import { formatDate } from '../utils/date';
import type { Account } from '../types';
import ExportButton from '../components/ExportButton';

const searchKeys: (keyof Account)[] = ['id', 'name', 'type', 'subscriptionDate', 'expiryDate'];

const typeFilterOptions = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'purchase', label: 'Purchase' },
];

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    accountId: string;
  }>({ isOpen: false, accountId: '' });

  const accounts = useStore((state) => state.accounts);
  const deleteAccount = useStore((state) => state.deleteAccount);

  const accountNameFilterOptions = useMemo(() => 
    accounts.map(account => ({
      value: account.name,
      label: account.name
    }))
  , [accounts]);

  const {
    items: filteredAccounts,
    requestSort,
    clearSort,
    sortConfig,
    setFilter,
    clearFilters,
    filters
  } = useTableSort<Account>(accounts, searchTerm, searchKeys);

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({
      isOpen: true,
      accountId: id
    });
  };

  const handleInfo = (account: Account) => {
    setSelectedAccount(account);
    setIsInfoOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAccount(undefined);
    setIsModalOpen(true);
  };

  const confirmDeleteAccount = () => {
    deleteAccount(confirmDelete.accountId);
    setConfirmDelete({ isOpen: false, accountId: '' });
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your subscription and purchase accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <ExportButton data={accounts} type="accounts" />
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <TableSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search accounts by ID, name, type..."
        />
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Name"
                        sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                        onSort={() => requestSort('name')}
                        onClear={clearSort}
                        filterOptions={accountNameFilterOptions}
                        onFilter={(value) => setFilter('name', value)}
                        currentFilter={filters['name']}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Type"
                        sortDirection={sortConfig.key === 'type' ? sortConfig.direction : null}
                        onSort={() => requestSort('type')}
                        onClear={clearSort}
                        filterOptions={typeFilterOptions}
                        onFilter={(value) => setFilter('type', value)}
                        currentFilter={filters['type']}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Dates"
                        sortDirection={sortConfig.key === 'subscriptionDate' ? sortConfig.direction : null}
                        onSort={() => requestSort('subscriptionDate')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Price"
                        sortDirection={sortConfig.key === 'price' ? sortConfig.direction : null}
                        onSort={() => requestSort('price')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Packages"
                        sortDirection={sortConfig.key === 'linkedPackages' ? sortConfig.direction : null}
                        onSort={() => requestSort('linkedPackages')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.type === 'subscription'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Start: {formatDate(account.subscriptionDate)}</div>
                        <div>End: {formatDate(account.expiryDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${typeof account.price === 'number' ? account.price.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <PackageIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {account.linkedPackages}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleInfo(account)}
                          className="text-gray-600 hover:text-gray-900 mr-4"
                          title="View Details"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(undefined);
        }}
        account={selectedAccount}
      />

      <InfoCard
        isOpen={isInfoOpen}
        onClose={() => {
          setIsInfoOpen(false);
          setSelectedAccount(undefined);
        }}
        title="Account Details"
        data={selectedAccount}
        type="account"
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, accountId: '' })}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        type="error"
        confirmText="Delete"
      />
    </div>
  );
}