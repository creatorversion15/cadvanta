import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Compass,
  Cpu,
  Layers,
  CircleDot,
  Hash,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Table,
  ChevronRight,
  Maximize2,
  FileSpreadsheet,
  Settings,
  Split,
  Box,
  RotateCw,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface AdvancedFunctionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteTool: (toolId: string, optionId?: string) => void;
  isSectionCutActive?: boolean;
  onToggleSectionCut?: () => void;
  onOpenTestSuiteModal?: () => void;
  activePart?: CADPart;
}

export type AdvancedSectionTab = 'mbd' | 'patterns' | 'fasteners' | 'evaluation';

export const AdvancedFunctionsDrawer: React.FC<AdvancedFunctionsDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteTool,
  isSectionCutActive = false,
  onToggleSectionCut = () => {},
  onOpenTestSuiteModal = () => {},
  activePart,
}) => {
  const [activeSection, setActiveSection] = useState<AdvancedSectionTab>('mbd');
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerTool = (toolId: string, optionId?: string, label?: string) => {
    onExecuteTool(toolId, optionId);
    setLastExecuted(label || toolId);
    setTimeout(() => setLastExecuted(null), 3500);
  };

  return (
    <div
      id="cadvanta-advanced-functions-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] sm:max-w-[480px] bg-white border-l border-[#CBD5E1] shadow-2xl flex flex-col font-sans text-[#0F172A] animate-in slide-in-from-right duration-250 select-none"
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] leading-tight">Advanced Engineering Tools</h3>
            <p className="text-[11px] text-[#64748B]">MBD, GD&T, Patterns, Fasteners & Simulation</p>
          </div>
        </div>

        <button
          onClick={onClose}
          id="btn-close-advanced-drawer"
          className="p-1.5 rounded-md hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          title="Close Advanced Tools Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Execution Feedback Notification */}
      {lastExecuted && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Executed: <strong>{lastExecuted}</strong></span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center px-3 pt-2 bg-[#F1F5F9] border-b border-[#E2E8F0] gap-1 overflow-x-auto no-scrollbar text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveSection('mbd')}
          className={`px-3 py-2 rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSection === 'mbd'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>MBD & GD&T</span>
        </button>

        <button
          onClick={() => setActiveSection('patterns')}
          className={`px-3 py-2 rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSection === 'patterns'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Patterns & Mirror</span>
        </button>

        <button
          onClick={() => setActiveSection('fasteners')}
          className={`px-3 py-2 rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSection === 'fasteners'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>Holes & Fasteners</span>
        </button>

        <button
          onClick={() => setActiveSection('evaluation')}
          className={`px-3 py-2 rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSection === 'evaluation'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Evaluation</span>
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ========================================================= */}
        {/* 1. MBD & GD&T STUDIO                                      */}
        {/* ========================================================= */}
        {activeSection === 'mbd' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#334155] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
                  Datum Reference Targets
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-[#0284C7] font-bold">
                  ASME Y14.41
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-3">
                Establish primary, secondary, and tertiary datum reference frames for concentric gear stages.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerTool('datum_targets', 'datum_a', 'Primary Datum [A] (Centerline Axis)')}
                  className="p-2 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-center text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <span className="block text-[10px] text-[#64748B]">Axis</span>
                  <span className="font-mono font-bold text-[#0284C7]">Datum [A]</span>
                </button>
                <button
                  onClick={() => triggerTool('datum_targets', 'datum_b', 'Secondary Datum [B] (Flange Face)')}
                  className="p-2 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-center text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <span className="block text-[10px] text-[#64748B]">Face</span>
                  <span className="font-mono font-bold text-[#0284C7]">Datum [B]</span>
                </button>
                <button
                  onClick={() => triggerTool('datum_targets', 'datum_c', 'Tertiary Datum [C] (Keyway)')}
                  className="p-2 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-center text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <span className="block text-[10px] text-[#64748B]">Clocking</span>
                  <span className="font-mono font-bold text-[#0284C7]">Datum [C]</span>
                </button>
              </div>
            </div>

            {/* Fit Tolerances & GD&T Callouts */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#334155] block">
                ISO 286 Fits & Geometric Tolerancing
              </span>

              <button
                onClick={() => triggerTool('tolerance_callouts', 'h7_H7', 'ISO h7 / H7 Precision Fits')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Shaft & Bore Fits: h7 / H7</div>
                  <div className="text-[11px] text-[#64748B]">Nominal clearance 0.08 mm for gear carrier pins</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  +0.015 / 0
                </span>
              </button>

              <button
                onClick={() => triggerTool('surface_roughness', 'ra_08', 'Ground Flank Finish Ra 0.8 µm')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Surface Finish Ra 0.8 µm</div>
                  <div className="text-[11px] text-[#64748B]">Precision ground involute tooth flanks</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                  Ra 0.8
                </span>
              </button>

              <button
                onClick={() => triggerTool('tolerance_callouts', 'runout', 'Total Radial Runout 0.008 mm')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Total Radial Runout 0.008 mm</div>
                  <div className="text-[11px] text-[#64748B]">Relative to central bearing datum [A-B]</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                  ↗ 0.008
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. PATTERNS & MIRROR STUDIO                               */}
        {/* ========================================================= */}
        {activeSection === 'patterns' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#334155] block">
                Planetary & Fastener Patterns
              </span>

              <button
                onClick={() => triggerTool('circular_pattern', '3x_120', 'Circular Pattern (3x Planets @ 120°)')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">3× Planets Array @ 120°</div>
                  <div className="text-[11px] text-[#64748B]">Equidistant planetary gear cluster on PCD 75 mm</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  3× @ 120°
                </span>
              </button>

              <button
                onClick={() => triggerTool('linear_fasteners_pattern', '12x_flange', '12× Flange Bolt Circle PCD Ø160 mm')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">12× Flange Bolt Circle</div>
                  <div className="text-[11px] text-[#64748B]">Equal angular spacing on PCD Ø160 mm</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  12× PCD 160
                </span>
              </button>

              <button
                onClick={() => triggerTool('housing_split_mirror', 'split_plane', 'Mirror Split Housing Halves')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Mirror Housing Halves</div>
                  <div className="text-[11px] text-[#64748B]">Symmetric split across central parting line</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Mirror XY
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. HOLES & FASTENERS ENGINEERING                          */}
        {/* ========================================================= */}
        {activeSection === 'fasteners' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#334155] block">
                Standard Bearing Seats & Retaining Features
              </span>

              <button
                onClick={() => triggerTool('skf_bearing_pocket', 'skf_6208', 'SKF 6208 Bearing Seat (Ø80 H7)')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">SKF 6208 Bearing Pocket</div>
                  <div className="text-[11px] text-[#64748B]">Bore Ø80 H7 with internal shoulder stop</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
                  Ø80 H7
                </span>
              </button>

              <button
                onClick={() => triggerTool('circlip_groove', 'din471', 'DIN 471 External Circlip Retaining Groove')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">DIN 471 Retaining Circlip Groove</div>
                  <div className="text-[11px] text-[#64748B]">Axial retention for shaft assemblies</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  DIN 471
                </span>
              </button>

              <button
                onClick={() => triggerTool('oil_seal_seat', 'nbr_45_65', 'Radial Oil Shaft Seal NBR (45×65×8 mm)')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Radial Oil Shaft Seal Pocket</div>
                  <div className="text-[11px] text-[#64748B]">NBR 45×65×8 mm IP66 rotary protection</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  45×65×8
                </span>
              </button>

              <button
                onClick={() => triggerTool('thread', 'm8_tap', 'Tapped ISO M8×1.25 Flange Threads')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">ISO 4762 M8 Bolt Tapping</div>
                  <div className="text-[11px] text-[#64748B]">Coarse thread pitch M8×1.25, Grade 10.9</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  M8×1.25
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. ADVANCED EVALUATION & SIMULATION                       */}
        {/* ========================================================= */}
        {activeSection === 'evaluation' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#334155] block">
                Physical Properties & Simulation Engines
              </span>

              <button
                onClick={() => triggerTool('mass_properties', undefined, 'Evaluated Mass Properties: 18.40 kg')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Calculate Assembly Mass Properties</div>
                  <div className="text-[11px] text-[#64748B]">Total Mass: 18.40 kg • CoG & Moments of Inertia</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  18.40 kg
                </span>
              </button>

              <button
                onClick={() => triggerTool('interference_detection', undefined, 'Kinematic Clash & Clearance Detection')}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">3D Clash & Interference Detection</div>
                  <div className="text-[11px] text-[#64748B]">Scans 24 component interfaces for mesh overlaps</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  0 Clashes
                </span>
              </button>

              <button
                onClick={() => onOpenTestSuiteModal()}
                className="w-full p-2.5 rounded-md bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">FEA Stress & Contact Simulation</div>
                  <div className="text-[11px] text-[#64748B]">Von Mises tooth contact & planetary carrier torsion</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                  FEA Solver
                </span>
              </button>

              <button
                onClick={onToggleSectionCut}
                className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left cursor-pointer shadow-xs transition-colors ${
                  isSectionCutActive
                    ? 'bg-blue-50 border-[#0284C7] text-[#0284C7]'
                    : 'bg-white hover:bg-[#F1F5F9] border-[#CBD5E1] text-[#0F172A]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Section Cut Plane (Section A-A)</div>
                  <div className="text-[11px] text-[#64748B]">Reveal inner sun gear, planet mesh & carrier needle bearings</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  {isSectionCutActive ? 'Active' : 'Off'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between shrink-0 font-mono">
        <span>CADVANTA Advanced Modules</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] font-bold rounded cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
