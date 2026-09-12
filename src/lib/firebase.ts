import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
  updateProfile,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Silence benign timeout/offline warnings in the browser console
setLogLevel('silent');

// Public Firebase config supporting environment overrides and fallback to provisioned config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '',
};

// Initialize Firebase App instance safely
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore with custom database ID and resilient auto-detect transport
export const db: Firestore = (() => {
  const customDbId =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined;

  try {
    return initializeFirestore(
      app,
      {
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
      },
      customDbId
    );
  } catch (err) {
    // If already initialized, fallback to getFirestore
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
})();

// Google Auth Provider setup
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning: ', JSON.stringify(errInfo));
}

// App user profile schema
export interface AppUserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string;
  createdAt: string;
  lastLoginAt: string;
  role?: 'user' | 'pro' | 'engineer';
  plan?: 'free' | 'pro';
  pro?: boolean;
  proActivatedAt?: string | null;
  proOrderId?: string | null;
  proPaymentId?: string | null;
  proSignature?: string | null;
}

/**
 * Saves or updates user profile in Firestore `users` collection upon successful login.
 * Safely preserves existing PRO plan and prevents client-side tampering.
 */
export async function syncUserProfile(user: FirebaseUser, providerId?: string): Promise<AppUserProfile> {
  const nowIso = new Date().toISOString();
  const userRef = doc(db, 'users', user.uid);

  // Check if profile already exists in Firestore to preserve plan and subscription fields
  let existingPlan: 'free' | 'pro' = 'free';
  let existingPro = false;
  let existingProActivatedAt: string | null = null;
  let existingProOrderId: string | null = null;
  let existingProPaymentId: string | null = null;
  let existingProSignature: string | null = null;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.plan === 'pro' || data.pro === true) {
        existingPlan = 'pro';
        existingPro = true;
        existingProActivatedAt = data.proActivatedAt || null;
        existingProOrderId = data.proOrderId || null;
        existingProPaymentId = data.proPaymentId || null;
        existingProSignature = data.proSignature || null;
      }
    }
  } catch (err) {
    console.warn('Could not read existing user doc:', err);
  }

  const userProfileData: AppUserProfile = {
    uid: user.uid,
    displayName: user.displayName || (user.phoneNumber ? `Engineer (${user.phoneNumber.slice(-4)})` : 'CADVANTA Engineer'),
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    photoURL: user.photoURL || null,
    providerId: providerId || user.providerData?.[0]?.providerId || 'password',
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : nowIso,
    lastLoginAt: nowIso,
    role: existingPro ? 'pro' : 'engineer',
    plan: existingPlan,
    pro: existingPro,
    proActivatedAt: existingProActivatedAt,
    proOrderId: existingProOrderId,
    proPaymentId: existingProPaymentId,
    proSignature: existingProSignature,
  };

  try {
    // Non-blocking write: writes immediately to local cache and syncs to server in background
    await setDoc(userRef, userProfileData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  return userProfileData;
}

/**
 * Updates verified PRO status in Firestore for the authenticated user
 */
export async function updateVerifiedProInFirestore(
  userId: string,
  data: {
    plan: 'pro';
    pro: boolean;
    proActivatedAt: string;
    proOrderId: string;
    proPaymentId: string;
    proSignature?: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(
      userRef,
      {
        plan: 'pro',
        pro: true,
        role: 'pro',
        proActivatedAt: data.proActivatedAt,
        proOrderId: data.proOrderId,
        proPaymentId: data.proPaymentId,
        proSignature: data.proSignature || null,
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

export {
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
};
export type { FirebaseUser, ConfirmationResult };

export type AppConfirmationResult = ConfirmationResult;
