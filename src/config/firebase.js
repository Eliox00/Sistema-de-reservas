// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase - reemplaza con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyDsRRpjCIc1LZph-eN2TnMUh5tQEMj7Bkw",
  authDomain: "centro-deportivo-univers-cb22d.firebaseapp.com",
  projectId: "centro-deportivo-univers-cb22d",
  storageBucket: "centro-deportivo-univers-cb22d.firebasestorage.app",
  messagingSenderId: "636974848231",
  appId: "1:636974848231:web:afe822a15e31917674ea42"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Authentication
export const auth = getAuth(app);

export default app;