import { Shop, Product, Sale, Expense, StockTransfer, User, Settings, Notification, ActivityLog } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'João Silva',
    role: 'owner',
    email: 'joao@retailpro.mz',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    isActive: true,
    permissions: ['all'],
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  {
    id: '2',
    username: 'manager1',
    name: 'Maria Santos',
    role: 'manager',
    email: 'maria@retailpro.mz',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    isActive: true,
    shopId: '1',
    permissions: ['products', 'sales', 'expenses', 'transfers', 'reports'],
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date()
  },
  {
    id: '3',
    username: 'cashier1',
    name: 'Carlos Machado',
    role: 'cashier',
    email: 'carlos@retailpro.mz',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    isActive: true,
    shopId: '1',
    permissions: ['sales'],
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date()
  },
  {
    id: '4',
    username: 'manager2',
    name: 'Ana Fernandes',
    role: 'manager',
    email: 'ana@retailpro.mz',
    isActive: true,
    shopId: '2',
    permissions: ['products', 'sales', 'expenses', 'transfers', 'reports'],
    createdAt: new Date('2024-01-08'),
    lastLogin: new Date()
  }
];

export const mockShops: Shop[] = [
  { 
    id: '1', 
    name: 'Downtown Store', 
    location: 'Av. Julius Nyerere, Maputo', 
    isActive: true, 
    manager: 'Maria Santos',
    phone: '+258 21 123456',
    email: 'downtown@retailpro.mz',
    createdAt: new Date('2024-01-01')
  },
  { 
    id: '2', 
    name: 'Shopping Mall Store', 
    location: 'Maputo Shopping, Floor 2', 
    isActive: true, 
    manager: 'Ana Fernandes',
    phone: '+258 21 234567',
    email: 'shopping@retailpro.mz',
    createdAt: new Date('2024-01-02')
  },
  { 
    id: '3', 
    name: 'Matola Branch', 
    location: 'Av. da Independência, Matola', 
    isActive: true, 
    manager: 'Maria Santos',
    phone: '+258 21 345678',
    email: 'matola@retailpro.mz',
    createdAt: new Date('2024-01-03')
  },
  { 
    id: '4', 
    name: 'Beira Branch', 
    location: 'Rua do Aeroporto, Beira', 
    isActive: true, 
    manager: 'Ana Fernandes',
    phone: '+258 23 456789',
    email: 'beira@retailpro.mz',
    createdAt: new Date('2024-01-04')
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Mozambique Coffee',
    category: 'Beverages',
    price: 450.00,
    stock: { '1': 45, '2': 32, '3': 18, '4': 55 },
    minStock: 20,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    barcode: '7891234567890',
    supplier: 'Café Moçambique Lda'
  },
  {
    id: '2',
    name: 'Organic Green Tea',
    category: 'Beverages',
    price: 380.00,
    stock: { '1': 38, '2': 42, '3': 15, '4': 60 },
    minStock: 15,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    barcode: '7891234567891',
    supplier: 'Chás do Mundo'
  },
  {
    id: '3',
    name: 'Artisan Chocolate',
    category: 'Sweets',
    price: 320.00,
    stock: { '1': 25, '2': 8, '3': 35, '4': 28 },
    minStock: 10,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    barcode: '7891234567892',
    supplier: 'Chocolates Maputo'
  },
  {
    id: '4',
    name: 'Fresh Croissant',
    category: 'Bakery',
    price: 135.00,
    stock: { '1': 65, '2': 85, '3': 48, '4': 72 },
    minStock: 30,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-22'),
    barcode: '7891234567893',
    supplier: 'Padaria Central'
  },
  {
    id: '5',
    name: 'Gourmet Sandwich',
    category: 'Food',
    price: 195.00,
    stock: { '1': 28, '2': 38, '3': 22, '4': 33 },
    minStock: 15,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-21'),
    barcode: '7891234567894',
    supplier: 'Delícias Gourmet'
  },
  {
    id: '6',
    name: 'Energy Drink',
    category: 'Beverages',
    price: 60.00,
    stock: { '1': 120, '2': 95, '3': 88, '4': 110 },
    minStock: 50,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-20'),
    barcode: '7891234567895',
    supplier: 'Bebidas Energy'
  }
];

