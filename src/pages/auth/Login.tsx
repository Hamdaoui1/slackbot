import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Activity } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirige l'utilisateur s'il est déjà connecté
  useEffect(() => {
    if (!loading && user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (userData?.status === 'pending') {
        await auth.signOut();
        setError('Your account is pending approval.');
        return;
      }

      if (userData?.role === 'admin' || (userData?.role === 'employee' && userData?.status === 'approved')) {
        navigate(userData.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        await auth.signOut();
        setError('Invalid account status.');
      }
    } catch (error) {
      setError('Invalid email or password');
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-center mb-8">
          <Activity className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 ml-2">Culture Amp</h1>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-4"
          >
            Sign In
          </button>
          <div className="space-y-2 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800">
                Register here
              </Link>
            </p>
            <p>
              Are you an admin?{' '}
              <Link to="/admin-login" className="text-blue-600 hover:text-blue-800">
                Admin login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;