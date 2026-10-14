import React from 'react';
import { SelectedGeometryInfo } from '../CADViewer/DirectModelingHUD';
import { Activity, Compass, MousePointer, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

interface CADStatusBarProps {
  cursorPos?: { x: number; y: number; z: number };
  selection: SelectedGeometryInfo | null;
  units: 'mm' | 'inch';
  onToggleUnits: () => void;
  triangleCount?: number;
  fps?: number;
  isComputing?: boolean;
  version?: string;
  hasErrors?: boolean;
}

export const CADStatusBar: React.FC<CADStatusBarProps> = ({
  cursorPos = { x: 0, y: 0, z: 0 },
  selection,
  units,
  onToggleUnits,
  triangleCount = 2840,
  fps = 60,
  isComputing = false,
  version = 'v2.4',
  hasErrors = false,
}) => {
  const formatCoord = (valMm: number) => {
    if (units === 'inch') {
      return (valMm / 25.4).toFixed(3);
    }
    return valMm.toFixed(2);
  };

  return (
    <footer className="h-7 bg-white border-t border-[#E2E8F0] px-3 flex items-center justify-between text-[11px] font-sans select-none shrink-0 text-[#64748B] z-30 shadow-xs">
      {/* 1. Left: 3D Coordinates & Unit System */}
      <div className="flex items-center gap-3">
        {/* XYZ Coordinates */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Compass className="w-3 h-3 text-[#059669]" />
          <span>
            X: <strong className="text-[#0F172A]">{formatCoord(cursorPos.x)}</strong>
          </span>
          <span>
            Y: <strong className="text-[#0F172A]">{formatCoord(cursorPos.y)}</strong>
          </span>
          <span>
            Z: <strong className="text-[#0F172A]">{formatCoord(cursorPos.z)}</strong>
          </span>
          <span className="text-[10px] text-[#94A3B8]">{units}</span>
        </div>

        {/* Quick Unit Toggle */}
        <button
          type="button"
          onClick={onToggleUnits}
          className="px-1.5 py-0.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold rounded border border-[#CBD5E1] cursor-pointer text-[10px] font-mono transition-colors"
          title="Click to toggle units (mm / inch)"
        >
          [{units.toUpperCase()}]
        </button>

        {/* Selection Status */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#E2E8F0]">
          <MousePointer className="w-3 h-3 text-[#2563EB]" />
          <span>Selected:</span>
          {selection ? (
            <span className="text-[#059669] font-bold font-mono">
              {selection.label} ({selection.type})
            </span>
          ) : (
            <span className="text-[#94A3B8]">None (Click geometry)</span>
          )}
        </div>
      </div>

      {/* 2. Middle: Model Status & Regeneration Status */}
      <div className="hidden md:flex items-center gap-3 text-[11px]">
        {/* Model Status */}
        <div className="flex items-center gap-1.5 font-medium">
          {isComputing ? (
            <>
              <RefreshCw className="w-3 h-3 text-[#2563EB] animate-spin" />
              <span className="text-[#2563EB]">Computing Geometry...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-[#0F172A] font-semibold">Ready • Fully Constrained</span>
            </>
          )}
        </div>

        <span>•</span>

        {/* Regeneration Status */}
        <div className="flex items-center gap-1 text-[#475569]">
          <CheckCircle2 className="w-3 h-3 text-[#059669]" />
          <span>Model Rebuilt (0 errors)</span>
        </div>

        <span>•</span>

        {/* Design Version */}
        <div className="font-mono text-[10px] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0] text-[#475569]">
          {version}
        </div>
      </div>

      {/* 3. Right: Viewport Performance & Kernel Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[#0F172A] font-bold">{fps} FPS</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 font-mono text-[10px]">
          <span>Tris:</span>
          <span className="text-[#0F172A] font-bold">{triangleCount.toLocaleString()}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-[#ECFDF5] rounded text-[10px] text-[#065F46] border border-[#A7F3D0] font-medium">
          <ShieldCheck className="w-3 h-3 text-[#059669]" />
          <span>B-Rep Kernel Solved</span>
        </div>
      </div>
    </footer>
  );
};
