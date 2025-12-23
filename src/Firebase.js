// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC33X_tX977xAFDnlD-cD4jROrTYuVqWew",
  authDomain: "nofomo-36b6c.firebaseapp.com",
  projectId: "nofomo-36b6c",
  storageBucket: "nofomo-36b6c.firebasestorage.app",
  messagingSenderId: "546533255296",
  appId: "1:546533255296:web:254863366d0194c0e99e65",
  measurementId: "G-R86SC2LF92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add additional scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, googleProvider, analytics, db, storage };

