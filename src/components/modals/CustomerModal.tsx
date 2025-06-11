import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { AlertCircle } from 'lucide-react';
import { useStore } from '../../store';
import SearchableSelect from '../SearchableSelect';
import CountryCodeSelect from '../CountryCodeSelect';
import AlertDialog from '../dialogs/AlertDialog';
import { useDialog } from '../../hooks/useDialog';
import { calculateExpiryDate } from '../../utils/subscription';
import { validatePhoneNumber, formatPhoneNumber } from '../../utils/phone';
import { format } from 'date-fns';
import type { Customer, Package, Subscription } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  selectedSubscriptionId?: string;
  isNewPackage?: boolean;
  onValidate?: (phone: string, email: string, customerId?: string) => boolean;
}

const defaultValues = {
  name: '',
  countryCode: '+966',
  phone: '',
  email: '',
  packageId: '',
  subscriptionDuration: '',
  subscriptionDate: format(new Date(), 'yyyy-MM-dd'),
  expiryDate: '',
};

export default function CustomerModal({ 
  isOpen, 
  onClose, 
  customer, 
  selectedSubscriptionId,
  isNewPackage, 
  onValidate 
}: CustomerModalProps) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues
  });

  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);
  const { dialog, showDialog, hideDialog } = useDialog();
  const [durationOptions, setDurationOptions] = React.useState<Array<{
    id: string;
    value: string;
    duration: number;
    price: number;
  }>>([]);

  const addCustomer = useStore((state) => state.addCustomer);
  const updateCustomer = useStore((state) => state.updateCustomer);
  const packages = useStore((state) => state.packages);
  const updatePackage = useStore((state) => state.updatePackage);

  const watchPackageId = watch('packageId');
  const watchSubscriptionDate = watch('subscriptionDate');
  const watchSubscriptionDuration = watch('subscriptionDuration');
  const watchCountryCode = watch('countryCode');
  const watchPhone = watch('phone');

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        if (selectedSubscriptionId) {
          const subscription = customer.subscriptionHistory.find(s => s.id === selectedSubscriptionId);
          if (subscription) {
            const pkg = packages.find(p => p.id === subscription.packageId);
            const [countryCode, phoneNumber] = customer.phone.startsWith('+') 
              ? [customer.phone.slice(0, customer.phone.indexOf(' ')), customer.phone.slice(customer.phone.indexOf(' ') + 1)]
              : ['+966', customer.phone];

            reset({
              name: customer.name,
              countryCode,
              phone: phoneNumber,
              email: customer.email,
              packageId: subscription.packageId,
              subscriptionDuration: `${subscription.duration}`,
              subscriptionDate: format(new Date(subscription.startDate), 'yyyy-MM-dd'),
              expiryDate: format(new Date(subscription.endDate), 'yyyy-MM-dd'),
            });
            setSelectedPackage(pkg || null);
          }
        } else if (isNewPackage) {
          const [countryCode, phoneNumber] = customer.phone.startsWith('+') 
            ? [customer.phone.slice(0, customer.phone.indexOf(' ')), customer.phone.slice(customer.phone.indexOf(' ') + 1)]
            : ['+966', customer.phone];

          reset({
            name: customer.name,
            countryCode,
            phone: phoneNumber,
            email: customer.email,
            packageId: '',
            subscriptionDuration: '',
            subscriptionDate: format(new Date(), 'yyyy-MM-dd'),
            expiryDate: '',
          });
        } else {
          const [countryCode, phoneNumber] = customer.phone.startsWith('+') 
            ? [customer.phone.slice(0, customer.phone.indexOf(' ')), customer.phone.slice(customer.phone.indexOf(' ') + 1)]
            : ['+966', customer.phone];

          reset({
            name: customer.name,
            countryCode,
            phone: phoneNumber,
            email: customer.email,
          });
        }
      } else {
        reset(defaultValues);
      }
    }
  }, [customer, reset, isOpen, selectedSubscriptionId, isNewPackage, packages]);

  useEffect(() => {
    const pkg = packages.find(p => p.id === watchPackageId);
    setSelectedPackage(pkg || null);

    if (pkg && Array.isArray(pkg.price)) {
      const options = pkg.price.map((price) => ({
        id: `${price.duration}-${price.price}`,
        value: `${price.duration}`,
        duration: price.duration,
        price: price.price
      }));
      setDurationOptions(options);
      if (options.length > 0) {
        setValue('subscriptionDuration', options[0].value);
      }
    }
  }, [watchPackageId, packages, setValue]);

  useEffect(() => {
    if (watchSubscriptionDate && watchSubscriptionDuration && selectedPackage?.type === 'subscription') {
      const selectedOption = durationOptions.find(opt => opt.value === watchSubscriptionDuration);
      
      if (selectedOption) {
        const expiryDate = calculateExpiryDate(
          watchSubscriptionDate,
          selectedOption.duration
        );
        setValue('expiryDate', format(new Date(expiryDate), 'yyyy-MM-dd'));
      }
    } else if (selectedPackage?.type === 'purchase') {
      setValue('expiryDate', watchSubscriptionDate || '');
    }
  }, [watchSubscriptionDate, watchSubscriptionDuration, selectedPackage, durationOptions, setValue]);

  const onSubmit = (data: any) => {
    if (!data.phone.trim()) {
      showDialog({
        type: 'error',
        title: 'Validation Error',
        message: 'Phone number is required'
      });
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(data.phone, data.countryCode);
    if (!phoneValidation.isValid) {
      showDialog({
        type: 'error',
        title: 'Invalid Phone Number',
        message: phoneValidation.error || 'Please enter a valid phone number'
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(data.countryCode, data.phone);

    // Check for duplicate phone/email
    if (onValidate && !onValidate(formattedPhone, data.email, customer?.id)) {
      showDialog({
        type: 'error',
        title: 'Duplicate Entry',
        message: 'A customer with this phone number or email already exists'
      });
      return;
    }

    const selectedOption = durationOptions.find(opt => opt.value === data.subscriptionDuration);

    if (customer) {
      if (!isNewPackage && !selectedSubscriptionId) {
        updateCustomer(customer.id, {
          name: data.name,
          phone: formattedPhone,
          email: data.email,
        });
        showDialog({
          type: 'success',
          title: 'Success',
          message: 'Customer information updated successfully'
        });
      } else {
        const newSubscription: Subscription = {
          id: selectedSubscriptionId || crypto.randomUUID(),
          packageId: data.packageId,
          startDate: data.subscriptionDate,
          endDate: data.expiryDate,
          duration: selectedOption ? selectedOption.duration : 0,
          status: selectedPackage?.type === 'purchase' ? 'sold' : 'active',
        };

        let updatedHistory;
        if (selectedSubscriptionId) {
          updatedHistory = customer.subscriptionHistory.map(sub => 
            sub.id === selectedSubscriptionId ? newSubscription : sub
          );
        } else {
          updatedHistory = [...customer.subscriptionHistory, newSubscription];
          
          if (selectedPackage) {
            updatePackage(selectedPackage.id, {
              subscribedCustomers: selectedPackage.subscribedCustomers + 1
            });
          }
        }

        updateCustomer(customer.id, {
          name: data.name,
          phone: formattedPhone,
          email: data.email,
          subscriptionHistory: updatedHistory
        });
        showDialog({
          type: 'success',
          title: 'Success',
          message: selectedSubscriptionId ? 'Package updated successfully' : 'Package added successfully'
        });
      }
    } else {
      const newSubscription: Subscription = {
        id: crypto.randomUUID(),
        packageId: data.packageId,
        startDate: data.subscriptionDate,
        endDate: data.expiryDate,
        duration: selectedOption ? selectedOption.duration : 0,
        status: selectedPackage?.type === 'purchase' ? 'sold' : 'active',
      };

      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: data.name,
        phone: formattedPhone,
        email: data.email,
        packageId: data.packageId,
        subscriptionDuration: selectedOption ? selectedOption.duration : 0,
        subscriptionDate: data.subscriptionDate,
        expiryDate: data.expiryDate,
        subscriptionHistory: [newSubscription]
      };

      addCustomer(newCustomer);

      if (selectedPackage) {
        updatePackage(selectedPackage.id, {
          subscribedCustomers: selectedPackage.subscribedCustomers + 1
        });
      }

      showDialog({
        type: 'success',
        title: 'Success',
        message: 'Customer added successfully'
      });
    }

    onClose();
  };

  const packageOptions = packages.map(pkg => ({
    value: pkg.id,
    label: `${pkg.name} (${pkg.type})`,
  }));

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {customer ? 
                  !isNewPackage && !selectedSubscriptionId ? 'Edit Customer Information' :
                  selectedSubscriptionId ? 'Edit Package' : 'Add New Package' :
                  'Add Customer'
                }
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <AlertCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {(!customer || !isNewPackage && !selectedSubscriptionId) && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          {...register('name')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex">
                          <div className="w-52">
                            <CountryCodeSelect
                              value={watchCountryCode}
                              onChange={(value) => setValue('countryCode', value)}
                            />
                          </div>
                          <input
                            type="tel"
                            {...register('phone', { 
                              required: 'Phone number is required'
                            })}
                            className={`flex-1 rounded-r-md sm:text-sm ${
                              errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                            placeholder="Phone number without country code"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          {...register('email')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </>
                  )}

                  {(customer ? isNewPackage || selectedSubscriptionId : true) && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Package
                        </label>
                        <SearchableSelect
                          options={packageOptions}
                          value={watchPackageId}
                          onChange={(value) => setValue('packageId', value)}
                          placeholder="Select a package"
                        />
                      </div>

                      {selectedPackage && (
                        <>
                          {selectedPackage.type === 'subscription' && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Subscription Duration
                              </label>
                              <select
                                {...register('subscriptionDuration')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                {durationOptions.map((option) => (
                                  <option key={option.id} value={option.value}>
                                    {option.duration} months - ${option.price.toFixed(2)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={selectedPackage.type === 'subscription' ? '' : 'col-span-2'}>
                            <label className="block text-sm font-medium text-gray-700">
                              {selectedPackage.type === 'subscription' ? 'Start Date' : 'Purchase Date'}
                            </label>
                            <input
                              type="date"
                              {...register('subscriptionDate')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>

                          {selectedPackage.type === 'subscription' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Expiry Date
                              </label>
                              <input
                                type="date"
                                {...register('expiryDate')}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
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
                    {customer ? 
                      !isNewPackage && !selectedSubscriptionId ? 'Update Information' :
                      selectedSubscriptionId ? 'Update Package' : 'Add Package' :
                      'Add Customer'
                    }
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