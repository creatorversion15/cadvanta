import React, { useState, useMemo } from 'react';
import { CADPart, FeatureHistoryItem, ModelVersionSnapshot } from '../../types/cad';
import {
  History,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronRight,
  Zap,
  Layers,
  MoveHorizontal,
  CheckCircle2,
  RefreshCw,
  Cpu,
  CornerDownRight,
  GitCommit,
  Plus,
  Trash2,
  Scissors,
  Box,
  CircleDot,
  RotateCcw,
  Sparkles,
  Clock,
  Tag,
  Check,
} from 'lucide-react';
import { ParametricFeatureEngine, ParametricNode } from '../../engine/parametricFeatureEngine';
import { convertParametricToBRep, directEditPushPullFace, BRepBody } from '../../engine/brepKernel';

interface DesignHistoryProps {
  part: CADPart;
  onPartUpdate?: (updatedPart: CADPart) => void;
  versions?: ModelVersionSnapshot[];
  onRestoreVersion?: (snapshot: ModelVersionSnapshot) => void;
  onSaveManualSnapshot?: (title?: string) => void;
  onDeleteVersion?: (versionId: string) => void;
}

export const DesignHistory: React.FC<DesignHistoryProps> = ({
  part,
  onPartUpdate,
  versions = [],
  onRestoreVersion,
  onSaveManualSnapshot,
  onDeleteVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'tree' | 'direct_edit' | 'brep'>('versions');
  const [manualSnapshotTitle, setManualSnapshotTitle] = useState<string>('');
  const [inspectVersionId, setInspectVersionId] = useState<string | null>(null);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [rollbackIndex, setRollbackIndex] = useState<number>(part.features?.length ? part.features.length - 1 : 0);
  const [selectedFaceId, setSelectedFaceId] = useState<string>('face_planar_top');
  const [pushPullOffset, setPushPullOffset] = useState<number>(5.0);
  const [directEditFeedback, setDirectEditFeedback] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [lastRecomputeStats, setLastRecomputeStats] = useState<{
    timeMs: number;
    savedMs: number;
    recomputedCount: number;
  }>({
    timeMs: 2.4,
    savedMs: 28.6,
    recomputedCount: 1,
  });

  // Maintain Engine Instance
  const engine = useMemo(() => {
    return new ParametricFeatureEngine(part);
  }, [part.id]);

  // Convert to B-Rep for inspection
  const brepBody: BRepBody = useMemo(() => {
    return convertParametricToBRep(part);
  }, [part]);

  const nodes = engine.getNodes();

  const handleRollback = (index: number) => {
    setRollbackIndex(index);
    const result = engine.setRollbackIndex(index, part);
    setLastRecomputeStats({
      timeMs: result.totalRecomputeTimeMs,
      savedMs: result.incrementalTimeSavedMs,
      recomputedCount: result.recomputedNodeIds.length,
    });
    if (onPartUpdate) {
      onPartUpdate(result.part);
    }
  };

  const handleToggleSuppression = (featureId: string) => {
    const result = engine.toggleFeatureSuppression(featureId, part);
    setLastRecomputeStats({
      timeMs: result.totalRecomputeTimeMs,
      savedMs: result.incrementalTimeSavedMs,
      recomputedCount: result.recomputedNodeIds.length,
    });
    if (onPartUpdate) {
      onPartUpdate(result.part);
    }
  };

  const handleParamChange = (featureId: string, paramKey: string, value: number) => {
    const result = engine.updateFeatureParameters(featureId, { [paramKey]: value }, part);
    setLastRecomputeStats({
      timeMs: result.totalRecomputeTimeMs,
      savedMs: result.incrementalTimeSavedMs,
      recomputedCount: result.recomputedNodeIds.length,
    });
    if (onPartUpdate) {
      onPartUpdate(result.part);
    }
  };

  const handleAddFeaturePreset = (type: 'extrude' | 'cut' | 'fillet' | 'chamfer' | 'pattern') => {
    let featureData: {
      name: string;
      type: FeatureHistoryItem['type'];
      description: string;
      parameters: Record<string, any>;
    };

    if (type === 'extrude') {
      featureData = {
        name: 'Extrude Boss / Stud',
        type: 'extrude',
        description: 'Planar cylindrical boss protrusion Ø40mm × 25mm length',
        parameters: { boss_diameter: 40, boss_length: 25 },
      };
    } else if (type === 'cut') {
      featureData = {
        name: 'Bore Cut / Relief',
        type: 'cut',
        description: 'Through-hole bore cut Ø20mm depth 30mm',
        parameters: { inner_diameter: 20, cut_depth: 30 },
      };
    } else if (type === 'fillet') {
      featureData = {
        name: 'Corner Fillet Blend',
        type: 'fillet',
        description: 'Stress-relief continuous curvature fillet R3.0mm',
        parameters: { fillet_radius: 3.0 },
      };
    } else if (type === 'chamfer') {
      featureData = {
        name: 'Lead-in Chamfer 45°',
        type: 'chamfer',
        description: 'Edge deburr 1.5mm × 45° transition',
        parameters: { chamfer_size: 1.5 },
      };
    } else {
      featureData = {
        name: 'Radial Circular Pattern',
        type: 'pattern',
        description: '6-Instance polar circular pattern on PCD Ø80mm',
        parameters: { hole_count: 6, pitch_circle_diameter: 80, hole_diameter: 8 },
      };
    }

    const res = engine.addFeature(featureData, part);
    setRollbackIndex(engine.getNodes().length - 1);
    setLastRecomputeStats({
      timeMs: res.totalRecomputeTimeMs,
      savedMs: res.incrementalTimeSavedMs,
      recomputedCount: res.recomputedNodeIds.length,
    });
    setShowAddMenu(false);
    if (onPartUpdate) {
      onPartUpdate(res.part);
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    const res = engine.deleteFeature(featureId, part);
    setRollbackIndex(engine.getNodes().length - 1);
    setLastRecomputeStats({
      timeMs: res.totalRecomputeTimeMs,
      savedMs: res.incrementalTimeSavedMs,
      recomputedCount: res.recomputedNodeIds.length,
    });
    if (onPartUpdate) {
      onPartUpdate(res.part);
    }
  };

  const handleDirectEditPushPull = () => {
    const res = directEditPushPullFace(brepBody, selectedFaceId, pushPullOffset);
    setDirectEditFeedback(res.message);

    // Apply equivalent parametric delta to part
    if (onPartUpdate && res.success) {
      const p = { ...part.parameters };
      if (selectedFaceId.includes('top') || selectedFaceId.includes('cyl')) {
        if (p.total_length) p.total_length = Math.max(10, Number(p.total_length) + pushPullOffset);
        if (p.length) p.length = Math.max(10, Number(p.length) + pushPullOffset);
      } else {
        if (p.main_diameter) p.main_diameter = Math.max(5, Number(p.main_diameter) + pushPullOffset);
        if (p.width) p.width = Math.max(5, Number(p.width) + pushPullOffset);
      }
      onPartUpdate({
        ...part,
        parameters: p,
      });
    }
  };

  const getFeatureIcon = (type: FeatureHistoryItem['type']) => {
    switch (type) {
      case 'extrude':
      case 'base':
        return '■';
      case 'revolve':
        return '◐';
      case 'cut':
        return '✂';
      case 'pattern':
        return '∷';
      case 'fillet':
      case 'chamfer':
        return '◜';
      case 'bore':
      case 'thread':
        return '◎';
      case 'bend':
      case 'flange':
        return '⌐';
      case 'loft':
      case 'sweep':
        return '∿';
      default:
        return '◆';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#071510] rounded-xl border border-[#CBD5E1] dark:border-[rgba(16,185,129,0.2)] shadow-sm overflow-hidden text-[#0F172A] dark:text-[#F0FDF4]">
      {/* Panel Top Header */}
      <div className="p-3 border-b border-[#E2E8F0] dark:border-[rgba(16,185,129,0.18)] bg-[#F8FAFC] dark:bg-[#040E0A] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0284C7] dark:text-[#00F5A0]" />
            <h2 className="text-xs font-bold font-mono text-[#0F172A] dark:text-[#F0FDF4] tracking-wide uppercase">
              Parametric Feature Kernel
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#0284C7] dark:text-[#00F5A0] bg-[#E0F2FE] dark:bg-[#102B21] px-2 py-0.5 rounded border border-[#BAE6FD] dark:border-[#00F5A0]/30 font-bold">
            <Zap className="w-3 h-3 text-[#0284C7] dark:text-[#00F5A0]" />
            <span>DAG ACTIVE</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-[#F1F5F9] dark:bg-[#071510] p-1 rounded-lg border border-[#E2E8F0] dark:border-[rgba(16,185,129,0.15)] text-[10px] font-mono">
          <button
            id="tab-versions"
            onClick={() => setActiveTab('versions')}
            className={`py-1 px-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'versions'
                ? 'bg-[#0284C7] text-white dark:bg-[#00F5A0] dark:text-[#030A07] font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <span>Versions</span>
            <span
              className={`text-[9px] px-1 rounded font-bold ${
                activeTab === 'versions'
                  ? 'bg-white/20 text-white dark:bg-[#030A07]/30 dark:text-[#030A07]'
                  : 'bg-slate-200 text-[#475569] dark:bg-[#102B21] dark:text-[#00F5A0]'
              }`}
            >
              {versions.length}
            </span>
          </button>
          <button
            id="tab-feature-tree"
            onClick={() => setActiveTab('tree')}
            className={`py-1 px-1 rounded text-center transition-all cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-[#0284C7] text-white dark:bg-[#00F5A0] dark:text-[#030A07] font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            Tree
          </button>
          <button
            id="tab-direct-edit"
            onClick={() => setActiveTab('direct_edit')}
            className={`py-1 px-1 rounded text-center transition-all cursor-pointer ${
              activeTab === 'direct_edit'
                ? 'bg-[#0284C7] text-white dark:bg-[#00F5A0] dark:text-[#030A07] font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            Direct
          </button>
          <button
            id="tab-brep-nurbs"
            onClick={() => setActiveTab('brep')}
            className={`py-1 px-1 rounded text-center transition-all cursor-pointer ${
              activeTab === 'brep'
                ? 'bg-[#0284C7] text-white dark:bg-[#00F5A0] dark:text-[#030A07] font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            B-Rep
          </button>
        </div>
      </div>

      {/* Incremental Recompute Telemetry Bar */}
      <div className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#0B1E17] border-b border-[#E2E8F0] dark:border-[rgba(16,185,129,0.15)] flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-[#8CA89E]">
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 text-[#0284C7] dark:text-[#00F5A0] animate-spin-slow" />
          <span>Incremental: <strong className="text-[#0284C7] dark:text-[#00F5A0]">{lastRecomputeStats.timeMs} ms</strong></span>
        </div>
        <div>
          <span>Saved: <strong className="text-[#0284C7] dark:text-[#00F5A0]">{lastRecomputeStats.savedMs} ms</strong> (Lazy DAG)</span>
        </div>
      </div>

      {/* Tab 0: Model History & Version Snapshots */}
      {activeTab === 'versions' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Top Manual Snapshot Bar */}
          <div className="p-2.5 rounded-xl bg-[#040E0A] border border-[rgba(16,185,129,0.25)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00F5A0]">
                <Clock className="w-3.5 h-3.5" />
                <span>Snapshots & Revisions</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                {versions.length} SAVED
              </span>
            </div>

            {/* Manual snapshot creation form */}
            <div className="flex items-center gap-1.5">
              <input
                id="input-manual-snapshot-title"
                type="text"
                value={manualSnapshotTitle}
                onChange={(e) => setManualSnapshotTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSaveManualSnapshot) {
                    onSaveManualSnapshot(manualSnapshotTitle.trim() || undefined);
                    setManualSnapshotTitle('');
                  }
                }}
                placeholder="Label milestone (e.g. Pre-fillet Rev 2)..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#071510] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] placeholder-[#4E6B60] focus:border-[#00F5A0] focus:outline-none"
              />
              <button
                id="btn-save-manual-snapshot"
                type="button"
                onClick={() => {
                  if (onSaveManualSnapshot) {
                    onSaveManualSnapshot(manualSnapshotTitle.trim() || undefined);
                    setManualSnapshotTitle('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono font-bold text-xs flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(0,245,160,0.25)] shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Snapshot</span>
              </button>
            </div>
          </div>

          {/* Version List */}
          {versions.length === 0 ? (
            <div className="p-6 text-center text-[#8CA89E] font-mono text-xs border border-dashed border-[rgba(16,185,129,0.2)] rounded-xl">
              No snapshots recorded yet. Any major edit or manual snapshot will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((ver, idx) => {
                const isCurrent = idx === 0;
                const isInspecting = inspectVersionId === ver.id;

                const getActionBadge = () => {
                  switch (ver.actionType) {
                    case 'ai_prompt':
                      return { label: 'AI Prompt', bg: 'bg-emerald-950/80 text-[#00F5A0] border-[#00F5A0]/40', icon: Sparkles };
                    case 'param_edit':
                      return { label: 'Param Edit', bg: 'bg-[#102B21] text-[#34EEA9] border-[rgba(16,185,129,0.3)]', icon: Sliders };
                    case 'preset_change':
                      return { label: 'Preset', bg: 'bg-[#0D221A] text-[#00D9FF] border-[#00D9FF]/30', icon: Box };
                    case 'material_change':
                      return { label: 'Material', bg: 'bg-[#18261F] text-[#F59E0B] border-[#F59E0B]/30', icon: Zap };
                    case 'restore':
                      return { label: 'Restored', bg: 'bg-[#142A22] text-[#A7F3D0] border-[#34D399]/40', icon: RotateCcw };
                    default:
                      return { label: 'Milestone', bg: 'bg-[#0B1E17] text-[#F0FDF4] border-[rgba(16,185,129,0.3)]', icon: Tag };
                  }
                };

                const badge = getActionBadge();
                const IconComponent = badge.icon;

                return (
                  <div
                    key={ver.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#081B13] border-[#00F5A0]/50 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                        : 'bg-[#040E0A] hover:bg-[#071510] border-[rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {/* Header line: Tag, Action Badge, Time */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#00F5A0] bg-[#102B21] px-1.5 py-0.5 rounded border border-[#00F5A0]/30">
                          {ver.versionTag}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 font-semibold ${badge.bg}`}>
                          <IconComponent className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8CA89E]">
                        <span>{ver.formattedTime}</span>
                        {onDeleteVersion && versions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteVersion(ver.id)}
                            className="p-1 rounded text-[#8CA89E] hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-2">
                      <h4 className="font-mono text-xs font-bold text-[#F0FDF4] leading-snug">
                        {ver.title}
                      </h4>
                      <p className="text-[11px] text-[#8CA89E] font-mono mt-0.5">
                        {ver.part.name} • {ver.part.material?.name || 'Default Material'} ({ver.part.part_type})
                      </p>
                    </div>

                    {/* Parameter diff pills */}
                    {ver.changedParameters && ver.changedParameters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {ver.changedParameters.slice(0, 3).map((diff, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#030A07] text-[#34EEA9] border border-[rgba(16,185,129,0.2)]"
                          >
                            {diff.param.replace(/_/g, ' ')}: {diff.from} → <strong>{diff.to}</strong>
                          </span>
                        ))}
                        {ver.changedParameters.length > 3 && (
                          <span className="text-[9px] font-mono px-1 py-0.5 text-[#8CA89E]">
                            +{ver.changedParameters.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Collapsible inspect details */}
                    {isInspecting && (
                      <div className="p-2 mb-2 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.18)] text-[10px] font-mono space-y-1">
                        <div className="text-[#8CA89E] font-bold uppercase mb-1">Snapshot Parameters:</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[#A7F3D0]">
                          {Object.entries(ver.part.parameters || {}).slice(0, 8).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-[rgba(16,185,129,0.1)] py-0.5">
                              <span className="text-[#8CA89E] truncate">{k}:</span>
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions row: Restore & Inspect */}
                    <div className="flex items-center justify-between pt-1 border-t border-[rgba(16,185,129,0.15)]">
                      <button
                        type="button"
                        onClick={() => setInspectVersionId(isInspecting ? null : ver.id)}
                        className="text-[10px] font-mono text-[#8CA89E] hover:text-[#00F5A0] transition-colors cursor-pointer"
                      >
                        {isInspecting ? '▲ Hide Specs' : '▼ Inspect Specs'}
                      </button>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#00F5A0] font-bold px-2 py-0.5 rounded bg-[#102B21] border border-[#00F5A0]/30">
                          <Check className="w-3 h-3 text-[#00F5A0]" />
                          <span>CURRENT</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRestoreVersion && onRestoreVersion(ver)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono font-bold text-[11px] transition-all shadow-[0_0_8px_rgba(0,245,160,0.2)] active:scale-98 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore Version</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Parametric Feature Tree */}
      {activeTab === 'tree' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Add Operation Bar & Rollback */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,245,160,0.25)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Parametric Operation</span>
              </button>

              {showAddMenu && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-[#0A1D16] border border-[#00F5A0]/40 rounded-xl shadow-2xl z-20 space-y-1 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => handleAddFeaturePreset('extrude')}
                    className="w-full p-1.5 rounded-lg hover:bg-[#102B21] text-left text-xs font-mono text-[#F0FDF4] flex items-center gap-2 cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <div>
                      <span className="font-bold block">Extrude Boss</span>
                      <span className="text-[10px] text-[#8CA89E]">Add cylindrical boss / flange stud</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddFeaturePreset('cut')}
                    className="w-full p-1.5 rounded-lg hover:bg-[#102B21] text-left text-xs font-mono text-[#F0FDF4] flex items-center gap-2 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <div>
                      <span className="font-bold block">Extrude Cut / Bore</span>
                      <span className="text-[10px] text-[#8CA89E]">Internal bore or keyway pocket</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddFeaturePreset('fillet')}
                    className="w-full p-1.5 rounded-lg hover:bg-[#102B21] text-left text-xs font-mono text-[#F0FDF4] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#00F5A0]">◜</span>
                    <div>
                      <span className="font-bold block">Edge Fillet Blend</span>
                      <span className="text-[10px] text-[#8CA89E]">Radius blend for stress reduction</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddFeaturePreset('chamfer')}
                    className="w-full p-1.5 rounded-lg hover:bg-[#102B21] text-left text-xs font-mono text-[#F0FDF4] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#00F5A0]">◤</span>
                    <div>
                      <span className="font-bold block">Lead-in Chamfer 45°</span>
                      <span className="text-[10px] text-[#8CA89E]">Machined bevel edge deburr</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddFeaturePreset('pattern')}
                    className="w-full p-1.5 rounded-lg hover:bg-[#102B21] text-left text-xs font-mono text-[#F0FDF4] flex items-center gap-2 cursor-pointer"
                  >
                    <CircleDot className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <div>
                      <span className="font-bold block">Polar Circular Pattern</span>
                      <span className="text-[10px] text-[#8CA89E]">Array bolt circle pattern</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleRollback(nodes.length - 1)}
              className="py-1.5 px-2.5 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#00F5A0] font-mono text-xs cursor-pointer shrink-0 transition-colors"
              title="Roll to end of history"
            >
              Roll to End
            </button>
          </div>

          {/* Rollback Instruction Banner */}
          <div className="text-[10px] font-mono text-[#8CA89E] bg-[#040E0A] p-2 rounded border border-[rgba(16,185,129,0.15)] flex items-center justify-between">
            <span>Rollback Bar: <strong>Index {rollbackIndex + 1}/{nodes.length}</strong></span>
            <span>Active: <strong className="text-[#00F5A0]">{nodes.filter(n => !n.suppressed && n.enabled).length}</strong> operations</span>
          </div>

          <div className="space-y-1.5">
            {nodes.map((feat, idx) => {
              const isPastRollback = idx > rollbackIndex;
              const isExpanded = expandedFeatureId === feat.id;

              return (
                <div key={feat.id} className="relative">
                  {/* Feature Node Box */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all text-xs font-mono group ${
                      isPastRollback
                        ? 'bg-[#040E0A]/40 border-[rgba(16,185,129,0.08)] opacity-40'
                        : feat.suppressed
                        ? 'bg-[#071510] border-amber-500/30 opacity-60'
                        : 'bg-[#0B1E17] hover:bg-[#102B21] border-[rgba(16,185,129,0.22)] hover:border-[#00F5A0]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Node Type Glyph */}
                        <div
                          onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                          className="w-6 h-6 rounded bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer hover:border-[#00F5A0]"
                        >
                          {getFeatureIcon(feat.type)}
                        </div>

                        <div
                          onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                          className="min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#F0FDF4] group-hover:text-[#00F5A0] transition-colors truncate">
                              {feat.name}
                            </span>
                            {feat.dependencies.length > 0 && (
                              <span className="text-[9px] text-[#8CA89E] font-normal">
                                ← {feat.dependencies.join(',')}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8CA89E] truncate">
                            {feat.description}
                          </div>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Recompute Execution Time */}
                        <span className="text-[9px] text-[#8CA89E] bg-[#040E0A] px-1.5 py-0.5 rounded border border-[rgba(16,185,129,0.15)] font-mono">
                          {feat.executionTimeMs}ms
                        </span>

                        {/* Suppression Toggle Button */}
                        <button
                          onClick={() => handleToggleSuppression(feat.id)}
                          title={feat.suppressed ? 'Unsuppress Feature' : 'Suppress Feature'}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            feat.suppressed
                              ? 'text-amber-400 hover:bg-amber-950/30'
                              : 'text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21]'
                          }`}
                        >
                          {feat.suppressed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Rollback to Here Button */}
                        <button
                          onClick={() => handleRollback(idx)}
                          title="Roll back model to this state"
                          className="text-[9px] px-1.5 py-0.5 rounded bg-[#040E0A] hover:bg-[#00F5A0] hover:text-[#030A07] text-[#8CA89E] border border-[rgba(16,185,129,0.2)] transition-all cursor-pointer"
                        >
                          Rollback
                        </button>

                        {/* Delete Feature Button (if not only base feature) */}
                        {nodes.length > 1 && (
                          <button
                            onClick={() => handleDeleteFeature(feat.id)}
                            title="Delete this operation"
                            className="p-1 rounded text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Feature Parameter Editor */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-[rgba(16,185,129,0.15)] space-y-2 bg-[#040E0A] p-2 rounded">
                        <div className="text-[10px] text-[#00F5A0] font-bold flex items-center gap-1">
                          <Sliders className="w-3 h-3" />
                          <span>Parametric Dimensions</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(feat.parameters).map(([key, val]) => (
                            <div key={key} className="space-y-0.5">
                              <label className="text-[9px] text-[#8CA89E] uppercase tracking-wider block truncate">
                                {key.replace(/_/g, ' ')}
                              </label>
                              <input
                                type="number"
                                value={typeof val === 'number' ? val : 0}
                                onChange={(e) => handleParamChange(feat.id, key, parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded px-2 py-1 text-xs text-[#00F5A0] font-mono focus:border-[#00F5A0] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Rollback Bar indicator */}
                  {idx === rollbackIndex && idx < nodes.length - 1 && (
                    <div className="my-1 flex items-center gap-2">
                      <div className="h-[2px] flex-1 bg-amber-400"></div>
                      <span className="text-[9px] font-mono text-amber-400 font-bold tracking-wider uppercase px-1 bg-[#040E0A] border border-amber-400/40 rounded">
                        ◄ Rollback State (Downstream Frozen)
                      </span>
                      <div className="h-[2px] flex-1 bg-amber-400"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Direct-Edit Mode (Push/Pull Faces) */}
      {activeTab === 'direct_edit' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
          <div className="p-2.5 bg-[#0B1E17] rounded-lg border border-[rgba(16,185,129,0.2)] text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#00F5A0] font-bold">
              <MoveHorizontal className="w-4 h-4" />
              <span>Direct-Edit Face Push / Pull</span>
            </div>
            <p className="text-[11px] text-[#8CA89E] leading-relaxed font-sans">
              Interact directly with B-Rep boundary faces without altering the upstream sketch tree. Translates topology along surface normal vectors.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[#8CA89E] uppercase tracking-wider block">
              Target Boundary Face
            </label>
            <select
              value={selectedFaceId}
              onChange={(e) => setSelectedFaceId(e.target.value)}
              className="w-full bg-[#040E0A] border border-[rgba(16,185,129,0.25)] rounded-lg p-2 text-xs text-[#F0FDF4] font-mono outline-none"
            >
              {Array.from(brepBody.faces.values()).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} ({f.surfaceType}, {f.areaMm2.toFixed(0)} mm², {f.continuity})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#8CA89E]">Normal Offset Distance:</span>
              <span className="text-[#00F5A0] font-bold">{pushPullOffset > 0 ? `+${pushPullOffset}` : pushPullOffset} mm</span>
            </div>
            <input
              type="range"
              min={-20}
              max={40}
              step={1}
              value={pushPullOffset}
              onChange={(e) => setPushPullOffset(parseFloat(e.target.value))}
              className="w-full accent-[#00F5A0] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8CA89E]">
              <span>-20 mm (Pull/Cut)</span>
              <span>0 mm</span>
              <span>+40 mm (Push/Extrude)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectEditPushPull}
            className="w-full py-2 px-3 rounded-lg bg-[#00F5A0] hover:bg-[#00D68C] text-[#030A07] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,245,160,0.3)] cursor-pointer transition-all"
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Apply Direct Face Push/Pull</span>
          </button>

          {directEditFeedback && (
            <div className="p-2.5 bg-[#040E0A] rounded-lg border border-[#00F5A0]/40 text-[11px] text-[#00F5A0] font-sans">
              {directEditFeedback}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: B-Rep & NURBS Topology Inspector */}
      {activeTab === 'brep' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
          <div className="p-2.5 bg-[#040E0A] rounded-lg border border-[rgba(16,185,129,0.2)] space-y-2">
            <div className="text-[#00F5A0] font-bold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>B-Rep Topological Manifest</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#071510] p-2 rounded border border-[rgba(16,185,129,0.15)]">
                <span className="text-[#8CA89E] block">Vertices:</span>
                <strong className="text-[#00F5A0]">{brepBody.vertices.size} points</strong>
              </div>
              <div className="bg-[#071510] p-2 rounded border border-[rgba(16,185,129,0.15)]">
                <span className="text-[#8CA89E] block">Trimmed Edges:</span>
                <strong className="text-[#00F5A0]">{brepBody.edges.size} curves</strong>
              </div>
              <div className="bg-[#071510] p-2 rounded border border-[rgba(16,185,129,0.15)]">
                <span className="text-[#8CA89E] block">NURBS Faces:</span>
                <strong className="text-[#00F5A0]">{brepBody.faces.size} surfaces</strong>
              </div>
              <div className="bg-[#071510] p-2 rounded border border-[rgba(16,185,129,0.15)]">
                <span className="text-[#8CA89E] block">Closed Solids:</span>
                <strong className="text-[#00F5A0]">{brepBody.solids.size} body</strong>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] text-[#8CA89E] uppercase tracking-wider">
              Surfaces & Curvature Continuity
            </div>
            {Array.from(brepBody.faces.values()).map((f) => (
              <div
                key={f.id}
                className="p-2 bg-[#0B1E17] rounded border border-[rgba(16,185,129,0.15)] text-[11px] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-[#F0FDF4]">{f.id}</div>
                  <div className="text-[10px] text-[#8CA89E]">
                    {f.surfaceType.toUpperCase()} • Area: {f.areaMm2.toFixed(1)} mm²
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] font-bold text-[10px]">
                    {f.continuity}
                  </span>
                  <div className="text-[9px] text-[#8CA89E] mt-0.5">
                    H: {f.curvature.mean.toFixed(3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
