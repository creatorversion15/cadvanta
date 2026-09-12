import React, { useState } from 'react';
import { CADPart } from '../../types/cad';
import {
  Sparkles,
  X,
  Play,
  Cpu,
  Layers,
  ShieldCheck,
  Scale,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import {
  solveGenerativeDesign,
  GenerativeDesignInputs,
  GenerativeCandidate,
  GenerativeSolveResult,
} from '../../engine/generativeDesignEngine';

interface GenerativeDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CADPart;
  onApplyCandidate?: (candidate: GenerativeCandidate) => void;
}

export const GenerativeDesignModal: React.FC<GenerativeDesignModalProps> = ({
  isOpen,
  onClose,
  part,
  onApplyCandidate,
}) => {
  const [targetMassReduction, setTargetMassReduction] = useState<number>(40);
  const [selectedProcess, setSelectedProcess] = useState<GenerativeDesignInputs['manufacturingProcess']>('additive_sls');
  const [minWallThickness, setMinWallThickness] = useState<number>(2.5);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solveResult, setSolveResult] = useState<GenerativeSolveResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('gen_cand_1');

  if (!isOpen) return null;

  const handleRunGenerativeSolve = () => {
    setIsSolving(true);
    setTimeout(() => {
      const inputs: GenerativeDesignInputs = {
        material: part.material,
        targetMassReductionPct: targetMassReduction,
        manufacturingProcess: selectedProcess,
        minWallThicknessMm: minWallThickness,
        maxStressThresholdMPa: Math.round((part.material.yieldStrength || 400) * 0.7),
        overhangAngleDeg: 45,
        loadCases: [
          { name: 'Primary Operating Load (Radial 8.5 kN)', magnitudeN: 8500, direction: [0, -1, 0], location: 'Bearing Bore' },
          { name: 'Torque Reversal (120 N·m)', magnitudeN: 2400, direction: [1, 0, 0], location: 'Drive Flange' },
        ],
        preserveZones: [
          { id: 'pz_1', name: 'Mounting Bolt Bosses (x4 M10)', radiusMm: 12, center: [0, 0, 0] },
          { id: 'pz_2', name: 'Shaft Journal Bearing Ring', radiusMm: 25, center: [0, 0, 80] },
        ],
        obstacleKeepOutZones: [
          { id: 'kz_1', name: 'Rotating Rotor Clearance Envelope', dimensions: [60, 60, 100], center: [0, 0, 40] },
        ],
      };

      const res = solveGenerativeDesign(part, inputs);
      setSolveResult(res);
      setIsSolving(false);
    }, 600);
  };

  const currentCandidate = solveResult?.candidates.find((c) => c.id === selectedCandidateId) || solveResult?.candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071510] border border-[rgba(16,185,129,0.3)] rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-[#F0FDF4]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[rgba(16,185,129,0.2)] bg-[#040E0A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono tracking-wide text-[#F0FDF4] flex items-center gap-2">
                <span>VIRA Generative Topology Optimizer</span>
                <span className="text-[10px] bg-[#102B21] text-[#00F5A0] px-2 py-0.5 rounded-full border border-[#00F5A0]/30 uppercase font-bold">
                  SIMP FEA KERNEL
                </span>
              </h1>
              <p className="text-xs text-[#8CA89E] font-sans">
                Algorithmic material redistribution for target mass reduction while enforcing manufacturing constraints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Settings Column (4 cols) */}
          <div className="md:col-span-4 p-4 border-r border-[rgba(16,185,129,0.18)] bg-[#040E0A]/60 flex flex-col gap-4 overflow-y-auto font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#8CA89E]">Active Base Part</span>
              <div className="text-sm font-bold text-[#00F5A0]">{part.name}</div>
              <div className="text-[11px] text-[#8CA89E]">{part.material.name} ({part.material.standard})</div>
            </div>

            {/* Target Mass Reduction Slider */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#071510] border border-[rgba(16,185,129,0.15)]">
              <div className="flex justify-between items-center">
                <span className="text-[#8CA89E]">Target Mass Reduction:</span>
                <span className="text-[#00F5A0] font-bold">-{targetMassReduction}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={70}
                step={5}
                value={targetMassReduction}
                onChange={(e) => setTargetMassReduction(parseInt(e.target.value))}
                className="w-full accent-[#00F5A0] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8CA89E]">
                <span>-15% (Conservative)</span>
                <span>-40%</span>
                <span>-70% (Ultra-Light)</span>
              </div>
            </div>

            {/* Manufacturing Constraint Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#8CA89E]">
                Manufacturing Process
              </label>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value as any)}
                className="w-full bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-lg p-2 text-xs text-[#F0FDF4] outline-none"
              >
                <option value="additive_sls">Additive Manufacturing (DMLS / SLM 3D Metal)</option>
                <option value="cnc_3axis">Subtractive CNC Milling (3-Axis Zero Undercut)</option>
                <option value="casting_die">High-Pressure Die Casting (A380 Aluminum)</option>
                <option value="sheet_metal">Sheet Metal Stamping & Folding</option>
              </select>
            </div>

            {/* Minimum Wall Thickness */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8CA89E]">Min Wall Thickness:</span>
                <span className="text-[#00F5A0] font-bold">{minWallThickness} mm</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={6.0}
                step={0.2}
                value={minWallThickness}
                onChange={(e) => setMinWallThickness(parseFloat(e.target.value))}
                className="w-full accent-[#00F5A0] cursor-pointer"
              />
            </div>

            {/* Preserve & Keep-out Zones Summary */}
            <div className="p-3 bg-[#071510] rounded-lg border border-[rgba(16,185,129,0.15)] space-y-2 text-[11px]">
              <div className="text-[#00F5A0] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Boundary Protection Zones</span>
              </div>
              <div className="space-y-1 text-[10px] text-[#8CA89E]">
                <div className="flex items-center justify-between">
                  <span>Preserve (Keep-in):</span>
                  <span className="text-[#00F5A0] font-bold">2 Feature Bosses</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Keep-out (Clearance):</span>
                  <span className="text-amber-400 font-bold">1 Rotor Envelope</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>FEA Load Cases:</span>
                  <span className="text-[#F0FDF4] font-bold">2 Multi-Axial Cases</span>
                </div>
              </div>
            </div>

            {/* Run Solve Button */}
            <button
              onClick={handleRunGenerativeSolve}
              disabled={isSolving}
              className="mt-auto w-full py-2.5 px-4 rounded-xl bg-[#00F5A0] hover:bg-[#00D68C] text-[#030A07] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,245,160,0.35)] cursor-pointer transition-all disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#030A07]" />
                  <span>Iterating SIMP Topology (20 steps)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Synthesize Generative Candidates</span>
                </>
              )}
            </button>
          </div>

          {/* Right Results Column (8 cols) */}
          <div className="md:col-span-8 p-4 flex flex-col gap-4 overflow-y-auto bg-[#071510]">
            {!solveResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[rgba(16,185,129,0.2)] rounded-xl bg-[#040E0A]/40">
                <Sparkles className="w-12 h-12 text-[#00F5A0]/40 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold font-mono text-[#F0FDF4] mb-1">
                  Generative Design Workspace Ready
                </h3>
                <p className="text-xs text-[#8CA89E] max-w-md font-sans mb-4">
                  Configure mass target and manufacturing process on the left, then click "Synthesize Generative Candidates" to run the topology solver.
                </p>
                <button
                  onClick={handleRunGenerativeSolve}
                  className="px-4 py-2 rounded-lg bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-bold hover:bg-[#00F5A0] hover:text-[#030A07] transition-all cursor-pointer"
                >
                  Generate Initial 3 Candidates
                </button>
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                {/* 3 Generated Candidates Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {solveResult.candidates.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedCandidateId === cand.id
                          ? 'bg-[#102B21] border-[#00F5A0] shadow-[0_0_16px_rgba(0,245,160,0.25)]'
                          : 'bg-[#040E0A] hover:bg-[#0B1E17] border-[rgba(16,185,129,0.18)]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cand.previewColor }}
                          />
                          <span className="text-[10px] text-[#00F5A0] font-bold bg-[#071510] px-1.5 py-0.5 rounded border border-[#00F5A0]/30">
                            FoS: {cand.factorOfSafety}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#F0FDF4] leading-snug">
                          {cand.name}
                        </h4>
                        <div className="text-[10px] text-[#8CA89E] font-sans line-clamp-2">
                          {cand.description}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[rgba(16,185,129,0.15)] flex justify-between items-center text-[11px]">
                        <span className="text-[#8CA89E]">Mass:</span>
                        <span className="text-[#00F5A0] font-bold">
                          {cand.massGrams} g ({cand.massReductionPct > 0 ? `-${cand.massReductionPct}%` : '0%'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Candidate Breakdown */}
                {currentCandidate && (
                  <div className="p-4 bg-[#040E0A] rounded-xl border border-[rgba(16,185,129,0.25)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#00F5A0]" />
                        <h3 className="text-sm font-bold text-[#F0FDF4]">
                          {currentCandidate.name} — Technical Performance
                        </h3>
                      </div>
                      <span className="text-[10px] text-[#8CA89E]">
                        Solver Duration: {solveResult.solvingDurationSec}s (20 SIMP passes)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-[#071510] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)]">
                        <span className="text-[10px] text-[#8CA89E] block">Predicted Mass</span>
                        <strong className="text-sm text-[#00F5A0]">{currentCandidate.massGrams} g</strong>
                        <span className="text-[10px] text-[#8CA89E] block">({currentCandidate.massReductionPct}% saving)</span>
                      </div>
                      <div className="bg-[#071510] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)]">
                        <span className="text-[10px] text-[#8CA89E] block">Peak Stress (FEA)</span>
                        <strong className="text-sm text-[#F0FDF4]">{currentCandidate.peakStressMPa} MPa</strong>
                        <span className="text-[10px] text-[#8CA89E] block">Allowable: 400 MPa</span>
                      </div>
                      <div className="bg-[#071510] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)]">
                        <span className="text-[10px] text-[#8CA89E] block">Safety Factor</span>
                        <strong className="text-sm text-[#00F5A0]">{currentCandidate.factorOfSafety} FoS</strong>
                        <span className="text-[10px] text-[#8CA89E] block">Elastic Linear</span>
                      </div>
                      <div className="bg-[#071510] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)]">
                        <span className="text-[10px] text-[#8CA89E] block">Printability / DFM</span>
                        <strong className="text-sm text-[#00F5A0]">{currentCandidate.printabilityScore}/100</strong>
                        <span className="text-[10px] text-[#8CA89E] block">{currentCandidate.recommendedProcess.split(' ')[0]}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0B1E17] rounded-lg border border-[rgba(16,185,129,0.2)] text-xs font-sans text-[#8CA89E]">
                      <strong className="text-[#00F5A0] block font-mono mb-1">Process Manufacturing Note:</strong>
                      {currentCandidate.recommendedProcess}: {currentCandidate.description}
                    </div>

                    {/* Apply to CAD Workspace */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-[#071510] border border-[rgba(16,185,129,0.2)] text-[#8CA89E] text-xs hover:text-[#F0FDF4] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (onApplyCandidate) onApplyCandidate(currentCandidate);
                          onClose();
                        }}
                        className="px-5 py-2 rounded-lg bg-[#00F5A0] hover:bg-[#00D68C] text-[#030A07] text-xs font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(0,245,160,0.3)] cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Apply Generative Topology to Model</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
