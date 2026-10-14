import React, { useState } from 'react';
import { SelectedGeometryInfo } from '../CADViewer/DirectModelingHUD';
import {
  Layers,
  Scissors,
  CircleDot,
  Box,
  Copy,
  CheckCircle2,
  X,
  Sliders,
} from 'lucide-react';

interface DirectFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  selection: SelectedGeometryInfo | null;
  onApplyFeature: (featureData: {
    type: string;
    name: string;
    parameters: Record<string, any>;
    description: string;
  }) => void;
}

export const DirectFeatureModal: React.FC<DirectFeatureModalProps> = ({
  isOpen,
  onClose,
  actionId,
  selection,
  onApplyFeature,
}) => {
  const [depth, setDepth] = useState<number>(25);
  const [diameter, setDiameter] = useState<number>(12);
  const [radius, setRadius] = useState<number>(3);
  const [distance, setDistance] = useState<number>(2);
  const [wallThickness, setWallThickness] = useState<number>(2.5);
  const [patternCount, setPatternCount] = useState<number>(4);
  const [patternSpacing, setPatternSpacing] = useState<number>(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    switch (actionId) {
      case 'extrude':
        onApplyFeature({
          type: 'extrude',
          name: `Extrude (${depth}mm)`,
          parameters: { depth, draftAngle: 0 },
          description: `Extruded solid by ${depth} mm from selected face`,
        });
        break;
      case 'cut':
        onApplyFeature({
          type: 'cut',
          name: `Pocket Cut (${depth}mm)`,
          parameters: { depth },
          description: `Internal pocket cut of ${depth} mm depth`,
        });
        break;
      case 'fillet':
        onApplyFeature({
          type: 'fillet',
          name: `Fillet (R ${radius}mm)`,
          parameters: { radius },
          description: `Applied ${radius} mm radius blend`,
        });
        break;
      case 'chamfer':
        onApplyFeature({
          type: 'chamfer',
          name: `Chamfer (${distance}mm × 45°)`,
          parameters: { distance, angle: 45 },
          description: `Beveled edge by ${distance} mm at 45 degrees`,
        });
        break;
      case 'hole':
        onApplyFeature({
          type: 'hole',
          name: `Hole (Ø${diameter}mm × ${depth}mm)`,
          parameters: { diameter, depth },
          description: `Drilled Ø${diameter} mm cylindrical bore`,
        });
        break;
      case 'shell':
        onApplyFeature({
          type: 'shell',
          name: `Shell (${wallThickness}mm)`,
          parameters: { wallThickness },
          description: `Hollowed body with ${wallThickness} mm wall thickness`,
        });
        break;
      case 'pattern':
        onApplyFeature({
          type: 'pattern',
          name: `Pattern (${patternCount}× @ ${patternSpacing}mm)`,
          parameters: { count: patternCount, spacing: patternSpacing },
          description: `Linear array of ${patternCount} instances`,
        });
        break;
      default:
        break;
    }
    onClose();
  };

  const getTitle = () => {
    switch (actionId) {
      case 'extrude': return 'Extrude Boss / Pad';
      case 'cut': return 'Cut / Pocket Extrusion';
      case 'fillet': return 'Apply Fillet (Round)';
      case 'chamfer': return 'Apply Chamfer (Bevel)';
      case 'hole': return 'Drill Parametric Hole';
      case 'shell': return 'Hollow Shell Body';
      case 'pattern': return 'Pattern Feature';
      default: return 'Direct CAD Operation';
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0B1E17] border border-[#00F5A0]/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 font-mono text-[#F0FDF4]">
        <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#00F5A0]" />
            <h3 className="font-bold text-sm uppercase tracking-wider">{getTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8CA89E] hover:text-[#F0FDF4] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {actionId === 'extrude' && (
            <div>
              <label className="text-[#8CA89E] block mb-1">Extrusion Depth (mm):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="300"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="flex-1 accent-[#00F5A0]"
                />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-20 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-2 py-1 text-center font-bold text-[#00F5A0]"
                />
              </div>
            </div>
          )}

          {actionId === 'cut' && (
            <div>
              <label className="text-[#8CA89E] block mb-1">Cut Pocket Depth (mm):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="150"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="flex-1 accent-[#38BDF8]"
                />
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-20 bg-[#07130F] border border-[rgba(56,189,248,0.3)] rounded px-2 py-1 text-center font-bold text-[#38BDF8]"
                />
              </div>
            </div>
          )}

          {actionId === 'fillet' && (
            <div>
              <label className="text-[#8CA89E] block mb-1">Fillet Radius R (mm):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.5"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="flex-1 accent-[#00F5A0]"
                />
                <input
                  type="number"
                  min="0.2"
                  max="50"
                  step="0.1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-20 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-2 py-1 text-center font-bold text-[#00F5A0]"
                />
              </div>
            </div>
          )}

          {actionId === 'chamfer' && (
            <div>
              <label className="text-[#8CA89E] block mb-1">Chamfer Distance (mm @ 45°):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="flex-1 accent-[#FBBF24]"
                />
                <input
                  type="number"
                  min="0.2"
                  max="50"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-20 bg-[#07130F] border border-[rgba(251,191,36,0.3)] rounded px-2 py-1 text-center font-bold text-[#FBBF24]"
                />
              </div>
            </div>
          )}

          {actionId === 'hole' && (
            <div className="space-y-3">
              <div>
                <label className="text-[#8CA89E] block mb-1">Hole Diameter Ø (mm):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                    className="flex-1 accent-[#00F5A0]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                    className="w-20 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-2 py-1 text-center font-bold text-[#00F5A0]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#8CA89E] block mb-1">Depth (mm):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    className="flex-1 accent-[#00F5A0]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    className="w-20 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-2 py-1 text-center font-bold text-[#00F5A0]"
                  />
                </div>
              </div>
            </div>
          )}

          {actionId === 'shell' && (
            <div>
              <label className="text-[#8CA89E] block mb-1">Wall Thickness (mm):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={wallThickness}
                  onChange={(e) => setWallThickness(Number(e.target.value))}
                  className="flex-1 accent-[#00F5A0]"
                />
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={wallThickness}
                  onChange={(e) => setWallThickness(Number(e.target.value))}
                  className="w-20 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-2 py-1 text-center font-bold text-[#00F5A0]"
                />
              </div>
            </div>
          )}

          {actionId === 'pattern' && (
            <div className="space-y-3">
              <div>
                <label className="text-[#8CA89E] block mb-1">Instance Count:</label>
                <input
                  type="number"
                  min="2"
                  max="24"
                  value={patternCount}
                  onChange={(e) => setPatternCount(Number(e.target.value))}
                  className="w-full bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-3 py-1.5 font-bold text-[#00F5A0]"
                />
              </div>
              <div>
                <label className="text-[#8CA89E] block mb-1">Pitch / Spacing (mm):</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={patternSpacing}
                  onChange={(e) => setPatternSpacing(Number(e.target.value))}
                  className="w-full bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-3 py-1.5 font-bold text-[#00F5A0]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(16,185,129,0.2)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#07130F] hover:bg-[#102B21] text-xs text-[#8CA89E] hover:text-[#F0FDF4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-[#00F5A0] hover:bg-[#00D68B] text-[#02140D] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Operation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
