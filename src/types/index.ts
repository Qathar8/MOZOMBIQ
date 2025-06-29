export interface User {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier';
  avatar?: string;
  email: string;
  isActive: boolean;
  shopId?: string; // For managers and cashiers
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  manager?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: Record<string, number>; // shopId -> quantity
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
  barcode?: string;
  supplier?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  userId: string;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
  discount?: number;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  shopId: string;
  shopName: string;
  category: string;
  date: Date;
  userId: string;
  receipt?: string;
  approved: boolean;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  fromShopId: string;
  fromShopName: string;
  toShopId: string;
  toShopName: string;
  quantity: number;
  date: Date;
  userId: string;
  status: 'pending' | 'completed' | 'cancelled';
  reason?: string;
  priority?: 'low' | 'normal' | 'high';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  shopId?: string;
  ipAddress?: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalExpensesToday: number;
  totalStockValue: number;
  lowStockAlerts: number;
  dailySales: Array<{ date: string; amount: number }>;
  shopPerformance: Array<{ shopName: string; sales: number; expenses: number }>;
  topProducts: Array<{ name: string; sales: number }>;
  totalUsers: number;
  totalShops: number;
  monthlyRevenue: number;
  profitMargin: number;
}

export interface Settings {
  businessName: string;
  currency: string;
  currencySymbol: string;
  vatRate: number;
  lowStockThreshold: number;
  timezone: string;
  theme: 'light' | 'dark';
  language: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  logo?: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'high_sales' | 'expense_alert' | 'transfer_complete' | 'user_action';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  shopId?: string;
  priority: 'low' | 'medium' | 'high';
}