import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';
import AdminRegister from './pages/auth/AdminRegister';
import EmployeeDashboard from './pages/employee/Dashboard';
import Questionnaire from './pages/employee/Questionnaire';
import Layout from './components/Layout';
import EmployeeLayout from './components/EmployeeLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Profile from './pages/employee/Profile';
import CompanyManagement from './pages/admin/CompanyManagement';
import CompanyPage from './pages/admin/CompanyPage';
import TeamPage from './pages/admin/TeamPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import SubAdminDashboard from './pages/sub-admin/SubAdminDashboard';
import SubAdminLogin from './pages/auth/SubAdminLogin';
import SubAdminRegister from './pages/auth/SubAdminRegister';
import SubAdminProfile from './pages/sub-admin/Profile';
import SubAdminLayout from './components/SubAdminLayout';
import SubAdminEmployees from './pages/sub-admin/Employees';
import SubAdminTeamPage from './pages/sub-admin/TeamPage';
import SubAdminTeams from './pages/sub-admin/Teams';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          
          {/* Routes Admin - Accessible uniquement aux administrateurs */}
          <Route path="/admin/*" element={<AdminPrivateLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="company-management" element={<CompanyManagement />} />
            <Route path="company/:companyId" element={<CompanyPage />} />
            <Route path="company/:companyId/team/:teamName" element={<TeamPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Routes pour les sous-administrateurs */}
          <Route path="/sub-admin-login" element={<SubAdminLogin />} />
          <Route path="/sub-admin-register" element={<SubAdminRegisterProtected />} /> 
          <Route path="/sub-admin/*" element={<SubAdminPrivateLayout />}>
            <Route path="dashboard" element={<SubAdminDashboard />} />
            <Route path="profile" element={<SubAdminProfile />} />
            <Route path="employees" element={<SubAdminEmployees />} />
            <Route path="teams" element={<SubAdminTeams />} />
            <Route path="team/:teamId" element={<SubAdminTeamPage />} />
            <Route path="*" element={<Navigate to="/sub-admin/dashboard" replace />} />
          </Route>

          {/* Routes Employé - Accessible uniquement aux employés */}
          <Route path="/employee/*" element={<EmployeePrivateLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="questionnaire" element={<Questionnaire />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
          </Route>

          {/* Redirection des routes inexistantes */}
          <Route path="*" element={<RouteRedirector />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function RouteRedirector() {
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

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'sub-admin':
      return <Navigate to="/sub-admin/dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function SubAdminRegisterProtected() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'sub-admin') {
      return <Navigate to="/sub-admin/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <SubAdminRegister />;
}

function AdminPrivateLayout() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (user.role !== 'admin') {
    if (user.role === 'employee') {
      return <Navigate to="/login" replace />;
    } else if (user.role === 'sub-admin') {
      return <Navigate to="/sub-admin-login" replace />;
    }
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

  // Vérification du rôle et du statut
  if (user.role !== 'employee') {
    // Redirection basée sur le rôle
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'sub-admin':
        return <Navigate to="/sub-admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Vérification du statut pour les employés
  if (user.status === 'pending') {
    return <Navigate to="/login?message=approval_pending" replace />;
  }

  return <EmployeeLayout />;
}

function SubAdminPrivateLayout() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sub-admin-login" replace />;
  }

  if (user.role !== 'sub-admin') {
    // Redirection basée sur le rôle
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'employee':
        return <Navigate to="/employee/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <SubAdminLayout>
      <Outlet />
    </SubAdminLayout>
  );
}

export default App;