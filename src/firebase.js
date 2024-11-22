// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBlLNW75XLT2YpeuiktCnfaSybNQHq817Y",
  authDomain: "vending-machine-b9797.firebaseapp.com",
  projectId: "vending-machine-b9797",
  storageBucket: "vending-machine-b9797.appspot.com",
  messagingSenderId: "863013561943",
  appId: "1:863013561943:web:cc4fa0dca75a47dd516512",
  measurementId: "G-SS2L6RBH17"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // Use lowercase 's' here

