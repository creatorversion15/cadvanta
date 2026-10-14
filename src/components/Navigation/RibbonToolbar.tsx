import React, { useState } from 'react';
import {
  Box,
  RotateCw,
  Scissors,
  CircleDot,
  Split,
  Plus,
  Sparkles,
  Layers,
  ShieldAlert,
  Table,
  Compass,
  Cpu,
  PenTool,
  Sliders,
  ChevronDown,
  Hash,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface RibbonTool {
  id: string;
  name: string;
  icon: React.ElementType;
  shortcut?: string;
  category: 'features' | 'assembly' | 'sketch' | 'views' | 'advanced';
  tooltip: string;
  badge?: string;
  hasDropdown?: boolean;
  dropdownOptions?: { id: string; label: string; detail: string }[];
}

interface RibbonToolbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onExecuteTool: (toolId: string, optionId?: string) => void;
  displayMode: 'shaded_edges' | 'wireframe' | 'xray' | 'exploded' | 'section';
  onChangeDisplayMode: (mode: 'shaded_edges' | 'wireframe' | 'xray' | 'exploded' | 'section') => void;
  isSectionCutActive: boolean;
  onToggleSectionCut: () => void;
  isExplodedActive: boolean;
  onToggleExploded: () => void;
  activeView: string;
  onChangeView: (view: string) => void;
  onOpenAdvancedDrawer?: () => void;
  isAdvancedDrawerOpen?: boolean;
}

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  activeTab,
  onSelectTab,
  onExecuteTool,
  displayMode,
  onChangeDisplayMode,
  isSectionCutActive,
  onToggleSectionCut,
  isExplodedActive,
  onToggleExploded,
  activeView,
  onChangeView,
  onOpenAdvancedDrawer,
  isAdvancedDrawerOpen = false,
}) => {
  const { theme } = useTheme();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Streamlined primary tabs for everyday core CAD operations
  const tabs = [
    { id: 'features', label: 'Features' },
    { id: 'assembly', label: 'Assembly' },
    { id: 'sketch', label: 'Sketch' },
    { id: 'views', label: 'Views & Display' },
  ];

  const handleToolClick = (toolId: string, hasDropdown?: boolean) => {
    if (hasDropdown) {
      setOpenDropdownId(openDropdownId === toolId ? null : toolId);
    } else {
      setOpenDropdownId(null);
      onExecuteTool(toolId);
    }
  };

  const handleDropdownSelect = (toolId: string, optionId: string) => {
    setOpenDropdownId(null);
    onExecuteTool(toolId, optionId);
  };

  return (
    <div
      id="cadvanta-ribbon-toolbar"
      className="w-full bg-white border-b border-[#E2E8F0] shadow-xs select-none z-20 shrink-0 font-sans"
    >
      {/* 1. Category Tabs Bar */}
      <div className="flex items-center px-4 pt-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC] overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`ribbon-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}

        {/* Dedicated "Advanced Functions" Slide-out Trigger */}
        <button
          id="btn-ribbon-advanced-functions"
          onClick={onOpenAdvancedDrawer}
          className={`ml-2 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs ${
            isAdvancedDrawerOpen
              ? 'bg-[#0284C7] text-white shadow-sm ring-2 ring-[#0284C7]/20'
              : 'bg-blue-50/80 hover:bg-blue-100 text-[#0284C7] border border-blue-200'
          }`}
          title="Open Advanced Functions Drawer (MBD, GD&T, Patterns, Holes, Fasteners & Simulation)"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Advanced Functions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#0284C7] font-mono border border-blue-200 font-semibold hidden sm:inline">
            Drawer
          </span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isAdvancedDrawerOpen ? 'rotate-90' : ''}`} />
        </button>

        {/* Global Assembly Info Chip on the right */}
        <div className="ml-auto hidden md:flex items-center gap-1.5 pb-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#475569] bg-white px-2.5 py-1 rounded-md border border-[#E2E8F0] shadow-xs">
            <span className="font-semibold text-[#0F172A]">Planetary Gearbox</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[#059669] font-bold">Mod 2.5 • 3-Stage</span>
          </div>
        </div>
      </div>

      {/* 2. Tool Strip for Selected Tab */}
      <div className="px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar min-h-[58px] bg-white">
        {/* TAB: FEATURES */}
        {activeTab === 'features' && (
          <div className="flex items-center gap-1 divide-x divide-[#E2E8F0]">
            {/* Group: Additive Solids */}
            <div className="flex items-center gap-1 pr-2">
              <div className="relative">
                <button
                  id="ribbon-tool-extrude"
                  onClick={() => handleToolClick('extrude', true)}
                  title="Boss-Extrude (E): Extrude closed 2D profile normal to sketch plane"
                  className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
                >
                  <Box className="w-5 h-5 text-[#0284C7] group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-[11px] font-medium leading-none">Extrude</span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#64748B]" />
                  </div>
                </button>
                {openDropdownId === 'extrude' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#CBD5E1] rounded-md shadow-xl z-50 py-1 text-xs font-sans">
                    <button
                      onClick={() => handleDropdownSelect('extrude', 'blind')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] flex flex-col cursor-pointer"
                    >
                      <span className="font-semibold text-[#0F172A]">Blind Extrude</span>
                      <span className="text-[10px] text-[#64748B]">Specify depth & draft angle</span>
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('extrude', 'midplane')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] flex flex-col cursor-pointer"
                    >
                      <span className="font-semibold text-[#0F172A]">Mid-Plane Extrude</span>
                      <span className="text-[10px] text-[#64748B]">Symmetric extrusion across plane</span>
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('extrude', 'up_to_surface')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] flex flex-col cursor-pointer"
                    >
                      <span className="font-semibold text-[#0F172A]">Up to Next Surface</span>
                      <span className="text-[10px] text-[#64748B]">Conform to bearing housing seat</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  id="ribbon-tool-revolve"
                  onClick={() => handleToolClick('revolve', true)}
                  title="Revolve (R): Revolve cross-section around central centerline shaft"
                  className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
                >
                  <RotateCw className="w-5 h-5 text-[#0284C7] group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-[11px] font-medium leading-none">Revolve</span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#64748B]" />
                  </div>
                </button>
                {openDropdownId === 'revolve' && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#CBD5E1] rounded-md shadow-xl z-50 py-1 text-xs font-sans">
                    <button
                      onClick={() => handleDropdownSelect('revolve', '360')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      360° Full Axis Revolve
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('revolve', 'custom_angle')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      Angle Sector (180° / 270°)
                    </button>
                  </div>
                )}
              </div>

              <button
                id="ribbon-tool-gear-gen"
                onClick={() => onExecuteTool('gear_generation')}
                title="Gear Generator: Generate Module 2.5 Involute Sun, Planet & Ring Gears"
                className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
              >
                <Cpu className="w-5 h-5 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium mt-0.5 leading-none">Gear Gen</span>
              </button>
            </div>

            {/* Group: Subtractive Features */}
            <div className="flex items-center gap-1 px-2">
              <div className="relative">
                <button
                  id="ribbon-tool-cut"
                  onClick={() => handleToolClick('cut', true)}
                  title="Extruded Cut (C): Pierce or bore solid geometry"
                  className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
                >
                  <Scissors className="w-5 h-5 text-[#EF4444] group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-[11px] font-medium leading-none">Extruded Cut</span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#64748B]" />
                  </div>
                </button>
                {openDropdownId === 'cut' && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#CBD5E1] rounded-md shadow-xl z-50 py-1 text-xs font-sans">
                    <button
                      onClick={() => handleDropdownSelect('cut', 'through_all')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      Through All Bore
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('cut', 'blind_pocket')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      Blind Shaft Pocket
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  id="ribbon-tool-fillet"
                  onClick={() => handleToolClick('fillet', true)}
                  title="Fillet / Round: Blend sharp edges with constant radius (R=1.5mm - 5mm)"
                  className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
                >
                  <CircleDot className="w-5 h-5 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-[11px] font-medium leading-none">Fillet</span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#64748B]" />
                  </div>
                </button>
                {openDropdownId === 'fillet' && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-[#CBD5E1] rounded-md shadow-xl z-50 py-1 text-xs font-sans">
                    <button
                      onClick={() => handleDropdownSelect('fillet', 'r1')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      R1.5 mm Shoulder
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('fillet', 'r3')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      R3.0 mm Carrier Hub
                    </button>
                    <button
                      onClick={() => handleDropdownSelect('fillet', 'r5')}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      R5.0 mm Casing Boss
                    </button>
                  </div>
                )}
              </div>

              <button
                id="ribbon-tool-chamfer"
                onClick={() => onExecuteTool('chamfer')}
                title="Chamfer: 45° lead-in chamfer for shaft insertion & bearing assembly"
                className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
              >
                <Split className="w-5 h-5 text-[#D97706] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium mt-0.5 leading-none">Chamfer</span>
              </button>
            </div>

            {/* Quick Holes Trigger */}
            <div className="flex items-center gap-1 pl-2">
              <button
                id="ribbon-tool-hole-wizard"
                onClick={() => onExecuteTool('hole_wizard')}
                title="Hole Wizard: ISO/DIN standard clearance, tapped, and counterbore holes"
                className="px-2.5 py-1.5 flex flex-col items-center justify-center rounded hover:bg-[#F1F5F9] text-[#1E293B] transition-colors group cursor-pointer"
              >
                <CircleDot className="w-5 h-5 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium mt-0.5 leading-none">Holes</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: ASSEMBLY */}
        {activeTab === 'assembly' && (
          <div className="flex items-center gap-2">
            <button
              id="ribbon-tool-insert-component"
              onClick={() => onExecuteTool('insert_component')}
              title="Insert Component: Add bearings, gears, shafts, or fasteners"
              className="px-3 py-1.5 flex items-center gap-2 rounded bg-[#0284C7]/10 text-[#0284C7] font-semibold text-xs border border-[#0284C7]/30 hover:bg-[#0284C7]/20 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Insert Part</span>
            </button>

            <button
              id="ribbon-tool-mate-assistant"
              onClick={() => onExecuteTool('mate_assistant')}
              title="Smart Mating: Concentric shaft-bearing alignment, coincident faces, gear ratio"
              className="px-3 py-1.5 flex items-center gap-2 rounded hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] text-xs font-medium cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Smart Mates</span>
            </button>

            <button
              id="ribbon-tool-exploded-toggle"
              onClick={onToggleExploded}
              title="Exploded View Mode: Disassemble components along axial vectors with leader lines"
              className={`px-3 py-1.5 flex items-center gap-2 rounded text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isExplodedActive
                  ? 'bg-[#0284C7] text-white border-transparent'
                  : 'bg-white text-[#1E293B] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isExplodedActive ? 'Exit Exploded View' : 'Exploded View'}</span>
            </button>

            <button
              id="ribbon-tool-interference-detection"
              onClick={() => onExecuteTool('interference_detection')}
              title="Interference Detection: Scan for volumetric overlaps across all gear meshes and seals"
              className="px-3 py-1.5 flex items-center gap-2 rounded hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] text-xs font-medium cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
              <span>Clash Detection</span>
            </button>

            <button
              id="ribbon-tool-bom-table"
              onClick={() => onExecuteTool('bom_table')}
              title="Bill of Materials: Live interactive table linked to exploded balloons"
              className="px-3 py-1.5 flex items-center gap-2 rounded hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] text-xs font-medium cursor-pointer shadow-xs"
            >
              <Table className="w-4 h-4 text-[#06B6D4]" />
              <span>Assembly BOM</span>
            </button>
          </div>
        )}

        {/* TAB: SKETCH */}
        {activeTab === 'sketch' && (
          <div className="flex items-center gap-2">
            <button
              id="ribbon-tool-start-sketch"
              onClick={() => onExecuteTool('open_sketcher')}
              title="Open 2D Parametric Sketcher Workspace on Active Datum Plane"
              className="px-3 py-1.5 flex items-center gap-2 rounded bg-[#0284C7]/10 text-[#0284C7] font-semibold text-xs border border-[#0284C7]/30 hover:bg-[#0284C7]/20 cursor-pointer shadow-xs"
            >
              <PenTool className="w-4 h-4 stroke-[2.5]" />
              <span>New Sketch</span>
            </button>
            <button
              onClick={() => onExecuteTool('sketch_circle')}
              className="px-2.5 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1] cursor-pointer shadow-xs"
            >
              Centerline Circle Ø
            </button>
            <button
              onClick={() => onExecuteTool('sketch_involute')}
              className="px-2.5 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1] cursor-pointer shadow-xs"
            >
              Involute Curve Profile
            </button>
            <button
              onClick={() => onExecuteTool('sketch_constraints')}
              className="px-2.5 py-1.5 text-xs text-[#1E293B] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1] cursor-pointer shadow-xs"
            >
              Geometric Constraints
            </button>
          </div>
        )}

        {/* TAB: VIEWS */}
        {activeTab === 'views' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-md border border-[#CBD5E1] shadow-xs">
              {(['shaded_edges', 'wireframe', 'xray', 'exploded', 'section'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeDisplayMode(mode)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded capitalize transition-all cursor-pointer ${
                    displayMode === mode
                      ? 'bg-[#0284C7] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-md border border-[#CBD5E1] shadow-xs">
              {['iso', 'front', 'top', 'right', 'back'].map((v) => (
                <button
                  key={v}
                  onClick={() => onChangeView(v)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                    activeView === v
                      ? 'bg-[#0284C7] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={onToggleSectionCut}
              className={`px-3 py-1.5 flex items-center gap-1.5 rounded text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isSectionCutActive
                  ? 'bg-[#0284C7] text-white border-transparent'
                  : 'bg-white text-[#1E293B] border-[#CBD5E1] hover:bg-[#F1F5F9]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Section A-A</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
