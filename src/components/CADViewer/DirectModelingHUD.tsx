import React from 'react';
import {
  Layers,
  Scissors,
  CircleDot,
  PenTool,
  Ruler,
  Maximize2,
  Copy,
  RotateCw,
  Box,
  Palette,
  X,
} from 'lucide-react';

export type SelectionType = 'face' | 'edge' | 'body' | null;

export interface SelectedGeometryInfo {
  type: SelectionType;
  id: string;
  label: string;
  details?: {
    normal?: [number, number, number];
    radius?: number;
    length?: number;
    area?: number;
    point?: [number, number, number];
  };
  screenPosition?: { x: number; y: number };
}

interface DirectModelingHUDProps {
  selection: SelectedGeometryInfo | null;
  onClearSelection: () => void;
  onAction: (actionId: string, selection: SelectedGeometryInfo) => void;
}

export const DirectModelingHUD: React.FC<DirectModelingHUDProps> = ({
  selection,
  onClearSelection,
  onAction,
}) => {
  if (!selection || !selection.type) return null;

  const posX = Math.min(Math.max(selection.screenPosition?.x || 100, 20), window.innerWidth - 320);
  const posY = Math.min(Math.max((selection.screenPosition?.y || 100) - 60, 60), window.innerHeight - 150);

  return (
    <div
      className="absolute z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 font-sans select-none"
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
      }}
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#CBD5E1] rounded-lg p-1.5 shadow-xl flex flex-col gap-1 min-w-[220px]">
        {/* Selection Header */}
        <div className="flex items-center justify-between px-2 py-0.5 border-b border-[#E2E8F0] pb-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                selection.type === 'face'
                  ? 'bg-[#059669]'
                  : selection.type === 'edge'
                  ? 'bg-[#2563EB]'
                  : 'bg-[#7C3AED]'
              }`}
            />
            <span className="text-[11px] font-mono font-bold text-[#0F172A] uppercase tracking-wider">
              {selection.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[#64748B] hover:text-[#0F172A] p-0.5 cursor-pointer rounded hover:bg-[#F1F5F9]"
            title="Deselect"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Contextual Action Buttons */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {selection.type === 'face' && (
            <>
              <button
                type="button"
                onClick={() => onAction('extrude', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Extrude / Pad from this face"
              >
                <Layers className="w-3 h-3 text-[#059669]" />
                <span>Extrude</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('cut', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Cut / Pocket into this face"
              >
                <Scissors className="w-3 h-3 text-[#2563EB]" />
                <span>Cut</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('hole', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Drill parametric hole"
              >
                <CircleDot className="w-3 h-3 text-[#D97706]" />
                <span>Hole</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('fillet', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Apply fillet blend"
              >
                <span>Fillet</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('chamfer', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Apply chamfer bevel"
              >
                <span>Chamfer</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('sketch_face', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#ECFDF5] hover:bg-[#059669] hover:text-white text-[#065F46] rounded text-[10px] font-bold transition-colors border border-[#A7F3D0] cursor-pointer"
                title="Create 2D sketch on this face"
              >
                <PenTool className="w-3 h-3" />
                <span>Sketch</span>
              </button>
            </>
          )}

          {selection.type === 'edge' && (
            <>
              <button
                type="button"
                onClick={() => onAction('fillet', selection)}
                className="col-span-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Fillet edge (R)"
              >
                <span>Fillet R</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('chamfer', selection)}
                className="col-span-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Chamfer edge"
              >
                <span>Chamfer</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('measure', selection)}
                className="col-span-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Measure edge length"
              >
                <Ruler className="w-3 h-3 text-[#059669]" />
                <span>Measure</span>
              </button>
            </>
          )}

          {selection.type === 'body' && (
            <>
              <button
                type="button"
                onClick={() => onAction('shell', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Hollow shell body"
              >
                <Box className="w-3 h-3 text-[#059669]" />
                <span>Shell</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('pattern', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Linear or circular pattern"
              >
                <Copy className="w-3 h-3 text-[#2563EB]" />
                <span>Pattern</span>
              </button>
              <button
                type="button"
                onClick={() => onAction('material', selection)}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#059669] hover:text-white text-[#0F172A] rounded text-[10px] font-semibold transition-colors border border-[#E2E8F0] cursor-pointer"
                title="Assign engineering material"
              >
                <Palette className="w-3 h-3 text-[#D97706]" />
                <span>Material</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
