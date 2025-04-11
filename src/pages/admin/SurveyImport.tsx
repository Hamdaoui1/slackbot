import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Papa from 'papaparse';

interface Company {
  id: string;
  name: string;
  teams: string[];
}

const SurveyImport = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les entreprises et leurs équipes depuis Firestore
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: Papa.ParseResult<any>) => {
        setCsvData(result.data);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
      },
    });
  };

  const handleSubmit = async () => {
    if (!selectedCompany || csvData.length === 0) {
      alert('Veuillez sélectionner une entreprise et télécharger un fichier CSV.');
      return;
    }

    setLoading(true);

    try {
      const questionnaireId = `${selectedCompany.id}-${Date.now()}`;
      const target = selectedTeam || selectedCompany.id;

      // Insérer chaque ligne du CSV dans Firestore
      for (const row of csvData) {
        await setDoc(doc(db, 'questionnaires', `${questionnaireId}-${row.id}`), {
          ...row,
          questionnaireId,
          target, // ID de l'entreprise ou de l'équipe
          createdAt: new Date().toISOString(),
        });
      }

      alert('Questionnaire ajouté avec succès !');
      setCsvData([]);
      setSelectedCompany(null);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du questionnaire :', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Importer un Questionnaire</h1>

      {/* Étape 1 : Sélectionner une entreprise */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">1. Sélectionnez une entreprise</h2>
        <div className="grid grid-cols-2 gap-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                setSelectedCompany(company);
                setSelectedTeam(null); // Réinitialiser l'équipe sélectionnée
              }}
              className={`p-4 border rounded-md ${
                selectedCompany?.id === company.id ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {company.name}
            </button>
          ))}
        </div>
      </div>

      {/* Étape 2 : Sélectionner une équipe (optionnel) */}
      {selectedCompany && selectedCompany.teams.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2. Sélectionnez une équipe (optionnel)</h2>
          <div className="grid grid-cols-2 gap-4">
            {selectedCompany.teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`p-4 border rounded-md ${
                  selectedTeam === team ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : Télécharger un fichier CSV */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">3. Téléchargez un fichier CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Étape 4 : Soumettre */}
      <div className="text-right">
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedCompany || csvData.length === 0}
          className={`px-6 py-2 rounded-md text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'En cours...' : 'Lancer le Questionnaire'}
        </button>
      </div>
    </div>
  );
};

export default SurveyImport;