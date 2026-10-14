import React, { useState } from 'react';
import { FeatureHistoryItem } from '../../types/cad';
import {
  Layers,
  ArrowUpDown,
  RotateCw,
  Scissors,
  CircleDot,
  Grid,
  Sliders,
  Check,
  Eye,
  EyeOff,
  X,
  Compass,
  RotateCcw,
} from 'lucide-react';

interface FeatureParameterEditorProps {
  feature: FeatureHistoryItem;
  onUpdateFeature: (updated: FeatureHistoryItem) => void;
  onClose: () => void;
  units?: 'mm' | 'inch';
}

export const FeatureParameterEditor: React.FC<FeatureParameterEditorProps> = ({
  feature,
  onUpdateFeature,
  onClose,
  units = 'mm',
}) => {
  const [localParams, setLocalParams] = useState<Record<string, any>>(feature.parameters || {});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const handleParamChange = (key: string, value: any) => {
    setLocalParams((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    // Also perform live update so 3D model reacts immediately
    onUpdateFeature({
      ...feature,
      parameters: { ...localParams, [key]: value },
      description: `${feature.type.toUpperCase()}: ${key}=${value}`,
    });
  };

  const handleApply = () => {
    onUpdateFeature({
      ...feature,
      parameters: localParams,
      description: `${feature.type.toUpperCase()} Updated`,
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalParams(feature.parameters || {});
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    const defaultParams: Record<string, any> = {
      depth: 25,
      angle: 360,
      radius: 3,
      diameter: 10,
      count: 4,
    };
    setLocalParams(defaultParams);
    setHasChanges(true);
    onUpdateFeature({
      ...feature,
      parameters: defaultParams,
    });
  };

  const getFeatureHeaderIcon = () => {
    switch (feature.type) {
      case 'extrude':
        return <Layers className="w-4 h-4 text-[#059669]" />;
      case 'revolve':
        return <RotateCw className="w-4 h-4 text-[#059669]" />;
      case 'cut':
      case 'hole':
        return <Scissors className="w-4 h-4 text-[#D97706]" />;
      case 'fillet':
      case 'chamfer':
        return <CircleDot className="w-4 h-4 text-[#059669]" />;
      case 'pattern':
        return <Grid className="w-4 h-4 text-[#7C3AED]" />;
      default:
        return <Sliders className="w-4 h-4 text-[#059669]" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-xs text-[#0F172A] select-none text-xs font-sans">
      {/* Header */}
      <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {getFeatureHeaderIcon()}
          <div className="min-w-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] truncate">
              {feature.name}
            </h3>
            <span className="text-[10px] text-[#64748B] font-mono capitalize">
              {feature.type} Feature Definition
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          title="Close Feature Properties"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Inputs */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Dynamic Controls based on feature type */}
        {feature.type === 'extrude' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#1E293B] block">
              Extrusion Depth
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localParams.depth ?? 25}
                min={1}
                max={500}
                onChange={(e) => handleParamChange('depth', parseFloat(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-bold text-[#0F172A] focus:border-[#059669] outline-hidden"
              />
              <span className="text-xs font-semibold text-[#64748B]">{units}</span>
            </div>
            <input
              type="range"
              min={1}
              max={200}
              value={localParams.depth ?? 25}
              onChange={(e) => handleParamChange('depth', parseFloat(e.target.value) || 1)}
              className="w-full accent-[#059669] cursor-pointer"
            />
          </div>
        )}

        {feature.type === 'revolve' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#1E293B] block">
              Revolution Angle (Deg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localParams.angle ?? 360}
                min={1}
                max={360}
                onChange={(e) => handleParamChange('angle', parseFloat(e.target.value) || 360)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-bold text-[#0F172A] focus:border-[#059669] outline-hidden"
              />
              <span className="text-xs font-semibold text-[#64748B]">deg</span>
            </div>
            <input
              type="range"
              min={10}
              max={360}
              step={5}
              value={localParams.angle ?? 360}
              onChange={(e) => handleParamChange('angle', parseFloat(e.target.value) || 360)}
              className="w-full accent-[#059669] cursor-pointer"
            />
          </div>
        )}

        {(feature.type === 'fillet' || feature.type === 'chamfer') && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#1E293B] block">
              {feature.type === 'fillet' ? 'Fillet Radius' : 'Chamfer Distance'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localParams.radius ?? localParams.distance ?? 2}
                min={0.5}
                max={50}
                step={0.5}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  handleParamChange(feature.type === 'fillet' ? 'radius' : 'distance', val);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-bold text-[#0F172A] focus:border-[#059669] outline-hidden"
              />
              <span className="text-xs font-semibold text-[#64748B]">{units}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={25}
              step={0.5}
              value={localParams.radius ?? localParams.distance ?? 2}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1;
                handleParamChange(feature.type === 'fillet' ? 'radius' : 'distance', val);
              }}
              className="w-full accent-[#059669] cursor-pointer"
            />
          </div>
        )}

        {(feature.type === 'cut' || feature.type === 'hole') && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#1E293B] block">
              Hole Diameter Ø
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localParams.diameter ?? 10}
                min={1}
                max={100}
                onChange={(e) => handleParamChange('diameter', parseFloat(e.target.value) || 10)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-bold text-[#0F172A] focus:border-[#059669] outline-hidden"
              />
              <span className="text-xs font-semibold text-[#64748B]">{units}</span>
            </div>
            <input
              type="range"
              min={2}
              max={60}
              value={localParams.diameter ?? 10}
              onChange={(e) => handleParamChange('diameter', parseFloat(e.target.value) || 10)}
              className="w-full accent-[#059669] cursor-pointer"
            />
          </div>
        )}

        {/* Fallback for other generic parameters */}
        {Object.entries(localParams).map(([k, v]) => {
          if (['depth', 'angle', 'radius', 'distance', 'diameter'].includes(k)) return null;
          if (typeof v !== 'number') return null;
          return (
            <div key={k} className="space-y-2">
              <label className="text-xs font-semibold text-[#1E293B] capitalize block">
                {k.replace(/_/g, ' ')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={v}
                  onChange={(e) => handleParamChange(k, parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded text-xs font-mono font-bold text-[#0F172A] focus:border-[#059669] outline-hidden"
                />
                <span className="text-xs font-semibold text-[#64748B]">{units}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Apply, Cancel, Reset Buttons */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
          title="Reset to default dimensions"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-xs font-medium cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
