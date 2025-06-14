// src/pages/Items.jsx (without Quagga)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const Items = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    size: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    taxRate: '',
    stock: '',
  });
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/items');
      setItems(response.data);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    const message = error.response?.data?.error || defaultMessage;
    setError(message);
    toast.error(message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const validateItemForm = (item) => {
    if (!item.name) return 'Name is required';
    if (item.costPrice < 0) return 'Cost price cannot be negative';
    if (item.sellingPrice < 0) return 'Selling price cannot be negative';
    if (item.taxRate < 0 || item.taxRate > 100) return 'Tax rate must be between 0 and 100';
    if (item.stock < 0) return 'Stock cannot be negative';
    if (item.barcode && !/^[A-Za-z0-9]+$/.test(item.barcode)) return 'Barcode must be alphanumeric';
    return '';
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const validationError = validateItemForm(newItem);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }

    try {
      await api.post('/items', {
        ...newItem,
        costPrice: parseFloat(newItem.costPrice) || 0,
        sellingPrice: parseFloat(newItem.sellingPrice) || 0,
        taxRate: parseFloat(newItem.taxRate) || 0,
        stock: parseInt(newItem.stock) || 0,
      });
      setShowAddModal(false);
      setNewItem({
        name: '',
        type: '',
        size: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        taxRate: '',
        stock: '',
      });
      fetchItems();
      toast.success('Item added successfully');
    } catch (error) {
      handleApiError(error, 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const validationError = validateItemForm(editItem);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }

    try {
      await api.put(`/items/${editItem._id}`, {
        ...editItem,
        costPrice: parseFloat(editItem.costPrice) || 0,
        sellingPrice: parseFloat(editItem.sellingPrice) || 0,
        taxRate: parseFloat(editItem.taxRate) || 0,
        stock: parseInt(editItem.stock) || 0,
      });
      setShowEditModal(false);
      setEditItem(null);
      fetchItems();
      toast.success('Item updated successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
      toast.success('Item deleted successfully');
    } catch (error) {
      handleApiError(error, 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);
    const name = item.name?.toLowerCase() || '';
    const type = item.type?.toLowerCase() || '';
    const size = item.size?.toLowerCase() || '';
    const barcode = item.barcode?.toLowerCase() || '';
    return keywords.every(
      (keyword) =>
        new RegExp(keyword).test(name) ||
        new RegExp(keyword).test(type) ||
        new RegExp(keyword).test(size) ||
        new RegExp(keyword).test(barcode)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Item Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Add Item
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>
      )}
      {loading && (
        <div className="text-blue-600 bg-blue-100 p-3 rounded-lg mb-4">Loading...</div>
      )}

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search items by name, type, size, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-3">Name</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-left py-2 px-3">Size</th>
              <th className="text-right py-2 px-3">Barcode</th>
              <th className="text-right py-2 px-3">Cost Price</th>
              <th className="text-right py-2 px-3">Selling Price</th>
              <th className="text-right py-2 px-3">Tax Rate (%)</th>
              <th className="text-right py-2 px-3">Stock</th>
              <th className="text-right py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="py-2 px-3">{item.name}</td>
                <td className="py-2 px-3">{item.type || '-'}</td>
                <td className="py-2 px-3">{item.size || '-'}</td>
                <td className="text-right py-2 px-3">{item.barcode || '-'}</td>
                <td className="text-right py-2 px-3">Rs. {item.costPrice.toFixed(2)}</td>
                <td className="text-right py-2 px-3">Rs. {item.sellingPrice.toFixed(2)}</td>
                <td className="text-right py-2 px-3">{item.taxRate || 0}</td>
                <td className="text-right py-2 px-3">{item.stock}</td>
                <td className="text-right py-2 px-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-gray-500 text-center py-4">No items found.</div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Item</h2>
            {error && (
              <div className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Name *"
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                placeholder="Type"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={newItem.size}
                onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                placeholder="Size"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={newItem.barcode}
                onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                placeholder="Barcode"
                className="p-2 border rounded"
              />
              <input
                type="number"
                value={newItem.costPrice}
                onChange={(e) => setNewItem({ ...newItem, costPrice: e.target.value })}
                placeholder="Cost Price *"
                className="p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                value={newItem.sellingPrice}
                onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })}
                placeholder="Selling Price *"
                className="p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                value={newItem.taxRate}
                onChange={(e) => setNewItem({ ...newItem, taxRate: e.target.value })}
                placeholder="Tax Rate (%)"
                className="p-2 border rounded"
                min="0"
                max="100"
                step="0.01"
              />
              <input
                type="number"
                value={newItem.stock}
                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                placeholder="Stock *"
                className="p-2 border rounded"
                min="0"
                step="1"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Item</h2>
            {error && (
              <div className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleEditItem} className="flex flex-col gap-4">
              <input
                type="text"
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                placeholder="Name *"
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                value={editItem.type}
                onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                placeholder="Type"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={editItem.size}
                onChange={(e) => setEditItem({ ...editItem, size: e.target.value })}
                placeholder="Size"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={editItem.barcode}
                onChange={(e) => setEditItem({ ...editItem, barcode: e.target.value })}
                placeholder="Barcode"
                className="p-2 border rounded"
              />
              <input
                type="number"
                value={editItem.costPrice}
                onChange={(e) => setEditItem({ ...editItem, costPrice: e.target.value })}
                placeholder="Cost Price *"
                className="p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                value={editItem.sellingPrice}
                onChange={(e) => setEditItem({ ...editItem, sellingPrice: e.target.value })}
                placeholder="Selling Price *"
                className="p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                value={editItem.taxRate}
                onChange={(e) => setEditItem({ ...editItem, taxRate: e.target.value })}
                placeholder="Tax Rate (%)"
                className="p-2 border rounded"
                min="0"
                max="100"
                step="0.01"
              />
              <input
                type="number"
                value={editItem.stock}
                onChange={(e) => setEditItem({ ...editItem, stock: e.target.value })}
                placeholder="Stock *"
                className="p-2 border rounded"
                min="0"
                step="1"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Updating...' : 'Update Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;