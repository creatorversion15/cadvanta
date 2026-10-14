import React, { useState } from 'react';
import { CADPart, FeatureHistoryItem } from '../../types/cad';
import {
  Box,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sliders,
  Compass,
  Layers,
  Scissors,
  CircleDot,
  PenTool,
  RotateCw,
  Eye,
  EyeOff,
  Edit2,
  Check,
  Grid,
  Palette,
  Folder,
  ArrowUp,
  ArrowDown,
  Circle,
  FileCode2,
} from 'lucide-react';

interface ModelFeatureTreeProps {
  part: CADPart;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  onEditFeature: (feature: FeatureHistoryItem) => void;
  onToggleSuppressFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onRenameFeature?: (featureId: string, newName: string) => void;
  onReorderFeature?: (featureId: string, direction: 'up' | 'down') => void;
  onSelectPlane?: (plane: 'XY' | 'XZ' | 'YZ') => void;
  onOpenSketch?: (sketchId?: string) => void;
  onOpenMaterialSelector?: () => void;
  rollbackIndex: number;
  onSetRollbackIndex: (index: number) => void;
}

export const ModelFeatureTree: React.FC<ModelFeatureTreeProps> = ({
  part,
  selectedFeatureId,
  onSelectFeature,
  onEditFeature,
  onToggleSuppressFeature,
  onDeleteFeature,
  onRenameFeature,
  onReorderFeature,
  onSelectPlane,
  onOpenSketch,
  onOpenMaterialSelector,
  rollbackIndex,
  onSetRollbackIndex,
}) => {
  const [isOriginExpanded, setIsOriginExpanded] = useState<boolean>(true);
  const [isSketchesExpanded, setIsSketchesExpanded] = useState<boolean>(true);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState<boolean>(true);
  const [isBodiesExpanded, setIsBodiesExpanded] = useState<boolean>(true);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState<boolean>(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const features = part.features || [];

  const handleStartRename = (feat: FeatureHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(feat.id);
    setRenameValue(feat.name);
  };

  const handleSaveRename = (featId: string) => {
    if (renameValue.trim() && onRenameFeature) {
      onRenameFeature(featId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const getFeatureIcon = (type: FeatureHistoryItem['type']) => {
    switch (type) {
      case 'extrude':
      case 'base':
        return <Layers className="w-3.5 h-3.5 text-[#059669]" />;
      case 'revolve':
        return <RotateCw className="w-3.5 h-3.5 text-[#059669]" />;
      case 'cut':
        return <Scissors className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'bore':
      case 'bearing_seat':
        return <CircleDot className="w-3.5 h-3.5 text-[#D97706]" />;
      case 'fillet':
        return <span className="text-[10px] font-bold text-[#059669] px-1 bg-[#ECFDF5] rounded">R</span>;
      case 'chamfer':
        return <span className="text-[10px] font-bold text-[#D97706] px-1 bg-[#FEF3C7] rounded">∠</span>;
      case 'pattern':
        return <Grid className="w-3.5 h-3.5 text-[#7C3AED]" />;
      case 'keyway':
        return <span className="text-[10px] font-bold text-[#7C3AED] px-1 bg-[#F5F3FF] rounded">KW</span>;
      default:
        return <Box className="w-3.5 h-3.5 text-[#64748B]" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-[#E2E8F0] text-[#0F172A] select-none text-xs font-sans shadow-xs">
      {/* Tree Header */}
      <div className="p-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Folder className="w-4 h-4 text-[#059669] shrink-0" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#0F172A] truncate">
            Design Feature Tree
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0] shrink-0 font-medium">
          {features.length} Feat
        </span>
      </div>

      {/* Tree Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
        {/* 1. ROOT DOCUMENT */}
        <div
          onClick={() => onSelectFeature('root')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
            selectedFeatureId === 'root'
              ? 'bg-[#ECFDF5] text-[#065F46] font-bold border-l-2 border-[#059669]'
              : 'hover:bg-[#F1F5F9] text-[#1E293B]'
          }`}
          title="Root Model Component"
        >
          <Box className="w-3.5 h-3.5 text-[#059669]" />
          <span className="font-semibold truncate">Cadvanta Design — {part.name}</span>
        </div>

        {/* 2. ORIGIN & DATUM PLANES */}
        <div className="pt-0.5">
          <div
            onClick={() => setIsOriginExpanded(!isOriginExpanded)}
            className="flex items-center gap-1.5 px-2 py-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer font-medium"
          >
            {isOriginExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
            <Compass className="w-3.5 h-3.5 text-[#059669]" />
            <span>Origin</span>
          </div>

          {isOriginExpanded && (
            <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-3.5 my-1">
              {/* Planes */}
              {[
                { name: 'XY Plane (Top)', plane: 'XY' as const, color: 'text-[#059669]' },
                { name: 'XZ Plane (Front)', plane: 'XZ' as const, color: 'text-[#2563EB]' },
                { name: 'YZ Plane (Right)', plane: 'YZ' as const, color: 'text-[#D97706]' },
              ].map((p) => (
                <div
                  key={p.name}
                  onClick={() => {
                    onSelectPlane?.(p.plane);
                    onSelectFeature(`plane_${p.plane}`);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded cursor-pointer transition-colors ${
                    selectedFeatureId === `plane_${p.plane}`
                      ? 'bg-[#ECFDF5] text-[#065F46] font-semibold'
                      : 'hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.color.replace('text-', 'bg-')}`} />
                  <span>{p.name}</span>
                </div>
              ))}

              {/* Axes */}
              <div className="pt-1 text-[10px] text-[#94A3B8] uppercase font-mono px-2">Coordinate Axes</div>
              {[
                { name: 'X Axis (Red)', color: 'text-red-500' },
                { name: 'Y Axis (Green)', color: 'text-emerald-500' },
                { name: 'Z Axis (Blue)', color: 'text-blue-500' },
              ].map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-[#64748B] hover:bg-[#F1F5F9] rounded cursor-pointer"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${a.color.replace('text-', 'bg-')}`} />
                  <span>{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. SKETCHES */}
        <div className="pt-0.5">
          <div
            onClick={() => setIsSketchesExpanded(!isSketchesExpanded)}
            className="flex items-center justify-between px-2 py-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer font-medium"
          >
            <div className="flex items-center gap-1.5">
              {isSketchesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              )}
              <PenTool className="w-3.5 h-3.5 text-[#059669]" />
              <span>Sketches</span>
            </div>
            {onOpenSketch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSketch();
                }}
                className="text-[10px] text-[#059669] hover:underline font-semibold"
              >
                + New
              </button>
            )}
          </div>

          {isSketchesExpanded && (
            <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-3.5 my-1">
              <div
                onClick={() => onOpenSketch?.('sketch_1')}
                className="flex items-center justify-between px-2 py-1 text-[11px] hover:bg-[#ECFDF5] hover:text-[#065F46] rounded cursor-pointer text-[#475569] group"
              >
                <div className="flex items-center gap-1.5">
                  <FileCode2 className="w-3 h-3 text-[#059669]" />
                  <span>Sketch 1 (Base Profile)</span>
                </div>
                <span className="text-[10px] text-[#059669] font-mono opacity-0 group-hover:opacity-100 font-semibold">
                  Edit
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. FEATURES (EXTRUDE, REVOLVE, FILLET, HOLE, PATTERN, ETC.) */}
        <div className="pt-0.5">
          <div
            onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
            className="flex items-center justify-between px-2 py-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer font-medium"
          >
            <div className="flex items-center gap-1.5">
              {isFeaturesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              )}
              <Layers className="w-3.5 h-3.5 text-[#059669]" />
              <span>Features ({features.length})</span>
            </div>
          </div>

          {isFeaturesExpanded && (
            <div className="pl-3 space-y-1 my-1">
              {features.map((feat, index) => {
                const isSelected = selectedFeatureId === feat.id;
                const isSuppressed = feat.enabled === false;
                const isAfterRollback = index >= rollbackIndex;

                return (
                  <React.Fragment key={feat.id}>
                    {/* Rollback Bar Indicator */}
                    {index === rollbackIndex && (
                      <div
                        onClick={() => onSetRollbackIndex(index)}
                        className="py-1 flex items-center gap-2 cursor-ns-resize group"
                        title="CAD Rollback Bar: Drag or click to roll back features"
                      >
                        <div className="h-[2px] bg-[#2563EB] flex-1 group-hover:bg-[#1D4ED8]" />
                        <span className="text-[9px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                          ROLLBACK BAR
                        </span>
                        <div className="h-[2px] bg-[#2563EB] flex-1 group-hover:bg-[#1D4ED8]" />
                      </div>
                    )}

                    <div
                      onClick={() => onSelectFeature(feat.id)}
                      onDoubleClick={() => onEditFeature(feat)}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] shadow-xs'
                          : isAfterRollback
                          ? 'opacity-40 bg-white border-dashed border-[#E2E8F0] text-[#94A3B8]'
                          : isSuppressed
                          ? 'opacity-60 bg-[#F8FAFC] border-[#E2E8F0] line-through text-[#64748B]'
                          : 'bg-white border-[#F1F5F9] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="shrink-0">{getFeatureIcon(feat.type)}</div>

                        {renamingId === feat.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleSaveRename(feat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(feat.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.5 bg-white border border-[#059669] rounded text-xs text-[#0F172A] w-full font-sans outline-hidden"
                          />
                        ) : (
                          <div className="min-w-0">
                            <span className="font-semibold truncate block text-xs">
                              {feat.name}
                            </span>
                            {feat.description && (
                              <span className="text-[10px] text-[#64748B] truncate block">
                                {feat.description}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons (hover or selected) */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Reorder Up */}
                        {onReorderFeature && index > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderFeature(feat.id, 'up');
                            }}
                            className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A]"
                            title="Move feature up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                        )}
                        {/* Reorder Down */}
                        {onReorderFeature && index < features.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorderFeature(feat.id, 'down');
                            }}
                            className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A]"
                            title="Move feature down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}

                        {/* Rename */}
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(feat, e)}
                          className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A]"
                          title="Rename Feature"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Suppress / Unsuppress */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSuppressFeature(feat.id);
                          }}
                          className={`p-1 hover:bg-[#E2E8F0] rounded transition-colors ${
                            isSuppressed ? 'text-[#D97706]' : 'text-[#64748B] hover:text-[#059669]'
                          }`}
                          title={isSuppressed ? 'Unsuppress Feature' : 'Suppress Feature'}
                        >
                          {isSuppressed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFeature(feat.id);
                          }}
                          className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-[#94A3B8] transition-colors"
                          title="Delete Feature"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* End of Rollback Bar (if at bottom) */}
              {rollbackIndex >= features.length && (
                <div
                  onClick={() => onSetRollbackIndex(features.length)}
                  className="py-1 flex items-center gap-2 cursor-pointer group"
                  title="CAD Rollback Bar at end of model"
                >
                  <div className="h-[2px] bg-[#CBD5E1] flex-1 group-hover:bg-[#2563EB]" />
                  <span className="text-[9px] font-mono text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    END OF MODEL
                  </span>
                  <div className="h-[2px] bg-[#CBD5E1] flex-1 group-hover:bg-[#2563EB]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. SOLID BODIES */}
        <div className="pt-0.5">
          <div
            onClick={() => setIsBodiesExpanded(!isBodiesExpanded)}
            className="flex items-center gap-1.5 px-2 py-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer font-medium"
          >
            {isBodiesExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
            <Box className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Solid Bodies (1)</span>
          </div>

          {isBodiesExpanded && (
            <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-3.5 my-1">
              <div
                onClick={() => onSelectFeature('body_1')}
                className={`flex items-center justify-between px-2 py-1 text-[11px] rounded cursor-pointer transition-colors ${
                  selectedFeatureId === 'body_1'
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                    : 'hover:bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                <span>Solid Body 1</span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {((part.calculatedMetrics?.volume || 100) * 0.001).toFixed(2)} dm³
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 6. MATERIALS */}
        <div className="pt-0.5">
          <div
            onClick={() => setIsMaterialsExpanded(!isMaterialsExpanded)}
            className="flex items-center justify-between px-2 py-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded cursor-pointer font-medium"
          >
            <div className="flex items-center gap-1.5">
              {isMaterialsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              )}
              <Palette className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Material</span>
            </div>
            {onOpenMaterialSelector && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMaterialSelector();
                }}
                className="text-[10px] text-[#059669] hover:underline font-semibold"
              >
                Change
              </button>
            )}
          </div>

          {isMaterialsExpanded && (
            <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-3.5 my-1">
              <div
                onClick={onOpenMaterialSelector}
                className="flex items-center justify-between px-2 py-1 text-[11px] hover:bg-[#FEF3C7] rounded cursor-pointer text-[#92400E] font-medium"
                title="Click to edit material in properties panel"
              >
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2 h-2 fill-current text-[#D97706]" />
                  <span>{part.material?.name || 'AISI 304 Stainless Steel'}</span>
                </div>
                <span className="text-[10px] text-[#B45309] font-mono">
                  {part.material?.density || 8.0} g/cm³
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
