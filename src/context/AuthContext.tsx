import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  syncUserProfile,
  AppUserProfile,
  FirebaseUser,
  ConfirmationResult,
  AppConfirmationResult,
  firebaseConfig,
} from '../lib/firebase';

export interface AuthContextType {
  user: FirebaseUser | null;
  profile: AppUserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTitle: string;
  authModalSubtitle: string;
  authError: string | null;
  
  // Modals & triggers
  openAuthModal: (options?: { title?: string; subtitle?: string; onAuthenticated?: () => void }) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, options?: { title?: string; subtitle?: string }) => void;
  
  // Auth methods
  loginWithGoogle: () => Promise<boolean>;
  sendPhoneOtp: (phoneNumber: string, containerId?: string) => Promise<AppConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: AppConfirmationResult, otpCode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  cleanupRecaptcha: () => void;

  // Logout confirmation modal
  isLogoutConfirmOpen: boolean;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  confirmLogout: () => Promise<void>;

  // Account & Profile modals
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  isAccountModalOpen: boolean;
  openAccountModal: () => void;
  closeAccountModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert Firebase error codes to friendly engineering messages
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred during authentication.';
  const code = error.code || '';
  const message = error.message || '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Authentication request was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by browser. Please enable popups for this site.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Please provide a valid 10-digit mobile number with country code (e.g. +91 98765 43210).';
    case 'auth/missing-phone-number':
      return 'Please enter a valid phone number.';
    case 'auth/invalid-verification-code':
      return 'Incorrect verification code. Please try again.';
    case 'auth/code-expired':
      return 'This verification code has expired. Please request a new code.';
    case 'auth/too-many-requests':
      return 'Too many requests. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for this Firebase project. Please check Firebase Console billing or use Google sign-in.';
    case 'auth/operation-not-allowed':
      return `Phone authentication is not enabled in Firebase Console (Project: ${firebaseConfig.projectId}). Enable Phone in Firebase Console -> Authentication -> Sign-in method -> Phone.`;
    case 'auth/unauthorized-domain':
      return `Domain "${currentHostname}" is not authorized. Add it to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/user-disabled':
      return 'This engineer account has been deactivated.';
    default:
      if (message.includes('auth/')) {
        return message.replace(/Firebase:\s*Error\s*\((auth\/[^)]+)\)\.?/i, '$1').replace(/-/g, ' ');
      }
      return message || 'Authentication failed. Please verify your credentials and try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal UI state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTitle, setAuthModalTitle] = useState<string>('Sign in to Continue');
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string>('Sign in to access this content.');
  const [authError, setAuthError] = useState<string | null>(null);

  // Logout confirmation state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  // Account/Profile modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Pending callback to execute automatically after successful authentication
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Recaptcha verifier ref
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Safely clean up reCAPTCHA verifier instance
  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        // ignore clearing error
      }
      recaptchaVerifierRef.current = null;
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
        // Immediate optimistic profile from currentUser to prevent UI flicker
        const instantProfile: AppUserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || (currentUser.phoneNumber ? `Engineer (${currentUser.phoneNumber.slice(-4)})` : 'CADVANTA Engineer'),
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          photoURL: currentUser.photoURL || null,
          providerId: currentUser.providerData?.[0]?.providerId || 'firebase',
          createdAt: currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toISOString() : new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: 'engineer',
        };
        setProfile(instantProfile);

        try {
          const syncedProfile = await syncUserProfile(currentUser);
          setProfile(syncedProfile);
        } catch (err) {
          console.warn('Profile sync warning:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      cleanupRecaptcha();
    };
  }, [cleanupRecaptcha]);

  // Execute pending action after successful authentication
  const executePendingAction = useCallback(() => {
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Slight delay to allow modal transitions to unmount cleanly
      setTimeout(() => {
        try {
          action();
        } catch (err) {
          console.warn('Warning executing authenticated callback:', err);
        }
      }, 50);
    }
  }, []);

  const openAuthModal = useCallback((options?: { title?: string; subtitle?: string; onAuthenticated?: () => void }) => {
    if (options?.title) setAuthModalTitle(options.title);
    else setAuthModalTitle('Sign in to Continue');

    if (options?.subtitle) setAuthModalSubtitle(options.subtitle);
    else setAuthModalSubtitle('Sign in to access this content.');

    if (options?.onAuthenticated) {
      pendingActionRef.current = options.onAuthenticated;
    }

    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
    cleanupRecaptcha();
  }, [cleanupRecaptcha]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  /**
   * Protected Content Guard:
   * If logged in, immediately executes the action.
   * If NOT logged in, sets pending action and opens the Auth modal.
   */
  const requireAuth = useCallback(
    (action: () => void, options?: { title?: string; subtitle?: string }) => {
      if (user) {
        action();
      } else {
        openAuthModal({
          title: options?.title || 'Sign in to Continue',
          subtitle: options?.subtitle || 'Sign in to access this content.',
          onAuthenticated: action,
        });
      }
    },
    [user, openAuthModal]
  );

  // Google OAuth Login
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        // Immediately set user and optimistic profile to eliminate any UI transition lag
        setUser(result.user);
        setIsLoading(false);
        const instantProfile: AppUserProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Google Engineer',
          email: result.user.email || null,
          phoneNumber: result.user.phoneNumber || null,
          photoURL: result.user.photoURL || null,
          providerId: 'google.com',
          createdAt: result.user.metadata.creationTime ? new Date(result.user.metadata.creationTime).toISOString() : new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          role: 'engineer',
        };
        setProfile(instantProfile);
        setIsAuthModalOpen(false);
        cleanupRecaptcha();
        executePendingAction();

        // Background profile sync
        syncUserProfile(result.user, 'google.com').then((synced) => {
          setProfile(synced);
        }).catch((err) => {
          console.warn('Profile sync fallback:', err);
        });

        return true;
      }
      return false;
    } catch (error: any) {
      console.warn("Firebase Auth Notice:", error?.code, error?.message);
      const friendlyMsg = formatAuthError(error);
      setAuthError(friendlyMsg);
      return false;
    }
  }, [cleanupRecaptcha, executePendingAction]);

  // Phone Auth: Initialize reCAPTCHA and Send Real SMS 6-Digit OTP via Firebase
  const sendPhoneOtp = useCallback(
    async (phoneNumber: string, containerId = 'auth-recaptcha-container'): Promise<AppConfirmationResult> => {
      setAuthError(null);
      try {
        // Clean previous verifier if exists
        cleanupRecaptcha();

        // Ensure container element is in DOM
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error(`reCAPTCHA container #${containerId} not found in DOM.`);
        }

        // Clean any stale elements inside container
        container.innerHTML = '';

        const verifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            // Invisible reCAPTCHA verification passed
          },
          'expired-callback': () => {
            setAuthError('Security reCAPTCHA expired. Please try sending OTP again.');
            cleanupRecaptcha();
          },
        });

        recaptchaVerifierRef.current = verifier;
        await verifier.render();

        // Firebase sends a REAL SMS to the user's phone number
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        return confirmation;
      } catch (error: any) {
        console.warn("Firebase Auth Notice:", error?.code, error?.message);
        cleanupRecaptcha();
        const friendlyMsg = formatAuthError(error);
        setAuthError(friendlyMsg);
        throw error;
      }
    },
    [cleanupRecaptcha]
  );

  // Phone Auth: Verify Real OTP Code with Firebase
  const verifyPhoneOtp = useCallback(
    async (confirmationResult: AppConfirmationResult, otpCode: string): Promise<boolean> => {
      setAuthError(null);
      try {
        const cleanCode = otpCode.replace(/\D/g, '');
        if (cleanCode.length !== 6) {
          throw { code: 'auth/invalid-verification-code', message: 'Please enter a complete 6-digit OTP.' };
        }

        // Firebase verifies the OTP received by the user via SMS
        const result = await confirmationResult.confirm(cleanCode);
        if (result.user) {
          // Set real Firebase user and initial profile
          setUser(result.user);
          setIsLoading(false);
          const instantProfile: AppUserProfile = {
            uid: result.user.uid,
            displayName: result.user.displayName || (result.user.phoneNumber ? `Engineer (${result.user.phoneNumber.slice(-4)})` : 'CADVANTA Engineer'),
            email: result.user.email || null,
            phoneNumber: result.user.phoneNumber || null,
            photoURL: result.user.photoURL || null,
            providerId: 'phone',
            createdAt: result.user.metadata?.creationTime ? new Date(result.user.metadata.creationTime).toISOString() : new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            role: 'engineer',
          };
          setProfile(instantProfile);
          setIsAuthModalOpen(false);
          cleanupRecaptcha();
          executePendingAction();

          // Background profile sync to Firestore
          syncUserProfile(result.user, 'phone').then((synced) => {
            setProfile(synced);
          }).catch((err) => {
            console.warn('Profile sync fallback:', err);
          });

          return true;
        }
        return false;
      } catch (error: any) {
        console.warn("Firebase Auth Notice:", error?.code, error?.message);
        const friendlyMsg = formatAuthError(error);
        setAuthError(friendlyMsg);
        return false;
      }
    },
    [cleanupRecaptcha, executePendingAction]
  );

  // Logout implementation with immediate local state clearance and session invalidation
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setIsProfileModalOpen(false);
      setIsAccountModalOpen(false);
      setIsLogoutConfirmOpen(false);
      pendingActionRef.current = null;
      cleanupRecaptcha();
    } catch (err: any) {
      console.warn("Firebase Auth Notice:", err?.code, err?.message);
    }
  }, [cleanupRecaptcha]);

  const openLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const closeLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(false);
  }, []);

  const confirmLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const openAccountModal = useCallback(() => {
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthModalOpen,
        authModalTitle,
        authModalSubtitle,
        authError,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        loginWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        clearAuthError,
        cleanupRecaptcha,
        isLogoutConfirmOpen,
        openLogoutConfirm,
        closeLogoutConfirm,
        confirmLogout,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        isAccountModalOpen,
        openAccountModal,
        closeAccountModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
