import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only if measurementId is provided
let analytics: any = null;
if (firebaseConfig.measurementId) {
    import('firebase/analytics').then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
    }).catch((error) => {
        console.warn('Firebase Analytics not available:', error.message);
    });
}

export { analytics };
