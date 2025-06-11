// API configuration for Node.js backend
const API_URL = window.location.origin + '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  // Accounts endpoints
  async getAccounts() {
    return this.request<any[]>('/accounts');
  }

  async createAccount(account: any) {
    return this.request<{ id: string }>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateAccount(id: string, account: any) {
    return this.request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  async deleteAccount(id: string) {
    return this.request(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Packages endpoints
  async getPackages() {
    return this.request<any[]>('/packages');
  }

  async createPackage(pkg: any) {
    return this.request<{ id: string }>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  async updatePackage(id: string, pkg: any) {
    return this.request(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pkg),
    });
  }

  async deletePackage(id: string) {
    return this.request(`/packages/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers endpoints
  async getCustomers() {
    return this.request<any[]>('/customers');
  }

  async createCustomer(customer: any) {
    return this.request<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, customer: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Activity logs
  async getActivityLogs() {
    return this.request<any[]>('/activity');
  }
}

export const api = new ApiClient(API_URL);
export default api;