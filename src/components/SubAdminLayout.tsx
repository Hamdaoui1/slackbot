import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Users, Users2, Building, Shield, LogOut, User, LayoutDashboard } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Sidebar } from './Sidebar';

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

const SubAdminLayout: React.FC = () => {
  console.log('SubAdminLayout - Rendering layout');
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SubAdminLayout; 