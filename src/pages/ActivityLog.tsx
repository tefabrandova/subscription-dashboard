import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useActivityStore } from '../store/phpActivityStore';
import TableSearch from '../components/TableSearch';
import TableFilter from '../components/TableFilter';
import { useTableSort } from '../hooks/useTableSort';
import type { ActivityLog } from '../types/activity';

const searchKeys: (keyof ActivityLog)[] = ['userName', 'actionType', 'objectType', 'objectName', 'details'];

const actionTypeOptions = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'view', label: 'View' },
];

const objectTypeOptions = [
  { value: 'account', label: 'Account' },
  { value: 'package', label: 'Package' },
  { value: 'customer', label: 'Customer' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'user', label: 'User' },
];

export default function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const { logs, loading, fetchLogs } = useActivityStore();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const {
    items: filteredLogs,
    requestSort,
    clearSort,
    sortConfig,
    setFilter,
    clearFilters,
    filters
  } = useTableSort<ActivityLog>(logs, searchTerm, searchKeys);

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Action', 'Object Type', 'Object Name', 'Details'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.userName,
        log.userRole,
        log.actionType,
        log.objectType,
        log.objectName,
        `"${log.details.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
          <p className="mt-2 text-sm text-gray-700">
            View all system activities and user actions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </button>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <TableSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search activity logs..."
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
                      <TableFilter
                        column="Timestamp"
                        sortDirection={sortConfig.key === 'timestamp' ? sortConfig.direction : null}
                        onSort={() => requestSort('timestamp')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="User"
                        sortDirection={sortConfig.key === 'userName' ? sortConfig.direction : null}
                        onSort={() => requestSort('userName')}
                        onClear={clearSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Action"
                        sortDirection={sortConfig.key === 'actionType' ? sortConfig.direction : null}
                        onSort={() => requestSort('actionType')}
                        onClear={clearSort}
                        filterOptions={actionTypeOptions}
                        onFilter={(value) => setFilter('actionType', value)}
                        currentFilter={filters['actionType']}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TableFilter
                        column="Object Type"
                        sortDirection={sortConfig.key === 'objectType' ? sortConfig.direction : null}
                        onSort={() => requestSort('objectType')}
                        onClear={clearSort}
                        filterOptions={objectTypeOptions}
                        onFilter={(value) => setFilter('objectType', value)}
                        currentFilter={filters['objectType']}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Object
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.actionType === 'create'
                            ? 'bg-green-100 text-green-800'
                            : log.actionType === 'update'
                            ? 'bg-blue-100 text-blue-800'
                            : log.actionType === 'delete'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.objectType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.objectName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}