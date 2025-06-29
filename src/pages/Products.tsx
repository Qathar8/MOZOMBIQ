import React, { useState, useRef } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { exportToExcel, parseExcelFile } from '../utils/excelUtils';
import { Product } from '../types';

export const Products: React.FC = () => {
  const { products, shops, addProduct, updateProduct, deleteProduct } = useApp();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    minStock: '',
    stock: shops.reduce((acc, shop) => ({ ...acc, [shop.id]: '0' }), {})
  });

  const categories = [...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      minStock: '',
      stock: shops.reduce((acc, shop) => ({ ...acc, [shop.id]: '0' }), {})
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        minStock: parseInt(formData.minStock) || 10,
        stock: Object.keys(formData.stock).reduce((acc, shopId) => ({
          ...acc,
          [shopId]: parseInt(formData.stock[shopId]) || 0
        }), {})
      });
      success('Product updated successfully!');
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        minStock: parseInt(formData.minStock) || 10,
        stock: Object.keys(formData.stock).reduce((acc, shopId) => ({
          ...acc,
          [shopId]: parseInt(formData.stock[shopId]) || 0
        }), {})
      });
      success('Product added successfully!');
      setIsAddModalOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      minStock: product.minStock.toString(),
      stock: Object.keys(product.stock).reduce((acc, shopId) => ({
        ...acc,
        [shopId]: product.stock[shopId]?.toString() || '0'
      }), {})
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.id);
      success('Product deleted successfully!');
    }
  };

  const handleExport = () => {
    const exportData = products.map(product => ({
      Name: product.name,
      Category: product.category,
      Price: product.price,
      'Min Stock': product.minStock,
      ...shops.reduce((acc, shop) => ({
        ...acc,
        [`Stock_${shop.name.replace(/\s+/g, '_')}`]: product.stock[shop.id] || 0
      }), {}),
      'Total Stock': Object.values(product.stock).reduce((sum, qty) => sum + qty, 0),
      'Stock Value': Object.values(product.stock).reduce((sum, qty) => sum + qty, 0) * product.price,
      'Created Date': new Date(product.createdAt).toLocaleDateString()
    }));
    
    exportToExcel(exportData, 'products');
    success('Products exported successfully!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      setImportData(data);
      setIsImportModalOpen(true);
    } catch (err) {
      error('Failed to parse file. Please check the format.');
    }
  };

  const handleImport = () => {
    let imported = 0;
    importData.forEach(item => {
      if (item.Name && item.Category && item.Price) {
        const stock = shops.reduce((acc, shop) => ({
          ...acc,
          [shop.id]: parseInt(item[`Stock_${shop.name.replace(/\s+/g, '_')}`]) || 0
        }), {});

        addProduct({
          name: item.Name,
          category: item.Category,
          price: parseFloat(item.Price) || 0,
          minStock: parseInt(item['Min Stock']) || 10,
          stock
        });
        imported++;
      }
    });
    
    success(`Imported ${imported} products successfully!`);
    setIsImportModalOpen(false);
    setImportData([]);
  };

  const ProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter product name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <input
            type="text"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter category"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
          <input
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stock by Shop</label>
        <div className="grid grid-cols-2 gap-4">
          {shops.map(shop => (
            <div key={shop.id}>
              <label className="block text-xs text-gray-500 mb-1">{shop.name}</label>
              <input
                type="number"
                min="0"
                value={formData.stock[shop.id] || '0'}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, [shop.id]: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => {
            if (editingProduct) {
              setIsEditModalOpen(false);
              setEditingProduct(null);
            } else {
              setIsAddModalOpen(false);
            }
            resetForm();
          }}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {editingProduct ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory across all shops</p>
        </div>
        
        <div className="flex space-x-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          
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
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                {shops.map(shop => (
                  <th key={shop.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {shop.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
                const isLowStock = totalStock < product.minStock;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">Created {new Date(product.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    {shops.map(shop => (
                      <td key={shop.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`font-medium ${(product.stock[shop.id] || 0) < (product.minStock / shops.length) ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock[shop.id] || 0}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center">
                        <span className={isLowStock ? 'text-red-600' : 'text-gray-900'}>
                          {totalStock}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-1" title="Low stock alert" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingProduct(null);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <ProductForm />
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportData([]);
        }}
        title="Import Products Preview"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Review the data below before importing:</p>
          
          <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {importData[0] && Object.keys(importData[0]).map(key => (
                    <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {importData.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="px-4 py-2 text-gray-600">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {importData.length > 10 && (
            <p className="text-sm text-gray-500">
              Showing first 10 rows. Total: {importData.length} products
            </p>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportData([]);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import {importData.length} Products
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};