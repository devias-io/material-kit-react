// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, child, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBwIq6Ew2522ySGkWyizpUlDHsX2firOGQ",
  authDomain: "sembako-31da3.firebaseapp.com",
  databaseURL: "https://sembako-31da3-default-rtdb.firebaseio.com/",
  projectId: "sembako-31da3",
  storageBucket: "sembako-31da3.appspot.com",
  messagingSenderId: "979932118253",
  appId: "1:979932118253:web:f1439b37978ab4347620e4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const dbRef = ref(getDatabase(app));
