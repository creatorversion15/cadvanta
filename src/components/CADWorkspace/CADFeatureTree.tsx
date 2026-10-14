import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Search,
  Box,
  RotateCw,
  CircleDot,
  Scissors,
  Layers,
  Sliders,
  MoreVertical,
  CheckCircle2,
  Lock,
  Compass,
  Cpu,
  Slash,
  Square,
  Circle,
  Trash2,
  Edit2,
  Ban,
  Scale,
  Minus,
  Plus,
} from 'lucide-react';
import { CADPart } from '../../types/cad';
import { MATERIALS } from '../../materials/materialsDatabase';

export interface CADFeatureNode {
  id: string;
  name: string;
  shortName: string;
  type: 'plane' | 'origin' | 'sketch' | 'extrude' | 'revolve' | 'fillet' | 'chamfer' | 'hole' | 'gear' | 'shaft' | 'bearing' | 'component';
  visible: boolean;
  suppressed: boolean;
  children?: CADFeatureNode[];
}

interface CADFeatureTreeProps {
  part: CADPart;
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string | null) => void;
  onEditFeature?: (featureId: string) => void;
  onToggleVisibility?: (featureId: string) => void;
  onToggleSuppress?: (featureId: string) => void;
  onDeleteFeature?: (featureId: string) => void;
  onParameterChange?: (key: string, value: any) => void;
  onMaterialChange?: (materialId: string) => void;
  activeTab?: 'tree' | 'params';
  onTabChange?: (tab: 'tree' | 'params') => void;
}

