import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PartType } from '../types/cad';
import { useAuth } from './AuthContext';
import { db, doc, onSnapshot, updateVerifiedProInFirestore } from '../lib/firebase';

export const HARD_DESIGN_ENGINES: PartType[] = [
  'engine_cylinder_block',
  'engine_cylinder_head',
  'gas_turbine_blisk',
  'roots_supercharger_rotor',
  'cycloidal_drive',
  'engine_crankshaft',
  'planetary_gearbox',
  'clutch_pack',
  'turbocharger_impeller',
  'engine_valve',
  'geneva_mechanism',
  'universal_joint',
];

export const UPI_ID = '9420482152-2@ybl';
export const FOUNDER_NAME = 'Viraj Bansod';
export const SUBSCRIPTION_PRICE_INR = 1.69;

export type SubscriptionPlan = 'free' | 'pro';
export type PaymentStatus =
  | 'LOCKED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';

export interface PaymentOrderInfo {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  provider: 'razorpay' | 'cadvanta_gateway';
  gatewayOrderId?: string;
}

export interface SubscriptionState {
  isPro: boolean;
  plan: SubscriptionPlan;
  paymentStatus: PaymentStatus;
  paymentError: string | null;
  activatedAt: string | null;
  transactionRef: string | null;
  upiId: string;
  priceInr: number;
  isModalOpen: boolean;
  modalReason: string;
  targetPartType?: PartType;
  currentOrder: PaymentOrderInfo | null;
  openSubscriptionModal: (reason?: string, targetPart?: PartType) => void;
  closeSubscriptionModal: () => void;
  initiatePaymentOrder: () => Promise<PaymentOrderInfo | null>;
  verifyPaymentWithServer: (params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => Promise<boolean>;
  cancelPayment: () => void;
  failPayment: (errorMessage: string) => void;
  resetPaymentStatus: () => void;
  relockPro: () => Promise<void>;
  isHardEngine: (type: PartType) => boolean;
  isFeatureLocked: (
    feature: 'vira_ai' | 'hard_engines' | 'fea_advanced' | 'step_export',
    partType?: PartType
  ) => boolean;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, openAuthModal } = useAuth();

