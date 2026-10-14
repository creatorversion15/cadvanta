import React, { useState, useRef, useEffect } from 'react';
import { CadVantaLogoMark } from '../Brand/CadVantaLogo';
import {
  Compass,
  FileText,
  Layers,
  Save,
  Undo2,
  Redo2,
  Search,
  Maximize2,
  Moon,
  Sun,
  Bot,
  Sparkles,
  ChevronDown,
  FileBox,
  FolderOpen,
  Printer,
  Share2,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Zap,
  HelpCircle,
  Keyboard,
  ExternalLink,
  Boxes,
  Activity,
  Cpu,
  Scissors,
  Eye,
  Wrench,
  PanelLeft,
  PanelRight,
  Home,
  LayoutDashboard,
  Crown,
} from 'lucide-react';
import { CADPart, PartType } from '../../types/cad';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { generateEngineeringSummaryReportPDF } from '../../engine/pdfReportGenerator';

interface CADTopMenuBarProps {
  activePart: CADPart;
  onSelectPreset: (type: PartType) => void;
  onOpenDrawingModal: () => void;
  onOpenTestSuiteModal: () => void;
  onOpenCostEstimator: () => void;
  onOpenSketch: () => void;
  onOpenShortcuts: () => void;
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
  onFitView?: () => void;
  onSaveSnapshot?: () => void;
  onOpenCommandSearch: () => void;
  onToggleFeatureTree: () => void;
  onToggleProperties: () => void;
  isFeatureTreeOpen: boolean;
  isPropertiesOpen: boolean;
}

