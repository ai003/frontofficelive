import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore with retry for new users
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: userData.email || firebaseUser.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              username: userData.username || '',
              role: userData.role || 'user'
            });
          } else {
            // If no Firestore doc, create fallback user data
            // This should rarely happen with proper registration flow
            const displayName = firebaseUser.displayName || 'User';
            const names = displayName.split(' ');
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: names[0] || 'User',
              lastName: names.slice(1).join(' ') || '',
              username: `user_${firebaseUser.uid.slice(0, 8)}`,
              role: 'user'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const displayName = firebaseUser.displayName || 'User';
          const names = displayName.split(' ');
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: names[0] || 'User',
            lastName: names.slice(1).join(' ') || '',
            username: `user_${firebaseUser.uid.slice(0, 8)}`,
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      // Ensure minimum loading duration for better UX while waiting for signOut
      await Promise.all([
        signOut(auth),
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);
      // onAuthStateChanged will handle setting user to null and isLoading to false
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const manualSetUser = (userData: AuthUser) => {
    setUser(userData);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    setUser: manualSetUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};