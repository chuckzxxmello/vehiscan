import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import React, { createContext, useEffect, useState, useContext } from "react";
import { auth, db } from "../firebaseConfig";
import {doc, getDoc, setDoc} from "firebase/firestore";

// Suppress specific warnings (keeping your console warning suppression)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0].includes('defaultProps will be removed')) {
    return;
  }
  originalConsoleError(...args);
};

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        // Set admin rights for specific userIds
        if (user.uid === "sYGcIQA4wVg2runs3ThRT82DQQq2") {
          await setDoc(doc(db, "users", user.uid), {
            ...userData,
            isAdmin: true
          });
        }
        
        setUser({...user, ...userData});
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      return {success: true};
    } catch (error) {
      let msg = error.message;
      if (msg.includes('auth/invalid-email')) msg = 'Please enter a valid email address.';
      if (msg.includes('auth/invalid-credentials')) msg = 'Please enter a valid email address.';
      return {success: false, msg: error.message};
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const register = async (password, email, firstName, lastName, code) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", response?.user?.uid), {
        email,
        firstName,
        lastName,
        code,
        userId: response?.user?.uid,
        isAdmin: false
      });
      return {success: true, data: response?.user};
    } catch (error) {
        let msg = error.message;
        if (msg.includes('auth/invalid-email')) msg = 'Please enter a valid email address.';
        if (msg.includes('auth/email-already-in-use')) msg = 'Email already in use.';
        return {success: false, msg: error.message};
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const setAdminStatus = async (userId) => {
  await setDoc(doc(db, "users", userId), {
    isAdmin: true
  }, { merge: true });
};