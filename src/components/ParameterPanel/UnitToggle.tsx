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
      className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs space-y-1.5"
    >
      <div className="flex items-center justify-between text-[11px] font-sans">
        <span className="text-[#475569] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
          <ArrowRightLeft className="w-3 h-3 text-[#059669]" />
          <span>Unit System</span>
        </span>
        <span className="text-[10px] text-[#065F46] font-semibold bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0] font-mono">
          {isMetric ? 'mm / kg (ISO)' : 'in / lb (ASME)'}
        </span>
      </div>

      {/* Segmented Button Group */}
      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-md bg-[#E2E8F0]">
        {/* Metric (mm/kg) Button */}
        <button
          id="btn-unit-metric"
          type="button"
          disabled={disabled}
          onClick={() => onChange('metric')}
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-semibold transition-all cursor-pointer ${
            isMetric
              ? 'bg-white text-[#059669] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          title="Switch to Metric Units (millimeters and kilograms)"
        >
          <Ruler className="w-3.5 h-3.5 shrink-0" />
          <span>Metric (mm)</span>
        </button>

        {/* Imperial (in/lb) Button */}
        <button
          id="btn-unit-imperial"
          type="button"
          disabled={disabled}
          onClick={() => onChange('imperial')}
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-semibold transition-all cursor-pointer ${
            !isMetric
              ? 'bg-white text-[#059669] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          title="Switch to Imperial Units (inches and pounds)"
        >
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <span>Imperial (in)</span>
        </button>
      </div>
    </div>
  );
};
