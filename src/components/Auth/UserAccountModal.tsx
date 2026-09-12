import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription, FOUNDER_NAME, SUBSCRIPTION_PRICE_INR } from '../../context/SubscriptionContext';
import { useDesignAccess } from '../../context/DesignAccessContext';
import {
  X,
  ShieldCheck,
  Crown,
  Database,
  Cpu,
  Key,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';

export const UserAccountModal: React.FC = () => {
  const { user, profile, isAccountModalOpen, closeAccountModal, logout } = useAuth();
  const { isPro, openSubscriptionModal } = useSubscription();
  const { unlockedDesignIds, unlockedPackIds } = useDesignAccess();

  if (!isAccountModalOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020A07]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0B1E17] to-[#07130F] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_50px_rgba(0,245,160,0.15)] p-6 sm:p-7 text-[#F0FDF4] space-y-6 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#00F5A0]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0]">
              <ShieldCheck className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-mono text-[#F0FDF4]">
                Account & Security Settings
              </h3>
              <span className="text-xs font-mono text-[#8CA89E]">
                CADVANTA Platform Access & Licensing
              </span>
            </div>
          </div>

          <button
            onClick={closeAccountModal}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-transparent hover:border-[#00F5A0]/30 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subscription & Tier Banner */}
        <div className="p-4 bg-[#071510] border border-[#00F5A0]/30 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8CA89E]">
              Membership Tier
            </span>
            {isPro ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] text-xs font-mono font-bold border border-[#00F5A0]/40 flex items-center gap-1.5">
                <Crown className="w-3 h-3 fill-current" />
                <span>CADVANTA PRO ACTIVE</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-mono font-bold border border-[#F59E0B]/40">
                STANDARD TIER
              </span>
            )}
          </div>

          <p className="text-xs text-[#8CA89E] font-sans">
            {isPro
              ? 'You have lifetime all-access to 60+ specialized mechanical CAD designs, turbine rotors, planetary gearboxes, and deep FEA solver tools.'
              : `Upgrade to CADVANTA PRO for only ₹${SUBSCRIPTION_PRICE_INR} lifetime via UPI to immediately unlock all heavy turbomachinery rotors and deep solvers.`}
          </p>

          {!isPro && (
            <button
              onClick={() => {
                closeAccountModal();
                openSubscriptionModal('Account Upgrade to CADVANTA PRO');
              }}
              className="w-full py-2.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,245,160,0.25)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to PRO (₹{SUBSCRIPTION_PRICE_INR})</span>
            </button>
          )}
        </div>

        {/* Engineering System Telemetry */}
        <div className="space-y-2 text-xs font-mono">
          <div className="text-[11px] uppercase tracking-wider text-[#8CA89E] font-bold">
            Platform Infrastructure
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#071510] border border-[#00F5A0]/15 rounded-lg">
              <span className="text-[10px] text-[#4E6B60] block">PERSISTENCE</span>
              <span className="text-[#00F5A0] font-bold">Cloud Firestore</span>
            </div>
            <div className="p-2.5 bg-[#071510] border border-[#00F5A0]/15 rounded-lg">
              <span className="text-[10px] text-[#4E6B60] block">GRAPHICS ENGINE</span>
              <span className="text-[#00F5A0] font-bold">Three.js WebGL 2.0</span>
            </div>
            <div className="p-2.5 bg-[#071510] border border-[#00F5A0]/15 rounded-lg">
              <span className="text-[10px] text-[#4E6B60] block">PURCHASED PACKS</span>
              <span className="text-[#F0FDF4] font-bold">{unlockedPackIds.length} Packs Active</span>
            </div>
            <div className="p-2.5 bg-[#071510] border border-[#00F5A0]/15 rounded-lg">
              <span className="text-[10px] text-[#4E6B60] block">UNLOCKED MODELS</span>
              <span className="text-[#F0FDF4] font-bold">{unlockedDesignIds.length} Individual</span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#00F5A0]/15">
          <button
            onClick={closeAccountModal}
            className="px-4 py-2 rounded-xl bg-[#071510] hover:bg-[#102B21] border border-[#00F5A0]/20 text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-[#2D1214] hover:bg-[#3D181A] border border-[#EF4444]/40 text-[#EF4444] hover:text-[#FCA5A5] text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
