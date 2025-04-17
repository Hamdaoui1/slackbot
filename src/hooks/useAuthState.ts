import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuthState - Starting auth state listener');
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('useAuthState - Firebase auth state changed:', firebaseUser);
      
      if (firebaseUser) {
        try {
          // Vérifier d'abord la collection admins
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          console.log('useAuthState - Admin document exists:', adminDoc.exists());
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('useAuthState - Admin data:', adminData);
            
            const customUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: adminData.firstName || '',
              lastName: adminData.lastName || '',
              company: adminData.company || '',
              role: 'admin' as const
            };
            
            console.log('useAuthState - Setting admin user:', customUser);
            setUser(customUser);
            localStorage.setItem('user', JSON.stringify(customUser));
            setLoading(false);
            return;
          }

          // Vérifier la collection sub-admin
          const subAdminDoc = await getDoc(doc(db, 'sub-admin', firebaseUser.uid));
          console.log('useAuthState - Sub-admin document exists:', subAdminDoc.exists());
          
          if (subAdminDoc.exists()) {
            const subAdminData = subAdminDoc.data();
            console.log('useAuthState - Sub-admin data:', subAdminData);
            
            const customUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: subAdminData.firstName || '',
              lastName: subAdminData.lastName || '',
              company: subAdminData.company || '',
              role: 'sub-admin' as const
            };
            
            console.log('useAuthState - Setting sub-admin user:', customUser);
            setUser(customUser);
            localStorage.setItem('user', JSON.stringify(customUser));
            setLoading(false);
            return;
          }

          // Vérifier la collection users
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('useAuthState - User document exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('useAuthState - User data:', userData);
            
            const customUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              company: userData.company || '',
              role: userData.role || 'employee',
              status: userData.status || 'pending'
            };
            
            console.log('useAuthState - Setting user:', customUser);
            setUser(customUser);
            localStorage.setItem('user', JSON.stringify(customUser));
          } else {
            console.log('useAuthState - No user document found, signing out');
            await auth.signOut();
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('useAuthState - Error fetching user data:', error);
          await auth.signOut();
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('useAuthState - No firebase user, clearing state');
        localStorage.removeItem('user');
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
}