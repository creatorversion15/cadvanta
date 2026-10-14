import React, { useState } from 'react';
import {
  ArrowLeft,
  Folder,
  ChevronDown,
  Undo2,
  Redo2,
  Maximize2,
  Eye,
  Plus,
  Compass,
  Layers,
  Box,
  Sliders,
  Scissors,
  PenTool,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Table,
  Check,
  X,
  Ruler,
  Grid,
} from 'lucide-react';
import { CADPart, PartType, CameraView, DisplayMode } from '../../types/cad';
import { useSubscription } from '../../context/SubscriptionContext';

interface CADMobileHeaderProps {
  part: CADPart;
  onGoHome?: () => void;
  onOpenDashboard?: () => void;
  onSelectPreset: (type: PartType) => void;
  onOpenDesignLibrary?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onFitView?: () => void;
  onOpenSketch?: () => void;
  onExecuteTool: (toolId: string, optionId?: string) => void;
  onMaterialChange: (materialId: string) => void;
  onOpenInspection?: (tab: 'measure' | 'mass' | 'interference' | 'section') => void;
  isSectionCutActive?: boolean;
  onToggleSectionCut?: () => void;
  displayMode: DisplayMode;
  onChangeDisplayMode: (mode: DisplayMode) => void;
}

export const CADMobileHeader: React.FC<CADMobileHeaderProps> = ({
  part,
  onGoHome,
  onOpenDashboard,
  onSelectPreset,
  onOpenDesignLibrary,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onFitView,
  onOpenSketch,
  onExecuteTool,
  onMaterialChange,
  onOpenInspection,
  isSectionCutActive = false,
  onToggleSectionCut,
  displayMode,
  onChangeDisplayMode,
}) => {
  const { isPro, openSubscriptionModal } = useSubscription();

  // Drawers / Sheets state
  const [activeSheet, setActiveSheet] = useState<'project' | 'view' | 'create' | null>(null);

  // Local View Sheet state
  const [activeCamView, setActiveCamView] = useState<CameraView>('iso');
  const [projection, setProjection] = useState<'perspective' | 'orthographic'>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showDatumPlanes, setShowDatumPlanes] = useState<boolean>(false);

  // Create Sheet active category
  const [createCategory, setCreateCategory] = useState<'features' | 'sketch' | 'materials' | 'inspect' | 'simulation'>('features');

  const presets: { type: PartType; label: string; desc: string; isPro: boolean }[] = [
    { type: 'planetary_gearbox', label: 'Planetary Gearbox', desc: 'Epicyclic sun, planets & ring assembly', isPro: false },
    { type: 'shaft', label: 'Drive Shaft', desc: 'Stepped power transmission shaft', isPro: false },
    { type: 'stepped_shaft', label: 'Multi-Step Shaft', desc: 'Multi-diameter transmission shaft', isPro: false },
    { type: 'flange', label: 'Mounting Flange', desc: '4-bolt pipe connector flange', isPro: false },
    { type: 'gear', label: 'Spur Gear Pair', desc: 'Involute gear mesh gearset', isPro: false },
    { type: 'bracket', label: 'Sheet Metal Bracket', desc: 'Gusseted folded 90° mounting bracket', isPro: false },
    { type: 'rocker_lever', label: 'Robotic Link / Lever', desc: 'Lightweight structural robotic linkage', isPro: false },
  ];

  const materials = [
    { id: 'al_6061', name: 'Aluminium 6061-T6', density: 2.7, yield: '276 MPa', color: '#CBD5E1' },
    { id: 'ss_316', name: 'Stainless Steel 316L', density: 8.0, yield: '290 MPa', color: '#94A3B8' },
    { id: 'ti_gr5', name: 'Titanium Grade 5', density: 4.43, yield: '880 MPa', color: '#64748B' },
    { id: 'brass_c360', name: 'Brass C360', density: 8.5, yield: '310 MPa', color: '#FBBF24' },
    { id: 'carbon_fiber', name: 'Carbon Fiber CFRP', density: 1.55, yield: '600 MPa', color: '#1E293B' },
    { id: 'abs_plastic', name: 'ABS Polymer (3D Print)', density: 1.04, yield: '40 MPa', color: '#38BDF8' },
  ];

  const handleSelectCamView = (v: CameraView) => {
    setActiveCamView(v);
    window.dispatchEvent(new CustomEvent('cad-set-camera-view', { detail: { view: v } }));
  };

  const handleToggleProjection = () => {
    const next = projection === 'perspective' ? 'orthographic' : 'perspective';
    setProjection(next);
    window.dispatchEvent(new CustomEvent('cad-toggle-projection'));
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    window.dispatchEvent(new CustomEvent('cad-toggle-grid'));
  };

  const handleToggleDimensions = () => {
    setShowDimensions(!showDimensions);
    window.dispatchEvent(new CustomEvent('cad-toggle-dimensions'));
  };

  const handleSetDisplay = (mode: DisplayMode) => {
    onChangeDisplayMode(mode);
    window.dispatchEvent(new CustomEvent('cad-set-display-mode', { detail: { mode } }));
  };

  const l = Number(part.parameters.length || 180);
  const d = Number(part.parameters.main_diameter || part.parameters.outer_diameter || 60);
  const w = Number(part.parameters.width || d);
  const h = Number(part.parameters.height || d);
  const volumeCm3 = Math.round((l * w * h * 0.00065) * 10) / 10;
  const massKg = ((volumeCm3 * (part.material.density || 7.85)) / 1000).toFixed(2);

  return (
    <>
      {/* 
        ========================================================================
        MOBILE CAD HEADER (Strictly Phone / Mobile breakpoint < 768px)
        Controls: Back | Project | Undo/Redo | Fit View | View | + / Create
        ========================================================================
      */}
      <header
        id="cadvanta-mobile-header"
        className="md:hidden w-full bg-white/98 border-b border-[#E2E8F0] shadow-xs px-2.5 py-2 flex items-center justify-between gap-1.5 z-40 select-none shrink-0"
      >
        {/* LEFT: Back Button & Project Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Back button */}
          <button
            id="mobile-btn-back"
            type="button"
            onClick={() => (onGoHome ? onGoHome() : onOpenDashboard?.())}
            className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-[#334155] cursor-pointer flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px]"
            title="Back to Home / Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
          </button>

          {/* Project compact selector button */}
          <button
            id="mobile-btn-project"
            type="button"
            onClick={() => setActiveSheet('project')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[#0F172A] border border-[#CBD5E1] text-xs font-semibold max-w-[130px] sm:max-w-[160px] truncate cursor-pointer"
            title="Switch CAD Project or Preset"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{part.name.replace(/2-Stage\s*/i, '').replace(/Assembly\s*/i, '')}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          </button>
        </div>

        {/* RIGHT: Undo/Redo | Fit View | View | + / Create */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-[#475569] disabled:opacity-25 transition-opacity cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-[#475569] disabled:opacity-25 transition-opacity cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Fit View */}
          <button
            id="mobile-btn-fit"
            type="button"
            onClick={onFitView}
            className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-[#475569] cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center"
            title="Fit to Center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* View Menu Drawer Trigger */}
          <button
            id="mobile-btn-view"
            type="button"
            onClick={() => setActiveSheet('view')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
              activeSheet === 'view'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-[#334155] border-[#CBD5E1]'
            }`}
            title="Camera View & Rendering Options"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">View</span>
          </button>

          {/* + / Create Tool Drawer Trigger */}
          <button
            id="mobile-btn-create"
            type="button"
            onClick={() => setActiveSheet('create')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            title="Features & CAD Tools"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Create</span>
          </button>
        </div>
      </header>

      {/* 
        ========================================================================
        1. PROJECT BOTTOM SHEET / DRAWER
        ========================================================================
      */}
      {activeSheet === 'project' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wide">
                  Select Project / CAD Model
                </span>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets List */}
            <div className="p-3 space-y-1.5 overflow-y-auto max-h-[60vh]">
              {presets.map((p) => (
                <button
                  key={p.type}
                  onClick={() => {
                    if (p.isPro && !isPro) {
                      openSubscriptionModal('Unlock Planetary Gearbox for ₹1.69');
                      return;
                    }
                    onSelectPreset(p.type);
                    setActiveSheet(null);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer border ${
                    part.type === p.type
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-[#334155]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs flex items-center gap-1.5 truncate">
                      <span>{p.label}</span>
                      {part.type === p.type && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">{p.desc}</div>
                  </div>
                  {p.isPro && !isPro ? (
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold shrink-0">
                      ₹1.69
                    </span>
                  ) : (
                    part.type === p.type && <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}

              {/* Browse Catalog */}
              {onOpenDesignLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    onOpenDesignLibrary();
                  }}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs text-center border border-[#CBD5E1] cursor-pointer"
                >
                  Browse Full Engineering Library & Catalog →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        2. VIEW CONTROLS BOTTOM SHEET
        ========================================================================
      */}
      {activeSheet === 'view' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wide">
                  Camera & Display Controls
                </span>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 space-y-4 overflow-y-auto">
              {/* Standard Orientations */}
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                  Standard Views
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['iso', 'front', 'top', 'right', 'left', 'back', 'bottom'] as CameraView[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectCamView(v)}
                      className={`py-2 px-1 rounded-lg text-xs font-mono uppercase font-bold border text-center transition-colors cursor-pointer ${
                        activeCamView === v
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-[#334155] border-[#E2E8F0] hover:bg-slate-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onFitView?.();
                      handleSelectCamView('iso');
                    }}
                    className="py-2 px-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-emerald-700 border border-emerald-200 text-center hover:bg-slate-200 cursor-pointer"
                  >
                    Reset (F)
                  </button>
                </div>
              </div>

              {/* Render Modes */}
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                  Shading & Render Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetDisplay('shaded_edges')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      displayMode === 'shaded_edges'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-[#E2E8F0] text-slate-700'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    <span className="text-[11px]">Shaded Edges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDisplay('wireframe')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      displayMode === 'wireframe'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-[#E2E8F0] text-slate-700'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="text-[11px]">Wireframe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDisplay('xray')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      displayMode === 'xray'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-[#E2E8F0] text-slate-700'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[11px]">X-Ray Ghost</span>
                  </button>
                </div>
              </div>

              {/* Projection & Toggles */}
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                  Overlays & Projection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleToggleProjection}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50 flex items-center justify-between text-xs font-medium cursor-pointer"
                  >
                    <span>Camera Projection:</span>
                    <span className="font-bold text-emerald-700 uppercase">{projection}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleGrid}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer ${
                      showGrid ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-[#E2E8F0] text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5" />
                      <span>Floor Grid</span>
                    </span>
                    <span className="font-bold">{showGrid ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleDimensions}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer ${
                      showDimensions ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-[#E2E8F0] text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Dimensions</span>
                    </span>
                    <span className="font-bold">{showDimensions ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSectionCut?.();
                      window.dispatchEvent(new CustomEvent('cad-toggle-section-cut'));
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer ${
                      isSectionCutActive ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-[#E2E8F0] text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Section Cut</span>
                    </span>
                    <span className="font-bold">{isSectionCutActive ? 'ACTIVE' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        3. FEATURES & CAD TOOLS BOTTOM SHEET ("+ / Create")
        ========================================================================
      */}
      {activeSheet === 'create' && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wide">
                  Features & Modeling Studio
                </span>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-[#E2E8F0] bg-slate-50 px-2 overflow-x-auto no-scrollbar gap-1 pt-1 text-xs">
              {[
                { id: 'features', label: 'Features' },
                { id: 'sketch', label: 'Sketch' },
                { id: 'materials', label: 'Materials' },
                { id: 'inspect', label: 'Inspect' },
                { id: 'simulation', label: 'FEA / Sim' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCreateCategory(cat.id as any)}
                  className={`px-3 py-2 font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    createCategory === cat.id
                      ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category Content */}
            <div className="p-3.5 space-y-3 overflow-y-auto max-h-[55vh]">
              {/* FEATURES CATEGORY */}
              {createCategory === 'features' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onExecuteTool('extrude');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Box className="w-4 h-4 text-emerald-600" />
                      <span>Extrude Boss</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Linear material addition (E)</span>
                  </button>

                  <button
                    onClick={() => {
                      onExecuteTool('revolve');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <RotateCw className="w-4 h-4 text-blue-600" />
                      <span>Revolve Boss</span>
                    </div>
                    <span className="text-[10px] text-slate-500">360° rotational profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onExecuteTool('cut');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Scissors className="w-4 h-4 text-rose-600" />
                      <span>Extruded Cut</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Pocket & cavity material removal</span>
                  </button>

                  <button
                    onClick={() => {
                      onExecuteTool('fillet');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Sliders className="w-4 h-4 text-amber-600" />
                      <span>Fillet / Round</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Smooth edge stress relievers</span>
                  </button>

                  <button
                    onClick={() => {
                      onExecuteTool('chamfer');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Sliders className="w-4 h-4 text-teal-600" />
                      <span>Chamfer</span>
                    </div>
                    <span className="text-[10px] text-slate-500">45° beveled edge transition</span>
                  </button>

                  <button
                    onClick={() => {
                      onExecuteTool('hole');
                      setActiveSheet(null);
                    }}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-emerald-400 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Hole Wizard</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Tapped / Clearance ISO drill holes</span>
                  </button>
                </div>
              )}

              {/* SKETCH CATEGORY */}
              {createCategory === 'sketch' && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveSheet(null);
                      onOpenSketch?.();
                    }}
                    className="w-full p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Launch 2D Parametric Sketcher Studio</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        onExecuteTool('sketch_line');
                        setActiveSheet(null);
                      }}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-blue-600" />
                      <span>Line (L)</span>
                    </button>
                    <button
                      onClick={() => {
                        onExecuteTool('sketch_circle');
                        setActiveSheet(null);
                      }}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Circle (C)</span>
                    </button>
                    <button
                      onClick={() => {
                        onExecuteTool('sketch_rect');
                        setActiveSheet(null);
                      }}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rectangle (R)</span>
                    </button>
                    <button
                      onClick={() => {
                        onExecuteTool('smart_dimension');
                        setActiveSheet(null);
                      }}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5 text-purple-600" />
                      <span>Dimension (D)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MATERIALS CATEGORY */}
              {createCategory === 'materials' && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Current Computed Mass:</span>
                    <span className="font-bold text-emerald-700">{massKg} kg ({volumeCm3} cm³)</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {materials.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onMaterialChange(m.id);
                          setActiveSheet(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          part.material.id === m.id
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                            : 'border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: m.color }} />
                          <div>
                            <div className="text-xs font-medium">{m.name}</div>
                            <div className="text-[10px] text-slate-500">Yield: {m.yield} • ρ: {m.density} g/cm³</div>
                          </div>
                        </div>
                        {part.material.id === m.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* INSPECT CATEGORY */}
              {createCategory === 'inspect' && (
                <div className="space-y-2">
                  {/* Bounding Envelope Display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider block mb-1">
                      Bounding Box Envelope
                    </span>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs text-slate-800">
                      <div>X: <strong className="text-emerald-700">{part.parameters.width || d} mm</strong></div>
                      <div>Y: <strong className="text-emerald-700">{part.parameters.height || d} mm</strong></div>
                      <div>Z: <strong className="text-emerald-700">{l} mm</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        onOpenInspection?.('measure');
                      }}
                      className="p-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <Ruler className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="text-xs font-bold text-slate-800">3D Measure</div>
                      <div className="text-[10px] text-slate-500">Point-to-point dist</div>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        onOpenInspection?.('mass');
                      }}
                      className="p-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <Table className="w-4 h-4 text-blue-600 mb-1" />
                      <div className="text-xs font-bold text-slate-800">Mass Properties</div>
                      <div className="text-[10px] text-slate-500">CoG & Inertia tensor</div>
                    </button>
                  </div>
                </div>
              )}

              {/* SIMULATION CATEGORY */}
              {createCategory === 'simulation' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold">FEA Static Stress Solver</div>
                      <div className="text-[10px] text-emerald-700">Von Mises stress field & deflection</div>
                    </div>
                    <span className="text-xs font-bold font-mono bg-emerald-600 text-white px-2 py-1 rounded-md">
                      FoS: 2.45
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onExecuteTool('simulation');
                      setActiveSheet(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Run Full Mechanical FEA Study</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
