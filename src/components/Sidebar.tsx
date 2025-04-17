import { Link } from 'react-router-dom';
import { User } from '../types';

export const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed left-0 top-0">
      <nav className="mt-16 p-4">
        <Link to="dashboard" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">🏠</span> Accueil
        </Link>
        <Link to="questionnaire" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">📋</span> Questionnaire
        </Link>
        <Link to="profile" className="flex items-center p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">👤</span> Profil
        </Link>
        <button className="flex items-center w-full p-3 hover:bg-gray-700 rounded">
          <span className="mr-3">🔓</span> Déconnexion
        </button>
      </nav>
    </div>
  );
};


export const Navbar = ({ user }: { user: User }) => {
  return (
    <div className="fixed top-0 left-64 right-0 bg-white shadow-md h-16 flex items-center px-6">
      <div className="flex items-center">
        <img src="/src/assets/logo.svg" alt="Culture Maker Logo" className="h-10 mr-4" />
        <span className="font-medium">
          {user.firstName} {user.lastName}
        </span>
        <span className="mx-2">•</span>
        <span className="text-gray-600">{user.company}</span>
      </div>
    </div>
  );
};