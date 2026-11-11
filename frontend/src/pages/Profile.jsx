import { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiCheckCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineClipboardCopy,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : authUser || null;
  });
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [profileFetchError, setProfileFetchError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Password form state
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch updated profile data from GET /api/auth/me
  const fetchProfileData = async () => {
    setFetchingProfile(true);
    setProfileFetchError('');
    try {
      const response = await authService.getProfile();
      if (response.data && response.data.user) {
        setProfile(response.data.user);
        // Sync with localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfileFetchError(
        err.response?.data?.message || 'Unable to refresh profile details.'
      );
    } finally {
      setFetchingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update profile if authUser changes
  useEffect(() => {
    if (authUser && !profile) {
      setProfile(authUser);
    }
  }, [authUser, profile]);

  const handleCopyId = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const toggleShow = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Password validation rules
  const hasMinLength = form.newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(form.newPassword);
  const hasNumber = /[0-9]/.test(form.newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(form.newPassword);
  const passwordsMatch =
    Boolean(form.newPassword) && form.newPassword === form.confirmPassword;

  // Strength score: 0 to 4
  const strengthScore = [
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!form.newPassword) return { text: '', color: 'bg-gray-200' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-red-500' };
    if (strengthScore <= 3) return { text: 'Moderate', color: 'bg-amber-500' };
    return { text: 'Strong', color: 'bg-green-500' };
  };

  const strengthInfo = getStrengthLabel();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }

    if (!hasMinLength) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!hasLetter || !hasNumber) {
      setPasswordError('New password must contain both letters and numbers.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setSubmittingPassword(true);

    try {
      const response = await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });

      setPasswordSuccess(
        response.data?.message || 'Password changed successfully!'
      );
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPassword({
        current: false,
        new: false,
        confirm: false,
      });
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(
        err.response?.data?.message ||
          'Failed to change password. Please check your current password.'
      );
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Helper for role badge styling
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          label: 'Administrator',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'faculty':
        return {
          label: 'Faculty Member',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'student':
        return {
          label: 'Student',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          label: role || 'User',
          className: 'bg-gray-100 text-gray-700 border-gray-300',
          dot: 'bg-gray-400',
        };
    }
  };

  const roleInfo = getRoleBadge(profile?.role);
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-psu-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-psu-primary uppercase tracking-wider mb-1">
            <span>Account Center</span>
            <span>&bull;</span>
            <span className="text-psu-muted">Personal Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-psu-text tracking-tight">
            User Profile
          </h1>
          <p className="text-[13px] text-psu-muted mt-1">
            Manage your account credentials, institutional details, and security settings.
          </p>
        </div>

        <button
          onClick={fetchProfileData}
          disabled={fetchingProfile}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-psu-text bg-white border border-psu-border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 self-start sm:self-auto shadow-sm"
          title="Refresh profile details"
        >
          <HiOutlineRefresh
            className={`w-4 h-4 text-psu-muted ${fetchingProfile ? 'animate-spin text-psu-primary' : ''}`}
          />
          <span>{fetchingProfile ? 'Refreshing...' : 'Refresh Details'}</span>
        </button>
      </div>

      {profileFetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-[13px] text-amber-800">
            <p className="font-semibold">Notice</p>
            <p>{profileFetchError}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Account Details & Security / Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SECTION 1: Account Details Card */}
        <section className="lg:col-span-5 bg-white border border-psu-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Card Header & Avatar Hero */}
          <div className="bg-gradient-to-r from-psu-primary to-psu-secondary p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white text-psu-primary font-bold text-xl flex items-center justify-center shadow-md border-2 border-psu-gold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold leading-tight truncate">
                  {profile?.name || 'Authorized User'}
                </h2>
                <p className="text-blue-100 text-[13px] truncate">
                  {profile?.email || 'No email associated'}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                    {roleInfo.label}
                  </span>
                  {profile?.email_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-100 border border-emerald-300/30">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="p-6 space-y-5 flex-1">
            <div className="border-b border-psu-border pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-psu-muted">
                Institutional Records
              </h3>
            </div>

            {/* Campus ID */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                <HiOutlineIdentification className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                  Campus ID
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[14px] font-semibold text-psu-text tracking-wide">
                    {profile?.id || 'N/A'}
                  </span>
                  {profile?.id && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 text-psu-muted hover:text-psu-primary rounded transition-colors text-xs"
                      title="Copy Campus ID"
                    >
                      <HiOutlineClipboardCopy className="w-4 h-4" />
                    </button>
                  )}
                  {copiedId && (
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                <HiOutlineUser className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                  Full Name
                </p>
                <p className="text-[14px] font-medium text-psu-text mt-0.5 truncate">
                  {profile?.name || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Email Address */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                <HiOutlineMail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                  Institutional Email
                </p>
                <p className="text-[14px] font-medium text-psu-text mt-0.5 break-all">
                  {profile?.email || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Role Badge / Designation */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                <HiOutlineShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                  Account Role
                </p>
                <p className="text-[14px] font-semibold text-psu-text mt-0.5 capitalize">
                  {roleInfo.label}
                </p>
              </div>
            </div>

            {/* Department / Program */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                <HiOutlineAcademicCap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                  Department / Program
                </p>
                <p className="text-[14px] font-medium text-psu-text mt-0.5">
                  {profile?.department ||
                    (profile?.role === 'admin'
                      ? 'Administrative Office'
                      : 'Unassigned')}
                </p>
              </div>
            </div>

            {/* Student Specific: Year Level & Section */}
            {profile?.role === 'student' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-psu-border">
                <div>
                  <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                    Year Level
                  </p>
                  <p className="text-[14px] font-semibold text-psu-text mt-0.5">
                    {profile?.year_level || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                    Section
                  </p>
                  <p className="text-[14px] font-semibold text-psu-text mt-0.5">
                    {profile?.section || '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Assigned Subjects (if available for student or faculty) */}
            {profile?.subject_names && (
              <div className="flex items-start gap-3 pt-2 border-t border-psu-border">
                <div className="p-2 rounded-lg bg-blue-50 text-psu-primary shrink-0 mt-0.5">
                  <HiOutlineBookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                    {profile?.role === 'student' ? 'Enrolled Subjects' : 'Teaching Subjects'}
                  </p>
                  <p className="text-[13px] text-psu-text mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-psu-border">
                    {profile.subject_names}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Read-Only Notice Footer */}
          <div className="bg-slate-50 border-t border-psu-border p-4 text-[12px] text-psu-muted flex items-start gap-2">
            <HiOutlineExclamationCircle className="w-4 h-4 text-psu-muted shrink-0 mt-0.5" />
            <p>
              Institutional records are managed by the campus administration. To update your campus ID, email, or department, please contact the MIS Office or Registrar.
            </p>
          </div>
        </section>

        {/* SECTION 2: Security / Change Password Card */}
        <section className="lg:col-span-7 bg-white border border-psu-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-psu-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-psu-primary">
                <HiOutlineKey className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-psu-text tracking-tight">
                  Security & Password
                </h2>
                <p className="text-[13px] text-psu-muted">
                  Update your account password following the institutional security standard.
                </p>
              </div>
            </div>
            <HiOutlineLockClosed className="w-5 h-5 text-psu-muted hidden sm:block" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
            {/* Success Alert Banner */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <HiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-[13px]">
                  <p className="font-semibold text-green-900">Success</p>
                  <p className="text-green-800">{passwordSuccess}</p>
                </div>
              </div>
            )}

            {/* Error Alert Banner */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1 text-[13px]">
                  <p className="font-semibold text-red-900">Unable to Update Password</p>
                  <p className="text-red-700">{passwordError}</p>
                </div>
              </div>
            )}

            {/* Current Password Field */}
            <div>
              <label className="block text-[12px] font-semibold text-psu-text uppercase tracking-wider mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  required
                  className="w-full px-4 py-2.5 pr-11 border border-psu-border rounded-lg text-[14px] text-psu-text placeholder-gray-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors p-1"
                  title={showPassword.current ? 'Hide password' : 'Show password'}
                >
                  {showPassword.current ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-[12px] font-semibold text-psu-text uppercase tracking-wider mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter a new strong password"
                  required
                  className="w-full px-4 py-2.5 pr-11 border border-psu-border rounded-lg text-[14px] text-psu-text placeholder-gray-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors p-1"
                  title={showPassword.new ? 'Hide password' : 'Show password'}
                >
                  {showPassword.new ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {form.newPassword && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-psu-muted">Password Strength:</span>
                    <span className="font-semibold text-psu-text">
                      {strengthInfo.text}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label className="block text-[12px] font-semibold text-psu-text uppercase tracking-wider mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-type your new password"
                  required
                  className="w-full px-4 py-2.5 pr-11 border border-psu-border rounded-lg text-[14px] text-psu-text placeholder-gray-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-psu-muted hover:text-psu-text transition-colors p-1"
                  title={showPassword.confirm ? 'Hide password' : 'Show password'}
                >
                  {showPassword.confirm ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Policy Feedback Checklist */}
            <div className="bg-slate-50 border border-psu-border rounded-xl p-4">
              <p className="text-[12px] font-semibold text-psu-text uppercase tracking-wider mb-3">
                Password Security Policy
              </p>
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center gap-2">
                  <span
                    className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasMinLength
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {hasMinLength ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      hasMinLength
                        ? 'text-emerald-700 font-medium'
                        : 'text-psu-muted'
                    }
                  >
                    At least 8 characters long
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  <span
                    className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasLetter
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {hasLetter ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      hasLetter
                        ? 'text-emerald-700 font-medium'
                        : 'text-psu-muted'
                    }
                  >
                    Contains at least one letter (a-z, A-Z)
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  <span
                    className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      hasNumber
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {hasNumber ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      hasNumber
                        ? 'text-emerald-700 font-medium'
                        : 'text-psu-muted'
                    }
                  >
                    Contains at least one number (0-9)
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  <span
                    className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      passwordsMatch
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {passwordsMatch ? '✓' : '•'}
                  </span>
                  <span
                    className={
                      passwordsMatch
                        ? 'text-emerald-700 font-medium'
                        : 'text-psu-muted'
                    }
                  >
                    New passwords match
                  </span>
                </li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-psu-border">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                disabled={submittingPassword}
                className="w-full sm:w-auto px-5 py-2.5 text-[13px] font-semibold text-psu-muted hover:text-psu-text transition-colors disabled:opacity-40"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={
                  submittingPassword ||
                  !form.currentPassword ||
                  !hasMinLength ||
                  !hasLetter ||
                  !hasNumber ||
                  !passwordsMatch
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-psu-primary text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {submittingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
