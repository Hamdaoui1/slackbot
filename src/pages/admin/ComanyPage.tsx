import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CompanyPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState<{ name: string; teams: string[] } | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
  if (!companyId) return;

  const docRef = doc(db, 'companies', companyId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log('Company Data:', docSnap.data());
    const companyData = docSnap.data() as { name: string; teams: string[] };
    setCompany(companyData);
    setNewName(companyData.name);
  } else {
    console.error('No company found with ID:', companyId);
  }
};

    fetchCompany();
  }, [companyId]);

  const handleUpdateName = async () => {
    if (!company || !newName) return;

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

      {/* Liste des équipes */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Équipes</h2>
        <ul className="space-y-2">
          {company.teams.map((team) => (
            <li key={team} className="p-2 border rounded-md bg-gray-100">
              <a href={`/admin/team/${team}`} className="text-blue-600 hover:underline">
                {team}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompanyPage;