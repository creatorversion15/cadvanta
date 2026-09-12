import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CADPart, PartType } from '../../types/cad';
import {
  exportToSTLBinary,
  exportToOBJ,
  exportToJSON,
  triggerBlobDownload,
} from '../../engine/stlExporter';
import { exportToDXF } from '../../engine/advancedExporters';
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
} from 'lucide-react';
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

  const presets: { type: PartType; label: string; desc: string; category: string; isPro?: boolean }[] = [
    // IC Engines
    { type: 'engine_cylinder_block', label: 'Inline-4 Cast Engine Cylinder Block', desc: 'Ø85mm bore with honed liners, water jackets & bearing saddles', category: 'Engines', isPro: true },
    { type: 'engine_cylinder_head', label: 'DOHC 16-Valve Engine Cylinder Head', desc: 'Pent-roof chambers, 4 valves/cyl, dual cam arches & spark plug wells', category: 'Engines', isPro: true },
    { type: 'engine_crankshaft', label: 'Multi-Throw Forged Crankshaft', desc: '4-Cyl heavy forged crank with counterweights & oil galleries', category: 'Engines', isPro: true },
    { type: 'engine_piston', label: 'IC Engine Piston & Crown', desc: 'Ø85mm high-compression piston with 3-ring pack grooves & pin bosses', category: 'Engines' },
    { type: 'engine_connecting_rod', label: 'Forged H-Beam Connecting Rod', desc: '140mm center-to-center with split cap & dual rod bolts', category: 'Engines' },
    { type: 'engine_camshaft', label: 'DOHC Multi-Lobe Camshaft', desc: 'Intake & exhaust lobes with ground journals & timing flange', category: 'Engines' },
    { type: 'engine_valve', label: 'Combustion Poppet Valve & Seat', desc: 'Ø34mm intake/exhaust valve with 45° ground seat & stem keeper grooves', category: 'Engines', isPro: true },
    { type: 'engine_flywheel', label: 'Engine Flywheel & Ring Gear', desc: 'Ø280mm inertia wheel with starter ring gear teeth & clutch mount face', category: 'Engines' },

    // Turbomachinery & Forced Induction
    { type: 'gas_turbine_blisk', label: 'Aero Gas Turbine Rotor (Blisk)', desc: 'Ø260mm high-pressure turbine bladed disc with fir-tree roots', category: 'Turbomachinery', isPro: true },
    { type: 'turbocharger_impeller', label: 'Turbocharger Compressor Impeller', desc: 'Billet 6+6 aerodynamic swept inducer/exducer blades', category: 'Turbomachinery', isPro: true },
    { type: 'roots_supercharger_rotor', label: 'Twin-Lobe Supercharger Rotor', desc: '60° twisted helical roots blower rotor for forced induction', category: 'Turbomachinery', isPro: true },

    // Powertrain & Gearboxes
    { type: 'planetary_gearbox', label: '2-Stage Epicyclic Planetary Gearbox', desc: '16:1 speed reduction ratio for high torque transmission', category: 'Powertrain', isPro: true },
    { type: 'clutch_pack', label: 'Multi-Plate Wet Clutch Assembly', desc: 'Slotted basket with 6 friction discs, inner splined hub & pressure plate', category: 'Powertrain', isPro: true },
    { type: 'universal_joint', label: 'Universal Joint (Cardan Spider)', desc: 'Heavy-duty 4-way cross journal with needle bearing drive yokes', category: 'Powertrain', isPro: true },
    { type: 'shaft', label: 'Stepped Transmission Shaft', desc: 'Ø30/Ø60×200mm with DIN 6885 parallel keyway', category: 'Powertrain' },
    { type: 'flange_coupling', label: 'Rigid Flange Coupling', desc: '5 kW @ 1440 RPM, EN8 steel with clamp bolts', category: 'Powertrain' },
    { type: 'gear', label: 'Involute Spur Gear', desc: 'Module 2.5, 24 teeth, 20° pressure angle', category: 'Powertrain' },

    // Precision Robotics & Mechanisms
    { type: 'cycloidal_drive', label: 'Precision Cycloidal Speed Reducer', desc: 'Zero-backlash robotic joint drive with eccentric cam & pin ring', category: 'Robotics', isPro: true },
    { type: 'geneva_mechanism', label: 'Geneva Rotary Indexing Wheel', desc: '6-slot intermittent motion driver pin & star wheel', category: 'Robotics', isPro: true },

    // Standard Machine Elements
    { type: 'bearing', label: 'Deep Groove Ball Bearing', desc: 'ISO 6206 Ø30×Ø62×16mm with raceways & ball array', category: 'Elements' },
    { type: 'bearing_housing', label: 'Pillow Block Bearing Housing', desc: 'Cast iron body with Ø52mm precision bearing seat', category: 'Elements' },
    { type: 'spring', label: 'Helical Compression Spring', desc: 'Ø4mm wire, 8 active coils, ground ends', category: 'Elements' },
    { type: 'bracket', label: 'L-Mounting Bracket', desc: 'Heavy duty 8mm thick angle with gusset stiffener', category: 'Elements' },
    { type: 'flange', label: 'Bolted Pipe Flange', desc: 'Ø120mm with 6x bolt hole array on 90mm PCD', category: 'Elements' },
  ];

  const categories = ['All', 'Engines', 'Turbomachinery', 'Powertrain', 'Robotics', 'Elements'];

  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        presetSearch.trim() === '' ||
        p.label.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.desc.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(presetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [presets, selectedCategory, presetSearch]);

  const handleSelectPresetClick = (p: (typeof presets)[0]) => {
    if (p.isPro && !isPro) {
      setShowPresetsMenu(false);
      setIsMobileMenuOpen(false);
      openSubscriptionModal(`Unlock ${p.label} (Hard Design Engine) for ₹${SUBSCRIPTION_PRICE_INR}`, p.type);
      return;
    }
    onSelectPreset(p.type);
    setShowPresetsMenu(false);
    setIsMobileMenuOpen(false);
    setShowMobilePresetsPicker(false);
  };

  const handleExportSTL = () => {
    const blob = exportToSTLBinary(part);
    const filename = `${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.stl`;
    triggerBlobDownload(blob, filename);
    setShowExportMenu(false);
  };

  const handleExportDXF = () => {
    const blob = exportToDXF(part, { format: 'dxf', units: part.units || 'mm', resolution: 'standard' });
    const filename = `${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.dxf`;
    triggerBlobDownload(blob, filename);
    setShowExportMenu(false);
  };

  const handleExportOBJ = () => {
    const blob = exportToOBJ(part);
    const filename = `${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.obj`;
    triggerBlobDownload(blob, filename);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const blob = exportToJSON(part);
    const filename = `${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.cad.json`;
    triggerBlobDownload(blob, filename);
    setShowExportMenu(false);
  };

  const handleExportSTEP = () => {
    if (!isPro) {
      setShowExportMenu(false);
      openSubscriptionModal(`Unlock B-Rep STEP Solid & CAD Exporters for ₹${SUBSCRIPTION_PRICE_INR}`);
      return;
    }
    setShowStepNotification(true);
    setTimeout(() => setShowStepNotification(false), 4500);
    setShowExportMenu(false);
  };

  return (
    <header className="relative z-40 h-14 w-full bg-[#071510]/95 backdrop-blur-md border-b border-[rgba(16,185,129,0.2)] px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 shrink-0 shadow-lg text-[#F0FDF4]">
      {/* ========================================================================= */}
      {/* LEFT SECTION: CADVANTA logo + 3D CAD badge + Founder: Viraj Bansod      */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0 min-w-0">
        {/* Logo & Brand Name */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group text-left hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
          title="CADVANTA Mechanical 3D CAD"
        >
          <div className="w-8 h-8 bg-[#0B1E17] text-[#00F5A0] rounded-lg flex items-center justify-center shadow-md font-black font-mono text-sm border border-[#00F5A0]/30 group-hover:border-[#00F5A0] transition-colors shrink-0">
            <Boxes className="w-4 h-4 text-[#00F5A0] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#F0FDF4] font-mono whitespace-nowrap">
              CAD<span className="text-[#00F5A0]">VANTA</span>
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#102B21] text-[#00F5A0] font-bold border border-[#00F5A0]/30 hidden xs:inline-block sm:inline-block whitespace-nowrap">
              3D CAD
            </span>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-[rgba(16,185,129,0.18)] mx-0.5 sm:mx-1 hidden lg:block" />

        {/* Founder Badge (Viraj Bansod) - Full on XL+, Compact on LG */}
        <button
          id="btn-header-maker-profile"
          onClick={onOpenMakerModal}
          className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0B1E17] hover:bg-[#102B21] hover:border-[#00F5A0]/40 border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-all group shrink-0 whitespace-nowrap cursor-pointer"
          title="Founder & Lead Architect: Viraj Bansod"
        >
          <div className="w-4 h-4 rounded-full bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold text-[9px] font-mono shrink-0">
            VB
          </div>
          <span className="text-[11px] whitespace-nowrap">
            Founder: <strong className="font-bold text-[#F0FDF4] group-hover:text-[#00F5A0] transition-colors">Viraj Bansod</strong>
          </span>
        </button>

        <button
          onClick={onOpenMakerModal}
          className="hidden lg:flex xl:hidden items-center gap-1.5 px-2 py-1 rounded-full bg-[#0B1E17] hover:bg-[#102B21] hover:border-[#00F5A0]/40 border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-all group shrink-0 whitespace-nowrap cursor-pointer"
          title="Founder & Lead Architect: Viraj Bansod"
        >
          <div className="w-4 h-4 rounded-full bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold text-[9px] font-mono shrink-0">
            VB
          </div>
          <span className="text-[11px] font-bold text-[#F0FDF4] group-hover:text-[#00F5A0] transition-colors whitespace-nowrap">
            Viraj Bansod
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CENTER SECTION: Design Library + Current Design / selector + Get Pro      */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2.5 xl:gap-3 min-w-0 flex-1 max-w-2xl mx-1 sm:mx-2">
        {/* 0.5 Projects Dashboard Button */}
        {onOpenDashboard && (
          <button
            id="btn-header-projects"
            onClick={onOpenDashboard}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              isDashboard
                ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0]/50 text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
            title="Open Projects & Dashboard (Search & Filter)"
          >
            <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isDashboard ? 'text-[#02140D]' : 'text-[#00F5A0]'}`} />
            <span className="whitespace-nowrap">PROJECTS</span>
          </button>
        )}

        {/* 1. Design Library Button */}
        {onOpenDesignLibrary && (
          <button
            id="btn-header-design-library"
            onClick={onOpenDesignLibrary}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-[#102B21] to-[#07130F] hover:from-[#153A2C] hover:to-[#0B1E17] border border-[#00F5A0]/40 hover:border-[#00F5A0] rounded-lg text-xs font-mono text-[#00F5A0] hover:text-[#F0FDF4] transition-all shadow-[0_0_12px_rgba(0,245,160,0.12)] font-bold group shrink-0 whitespace-nowrap cursor-pointer"
            title="Open Full 60+ Mechanical Design Library & Marketplace"
          >
            <Layers className="w-3.5 h-3.5 text-[#00F5A0] group-hover:scale-110 transition-transform shrink-0" />
            <span className="whitespace-nowrap">DESIGN LIBRARY</span>
            <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] border border-[#00F5A0]/30 font-mono shrink-0">
              60+
            </span>
          </button>
        )}

        {/* 2. Current Design / File Selector (Controlled width with ellipsis + Chevron ▾) */}
        {!isHome && (
          <div className="relative shrink-0 min-w-0" ref={presetsDropdownRef}>
            <button
              id="btn-presets-dropdown"
              onClick={() => {
                setShowPresetsMenu(!showPresetsMenu);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0B1E17] hover:bg-[#102B21] hover:border-[#00F5A0]/50 border border-[rgba(16,185,129,0.25)] rounded-lg text-xs font-mono text-[#F0FDF4] transition-all whitespace-nowrap shadow-xs group cursor-pointer"
              title={`Current Design: ${part.name} (Click to change component)`}
            >
              <Compass className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
              {/* Controlled max-width with ellipsis ensures long names never crowd neighboring buttons */}
              <span className="font-bold max-w-[110px] md:max-w-[130px] lg:max-w-[160px] xl:max-w-[200px] 2xl:max-w-[250px] truncate block text-left">
                {part.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8CA89E] group-hover:text-[#00F5A0] transition-transform shrink-0 ${
                  showPresetsMenu ? 'rotate-180 text-[#00F5A0]' : ''
                }`}
              />
            </button>

            {/* Presets Selection Dropdown Menu */}
            {showPresetsMenu && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-[#071510] border border-[rgba(16,185,129,0.3)] rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1 text-[#F0FDF4] max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(16,185,129,0.15)]">
                  <div className="text-[11px] uppercase font-mono tracking-widest text-[#00F5A0] font-bold flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Mechanical CAD Library ({presets.length})</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8CA89E]">Instant 3D Generator</span>
                </div>

                {/* Quick Search */}
                <div className="relative mt-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E]" />
                  <input
                    id="input-preset-search"
                    type="text"
                    placeholder="Search IC engines, turbomachinery, gearboxes..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B1E17] border border-[rgba(16,185,129,0.2)] rounded-lg text-xs font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] focus:outline-none focus:border-[#00F5A0]"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-b border-[rgba(16,185,129,0.1)]">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                          : 'bg-[#0B1E17] text-[#8CA89E] hover:bg-[#102B21] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.15)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Scrollable Presets List */}
                <div className="overflow-y-auto max-h-[48vh] space-y-1 mt-1 pr-1">
                  {filteredPresets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8CA89E] font-mono">
                      No mechanical components match "{presetSearch}"
                    </div>
                  ) : (
                    filteredPresets.map((p) => (
                      <button
                        key={p.type}
                        id={`preset-option-${p.type}`}
                        onClick={() => handleSelectPresetClick(p)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col group cursor-pointer ${
                          part.part_type === p.type
                            ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-sm'
                            : 'text-[#8CA89E] hover:bg-[#102B21] hover:text-[#F0FDF4]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {part.part_type === p.type && (
                              <Check className="w-3.5 h-3.5 text-[#02140D] shrink-0" />
                            )}
                            <span className="font-mono font-medium truncate">{p.label}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                part.part_type === p.type
                                  ? 'bg-[#02140D]/15 text-[#02140D]'
                                  : 'bg-[#0B1E17] text-[#8CA89E]'
                              }`}
                            >
                              {p.category}
                            </span>
                            {p.isPro && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 ${
                                  part.part_type === p.type
                                    ? 'bg-[#02140D] text-[#00F5A0]'
                                    : isPro
                                    ? 'bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30'
                                    : 'bg-[#1C2521] text-[#F59E0B] border border-[#F59E0B]/30'
                                }`}
                              >
                                {isPro ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                <span>PRO</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-sans mt-0.5 line-clamp-1 ${
                            part.part_type === p.type
                              ? 'text-[#02140D]/80'
                              : 'text-[#4E6B60] group-hover:text-[#8CA89E]'
                          }`}
                        >
                          {p.desc}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Get Pro Button (Separate button, prominent, never covers design selector) */}
        <button
          id="btn-header-pro-subscription"
          onClick={() => openSubscriptionModal()}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-xs border shrink-0 whitespace-nowrap cursor-pointer ${
            isPro
              ? 'bg-[#102B21] border-[#00F5A0]/50 text-[#00F5A0] hover:bg-[#00F5A0] hover:text-[#02140D]'
              : 'bg-gradient-to-r from-[#102B21] to-[#0B1E17] border-[#F59E0B]/50 hover:border-[#00F5A0] text-[#F59E0B] hover:text-[#00F5A0]'
          }`}
          title={isPro ? 'CADVANTA PRO is active' : 'Upgrade to CADVANTA PRO for ₹1.69'}
        >
          {isPro ? (
            <>
              <Crown className="w-3.5 h-3.5 text-[#00F5A0] fill-current shrink-0" />
              <span>PRO ACTIVE</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse shrink-0" />
              <span>GET PRO</span>
              <span className="text-[10px] opacity-85 hidden xl:inline">(₹1.69)</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Sign In + 2D Drawing + Export                             */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
        {/* 1. Sign In (or UserAuthWidget when signed in) - MUST ALWAYS REMAIN COMPLETELY VISIBLE */}
        <div className="shrink-0">
          <UserAuthWidget />
        </div>

        {/* 1.5 Theme Toggle Button (Light/Dark mode) */}
        <button
          id="btn-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0]/50 text-[#8CA89E] hover:text-[#00F5A0] transition-all cursor-pointer shrink-0 shadow-xs"
          title={isDark ? 'Switch to Clean Light Theme' : 'Switch to Dark Theme (Obsidian Emerald)'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#F59E0B] hover:text-[#FBBF24] transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-[#00B377] transition-colors" />
          )}
        </button>

        {/* 2. 2D Drawing Button */}
        {!isHome && (
          <button
            id="btn-open-drawing-modal"
            onClick={onOpenDrawingModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/40 text-[#8CA89E] hover:text-[#F0FDF4] rounded-lg text-xs font-mono transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            title="Generate Engineering Technical Drawing (SVG/DXF)"
          >
            <FileText className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
            <span>2D Drawing</span>
          </button>
        )}

        {/* 2.5 Engineering Tools Dropdown */}
        {!isHome && (
          <div className="relative shrink-0" ref={toolsDropdownRef}>
            <button
              id="btn-tools-dropdown"
              onClick={() => {
                setShowToolsMenu(!showToolsMenu);
                setShowExportMenu(false);
                setShowPresetsMenu(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/40 text-[#8CA89E] hover:text-[#F0FDF4] rounded-lg text-xs font-mono transition-colors shrink-0 whitespace-nowrap cursor-pointer"
              title="CAD & Simulation Engineering Tools"
            >
              <Wrench className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
              <span>Tools</span>
              <ChevronDown
                className={`w-3 h-3 text-[#8CA89E] transition-transform ${
                  showToolsMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showToolsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#071510] border border-[rgba(16,185,129,0.28)] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 text-[#F0FDF4]">
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-widest text-[#8CA89E] font-bold border-b border-[rgba(16,185,129,0.12)] pb-1">
                  Parametric Design Tools
                </div>

                {onOpenAssemblyModal && (
                  <button
                    onClick={() => {
                      onOpenAssemblyModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Assembly & Mates</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">Multi-Part</span>
                  </button>
                )}

                {onOpenSheetMetalModal && (
                  <button
                    onClick={() => {
                      onOpenSheetMetalModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Sheet Metal & Flanges</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">K-Factor</span>
                  </button>
                )}

                {onOpenSurfacingModal && (
                  <button
                    onClick={() => {
                      onOpenSurfacingModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Surfacing (Loft / Sweep)</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">Non-Solid</span>
                  </button>
                )}

                {onOpenFEAModal && (
                  <button
                    onClick={() => {
                      onOpenFEAModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>FEA Stress Simulation</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">Von Mises</span>
                  </button>
                )}

                {onOpenCostEstimatorModal && (
                  <button
                    id="btn-menu-cost-estimator"
                    onClick={() => {
                      onOpenCostEstimatorModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Material & Cost Estimator</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">Rollup</span>
                  </button>
                )}

                {onOpenEngineeringChecksModal && (
                  <button
                    id="btn-menu-engineering-checks"
                    onClick={() => {
                      onOpenEngineeringChecksModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Engineering Checks & DFM</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">ISO / PDF</span>
                  </button>
                )}

                <div className="h-[1px] bg-[rgba(16,185,129,0.12)] my-1" />

                {onOpenCollaborationModal && (
                  <button
                    onClick={() => {
                      onOpenCollaborationModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Collaborate & History</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">3D Notes</span>
                  </button>
                )}

                {onOpenIntegrationsModal && (
                  <button
                    onClick={() => {
                      onOpenIntegrationsModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Cloud & CAD Integrations</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#00F5A0] font-bold">7 Clouds / SW</span>
                  </button>
                )}

                {onOpenGenerativeDesignModal && (
                  <button
                    onClick={() => {
                      onOpenGenerativeDesignModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Generative Design</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">Topology</span>
                  </button>
                )}

                {onOpenPluginManagerModal && (
                  <button
                    onClick={() => {
                      onOpenPluginManagerModal();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Puzzle className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Plugin Extensions</span>
                    </div>
                    <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">SDK</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2.7 Share Project Button */}
        {!isHome && onOpenCollaborationModal && (
          <button
            id="btn-header-share"
            onClick={onOpenCollaborationModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.3)] hover:border-[#00F5A0] text-[#00F5A0] hover:text-[#34EEA9] rounded-lg text-xs font-mono transition-all shrink-0 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(0,245,160,0.1)]"
            title="Generate Shareable Link (View-Only or Reviewer)"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2] shrink-0" />
            <span>Share</span>
          </button>
        )}

        {/* 3. Export Button & Dropdown */}
        {!isHome && (
          <div className="relative shrink-0" ref={exportDropdownRef}>
            <button
              id="btn-export-dropdown"
              onClick={() => {
                if (onOpenExportModal) {
                  onOpenExportModal();
                } else {
                  setShowExportMenu(!showExportMenu);
                }
                setShowPresetsMenu(false);
                setShowToolsMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_14px_rgba(0,245,160,0.25)] active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
              title="Export 3D Model (STEP, IGES, STL, DXF)"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>Export</span>
              <ChevronDown
                className={`w-3 h-3 stroke-[2.5] shrink-0 transition-transform ${
                  showExportMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#071510] border border-[rgba(16,185,129,0.28)] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 text-[#F0FDF4]">
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-widest text-[#8CA89E] font-bold border-b border-[rgba(16,185,129,0.12)] pb-1">
                  CAD & CAM Formats
                </div>

                {onOpenExportModal && (
                  <button
                    onClick={() => {
                      onOpenExportModal();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono font-bold text-[#00F5A0] bg-[#102B21] hover:bg-[#16382B] flex items-center justify-between transition-colors group cursor-pointer border border-[#00F5A0]/20"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>Unified Export Panel</span>
                    </div>
                    <span className="text-[10px] text-[#34EEA9]">All</span>
                  </button>
                )}

                <button
                  id="export-stl-btn"
                  onClick={handleExportSTL}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>STL (3D Print)</span>
                  </div>
                  <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">.stl</span>
                </button>

                <button
                  id="export-dxf-btn"
                  onClick={handleExportDXF}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>DXF (AutoCAD / CNC)</span>
                  </div>
                  <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">.dxf</span>
                </button>

                <button
                  id="export-obj-btn"
                  onClick={handleExportOBJ}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>OBJ (Mesh)</span>
                  </div>
                  <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">.obj</span>
                </button>

                <button
                  id="export-json-btn"
                  onClick={handleExportJSON}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>CAD JSON</span>
                  </div>
                  <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">.json</span>
                </button>

                <div className="h-[1px] bg-[rgba(16,185,129,0.12)] my-1" />

                <button
                  id="export-drawing-btn"
                  onClick={() => {
                    onOpenDrawingModal();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>Technical Drawing</span>
                  </div>
                  <span className="text-[10px] text-[#4E6B60] group-hover:text-[#8CA89E]">.svg</span>
                </button>

                <button
                  id="export-step-btn"
                  onClick={handleExportSTEP}
                  className="w-full text-left p-2 rounded-lg text-xs font-mono text-[#8CA89E] hover:bg-[#102B21] hover:text-[#00F5A0] flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>STEP Solid</span>
                  </div>
                  <span className="text-[10px] px-1 bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30 font-bold rounded">
                    PRO
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MOBILE MENU TOGGLE: Only visible on smaller viewports (< md: 768px)       */}
        {/* ========================================================================= */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={() => {
            setIsMobileMenuOpen(!isMobileMenuOpen);
            setShowPresetsMenu(false);
            setShowExportMenu(false);
          }}
          className={`md:hidden flex items-center justify-center w-8 h-8 rounded-lg border transition-all cursor-pointer shrink-0 ${
            isMobileMenuOpen
              ? 'bg-[#00F5A0] text-[#02140D] border-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#00F5A0] border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0]/50'
          }`}
          title="Toggle Navigation Menu"
          aria-label="Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4 stroke-[2.5]" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE NAVIGATION DRAWER: Clean, non-overlapping menu for small screens   */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 w-full bg-[#071510]/98 border-b border-[rgba(16,185,129,0.3)] shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-60px)] overflow-y-auto space-y-2.5"
        >
          {/* Current Design Quick Switcher in Mobile Drawer */}
          {!isHome && (
            <div className="p-3 rounded-xl bg-[#0B1E17] border border-[rgba(16,185,129,0.2)] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8CA89E]">
                <span className="flex items-center gap-1.5 text-[#00F5A0] font-bold uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Current Design</span>
                </span>
                <button
                  onClick={() => setShowMobilePresetsPicker(!showMobilePresetsPicker)}
                  className="text-[#00F5A0] hover:underline font-bold text-[11px] cursor-pointer"
                >
                  {showMobilePresetsPicker ? 'Hide Picker ▲' : 'Change Component ▾'}
                </button>
              </div>
              <div className="text-sm font-mono font-bold text-[#F0FDF4] truncate">
                {part.name}
              </div>

              {/* Mobile Embedded Presets Picker */}
              {showMobilePresetsPicker && (
                <div className="pt-2 border-t border-[rgba(16,185,129,0.15)] space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E]" />
                    <input
                      type="text"
                      placeholder="Search CAD components..."
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-lg text-xs font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] focus:outline-none focus:border-[#00F5A0]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-[#00F5A0] text-[#02140D] font-bold'
                            : 'bg-[#071510] text-[#8CA89E] border border-[rgba(16,185,129,0.15)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {filteredPresets.map((p) => (
                      <button
                        key={p.type}
                        onClick={() => handleSelectPresetClick(p)}
                        className={`w-full text-left p-2 rounded-lg text-xs font-mono flex items-center justify-between ${
                          part.part_type === p.type
                            ? 'bg-[#00F5A0] text-[#02140D] font-bold'
                            : 'bg-[#071510] text-[#8CA89E] hover:text-[#F0FDF4]'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                        {p.isPro && (
                          <span className="text-[9px] px-1 bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30 rounded ml-1 shrink-0">
                            PRO
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Secondary Action Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Design Library */}
            {onOpenDesignLibrary && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDesignLibrary();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[#00F5A0]/30 hover:border-[#00F5A0] text-xs font-mono font-bold text-[#00F5A0] transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Design Library</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">60+ Models</div>
                </div>
              </button>
            )}

            {/* Get Pro Subscription */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openSubscriptionModal();
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                isPro
                  ? 'bg-[#102B21] border-[#00F5A0]/50 text-[#00F5A0]'
                  : 'bg-gradient-to-r from-[#102B21] to-[#0B1E17] border-[#F59E0B]/50 text-[#F59E0B]'
              }`}
            >
              {isPro ? (
                <Crown className="w-4 h-4 text-[#00F5A0] shrink-0 fill-current" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0 animate-pulse" />
              )}
              <div className="text-left min-w-0">
                <div className="truncate">{isPro ? 'PRO Active' : 'Get PRO'}</div>
                <div className="text-[10px] text-[#8CA89E] font-normal">
                  {isPro ? 'All Features' : '₹1.69 / Lifetime'}
                </div>
              </div>
            </button>

            {/* 2D Drawing */}
            {!isHome && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDrawingModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">2D Drawing</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Technical Prints</div>
                </div>
              </button>
            )}

            {/* Unified Export Panel */}
            {onOpenExportModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenExportModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#102B21] hover:bg-[#16382B] border border-[#00F5A0]/40 text-xs font-mono text-[#00F5A0] transition-all cursor-pointer font-bold"
              >
                <Download className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Export Panel</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">STEP, IGES, STL, DXF</div>
                </div>
              </button>
            )}

            {/* Assembly Modeling */}
            {onOpenAssemblyModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAssemblyModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Boxes className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Assembly</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Mates & Exploded</div>
                </div>
              </button>
            )}

            {/* Sheet Metal */}
            {onOpenSheetMetalModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSheetMetalModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Sheet Metal</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Flange & K-Factor</div>
                </div>
              </button>
            )}

            {/* Surfacing */}
            {onOpenSurfacingModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSurfacingModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Surfacing</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Loft, Sweep, Patch</div>
                </div>
              </button>
            )}

            {/* FEA Simulation */}
            {onOpenFEAModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFEAModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">FEA Simulation</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Von Mises Stress</div>
                </div>
              </button>
            )}

            {/* Collaborate */}
            {onOpenCollaborationModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCollaborationModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Collaborate</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Version Snapshots</div>
                </div>
              </button>
            )}

            {/* Integrations */}
            {onOpenIntegrationsModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenIntegrationsModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Cloud & CAD Integrations</div>
                  <div className="text-[10px] text-[#00F5A0] font-normal">7 Clouds / SolidWorks</div>
                </div>
              </button>
            )}

            {/* Generative Design */}
            {onOpenGenerativeDesignModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenGenerativeDesignModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Network className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Generative Design</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Topology SIMP</div>
                </div>
              </button>
            )}

            {/* Plugins */}
            {onOpenPluginManagerModal && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPluginManagerModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Puzzle className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Plugins & SDK</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Extensions Manager</div>
                </div>
              </button>
            )}

            {/* VIRA AI Bot */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenViraBot();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[#00F5A0]/30 text-xs font-mono text-[#00F5A0] transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#00F5A0] shrink-0" />
              <div className="text-left min-w-0">
                <div className="truncate">VIRA AI</div>
                <div className="text-[10px] text-[#8CA89E] font-normal">Engineering Bot</div>
              </div>
            </button>

            {/* Test Benchmarks */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTestSuiteModal();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#00F5A0] shrink-0" />
              <div className="text-left min-w-0">
                <div className="truncate">Benchmarks</div>
                <div className="text-[10px] text-[#8CA89E] font-normal">Automated Tests</div>
              </div>
            </button>

            {/* Founder Profile */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenMakerModal();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#00F5A0] shrink-0" />
              <div className="text-left min-w-0">
                <div className="truncate">Founder</div>
                <div className="text-[10px] text-[#8CA89E] font-normal">Viraj Bansod</div>
              </div>
            </button>

            {/* Theme Toggle in Mobile Drawer */}
            <button
              id="btn-mobile-theme-toggle"
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#F59E0B] shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-[#00B377] shrink-0" />
              )}
              <div className="text-left min-w-0">
                <div className="truncate">{isDark ? 'Light Theme' : 'Dark Theme'}</div>
                <div className="text-[10px] text-[#8CA89E] font-normal">
                  {isDark ? 'Switch to Clean Light' : 'Switch to Obsidian'}
                </div>
              </div>
            </button>

            {/* Material & Cost Estimator in Mobile Drawer */}
            {onOpenCostEstimatorModal && (
              <button
                id="btn-mobile-cost-estimator"
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCostEstimatorModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Material & Cost Estimator</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Part & Assembly BOM Rollup</div>
                </div>
              </button>
            )}

            {/* Engineering Checks in Mobile Drawer */}
            {onOpenEngineeringChecksModal && (
              <button
                id="btn-mobile-engineering-checks"
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenEngineeringChecksModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Engineering Checks & DFM</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Rules, FEA & PDF Reports</div>
                </div>
              </button>
            )}

            {/* Projects Dashboard in Mobile Drawer */}
            {onOpenDashboard && (
              <button
                id="btn-mobile-projects"
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDashboard();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-xs font-mono text-[#F0FDF4] transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-[#00F5A0] shrink-0" />
                <div className="text-left min-w-0">
                  <div className="truncate">Projects Dashboard</div>
                  <div className="text-[10px] text-[#8CA89E] font-normal">Search & Filter CAD Files</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP Solid Notification Toast                                             */}
      {/* ========================================================================= */}
      {showStepNotification && (
        <div className="absolute top-16 right-4 z-50 p-3.5 bg-[#0B1E17] border border-[#00F5A0]/40 rounded-lg shadow-2xl flex items-start gap-3 max-w-sm text-xs animate-in fade-in text-[#F0FDF4]">
          <Sparkles className="w-4 h-4 text-[#00F5A0] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-[#00F5A0] font-mono">B-Rep STEP Solid Model</div>
            <p className="text-[#8CA89E] font-sans leading-relaxed">
              STL export is ready for 3D printing and CAM milling. Native STEP NURBS solid export is supported via JSON definition.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
