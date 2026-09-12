import React, { useState } from 'react';
import { CADPart } from '../../types/cad';
import { SurfacingParameters, SurfaceToolType } from '../../engine/surfacingEngine';
import {
  X,
  Compass,
  Layers,
  Sparkles,
  Sliders,
  Eye,
  CheckCircle2,
  Wind,
} from 'lucide-react';

interface SurfacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySurface: (part: CADPart) => void;
}

export const SurfacingModal: React.FC<SurfacingModalProps> = ({
  isOpen,
  onClose,
  onApplySurface,
}) => {
  const [params, setParams] = useState<SurfacingParameters>({
    toolType: 'loft',
    loftProfile1: 'circle',
    loftProfile2: 'rectangle',
    profile1Size: 60,
    profile2Size: 35,
    loftHeight: 120,
    guideCurvature: 0.35,
    sweepProfileRadius: 16,
    sweepPathLength: 140,
    sweepTurns: 1.25,
    sweepTwistDeg: 45,
    patchWidth: 90,
    patchLength: 130,
    crownBulge: 22,
    showZebraStripes: false,
    showNormals: false,
    showBoundaryWireframe: true,
  });

  if (!isOpen) return null;

  const handleApply = () => {
    const newPart: CADPart = {
      id: `surf_${Date.now()}`,
      name: `${params.toolType.toUpperCase()} Non-Solid Surface`,
      part_type: 'custom',
      units: 'mm',
      parameters: {
        surface_tool: params.toolType,
        profile1: params.loftProfile1,
        profile2: params.loftProfile2,
        height: params.loftHeight,
        curvature: params.guideCurvature,
        sweep_radius: params.sweepProfileRadius,
        patch_width: params.patchWidth,
        patch_length: params.patchLength,
      },
      material: {
        id: 'carbon_fiber',
        name: 'Aerospace Carbon Composite / Surfacing Skin',
        standard: 'ISO 527',
        category: 'Custom',
        density: 1.55,
        youngsModulus: 140,
        yieldStrength: 850,
        tensileStrength: 1200,
        poissonsRatio: 0.32,
        thermalExpansion: 2.1,
        thermalConductivity: 5,
        machinabilityRating: 60,
        costPerKg: 1200,
        color: '#00f5a0',
        roughness: 0.2,
        metalness: 0.4,
        description: 'High modulus aerodynamic surface skin',
      },
      features: [
        {
          id: 'f1',
          name: `${params.toolType.toUpperCase()} Operation`,
          type: 'loft',
          description: `${params.toolType.toUpperCase()} surface feature`,
          parameters: { h: params.loftHeight },
          enabled: true,
          plane: 'XY',
        },
      ],
    };

    onApplySurface(newPart);
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
              <Compass className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  NON-SOLID FREEFORM SURFACING
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  G2 CONTINUITY
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight">
                Loft, Sweep & Boundary Fill Surface Tools
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Tool Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'loft', label: 'Multi-Section Loft', desc: 'Blends smoothly across multiple closed or open 2D profiles with guide curves.' },
              { id: 'sweep', label: '3D Trajectory Sweep', desc: 'Sweeps a cross-section profile along a spatial 3D spline or helical guide path.' },
              { id: 'fill_patch', label: 'Boundary Surface Patch', desc: 'Generates tangent-continuous bicubic surface patch over closed 3D boundary loops.' },
            ].map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setParams({ ...params, toolType: tool.id as SurfaceToolType })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  params.toolType === tool.id
                    ? 'bg-[#00F5A0]/15 border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.2)]'
                    : 'bg-[#071510] hover:bg-[#0B1E17] border-[rgba(16,185,129,0.2)]'
                }`}
              >
                <span className={`font-mono font-bold text-xs block mb-1 ${params.toolType === tool.id ? 'text-[#00F5A0]' : 'text-[#F0FDF4]'}`}>
                  {tool.label}
                </span>
                <p className="text-[11px] text-[#8CA89E] leading-relaxed">{tool.desc}</p>
              </button>
            ))}
          </div>

          {/* Conditional Options */}
          {params.toolType === 'loft' && (
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                Loft Profiles & Guide Curves
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Start Profile</label>
                  <select
                    value={params.loftProfile1}
                    onChange={(e) => setParams({ ...params, loftProfile1: e.target.value as any })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  >
                    <option value="circle">Circular (Bore)</option>
                    <option value="rectangle">Rounded Rectangle</option>
                    <option value="ellipse">Elliptical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">End Profile</label>
                  <select
                    value={params.loftProfile2}
                    onChange={(e) => setParams({ ...params, loftProfile2: e.target.value as any })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  >
                    <option value="rectangle">Rounded Rectangle</option>
                    <option value="circle">Circular (Bore)</option>
                    <option value="ellipse">Elliptical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Loft Height (mm)</label>
                  <input
                    type="number"
                    value={params.loftHeight}
                    onChange={(e) => setParams({ ...params, loftHeight: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Guide Curvature</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={params.guideCurvature}
                    onChange={(e) => setParams({ ...params, guideCurvature: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
              </div>
            </div>
          )}

          {params.toolType === 'sweep' && (
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                Spatial Sweep Parameters
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Profile Radius (mm)</label>
                  <input
                    type="number"
                    value={params.sweepProfileRadius}
                    onChange={(e) => setParams({ ...params, sweepProfileRadius: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Sweep Path Length (mm)</label>
                  <input
                    type="number"
                    value={params.sweepPathLength}
                    onChange={(e) => setParams({ ...params, sweepPathLength: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Helical Turns</label>
                  <input
                    type="number"
                    step="0.25"
                    value={params.sweepTurns}
                    onChange={(e) => setParams({ ...params, sweepTurns: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
              </div>
            </div>
          )}

          {params.toolType === 'fill_patch' && (
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-[#00F5A0] block">
                Boundary Surface Patch Parameters
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Patch Width (mm)</label>
                  <input
                    type="number"
                    value={params.patchWidth}
                    onChange={(e) => setParams({ ...params, patchWidth: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Patch Length (mm)</label>
                  <input
                    type="number"
                    value={params.patchLength}
                    onChange={(e) => setParams({ ...params, patchLength: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Crown Bulge (mm)</label>
                  <input
                    type="number"
                    value={params.crownBulge}
                    onChange={(e) => setParams({ ...params, crownBulge: Number(e.target.value) })}
                    className="w-full h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Surface Quality & Inspection Tools */}
          <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold uppercase text-[#8CA89E]">
              Surface Inspection & Curvature Display:
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setParams({ ...params, showZebraStripes: !params.showZebraStripes })}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  params.showZebraStripes
                    ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                    : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                }`}
              >
                Zebra Striping (G2)
              </button>

              <button
                type="button"
                onClick={() => setParams({ ...params, showBoundaryWireframe: !params.showBoundaryWireframe })}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  params.showBoundaryWireframe
                    ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                    : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                }`}
              >
                Boundary Isoparms
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#071510] border-t border-[rgba(16,185,129,0.2)] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] cursor-pointer"
          >
            Generate Surface Geometry
          </button>
        </div>
      </div>
    </div>
  );
};
