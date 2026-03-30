import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeOff, HiCheckCircle } from 'react-icons/hi';
import authService from '../services/authService';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.changePassword({
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-0">
        <div className="bg-white border border-psu-border rounded-xl px-6 sm:px-8 py-10 sm:py-12 text-center">    
          <HiCheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-psu-text tracking-tight mb-2">Password Changed</h2>
          <p className="text-[13px] text-psu-muted mb-6">Your password has been updated successfully.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-psu-primary text-white rounded-lg px-6 py-3 text-[13px] font-semibold hover:bg-psu-secondary transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="mb-8">    
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Account</p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">Change Password</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-psu-border rounded-xl overflow-hidden">
        <div className="divide-y divide-psu-border">
          {[
            { label: 'Current Password', name: 'currentPassword', field: 'current' },
            { label: 'New Password',     name: 'newPassword',     field: 'new'     },
            { label: 'Confirm Password', name: 'confirmPassword', field: 'confirm' },
          ].map(({ label, name, field }) => (
            <div key={name} className="px-6 py-5">
              <label className="block text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-2">
                {label}
              </label>
              <div className="relative">
                <input
                  type={show[field] ? 'text' : 'password'}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="w-full pr-10 py-2 border-0 border-b border-psu-border bg-transparent text-[14px] text-psu-text placeholder-gray-300 focus:border-psu-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShow(field)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors"
                >
                  {show[field]
                    ? <HiOutlineEyeOff className="h-4 w-4" />
                    : <HiOutlineEye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        <div className="px-6 py-5 flex items-center justify-between border-t border-psu-border">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[13px] font-medium text-psu-muted hover:text-psu-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-psu-primary text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;