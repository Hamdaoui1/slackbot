import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext - Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext - Firebase auth state changed:', firebaseUser);
      if (firebaseUser) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, 'admin', firebaseUser.email!));
          console.log('AuthContext - Admin document exists:', adminDoc.exists());
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...adminData,
              role: 'admin'
            });
            setLoading(false);
            return;
          }

          // Check if user is a sub-admin
          const subAdminDoc = await getDoc(doc(db, 'sub-admin', firebaseUser.email!));
          console.log('AuthContext - Sub-admin document exists:', subAdminDoc.exists());
          if (subAdminDoc.exists()) {
            const subAdminData = subAdminDoc.data();
            console.log('AuthContext - Sub-admin data:', subAdminData);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...subAdminData,
              role: 'sub-admin'
            });
            setLoading(false);
            return;
          }

          // Check if user is an employee
          const employeeDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('AuthContext - Employee document exists:', employeeDoc.exists());
          if (employeeDoc.exists()) {
            const employeeData = employeeDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...employeeData,
              role: 'employee'
            });
            setLoading(false);
            return;
          }

          // If user exists in Firebase but not in any of our collections
          console.log('AuthContext - User not found in any collection');
          setUser(null);
        } catch (error) {
          console.error('AuthContext - Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('AuthContext - Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};