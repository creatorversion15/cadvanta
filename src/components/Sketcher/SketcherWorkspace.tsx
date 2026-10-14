import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Circle,
  Square,
  Slash,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Grid,
  Magnet,
  Trash2,
  Layers,
  Scissors,
  RotateCw,
  X,
  Compass,
  ArrowRight,
  Sliders,
  Sparkles,
  RefreshCw,
  Box,
} from 'lucide-react';
import { CADPart } from '../../types/cad';
import { Sketcher3DPreview } from './Sketcher3DPreview';

export type SketchTool = 'select' | 'line' | 'circle' | 'rectangle' | 'arc' | 'dimension';
export type SketchConstraintType = 'horizontal' | 'vertical' | 'coincident' | 'parallel' | 'perpendicular' | 'tangent' | 'equal';

export interface SketchEntity {
  id: string;
  type: 'line' | 'circle' | 'rectangle' | 'arc';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  radius?: number;
  width?: number;
  height?: number;
  dimension?: number;
  constraints?: SketchConstraintType[];
  color?: string;
}

interface SketcherWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  activePlane: 'XY' | 'XZ' | 'YZ';
  onFinishSketchAndExtrude: (params: {
    operation: 'extrude' | 'cut' | 'revolve';
    depthMm: number;
    direction?: 'blind' | 'symmetric';
    entities: SketchEntity[];
    sketchName: string;
  }) => void;
  activePart: CADPart;
}

