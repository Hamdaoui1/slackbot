import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questionnaireStatus, setQuestionnaireStatus] = useState<'not_started' | 'in_progress' | 'completed' | null>(null);

  useEffect(() => {
    const fetchQuestionnaireStatus = async () => {
      if (!user) return;

      const docRef = doc(db, 'responses', `${user.uid}-default-questionnaire`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isCompleted) {
          setQuestionnaireStatus('completed');
        } else {
          setQuestionnaireStatus('in_progress');
        }
      } else {
        setQuestionnaireStatus('not_started');
      }
    };

    fetchQuestionnaireStatus();
  }, [user]);

  const handleQuestionnaireClick = () => {
    if (questionnaireStatus === 'not_started' || questionnaireStatus === 'in_progress') {
      navigate('/employee/questionnaire');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Afficher la carte uniquement si le questionnaire n'est pas terminé */}
      {questionnaireStatus !== 'completed' && (
        <div
          onClick={handleQuestionnaireClick}
          className="p-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">
            📋 {questionnaireStatus === 'not_started' ? 'Commencer le questionnaire' : 'Compléter votre questionnaire'}
          </h3>
          <p className="text-gray-600">
            {questionnaireStatus === 'not_started'
              ? 'Participez au questionnaire d\'engagement'
              : 'Continuez à répondre au questionnaire'}
          </p>
        </div>
      )}

      {/* Exemple d'autres cartes */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-2">📊 Voir mes résultats</h3>
        <p className="text-gray-600">
          {questionnaireStatus === 'completed'
            ? 'Consultez vos résultats'
            : 'Complétez le questionnaire pour voir vos résultats'}
        </p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;