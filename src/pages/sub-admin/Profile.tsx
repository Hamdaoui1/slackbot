import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, Mail, Calendar, CheckCircle, XCircle, Building } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SubAdminUser {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  companyId: string;
  role: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
}

function SubAdminProfile() {
  const { user } = useAuth();
  const [subAdminData, setSubAdminData] = useState<SubAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubAdminData = async () => {
      console.log('Fetching sub-admin data for UID:', user?.uid);
      
      if (!user?.uid) {
        setError('UID utilisateur non disponible');
        setLoading(false);
        return;
      }

      try {
        const subAdminDoc = await getDoc(doc(db, 'sub-admin', user.uid));
        console.log('Firestore document exists:', subAdminDoc.exists());
        
        if (subAdminDoc.exists()) {
          const data = subAdminDoc.data();
          console.log('Retrieved data:', data);
          setSubAdminData(data as SubAdminUser);
        } else {
          setError('Document sous-admin non trouvé');
        }
      } catch (error) {
        console.error('Error fetching sub-admin data:', error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdminData();
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-gray-600">Email: {user?.email}</p>
      </div>
    );
  }

  if (!subAdminData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Sous-Admin</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-gray-700">Sous-Admin</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="text-gray-900 font-medium">
                    {subAdminData.firstName} {subAdminData.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{subAdminData.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <p className="text-gray-900 font-medium">{subAdminData.company}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date d'approbation</p>
                  <p className="text-gray-900 font-medium">
                    {subAdminData.approvedAt 
                      ? new Date(subAdminData.approvedAt).toLocaleDateString('fr-FR')
                      : 'En attente d\'approbation'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {subAdminData.status === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : subAdminData.status === 'pending' ? (
                  <Calendar className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <p className={`font-medium ${
                    subAdminData.status === 'approved' 
                      ? 'text-green-600' 
                      : subAdminData.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {subAdminData.status === 'approved' 
                      ? 'Approuvé' 
                      : subAdminData.status === 'pending'
                      ? 'En attente'
                      : 'Rejeté'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubAdminProfile; 