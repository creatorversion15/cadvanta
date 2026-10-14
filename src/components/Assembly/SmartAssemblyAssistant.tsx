import React, { useState, useMemo } from 'react';
import { AssemblyComponent, AssemblyConstraint } from '../../types/cad';
import {
  analyzeSmartAssemblyMates,
  SmartMateSuggestion,
} from '../../engine/smartAssemblyAssistant';
import {
  Sparkles,
  Link,
  CheckCircle2,
  Sliders,
  Filter,
  ArrowRight,
  Layers,
  Crosshair,
  Compass,
  Zap,
  Info,
  ShieldCheck,
  Check,
  Activity,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface SmartAssemblyAssistantProps {
  components: AssemblyComponent[];
  constraints: AssemblyConstraint[];
  onApplyMate: (suggestion: SmartMateSuggestion, customValue?: number) => void;
  onApplyAllHighConfidence: (suggestions: SmartMateSuggestion[]) => void;
  onSelectComponentPair?: (compAId: string, compBId: string) => void;
}

export const SmartAssemblyAssistant: React.FC<SmartAssemblyAssistantProps> = ({
  components,
  constraints,
  onApplyMate,
  onApplyAllHighConfidence,
  onSelectComponentPair,
}) => {
  const [proximityLimit, setProximityLimit] = useState<number>(250);
  const [filterType, setFilterType] = useState<
    'all' | 'unapplied' | 'high_confidence' | 'concentric' | 'coincident'
  >('all');
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>('all');
  const [showFeatureCatalog, setShowFeatureCatalog] = useState<boolean>(false);
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [recentlyAppliedId, setRecentlyAppliedId] = useState<string | null>(null);

  // Run the smart geometric proximity and feature analysis
  const analysis = useMemo(() => {
    return analyzeSmartAssemblyMates(components, constraints, proximityLimit);
  }, [components, constraints, proximityLimit]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    return analysis.suggestions.filter((s) => {
      // Component filter
      if (selectedCompFilter !== 'all') {
        if (s.componentIdA !== selectedCompFilter && s.componentIdB !== selectedCompFilter) {
          return false;
        }
      }

      // Type / Status filter
      if (filterType === 'unapplied') return !s.isApplied;
      if (filterType === 'high_confidence') return s.confidence >= 85;
      if (filterType === 'concentric') return s.suggestedType === 'concentric';
      if (filterType === 'coincident') return s.suggestedType === 'coincident';

      return true;
    });
  }, [analysis.suggestions, filterType, selectedCompFilter]);

  const highConfidenceUnapplied = useMemo(() => {
    return analysis.suggestions.filter((s) => s.confidence >= 85 && !s.isApplied);
  }, [analysis.suggestions]);

  const handleApplySingle = (s: SmartMateSuggestion) => {
    const val = customValues[s.id] !== undefined ? customValues[s.id] : s.suggestedValue;
    onApplyMate(s, val);
    setRecentlyAppliedId(s.id);
    setTimeout(() => {
      setRecentlyAppliedId((curr) => (curr === s.id ? null : curr));
    }, 2000);
  };

  const handleApplyBatch = () => {
    if (highConfidenceUnapplied.length === 0) return;
    onApplyAllHighConfidence(highConfidenceUnapplied);
  };

  const handleCustomValueChange = (suggestionId: string, val: number) => {
    setCustomValues((prev) => ({
      ...prev,
      [suggestionId]: val,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Smart Assembly Spotlight Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#071E14] via-[#0B2B1E] to-[#071E14] border border-[#00F5A0]/40 shadow-[0_4px_24px_rgba(0,245,160,0.14)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Smart Assembly AI Assistant</span>
              </span>
              <span className="text-[10px] font-mono text-[#8CA89E] font-bold">
                ISO 286 / DIN Standard Fits
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold font-mono text-[#F0FDF4] leading-tight">
              Automatic Constraint Inference from Geometry & Proximity
            </h3>

            <p className="text-xs text-[#8CA89E] font-sans leading-relaxed">
              Detects cylindrical journal fits, shaft shoulders, bearing seats, and pin joints based
              on 3D axial alignment and diameter tolerances.
            </p>
          </div>

          {/* Quick Metrics & Auto-Apply Action */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="p-3 bg-[#030A07]/80 rounded-xl border border-[rgba(16,185,129,0.25)] flex items-center gap-3 font-mono shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#0B1E17] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-[#8CA89E] uppercase tracking-wider">Assembly Cohesion</div>
                <div className="text-base font-bold text-[#00F5A0]">
                  {analysis.assemblyCohesionScore}%
                </div>
                <div className="text-[9px] text-[#8CA89E] truncate max-w-[120px]">
                  {analysis.kinematicReadiness}
                </div>
              </div>
            </div>

            {highConfidenceUnapplied.length > 0 && (
              <button
                type="button"
                onClick={handleApplyBatch}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-mono font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,160,0.35)] active:scale-95 cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Apply All High-Confidence ({highConfidenceUnapplied.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="p-3.5 bg-[#071510] border border-[rgba(16,185,129,0.2)] rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              All ({analysis.totalSuggestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unapplied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterType === 'unapplied'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              <span>Pending ({analysis.unappliedCount})</span>
              {analysis.unappliedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('high_confidence')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'high_confidence'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              High Confidence (≥85%)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('concentric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'concentric'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              Concentric / Coaxial
            </button>
            <button
              type="button"
              onClick={() => setFilterType('coincident')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'coincident'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              Coincident / Planar
            </button>
          </div>

          {/* Component Filter & Feature Catalog Button */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCompFilter}
              onChange={(e) => setSelectedCompFilter(e.target.value)}
              className="h-8 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4] focus:outline-none focus:border-[#00F5A0] cursor-pointer"
            >
              <option value="all">All Components</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowFeatureCatalog(!showFeatureCatalog)}
              className={`h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showFeatureCatalog
                  ? 'bg-[#102B21] border-[#00F5A0] text-[#00F5A0]'
                  : 'bg-[#0B1E17] border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showFeatureCatalog ? 'Hide Features' : 'Detected Features'}</span>
            </button>
          </div>
        </div>

        {/* Proximity Sensitivity Slider */}
        <div className="flex items-center gap-3 pt-1 border-t border-[rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8CA89E] shrink-0">
            <Sliders className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>Proximity Threshold:</span>
          </div>
          <input
            type="range"
            min="50"
            max="400"
            step="10"
            value={proximityLimit}
            onChange={(e) => setProximityLimit(Number(e.target.value))}
            className="flex-1 accent-[#00F5A0] h-1.5 bg-[#102B21] rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-[#00F5A0] w-14 text-right shrink-0">
            {proximityLimit} mm
          </span>
        </div>
      </div>

      {/* Optional Feature Topology Breakdown Accordion */}
      {showFeatureCatalog && (
        <div className="p-4 bg-[#071510] border border-[#00F5A0]/30 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0] flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" />
              <span>Extracted Mechanical Features & Datums</span>
            </span>
            <span className="text-[10px] font-mono text-[#8CA89E]">
              {analysis.featureSummary.reduce((acc, c) => acc + c.features.length, 0)} Features Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.featureSummary.map((c) => (
              <div
                key={c.componentId}
                className="p-3 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.2)] space-y-2"
              >
                <div className="font-mono font-bold text-xs text-[#F0FDF4] flex items-center justify-between">
                  <span>{c.componentName}</span>
                  <span className="text-[10px] text-[#00F5A0]">{c.features.length} features</span>
                </div>
                <div className="space-y-1.5">
                  {c.features.map((f) => (
                    <div
                      key={f.id}
                      className="p-1.5 rounded bg-[#0B1E17] text-[11px] font-mono flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="text-[#00F5A0] font-bold">{f.name}</div>
                        <div className="text-[#8CA89E] text-[10px] font-sans">{f.description}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#102B21] text-[9px] uppercase font-bold text-[#8CA89E] shrink-0">
                        {f.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Mates List */}
      <div className="space-y-3">
        {filteredSuggestions.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)] text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#00F5A0] mx-auto opacity-70" />
            <div className="text-sm font-mono font-bold text-[#F0FDF4]">
              No Suggested Mates for Selected Criteria
            </div>
            <p className="text-xs text-[#8CA89E] max-w-md mx-auto">
              All detected geometric features are either fully mated or beyond the current proximity threshold.
              Try increasing the proximity limit or clearing filters.
            </p>
          </div>
        ) : (
          filteredSuggestions.map((s) => {
            const isApplied = s.isApplied;
            const isRecent = recentlyAppliedId === s.id;
            const customVal = customValues[s.id] !== undefined ? customValues[s.id] : s.suggestedValue;

            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col gap-3 ${
                  isRecent
                    ? 'bg-[#0B2B1E] border-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.3)]'
                    : isApplied
                    ? 'bg-[#071510]/80 border-[rgba(16,185,129,0.2)] opacity-85'
                    : 'bg-[#071510] border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0]/50 shadow-md'
                }`}
              >
                {/* Header Row: Pair Names, Constraint Type & Confidence Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        s.suggestedType === 'concentric'
                          ? 'bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30'
                          : s.suggestedType === 'coincident'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {s.suggestedType} Mate
                    </span>

                    <span className="text-xs font-mono font-bold text-[#F0FDF4]">
                      {s.componentNameA}
                    </span>
                    <span className="text-[#8CA89E] font-mono text-xs">↔</span>
                    <span className="text-xs font-mono font-bold text-[#F0FDF4]">
                      {s.componentNameB}
                    </span>

                    {isApplied ? (
                      <span className="px-2 py-0.5 rounded bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] text-[10px] font-mono font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#00F5A0]" />
                        <span>Active in Assembly</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                        Ready to Mate
                      </span>
                    )}
                  </div>

                  {/* Match Confidence Score */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-[#8CA89E] uppercase mr-1.5">Match Confidence</span>
                      <span
                        className={`text-xs font-black ${
                          s.confidence >= 90
                            ? 'text-[#00F5A0]'
                            : s.confidence >= 80
                            ? 'text-sky-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {s.confidence}%
                      </span>
                    </div>

                    <div className="w-16 h-2 bg-[#030A07] rounded-full overflow-hidden border border-[rgba(16,185,129,0.2)]">
                      <div
                        className={`h-full rounded-full ${
                          s.confidence >= 90
                            ? 'bg-[#00F5A0]'
                            : s.confidence >= 80
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${s.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Features & Fit Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.15)] space-y-0.5">
                    <div className="text-[10px] text-[#8CA89E] uppercase">Feature Datum A:</div>
                    <div className="text-[#00F5A0] font-bold text-[11px] truncate">
                      {s.featureA.name}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.15)] space-y-0.5">
                    <div className="text-[10px] text-[#8CA89E] uppercase">Feature Datum B:</div>
                    <div className="text-[#00F5A0] font-bold text-[11px] truncate">
                      {s.featureB.name}
                    </div>
                  </div>
                </div>

                {/* Spatial Proximity & Rationale */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono pt-1 border-t border-[rgba(16,185,129,0.1)]">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="text-[#8CA89E]">
                        Fit Class: <strong className="text-[#F0FDF4]">{s.fitClass}</strong>
                      </span>
                      <span className="text-[#8CA89E]">
                        Radial Offset: <strong className="text-[#00F5A0]">{s.radialOffsetMm} mm</strong>
                      </span>
                      <span className="text-[#8CA89E]">
                        Axial Gap: <strong className="text-[#00F5A0]">{s.axialDistanceMm} mm</strong>
                      </span>
                      <span className="text-[#38BDF8]">
                        DoF Impact: <strong className="text-[#38BDF8]">{s.dofRemoved}</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8CA89E] font-sans leading-relaxed">
                      {s.engineeringRationale}
                    </p>
                  </div>

                  {/* Offset adjustment & Apply Action Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {s.suggestedType === 'coincident' || s.suggestedType === 'distance' ? (
                      <div className="flex items-center gap-1.5 bg-[#030A07] px-2 py-1 rounded-lg border border-[rgba(16,185,129,0.25)]">
                        <span className="text-[10px] text-[#8CA89E]">Offset:</span>
                        <input
                          type="number"
                          value={customVal}
                          onChange={(e) => handleCustomValueChange(s.id, Number(e.target.value))}
                          className="w-14 bg-transparent text-xs text-[#00F5A0] font-mono focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-[#8CA89E]">mm</span>
                      </div>
                    ) : null}

                    {isApplied ? (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 rounded-lg bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-[#8CA89E] font-mono text-xs font-bold flex items-center gap-1.5 opacity-70 cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5 text-[#00F5A0]" />
                        <span>Applied</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplySingle(s)}
                        className="px-4 py-2 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-mono text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,245,160,0.25)] active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Apply Mate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
