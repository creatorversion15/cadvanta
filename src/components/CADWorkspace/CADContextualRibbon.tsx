import React, { useState } from 'react';
import {
  Box,
  RotateCw,
  Scissors,
  CircleDot,
  Layers,
  Table,
  Compass,
  Cpu,
  PenTool,
  Sliders,
  ChevronDown,
  Hash,
  Eye,
  Maximize2,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Wrench,
  Grid,
  FileSpreadsheet,
  Split,
  Plus,
  Move,
  Check,
  Disc,
  Spline,
  Square,
  Circle,
  Slash,
  Maximize,
  Minimize,
  Activity,
  Layers3,
  FoldHorizontal,
  Flame,
  Binary,
} from 'lucide-react';

export type RibbonWorkspaceMode =
  | 'design'
  | 'assembly'
  | 'inspect'
  | 'simulation'
  | 'drawing'
  | 'tools';

interface CADContextualRibbonProps {
  activeTab: RibbonWorkspaceMode;
  onSelectTab: (tab: RibbonWorkspaceMode) => void;
  onExecuteTool: (toolId: string, optionId?: string) => void;
  designSubMode?: 'features' | 'sketch' | 'sheet_metal' | 'surfacing';
  onChangeDesignSubMode?: (mode: 'features' | 'sketch' | 'sheet_metal' | 'surfacing') => void;
  isExplodedActive?: boolean;
  onToggleExploded?: () => void;
  explodedProgress?: number;
  onExplodedProgressChange?: (val: number) => void;
  isSectionCutActive?: boolean;
  onToggleSectionCut?: () => void;
  displayMode: 'shaded_edges' | 'wireframe' | 'xray' | 'exploded' | 'section';
  onChangeDisplayMode: (mode: 'shaded_edges' | 'wireframe' | 'xray' | 'exploded' | 'section') => void;
}

