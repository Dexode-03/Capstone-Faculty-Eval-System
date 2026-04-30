import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import FacultyList from './pages/FacultyList';
import FacultyReport from './pages/FacultyReport';
import EvaluationForm from './pages/EvaluationForm';
import Reports from './pages/Reports';
import ChangePassword from './pages/ChangePassword';
import useAuth from './hooks/useAuth';

// Renders the correct Reports page based on the user's role
const ReportsRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'faculty') return <FacultyReport />;
  return <Reports />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login"                 element={<Login />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/faculty"        element={<FacultyList />} />
            <Route path="/reports/:id"    element={<FacultyReport />} />
            <Route path="/reports"        element={<ReportsRouter />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Students only */}
            <Route
              path="/evaluation"
              element={
                <ProtectedRoute roles={['student']}>
                  <EvaluationForm />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;