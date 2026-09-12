import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useDesignAccess } from '../../context/DesignAccessContext';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  LogOut,
  Boxes,
  ExternalLink,
  Copy,
  Check,
  Award,
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { user, profile, isProfileModalOpen, closeProfileModal, logout } = useAuth();
  const { isPro } = useSubscription();
  const { unlockedDesignIds, userOwnedDesigns } = useDesignAccess();
  const [copiedUid, setCopiedUid] = React.useState<boolean>(false);

  if (!isProfileModalOpen || !user) return null;

  const copyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const displayName = profile?.displayName || user.displayName || (user.phoneNumber ? `Engineer ${user.phoneNumber.slice(-4)}` : 'CADVANTA Engineer');
  const email = profile?.email || user.email;
  const phoneNumber = profile?.phoneNumber || user.phoneNumber;
  const photoURL = profile?.photoURL || user.photoURL;
  const providerId = profile?.providerId || user.providerData?.[0]?.providerId || 'password';
  const createdAtFormatted = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Account';

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
            <div className="w-12 h-12 rounded-full bg-[#102B21] border-2 border-[#00F5A0]/50 overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(0,245,160,0.25)] shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-mono font-black text-lg text-[#00F5A0]">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-mono text-[#F0FDF4]">
                  {displayName}
                </h3>
                {isPro && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono font-bold border border-[#00F5A0]/40 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-[#8CA89E]">
                CADVANTA Certified Mechanical Engineer
              </span>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-transparent hover:border-[#00F5A0]/30 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Attributes Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          {/* Email / Phone */}
          <div className="p-3 bg-[#071510] border border-[#00F5A0]/20 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-[#8CA89E] flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#00F5A0]" />
              <span>Contact Identifier</span>
            </span>
            <div className="text-[#F0FDF4] font-medium truncate">
              {email || phoneNumber || 'Anonymous Profile'}
            </div>
          </div>

          {/* Auth Provider */}
          <div className="p-3 bg-[#071510] border border-[#00F5A0]/20 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-[#8CA89E] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#00F5A0]" />
              <span>Auth Provider</span>
            </span>
            <div className="text-[#00F5A0] font-bold uppercase flex items-center gap-1.5">
              <span>
                {providerId.includes('google')
                  ? 'Google Workspace'
                  : providerId.includes('phone')
                  ? 'Mobile SMS OTP'
                  : providerId}
              </span>
            </div>
          </div>

          {/* Member Since */}
          <div className="p-3 bg-[#071510] border border-[#00F5A0]/20 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-[#8CA89E] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#00F5A0]" />
              <span>Member Since</span>
            </span>
            <div className="text-[#F0FDF4]">{createdAtFormatted}</div>
          </div>

          {/* Accessible Designs */}
          <div className="p-3 bg-[#071510] border border-[#00F5A0]/20 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-[#8CA89E] flex items-center gap-1">
              <Boxes className="w-3 h-3 text-[#00F5A0]" />
              <span>Accessible Designs</span>
            </span>
            <div className="text-[#00F5A0] font-bold">
              {isPro ? 'All 60+ Unlocked (Pro)' : `${userOwnedDesigns.length} Models Active`}
            </div>
          </div>
        </div>

        {/* Firebase UID Info */}
        <div className="p-3 bg-[#071510] border border-[#00F5A0]/20 rounded-xl flex items-center justify-between gap-2 text-xs font-mono">
          <div className="truncate">
            <span className="text-[10px] uppercase text-[#8CA89E] block">
              Firebase Engineer UID
            </span>
            <span className="text-[#8CA89E] text-[11px] font-mono truncate">{user.uid}</span>
          </div>
          <button
            onClick={copyUid}
            className="px-2.5 py-1 rounded bg-[#102B21] hover:bg-[#153A2C] border border-[#00F5A0]/30 text-[#00F5A0] text-[11px] font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          >
            {copiedUid ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedUid ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Modal Actions: Logout */}
        <div className="flex items-center justify-between pt-2 border-t border-[#00F5A0]/15">
          <button
            onClick={closeProfileModal}
            className="px-4 py-2 rounded-xl bg-[#071510] hover:bg-[#102B21] border border-[#00F5A0]/20 text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-all cursor-pointer"
          >
            Close
          </button>

          <button
            id="btn-profile-modal-logout"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-[#2D1214] hover:bg-[#3D181A] border border-[#EF4444]/40 text-[#EF4444] hover:text-[#FCA5A5] text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
