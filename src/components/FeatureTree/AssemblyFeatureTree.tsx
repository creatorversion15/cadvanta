import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Box,
  Layers,
  CircleDot,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  Shield,
  RotateCcw,
  Search,
  Sliders,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

export interface AssemblyTreeNode {
  id: string;
  name: string;
  type: 'assembly' | 'subassembly' | 'part' | 'feature' | 'mate' | 'fastener' | 'bearing' | 'seal';
  material?: string;
  mass?: string;
  visible?: boolean;
  suppressed?: boolean;
  children?: AssemblyTreeNode[];
  expanded?: boolean;
  iconType?: string;
  detail?: string;
  tolerance?: string;
}

interface AssemblyFeatureTreeProps {
  activePart: CADPart;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleVisibility?: (nodeId: string) => void;
  onToggleSuppress?: (nodeId: string) => void;
}

export const AssemblyFeatureTree: React.FC<AssemblyFeatureTreeProps> = ({
  activePart,
  selectedNodeId,
  onSelectNode,
  onToggleVisibility,
  onToggleSuppress,
}) => {
  const [filterText, setFilterText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root_asm: true,
    sub_housing: true,
    sub_stage1: true,
    sub_stage2: true,
    sub_stage3: true,
    sub_bearings: true,
    sub_fasteners: false,
    sub_mates: true,
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Structured Industrial 3-Stage Planetary Gearbox Hierarchy
  const gearboxHierarchy: AssemblyTreeNode = {
    id: 'root_asm',
    name: 'CADVANTA_PG-3S_M2.5 (Top Assembly)',
    type: 'assembly',
    material: 'Alu 6061-T6 / AISI 4140',
    mass: '18.40 kg',
    visible: true,
    children: [
      // 1. Split Aluminum Housing Group
      {
        id: 'sub_housing',
        name: 'Split Aluminum Housing Subassembly',
        type: 'subassembly',
        material: 'Alloy 6061-T6 Anodized',
        mass: '6.20 kg',
        visible: true,
        children: [
          {
            id: 'node_housing_front',
            name: 'Front Flange Housing Half (Input)',
            type: 'part',
            material: 'Alu 6061-T6',
            mass: '3.10 kg',
            detail: 'With NEMA 42 motor pilot ring & 8x M8 bolt circle',
            tolerance: 'H7 Bore Ø80',
            visible: true,
          },
          {
            id: 'node_housing_rear',
            name: 'Rear Flange Housing Half (Output)',
            type: 'part',
            material: 'Alu 6061-T6',
            mass: '2.85 kg',
            detail: 'With radial drain port & dual lip oil seal recess',
            tolerance: 'H7 Bore Ø95',
            visible: true,
          },
          {
            id: 'node_ring_gear',
            name: 'Internal Ring Gear (Fixed Z=90, Mod 2.5)',
            type: 'part',
            material: 'AISI 4140 Nitrided',
            mass: '4.80 kg',
            detail: 'PCD 225.0 mm • Ground Tooth Profile',
            tolerance: 'DIN 3962 Gr 6',
            visible: true,
          },
        ],
      },

      // 2. Concentric Shafts & Mating
      {
        id: 'sub_shafts',
        name: 'Concentric Input/Output Shafts',
        type: 'subassembly',
        material: 'AISI 4140 Induction Hardened',
        mass: '3.40 kg',
        visible: true,
        children: [
          {
            id: 'node_shaft_input',
            name: 'High-Speed Input Shaft Ø32mm',
            type: 'part',
            material: 'AISI 4140',
            mass: '1.20 kg',
            detail: 'DIN 6885-A Keyway 8x7x40mm',
            tolerance: 'h7 (Ø32.000/-0.025)',
            visible: true,
          },
          {
            id: 'node_shaft_output',
            name: 'High-Torque Concentric Output Shaft Ø65mm',
            type: 'part',
            material: 'AISI 4140',
            mass: '2.20 kg',
            detail: 'Splined DIN 5480 W65x3x20 & End Retaining Ring',
            tolerance: 'h7 (Ø65.000/-0.030)',
            visible: true,
          },
        ],
      },

      // 3. Stage 1 Planetary Gearset (Ratio 4:1)
      {
        id: 'sub_stage1',
        name: 'Stage 1 Planetary Set (Mod 2.5, Ratio 4:1)',
        type: 'subassembly',
        material: 'AISI 4140 Quenched & Tempered',
        mass: '2.60 kg',
        visible: true,
        children: [
          {
            id: 'node_sun1',
            name: 'Sun Gear 1 (Z=30, PCD 75.0mm)',
            type: 'part',
            material: 'AISI 4140 Hardened',
            mass: '0.65 kg',
            detail: 'Module 2.5 • Pressure Angle 20°',
            tolerance: 'Clearance 0.08 mm',
            visible: true,
          },
          {
            id: 'node_planet1_cluster',
            name: '3x Planet Gears (Z=30, PCD 75.0mm @ 120°)',
            type: 'part',
            material: 'AISI 4140 Hardened',
            mass: '1.20 kg',
            detail: 'Needle roller caged pins',
            tolerance: 'h7/H7 Ground',
            visible: true,
          },
          {
            id: 'node_carrier1',
            name: 'Planet Carrier 1 (Dual-Strut Rigid Cage)',
            type: 'part',
            material: 'Alloy Steel 42CrMo4',
            mass: '0.75 kg',
            detail: 'High torsional rigidity',
            visible: true,
          },
        ],
      },

      // 4. Stage 2 Planetary Gearset (Ratio 4:1)
      {
        id: 'sub_stage2',
        name: 'Stage 2 Planetary Set (Mod 2.5, Intermediate)',
        type: 'subassembly',
        material: 'AISI 4140 Quenched & Tempered',
        mass: '2.90 kg',
        visible: true,
        children: [
          {
            id: 'node_sun2',
            name: 'Sun Gear 2 (Z=30, Integral to Carrier 1)',
            type: 'part',
            material: 'AISI 4140',
            mass: '0.70 kg',
            visible: true,
          },
          {
            id: 'node_planet2_cluster',
            name: '3x Planet Gears (Z=30, PCD 75.0mm @ 120°)',
            type: 'part',
            material: 'AISI 4140',
            mass: '1.30 kg',
            visible: true,
          },
          {
            id: 'node_carrier2',
            name: 'Planet Carrier 2 (Intermediate Spline Drive)',
            type: 'part',
            material: 'Alloy Steel 42CrMo4',
            mass: '0.90 kg',
            visible: true,
          },
        ],
      },

      // 5. Stage 3 Planetary Gearset (Ratio 4:1, High Torque)
      {
        id: 'sub_stage3',
        name: 'Stage 3 Planetary Set (Output High-Torque)',
        type: 'subassembly',
        material: 'AISI 4140 Quenched & Tempered',
        mass: '3.30 kg',
        visible: true,
        children: [
          {
            id: 'node_sun3',
            name: 'Sun Gear 3 (Z=30, High Tooth Face Width)',
            type: 'part',
            material: 'AISI 4140',
            mass: '0.85 kg',
            visible: true,
          },
          {
            id: 'node_planet3_cluster',
            name: '3x Heavy Planets (Z=30, PCD 75.0mm)',
            type: 'part',
            material: 'AISI 4140',
            mass: '1.45 kg',
            visible: true,
          },
          {
            id: 'node_carrier3',
            name: 'Output Planet Carrier Flange (Bolted to Main Shaft)',
            type: 'part',
            material: 'High-Tensile 42CrMo4',
            mass: '1.00 kg',
            visible: true,
          },
        ],
      },

      // 6. SKF Bearings & Support Hardware
      {
        id: 'sub_bearings',
        name: 'Precision SKF Bearings & Needle Rollers',
        type: 'subassembly',
        material: 'Bearing Steel 100Cr6',
        mass: '1.80 kg',
        visible: true,
        children: [
          {
            id: 'node_skf_6208_input',
            name: 'SKF 6208-2RS Deep Groove Ball Bearing (Input)',
            type: 'bearing',
            material: '100Cr6 Hardened',
            detail: 'Ø40xØ80x18 mm • Dyn C=32.5 kN',
            tolerance: 'H7 / h6',
            visible: true,
          },
          {
            id: 'node_skf_6310_output',
            name: 'SKF 6310 High-Load Bearing (Output Cantilever)',
            type: 'bearing',
            material: '100Cr6 Hardened',
            detail: 'Ø50xØ110x27 mm • Dyn C=65.0 kN',
            tolerance: 'H7 / h6',
            visible: true,
          },
          {
            id: 'node_ina_needle_rollers',
            name: '9x INA K-Series Needle Roller Assemblies',
            type: 'bearing',
            material: 'High-Carbon Steel',
            detail: 'Planet Gear Internal Bearings',
            visible: true,
          },
        ],
      },

      // 7. Fasteners, Circlips & Seals
      {
        id: 'sub_fasteners',
        name: 'Fasteners, Circlips & Oil Seals',
        type: 'subassembly',
        material: 'DIN Standard / NBR Nitrile',
        mass: '0.70 kg',
        visible: true,
        children: [
          {
            id: 'node_fasteners_m8',
            name: '12x ISO 4762 M8x35 Grade 10.9 Bolts',
            type: 'fastener',
            material: 'Alloy Steel 10.9',
            detail: 'Torque 36 N·m • Split Housing Clamping',
            visible: true,
          },
          {
            id: 'node_circlips_din471',
            name: '6x DIN 471 External Shaft Retaining Circlips',
            type: 'fastener',
            material: 'Spring Steel C67S',
            detail: 'Axial Retention for Sun & Planets',
            visible: true,
          },
          {
            id: 'node_oil_seal_nbr',
            name: 'Dual Radial NBR Rotary Oil Shaft Seals',
            type: 'seal',
            material: 'NBR 70 Shore A + Spring',
            detail: '45x65x8 mm (IP66 Protection)',
            visible: true,
          },
        ],
      },

      // 8. Kinematic Assembly Mates
      {
        id: 'sub_mates',
        name: 'Kinematic Assembly Constraints & Mates',
        type: 'subassembly',
        material: '6 DoF Solver',
        visible: true,
        children: [
          {
            id: 'mate_concentric_1',
            name: 'Concentric: Sun 1 Axis <-> Input Shaft Axis',
            type: 'mate',
            detail: 'Coaxial 0.000 mm runout',
            visible: true,
          },
          {
            id: 'mate_gear_stage1',
            name: 'Gear Mate: Sun 1 (Z=30) <-> Planets (Z=30) Ratio 1:1',
            type: 'mate',
            detail: 'Clearance 0.08 mm backlash',
            visible: true,
          },
          {
            id: 'mate_ring_fixed',
            name: 'Coincident Ground: Ring Gear (Z=90) <-> Housing Body',
            type: 'mate',
            detail: '0 DoF Fixed',
            visible: true,
          },
          {
            id: 'mate_bearing_fits',
            name: 'Cylindrical Fit: SKF 6208 Outer Ring <-> Housing Bore H7',
            type: 'mate',
            detail: 'Transition fit 0.012 mm',
            visible: true,
          },
        ],
      },
    ],
  };

  const renderNode = (node: AssemblyTreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] ?? false;
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    // Filter check
    if (filterText) {
      const match = node.name.toLowerCase().includes(filterText.toLowerCase());
      const childMatch = node.children?.some((c) =>
        c.name.toLowerCase().includes(filterText.toLowerCase())
      );
      if (!match && !childMatch) return null;
    }

    return (
      <div key={node.id} className="select-none text-xs">
        <div
          id={`tree-node-${node.id}`}
          onClick={() => onSelectNode(node.id)}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer group transition-colors ${
            isSelected
              ? 'bg-[#0284C7]/10 text-[#0284C7] font-semibold border-l-2 border-[#0284C7]'
              : 'hover:bg-[#F1F5F9] text-[#1E293B]'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 hover:bg-black/5 rounded cursor-pointer text-[#64748B]"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}

          {/* Node Icon */}
          {node.type === 'assembly' && <Layers className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />}
          {node.type === 'subassembly' && <Folder className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />}
          {node.type === 'part' && <Box className="w-3.5 h-3.5 text-[#64748B] shrink-0" />}
          {node.type === 'bearing' && <CircleDot className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />}
          {node.type === 'fastener' && <Hash className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />}
          {node.type === 'seal' && <Shield className="w-3.5 h-3.5 text-[#10B981] shrink-0" />}
          {node.type === 'mate' && <Sparkles className="w-3.5 h-3.5 text-[#EAB308] shrink-0" />}

          {/* Node Title */}
          <span className="truncate flex-1 font-mono text-[11px] text-[#0F172A]">{node.name}</span>

          {/* Tolerance Badge */}
          {node.tolerance && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 font-semibold">
              {node.tolerance}
            </span>
          )}

          {/* Eye Visibility Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(node.id);
            }}
            title="Toggle component visibility"
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#0284C7] transition-opacity cursor-pointer shrink-0"
          >
            <Eye className="w-3 h-3 text-[#64748B]" />
          </button>
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="border-l border-[#E2E8F0] ml-3">
            {node.children!.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="cadvanta-assembly-feature-tree"
      className="flex flex-col h-full bg-white text-[#0F172A] select-none text-xs"
    >
      {/* Header & Quick Filter */}
      <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] uppercase tracking-wider text-[#334155] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
            Feature & Assembly Tree
          </span>
          <span className="text-[10px] font-mono text-[#0284C7] font-bold bg-[#0284C7]/10 px-1.5 py-0.5 rounded border border-[#0284C7]/20">
            3-Stage Planetary
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Search parts, bearings, mates..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[11px] rounded bg-white border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {renderNode(gearboxHierarchy)}
      </div>

      {/* Footer Info Strip */}
      <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-mono text-[#64748B] flex items-center justify-between shrink-0">
        <span>Components: 24 active</span>
        <span className="text-[#059669] font-bold">DoF: 1 (Rotational)</span>
      </div>
    </div>
  );
};
