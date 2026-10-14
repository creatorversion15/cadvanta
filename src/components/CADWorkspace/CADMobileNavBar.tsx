import React from 'react';
import {
  Layers,
  Sliders,
  Wrench,
  Bot,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface CADMobileNavBarProps {
  part: CADPart;
  onOpenFeatureTree: () => void;
  onOpenProperties: () => void;
  onOpenTools?: () => void;
  onOpenViraBot: () => void;
}

export const CADMobileNavBar: React.FC<CADMobileNavBarProps> = ({
  part,
  onOpenFeatureTree,
  onOpenProperties,
  onOpenTools,
  onOpenViraBot,
}) => {
  return (
    <div
      id="cadvanta-mobile-bottom-toolbar"
      className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-[#CBD5E1] rounded-2xl shadow-xl px-3 py-1 flex items-center gap-3 font-sans"
    >
      {/* 1. Feature Tree Bottom Sheet */}
      <button
        type="button"
        onClick={onOpenFeatureTree}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 py-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-[#334155] cursor-pointer"
        title="Model Feature Tree"
      >
        <Layers className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-semibold mt-0.5 text-slate-700">Tree</span>
      </button>

      {/* 2. Parameters & Dimensions */}
      <button
        type="button"
        onClick={onOpenProperties}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 py-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-[#334155] cursor-pointer"
        title="Parameters & Dimensions"
      >
        <Sliders className="w-4 h-4 text-blue-600" />
        <span className="text-[10px] font-semibold mt-0.5 text-slate-700">Params</span>
      </button>

      {/* 3. Advanced Tools Drawer */}
      {onOpenTools && (
        <button
          type="button"
          onClick={onOpenTools}
          className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 py-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-[#334155] cursor-pointer"
          title="Advanced Tools & Features"
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-semibold mt-0.5 text-slate-700">Tools</span>
        </button>
      )}

      {/* 4. VIRA AI Copilot */}
      <button
        type="button"
        onClick={onOpenViraBot}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
        title="Ask VIRA AI Copilot"
      >
        <Bot className="w-4 h-4" />
        <span className="text-[11px] font-bold">VIRA</span>
      </button>
    </div>
  );
};