export const mockSales: Sale[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Premium Mozambique Coffee',
    shopId: '1',
    shopName: 'Downtown Store',
    quantity: 3,
    unitPrice: 450.00,
    totalAmount: 1350.00,
    date: new Date('2024-01-22T10:30:00'),
    userId: '1',
    customerName: 'Alice Cooper',
    paymentMethod: 'cash'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Organic Green Tea',
    shopId: '2',
    shopName: 'Shopping Mall Store',
    quantity: 2,
    unitPrice: 380.00,
    totalAmount: 760.00,
    date: new Date('2024-01-22T14:15:00'),
    userId: '2',
    paymentMethod: 'card'
  },
  {
    id: '3',
    productId: '4',
    productName: 'Fresh Croissant',
    shopId: '1',
    shopName: 'Downtown Store',
    quantity: 5,
    unitPrice: 135.00,
    totalAmount: 675.00,
    date: new Date('2024-01-21T09:20:00'),
    userId: '3',
    paymentMethod: 'mobile'
  },
  {
    id: '4',
    productId: '6',
    productName: 'Energy Drink',
    shopId: '3',
    shopName: 'Matola Branch',
    quantity: 8,
    unitPrice: 60.00,
    totalAmount: 480.00,
    date: new Date('2024-01-22T16:45:00'),
    userId: '2',
    paymentMethod: 'cash'
  }
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Monthly Rent',
    amount: 37500.00,
    shopId: '1',
    shopName: 'Downtown Store',
    category: 'Rent',
    date: new Date('2024-01-01'),
    userId: '1',
    approved: true
  },
  {
    id: '2',
    description: 'Electricity Bill',
    amount: 2700.00,
    shopId: '2',
    shopName: 'Shopping Mall Store',
    category: 'Utilities',
    date: new Date('2024-01-15'),
    userId: '1',
    approved: true
  },
  {
    id: '3',
    description: 'Staff Salaries',
    amount: 48000.00,
    shopId: '3',
    shopName: 'Matola Branch',
    category: 'Payroll',
    date: new Date('2024-01-20'),
    userId: '1',
    approved: true
  },
  {
    id: '4',
    description: 'Marketing Campaign',
    amount: 6750.00,
    shopId: '4',
    shopName: 'Beira Branch',
    category: 'Marketing',
    date: new Date('2024-01-18'),
    userId: '1',
    approved: false
  }
];

export const mockStockTransfers: StockTransfer[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Premium Mozambique Coffee',
    fromShopId: '1',
    fromShopName: 'Downtown Store',
    toShopId: '3',
    toShopName: 'Matola Branch',
    quantity: 10,
    date: new Date('2024-01-18'),
    userId: '1',
    status: 'completed',
    notes: 'Low stock replenishment'
  },
  {
    id: '2',
    productId: '2',
    productName: 'Organic Green Tea',
    fromShopId: '2',
    fromShopName: 'Shopping Mall Store',
    toShopId: '4',
    toShopName: 'Beira Branch',
    quantity: 15,
    date: new Date('2024-01-19'),
    userId: '2',
    status: 'completed'
  }
];

export const mockSettings: Settings = {
  businessName: 'RetailPro Mozambique',
  currency: 'MZN',
  currencySymbol: 'MT',
  vatRate: 17.0,
  lowStockThreshold: 20,
  timezone: 'Africa/Maputo',
  theme: 'light',
  language: 'en',
  businessAddress: 'Av. Julius Nyerere, 123, Maputo',
  businessPhone: '+258 21 123456',
  businessEmail: 'info@retailpro.mz'
};

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Artisan Chocolate is running low at Shopping Mall Store (8 units remaining)',
    isRead: false,
    createdAt: new Date('2024-01-22T08:30:00'),
    shopId: '2',
    priority: 'high'
  },
  {
    id: '2',
    type: 'high_sales',
    title: 'High Sales',
    message: 'Downtown Store exceeded daily sales target by 25%',
    isRead: false,
    createdAt: new Date('2024-01-21T18:00:00'),
    shopId: '1',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'transfer_complete',
    title: 'Transfer Complete',
    message: 'Organic Green Tea transfer from Shopping Mall Store to Beira Branch completed',
    isRead: true,
    createdAt: new Date('2024-01-19T14:30:00'),
    priority: 'low'
  },
  {
    id: '4',
    type: 'expense_alert',
    title: 'Pending Expense',
    message: 'Marketing Campaign awaiting approval (MT 6,750.00)',
    isRead: false,
    createdAt: new Date('2024-01-18T16:00:00'),
    priority: 'medium'
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'João Silva',
    action: 'LOGIN',
    details: 'User logged into the system',
    timestamp: new Date('2024-01-22T08:00:00'),
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Maria Santos',
    action: 'PRODUCT_ADD',
    details: 'Added product: Premium Mozambique Coffee',
    timestamp: new Date('2024-01-22T09:15:00'),
    shopId: '1',
    ipAddress: '192.168.1.101'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Carlos Machado',
    action: 'SALE_CREATE',
    details: 'Recorded sale: 5x Fresh Croissant (MT 675.00)',
    timestamp: new Date('2024-01-21T09:20:00'),
    shopId: '1',
    ipAddress: '192.168.1.102'
  },
  {
    id: '4',
    userId: '1',
    userName: 'João Silva',
    action: 'USER_CREATE',
    details: 'Created new user: Ana Fernandes (Manager)',
    timestamp: new Date('2024-01-20T14:30:00'),
    ipAddress: '192.168.1.100'
  },
  {
    id: '5',
    userId: '2',
    userName: 'Maria Santos',
    action: 'STOCK_TRANSFER',
    details: 'Transferred 10x Premium Mozambique Coffee: Downtown Store → Matola Branch',
    timestamp: new Date('2024-01-18T11:45:00'),
    shopId: '1',
    ipAddress: '192.168.1.101'
  }
];