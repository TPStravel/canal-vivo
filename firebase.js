
// firebase.js
// Conexão com Firebase para uso no frontend ou backend (Firestore, Auth, etc)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDReBGhb2gZNv7KA86HJXTeiLimWTrurp8",
  authDomain: "canal-vivo-chat.firebaseapp.com",
  projectId: "canal-vivo-chat",
  storageBucket: "canal-vivo-chat.firebasestorage.app",
  messagingSenderId: "975226660544",
  appId: "1:975226660544:web:56b55bb3e2a58be035ef25"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore para uso
export const db = getFirestore(app);
