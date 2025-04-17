import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Users, Search, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teams?: string[];
  teamId?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface SubAdmin {
  id: string;
  companyId: string;
}

function SubAdminEmployees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setError('UID utilisateur non disponible');
        setLoading(false);
        return;
      }

      try {
        // Récupérer d'abord les données du sous-admin
        const subAdminDoc = await getDoc(doc(db, 'sub-admin', user.uid));
        if (!subAdminDoc.exists()) {
          setError('Données sous-admin non trouvées');
          setLoading(false);
          return;
        }

        const subAdminData = subAdminDoc.data() as SubAdmin;
        const companyId = subAdminData.companyId;

        if (!companyId) {
          setError('Aucune entreprise associée');
          setLoading(false);
          return;
        }

        // Récupérer les données de l'entreprise
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (!companyDoc.exists()) {
          setError('Entreprise non trouvée');
          setLoading(false);
          return;
        }

        const companyData = companyDoc.data();
        
        // Récupérer les employés en utilisant leurs IDs
        if (companyData.employees && companyData.employees.length > 0) {
          const employeePromises = companyData.employees.map(async (employeeId: string) => {
            const employeeDoc = await getDoc(doc(db, 'users', employeeId));
            if (employeeDoc.exists()) {
              const data = employeeDoc.data();
              return {
                id: employeeDoc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                teams: data.teams || [],
                teamId: data.teamId || [],
                status: data.status,
                createdAt: data.createdAt
              } as Employee;
            }
            return null;
          });

          const employeeResults = await Promise.all(employeePromises);
          const validEmployees = employeeResults.filter((employee): employee is Employee => employee !== null);
          setEmployees(validEmployees);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  const filteredEmployees = employees.filter(employee => 
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeamClick = (teamId: string) => {
    navigate(`/sub-admin/team/${teamId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Employés</h1>
              <p className="text-lg text-gray-600">Liste des employés de votre entreprise</p>
            </div>
            <Link
              to="/sub-admin/employees/add"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un employé
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Rechercher un employé..."
            />
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(employee.teams || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(employee.teams || []).map((team, index) => (
                            <button
                              key={index}
                              onClick={() => handleTeamClick(employee.teamId?.[index] || '')}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                            >
                              {team}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Aucune équipe</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'approved'
                          ? 'Actif'
                          : employee.status === 'pending'
                          ? 'En attente'
                          : 'Rejeté'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(employee.createdAt).toLocaleDateString()}
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
}

export default SubAdminEmployees; 