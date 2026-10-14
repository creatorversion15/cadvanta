import React from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Star,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  PlusCircle,
  Shield,
  FileCode2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DesignRegistryItem } from '../../data/designRegistry';
import { useDesignAccess } from '../../context/DesignAccessContext';
import { useAuth } from '../../context/AuthContext';

interface DesignCardProps {
  design: DesignRegistryItem;
  onSelect: (design: DesignRegistryItem) => void;
  onAddToAssembly?: (design: DesignRegistryItem) => void;
}

export const DesignCard: React.FC<DesignCardProps> = React.memo(({ design, onSelect, onAddToAssembly }) => {
  const {
    getDesignAccessStatus,
    favoriteDesignIds,
    toggleFavorite,
    openDesignDetails,
    openUnlockModal,
  } = useDesignAccess();
  const { requireAuth } = useAuth();

  const accessStatus = getDesignAccessStatus(design.id);
  const isLocked = accessStatus === 'PREMIUM_LOCKED';
  const isFavorite = favoriteDesignIds.includes(design.id);

  // Difficulty badge colors
  const difficultyColors: Record<string, string> = {
    Beginner: 'text-[#00F5A0] bg-[#00F5A0]/10 border-[#00F5A0]/30',
    Intermediate: 'text-[#00D9FF] bg-[#00D9FF]/10 border-[#00D9FF]/30',
    Advanced: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    Expert: 'text-[#EC4899] bg-[#EC4899]/10 border-[#EC4899]/30',
  };

  const handleCardAction = () => {
    if (isLocked) {
      requireAuth(
        () => {
          openUnlockModal({
            type: 'single',
            design,
            priceInr: design.priceInr || 99,
          });
        },
        {
          title: 'Sign in to Unlock Design',
          subtitle: `Sign in to access and unlock ${design.name} (₹${design.priceInr || 99}).`,
        }
      );
    } else {
      onSelect(design);
    }
  };

  const handleAddToAssembly = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) {
      requireAuth(
        () => {
          openUnlockModal({
            type: 'single',
            design,
            priceInr: design.priceInr || 99,
          });
        },
        {
          title: 'Sign in to Unlock Design',
          subtitle: `Sign in to access and unlock ${design.name} (₹${design.priceInr || 99}).`,
        }
      );
      return;
    }
    if (onAddToAssembly) {
      onAddToAssembly(design);
    }
  };

  return (
    <motion.div
      id={`design-card-${design.id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col bg-[#07130F] rounded-xl border transition-colors duration-300 overflow-hidden ${
        isLocked
          ? 'border-[rgba(245,158,11,0.2)] hover:border-[#F59E0B]/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
          : 'border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0] hover:shadow-[0_0_25px_rgba(0,245,160,0.15)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* Top Banner / Category & Access Pill */}
      <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between gap-2 border-b border-[rgba(16,185,129,0.08)] bg-[#0B1E17]/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8CA89E] truncate">
            {design.category}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          id={`btn-fav-${design.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(design.id);
          }}
          className="p-1 rounded-md text-[#8CA89E] hover:text-[#F59E0B] hover:bg-[#102B21] transition-colors"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              isFavorite ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#8CA89E]'
            }`}
          />
        </button>
      </div>

      {/* Preview Graphic / Engineering Schematic Icon Area */}
      <div
        onClick={() => openDesignDetails(design)}
        className="relative h-32 w-full bg-radial from-[#102B21]/70 to-[#050C0A] flex items-center justify-center cursor-pointer overflow-hidden p-3"
      >
        {/* Subtle Engineering Grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, #00F5A0 1px, transparent 1px), linear-gradient(to bottom, #00F5A0 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Access Status Corner Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {accessStatus === 'FREE' && (
            <span className="px-2 py-0.5 rounded-full bg-[#00F5A0]/15 border border-[#00F5A0]/40 text-[#00F5A0] text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> FREE
            </span>
          )}
          {accessStatus === 'PREMIUM_LOCKED' && (
            <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B] text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-sm">
              <Lock className="w-2.5 h-2.5 text-[#F59E0B]" /> 🔒 PREMIUM • ₹{design.priceInr || 99}
            </span>
          )}
          {(accessStatus === 'PREMIUM_UNLOCKED' || accessStatus === 'SUBSCRIPTION_ACCESS') && (
            <span className="px-2 py-0.5 rounded-full bg-[#00D9FF]/20 border border-[#00D9FF]/50 text-[#00D9FF] text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-2.5 h-2.5" /> ✓ UNLOCKED
            </span>
          )}
        </div>

        {/* Standard reference badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-1.5 py-0.5 rounded bg-[#020A07]/80 border border-[rgba(16,185,129,0.2)] text-[#8CA89E] text-[9px] font-mono">
            {design.standard}
          </span>
        </div>

        {/* Isometric Engineering Graphic */}
        <div className="relative z-0 group-hover:scale-105 transition-transform duration-300 flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#102B21] to-[#040E0A] border border-[rgba(16,185,129,0.3)] flex items-center justify-center shadow-inner group-hover:border-[#00F5A0]/70">
            {isLocked ? (
              <Lock className="w-7 h-7 text-[#F59E0B] animate-pulse" />
            ) : (
              <Layers className="w-7 h-7 text-[#00F5A0]" />
            )}
          </div>
          <span className="mt-1.5 text-[10px] font-mono text-[#8CA89E]/90">
            {design.parametersMeta.length} Parameters
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Difficulty */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4
              onClick={() => openDesignDetails(design)}
              className="text-xs font-mono font-bold text-[#F0FDF4] group-hover:text-[#00F5A0] transition-colors line-clamp-1 cursor-pointer"
              title={design.name}
            >
              {design.name}
            </h4>
          </div>

          {/* Description */}
          <p className="text-[11px] font-sans text-[#8CA89E] line-clamp-2 leading-relaxed mb-3">
            {design.description}
          </p>

          {/* Key Specs tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                difficultyColors[design.difficulty] || difficultyColors.Beginner
              }`}
            >
              {design.difficulty}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0B1E17] border border-[rgba(16,185,129,0.15)] text-[#4E6B60]">
              {design.supportedMaterialIds.length} Materials
            </span>
            {design.packId && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#C084FC]">
                Pack Model
              </span>
            )}
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="pt-2.5 border-t border-[rgba(16,185,129,0.1)] flex items-center gap-1.5 sm:gap-2">
          {/* Details button */}
          <button
            id={`btn-details-${design.id}`}
            onClick={() => openDesignDetails(design)}
            className="flex-1 min-h-[38px] sm:min-h-[32px] py-1.5 px-2 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/40 text-[#8CA89E] hover:text-[#F0FDF4] text-[11px] sm:text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Inspect 3D specs, formulas & BOM"
          >
            <Info className="w-3.5 h-3.5" />
            <span>DETAILS</span>
          </button>

          {/* Main Action Button (Unlock or Start Designing) */}
          {isLocked ? (
            <button
              id={`btn-unlock-${design.id}`}
              onClick={handleCardAction}
              className="flex-1 min-h-[38px] sm:min-h-[32px] py-1.5 px-2 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-110 text-[#07130F] text-[11px] sm:text-[10px] font-mono font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>UNLOCK (₹{design.priceInr || 99})</span>
            </button>
          ) : (
            <button
              id={`btn-open-${design.id}`}
              onClick={handleCardAction}
              className="flex-1 min-h-[38px] sm:min-h-[32px] py-1.5 px-2 rounded-lg bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] hover:brightness-110 text-[#02140D] text-[11px] sm:text-[10px] font-mono font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>DESIGN</span>
            </button>
          )}

          {/* Add to assembly button */}
          {onAddToAssembly && (
            <button
              id={`btn-add-assembly-${design.id}`}
              onClick={handleAddToAssembly}
              className={`min-w-[38px] min-h-[38px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center p-1.5 rounded-lg border text-xs transition-all cursor-pointer shrink-0 ${
                isLocked
                  ? 'bg-[#0B1E17] border-[rgba(245,158,11,0.3)] text-[#F59E0B] hover:bg-[#F59E0B]/20'
                  : 'bg-[#0B1E17] border-[rgba(16,185,129,0.3)] text-[#00F5A0] hover:bg-[#00F5A0]/20'
              }`}
              title={
                isLocked
                  ? '🔒 Unlock this design to add it to your assembly'
                  : 'Add this design component to current assembly project'
              }
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
