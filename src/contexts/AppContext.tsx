import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Shop, Product, Sale, Expense, StockTransfer, Settings, Notification, DashboardStats, ActivityLog } from '../types';
import { 
  mockUsers, 
  mockShops, 
  mockProducts, 
  mockSales, 
  mockExpenses, 
  mockStockTransfers, 
  mockSettings,
  mockNotifications,
  mockActivityLogs
} from '../utils/mockData';

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  changePassword: (currentPassword: string, newPassword: string) => boolean;

  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Data
  users: User[];
  shops: Shop[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockTransfers: StockTransfer[];
  settings: Settings;
  notifications: Notification[];
  activityLogs: ActivityLog[];
  currentShop: Shop;
  setCurrentShop: (shop: Shop) => void;

  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  approveExpense: (id: string) => void;
  
  addStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'date' | 'status'>) => void;
  
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  addShop: (shop: Omit<Shop, 'id' | 'createdAt'>) => void;
  updateShop: (id: string, shop: Partial<Shop>) => void;
  deleteShop: (id: string) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  getDashboardStats: () => DashboardStats;
  updateProductStock: (productId: string, shopId: string, quantity: number) => void;
  
  logActivity: (action: string, details: string, shopId?: string) => void;
  
  // Permissions
  hasPermission: (permission: string) => boolean;
  canAccessShop: (shopId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [shops, setShops] = useState<Shop[]>(mockShops);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(mockStockTransfers);
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [currentShop, setCurrentShop] = useState<Shop>(mockShops[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    const savedExpenses = localStorage.getItem('expenses');
    const savedTransfers = localStorage.getItem('stockTransfers');
    const savedSettings = localStorage.getItem('settings');
    const savedUsers = localStorage.getItem('users');
    const savedShops = localStorage.getItem('shops');
    const savedTheme = localStorage.getItem('theme');

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedTransfers) setStockTransfers(JSON.parse(savedTransfers));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedShops) setShops(JSON.parse(savedShops));
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('stockTransfers', JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('shops', JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.isActive);
    if (user && (password === 'admin' || password === 'password')) {
      const updatedUser = { ...user, lastLogin: new Date() };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      
      // Set current shop based on user role
      if (user.role !== 'owner' && user.shopId) {
        const userShop = shops.find(s => s.id === user.shopId);
        if (userShop) setCurrentShop(userShop);
      }
      
      logActivity('LOGIN', 'User logged into the system');
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logActivity('LOGOUT', 'User logged out of the system');
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('login');
  };

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    // In a real app, this would validate the current password and update it
    if (currentPassword === 'admin' || currentPassword === 'password') {
      logActivity('PASSWORD_CHANGE', 'User changed password');
      return true;
    }
    return false;
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    logActivity('THEME_CHANGE', `Theme changed to ${!isDarkMode ? 'dark' : 'light'}`);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    return currentUser.permissions.includes(permission) || currentUser.permissions.includes('all');
  };

  const canAccessShop = (shopId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    return !currentUser.shopId || currentUser.shopId === shopId;
  };

  const logActivity = (action: string, details: string, shopId?: string) => {
    if (!currentUser) return;
    
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date(),
      shopId: shopId || currentUser.shopId,
      ipAddress: '192.168.1.100' // Mock IP
    };
    
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
    logActivity('PRODUCT_ADD', `Added product: ${product.name}`);
  };

  const updateProduct = (id: string, productUpdate: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, ...productUpdate, updatedAt: new Date() }
        : product
    ));
    logActivity('PRODUCT_UPDATE', `Updated product ID: ${id}`);
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(product => product.id !== id));
    logActivity('PRODUCT_DELETE', `Deleted product: ${product?.name || id}`);
  };

  const bulkDeleteProducts = (ids: string[]) => {
    setProducts(prev => prev.filter(product => !ids.includes(product.id)));
    logActivity('PRODUCT_BULK_DELETE', `Bulk deleted ${ids.length} products`);
  };

  const updateProductStock = (productId: string, shopId: string, quantity: number) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          stock: {
            ...product.stock,
            [shopId]: Math.max(0, (product.stock[shopId] || 0) + quantity)
          },
          updatedAt: new Date()
        };
      }
      return product;
    }));
  };

  const addSale = (sale: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      date: new Date()
    };
    setSales(prev => [...prev, newSale]);
    updateProductStock(sale.productId, sale.shopId, -sale.quantity);
    logActivity('SALE_CREATE', `Recorded sale: ${sale.quantity}x ${sale.productName} (${settings.currencySymbol} ${sale.totalAmount.toFixed(2)})`, sale.shopId);
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date()
    };
    setExpenses(prev => [...prev, newExpense]);
    logActivity('EXPENSE_CREATE', `Recorded expense: ${expense.description} (${settings.currencySymbol} ${expense.amount.toFixed(2)})`, expense.shopId);
  };

  const approveExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, approved: true } : e));
    logActivity('EXPENSE_APPROVE', `Approved expense: ${expense?.description || id}`);
  };

  const addStockTransfer = (transfer: Omit<StockTransfer, 'id' | 'date' | 'status'>) => {
    const newTransfer: StockTransfer = {
      ...transfer,
      id: Date.now().toString(),
      date: new Date(),
      status: 'completed'
    };
    setStockTransfers(prev => [...prev, newTransfer]);
    updateProductStock(transfer.productId, transfer.fromShopId, -transfer.quantity);
    updateProductStock(transfer.productId, transfer.toShopId, transfer.quantity);
    logActivity('STOCK_TRANSFER', `Transferred ${transfer.quantity}x ${transfer.productName}: ${transfer.fromShopName} → ${transfer.toShopName}`);
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('USER_CREATE', `Created new user: ${user.name} (${user.role})`);
  };

  const updateUser = (id: string, userUpdate: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userUpdate } : user
    ));
    logActivity('USER_UPDATE', `Updated user ID: ${id}`);
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(user => user.id !== id));
    logActivity('USER_DELETE', `Deleted user: ${user?.name || id}`);
  };

  const addShop = (shop: Omit<Shop, 'id' | 'createdAt'>) => {
    const newShop: Shop = {
      ...shop,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setShops(prev => [...prev, newShop]);
    logActivity('SHOP_CREATE', `Created new shop: ${shop.name}`);
  };

  const updateShop = (id: string, shopUpdate: Partial<Shop>) => {
    setShops(prev => prev.map(shop => 
      shop.id === id ? { ...shop, ...shopUpdate } : shop
    ));
    logActivity('SHOP_UPDATE', `Updated shop ID: ${id}`);
  };

  const deleteShop = (id: string) => {
    const shop = shops.find(s => s.id === id);
    setShops(prev => prev.filter(shop => shop.id !== id));
    logActivity('SHOP_DELETE', `Deleted shop: ${shop?.name || id}`);
  };

  const updateSettings = (settingsUpdate: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...settingsUpdate }));
    logActivity('SETTINGS_UPDATE', 'Updated system settings');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
  };

  const getDashboardStats = (): DashboardStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter data based on user permissions
    const filteredSales = currentUser?.role === 'owner' 
      ? sales 
      : sales.filter(sale => canAccessShop(sale.shopId));
    
    const filteredExpenses = currentUser?.role === 'owner'
      ? expenses
      : expenses.filter(expense => canAccessShop(expense.shopId));

    const todaySales = filteredSales.filter(sale => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const todayExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    });

    const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpensesToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const totalStockValue = products.reduce((sum, product) => {
      const totalStock = Object.values(product.stock).reduce((stockSum, qty) => stockSum + qty, 0);
      return sum + (totalStock * product.price);
    }, 0);

    const lowStockAlerts = products.filter(product => {
      const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
      return totalStock < product.minStock;
    }).length;

    // Daily sales for last 7 days
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const daySales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === date.getTime();
      });
      
      dailySales.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      });
    }

    // Shop performance
    const availableShops = currentUser?.role === 'owner' 
      ? shops 
      : shops.filter(shop => canAccessShop(shop.id));

    const shopPerformance = availableShops.map(shop => {
      const shopSales = filteredSales.filter(sale => sale.shopId === shop.id);
      const shopExpenses = filteredExpenses.filter(expense => expense.shopId === shop.id);
      
      return {
        shopName: shop.name,
        sales: shopSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        expenses: shopExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      };
    });

    // Top products
    const productSales = filteredSales.reduce((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));

    // Monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = filteredSales
      .filter(sale => new Date(sale.date) >= currentMonth)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    const monthlyExpenses = filteredExpenses
      .filter(expense => new Date(expense.date) >= currentMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;

    return {
      totalSalesToday,
      totalExpensesToday,
      totalStockValue,
      lowStockAlerts,
      dailySales,
      shopPerformance,
      topProducts,
      totalUsers: users.filter(u => u.isActive).length,
      totalShops: shops.filter(s => s.isActive).length,
      monthlyRevenue,
      profitMargin
    };
  };

  const value = {
    currentUser,
    login,
    logout,
    changePassword,
    isAuthenticated: !!currentUser,
    currentPage,
    setCurrentPage,
    users,
    shops,
    products,
    sales,
    expenses,
    stockTransfers,
    settings,
    notifications,
    activityLogs,
    currentShop,
    setCurrentShop,
    isDarkMode,
    toggleTheme,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    addSale,
    addExpense,
    approveExpense,
    addStockTransfer,
    addUser,
    updateUser,
    deleteUser,
    addShop,
    updateShop,
    deleteShop,
    updateSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getDashboardStats,
    updateProductStock,
    logActivity,
    hasPermission,
    canAccessShop
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};