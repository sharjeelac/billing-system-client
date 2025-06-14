import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaSearch, FaFileInvoice, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billError, setBillError] = useState('');
  const [customerForm, setCustomerForm] = useState({ id: '', name: '', phone: '', address: '', accountNumber: '', balance : "" });
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', paymentMethod: 'cash' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('customerId');
    if (customerId) {
      fetchCustomerById(customerId);
    }
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerById = async (customerId) => {
    setLoading(true);
    try {
      const response = await api.get(`/customers/${customerId}`);
      setSelectedCustomer(response.data);
      fetchTransactions(customerId);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (customerId) => {
    setLoading(true);
    try {
      const response = await api.get(`/transactions?customerId=${customerId}`);
      setTransactions(response.data);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBill = async (billId) => {
    setLoading(true);
    try {
      const response = await api.get(`/bills/${billId}`);
      setSelectedBill(response.data);
      setBillError('');
      setShowBillModal(true);
    } catch (error) {
      setBillError(error.response?.data?.error || 'Failed to fetch bill details');
      setSelectedBill(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    const message = error.response?.data?.error || defaultMessage;
    setError(message);
    toast.error(message);
  };

  const validateCustomerForm = () => {
    const { name, phone, accountNumber, balance } = customerForm;
    if (!name || !phone || !accountNumber) return 'Name, phone, and account number are required';
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be 10 digits';
    if (!/^[A-Za-z0-9-]+$/.test(accountNumber)) return 'Account number must be alphanumeric with dashes';
    return '';
  };

  const handleAddCustomer = () => {
    setCustomerForm({ id: '', name: '', phone: '', address: '', accountNumber: '', balance : '' });
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    setCustomerForm({
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      accountNumber: customer.accountNumber,
      balance: customer.balance,
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateCustomerForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }

    try {
      if (customerForm.id) {
        await api.put(`/customers/${customerForm.id}`, customerForm);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', customerForm);
        toast.success('Customer added successfully');
      }
      setShowCustomerModal(false);
      fetchCustomers();
      if (selectedCustomer?._id === customerForm.id) {
        setSelectedCustomer({ ...selectedCustomer, ...customerForm });
      }
    } catch (error) {
      handleApiError(error, 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete their bills and transactions.')) return;
    setLoading(true);
    try {
      await api.delete(`/customers/${customerId}`);
      fetchCustomers();
      if (selectedCustomer?._id === customerId) {
        setSelectedCustomer(null);
        setTransactions([]);
      }
      toast.success('Customer deleted successfully');
    } catch (error) {
      handleApiError(error, 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    fetchTransactions(customer._id);
    window.history.replaceState(null, '', `/customers?customerId=${customer._id}`);
  };

  const handleAddPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentForm({ amount: '', description: '', paymentMethod: 'cash' });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { amount, paymentMethod } = paymentForm;
    if (!amount || parseFloat(amount) <= 0) {
      setError('Payment amount must be greater than 0');
      toast.error('Payment amount must be greater than 0');
      setLoading(false);
      return;
    }
    if (!['cash', 'credit'].includes(paymentMethod)) {
      setError('Invalid payment method');
      toast.error('Invalid payment method');
      setLoading(false);
      return;
    }

    try {
      await api.post('/payments', {
        customerId: selectedCustomer._id,
        amount: parseFloat(amount),
        paymentMethod,
        description: paymentForm.description || `Payment for ${selectedCustomer.name}`,
      });
      setShowPaymentModal(false);
      fetchCustomers();
      fetchTransactions(selectedCustomer._id);
      toast.success('Payment recorded successfully');
    } catch (error) {
      handleApiError(error, 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (billId) => {
    fetchBill(billId);
  };

  const handleExportTransactions = () => {
    if (!transactions.length) {
      toast.warn('No transactions to export');
      return;
    }
    const csv = [
      ['Date', 'Type', 'Description', 'Amount'],
      ...transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString('en-GB'),
        tx.type,
        `"${(tx.description || 'Manual payment').replace(/"/g, '""')}"`,
        (tx.amount || 0).toFixed(2), // Fixed error here
      ]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${selectedCustomer?.accountNumber || 'customer'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  const handlePrintTransactions = () => {
    if (!selectedCustomer || !transactions.length) {
      toast.warn('No transactions to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 14px; }
            .header { text-align: center; margin-bottom: 20px; }
            .shop-name { font-size: 20px; font-weight: bold; }
            .shop-address { font-size: 12px; margin: 5px 0; }
            .customer-info { margin-bottom: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">PAKISTAN HARDWARE PVT LTD</div>
            <div class="shop-address">PAKISTAN CHOWK MARDAN</div>
            <div class="shop-address">PHONE: +9213456789</div>
          </div>
          <div class="customer-info">
            <div>Customer: ${selectedCustomer.name || 'N/A'}</div>
            <div>Account: ${selectedCustomer.accountNumber || 'N/A'}</div>
            <div>Phone: ${selectedCustomer.phone || 'N/A'}</div>
            <div>Balance: Rs. ${(selectedCustomer.balance || 0).toFixed(2)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  tx => `
                    <tr>
                      <td>${new Date(tx.createdAt).toLocaleDateString('en-GB')}</td>
                      <td>${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
                      <td>${
                        tx.type === 'bill' && tx.billId
                          ? `Bill #${tx.billId._id.toString().slice(-6)} (${tx.billId.items?.length || 0} items)`
                          : tx.type === 'payment'
                          ? tx.description || 'Manual payment'
                          : 'N/A'
                      }</td>
                      <td class="text-right">Rs. ${(tx.amount || 0).toFixed(2)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            <div>E & O.E</div>
            <div>Thank You</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm.trim()) return true;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);
    const name = customer.name?.toLowerCase() || '';
    const phone = customer.phone?.toLowerCase() || '';
    const accountNumber = customer.accountNumber?.toLowerCase() || '';
    return keywords.every(
      keyword =>
        new RegExp(keyword).test(name) ||
        new RegExp(keyword).test(phone) ||
        new RegExp(keyword).test(accountNumber)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <button
          onClick={handleAddCustomer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Add Customer
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>
      )}
      {loading && (
        <div className="text-blue-600 bg-blue-100 p-3 rounded-lg mb-4">Loading...</div>
      )}

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, phone, or account number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Customer List */}
        <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Customers</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredCustomers.map(customer => (
              <div
                key={customer._id}
                className={`p-3 rounded-md cursor-pointer hover:bg-blue-50 ${
                  selectedCustomer?._id === customer._id ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleSelectCustomer(customer)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.accountNumber}</div>
                    <div
                      className={`text-sm ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      Balance: Rs. {(customer.balance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-gray-500 text-center">No customers found.</div>
            )}
          </div>
        </div>

        {/* Customer Details and Transactions */}
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
          {selectedCustomer ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">
                  {selectedCustomer.name} ({selectedCustomer.accountNumber})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintTransactions}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!transactions.length}
                  >
                    <FaPrint /> Print Transactions
                  </button>
                  <button
                    onClick={handleExportTransactions}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!transactions.length}
                  >
                    Export Transactions
                  </button>
                  <button
                    onClick={() => handleAddPayment(selectedCustomer)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FaMoneyBillWave /> Add Payment
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <p>Phone: {selectedCustomer.phone || 'N/A'}</p>
                <p>Address: {selectedCustomer.address || 'N/A'}</p>
                <p
                  className={`font-semibold ${
                    selectedCustomer.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Balance: Rs. {(selectedCustomer.balance || 0).toFixed(2)}
                </p>
              </div>
              <h3 className="text-md font-semibold mb-2">Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Details</th>
                        <th className="text-right py-2 px-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx._id} className="border-b">
                          <td className="py-2 px-3">{formatDate(tx.createdAt)}</td>
                          <td className="py-2 px-3">
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </td>
                          <td className="py-2 px-3">
                            {tx.type === 'bill' && tx.billId ? (
                              <button
                                onClick={() => handleViewBill(tx.billId._id)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <FaFileInvoice />
                                Bill #{tx.billId._id.toString().slice(-6)} ({tx.billId.items?.length || 0} items)
                              </button>
                            ) : tx.type === 'payment' ? (
                              <span>{tx.description || 'Manual payment'}</span>
                            ) : (
                              <span className="text-gray-500">Details not available</span>
                            )}
                          </td>
                          <td
                            className={`text-right py-2 px-3 ${
                              tx.amount < 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            Rs. {(tx.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No transactions found for this customer.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select a customer to view details</p>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4 font-bold">{customerForm.id ? 'Edit Customer' : 'Add Customer'}</h2>
            {error && (
              <div className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleSaveCustomer} className="flex flex-col gap-4">
              <input
                type="text"
                value={customerForm.name}
                onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Name *"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                type="text"
                value={customerForm.phone}
                onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="Phone (10 digits) *"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                pattern="\d{10}"
                required
              />
              <input
                type="text"
                value={customerForm.address}
                onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="Address"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                value={customerForm.accountNumber}
                onChange={e => setCustomerForm({ ...customerForm, accountNumber: e.target.value })}
                placeholder="Account Number *"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                pattern="[A-Za-z0-9-]+"
                required
              />
              <input
                type="number"
                value={customerForm.balance}
                onChange={e => setCustomerForm({ ...customerForm, balance: e.target.value })}
                placeholder="balance *"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4 font-bold">Record Payment for {selectedCustomer.name}</h2>
            {error && (
              <div className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleSavePayment} className="flex flex-col gap-4">
              <input
                type="number"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="Amount *"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                min="0.01"
                step="0.01"
                required
              />
              <select
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
              <input
                type="text"
                value={paymentForm.description}
                onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {showBillModal && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
      <div className="text-xl mb-4">
        <h3 className="font-bold">Bill Details</h3>
      </div>
      {billError && (
        <div className="text-red-600 bg-red-100 p-3 rounded mb-4">{billError}</div>
      )}
      {selectedBill ? (
        <div>
          <div className="mb-4">
            <p>
              <strong>Bill ID#:</strong> {selectedBill._id.toString().slice(-6)}
            </p>
            <p>
              <strong>Customer Name:</strong> {selectedBill.customerId?.name || 'N/A'}
            </p>
            <p>
              <strong>Date:</strong> {formatDate(selectedBill.createdAt)}
            </p>
            <p>
              <strong>Payment Method:</strong> {selectedBill.paymentType || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong>
              <span
                className={`${
                  selectedBill.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
              </span>
            </p>
          </div>
          <div className="text-md font-semibold mb-2">
            <h3>Items</h3>
          </div>
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-2 px-3">Item</th>
                <th className="text-right py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Unit Price</th>
                <th className="text-right py-2 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedBill.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-3">
                    <div className="font-medium">{item.itemId?.name || 'Unknown Item'}</div>
                    <div className="text-sm text-gray-600">
                      {item.itemId?.type || ''} {item.itemId?.size && `(${item.itemId.size})`}
                    </div>
                  </td>
                  <td className="text-right py-2 px-3">{item.quantity}</td>
                  <td className="text-right py-2 px-3">Rs. {(item.customPrice || item.unitPrice || 0).toFixed(2)}</td>
                  <td className="text-right py-2 px-3">Rs. {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right">
            <p>
              <strong>Subtotal:</strong> Rs. {selectedBill.subtotal.toFixed(2)}
            </p>
            <p>
              <strong>Markup:</strong> {selectedBill.markup || 0}% (+Rs. {((selectedBill.subtotal * (selectedBill.markup || 0)) / 100).toFixed(2)})
            </p>
            <p>
              <strong>Discount:</strong> {selectedBill.discountTotal || 0}% (-Rs. {((selectedBill.subtotal * (selectedBill.discountTotal || 0)) / 100).toFixed(2)})
            </p>
            <p>
              <strong>Grand Total:</strong> Rs. {selectedBill.grandTotal.toFixed(2)}
            </p>
            <p>
              <strong>Amount Paid:</strong> Rs. {selectedBill.partialPayment.toFixed(2)}
            </p>
            <p>
              <strong>Remaining Amount:</strong> Rs. {(selectedBill.grandTotal - selectedBill.partialPayment).toFixed(2)}
            </p>
            <p>
              <strong>Customer Balance (Post-Bill):</strong> Rs. {((selectedBill.customerId?.balance || 0))}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading bill details...</p>
      )}
      <button
        onClick={() => setShowBillModal(false)}
        className="mt-4 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded w-full"
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default CustomersPage;