import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, CheckCircle, Clock, XCircle, Search, Filter, Eye, Download, AlertTriangle, Package } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { exportToExcel } from '../utils/excelUtils';

export const StockTransfers: React.FC = () => {
  const { stockTransfers, products, shops, addStockTransfer, currentUser, settings, isDarkMode } = useApp();
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFromShop, setSelectedFromShop] = useState('');
  const [selectedToShop, setSelectedToShop] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    productId: '',
    fromShopId: '',
    toShopId: '',
    quantity: '',
    reason: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    notes: ''
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const availableStock = selectedProduct && formData.fromShopId 
    ? selectedProduct.stock[formData.fromShopId] || 0 
    : 0;

  // Filter and paginate transfers
  const filteredTransfers = useMemo(() => {
    return stockTransfers.filter(transfer => {
      const matchesSearch = transfer.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.fromShopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.toShopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === '' || transfer.status === selectedStatus;
      const matchesFromShop = selectedFromShop === '' || transfer.fromShopId === selectedFromShop;
      const matchesToShop = selectedToShop === '' || transfer.toShopId === selectedToShop;
      
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const transferDate = new Date(transfer.date);
        if (dateRange.from) {
          matchesDate = matchesDate && transferDate >= new Date(dateRange.from);
        }
        if (dateRange.to) {
          matchesDate = matchesDate && transferDate <= new Date(dateRange.to);
        }
      }
      
      return matchesSearch && matchesStatus && matchesFromShop && matchesToShop && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockTransfers, searchTerm, selectedStatus, selectedFromShop, selectedToShop, dateRange]);

  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransfers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransfers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.fromShopId || !formData.toShopId || !formData.quantity) {
      error('Please fill in all required fields');
      return;
    }

    if (formData.fromShopId === formData.toShopId) {
      error('Source and destination shops must be different');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    const fromShop = shops.find(s => s.id === formData.fromShopId);
    const toShop = shops.find(s => s.id === formData.toShopId);
    
    if (!product || !fromShop || !toShop) {
      error('Invalid product or shop selected');
      return;
    }

    const quantityNum = parseInt(formData.quantity);
    if (quantityNum > availableStock) {
      error(`Insufficient stock. Available: ${availableStock}`);
      return;
    }

    addStockTransfer({
      productId: product.id,
      productName: product.name,
      fromShopId: fromShop.id,
      fromShopName: fromShop.name,
      toShopId: toShop.id,
      toShopName: toShop.name,
      quantity: quantityNum,
      userId: currentUser?.id || '1',
      reason: formData.reason,
      priority: formData.priority,
      notes: formData.notes || undefined
    });

    success('Stock transfer initiated successfully!');
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      fromShopId: '',
      toShopId: '',
      quantity: '',
      reason: '',
      priority: 'normal',
      notes: ''
    });
  };

  const handleExport = () => {
    const exportData = filteredTransfers.map(transfer => ({
      'Transfer ID': transfer.id,
      'Date': new Date(transfer.date).toLocaleString('en-US'),
      'Product': transfer.productName,
      'From Shop': transfer.fromShopName,
      'To Shop': transfer.toShopName,
      'Quantity': transfer.quantity,
      'Status': transfer.status.toUpperCase(),
      'Priority': transfer.priority || 'Normal',
      'Reason': transfer.reason || '',
      'Notes': transfer.notes || '',
      'Initiated By': transfer.userId
    }));
    
    exportToExcel(exportData, `stock-transfers-${Date.now()}`);
    success('Stock transfers exported successfully!');
  };

  const handleViewTransfer = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsViewModalOpen(true);
  };

  // Calculate statistics
  const totalTransfers = filteredTransfers.length;
  const completedTransfers = filteredTransfers.filter(t => t.status === 'completed').length;
  const pendingTransfers = filteredTransfers.filter(t => t.status === 'pending').length;
  const totalQuantityTransferred = filteredTransfers
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.quantity, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'pending': return isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      default: return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      case 'normal': return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'low': return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
      default: return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  // Get low stock products that might need transfers
  const lowStockProducts = products.filter(product => {
    const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
    return totalStock < product.minStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Stock Transfers
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Transfer inventory between your shops efficiently
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' 
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transfer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Transfers
              </p>
              <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalTransfers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Completed
              </p>
              <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {completedTransfers}
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalTransfers > 0 ? Math.round((completedTransfers / totalTransfers) * 100) : 0}% success rate
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending
              </p>
              <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {pendingTransfers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Units Transferred
              </p>
              <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {totalQuantityTransferred}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className={`${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-xl p-4`}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
              Low Stock Alert
            </h3>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'} mb-3`}>
            {lowStockProducts.length} product(s) are running low on stock and may need transfers:
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map(product => (
              <span key={product.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDarkMode ? 'bg-red-800 text-red-300' : 'bg-red-100 text-red-800'
              }`}>
                {product.name}
              </span>
            ))}
            {lowStockProducts.length > 5 && (
              <span className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                +{lowStockProducts.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-center space-x-4 mb-4">
          <Filter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Search
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              From Shop
            </label>
            <select
              value={selectedFromShop}
              onChange={(e) => setSelectedFromShop(e.target.value)}
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
              To Shop
            </label>
            <select
              value={selectedToShop}
              onChange={(e) => setSelectedToShop(e.target.value)}
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

      {/* Transfers Table */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Transfer History ({filteredTransfers.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Transfer ID
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Product
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  From → To
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Quantity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Priority
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
              {paginatedTransfers.map((transfer) => (
                <tr key={transfer.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      #{transfer.id.slice(-6)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {transfer.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {transfer.fromShopName}
                      </span>
                      <ArrowLeftRight className={`w-3 h-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        {transfer.toShopName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {transfer.quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                      {getStatusIcon(transfer.status)}
                      <span className="ml-1 capitalize">{transfer.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(transfer.priority || 'normal')}`}>
                      {(transfer.priority || 'normal').charAt(0).toUpperCase() + (transfer.priority || 'normal').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(transfer.date).toLocaleString('en-US')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewTransfer(transfer)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paginatedTransfers.length === 0 && (
            <div className="text-center py-12">
              <ArrowLeftRight className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No transfers found
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransfers.length)} of {filteredTransfers.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border transition-colors ${
                  currentPage === 1
                    ? isDarkMode ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-300'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className={`px-3 py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border transition-colors ${
                  currentPage === totalPages
                    ? isDarkMode ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-300'
                    : isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transfer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="New Stock Transfer"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Product *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {settings.currencySymbol} {product.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                From Shop *
              </label>
              <select
                value={formData.fromShopId}
                onChange={(e) => setFormData({ ...formData, fromShopId: e.target.value })}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select source shop</option>
                {shops
                  .filter(shop => !selectedProduct || (selectedProduct.stock[shop.id] || 0) > 0)
                  .map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                      {selectedProduct && ` (Stock: ${selectedProduct.stock[shop.id] || 0})`}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                To Shop *
              </label>
              <select
                value={formData.toShopId}
                onChange={(e) => setFormData({ ...formData, toShopId: e.target.value })}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select destination shop</option>
                {shops
                  .filter(shop => shop.id !== formData.fromShopId)
                  .map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                      {selectedProduct && ` (Current: ${selectedProduct.stock[shop.id] || 0})`}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                max={availableStock}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Enter quantity to transfer"
              />
              {formData.productId && formData.fromShopId && (
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Available stock: {availableStock} units
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reason for Transfer
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Select reason</option>
              <option value="low_stock">Low Stock Replenishment</option>
              <option value="high_demand">High Demand</option>
              <option value="seasonal">Seasonal Adjustment</option>
              <option value="rebalancing">Stock Rebalancing</option>
              <option value="promotion">Promotion Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              placeholder="Optional notes about the transfer"
            />
          </div>

          {formData.productId && formData.fromShopId && formData.toShopId && (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                  {shops.find(s => s.id === formData.fromShopId)?.name}
                </span>
                <ArrowLeftRight className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                  {shops.find(s => s.id === formData.toShopId)?.name}
                </span>
              </div>
              <p className={`text-center text-xs mt-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Transferring {formData.quantity || 0} units of {selectedProduct?.name}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initiate Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* View Transfer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTransfer(null);
        }}
        title="Transfer Details"
        size="md"
      >
        {selectedTransfer && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Transfer Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Transfer ID:</span>
                  <p className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{selectedTransfer.id}</p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date:</span>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(selectedTransfer.date).toLocaleString('en-US')}
                  </p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Product:</span>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransfer.productName}</p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity:</span>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransfer.quantity} units</p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>From Shop:</span>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransfer.fromShopName}</p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>To Shop:</span>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransfer.toShopName}</p>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTransfer.status)}`}>
                    {getStatusIcon(selectedTransfer.status)}
                    <span className="ml-1 capitalize">{selectedTransfer.status}</span>
                  </span>
                </div>
                <div>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTransfer.priority || 'normal')}`}>
                    {(selectedTransfer.priority || 'normal').charAt(0).toUpperCase() + (selectedTransfer.priority || 'normal').slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {selectedTransfer.reason && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reason
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} capitalize`}>
                  {selectedTransfer.reason.replace('_', ' ')}
                </p>
              </div>
            )}

            {selectedTransfer.notes && (
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notes
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTransfer.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};