  // PRO status is strictly server-authoritative and user-account bound
  const [isPro, setIsPro] = useState<boolean>(false);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('LOCKED');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<PaymentOrderInfo | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalReason, setModalReason] = useState<string>('Unlock CADVANTA PRO for ₹1.69');
  const [targetPartType, setTargetPartType] = useState<PartType | undefined>(undefined);

  // Purge any legacy insecure localStorage keys on application mount
  useEffect(() => {
    try {
      localStorage.removeItem('cadvanta_pro_status');
      localStorage.removeItem('cadvanta_pro_activated_at');
      localStorage.removeItem('cadvanta_pro_tx_ref');
      localStorage.removeItem('pro');
    } catch {
      // ignore
    }
  }, []);

  // Fetch real subscription status from server backend and live Firestore
  useEffect(() => {
    if (!user) {
      // Unauthenticated: always FREE / LOCKED
      setIsPro(false);
      setPlan('free');
      setActivatedAt(null);
      setTransactionRef(null);
      setPaymentStatus('LOCKED');
      return;
    }

    const userId = user.uid;

    // 1. Fetch authoritative status from backend API
    const fetchServerStatus = async () => {
      try {
        const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPro && data.plan === 'pro') {
            setIsPro(true);
            setPlan('pro');
            setPaymentStatus('PAYMENT_SUCCESS');
            setActivatedAt(data.activatedAt || null);
            setTransactionRef(data.orderId || null);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend subscription status fetch notice:', err);
      }
    };

    fetchServerStatus();

    // 2. Real-time Firestore snapshot listener on users/{uid}
    const unsub = onSnapshot(
      doc(db, 'users', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plan === 'pro' || data.pro === true) {
            setIsPro(true);
            setPlan('pro');
            setPaymentStatus('PAYMENT_SUCCESS');
            setActivatedAt(data.proActivatedAt || null);
            setTransactionRef(data.proOrderId || null);
            return;
          }
        }
        // If not marked pro in database, ensure locked
        setIsPro(false);
        setPlan('free');
        setPaymentStatus('LOCKED');
      },
      (error) => {
        console.warn('Firestore subscription snapshot warning:', error);
      }
    );

    return () => unsub();
  }, [user]);

  const openSubscriptionModal = (reason?: string, targetPart?: PartType) => {
    if (reason) setModalReason(reason);
    if (targetPart) setTargetPartType(targetPart);
    setIsModalOpen(true);
    // If not pro, reset payment state to LOCKED or current state
    if (!isPro) {
      setPaymentStatus('LOCKED');
      setPaymentError(null);
    }
  };

  const closeSubscriptionModal = () => {
    setIsModalOpen(false);
    if (paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'PAYMENT_FAILED') {
      setPaymentStatus('LOCKED');
      setPaymentError(null);
    }
  };

  const triggerCelebration = () => {
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#00F5A0', '#34EEA9', '#10B981', '#F59E0B', '#FFFFFF'];

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

  /**
   * Step 1: Initiates payment order on the server
   * Authenticates user first if needed.
   */
  const initiatePaymentOrder = async (): Promise<PaymentOrderInfo | null> => {
    if (!user) {
      openAuthModal({
        title: 'Sign In Required for PRO',
        subtitle: 'Please sign in with your phone or Google account to link your PRO subscription.',
      });
      return null;
    }

    setPaymentStatus('PAYMENT_PENDING');
    setPaymentError(null);

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          plan: 'pro',
          amount: 169, // ₹1.69 in paise
          userEmail: user.email || undefined,
          userPhone: user.phoneNumber || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment order on server.');
      }

      const data = await res.json();
      if (!data.success || !data.order) {
        throw new Error(data.error || 'Server did not return a valid order.');
      }

      const order: PaymentOrderInfo = data.order;
      setCurrentOrder(order);
      return order;
    } catch (err: any) {
      console.error('Payment order creation error:', err);
      setPaymentStatus('PAYMENT_FAILED');
      setPaymentError(err?.message || 'Unable to connect to payment server.');
      return null;
    }
  };

  /**
   * Step 2: Server-side payment verification
   * The frontend sends the gateway response to the server.
   * PRO is ONLY activated if the server cryptographically verifies the payment.
   */
  const verifyPaymentWithServer = async (params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean> => {
    if (!user) {
      setPaymentStatus('PAYMENT_FAILED');
      setPaymentError('User is not authenticated. Cannot verify payment.');
      return false;
    }

    setPaymentStatus('PAYMENT_PENDING');
    setPaymentError(null);

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: params.orderId,
          paymentId: params.paymentId,
          signature: params.signature,
          userId: user.uid,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success || !verifyData.pro) {
        throw new Error(
          verifyData.error || 'Payment could not be verified by the server. PRO remains locked.'
        );
      }

      // 1. Update client state ONLY after confirmed server verification
      setIsPro(true);
      setPlan('pro');
      setPaymentStatus('PAYMENT_SUCCESS');
      setActivatedAt(verifyData.activatedAt || new Date().toISOString());
      setTransactionRef(params.paymentId);

      // 2. Sync verified status to Firestore document for persistence across refreshes
      try {
        await updateVerifiedProInFirestore(user.uid, {
          plan: 'pro',
          pro: true,
          proActivatedAt: verifyData.activatedAt || new Date().toISOString(),
          proOrderId: params.orderId,
          proPaymentId: params.paymentId,
          proSignature: verifyData.proSignature,
        });
      } catch (fsErr) {
        console.warn('Background Firestore write warning (server verified):', fsErr);
      }

      // 3. Trigger celebration animation
      triggerCelebration();
      return true;
    } catch (err: any) {
      console.error('Server payment verification rejected:', err);
      setPaymentStatus('PAYMENT_FAILED');
      setPaymentError(err?.message || 'Server-side payment verification failed. PRO remains locked.');
      setIsPro(false);
      setPlan('free');
      return false;
    }
  };

  const cancelPayment = () => {
    setPaymentStatus('PAYMENT_CANCELLED');
    setPaymentError('Payment was cancelled. PRO remains locked.');
    setIsPro(false);
  };

  const failPayment = (errorMessage: string) => {
    setPaymentStatus('PAYMENT_FAILED');
    setPaymentError(errorMessage || 'Payment was declined or failed.');
    setIsPro(false);
  };

  const resetPaymentStatus = () => {
    if (!isPro) {
      setPaymentStatus('LOCKED');
      setPaymentError(null);
    }
  };

  /**
   * Reset / Relock PRO for testing security scenarios or logout
   */
  const relockPro = async () => {
    setIsPro(false);
    setPlan('free');
    setActivatedAt(null);
    setTransactionRef(null);
    setPaymentStatus('LOCKED');
    setPaymentError(null);

    if (user) {
      try {
        await fetch('/api/subscription/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
      } catch (err) {
        console.warn('Subscription reset warning:', err);
      }
    }
  };

  const isHardEngine = (type: PartType): boolean => {
    return HARD_DESIGN_ENGINES.includes(type);
  };

  const isFeatureLocked = (
    feature: 'vira_ai' | 'hard_engines' | 'fea_advanced' | 'step_export',
    partType?: PartType
  ): boolean => {
    if (isPro) return false;

    if (feature === 'hard_engines') {
      return partType ? HARD_DESIGN_ENGINES.includes(partType) : true;
    }

    return false;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        plan,
        paymentStatus,
        paymentError,
        activatedAt,
        transactionRef,
        upiId: UPI_ID,
        priceInr: SUBSCRIPTION_PRICE_INR,
        isModalOpen,
        modalReason,
        targetPartType,
        currentOrder,
        openSubscriptionModal,
        closeSubscriptionModal,
        initiatePaymentOrder,
        verifyPaymentWithServer,
        cancelPayment,
        failPayment,
        resetPaymentStatus,
        relockPro,
        isHardEngine,
        isFeatureLocked,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionState => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
