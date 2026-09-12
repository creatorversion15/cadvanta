import React, { useState, useMemo } from 'react';
import { CADPart } from '../../types/cad';
import {
  SheetMetalParameters,
  calculateSheetMetalBends,
  exportFlatPatternDXF,
} from '../../engine/sheetMetalEngine';
import { triggerDownload } from '../../engine/advancedExporters';
import {
  X,
  FileCode,
  Download,
  Check,
  AlertTriangle,
  Layers,
  FoldHorizontal,
  Maximize2,
  Sparkles,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

interface SheetMetalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySheetMetalPart: (part: CADPart) => void;
}

export const SheetMetalModal: React.FC<SheetMetalModalProps> = ({
  isOpen,
  onClose,
  onApplySheetMetalPart,
}) => {
  const [params, setParams] = useState<SheetMetalParameters>({
    thickness: 2.0,
    bendRadius: 3.0,
    kFactor: 0.44, // Mild steel default DIN 6935
    baseLength: 140,
    baseWidth: 90,
    flangeLeftLength: 45,
    flangeLeftAngle: 90,
    flangeRightLength: 45,
    flangeRightAngle: 90,
    reliefType: 'rectangular',
    reliefWidth: 3.0,
    reliefDepth: 4.0,
    isFlattened: false,
  });

  const [presetName, setPresetName] = useState<'mild_steel' | 'aluminum' | 'stainless'>('mild_steel');

  const calc = useMemo(() => calculateSheetMetalBends(params), [params]);

  if (!isOpen) return null;

  const handleApplyPreset = (type: 'mild_steel' | 'aluminum' | 'stainless') => {
    setPresetName(type);
    if (type === 'mild_steel') {
      setParams((prev) => ({ ...prev, kFactor: 0.44, bendRadius: Math.max(prev.thickness * 1.2, 2.5) }));
    } else if (type === 'aluminum') {
      setParams((prev) => ({ ...prev, kFactor: 0.40, bendRadius: Math.max(prev.thickness * 1.5, 3.0) }));
    } else if (type === 'stainless') {
      setParams((prev) => ({ ...prev, kFactor: 0.38, bendRadius: Math.max(prev.thickness * 1.8, 3.5) }));
    }
  };

  const handleExportDXF = () => {
    const blob = exportFlatPatternDXF(params, 'SheetMetal_Enclosure');
    triggerDownload(blob, `SheetMetal_FlatPattern_${params.thickness}mm.dxf`);
  };

  const handleApplyToCAD = () => {
    const newPart: CADPart = {
      id: `sm_${Date.now()}`,
      name: `Sheet Metal Enclosure (${params.thickness}mm T)`,
      part_type: 'custom',
      units: 'mm',
      parameters: {
        sheet_metal_thickness: params.thickness,
        bend_radius: params.bendRadius,
        k_factor: params.kFactor,
        base_length: params.baseLength,
        base_width: params.baseWidth,
        flange_left_length: params.flangeLeftLength,
        flange_left_angle: params.flangeLeftAngle,
        flange_right_length: params.flangeRightLength,
        flange_right_angle: params.flangeRightAngle,
        is_flattened: params.isFlattened ? 1 : 0,
        developed_flat_length: calc.developedFlatLength,
        developed_flat_width: calc.developedFlatWidth,
      },
      material: {
        id: 'galvanized_steel',
        name: presetName === 'aluminum' ? 'Aluminum 6061-T6' : presetName === 'stainless' ? 'Stainless Steel 304' : 'Cold-Rolled Mild Steel',
        standard: 'DIN EN 10130',
        category: presetName === 'aluminum' ? 'Non-Ferrous' : 'Ferrous',
        density: presetName === 'aluminum' ? 2.7 : 7.85,
        youngsModulus: presetName === 'aluminum' ? 70 : 205,
        yieldStrength: presetName === 'aluminum' ? 276 : 350,
        tensileStrength: presetName === 'aluminum' ? 310 : 450,
        poissonsRatio: 0.33,
        thermalExpansion: 23,
        thermalConductivity: 167,
        machinabilityRating: 85,
        costPerKg: 180,
        color: '#38bdf8',
        roughness: 0.28,
        metalness: 0.88,
        description: 'Deep drawing / cold forming sheet metal alloy',
      },
      features: [
        {
          id: 'f1',
          name: 'Base Flange Plate',
          type: 'extrude',
          description: `Base Flange ${params.baseLength}x${params.baseWidth}mm`,
          parameters: { length: params.baseLength, width: params.baseWidth, thickness: params.thickness },
          enabled: true,
          plane: 'XY',
        },
        {
          id: 'f2',
          name: 'Left Bend & Flange',
          type: 'bend',
          description: `Left Flange ${params.flangeLeftLength}mm @ ${params.flangeLeftAngle}° (R${params.bendRadius})`,
          parameters: { length: params.flangeLeftLength, angle: params.flangeLeftAngle, radius: params.bendRadius },
          enabled: true,
          plane: 'YZ',
        },
        {
          id: 'f3',
          name: 'Right Bend & Flange',
          type: 'bend',
          description: `Right Flange ${params.flangeRightLength}mm @ ${params.flangeRightAngle}° (R${params.bendRadius})`,
          parameters: { length: params.flangeRightLength, angle: params.flangeRightAngle, radius: params.bendRadius },
          enabled: true,
          plane: 'YZ',
        },
      ],
    };

    onApplySheetMetalPart(newPart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#0A1D16] to-[#05110D] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col text-[#F0FDF4] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]">
              <FoldHorizontal className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  SHEET METAL DESIGN SUITE
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  DIN 6935 K-FACTOR
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight">
                Flange, Bend & Unfold Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Folded vs Flattened Pattern */}
            <button
              type="button"
              onClick={() => setParams((prev) => ({ ...prev, isFlattened: !prev.isFlattened }))}
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                params.isFlattened
                  ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                  : 'bg-[#102B21] text-[#00F5A0] border-[#00F5A0]/40 hover:bg-[#16382B]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{params.isFlattened ? 'Viewing 2D Flat Pattern' : 'Folded 3D Model'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Config Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Material Presets */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
              <span className="text-xs font-mono font-bold uppercase text-[#8CA89E]">Material Alloy:</span>
              <div className="flex gap-1.5">
                {(['mild_steel', 'aluminum', 'stainless'] as const).map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleApplyPreset(mat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                      presetName === mat
                        ? 'bg-[#00F5A0] text-[#030A07]'
                        : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4]'
                    }`}
                  >
                    {mat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Thickness & Bend Radius */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
                <label className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                  Thickness (T mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={params.thickness}
                  onChange={(e) => setParams({ ...params, thickness: Number(e.target.value) })}
                  className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono font-bold text-[#00F5A0]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
                <label className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                  Inner Radius (R mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="25"
                  value={params.bendRadius}
                  onChange={(e) => setParams({ ...params, bendRadius: Number(e.target.value) })}
                  className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono font-bold text-[#00F5A0]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
                <label className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                  K-Factor (DIN 6935)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.25"
                  max="0.50"
                  value={params.kFactor}
                  onChange={(e) => setParams({ ...params, kFactor: Number(e.target.value) })}
                  className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono font-bold text-[#00F5A0]"
                />
              </div>
            </div>

            {/* Base Plate Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
                <label className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                  Base Web Length (mm)
                </label>
                <input
                  type="number"
                  step="5"
                  value={params.baseLength}
                  onChange={(e) => setParams({ ...params, baseLength: Number(e.target.value) })}
                  className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)]">
                <label className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                  Base Web Width (mm)
                </label>
                <input
                  type="number"
                  step="5"
                  value={params.baseWidth}
                  onChange={(e) => setParams({ ...params, baseWidth: Number(e.target.value) })}
                  className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                />
              </div>
            </div>

            {/* Left & Right Flanges */}
            <div className="p-3.5 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                Edge Flange Operations
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Left Flange (mm)</label>
                  <input
                    type="number"
                    value={params.flangeLeftLength}
                    onChange={(e) => setParams({ ...params, flangeLeftLength: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Left Angle (°)</label>
                  <input
                    type="number"
                    value={params.flangeLeftAngle}
                    onChange={(e) => setParams({ ...params, flangeLeftAngle: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Right Flange (mm)</label>
                  <input
                    type="number"
                    value={params.flangeRightLength}
                    onChange={(e) => setParams({ ...params, flangeRightLength: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Right Angle (°)</label>
                  <input
                    type="number"
                    value={params.flangeRightAngle}
                    onChange={(e) => setParams({ ...params, flangeRightAngle: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Analytical Bend Calculations & DXF (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
              <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-[#00F5A0]">
                  DIN 6935 Unfold Calculations
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  calc.crackRisk === 'Low' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  Crack Risk: {calc.crackRisk}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Bend Allowance (BA):</span>
                  <span className="text-[#00F5A0] font-bold">{calc.bendAllowanceBA} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Bend Deduction (BD):</span>
                  <span className="text-[#00F5A0] font-bold">{calc.bendDeductionBD} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Outside Setback (OSSB):</span>
                  <span className="text-[#F0FDF4] font-bold">{calc.setbackSB} mm</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Developed Blank (Flat):</span>
                  <span className="text-[#00F5A0] font-bold">
                    {calc.developedFlatLength} × {calc.developedFlatWidth} mm
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8CA89E]">Recommended Min R:</span>
                  <span className="text-[#F0FDF4] font-bold">≥ {calc.recommendedMinRadius} mm</span>
                </div>
              </div>

              {calc.crackRisk !== 'Low' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Inner bend radius ({params.bendRadius}mm) is less than 1.2× thickness ({params.thickness}mm). Outer fibers risk micro-cracking during press brake forming.
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportDXF}
                className="w-full h-11 rounded-xl bg-[#102B21] hover:bg-[#16382B] border border-[#00F5A0]/40 text-[#00F5A0] font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Flat Pattern DXF (CNC Laser)</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToCAD}
                className="w-full h-11 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,160,0.3)] cursor-pointer"
              >
                <span>Apply Sheet Metal Body</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
