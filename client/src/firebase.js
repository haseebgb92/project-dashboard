import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAP1lHYEBbkg_3Enxy_UwEcv-JTKWrHl4M",
  authDomain: "project-dashboard-10b29.firebaseapp.com",
  projectId: "project-dashboard-10b29",
  storageBucket: "project-dashboard-10b29.firebasestorage.app",
  messagingSenderId: "1094604229333",
  appId: "1:1094604229333:web:8d1d426ce0c60268a6705c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
