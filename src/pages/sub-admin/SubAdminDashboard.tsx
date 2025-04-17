import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Users, Building, BarChart, Plus, FileSpreadsheet, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  teams: string[];
  employees: string[];
  subAdmins: string[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  team: string;
  status: string;
}

interface SubAdmin {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

function SubAdminDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company;
        setCompany(companyData);

        // Récupérer les employés en utilisant leurs IDs
        if (companyData.employees && companyData.employees.length > 0) {
          const employeePromises = companyData.employees.map(async (employeeId: string) => {
            const employeeDoc = await getDoc(doc(db, 'users', employeeId));
            if (employeeDoc.exists()) {
              return { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
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

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Aucune entreprise trouvée</p>
      </div>
    );
  }

  // Calculer les statistiques
  const totalEmployees = employees.length;
  const totalTeams = company.teams.length;
  const activeEmployees = employees.filter(emp => emp.status === 'approved').length;
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Sous-Admin</h1>
              <p className="text-lg text-gray-600">Gestion de l'entreprise {company.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-gray-700">Sous-Admin</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to={`/sub-admin/employees`}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{totalEmployees}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employés</h3>
            <p className="text-gray-600">Gérer les employés de l'entreprise</p>
          </Link>

          <Link
            to={`/sub-admin/teams`}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Building className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{totalTeams}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Équipes</h3>
            <p className="text-gray-600">Gérer les équipes de l'entreprise</p>
          </Link>

          <Link
            to={`/sub-admin/questionnaires`}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <FileSpreadsheet className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Questionnaires</h3>
            <p className="text-gray-600">Gérer les questionnaires</p>
          </Link>

          <Link
            to={`/sub-admin/analytics`}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600">Voir les statistiques</p>
          </Link>
        </div>

        {/* Company Details */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Détails de l'Entreprise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations Générales</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nom de l'entreprise</p>
                  <p className="text-gray-900 font-medium">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre d'équipes</p>
                  <p className="text-gray-900 font-medium">{totalTeams}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre total d'employés</p>
                  <p className="text-gray-900 font-medium">{totalEmployees}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employés actifs</p>
                  <p className="text-gray-900 font-medium">{activeEmployees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employés en attente</p>
                  <p className="text-gray-900 font-medium">{pendingEmployees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taux d'activité</p>
                  <p className="text-gray-900 font-medium">
                    {totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Activité Récente</h2>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une activité
            </button>
          </div>
          <div className="space-y-4">
            {employees.slice(0, 5).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-gray-600">{employee.email}</p>
                  <p className="text-sm text-gray-500">Équipe: {employee.team}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  employee.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {employee.status === 'approved' ? 'Actif' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubAdminDashboard;