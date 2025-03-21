import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB9sPEwVSLYoqHMp_wIVW5JAzggp6jbYNE",
    authDomain: "uni-dating-app-bccab.firebaseapp.com",
    projectId: "uni-dating-app-bccab",
    storageBucket: "uni-dating-app-bccab.firebasestorage.app",
    messagingSenderId: "1005539051029",
    appId: "1:1005539051029:web:bc75f196eaf526c2f2701c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);