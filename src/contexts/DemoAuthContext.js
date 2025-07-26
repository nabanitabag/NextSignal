import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔐 DemoAuthContext: Using demo authentication mode');
  
  const [user] = useState({
    uid: 'demo-user-123',
    displayName: 'Demo User',
    email: 'demo@nextsignal.com',
    photoURL: null,
    isAnonymous: false
  });

  const [userProfile] = useState({
    displayName: 'Demo User',
    email: 'demo@nextsignal.com',
    photoURL: null,
    preferences: {
      notifications: true,
      locationSharing: true
    },
    areaSubscriptions: [
      {
        id: 'sub1',
        name: 'Downtown San Francisco',
        location: { lat: 37.7749, lng: -122.4194 },
        radius: 5
      }
    ],
    createdAt: new Date(),
    lastLoginAt: new Date()
  });

  const [loading] = useState(false);

  // Mock authentication functions
  const signInWithGoogle = async () => {
    console.log('🔐 Demo: Google sign-in called');
    return { success: true };
  };

  const signInAsGuest = async () => {
    console.log('🔐 Demo: Guest sign-in called');
    return { success: true };
  };

  const logout = async () => {
    console.log('🔐 Demo: Logout called');
    return { success: true };
  };

  const updateProfile = async (profileData) => {
    console.log('🔐 Demo: Update profile called', profileData);
    return { success: true };
  };

  const subscribeToArea = async (areaData) => {
    console.log('🔐 Demo: Subscribe to area called', areaData);
    return { success: true };
  };

  const unsubscribeFromArea = async (subscriptionId) => {
    console.log('🔐 Demo: Unsubscribe from area called', subscriptionId);
    return { success: true };
  };

  const value = {
    user,
    userProfile,
    loading,
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