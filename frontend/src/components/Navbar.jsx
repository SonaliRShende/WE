import React from 'react';
import { Sparkles, User, Home } from 'lucide-react';

export default function Navbar({ isLoggedIn = false, userProfile = null }) {
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
            {isLoggedIn ? (
              // Logged In Menu
              <>
                <a 
                  href="/" 
                  className="flex items-center text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
                >
                  <HomeIcon size={18} className="mr-1.5" />
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
                >
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="/profile" className="flex items-center space-x-2 group">
                  {userProfile?.image ? (
                    <img 
                      src={userProfile.image} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border-2 border-pink-500 group-hover:border-pink-600 group-hover:scale-110 transition-all duration-300 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-pink-500 bg-pink-100 flex items-center justify-center group-hover:border-pink-600 group-hover:scale-110 transition-all duration-300">
                      <User size={20} className="text-pink-600" />
                    </div>
                  )}
                </a>
              </>
            ) : (
              // Logged Out Menu
              <>
                <a 
                  href="#features" 
                  className=" text-lg text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
                >
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a 
                  href="#about" 
                  className="text-lg text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
                >
                  About
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200 relative group"
                >
                  Contact
                  <span className="text-lg absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a 
                  href="/register" 
                  className="text-lg bg-pink-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-xl hover:bg-pink-600 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}