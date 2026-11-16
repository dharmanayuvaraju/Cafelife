// CafeLive - Firebase Configuration and Modular SDK Exports
// Uses the official Firebase Web SDK (v10 modular version via CDN)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// -------------------------------------------------------------
// FIREBASE CONFIGURATION
// Replace the placeholder values below with your Firebase project keys:
// Firebase Console -> Project Settings -> General -> Your apps -> Web app
// -------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyCfGwKYYbX1eql-Cgi_JYiSf-fR9LIq6Sc",
  authDomain: "cafelive-e1b7f.firebaseapp.com",
  projectId: "cafelive-e1b7f",
  storageBucket: "cafelive-e1b7f.firebasestorage.app",
  messagingSenderId: "505320732734",
  appId: "1:505320732734:web:46720c4cd673d46dda796f",
  measurementId: "G-1VKKL7R4S1"
};

// Check if credentials have been provided
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

// Initialize Firebase App, Auth, and Firestore
let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization waiting for valid config:", error.message);
}

// Re-export instances
export { app, auth, db };

// Re-export Auth modular functions
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
};

// Re-export Firestore modular functions
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
};

// Simple utility to sanitize and escape text before inserting into HTML
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

