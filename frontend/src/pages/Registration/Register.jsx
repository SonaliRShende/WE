import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom"; // 👈 Import Link

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      // Successfully registered - user is now in localStorage
      // Redirect to /home where the navbar will auto-detect the logged-in user
      navigate("/home");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-300 to-pink-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Register</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full p-2 mb-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* 🚀 NEW SIGN-IN OPTION */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already a member?{" "}
            <Link to="/login" className="text-blue-500 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
        {/* 🚀 END NEW SIGN-IN OPTION */}
      </form>
    </div>
  );
};

export default Register;