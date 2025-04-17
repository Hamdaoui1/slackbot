import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { Users, X, Plus, ArrowLeft } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  team?: string;
  status?: string;
  companyID?: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
}

interface Team {
  id: string;
  name: string;
  companyId: string;
  members: TeamMember[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyID?: string;
  teamID?: string;
  status?: string;
}

function SubAdminTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamExists, setTeamExists] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user?.uid || !teamId) {
        navigate('/sub-admin/teams');
        return;
      }

      try {
        // Récupérer les informations du sous-admin
        const subAdminDoc = await getDoc(doc(db, 'sub-admin', user.uid));
        if (!subAdminDoc.exists()) {
          navigate('/sub-admin/teams');
          return;
        }

        const subAdminData = subAdminDoc.data();
        const companyId = subAdminData.companyId;

        // Vérifier si l'ID de l'équipe commence par l'ID de l'entreprise du sous-admin
        if (!teamId.startsWith(companyId)) {
          navigate('/sub-admin/teams');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'autorisation:', error);
        navigate('/sub-admin/teams');
      }
    };

    checkAuthorization();
  }, [user, teamId, navigate]);

  useEffect(() => {
    if (!teamId || !isAuthorized) return;

    const checkTeamExists = async () => {
      try {
        const teamRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamRef);
        
        if (!teamSnap.exists()) {
          navigate('/sub-admin/teams');
          return;
        }

        setTeamExists(true);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'équipe:', error);
        setError('Erreur lors de la vérification de l\'équipe');
      }
    };

    checkTeamExists();
  }, [teamId, navigate, isAuthorized]);

  useEffect(() => {
    if (!teamId || !teamExists || !isAuthorized) return;

    const fetchTeamData = async () => {
      try {
        const teamRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamRef);
        
        if (teamSnap.exists()) {
          const teamData = teamSnap.data() as Team;
          setTeam(teamData);
          setEmployees(teamData.members.map(member => ({
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: '',
            team: teamData.name
          }) as Employee));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de l\'équipe:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, teamExists, isAuthorized]);

  useEffect(() => {
    if (!user?.uid || !isAuthorized) return;

    const fetchCompanyEmployees = async () => {
      try {
        const subAdminDoc = await getDoc(doc(db, 'sub-admin', user.uid));
        if (!subAdminDoc.exists()) return;

        const subAdminData = subAdminDoc.data();
        const companyId = subAdminData.companyId;

        // Récupérer les données de l'entreprise
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (!companyDoc.exists()) return;

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
                status: data.status,
                companyID: data.companyID
              } as Employee;
            }
            return null;
          });

          const employeeResults = await Promise.all(employeePromises);
          const validEmployees = employeeResults.filter((employee): employee is Employee => 
            employee !== null && employee.status === 'approved'
          );
          
          setEmployees(validEmployees);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error);
      }
    };

    fetchCompanyEmployees();
  }, [user, isAuthorized]);

  useEffect(() => {
    if (!team) return;

    // Filtrer les employés qui ne sont pas déjà dans l'équipe
    const available = employees.filter(employee => 
      !team.members.some(member => member.id === employee.id)
    );

    setAvailableEmployees(available);
  }, [team, employees]);

  const handleAddMember = async (employeeId: string) => {
    if (!team) return;

    try {
      const employeeToAdd = availableEmployees.find(e => e.id === employeeId);
      if (!employeeToAdd) return;

      const newMember: TeamMember = {
        id: employeeToAdd.id,
        firstName: employeeToAdd.firstName,
        lastName: employeeToAdd.lastName
      };

      // Ajouter l'employé à l'équipe dans la collection teams
      await updateDoc(doc(db, 'teams', team.id), {
        members: arrayUnion(newMember)
      });

      // Mettre à jour les champs teams et teamId dans la collection users
      const userRef = doc(db, 'users', employeeId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentTeams = userData.teams || [];
        const currentTeamIds = userData.teamId || [];

        // Vérifier si l'équipe n'est pas déjà dans les tableaux
        if (!currentTeams.includes(team.name)) {
          await updateDoc(userRef, {
            teams: arrayUnion(team.name),
            teamId: arrayUnion(team.id)
          });
        }
      }

      // Mettre à jour l'état local
      setTeam({
        ...team,
        members: [...team.members, newMember]
      });
      setAvailableEmployees(availableEmployees.filter(e => e.id !== employeeId));

    } catch (error) {
      console.error('Error adding member:', error);
      setError('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;

    try {
      const memberToRemove = team.members.find(m => m.id === memberId);
      if (!memberToRemove) return;

      // Retirer l'employé de l'équipe dans la collection teams
      await updateDoc(doc(db, 'teams', team.id), {
        members: arrayRemove(memberToRemove)
      });

      // Retirer l'équipe de l'employé dans la collection users
      const userRef = doc(db, 'users', memberId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedTeams = userData.teams?.filter((t: string) => t !== team.name) || [];
        const updatedTeamIds = userData.teamId?.filter((id: string) => id !== team.id) || [];

        await updateDoc(userRef, {
          teams: updatedTeams,
          teamId: updatedTeamIds
        });
      }

      // Mettre à jour l'état local
      const employeeToAdd = employees.find(e => e.id === memberId);
      if (employeeToAdd) {
        setTeam({
          ...team,
          members: team.members.filter(m => m.id !== memberId)
        });
        setAvailableEmployees([...availableEmployees, employeeToAdd]);
      }

    } catch (error) {
      console.error('Error removing member:', error);
      setError('Erreur lors de la suppression du membre');
    }
  };

  if (!isAuthorized) {
    return null; // Ne rien afficher si non autorisé (la redirection est déjà gérée)
  }

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

  if (!teamExists) {
    return null; // Ne rien afficher si l'équipe n'existe pas (la redirection est déjà gérée)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/sub-admin/teams')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux équipes
              </button>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{team?.name}</h1>
              <p className="text-lg text-gray-600">Gestion des membres de l'équipe</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">
                {team?.members?.length} {team?.members?.length === 1 ? 'membre' : 'membres'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Members */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Membres actuels</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {team?.members?.length}
              </span>
            </div>
            <div className="space-y-4">
              {team && team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{member.firstName} {member.lastName}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                      title="Retirer de l'équipe"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun membre dans cette équipe
                </div>
              )}
            </div>
          </div>

          {/* Available Employees */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Ajouter des employés à cette équipe</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {availableEmployees.length} disponibles
              </span>
            </div>
            <div className="space-y-4">
              {availableEmployees.length > 0 ? (
                availableEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-medium">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-gray-600 text-sm">{employee.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(employee.id)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun employé disponible à ajouter
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubAdminTeamPage; 