import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, onSnapshot, DocumentSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyEmployees, setCompanyEmployees] = useState<User[]>([]);
  const [proposedEmployees, setProposedEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamExists, setTeamExists] = useState(false);

  // Vérifier si l'équipe existe dans la collection companies
  useEffect(() => {
    if (!companyId || !teamName) return;

    const checkTeamExists = async () => {
      try {
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);
        
        if (!companySnap.exists()) {
          navigate('/admin/company-management');
          return;
        }

        const companyData = companySnap.data();
        const teams = companyData.teams || [];

        if (!teams.includes(teamName)) {
          navigate(`/admin/company/${companyId}`);
          return;
        }

        setTeamExists(true);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'équipe:', error);
        setError('Erreur lors de la vérification de l\'équipe');
      }
    };

    checkTeamExists();
  }, [companyId, teamName, navigate]);

  // Charger les données de l'équipe
  useEffect(() => {
    if (!companyId || !teamName || !teamExists) return;

    const fetchTeamData = async () => {
      try {
        const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
        const teamSnap = await getDoc(teamRef);
        
        if (teamSnap.exists()) {
          const teamData = teamSnap.data();
          setTeamMembers(teamData.members || []);
        } else {
          // Si l'équipe n'existe pas dans teams mais existe dans companies, la créer
          await setDoc(teamRef, {
            id: `${companyId}-${teamName}`,
            companyId,
            name: teamName,
            members: []
          });
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de l\'équipe:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [companyId, teamName, teamExists]);

  // Charger les employés de l'entreprise
  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyEmployees = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const usersData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as User))
          .filter((user) => user.companyID === companyId);
        
        setCompanyEmployees(usersData);
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error);
      }
    };

    fetchCompanyEmployees();
  }, [companyId]);

  // Mettre à jour les employés proposés
  useEffect(() => {
    const proposed = companyEmployees.filter(
      (employee) => !teamMembers.some((member) => member.id === employee.id)
    );
    setProposedEmployees(proposed);
  }, [companyEmployees, teamMembers]);

  const handleAddMember = async (employeeId: string) => {
    if (!companyId || !teamName) return;

    setLoading(true);
    try {
      const employeeToAdd = companyEmployees.find(e => e.id === employeeId);
      if (!employeeToAdd) {
        console.error('Utilisateur introuvable');
        return;
      }

      const newMember: TeamMember = {
        id: employeeToAdd.id,
        firstName: employeeToAdd.firstName,
        lastName: employeeToAdd.lastName
      };

      // Mettre à jour les membres de l'équipe dans Firestore
      const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
      const updatedMembers = [...teamMembers, newMember];
      await updateDoc(teamRef, { members: updatedMembers });

      // Mettre à jour les champs teams et teamId dans la collection users
      const userRef = doc(db, 'users', employeeId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentTeams = userData.teams || [];
        const currentTeamIds = userData.teamId || [];

        // Vérifier si l'équipe n'est pas déjà dans les tableaux
        if (!currentTeams.includes(teamName)) {
          await updateDoc(userRef, {
            teams: arrayUnion(teamName),
            teamId: arrayUnion(`${companyId}-${teamName}`)
          });
        }
      }

      // Mettre à jour l'état local
      setTeamMembers(updatedMembers);
      setProposedEmployees(proposedEmployees.filter((employee) => employee.id !== employeeId));
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Erreur lors de l\'ajout du membre');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!companyId || !teamName) return;

    setLoading(true);
    try {
      // Supprimer l'utilisateur de la liste des membres de l'équipe dans Firestore
      const teamRef = doc(db, 'teams', `${companyId}-${teamName}`);
      const updatedMembers = teamMembers.filter((member: any) => member.id !== memberId);
      await updateDoc(teamRef, { members: updatedMembers });

      // Mettre à jour les champs teams et teamId dans le document de l'utilisateur
      const userRef = doc(db, 'users', memberId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentTeams = userData.teams || [];
        const currentTeamIds = userData.teamId || [];

        // Filtrer les tableaux pour retirer l'équipe
        const updatedTeams = currentTeams.filter((t: string) => t !== teamName);
        const updatedTeamIds = currentTeamIds.filter((id: string) => id !== `${companyId}-${teamName}`);

        await updateDoc(userRef, {
          teams: updatedTeams,
          teamId: updatedTeamIds
        });
      }

      // Mettre à jour l'état local
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

  if (!teamExists) {
    return null; // Ne rien afficher si l'équipe n'existe pas (la redirection est déjà gérée)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Équipe : {teamName}</h1>

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