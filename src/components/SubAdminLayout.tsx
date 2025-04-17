import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Users, Users2, Building, Shield, LogOut, User, LayoutDashboard } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SubAdminLayoutProps {
  children: React.ReactNode;
}

interface SubAdminUser {
  firstName: string;
  lastName: string;
  company: string;
  companyId: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
}

function SubAdminLayout({ children }: SubAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [subAdminData, setSubAdminData] = useState<SubAdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubAdminData = async () => {
      if (user?.email) {
        try {
          const subAdminDoc = await getDoc(doc(db, 'sub-admin', user.email));
          if (subAdminDoc.exists()) {
            setSubAdminData(subAdminDoc.data() as SubAdminUser);
          }
        } catch (error) {
          console.error('Error fetching sub-admin data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubAdminData();
  }, [user?.email]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/sub-admin-login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Culture Maker</h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/sub-admin/dashboard"
            className={`flex items-center px-6 py-3 ${
              isActive('/sub-admin/dashboard')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Tableau de bord
          </Link>
          <Link
            to="/sub-admin/employees"
            className={`flex items-center px-6 py-3 ${
              isActive('/sub-admin/employees')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            Employés
          </Link>
          <Link
            to="/sub-admin/teams"
            className={`flex items-center px-6 py-3 ${
              isActive('/sub-admin/teams')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users2 className="h-5 w-5 mr-3" />
            Équipes
          </Link>
          <Link
            to="/sub-admin/profile"
            className={`flex items-center px-6 py-3 ${
              isActive('/sub-admin/profile')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="h-5 w-5 mr-3" />
            Profil
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {subAdminData?.firstName} {subAdminData?.lastName}
                </h2>
                <p className="text-sm text-gray-500">{subAdminData?.company}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Sous-Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default SubAdminLayout; 