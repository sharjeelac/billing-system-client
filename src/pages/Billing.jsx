import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaSearch, FaUserPlus } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import api from '../../api';

const BillPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0); // Added markup state
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', accountNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
    generateBillNumber();
  }, []);

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

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setAllCustomers(response.data);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const response = await api.get('/bills');
      const count = response.data.length + 1;
      setBillNumber(`BILL-${year}-${count.toString().padStart(3, '0')}`);
    } catch (error) {
      handleApiError(error, 'Failed to generate bill number');
    }
  };

  const handleApiError = (error, defaultMessage) => {
    const message = error.response?.data?.error || defaultMessage;
    setError(message);
    toast.error(message);
  };

  const validateCustomerForm = () => {
    const { name, phone, accountNumber } = newCustomer;
    if (!name || !phone || !accountNumber) return 'Name, phone, and account number are required';
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be 10 digits';
    if (!/^[A-Za-z0-9-]+$/.test(accountNumber)) return 'Account number must be alphanumeric with dashes';
    return '';
  };

  const searchCustomers = (term) => {
    if (!term.trim()) {
      setFilteredCustomers([]);
      return;
    }
    const searchTerm = term.toLowerCase().trim();
    const results = allCustomers.filter(customer => {
      return (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toString().includes(searchTerm) ||
        customer.accountNumber?.toString().includes(searchTerm)
      );
    });
    setFilteredCustomers(results);
  };

  const selectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
    setFilteredCustomers([]);
  };

  const addCustomer = async (e) => {
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
      const response = await api.post('/customers', {
        ...newCustomer,
        balance: 0,
      });
      setCustomer(response.data);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', address: '', accountNumber: '' });
      await fetchCustomers();
      toast.success('Customer added successfully');
    } catch (error) {
      handleApiError(error, 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm?.trim()) return true;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);
    const name = item.name?.toLowerCase() || '';
    const type = item.type?.toLowerCase() || '';
    const size = item.size?.toLowerCase() || '';
    return keywords.every(
      keyword =>
        new RegExp(keyword).test(name) ||
        new RegExp(keyword).test(type) ||
        new RegExp(keyword).test(size)
    );
  });

  const addToBill = (item) => {
    if (item.stock < 1) {
      toast.warn('Item out of stock!');
      return;
    }
    const existing = billItems.find(b => b.itemId === item._id);
    if (existing) {
      if (existing.qty + 1 > item.stock) {
        toast.warn('Cannot add more than available stock!');
        return;
      }
      setBillItems(
        billItems.map(b =>
          b.itemId === item._id
            ? { ...b, qty: b.qty + 1, total: (b.qty + 1) * (b.customPrice || b.unitPrice) }
            : b
        )
      );
    } else {
      setBillItems([
        ...billItems,
        {
          itemId: item._id,
          name: item.name,
          type: item.type,
          size: item.size,
          qty: 1,
          unitPrice: item.sellingPrice,
          customPrice: item.sellingPrice, // Initialize customPrice
          unitCost: item.costPrice,
          total: item.sellingPrice,
        },
      ]);
    }
  };

  const updateQty = (index, qty) => {
    if (qty < 1) return;
    const item = items.find(i => i._id === billItems[index].itemId);
    if (qty > item.stock) {
      toast.warn('Quantity exceeds available stock!');
      return;
    }
    const updated = [...billItems];
    updated[index].qty = qty;
    updated[index].total = qty * (updated[index].customPrice || updated[index].unitPrice);
    setBillItems(updated);
  };

  const updateCustomPrice = (index, price) => {
    const updated = [...billItems];
    updated[index].customPrice = parseFloat(price) || updated[index].unitPrice;
    updated[index].total = updated[index].qty * updated[index].customPrice;
    setBillItems(updated);
  };

  const removeFromBill = (index) => {
    const updated = [...billItems];
    updated.splice(index, 1);
    setBillItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const markupAmount = (subtotal * Math.max(0, Math.min(100, markup))) / 100;
    const markedUpSubtotal = subtotal + markupAmount;
    const discountAmount = (markedUpSubtotal * Math.max(0, Math.min(100, discount))) / 100;
    const grandTotal = markedUpSubtotal - discountAmount;
    const totalCost = billItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
    const profit = grandTotal - totalCost;
    const paid = paymentMethod === 'cash' ? grandTotal : parseFloat(amountPaid) || 0;
    const remaining = grandTotal - paid;
    const newBalance = customer ? (customer.balance || 0) + remaining : 0;
    return {
      subtotal: subtotal.toFixed(2),
      markup: markupAmount.toFixed(2),
      discount: discountAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      profit: profit.toFixed(2),
      remaining: remaining.toFixed(2),
      newBalance: newBalance.toFixed(2),
    };
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    if (!billItems.length) {
      setError('No items in bill!');
      toast.error('No items in bill!');
      setLoading(false);
      return;
    }
    if (!customer) {
      setError('Please select a customer!');
      toast.error('Please select a customer!');
      setLoading(false);
      return;
    }
    const totals = calculateTotals();
    const paid = paymentMethod === 'cash' ? parseFloat(totals.grandTotal) : parseFloat(amountPaid) || 0;
    if (paymentMethod === 'credit' && paid > parseFloat(totals.grandTotal)) {
      setError('Amount paid cannot exceed the grand total!');
      toast.error('Amount paid cannot exceed the grand total!');
      setLoading(false);
      return;
    }
    const billData = {
      customerId: customer._id,
      items: billItems.map(item => ({
        itemId: item.itemId,
        quantity: item.qty,
        unitPrice: item.unitPrice,
        customPrice: item.customPrice, // Include customPrice
        unitCost: item.unitCost,
        total: item.total,
        totalCost: item.qty * item.unitCost,
      })),
      subtotal: parseFloat(totals.subtotal),
      markup: parseFloat(markup), // Include markup
      discount: parseFloat(discount),
      grandTotal: parseFloat(totals.grandTotal),
      paymentType: paymentMethod,
      partialPayment: paid,
      status: paid >= parseFloat(totals.grandTotal) ? 'completed' : 'pending',
    };
    try {
      const response = await api.post('/bills', billData);
      const { bill, transactions } = response.data;
      if (!bill || !bill._id) {
        throw new Error('Invalid bill response from server');
      }
      const updatedCustomer = await api.get(`/customers/${customer._id}`);
      setCustomer(updatedCustomer.data);
      setBillItems([]);
      setCustomer(null);
      setAmountPaid('');
      setPaymentMethod('cash');
      setDiscount(0);
      setMarkup(0);
      setSearchTerm('');
      generateBillNumber();
      fetchItems();
      fetchCustomers();
      toast.success(
        `Bill #${bill._id.toString().slice(-6)} saved successfully! Transactions: ${transactions
          .map(tx => `${tx.type}: Rs. ${Math.abs(tx.amount).toFixed(2)} (${tx.description})`)
          .join(', ')}`
      );
    } catch (error) {
      handleApiError(error, 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const totals = calculateTotals();
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 14px; }
            .header { text-align: center; margin-bottom: 20px; }
            .shop-name { font-size: 20px; font-weight: bold; }
            .shop-address { font-size: 12px; margin: 5px 0; }
            .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">PAKISTAN HARDWARE PVT LTD</div>
            <div class="shop-address">PAKISTAN CHOWK MARDAN</div>
            <div class="shop-address">PHONE: +9213456789</div>
          </div>
          <div class="bill-info">
            <div>Bill No: ${billNumber}</div>
            <div>Customer: ${customer?.name || 'N/A'}</div>
            <div>Date: ${new Date(billDate).toLocaleDateString('en-GB')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems
                .map(
                  (item, index) => `
                    <tr key="${index}">
                      <td>${item.name} ${item.type} ${item.size ? `(${item.size})` : ''}</td>
                      <td>${item.qty}</td>
                      <td>Rs. ${(item.customPrice || item.unitPrice).toFixed(2)}</td>
                      <td>Rs. ${item.total.toFixed(2)}</td>
                    </tr>
                  `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3">Subtotal</td>
                <td>Rs. ${totals.subtotal}</td>
              </tr>
              <tr>
                <td colspan="3">Markup (${markup}%)</td>
                <td>+Rs. ${totals.markup}</td>
              </tr>
              <tr>
                <td colspan="3">Discount (${discount}%)</td>
                <td>-Rs. ${totals.discount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Grand Total</td>
                <td>Rs. ${totals.grandTotal}</td>
              </tr>
              <tr>
                <td colspan="3">Amount Paid</td>
                <td>Rs. ${(paymentMethod === 'cash' ? parseFloat(totals.grandTotal) : parseFloat(amountPaid) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3">Remaining Amount</td>
                <td>Rs. ${totals.remaining}</td>
              </tr>
              ${customer ? `
                <tr>
                  <td colspan="3">Current Customer Balance</td>
                  <td>Rs. ${(customer.balance || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3">New Customer Balance</td>
                  <td>Rs. ${totals.newBalance}</td>
                </tr>
              ` : ''}
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

  return (
    <div className="flex gap-4 p-6 bg-gray-100 min-h-screen max-h-[100vh]">
      {/* Left: Item Search */}
      <div className="w-3/5 bg-white p-6 rounded-xl shadow-lg">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search items..."
            className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}
        {loading && <div className="text-blue-600 bg-blue-100 p-3 rounded-lg mb-4">Loading...</div>}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {filteredItems.map(item => (
            <div
              key={item._id}
              className="flex justify-between items-center p-4 border bg-white rounded-xl shadow hover:shadow-md"
            >
              <div className="flex-1">
                <div className="font-semibold text-lg">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {item.type} {item.size && `| Size: ${item.size}`} | Stock: {item.stock}
                </div>
              </div>
              <div className="mx-4 font-medium">Rs. {item.sellingPrice.toFixed(2)}</div>
              <button
                onClick={() => addToBill(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                disabled={item.stock < 1}
              >
                Add
              </button>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-gray-500 text-center">No items found.</div>
          )}
        </div>
      </div>

      {/* Right: Bill Details */}
      <div className="w-2/5 bg-white p-6 rounded-xl shadow-lg flex flex-col space-y-4 max-h-[100vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">Bill</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={billNumber}
              onChange={e => setBillNumber(e.target.value)}
              placeholder="Bill No"
              className="w-24 p-1 border rounded text-sm"
            />
            <input
              type="date"
              value={billDate}
              onChange={e => setBillDate(e.target.value)}
              className="p-1 border rounded text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          {customer ? (
            <div className="p-2 bg-blue-50 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm">Account: {customer.accountNumber}</div>
                  <div
                    className={`text-sm ${
                      customer.balance < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    Balance: Rs. {customer.balance.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left flex items-center gap-2"
              >
                <FaUserPlus /> Add Customer
              </button>
              {showCustomerSearch && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow-lg">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      className="w-full p-2 border rounded"
                      value={customerSearchTerm}
                      onChange={e => {
                        setCustomerSearchTerm(e.target.value);
                        if (searchTimeout) clearTimeout(searchTimeout);
                        setSearchTimeout(setTimeout(() => {
                          searchCustomers(e.target.value);
                        }, 300));
                      }}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCustomers.map(cust => (
                      <div
                        key={cust._id}
                        onClick={() => selectCustomer(cust)}
                        className="p-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <div>{cust.name}</div>
                        <div className="text-sm text-gray-600">
                          {cust.accountNumber} • {cust.phone}
                        </div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && customerSearchTerm && (
                      <div className="p-2 text-gray-500 text-center">
                        No customers found
                      </div>
                    )}
                    <div
                      onClick={() => {
                        setShowCustomerSearch(false);
                        setShowCustomerModal(true);
                      }}
                      className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600"
                    >
                      + New Customer
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl mb-4 font-bold">Add Customer</h2>
              {error && <div className="text-red-600 bg-red-100 p-2 rounded mb-4">{error}</div>}
              <form onSubmit={addCustomer} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Name *"
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone (10 digits) *"
                  className="w-full p-2 border rounded"
                  pattern="\d{10}"
                  required
                />
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Address"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  value={newCustomer.accountNumber}
                  onChange={e => setNewCustomer({ ...newCustomer, accountNumber: e.target.value })}
                  placeholder="Account Number *"
                  className="w-full p-2 border rounded"
                  pattern="[A-Za-z0-9-]+"
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
                    {loading ? 'Adding...' : 'Add Customer'}
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

        <div className="mb-4">
          <label className="block mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {paymentMethod === 'credit' && (
          <div className="mb-4">
            <label className="block mb-1">Amount Paid</label>
            <input
              type="number"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              className="w-full p-2 border rounded"
              min="0"
              step="0.01"
              placeholder="Enter amount paid"
            />
          </div>
        )}

        <div className="overflow-y-auto flex-1 mb-4 ">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.type} {item.size && `(${item.size})`}
                    </div>
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => updateQty(index, parseInt(e.target.value) || 1)}
                      className="w-16 p-1 text-sm border rounded text-right"
                      min="1"
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      value={item.customPrice || item.unitPrice}
                      onChange={e => updateCustomPrice(index, e.target.value)}
                      className="w-20 p-1 text-sm border rounded text-right"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="text-right">Rs. {item.total.toFixed(2)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => removeFromBill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {calculateTotals().subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Markup:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={markup}
                  onChange={e => setMarkup(Math.max(0, Math.min(100, e.target.value)))}
                  className="w-16 p-1 text-sm border rounded text-right mr-2"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <span>+Rs. {calculateTotals().markup}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Math.max(0, Math.min(100, e.target.value)))}
                  className="w-16 p-1 text-sm border rounded text-right mr-2"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <span>-Rs. {calculateTotals().discount}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Grand Total:</span>
              <span>Rs. {calculateTotals().grandTotal}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Profit:</span>
              <span>Rs. {calculateTotals().profit}</span>
            </div>
            {paymentMethod === 'credit' && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid:</span>
                <span>Rs. {(parseFloat(amountPaid) || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Remaining Amount:</span>
              <span>Rs. {calculateTotals().remaining}</span>
            </div>
            {customer && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Current Customer Balance:</span>
                  <span>Rs. {(customer.balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>New Customer Balance:</span>
                  <span>Rs. {calculateTotals().newBalance}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCheckout}
              className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg ${
                loading || billItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading || billItems.length === 0}
            >
              {loading ? 'Saving...' : 'Save Bill'}
            </button>
            <button
              onClick={handlePrint}
              className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg ${
                billItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={billItems.length === 0}
            >
              Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;