export const CADContextualRibbon: React.FC<CADContextualRibbonProps> = ({
  activeTab,
  onSelectTab,
  onExecuteTool,
  designSubMode = 'features',
  onChangeDesignSubMode = (_mode: 'features' | 'sketch' | 'sheet_metal' | 'surfacing') => {},
  isExplodedActive = false,
  onToggleExploded = () => {},
  explodedProgress = 0,
  onExplodedProgressChange = (_val: number) => {},
  isSectionCutActive = false,
  onToggleSectionCut = () => {},
  displayMode,
  onChangeDisplayMode,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const mainTabs: { id: RibbonWorkspaceMode; label: string; badge?: string }[] = [
    { id: 'design', label: 'DESIGN' },
    { id: 'assembly', label: 'ASSEMBLY' },
    { id: 'inspect', label: 'INSPECT' },
    { id: 'simulation', label: 'SIMULATION' },
    { id: 'drawing', label: 'DRAWING' },
    { id: 'tools', label: 'TOOLS' },
  ];

  return (
    <div
      id="cadvanta-contextual-ribbon"
      className="w-full bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs select-none z-30 shrink-0 font-sans hidden md:block"
    >
      {/* 1. TOP RIBBON TABS BAR */}
      <div className="flex items-center px-3 pt-1 border-b border-[#E2E8F0] bg-[#F8FAFC] overflow-x-auto no-scrollbar gap-1">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                setOpenDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wider rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer border-t-2 ${
                isActive
                  ? 'bg-white border-emerald-600 text-[#0F172A] shadow-xs font-bold border-b-transparent -mb-[1px]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. CONTEXT-SENSITIVE COMMAND TOOLBAR */}
      <div className="px-3 py-1.5 flex items-center justify-between min-h-[44px] overflow-x-auto no-scrollbar gap-2 text-xs">
        {/* ======================= DESIGN TAB ======================= */}
        {activeTab === 'design' && (
          <div className="flex items-center gap-2">
            {/* Sub-mode selector (Features | Sketch | Sheet Metal | Surface) */}
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-md border border-[#E2E8F0] mr-2">
              <button
                onClick={() => onChangeDesignSubMode('features')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  designSubMode === 'features'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => onChangeDesignSubMode('sketch')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  designSubMode === 'sketch'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sketch
              </button>
              <button
                onClick={() => onChangeDesignSubMode('sheet_metal')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  designSubMode === 'sheet_metal'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sheet Metal
              </button>
              <button
                onClick={() => onChangeDesignSubMode('surfacing')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  designSubMode === 'surfacing'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Surface
              </button>
            </div>

            {/* FEATURES SUB-MODE */}
            {designSubMode === 'features' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteTool('extrude')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Extrude Boss/Base - Add material along normal vector"
                >
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span>Extrude</span>
                </button>

                <button
                  onClick={() => onExecuteTool('revolve')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Revolve Feature - Rotate profile around central axis"
                >
                  <RotateCw className="w-4 h-4 text-emerald-600" />
                  <span>Revolve</span>
                </button>

                <button
                  onClick={() => onExecuteTool('cut')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Extruded Cut - Remove material through volume"
                >
                  <Scissors className="w-4 h-4 text-rose-500" />
                  <span>Extrude Cut</span>
                </button>

                <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

                <button
                  onClick={() => onExecuteTool('fillet')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Fillet - Round external or internal sharp edges"
                >
                  <CircleDot className="w-4 h-4 text-blue-600" />
                  <span>Fillet</span>
                </button>

                <button
                  onClick={() => onExecuteTool('chamfer')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Chamfer - Bevel edges at 45 degrees"
                >
                  <Slash className="w-4 h-4 text-blue-600" />
                  <span>Chamfer</span>
                </button>

                <button
                  onClick={() => onExecuteTool('hole_wizard')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Hole Wizard - Standard ISO/DIN tapped & clearance holes"
                >
                  <Circle className="w-4 h-4 text-slate-700" />
                  <span>Hole Wizard</span>
                </button>

                <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

                <button
                  onClick={() => onExecuteTool('pattern')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Circular / Linear Pattern - Duplicate features radially or linearly"
                >
                  <Grid className="w-4 h-4 text-purple-600" />
                  <span>Pattern</span>
                </button>

                <button
                  onClick={() => onExecuteTool('mirror')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Mirror Feature - Reflect geometry across datum plane"
                >
                  <Split className="w-4 h-4 text-purple-600" />
                  <span>Mirror</span>
                </button>
              </div>
            )}

            {/* SKETCH SUB-MODE */}
            {designSubMode === 'sketch' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteTool('open_sketcher')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Open Full 2D Constraint Sketcher"
                >
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  <span>2D Sketcher Canvas</span>
                </button>

                <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

                <button
                  onClick={() => onExecuteTool('sketch_line')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                  title="Line (L)"
                >
                  <Slash className="w-3.5 h-3.5 text-slate-700" />
                  <span>Line</span>
                </button>

                <button
                  onClick={() => onExecuteTool('sketch_circle')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                  title="Circle (C)"
                >
                  <Circle className="w-3.5 h-3.5 text-slate-700" />
                  <span>Circle</span>
                </button>

                <button
                  onClick={() => onExecuteTool('sketch_rect')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                  title="Rectangle (R)"
                >
                  <Square className="w-3.5 h-3.5 text-slate-700" />
                  <span>Rectangle</span>
                </button>

                <button
                  onClick={() => onExecuteTool('sketch_spline')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                  title="Spline"
                >
                  <Spline className="w-3.5 h-3.5 text-slate-700" />
                  <span>Spline</span>
                </button>

                <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

                <span className="text-[10px] text-[#64748B] font-mono uppercase font-semibold">
                  Constraints:
                </span>
                <span className="text-[11px] text-[#334155] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                  Horizontal | Vertical | Tangent | Coincident
                </span>
              </div>
            )}

            {/* SHEET METAL SUB-MODE */}
            {designSubMode === 'sheet_metal' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteTool('sheet_metal_flange')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                >
                  <FoldHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Base Flange</span>
                </button>
                <button
                  onClick={() => onExecuteTool('sheet_metal_bend')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                >
                  <FoldHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Edge Flange</span>
                </button>
                <button
                  onClick={() => onExecuteTool('sheet_metal_flatten')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                  <span>Flatten Pattern</span>
                </button>
              </div>
            )}

            {/* SURFACING SUB-MODE */}
            {designSubMode === 'surfacing' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExecuteTool('surface_loft')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                >
                  <Layers3 className="w-4 h-4 text-indigo-600" />
                  <span>Lofted Surface</span>
                </button>
                <button
                  onClick={() => onExecuteTool('surface_knit')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Knit Surface to Solid</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================= ASSEMBLY TAB ======================= */}
        {activeTab === 'assembly' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTool('insert_component')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Insert Part into Active Assembly"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Insert Component</span>
            </button>

            <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

            <button
              onClick={() => onExecuteTool('mate_assistant')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Concentric Mate - Align cylindrical axes"
            >
              <CircleDot className="w-4 h-4 text-blue-600" />
              <span>Concentric Mate</span>
            </button>

            <button
              onClick={() => onExecuteTool('mate_coincident')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Coincident Mate - Touch planar faces"
            >
              <Square className="w-4 h-4 text-blue-600" />
              <span>Coincident Mate</span>
            </button>

            <button
              onClick={() => onExecuteTool('gear_generation')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Gear Coupler - Planetary kinematics"
            >
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>Gear Mesh Mate</span>
            </button>

            <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

            {/* Interactive Exploded View Slider */}
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-[#E2E8F0] rounded-md">
              <button
                onClick={onToggleExploded}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  isExplodedActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
                title="Toggle Exploded Disassembly View"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Explode</span>
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedProgress}
                onChange={(e) => onExplodedProgressChange(parseFloat(e.target.value))}
                className="w-20 accent-emerald-600 cursor-pointer"
                title="Exploded view distance factor"
              />
              <span className="text-[10px] font-mono text-[#64748B] w-8 text-right">
                {Math.round(explodedProgress * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* ======================= INSPECT TAB ======================= */}
        {activeTab === 'inspect' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTool('measure')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
              title="Measure 3D Distance, Radius, Angle (M)"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Measure (M)</span>
            </button>

            <button
              onClick={() => onExecuteTool('mass_properties')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
              title="Evaluate Mass, Volume, Center of Gravity"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Mass Properties</span>
            </button>

            <button
              onClick={() => onExecuteTool('interference_detection')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
              title="Interference Detection - 3D kinematic clash check"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Interference Check</span>
            </button>

            <button
              onClick={onToggleSectionCut}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium border transition-colors cursor-pointer ${
                isSectionCutActive
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                  : 'hover:bg-[#F1F5F9] text-[#0F172A] border-transparent hover:border-[#E2E8F0]'
              }`}
              title="Cross-Section Cut Analysis"
            >
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>Section Analysis</span>
            </button>
          </div>
        )}

        {/* ======================= SIMULATION TAB ======================= */}
        {activeTab === 'simulation' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTool('fea_analysis')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Run Static Finite Element Stress Analysis"
            >
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Solve Static Stress</span>
            </button>

            <button
              onClick={() => onExecuteTool('fea_safety_factor')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Calculate Von Mises Stress and Minimum Factor of Safety"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Safety Factor (FoS)</span>
            </button>

            <button
              onClick={() => onExecuteTool('fea_thermal')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Thermal Distribution & Expansion Analysis"
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Thermal Study</span>
            </button>
          </div>
        )}

        {/* ======================= DRAWING TAB ======================= */}
        {activeTab === 'drawing' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTool('tool_drawing')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Open Dedicated 2D Drafting Sheet (ISO / ASME Title Block)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Open 2D Drawing Workspace</span>
            </button>

            <button
              onClick={() => onExecuteTool('2d_to_3d_converter')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
              title="Vanta 2D-to-3D Intelligent CAD Converter (PDF, DXF, PNG)"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>2D to 3D Converter</span>
            </button>

            <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

            <button
              onClick={() => onExecuteTool('tool_bom')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Show Engineering Bill of Materials (BOM)"
            >
              <Table className="w-4 h-4 text-slate-700" />
              <span>Bill of Materials (BOM)</span>
            </button>

            <button
              onClick={() => onExecuteTool('tolerance_callouts')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="GD&T Tolerance & Surface Finish Callouts"
            >
              <Sliders className="w-4 h-4 text-slate-700" />
              <span>GD&T Tolerances</span>
            </button>
          </div>
        )}

        {/* ======================= TOOLS TAB ======================= */}
        {activeTab === 'tools' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTool('2d_to_3d_converter')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Convert 2D Technical Drawings into 3D Parametric CAD Solid Models"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>2D to 3D Converter</span>
            </button>

            <button
              onClick={() => onExecuteTool('hole_wizard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Standard Fasteners: DIN 912, ISO 4762 Socket Head Screws"
            >
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span>Fastener Library</span>
            </button>

            <button
              onClick={() => onExecuteTool('skf_bearing_pocket')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Standard Deep Groove Ball Bearings (SKF / NSK)"
            >
              <Disc className="w-4 h-4 text-blue-600" />
              <span>Bearing Catalog</span>
            </button>

            <button
              onClick={() => onExecuteTool('tool_gear_gen')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F1F5F9] text-[#0F172A] font-medium transition-colors cursor-pointer"
              title="Parametric Gear Generator"
            >
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Gear Generator</span>
            </button>
          </div>
        )}

        {/* RIGHT: Compact View Display Mode Controls (Shaded with Edges, Wireframe, X-Ray) */}
        <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-[#E2E8F0]">
          <button
            onClick={() => onChangeDisplayMode('shaded_edges')}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              displayMode === 'shaded_edges'
                ? 'bg-slate-100 text-emerald-700 font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Shaded with Edges"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeDisplayMode('wireframe')}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              displayMode === 'wireframe'
                ? 'bg-slate-100 text-emerald-700 font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Wireframe Mode"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeDisplayMode('xray')}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              displayMode === 'xray'
                ? 'bg-slate-100 text-emerald-700 font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="X-Ray Semi-Transparent Mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
