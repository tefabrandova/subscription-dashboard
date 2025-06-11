import React, { useState } from 'react';
import { Users, Bell, Search, UserPlus, Edit, Trash2, Shield } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useStore } from '../store/phpStore';
import { checkExpiringAccounts, checkExpiringPackages } from '../utils/notifications';
import UserModal from '../components/modals/UserModal';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import AlertDialog from '../components/dialogs/AlertDialog';
import TableSearch from '../components/TableSearch';
import ExportButton from '../components/ExportButton';
import LogoUpload from '../components/LogoUpload';
import { format } from 'date-fns';

export default function Admin() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    userId: string;
  }>({ isOpen: false, userId: '' });
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  const { users, addUser, updateUser, deleteUser, currentUser } = useUserStore();
  const { accounts, customers, packages } = useStore();

  // Get notifications for both accounts and packages
  const expiringAccounts = checkExpiringAccounts(accounts);
  const expiringPackages = checkExpiringPackages(customers, packages);
  const allNotifications = [...expiringAccounts, ...expiringPackages];

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    
    // Check if trying to delete the last admin
    const remainingAdmins = users.filter(u => u.role === 'admin' && u.id !== id).length;
    if (userToDelete?.role === 'admin' && remainingAdmins === 0) {
      setAlert({
        isOpen: true,
        title: 'Cannot Delete Last Admin',
        message: 'You cannot delete the last admin user. At least one admin must remain in the system.',
        type: 'error'
      });
      return;
    }

    // Check if trying to delete themselves
    if (userToDelete?.id === currentUser?.id) {
      setAlert({
        isOpen: true,
        title: 'Cannot Delete Own Account',
        message: 'You cannot delete your own account while logged in.',
        type: 'error'
      });
      return;
    }

    setConfirmDelete({
      isOpen: true,
      userId: id
    });
  };

  const confirmDeleteUser = () => {
    deleteUser(confirmDelete.userId);
    setConfirmDelete({ isOpen: false, userId: '' });
    setAlert({
      isOpen: true,
      title: 'User Deleted',
      message: 'The user has been successfully deleted.',
      type: 'success'
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Control Panel</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage users and system settings
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <ExportButton data={users} type="users" />
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {allNotifications.length > 0 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Expiring Items Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {expiringAccounts.length > 0 && (
                    <span className="block">
                      {expiringAccounts.length} account(s) expiring soon
                    </span>
                  )}
                  {expiringPackages.length > 0 && (
                    <span className="block">
                      {expiringPackages.length} package(s) expiring soon
                    </span>
                  )}
                  Email notifications have been sent to remind customers about renewal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <LogoUpload />
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <TableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search users by name, email, or role..."
              />
            </div>
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.role === 'admin' && (
                                <Shield className="h-4 w-4 text-purple-500 mr-1.5" />
                              )}
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
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
        </div>
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, userId: '' })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        type="error"
        confirmText="Delete"
      />

      <AlertDialog
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}