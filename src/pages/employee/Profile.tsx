// filepath: src/pages/employee/Profile.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Utilisateur non connecté.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Profil de l'utilisateur</h1>
      <p><strong>Prénom :</strong> {user.firstName}</p>
      <p><strong>Nom :</strong> {user.lastName}</p>
      <p><strong>Email :</strong> {user.email}</p>
      <p><strong>Entreprise :</strong> {user.company}</p>
    </div>
  );
};

export default Profile;