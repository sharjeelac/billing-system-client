// src/components/Navbar.jsx
import { NavLink, useNavigate } from 'react-router-dom';


const Navbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  return (
    <nav className="bg-blue-600 text-white p-4 w-64 min-h-screen flex flex-col">
      <h1 className="text-xl font-bold mb-6">Hardware Shop</h1>
      <NavLink
        to="/billing"
        className={({ isActive }) =>
          `py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'}`
        }
      >
        Billing
      </NavLink>
      <NavLink
        to="/customers"
        className={({ isActive }) =>
          `py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'}`
        }
      >
        Customers
      </NavLink>
      <NavLink
        to="/items"
        className={({ isActive }) =>
          `py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'}`
        }
      >
        Items
      </NavLink>
      <NavLink
        to="/bills"
        className={({ isActive }) =>
          `py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'}`
        }
      >
        Bill History
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-700'}`
        }
      >
        Sales Reports
      </NavLink>
      <button
        onClick={handleLogout}
        className="mt-auto py-2 px-4 bg-red-600 rounded hover:bg-red-700 transition duration-200"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;