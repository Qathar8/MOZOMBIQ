import React, { useState } from 'react';
import { ArrowLeftRight, Plus, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';

export const StockTransfers: React.FC = () => {
  const { stockTransfers, products, shops, addStockTransfer } = useData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    fromShopId: '',
    toShopId: '',
    quantity: ''
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const availableStock = selectedProduct && formData.fromShopId 
    ? selectedProduct.stock[formData.fromShopId] || 0 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.fromShopId || !formData.toShopId || !formData.quantity) {
      error('Please fill in all fields');
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
      userId: user?.id || '1'
    });

    success('Stock transfer completed successfully!');
    setIsAddModalOpen(false);
    setFormData({ productId: '', fromShopId: '', toShopId: '', quantity: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="text-gray-600 mt-1">Transfer inventory between your shops</p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Transfers</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stockTransfers.length}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500">
            <ArrowLeftRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transfer History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockTransfers.slice().reverse().map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transfer.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {transfer.fromShopName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {transfer.toShopName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.quantity} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transfer.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : transfer.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {stockTransfers.length === 0 && (
            <div className="text-center py-12">
              <ArrowLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stock transfers yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Transfer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ productId: '', fromShopId: '', toShopId: '', quantity: '' });
        }}
        title="New Stock Transfer"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Shop</label>
              <select
                value={formData.fromShopId}
                onChange={(e) => setFormData({ ...formData, fromShopId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">To Shop</label>
              <select
                value={formData.toShopId}
                onChange={(e) => setFormData({ ...formData, toShopId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              max={availableStock}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity to transfer"
            />
            {formData.productId && formData.fromShopId && (
              <p className="text-sm text-gray-500 mt-1">
                Available stock: {availableStock} units
              </p>
            )}
          </div>

          {formData.productId && formData.fromShopId && formData.toShopId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="font-medium text-blue-900">
                  {shops.find(s => s.id === formData.fromShopId)?.name}
                </span>
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {shops.find(s => s.id === formData.toShopId)?.name}
                </span>
              </div>
              <p className="text-center text-xs text-blue-700 mt-2">
                Transferring {formData.quantity || 0} units of {selectedProduct?.name}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ productId: '', fromShopId: '', toShopId: '', quantity: '' });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Transfer Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};