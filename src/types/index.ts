export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  name: string;
  email: string;
  lastLogin?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  purchaseRate: number;
  salesRate: number;
  currentStock: number;
  category: string;
  supplier: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendor: string;
  status: 'draft' | 'approved' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  saleDate: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Purchase {
  id: number;
  receiptNumber: string;
  supplier: string;
  purchaseDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  invoiceFile?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface DashboardMetrics {
  todaySales: number;
  todayPurchases: number;
  lowStockItems: number;
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  pendingOrders: number;
  overdueInvoices: number;
}