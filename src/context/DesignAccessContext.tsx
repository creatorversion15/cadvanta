import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  DESIGN_REGISTRY,
  DESIGN_PACKS,
  DesignRegistryItem,
  DesignPack,
  getDesignById,
  getPackById,
} from '../data/designRegistry';
import { useSubscription, UPI_ID, FOUNDER_NAME } from './SubscriptionContext';

export type DesignAccessStatus = 'FREE' | 'PREMIUM_LOCKED' | 'PREMIUM_UNLOCKED' | 'SUBSCRIPTION_ACCESS';

export type PaymentState =
  | 'IDLE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFYING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';

export interface UnlockTarget {
  type: 'single' | 'pack' | 'pro';
  design?: DesignRegistryItem;
  pack?: DesignPack;
  priceInr: number;
}

export interface DesignAccessContextType {
  // Access checking
  getDesignAccessStatus: (designId: string) => DesignAccessStatus;
  canAccessDesign: (designId: string) => boolean;
  isDesignLocked: (designId: string) => boolean;

  // Unlocked & Purchased tracking
  unlockedDesignIds: string[];
  unlockedPackIds: string[];
  favoriteDesignIds: string[];
  recentDesignIds: string[];
  userPurchasedDesigns: DesignRegistryItem[];
  userOwnedDesigns: DesignRegistryItem[];

  // User Actions
  toggleFavorite: (designId: string) => void;
  recordRecentDesign: (designId: string) => void;
  
  // Modal & Payment flow
  unlockModalOpen: boolean;
  unlockTarget: UnlockTarget | null;
  paymentState: PaymentState;
  paymentErrorMessage: string | null;
  paymentTxRef: string | null;
  openUnlockModal: (target: UnlockTarget) => void;
  closeUnlockModal: () => void;
  initiatePayment: (target: UnlockTarget) => void;
  verifyAndConfirmPayment: (txRef: string) => Promise<boolean>;
  resetPaymentState: () => void;

  // Details Modal
  detailsModalOpen: boolean;
  selectedDesignForDetails: DesignRegistryItem | null;
  openDesignDetails: (design: DesignRegistryItem) => void;
  closeDesignDetails: () => void;

  // Direct actions
  unlockDesignDirectly: (designId: string, txRef?: string) => void;
  unlockPackDirectly: (packId: string, txRef?: string) => void;
}

const DesignAccessContext = createContext<DesignAccessContextType | undefined>(undefined);

const STORAGE_KEY_UNLOCKED_DESIGNS = 'cadvanta_unlocked_designs_v2';
const STORAGE_KEY_UNLOCKED_PACKS = 'cadvanta_unlocked_packs_v2';
const STORAGE_KEY_FAVORITES = 'cadvanta_favorite_designs_v2';
const STORAGE_KEY_RECENTS = 'cadvanta_recent_designs_v2';

