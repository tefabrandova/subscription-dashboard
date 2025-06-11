import React, { useState } from 'react';
import { Search, UserPlus, Package, Filter } from 'lucide-react';
import { useStore } from '../store/phpStore';
import CustomerModal from '../components/modals/CustomerModal';
import CustomerProfile from '../components/CustomerProfile';
import CustomerTableRow from '../components/CustomerTableRow';
import TableSearch from '../components/TableSearch';
import TableFilter from '../components/TableFilter';
import { useTableSort } from '../hooks/useTableSort';
import { createPackageFilterOptions } from '../utils/filters';
import type { Customer } from '../types';
import ExportButton from '../components/ExportButton';

const searchKeys: (keyof Customer)[] = ['id', 'name', 'email', 'phone'];

const statusFilterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'sold', label: 'Sold' },
];

export default function UserPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | undefined>();
  const [isNewPackage, setIsNewPackage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const customers = useStore((state) => state.customers);
  const packages = useStore((state) => state.packages);

  const packageFilterOptions = React.useMemo(() => 
    createPackageFilterOptions(packages)
  , [packages]);

  const {
    items: filteredCustomers,
    requestSort,
    clearSort,
    sortConfig,
    setFilter,
    clearFilters,
    filters
  } = useTableSort<Customer>(customers, searchTerm, searchKeys, packages);

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setSelectedSubscriptionId(undefined);
    setIsNewPackage(false);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedSubscriptionId(undefined);
    setIsNewPackage(false);
    setIsModalOpen(true);
  };

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsProfileOpen(true);
  };

  const handleEditPackage = (customer: Customer, subscriptionId: string) => {
    setSelectedCustomer(customer);
    setSelectedSubscriptionId(subscriptionId);
    setIsNewPackage(false);
    setIsModalOpen(true);
  };

  const handleAddNewPackage = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedSubscriptionId(undefined);
    setIsNewPackage(true);
    setIsModalOpen(true);
  };

  const validateCustomer = (phone: string, email: string, customerId?: string) => {
    const existingPhone = customers.find(c => c.phone === phone && c.id !== customerId);
    if (existingPhone) {
      return false;
    }
    if (email) {
      const existingEmail = customers.find(c => c.email === email && c.id !== customerId);
      if (existingEmail) {
        return false;
      }
    }
    return true;
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Control Panel</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customers and their subscriptions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <ExportButton data={customers} type="customers" />
          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <TableSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search customers by ID, name, phone, email..."
        />
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      <TableFilter
                        column="Customer Info"
                        sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                        onSort={() => requestSort('name')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-4">
                        <TableFilter
                          column="Package"
                          sortDirection={null}
                          onSort={() => {}}
                          onClear={clearSort}
                          filterOptions={packageFilterOptions}
                          onFilter={(value) => setFilter('package', value)}
                          currentFilter={filters['package']}
                        />
                        <TableFilter
                          column="Status"
                          sortDirection={null}
                          onSort={() => {}}
                          onClear={clearSort}
                          filterOptions={statusFilterOptions}
                          onFilter={(value) => setFilter('status', value)}
                          currentFilter={filters['status']}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <CustomerTableRow
                      key={customer.id}
                      customer={customer}
                      packages={packages}
                      filteredSubscriptions={customer.subscriptionHistory}
                      onViewProfile={handleViewProfile}
                      onAddPackage={handleAddNewPackage}
                      onEdit={handleEditCustomer}
                      onDelete={() => {}}
                      onEditPackage={handleEditPackage}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(undefined);
          setSelectedSubscriptionId(undefined);
          setIsNewPackage(false);
        }}
        customer={selectedCustomer}
        selectedSubscriptionId={selectedSubscriptionId}
        isNewPackage={isNewPackage}
        onValidate={validateCustomer}
      />

      {selectedCustomer && (
        <CustomerProfile
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedCustomer(undefined);
          }}
          customer={selectedCustomer}
          onEditPackage={(customer, subscriptionId) => {
            setIsProfileOpen(false);
            setSelectedCustomer(customer);
            setSelectedSubscriptionId(subscriptionId);
            setIsNewPackage(false);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}