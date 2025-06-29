import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Expense, StockTransfer, Shop, DashboardStats } from '../types';
import { mockShops, mockProducts, mockSales, mockExpenses, mockStockTransfers } from '../utils/mockData';

interface DataContextType {
  shops: Shop[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockTransfers: StockTransfer[];
  currentShop: Shop;
  setCurrentShop: (shop: Shop) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  addStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'date' | 'status'>) => void;
  getDashboardStats: () => DashboardStats;
  updateProductStock: (productId: string, shopId: string, quantity: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shops] = useState<Shop[]>(mockShops);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(mockStockTransfers);
  const [currentShop, setCurrentShop] = useState<Shop>(mockShops[0]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    const savedExpenses = localStorage.getItem('expenses');
    const savedTransfers = localStorage.getItem('stockTransfers');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedTransfers) setStockTransfers(JSON.parse(savedTransfers));
  }, []);

  // Save to localStorage whenever data changes
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

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, productUpdate: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, ...productUpdate, updatedAt: new Date() }
        : product
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
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
    
    // Deduct stock
    updateProductStock(sale.productId, sale.shopId, -sale.quantity);
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date()
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const addStockTransfer = (transfer: Omit<StockTransfer, 'id' | 'date' | 'status'>) => {
    const newTransfer: StockTransfer = {
      ...transfer,
      id: Date.now().toString(),
      date: new Date(),
      status: 'completed'
    };
    setStockTransfers(prev => [...prev, newTransfer]);
    
    // Update stock for both shops
    updateProductStock(transfer.productId, transfer.fromShopId, -transfer.quantity);
    updateProductStock(transfer.productId, transfer.toShopId, transfer.quantity);
  };

  const getDashboardStats = (): DashboardStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const todayExpenses = expenses.filter(expense => {
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
      return totalStock < 10;
    }).length;

    // Daily sales for last 7 days
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const daySales = sales.filter(sale => {
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
    const shopPerformance = shops.map(shop => {
      const shopSales = sales.filter(sale => sale.shopId === shop.id);
      const shopExpenses = expenses.filter(expense => expense.shopId === shop.id);
      
      return {
        shopName: shop.name,
        sales: shopSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        expenses: shopExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      };
    });

    return {
      totalSalesToday,
      totalExpensesToday,
      totalStockValue,
      lowStockAlerts,
      dailySales,
      shopPerformance
    };
  };

  const value = {
    shops,
    products,
    sales,
    expenses,
    stockTransfers,
    currentShop,
    setCurrentShop,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    addExpense,
    addStockTransfer,
    getDashboardStats,
    updateProductStock
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};