import React from 'react';
import {
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Layers,
  Sliders,
  Cpu,
  Calculator,
  ListOrdered,
  PlusCircle,
  FileCode2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { DesignRegistryItem } from '../../data/designRegistry';
import { useDesignAccess } from '../../context/DesignAccessContext';
import { getMaterialById } from '../../materials/materialsDatabase';

interface DesignDetailsModalProps {
  onSelectDesign: (design: DesignRegistryItem) => void;
  onAddToAssembly?: (design: DesignRegistryItem) => void;
}

export const DesignDetailsModal: React.FC<DesignDetailsModalProps> = ({
  onSelectDesign,
  onAddToAssembly,
}) => {
  const {
    detailsModalOpen,
    selectedDesignForDetails: design,
    closeDesignDetails,
    getDesignAccessStatus,
    openUnlockModal,
  } = useDesignAccess();

  if (!detailsModalOpen || !design) return null;

  const accessStatus = getDesignAccessStatus(design.id);
  const isLocked = accessStatus === 'PREMIUM_LOCKED';

  const handleStartDesigning = () => {
    closeDesignDetails();
    onSelectDesign(design);
  };

  const handleUnlockClick = () => {
    closeDesignDetails();
    openUnlockModal({
      type: 'single',
      design,
      priceInr: design.priceInr || 99,
    });
  };

  const handleAddToAssemblyClick = () => {
    if (isLocked) {
      closeDesignDetails();
      openUnlockModal({
        type: 'single',
        design,
        priceInr: design.priceInr || 99,
      });
      return;
    }
    if (onAddToAssembly) {
      closeDesignDetails();
      onAddToAssembly(design);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#040E0A] border border-[rgba(16,185,129,0.3)] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#071913] via-[#0B251C] to-[#071913] border-b border-[rgba(16,185,129,0.2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8CA89E]">
                  {design.category}
                </span>
                <span className="text-[10px] font-mono text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-0.5 rounded border border-[#00F5A0]/20">
                  {design.standard}
                </span>
              </div>
              <h2 className="text-lg font-mono font-bold text-[#F0FDF4] mt-0.5">{design.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Lock Status Pill */}
            {accessStatus === 'FREE' && (
              <span className="px-2.5 py-1 rounded-full bg-[#00F5A0]/15 border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> FREE DESIGN
              </span>
            )}
            {accessStatus === 'PREMIUM_LOCKED' && (
              <span className="px-2.5 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-mono font-bold flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> 🔒 PREMIUM • ₹{design.priceInr || 99}
              </span>
            )}
            {(accessStatus === 'PREMIUM_UNLOCKED' || accessStatus === 'SUBSCRIPTION_ACCESS') && (
              <span className="px-2.5 py-1 rounded-full bg-[#00D9FF]/20 border border-[#00D9FF]/50 text-[#00D9FF] text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> ✓ UNLOCKED
              </span>
            )}

            <button
              onClick={closeDesignDetails}
              className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Top Overview: 3D Schematic & Core Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 3D Schematic Preview Visualizer */}
            <div className="md:col-span-1 bg-[#07130F] rounded-xl border border-[rgba(16,185,129,0.2)] p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #00F5A0 1px, transparent 1px), linear-gradient(to bottom, #00F5A0 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-[#102B21] to-[#040E0A] border border-[#00F5A0]/40 flex items-center justify-center shadow-lg">
                {isLocked ? (
                  <Lock className="w-12 h-12 text-[#F59E0B] animate-pulse" />
                ) : (
                  <Layers className="w-12 h-12 text-[#00F5A0]" />
                )}
              </div>
              <span className="relative z-10 mt-3 text-xs font-mono font-bold text-[#F0FDF4]">
                {design.shortName}
              </span>
              <span className="relative z-10 text-[10px] font-mono text-[#8CA89E]">
                Difficulty: {design.difficulty}
              </span>
            </div>

            {/* Right: Technical Summary & Applications */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#00F5A0] font-bold mb-1">
                  Design Overview
                </h4>
                <p className="text-xs text-[#8CA89E] leading-relaxed">{design.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#00D9FF] font-bold mb-1.5">
                  Industry Applications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {design.applications.map((app, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#0B1E17] border border-[rgba(16,185,129,0.2)] text-[#8CA89E] text-xs font-mono"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Engineering Parameters Schema */}
          <div className="bg-[#07130F] rounded-xl border border-[rgba(16,185,129,0.2)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-[#00F5A0]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#F0FDF4] font-bold">
                Parametric Dimensions & Engineering Tolerances
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {design.parametersMeta.map((p) => (
                <div
                  key={p.key}
                  className="bg-[#040E0A] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#F0FDF4] font-bold">{p.label}</span>
                      <span className="text-[#00F5A0]">
                        {p.defaultValue} {p.unit || ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8CA89E] mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  {p.min !== undefined && p.max !== undefined && (
                    <div className="mt-2 text-[9px] font-mono text-[#4E6B60] flex items-center justify-between border-t border-[rgba(16,185,129,0.1)] pt-1">
                      <span>Min: {p.min}</span>
                      <span>Max: {p.max}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Key Engineering Formulas & Equations */}
          {design.keyFormulas && design.keyFormulas.length > 0 && (
            <div className="bg-[#07130F] rounded-xl border border-[rgba(16,185,129,0.2)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-[#00D9FF]" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#F0FDF4] font-bold">
                  Governing Mechanical & Stress Equations
                </h4>
              </div>

              <div className="space-y-2">
                {design.keyFormulas.map((formula, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#040E0A] border border-[rgba(0,217,255,0.2)] text-xs font-mono text-[#00D9FF] flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{formula}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Supported Materials */}
          <div className="bg-[#07130F] rounded-xl border border-[rgba(16,185,129,0.2)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#F59E0B]" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#F0FDF4] font-bold">
                Supported High-Performance Engineering Materials
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {design.supportedMaterialIds.map((matId) => {
                const mat = getMaterialById(matId);
                return (
                  <div
                    key={matId}
                    className="p-2.5 rounded-lg bg-[#040E0A] border border-[rgba(16,185,129,0.15)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: mat.color }}
                        />
                        <span className="text-xs font-mono font-bold text-[#F0FDF4] truncate">
                          {mat.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8CA89E]">{mat.standard}</span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-[#00F5A0]">
                      Yield: {mat.yieldStrength} MPa
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Bill of Materials (BOM) */}
          {design.bom && design.bom.length > 0 && (
            <div className="bg-[#07130F] rounded-xl border border-[rgba(16,185,129,0.2)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ListOrdered className="w-4 h-4 text-[#A855F7]" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#F0FDF4] font-bold">
                  Bill of Materials (BOM) & Manufacturing Notes
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[rgba(16,185,129,0.2)] text-[#8CA89E]">
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3">Manufacturing Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(16,185,129,0.1)] text-[#F0FDF4]">
                    {design.bom.map((b, idx) => (
                      <tr key={idx} className="hover:bg-[#0B1E17]/40">
                        <td className="py-2 px-3 font-bold">{b.item}</td>
                        <td className="py-2 px-3 text-[#00F5A0]">{b.qty}</td>
                        <td className="py-2 px-3 text-[#8CA89E]">{b.material}</td>
                        <td className="py-2 px-3 text-[#8CA89E] text-[11px]">{b.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Strip */}
        <div className="px-6 py-4 bg-[#071913] border-t border-[rgba(16,185,129,0.2)] flex items-center justify-between gap-4">
          <button
            onClick={closeDesignDetails}
            className="px-4 py-2.5 rounded-xl border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {/* Add to assembly button */}
            {onAddToAssembly && (
              <button
                id="btn-modal-add-to-assembly"
                onClick={handleAddToAssemblyClick}
                className="py-2.5 px-4 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95"
                title="Add this component directly into your multi-part assembly"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add to Assembly</span>
              </button>
            )}

            {/* Primary Action Button */}
            {isLocked ? (
              <button
                id="btn-modal-unlock-design"
                onClick={handleUnlockClick}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-110 text-[#07130F] text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>UNLOCK DESIGN (₹{design.priceInr || 99})</span>
              </button>
            ) : (
              <button
                id="btn-modal-start-designing"
                onClick={handleStartDesigning}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] hover:brightness-110 text-[#02140D] text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <FileCode2 className="w-4 h-4" />
                <span>START DESIGNING</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
