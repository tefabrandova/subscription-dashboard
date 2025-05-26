export type AccountType = 'subscription' | 'purchase';

export interface SubscriptionCredential {
  username: string;
  password: string;
  note: string;
}

export interface PurchaseCredential {
  type: string;
  info: string;
  note: string;
}

export type Credential = SubscriptionCredential | PurchaseCredential;

export interface PriceDuration {
  duration: number;
  price: number;
}

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  details: Credential[];
  subscriptionDate: string;
  expiryDate: string;
  price: number | PriceDuration[];
  linkedPackages: number;
}

export interface Package {
  id: string;
  accountId: string;
  type: AccountType;
  name: string;
  details: Credential[];
  accountDetails: string;
  price: number | PriceDuration[];
  subscribedCustomers: number;
}

export interface Subscription {
  id: string;
  packageId: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: 'active' | 'expired' | 'sold';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  packageId: string;
  subscriptionDuration: number;
  subscriptionDate: string;
  expiryDate: string;
  subscriptionHistory: Subscription[];
}