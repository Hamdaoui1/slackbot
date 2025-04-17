import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileSpreadsheet, LogOut, Users } from 'lucide-react';
import { auth } from '../lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <a href="https://www.culture-maker.com/" target="_blank" rel="noopener noreferrer">
            <h1 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              Culture Maker
            </h1>
          </a>
        </div>
        <nav className="mt-4">
          <Link
            to="/admin/dashboard"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              location.pathname === '/admin/dashboard' ? 'bg-gray-100' : ''
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <Link
            to="/admin/surveys"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              location.pathname === '/admin/surveys' ? 'bg-gray-100' : ''
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Surveys
          </Link>
          <Link
            to="/admin/employees"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              location.pathname === '/admin/employees' ? 'bg-gray-100' : ''
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Employees
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

export default Layout;