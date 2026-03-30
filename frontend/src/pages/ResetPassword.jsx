import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import authService from '../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword({ token, ...formData });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-psu-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-8">
            <img src="/logo.png" alt="FEFAS" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-psu-text tracking-tight">New password</h1>
          <p className="text-[13px] text-psu-muted mt-1.5 leading-relaxed">
            Choose a new password for your account
          </p>
        </div>

        {error && (
          <div className="border border-red-200 text-red-600 px-4 py-3 mb-6 text-[13px]">{error}</div>
        )}
        {success && (
          <div className="border border-green-200 text-green-700 px-4 py-3 mb-6 text-[13px]">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-0 py-2.5 border-0 border-b border-psu-border bg-transparent text-[15px] text-psu-text placeholder-gray-300 focus:border-psu-primary transition-colors pr-8"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors"
              >
                {showPassword ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-0 py-2.5 border-0 border-b border-psu-border bg-transparent text-[15px] text-psu-text placeholder-gray-300 focus:border-psu-primary transition-colors"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-psu-primary text-white py-2.5 text-[13px] font-medium tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="text-[13px] text-psu-muted mt-8">
          <Link to="/login" className="text-psu-primary hover:text-psu-secondary font-medium transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
