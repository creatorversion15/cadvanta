import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { auth, signOut } from '../../lib/firebase';
import {
  User as UserIcon,
  LogOut,
  Shield,
  Crown,
  ChevronDown,
  Settings,
  LogIn,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const UserAuthWidget: React.FC = () => {
  const {
    user,
    profile,
    isLoading,
    openAuthModal,
    openProfileModal,
    openAccountModal,
    logout,
  } = useAuth();
  const { isPro, openSubscriptionModal, relockPro } = useSubscription();
  const { isDark, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isLoading && !user) {
    return (
      <div className="h-7 w-20 bg-[#0B1E17] animate-pulse rounded-lg border border-[rgba(16,185,129,0.15)] shrink-0" />
    );
  }

  // Not Logged In -> Sign In Button
  if (!user) {
    return (
      <button
        id="btn-header-signin"
        onClick={() => openAuthModal()}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0B1E17] hover:bg-[#102B21] text-[#00F5A0] hover:text-[#34EEA9] border border-[#00F5A0]/40 hover:border-[#00F5A0] rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,245,160,0.18)] active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
        title="Sign in with Google"
      >
        <LogIn className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">Sign In</span>
      </button>
    );
  }

  // Determine provider type
  const isGoogle =
    user.providerData?.some((p) => p.providerId === 'google.com') ||
    profile?.providerId === 'google.com' ||
    Boolean(user.photoURL && user.email);

  const isPhone =
    !isGoogle &&
    (user.providerData?.some((p) => p.providerId === 'phone') ||
      profile?.providerId === 'phone' ||
      Boolean(user.phoneNumber));

  // Determine avatar and label text according to specifications:
  // - Google users: Google profile photo (if available), User name
  // - Phone users: User avatar/icon, Phone number or "My Account"
  let userLabelText: string;
  let userSubText: string;

  if (isGoogle) {
    const rawName = String(profile?.displayName || user?.displayName || 'Google User');
    userLabelText = (rawName.split(' ')[0] || rawName).trim();
    userSubText = profile?.email || user?.email || 'Google Account';
  } else if (isPhone) {
    const phone = profile?.phoneNumber || user?.phoneNumber;
    userLabelText = phone || 'My Account';
    userSubText = phone || 'Phone Verified';
  } else {
    const emailPrefix = user?.email ? String(user.email).split('@')[0] : '';
    const rawName = String(profile?.displayName || user?.displayName || emailPrefix || 'My Account');
    userLabelText = (rawName.split(' ')[0] || rawName).trim();
    userSubText = profile?.email || user?.email || 'Authenticated';
  }

  const photoURL = isGoogle ? (profile?.photoURL || user.photoURL) : null;
  const fullName = profile?.displayName || user.displayName || (isPhone ? userLabelText : 'Engineer');

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Profile Avatar Pill Button */}
      <button
        id="btn-header-user-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0]/50 rounded-lg text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer shadow-xs group shrink-0"
        title="Account Menu"
      >
        {/* Avatar */}
        <div className="relative w-6 h-6 rounded-full bg-[#102B21] border border-[#00F5A0]/50 overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#00F5A0] shrink-0">
          {photoURL ? (
            <img
              src={photoURL}
              alt={fullName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-[#00F5A0]" />
          )}
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#00F5A0] rounded-full ring-1 ring-[#071510]" />
        </div>

        {/* User Name / Phone / My Account */}
        <span className="font-bold max-w-[85px] sm:max-w-[130px] truncate">
          {userLabelText}
        </span>

        {isPro && (
          <Crown className="w-3 h-3 text-[#00F5A0] fill-current shrink-0" />
        )}

        <ChevronDown className="w-3 h-3 text-[#8CA89E] group-hover:text-[#00F5A0] transition-colors shrink-0" />
      </button>

      {/* User Profile Dropdown Menu */}
      {isOpen && (
        <div
          id="user-profile-dropdown-menu"
          className="absolute right-0 mt-1.5 w-64 max-w-[calc(100vw-16px)] bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-xl shadow-2xl p-2 z-[90] animate-in fade-in slide-in-from-top-1 text-[#F0FDF4] space-y-1"
        >
          {/* Header user identity */}
          <div className="p-2 bg-[#0B1E17] border border-[rgba(16,185,129,0.15)] rounded-lg space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#102B21] border border-[#00F5A0]/40 overflow-hidden flex items-center justify-center shrink-0">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-[#00F5A0]" />
                  )}
                </div>
                <div className="font-bold font-mono text-xs text-[#F0FDF4] truncate">
                  {fullName}
                </div>
              </div>
              {isPro ? (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold flex items-center gap-0.5 shrink-0">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                  <span>PRO</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#102B21] text-[#8CA89E] shrink-0">
                  FREE
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[#8CA89E] truncate pl-8">
              {userSubText}
            </div>
          </div>

          <div className="h-[1px] bg-[rgba(16,185,129,0.12)] my-1" />

          {/* Menu Item 1: My Profile */}
          <button
            id="menu-btn-user-profile"
            onClick={() => {
              setIsOpen(false);
              openProfileModal();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4 text-[#00F5A0]" />
            <span>My Profile</span>
          </button>

          {/* Menu Item 2: Account */}
          <button
            id="menu-btn-user-account"
            onClick={() => {
              setIsOpen(false);
              openAccountModal();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#00F5A0]" />
            <span>Account</span>
          </button>

          {/* Menu Item 3: PRO Plan */}
          <button
            id="menu-btn-user-pro-plan"
            onClick={() => {
              setIsOpen(false);
              openSubscriptionModal('Upgrade or Manage your CADVANTA PRO Plan');
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-[#F59E0B]" />
              <span>PRO Plan</span>
            </div>
            {isPro ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00F5A0]/20 text-[#00F5A0] font-bold">
                ACTIVE
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold">
                ₹1.69
              </span>
            )}
          </button>

          {/* Menu Item 3.5: Theme Toggle (Dark / Light) */}
          <button
            id="menu-btn-user-theme"
            onClick={() => {
              toggleTheme();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Sun className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#00B377]" />
              )}
              <span>Theme</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#102B21] text-[#F0FDF4] font-mono border border-[rgba(16,185,129,0.2)]">
              {isDark ? 'Dark (Obsidian)' : 'Light'}
            </span>
          </button>

          <div className="h-[1px] bg-[rgba(16,185,129,0.12)] my-1" />

          {/* Menu Item 4: Logout (Actual Firebase signOut) */}
          <button
            id="menu-btn-user-logout"
            onClick={async () => {
              setIsOpen(false);
              try {
                await signOut(auth);
              } catch (err) {
                console.warn("Firebase signOut Notice:", err);
              }
              await logout();
              relockPro();
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-[#EF4444] hover:bg-[#2D1214] flex items-center gap-2.5 transition-colors cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4 text-[#EF4444]" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};
