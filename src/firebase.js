// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDAE7x5y36IsXfNXWkPpeHOmAQ2SwFPg4I",
  authDomain: "penguin-dc8da.firebaseapp.com",
  projectId: "penguin-dc8da",
  storageBucket: "penguin-dc8da.firebasestorage.app",
  messagingSenderId: "315014632007",
  appId: "1:315014632007:web:07b9552cf06e823a60d762"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);