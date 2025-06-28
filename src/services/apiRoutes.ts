import { API_BASE_URL } from "../utils/constants";


export const API_ROUTES = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  CHANGE_PASSWORD: '/auth/change-password',

  USERS: '/users',
  USER: (id: string) => `/users/${id}`,
  USER_TOGGLE_STATUS: (id: string) => `/users/${id}/toggle-status`,
  USER_STATS: '/users/stats',

  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${id}`,
  PRODUCT_STOCK: (id: string) => `/products/${id}/stock`,
  PRODUCT_CATEGORIES: '/products/categories',

  VENDORS: '/vendors',
  VENDOR: (id: string) => `/vendors/${id}`,

  CUSTOMERS: '/customers',
  CUSTOMER: (id: string) => `/customers/${id}`,

  PURCHASE_ORDERS: '/purchase-orders',
  PURCHASE_ORDER: (id: string) => `/purchase-orders/${id}`,

  SALES: '/sales',
  SALE: (id: string) => `/sales/${id}`,

  PURCHASES: '/purchases',
  PURCHASE: (id: string) => `/purchases/${id}`,

  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_SALES: '/reports/sales',
  REPORTS_PURCHASES: '/reports/purchases',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_PROFIT_LOSS: '/reports/profit-loss',
  REPORTS_TOP_PRODUCTS: '/reports/top-products',
  REPORTS_VENDOR_PERFORMANCE: '/reports/vendor-performance',
};