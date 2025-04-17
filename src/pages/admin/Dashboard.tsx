import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, FileSpreadsheet, BarChart, Shield, X } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  team?: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'employee' | 'admin' | 'sub-admin';
  createdAt: string;
}

interface SubAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'sub-admin';
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null);
  const [approvalData, setApprovalData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    companyId: ''
  });
  const location = useLocation();

  // Charger les entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      const companiesQuery = query(collection(db, 'companies'));
      const snapshot = await getDocs(companiesQuery);
      const companiesData: Company[] = [];
      snapshot.forEach((doc) => {
        companiesData.push({ id: doc.id, ...doc.data() } as Company);
      });
      setCompanies(companiesData);
    };

    fetchCompanies();
  }, []);

  // Écouter les changements dans la collection users
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const userData: User[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(userData);
    });

    // Écouter les changements dans la collection sub-admin
    const subAdminsQuery = query(collection(db, 'sub-admin'));
    const subAdminsUnsubscribe = onSnapshot(subAdminsQuery, (snapshot) => {
      const subAdminData: SubAdmin[] = [];
      snapshot.forEach((doc) => {
        subAdminData.push({ id: doc.id, ...doc.data() } as SubAdmin);
      });
      setSubAdmins(subAdminData);
    });

    return () => {
      usersUnsubscribe();
      subAdminsUnsubscribe();
    };
  }, []);

  const handleStatusUpdate = async (userId: string, newStatus: 'approved' | 'rejected', isSubAdmin: boolean = false) => {
    try {
      const collectionName = isSubAdmin ? 'sub-admin' : 'users';
      await updateDoc(doc(db, collectionName, userId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleApproveClick = (subAdmin: SubAdmin) => {
    setSelectedSubAdmin(subAdmin);
    setApprovalData({
      firstName: subAdmin.firstName,
      lastName: subAdmin.lastName,
      company: subAdmin.company,
      companyId: ''
    });
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedSubAdmin) return;

    try {
      // Trouver l'entreprise correspondante pour obtenir son ID
      const companyQuery = query(
        collection(db, 'companies'),
        where('name', '==', approvalData.company)
      );
      const companySnapshot = await getDocs(companyQuery);
      
      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        const companyId = companyDoc.id;

        // Mettre à jour les informations dans la collection sub-admin avec l'ID de l'entreprise
        await updateDoc(doc(db, 'sub-admin', selectedSubAdmin.id), {
          status: 'approved',
          firstName: approvalData.firstName,
          lastName: approvalData.lastName,
          company: approvalData.company,
          companyId: companyId,
          approvedAt: new Date().toISOString()
        });

        // Mettre à jour le tableau des sous-admins de l'entreprise
        const companyData = companyDoc.data();
        const updatedSubAdmins = companyData.subAdmins || [];
        if (!updatedSubAdmins.includes(selectedSubAdmin.id)) {
          updatedSubAdmins.push(selectedSubAdmin.id);
          await updateDoc(doc(db, 'companies', companyId), {
            subAdmins: updatedSubAdmins
          });
        }
      }

      setShowApprovalModal(false);
    } catch (error) {
      console.error('Error updating sub-admin:', error);
    }
  };

  const pendingUsers = users.filter(user => user.role === 'employee' && user.status === 'pending');
  const approvedUsers = users.filter(user => user.role === 'employee' && user.status === 'approved');
  const pendingSubAdmins = subAdmins.filter(subAdmin => subAdmin.status === 'pending');
  const approvedSubAdmins = subAdmins.filter(subAdmin => subAdmin.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tableau de Bord Administrateur</h1>
          <p className="text-lg text-gray-600">Gérez les utilisateurs et les questionnaires</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/admin/company-management"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Users className="w-5 h-5 mr-2" />
            Gérer les entreprises et les équipes
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Employés
            </button>
            <button
              onClick={() => setActiveTab('sub-admins')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'sub-admins'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              Sous-Admins
            </button>
            <button
              onClick={() => setActiveTab('surveys')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'surveys'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Questionnaires
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart className="w-5 h-5 mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Pending Users */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Employés en attente</h2>
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">Inscrit le {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleStatusUpdate(user.id, 'approved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(user.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Users */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Employés approuvés</h2>
                <div className="space-y-4">
                  {approvedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">Entreprise: {user.companyName}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Approuvé
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sub-admins' && (
            <div className="space-y-6">
              {/* Pending Sub-Admins */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sous-Admins en attente</h2>
                <div className="space-y-4">
                  {pendingSubAdmins.map((subAdmin) => (
                    <div key={subAdmin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{subAdmin.firstName} {subAdmin.lastName}</h3>
                        <p className="text-gray-600">{subAdmin.email}</p>
                        <p className="text-sm text-gray-500">Entreprise: {subAdmin.company}</p>
                        <p className="text-sm text-gray-500">Inscrit le {new Date(subAdmin.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApproveClick(subAdmin)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(subAdmin.id, 'rejected', true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Sub-Admins */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sous-Admins approuvés</h2>
                <div className="space-y-4">
                  {approvedSubAdmins.map((subAdmin) => (
                    <div key={subAdmin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{subAdmin.firstName} {subAdmin.lastName}</h3>
                        <p className="text-gray-600">{subAdmin.email}</p>
                        <p className="text-sm text-gray-500">Entreprise: {subAdmin.company}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Approuvé
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'surveys' && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gestion des questionnaires</h2>
              <p className="text-gray-600">Fonctionnalité à venir</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h2>
              <p className="text-gray-600">Tableau de bord analytics à venir</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation d'approbation */}
      {showApprovalModal && selectedSubAdmin && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Confirmer l'approbation</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={approvalData.firstName}
                  onChange={(e) => setApprovalData({...approvalData, firstName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Entrez le prénom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={approvalData.lastName}
                  onChange={(e) => setApprovalData({...approvalData, lastName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Entrez le nom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                <select
                  value={approvalData.company}
                  onChange={(e) => setApprovalData({...approvalData, company: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">Sélectionnez une entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={!approvalData.firstName || !approvalData.lastName || !approvalData.company}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirmer l'approbation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;