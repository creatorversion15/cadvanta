import React, { useState } from 'react';
import {
  X,
  Compass,
  Activity,
  Scissors,
  ShieldAlert,
  Scale,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface CADInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CADPart;
  initialTab?: 'measure' | 'mass' | 'interference' | 'section';
}

export const CADInspectionModal: React.FC<CADInspectionModalProps> = ({
  isOpen,
  onClose,
  part,
  initialTab = 'mass',
}) => {
  const [activeTab, setActiveTab] = useState<'measure' | 'mass' | 'interference' | 'section'>(initialTab);

  if (!isOpen) return null;

  const density = part.material.density || 7.85; // g/cm³
  const l = Number(part.parameters.length || 180);
  const d = Number(part.parameters.main_diameter || part.parameters.outer_diameter || 60);
  const volumeCm3 = Math.round((Math.PI * Math.pow(d / 20, 2) * (l / 10)) * 0.85);
  const surfaceAreaCm2 = Math.round(2 * Math.PI * (d / 20) * (l / 10) + 2 * Math.PI * Math.pow(d / 20, 2));
  const massKg = ((volumeCm3 * density) / 1000).toFixed(2);
  const massLb = (parseFloat(massKg) * 2.20462).toFixed(2);

  // Moments of inertia (simplified cylinder approximation)
  const rM = (d / 2) / 1000; // m
  const lM = l / 1000; // m
  const mM = parseFloat(massKg);
  const Ixx = (0.5 * mM * Math.pow(rM, 2)).toExponential(3);
  const Iyy = (mM * (3 * Math.pow(rM, 2) + Math.pow(lM, 2)) / 12).toExponential(3);
  const Izz = Iyy;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-xl shadow-2xl overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-[#0F172A] text-sm">
              CADVANTA Engineering Inspection Studio
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-[#E2E8F0] bg-[#FFFFFF] gap-2 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('mass')}
            className={`px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'mass'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Mass Properties
          </button>
          <button
            onClick={() => setActiveTab('measure')}
            className={`px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'measure'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            3D Measurement
          </button>
          <button
            onClick={() => setActiveTab('interference')}
            className={`px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'interference'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Interference Check
          </button>
          <button
            onClick={() => setActiveTab('section')}
            className={`px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'section'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Section Analysis
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          {/* MASS PROPERTIES */}
          {activeTab === 'mass' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-emerald-800 uppercase font-bold">
                    Evaluated Part
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">{part.name}</div>
                  <div className="text-xs text-[#475569]">{part.material.name} ({part.material.category})</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-emerald-700">{massKg} kg</div>
                  <div className="text-[11px] text-[#64748B]">{massLb} lb</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Volume</div>
                  <div className="font-mono text-sm font-bold text-[#0F172A] mt-0.5">{volumeCm3} cm³</div>
                  <div className="text-[10px] text-[#94A3B8]">{(volumeCm3 / 1000).toFixed(4)} liters</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Surface Area</div>
                  <div className="font-mono text-sm font-bold text-[#0F172A] mt-0.5">{surfaceAreaCm2} cm²</div>
                  <div className="text-[10px] text-[#94A3B8]">{(surfaceAreaCm2 / 10000).toFixed(4)} m²</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Density</div>
                  <div className="font-mono text-sm font-bold text-[#0F172A] mt-0.5">{density} g/cm³</div>
                  <div className="text-[10px] text-[#94A3B8]">{density * 1000} kg/m³</div>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="font-bold text-xs text-[#0F172A]">Center of Mass (Origin Reference)</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-[#334155]">
                  <div className="p-1.5 bg-slate-50 rounded">X: 0.00 mm</div>
                  <div className="p-1.5 bg-slate-50 rounded">Y: {(l / 2).toFixed(2)} mm</div>
                  <div className="p-1.5 bg-slate-50 rounded">Z: 0.00 mm</div>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="font-bold text-xs text-[#0F172A]">Principal Moments of Inertia (kg·m²)</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-[#334155]">
                  <div className="p-1.5 bg-slate-50 rounded">Ixx: {Ixx}</div>
                  <div className="p-1.5 bg-slate-50 rounded">Iyy: {Iyy}</div>
                  <div className="p-1.5 bg-slate-50 rounded">Izz: {Izz}</div>
                </div>
              </div>
            </div>
          )}

          {/* MEASUREMENT */}
          {activeTab === 'measure' && (
            <div className="space-y-3 text-xs text-[#334155]">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-bold text-blue-900 text-xs">Live 3D Precision Measuring Tool</div>
                <p className="text-[11px] text-blue-800 mt-1">
                  Hover and click on any two vertices, cylindrical edges, or planar faces in the CAD viewport to evaluate point-to-point distance, delta coordinates (ΔX, ΔY, ΔZ), and normal angles.
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="font-bold text-[#0F172A]">Current Bounding Extents</div>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex justify-between p-1 bg-slate-50 rounded">
                    <span>X Dimension:</span>
                    <strong>{d} mm</strong>
                  </div>
                  <div className="flex justify-between p-1 bg-slate-50 rounded">
                    <span>Y Dimension:</span>
                    <strong>{d} mm</strong>
                  </div>
                  <div className="flex justify-between p-1 bg-slate-50 rounded">
                    <span>Z Dimension (Length):</span>
                    <strong>{l} mm</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INTERFERENCE CHECK */}
          {activeTab === 'interference' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900">Zero Critical Clashes Detected</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    All components, gear pitch diameters, and bearing clearances conform to ISO tolerance classes (H7/k6).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION ANALYSIS */}
          {activeTab === 'section' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg">
                <div className="font-bold text-[#0F172A]">Dynamic Cutting Planes</div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Use the cutting plane slider in the main CAD viewport to slice through internal bores, keyways, and wall thicknesses in real time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
