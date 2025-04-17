import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, addDoc, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { Building, Users, Plus, Trash2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  teams: string[];
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [teams, setTeams] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesCollection = collection(db, 'companies');
        const snapshot = await getDocs(companiesCollection);
        const companiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(companiesData);
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      setError('Le nom de l\'entreprise est requis');
      return;
    }

    try {
      // Vérifier si une entreprise avec ce nom existe déjà
      const companiesCollection = collection(db, 'companies');
      const q = query(companiesCollection, where('name', '==', companyName.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Une entreprise avec ce nom existe déjà');
        return;
      }

      // Créer une nouvelle entreprise avec un ID généré par Firestore
      const teamsArray = teams.trim() 
        ? teams.split(',').map(team => team.trim()).filter(team => team.length > 0)
        : [];
      
      const newCompanyRef = await addDoc(companiesCollection, {
        name: companyName.trim(),
        teams: teamsArray,
        createdAt: new Date().toISOString()
      });

      // Mettre à jour la liste des entreprises
      const snapshot = await getDocs(companiesCollection);
      const companiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];
      setCompanies(companiesData);

      setCompanyName('');
      setTeams('');
      setSuccess('Entreprise créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise :', error);
      setError('Une erreur est survenue lors de la création de l\'entreprise');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      try {
        await deleteDoc(doc(db, 'companies', companyId));
        setCompanies(companies.filter((company) => company.id !== companyId));
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'entreprise :', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-4">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Gestion des Entreprises</h1>
              <p className="text-lg text-gray-600 mt-2">Créez et gérez les entreprises et leurs équipes</p>
            </div>
          </div>
        </div>

        {/* Create Company Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Plus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Créer une nouvelle entreprise</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le nom de l'entreprise"
                required
              />
            </div>
            <div>
              <label htmlFor="teams" className="block text-sm font-medium text-gray-700 mb-2">
                Équipes (séparées par des virgules)
              </label>
              <input
                type="text"
                id="teams"
                value={teams}
                onChange={(e) => setTeams(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Équipe A, Équipe B, Équipe C"
              />
              <p className="mt-2 text-sm text-gray-500">
                Séparez les noms des équipes par des virgules (optionnel)
              </p>
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-500 p-3 rounded-md">
                {success}
              </div>
            )}
            <div className="text-right">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                disabled={!companyName.trim()}
              >
                <Plus className="h-5 w-5" />
                <span>Créer l'entreprise</span>
              </button>
            </div>
          </form>
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Liste des entreprises</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col h-full">
                  <div className="flex-grow">
                    <Link
                      to={`/admin/company/${company.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      {company.name}
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {company.teams.map((team, index) => (
                        <Link
                          key={index}
                          to={`/admin/company/${company.id}/team/${team}`}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors duration-200"
                        >
                          {team}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;