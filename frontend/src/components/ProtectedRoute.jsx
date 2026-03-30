import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  // const { user, loading } = useAuth();
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-psu-background">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-[13px] text-psu-muted mt-4 tracking-wide">Loading</p>
        </div>
      </div>
    );
  }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }
  if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
  }


  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
