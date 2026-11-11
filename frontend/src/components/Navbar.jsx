import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineKey,
  HiOutlineViewGrid,
  HiOutlineDocumentReport,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineBookOpen,
} from 'react-icons/hi';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
    { to: '/my-submissions', label: 'My Submissions', roles: ['student'], icon: HiOutlineClipboardList },
    { to: '/reports', label: 'Reports', roles: ['admin', 'faculty'], icon: HiOutlineDocumentReport },
    { to: '/admin/accounts', label: 'Accounts', roles: ['admin'], icon: HiOutlineUserGroup },
    { to: '/admin/academic-periods', label: 'Semesters', roles: ['admin'], icon: HiOutlineCalendar },
    { to: '/admin/questions', label: 'Questions', roles: ['admin'], icon: HiOutlineClipboardList },
    { to: '/admin/recommendation-rules', label: 'AI Rules', roles: ['admin'], icon: HiOutlineSparkles },
    { to: '/admin/audit-logs', label: 'Audit Log', roles: ['admin'], icon: HiOutlineShieldCheck },
    { to: '/help', label: 'Help & FAQs', icon: HiOutlineQuestionMarkCircle },
  ];

  const filteredLinks = (navLinks || []).filter(
    link => !link.roles || link.roles.includes(user?.role)
  );

  const isActive = path => location.pathname === path;

  return (
    <>
      <nav className="bg-white border-b border-psu-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3 focus:outline-none">
              <img src="/logo.png" alt="FEFAS" className="h-9 object-contain" />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {filteredLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium tracking-wide transition-colors ${
                    isActive(link.to)
                      ? 'text-psu-primary bg-psu-primary/5 font-semibold'
                      : 'text-psu-muted hover:text-psu-text hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/help"
                className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-psu-muted hover:text-psu-primary hover:bg-slate-100 transition-colors ${
                  isActive('/help') ? 'text-psu-primary bg-psu-primary/10' : ''
                }`}
                title="Help & FAQs"
              >
                <HiOutlineQuestionMarkCircle className="h-5 w-5" />
              </Link>

              <div className="h-4 w-px bg-slate-200" />

              <div className="text-right max-w-[170px]">
                <Link
                  to="/profile"
                  className="text-[13px] font-medium text-psu-text hover:text-psu-primary transition-colors leading-tight block truncate"
                  title="View Profile"
                >
                  {user?.name || 'User'}
                </Link>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-psu-muted">
                  <span className="capitalize">{user?.role}</span>
                  <span>·</span>
                  <Link
                    to="/profile"
                    className="hover:text-psu-primary transition-colors font-medium"
                  >
                    Profile
                  </Link>
                </div>
              </div>

              <Link
                to="/profile"
                className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full border border-slate-200 text-psu-muted hover:text-psu-primary hover:border-psu-primary/40 hover:bg-psu-primary/5 transition-all ${
                  isActive('/profile') ? 'border-psu-primary text-psu-primary bg-psu-primary/10' : 'bg-slate-50'
                }`}
                title="User Profile"
              >
                <HiOutlineUser className="h-4 w-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-psu-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <HiOutlineLogout className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button (Touch target >= 44px) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg text-slate-700 hover:text-psu-primary hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-psu-primary/20"
              aria-label={menuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <HiOutlineX className="h-6 w-6" /> : <HiOutlineMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Responsive Mobile Drawer (Slide-in overlay with >=44px touch targets) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in drawer container */}
          <div
            className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-psu-border flex items-center justify-between bg-slate-50">
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2">
                  <img src="/logo.png" alt="FEFAS" className="h-8 object-contain" />
                </Link>
                {/* Close Button >= 44px */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-psu-primary/20"
                  aria-label="Close navigation drawer"
                >
                  <HiOutlineX className="h-6 w-6" />
                </button>
              </div>

              {/* User Info Card in Drawer */}
              <div className="p-4 border-b border-psu-border bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-psu-primary/10 text-psu-primary flex items-center justify-center font-bold text-base flex-shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-psu-text truncate">{user?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-psu-primary/10 text-psu-primary">
                        {user?.role}
                      </span>
                      {user?.department && (
                        <span className="text-[11px] text-psu-muted truncate">
                          {user.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct quick links to Profile and Change Password in User card */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-psu-primary bg-psu-primary/5 hover:bg-psu-primary/10 transition-colors"
                  >
                    <HiOutlineUser className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setMenuOpen(false)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <HiOutlineKey className="h-4 w-4" />
                    <span>Password</span>
                  </Link>
                </div>
              </div>

              {/* Main Navigation Links (Each target >= 44px) */}
              <div className="px-3 py-3 space-y-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Navigation
                </p>
                {filteredLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={`min-h-[44px] flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                        isActive(link.to)
                          ? 'bg-psu-primary text-white font-semibold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-psu-primary'
                      }`}
                    >
                      {Icon && <Icon className={`h-5 w-5 ${isActive(link.to) ? 'text-white' : 'text-slate-400'}`} />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Additional Dedicated Links in Navigation */}
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Account & Support
                  </p>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={`min-h-[44px] flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                      isActive('/profile')
                        ? 'bg-psu-primary text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-psu-primary'
                    }`}
                  >
                    <HiOutlineUser className={`h-5 w-5 ${isActive('/profile') ? 'text-white' : 'text-slate-400'}`} />
                    <span>Profile Details</span>
                  </Link>

                  <Link
                    to="/help"
                    onClick={() => setMenuOpen(false)}
                    className={`min-h-[44px] flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                      isActive('/help')
                        ? 'bg-psu-primary text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-psu-primary'
                    }`}
                  >
                    <HiOutlineQuestionMarkCircle className={`h-5 w-5 ${isActive('/help') ? 'text-white' : 'text-slate-400'}`} />
                    <span>Help & FAQs</span>
                  </Link>

                  <Link
                    to="/privacy"
                    onClick={() => setMenuOpen(false)}
                    className={`min-h-[44px] flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                      isActive('/privacy')
                        ? 'bg-psu-primary text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-psu-primary'
                    }`}
                  >
                    <HiOutlineBookOpen className={`h-5 w-5 ${isActive('/privacy') ? 'text-white' : 'text-slate-400'}`} />
                    <span>Privacy Policy</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer with Logout button (>= 44px) */}
            <div className="p-4 border-t border-psu-border bg-slate-50">
              <button
                onClick={handleLogout}
                className="min-h-[44px] w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-[14px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/20"
              >
                <HiOutlineLogout className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
