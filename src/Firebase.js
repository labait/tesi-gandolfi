// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAMTnGofzUYQH5MMK0Q1s5K2pGJmrD-5M4",
  authDomain: "nofomo-bd09a.firebaseapp.com",
  projectId: "nofomo-bd09a",
  storageBucket: "nofomo-bd09a.firebasestorage.app",
  messagingSenderId: "343937704550",
  appId: "1:343937704550:web:03be3ef7f2e358ceabc3a7",
  measurementId: "G-281G9L93F6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, analytics };

