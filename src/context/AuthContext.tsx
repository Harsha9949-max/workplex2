import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { generateDeviceFingerprint } from '../utils/encryption';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkExistingUser = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      return null;
    } catch (err) {
      console.error('Error checking existing user:', err);
      return null;
    }
  };

  const getDefaultUserData = (firebaseUser) => ({
    name: firebaseUser.displayName || '',
    phone: '',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    age: null,
    venture: '',
    role: 'user',
    upiId: '',
    bankAccount: '',
    aadhaar: '',
    pan: '',
    deviceFingerprint: generateDeviceFingerprint(),
    level: 'Bronze',
    streak: 0,
    joinedAt: new Date().toISOString(),
    contractSigned: false,
    kycDone: false,
    firstTaskDone: false,
    wallets: {
      earned: 0,
      pending: 27,
      bonus: 0,
      savings: 0
    }
  });

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      if (firebaseUser.email === 'marateyh@gmail.com') {
        window.location.href = '/admin';
        return;
      }
      
      const existingUserData = await checkExistingUser(firebaseUser);
      
      if (existingUserData) {
        setUserData(existingUserData);
      } else {
        const defaultData = getDefaultUserData(firebaseUser);
        setUserData(defaultData);
      }
      
      setUser(firebaseUser);
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  const updateUserData = (data) => {
    setUserData((prev) => ({
      ...prev,
      ...data
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          if (firebaseUser.email === 'marateyh@gmail.com') {
            window.location.href = '/admin';
            return;
          }
          
          const existingUserData = await checkExistingUser(firebaseUser);
          
          if (existingUserData) {
            setUserData(existingUserData);
          } else {
            const defaultData = getDefaultUserData(firebaseUser);
            setUserData(defaultData);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userData,
    loading,
    error,
    signInWithGoogle,
    logout,
    updateUserData,
    checkExistingUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;