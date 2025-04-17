import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Sidebar';
import { User } from '../types';

export const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirige vers la page de connexion
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed left-0 top-0">
      <nav className="mt-16 p-4">
        <a href="https://www.culture-maker.com/" target="_blank" rel="noopener noreferrer">
          <h1 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Culture Maker
          </h1>
        </a>
        <Link to="dashboard" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">🏠</span> Accueil
        </Link>
        <Link to="questionnaire" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">📋</span> Questionnaire
        </Link>
        <Link to="profile" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">👤</span> Profil
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 hover:bg-gray-700 rounded"
        >
          <span className="mr-3">🔓</span> Déconnexion
        </button>
      </nav>
    </div>
  );
};

export default function EmployeeLayout() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 w-full">
        <Navbar user={user as User} />
        <div className="p-8 mt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
}