// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMdhejorRDG8SmGMx5TeEGmAvrbpGVjxw",
  authDomain: "vec-portal-df9a3.firebaseapp.com",
  projectId: "vec-portal-df9a3",
  storageBucket: "vec-portal-df9a3.firebasestorage.app",
  messagingSenderId: "336641185053",
  appId: "1:336641185053:web:8bef9e6dd396cef24bbdf4",
  measurementId: "G-0S9RNTXGMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
