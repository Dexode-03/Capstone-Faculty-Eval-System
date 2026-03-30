import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.forgotPassword({ email });
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
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
          <h1 className="text-2xl font-semibold text-psu-text tracking-tight">Reset password</h1>
          <p className="text-[13px] text-psu-muted mt-1.5 leading-relaxed">
            Enter your email to receive a reset link
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
            <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              className="w-full px-0 py-2.5 border-0 border-b border-psu-border bg-transparent text-[15px] text-psu-text placeholder-gray-300 focus:border-psu-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-psu-primary text-white py-2.5 text-[13px] font-medium tracking-wide hover:bg-psu-secondary transition-colors disabled:opacity-40"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-[13px] text-psu-muted mt-8">
          Remember your password?{' '}
          <Link to="/login" className="text-psu-primary hover:text-psu-secondary font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
