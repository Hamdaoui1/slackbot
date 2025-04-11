import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';

interface Company {
  id: string;
  name: string;
  teams: string[];
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger les entreprises depuis Firestore
  useEffect(() => {
    const fetchCompanies = async () => {
      const companiesCollection = collection(db, 'companies');
      const snapshot = await getDocs(companiesCollection);
      const companiesData: Company[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        teams: doc.data().teams || [],
      }));
      setCompanies(companiesData);
    };

    fetchCompanies();
  }, []);

const handleAddCompany = async () => {
  if (!newCompanyName) return;

  setLoading(true);
  try {
    const companiesCollection = collection(db, 'companies');
    const snapshot = await getDocs(companiesCollection);

    const companyExists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === newCompanyName.toLowerCase()
    );

    if (companyExists) {
      alert('Une entreprise avec ce nom existe déjà.');
      setLoading(false);
      return;
    }

    const newCompanyRef = doc(companiesCollection);
    await setDoc(newCompanyRef, { name: newCompanyName, teams: [] });
    setCompanies([...companies, { id: newCompanyRef.id, name: newCompanyName, teams: [] }]);
    setNewCompanyName('');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'entreprise :', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Gestion des entreprises</h1>

      {/* Ajouter une entreprise */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Ajouter une entreprise</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleAddCompany}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des entreprises */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Entreprises</h2>
        <div className="grid grid-cols-2 gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              to={`/admin/company/${company.id}`}
              className="p-4 border rounded-md bg-gray-100 hover:bg-gray-200"
            >
              {company.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;