import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  companyID?: string;
  teamID?: string;
}

const TeamPage = () => {
  const { companyId, teamName } = useParams();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyEmployees, setCompanyEmployees] = useState<User[]>([]);
  const [proposedEmployees, setProposedEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  const fetchTeamData = async () => {
    if (!companyId || !teamName) {
      console.error('companyId ou teamName manquant');
      return;
    }

    try {
      // Récupérer les données de l'équipe depuis Firestore
      const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        const membersWithDetails = await Promise.all(
          (teamData.members || []).map(async (member: any) => {
            if (member.firstName && member.lastName) {
              return member; // Si les détails sont déjà présents, les utiliser
            }

            // Sinon, récupérer les détails depuis la collection `users`
            const userRef = doc(db, 'users', member.id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              return { id: member.id, firstName: userData.firstName, lastName: userData.lastName };
            }

            return null; // Si l'utilisateur n'existe pas, retourner null
          })
        );

        setTeamMembers(membersWithDetails.filter((member) => member !== null));
      } else {
        // Si l'équipe n'existe pas encore, la créer
        await setDoc(teamRef, {
          id: `${companyId}-${teamName}`,
          companyId,
          name: teamName,
          members: [],
        });
        setTeamMembers([]);
      }

      // Récupérer les employés de l'entreprise
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as User))
        .filter((user) => user.companyID === companyId);
      setCompanyEmployees(usersData);
    } catch (err) {
      console.error('Erreur lors de la récupération des données :', err);
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  fetchTeamData();
}, [companyId, teamName]);

useEffect(() => {
  // Proposer les employés qui ne sont pas encore dans l'équipe
  const proposed = companyEmployees.filter(
    (employee) => !teamMembers.some((member) => member.id === employee.id)
  );
  setProposedEmployees(proposed);
}, [companyEmployees, teamMembers]);

const handleAddMember = async (userId: string) => {
  if (!companyId || !teamName) return;

  setLoading(true);
  try {
    const user = companyEmployees.find((employee) => employee.id === userId);
    if (!user) {
      console.error('Utilisateur introuvable');
      return;
    }

    const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
    const updatedMembers = [...teamMembers, { id: userId, firstName: user.firstName, lastName: user.lastName }];

    // Mettre à jour les membres de l'équipe dans Firestore
    await updateDoc(teamRef, { members: updatedMembers });

    // Ajouter le champ `teamID` dans le document de l'utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { teamID: `${companyId}-${teamName}` });

    // Mettre à jour l'état local
    setTeamMembers(updatedMembers);
    setProposedEmployees(proposedEmployees.filter((employee) => employee.id !== userId));
  } catch (err) {
    console.error('Erreur lors de l\'ajout du membre :', err);
    setError('Impossible d\'ajouter le membre.');
  } finally {
    setLoading(false);
  }
};

  const handleRemoveMember = async (memberId: string) => {
    if (!companyId || !teamName) return;

    setLoading(true);
    try {
      const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
      const updatedMembers = teamMembers.filter((member: any) => member.id !== memberId);
      await updateDoc(teamRef, { members: updatedMembers });
      setTeamMembers(updatedMembers);
    } catch (err) {
      console.error('Erreur lors de la suppression du membre :', err);
      setError('Impossible de supprimer le membre.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Équipe : {teamName}</h1>

      {/* Liste des membres de l'équipe */}
{/* Liste des membres de l'équipe */}
<h2 className="text-lg font-semibold mb-4">Membres de l'équipe</h2>
{teamMembers.length > 0 ? (
  <ul className="space-y-2">
    {teamMembers.map((member) => (
      <li
        key={member.id}
        className="flex items-center justify-between p-2 border rounded-md bg-gray-100"
      >
        <span>{member.firstName} {member.lastName}</span>
        <button
          onClick={() => handleRemoveMember(member.id)}
          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Retirer
        </button>
      </li>
    ))}
  </ul>
) : (
  <p>Aucun membre dans cette équipe.</p>
)}
      {/* Proposer des employés */}
<h2 className="text-lg font-semibold mt-6 mb-4">Proposer des employés</h2>
{proposedEmployees.length > 0 ? (
  <ul className="space-y-2">
    {proposedEmployees.map((employee) => (
      <li
        key={employee.id}
        className="flex items-center justify-between p-2 border rounded-md bg-gray-100"
      >
        <span>{employee.firstName} {employee.lastName}</span>
        <button
          onClick={() => handleAddMember(employee.id)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          Ajouter
        </button>
      </li>
    ))}
  </ul>
) : (
  <p>Aucun employé à proposer.</p>
)}
    </div>
  );
};

export default TeamPage;