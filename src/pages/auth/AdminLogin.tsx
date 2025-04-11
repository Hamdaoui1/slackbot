import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Activity, ArrowLeft } from 'lucide-react';

const ADMIN_KEY = 'HamzaEmile123';
const ADMIN_EMAIL = 'admin@cultureamp.com';

function AdminLogin() {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (adminKey.toLowerCase() !== ADMIN_KEY.toLowerCase()) {
      setError('Invalid admin key');
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      
      try {
        // Try to sign in first
        userCredential = await signInWithEmailAndPassword(
          auth,
          ADMIN_EMAIL,
          ADMIN_KEY
        );
      } catch (signInError) {
        // If sign in fails, create the admin account
        userCredential = await createUserWithEmailAndPassword(
          auth,
          ADMIN_EMAIL,
          ADMIN_KEY
        );
      }

      // Check if admin document exists, if not create it
      const adminDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          role: 'admin',
          status: 'approved',
          createdAt: new Date().toISOString()
        });
      }

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/login" 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Login
          </Link>
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 ml-2">Admin Access</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Accessing...
              </span>
            ) : (
              'Access Admin Panel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;