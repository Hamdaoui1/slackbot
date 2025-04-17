import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc, setDoc } from 'firebase/firestore';
import { Users, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  companyId: string;
  members: string[];
}

interface SubAdmin {
  id: string;
  companyId: string;
}

function SubAdminTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setError('UID utilisateur non disponible');
        setLoading(false);
        return;
      }

      try {
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

        const teamsCollection = collection(db, 'teams');
        const teamsSnapshot = await getDocs(teamsCollection);
        
        const teamsData: Team[] = [];
        teamsSnapshot.forEach((doc) => {
          if (doc.id.startsWith(companyId)) {
            const teamData = doc.data();
            if (doc.exists() && teamData.name) {
              teamsData.push({ 
                id: doc.id, 
                name: teamData.name,
                companyId: companyId,
                members: teamData.members || []
              } as Team);
            }
          }
        });
        
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Veuillez entrer un nom d\'équipe');
      return;
    }

    try {
      const subAdminDoc = await getDoc(doc(db, 'sub-admin', user?.uid || ''));
      if (!subAdminDoc.exists()) {
        setError('Données sous-admin non trouvées');
        return;
      }

      const subAdminData = subAdminDoc.data() as SubAdmin;
      const companyId = subAdminData.companyId;

      const teamsQuery = query(
        collection(db, 'teams'),
        where('companyId', '==', companyId),
        where('name', '==', newTeamName)
      );
      const existingTeams = await getDocs(teamsQuery);
      
      if (!existingTeams.empty) {
        setError('Une équipe avec ce nom existe déjà');
        return;
      }

      const teamId = `${companyId}-${newTeamName}`;

      const teamRef = doc(db, 'teams', teamId);
      await setDoc(teamRef, {
        id: teamId,
        name: newTeamName,
        companyId: companyId,
        members: []
      });

      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        teams: arrayUnion(newTeamName)
      });

      setTeams([...teams, { 
        id: teamId,
        name: newTeamName,
        companyId: companyId,
        members: []
      }]);
      
      setNewTeamName('');
      setShowAddTeamModal(false);
      setError(null);

    } catch (error) {
      console.error('Error adding team:', error);
      setError('Erreur lors de l\'ajout de l\'équipe');
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Équipes</h1>
              <p className="text-lg text-gray-600">Liste des équipes de votre entreprise</p>
            </div>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une équipe
            </button>
          </div>
        </div>

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
              placeholder="Rechercher une équipe..."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom de l'équipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de membres
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/sub-admin/team/${team.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {team.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {team.members.length} membre(s)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddTeamModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajouter une nouvelle équipe</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Entrez le nom de l'équipe"
              />
            </div>

            {error && (
              <div className="mb-6 bg-red-50 text-red-500 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setNewTeamName('');
                  setError(null);
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTeam}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubAdminTeams;