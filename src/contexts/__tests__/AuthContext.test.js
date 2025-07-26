import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signInAnonymously: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, userProfile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (user) return <div>User: {user.displayName || 'Anonymous'}</div>;
  return <div>Not authenticated</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('provides user context when authenticated', async () => {
    const mockUser = {
      uid: '123',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    // Mock the auth state change to return a user
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {}; // unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });
  });

  test('provides not authenticated state when no user', async () => {
    // Mock the auth state change to return null (no user)
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {}; // unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  test('handles anonymous user correctly', async () => {
    const mockAnonymousUser = {
      uid: 'anonymous-123',
      displayName: null,
      email: null,
      isAnonymous: true
    };

    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockAnonymousUser);
      return () => {}; // unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User: Anonymous')).toBeInTheDocument();
    });
  });

  test('provides auth methods in context', () => {
    let authMethods;
    
    const TestAuthMethods = () => {
      authMethods = useAuth();
      return <div>Test</div>;
    };

    render(
      <AuthProvider>
        <TestAuthMethods />
      </AuthProvider>
    );

    expect(authMethods).toHaveProperty('signInWithGoogle');
    expect(authMethods).toHaveProperty('signInAsGuest');
    expect(authMethods).toHaveProperty('logout');
    expect(authMethods).toHaveProperty('updateProfile');
    expect(authMethods).toHaveProperty('subscribeToArea');
    expect(authMethods).toHaveProperty('unsubscribeFromArea');
    expect(typeof authMethods.signInWithGoogle).toBe('function');
    expect(typeof authMethods.signInAsGuest).toBe('function');
    expect(typeof authMethods.logout).toBe('function');
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
}); 