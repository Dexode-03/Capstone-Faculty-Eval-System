import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  if (!formData.email.endsWith('@psu.edu.ph')) {
    setError('Only PSU email addresses (@psu.edu.ph) are allowed.');
    setLoading(false);
    return;
  }

  try {
    const response = await authService.login(formData);
    login(response.data.token, response.data.user);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Blur overlay */}
      <div className="fixed inset-0 backdrop-blur-sm bg-psu-primary/40"></div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 sm:p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <img src="/logo.png" alt="FEFAS" className="h-16 sm:h-20 object-contain mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-psu-text tracking-tight">Sign in</h1>
          <p className="text-xs text-psu-muted mt-2 uppercase tracking-wider font-medium">
            Faculty Evaluation & Feedback Analysis System
          </p>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-psu-muted uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[15px] text-psu-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-all bg-white"
              placeholder="you@psu.edu.ph"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-psu-muted uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[15px] text-psu-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-all pr-11 bg-white"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors"
              >
                {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-psu-muted hover:text-psu-primary transition-colors font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-psu-primary text-white rounded-lg px-6 py-3.5 font-semibold tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>

      {/* Background note */}
      <p className="absolute bottom-6 left-6 text-sm text-white font-medium tracking-wide drop-shadow-md">
        Capstone Project Group 6: Web-based Faculty Evaluation with Sentiments and Prescriptive Analysis
      </p>
    </div>
  );
};

export default Login;