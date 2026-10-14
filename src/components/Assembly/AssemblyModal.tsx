import React, { useState } from 'react';
import { AssemblyComponent, AssemblyConstraint, CADPart, PartType } from '../../types/cad';
import {
  createDefaultAssemblyPreset,
  solveAssemblyMates,
  getMateColor,
  SmartMateSuggestion,
  MatingPoint,
} from '../../engine/assemblySolver';
import {
  MATERIALS,
  getMaterialById,
  calculateMass,
  calculatePartVolumeCm3,
} from '../../engine/materials';
import { AssemblyPreview3D } from './AssemblyPreview3D';
import {
  X,
  Layers,
  Link,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Cpu,
  Move,
  RotateCw,
  AlertTriangle,
  Target,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';

interface AssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePart: CADPart;
  onUpdateAssembly?: (
    components: AssemblyComponent[],
    constraints: AssemblyConstraint[],
    explodePct: number,
    showMatingIndicators?: boolean
  ) => void;
}

export const AssemblyModal: React.FC<AssemblyModalProps> = ({
  isOpen,
  onClose,
  activePart,
  onUpdateAssembly,
}) => {
  const [preset, setPreset] = useState<'shaft_drive' | 'piston_rod'>('shaft_drive');
  const defaultAssembly = createDefaultAssemblyPreset('shaft_drive');

  const [components, setComponents] = useState<AssemblyComponent[]>(defaultAssembly.components);
  const [constraints, setConstraints] = useState<AssemblyConstraint[]>(defaultAssembly.constraints);
  const [explodePct, setExplodePct] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'smart_assistant' | 'components' | 'mates' | 'bom' | 'clashes'>('smart_assistant');

  // Mating points visual indicator states
  const [showMatingIndicators, setShowMatingIndicators] = useState<boolean>(true);
  const [highlightedMateId, setHighlightedMateId] = useState<string | null>(null);

  // Form states for adding a new mate
  const [newMateType, setNewMateType] = useState<AssemblyConstraint['type']>('coincident');
  const [mateCompA, setMateCompA] = useState<string>(components[0]?.id || '');
  const [mateCompB, setMateCompB] = useState<string>(components[1]?.id || '');
  const [mateValue, setMateValue] = useState<number>(0);
  const [expandedTransformCompId, setExpandedTransformCompId] = useState<string | null>(null);

  const handleUpdateComponentTransform = (
    compId: string,
    field: 'posX' | 'posY' | 'posZ' | 'rotX' | 'rotY' | 'rotZ',
    val: number
  ) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== compId) return c;
        const pos = [...c.position] as [number, number, number];
        const rot = [...c.rotation] as [number, number, number];
        if (field === 'posX') pos[0] = val;
        if (field === 'posY') pos[1] = val;
        if (field === 'posZ') pos[2] = val;
        if (field === 'rotX') rot[0] = (val * Math.PI) / 180;
        if (field === 'rotY') rot[1] = (val * Math.PI) / 180;
        if (field === 'rotZ') rot[2] = (val * Math.PI) / 180;
        return { ...c, position: pos, rotation: rot };
      })
    );
  };

  const solved = solveAssemblyMates(components, constraints, explodePct);


  // Material and Cost Rollup for Assembly
  const handleUpdateComponentMaterial = (compId: string, materialId: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === compId ? { ...c, materialId } : c))
    );
  };

  const assemblyBOM = components.map((comp) => {
    const mat = getMaterialById(comp.materialId || 'steel_1018');
    const vol = calculatePartVolumeCm3(comp.partType, comp.parameters || {});
    const mass = calculateMass(vol, mat);
    return {
      comp,
      material: mat,
      volumeCm3: vol,
      massKg: mass.massKg,
      costInr: mass.estCostInr,
    };
  });

  const totalAssemblyCostInr = assemblyBOM.reduce((sum, item) => sum + item.costInr, 0);
  const totalAssemblyMassKg = assemblyBOM.reduce((sum, item) => sum + item.massKg, 0);
  const totalAssemblyVolumeCm3 = assemblyBOM.reduce((sum, item) => sum + item.volumeCm3, 0);

  const handleAutoResolveClashes = () => {
    if (!solved.clashDetection.hasClash) return;
    setConstraints((prev) =>
      prev.map((m) => {
        if (m.type === 'coincident' || m.type === 'distance') {
          return { ...m, value: (m.value || 0) + 2.0 };
        }
        return m;
      })
    );
  };

  if (!isOpen) return null;

  const handleSelectPreset = (p: 'shaft_drive' | 'piston_rod') => {
    setPreset(p);
    const data = createDefaultAssemblyPreset(p);
    setComponents(data.components);
    setConstraints(data.constraints);
    setMateCompA(data.components[0]?.id || '');
    setMateCompB(data.components[1]?.id || '');
  };

  const handleToggleVisibility = (id: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleToggleSuppressed = (id: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, suppressed: !c.suppressed } : c))
    );
  };

  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setConstraints((prev) => prev.filter((m) => m.componentIdA !== id && m.componentIdB !== id));
  };

  const handleAddComponent = (partType: PartType, name: string) => {
    const newComp: AssemblyComponent = {
      id: `comp_${Date.now()}`,
      name,
      instanceName: `${name.replace(/\s+/g, '_')}_${components.length + 1}`,
      partType,
      materialId: 'en8_steel',
      color: '#00f5a0',
      parameters: { length: 100, width: 80, thickness: 12 },
      position: [0, 0, (components.length + 1) * 50],
      rotation: [0, 0, 0],
      visible: true,
      explodeVector: [0, 0, (components.length + 1) * 40],
    };
    setComponents([...components, newComp]);
  };

  const handleAddMate = () => {
    if (!mateCompA || !mateCompB || mateCompA === mateCompB) return;
    const compA = components.find((c) => c.id === mateCompA);
    const compB = components.find((c) => c.id === mateCompB);

    const newMate: AssemblyConstraint = {
      id: `mate_${Date.now()}`,
      type: newMateType,
      componentIdA: mateCompA,
      componentIdB: mateCompB,
      value: mateValue,
      status: 'satisfied',
      description: `${newMateType.toUpperCase()}: ${compA?.name} to ${compB?.name} (${mateValue}mm)`,
    };

    setConstraints([...constraints, newMate]);
  };

  const handleApplySuggestedMate = (sugg: SmartMateSuggestion) => {
    const exists = constraints.some(
      (c) =>
        c.type === sugg.type &&
        ((c.componentIdA === sugg.componentIdA && c.componentIdB === sugg.componentIdB) ||
          (c.componentIdA === sugg.componentIdB && c.componentIdB === sugg.componentIdA))
    );
    if (exists) return;

    const newMate: AssemblyConstraint = {
      id: sugg.id.replace('sugg_', 'mate_'),
      type: sugg.type,
      componentIdA: sugg.componentIdA,
      componentIdB: sugg.componentIdB,
      value: sugg.suggestedOffset,
      status: 'satisfied',
      description: `${sugg.type.toUpperCase()}: ${sugg.name} (${sugg.suggestedOffset}mm)`,
    };
    setConstraints((prev) => [...prev, newMate]);
    setHighlightedMateId(sugg.id);
  };

  const handleApplyAllSuggestions = () => {
    const unapplied = solved.smartSuggestions.filter((s) => !s.isApplied);
    const newMates: AssemblyConstraint[] = unapplied.map((sugg) => ({
      id: sugg.id.replace('sugg_', 'mate_'),
      type: sugg.type,
      componentIdA: sugg.componentIdA,
      componentIdB: sugg.componentIdB,
      value: sugg.suggestedOffset,
      status: 'satisfied' as const,
      description: `${sugg.type.toUpperCase()}: ${sugg.name} (${sugg.suggestedOffset}mm)`,
    }));
    setConstraints((prev) => [...prev, ...newMates]);
  };

  const handleDeleteMate = (id: string) => {
    setConstraints((prev) => prev.filter((m) => m.id !== id));
  };

  const handleApplyToScene = () => {
    if (onUpdateAssembly) {
      onUpdateAssembly(components, constraints, explodePct, showMatingIndicators);
    }
    onClose();
  };

  const handleToggleExplodeModal = () => {
    const isCurrentlyExploded = explodePct > 0;
    const startVal = explodePct;
    const targetVal = isCurrentlyExploded ? 0 : 70;
    const duration = 650;
    const startTime = performance.now();

    const animateExplode = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentVal = Math.round(startVal + (targetVal - startVal) * ease);
      setExplodePct(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animateExplode);
      }
    };

    requestAnimationFrame(animateExplode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-full sm:h-auto max-h-[100vh] sm:max-h-[92vh] bg-gradient-to-b from-[#0A1D16] to-[#05110D] border-0 sm:border border-[#00F5A0]/35 rounded-none sm:rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col text-[#F0FDF4] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510]/80 shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)] shrink-0">
              <Layers className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  MULTI-BODY ASSEMBLY
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[8px] sm:text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  {solved.status === 'fully_constrained' ? 'FULLY CONSTRAINED' : 'SOLVED MATE SOLVER'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold font-mono text-[#F0FDF4] tracking-tight truncate">
                Assembly Modeling & Kinematic Mates
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex bg-[#071510] p-1 rounded-xl border border-[rgba(16,185,129,0.2)]">
              <button
                type="button"
                onClick={() => handleSelectPreset('shaft_drive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  preset === 'shaft_drive' ? 'bg-[#00F5A0] text-[#030A07]' : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                Shaft + Coupling
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('piston_rod')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  preset === 'piston_rod' ? 'bg-[#00F5A0] text-[#030A07]' : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                Piston + Rod
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] min-w-[40px] min-h-[40px] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subheader: Exploded View Slider */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#071510] border-b border-[rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Sliders className="w-4 h-4 text-[#00F5A0] shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase text-[#8CA89E] shrink-0">Exploded View:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={explodePct}
              onChange={(e) => setExplodePct(Number(e.target.value))}
              className="flex-1 accent-[#00F5A0] h-2 bg-[#102B21] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-[#00F5A0] font-bold w-10 text-right shrink-0">
              {explodePct}%
            </span>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('smart_assistant')}
              className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'smart_assistant'
                  ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_12px_rgba(0,245,160,0.25)]'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Smart Assistant</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                {solved.smartSuggestions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('components')}
              className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'components'
                  ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              Components ({components.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mates')}
              className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'mates'
                  ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              Mates ({constraints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bom')}
              className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'bom'
                  ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              BOM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clashes')}
              className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'clashes'
                  ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4]'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${solved.clashDetection.hasClash ? 'text-amber-400' : 'text-[#00F5A0]'}`} />
              <span>Clashes ({solved.clashDetection.totalClashingPairs})</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'smart_assistant' && (
            <div className="space-y-4">
              {/* Top Banner & Quick Controls */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#071E14] via-[#092419] to-[#071E14] border border-[#00F5A0]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,245,160,0.12)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0]">
                      Smart Assembly Kinematic Assistant
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#102B21] text-[#8CA89E] border border-[rgba(16,185,129,0.3)]">
                      {solved.smartSuggestions.length} Interfaces Analyzed
                    </span>
                  </div>
                  <p className="text-xs text-[#8CA89E] mt-1">
                    Color-coded spheres highlight exact mating interfaces (concentric bores, planar shoulders, and fasteners) where components align.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleToggleExplodeModal}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      explodePct > 0
                        ? 'bg-[#102B21] text-[#00F5A0] border-[#00F5A0]/50 shadow-[0_0_10px_rgba(0,245,160,0.2)]'
                        : 'bg-[#071510] text-[#8CA89E] border-[rgba(16,185,129,0.2)]'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>{explodePct > 0 ? `Exploded: ${explodePct}%` : 'Exploded View'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMatingIndicators((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      showMatingIndicators
                        ? 'bg-[#102B21] text-[#00F5A0] border-[#00F5A0]/50 shadow-[0_0_10px_rgba(0,245,160,0.2)]'
                        : 'bg-[#071510] text-[#8CA89E] border-[rgba(16,185,129,0.2)]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        showMatingIndicators ? 'bg-[#00F5A0] animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    <span>{showMatingIndicators ? 'Mating Spheres: ON' : 'Mating Spheres: OFF'}</span>
                  </button>

                  {solved.smartSuggestions.some((s) => !s.isApplied) && (
                    <button
                      type="button"
                      onClick={handleApplyAllSuggestions}
                      className="px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply All ({solved.smartSuggestions.filter((s) => !s.isApplied).length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Grid: 3D Preview (Left) + Suggestions List (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* 3D Interactive Canvas with Mating Points Spheres */}
                <div className="lg:col-span-7 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8CA89E] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>3D Mating Points & Alignment Guide</span>
                    </span>
                    {highlightedMateId && (
                      <button
                        type="button"
                        onClick={() => setHighlightedMateId(null)}
                        className="text-[10px] text-[#8CA89E] hover:text-[#00F5A0] underline cursor-pointer"
                      >
                        Clear Highlight
                      </button>
                    )}
                  </div>

                  <div className={`h-[360px] sm:h-[420px] w-full assembly-model-group-wrapper ${explodePct > 0 ? 'exploded-active' : 'exploded-compact'}`}>
                    <AssemblyPreview3D
                      solved={solved}
                      showMatingIndicators={showMatingIndicators}
                      highlightedMateId={highlightedMateId}
                    />
                  </div>
                </div>

                {/* Suggested Mating Interfaces Feed */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                      Suggested Mating Points ({solved.smartSuggestions.length})
                    </span>
                    <span className="text-[10px] font-mono text-[#00F5A0]">
                      {solved.smartSuggestions.filter((s) => s.isApplied).length} Applied
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {solved.smartSuggestions.map((sugg) => {
                      const colorHex = getMateColor(sugg.type);
                      const isHighlighted = highlightedMateId === sugg.id;
                      const compA = components.find((c) => c.id === sugg.componentIdA);
                      const compB = components.find((c) => c.id === sugg.componentIdB);

                      return (
                        <div
                          key={sugg.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isHighlighted
                              ? 'bg-[#102B21] border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]'
                              : 'bg-[#071510] border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.4)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Color-Coded Indicator Sphere Swatch */}
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                                style={{ backgroundColor: colorHex, color: colorHex }}
                              />
                              <div>
                                <span className="font-mono font-bold text-xs text-[#F0FDF4] block">
                                  {sugg.name}
                                </span>
                                <span
                                  className="text-[10px] font-mono uppercase font-bold"
                                  style={{ color: colorHex }}
                                >
                                  {sugg.type} Mate • {sugg.alignmentReason}
                                </span>
                              </div>
                            </div>

                            <span className="px-1.5 py-0.5 rounded bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30 text-[9px] font-mono font-bold shrink-0">
                              {Math.round(sugg.confidence * 100)}% Match
                            </span>
                          </div>

                          <p className="text-[11px] text-[#8CA89E] mt-2 font-sans leading-relaxed">
                            {sugg.description}
                          </p>

                          {/* Mating Point Coordinates */}
                          <div className="mt-2.5 p-2 rounded-lg bg-[#030A07] border border-[rgba(16,185,129,0.15)] text-[10px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-[#8CA89E]">
                              <span className="truncate">
                                Pt A ({compA?.name || 'Part A'}):
                              </span>
                              <span className="text-[#00F5A0] font-bold shrink-0">
                                [{sugg.matingPointA.position.map((v) => v.toFixed(0)).join(', ')}]
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#8CA89E]">
                              <span className="truncate">
                                Pt B ({compB?.name || 'Part B'}):
                              </span>
                              <span className="text-[#00F5A0] font-bold shrink-0">
                                [{sugg.matingPointB.position.map((v) => v.toFixed(0)).join(', ')}]
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setHighlightedMateId((prev) => (prev === sugg.id ? null : sugg.id))
                              }
                              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                isHighlighted
                                  ? 'bg-[#00F5A0] text-[#030A07] font-bold'
                                  : 'bg-[#102B21] text-[#8CA89E] hover:text-[#00F5A0]'
                              }`}
                            >
                              {isHighlighted ? 'Highlighted' : 'Focus Spheres in 3D'}
                            </button>

                            {sugg.isApplied ? (
                              <span className="text-[10px] font-mono text-[#00F5A0] flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Constraint Active</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplySuggestedMate(sugg)}
                                className="px-3 py-1 rounded bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Apply Mate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                  Assembly Tree & Component Instances
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddComponent('bearing', 'Ball Bearing')}
                    className="px-2.5 py-1 rounded-lg bg-[#071510] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#00F5A0] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Bearing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddComponent('gear', 'Spur Gear')}
                    className="px-2.5 py-1 rounded-lg bg-[#071510] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#00F5A0] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Spur Gear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddComponent('bolt', 'M10 Hex Bolt')}
                    className="px-2.5 py-1 rounded-lg bg-[#071510] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#00F5A0] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Fastener</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {components.map((comp, idx) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.2)] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: comp.color || '#00f5a0' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#F0FDF4]">{comp.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#030A07] text-[#8CA89E] border border-[rgba(16,185,129,0.2)]">
                            {comp.instanceName}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] font-mono px-1 rounded bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                              GROUNDED (FIXED)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8CA89E] font-mono">
                          Pos: [{comp.position.map((p) => p.toFixed(1)).join(', ')}] | Rot: [{comp.rotation.map((r) => r.toFixed(1)).join(', ')}]
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(comp.id)}
                        className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] transition-all cursor-pointer"
                        title={comp.visible ? 'Hide part' : 'Show part'}
                      >
                        {comp.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSuppressed(comp.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                          comp.suppressed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4]'
                        }`}
                      >
                        {comp.suppressed ? 'Suppressed' : 'Active'}
                      </button>

                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComponent(comp.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                          title="Remove component"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mates' && (
            <div className="space-y-4">
              {/* Add Mate Form */}
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0] block">
                  Add Geometric Mate / Kinematic Constraint
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Mate Type</label>
                    <select
                      value={newMateType}
                      onChange={(e) => setNewMateType(e.target.value as any)}
                      className="w-full h-9 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                    >
                      <option value="coincident">Coincident (Faces/Planes)</option>
                      <option value="concentric">Concentric (Shaft/Bore)</option>
                      <option value="distance">Distance (Offset mm)</option>
                      <option value="angle">Angle (Rotation deg)</option>
                      <option value="parallel">Parallel</option>
                      <option value="perpendicular">Perpendicular (90°)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Reference Component A</label>
                    <select
                      value={mateCompA}
                      onChange={(e) => setMateCompA(e.target.value)}
                      className="w-full h-9 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                    >
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Constrained Component B</label>
                    <select
                      value={mateCompB}
                      onChange={(e) => setMateCompB(e.target.value)}
                      className="w-full h-9 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                    >
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#8CA89E] block mb-1">Offset / Angle Value</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={mateValue}
                        onChange={(e) => setMateValue(Number(e.target.value))}
                        className="w-full h-9 px-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.3)] text-xs font-mono text-[#F0FDF4]"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={handleAddMate}
                        className="px-3 h-9 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Add Mate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mates List with Color Indicators & Mating Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#8CA89E]">
                  <span>Active Constraints ({constraints.length})</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00F5A0]" /> Concentric
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Coincident
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Distance
                    </span>
                  </div>
                </div>

                {constraints.map((mate) => {
                  const mateColor = getMateColor(mate.type);
                  const isHighlighted = highlightedMateId === mate.id;
                  const pts = solved.matingPoints.filter((p) => p.mateId === mate.id);

                  return (
                    <div
                      key={mate.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isHighlighted
                          ? 'bg-[#102B21] border-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.2)]'
                          : 'bg-[#071510] border-[rgba(16,185,129,0.2)]'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {/* Color-Coded Sphere Indicator Dot */}
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 sm:mt-0 shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: mateColor, color: mateColor }}
                          title={`Color indicator for ${mate.type} constraint`}
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-mono font-bold text-xs uppercase"
                              style={{ color: mateColor }}
                            >
                              {mate.type}
                            </span>
                            <span className="text-xs font-sans text-[#F0FDF4] truncate">
                              {mate.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-[#8CA89E] flex-wrap">
                            {mate.value !== undefined && mate.value !== 0 && (
                              <span>Offset: {mate.value} mm</span>
                            )}
                            {pts.length >= 2 && (
                              <span className="text-[#00F5A0]">
                                Mating Points: [{pts[0].position.map((v) => v.toFixed(0)).join(', ')}] ↔ [{pts[1].position.map((v) => v.toFixed(0)).join(', ')}]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() =>
                            setHighlightedMateId((prev) => (prev === mate.id ? null : mate.id))
                          }
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                            isHighlighted
                              ? 'bg-[#00F5A0] text-[#030A07] font-bold'
                              : 'bg-[#102B21] text-[#8CA89E] hover:text-[#00F5A0]'
                          }`}
                        >
                          {isHighlighted ? 'Highlighted' : 'Focus Spheres'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMate(mate.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                          title="Remove mate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'bom' && (
            <div className="space-y-4">
              {/* Assembly Running Total Spotlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#071E14] via-[#092419] to-[#071E14] border border-[#00F5A0]/40 shadow-[0_4px_20px_rgba(0,245,160,0.12)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-[#00F5A0] uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Full Assembly Running Total Cost</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#F0FDF4] mt-1 font-mono tracking-tight">
                      ₹{totalAssemblyCostInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                      <span className="text-xs font-normal text-[#8CA89E] ml-2">
                        (${(totalAssemblyCostInr / 86.5).toFixed(2)} USD)
                      </span>
                    </div>
                    <div className="text-xs text-[#8CA89E] font-sans mt-0.5">
                      Assign materials to parts below to observe automatic cost adjustments.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2.5 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Total Mass</div>
                      <div className="text-sm font-bold text-[#00F5A0] mt-0.5">
                        {totalAssemblyMassKg.toFixed(2)} kg
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Total Volume</div>
                      <div className="text-sm font-bold text-[#F0FDF4] mt-0.5">
                        {totalAssemblyVolumeCm3.toFixed(1)} cm³
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E] block">
                  Assembly Bill of Materials (BOM) & Cost Rollup
                </span>
                <span className="text-xs font-mono text-[#8CA89E]">
                  {components.length} components
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[rgba(16,185,129,0.25)] bg-[#071510]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#102B21] border-b border-[rgba(16,185,129,0.25)] text-[#00F5A0]">
                    <tr>
                      <th className="py-2.5 px-3">Item #</th>
                      <th className="py-2.5 px-3">Part Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Assign Material</th>
                      <th className="py-2.5 px-3 text-right">Vol (cm³)</th>
                      <th className="py-2.5 px-3 text-right">Mass (kg)</th>
                      <th className="py-2.5 px-3 text-right">Est. Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(16,185,129,0.1)] text-[#F0FDF4]">
                    {assemblyBOM.map((item, idx) => (
                      <tr key={item.comp.id} className="hover:bg-[#0B1E17] transition-colors">
                        <td className="py-2.5 px-3 text-[#8CA89E]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold">{item.comp.name}</td>
                        <td className="py-2.5 px-3 text-[#8CA89E] text-[11px]">{item.comp.partType}</td>
                        <td className="py-2 px-3">
                          <select
                            value={item.material.id}
                            onChange={(e) => handleUpdateComponentMaterial(item.comp.id, e.target.value)}
                            className="bg-[#0B1E17] border border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0] rounded px-2 py-1 text-xs text-[#00F5A0] font-bold focus:outline-none cursor-pointer max-w-[180px] truncate"
                          >
                            {MATERIALS.map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#0B1E17] text-[#F0FDF4]">
                                {m.name} (₹{m.costPerKgInr || 95}/kg)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#8CA89E] font-mono">
                          {item.volumeCm3.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#F0FDF4]">
                          {item.massKg.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#00F5A0] font-mono">
                          ₹{item.costInr.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0B1E17] border-t-2 border-[#00F5A0]/40 font-bold text-[#F0FDF4]">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 uppercase tracking-wider text-[#00F5A0]">
                        Full Assembly Running Total:
                      </td>
                      <td className="py-3 px-3 text-right text-[#8CA89E]">
                        {totalAssemblyVolumeCm3.toFixed(1)} cm³
                      </td>
                      <td className="py-3 px-3 text-right text-[#00F5A0]">
                        {totalAssemblyMassKg.toFixed(2)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-[#00F5A0] text-sm">
                        ₹{totalAssemblyCostInr.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clashes' && (
            <div className="space-y-5">
              {/* Top Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 font-mono ${
                  solved.clashDetection.hasClash
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-[#071510] border-[#00F5A0]/40 text-[#00F5A0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${solved.clashDetection.hasClash ? 'text-amber-400' : 'text-[#00F5A0]'}`} />
                  <div>
                    <div className="font-bold text-sm">
                      {solved.clashDetection.hasClash
                        ? `${solved.clashDetection.totalClashingPairs} Collision Pair(s) Detected in Assembly`
                        : 'Zero Interference Clashes Detected — Clear Fit'}
                    </div>
                    <div className="text-xs text-[#8CA89E]">
                      {solved.clashDetection.hasClash
                        ? 'Components intersect or exhibit dimensional overlap in the kinematic solver.'
                        : 'All mated component boundaries maintain positive clearance in nominal state.'}
                    </div>
                  </div>
                </div>

                {solved.clashDetection.hasClash && (
                  <button
                    type="button"
                    onClick={handleAutoResolveClashes}
                    className="px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,245,160,0.3)] shrink-0"
                  >
                    Auto-Clear (+2.0mm Offset)
                  </button>
                )}
              </div>

              {/* Clashing Pairs Details */}
              {solved.clashDetection.hasClash && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                    Interference Collision Coordinates & Volumetric Analysis
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-amber-500/30 bg-[#071510]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#102B21] border-b border-amber-500/20 text-amber-300">
                        <tr>
                          <th className="py-2.5 px-3">Component A</th>
                          <th className="py-2.5 px-3">Component B</th>
                          <th className="py-2.5 px-3">Clash Volume (mm³)</th>
                          <th className="py-2.5 px-3">Center [X, Y, Z]</th>
                          <th className="py-2.5 px-3">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(16,185,129,0.1)] text-[#F0FDF4]">
                        {solved.clashDetection.clashes.map((c, i) => (
                          <tr key={i} className="hover:bg-[#0B1E17]">
                            <td className="py-2.5 px-3 font-bold text-amber-200">{c.componentAName}</td>
                            <td className="py-2.5 px-3 font-bold text-amber-200">{c.componentBName}</td>
                            <td className="py-2.5 px-3 text-[#00F5A0] font-bold">{c.clashVolumeMm3.toFixed(1)}</td>
                            <td className="py-2.5 px-3 text-[#8CA89E]">
                              [{c.intersectionCenter.map((n) => n.toFixed(1)).join(', ')}]
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                                {c.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tolerance Stackup Analysis */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                  Tolerance Stackup Analysis (Worst-Case & RSS 3σ Statistical)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 bg-[#071510] rounded-xl border border-[rgba(16,185,129,0.2)]">
                    <div className="text-[10px] text-[#8CA89E] uppercase">Nominal Clearance Gap</div>
                    <div className="text-lg font-bold text-[#00F5A0] mt-1">
                      {solved.toleranceStackup.nominalGapMm} mm
                    </div>
                  </div>
                  <div className="p-3 bg-[#071510] rounded-xl border border-[rgba(16,185,129,0.2)]">
                    <div className="text-[10px] text-[#8CA89E] uppercase">Worst-Case Tolerance</div>
                    <div className="text-lg font-bold text-[#F0FDF4] mt-1">
                      ±{solved.toleranceStackup.worstCaseToleranceMm} mm
                    </div>
                  </div>
                  <div className="p-3 bg-[#071510] rounded-xl border border-[rgba(16,185,129,0.2)]">
                    <div className="text-[10px] text-[#8CA89E] uppercase">RSS 3σ Dispersion</div>
                    <div className="text-lg font-bold text-[#00F5A0] mt-1">
                      ±{solved.toleranceStackup.rssToleranceMm} mm
                    </div>
                  </div>
                  <div className="p-3 bg-[#071510] rounded-xl border border-[rgba(16,185,129,0.2)]">
                    <div className="text-[10px] text-[#8CA89E] uppercase">Process Cpk / Defect Rate</div>
                    <div className="text-lg font-bold text-[#38BDF8] mt-1">
                      {solved.toleranceStackup.cpk} ({solved.toleranceStackup.estimatedDefectPpm} PPM)
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#071510] rounded-xl border border-[rgba(16,185,129,0.15)] text-xs font-mono text-[#8CA89E] space-y-1">
                  <div className="text-[#00F5A0] font-bold">Standard Recommendations:</div>
                  {solved.toleranceStackup.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#00F5A0]">▸</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#071510] border-t border-[rgba(16,185,129,0.2)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[11px] sm:text-xs font-mono text-[#8CA89E] truncate">
              Status:{' '}
              <span className="text-[#00F5A0] font-bold">
                {components.length} Components | {constraints.length} Constraints Active
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-mono text-[#8CA89E] hover:text-[#00F5A0] transition-colors">
              <input
                type="checkbox"
                checked={showMatingIndicators}
                onChange={(e) => setShowMatingIndicators(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#00F5A0] rounded cursor-pointer"
              />
              <span>Render Mating Spheres in Main CAD Scene</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 min-h-[42px] rounded-xl bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] font-mono text-xs font-bold transition-all cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApplyToScene}
              className="flex-2 sm:flex-none px-5 py-2.5 min-h-[42px] rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] cursor-pointer text-center"
            >
              Update in 3D Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
