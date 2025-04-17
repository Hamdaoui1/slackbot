import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Plus, Shield } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  companyID?: string;
  teamID?: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface Company {
  id: string;
  name: string;
  teams: string[];
  employees?: string[];
  subAdmins?: string[];
}

interface SubAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'sub-admin';
}

const CompanyPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyEmployees, setCompanyEmployees] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [proposedEmployees, setProposedEmployees] = useState<User[]>([]);
  const [newName, setNewName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);

  // Charger les données de l'entreprise
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;

      try {
        // Récupérer les données de l'entreprise
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (companyDoc.exists()) {
          const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company;
          setCompany(companyData);

          // Récupérer les sous-admins responsables
          if (companyData.subAdmins && companyData.subAdmins.length > 0) {
            const subAdminPromises = companyData.subAdmins.map(async (subAdminId) => {
              const subAdminDoc = await getDoc(doc(db, 'sub-admin', subAdminId));
              if (subAdminDoc.exists()) {
                return { id: subAdminDoc.id, ...subAdminDoc.data() } as SubAdmin;
              }
              return null;
            });

            const subAdminResults = await Promise.all(subAdminPromises);
            setSubAdmins(subAdminResults.filter((subAdmin): subAdmin is SubAdmin => subAdmin !== null));
          }

          // Récupérer les employés de l'entreprise
          if (companyData.employees && companyData.employees.length > 0) {
            const employeePromises = companyData.employees.map(async (employeeId) => {
              const employeeDoc = await getDoc(doc(db, 'users', employeeId));
              if (employeeDoc.exists()) {
                return { id: employeeDoc.id, ...employeeDoc.data() } as User;
              }
              return null;
            });

            const employeeResults = await Promise.all(employeePromises);
            setCompanyEmployees(employeeResults.filter((employee): employee is User => employee !== null));
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  // Charger tous les utilisateurs
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    });

    return () => unsubscribe(); // Nettoyer le listener lors du démontage du composant
  }, []);

  // Filtrer les utilisateurs en fonction du terme de recherche
  // Filtrer les utilisateurs en fonction du terme de recherche et exclure les utilisateurs en attente
