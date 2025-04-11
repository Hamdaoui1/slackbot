import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCVJoby2cbazQrR7Bd2DQq1xIHN-w0NyEM",
  authDomain: "slack-7b83e.firebaseapp.com",
  projectId: "slack-7b83e",
  storageBucket: "slack-7b83e.firebasestorage.app",
  messagingSenderId: "51428046948",
  appId: "1:51428046948:web:729b4597aac659c7530771",
  measurementId: "G-VLHVT42SV9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);