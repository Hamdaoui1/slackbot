import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, FileSpreadsheet, BarChart } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  team?: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'employee' | 'admin';
  createdAt: string;
}

function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const location = useLocation();

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: User[] = [];
      snapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(userData);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const pendingUsers = users.filter(user => user.role === 'employee' && user.status === 'pending');
  const approvedUsers = users.filter(user => user.role === 'employee' && user.status === 'approved');


  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users and surveys</p>
      </div>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-5 h-5 mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'surveys'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Surveys
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart className="w-5 h-5 mr-2" />
          Analytics
        </button>
      </div>

      {/* Nouveau bouton pour accéder à Company Management */}
      <div className="mt-6">
        <Link
          to="/admin/company-management"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Gérer les entreprises et les équipes
        </Link>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Existing content for users */}
        </div>
      )}
      {activeTab === 'surveys' && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Survey management coming soon</p>
        </div>
      )}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Analytics dashboard coming soon</p>
        </div>
      )}
    </div>
  );

}

export default AdminDashboard;