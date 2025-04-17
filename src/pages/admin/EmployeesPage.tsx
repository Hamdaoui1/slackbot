import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  team?: string;
  status: 'pending' | 'approved' | 'rejected';
  companyID?: string;
  teamID?: string;
}

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les employés depuis Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const usersData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user: any) => user.role === 'employee') as User[]; // Exclure les administrateurs
        setEmployees(usersData);
      } catch (error) {
        console.error('Erreur lors du chargement des employés :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Mettre à jour le statut d'un employé
  const handleStatusUpdate = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.id === userId ? { ...employee, status: newStatus } : employee
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  };

  // Supprimer un employé
  const handleDeleteEmployee = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.id !== userId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'employé :', error);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600">Chargement des employés...</p>;
  }

  const filteredUsers = employees.filter(
    (user) =>
      (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gestion des Employés</h1>
          <p className="text-lg text-gray-600">Consultez et gérez tous les employés</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un employé..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.companyID ? (
                        <Link
                          to={`/admin/company/${user.companyID}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {user.companyName}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.teamID ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(user.team) 
                            ? user.team.map((team, index) => (
                                <Link
                                  key={index}
                                  to={`/admin/company/${user.companyID}/team/${team}`}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors"
                                >
                                  {team}
                                </Link>
                              ))
                            : typeof user.team === 'string' && user.team.split(',').map((team, index) => (
                                <Link
                                  key={index}
                                  to={`/admin/company/${user.companyID}/team/${team.trim()}`}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors"
                                >
                                  {team.trim()}
                                </Link>
                              ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'approved'
                          ? 'Approuvé'
                          : user.status === 'pending'
                          ? 'En attente'
                          : 'Rejeté'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'approved')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'rejected')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;