import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CompanyPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState<{ name: string; teams: string[]; employees?: string[] } | null>(null);
  const [newName, setNewName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Charger les informations de l'entreprise
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;

      const docRef = doc(db, 'companies', companyId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const companyData = docSnap.data() as { name: string; teams: string[]; employees?: string[] };
        setCompany(companyData);
        setNewName(companyData.name);
      }
    };

    fetchCompany();
  }, [companyId]);

  // Charger tous les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    };

    fetchUsers();
  }, []);

  // Filtrer les utilisateurs en fonction du terme de recherche
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers([]);
      return;
    }

    const filtered = allUsers.filter(
      (user) =>
        (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);

  // Ajouter un employé à l'entreprise
const handleAddEmployee = async (user: any) => {
  if (!company || !companyId) return;

  setLoading(true);
  try {
    // Vérifier si l'employé appartient déjà à une autre équipe
    if (user.teamID && user.teamID !== `${companyId}-${newTeamName}`) {
      // Supprimer l'employé de l'équipe précédente
      const oldTeamRef = doc(db, 'teams', user.teamID);
      const oldTeamSnap = await getDoc(oldTeamRef);

      if (oldTeamSnap.exists()) {
        const oldTeamData = oldTeamSnap.data();
        const updatedOldMembers = (oldTeamData.members || []).filter(
          (member: any) => member.id !== user.id
        );
        await updateDoc(oldTeamRef, { members: updatedOldMembers });
      }
    }

    // Ajouter l'utilisateur à la liste des employés de la nouvelle entreprise
    const updatedEmployees = company.employees ? [...company.employees, user.id] : [user.id];
    await updateDoc(doc(db, 'companies', companyId), { employees: updatedEmployees });

    // Ajouter l'utilisateur à la nouvelle équipe
    const teamRef = doc(db, 'teams', `${companyId}-${newTeamName}`);
    const updatedMembers = [...teamMembers, { id: user.id, firstName: user.firstName, lastName: user.lastName }];
    await updateDoc(teamRef, { members: updatedMembers });

    // Mettre à jour les champs `companyName`, `companyID`, et `teamID` de l'utilisateur
    await updateDoc(doc(db, 'users', user.id), {
      companyName: company.name,
      companyID: companyId,
      teamID: `${companyId}-${newTeamName}`,
    });

    // Mettre à jour l'état local
    setCompany({ ...company, employees: updatedEmployees });
    setTeamMembers(updatedMembers);
    setProposedEmployees(proposedEmployees.filter((employee) => employee.id !== user.id));
    setSearchTerm(''); // Réinitialiser l'input de recherche
    alert(`L'utilisateur ${user.firstName} ${user.lastName} a été ajouté à l'équipe.`);
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

    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        teams: arrayUnion(newTeamName.trim())
      });
      setNewTeamName('');
    } catch (error) {
      console.error('Error adding team:', error);
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Entreprise : {company.name}</h1>

      {/* Modifier le nom de l'entreprise */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Modifier le nom de l'entreprise</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleUpdateName}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Mettre à jour
          </button>
        </div>
      </div>

      {/* Ajouter une équipe */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Ajouter une équipe</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Nom de l'équipe"
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleAddTeam}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des équipes */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Équipes</h2>
        <ul className="space-y-2">
          {company.teams.map((team) => (
            <li key={team} className="flex items-center justify-between p-2 border rounded-md bg-gray-100">
              <Link to={`/admin/company/${companyId}/team/${team}`} className="text-blue-600 hover:underline">
                {team}
              </Link>
              <button
                onClick={() => handleDeleteTeam(team)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Ajouter des employés */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Ajouter des employés</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un employé par nom ou prénom"
          className="w-full p-2 border rounded-md mb-4"
        />
        <ul className="space-y-2">
  {filteredUsers.map((user) => (
    <li key={user.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-100">
      <span>{user.firstName} {user.lastName}</span>
      <button
        onClick={() => handleAddEmployee(user)}
        disabled={company.employees?.includes(user.id)}
        className={`px-3 py-1 rounded-md ${
          company.employees?.includes(user.id)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        {company.employees?.includes(user.id) ? 'Déjà ajouté' : 'Ajouter'}
      </button>
    </li>
  ))}
</ul>
      </div>
      {/* Liste des employés */}
<div className="mt-6">
  <h2 className="text-lg font-semibold mb-2">Liste des employés</h2>
  <ul className="space-y-2">
    {company.employees?.map((userId) => {
      const user = allUsers.find((u) => u.id === userId);
      return (
        <li key={userId} className="flex items-center justify-between p-2 border rounded-md bg-gray-100">
          <span>{user?.firstName} {user?.lastName}</span>
          <button
            onClick={() => handleRemoveEmployee(userId)}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Retirer
          </button>
        </li>
      );
    })}
  </ul>
</div>
    </div>
  );
};

export default CompanyPage;