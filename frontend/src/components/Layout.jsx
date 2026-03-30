import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
