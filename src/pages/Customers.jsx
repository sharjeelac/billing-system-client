import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', accountNumber: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
      setError('');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to fetch customers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const { name, phone, accountNumber } = form;
    if (!name || !phone || !accountNumber) {
      return 'Name, phone, and account number are required';
    }
    if (!/^\d{10}$/.test(phone)) {
      return 'Phone number must be 10 digits';
    }
    if (!/^[A-Za-z0-9-]+$/.test(accountNumber)) {
      return 'Account number must be alphanumeric with dashes';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }

    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added successfully');
      }
      fetchCustomers();
      setForm({ name: '', phone: '', address: '', accountNumber: '' });
      setEditId(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to save customer';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      accountNumber: customer.accountNumber,
    });
    setEditId(customer._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete their bills and transactions.')) return;
    setLoading(true);
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
      toast.success('Customer deleted successfully');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete customer';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = (customerId) => {
    window.location.href = `/transactions?customerId=${customerId}`;
  };

  const exportCustomers = () => {
    const csv = [
      ['Name', 'Phone', 'Address', 'Account Number', 'Balance'],
      ...customers.map(customer => [
        `"${customer.name.replace(/"/g, '""')}"`,
        customer.phone,
        `"${customer.address?.replace(/"/g, '""') || ''}"`,
        customer.accountNumber,
        customer.balance.toFixed(2),
      ]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Customers exported successfully');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search) ||
    customer.accountNumber.includes(search)
  );

  return (
    <div className="no-print p-6">
      <h1 className="text-3xl font-bold mb-6">Customer Management</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      <div className="flex justify-between mb-4">
        <div className="flex items-center w-1/2">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or account number..."
            className="border rounded p-2 w-full"
          />
        </div>
        <button onClick={exportCustomers} className="bg-green-600 text-white p-2 rounded">
          Export CSV
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name *"
          className="border rounded p-2"
          required
        />
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone (10 digits) *"
          className="border rounded p-2"
          pattern="\d{10}"
          required
        />
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          className="border rounded p-2"
        />
        <input
          type="text"
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          placeholder="Account Number *"
          className="border rounded p-2"
          pattern="[A-Za-z0-9-]+"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white p-2 rounded col-span-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Saving...' : editId ? 'Update Customer' : 'Add Customer'}
        </button>
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Address</th>
            <th className="p-2">Account #</th>
            <th className="p-2">Balance</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(customer => (
            <tr key={customer._id} className={`border-t ${customer.balance > 0 ? 'bg-yellow-100' : ''}`}>
              <td className="p-2">{customer.name}</td>
              <td className="p-2">{customer.phone}</td>
              <td className="p-2">{customer.address || '-'}</td>
              <td className="p-2">{customer.accountNumber}</td>
              <td className="p-2">{customer.balance.toFixed(2)}</td>
              <td className="p-2 flex space-x-2">
                <button onClick={() => handleEdit(customer)} className="text-blue-600">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(customer._id)} className="text-red-600">
                  <FaTrash />
                </button>
                <button onClick={() => handleViewTransactions(customer._id)} className="text-green-600">
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;