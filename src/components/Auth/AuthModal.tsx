import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Shield,
  AlertCircle,
  Boxes,
  Loader2,
} from 'lucide-react';
import { CadVantaLogoMark } from '../Brand/CadVantaLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTitle,
    authModalSubtitle,
    authError,
    loginWithGoogle,
    clearAuthError,
  } = useAuth();

  // Loading state
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Reset internal states on modal open/close
  useEffect(() => {
    if (isAuthModalOpen) {
      setIsGoogleLoading(false);
      clearAuthError();
    }
  }, [isAuthModalOpen, clearAuthError]);

  if (!isAuthModalOpen) return null;

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-[#0B1E17] to-[#07130F] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_50px_rgba(0,245,160,0.15)] p-6 sm:p-7 text-[#F0FDF4] space-y-6 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#00F5A0]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#00D9FF]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header & Close Button */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,245,160,0.2)]">
              <CadVantaLogoMark size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  CADVANTA Engineering
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  AUTH
                </span>
              </div>
              <h2 className="text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight leading-snug">
                {authModalTitle}
              </h2>
            </div>
          </div>

          <button
            id="auth-modal-close-btn"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-transparent hover:border-[#00F5A0]/30 transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8CA89E] font-sans leading-relaxed relative z-10">
          {authModalSubtitle}
        </p>

        {/* Error Notification Banner */}
        {authError && (
          <div className="p-3 rounded-lg bg-[#2D1214] border border-[#EF4444]/40 text-[#FCA5A5] text-xs font-sans flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 relative z-10">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{authError}</div>
          </div>
        )}

        {/* --- SIGN IN WITH GOOGLE --- */}
        <div className="space-y-4 relative z-10">
          {/* Primary Google OAuth Sign In Button */}
          <button
            id="btn-auth-google-login"
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-12 px-4 rounded-xl bg-[#F0FDF4] hover:bg-[#FFFFFF] text-[#0A1612] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(240,253,244,0.15)] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-[#0A1612] animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google Vector Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.39 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.29 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Security Guarantee */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-mono text-[#8CA89E]">
            <Shield className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>Secured with Firebase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
