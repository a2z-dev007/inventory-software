export interface User {
  _id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  name: string;
  email: string;
  lastLogin?: string;
}

export interface Product {
  _id: string;
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
  total: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Purchase {
  _id: number;
  receiptNumber: string;
  supplier: string;
  purchaseDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  invoiceFile?: string;
}

export interface Supplier {
  _id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Customer {
  _id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  salesCount: number;
  totalRevenue: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalPurchases: number;
  totalSpent: number;
  totalCustomers: number;
  totalVendors: number;
  recentSales: Sale[];
  topProducts: TopProduct[];
}


export interface Welcome {
    overview:           Overview;
    lowStockProducts:   LowStockProduct[];
    outOfStockProducts: any[];
    recentSales:        any[];
    topProducts:        any[];
}

export interface LowStockProduct {
    _id:           string;
    name:          string;
    image:         string;
    sku:           string;
    purchaseRate:  number;
    salesRate:     number;
    currentStock:  number;
    category:      string;
    vendor:        string;
    description:   string;
    minStockLevel: number;
    isActive:      boolean;
    createdBy:     string;
    createdAt:     Date;
    updatedAt:     Date;
    __v:           number;
}

export interface Overview {
    totalProducts:      number;
    lowStockProducts:   number;
    outOfStockProducts: number;
    totalSales:         number;
    totalRevenue:       number;
    totalPurchases:     number;
    totalSpent:         number;
    totalCustomers:     number;
    totalVendors:       number;
}

export interface DashboardStats {
  success: boolean;
  data:    Data;
}

export interface Data {
  overview:           Overview;
  lowStockProducts:   LowStockProduct[];
  outOfStockProducts: any[];
  recentSales:        any[];
  topProducts:        any[];
}

export interface LowStockProduct {
  _id:           string;
  name:          string;
  image:         string;
  sku:           string;
  purchaseRate:  number;
  salesRate:     number;
  currentStock:  number;
  category:      string;
  vendor:        string;
  description:   string;
  minStockLevel: number;
  isActive:      boolean;
  createdBy:     string;
  createdAt:     Date;
  updatedAt:     Date;
  __v:           number;
}

export interface Overview {
  totalProducts:      number;
  lowStockProducts:   number;
  outOfStockProducts: number;
  totalSales:         number;
  totalRevenue:       number;
  totalPurchases:     number;
  totalSpent:         number;
  totalCustomers:     number;
  totalVendors:       number;
}
