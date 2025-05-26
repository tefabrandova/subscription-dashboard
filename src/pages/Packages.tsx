import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, Info } from 'lucide-react';
import { useStore } from '../store';
import PackageModal from '../components/modals/PackageModal';
import InfoCard from '../components/InfoCard';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import TableFilter from '../components/TableFilter';
import TableSearch from '../components/TableSearch';
import { useTableSort } from '../hooks/useTableSort';
import type { Package } from '../types';
import ExportButton from '../components/ExportButton';

const searchKeys: (keyof Package)[] = ['id', 'name', 'type', 'accountId'];

const typeFilterOptions = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'purchase', label: 'Purchase' },
];

export default function Packages() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | undefined>();
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    packageId: string;
  }>({ isOpen: false, packageId: '' });

  const packages = useStore((state) => state.packages);
  const accounts = useStore((state) => state.accounts);
  const deletePackage = useStore((state) => state.deletePackage);

  const accountFilterOptions = useMemo(() => 
    accounts.map(account => ({
      value: account.id,
      label: account.name
    }))
  , [accounts]);

  const packageNameFilterOptions = useMemo(() => 
    packages.map(pkg => ({
      value: pkg.name,
      label: pkg.name
    }))
  , [packages]);

  const {
    items: filteredPackages,
    requestSort,
    clearSort,
    sortConfig,
    setFilter,
    clearFilters,
    filters
  } = useTableSort<Package>(packages, searchTerm, searchKeys);

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({
      isOpen: true,
      packageId: id
    });
  };

  const handleInfo = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsInfoOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPackage(undefined);
    setIsModalOpen(true);
  };

  const confirmDeletePackage = () => {
    deletePackage(confirmDelete.packageId);
    setConfirmDelete({ isOpen: false, packageId: '' });
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(account => account.id === accountId)?.name || 'Unknown Account';
  };

  const handleDurationSelect = (packageId: string, index: number) => {
    setSelectedDurations(prev => ({ ...prev, [packageId]: index }));
  };

  const renderPrice = (pkg: Package) => {
    if (pkg.type === 'purchase') {
      return <div>${Array.isArray(pkg.price) ? pkg.price[0]?.price.toFixed(2) : (typeof pkg.price === 'number' ? pkg.price.toFixed(2) : '0.00')}</div>;
    }

    if (!Array.isArray(pkg.price) || pkg.price.length === 0) {
      return <div>$0.00</div>;
    }

    const selectedIndex = selectedDurations[pkg.id] || 0;
    const selectedPrice = pkg.price[selectedIndex];

    if (!selectedPrice) {
      return <div>$0.00</div>;
    }

    return (
      <div className="flex items-center space-x-2">
        <select
          value={selectedIndex}
          onChange={(e) => handleDurationSelect(pkg.id, Number(e.target.value))}
          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {pkg.price.map((price, index) => (
            <option key={index} value={index}>
              {price.duration} months
            </option>
          ))}
        </select>
        <span>${selectedPrice.price.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Packages</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your subscription and purchase packages
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <ExportButton data={packages} type="packages" />
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </button>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <TableSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search packages by ID, name, type..."
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
                      Package ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Name"
                        sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                        onSort={() => requestSort('name')}
                        onClear={clearSort}
                        filterOptions={packageNameFilterOptions}
                        onFilter={(value) => setFilter('name', value)}
                        currentFilter={filters['name']}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Account"
                        sortDirection={sortConfig.key === 'accountId' ? sortConfig.direction : null}
                        onSort={() => requestSort('accountId')}
                        onClear={clearSort}
                        filterOptions={accountFilterOptions}
                        onFilter={(value) => setFilter('accountId', value)}
                        currentFilter={filters['accountId']}
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
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Subscribers"
                        sortDirection={sortConfig.key === 'subscribedCustomers' ? sortConfig.direction : null}
                        onSort={() => requestSort('subscribedCustomers')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPackages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAccountName(pkg.accountId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pkg.type === 'subscription'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {pkg.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderPrice(pkg)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {pkg.subscribedCustomers}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleInfo(pkg)}
                          className="text-gray-600 hover:text-gray-900 mr-4"
                          title="View Details"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
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

      <PackageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPackage(undefined);
        }}
        package={selectedPackage}
      />

      <InfoCard
        isOpen={isInfoOpen}
        onClose={() => {
          setIsInfoOpen(false);
          setSelectedPackage(undefined);
        }}
        title="Package Details"
        data={selectedPackage}
        type="package"
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, packageId: '' })}
        onConfirm={confirmDeletePackage}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        type="error"
        confirmText="Delete"
      />
    </div>
  );
}