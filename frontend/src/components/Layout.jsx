import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { HiOutlineUser, HiOutlineQuestionMarkCircle, HiOutlineShieldCheck } from 'react-icons/hi';

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-psu-primary selection:text-white">
      {/* Top Navbar with responsive mobile drawer (hamburger menu >=44px, slide-in overlay, links to Profile and Help) */}
      <Navbar />

      {/* Main content viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Outlet />
      </main>

      {/* Responsive footer with quick links to Help & FAQs, Profile, and Privacy */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} Pangasinan State University · Faculty Evaluation System (FEFAS)</p>
          <div className="flex items-center space-x-6">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 hover:text-psu-primary transition-colors py-1"
            >
              <HiOutlineUser className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 hover:text-psu-primary transition-colors py-1"
            >
              <HiOutlineQuestionMarkCircle className="h-4 w-4" />
              <span>Help & FAQs</span>
            </Link>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-1.5 hover:text-psu-primary transition-colors py-1"
            >
              <HiOutlineShieldCheck className="h-4 w-4" />
              <span>Privacy</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
