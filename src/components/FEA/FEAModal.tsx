import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { CADPart, MaterialInfo } from '../../types/cad';
import {
  FEASimulationInputs,
  LoadDirection,
  ConstraintAnchor,
  solvePartFEA,
} from '../../engine/feaEngine';
import {
  X,
  Activity,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Sparkles,
  Layers,
  ArrowDownRight,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import {
  generateEngineeringChecksPDF,
  generateEngineeringSummaryReportPDF,
} from '../../engine/pdfReportGenerator';

interface FEAModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CADPart;
  onApplyFEAModel?: (feaGroup: THREE.Group) => void;
  onOpenSummaryModal?: () => void;
}

export const FEAModal: React.FC<FEAModalProps> = ({
  isOpen,
  onClose,
  part,
  onApplyFEAModel,
  onOpenSummaryModal,
}) => {
  const [loadForceN, setLoadForceN] = useState<number>(4500); // 4.5 kN
  const [loadDir, setLoadDir] = useState<LoadDirection>('Y');
  const [anchor, setAnchor] = useState<ConstraintAnchor>('left_face');
  const [ampFactor, setAmpFactor] = useState<number>(10); // 10x visual deflection

  // Material setup
  const [currentMaterial, setCurrentMaterial] = useState<MaterialInfo>(
    part.material || {
      id: 'en8_steel',
      name: 'AISI 1045 / EN8 Carbon Steel',
      standard: 'ISO 683-1',
      category: 'Ferrous',
      density: 7.85,
      youngsModulus: 205, // GPa
      yieldStrength: 465, // MPa
      tensileStrength: 650,
      poissonsRatio: 0.29,
      thermalExpansion: 11.5,
      thermalConductivity: 45,
      machinabilityRating: 70,
      costPerKg: 120,
      color: '#94a3b8',
      roughness: 0.3,
      metalness: 0.85,
      description: 'Standard medium carbon machinery steel',
    }
  );

  const feaInputs: FEASimulationInputs = useMemo(
    () => ({
      material: currentMaterial,
      forceMagnitudeN: loadForceN,
      loadDirection: loadDir,
      constraintAnchor: anchor,
      meshRefinement: 'standard',
      amplificationFactor: ampFactor,
    }),
    [currentMaterial, loadForceN, loadDir, anchor, ampFactor]
  );

  const { results, deformedGroup } = useMemo(
    () => solvePartFEA(part, feaInputs),
    [part, feaInputs]
  );

  if (!isOpen) return null;

  const handleApplyToScene = () => {
    if (onApplyFEAModel) {
      onApplyFEAModel(deformedGroup);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-gradient-to-b from-[#0A1D16] to-[#05110D] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col text-[#F0FDF4] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]">
              <Activity className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  FINITE ELEMENT ANALYSIS & SIMULATION
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  VON MISES STRESS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight">
                Static Stress & Deflection Solver: <span className="text-[#00F5A0]">{part.name}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Simulation Inputs & Constraints (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Applied Load Settings */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0]">
                  1. Applied Mechanical Load
                </span>
                <span className="text-xs font-mono text-[#8CA89E]">
                  {(loadForceN / 1000).toFixed(2)} kN
                </span>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">
                  Force Magnitude (Newtons)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="250"
                    value={loadForceN}
                    onChange={(e) => setLoadForceN(Number(e.target.value))}
                    className="flex-1 accent-[#00F5A0] h-1.5 bg-[#102B21] rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={loadForceN}
                    onChange={(e) => setLoadForceN(Number(e.target.value))}
                    className="w-24 h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#00F5A0] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">
                  Load Direction & Vector
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Y', 'X', 'Z', 'Torsion'] as LoadDirection[]).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setLoadDir(dir)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                        loadDir === dir
                          ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                          : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                      }`}
                    >
                      {dir === 'Torsion' ? 'Torque' : `${dir}-Axis`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Boundary Condition Constraints */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                2. Boundary Condition (Fixed Support)
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'left_face', label: 'Left Journal Face (Fixed Anchor)' },
                  { id: 'bottom_face', label: 'Bottom Flange Mounting Face' },
                  { id: 'bore_inner', label: 'Cylindrical Bore Press-Fit' },
                  { id: 'right_face', label: 'Opposite Shaft Shoulder' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAnchor(item.id as ConstraintAnchor)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                      anchor === item.id
                        ? 'bg-[#102B21] border-[#00F5A0] text-[#00F5A0] font-bold'
                        : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E] hover:text-[#F0FDF4]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Deflection Magnification */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#8CA89E]">
                  Deflection Amplification:
                </span>
                <span className="text-xs font-mono text-[#00F5A0] font-bold">{ampFactor}×</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 25, 50].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAmpFactor(f)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      ampFactor === f
                        ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                        : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                    }`}
                  >
                    {f}×
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#8CA89E] font-sans">
                Magnifies true elastic displacement vectors so physical bending and twisting curvature can be clearly observed.
              </p>
            </div>
          </div>

          {/* Right Column: FEA Numerical Results & Stress Spectrum (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Key FEA Metrics Card */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
              <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0]">
                  Simulation Output & Safety Margin
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    results.safetyStatus === 'Safe'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : results.safetyStatus === 'Marginal'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  Status: {results.safetyStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.2)]">
                  <span className="text-[10px] font-mono text-[#8CA89E] block">Max Von Mises Stress</span>
                  <span className="text-base font-mono font-bold text-red-400">
                    {results.maxVonMisesStressMPa} MPa
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.2)]">
                  <span className="text-[10px] font-mono text-[#8CA89E] block">Material Yield Strength</span>
                  <span className="text-base font-mono font-bold text-[#F0FDF4]">
                    {results.yieldStrengthMPa} MPa
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.2)]">
                  <span className="text-[10px] font-mono text-[#8CA89E] block">Factor of Safety (FoS)</span>
                  <span
                    className={`text-base font-mono font-bold ${
                      results.factorOfSafety >= 2.0
                        ? 'text-[#00F5A0]'
                        : results.factorOfSafety >= 1.0
                        ? 'text-amber-300'
                        : 'text-red-400'
                    }`}
                  >
                    {results.factorOfSafety}×
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.2)]">
                  <span className="text-[10px] font-mono text-[#8CA89E] block">Peak Deflection (δ)</span>
                  <span className="text-base font-mono font-bold text-[#00F5A0]">
                    {results.maxDisplacementMm} mm
                  </span>
                </div>
              </div>

              {/* Stress Rainbow Colormap Legend */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#8CA89E] block">
                  Stress Rainbow Gradient (Von Mises MPa)
                </span>
                <div className="h-3.5 rounded-full w-full bg-gradient-to-r from-blue-500 via-emerald-400 via-yellow-400 to-red-500 shadow-inner" />
                <div className="flex justify-between text-[10px] font-mono text-[#8CA89E]">
                  <span>0.0 MPa (Hydrostatic)</span>
                  <span>{(results.maxVonMisesStressMPa * 0.5).toFixed(0)} MPa</span>
                  <span className="text-red-400 font-bold">{results.maxVonMisesStressMPa} MPa (Peak)</span>
                </div>
              </div>
            </div>

            {/* DFM & Engineering Advice */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                Engineering Assessment & Recommendations
              </span>
              <ul className="space-y-1.5 text-xs text-[#8CA89E] font-sans">
                {results.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                id="btn-generate-pdf-fea-modal"
                type="button"
                onClick={() => {
                  generateEngineeringSummaryReportPDF(part, {
                    feaResults: results,
                    feaInputs,
                    downloadImmediately: true,
                  });
                }}
                className="flex-1 h-12 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                title="Download formal 3-page Engineering Summary Report with FEA, Material Costs & DFM"
              >
                <FileText className="w-4 h-4" />
                <span>Formal PDF Summary</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToScene}
                className="flex-1 h-12 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,160,0.3)] cursor-pointer active:scale-95"
              >
                <Activity className="w-4 h-4" />
                <span>Display 3D Stress</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
