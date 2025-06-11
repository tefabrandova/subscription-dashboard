import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/phpStore';
import { useDialog } from '../../hooks/useDialog';
import AlertDialog from '../dialogs/AlertDialog';
import SearchableSelect from '../SearchableSelect';
import type { Package, AccountType, Credential, PriceDuration } from '../../types';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: Package;
}

const getEmptyCredential = (type: AccountType): Credential => {
  return type === 'subscription' 
    ? { username: '', password: '', note: '' }
    : { type: '', info: '', note: '' };
};

const getEmptyPriceDuration = (): PriceDuration => ({
  duration: 1,
  price: 0,
});

const defaultValues = {
  accountId: '',
  type: 'subscription' as AccountType,
  name: '',
  details: [getEmptyCredential('subscription')],
  price: [getEmptyPriceDuration()],
  subscribedCustomers: 0,
};

export default function PackageModal({ isOpen, onClose, package: pkg }: PackageModalProps) {
  const { register, handleSubmit, reset, control, watch, setValue } = useForm({
    defaultValues
  });

  const { fields: credentialFields, append: appendCredential, remove: removeCredential } = useFieldArray({
    control,
    name: "details",
  });

  const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({
    control,
    name: "price",
  });

  const { dialog, showDialog, hideDialog } = useDialog();

  const addPackage = useStore((state) => state.addPackage);
  const updatePackage = useStore((state) => state.updatePackage);
  const accounts = useStore((state) => state.accounts);
  const packages = useStore((state) => state.packages);

  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find(account => account.id === selectedAccountId);

  useEffect(() => {
    if (isOpen) {
      if (pkg) {
        const initialPrice = Array.isArray(pkg.price) ? pkg.price : [{ duration: 1, price: Number(pkg.price) }];
        const initialDetails = pkg.details.length > 0 ? pkg.details : [getEmptyCredential(pkg.type)];
        reset({
          ...pkg,
          price: initialPrice,
          details: initialDetails,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [pkg, reset, isOpen]);

  const onSubmit = (data: any) => {
    // Validate required fields
    if (!data.accountId) {
      showDialog({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an account'
      });
      return;
    }

    if (!data.name.trim()) {
      showDialog({
        type: 'error',
        title: 'Validation Error',
        message: 'Package name is required'
      });
      return;
    }

    // Check for duplicate package name
    const isDuplicate = packages.some(p => 
      p.name.toLowerCase() === data.name.toLowerCase() && 
      (!pkg || p.id !== pkg.id)
    );

    if (isDuplicate) {
      showDialog({
        type: 'error',
        title: 'Duplicate Package',
        message: 'A package with this name already exists'
      });
      return;
    }

    const formattedData = {
      ...data,
      type: selectedAccount?.type || 'subscription',
      price: data.price.map((p: any) => ({
        duration: Number(p.duration),
        price: Number(p.price),
      })),
    };

    if (pkg) {
      updatePackage(pkg.id, formattedData);
      showDialog({
        type: 'success',
        title: 'Success',
        message: 'Package updated successfully'
      });
    } else {
      addPackage({ ...formattedData, id: crypto.randomUUID() } as Package);
      showDialog({
        type: 'success',
        title: 'Success',
        message: 'Package created successfully'
      });
    }
    onClose();
  };

  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: `${account.name} (${account.type})`,
  }));

  const handleAccountChange = (accountId: string) => {
    setValue('accountId', accountId);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-5xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {pkg ? 'Edit Package' : 'Add Package'}
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
                      Account <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={accountOptions}
                      value={watch('accountId')}
                      onChange={handleAccountChange}
                      placeholder="Select an account"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Package Type
                    </label>
                    <input
                      type="text"
                      value={selectedAccount?.type || ''}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Package Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter package name"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Package Credentials
                      </label>
                      <button
                        type="button"
                        onClick={() => appendCredential(getEmptyCredential(selectedAccount?.type || 'subscription'))}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Credential
                      </button>
                    </div>
                    {credentialFields.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border-2 border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {selectedAccount?.type === 'subscription' ? (
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
                              <th scope="col" className="relative w-12 px-4 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {credentialFields.map((field, index) => (
                              <tr key={field.id}>
                                {selectedAccount?.type === 'subscription' ? (
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
                                  {credentialFields.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeCredential(index)}
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

                  {selectedAccount?.type === 'subscription' && (
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Subscription Durations & Prices
                        </label>
                        <button
                          type="button"
                          onClick={() => appendPrice(getEmptyPriceDuration())}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Duration
                        </button>
                      </div>
                      <div className="space-y-4">
                        {priceFields.map((field, index) => (
                          <div key={field.id} className="flex items-center space-x-4">
                            <div className="w-32">
                              <input
                                type="number"
                                min="1"
                                {...register(`price.${index}.duration`)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Duration"
                              />
                            </div>
                            <div className="w-24">
                              <span className="text-base font-medium text-gray-700">months</span>
                            </div>
                            <div className="w-32">
                              <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`price.${index}.price`)}
                                  className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            {priceFields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePrice(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAccount?.type === 'purchase' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Purchase Price
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          {...register('price.0.price')}
                          className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
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
                    {pkg ? 'Update Package' : 'Create Package'}
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