import { API_BASE_URL } from "../utils/constants";


export const API_ROUTES = {
  UNIT_TYPES: '/unit-types',
  UNIT_TYPE: (id: string) => `/unit-types/${id}`,
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  CHANGE_PASSWORD: '/auth/change-password',
  CHANGE_PASSWORD_UNAUTH: '/users/change-password',

  USERS: '/users',
  USER: (id: string) => `/users/${id}`,
  USER_TOGGLE_STATUS: (id: string) => `/users/${id}/toggle-status`,
  USER_STATS: '/users/stats',
  CATEGORIES: '/categories?limit=100',
  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${id}`,
  PRODUCT_STOCK: (id: string) => `/products/${id}/stock`,
  PRODUCT_CATEGORIES: '/products/categories',
  PURPOSES: '/purposes',
  PURPOSE: (id: string) => `/purposes/${id}`,
  VENDORS: '/vendors',
  VENDOR: (id: string) => `/vendors/${id}`,

  CUSTOMERS: '/customers',
  CUSTOMER: (id: string) => `/customers/${id}`,

  PURCHASE_ORDERS: '/purchase-orders',

  DELETED_PURCHASE_ORDERS: '/purchase-orders/recycle-bin',
  DELETED_SALES: '/sales/recycle-bin',
  DELETED_PURCHASES: '/purchases/recycle-bin',
  PURCHASE_ORDER: (id: string) => `/purchase-orders/${id}`,
  PURCHASE_ORDER_FINAL_DELETE: (id: string) => `/purchase-orders/final-delete/${id}`,
  RESTORE_PURCHASE_ORDER: (id: string) => `/purchase-orders/${id}/restore`,
  RESTORE_PURCHASES: (id: string) => `/purchases/${id}/restore`,
  RESTORE_SALES: (id: string) => `/sales/${id}/restore`,

  SALES: '/sales',
  REPORTS_EXCEL: (id: string) => `/reports/${id}`,
  SALE: (id: string) => `/sales/${id}`,

  PURCHASES: '/purchases',
  PURCHASE: (id: string) => `/purchases/${id}`,
  PURCHASE_FINAL_DELETE: (id: string) => `/purchases/final-delete/${id}`,

  // Purchase Returns
  PURCHASE_RETURNS: '/purchase-returns',
  DELETED_PURCHASE_RETURNS: '/purchase-returns/recycle-bin',
  PURCHASE_RETURN: (id: string) => `/purchase-returns/${id}`,
  PURCHASE_RETURN_FINAL_DELETE: (id: string) => `/purchase-returns/final-delete/${id}`,
  RESTORE_PURCHASE_RETURN: (id: string) => `/purchase-returns/${id}/restore`,


  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_SALES: '/reports/sales',
  REPORTS_PURCHASES: '/reports/purchases',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_PROFIT_LOSS: '/reports/profit-loss',
  REPORTS_TOP_PRODUCTS: '/reports/top-products',
  REPORTS_VENDOR_PERFORMANCE: '/reports/vendor-performance',
};