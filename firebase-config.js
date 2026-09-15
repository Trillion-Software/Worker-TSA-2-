// ==========================================================================
// Worker TSA — Configuration Firebase (Auth + Firestore)
// Chargé en tant que module ES sur les pages qui en ont besoin.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9D9Zoi7Rjw195LRNmE2fy2p5WBQPRWds",
  authDomain: "worker-tsa-4f975.firebaseapp.com",
  projectId: "worker-tsa-4f975",
  storageBucket: "worker-tsa-4f975.firebasestorage.app",
  messagingSenderId: "565060763427",
  appId: "1:565060763427:web:6a22fa47b9b814824c1696",
  measurementId: "G-STH24757M8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exposés globalement pour que script.js (script classique, non-module)
// puisse les utiliser sans avoir à convertir tout le projet en modules.
window.wtsaFirebase = {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc,
  getDoc
};

// Signale à script.js que Firebase est prêt (utile car les modules
// ES se chargent de façon asynchrone).
window.dispatchEvent(new Event('wtsaFirebaseReady'));