export const CADFeatureTree: React.FC<CADFeatureTreeProps> = ({
  part,
  selectedFeatureId,
  onSelectFeature,
  onEditFeature,
  onToggleVisibility,
  onToggleSuppress,
  onDeleteFeature,
  onParameterChange,
  onMaterialChange,
  activeTab = 'tree',
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'tree' | 'params'>('tree');
  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = onTabChange ? onTabChange : setInternalTab;

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    datums: true,
    features: true,
    components: true,
  });
  const [contextMenu, setContextMenu] = useState<{
    featureId: string;
    x: number;
    y: number;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (e: React.MouseEvent, featureId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectFeature(featureId);
    setContextMenu({
      featureId,
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 200),
    });
  };

  // Generate dynamic feature nodes based on part parameters
  const isAssembly = part.type === 'planetary_gearbox';

  const defaultNodes: CADFeatureNode[] = [
    {
      id: 'datums',
      name: 'Datum References',
      shortName: 'Datums',
      type: 'plane',
      visible: true,
      suppressed: false,
      children: [
        { id: 'origin', name: 'Coordinate Origin', shortName: 'Origin', type: 'origin', visible: true, suppressed: false },
        { id: 'plane_xy', name: 'Top Plane [XY]', shortName: 'Top [XY]', type: 'plane', visible: true, suppressed: false },
        { id: 'plane_xz', name: 'Front Plane [XZ]', shortName: 'Front [XZ]', type: 'plane', visible: true, suppressed: false },
        { id: 'plane_yz', name: 'Right Plane [YZ]', shortName: 'Right [YZ]', type: 'plane', visible: true, suppressed: false },
      ],
    },
    {
      id: 'features',
      name: isAssembly ? 'Components' : 'Features',
      shortName: isAssembly ? 'Assembly' : 'Features',
      type: isAssembly ? 'component' : 'extrude',
      visible: true,
      suppressed: false,
      children: isAssembly
        ? [
            { id: 'feat_housing', name: 'Gearbox Housing', shortName: 'Housing', type: 'component', visible: true, suppressed: false },
            { id: 'feat_sun', name: 'Sun Gear (30T)', shortName: 'Sun (30T)', type: 'gear', visible: true, suppressed: false },
            { id: 'feat_planet1', name: 'Planet A (30T)', shortName: 'Planet A', type: 'gear', visible: true, suppressed: false },
            { id: 'feat_planet2', name: 'Planet B (30T)', shortName: 'Planet B', type: 'gear', visible: true, suppressed: false },
            { id: 'feat_planet3', name: 'Planet C (30T)', shortName: 'Planet C', type: 'gear', visible: true, suppressed: false },
            { id: 'feat_carrier', name: 'Planet Carrier', shortName: 'Carrier', type: 'component', visible: true, suppressed: false },
            { id: 'feat_ring', name: 'Ring Gear (90T)', shortName: 'Ring (90T)', type: 'gear', visible: true, suppressed: false },
            { id: 'feat_shaft_in', name: 'Drive Shaft Ø35', shortName: 'Shaft Ø35', type: 'shaft', visible: true, suppressed: false },
            { id: 'feat_bearings', name: 'Bearings (4x)', shortName: 'Bearings', type: 'bearing', visible: true, suppressed: false },
          ]
        : part.features && part.features.length > 0
        ? part.features.map((f) => ({
            id: f.id,
            name: f.name,
            shortName: f.name.length > 15 ? f.name.slice(0, 13) + '..' : f.name,
            type: (f.type === 'base' || f.type === 'extrude' ? 'extrude' : f.type === 'revolve' ? 'revolve' : f.type === 'fillet' ? 'fillet' : f.type === 'hole' ? 'hole' : 'extrude') as CADFeatureNode['type'],
            visible: f.enabled !== false,
            suppressed: !f.enabled,
          }))
        : [
            { id: 'sketch1', name: 'Sketch 1 (Base)', shortName: 'Sketch 1', type: 'sketch', visible: true, suppressed: false },
            { id: 'feat_boss', name: `Extrude (${part.parameters.length || 180}mm)`, shortName: `Extrude (${part.parameters.length || 180})`, type: 'extrude', visible: true, suppressed: false },
            { id: 'feat_revolve', name: `Journal (Ø${part.parameters.main_diameter || 60})`, shortName: `Journal (Ø${part.parameters.main_diameter || 60})`, type: 'revolve', visible: true, suppressed: false },
            { id: 'feat_fillet', name: `Fillet (R${part.parameters.fillet_radius || 4})`, shortName: `Fillet (R${part.parameters.fillet_radius || 4})`, type: 'fillet', visible: true, suppressed: false },
            { id: 'feat_hole', name: 'Holes (4x M10)', shortName: 'Holes (4x)', type: 'hole', visible: true, suppressed: false },
          ],
    },
  ];

  const getIconForType = (type: CADFeatureNode['type']) => {
    switch (type) {
      case 'origin':
        return <CircleDot className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'plane':
        return <Square className="w-3 h-3 text-blue-500 shrink-0" />;
      case 'sketch':
        return <Slash className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'extrude':
        return <Box className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'revolve':
        return <RotateCw className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'fillet':
        return <CircleDot className="w-3 h-3 text-blue-600 shrink-0" />;
      case 'hole':
        return <Circle className="w-3 h-3 text-slate-700 shrink-0" />;
      case 'gear':
        return <Cpu className="w-3 h-3 text-purple-600 shrink-0" />;
      case 'shaft':
        return <RotateCw className="w-3 h-3 text-indigo-600 shrink-0" />;
      case 'bearing':
        return <CircleDot className="w-3 h-3 text-teal-600 shrink-0" />;
      case 'component':
      default:
        return <Box className="w-3 h-3 text-slate-600 shrink-0" />;
    }
  };

  const filteredNodes = defaultNodes
    .map((node) => {
      if (!searchQuery) return node;
      const q = searchQuery.toLowerCase();
      const matchParent = node.name.toLowerCase().includes(q) || node.shortName.toLowerCase().includes(q);
      const matchingChildren = node.children?.filter(
        (c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)
      );
      if (matchParent || (matchingChildren && matchingChildren.length > 0)) {
        return {
          ...node,
          children: matchParent ? node.children : matchingChildren,
        };
      }
      return null;
    })
    .filter(Boolean) as CADFeatureNode[];

  // Calculate mass & volume for left panel
  const density = part.material?.density || 7.85;
  const l = Number(part.parameters.length || 180);
  const d = Number(part.parameters.main_diameter || part.parameters.outer_diameter || 60);
  const volumeCm3 = Math.round((Math.PI * Math.pow(d / 20, 2) * (l / 10)) * 0.85);
  const massKg = ((volumeCm3 * density) / 1000).toFixed(2);

  return (
    <div
      id="cadvanta-feature-tree"
      className="w-full h-full bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col select-none text-[11px] font-sans relative overflow-hidden"
    >
      {/* 1. Header & Compact Tab Bar */}
      <div className="p-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-[#0F172A] uppercase text-[10px] tracking-tight truncate">
              {part.name.length > 18 ? part.name.slice(0, 18) + '…' : part.name}
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold shrink-0">
            {massKg}kg
          </span>
        </div>

        {/* Dual Segmented Controls: Tree | Params */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-md">
          <button
            type="button"
            onClick={() => setTab('tree')}
            className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
              currentTab === 'tree'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Tree</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('params')}
            className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
              currentTab === 'params'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Params</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT: TREE VIEW OR PARAMETERS VIEW */}
      {currentTab === 'tree' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick Search filter */}
          <div className="p-1 border-b border-[#F1F5F9] shrink-0">
            <div className="relative">
              <Search className="w-2.5 h-2.5 text-[#94A3B8] absolute left-1.5 top-1.5" />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-1.5 py-0.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded text-[10px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Feature List (Compact with Small Names) */}
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
            {/* Root Part Node */}
            <div
              onClick={() => onSelectFeature(null)}
              onContextMenu={(e) => handleContextMenu(e, 'root')}
              className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition-colors ${
                selectedFeatureId === null
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'hover:bg-[#F1F5F9] text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-1 truncate">
                <Box className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[10px] truncate">{part.name}</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-600 font-bold shrink-0">
                {(part.material?.name || (typeof part.material === 'string' ? part.material : '') || 'Steel').split(' ')[0]}
              </span>
            </div>

            {/* Hierarchical Nodes */}
            {filteredNodes.map((node) => {
              const isExpanded = expandedNodes[node.id] ?? true;
              return (
                <div key={node.id} className="space-y-0.5">
                  {/* Folder / Parent Header */}
                  <div
                    onClick={(e) => toggleExpand(node.id, e)}
                    className="flex items-center justify-between px-1 py-0.5 rounded text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 truncate">
                      {isExpanded ? (
                        <ChevronDown className="w-2.5 h-2.5 text-[#94A3B8] shrink-0" />
                      ) : (
                        <ChevronRight className="w-2.5 h-2.5 text-[#94A3B8] shrink-0" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" />
                      ) : (
                        <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      <span className="font-semibold text-[10px] text-[#334155] truncate">{node.shortName}</span>
                    </div>
                  </div>

                  {/* Children Nodes */}
                  {isExpanded && node.children && (
                    <div className="pl-2 space-y-0.5 border-l border-[#E2E8F0] ml-1.5">
                      {node.children.map((child) => {
                        const isSelected = selectedFeatureId === child.id;
                        return (
                          <div
                            key={child.id}
                            onClick={() => onSelectFeature(child.id)}
                            onContextMenu={(e) => handleContextMenu(e, child.id)}
                            className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition-colors group ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                                : 'hover:bg-[#F8FAFC] text-[#334155]'
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0 truncate">
                              {getIconForType(child.type)}
                              <span className="truncate text-[10px]">{child.shortName}</span>
                            </div>

                            {/* Action shortcuts */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTab('params');
                                  onSelectFeature(child.id);
                                }}
                                className="p-0.5 hover:text-emerald-700 text-[#94A3B8] cursor-pointer"
                                title="Edit Dimensions"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* PARAMETERS VIEW (Integrated Right Properties inside Left Panel) */
        <div className="flex-1 overflow-y-auto p-1.5 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
          {/* Active selection banner if feature is selected */}
          {selectedFeatureId && (
            <div className="px-1.5 py-1 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
              <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase truncate">
                {selectedFeatureId.replace('feat_', '')}
              </span>
              <button
                type="button"
                onClick={() => onSelectFeature(null)}
                className="text-[9px] text-slate-500 hover:text-slate-900 cursor-pointer underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Part Color Swatches (Requirement 5) */}
          <div className="space-y-1 bg-slate-50 p-1.5 rounded border border-slate-200">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-700 font-bold uppercase tracking-tight">Part Color</span>
              <span className="font-mono text-[9px] text-slate-500 font-semibold">
                {String(part.parameters?.part_color || '#F5F5F5').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              {[
                { name: 'Satin White', hex: '#F5F5F5' },
                { name: 'Industrial Grey', hex: '#E2E8F0' },
                { name: 'Studio Blue', hex: '#0284C7' },
                { name: 'Emerald', hex: '#10B981' },
                { name: 'Amber', hex: '#F59E0B' },
                { name: 'Graphite', hex: '#334155' },
              ].map((swatch) => {
                const current = String(part.parameters?.part_color || '#F5F5F5').toLowerCase();
                const isSelected = current === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => onParameterChange && onParameterChange('part_color', swatch.hex)}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/50 scale-110'
                        : 'border-slate-300 hover:border-slate-500 hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={`${swatch.name} (${swatch.hex})`}
                  >
                    {isSelected && (
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: swatch.hex === '#F5F5F5' ? '#0F172A' : '#FFFFFF' }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Native custom color picker */}
              <label
                className="w-4 h-4 rounded-full border border-dashed border-slate-400 hover:border-slate-600 flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0"
                title="Custom color picker"
              >
                <input
                  type="color"
                  value={String(part.parameters?.part_color || '#F5F5F5')}
                  onChange={(e) => onParameterChange && onParameterChange('part_color', e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 leading-none">+</span>
              </label>
            </div>
          </div>

          {/* Dimensional sliders */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-tight flex items-center justify-between">
              <span>Dimensions</span>
              <span className="text-[9px] font-mono text-slate-500">{part.units || 'mm'}</span>
            </div>

            {Object.entries(part.parameters || {})
              .filter(([k, v]) => k !== 'part_color' && typeof v === 'number')
              .map(([key, val]) => {
              const numVal = Number(val) || 0;
              const minVal = key.includes('radius') ? 1 : 5;
              const maxVal = key.includes('diameter') ? 250 : key.includes('length') ? 500 : 80;
              const step = key.includes('radius') ? 0.5 : 1;

              return (
                <div key={key} className="space-y-0.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-700 font-medium truncate capitalize max-w-[110px]" title={key}>
                      {key.replace(/_/g, ' ').replace('diameter', 'dia')}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-[10px]">
                      {numVal}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onParameterChange && onParameterChange(key, Math.max(minVal, numVal - step))}
                      className="p-0.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="range"
                      min={minVal}
                      max={maxVal}
                      step={step}
                      value={numVal}
                      onChange={(e) => onParameterChange && onParameterChange(key, parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-600 cursor-pointer h-1"
                    />
                    <button
                      type="button"
                      onClick={() => onParameterChange && onParameterChange(key, Math.min(maxVal, numVal + step))}
                      className="p-0.5 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Increase"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Material Selection */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Material</span>
            <select
              value={part.material?.id || 'steel_c45'}
              onChange={(e) => onMaterialChange && onMaterialChange(e.target.value)}
              className="w-full py-1 px-1.5 bg-white border border-slate-300 rounded text-[10px] text-slate-900 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
            >
              {MATERIALS.slice(0, 10).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Mass & Physical Summary */}
          <div className="p-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded space-y-0.5 text-[9px] font-mono text-slate-700">
            <div className="flex items-center justify-between">
              <span>Estimated Mass:</span>
              <span className="font-bold text-emerald-800">{massKg} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Calculated Vol:</span>
              <span>{volumeCm3} cm³</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Density:</span>
              <span>{density} g/cm³</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed w-36 bg-white border border-[#CBD5E1] rounded shadow-lg py-0.5 z-50 text-[10px] font-sans animate-in fade-in zoom-in-95"
        >
          <button
            onClick={() => {
              setTab('params');
              onSelectFeature(contextMenu.featureId);
              setContextMenu(null);
            }}
            className="w-full px-2 py-1 text-left hover:bg-[#F8FAFC] flex items-center gap-1.5 text-[#0F172A] cursor-pointer"
          >
            <Edit2 className="w-2.5 h-2.5 text-blue-600" />
            <span>Edit Params</span>
          </button>
          <button
            onClick={() => {
              if (onToggleSuppress) onToggleSuppress(contextMenu.featureId);
              setContextMenu(null);
            }}
            className="w-full px-2 py-1 text-left hover:bg-[#F8FAFC] flex items-center gap-1.5 text-[#0F172A] cursor-pointer"
          >
            <Ban className="w-2.5 h-2.5 text-amber-500" />
            <span>Suppress</span>
          </button>
          <button
            onClick={() => {
              if (onToggleVisibility) onToggleVisibility(contextMenu.featureId);
              setContextMenu(null);
            }}
            className="w-full px-2 py-1 text-left hover:bg-[#F8FAFC] flex items-center gap-1.5 text-[#0F172A] cursor-pointer"
          >
            <Eye className="w-2.5 h-2.5 text-slate-600" />
            <span>Hide / Show</span>
          </button>
          <div className="my-0.5 border-t border-[#F1F5F9]" />
          <button
            onClick={() => {
              if (onDeleteFeature) onDeleteFeature(contextMenu.featureId);
              setContextMenu(null);
            }}
            className="w-full px-2 py-1 text-left hover:bg-rose-50 flex items-center gap-1.5 text-rose-600 cursor-pointer"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
