import React from 'react';
import { Ruler, Check, X, ArrowRightLeft, CircleDot, Compass, Box } from 'lucide-react';

export type MeasurementToolType = 'none' | 'distance' | 'diameter' | 'angle' | 'area_volume';

export interface MeasurementResult {
  tool: MeasurementToolType;
  title: string;
  valueMm: number;
  secondaryValue?: number; // e.g. angle in degrees
  unit: 'mm' | 'inch';
  pointA?: [number, number, number];
  pointB?: [number, number, number];
  leaderText: string;
}

interface MeasurementOverlayProps {
  activeTool: MeasurementToolType;
  onSelectTool: (tool: MeasurementToolType) => void;
  currentMeasurement: MeasurementResult | null;
  onClearMeasurement: () => void;
  units: 'mm' | 'inch';
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  activeTool,
  onSelectTool,
  currentMeasurement,
  onClearMeasurement,
  units,
}) => {
  const formatVal = (valMm: number): string => {
    if (units === 'inch') {
      return `${(valMm / 25.4).toFixed(4)} in`;
    }
    return `${valMm.toFixed(2)} mm`;
  };

  return (
    <>
      {/* Measurement Mode Floating Ribbon */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] shadow-xl text-xs font-sans">
        <div className="flex items-center gap-1 px-2 text-[#059669] font-bold">
          <Ruler className="w-3.5 h-3.5" />
          <span>MEASURE</span>
        </div>

        <button
          type="button"
          onClick={() => onSelectTool(activeTool === 'distance' ? 'none' : 'distance')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTool === 'distance'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
          title="Distance between 2 points or parallel faces"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>Distance</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(activeTool === 'diameter' ? 'none' : 'diameter')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTool === 'diameter'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
          title="Diameter / Radius of cylinder or circle"
        >
          <CircleDot className="w-3 h-3" />
          <span>Ø / R</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(activeTool === 'angle' ? 'none' : 'angle')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTool === 'angle'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
          title="Angle between 2 planar faces or edges"
        >
          <Compass className="w-3 h-3" />
          <span>Angle</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(activeTool === 'area_volume' ? 'none' : 'area_volume')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTool === 'area_volume'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
          title="Surface Area & Volume"
        >
          <Box className="w-3 h-3" />
          <span>Area/Vol</span>
        </button>

        {activeTool !== 'none' && (
          <button
            type="button"
            onClick={() => onSelectTool('none')}
            className="p-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-[#F1F5F9] cursor-pointer ml-1"
            title="Exit Measure"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Measurement Result Card */}
      {currentMeasurement && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white/98 backdrop-blur-md border border-[#CBD5E1] rounded-lg p-3 shadow-2xl flex flex-col gap-1 min-w-[240px] text-xs font-sans">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
            <span className="text-[10px] uppercase font-bold text-[#059669] tracking-wider flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {currentMeasurement.title}
            </span>
            <button
              type="button"
              onClick={onClearMeasurement}
              className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#0F172A]">
              {currentMeasurement.leaderText}
            </span>
            <span className="text-xs font-mono font-bold text-[#059669]">
              {formatVal(currentMeasurement.valueMm)}
            </span>
          </div>

          {currentMeasurement.secondaryValue !== undefined && (
            <div className="text-[11px] text-[#2563EB] flex justify-between font-mono">
              <span>Angle:</span>
              <span>{currentMeasurement.secondaryValue.toFixed(1)}°</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
