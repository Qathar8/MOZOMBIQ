import React, { useState } from 'react';
import { Plus, Download, DollarSign, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { exportToExcel } from '../utils/excelUtils';

export const Sales: React.FC = () => {
  const { sales, products, shops, addSale } = useData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const availableStock = selectedProductData && selectedShop 
    ? selectedProductData.stock[selectedShop] || 0 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedShop || !quantity) {
      error('Please fill in all fields');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const shop = shops.find(s => s.id === selectedShop);
    
    if (!product || !shop) {
      error('Invalid product or shop selected');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum > availableStock) {
      error(`Insufficient stock. Available: ${availableStock}`);
      return;
    }

    addSale({
      productId: product.id,
      productName: product.name,
      shopId: shop.id,
      shopName: shop.name,
      quantity: quantityNum,
      unitPrice: product.price,
      totalAmount: product.price * quantityNum,
      userId: user?.id || '1'
    });

    success('Sale recorded successfully!');
    setIsAddModalOpen(false);
    setSelectedProduct('');
    setSelectedShop('');
    setQuantity('1');
  };

  const handleExport = () => {
    const exportData = sales.map(sale => ({
      'Sale ID': sale.id,
      'Product': sale.productName,
      'Shop': sale.shopName,
      'Quantity': sale.quantity,
      'Unit Price': sale.unitPrice,
      'Total Amount': sale.totalAmount,
      'Date': new Date(sale.date).toLocaleString(),
      'Recorded By': sale.userId
    }));
    
    exportToExcel(exportData, 'sales');
    success('Sales data exported successfully!');
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todaySales = sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.date);
    return today.toDateString() === saleDate.toDateString();
  });
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">Record and manage your sales transactions</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Sale
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalSales.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${todayTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{todaySales.length} transactions</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Sale</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.slice().reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {sale.shopName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sales.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sales recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Sale Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedProduct('');
          setSelectedShop('');
          setQuantity('1');
        }}
        title="Record New Sale"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a shop</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name} - {shop.location}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a product</option>
              {products
                .filter(product => !selectedShop || (product.stock[selectedShop] || 0) > 0)
                .map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toFixed(2)}
                    {selectedShop && ` (Stock: ${product.stock[selectedShop] || 0})`}
                  </option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              max={availableStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {selectedProduct && selectedShop && (
              <p className="text-sm text-gray-500 mt-1">
                Available stock: {availableStock} units
              </p>
            )}
          </div>

          {selectedProductData && quantity && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${(selectedProductData.price * parseInt(quantity)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setSelectedProduct('');
                setSelectedShop('');
                setQuantity('1');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Record Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};