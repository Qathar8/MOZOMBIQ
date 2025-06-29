import React, { useState } from 'react';
import { Download, Calendar, Filter, FileText, BarChart3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { exportToExcel } from '../utils/excelUtils';

export const Reports: React.FC = () => {
  const { products, sales, expenses, shops } = useData();
  const { success } = useToast();
  const [selectedShop, setSelectedShop] = useState('');
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

  const handleExportProducts = () => {
    const filteredProducts = selectedShop 
      ? products.filter(product => Object.keys(product.stock).includes(selectedShop))
      : products;

    const exportData = filteredProducts.map(product => ({
      'Product Name': product.name,
      'Category': product.category,
      'Price': product.price,
      ...shops.reduce((acc, shop) => ({
        ...acc,
        [`Stock ${shop.name}`]: product.stock[shop.id] || 0
      }), {}),
      'Total Stock': Object.values(product.stock).reduce((sum, qty) => sum + qty, 0),
      'Stock Value': Object.values(product.stock).reduce((sum, qty) => sum + qty, 0) * product.price,
      'Created Date': new Date(product.createdAt).toLocaleDateString()
    }));

    exportToExcel(exportData, `products-report-${Date.now()}`);
    success('Products report exported successfully!');
  };

  const handleExportSales = () => {
    const filteredSales = getFilteredData(sales);
    
    const exportData = filteredSales.map(sale => ({
      'Sale ID': sale.id,
      'Product': sale.productName,
      'Shop': sale.shopName,
      'Quantity': sale.quantity,
      'Unit Price': sale.unitPrice,
      'Total Amount': sale.totalAmount,
      'Date': new Date(sale.date).toLocaleString(),
      'Month': new Date(sale.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }));

    exportToExcel(exportData, `sales-report-${Date.now()}`);
    success('Sales report exported successfully!');
  };

  const handleExportExpenses = () => {
    const filteredExpenses = getFilteredData(expenses);
    
    const exportData = filteredExpenses.map(expense => ({
      'Expense ID': expense.id,
      'Description': expense.description,
      'Category': expense.category,
      'Shop': expense.shopName,
      'Amount': expense.amount,
      'Date': new Date(expense.date).toLocaleString(),
      'Month': new Date(expense.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }));

    exportToExcel(exportData, `expenses-report-${Date.now()}`);
    success('Expenses report exported successfully!');
  };

  const handleExportSummary = () => {
    const filteredSales = getFilteredData(sales);
    const filteredExpenses = getFilteredData(expenses);
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalSales - totalExpenses;

    // Sales by shop
    const salesByShop = shops.map(shop => {
      const shopSales = filteredSales.filter(sale => sale.shopId === shop.id);
      return {
        'Shop': shop.name,
        'Total Sales': shopSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        'Number of Sales': shopSales.length
      };
    });

    // Expenses by category
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const summaryData = [
      { 'Metric': 'Total Sales', 'Value': totalSales },
      { 'Metric': 'Total Expenses', 'Value': totalExpenses },
      { 'Metric': 'Net Profit', 'Value': profit },
      { 'Metric': 'Number of Sales', 'Value': filteredSales.length },
      { 'Metric': 'Number of Expenses', 'Value': filteredExpenses.length },
      { 'Metric': 'Average Sale Amount', 'Value': filteredSales.length > 0 ? totalSales / filteredSales.length : 0 },
      ...salesByShop.map(shop => ({ 'Metric': `${shop.Shop} Sales`, 'Value': shop['Total Sales'] })),
      ...Object.entries(expensesByCategory).map(([category, amount]) => ({ 'Metric': `${category} Expenses`, 'Value': amount }))
    ];

    exportToExcel(summaryData, `summary-report-${Date.now()}`);
    success('Summary report exported successfully!');
  };

  // Calculate current stats for display
  const filteredSales = getFilteredData(sales);
  const filteredExpenses = getFilteredData(expenses);
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = totalSales - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and export comprehensive business reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600 mt-2">${totalSales.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold mt-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profit.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{filteredSales.length + filteredExpenses.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Products Report</h3>
              <p className="text-sm text-gray-600 mt-1">Export complete product inventory data</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">• Product details and pricing</p>
            <p className="text-sm text-gray-600">• Stock levels by shop</p>
            <p className="text-sm text-gray-600">• Stock values and totals</p>
          </div>
          
          <button
            onClick={handleExportProducts}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Products
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Report</h3>
              <p className="text-sm text-gray-600 mt-1">Export detailed sales transaction data</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">• Individual sale transactions</p>
            <p className="text-sm text-gray-600">• Product and shop breakdown</p>
            <p className="text-sm text-gray-600">• Revenue analysis by period</p>
          </div>
          
          <button
            onClick={handleExportSales}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Sales ({filteredSales.length} records)
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expenses Report</h3>
              <p className="text-sm text-gray-600 mt-1">Export comprehensive expense data</p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">• Expense details by category</p>
            <p className="text-sm text-gray-600">• Shop-wise expense breakdown</p>
            <p className="text-sm text-gray-600">• Cost analysis and trends</p>
          </div>
          
          <button
            onClick={handleExportExpenses}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Expenses ({filteredExpenses.length} records)
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Summary Report</h3>
              <p className="text-sm text-gray-600 mt-1">Export consolidated business overview</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">• Financial summary and KPIs</p>
            <p className="text-sm text-gray-600">• Shop performance comparison</p>
            <p className="text-sm text-gray-600">• Profit & loss overview</p>
          </div>
          
          <button
            onClick={handleExportSummary}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Summary
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{filteredSales.length}</p>
            <p className="text-sm text-gray-600">Sales Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{filteredExpenses.length}</p>
            <p className="text-sm text-gray-600">Expense Records</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{shops.length}</p>
            <p className="text-sm text-gray-600">Active Shops</p>
          </div>
        </div>
      </div>
    </div>
  );
};