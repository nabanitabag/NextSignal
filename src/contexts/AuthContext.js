import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔐 AuthProvider: Initializing...');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user profile in Firestore
      await createUserProfile(user);
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
      throw error;
    }
  };

  // Anonymous Sign In (for demo purposes)
  const signInAsGuest = async () => {
    try {
      setError(null);
      const result = await signInAnonymously(auth);
      const user = result.user;
      
      // Create basic profile for anonymous user
      await createUserProfile(user, true);
      
      return user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      setError(error.message);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
      throw error;
    }
  };

  // Create or update user profile
  const createUserProfile = async (user, isAnonymous = false) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user profile
        const profileData = {
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || (isAnonymous ? 'Guest User' : 'Anonymous'),
          photoURL: user.photoURL || null,
          isAnonymous: isAnonymous,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          preferences: {
            notifications: {
              email: !isAnonymous,
              push: true,
              sms: false
            },
            location: {
              shareLocation: false,
              defaultRadius: 5000 // 5km
            },
            interests: []
          },
          subscriptions: {
            areas: [],
            categories: ['traffic', 'safety', 'events']
          }
        };

        await setDoc(userRef, profileData);
        setUserProfile(profileData);
      } else {
        // Update last login
        const existingData = userDoc.data();
        const updatedData = {
          ...existingData,
          lastLoginAt: new Date().toISOString()
        };
        
        await setDoc(userRef, updatedData, { merge: true });
        setUserProfile(updatedData);
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userRef, updatedData, { merge: true });
      setUserProfile(updatedData);
      
      return updatedData;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      throw error;
    }
  };

  // Subscribe to area updates
  const subscribeToArea = async (area) => {
    try {
      if (!userProfile) throw new Error('No user profile found');
      
      const currentAreas = userProfile.subscriptions?.areas || [];
      if (!currentAreas.find(a => a.id === area.id)) {
        const updatedAreas = [...currentAreas, area];
        await updateProfile({
          subscriptions: {
            ...userProfile.subscriptions,
            areas: updatedAreas
          }
        });
      }
    } catch (error) {
      console.error('Error subscribing to area:', error);
      throw error;
    }
  };

  // Unsubscribe from area updates
  const unsubscribeFromArea = async (areaId) => {
    try {
      if (!userProfile) throw new Error('No user profile found');
      
      const currentAreas = userProfile.subscriptions?.areas || [];
      const updatedAreas = currentAreas.filter(a => a.id !== areaId);
      
      await updateProfile({
        subscriptions: {
          ...userProfile.subscriptions,
          areas: updatedAreas
        }
      });
    } catch (error) {
      console.error('Error unsubscribing from area:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          // Fetch user profile from Firestore
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create profile if it doesn't exist
            await createUserProfile(user, user.isAnonymous);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signInAsGuest,
    logout,
    updateProfile,
    subscribeToArea,
    unsubscribeFromArea
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 