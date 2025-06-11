import React, { useState } from 'react';
import { Users, Package, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import TableSearch from '../../components/TableSearch';
import TableFilter from '../../components/TableFilter';
import AlertDialog from '../../components/dialogs/AlertDialog';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';
import { formatDate } from '../../utils/date';

interface Workspace {
  id: string;
  name: string;
  businessName: string;
  businessEmail: string;
  status: 'active' | 'suspended' | 'expired';
  subscription: {
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    amountPaid: number;
  };
  stats: {
    customers: number;
    packages: number;
    revenue: number;
  };
}

export default function WorkspaceManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'suspend' | 'activate';
    workspaceId: string;
  }>({ isOpen: false, type: 'suspend', workspaceId: '' });

  const { data: workspaces, isLoading, error } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/admin/workspaces').then(res => res.data)
  });

  const handleStatusChange = async (workspaceId: string, action: 'suspend' | 'activate') => {
    try {
      await api.post(`/admin/workspaces/${workspaceId}/${action}`);
      // Refetch workspaces
    } catch (error) {
      console.error('Failed to update workspace status:', error);
    }
  };

  const filteredWorkspaces = workspaces?.filter(workspace => {
    const matchesSearch = 
      workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.businessEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || workspace.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Workspace Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all workspaces and their subscription status
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TableSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search workspaces..."
        />
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Business Info
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Subscription
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Usage
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredWorkspaces?.map((workspace) => (
                    <tr key={workspace.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">{workspace.businessName}</div>
                          <div className="text-gray-500">{workspace.businessEmail}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex flex-col">
                          <div className="text-gray-900">{workspace.subscription.planName}</div>
                          <div className="text-sm text-gray-500">
                            {workspace.subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} •{' '}
                            ${workspace.subscription.amountPaid}
                          </div>
                          <div className="text-sm text-gray-500">
                            Expires: {formatDate(workspace.subscription.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {workspace.stats.customers}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Package className="h-4 w-4 mr-1" />
                            {workspace.stats.packages}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {workspace.stats.revenue}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          workspace.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : workspace.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {workspace.status === 'active' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {workspace.status === 'suspended' && <XCircle className="mr-1 h-3 w-3" />}
                          {workspace.status === 'expired' && <AlertCircle className="mr-1 h-3 w-3" />}
                          {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {workspace.status === 'active' ? (
                          <button
                            onClick={() => setConfirmAction({
                              isOpen: true,
                              type: 'suspend',
                              workspaceId: workspace.id
                            })}
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({
                              isOpen: true,
                              type: 'activate',
                              workspaceId: workspace.id
                            })}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ isOpen: false, type: 'suspend', workspaceId: '' })}
        onConfirm={() => {
          handleStatusChange(confirmAction.workspaceId, confirmAction.type);
          setConfirmAction({ isOpen: false, type: 'suspend', workspaceId: '' });
        }}
        title={`${confirmAction.type === 'suspend' ? 'Suspend' : 'Activate'} Workspace`}
        message={`Are you sure you want to ${confirmAction.type} this workspace? ${
          confirmAction.type === 'suspend'
            ? 'Users will lose access to their data until reactivated.'
            : 'Users will regain access to their data.'
        }`}
        type={confirmAction.type === 'suspend' ? 'error' : 'success'}
        confirmText={confirmAction.type === 'suspend' ? 'Suspend' : 'Activate'}
      />
    </div>
  );
}