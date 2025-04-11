import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Questionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkQuestionnaireStatus = async () => {
      if (!user) return;

      const docRef = doc(db, 'responses', `${user.uid}-default-questionnaire`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().isCompleted) {
        navigate('/employee/dashboard'); // Redirige si le questionnaire est terminé
      } else {
        setLoading(false); // Charge le questionnaire si non terminé
      }
    };

    checkQuestionnaireStatus();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Reste du code pour afficher le questionnaire...
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Contenu du questionnaire */}
    </div>
  );
};

export default Questionnaire;