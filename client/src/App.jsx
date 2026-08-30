import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/student/Dashboard';
import RequestDetail from './pages/student/RequestDetail';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import StaffDashboard from './pages/staff/Dashboard';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const dashboardMap = {
    STUDENT: '/student/dashboard',
    SUPERVISOR: '/supervisor/dashboard',
    STAFF: '/staff/dashboard',
  };

  return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/requests/:id"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <RequestDetail />
              </ProtectedRoute>
            }
          />

          {/* Supervisor routes */}
          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute roles={['SUPERVISOR']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles={['STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
