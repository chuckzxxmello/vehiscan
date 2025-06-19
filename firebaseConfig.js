// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";
// Remove this line: import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC75-QlNQO0MnP5rqLG5LFz-KiExN-6vH4",
  authDomain: "vehiscan2.firebaseapp.com",
  projectId: "vehiscan2",
  storageBucket: "vehiscan2.appspot.com",
  messagingSenderId: "598308343802",
  appId: "1:598308343802:web:6513c298b3b1757d795e43"
};

// Initialize (or reuse) the Firebase App
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Auth with AsyncStorage persistence (once)
let auth;
try {
  // If auth was already initialized, this will throw
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch {
  // Fallback to the existing Auth instance
  auth = getAuth(app);
}

// Firestore instance
const db = getFirestore(app);

// Remove these lines:
// const functions = getFunctions(app);

// Named collections for better organization
const usersCollection = collection(db, "users");
const vehiclesCollection = collection(db, "vehicles");
const scannedVehiclesCollection = collection(db, "scannedVehicles");

// Combined exports (remove functions from exports)
export { 
  app, 
  auth, 
  db, 
  usersCollection, 
  vehiclesCollection, 
  scannedVehiclesCollection 
};