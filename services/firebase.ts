import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// IMPORTANT: Please replace this with your own Firebase project configuration.
// You can find this in your project's settings in the Firebase console.
// The current values are placeholders and will prevent the login/signup from working.
const firebaseConfig = {
  apiKey: "AIzaSyCOF7sxWB2uZHG-EhTMr8P7wQ6F1cuBtaI",
  authDomain: "solo-touup-hub.firebaseapp.com",
  databaseURL: "https://solo-touup-hub-default-rtdb.firebaseio.com",
  projectId: "solo-touup-hub",
  storageBucket: "solo-touup-hub.firebasestorage.app",
  messagingSenderId: "600041636173",
  appId: "1:600041636173:web:a1b2c3d4e5f6a7b8c9d0e1" // This is a generic/placeholder App ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();