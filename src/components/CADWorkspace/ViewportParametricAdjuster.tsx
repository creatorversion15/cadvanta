import React, { useState } from 'react';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Wrench,
  Globe,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface ViewportParametricAdjusterProps {
  part: CADPart;
  onParameterChange: (key: string, value: number) => void;
  selectedFeatureId?: string | null;
  onOpenGroundedSearch?: (query: string) => void;
  onOpenViraBot?: () => void;
}

export const ViewportParametricAdjuster: React.FC<ViewportParametricAdjusterProps> = ({
  part,
  onParameterChange,
  selectedFeatureId,
  onOpenGroundedSearch,
  onOpenViraBot,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'diameters' | 'lengths' | 'features'>('all');
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const parameters = part.parameters || {};

  const handleAdjust = (key: string, delta: number) => {
    const current = Number(parameters[key]) || 0;
    const step = key.includes('radius') || key.includes('fillet') ? 0.5 : 1;
    const newVal = Math.max(1, current + delta * step);
    onParameterChange(key, newVal);
    showToast(`Updated ${key.replace(/_/g, ' ')}: ${newVal} mm`);
  };

  const handleSliderChange = (key: string, val: number) => {
    onParameterChange(key, val);
  };

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 1500);
  };

  // Filter keys based on active category
  const filteredKeys = Object.keys(parameters).filter((key) => {
    if (typeof parameters[key] !== 'number' && isNaN(Number(parameters[key]))) return false;
    if (filterType === 'diameters') return key.includes('diameter') || key.includes('bore') || key.includes('pitch');
    if (filterType === 'lengths') return key.includes('length') || key.includes('thickness') || key.includes('depth');
    if (filterType === 'features') return key.includes('hole') || key.includes('fillet') || key.includes('chamfer') || key.includes('teeth');
    return true;
  });

  const getParamRange = (key: string, currentVal: number) => {
    if (key.includes('radius') || key.includes('fillet') || key.includes('chamfer')) {
      return { min: 0.5, max: 25, step: 0.5 };
    }
    if (key.includes('count') || key.includes('teeth') || key.includes('holes')) {
      return { min: 2, max: 48, step: 1 };
    }
    if (key.includes('length')) {
      return { min: 20, max: 800, step: 5 };
    }
    if (key.includes('diameter') || key.includes('bore')) {
      return { min: 10, max: 400, step: 2 };
    }
    return { min: Math.max(1, Math.round(currentVal * 0.2)), max: Math.max(100, Math.round(currentVal * 3)), step: 1 };
  };

  const handleAutoTune = () => {
    // Intelligent standard engineering dimension rounding & optimization
    Object.keys(parameters).forEach((k) => {
      const v = Number(parameters[k]);
      if (typeof v === 'number' && !isNaN(v)) {
        // Round diameters to standard preferred numbers (Renard R10 series: 10, 12.5, 16, 20, 25, 32, 40, 50, etc.)
        if (k.includes('diameter') || k.includes('bore')) {
          const standardSizes = [12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 100, 120];
          const closest = standardSizes.reduce((prev, curr) => (Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev));
          onParameterChange(k, closest);
        } else if (k.includes('length')) {
          // Standard length rounded to 10mm increment
          const rounded = Math.round(v / 10) * 10;
          onParameterChange(k, rounded);
        }
      }
    });
    showToast('✓ Auto-Tuned to ISO preferred nominal sizes');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 border border-slate-300 shadow-md backdrop-blur-md text-xs font-mono font-bold transition-all hover:scale-105 cursor-pointer"
        title="Open In-Place Dimension & Parameter Adjuster (Adjust Anywhere)"
      >
        <Sliders className="w-3.5 h-3.5 text-emerald-600" />
        <span>Adjust Anywhere</span>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          HUD
        </span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-20 w-80 max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-slate-300 shadow-xl text-slate-800 font-sans transition-all animate-in fade-in slide-in-from-right-2">
      {/* Toast alert */}
      {activeToast && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[11px] font-mono font-bold rounded-full shadow-lg whitespace-nowrap animate-bounce">
          {activeToast}
        </div>
      )}

      {/* Header */}
      <div className="p-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-xl shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sliders className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-900 truncate flex items-center gap-1">
              <span>Adjust Anywhere</span>
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1 rounded">
                Live 3D
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-500 truncate">
              {part.name} • {part.part_type}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close HUD"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Category Tabs & Quick Auto-Tune */}
          <div className="p-2 border-b border-slate-200 flex items-center justify-between gap-1 bg-white shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
              {(['all', 'diameters', 'lengths', 'features'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterType(cat)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    filterType === cat
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAutoTune}
              className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              title="Align dimensions with ISO standard preferred numbers"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Auto-Tune</span>
            </button>
          </div>

          {/* Parameter Sliders & Precision Steppers */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 max-h-[55vh] scrollbar-thin">
            {filteredKeys.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No matching parameters found for this filter.
              </div>
            ) : (
              filteredKeys.map((key) => {
                const val = Number(parameters[key]) || 0;
                const range = getParamRange(key, val);
                const isSelected = selectedFeatureId && key.toLowerCase().includes(selectedFeatureId.toLowerCase().replace('feat_', ''));

                return (
                  <div
                    key={key}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Label and Numeric Input */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="min-w-0">
                        <span className="font-semibold text-[11px] text-slate-800 capitalize truncate block">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={val}
                          step={range.step}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (!isNaN(n)) onParameterChange(key, n);
                          }}
                          className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-emerald-500 text-slate-900 shadow-2xs"
                        />
                        <span className="text-[10px] font-mono text-slate-500 w-5">
                          {key.includes('count') || key.includes('teeth') ? 'ea' : 'mm'}
                        </span>
                      </div>
                    </div>

                    {/* Smooth Range Slider */}
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={val}
                        onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Micro Stepper Buttons */}
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/60 text-[10px] font-mono">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjust(key, -5)}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer font-bold"
                          title="Decrease by 5mm"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjust(key, -1)}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer font-bold"
                          title="Decrease by 1mm"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjust(key, 1)}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer font-bold"
                          title="Increase by 1mm"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjust(key, 5)}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer font-bold"
                          title="Increase by 5mm"
                        >
                          +5
                        </button>
                      </div>

                      {/* Live Standard Lookup for this parameter */}
                      {onOpenGroundedSearch && (
                        <button
                          type="button"
                          onClick={() => onOpenGroundedSearch(`Standard ${key.replace(/_/g, ' ')} tolerance fit ISO DIN`)}
                          className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 text-[10px] cursor-pointer"
                          title="Search live ISO/DIN standard values for this parameter"
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span>ISO Specs</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between text-[11px] font-mono shrink-0">
            <span className="text-slate-500 text-[10px]">
              {filteredKeys.length} params editable in-place
            </span>
            {onOpenViraBot && (
              <button
                type="button"
                onClick={onOpenViraBot}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer text-[10px]"
              >
                <span>Ask VIRA to modify</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
