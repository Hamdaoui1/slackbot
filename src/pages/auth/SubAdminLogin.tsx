import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

function SubAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Vérifier si nous avons un message de succès dans l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('message') === 'registration_success') {
      setShowSuccess(true);
      // Nettoyer l'URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Rediriger l'utilisateur s'il est déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'sub-admin') {
        navigate('/sub-admin/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'employee') {
        navigate('/employee/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowPendingMessage(false);
    setShowSuccess(false);

    try {
      // Rechercher le sous-admin par email
      const subAdminQuery = query(
        collection(db, 'sub-admin'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(subAdminQuery);
      
      if (querySnapshot.empty) {
        setError('Ce compte n\'existe pas dans notre système. Veuillez vérifier votre email ou vous inscrire.');
        return;
      }

      const subAdminData = querySnapshot.docs[0].data();
      
      if (subAdminData.status === 'pending') {
        setShowPendingMessage(true);
        return;
      }

      if (subAdminData.status === 'rejected') {
        setError('Votre compte n\'a pas été approuvé par l\'administrateur. Veuillez contacter l\'administrateur pour plus d\'informations.');
        return;
      }

      // Tenter de se connecter avec Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, email, password);
        
        // Créer un objet utilisateur personnalisé avec toutes les données du sous-admin
        const customUser = {
          uid: auth.currentUser?.uid || '',
          email: email,
          firstName: subAdminData.firstName,
          lastName: subAdminData.lastName,
          company: subAdminData.company,
          companyId: subAdminData.companyId,
          role: 'sub-admin',
          status: subAdminData.status,
          createdAt: subAdminData.createdAt,
          approvedAt: subAdminData.approvedAt
        };

        // Sauvegarder l'utilisateur dans le localStorage
        localStorage.setItem('user', JSON.stringify(customUser));

        // Rediriger vers le tableau de bord
        navigate('/sub-admin/dashboard', { replace: true });
      } catch (authError: any) {
        if (authError.code === 'auth/wrong-password') {
          setError('Mot de passe incorrect. Veuillez vérifier vos identifiants.');
        } else {
          setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        }
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue lors de la vérification de vos identifiants. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 ml-2">Connexion Sous-Admin</h1>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-6 bg-green-50 p-4 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">
                Inscription réussie ! Votre compte est en attente d'approbation par l'administrateur.
                Vous recevrez un email une fois votre compte approuvé.
              </p>
            </div>
          </div>
        )}

        {showPendingMessage && (
          <div className="mb-6 bg-blue-50 p-4 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-blue-800">
                Votre compte est en attente d'approbation par l'administrateur.
                Vous recevrez un email une fois votre compte approuvé.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Se connecter'
            )}
          </button>

          <div className="flex flex-col space-y-4 mt-4">
            <div className="text-center text-sm text-gray-600">
              Pas encore inscrit ?{' '}
              <Link to="/sub-admin-register" className="text-blue-600 hover:text-blue-800">
                S'inscrire
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                to="/login"
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                <User className="h-4 w-4 mr-2" />
                Connexion Employé
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubAdminLogin;