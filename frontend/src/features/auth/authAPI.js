// src/services/authAPI.js
import axios from 'axios';
import { API_URL } from '../../config/api';

// Set the base URL for your Flask API. If your frontend and backend
// are on different ports (e.g., 3000 and 5000), use the full URL here.
// If you're using a proxy setup, '/api' is fine.
// --- Authentication Service Functions ---

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  
  // Save user to localStorage after successful registration
  // Backend returns: { message, user: { name, email, id } }
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  
  // Store the user data (or token/JWT) in localStorage upon successful login
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// --- Export the Service ---

const authService = {
  register,
  login,
};

export default authService;