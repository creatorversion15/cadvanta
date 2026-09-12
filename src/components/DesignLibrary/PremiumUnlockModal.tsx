import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X,
  QrCode,
  Smartphone,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useDesignAccess, UnlockTarget } from '../../context/DesignAccessContext';
import { useSubscription, UPI_ID, FOUNDER_NAME } from '../../context/SubscriptionContext';
import { getPackById } from '../../data/designRegistry';

interface PremiumUnlockModalProps {
  onDesignActivated?: (designId: string) => void;
}

export const PremiumUnlockModal: React.FC<PremiumUnlockModalProps> = ({ onDesignActivated }) => {
  const {
    unlockModalOpen,
    closeUnlockModal,
    unlockTarget,
    paymentState,
    paymentErrorMessage,
    verifyAndConfirmPayment,
    initiatePayment,
    resetPaymentState,
  } = useDesignAccess();

  const { isPro, openSubscriptionModal } = useSubscription();

  const [selectedOption, setSelectedOption] = useState<'single' | 'pack' | 'pro'>('single');
  const [utrInput, setUtrInput] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  if (!unlockModalOpen || !unlockTarget) return null;

  const currentDesign = unlockTarget.design;
  const containingPack = currentDesign?.packId ? getPackById(currentDesign.packId) : unlockTarget.pack;

  // Compute pricing
  const singlePrice = currentDesign?.priceInr || unlockTarget.priceInr || 99;
  const packPrice = containingPack?.priceInr || 299;
  const proPrice = 1.69;

  const activePrice =
    selectedOption === 'single'
      ? singlePrice
      : selectedOption === 'pack'
      ? packPrice
      : proPrice;

  const activeTargetTitle =
    selectedOption === 'single'
      ? currentDesign?.name || 'Selected Mechanical Design'
      : selectedOption === 'pack'
      ? containingPack?.name || 'Advanced Mechanical Design Pack'
      : 'CADVANTA PRO - All Access Pass';

  // UPI Deep Link Generation
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    FOUNDER_NAME
  )}&am=${activePrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `CADVANTA_${selectedOption.toUpperCase()}_${currentDesign?.id || 'PRO'}`
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(activePrice.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleProceedToPayment = () => {
    if (selectedOption === 'pro') {
      closeUnlockModal();
      openSubscriptionModal('Upgrade to CADVANTA PRO for ₹1.69');
      return;
    }
    if (selectedOption === 'single' && currentDesign) {
      initiatePayment({ type: 'single', design: currentDesign, priceInr: singlePrice });
    } else if (selectedOption === 'pack' && containingPack) {
      initiatePayment({ type: 'pack', pack: containingPack, priceInr: packPrice });
    }
  };

  const handleVerify = async () => {
    const success = await verifyAndConfirmPayment(utrInput);
    if (success && currentDesign && onDesignActivated) {
      // Allow user to click start designing
    }
  };

  const handleStartDesigningAfterUnlock = () => {
    closeUnlockModal();
    if (currentDesign && onDesignActivated) {
      onDesignActivated(currentDesign.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#040E0A] border border-[rgba(16,185,129,0.3)] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#071913] via-[#0B251C] to-[#071913] border-b border-[rgba(16,185,129,0.2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/50 flex items-center justify-center text-[#F59E0B] shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#F59E0B] uppercase px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                  PREMIUM MECHANICAL DESIGN
                </span>
                {currentDesign?.standard && (
                  <span className="text-[10px] font-mono text-[#8CA89E]">
                    {currentDesign.standard}
                  </span>
                )}
              </div>
              <h3 className="text-base font-mono font-bold text-[#F0FDF4] mt-0.5">
                {currentDesign?.name || 'Unlock Mechanical Design'}
              </h3>
            </div>
          </div>

          <button
            onClick={closeUnlockModal}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {paymentState === 'PAYMENT_SUCCESS' ? (
            /* ==================================================
               SUCCESS CONFIRMATION SCREEN
               ================================================== */
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-[#00F5A0]/20 border-2 border-[#00F5A0] flex items-center justify-center text-[#00F5A0] shadow-[0_0_30px_rgba(0,245,160,0.4)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#00F5A0] uppercase tracking-widest">
                  TRANSACTION VERIFIED & ACTIVATED
                </span>
                <h4 className="text-xl font-mono font-bold text-[#F0FDF4] mt-1">
                  Access Granted: {activeTargetTitle}
                </h4>
                <p className="text-xs text-[#8CA89E] max-w-md mx-auto mt-2 leading-relaxed">
                  Your payment has been successfully recorded. All parametric sliders, 3D CAD
                  generators, FEA stress algorithms, and assembly capabilities are now fully unlocked!
                </p>
              </div>

              <div className="w-full max-w-md bg-[#0B1E17] border border-[rgba(16,185,129,0.3)] rounded-xl p-3.5 flex items-center justify-between text-xs font-mono text-[#8CA89E]">
                <span>Status:</span>
                <span className="text-[#00F5A0] font-bold">✓ UNLOCKED & ACTIVE</span>
              </div>

              <button
                id="btn-start-designing-post-payment"
                onClick={handleStartDesigningAfterUnlock}
                className="w-full max-w-md py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] hover:brightness-110 text-[#02140D] font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,245,160,0.3)] transition-all active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>START DESIGNING NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : paymentState === 'PAYMENT_PENDING' || paymentState === 'PAYMENT_VERIFYING' ? (
            /* ==================================================
               REAL UPI PAYMENT GATEWAY / QR SCREEN
               ================================================== */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#0B1E17] p-3 rounded-xl border border-[rgba(16,185,129,0.2)]">
                <div>
                  <span className="text-[10px] font-mono text-[#8CA89E] uppercase">Unlocking</span>
                  <div className="text-xs font-mono font-bold text-[#F0FDF4]">{activeTargetTitle}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#8CA89E] uppercase">Amount</span>
                  <div className="text-base font-mono font-bold text-[#00F5A0]">₹{activePrice.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Dynamic QR Code Box */}
                <div className="flex flex-col items-center justify-center p-4 bg-[#07130F] border border-[rgba(16,185,129,0.2)] rounded-xl text-center">
                  <div className="p-3 bg-white rounded-xl shadow-lg mb-2.5">
                    {/* High Precision SVG QR Generator pattern */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        upiDeepLink
                      )}&color=05140E&bgcolor=FFFFFF&margin=2`}
                      alt="UPI QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#8CA89E]">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM
                  </span>

                  {/* Direct Mobile UPI Link Button */}
                  <a
                    href={upiDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-[#102B21] hover:bg-[#153A2C] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay via UPI App Directly</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                  </a>
                </div>

                {/* Right: Manual UPI Details & Reference Form */}
                <div className="flex flex-col justify-between space-y-3 bg-[#07130F] border border-[rgba(16,185,129,0.2)] p-4 rounded-xl">
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-mono text-[#8CA89E]">Payee UPI ID:</span>
                      <div className="flex items-center justify-between bg-[#040E0A] px-2.5 py-1.5 rounded-lg border border-[rgba(16,185,129,0.2)] mt-0.5">
                        <span className="text-xs font-mono text-[#F0FDF4] select-all">{UPI_ID}</span>
                        <button
                          onClick={handleCopyUpi}
                          className="text-[10px] font-mono text-[#00F5A0] hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedUpi ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#8CA89E]">Payee Name:</span>
                      <div className="text-xs font-mono text-[#F0FDF4] bg-[#040E0A] px-2.5 py-1.5 rounded-lg border border-[rgba(16,185,129,0.2)] mt-0.5">
                        {FOUNDER_NAME}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#00F5A0] font-bold block">
                        Enter 12-Digit UPI Ref / UTR / Transaction ID:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 423589987654 or GPay Ref"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        className="w-full mt-1 bg-[#040E0A] border border-[rgba(16,185,129,0.4)] focus:border-[#00F5A0] rounded-lg px-3 py-2 text-xs font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] outline-none"
                      />
                    </div>
                  </div>

                  {paymentErrorMessage && (
                    <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 text-[10px] font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{paymentErrorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <button
                      id="btn-confirm-payment-utr"
                      disabled={paymentState === 'PAYMENT_VERIFYING'}
                      onClick={handleVerify}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] hover:brightness-110 text-[#02140D] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {paymentState === 'PAYMENT_VERIFYING' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>VERIFYING WITH BANK GATEWAY...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>CONFIRM & UNLOCK DESIGN</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetPaymentState}
                      className="w-full py-1.5 text-center text-[10px] font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-colors"
                    >
                      ← Back to Unlock Options
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================================================
               OPTION SELECTION SCREEN
               ================================================== */
            <div className="space-y-4">
              <p className="text-xs text-[#8CA89E] leading-relaxed">
                This advanced mechanical model contains proprietary parametric solvers, multi-body kinematics,
                and high-precision engineering algorithms. Choose an unlock option below:
              </p>

              {/* Option Cards Grid */}
              <div className="space-y-3">
                {/* Option A: Single Design */}
                {currentDesign && (
                  <div
                    onClick={() => setSelectedOption('single')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedOption === 'single'
                        ? 'bg-[#0B1E17] border-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.15)]'
                        : 'bg-[#07130F] border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="unlockOption"
                        checked={selectedOption === 'single'}
                        onChange={() => setSelectedOption('single')}
                        className="accent-[#00F5A0] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#F0FDF4]">
                            Unlock Individual Design
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
                            Single Model
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8CA89E] mt-0.5">
                          Permanent lifetime access to {currentDesign.name} with all parametric and 3D export tools.
                        </p>
                      </div>
                    </div>
                    <div className="text-right pl-3">
                      <span className="text-base font-mono font-bold text-[#00F5A0]">₹{singlePrice}</span>
                      <span className="block text-[9px] font-mono text-[#8CA89E]">One-time</span>
                    </div>
                  </div>
                )}

                {/* Option B: Design Pack */}
                {containingPack && (
                  <div
                    onClick={() => setSelectedOption('pack')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedOption === 'pack'
                        ? 'bg-[#0B1E17] border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-[#07130F] border-[rgba(16,185,129,0.2)] hover:border-[#F59E0B]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="unlockOption"
                        checked={selectedOption === 'pack'}
                        onChange={() => setSelectedOption('pack')}
                        className="accent-[#F59E0B] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#F0FDF4]">
                            Buy Design Pack: {containingPack.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 font-bold">
                            Save 60%
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8CA89E] mt-0.5">
                          Unlocks all {containingPack.designIds.length} models in this category bundle at once.
                        </p>
                      </div>
                    </div>
                    <div className="text-right pl-3">
                      <span className="text-base font-mono font-bold text-[#F59E0B]">₹{packPrice}</span>
                      <span className="block text-[9px] font-mono text-[#8CA89E]">One-time</span>
                    </div>
                  </div>
                )}

                {/* Option C: CADVANTA PRO Subscription */}
                <div
                  onClick={() => setSelectedOption('pro')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedOption === 'pro'
                      ? 'bg-[#0B1E17] border-[#00D9FF] shadow-[0_0_25px_rgba(0,217,255,0.2)]'
                      : 'bg-[#07130F] border-[rgba(16,185,129,0.2)] hover:border-[#00D9FF]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="unlockOption"
                      checked={selectedOption === 'pro'}
                      onChange={() => setSelectedOption('pro')}
                      className="accent-[#00D9FF] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#F0FDF4]">
                          CADVANTA PRO All-Access Pass
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/50 font-bold">
                          BEST VALUE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8CA89E] mt-0.5">
                        Instant access to all 60+ designs, ViraBot AI, multi-part assembly engine, and STEP exports.
                      </p>
                    </div>
                  </div>
                  <div className="text-right pl-3">
                    <span className="text-base font-mono font-bold text-[#00D9FF]">₹{proPrice}</span>
                    <span className="block text-[9px] font-mono text-[#8CA89E]">UPI One-Time</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[rgba(16,185,129,0.1)] flex items-center justify-end gap-3">
                <button
                  onClick={closeUnlockModal}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#07130F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-proceed-to-payment"
                  onClick={handleProceedToPayment}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] hover:brightness-110 text-[#02140D] font-mono font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <span>Proceed to Unlock (₹{activePrice.toFixed(2)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
