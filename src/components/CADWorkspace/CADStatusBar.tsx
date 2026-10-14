import React from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  Scale,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface CADStatusBarProps {
  part: CADPart;
  cursorPos?: { x: number; y: number; z: number };
  selectedFeatureId: string | null;
  onOpenUnitSwitch?: () => void;
  onOpenMaterialModal?: () => void;
  onOpenShortcuts?: () => void;
}

export const CADStatusBar: React.FC<CADStatusBarProps> = ({
  part,
  cursorPos = { x: 0, y: 0, z: 0 },
  selectedFeatureId,
  onOpenUnitSwitch,
  onOpenMaterialModal,
  onOpenShortcuts,
}) => {
  const density = part.material.density || 7.85;
  const l = Number(part.parameters.length || 180);
  const d = Number(part.parameters.main_diameter || part.parameters.outer_diameter || 60);
  const volumeCm3 = Math.round((Math.PI * Math.pow(d / 20, 2) * (l / 10)) * 0.85);
  const massKg = ((volumeCm3 * density) / 1000).toFixed(2);

  return (
    <div
      id="cadvanta-status-bar"
      className="w-full bg-[#FFFFFF] border-t border-[#E2E8F0] shadow-xs select-none z-30 shrink-0 font-mono text-[11px] h-7 px-3 hidden md:flex items-center justify-between text-[#475569]"
    >
      {/* LEFT: Cursor Coordinates */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-[#94A3B8]">XYZ</span>
          <span className="text-[#0F172A]">
            X: {cursorPos.x.toFixed(1)} mm
          </span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#0F172A]">
            Y: {cursorPos.y.toFixed(1)} mm
          </span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#0F172A]">
            Z: {cursorPos.z.toFixed(1)} mm
          </span>
        </div>
      </div>

      {/* MIDDLE: Active Units, Material, Calculated Mass */}
      <div className="hidden md:flex items-center gap-4">
        {/* Units Switcher */}
        <button
          onClick={onOpenUnitSwitch}
          className="hover:text-[#0F172A] hover:bg-[#F1F5F9] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Click to toggle units (mm / in)"
        >
          <span>Units: </span>
          <strong className="text-emerald-700 font-bold">{part.units || 'mm'} (Metric)</strong>
        </button>

        <span className="text-[#CBD5E1]">|</span>

        {/* Material */}
        <button
          onClick={onOpenMaterialModal}
          className="hover:text-[#0F172A] hover:bg-[#F1F5F9] px-1.5 py-0.5 rounded transition-colors cursor-pointer truncate max-w-[200px]"
          title="Click to inspect or change material"
        >
          <span>Mat: </span>
          <strong className="text-[#0F172A] font-medium">{part.material.name}</strong>
        </button>

        <span className="text-[#CBD5E1]">|</span>

        {/* Mass */}
        <div className="flex items-center gap-1">
          <Scale className="w-3 h-3 text-[#94A3B8]" />
          <span>Mass: </span>
          <strong className="text-[#0F172A] font-bold">{massKg} kg</strong>
        </div>
      </div>

      {/* RIGHT: Selection, Constraint State, Solver status */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1">
          <span className="text-[#64748B]">
            {selectedFeatureId ? '1 Feature Selected' : 'Root Model Active'}
          </span>
        </div>

        <span className="text-[#CBD5E1] hidden lg:inline">|</span>

        <div className="flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Fully Defined</span>
        </div>

        <span className="text-[#CBD5E1] hidden sm:inline">|</span>

        <div className="hidden sm:flex items-center gap-1 text-[#64748B]">
          <Clock className="w-3 h-3 text-[#94A3B8]" />
          <span>Solved (0.0 ms)</span>
        </div>

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1 hover:bg-[#F1F5F9] rounded text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer ml-1"
            title="Shortcuts Cheat Sheet (Ctrl+/)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
