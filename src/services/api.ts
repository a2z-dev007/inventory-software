import axios from 'axios';
import { API_ROUTES } from './apiRoutes';
import { API_BASE_URL } from '../utils/constants';
import { queryClient } from '../App'; // Adjust the import path if needed
import { toast } from 'react-toastify';


const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const request = async <T>(endpoint: string, options?: any): Promise<T> => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {})
  };
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await axios({
      url,
      method: options?.method || 'GET',
      data: options?.body ? JSON.parse(options.body) : undefined,
      headers,
    });
    console.log(`API Request: ${url}`, {
      method: options?.method || 'GET',
      body: options?.body,
      headers,
      response: response.data,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      return error.response.data;
    }
    if (error.response) {
      throw new Error(`API Error: ${error.response.status}`);
    }
    throw error;
  }
};

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
  getProducts: async () => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCTS);
      return res.data.products;
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
  getPurchaseOrders: async () => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDERS);
      return res.data.purchaseOrders;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  createPurchaseOrder: async (po: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDERS, {
        method: 'POST',
        body: JSON.stringify(po),
      });
      toast.success(res.message || 'Purchase order created successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create purchase order');
      throw error;
    }
  },

  updatePurchaseOrder: async (id: string, po: Partial<any>) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDER(id), {
        method: 'PUT',
        body: JSON.stringify(po),
      });
      toast.success(res.message || 'Purchase order updated successfully');
      return res;
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
  getSales: async () => {
    try {
      const res = await request<any>(API_ROUTES.SALES);
      return res.data.sales;
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
  getPurchases: async () => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASES);
      return res.data.purchases;
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
  getSuppliers: async () => {
    try {
      const res = await request<any>(API_ROUTES.VENDORS);
      return res.data.vendors;
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
  getcustomers: async (params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        sortBy: params.sortBy || 'name',
        sortOrder: params.sortOrder || 'asc',
      }).toString();
      const res = await request<any>(`${API_ROUTES.CUSTOMERS}?${query}`);
      return res.data.customers;
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
    const products = Array.isArray(queryClient.getQueryData(['products'])) ? queryClient.getQueryData(['products']) : await apiService.getProducts();
    const sales = Array.isArray(queryClient.getQueryData(['sales'])) ? queryClient.getQueryData(['sales']) : await apiService.getSales();
    const purchases = Array.isArray(queryClient.getQueryData(['purchases'])) ? queryClient.getQueryData(['purchases']) : await apiService.getPurchases();
    const customers = Array.isArray(queryClient.getQueryData(['customers'])) ? queryClient.getQueryData(['customers']) : await apiService.getcustomers();
    const suppliers = Array.isArray(queryClient.getQueryData(['suppliers'])) ? queryClient.getQueryData(['suppliers']) : await apiService.getSuppliers();
    const purchaseOrders = Array.isArray(queryClient.getQueryData(['purchase-orders'])) ? queryClient.getQueryData(['purchase-orders']) : await apiService.getPurchaseOrders();

    const today = new Date().toISOString().split('T')[0];
    
    const todaySales = Array.isArray(sales) ? sales.filter((sale: any) => sale.saleDate?.startsWith(today)).reduce((sum: number, sale: any) => sum + (sale.total || 0), 0) : 0;
    const todayPurchases = Array.isArray(purchases) ? purchases.filter((purchase: any) => purchase.purchaseDate?.startsWith(today)).reduce((sum: number, purchase: any) => sum + (purchase.total || 0), 0) : 0;
    const lowStockItems = Array.isArray(products) ? products.filter((product: any) => product.currentStock < 10).length : 0;
    const pendingOrders = Array.isArray(purchaseOrders) ? purchaseOrders.filter((po: any) => po.status === 'approved').length : 0;
    const overdueInvoices = Array.isArray(sales) ? sales.filter((sale: any) => sale.status === 'overdue').length : 0;

    return {
      todaySales,
      todayPurchases,
      lowStockItems,
      totalProducts: Array.isArray(products) ? products.length : 0,
      totalCustomers: Array.isArray(customers) ? customers.length : 0,
      totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
      pendingOrders,
      overdueInvoices,
    };
  }
};
