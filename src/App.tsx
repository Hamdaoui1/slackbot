import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';
import EmployeeDashboard from './pages/employee/Dashboard';
import Questionnaire from './pages/employee/Questionnaire';
import Layout from './components/Layout';
import EmployeeLayout from './components/EmployeeLayout';
import { AuthProvider } from './contexts/AuthContext';
import Profile from './pages/employee/Profile';
import CompanyManagement from './pages/admin/CompanyManagement';
import CompanyPage from './pages/admin/CompanyPage';
import TeamPage from './pages/admin/TeamPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          
          {/* Routes Admin */}
          <Route path="/admin/*" element={<PrivateLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="company-management" element={<CompanyManagement />} />
            <Route path="company/:companyId" element={<CompanyPage />} />
            <Route path="company/:companyId/team/:teamName" element={<TeamPage />} />
          </Route>

          {/* Routes Employé */}
          <Route path="/employee/*" element={<EmployeePrivateLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="questionnaire" element={<Questionnaire />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function PrivateLayout() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function EmployeePrivateLayout() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <EmployeeLayout />;
}

export default App; 