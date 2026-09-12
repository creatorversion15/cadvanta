import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, AlertTriangle, X } from 'lucide-react';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutConfirmOpen, closeLogoutConfirm, confirmLogout } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLogoutConfirmOpen) {
        closeLogoutConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutConfirmOpen, closeLogoutConfirm]);

  if (!isLogoutConfirmOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-[#0B1E17] to-[#07130F] border border-[#EF4444]/40 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.2)] p-6 text-[#F0FDF4] space-y-5 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#EF4444]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header with icon & close */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D1214] border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.25)]">
              <LogOut className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#EF4444] font-bold">
                Session Control
              </div>
              <h2 id="logout-modal-title" className="text-base font-bold font-mono text-[#F0FDF4]">
                Confirm Sign Out
              </h2>
            </div>
          </div>

          <button
            id="btn-logout-modal-x"
            onClick={closeLogoutConfirm}
            className="p-1 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-transparent hover:border-[#00F5A0]/20 transition-all cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation Question */}
        <div className="space-y-2 relative z-10">
          <p className="text-sm font-medium text-[#F0FDF4]">
            Are you sure you want to log out?
          </p>
          <p className="text-xs text-[#8CA89E] leading-relaxed">
            You will be signed out of your CADVANTA Engineering session. You can sign back in anytime via Google or Phone OTP.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 pt-2 relative z-10">
          <button
            id="btn-logout-cancel"
            type="button"
            onClick={closeLogoutConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#071510] hover:bg-[#102B21] border border-[#00F5A0]/20 hover:border-[#00F5A0]/40 text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="btn-logout-confirm"
            type="button"
            onClick={confirmLogout}
            className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.35)] active:scale-98 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