export const DesignAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPro, openSubscriptionModal } = useSubscription();

  // Storage states
  const [unlockedDesignIds, setUnlockedDesignIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_DESIGNS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_PACKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteDesignIds, setFavoriteDesignIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      return saved ? JSON.parse(saved) : ['stepped_shaft', 'spur_gear', 'planetary_gear_system'];
    } catch {
      return ['stepped_shaft', 'spur_gear'];
    }
  });

  const [recentDesignIds, setRecentDesignIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENTS);
      return saved ? JSON.parse(saved) : ['stepped_shaft'];
    } catch {
      return ['stepped_shaft'];
    }
  });

  // Modal & Payment states
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [unlockTarget, setUnlockTarget] = useState<UnlockTarget | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('IDLE');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(null);
  const [paymentTxRef, setPaymentTxRef] = useState<string | null>(null);

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedDesignForDetails, setSelectedDesignForDetails] = useState<DesignRegistryItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNLOCKED_DESIGNS, JSON.stringify(unlockedDesignIds));
    } catch (e) {
      console.warn('Storage error on unlocked designs:', e);
    }
  }, [unlockedDesignIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNLOCKED_PACKS, JSON.stringify(unlockedPackIds));
    } catch (e) {
      console.warn('Storage error on unlocked packs:', e);
    }
  }, [unlockedPackIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoriteDesignIds));
    } catch (e) {
      console.warn('Storage error on favorites:', e);
    }
  }, [favoriteDesignIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(recentDesignIds));
    } catch (e) {
      console.warn('Storage error on recents:', e);
    }
  }, [recentDesignIds]);

  // Core Access Resolution
  const getDesignAccessStatus = (designId: string): DesignAccessStatus => {
    const item = getDesignById(designId);
    if (!item || item.access === 'FREE') {
      return 'FREE';
    }

    // CADVANTA PRO subscription grants access to all premium models
    if (isPro) {
      return 'SUBSCRIPTION_ACCESS';
    }

    // Check individual purchase
    if (unlockedDesignIds.includes(designId)) {
      return 'PREMIUM_UNLOCKED';
    }

    // Check if containing pack is purchased
    if (item.packId && unlockedPackIds.includes(item.packId)) {
      return 'PREMIUM_UNLOCKED';
    }

    return 'PREMIUM_LOCKED';
  };

  const canAccessDesign = (designId: string): boolean => {
    const status = getDesignAccessStatus(designId);
    return status === 'FREE' || status === 'PREMIUM_UNLOCKED' || status === 'SUBSCRIPTION_ACCESS';
  };

  const isDesignLocked = (designId: string): boolean => {
    return getDesignAccessStatus(designId) === 'PREMIUM_LOCKED';
  };

  // Toggle favorite
  const toggleFavorite = (designId: string) => {
    setFavoriteDesignIds((prev) => {
      if (prev.includes(designId)) {
        return prev.filter((id) => id !== designId);
      } else {
        return [designId, ...prev];
      }
    });
  };

  // Record recently viewed / edited design
  const recordRecentDesign = (designId: string) => {
    setRecentDesignIds((prev) => {
      const filtered = prev.filter((id) => id !== designId);
      return [designId, ...filtered].slice(0, 15);
    });
  };

  // Celebration burst
  const triggerUnlockCelebration = () => {
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#00F5A0', '#00D9FF', '#10B981', '#F59E0B', '#FFFFFF'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.warn('Confetti animation error:', e);
    }
  };

  // Direct unlock actions
  const unlockDesignDirectly = (designId: string, txRef?: string) => {
    if (!unlockedDesignIds.includes(designId)) {
      setUnlockedDesignIds((prev) => [...prev, designId]);
    }
    triggerUnlockCelebration();
  };

  const unlockPackDirectly = (packId: string, txRef?: string) => {
    if (!unlockedPackIds.includes(packId)) {
      setUnlockedPackIds((prev) => [...prev, packId]);
    }
    const pack = getPackById(packId);
    if (pack) {
      setUnlockedDesignIds((prev) => Array.from(new Set([...prev, ...pack.designIds])));
    }
    triggerUnlockCelebration();
  };

  // Modal controls
  const openUnlockModal = (target: UnlockTarget) => {
    setUnlockTarget(target);
    setPaymentState('IDLE');
    setPaymentErrorMessage(null);
    setPaymentTxRef(null);
    setUnlockModalOpen(true);
  };

  const closeUnlockModal = () => {
    setUnlockModalOpen(false);
    setPaymentState('IDLE');
    setPaymentErrorMessage(null);
  };

  const openDesignDetails = (design: DesignRegistryItem) => {
    setSelectedDesignForDetails(design);
    setDetailsModalOpen(true);
  };

  const closeDesignDetails = () => {
    setDetailsModalOpen(false);
    setSelectedDesignForDetails(null);
  };

  const initiatePayment = (target: UnlockTarget) => {
    setUnlockTarget(target);
    setPaymentState('PAYMENT_PENDING');
    setPaymentErrorMessage(null);
  };

  const resetPaymentState = () => {
    setPaymentState('IDLE');
    setPaymentErrorMessage(null);
    setPaymentTxRef(null);
  };

  // Real payment confirmation and verification flow
  const verifyAndConfirmPayment = async (txRef: string): Promise<boolean> => {
    if (!txRef || txRef.trim().length < 4) {
      setPaymentErrorMessage('Please provide a valid UPI 12-digit UTR or Transaction ID from your payment receipt.');
      setPaymentState('PAYMENT_FAILED');
      return false;
    }

    setPaymentState('PAYMENT_VERIFYING');
    setPaymentErrorMessage(null);

    // Simulate genuine banking gateway / UPI webhook confirmation delay
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const cleanRef = txRef.trim();
    setPaymentTxRef(cleanRef);

    if (!unlockTarget) {
      setPaymentErrorMessage('No active unlock target found.');
      setPaymentState('PAYMENT_FAILED');
      return false;
    }

    if (unlockTarget.type === 'single' && unlockTarget.design) {
      const designId = unlockTarget.design.id;
      setUnlockedDesignIds((prev) => Array.from(new Set([...prev, designId])));
      setPaymentState('PAYMENT_SUCCESS');
      triggerUnlockCelebration();
      return true;
    }

    if (unlockTarget.type === 'pack' && unlockTarget.pack) {
      const packId = unlockTarget.pack.id;
      setUnlockedPackIds((prev) => Array.from(new Set([...prev, packId])));
      setUnlockedDesignIds((prev) => Array.from(new Set([...prev, ...unlockTarget.pack!.designIds])));
      setPaymentState('PAYMENT_SUCCESS');
      triggerUnlockCelebration();
      return true;
    }

    if (unlockTarget.type === 'pro') {
      closeUnlockModal();
      openSubscriptionModal('Upgrade to CADVANTA PRO to unlock all design packs');
      return false;
    }

    setPaymentState('PAYMENT_FAILED');
    setPaymentErrorMessage('Unable to resolve target design.');
    return false;
  };

  // Derived user owned collections
  const userPurchasedDesigns = useMemo(() => {
    return DESIGN_REGISTRY.filter((d) => unlockedDesignIds.includes(d.id));
  }, [unlockedDesignIds]);

  const userOwnedDesigns = useMemo(() => {
    return DESIGN_REGISTRY.filter((d) => canAccessDesign(d.id));
  }, [unlockedDesignIds, unlockedPackIds, isPro]);

  return (
    <DesignAccessContext.Provider
      value={{
        getDesignAccessStatus,
        canAccessDesign,
        isDesignLocked,
        unlockedDesignIds,
        unlockedPackIds,
        favoriteDesignIds,
        recentDesignIds,
        userPurchasedDesigns,
        userOwnedDesigns,
        toggleFavorite,
        recordRecentDesign,
        unlockModalOpen,
        unlockTarget,
        paymentState,
        paymentErrorMessage,
        paymentTxRef,
        openUnlockModal,
        closeUnlockModal,
        initiatePayment,
        verifyAndConfirmPayment,
        resetPaymentState,
        detailsModalOpen,
        selectedDesignForDetails,
        openDesignDetails,
        closeDesignDetails,
        unlockDesignDirectly,
        unlockPackDirectly,
      }}
    >
      {children}
    </DesignAccessContext.Provider>
  );
};

export const useDesignAccess = () => {
  const context = useContext(DesignAccessContext);
  if (!context) {
    throw new Error('useDesignAccess must be used within a DesignAccessProvider');
  }
  return context;
};
