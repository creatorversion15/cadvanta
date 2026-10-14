import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CADPart, PartType } from '../../types/cad';
import {
  exportToSTLBinary,
  exportToOBJ,
  exportToJSON,
  triggerBlobDownload,
} from '../../engine/stlExporter';
import { exportToDXF } from '../../engine/advancedExporters';
import { generateEngineeringSummaryReportPDF } from '../../engine/pdfReportGenerator';
import { CadVantaLogo } from '../Brand/CadVantaLogo';
import {
  Layers,
  Download,
  FileCode,
  FileText,
  Boxes,
  ChevronDown,
  Sparkles,
  Compass,
  Activity,
  Bot,
  Lock,
  Unlock,
  Crown,
  Search,
  Check,
  Menu,
  X,
  UserCheck,
  Share2,
  Cpu,
  Wrench,
  Puzzle,
  Network,
  Sun,
  Moon,
  FolderOpen,
  Calculator,
  Cloud,
  ShieldCheck,
  Keyboard,
  Undo2,
  Redo2,
  PenTool,
  PackagePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSubscription, SUBSCRIPTION_PRICE_INR } from '../../context/SubscriptionContext';
import { useTheme } from '../../context/ThemeContext';
import { UserAuthWidget } from './UserAuthWidget';

interface HeaderProps {
  part: CADPart;
  onSelectPreset: (type: PartType) => void;
  onOpenDesignLibrary?: () => void;
  onOpenDrawingModal: () => void;
  onOpenTestSuiteModal: () => void;
  onOpenViraBot: () => void;
  onOpenMakerModal: () => void;
  onOpenDashboard?: () => void;
  isDashboard?: boolean;
  onGoHome: () => void;
  isHome: boolean;
  onOpenExportModal?: () => void;
  onOpenAssemblyModal?: () => void;
  onOpenSheetMetalModal?: () => void;
  onOpenSurfacingModal?: () => void;
  onOpenFEAModal?: () => void;
  onOpenCollaborationModal?: () => void;
  onOpenIntegrationsModal?: () => void;
  onOpenGenerativeDesignModal?: () => void;
  onOpenPluginManagerModal?: () => void;
  onOpenCostEstimatorModal?: () => void;
  onOpenEngineeringChecksModal?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSketcher?: () => void;
  onOpenPartLibrary?: () => void;
  onOpenImageStudio?: () => void;
  onOpenDrawingConverter?: () => void;
  onOpenEngineeringSummary?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  part,
  onSelectPreset,
  onOpenDesignLibrary,
  onOpenDrawingModal,
  onOpenTestSuiteModal,
  onOpenViraBot,
  onOpenMakerModal,
  onOpenDashboard,
  isDashboard,
  onGoHome,
  isHome,
  onOpenExportModal,
  onOpenAssemblyModal,
  onOpenSheetMetalModal,
  onOpenSurfacingModal,
  onOpenFEAModal,
  onOpenCollaborationModal,
  onOpenIntegrationsModal,
  onOpenGenerativeDesignModal,
  onOpenPluginManagerModal,
  onOpenCostEstimatorModal,
  onOpenEngineeringChecksModal,
  onOpenShortcuts,
  onOpenSketcher,
  onOpenPartLibrary,
  onOpenImageStudio,
  onOpenDrawingConverter,
  onOpenEngineeringSummary,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const { isPro, openSubscriptionModal } = useSubscription();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showPresetsMenu, setShowPresetsMenu] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showMobilePresetsPicker, setShowMobilePresetsPicker] = useState<boolean>(false);
  const [showStepNotification, setShowStepNotification] = useState<boolean>(false);
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const presetsDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (presetsDropdownRef.current && !presetsDropdownRef.current.contains(target)) {
        setShowPresetsMenu(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(target)) {
        setShowExportMenu(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setShowToolsMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !(target as HTMLElement).closest('#btn-mobile-menu-toggle')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPresetsMenu(false);
        setShowExportMenu(false);
        setShowToolsMenu(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
  
  return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const presets = [
    { type: 'shaft' as PartType, label: 'Stepped Shaft', desc: 'Rotational transmission', icon: Activity, isPro: false },
    { type: 'flange' as PartType, label: 'Mounting Flange', desc: 'Pipe connector', icon: Compass, isPro: false },
    { type: 'bracket' as PartType, label: 'L-Bracket', desc: 'Structural mount', icon: Layers, isPro: false },
    { type: 'planetary_gearbox' as PartType, label: 'Planetary Gearbox', desc: 'Epicyclic train', icon: Boxes, isPro: true },
    { type: 'gear' as PartType, label: 'Spur Gear', desc: 'Power transmission', icon: Activity, isPro: true },
    { type: 'helical_gear' as PartType, label: 'Helical Gear', desc: 'Smooth engagement', icon: Activity, isPro: true }
  ];

  const handleSelectPresetClick = (p: any) => {
    if (p.isPro && !isPro) {
      openSubscriptionModal();
      return;
    }
    onSelectPreset(p.type);
    setShowPresetsMenu(false);
  };

  const handleExportSTEP = () => {
    const jsonStr = exportToJSON(part);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerBlobDownload(blob, `${part.name || 'cad_model'}_STEP.json`);
    setShowStepNotification(true);
    setTimeout(() => setShowStepNotification(false), 5000);
    setShowExportMenu(false);
  };

  const handleExportSTL = () => {
    window.dispatchEvent(new CustomEvent('export-stl-request'));
    setShowExportMenu(false);
  };

  const handleExportDXF = () => {
    const blob = exportToDXF(part, { format: 'dxf', units: part.units === 'inch' ? 'inch' : 'mm', resolution: 'standard' });
    triggerBlobDownload(blob, `${part.name || 'cad_model'}_2D.dxf`);
    setShowExportMenu(false);
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative z-40 h-[60px] w-full bg-[#07130F]/95 backdrop-blur-md border-b border-[rgba(16,185,129,0.15)] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-sm text-[#F0FDF4] overflow-visible"
    >
      {/* ========================================================================= */}
      {/* LEFT SECTION: Logo + Founder + Design Library + Current Design            */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Logo & Brand Name */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 group hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
          title="CADVANTA | AI for Better Mechanical Designs"
        >
          <CadVantaLogo variant="wordmark" size="md" />
          <span className="text-[10px] font-sans uppercase px-1.5 py-0.5 rounded-sm bg-[#102B21] text-[#00F5A0] font-semibold border border-[#00F5A0]/20 hidden 2xl:inline-block whitespace-nowrap ml-1">
            3D CAD
          </span>
        </button>

        <div className="h-5 w-[1px] bg-[rgba(16,185,129,0.15)] hidden lg:block shrink-0" />

        {/* Founder Badge */}
        <button
          onClick={onOpenMakerModal}
          className="hidden xl:flex items-center gap-1.5 text-xs font-sans text-[#8CA89E] hover:text-[#00F5A0] transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          title="Founder & Lead Architect: Viraj Bansod"
        >
          <span className="text-[11px] whitespace-nowrap">
            Founder: <strong className="font-medium text-[#F0FDF4] transition-colors">Viraj Bansod</strong>
          </span>
        </button>

        <div className="h-5 w-[1px] bg-[rgba(16,185,129,0.15)] hidden xl:block shrink-0" />

        {/* Design Library */}
        {onOpenDesignLibrary && (
          <button
            onClick={onOpenDesignLibrary}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#0B1E17] border border-transparent hover:border-[rgba(16,185,129,0.15)] rounded-md text-[13px] font-sans font-medium text-[#8CA89E] hover:text-[#F0FDF4] transition-colors shrink-0 cursor-pointer"
            title="Open Design Library"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">DESIGN LIBRARY</span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>
        )}

        {/* Current Design */}
        {!isHome && (
          <div className="relative shrink min-w-0 flex items-center" ref={presetsDropdownRef}>
            <button
              onClick={() => {
                setShowPresetsMenu(!showPresetsMenu);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-transparent hover:bg-[#0B1E17] border border-transparent hover:border-[rgba(16,185,129,0.15)] rounded-md text-xs sm:text-[13px] font-sans font-medium text-[#F0FDF4] transition-colors cursor-pointer max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-xs min-w-0"
              title={`Current Design: ${part.name}`}
            >
              <Compass className="w-4 h-4 text-[#00F5A0] shrink-0 hidden sm:block" />
              <span className="truncate block text-left">
                {part.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8CA89E] transition-transform duration-200 shrink-0 ${
                  showPresetsMenu ? 'rotate-180 text-[#00F5A0]' : ''
                }`}
              />
            </button>

            {/* Presets Selection Dropdown Menu */}
            <AnimatePresence>
              {showPresetsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded-xl shadow-2xl p-2.5 z-50 text-[#F0FDF4] max-h-[80vh] flex flex-col"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(16,185,129,0.15)]">
                    <div className="text-[11px] uppercase font-sans tracking-widest text-[#00F5A0] font-semibold flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      Engineering Library
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 mt-2 pr-1 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#102B21 transparent' }}>
                    {presets.map((p) => (
                      <button
                        key={p.type}
                        onClick={() => handleSelectPresetClick(p)}
                        className={`w-full flex items-start gap-3 p-2 rounded-lg border transition-all text-left group cursor-pointer ${
                          part.type === p.type
                            ? 'bg-[#102B21] border-[#00F5A0]/40'
                            : 'bg-transparent border-transparent hover:bg-[#0B1E17] hover:border-[rgba(16,185,129,0.2)]'
                        }`}
                      >
                        <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center shrink-0 ${part.type === p.type ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-[#0B1E17] text-[#8CA89E] group-hover:text-[#F0FDF4]'}`}>
                          <p.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className={`text-[13px] font-sans font-medium truncate ${part.type === p.type ? 'text-[#00F5A0]' : 'text-[#F0FDF4]'}`}>
                              {p.label}
                            </div>
                            {p.isPro && !isPro && (
                              <Lock className="w-3 h-3 text-[#F59E0B] shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#8CA89E] font-sans mt-0.5 line-clamp-1">{p.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick CAD Operations Toolbar: Undo, Redo, 2D Sketch, Part Library */}
        {!isHome && (
          <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-[rgba(16,185,129,0.2)]">
            {onUndo && (
              <button
                id="btn-header-undo"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  canUndo
                    ? 'text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#0B1E17]'
                    : 'text-[#8CA89E]/30 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}

            {onRedo && (
              <button
                id="btn-header-redo"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  canRedo
                    ? 'text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#0B1E17]'
                    : 'text-[#8CA89E]/30 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            )}

            {onOpenSketcher && (
              <button
                id="btn-header-sketch"
                onClick={onOpenSketcher}
                title="Open 2D Parametric Sketcher Workspace"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#0B1E17] rounded border border-transparent hover:border-[rgba(16,185,129,0.2)] transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span className="hidden xl:inline">2D Sketch</span>
              </button>
            )}

            {onOpenPartLibrary && (
              <button
                id="btn-header-part-library"
                onClick={onOpenPartLibrary}
                title="Insert Standard Hardware (Bearings, Fasteners, Gears, Motors)"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#0B1E17] rounded border border-transparent hover:border-[rgba(16,185,129,0.2)] transition-colors cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span className="hidden xl:inline">Part Library</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Get Pro + 2D Drawing + Export + Theme + Avatar           */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
        
        {/* Get Pro Button */}
        <button
          onClick={() => openSubscriptionModal()}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-sans font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            isPro
              ? 'bg-[#102B21] text-[#00F5A0] hover:bg-[#00F5A0] hover:text-[#02140D]'
              : 'bg-transparent text-[#F59E0B] hover:text-[#00F5A0] border border-[#F59E0B]/30 hover:border-[#00F5A0]/50'
          }`}
          title={isPro ? 'CADVANTA PRO is active' : 'Upgrade to CADVANTA PRO'}
        >
          {isPro ? (
            <>
              <Crown className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>PRO ACTIVE</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>GET PRO</span>
            </>
          )}
        </button>

        {/* 2D Drawing */}
        {!isHome && (
          <button
            onClick={onOpenDrawingModal}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#0B1E17] border border-transparent hover:border-[rgba(16,185,129,0.15)] text-[13px] font-sans font-medium text-[#F0FDF4] rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            title="Generate Engineering Technical Drawing (SVG/DXF)"
          >
            <FileText className="w-4 h-4 text-[#8CA89E] shrink-0" />
            <span>2D Drawing</span>
          </button>
        )}

        {/* AI Image Studio Button */}
        {onOpenImageStudio && (
          <button
            id="btn-header-image-studio"
            onClick={onOpenImageStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#092016] hover:bg-[#102B21] border border-[#00F5A0]/40 hover:border-[#00F5A0]/70 text-[13px] font-sans font-medium text-[#00F5A0] hover:text-[#15FFAE] rounded-md transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-[0_0_12px_rgba(0,245,160,0.15)]"
            title="AI Image Studio - Create & Edit Images with gemini-3.1-flash-image-preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
            <span>Image Studio</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] hidden xl:inline uppercase font-bold">
              AI
            </span>
          </button>
        )}

        {/* Vanta 2D-to-3D Converter Button */}
        {onOpenDrawingConverter && (
          <button
            id="btn-header-drawing-converter"
            onClick={onOpenDrawingConverter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#071510] hover:bg-[#102B21] border border-[#00F5A0]/50 hover:border-[#00F5A0] text-[13px] font-sans font-medium text-[#00F5A0] rounded-md transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-[0_0_12px_rgba(0,245,160,0.15)]"
            title="Vanta 2D-to-3D Converter - Convert engineering drawings into 3D CAD models"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
            <span>2D → 3D</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] hidden xl:inline uppercase font-bold">
              CAD
            </span>
          </button>
        )}

        {/* Export Dropdown */}
        {!isHome && (
          <div className="relative shrink-0" ref={exportDropdownRef}>
            <button
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowPresetsMenu(false);
                setShowToolsMenu(false);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#0B1E17] border border-transparent hover:border-[rgba(16,185,129,0.15)] text-[13px] font-sans font-medium text-[#F0FDF4] rounded-md transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#8CA89E] shrink-0" />
              <span>EXPORT</span>
              <ChevronDown className={`w-3 h-3 text-[#8CA89E] transition-transform duration-200 shrink-0 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 text-[#F0FDF4]"
                >
                  <div className="px-2.5 py-1 text-[10px] uppercase font-sans tracking-widest text-[#8CA89E] font-semibold border-b border-[rgba(16,185,129,0.12)] pb-1 mb-1">
                    CAD Formats
                  </div>
                  
                  <button
                    onClick={handleExportSTEP}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-transparent hover:bg-[#0B1E17] transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0B1E17] text-[#8CA89E] group-hover:text-[#00F5A0] group-hover:bg-[#102B21]">
                        <Boxes className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-sans font-medium text-[#F0FDF4]">STEP Solid</div>
                        <div className="text-[10px] font-sans text-[#8CA89E]">NURBS & B-Rep</div>
                      </div>
                    </div>
                    {!isPro && <Lock className="w-3 h-3 text-[#F59E0B]" />}
                  </button>

                  <button
                    onClick={handleExportSTL}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-transparent hover:bg-[#0B1E17] transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0B1E17] text-[#8CA89E] group-hover:text-[#00F5A0] group-hover:bg-[#102B21]">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-sans font-medium text-[#F0FDF4]">STL Mesh</div>
                        <div className="text-[10px] font-sans text-[#8CA89E]">For 3D Printing</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportDXF}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-transparent hover:bg-[#0B1E17] transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#0B1E17] text-[#8CA89E] group-hover:text-[#00F5A0] group-hover:bg-[#102B21]">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-sans font-medium text-[#F0FDF4]">DXF 2D</div>
                        <div className="text-[10px] font-sans text-[#8CA89E]">Laser & Waterjet</div>
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-[rgba(16,185,129,0.12)] my-1" />

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      if (onOpenEngineeringSummary) {
                        onOpenEngineeringSummary();
                      } else {
                        generateEngineeringSummaryReportPDF(part, { downloadImmediately: true });
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#00F5A0]/10 hover:bg-[#00F5A0]/20 border border-[#00F5A0]/30 transition-colors text-left group cursor-pointer"
                    title="Export formal 3-page ISO 9001 / ASME engineering summary dossier"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00F5A0]/20 text-[#00F5A0] group-hover:bg-[#00F5A0] group-hover:text-[#030A07]">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-sans font-bold text-[#00F5A0]">Engineering Dossier</div>
                        <div className="text-[10px] font-sans text-[#8CA89E]">Costs, FEA & DFM PDF</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-[#00F5A0] text-[#030A07] px-1.5 py-0.5 rounded font-bold">PDF</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="w-[1px] h-5 bg-[rgba(16,185,129,0.2)] mx-1 hidden sm:block shrink-0" />

        {/* User Auth Widget */}
        <div className="shrink-0 flex items-center">
          <UserAuthWidget />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="flex md:hidden items-center justify-center min-w-[40px] min-h-[40px] rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] shrink-0 transition-colors cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE FULL-SCREEN MENU DRAWER                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[60px] left-0 right-0 bottom-0 bg-[#07130F]/98 backdrop-blur-xl border-b border-[rgba(16,185,129,0.2)] shadow-2xl z-50 overflow-y-auto pb-24"
          >
            <div className="flex flex-col p-4 gap-3 max-w-lg mx-auto">
              {/* Pro Status Banner */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openSubscriptionModal();
                }}
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#102B21] to-[#0B1E17] border border-[#00F5A0]/30 rounded-xl text-left cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00F5A0]/20 flex items-center justify-center text-[#00F5A0]">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F0FDF4] uppercase tracking-wider">
                      {isPro ? 'CADVANTA PRO ACTIVE' : 'UPGRADE TO CADVANTA PRO'}
                    </div>
                    <div className="text-[11px] font-mono text-[#8CA89E]">
                      {isPro ? 'All hard engineering engines unlocked' : `₹${SUBSCRIPTION_PRICE_INR} one-time lifetime access`}
                    </div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-[#00F5A0] shrink-0" />
              </button>

              {/* Engineering Tools Section */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono font-bold text-[#8CA89E] uppercase tracking-wider px-1">
                  Engineering Tools & Solvers
                </div>
                
                {/* AI Image Studio */}
                {onOpenImageStudio && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenImageStudio();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#092016] hover:bg-[#102B21] border border-[#00F5A0]/40 rounded-xl text-xs font-mono text-[#00F5A0] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">AI Image Studio (Create & Edit)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00F5A0]/20 text-[#00F5A0] font-bold">
                      gemini-3.1
                    </span>
                  </button>
                )}

                {/* 2D to 3D Converter */}
                {onOpenDrawingConverter && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDrawingConverter();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#092016] hover:bg-[#102B21] border border-[#00F5A0]/50 rounded-xl text-xs font-mono text-[#00F5A0] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">2D to 3D CAD Converter</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00F5A0]/20 text-[#00F5A0] font-bold">
                      B-Rep
                    </span>
                  </button>
                )}

                {onOpenDesignLibrary && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDesignLibrary();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">Design Library & Catalog</span>
                  </button>
                )}

                {!isHome && onOpenDrawingModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDrawingModal();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">2D Engineering Drawings (ISO)</span>
                  </button>
                )}

                {onOpenAssemblyModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAssemblyModal();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <Boxes className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">Multi-Body Assembly & Mates</span>
                  </button>
                )}

                {onOpenFEAModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenFEAModal();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span className="font-bold flex-1 text-left">FEA Von Mises Stress Analysis</span>
                  </button>
                )}

                {onOpenCostEstimatorModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCostEstimatorModal();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <Calculator className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">BOM & Manufacturing Cost Estimator</span>
                  </button>
                )}

                {onOpenViraBot && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenViraBot();
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-xs font-mono text-[#F0FDF4] transition-colors cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-[#00F5A0] shrink-0" />
                    <span className="font-bold flex-1 text-left">VIRA AI Mechanical Assistant</span>
                  </button>
                )}
              </div>

              {/* Exports Section */}
              {!isHome && (
                <div className="space-y-1.5 pt-2 border-t border-[rgba(16,185,129,0.15)]">
                  <div className="text-[10px] font-mono font-bold text-[#8CA89E] uppercase tracking-wider px-1">
                    CAD Exports
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleExportSTEP();
                      }}
                      className="min-h-[44px] flex flex-col items-center justify-center p-2 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-center cursor-pointer"
                    >
                      <Boxes className="w-4 h-4 text-[#00F5A0] mb-1" />
                      <span className="text-[11px] font-mono font-bold text-[#F0FDF4]">STEP</span>
                      <span className="text-[9px] font-mono text-[#8CA89E]">Solid</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleExportSTL();
                      }}
                      className="min-h-[44px] flex flex-col items-center justify-center p-2 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-center cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-[#00F5A0] mb-1" />
                      <span className="text-[11px] font-mono font-bold text-[#F0FDF4]">STL</span>
                      <span className="text-[9px] font-mono text-[#8CA89E]">3D Print</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleExportDXF();
                      }}
                      className="min-h-[44px] flex flex-col items-center justify-center p-2 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.15)] rounded-xl text-center cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#00F5A0] mb-1" />
                      <span className="text-[11px] font-mono font-bold text-[#F0FDF4]">DXF</span>
                      <span className="text-[9px] font-mono text-[#8CA89E]">2D CNC</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Platform Details & Maker */}
              <div className="pt-2 border-t border-[rgba(16,185,129,0.15)] flex items-center justify-between text-xs font-mono text-[#8CA89E]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenMakerModal();
                  }}
                  className="flex items-center gap-1.5 text-[#8CA89E] hover:text-[#00F5A0] transition-colors p-1 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#00F5A0]" />
                  <span>Founder: <strong>Viraj Bansod</strong></span>
                </button>

                {onOpenShortcuts && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenShortcuts();
                    }}
                    className="flex items-center gap-1 text-[#8CA89E] hover:text-[#00F5A0] transition-colors p-1 cursor-pointer"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Shortcuts</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP Solid Notification Toast */}
      {showStepNotification && (
        <div className="absolute top-[70px] right-4 z-50 p-4 bg-[#0B1E17] border border-[#00F5A0]/40 rounded-lg shadow-2xl flex items-start gap-3 max-w-sm text-sm animate-in fade-in text-[#F0FDF4]">
          <Sparkles className="w-5 h-5 text-[#00F5A0] shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold text-[#00F5A0] font-sans">B-Rep STEP Solid Model</div>
            <p className="text-[#8CA89E] font-sans leading-relaxed text-xs">
              STL export is ready for 3D printing and CAM milling. Native STEP NURBS solid export is supported via JSON definition.
            </p>
          </div>
        </div>
      )}
    </motion.header>
  );

};
