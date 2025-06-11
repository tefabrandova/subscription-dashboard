import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/phpStore';
import { useDialog } from '../../hooks/useDialog';
import AlertDialog from '../dialogs/AlertDialog';
import type { Account, AccountType, Credential } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

const getEmptyCredential = (type: AccountType): Credential => {
  return type === 'subscription' 
    ? { username: '', password: '', note: '' }
    : { type: '', info: '', note: '' };
};

const defaultValues = {
  type: 'subscription' as AccountType,
  name: '',
  details: [getEmptyCredential('subscription')],
  subscriptionDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  price: 0,
  linkedPackages: 0,
};

export default function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details",
  });

  const { dialog, showDialog, hideDialog } = useDialog();

  const accountType = watch('type');

  const { addAccount, updateAccount, accounts } = useStore();

  useEffect(() => {
    if (isOpen) {
      if (account) {
        reset({
          ...account,
          details: account.details.length > 0 ? account.details : [getEmptyCredential(account.type)],
          price: typeof account.price === 'number' ? account.price : 0,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [account, reset, isOpen]);

  const onSubmit = async (data: any) => {
    // Validate required fields
    if (!data.name.trim()) {
      showDialog({
        type: 'error',
        title: 'Validation Error',
        message: 'Account name is required'
      });
      return;
    }

    // Check for duplicate account name
    const isDuplicate = accounts.some(a => 
      a.name.toLowerCase() === data.name.toLowerCase() && 
      (!account || a.id !== account.id)
    );

    if (isDuplicate) {
      showDialog({
        type: 'error',
        title: 'Duplicate Account',
        message: 'An account with this name already exists'
      });
      return;
    }

    const formattedData = {
      ...data,
      price: Number(data.price),
      linkedPackages: Number(data.linkedPackages),
    };

    try {
      if (account) {
        await updateAccount(account.id, formattedData);
        showDialog({
          type: 'success',
          title: 'Success',
          message: 'Account updated successfully'
        });
      } else {
        await addAccount(formattedData);
        showDialog({
          type: 'success',
          title: 'Success',
          message: 'Account created successfully'
        });
      }
      onClose();
    } catch (error) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: error.message || 'An error occurred while saving the account'
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-5xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {account ? 'Edit Account' : 'Add Account'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Account Type
                    </label>
                    <select
                      {...register('type')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="subscription">Subscription</option>
                      <option value="purchase">Purchase</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter account name"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Account Credentials
                      </label>
                      <button
                        type="button"
                        onClick={() => append(getEmptyCredential(accountType))}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Credential
                      </button>
                    </div>
                    {fields.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border-2 border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {accountType === 'subscription' ? (
                                <>
                                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Username</th>
                                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Password</th>
                                </>
                              ) : (
                                <>
                                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Type</th>
                                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Info</th>
                                </>
                              )}
                              <th scope="col" className="w-1/2 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                              <th scope="col" className="relative w-12 px-4 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {fields.map((field, index) => (
                              <tr key={field.id}>
                                {accountType === 'subscription' ? (
                                  <>
                                    <td className="px-4 py-3 border-r border-gray-200">
                                      <input
                                        type="text"
                                        {...register(`details.${index}.username`)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200">
                                      <input
                                        type="text"
                                        {...register(`details.${index}.password`)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 border-r border-gray-200">
                                      <input
                                        type="text"
                                        {...register(`details.${index}.type`)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200">
                                      <input
                                        type="text"
                                        {...register(`details.${index}.info`)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                    </td>
                                  </>
                                )}
                                <td className="px-4 py-3">
                                  <textarea
                                    {...register(`details.${index}.note`)}
                                    rows={1}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {fields.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No credentials added yet
                      </div>
                    )}
                  </div>

                  {accountType === 'subscription' ? (
                    <>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Subscription Date
                        </label>
                        <input
                          type="date"
                          {...register('subscriptionDate')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          {...register('expiryDate')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        {...register('subscriptionDate')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('price')}
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
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
                    {account ? 'Update Account' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
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