export const CADTopMenuBar: React.FC<CADTopMenuBarProps> = ({
  activePart,
  onSelectPreset,
  onOpenDrawingModal,
  onOpenTestSuiteModal,
  onOpenCostEstimator,
  onOpenSketch,
  onOpenShortcuts,
  onOpenDesignLibrary,
  onOpenDashboard,
  onGoHome,
  onOpenExportModal,
  onOpenAssemblyModal,
  onOpenFEAModal,
  onOpenViraBot,
  onOpenDrawingConverter,
  onOpenEngineeringSummary,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onFitView,
  onSaveSnapshot,
  onOpenCommandSearch,
  onToggleFeatureTree,
  onToggleProperties,
  isFeatureTreeOpen,
  isPropertiesOpen,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isPro, openSubscriptionModal } = useSubscription();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showPresetsMenu, setShowPresetsMenu] = useState<boolean>(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowPresetsMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowPresetsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuClick = (menuId: string) => {
    setActiveDropdown(activeDropdown === menuId ? null : menuId);
    setShowPresetsMenu(false);
  };

  const executeAndClose = (action?: () => void) => {
    setActiveDropdown(null);
    setShowPresetsMenu(false);
    if (action) action();
  };

  const presets: { type: PartType; label: string; desc: string; isPro: boolean }[] = [
    { type: 'shaft', label: 'Stepped Drive Shaft', desc: 'Rotational power transmission (Ø60mm)', isPro: false },
    { type: 'flange', label: 'Mounting Flange', desc: 'Pipe connector & 4-bolt flange', isPro: false },
    { type: 'bracket', label: 'L-Bracket Stiffener', desc: 'Structural mount with gusset', isPro: false },
    { type: 'planetary_gearbox', label: 'Planetary Gearbox Stage 1', desc: 'Epicyclic train (2.5 module, 30T sun, 90T ring)', isPro: true },
    { type: 'gear', label: 'Spur Gear Hub', desc: 'Involute tooth profile', isPro: true },
    { type: 'helical_gear', label: 'Helical Gear Pinion', desc: 'Smooth high-torque engagement', isPro: true },
  ];

  return (
    <div
      ref={menuBarRef}
      className="w-full bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs select-none z-40 relative hidden md:flex items-center justify-between px-2 sm:px-3 h-10 font-sans text-xs"
    >
      {/* LEFT: Cadvanta Logo Brand & Native CAD Menus */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {/* Cadvanta Brand Badge */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#F1F5F9] transition-colors cursor-pointer group shrink-0"
          title="Return to CADVANTA Landing Page"
        >
          <CadVantaLogoMark size={20} className="group-hover:scale-105 transition-transform" />
          <span className="font-sans font-black tracking-tight text-[#0F172A] text-[13px] hidden sm:inline">
            CAD<span className="text-[#059669]">VANTA</span>
          </span>
        </button>

        {/* Vertical divider */}
        <div className="h-4 w-[1px] bg-[#E2E8F0] hidden sm:block shrink-0" />

        {/* CAD Top Menus: File | Edit | View | Insert | Tools | Inspect | Assembly | Simulation | Help */}
        <div className="hidden lg:flex items-center gap-0.5 text-[#334155] font-medium text-[12px]">
          {/* FILE MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('file')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'file' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              File
            </button>
            {activeDropdown === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(() => onSelectPreset('shaft'))}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">New Part</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+N</span>
                </button>
                <button
                  onClick={() => executeAndClose(() => onSelectPreset('planetary_gearbox'))}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">New Assembly</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+Shift+A</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenDesignLibrary)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Open from Library...</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+O</span>
                </button>
                <div className="my-1 border-t border-[#F1F5F9]" />
                <button
                  onClick={() => executeAndClose(onSaveSnapshot)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Save Model Snapshot</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+S</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenExportModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Export (STEP, STL, DXF, OBJ)</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">PRO</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenDrawingModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Create 2D Drawing</span>
                  <span className="text-[10px] text-[#94A3B8]">ISO A3</span>
                </button>
                <button
                  onClick={() => {
                    executeAndClose(() => {
                      if (onOpenEngineeringSummary) {
                        onOpenEngineeringSummary();
                      } else {
                        generateEngineeringSummaryReportPDF(activePart, { downloadImmediately: true });
                      }
                    });
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 text-emerald-800 flex items-center justify-between cursor-pointer font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Engineering Summary Dossier...</span>
                  </span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">PDF</span>
                </button>
                {onOpenDrawingConverter && (
                  <button
                    onClick={() => executeAndClose(onOpenDrawingConverter)}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[#0F172A] flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2D to 3D Converter...</span>
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">NEW</span>
                  </button>
                )}
                <div className="my-1 border-t border-[#F1F5F9]" />
                {onOpenDashboard && (
                  <button
                    onClick={() => executeAndClose(onOpenDashboard)}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer text-[#334155]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Projects Dashboard</span>
                  </button>
                )}
                {onGoHome && (
                  <button
                    onClick={() => executeAndClose(onGoHome)}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer text-[#334155]"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>CADVANTA Home</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* EDIT MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('edit')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'edit' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Edit
            </button>
            {activeDropdown === 'edit' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onUndo)}
                  disabled={!canUndo}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-[#0F172A]">Undo</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => executeAndClose(onRedo)}
                  disabled={!canRedo}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-[#0F172A]">Redo</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+Y</span>
                </button>
                <div className="my-1 border-t border-[#F1F5F9]" />
                <button
                  onClick={() => executeAndClose(onOpenSketch)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Edit Base Sketch</span>
                  <span className="text-[10px] text-[#94A3B8]">S</span>
                </button>
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('view')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'view' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              View
            </button>
            {activeDropdown === 'view' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onFitView)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Fit to Screen</span>
                  <span className="text-[10px] text-[#94A3B8]">F</span>
                </button>
                <button
                  onClick={() => executeAndClose(onToggleFeatureTree)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">{isFeatureTreeOpen ? 'Hide Feature Tree' : 'Show Feature Tree'}</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+1</span>
                </button>
                <button
                  onClick={() => executeAndClose(onToggleProperties)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">{isPropertiesOpen ? 'Hide Properties' : 'Show Properties'}</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+2</span>
                </button>
              </div>
            )}
          </div>

          {/* INSERT MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('insert')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'insert' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Insert
            </button>
            {activeDropdown === 'insert' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenSketch)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">2D Sketch Profile</span>
                  <span className="text-[10px] text-[#94A3B8]">S</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenAssemblyModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Assembly Component</span>
                  <span className="text-[10px] text-[#94A3B8]">Mating</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenDesignLibrary)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Standard Bearing / Gear</span>
                  <span className="text-[10px] text-[#94A3B8]">Catalog</span>
                </button>
              </div>
            )}
          </div>

          {/* TOOLS MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('tools')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'tools' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Tools
            </button>
            {activeDropdown === 'tools' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenCommandSearch)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Command Search...</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+K</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenCostEstimator)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Material Cost Estimator</span>
                  <span className="text-[10px] text-emerald-600 font-mono">INR/USD</span>
                </button>
                {onOpenDrawingConverter && (
                  <button
                    onClick={() => executeAndClose(onOpenDrawingConverter)}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer font-bold text-emerald-700 dark:text-emerald-500"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2D to 3D CAD Converter</span>
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono font-bold">AI</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* INSPECT MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('inspect')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'inspect' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Inspect
            </button>
            {activeDropdown === 'inspect' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenShortcuts)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Measure Tool</span>
                  <span className="text-[10px] text-[#94A3B8]">M</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenTestSuiteModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">DFM & Validation Matrix</span>
                  <span className="text-[10px] text-emerald-600 font-bold">100%</span>
                </button>
              </div>
            )}
          </div>

          {/* ASSEMBLY MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('assembly')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'assembly' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Assembly
            </button>
            {activeDropdown === 'assembly' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenAssemblyModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Assembly Studio</span>
                  <span className="text-[10px] text-[#94A3B8]">Mates</span>
                </button>
              </div>
            )}
          </div>

          {/* SIMULATION MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('simulation')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'simulation' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Simulation
            </button>
            {activeDropdown === 'simulation' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenFEAModal)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">FEA Static Stress Solver</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Von Mises</span>
                </button>
              </div>
            )}
          </div>

          {/* HELP MENU */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('help')}
              className={`px-2 py-1 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                activeDropdown === 'help' ? 'bg-[#F1F5F9] text-emerald-600 font-semibold' : ''
              }`}
            >
              Help
            </button>
            {activeDropdown === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => executeAndClose(onOpenShortcuts)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Keyboard Shortcuts</span>
                  <span className="text-[10px] text-[#94A3B8]">Ctrl+/</span>
                </button>
                <button
                  onClick={() => executeAndClose(onOpenViraBot)}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[#0F172A]">Ask VIRA AI Copilot</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Live AI</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER: Current Model Breadcrumb & Fast Preset Switcher */}
      <div className="relative flex items-center justify-center max-w-[220px] sm:max-w-xs md:max-w-md mx-2">
        <button
          onClick={() => setShowPresetsMenu(!showPresetsMenu)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-colors cursor-pointer group max-w-full"
          title="Click to switch CAD model or assembly preset"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-[#0F172A] truncate">
            {activePart.name}
          </span>
          <ChevronDown className={`w-3 h-3 text-[#64748B] transition-transform ${showPresetsMenu ? 'rotate-180 text-emerald-600' : ''}`} />
        </button>

        {/* Model Presets Dropdown */}
        {showPresetsMenu && (
          <div className="absolute top-full mt-1.5 w-72 sm:w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-2 z-50 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] px-2 py-1 font-bold">
              Select CAD Model Preset
            </div>
            <div className="space-y-1 mt-1 max-h-64 overflow-y-auto">
              {presets.map((p) => (
                <button
                  key={p.type}
                  onClick={() => {
                    if (p.isPro && !isPro) {
                      openSubscriptionModal('Unlock Planetary Gearbox & Heavy Engines for ₹1.69');
                      return;
                    }
                    onSelectPreset(p.type);
                    setShowPresetsMenu(false);
                  }}
                  className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                    activePart.type === p.type
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'hover:bg-[#F8FAFC] text-[#334155]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[12px] truncate">{p.label}</div>
                    <div className="text-[10px] text-[#64748B] truncate">{p.desc}</div>
                  </div>
                  {p.isPro && !isPro && (
                    <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                      ₹1.69
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Quick Action Buttons (Command Search, Undo/Redo, Panels Toggle, VIRA AI) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Command Search Button (Ctrl+K) */}
        <button
          onClick={onOpenCommandSearch}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] hover:text-[#0F172A] border border-[#E2E8F0] text-[11px] font-mono transition-colors cursor-pointer"
          title="Search commands (Ctrl+K)"
        >
          <Search className="w-3 h-3 text-slate-500" />
          <span className="text-[#64748B]">Search</span>
          <kbd className="bg-white border border-[#CBD5E1] rounded px-1 py-0.2 text-[9px] text-[#64748B]">
            ⌘K
          </kbd>
        </button>

        {/* Undo / Redo */}
        <div className="hidden md:flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fit to Screen (F) */}
        {onFitView && (
          <button
            onClick={onFitView}
            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer hidden sm:block"
            title="Fit to Screen (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle Left Feature Tree (Ctrl+1) */}
        <button
          onClick={onToggleFeatureTree}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isFeatureTreeOpen && !isPropertiesOpen
              ? 'bg-slate-100 text-emerald-600 font-bold'
              : 'hover:bg-[#F1F5F9] text-[#64748B]'
          }`}
          title={`Toggle Left Feature Tree (Ctrl+1) - ${isFeatureTreeOpen ? 'Open' : 'Collapsed'}`}
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Parameters in Left Panel (Ctrl+2) */}
        <button
          onClick={onToggleProperties}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isFeatureTreeOpen && isPropertiesOpen
              ? 'bg-slate-100 text-emerald-600 font-bold'
              : 'hover:bg-[#F1F5F9] text-[#64748B]'
          }`}
          title="Toggle Left Panel Parameters (Ctrl+2)"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Ask VIRA AI Trigger */}
        {onOpenViraBot && (
          <button
            onClick={onOpenViraBot}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold transition-all shadow-xs cursor-pointer ml-0.5"
            title="Open VIRA AI Copilot (Search Grounded)"
          >
            <Bot className="w-3 h-3" />
            <span className="hidden sm:inline">VIRA</span>
          </button>
        )}

        {/* Vanta 2D-to-3D Converter Trigger Button */}
        {onOpenDrawingConverter && (
          <button
            onClick={onOpenDrawingConverter}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071510] hover:bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/50 font-mono text-[11px] font-bold transition-all shadow-xs cursor-pointer ml-1"
            title="Open Vanta 2D-to-3D CAD Converter"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span className="hidden sm:inline">2D → 3D</span>
          </button>
        )}
      </div>
    </div>
  );
};