useEffect(() => {
  if (!searchTerm) {
    setFilteredUsers([]);
    return;
  }

  const filtered = allUsers.filter(
    (user) =>
      user.status !== 'pending' && // Exclure les utilisateurs en attente
      ((user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );
  setFilteredUsers(filtered);
}, [searchTerm, allUsers]);

  // Ajouter un employé à l'entreprise
const handleAddEmployee = async (user: any) => {
  if (!company || !companyId) return;

  // Vérifier si l'utilisateur est en attente
  if (user.status === 'pending') {
    alert("Vous ne pouvez pas ajouter un utilisateur en attente.");
    return;
  }

  setLoading(true);
  try {
    // Vérifier si l'employé appartient déjà à une autre entreprise
    if (user.companyID && user.companyID !== companyId) {
      // Supprimer l'employé de l'ancienne entreprise
      const oldCompanyRef = doc(db, 'companies', user.companyID);
      const oldCompanySnap = await getDoc(oldCompanyRef);

      if (oldCompanySnap.exists()) {
        const oldCompanyData = oldCompanySnap.data();
        const updatedOldEmployees = (oldCompanyData.employees || []).filter(
          (id: string) => id !== user.id
        );
        await updateDoc(oldCompanyRef, { employees: updatedOldEmployees });
      }
    }

    // Ajouter l'utilisateur à la liste des employés de la nouvelle entreprise
    const updatedEmployees = company.employees ? [...company.employees, user.id] : [user.id];
    await updateDoc(doc(db, 'companies', companyId), { employees: updatedEmployees });

    // Mettre à jour les champs `companyName`, `companyID`, et réinitialiser `teamID` de l'utilisateur
    await updateDoc(doc(db, 'users', user.id), {
      companyName: company.name,
      companyID: companyId,
      teamID: '',
    });

    // Mettre à jour l'état local
    setCompany((prevCompany) => {
      if (!prevCompany) return null;
      return { ...prevCompany, employees: updatedEmployees };
    });

    setCompanyEmployees((prevEmployees) => [...prevEmployees, user]);
    setProposedEmployees((prevProposed) => prevProposed.filter((employee) => employee.id !== user.id));
    setSearchTerm(''); // Réinitialiser l'input de recherche
    alert(`L'utilisateur ${user.firstName} ${user.lastName} a été ajouté à l'entreprise.`);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'employé :', error);
  } finally {
    setLoading(false);
  }
};

  // Mettre à jour le nom de l'entreprise
  const handleUpdateName = async () => {
    if (!company || !newName) return;

    const companiesCollection = collection(db, 'companies');
    const snapshot = await getDocs(companiesCollection);

    const companyExists = snapshot.docs.some(
      (doc) =>
        doc.data().name.toLowerCase() === newName.toLowerCase() &&
        doc.id !== companyId
    );

    if (companyExists) {
      alert('Une entreprise avec ce nom existe déjà.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'companies', companyId!), { name: newName });
      setCompany({ ...company, name: newName });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom de l\'entreprise :', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !companyId) return;

    setLoading(true);
    try {
      const trimmedTeamName = newTeamName.trim();

      // Ajouter l'équipe dans Firestore
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        teams: arrayUnion(trimmedTeamName),
      });

      // Mettre à jour l'état local pour refléter le changement immédiatement
      setCompany((prevCompany) => {
        if (!prevCompany) return null;
        return {
          ...prevCompany,
          teams: [...prevCompany.teams, trimmedTeamName],
        };
      });

      // Réinitialiser le champ d'entrée
      setNewTeamName('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'équipe :', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamName: string) => {
    if (!companyId) return;
    
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        teams: arrayRemove(teamName)
      });
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleRemoveEmployee = async (userId: string) => {
    if (!company || !companyId) return;

    setLoading(true);
    try {
      // Retirer l'utilisateur de la liste des employés de l'entreprise
      const updatedEmployees = company.employees?.filter((id) => id !== userId) || [];
      await updateDoc(doc(db, 'companies', companyId), { employees: updatedEmployees });

      // Réinitialiser les champs `team` et `companyName` de l'utilisateur
      await updateDoc(doc(db, 'users', userId), {
        companyName: '',
        companyID: '',
        team: '',
      });

      // Mettre à jour l'état local
      setCompany({ ...company, employees: updatedEmployees });
      alert('L\'employé a été retiré de l\'entreprise.');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'employé :', error);
    } finally {
      setLoading(false);
    }
  };

  if (!company) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Entreprise : {company.name}</h1>
          <p className="text-lg text-gray-600">Gérez votre entreprise et vos équipes</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Company Name Update */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Modifier le nom de l'entreprise</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nouveau nom de l'entreprise"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Mettre à jour
                </button>
              </div>
            </div>

            {/* Teams Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gérer les équipes</h2>
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Nom de la nouvelle équipe"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTeam}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="space-y-4">
                  {company.teams.map((team) => (
                    <div key={team} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <Link 
                        to={`/admin/company/${companyId}/team/${team}`} 
                        className="text-lg font-medium text-blue-600 hover:text-blue-800"
                      >
                        {team}
                      </Link>
                      <button
                        onClick={() => handleDeleteTeam(team)}
                        className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Admins Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sous-Admins responsables</h2>
              <div className="space-y-4">
                {subAdmins.map((subAdmin) => (
                  <div key={subAdmin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{subAdmin.firstName} {subAdmin.lastName}</h3>
                      <p className="text-gray-600">{subAdmin.email}</p>
                      <p className="text-sm text-gray-500">Statut: {subAdmin.status === 'approved' ? 'Approuvé' : 'En attente'}</p>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-600">Sous-Admin</span>
                    </div>
                  </div>
                ))}
                {subAdmins.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucun sous-admin n'est actuellement responsable de cette entreprise.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Add Employees */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ajouter des employés</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un employé par nom ou prénom"
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="space-y-4">
  {filteredUsers.map((user) => (
    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <span className="text-lg font-medium">{user.firstName} {user.lastName}</span>
      <button
        onClick={() => handleAddEmployee(user)}
        disabled={company.employees?.includes(user.id)}
        className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
          company.employees?.includes(user.id)
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {company.employees?.includes(user.id) ? 'Déjà ajouté' : 'Ajouter'}
      </button>
    </div>
  ))}
</div>
            </div>

            {/* Employee List */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Liste des employés</h2>
              <div className="space-y-4">
                {company.employees?.map((userId) => {
                  const user = allUsers.find((u) => u.id === userId);
                  return (
                    <div key={userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-lg font-medium">{user?.firstName} {user?.lastName}</span>
                      <button
                        onClick={() => handleRemoveEmployee(userId)}
                        className="px-6 py-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        Retirer
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;