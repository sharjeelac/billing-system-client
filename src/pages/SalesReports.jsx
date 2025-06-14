import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileExport } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../api';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SalesReports = () => {
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [period, startDate, endDate]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching sales reports for period: ${period}, startDate: ${startDate}, endDate: ${endDate}`);
      let backendUri = 'http://localhost:5000/api' || process.env.REACT_APP_API_URL
      let url = `${backendUri}/reports/sales?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await axios.get(url);
      console.log('Reports received:', response.data); // Debug log
      setReports(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching sales reports:', error);
      setError(error.response?.data?.error || 'Failed to fetch sales reports. Please try again.');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const formatPeriodLabel = (periodStr) => {
    if (period === 'daily' || period === 'custom') {
      return new Date(periodStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } else if (period === 'weekly') {
      const [year, week] = periodStr.split('-W');
      return `Week ${parseInt(week, 10)}, ${year}`;
    } else if (period === 'monthly') {
      const [year, month] = periodStr.split('-');
      return new Date(year, parseInt(month, 10) - 1).toLocaleString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
    }
    return periodStr;
  };

  const calculateMetrics = () => {
    const totalSales = reports.reduce((sum, report) => sum + report.totalSales, 0);
    const totalBills = reports.reduce((sum, report) => sum + report.billCount, 0);
    const cashSales = reports.reduce((sum, report) => sum + (report.cashSales || 0), 0);
    const creditSales = reports.reduce((sum, report) => sum + (report.creditSales || 0), 0);
    const totalProfit = reports.reduce((sum, report) => sum + (report.totalProfit || 0), 0);
    const cashProfit = reports.reduce((sum, report) => sum + (report.cashProfit || 0), 0);
    const creditProfit = reports.reduce((sum, report) => sum + (report.creditProfit || 0), 0);
    const avgBill = totalBills > 0 ? (totalSales / totalBills).toFixed(2) : '0.00';
    const avgProfit = totalBills > 0 ? (totalProfit / totalBills).toFixed(2) : '0.00';

    return {
      totalSales,
      totalBills,
      avgBill,
      cashSales,
      creditSales,
      totalProfit,
      avgProfit,
      cashProfit,
      creditProfit,
    };
  };

  const exportToCSV = () => {
    const headers = [
      'Period',
      'Total Sales (Rs.)',
      'Total Profit (Rs.)',
      'Profit Margin (%)',
      'Bill Count',
      'Cash Sales (Rs.)',
      'Cash Profit (Rs.)',
      'Credit Sales (Rs.)',
      'Credit Profit (Rs.)',
    ];

    const rows = reports.map((report) => {
      const profitMargin =
        report.totalSales > 0 ? ((report.totalProfit || 0) / report.totalSales * 100).toFixed(2) : '0.00';
      return [
        formatPeriodLabel(report.period),
        report.totalSales.toFixed(2),
        (report.totalProfit || 0).toFixed(2),
        profitMargin,
        report.billCount,
        (report.cashSales || 0).toFixed(2),
        (report.cashProfit || 0).toFixed(2),
        (report.creditSales || 0).toFixed(2),
        (report.creditProfit || 0).toFixed(2),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { totalSales, totalBills, avgBill, cashSales, creditSales, totalProfit, avgProfit, cashProfit, creditProfit } =
    calculateMetrics();

  const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100).toFixed(2) : '0.00';

  const chartData = {
    labels: reports.map((report) => formatPeriodLabel(report.period)),
    datasets: [
      {
        label: 'Total Sales (Rs.)',
        data: reports.map((report) => report.totalSales),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
      },
      {
        label: 'Total Profit (Rs.)',
        data: reports.map((report) => report.totalProfit || 0),
        backgroundColor: '#22C55E',
        borderColor: '#15803D',
        borderWidth: 1,
      },
      {
        label: 'Cash Sales (Rs.)',
        data: reports.map((report) => report.cashSales || 0),
        backgroundColor: '#10B981',
        borderColor: '#047857',
        borderWidth: 1,
      },
      {
        label: 'Credit Sales (Rs.)',
        data: reports.map((report) => report.creditSales || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#B45309',
        borderWidth: 1,
      },
    ],
  };

  const profitChartData = {
    labels: reports.map((report) => formatPeriodLabel(report.period)),
    datasets: [
      {
        label: 'Cash Profit (Rs.)',
        data: reports.map((report) => report.cashProfit || 0),
        backgroundColor: '#10B981',
        borderColor: '#047857',
        borderWidth: 1,
      },
      {
        label: 'Credit Profit (Rs.)',
        data: reports.map((report) => report.creditProfit || 0),
        backgroundColor: '#F59E0B',
        borderColor: '#B45309',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (Rs.)',
        },
      },
      x: {
        title: {
          display: true,
          text: period.charAt(0).toUpperCase() + period.slice(1),
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: `${period.charAt(0).toUpperCase() + period.slice(1)} Sales & Profit Report`,
      },
    },
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        {reports.length > 0 && (
          <button
            onClick={exportToCSV}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center gap-2 transition-colors duration-200"
          >
            <FaFileExport /> Export CSV
          </button>
        )}
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-lg">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="mr-2 font-medium">Select Period:</label>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {period === 'custom' && (
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="mr-2 font-medium">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e, 'start')}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="mr-2 font-medium">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange(e, 'end')}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : reports.length > 0 ? (
        <div>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold">Total Sales</h3>
              <p className="text-2xl font-bold text-blue-600">Rs. {totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold">Total Profit</h3>
              <p className="text-2xl font-bold text-green-600">Rs. {totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold">Profit Margin</h3>
              <p className="text-2xl font-bold text-green-600">{profitMargin}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-md font-semibold">Total Bills</h3>
              <p className="text-2xl font-bold text-blue-600">{totalBills}</p>
            </div>
          </div>

          {/* Payment Type Breakdown */}
          {/* <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Type Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-green-600">Cash Payments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Total Sales</p>
                    <p className="text-xl">Rs. {cashSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Profit</p>
                    <p className="text-xl">Rs. {cashProfit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Profit Margin</p>
                    <p className="text-xl">
                      {cashSales > 0 ? (cashProfit / cashSales * 100).toFixed(2) : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-orange-600">Credit Payments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Total Sales</p>
                    <p className="text-xl">Rs. {creditSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Profit</p>
                    <p className="text-xl">Rs. {creditProfit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Profit Margin</p>
                    <p className="text-xl">
                      {creditSales > 0 ? (creditProfit / creditSales * 100).toFixed(2) : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {period.charAt(0).toUpperCase() + period.slice(1)} Sales Trend
            </h2>
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Profit Breakdown Chart */}
          {/* <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {period.charAt(0).toUpperCase() + period.slice(1)} Profit Breakdown
            </h2>
            <div className="h-96">
              <Bar
                data={profitChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: `${period.charAt(0).toUpperCase() + period.slice(1)} Profit Breakdown`,
                    },
                  },
                }}
              />
            </div>
          </div> */}

          {/* Detailed Report Table */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Detailed Report</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => {
                    const profitMargin =
                      report.totalSales > 0
                        ? ((report.totalProfit || 0) / report.totalSales * 100).toFixed(2)
                        : '0.00';
                    const cashMargin =
                      report.cashSales > 0
                        ? ((report.cashProfit || 0) / report.cashSales * 100).toFixed(2)
                        : '0.00';
                    const creditMargin =
                      report.creditSales > 0
                        ? ((report.creditProfit || 0) / report.creditSales * 100).toFixed(2)
                        : '0.00';

                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPeriodLabel(report.period)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {report.totalSales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(report.totalProfit || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profitMargin}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.billCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(report.cashSales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(report.cashProfit || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(report.creditSales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(report.creditProfit || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : !isLoading && !error ? (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-gray-500">No sales data available for the selected period.</p>
        </div>
      ) : null}
    </div>
  );
};

export default SalesReports;