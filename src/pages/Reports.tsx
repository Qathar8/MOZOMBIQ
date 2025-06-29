import React, { useState, useMemo } from 'react';
import { Download, Calendar, Filter, FileText, BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Building, PieChart, LineChart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { exportToExcel } from '../utils/excelUtils';

export const Reports: React.FC = () => {
  const { products, sales, expenses, shops, users, settings, isDarkMode } = useApp();
  const { success } = useToast();
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const filterDataByDate = (data: any[]) => {
    if (!dateRange.from && !dateRange.to) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
      
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  const filterDataByShop = (data: any[]) => {
    if (!selectedShop) return data;
    return data.filter(item => item.shopId === selectedShop);
  };

  const getFilteredData = (data: any[]) => {
    return filterDataByShop(filterDataByDate(data));
  };

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const filteredSales = getFilteredData(sales);
    const filteredExpenses = getFilteredData(expenses);
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    // Sales by period
    const salesByMonth = filteredSales.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Sales by shop
    const salesByShop = shops.map(shop => {
      const shopSales = filteredSales.filter(sale => sale.shopId === shop.id);
      const shopExpenses = filteredExpenses.filter(expense => expense.shopId === shop.id);
      return {
        shopName: shop.name,
        sales: shopSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        expenses: shopExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        transactions: shopSales.length,
        profit: shopSales.reduce((sum, sale) => sum + sale.totalAmount, 0) - shopExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      };
    });

    // Top products
    const productSales = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          name: sale.productName,
          quantity: 0,
          revenue: 0,
          transactions: 0
        };
      }
      acc[sale.productId].quantity += sale.quantity;
      acc[sale.productId].revenue += sale.totalAmount;
      acc[sale.productId].transactions += 1;
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method analysis
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Expense categories
    const expenseCategories = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Daily sales trend (last 30 days)
    const dailySales = [];
    for (let i = 29; i >= 0; i--) {
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
        amount: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        transactions: daySales.length
      });
    }

    // Stock analysis
    const stockAnalysis = products.map(product => {
      const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
      const stockValue = totalStock * product.price;
      const productSalesData = filteredSales.filter(sale => sale.productId === product.id);
      const totalSold = productSalesData.reduce((sum, sale) => sum + sale.quantity, 0);
      const turnoverRate = totalStock > 0 ? totalSold / totalStock : 0;
      
      return {
        name: product.name,
        category: product.category,
        totalStock,
        stockValue,
        totalSold,
        turnoverRate,
        isLowStock: totalStock < product.minStock
      };
    });

    // Customer analysis (based on named customers)
    const customerAnalysis = filteredSales
      .filter(sale => sale.customerName)
      .reduce((acc, sale) => {
        if (!acc[sale.customerName!]) {
          acc[sale.customerName!] = {
            name: sale.customerName!,
            totalSpent: 0,
            transactions: 0,
            lastPurchase: sale.date
          };
        }
        acc[sale.customerName!].totalSpent += sale.totalAmount;
        acc[sale.customerName!].transactions += 1;
        if (new Date(sale.date) > new Date(acc[sale.customerName!].lastPurchase)) {
          acc[sale.customerName!].lastPurchase = sale.date;
        }
        return acc;
      }, {} as Record<string, any>);

    const topCustomers = Object.values(customerAnalysis)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalSales,
      totalExpenses,
      profit,
      profitMargin,
      salesByMonth,
      salesByShop,
      topProducts,
      paymentMethods,
      expenseCategories,
      dailySales,
      stockAnalysis,
      topCustomers,
      totalTransactions: filteredSales.length,
      averageTransactionValue: filteredSales.length > 0 ? totalSales / filteredSales.length : 0
    };
  }, [sales, expenses, products, shops, selectedShop, dateRange]);

  const handleExportProducts = () => {
    const filteredProducts = selectedShop 
      ? products.filter(product => Object.keys(product.stock).includes(selectedShop))
      : products;

    const exportData = filteredProducts.map(product => ({
      'Product Name': product.name,
      'Category': product.category,
      'Price': `${settings.currencySymbol} ${product.price.toFixed(2)}`,
      ...shops.reduce((acc, shop) => ({
        ...acc,
        [`Stock ${shop.name}`]: product.stock[shop.id] || 0
      }), {}),
      'Total Stock': Object.values(product.stock).reduce((sum, qty) => sum + qty, 0),
      'Stock Value': `${settings.currencySymbol} ${(Object.values(product.stock).reduce((sum, qty) => sum + qty, 0) * product.price).toFixed(2)}`,
      'Min Stock': product.minStock,
      'Created Date': new Date(product.createdAt).toLocaleDateString('en-US')
    }));

    exportToExcel(exportData, `products-report-${Date.now()}`);
    success('Products report exported successfully!');
  };

  const handleExportSales = () => {
    const filteredSales = getFilteredData(sales);
    
    const exportData = filteredSales.map(sale => ({
      'Sale ID': sale.id,
      'Date': new Date(sale.date).toLocaleString('en-US'),
      'Product': sale.productName,
      'Shop': sale.shopName,
      'Customer': sale.customerName || 'Walk-in',
      'Quantity': sale.quantity,
      'Unit Price': `${settings.currencySymbol} ${sale.unitPrice.toFixed(2)}`,
      'Discount': sale.discount ? `${sale.discount}%` : '0%',
      'Total Amount': `${settings.currencySymbol} ${sale.totalAmount.toFixed(2)}`,
      'Payment Method': sale.paymentMethod.toUpperCase(),
      'Month': new Date(sale.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      'Recorded By': sale.userId
    }));

    exportToExcel(exportData, `sales-report-${Date.now()}`);
    success('Sales report exported successfully!');
  };

  const handleExportExpenses = () => {
    const filteredExpenses = getFilteredData(expenses);
    
    const exportData = filteredExpenses.map(expense => ({
      'Expense ID': expense.id,
      'Date': new Date(expense.date).toLocaleString('en-US'),
      'Description': expense.description,
      'Category': expense.category,
      'Shop': expense.shopName,
      'Amount': `${settings.currencySymbol} ${expense.amount.toFixed(2)}`,
      'Status': expense.approved ? 'Approved' : 'Pending',
      'Month': new Date(expense.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      'Recorded By': expense.userId
    }));

    exportToExcel(exportData, `expenses-report-${Date.now()}`);
    success('Expenses report exported successfully!');
  };

  const handleExportAnalytics = () => {
    const summaryData = [
      { 'Metric': 'Total Sales', 'Value': `${settings.currencySymbol} ${analytics.totalSales.toFixed(2)}` },
      { 'Metric': 'Total Expenses', 'Value': `${settings.currencySymbol} ${analytics.totalExpenses.toFixed(2)}` },
      { 'Metric': 'Net Profit', 'Value': `${settings.currencySymbol} ${analytics.profit.toFixed(2)}` },
      { 'Metric': 'Profit Margin', 'Value': `${analytics.profitMargin.toFixed(2)}%` },
      { 'Metric': 'Total Transactions', 'Value': analytics.totalTransactions },
      { 'Metric': 'Average Transaction Value', 'Value': `${settings.currencySymbol} ${analytics.averageTransactionValue.toFixed(2)}` },
      ...analytics.salesByShop.map(shop => ({ 
        'Metric': `${shop.shopName} Sales`, 
        'Value': `${settings.currencySymbol} ${shop.sales.toFixed(2)}` 
      })),
      ...Object.entries(analytics.expenseCategories).map(([category, amount]) => ({ 
        'Metric': `${category} Expenses`, 
        'Value': `${settings.currencySymbol} ${amount.toFixed(2)}` 
      }))
    ];

    exportToExcel(summaryData, `analytics-report-${Date.now()}`);
    success('Analytics report exported successfully!');
  };

  const handleExportStockAnalysis = () => {
    const exportData = analytics.stockAnalysis.map(item => ({
      'Product': item.name,
      'Category': item.category,
      'Total Stock': item.totalStock,
      'Stock Value': `${settings.currencySymbol} ${item.stockValue.toFixed(2)}`,
      'Units Sold': item.totalSold,
      'Turnover Rate': `${(item.turnoverRate * 100).toFixed(2)}%`,
      'Stock Status': item.isLowStock ? 'Low Stock' : 'Normal'
    }));

    exportToExcel(exportData, `stock-analysis-${Date.now()}`);
    success('Stock analysis exported successfully!');
  };

  const SimpleChart: React.FC<{ data: Array<{ date: string; amount: number }> }> = ({ data }) => {
    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    
    return (
      <div className="flex items-end space-x-1 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-blue-500 rounded-t w-full min-h-1 transition-all hover:bg-blue-600 cursor-pointer"
              style={{
                height: `${maxAmount > 0 ? Math.max((item.amount / maxAmount) * 100, 2) : 10}%`
              }}
              title={`${item.date}: ${settings.currencySymbol} ${item.amount.toFixed(2)}`}
            />
            {index % 5 === 0 && (
              <span className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.date}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const reportTypes = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'sales', name: 'Sales Analysis', icon: TrendingUp },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'performance', name: 'Performance', icon: LineChart }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Advanced Reports & Analytics
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Comprehensive business insights and data analysis
        </p>
      </div>

      {/* Report Type Selector */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-center space-x-4 mb-4">
          <FileText className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Report Type
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {reportTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                  selectedReport === type.id
                    ? 'bg-blue-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-center space-x-4 mb-4">
          <Filter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Shop
            </label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Sales
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {settings.currencySymbol} {analytics.totalSales.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Expenses
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {settings.currencySymbol} {analytics.totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-500">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Net Profit
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${analytics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {settings.currencySymbol} {analytics.profit.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${analytics.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Profit Margin
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Daily Sales Trend (Last 30 Days)
              </h3>
              <SimpleChart data={analytics.dailySales} />
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Shop Performance
              </h3>
              <div className="space-y-4">
                {analytics.salesByShop.map((shop, index) => (
                  <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {shop.shopName}
                      </span>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-green-600 font-medium">
                          Sales: {settings.currencySymbol} {shop.sales.toFixed(2)}
                        </span>
                        <span className="text-red-600 font-medium">
                          Profit: {settings.currencySymbol} {shop.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${shop.sales > 0 ? Math.min((shop.sales / Math.max(...analytics.salesByShop.map(s => s.sales))) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sales Analysis Report */}
      {selectedReport === 'sales' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Selling Products
              </h3>
              <div className="space-y-3">
                {analytics.topProducts.slice(0, 5).map((product: any, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </span>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <span className="text-green-600 font-medium">
                      {settings.currencySymbol} {product.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Methods
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.paymentMethods).map(([method, amount]) => (
                  <div key={method} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {method}
                      </span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {settings.currencySymbol} {amount.toFixed(2)}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(amount / analytics.totalSales) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {((amount / analytics.totalSales) * 100).toFixed(1)}% of total sales
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {analytics.topCustomers.length > 0 && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Customers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topCustomers.map((customer: any, index) => (
                  <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {customer.name}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {customer.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Spent:</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {settings.currencySymbol} {customer.totalSpent.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Purchase:</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date(customer.lastPurchase).toLocaleDateString('en-US')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Financial Report */}
      {selectedReport === 'financial' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Revenue vs Expenses
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {settings.currencySymbol} {analytics.totalSales.toFixed(2)}
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expenses</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {settings.currencySymbol} {analytics.totalExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="bg-red-500 h-3 rounded-full" 
                      style={{ width: `${analytics.totalSales > 0 ? (analytics.totalExpenses / analytics.totalSales) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Net Profit</span>
                    <span className={`font-bold ${analytics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {settings.currencySymbol} {analytics.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Expense Categories
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.expenseCategories)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {category}
                        </span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {settings.currencySymbol} {amount.toFixed(2)}
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(amount / analytics.totalExpenses) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {((amount / analytics.totalExpenses) * 100).toFixed(1)}% of total expenses
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Inventory Report */}
      {selectedReport === 'inventory' && (
        <>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Stock Analysis
              </h3>
              <button
                onClick={handleExportStockAnalysis}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Product
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Category
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Stock
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Value
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Sold
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Turnover
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                  {analytics.stockAnalysis.slice(0, 10).map((item, index) => (
                    <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {item.totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {settings.currencySymbol} {item.stockValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {item.totalSold}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {(item.turnoverRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isLowStock 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.isLowStock ? 'Low Stock' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Performance Report */}
      {selectedReport === 'performance' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Transaction Value
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {settings.currencySymbol} {analytics.averageTransactionValue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Transactions
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.totalTransactions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active Products
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {products.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Shop Performance Comparison
            </h3>
            <div className="space-y-4">
              {analytics.salesByShop.map((shop, index) => (
                <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {shop.shopName}
                    </h4>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600 font-medium">
                        Revenue: {settings.currencySymbol} {shop.sales.toFixed(2)}
                      </span>
                      <span className="text-blue-600 font-medium">
                        Transactions: {shop.transactions}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expenses:</span>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {settings.currencySymbol} {shop.expenses.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Profit:</span>
                      <p className={`font-medium ${shop.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.currencySymbol} {shop.profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Transaction:</span>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {settings.currencySymbol} {shop.transactions > 0 ? (shop.sales / shop.transactions).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Export Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Sales Report
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Detailed sales data
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
          
          <button
            onClick={handleExportSales}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Sales ({getFilteredData(sales).length})
          </button>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Expenses Report
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Expense breakdown
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
          
          <button
            onClick={handleExportExpenses}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Expenses ({getFilteredData(expenses).length})
          </button>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Products Report
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Inventory overview
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          
          <button
            onClick={handleExportProducts}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Products ({products.length})
          </button>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Analytics Report
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Business insights
              </p>
            </div>
            <PieChart className="w-8 h-8 text-purple-500" />
          </div>
          
          <button
            onClick={handleExportAnalytics}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </button>
        </div>
      </div>
    </div>
  );
};