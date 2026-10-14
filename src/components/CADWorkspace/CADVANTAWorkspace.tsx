import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Layers,
  Table,
  Sliders,
  Scissors,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Move,
  RotateCw,
  History,
  Bot,
  Search,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { CADPart, PartType } from '../../types/cad';
import { CADViewer } from '../CADViewer/CADViewer';
import { useTheme } from '../../context/ThemeContext';
import { CADTopMenuBar } from './CADTopMenuBar';
import { CADContextualRibbon, RibbonWorkspaceMode } from './CADContextualRibbon';
import { CADFeatureTree } from './CADFeatureTree';
import { CADPropertiesPanel } from './CADPropertiesPanel';
import { CADStatusBar } from './CADStatusBar';
import { CADCommandSearchModal } from './CADCommandSearchModal';
import { CADInspectionModal } from './CADInspectionModal';
import { CADMobileNavBar } from './CADMobileNavBar';
import { CADMobileHeader } from './CADMobileHeader';
import { ViewportParametricAdjuster } from './ViewportParametricAdjuster';
import { GroundedStandardsModal } from '../EngineeringChecks/GroundedStandardsModal';
import { AssemblyDisassemblyCalloutOverlay } from './AssemblyDisassemblyCalloutOverlay';

interface CADVANTAWorkspaceProps {
  activePart: CADPart;
  onParameterChange: (key: string, value: any) => void;
  onMaterialChange: (materialId: string) => void;
  onUnitChange: (units: 'mm' | 'inch') => void;
  onOpenSketch?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDrawingModal?: () => void;
  onOpenTestSuiteModal?: () => void;
  onOpenCostEstimator?: () => void;
  onExecuteCommand?: (prompt: string) => void;
  cursorPos?: { x: number; y: number; z: number };
  setCursorPos?: (pos: { x: number; y: number; z: number }) => void;
  selectedGeometry?: any;
  setSelectedGeometry?: (geo: any) => void;
  modelVersions?: any[];
  onRestoreVersion?: (version: any) => void;
  onSaveManualSnapshot?: () => void;
  onDeleteVersion?: (id: string) => void;
  onSelectPreset?: (type: PartType) => void;
  onOpenDesignLibrary?: () => void;
  onOpenDashboard?: () => void;
  onGoHome?: () => void;
  onOpenExportModal?: () => void;
  onOpenAssemblyModal?: () => void;
  onOpenFEAModal?: () => void;
  onOpenViraBot?: () => void;
  onOpenDrawingConverter?: () => void;
  onOpenEngineeringSummary?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const CADVANTAWorkspace: React.FC<CADVANTAWorkspaceProps> = ({
  activePart,
  onParameterChange,
  onMaterialChange,
  onUnitChange,
  onOpenSketch = () => {},
  onOpenShortcuts = () => {},
  onOpenDrawingModal = () => {},
  onOpenTestSuiteModal = () => {},
  onOpenCostEstimator = () => {},
  onExecuteCommand = (_prompt: string) => {},
  cursorPos = { x: 0, y: 0, z: 0 },
  setCursorPos = (_pos: { x: number; y: number; z: number }) => {},
  selectedGeometry = null,
  setSelectedGeometry = (_geo: any) => {},
  modelVersions = [],
  onRestoreVersion = (_version: any) => {},
  onSaveManualSnapshot = () => {},
  onDeleteVersion = (_id: string) => {},
  onSelectPreset = (_type: PartType) => {},
  onOpenDesignLibrary = () => {},
  onOpenDashboard = () => {},
  onGoHome = () => {},
  onOpenExportModal = () => {},
  onOpenAssemblyModal = () => {},
  onOpenFEAModal = () => {},
  onOpenViraBot = () => {},
  onOpenDrawingConverter = () => {},
  onOpenEngineeringSummary = () => {},
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
}) => {
  const { theme } = useTheme();

  // Navigation & Workspace Modes
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonWorkspaceMode>('design');
  const [designSubMode, setDesignSubMode] = useState<'features' | 'sketch' | 'sheet_metal' | 'surfacing'>('features');

  // Panels visibility (Ctrl+1, Ctrl+2) - Unified Left Panel
  const [isFeatureTreeOpen, setIsFeatureTreeOpen] = useState<boolean>(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'tree' | 'params'>('tree');

  // Selected feature / component
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  // Viewport 3D State
  const [displayMode, setDisplayMode] = useState<'shaded_edges' | 'wireframe' | 'xray' | 'exploded' | 'section'>('shaded_edges');
  const [isSectionCutActive, setIsSectionCutActive] = useState<boolean>(false);
  const [isExplodedActive, setIsExplodedActive] = useState<boolean>(false);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);

  // Modals & Drawers
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState<boolean>(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState<boolean>(false);
  const [inspectionTab, setInspectionTab] = useState<'measure' | 'mass' | 'interference' | 'section'>('mass');
  const [isGroundedSearchOpen, setIsGroundedSearchOpen] = useState<boolean>(false);
  const [groundedSearchQuery, setGroundedSearchQuery] = useState<string>('');

  // Mobile Bottom Sheet State
  const [mobileBottomSheet, setMobileBottomSheet] = useState<'tree' | 'properties' | null>(null);

  // Fit View Trigger
  const handleFitView = useCallback(() => {
    window.dispatchEvent(new CustomEvent('cad-fit-view'));
  }, []);

  // Keyboard Shortcuts (Ctrl+1, Ctrl+2, Ctrl+K, Ctrl+S, F, Esc, Del)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Ctrl + 1: Toggle Feature Tree in Left Panel
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setIsFeatureTreeOpen((prev) => !prev);
        if (!isFeatureTreeOpen) setLeftPanelTab('tree');
      }
      // Ctrl + 2: Toggle Parameters in Left Panel
      else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setIsFeatureTreeOpen(true);
        setLeftPanelTab((prev) => (prev === 'params' ? 'tree' : 'params'));
      }
      // Ctrl + K: Command Search
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandSearchOpen(true);
      }
      // Ctrl + S: Save Snapshot
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveManualSnapshot();
      }
      // F: Fit View
      else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleFitView();
      }
      // Esc: Cancel selection
      else if (e.key === 'Escape') {
        setSelectedFeatureId(null);
        setSelectedGeometry(null);
      }
      // Delete: Delete selected
      else if (e.key === 'Delete' && selectedFeatureId) {
        setSelectedFeatureId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFitView, onSaveManualSnapshot, selectedFeatureId, setSelectedGeometry]);

  // Exploded View Slider change handler
  const handleExplodedProgressChange = (val: number) => {
    setExplodedProgress(val);
    onParameterChange('exploded_factor', val);
    setIsExplodedActive(val > 0);
  };

  const handleToggleExploded = () => {
    const next = !isExplodedActive;
    setIsExplodedActive(next);

    const startVal = explodedProgress;
    const targetVal = next ? 0.75 : 0;
    const duration = 750; // ms for smooth disassembly animation
    const startTime = performance.now();

    const animateExplode = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic-bezier easeInOut
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentVal = startVal + (targetVal - startVal) * ease;
      setExplodedProgress(currentVal);
      onParameterChange('exploded_factor', currentVal);

      if (progress < 1) {
        requestAnimationFrame(animateExplode);
      }
    };

    requestAnimationFrame(animateExplode);
  };

  const handleToggleSectionCut = () => {
    setIsSectionCutActive((prev) => !prev);
  };

  // Execute CAD Ribbon Operations
  const handleExecuteRibbonTool = (toolId: string, optionId?: string) => {
    switch (toolId) {
      case 'extrude':
      case 'tool_extrude':
        setSelectedFeatureId('feat_boss');
        setIsPropertiesOpen(true);
        onExecuteCommand('Apply extruded boss feature with specified length');
        break;
      case 'revolve':
        setSelectedFeatureId('feat_revolve');
        setIsPropertiesOpen(true);
        onExecuteCommand('Apply 360-degree cylindrical revolve feature to concentric shaft section');
        break;
      case 'cut':
        onExecuteCommand('Create precision extruded cut / bore through internal housing wall');
        break;
      case 'fillet':
        setSelectedFeatureId('feat_fillet');
        setIsPropertiesOpen(true);
        onExecuteCommand(optionId ? `Apply fillet radius ${optionId} mm` : 'Apply R2.0 mm stress-relief fillet');
        break;
      case 'chamfer':
        onExecuteCommand('Apply 1.5 mm x 45-degree lead-in chamfer to shaft ends');
        break;
      case 'hole_wizard':
      case 'skf_bearing_pocket':
        setSelectedFeatureId('feat_hole');
        setIsPropertiesOpen(true);
        onExecuteCommand('Model ISO 80mm H7 precision bearing seat bores and tapped M8 bolt pattern');
        break;
      case 'open_sketcher':
      case 'sketch':
      case 'tool_sketch':
        onOpenSketch();
        break;
      case 'insert_component':
        onOpenAssemblyModal();
        break;
      case 'mate_assistant':
      case 'mate_coincident':
        onExecuteCommand('Apply assembly mate constraint between components');
        break;
      case 'measure':
      case 'tool_measure':
        setInspectionTab('measure');
        setIsInspectionModalOpen(true);
        break;
      case 'mass_properties':
        setInspectionTab('mass');
        setIsInspectionModalOpen(true);
        break;
      case 'interference_detection':
        setInspectionTab('interference');
        setIsInspectionModalOpen(true);
        break;
      case 'fea_analysis':
      case 'fea_safety_factor':
      case 'fea_thermal':
        onOpenFEAModal();
        break;
      case 'tool_drawing':
        onOpenDrawingModal();
        break;
      case '2d_to_3d_converter':
        onOpenDrawingConverter();
        break;
      case 'tool_bom':
        onOpenDrawingModal();
        break;
      case 'open_vira':
        onOpenViraBot();
        break;
      case 'export_step':
      case 'export_stl':
        onOpenExportModal();
        break;
      default:
        break;
    }
  };

  return (
    <div
      id="cadvanta-pro-cad-workspace"
      className="flex flex-col w-full h-full bg-[#FFFFFF] text-[#0F172A] overflow-hidden select-none font-sans"
    >
      {/* 0. MOBILE ONLY ESSENTIAL HEADER (Back | Project | Undo/Redo | Fit View | View | + / Create) */}
      <CADMobileHeader
        part={activePart}
        onGoHome={onGoHome}
        onOpenDashboard={onOpenDashboard}
        onSelectPreset={onSelectPreset || (() => {})}
        onOpenDesignLibrary={onOpenDesignLibrary}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onFitView={handleFitView}
        onOpenSketch={onOpenSketch}
        onExecuteTool={handleExecuteRibbonTool}
        onMaterialChange={onMaterialChange}
        onOpenInspection={(tab) => {
          setInspectionTab(tab);
          setIsInspectionModalOpen(true);
        }}
        isSectionCutActive={isSectionCutActive}
        onToggleSectionCut={handleToggleSectionCut}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
      />

      {/* 1. TOP MENU BAR (Desktop Only md:flex): Cadvanta Logo | File | Edit | View | Insert | Tools | Inspect | Assembly | Simulation | Help */}
      <CADTopMenuBar
        activePart={activePart}
        onSelectPreset={onSelectPreset}
        onOpenDrawingModal={onOpenDrawingModal}
        onOpenTestSuiteModal={onOpenTestSuiteModal}
        onOpenCostEstimator={onOpenCostEstimator}
        onOpenSketch={onOpenSketch}
        onOpenShortcuts={onOpenShortcuts}
        onOpenDesignLibrary={onOpenDesignLibrary}
        onOpenDashboard={onOpenDashboard}
        onGoHome={onGoHome}
        onOpenExportModal={onOpenExportModal}
        onOpenAssemblyModal={onOpenAssemblyModal}
        onOpenFEAModal={onOpenFEAModal}
        onOpenViraBot={onOpenViraBot}
        onOpenDrawingConverter={onOpenDrawingConverter}
        onOpenEngineeringSummary={onOpenEngineeringSummary}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onFitView={handleFitView}
        onSaveSnapshot={onSaveManualSnapshot}
        onOpenCommandSearch={() => setIsCommandSearchOpen(true)}
        onToggleFeatureTree={() => setIsFeatureTreeOpen(!isFeatureTreeOpen)}
        onToggleProperties={() => {
          setIsFeatureTreeOpen(true);
          setLeftPanelTab((prev) => (prev === 'params' ? 'tree' : 'params'));
        }}
        isFeatureTreeOpen={isFeatureTreeOpen}
        isPropertiesOpen={leftPanelTab === 'params'}
      />

      {/* 2. CONTEXTUAL RIBBON TOOLBAR (Desktop Only md:block) */}
      <CADContextualRibbon
        activeTab={activeRibbonTab}
        onSelectTab={setActiveRibbonTab}
        onExecuteTool={handleExecuteRibbonTool}
        designSubMode={designSubMode}
        onChangeDesignSubMode={setDesignSubMode}
        isExplodedActive={isExplodedActive}
        onToggleExploded={handleToggleExploded}
        explodedProgress={explodedProgress}
        onExplodedProgressChange={handleExplodedProgressChange}
        isSectionCutActive={isSectionCutActive}
        onToggleSectionCut={handleToggleSectionCut}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
      />

      {/* 3. MAIN WORKSPACE: SLIM LEFT ENGINEERING PANEL | FULL-WIDTH CENTER & RIGHT 3D WHITE CANVAS */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* LEFT COLUMN: SLIM UNIFIED MODEL / FEATURE & PARAMETERS PANEL */}
        {isFeatureTreeOpen && (
          <div className="w-[210px] xl:w-[220px] shrink-0 h-full hidden md:flex flex-col z-20 transition-all border-r border-[#E2E8F0] shadow-xs">
            <CADFeatureTree
              part={activePart}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={(id) => {
                setSelectedFeatureId(id);
              }}
              onEditFeature={(id) => {
                setSelectedFeatureId(id);
                setLeftPanelTab('params');
              }}
              onToggleVisibility={(id) => {
                // toggle visibility
              }}
              onToggleSuppress={(id) => {
                // toggle suppress
              }}
              onDeleteFeature={(id) => {
                setSelectedFeatureId(null);
              }}
              onParameterChange={onParameterChange}
              onMaterialChange={onMaterialChange}
              activeTab={leftPanelTab}
              onTabChange={setLeftPanelTab}
            />
          </div>
        )}

        {/* CENTER & RIGHT COLUMN: EXPANSIVE FULL-WIDTH 3D CAD CANVAS */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#1E2228] relative overflow-hidden">
          {/* Main 3D Three.js CAD Viewport with Assembly Model Group CSS Transitions */}
          <div
            id="assembly-model-group-viewport"
            className={`w-full h-full relative assembly-model-group-wrapper ${
              isExplodedActive ? 'exploded-active' : 'exploded-compact'
            }`}
          >
            <CADViewer
              part={activePart}
              displayMode={displayMode}
              isSectionCutActive={isSectionCutActive}
              isExplodedActive={isExplodedActive}
              explodedFactor={explodedProgress}
              onCursorMove={(pos) => setCursorPos(pos)}
              onSelectGeometry={(geo) => {
                setSelectedGeometry(geo);
              }}
            />

            {/* Clear Visual Representation of Part Disassembly with Smooth CSS Transitions */}
            <AssemblyDisassemblyCalloutOverlay
              isExploded={isExplodedActive}
              explodedProgress={explodedProgress}
              part={activePart}
            />
          </div>

          {/* In-Place Parametric Dimension Adjuster ("Adjust Anywhere" HUD) */}
          <ViewportParametricAdjuster
            part={activePart}
            onParameterChange={onParameterChange}
            selectedFeatureId={selectedFeatureId}
            onOpenGroundedSearch={(q) => {
              setGroundedSearchQuery(q);
              setIsGroundedSearchOpen(true);
            }}
            onOpenViraBot={onOpenViraBot}
          />

          {/* Quick HUD Exploded Slider Widget (Bottom center of viewport) */}
          {isExplodedActive && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] shadow-lg text-xs font-mono text-[#0F172A] animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                Exploded Disassembly:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedProgress}
                onChange={(e) => handleExplodedProgressChange(parseFloat(e.target.value))}
                className="w-32 accent-emerald-600 cursor-pointer"
              />
              <span className="w-10 font-bold text-emerald-700">
                {Math.round(explodedProgress * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <CADStatusBar
        part={activePart}
        cursorPos={cursorPos}
        selectedFeatureId={selectedFeatureId}
        onOpenUnitSwitch={() => onUnitChange(activePart.units === 'mm' ? 'inch' : 'mm')}
        onOpenMaterialModal={() => setIsInspectionModalOpen(true)}
        onOpenShortcuts={onOpenShortcuts}
      />

      {/* 5. MOBILE BOTTOM NAVIGATION & TOOLBAR (PHONE ONLY < 768px) */}
      <CADMobileNavBar
        part={activePart}
        onOpenFeatureTree={() => setMobileBottomSheet('tree')}
        onOpenProperties={() => setMobileBottomSheet('properties')}
        onOpenTools={() => setIsCommandSearchOpen(true)}
        onOpenViraBot={onOpenViraBot || (() => {})}
      />

      {/* MOBILE BOTTOM SHEETS FOR FEATURE TREE AND PROPERTIES */}
      {mobileBottomSheet && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setMobileBottomSheet(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <span className="font-bold text-xs text-[#0F172A] uppercase">
                {mobileBottomSheet === 'tree' ? 'Model Feature Tree' : 'Part Parameters & Properties'}
              </span>
              <button
                onClick={() => setMobileBottomSheet(null)}
                className="p-1 rounded hover:bg-slate-100 text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mobileBottomSheet === 'tree' ? (
                <CADFeatureTree
                  part={activePart}
                  selectedFeatureId={selectedFeatureId}
                  onSelectFeature={(id) => {
                    setSelectedFeatureId(id);
                    setMobileBottomSheet('properties');
                  }}
                />
              ) : (
                <CADPropertiesPanel
                  part={activePart}
                  selectedFeatureId={selectedFeatureId}
                  onParameterChange={onParameterChange}
                  onMaterialChange={onMaterialChange}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. COMMAND SEARCH MODAL (Ctrl + K) */}
      <CADCommandSearchModal
        isOpen={isCommandSearchOpen}
        onClose={() => setIsCommandSearchOpen(false)}
        onExecuteCommand={handleExecuteRibbonTool}
      />

      {/* 7. DEDICATED INSPECTION MODAL */}
      <CADInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        part={activePart}
        initialTab={inspectionTab}
      />

      {/* 8. LIVE GOOGLE SEARCH GROUNDING STANDARDS MODAL */}
      <GroundedStandardsModal
        isOpen={isGroundedSearchOpen}
        onClose={() => setIsGroundedSearchOpen(false)}
        currentPart={activePart}
        initialQuery={groundedSearchQuery}
        onApplyParameterFix={(params) => {
          Object.entries(params).forEach(([k, v]) => onParameterChange(k, v));
        }}
      />
    </div>
  );
};
