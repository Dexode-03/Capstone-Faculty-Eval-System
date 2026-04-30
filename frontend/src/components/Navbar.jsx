import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { HiOutlineLogout, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/faculty',   label: 'Faculty',  roles: ['admin'] },
    { to: '/reports',   label: 'Reports',  roles: ['admin', 'faculty'] },
  ];

  const filteredLinks = (navLinks || []).filter(
    link => !link.roles || link.roles.includes(user?.role)
  );

  const isActive = path => location.pathname === path;

  return (
    <nav className="bg-white border-b border-psu-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img src="/logo.png" alt="FEFAS" className="h-9 object-contain" />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {filteredLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors ${
                  isActive(link.to)
                    ? 'text-psu-primary'
                    : 'text-psu-muted hover:text-psu-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right max-w-[160px]">
              <p className="text-[13px] font-medium text-psu-text leading-tight truncate">{user?.name}</p>
              <Link
                to="/change-password"
                className="text-[11px] text-psu-muted capitalize tracking-wide hover:text-psu-primary transition-colors"
              >
                {user?.role} · Change Password
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="text-psu-muted hover:text-psu-text transition-colors p-1.5"
              title="Logout"
            >
              <HiOutlineLogout className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 text-psu-muted hover:text-psu-text"
          >
            {menuOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-3 border-t border-psu-border space-y-1">
            {filteredLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-psu-primary'
                    : 'text-psu-muted hover:text-psu-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-psu-border flex items-center justify-between px-3">
              <div>
                <p className="text-[13px] font-medium text-psu-text">{user?.name}</p>
                <Link
                  to="/change-password"
                  onClick={() => setMenuOpen(false)}
                  className="text-[11px] text-psu-muted capitalize hover:text-psu-primary transition-colors"
                >
                  {user?.role} · Change Password
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="text-psu-muted hover:text-psu-text text-[13px] font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;