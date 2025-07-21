// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA_YXQkwk_X5qRhjAtJ4cci7EW9G1_l2UA",
  authDomain: "frontoffice-97756.firebaseapp.com",
  projectId: "frontoffice-97756",
  storageBucket: "frontoffice-97756.firebasestorage.app",
  messagingSenderId: "720169086191",
  appId: "1:720169086191:web:652cc70ce94422e83fff1a",
  measurementId: "G-PSKJYL3RJ4"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// export const analytics = getAnalytics(app);
