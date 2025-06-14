// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Items from './pages/Items';
import BillPage from './pages/Billing';
import CustomersPage from './pages/CustomersPage';
import BillHistory from './pages/BillHistory';
import SalesReports from './pages/SalesReports';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/billing" replace />} />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
            <div className="flex flex-1">
              <Navbar />
              <main className="flex-1 container mx-auto p-4 md:p-6">
                <BillPage />
              </main>
            </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
            <div className="flex flex-1">
              <Navbar />
              <main className="flex-1 container mx-auto p-4 md:p-6">
                <CustomersPage />
              </main>
            </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
            <div className="flex flex-1">
              <Navbar />
              <main className="flex-1 container mx-auto p-4 md:p-6">
                <Items />
              </main>
            </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
            <div className="flex flex-1">
              <Navbar />
              <main className="flex-1 container mx-auto p-4 md:p-6">
                <BillHistory />
              </main>
            </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
            <div className="flex flex-1">
              <Navbar />
              <main className="flex-1 container mx-auto p-4 md:p-6">
                <SalesReports />
              </main>
            </div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/billing" replace />} />
      </Routes>
    </div>
  );
}

export default App;