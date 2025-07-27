import axios from 'axios';
import { API_ROUTES } from './apiRoutes';
import { API_BASE_URL } from '../utils/constants';
import { queryClient } from '../App'; // Adjust the import path if needed
import { toast } from 'react-toastify';
import { DashboardStats } from '../types';


const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const request = async <T>(endpoint: string, options: Record<string, any> = {}): Promise<T> => {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint}`;

  const axiosConfig: Record<string, any> = {
    url,
    method: options.method || 'GET',
    headers,
    data: isFormData ? options.body : options.body ? JSON.parse(options.body) : undefined,
    ...(options.params ? { params: options.params } : {}),
  };

  try {
    const response = await axios(axiosConfig);

    console.log(`API Request: ${url}`, {
      method: axiosConfig.method,
      params: axiosConfig.params,
      body: axiosConfig.data,
      headers,
      response: response.data,
    });

    return response.data as T;
  } catch (error: any) {
    if (error.response?.data?.message) {
      return error.response.data;
    }

    if (error.response) {
      throw new Error(`API Error: ${error.response.status}`);
    }

    throw error;
  }
}


export const apiService = {
  // Authentication
  login: async (username: string, password: string, rememberMe: boolean) => {
    try {
      const res = await request<{ 
        success: boolean; 
        message: string;
        data?: { 
          user: any; 
          token: string;
          expiresIn: string;
        }; 
        error?: { type: string; value: string; msg: string; path: string; location: string } 
      }>(API_ROUTES.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password, rememberMe }),
      });
      return res;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Products
  getProducts: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
      }).toString();
      const res = await request<any>(`${API_ROUTES.PRODUCTS}?${query}`);
      return res.data; // { products, pagination }
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  createProduct: async (product: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(product),
      });
      toast.success(res.message || 'Product created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create product');
      throw error;
    }
  },

  updateProduct: async (id: string, product: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCT(id), {
        method: 'PUT',
        body: JSON.stringify(product),
      });
      toast.success(res.message || 'Product updated successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update product');
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCT(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Product deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete product');
      throw error;
    }
  },

  // Purchase Orders
  getPurchaseOrders: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
      }).toString();
      const res = await request<any>(`${API_ROUTES.PURCHASE_ORDERS}?${query}`);
      return res.data; // { purchaseOrders, pagination }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

createPurchaseOrder: async (po: Omit<any, 'id'> | FormData) => {
  try {
    const isFormData = po instanceof FormData;

    const res = await request<any>(API_ROUTES.PURCHASE_ORDERS, {
      method: 'POST',
      body: isFormData ? po : JSON.stringify(po),
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    });

    if (res.success === false) {
      throw new Error(res.message || 'Failed to create purchase order');
    }

    if (res.success) {
      toast.success(res.message || 'Purchase order created successfully');
      return res;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error.message || 'Failed to create purchase order');
    throw error;
  }
},

updatePurchaseOrder: async (id: string, po: Partial<any> | FormData) => {
  try {
    const isFormData = po instanceof FormData;

    const res = await request<any>(API_ROUTES.PURCHASE_ORDER(id), {
      method: 'PUT',
      body: isFormData ? po : JSON.stringify(po),
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    });

    if (res.success === false) {
      throw new Error(res.message || 'Failed to update purchase order');
    }

    if (res.success) {
      toast.success(res.message || 'Purchase order updated successfully');
      return res;
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error.message || 'Failed to update purchase order');
    throw error;
  }
},

  deletePurchaseOrder: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDER(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Purchase order deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase order');
      throw error;
    }
  },

  // Sales
  getSales: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
      }).toString();
      const res = await request<any>(`${API_ROUTES.SALES}?${query}`);
      return res.data; // { sales, pagination }
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  createSale: async (sale: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.SALES, {
        method: 'POST',
        body: JSON.stringify(sale),
      });
      toast.success(res.message || 'Sale created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create sale');
      throw error;
    }
  },

  updateSale: async (id: string, sale: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.SALE(id), {
        method: 'PUT',
        body: JSON.stringify(sale),
      });
      toast.success(res.message || 'Sale updated successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update sale');
      throw error;
    }
  },

  deleteSale: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.SALE(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Sale deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete sale');
      throw error;
    }
  },

  // Purchases
  getPurchases: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASES, {
        method: 'GET',
        params,
      });
      return res.data; // Should include { purchases, pagination }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  createPurchase: async (purchase: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASES, {
        method: 'POST',
        body: JSON.stringify(purchase),
      });
      toast.success(res.message || 'Purchase created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create purchase');
      throw error;
    }
  },

  updatePurchase: async (id: string, purchase: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE(id), {
        method: 'PUT',
        body: JSON.stringify(purchase),
      });
      toast.success(res.message || 'Purchase updated successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update purchase');
      throw error;
    }
  },

  deletePurchase: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Purchase deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase');
      throw error;
    }
  },

  // Vendors
  // getSuppliers: async () => {
  //   try {
  //     const res = await request<any>(API_ROUTES.VENDORS);
  //     return res.data.vendors;
  //   } catch (error) {
  //     console.error('Error fetching vendors:', error);
  //     throw error;
  //   }
  // },

  getSuppliers: async ({ page = 1, limit = 10, search = '' }) => {
  try {
    const res = await request<any>(API_ROUTES.VENDORS, {
      method: 'GET',
      params: {
        page,
        limit,
        search,
      },
    });

    // Your backend sends response as: { success, data: { vendors, pagination } }
    return res.data; // ✅ Return vendors + pagination
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
},


  createSupplier: async (supplier: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.VENDORS, {
        method: 'POST',
        body: JSON.stringify(supplier),
      });
      toast.success(res.message || 'Vendor created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create vendor');
      throw error;
    }
  },

  updateSupplier: async (id: string, supplier: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.VENDOR(id), {
        method: 'PUT',
        body: JSON.stringify(supplier),
      });
      toast.success(res.message || 'Vendor updated successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update vendor');
      throw error;
    }
  },

  deleteSupplier: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.VENDOR(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Vendor deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete vendor');
      throw error;
    }
  },

  // Customers
  getCustomers: async (params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        sortBy: params.sortBy || 'name',
        sortOrder: params.sortOrder || 'asc',
      }).toString();
      const res = await request<any>(`${API_ROUTES.CUSTOMERS}?${query}`);
      // Return only the data property
      return res.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  createClient: async (client: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.CUSTOMERS, {
        method: 'POST',
        body: JSON.stringify(client),
      });
      toast.success(res.message || 'Customer created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create customer');
      throw error;
    }
  },

  updateClient: async (id: string, client: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.CUSTOMER(id), {
        method: 'PUT',
        body: JSON.stringify(client),
      });
      toast.success(res.message || 'Customer updated successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update customer');
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.CUSTOMER(id), {
        method: 'DELETE',
      });
      toast.success(res.message || 'Customer deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete customer');
      throw error;
    }
  },

  // Dashboard metrics
  getDashboardMetrics: async () => {
    try {
      const res = await request<DashboardStats>(API_ROUTES.REPORTS_DASHBOARD, {
        method: 'GET',
      });
      // The backend returns { success, data: { overview, recentSales, topProducts } }
      if (res.success && res.data) {
        const data  =
          {
            lowStockProducts:res.data.lowStockProducts,
            outOfStockProducts:res.data.outOfStockProducts
          }
        
        return {
          ...res.data.overview,
          recentSales: res.data.recentSales,
          topProducts: res.data.topProducts,
          data
        };
      } else {
        throw new Error('Failed to fetch dashboard metrics');
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Change Password
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const res = await request<any>(API_ROUTES.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      // toast.success(res.message || 'Password changed successfully');
      return res;
    } catch (error: any) {
      // toast.error(error?.response?.data?.message || error.message || 'Failed to change password');
      throw error;
    }
  },

  // Change Password (Unauthenticated)
  changePasswordUnauth: async (email: string, newPassword: string) => {
    try {
      const res = await request<any>(API_ROUTES.CHANGE_PASSWORD_UNAUTH, {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
      });
      // toast.success(res.message || 'Password changed successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to change password');
      throw error;
    }
  },
};