export const SketcherWorkspace: React.FC<SketcherWorkspaceProps> = ({
  isOpen,
  onClose,
  activePlane = 'XZ',
  onFinishSketchAndExtrude,
  activePart,
}) => {
  const [currentPlane, setCurrentPlane] = useState<'XY' | 'XZ' | 'YZ'>(activePlane);
  const [activeTool, setActiveTool] = useState<SketchTool>('line');

  // Initial default closed profile
  const [entities, setEntities] = useState<SketchEntity[]>([
    { id: 'e1', type: 'line', startX: -60, startY: 0, endX: 60, endY: 0, dimension: 120, constraints: ['horizontal'] },
    { id: 'e2', type: 'line', startX: 60, startY: 0, endX: 60, endY: 50, dimension: 50, constraints: ['vertical'] },
    { id: 'e3', type: 'line', startX: 60, startY: 50, endX: -60, endY: 50, dimension: 120, constraints: ['horizontal'] },
    { id: 'e4', type: 'line', startX: -60, startY: 50, endX: -60, endY: 0, dimension: 50, constraints: ['vertical'] },
  ]);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(10);
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraft, setCurrentDraft] = useState<SketchEntity | null>(null);

  // Extrude parameters
  const [extrudeOp, setExtrudeOp] = useState<'extrude' | 'cut' | 'revolve'>('extrude');
  const [extrudeDepth, setExtrudeDepth] = useState<number>(50);
  const [extrudeDirection, setExtrudeDirection] = useState<'blind' | 'symmetric'>('blind');

  const canvasRef = useRef<SVGSVGElement>(null);

  // Sync activePlane if prop changes
  useEffect(() => {
    setCurrentPlane(activePlane);
  }, [activePlane]);

  // Keyboard shortcut listener (Delete selected entity, Escape cancel)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntityId) {
          e.preventDefault();
          setEntities((prev) => prev.filter((ent) => ent.id !== selectedEntityId));
          setSelectedEntityId(null);
        }
      } else if (e.key === 'Escape') {
        if (isDrawing) {
          setIsDrawing(false);
          setCurrentDraft(null);
          setDragStart(null);
        } else {
          setSelectedEntityId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedEntityId, isDrawing]);

  if (!isOpen) return null;

  // Total constraints count
  const totalConstraints = entities.reduce((acc, e) => acc + (e.constraints?.length || 0), 0);
  const isFullyConstrained = entities.length > 0 && totalConstraints >= entities.length * 1.2;

  const snapVal = (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : Math.round(v));

  const getCanvasCoords = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rawX = e.clientX - rect.left - centerX;
    const rawY = -(e.clientY - rect.top - centerY); // Invert Y for standard Cartesian
    return { x: snapVal(rawX), y: snapVal(rawY) };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getCanvasCoords(e);
    if (activeTool === 'select') return;

    setIsDrawing(true);
    setDragStart(pt);

    if (activeTool === 'line') {
      setCurrentDraft({
        id: `draft_${Date.now()}`,
        type: 'line',
        startX: pt.x,
        startY: pt.y,
        endX: pt.x,
        endY: pt.y,
      });
    } else if (activeTool === 'circle') {
      setCurrentDraft({
        id: `draft_${Date.now()}`,
        type: 'circle',
        startX: pt.x,
        startY: pt.y,
        radius: 5,
      });
    } else if (activeTool === 'rectangle') {
      setCurrentDraft({
        id: `draft_${Date.now()}`,
        type: 'rectangle',
        startX: pt.x,
        startY: pt.y,
        width: 10,
        height: 10,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getCanvasCoords(e);
    setCursorCoord(pt);

    if (!isDrawing || !dragStart || !currentDraft) return;

    if (currentDraft.type === 'line') {
      setCurrentDraft({
        ...currentDraft,
        endX: pt.x,
        endY: pt.y,
        dimension: Math.round(Math.hypot(pt.x - dragStart.x, pt.y - dragStart.y)),
      });
    } else if (currentDraft.type === 'circle') {
      const rad = Math.round(Math.hypot(pt.x - dragStart.x, pt.y - dragStart.y));
      setCurrentDraft({
        ...currentDraft,
        radius: Math.max(5, rad),
        dimension: rad * 2,
      });
    } else if (currentDraft.type === 'rectangle') {
      setCurrentDraft({
        ...currentDraft,
        width: Math.abs(pt.x - dragStart.x),
        height: Math.abs(pt.y - dragStart.y),
        startX: Math.min(pt.x, dragStart.x),
        startY: Math.max(pt.y, dragStart.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDraft) {
      setEntities((prev) => [...prev, { ...currentDraft, id: `e_${Date.now()}` }]);
      setCurrentDraft(null);
      setIsDrawing(false);
      setDragStart(null);
    }
  };

  const addConstraintToSelected = (constraint: SketchConstraintType) => {
    if (!selectedEntityId) return;
    setEntities((prev) =>
      prev.map((e) => {
        if (e.id === selectedEntityId) {
          const current = e.constraints || [];
          if (!current.includes(constraint)) {
            return { ...e, constraints: [...current, constraint] };
          }
        }
        return e;
      })
    );
  };

  const deleteSelectedEntity = () => {
    if (!selectedEntityId) return;
    setEntities((prev) => prev.filter((e) => e.id !== selectedEntityId));
    setSelectedEntityId(null);
  };

  // Quick Sketch Templates
  const handleLoadPreset = (preset: 'box' | 'flange' | 'slot' | 'clear') => {
    setSelectedEntityId(null);
    if (preset === 'clear') {
      setEntities([]);
    } else if (preset === 'box') {
      setEntities([
        { id: `rect_${Date.now()}`, type: 'rectangle', startX: -60, startY: 35, width: 120, height: 70, dimension: 120 },
      ]);
    } else if (preset === 'flange') {
      setEntities([
        { id: `circ_out_${Date.now()}`, type: 'circle', startX: 0, startY: 0, radius: 55, dimension: 110 },
        { id: `circ_in_${Date.now()}`, type: 'circle', startX: 0, startY: 0, radius: 22, dimension: 44 },
      ]);
    } else if (preset === 'slot') {
      setEntities([
        { id: `line_1_${Date.now()}`, type: 'line', startX: -50, startY: -25, endX: 50, endY: -25, dimension: 100, constraints: ['horizontal'] },
        { id: `line_2_${Date.now()}`, type: 'line', startX: 50, startY: -25, endX: 50, endY: 25, dimension: 50, constraints: ['vertical'] },
        { id: `line_3_${Date.now()}`, type: 'line', startX: 50, startY: 25, endX: -50, endY: 25, dimension: 100, constraints: ['horizontal'] },
        { id: `line_4_${Date.now()}`, type: 'line', startX: -50, startY: 25, endX: -50, endY: -25, dimension: 50, constraints: ['vertical'] },
        { id: `hole_1_${Date.now()}`, type: 'circle', startX: -30, startY: 0, radius: 10, dimension: 20 },
        { id: `hole_2_${Date.now()}`, type: 'circle', startX: 30, startY: 0, radius: 10, dimension: 20 },
      ]);
    }
  };

  // Primary Finish Sketch & Extrude Action
  const handleFinishAndExtrude = () => {
    // If entities list is empty, default to a robust 120x60 base plate
    const finalEntities =
      entities.length > 0
        ? entities
        : [
            { id: 'def_e1', type: 'rectangle' as const, startX: -60, startY: 30, width: 120, height: 60, dimension: 120 },
          ];

    onFinishSketchAndExtrude({
      operation: extrudeOp,
      depthMm: extrudeDepth,
      direction: extrudeDirection,
      entities: finalEntities,
      sketchName: `Sketch on ${currentPlane}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050C0A] text-[#F0FDF4] select-none font-mono">
      {/* 1. TOP SKETCHER TOOLBAR */}
      <div className="h-14 bg-[#0B1E17] border-b border-[rgba(16,185,129,0.25)] px-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {/* Header Title & Plane Selector */}
          <div className="flex items-center gap-2 pr-3 border-r border-[rgba(16,185,129,0.2)]">
            <PenTool className="w-5 h-5 text-[#00F5A0]" />
            <div>
              <div className="text-xs font-bold text-[#F0FDF4] uppercase tracking-wider flex items-center gap-1.5">
                <span>2D SKETCHER & EXTRUDE STUDIO</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#00F5A0]/20 text-[#00F5A0] rounded font-mono font-normal">
                  DUAL-CANVAS
                </span>
              </div>
              <div className="text-[10px] text-[#8CA89E] flex items-center gap-1">
                <span>Active Datum:</span>
                <div className="inline-flex gap-1">
                  {(['XY', 'XZ', 'YZ'] as const).map((plane) => (
                    <button
                      key={plane}
                      type="button"
                      onClick={() => setCurrentPlane(plane)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        currentPlane === plane
                          ? 'bg-[#00F5A0] text-[#02140D]'
                          : 'bg-[#07130F] text-[#8CA89E] hover:text-[#F0FDF4]'
                      }`}
                    >
                      {plane}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2D Entity Drawing Tools */}
          <div className="flex items-center gap-1 bg-[#07130F] p-1 rounded-lg border border-[rgba(16,185,129,0.2)]">
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
              title="Select & Inspect Entities (V)"
            >
              Select
            </button>
            <button
              onClick={() => setActiveTool('line')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'line'
                  ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
              title="Draw Line (L)"
            >
              <Slash className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setActiveTool('circle')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'circle'
                  ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
              title="Draw Center-Radius Circle (C)"
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>
            <button
              onClick={() => setActiveTool('rectangle')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'rectangle'
                  ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
              title="Draw 2-Point Rectangle (R)"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Rectangle</span>
            </button>
            <button
              onClick={() => setActiveTool('dimension')}
              className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'dimension'
                  ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
              title="Dimension Tool (D)"
            >
              <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Dimension</span>
            </button>
          </div>

          {/* Quick Shape Presets */}
          <div className="hidden xl:flex items-center gap-1 bg-[#07130F] p-1 rounded-lg border border-[rgba(16,185,129,0.2)]">
            <span className="text-[10px] text-[#8CA89E] px-1 font-bold">PRESETS:</span>
            <button
              onClick={() => handleLoadPreset('box')}
              className="px-2 py-1 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] rounded text-[10px] cursor-pointer"
              title="Standard Box Profile"
            >
              Plate Box
            </button>
            <button
              onClick={() => handleLoadPreset('flange')}
              className="px-2 py-1 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] rounded text-[10px] cursor-pointer"
              title="Circular Flange with Bore"
            >
              Flange Disc
            </button>
            <button
              onClick={() => handleLoadPreset('slot')}
              className="px-2 py-1 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] rounded text-[10px] cursor-pointer"
              title="Slot Base with 2 Bolt Bores"
            >
              Slot Base
            </button>
            <button
              onClick={() => handleLoadPreset('clear')}
              className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded text-[10px] cursor-pointer ml-1"
              title="Clear Canvas to Blank"
            >
              Clear
            </button>
          </div>

          {/* Geometric Constraints Toolbar */}
          <div className="hidden 2xl:flex items-center gap-1 bg-[#07130F] p-1 rounded-lg border border-[rgba(16,185,129,0.2)]">
            <span className="text-[10px] text-[#8CA89E] px-1 font-bold">CONSTRAIN:</span>
            <button
              onClick={() => addConstraintToSelected('horizontal')}
              disabled={!selectedEntityId}
              className="px-2 py-1 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] disabled:opacity-40 rounded text-[10px] cursor-pointer"
              title="Make Horizontal (H)"
            >
              Horizontal
            </button>
            <button
              onClick={() => addConstraintToSelected('vertical')}
              disabled={!selectedEntityId}
              className="px-2 py-1 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] disabled:opacity-40 rounded text-[10px] cursor-pointer"
              title="Make Vertical (V)"
            >
              Vertical
            </button>
          </div>
        </div>

        {/* Right Action Controls: Finish Sketch & Status */}
        <div className="flex items-center gap-3">
          {/* Constraints Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
              isFullyConstrained
                ? 'bg-[#00F5A0]/10 border-[#00F5A0]/40 text-[#00F5A0]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-bold">{entities.length} Profile Entities</span>
          </div>

          {/* Top Finish & Extrude Action Button */}
          <button
            onClick={handleFinishAndExtrude}
            className="flex items-center gap-2 px-4 py-2 bg-[#00F5A0] hover:bg-[#00D68B] text-[#02140D] font-bold text-xs rounded-lg transition-all cursor-pointer shadow-lg active:scale-95"
            title="Convert Sketch to 3D Solid Model"
          >
            <Layers className="w-4 h-4" />
            <span>Finish Sketch & Extrude</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-[#8CA89E] hover:text-[#F0FDF4] rounded-lg hover:bg-[#102B21] cursor-pointer"
            title="Cancel & Exit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. DUAL-CANVAS SPLIT VIEW: 2D SKETCH CANVAS (LEFT) + LIVE 3D PREVIEW (RIGHT) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT CANVAS: 2D PRECISION PARAMETRIC SKETCH CANVAS (52%) */}
        {/* ======================================================== */}
        <div className="flex-1 relative overflow-hidden bg-[#07130F] flex items-center justify-center border-r border-[rgba(16,185,129,0.2)]">
          {/* Top Status & Presets for Smaller Screens */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0B1E17]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[rgba(16,185,129,0.2)] text-xs font-mono">
            <span className="text-[11px] font-bold text-[#00F5A0]">2D SKETCH CANVAS</span>
            <span className="text-[10px] text-[#8CA89E]">[{currentPlane} Plane]</span>
            <div className="flex items-center gap-1 pl-2 border-l border-[rgba(16,185,129,0.2)]">
              <button
                onClick={() => handleLoadPreset('box')}
                className="px-1.5 py-0.5 rounded text-[10px] bg-[#07130F] hover:bg-[#102B21] text-[#F0FDF4]"
                title="Box Template"
              >
                Box
              </button>
              <button
                onClick={() => handleLoadPreset('flange')}
                className="px-1.5 py-0.5 rounded text-[10px] bg-[#07130F] hover:bg-[#102B21] text-[#F0FDF4]"
                title="Flange Template"
              >
                Flange
              </button>
              <button
                onClick={() => handleLoadPreset('clear')}
                className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                title="Clear All"
              >
                Clear
              </button>
            </div>
          </div>

          {/* SVG Drawing Canvas with Centered Cartesian Plane */}
          <svg
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full cursor-crosshair"
            viewBox="-400 -300 800 600"
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.5" />
              </pattern>
              <pattern id="majorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
              </pattern>
            </defs>

            <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#majorGrid)" />

            {/* Coordinate Axes */}
            <line x1="-400" y1="0" x2="400" y2="0" stroke="rgba(0,245,160,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="0" y1="-300" x2="0" y2="300" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" strokeDasharray="4 2" />

            {/* Origin Indicator */}
            <circle cx="0" cy="0" r="4" fill="#00F5A0" />
            <text x="8" y="-8" fill="#00F5A0" fontSize="10" fontFamily="monospace">
              Origin (0,0)
            </text>

            {/* Render Existing Sketch Entities */}
            {entities.map((ent) => {
              const isSelected = selectedEntityId === ent.id;
              const strokeColor = isSelected ? '#38BDF8' : '#00F5A0';
              const strokeW = isSelected ? 3 : 2;

              if (ent.type === 'line') {
                const midX = (ent.startX + (ent.endX ?? ent.startX)) / 2;
                const midY = (ent.startY + (ent.endY ?? ent.startY)) / 2;
                return (
                  <g key={ent.id} onClick={() => setSelectedEntityId(ent.id)} className="cursor-pointer">
                    <line
                      x1={ent.startX}
                      y1={-ent.startY}
                      x2={ent.endX ?? ent.startX}
                      y2={-(ent.endY ?? ent.startY)}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                    />
                    {/* Dimension Callout Tag */}
                    {ent.dimension && (
                      <g transform={`translate(${midX}, ${-midY - 8})`}>
                        <rect x="-24" y="-8" width="48" height="16" fill="#07130F" stroke={strokeColor} strokeWidth="0.8" rx="3" />
                        <text x="0" y="3" fill="#F0FDF4" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {ent.dimension} mm
                        </text>
                      </g>
                    )}
                  </g>
                );
              }

              if (ent.type === 'circle') {
                return (
                  <g key={ent.id} onClick={() => setSelectedEntityId(ent.id)} className="cursor-pointer">
                    <circle
                      cx={ent.startX}
                      cy={-ent.startY}
                      r={ent.radius || 20}
                      fill="rgba(0,245,160,0.06)"
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                    />
                    <circle cx={ent.startX} cy={-ent.startY} r="3" fill={strokeColor} />
                    <text x={ent.startX + 8} y={-ent.startY - 8} fill="#F0FDF4" fontSize="9" fontFamily="monospace">
                      Ø{((ent.radius || 20) * 2).toFixed(1)} mm
                    </text>
                  </g>
                );
              }

              if (ent.type === 'rectangle') {
                const rectX = Math.min(ent.startX, ent.startX + (ent.width || 40));
                const rectY = Math.min(-ent.startY, -ent.startY + (ent.height || 40));
                return (
                  <g key={ent.id} onClick={() => setSelectedEntityId(ent.id)} className="cursor-pointer">
                    <rect
                      x={ent.startX}
                      y={-ent.startY}
                      width={ent.width || 40}
                      height={ent.height || 40}
                      fill="rgba(0,245,160,0.06)"
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                    />
                    <text x={ent.startX + 6} y={-ent.startY + 16} fill="#F0FDF4" fontSize="9" fontFamily="monospace">
                      {ent.width || 40} × {ent.height || 40} mm
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* Currently Active Drawing Draft */}
            {currentDraft && (
              <g className="pointer-events-none opacity-85">
                {currentDraft.type === 'line' && (
                  <line
                    x1={currentDraft.startX}
                    y1={-currentDraft.startY}
                    x2={currentDraft.endX || currentDraft.startX}
                    y2={-(currentDraft.endY || currentDraft.startY)}
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}
                {currentDraft.type === 'circle' && (
                  <circle
                    cx={currentDraft.startX}
                    cy={-currentDraft.startY}
                    r={currentDraft.radius || 10}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}
                {currentDraft.type === 'rectangle' && (
                  <rect
                    x={currentDraft.startX}
                    y={-currentDraft.startY}
                    width={currentDraft.width || 20}
                    height={currentDraft.height || 20}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            )}
          </svg>

          {/* HUD Live Cursor Coordinates & Snap Overlay */}
          <div className="absolute bottom-4 left-4 bg-[#07130F]/90 backdrop-blur-md border border-[rgba(16,185,129,0.2)] px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-4 shadow-md">
            <div>
              X: <span className="text-[#00F5A0] font-bold">{cursorCoord.x} mm</span>
            </div>
            <div>
              Y: <span className="text-[#00F5A0] font-bold">{cursorCoord.y} mm</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-[rgba(16,185,129,0.2)]">
              <Magnet className="w-3.5 h-3.5 text-[#00F5A0]" />
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`hover:underline cursor-pointer ${snapToGrid ? 'text-[#00F5A0]' : 'text-[#8CA89E]'}`}
              >
                Snap: {snapToGrid ? 'ON (10mm)' : 'OFF'}
              </button>
            </div>

            {/* Selected entity info & delete */}
            {selectedEntityId && (
              <div className="flex items-center gap-2 pl-2 border-l border-[rgba(16,185,129,0.2)] text-[#38BDF8]">
                <span>Selected: {selectedEntityId}</span>
                <button
                  type="button"
                  onClick={deleteSelectedEntity}
                  className="p-1 rounded hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 transition-colors"
                  title="Delete Selected Entity (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT CANVAS: LIVE 3D SOLID EXTRUSION VIEWPORT (48%)     */}
        {/* ======================================================== */}
        <div className="w-full md:w-[48%] h-72 md:h-full relative overflow-hidden bg-[#1E2228] flex flex-col">
          <Sketcher3DPreview
            entities={entities}
            activePlane={currentPlane}
            extrudeDepth={extrudeDepth}
            direction={extrudeDirection}
            partColor={activePart.material?.color || '#F5F5F5'}
            onDepthChange={setExtrudeDepth}
            onDirectionChange={setExtrudeDirection}
            onFinishAndExtrude={handleFinishAndExtrude}
          />
        </div>
      </div>
    </div>
  );
};
