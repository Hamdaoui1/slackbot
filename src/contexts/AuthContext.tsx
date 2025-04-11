import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true, login: () => {}, logout: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }

  const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
      // Mettez à jour l'utilisateur si Firebase renvoie un utilisateur valide
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: '', // Ajoutez les champs nécessaires
        lastName: '',
        company: '',
        role: 'employee' // Valeur par défaut
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
  const login = (userData: User) => {
    console.log('Logging in user:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

const logout = async () => {
  try {
    await auth.signOut(); // Déconnecte l'utilisateur de Firebase
    setUser(null); // Supprime l'utilisateur de l'état global
    localStorage.removeItem('user'); // Supprime l'utilisateur de localStorage
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}