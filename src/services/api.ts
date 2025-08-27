import axios from 'axios';
import { API_ROUTES } from './apiRoutes';
import { API_BASE_URL } from '../utils/constants';
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

      if (res.success === false) {
        throw new Error(res.message);
      }
      if (res.success) {
        toast.success(res.message || 'Login successful');
      }
      return res;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Products
  getProducts: async (params: { page?: number; limit?: number; search?: string; all?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        all: params.all?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.PRODUCTS}?${query}`);
      return res.data; // { products, pagination }
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProductById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCT(id));
      return res.data?.product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  createProduct: async (product: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(product),
      });
      if (res.success === false) {
        throw new Error(res.message);
      }
      if (res.success) {
        toast.success(res.message || 'Product created successfully');
      }
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
  getPurchaseOrders: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    all?: boolean;
    isDeleted?: boolean;
    status?: string;
    vendor?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    DBNum?: string;
    poNumber?: string;
    customer?: string;
    siteType?: string;
    deliveryDate?: string;
    contractor?: string;
    orderedBy?: string;
    purpose?: string;
  } = { all: false }) => {
    try {
      // Build query params for all supported filters
      const queryObj: Record<string, string> = {
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params?.search || '',
        all: params.all?.toString() || 'false',
        isDeleted: params?.isDeleted?.toString() || 'false',
      };

      // Add extra filters if present
      if (params.status) queryObj.status = params.status;
      if (params.vendor) queryObj.vendor = params.vendor;
      if (params.startDate) queryObj.startDate = params.startDate;
      if (params.endDate) queryObj.endDate = params.endDate;
      if (params.sortBy) queryObj.sortBy = params.sortBy;
      if (params.sortOrder) queryObj.sortOrder = params.sortOrder;
      if (params.DBNum) queryObj.ref_num = params.DBNum;
      if (params.poNumber) queryObj.poNumber = params.poNumber;
      if (params.customer) queryObj.customer = params.customer;
      if (params.siteType) queryObj.siteType = params.siteType;
      if (params.deliveryDate) queryObj.deliveryDate = params.deliveryDate;
      if (params.contractor) queryObj.contractor = params.contractor;
      if (params.orderedBy) queryObj.orderedBy = params.orderedBy;
      if (params.purpose) queryObj.purpose = params.purpose;

      const query = new URLSearchParams(queryObj).toString();
      const res = await request<any>(`${API_ROUTES.PURCHASE_ORDERS}?${query}`);
      return res.data; // { purchaseOrders, pagination }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  getDeletedPurchaseOrders: async (params: { page?: number; limit?: number; search?: string; all?: boolean, isDeleted?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params?.search || '',
        all: params.all?.toString() || 'false',
        isDeleted: params?.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.DELETED_PURCHASE_ORDERS}?${query}`);
      return res.data; // { purchaseOrders, pagination }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  getPurchaseOrderById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDER(id));
      return res.data?.purchaseOrder;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
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

  restorePO: async (id: string) => {
    try {

      const res = await request<any>(API_ROUTES.RESTORE_PURCHASE_ORDER(id), {
        method: 'PUT',
      });

      if (res.success === false) {
        throw new Error(res.message || 'Failed to restore purchase order');
      }

      if (res.success) {
        toast.success(res.message || 'Purchase order restore successfully');
        return res;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update purchase order');
      throw error;
    }
  },
  restoreSales: async (id: string) => {
    try {

      const res = await request<any>(API_ROUTES.RESTORE_SALES(id), {
        method: 'PUT',
      });

      if (res.success === false) {
        throw new Error(res.message || 'Failed restore Sales');
      }

      if (res.success) {
        toast.success(res.message || 'Sales restore successfully');
        return res;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to restore sales');
      throw error;
    }
  },
  restorePurchase: async (id: string) => {
    try {

      const res = await request<any>(API_ROUTES.RESTORE_PURCHASES(id), {
        method: 'PUT',
      });

      if (res.success === false) {
        throw new Error(res.message || 'Failed to restore purchases');
      }

      if (res.success) {
        toast.success(res.message || 'Purchases  restore successfully');
        return res;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to restore purchases');
      throw error;
    }
  },
  restorePurchaseReturn: async (id: string) => {
    try {

      const res = await request<any>(API_ROUTES.RESTORE_PURCHASE_RETURN(id), {
        method: 'PUT',
      });

      if (res.success === false) {
        throw new Error(res.message || 'Failed to restore purchase return');
      }

      if (res.success) {
        toast.success(res.message || 'Purchase Return  restore successfully');
        return res;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to restore purchase return');
      throw error;
    }
  },
  deletePurchaseOrder: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDER(id), {
        method: 'DELETE',
      });
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purchase order');
        return
      }
      if (res.success) {
        toast.success(res.message || 'Purchase order deleted successfully');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase order');
      throw error;
    }
  },

  // Final Delete
  finalDeletePurchaseOrder: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_ORDER_FINAL_DELETE(id), {
        method: 'DELETE',
      });
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purchase order');
        return
      }
      if (res.success) {
        toast.success(res.message || 'Purchase order deleted successfully');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase order');
      throw error;
    }
  },

  // Sales
  getSales: async (params: { page?: number; limit?: number; search?: string; all?: boolean, isDeleted?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        all: params.all?.toString() || 'false',
        isDeleted: params.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.SALES}?${query}`);
      return res.data; // { sales, pagination }
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  getDeletedSales: async (params: { page?: number; limit?: number; search?: string; all?: boolean, isDeleted?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        all: params.all?.toString() || 'false',
        isDeleted: params.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.DELETED_SALES}?${query}`);
      return res.data; // { sales, pagination }
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  getSaleById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.SALE(id));
      return res.data?.sale;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  },

  createSale: async (sale: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.SALES, {
        method: 'POST',
        body: JSON.stringify(sale),
      });
      if (res.success) {
        toast.success(res.message || 'Sale created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create sale');
      }
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
      if (res.success) {
        toast.success(res.message || 'Sale updated successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update sale');
        return
      }
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
      if (res.success) {
        toast.success(res.message || 'Sale deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete sale');
        return
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete sale');
      throw error;
    }
  },

  // Purchases
  getPurchases: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    all?: boolean;
    isDeleted?: boolean;
    vendor?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    ref_num?: string;
  } = {}) => {
    try {
      // Build query params for all supported filters
      const queryObj: Record<string, string> = {
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        all: params.all?.toString() || 'false',
        isDeleted: params?.isDeleted?.toString() || 'false',
      };

      // Add extra filters if present
      if (params.vendor) queryObj.vendor = params.vendor;
      if (params.startDate) queryObj.startDate = params.startDate;
      if (params.endDate) queryObj.endDate = params.endDate;
      if (params.sortBy) queryObj.sortBy = params.sortBy;
      if (params.sortOrder) queryObj.sortOrder = params.sortOrder;
      if (params.ref_num) queryObj.ref_num = params.ref_num;

      const query = new URLSearchParams(queryObj).toString();
      const res = await request<any>(`${API_ROUTES.PURCHASES}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },
  getDeletedPurchases: async (params: { page?: number; limit?: number; search?: string, all?: boolean, isDeleted?: boolean } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        isDeleted: params?.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.DELETED_PURCHASES}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  getPurchaseById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE(id));
      return res.data?.purchase;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      throw error;
    }
  },

  createPurchase: async (purchase: Omit<any, 'id'> | FormData) => {
    try {
      const isFormData = purchase instanceof FormData;
      const res = await request<any>(API_ROUTES.PURCHASES, {
        method: 'POST',
        body: isFormData ? purchase : JSON.stringify(purchase),
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purchase created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create purchase');
      }

      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create purchase');
      throw error;
    }
  },

  updatePurchase: async (id: string, purchase: Partial<any>) => {
    try {
      const isFormData = purchase instanceof FormData;

      const res = await request<any>(API_ROUTES.PURCHASE(id), {
        method: 'PUT',
        body: isFormData ? purchase : JSON.stringify(purchase),
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purchase updated successfully');
        return res;
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update purchase');
        return

      }

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
      if (res.success) {
        toast.success(res.message || 'Purchase deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purchase');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase');
      throw error;
    }
  },
  finalDeletePurchase: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_FINAL_DELETE(id), {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(res.message || 'Purchase deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purchase');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase');
      throw error;
    }
  },


  // Purchase Returns

  // Purchases
  getPurchaseReturns: async (params: { page?: number; limit?: number; search?: string, all?: boolean, isDeleted?: boolean } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        isDeleted: params?.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.PURCHASE_RETURNS}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },
  getDeletedPurchaseReturn: async (params: { page?: number; limit?: number; search?: string, all?: boolean, isDeleted?: boolean } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        isDeleted: params?.isDeleted?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.DELETED_PURCHASE_RETURNS}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  getPurchaseReturnById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_RETURN(id));
      return res.data?.purchaseReturn;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      throw error;
    }
  },

  createPurchaseReturn: async (purchase: Omit<any, 'id'> | FormData) => {
    try {
      const isFormData = purchase instanceof FormData;
      const res = await request<any>(API_ROUTES.PURCHASE_RETURNS, {
        method: 'POST',
        body: isFormData ? purchase : JSON.stringify(purchase),
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purchase created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create purchase');
      }

      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create purchase');
      throw error;
    }
  },

  updatePurchaseReturn: async (id: string, purchase: Partial<any>) => {
    try {
      const isFormData = purchase instanceof FormData;

      const res = await request<any>(API_ROUTES.PURCHASE_RETURN(id), {
        method: 'PUT',
        body: isFormData ? purchase : JSON.stringify(purchase),
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purchase updated successfully');
        return res;
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update purchase');
        return

      }

    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update purchase');
      throw error;
    }
  },

  deletePurchaseReturn: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_RETURN(id), {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(res.message || 'Purchase deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purchase');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase');
      throw error;
    }
  },
  finalDeletePurchaseReturn: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURCHASE_RETURN_FINAL_DELETE(id), {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(res.message || 'Purchase Return deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete  purchase return');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purchase return');
      throw error;
    }
  },


  // Vendors/Suppliers
  getSuppliers: async (params: { page?: number; limit?: number; search?: string; all?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        all: params.all?.toString() || 'false',
      }).toString();
      const res = await request<any>(`${API_ROUTES.VENDORS}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },


  getSupplierById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.VENDOR(id));
      return res.data?.vendor;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  },

  createSupplier: async (supplier: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.VENDORS, {
        method: 'POST',
        body: JSON.stringify(supplier),
      });
      if (res.success) {
        toast.success(res.message || 'Supplier created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create vendor');
        return
      }
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
      if (res.success) {
        toast.success(res.message || 'Supplier updated successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update vendor');
        return
      }
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
      toast.success(res.message || 'Supplier deleted successfully');
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete vendor');
      throw error;
    }
  },

  // Customers
  getCustomers: async (params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string, all?: boolean } = { all: false }) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
        sortBy: params.sortBy || 'name',
        sortOrder: params.sortOrder || 'asc',
        all: params.all?.toString() || 'false'
      }).toString();
      const res = await request<any>(`${API_ROUTES.CUSTOMERS}?${query}`);
      // Return only the data property
      return res.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },


  getCustomerById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.CUSTOMER(id));
      return res.data?.customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  createClient: async (client: Omit<any, 'id'>) => {
    try {
      const res = await request<any>(API_ROUTES.CUSTOMERS, {
        method: 'POST',
        body: JSON.stringify(client),
      });
      if (res.success) {
        toast.success(res.message || 'Customer created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create customer');
        return
      }
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
      if (res.success) {
        toast.success(res.message || 'Customer updated successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update customer');
        return
      }
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
      if (res.success) {
        toast.success(res.message || 'Customer deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete customer');
        return
      }
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
        const data =
        {
          lowStockProducts: res.data.lowStockProducts,
          outOfStockProducts: res.data.outOfStockProducts
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

      if (res.success === false) {
        throw new Error(res.message || 'Failed to change password');
        return
      }
      if (res.success) {
        toast.success(res.message || 'Password changed successfully');
      }
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
      if (res.success) {
        toast.success(res.message || 'Password changed successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to change password');
        return
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to change password');
      throw error;
    }
  },
  getAllCategories: async () => {
    try {
      const res = await request<any>(API_ROUTES.CATEGORIES, {
        method: 'GET',
      });
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to get categories');
      throw error;
    }
  },


  toggleSaleActiveStatus: async ({ id, isActive }: { id: string, isActive: boolean }) => {
    try {
      console.log("{ isActive }", { isActive })
      const res = await request<any>(API_ROUTES.SALE(id + "/active"), {
        method: 'PATCH',
        body: JSON.stringify({ isActive }), // ✅ works with request() function logic
      });
      if (res.success) {
        toast.success(res.message || 'Sale updated successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update sale');
        return
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update sale');
      throw error;
    }
  },
  getAllPurposes: async ({ page = 1, limit = 10, search = '', all = false }) => {
    try {
      const res = await request<any>(API_ROUTES.PURPOSES, {
        method: 'GET',
        params: {
          page,
          limit,
          search,
          all
        },
      });

      // Your backend sends response as: { success, data: { vendors, pagination } }
      return res.data; // ✅ Return vendors + pagination
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get all the data from universal report export api
  // exportToExcel: async ({name}:{name:string}) => {
  //   try {
  //     const res = await request<any>(API_ROUTES.REPORTS_EXCEL(name));

  //     if(res.success === false){
  //       throw new Error(res.message || 'Failed to change password');
  //       return
  //     }
  //     if(res.success){
  //       toast.success(res.message || 'Report Exported successfully');
  //     }
  //     // toast.success(res.message || 'Password changed successfully');
  //     return res;
  //   } catch (error: any) {
  //     // toast.error(error?.response?.data?.message || error.message || 'Failed to change password');
  //     throw error;
  //   }
  // },

  // purpose crud 
  // Purposes
  getPurposes: async (params: { page?: number; limit?: number; search?: string, all?: boolean } = {}) => {
    try {
      const query = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
        search: params.search || '',
      }).toString();
      const res = await request<any>(`${API_ROUTES.PURPOSES}?${query}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching purposes:', error);
      throw error;
    }
  },

  getPurposeById: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURPOSE(id));
      return res.data?.purpose;
    } catch (error) {
      console.error('Error fetching purpose:', error);
      throw error;
    }
  },

  createPurpose: async (purpose: { title: string }) => {
    try {
      const res = await request<any>(API_ROUTES.PURPOSES, {
        method: 'POST',
        body: JSON.stringify(purpose),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purpose created successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create purpose');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create purpose');
      throw error;
    }
  },

  updatePurpose: async (id: string, purpose: { name: string }) => {
    try {
      const res = await request<any>(API_ROUTES.PURPOSE(id), {
        method: 'PUT',
        body: JSON.stringify(purpose),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.success) {
        toast.success(res.message || 'Purpose updated successfully');
        return res;
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to update purpose');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to update purpose');
      throw error;
    }
  },

  deletePurpose: async (id: string) => {
    try {
      const res = await request<any>(API_ROUTES.PURPOSE(id), {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success(res.message || 'Purpose deleted successfully');
      }
      if (res.success === false) {
        throw new Error(res.message || 'Failed to delete purpose');
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete purpose');
      throw error;
    }
  },


  exportToExcel: async ({ moduleName, startDate, endDate, }: { moduleName: string, startDate: string, endDate: string }) => {
    try {
      const res = await request<any>(API_ROUTES.REPORTS_EXCEL(moduleName), {
        method: 'GET',
        params: {
          startDate,
          endDate,
        },
      });

      // Backend returns: { success: true, data: [...] }
      return res; // ✅ Return data array for export
    } catch (error) {
      console.error(`Error exporting ${moduleName} data:`, error);
      throw error;
    }
  },

  // Unit Types
  getUnitTypes: async () => {
    try {
      const res = await request<any>(API_ROUTES.UNIT_TYPES + "?all=true");
      // If response is { success, data: { unitTypes: [...] } }
      if (res.success && res.data && Array.isArray(res.data.unitTypes)) {
        return res.data.unitTypes;
      }
      // If response is { success, data: [...] }
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      // Fallback: return empty array
      return [];
    } catch (error) {
      console.error('Error fetching unit types:', error);
      return [];
    }
  },

  createUnitType: async (unitType: { value: string; label: string }) => {
    try {
      const res = await request<any>(API_ROUTES.UNIT_TYPES, {
        method: 'POST',
        body: JSON.stringify({ title: unitType.value }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.success === false) {
        throw new Error(res.message || 'Failed to create unit type');
      }
      if (res.success) {
        return res;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create unit type');
      throw error;
    }
  },
};
