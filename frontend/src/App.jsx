import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import FacultyList from './pages/FacultyList';
import EvaluationForm from './pages/EvaluationForm';
import Reports from './pages/Reports';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          > <Route path="/change-password" element={<ChangePassword />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/faculty" element={<FacultyList />} />
            <Route
              path="/evaluation"
              element={
                <ProtectedRoute roles={['student']}>
                  <EvaluationForm />
                </ProtectedRoute>
              }
            />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
