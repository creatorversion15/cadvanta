import React from 'react';
import { Layers, Move, Target, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { CADPart } from '../../types/cad';

interface AssemblyDisassemblyCalloutOverlayProps {
  isExploded: boolean;
  explodedProgress: number;
  part: CADPart;
}

export const AssemblyDisassemblyCalloutOverlay: React.FC<AssemblyDisassemblyCalloutOverlayProps> = ({
  isExploded,
  explodedProgress,
  part,
}) => {
  if (!isExploded && explodedProgress === 0) return null;

  const isGearbox = part.part_type === 'planetary_gearbox';
  const pct = Math.round(explodedProgress * 100);

  // Disassembly components to display along the kinematic explosion axis
  const disassemblyParts = isGearbox
    ? [
        { name: 'Front Housing Cover', axis: 'Z: -140mm', type: 'Housing', tagColor: 'border-slate-400 text-slate-700 bg-white/90' },
        { name: 'Input Drive Shaft Ø32', axis: 'Z: -110mm', type: 'Shaft', tagColor: 'border-blue-400 text-blue-700 bg-blue-50/90' },
        { name: 'SKF 6208 Deep Groove Bearing', axis: 'Z: -80mm', type: 'Bearing', tagColor: 'border-cyan-400 text-cyan-800 bg-cyan-50/90' },
        { name: 'Sun Gear (Module 2.5, Z=30)', axis: 'Axial Stage 1', type: 'Gear', tagColor: 'border-amber-400 text-amber-800 bg-amber-50/90' },
        { name: 'Planet Gears Cluster (3× 120°)', axis: 'Radial: +25mm', type: 'Planets', tagColor: 'border-emerald-400 text-emerald-800 bg-emerald-50/90' },
        { name: 'Planet Carrier & Pinion Shafts', axis: 'Z: 0mm (Center)', type: 'Carrier', tagColor: 'border-indigo-400 text-indigo-800 bg-indigo-50/90' },
        { name: 'Heavy Duty Output Shaft Ø65', axis: 'Z: +120mm', type: 'Shaft', tagColor: 'border-blue-400 text-blue-700 bg-blue-50/90' },
        { name: 'Rear Housing & Mounting Flange', axis: 'Z: +150mm', type: 'Housing', tagColor: 'border-slate-400 text-slate-700 bg-white/90' },
      ]
    : [
        { name: 'Main Concentric Body', axis: 'Z: 0mm (Datum)', type: 'Base', tagColor: 'border-emerald-400 text-emerald-800 bg-emerald-50/90' },
        { name: 'Step 1 Journal & Bearing Fit', axis: 'Z: -60mm', type: 'Journal', tagColor: 'border-blue-400 text-blue-700 bg-blue-50/90' },
        { name: 'DIN 6885 Feather Keyway', axis: 'Top Radial Crown', type: 'Keyway', tagColor: 'border-amber-400 text-amber-800 bg-amber-50/90' },
        { name: 'End Chamfers & Relief Radii', axis: 'Z: ±100mm', type: 'Features', tagColor: 'border-purple-400 text-purple-800 bg-purple-50/90' },
      ];

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 transition-all duration-700 ease-out ${
        isExploded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Top Banner: Exploded Disassembly Active Indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-emerald-300 shadow-lg text-slate-800 font-mono text-xs transition-all duration-500 ease-out transform translate-y-0">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">
          Exploded Assembly Disassembly
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
          {pct}% Extent
        </span>
      </div>

      {/* Disassembly Component Callout Chips (Floating Left Side) */}
      <div className="absolute left-3 top-14 bottom-14 flex flex-col justify-center gap-2 max-w-xs overflow-hidden">
        {disassemblyParts.map((item, index) => (
          <div
            key={index}
            style={{
              transitionDelay: `${index * 60}ms`,
              transform: isExploded ? 'translateX(0)' : 'translateX(-40px)',
              opacity: isExploded ? 1 : 0,
            }}
            className={`assembly-part-tag flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-sm backdrop-blur-md text-[11px] font-mono transition-all duration-500 ease-out ${item.tagColor}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold truncate text-[11px] leading-tight">
                {item.name}
              </div>
              <div className="text-[9px] text-slate-500 flex items-center gap-1 font-sans">
                <span className="uppercase font-semibold tracking-wider font-mono">{item.type}</span>
                <span>•</span>
                <span className="font-mono text-emerald-700">{item.axis}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Central Disassembly Kinematic Axis Line Indicator */}
      <div className="absolute bottom-16 right-4 flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 text-slate-200 text-[10px] font-mono shadow-md">
        <Move className="w-3.5 h-3.5 text-emerald-400" />
        <span>Axial & Radial Disassembly Trajectories Active</span>
      </div>
    </div>
  );
};
