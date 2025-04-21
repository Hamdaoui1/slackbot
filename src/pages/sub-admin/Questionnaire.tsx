import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Upload, FileText, Users } from 'lucide-react';
import Papa from 'papaparse';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'yes_no';
}

interface Questionnaire {
  id: string;
  title: string;
  createdAt: Date;
  createdBy: string;
  teams: string[];
  employees: string[];
  questions: Question[];
}

const SubAdminQuestionnaire = () => {
  const { user } = useAuth();
  console.log('SubAdminQuestionnaire - Component mounted');
  console.log('SubAdminQuestionnaire - User:', user);
  console.log('SubAdminQuestionnaire - User companyId:', user?.companyId);
  
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SubAdminQuestionnaire - useEffect triggered');
    const fetchData = async () => {
      console.log('SubAdminQuestionnaire - Fetching data for companyId:', user?.companyId);
      if (!user?.companyId) {
        console.log('SubAdminQuestionnaire - No companyId found');
        setError('No company ID found for the user');
        setLoading(false);
        return;
      }

      try {
        // Fetch company data
        console.log('SubAdminQuestionnaire - Fetching company document');
        const companyDoc = await getDoc(doc(db, 'companies', user.companyId));
        console.log('SubAdminQuestionnaire - Company document exists:', companyDoc.exists());
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          console.log('SubAdminQuestionnaire - Company data:', companyData);
          setCompany(companyData);
        } else {
          console.log('SubAdminQuestionnaire - Company document does not exist');
          setError('Company not found');
        }

        // Fetch questionnaires
        console.log('SubAdminQuestionnaire - Fetching questionnaires');
        const questionnairesQuery = query(
          collection(db, 'questionnaires'),
          where('companyId', '==', user.companyId)
        );
        const querySnapshot = await getDocs(questionnairesQuery);
        console.log('SubAdminQuestionnaire - Number of questionnaires found:', querySnapshot.size);
        const questionnairesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Questionnaire[];
        console.log('SubAdminQuestionnaire - Questionnaires data:', questionnairesData);
        setQuestionnaires(questionnairesData);
      } catch (error) {
        console.error('SubAdminQuestionnaire - Error fetching data:', error);
        setError('Error fetching data: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.companyId]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const processCsv = (file: File): Promise<Question[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const questions = results.data.map((row: any) => ({
            id: row.id,
            question: row.question,
            type: row.type
          }));
          resolve(questions);
        },
        error: (error) => reject(error)
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !title || !user?.companyId) return;

    setLoading(true);
    try {
      // Process CSV file
      const questions = await processCsv(csvFile);

      // Create new questionnaire document
      const questionnaireRef = await addDoc(collection(db, 'questionnaires'), {
        title,
        createdAt: new Date(),
        companyId: user.companyId,
        teams: selectedTeams,
        employees: selectedEmployees,
        questions,
        createdBy: user.uid
      });

      // Update company document to include new questionnaire ID
      const companyRef = doc(db, 'companies', user.companyId);
      await updateDoc(companyRef, {
        questionnaires: arrayUnion(questionnaireRef.id)
      });

      // Refresh questionnaires list
      const updatedQuestionnaires = [...questionnaires, {
        id: questionnaireRef.id,
        title,
        createdAt: new Date(),
        createdBy: user.uid,
        teams: selectedTeams,
        employees: selectedEmployees,
        questions
      }];
      setQuestionnaires(updatedQuestionnaires);

      // Reset form
      setCsvFile(null);
      setTitle('');
      setSelectedTeams([]);
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error creating questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('SubAdminQuestionnaire - Rendering loading state');
    return <div>Loading...</div>;
  }

  if (error) {
    console.log('SubAdminQuestionnaire - Rendering error state:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  console.log('SubAdminQuestionnaire - Rendering main content');
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Questionnaires</h1>
          <p className="text-lg text-gray-600">Gérez les questionnaires de votre entreprise</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Questionnaire */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Créer un nouveau questionnaire</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du questionnaire
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier CSV des questions
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span>{csvFile ? csvFile.name : 'Choisir un fichier CSV'}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipes concernées
                </label>
                <select
                  multiple
                  value={selectedTeams}
                  onChange={(e) => setSelectedTeams(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {company?.teams.map((team: string) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Créer le questionnaire
              </button>
            </form>
          </div>

          {/* Questionnaires List */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Questionnaires existants</h2>
            <div className="space-y-4">
              {questionnaires.map((questionnaire) => (
                <div key={questionnaire.id} className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-medium text-gray-900">{questionnaire.title}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(questionnaire.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-5 w-5 mr-2" />
                      <span>{questionnaire.questions.length} questions</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-2" />
                      <span>{questionnaire.teams.length} équipes concernées</span>
                    </div>
                  </div>
                </div>
              ))}
              {questionnaires.length === 0 && (
                <p className="text-gray-500 text-center py-8">Aucun questionnaire n'a été créé pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAdminQuestionnaire; 