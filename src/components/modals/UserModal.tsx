import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import AlertDialog from '../dialogs/AlertDialog';
import { useDialog } from '../../hooks/useDialog';
import type { User, UserRole } from '../../types/user';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
}

export default function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'user',
    }
  });

  const { dialog, showDialog, hideDialog } = useDialog();
  const { users, addUser, updateUser } = useUserStore();

  const watchPassword = watch('password');
  const watchConfirmPassword = watch('confirmPassword');

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'user',
      });
      setIsChangingPassword(false);
    }
  }, [isOpen, user, reset]);

  const onSubmit = (data: UserFormData) => {
    // Check for duplicate email
    const existingUser = users.find(u => 
      u.email === data.email && (!user || u.id !== user.id)
    );

    if (existingUser) {
      showDialog({
        type: 'error',
        title: 'Duplicate Email',
        message: 'A user with this email already exists'
      });
      return;
    }

    // Validate passwords if changing
    if (isChangingPassword || !user) {
      if (!data.password) {
        showDialog({
          type: 'error',
          title: 'Password Required',
          message: 'Please enter a password'
        });
        return;
      }

      if (data.password !== data.confirmPassword) {
        showDialog({
          type: 'error',
          title: 'Password Mismatch',
          message: 'Passwords do not match'
        });
        return;
      }

      if (data.password.length < 8) {
        showDialog({
          type: 'error',
          title: 'Invalid Password',
          message: 'Password must be at least 8 characters long'
        });
        return;
      }
    }

    if (user) {
      updateUser(user.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        ...(isChangingPassword && { password: data.password })
      });
      showDialog({
        type: 'success',
        title: 'Success',
        message: 'User updated successfully'
      });
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role,
        createdAt: new Date().toISOString(),
      };
      addUser(newUser);
      showDialog({
        type: 'success',
        title: 'Success',
        message: 'User created successfully'
      });
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {user ? 'Edit User' : 'Add User'}
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {(user ? isChangingPassword : true) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register('password')}
                          className="block w-full pr-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...register('confirmPassword')}
                          className="block w-full pr-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    {...register('role')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {user && !isChangingPassword && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {user ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <AlertDialog
        isOpen={dialog.isOpen}
        onClose={hideDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </>
  );
}