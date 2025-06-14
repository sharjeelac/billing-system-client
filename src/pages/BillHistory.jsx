import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaFileInvoice, FaPrint, FaUser, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';

const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billError, setBillError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/bills${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      setBills(response.data);
      setError('');
    } catch (error) {
      handleApiError(error, 'Failed to fetch bills');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBill = async (billId) => {
    setLoadingBill(true);
    setBillError('');
    try {
      const response = await api.get(`/bills/${billId}`);
      setSelectedBill(response.data);
      setShowBillModal(true);
    } catch (error) {
      setBillError(error.response?.data?.error || 'Failed to fetch bill details');
      setSelectedBill(null);
    } finally {
      setLoadingBill(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    const message = error.response?.data?.error || defaultMessage;
    setError(message);
    toast.error(message);
  };

  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = e => {
    setStatusFilter(e.target.value);
  };

  const handleViewBill = bill => {
    fetchBill(bill._id);
  };

  const handleViewCustomer = customerId => {
    window.location.href = `/customers?customerId=${customerId}`;
  };

  const handlePrint = bill => {
    const printWindow = window.open('', '_blank');
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
            <div>Bill No: ${bill._id.toString().slice(-6)}</div>
            <div>Customer: ${bill.customerId?.name || 'N/A'}</div>
            <div>Date: ${new Date(bill.createdAt).toLocaleDateString('en-GB')}</div>
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
              ${bill.items
                .map(
                  (item, index) => `
                    <tr key="${index}">
                      <td>${item.itemId?.name || 'Unknown Item'} ${item.itemId?.type || ''} ${
                    item.itemId?.size ? `(${item.itemId.size})` : ''
                  }</td>
                      <td>${item.quantity}</td>
                      <td>Rs. ${(item.customPrice || item.unitPrice).toFixed(2)}</td>
                      <td>Rs. ${item.total.toFixed(2)}</td>
                    </tr>
                  `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3">Subtotal</td>
                <td>Rs. ${bill.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3">Markup (${bill.markup || 0}%)</td>
                <td>+Rs. ${((bill.subtotal * (bill.markup || 0)) / 100).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3">Discount (${bill.discount || 0}%)</td>
                <td>-Rs. ${((bill.subtotal * (bill.discount || 0)) / 100).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Grand Total</td>
                <td>Rs. ${bill.grandTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3">Amount Paid</td>
                <td>Rs. ${bill.partialPayment.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3">Remaining Amount</td>
                <td>Rs. ${(bill.grandTotal - bill.partialPayment).toFixed(2)}</td>
              </tr>
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

  const handleExportBills = () => {
    if (!bills.length) {
      toast.warn('No bills to export');
      return;
    }
    const csv = [
      ['Bill ID', 'Customer', 'Date', 'Subtotal', 'Markup (%)', 'Discount (%)', 'Grand Total', 'Partial Payment', 'Remaining Amount', 'Status', 'Payment Type'],
      ...bills.map(bill => [
        bill._id.toString().slice(-6),
        `"${bill.customerId?.name?.replace(/"/g, '""') || 'N/A'}"`,
        new Date(bill.createdAt).toLocaleDateString('en-GB'),
        bill.subtotal.toFixed(2),
        bill.markup || 0,
        bill.discount || 0,
        bill.grandTotal.toFixed(2),
        bill.partialPayment.toFixed(2),
        (bill.grandTotal - bill.partialPayment).toFixed(2),
        bill.status,
        bill.paymentType,
      ]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bill_history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Bills exported successfully');
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredBills = bills.filter(bill => {
    if (!searchTerm.trim()) return true;
    const keywords = searchTerm.toLowerCase().trim().split(/\s+/);
    const customerName = bill.customerId?.name?.toLowerCase() || '';
    const billId = bill._id?.toString().toLowerCase() || '';
    const date = formatDate(bill.createdAt).toLowerCase();
    return keywords.every(
      keyword =>
        new RegExp(keyword).test(customerName) ||
        new RegExp(keyword).test(billId) ||
        new RegExp(keyword).test(date)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bill History</h1>
        <button
          onClick={handleExportBills}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>
      )}
      {loading && (
        <div className="text-blue-600 bg-blue-100 p-3 rounded-lg mb-4">Loading...</div>
      )}

      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by customer name, bill ID, or date..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Bill List */}
        <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Recent Bills</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredBills.map(bill => (
              <div
                key={bill._id}
                onClick={() => handleViewBill(bill)}
                className={`p-3 rounded-md cursor-pointer hover:bg-blue-50 ${
                  selectedBill?._id === bill._id ? 'bg-blue-100' : ''
                } ${bill.status === 'pending' ? 'bg-yellow-50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Bill #{bill._id.toString().slice(-6)}</div>
                    <div
                      className="text-sm text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      onClick={e => {
                        e.stopPropagation();
                        handleViewCustomer(bill.customerId?._id);
                      }}
                    >
                      <FaUser /> {bill.customerId?.name || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-600">{formatDate(bill.createdAt)}</div>
                    <div className="text-sm">Total: Rs. {bill.grandTotal.toFixed(2)}</div>
                  </div>
                  <div
                    className={`text-sm ${
                      bill.status === 'completed'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
            {filteredBills.length === 0 && (
              <div className="text-gray-500 text-center">No bills found.</div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
          {selectedBill && !showBillModal ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">
                  Bill #{selectedBill._id.toString().slice(-6)}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(selectedBill)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <FaPrint /> Print
                  </button>
                  <div
                    className={`text-sm px-3 py-2 rounded ${
                      selectedBill.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p>
                  Customer:{' '}
                  <span
                    className="text-blue-600 hover:underline cursor-pointer"
                    onClick={() => handleViewCustomer(selectedBill.customerId?._id)}
                  >
                    {selectedBill.customerId?.name || 'N/A'}
                  </span>
                </p>
                <p>Payment Type: {selectedBill.paymentType}</p>
                <p>Date: {formatDate(selectedBill.createdAt)}</p>
              </div>
              <h3 className="text-md font-semibold mb-2">Items</h3>
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b bg-gray-50">
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
                      <td className="text-right py-2 px-3">Rs. {(item.customPrice || item.unitPrice).toFixed(2)}</td>
                      <td className="text-right py-2 px-3">Rs. {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right">
                <p>Subtotal: Rs. {selectedBill.subtotal.toFixed(2)}</p>
                <p>Markup: {selectedBill.markup || 0}% (+Rs. {((selectedBill.subtotal * (selectedBill.markup || 0)) / 100).toFixed(2)})</p>
                <p>Discount: {selectedBill.discount || 0}% (-Rs. {((selectedBill.subtotal * (selectedBill.discount || 0)) / 100).toFixed(2)})</p>
                <p className="font-bold">Grand Total: Rs. {selectedBill.grandTotal.toFixed(2)}</p>
                <p>Amount Paid: Rs. {selectedBill.partialPayment.toFixed(2)}</p>
                <p>Remaining Amount: Rs. {(selectedBill.grandTotal - selectedBill.partialPayment).toFixed(2)}</p>
                {/* <p>Customer Balance (Post-Bill): Rs. {((selectedBill.customerId?.balance || 0) + (selectedBill.grandTotal - selectedBill.partialPayment)).toFixed(2)}</p> */}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a bill to view details</p>
          )}
        </div>
      </div>

      {/* Bill Details Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl mb-4 font-bold">Bill Details</h2>
            {billError && (
              <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{billError}</div>
            )}
            {loadingBill ? (
              <p>Loading bill details...</p>
            ) : selectedBill ? (
              <div>
                <div className="mb-4">
                  <p>
                    <strong>Bill #:</strong> {selectedBill._id.toString().slice(-6)}
                  </p>
                  <p>
                    <strong>Customer:</strong>{' '}
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => handleViewCustomer(selectedBill.customerId?._id)}
                    >
                      {selectedBill.customerId?.name || 'N/A'}
                    </span>
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(selectedBill.createdAt)}
                  </p>
                  <p>
                    <strong>Payment Type:</strong> {selectedBill.paymentType}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`${
                        selectedBill.status === 'completed'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                    </span>
                  </p>
                </div>
                <h3 className="text-md font-semibold mb-2">Items</h3>
                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b bg-gray-50">
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
                        <td className="text-right py-2 px-3">Rs. {(item.customPrice || item.unitPrice).toFixed(2)}</td>
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
                    <strong>Discount:</strong> {selectedBill.discount || 0}% (-Rs. {((selectedBill.subtotal * (selectedBill.discount || 0)) / 100).toFixed(2)})
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
                    <strong>Customer Balance balance:</strong> Rs. {((selectedBill.customerId?.balance || 0) )}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handlePrint(selectedBill)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center gap-2 flex-1"
                  >
                    <FaPrint /> Print Bill
                  </button>
                  <button
                    onClick={() => setShowBillModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p>No bill details available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistory;