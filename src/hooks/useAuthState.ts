import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export const useAuthState = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuthState - Starting auth state listener');
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      console.log('useAuthState - Firebase auth state changed:', firebaseUser);
      if (firebaseUser) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, 'admin', firebaseUser.email!));
          console.log('useAuthState - Admin document exists:', adminDoc.exists());
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
          console.log('useAuthState - Checking sub-admin document for email:', firebaseUser.email);
          const subAdminDoc = await getDoc(doc(db, 'sub-admin', firebaseUser.email!));
          console.log('useAuthState - Sub-admin document exists:', subAdminDoc.exists());
          if (subAdminDoc.exists()) {
            const subAdminData = subAdminDoc.data();
            console.log('useAuthState - Sub-admin data:', subAdminData);
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
          console.log('useAuthState - Employee document exists:', employeeDoc.exists());
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
          console.log('useAuthState - User not found in any collection');
          setUser(null);
        } catch (error) {
          console.error('useAuthState - Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('useAuthState - Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  return { user, loading };
};