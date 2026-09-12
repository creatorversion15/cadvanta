import React from 'react';
import { Ruler, Scale, ArrowRightLeft } from 'lucide-react';

export type UnitSystem = 'metric' | 'imperial';

interface UnitToggleProps {
  unitSystem: UnitSystem;
  onChange: (system: UnitSystem) => void;
  disabled?: boolean;
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  unitSystem,
  onChange,
  disabled = false,
}) => {
  const isMetric = unitSystem === 'metric';

  return (
    <div
      id="unit-conversion-toggle"
      className="p-2 rounded-xl bg-[#081611] border border-[rgba(16,185,129,0.22)] shadow-sm space-y-1.5"
    >
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-[#8CA89E] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightLeft className="w-3 h-3 text-[#00F5A0]" />
          <span>Unit System</span>
        </span>
        <span className="text-[10px] text-[#00F5A0] font-bold bg-[#00F5A0]/10 px-1.5 py-0.2 rounded border border-[#00F5A0]/30">
          {isMetric ? 'mm / kg (ISO)' : 'in / lb (ASME)'}
        </span>
      </div>

      {/* Segmented Button Group */}
      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#040E0A] border border-[rgba(16,185,129,0.15)]">
        {/* Metric (mm/kg) Button */}
        <button
          id="btn-unit-metric"
          type="button"
          disabled={disabled}
          onClick={() => onChange('metric')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
            isMetric
              ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.35)]'
              : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0E281E]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          title="Switch to Metric Units (millimeters and kilograms)"
        >
          <Ruler className="w-3.5 h-3.5 shrink-0" />
          <div className="flex items-baseline gap-1">
            <span>Metric</span>
            <span className={`text-[9px] font-normal ${isMetric ? 'text-[#02140D]/80' : 'text-[#5E7A70]'}`}>
              (mm/kg)
            </span>
          </div>
        </button>

        {/* Imperial (in/lb) Button */}
        <button
          id="btn-unit-imperial"
          type="button"
          disabled={disabled}
          onClick={() => onChange('imperial')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
            !isMetric
              ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.35)]'
              : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0E281E]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          title="Switch to Imperial Units (inches and pounds)"
        >
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <div className="flex items-baseline gap-1">
            <span>Imperial</span>
            <span className={`text-[9px] font-normal ${!isMetric ? 'text-[#02140D]/80' : 'text-[#5E7A70]'}`}>
              (in/lb)
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between text-[9px] text-[#5E7A70] font-mono px-0.5">
        <span>1 in = 25.4 mm</span>
        <span>•</span>
        <span>1 lb = 0.454 kg</span>
        <span>•</span>
        <span>Auto-converted</span>
      </div>
    </div>
  );
};
