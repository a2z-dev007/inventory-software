import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

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
    if (error.response) {
      throw new Error(`API Error: ${error.response.status}`);
    }
    throw error;
  }
};

export const apiService = {
  // Authentication
  login: async (username: string, password: string) => {
    const users = await request<any[]>('/users');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = btoa(`${username}:${password}:${Date.now()}`);
    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, token };
  },

  // Products
  getProducts: async () => {
    try {
      return await request<any[]>('/products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  createProduct: async (product: Omit<any, 'id'>) => {
    return request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  updateProduct: async (id: number, product: Partial<any>) => {
    return request<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    });
  },

  deleteProduct: async (id: number) => {
    return request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Purchase Orders
  getPurchaseOrders: async () => {
    return request<any[]>('/purchaseOrders');
  },

  createPurchaseOrder: async (po: Omit<any, 'id'>) => {
    return request<any>('/purchaseOrders', {
      method: 'POST',
      body: JSON.stringify(po),
    });
  },

  updatePurchaseOrder: async (id: number, po: Partial<any>) => {
    return request<any>(`/purchaseOrders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(po),
    });
  },

  deletePurchaseOrder: async (id: number) => {
    return request<void>(`/purchaseOrders/${id}`, {
      method: 'DELETE',
    });
  },

  // Sales
  getSales: async () => {
    return request<any[]>('/sales');
  },

  createSale: async (sale: Omit<any, 'id'>) => {
    return request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },

  updateSale: async (id: number, sale: Partial<any>) => {
    return request<any>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(sale),
    });
  },

  // Purchases
  getPurchases: async () => {
    return request<any[]>('/purchases');
  },

  createPurchase: async (purchase: Omit<any, 'id'>) => {
    return request<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  },

  // Suppliers
  getSuppliers: async () => {
    return request<any[]>('/suppliers');
  },

  createSupplier: async (supplier: Omit<any, 'id'>) => {
    return request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },

  // Customers
  getCustomers: async () => {
    return request<any[]>('/customers');
  },

  createCustomer: async (customer: Omit<any, 'id'>) => {
    return request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  // Dashboard metrics
  getDashboardMetrics: async () => {
    const [products, sales, purchases, customers, suppliers, purchaseOrders] = await Promise.all([
      apiService.getProducts(),
      apiService.getSales(),
      apiService.getPurchases(),
      apiService.getCustomers(),
      apiService.getSuppliers(),
      apiService.getPurchaseOrders(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    
    const todaySales = sales
      .filter(sale => sale.saleDate.startsWith(today))
      .reduce((sum, sale) => sum + sale.total, 0);
    
    const todayPurchases = purchases
      .filter(purchase => purchase.purchaseDate.startsWith(today))
      .reduce((sum, purchase) => sum + purchase.total, 0);
    
    const lowStockItems = products.filter(product => product.currentStock < 10).length;
    const pendingOrders = purchaseOrders.filter(po => po.status === 'approved').length;
    const overdueInvoices = sales.filter(sale => sale.status === 'overdue').length;

    return {
      todaySales,
      todayPurchases,
      lowStockItems,
      totalProducts: products.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      pendingOrders,
      overdueInvoices,
    };
  }
};
