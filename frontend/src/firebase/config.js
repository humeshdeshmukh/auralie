import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCdR3q8VGQ0CXHci1lcyVXPO8w8Ens4hZI",
  authDomain: "auralie-9f55c.firebaseapp.com",
  databaseURL: "https://auralie-9f55c-default-rtdb.firebaseio.com",
  projectId: "auralie-9f55c",
  storageBucket: "auralie-9f55c.firebasestorage.app",
  messagingSenderId: "225407580411",
  appId: "1:225407580411:web:e26ac6dab7fcabf1a8985e",
  measurementId: "G-CRX3MD38WC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
