import React, { useState, useEffect } from 'react';
import { Sparkles, User, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NavbarLoggedIn() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    if (userFromStorage) {
      setUser(userFromStorage);
    }
  }, []);

  // Function to get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('user');
    setShowDropdown(false);
    navigate('/');
  };

  if (!user) {
    return null; // Don't render if no user
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-pink-200">
      <div className="px-6 py-4 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 group">
            <div className="bg-pink-500 p-2.5 rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-pink-600">
              Prerna - Job Connect
            </span>
          </a>

          {/* Menu */}
          <div className="flex items-center space-x-8">
            <a 
              href="/home" 
              className="text-lg flex items-center text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
            >
              <Home size={18} className="mr-1.5" />
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#features" 
              className="text-lg text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#contact" 
              className="text-lg text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
            </a>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full border-2 border-pink-500 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold hover:border-pink-600 hover:scale-110 transition-all duration-300 cursor-pointer"
                title={user.name}
              >
                {getInitials(user.name)}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-pink-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium flex items-center space-x-2 transition-colors duration-200"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}