import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import useAuth from './hooks/useAuth';

// Eagerly loaded critical auth / dashboard pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-loaded routes for code-splitting & efficiency
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Privacy = lazy(() => import('./pages/Privacy'));
const FacultyReport = lazy(() => import('./pages/FacultyReport'));
const EvaluationForm = lazy(() => import('./pages/EvaluationForm'));
const Reports = lazy(() => import('./pages/Reports'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Profile = lazy(() => import('./pages/Profile'));
const HelpFaq = lazy(() => import('./pages/HelpFaq'));
const AdminAccounts = lazy(() => import('./pages/AdminAccounts'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const EditAccount = lazy(() => import('./pages/EditAccount'));
const AcademicPeriods = lazy(() => import('./pages/AcademicPeriods'));
const MySubmissions = lazy(() => import('./pages/MySubmissions'));
const QuestionManagement = lazy(() => import('./pages/QuestionManagement'));
const RecommendationRules = lazy(() => import('./pages/RecommendationRules'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"                 element={<Login />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/privacy"               element={<Privacy />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard"       element={<Dashboard />} />
              <Route path="/faculty"         element={<Navigate to="/reports" replace />} />
              <Route path="/reports/:id"     element={<FacultyReport />} />
              <Route path="/reports"         element={<ReportsRouter />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/profile"         element={<Profile />} />
              <Route path="/help"            element={<HelpFaq />} />
              <Route path="/faq"             element={<Navigate to="/help" replace />} />

              {/* Admin only */}
              <Route path="/admin/accounts" element={<AdminAccounts />} />
              <Route path="/admin/accounts/create" element={<CreateAccount />} />
              <Route path="/admin/accounts/edit/:id" element={<EditAccount />} />
              <Route path="/admin/academic-periods" element={<AcademicPeriods />} />
              <Route path="/admin/questions" element={<QuestionManagement />} />
              <Route path="/admin/recommendation-rules" element={<RecommendationRules />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              
              {/* Students only */}
              <Route
                path="/evaluation"
                element={
                  <ProtectedRoute roles={['student']}>
                    <EvaluationForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-submissions"
                element={
                  <ProtectedRoute roles={['student']}>
                    <MySubmissions />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="/"  element={<Navigate to="/login" replace />} />
            <Route path="*"  element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;