import React, { useState, useRef, useEffect } from 'react';
import { CADPart, MaterialInfo, PartType } from '../../types/cad';
import {
  FilePlus2,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  MousePointer,
  PenTool,
  Layers,
  RotateCw,
  CircleDot,
  Scissors,
  Grid,
  FlipHorizontal,
  Ruler,
  Split,
  Palette,
  Sparkles,
  Download,
  Share2,
  ChevronDown,
  Box,
  FileText,
  Activity,
  ShieldCheck,
  PackagePlus,
  Compass,
  Check,
  Copy,
  Info,
  Sliders,
  Scale,
  Cpu,
  ArrowUpRight,
  Maximize2,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type CADRibbonTab = 'features' | 'sketch' | 'inspect' | 'materials' | 'output';

interface CADRibbonToolbarProps {
  part: CADPart;
  onOpenSketcher?: () => void;
  onOpenPartLibrary?: () => void;
  onOpenAssemblyModal?: () => void;
  onOpenEngineeringChecksModal?: () => void;
  onOpenCostEstimatorModal?: () => void;
  onOpenFEAModal?: () => void;
  onOpenDrawingModal?: () => void;
  onOpenExportModal?: () => void;
  onTriggerDirectAction?: (actionId: string) => void;
  onFocusProperties?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isViewOnly?: boolean;
  onGoHome?: () => void;
  onNewDesign?: (type?: PartType) => void;
  onOpenDesignLibrary?: () => void;
  onSaveSnapshot?: () => void;
  onShare?: () => void;
  onOpenViraBot?: () => void;
  onSelectPreset?: (type: PartType) => void;
  onToggleSectionView?: () => void;
  isSectionViewActive?: boolean;
  activeSelectionMode?: 'all' | 'face' | 'edge' | 'body';
  onChangeSelectionMode?: (mode: 'all' | 'face' | 'edge' | 'body') => void;
}

export const CADRibbonToolbar: React.FC<CADRibbonToolbarProps> = ({
  part,
  onOpenSketcher,
  onOpenPartLibrary,
  onOpenAssemblyModal,
  onOpenEngineeringChecksModal,
  onOpenCostEstimatorModal,
  onOpenFEAModal,
  onOpenDrawingModal,
  onOpenExportModal,
  onTriggerDirectAction,
  onFocusProperties,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isViewOnly = false,
  onGoHome,
  onNewDesign,
  onOpenDesignLibrary,
  onSaveSnapshot,
  onShare,
  onOpenViraBot,
  onSelectPreset,
  onToggleSectionView,
  isSectionViewActive = false,
  activeSelectionMode = 'all',
  onChangeSelectionMode,
}) => {
  const [activeTab, setActiveTab] = useState<CADRibbonTab>('features');
  const [showFileMenu, setShowFileMenu] = useState<boolean>(false);
  const [showSelectMenu, setShowSelectMenu] = useState<boolean>(false);
  const [showPartsDropdown, setShowPartsDropdown] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
        setShowSelectMenu(false);
        setShowPartsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSaveClick = () => {
    if (onSaveSnapshot) {
      onSaveSnapshot();
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-[#0F172A] select-none shrink-0 font-sans z-30"
    >
      {/* ROW 1: PRIMARY CAD TOP TOOLBAR (SolidWorks / Fusion 360 Style) */}
      <div className="h-10 px-3 flex items-center justify-between gap-1 border-b border-[#F1F5F9] overflow-x-auto no-scrollbar">
        {/* Left: Brand + Document Title + File Operations */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cadvanta Brand & Home Button */}
          <button
            type="button"
            onClick={onGoHome}
            title="Return to Cadvanta Home"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer group mr-1"
          >
            <div className="w-5 h-5 rounded bg-[#059669] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              C
            </div>
            <span className="font-bold text-xs tracking-tight text-[#0F172A] group-hover:text-[#059669] transition-colors">
              CADVANTA
            </span>
          </button>

          <div className="h-4 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* Document Title / Preset Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPartsDropdown(!showPartsDropdown)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-semibold text-[#1E293B] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer max-w-[180px] sm:max-w-xs"
              title={`Current Design: ${part.name}`}
            >
              <Box className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="truncate">{part.name}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
            </button>

            {showPartsDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-[#CBD5E1] rounded-lg shadow-xl p-1.5 z-50 text-xs font-sans">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Mechanical Components
                </div>
                <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    { id: 'stepped_shaft', label: 'Stepped Transmission Shaft', type: 'shaft' as PartType },
                    { id: 'flange', label: 'ASME Bolted Flange', type: 'flange' as PartType },
                    { id: 'gear', label: 'Involute Spur Gear M2.5', type: 'gear' as PartType },
                    { id: 'bracket', label: 'Structural L-Mounting Bracket', type: 'bracket' as PartType },
                    { id: 'bearing', label: 'Deep Groove Ball Bearing 6206', type: 'bearing' as PartType },
                    { id: 'pillow_block', label: 'Pillow Block Housing', type: 'bearing_housing' as PartType },
                    { id: 'crankshaft', label: '4-Cylinder Forged Crankshaft', type: 'engine_crankshaft' as PartType },
                    { id: 'cylinder_block', label: 'IC Engine Cylinder Block', type: 'engine_cylinder_block' as PartType },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset?.(item.type);
                        setShowPartsDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-[#ECFDF5] hover:text-[#065F46] flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="truncate">{item.label}</span>
                      {part.part_type === item.type && (
                        <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* File Operations: New, Open, Save */}
          <div className="flex items-center gap-0.5">
            {/* New */}
            <button
              type="button"
              id="btn-cad-new"
              onClick={() => onNewDesign?.('shaft')}
              title="New Design"
              className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
            </button>

            {/* Open */}
            <button
              type="button"
              id="btn-cad-open"
              onClick={onOpenDesignLibrary}
              title="Open Design Library"
              className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>

            {/* Save */}
            <button
              type="button"
              id="btn-cad-save"
              onClick={handleSaveClick}
              title="Save Model Snapshot (Ctrl+S)"
              className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#475569] hover:text-[#059669] transition-colors cursor-pointer relative"
            >
              <Save className="w-3.5 h-3.5" />
              {saveToast && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
                  Saved
                </span>
              )}
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* History: Undo, Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              id="btn-cad-undo"
              onClick={onUndo}
              disabled={!canUndo || isViewOnly}
              title="Undo (Ctrl+Z)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                canUndo && !isViewOnly
                  ? 'text-[#475569] hover:text-[#059669] hover:bg-[#F1F5F9]'
                  : 'text-[#CBD5E1] cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-cad-redo"
              onClick={onRedo}
              disabled={!canRedo || isViewOnly}
              title="Redo (Ctrl+Y)"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                canRedo && !isViewOnly
                  ? 'text-[#475569] hover:text-[#059669] hover:bg-[#F1F5F9]'
                  : 'text-[#CBD5E1] cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* Select Tool Mode */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSelectMenu(!showSelectMenu)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeSelectionMode !== 'all'
                  ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title="Selection Filter (Face / Edge / Body)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden md:inline capitalize">{activeSelectionMode === 'all' ? 'Select' : activeSelectionMode}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {showSelectMenu && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-[#CBD5E1] rounded-lg shadow-xl p-1 z-50 text-xs">
                {(['all', 'face', 'edge', 'body'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onChangeSelectionMode?.(mode);
                      setShowSelectMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between capitalize cursor-pointer ${
                      activeSelectionMode === mode
                        ? 'bg-[#ECFDF5] text-[#065F46] font-semibold'
                        : 'hover:bg-[#F1F5F9] text-[#334155]'
                    }`}
                  >
                    <span>{mode === 'all' ? 'All Geometry' : `${mode} Priority`}</span>
                    {activeSelectionMode === mode && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Core CAD Action Buttons (SolidWorks Top Ribbon Shortcuts) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sketch */}
          <button
            type="button"
            id="btn-ribbon-sketch"
            onClick={onOpenSketcher}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Open 2D Parametric Sketcher"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Sketch</span>
          </button>

          {/* Extrude */}
          <button
            type="button"
            id="btn-ribbon-extrude"
            onClick={() => onTriggerDirectAction?.('extrude')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Extrude Boss/Base"
          >
            <Layers className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden sm:inline">Extrude</span>
          </button>

          {/* Revolve */}
          <button
            type="button"
            id="btn-ribbon-revolve"
            onClick={() => onTriggerDirectAction?.('revolve')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Revolve Boss/Base"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden sm:inline">Revolve</span>
          </button>

          {/* Fillet */}
          <button
            type="button"
            id="btn-ribbon-fillet"
            onClick={() => onTriggerDirectAction?.('fillet')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Fillet Edges"
          >
            <CircleDot className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden md:inline">Fillet</span>
          </button>

          {/* Chamfer */}
          <button
            type="button"
            id="btn-ribbon-chamfer"
            onClick={() => onTriggerDirectAction?.('chamfer')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Chamfer Edges"
          >
            <span className="text-[11px] font-bold text-[#059669]">∠</span>
            <span className="hidden md:inline">Chamfer</span>
          </button>

          {/* Hole */}
          <button
            type="button"
            id="btn-ribbon-hole"
            onClick={() => onTriggerDirectAction?.('hole')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Hole Wizard / Bore"
          >
            <Scissors className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden md:inline">Hole</span>
          </button>

          {/* Pattern */}
          <button
            type="button"
            id="btn-ribbon-pattern"
            onClick={() => onTriggerDirectAction?.('pattern')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Linear / Circular Pattern"
          >
            <Grid className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden lg:inline">Pattern</span>
          </button>

          {/* Mirror */}
          <button
            type="button"
            id="btn-ribbon-mirror"
            onClick={() => onTriggerDirectAction?.('mirror')}
            disabled={isViewOnly}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Mirror Feature / Body"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden lg:inline">Mirror</span>
          </button>

          <div className="h-4 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* Measure */}
          <button
            type="button"
            id="btn-ribbon-measure"
            onClick={() => onTriggerDirectAction?.('measure')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Smart Measurement Tool"
          >
            <Ruler className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">Measure</span>
          </button>

          {/* Section View */}
          <button
            type="button"
            id="btn-ribbon-section"
            onClick={onToggleSectionView}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
              isSectionViewActive
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                : 'hover:bg-[#F1F5F9] text-[#334155] border-transparent hover:border-[#E2E8F0]'
            }`}
            title="Section View Cutting Plane"
          >
            <Split className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden xl:inline">Section View</span>
          </button>

          {/* Material & Appearance */}
          <button
            type="button"
            id="btn-ribbon-material"
            onClick={onFocusProperties}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] hover:text-[#0F172A] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
            title="Assign Engineering Material & Physical Properties"
          >
            <Palette className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="hidden xl:inline">Material</span>
          </button>
        </div>

        {/* Right: Export + Share + Vira AI */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Export */}
          <button
            type="button"
            id="btn-ribbon-export"
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold transition-colors cursor-pointer"
            title="Export STEP, STL, OBJ, DXF"
          >
            <Download className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Share */}
          <button
            type="button"
            id="btn-ribbon-share"
            onClick={handleShareClick}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] text-xs font-medium transition-colors cursor-pointer relative"
            title="Share Design Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
            {shareCopied && (
              <span className="absolute -bottom-5 right-0 bg-[#0F172A] text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
                Link Copied!
              </span>
            )}
          </button>

          {/* 2D Drawing */}
          {onOpenDrawingModal && (
            <button
              type="button"
              id="btn-ribbon-drawing"
              onClick={onOpenDrawingModal}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] text-xs font-medium transition-colors cursor-pointer"
              title="Generate Technical 2D Engineering Drawing"
            >
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
              <span>2D Drawing</span>
            </button>
          )}

          {/* Vira AI Assistant */}
          {onOpenViraBot && (
            <button
              type="button"
              id="btn-ribbon-vira-ai"
              onClick={onOpenViraBot}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0] transition-colors cursor-pointer ml-1"
              title="Open VIRA AI Engineering Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>AI Assistant</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: EXPANDABLE CAD WORKBENCH TABS (Sketch / 3D Features / Inspect / Materials / Output) */}
      <div className="h-7 px-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: 'features' as CADRibbonTab, label: '3D Features' },
            { id: 'sketch' as CADRibbonTab, label: 'Sketch' },
            { id: 'inspect' as CADRibbonTab, label: 'Inspection' },
            { id: 'materials' as CADRibbonTab, label: 'Materials & Finish' },
            { id: 'output' as CADRibbonTab, label: 'Design Output' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#059669] font-bold shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Secondary Tools Strip */}
        <div className="flex items-center gap-3 text-[11px] text-[#475569] shrink-0">
          {activeTab === 'features' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('sweep')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Sweep
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('loft')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Loft
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('shell')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Shell
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('draft')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Draft
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('rib')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Rib
              </button>
              {onOpenPartLibrary && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onOpenPartLibrary}
                    className="text-[#059669] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <PackagePlus className="w-3 h-3" />
                    <span>Hardware Library</span>
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'sketch' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSketcher}
                className="hover:text-[#059669] cursor-pointer font-medium"
              >
                Line
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenSketcher}
                className="hover:text-[#059669] cursor-pointer font-medium"
              >
                Circle
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenSketcher}
                className="hover:text-[#059669] cursor-pointer font-medium"
              >
                Rectangle
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenSketcher}
                className="hover:text-[#059669] cursor-pointer font-medium"
              >
                Arc
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenSketcher}
                className="hover:text-[#059669] cursor-pointer font-medium"
              >
                Trim
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenSketcher}
                className="text-[#059669] font-bold cursor-pointer"
              >
                Smart Dimension
              </button>
            </div>
          )}

          {activeTab === 'inspect' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTriggerDirectAction?.('measure')}
                className="hover:text-[#059669] cursor-pointer"
              >
                Distance & Angle
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenCostEstimatorModal}
                className="hover:text-[#059669] cursor-pointer"
              >
                Mass Properties
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenEngineeringChecksModal}
                className="text-[#059669] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>DFM Check</span>
              </button>
              {onOpenFEAModal && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onOpenFEAModal}
                    className="hover:text-[#059669] cursor-pointer"
                  >
                    FEA Stress Analysis
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="flex items-center gap-2">
              <span className="text-[#0F172A] font-semibold">Current: {part.material?.name || 'AISI 304'}</span>
              <span>•</span>
              <span>Density: {part.material?.density || 8.0} g/cm³</span>
              <span>•</span>
              <button
                type="button"
                onClick={onFocusProperties}
                className="text-[#059669] font-bold cursor-pointer"
              >
                Change in Properties →
              </button>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenExportModal}
                className="hover:text-[#059669] cursor-pointer font-semibold"
              >
                STEP (.step)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenExportModal}
                className="hover:text-[#059669] cursor-pointer"
              >
                STL 3D Print (.stl)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenExportModal}
                className="hover:text-[#059669] cursor-pointer"
              >
                DXF 2D Drawing (.dxf)
              </button>
              {onOpenDrawingModal && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onOpenDrawingModal}
                    className="text-[#059669] font-bold cursor-pointer"
                  >
                    Engineering Drawing (PDF/SVG)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
