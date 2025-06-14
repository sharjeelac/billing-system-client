// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';

const AdminDashboard = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('https://billing-system-server-ten.vercel.app/api/auth/admin', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMessage(res.data.message);
      } catch (error) {
        console.error(error.response.data);
        setMessage('Failed to load dashboard');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{message || 'Admin Dashboard'}</h1>
          <p className="text-gray-600 mb-6">
            Welcome to the Hardware Shop admin panel. Use the sidebar to navigate to Billing, Customers, Items, Bill History, or Sales Reports.
          </p>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;