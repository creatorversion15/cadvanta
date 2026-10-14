import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Box,
  RotateCw,
  Scissors,
  CircleDot,
  PenTool,
  Sliders,
  Table,
  Cpu,
  Compass,
  FileSpreadsheet,
  Split,
  Bot,
  Wrench,
  Flame,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  name: string;
  category: 'Feature' | 'Sketch' | 'Assembly' | 'Inspect' | 'Simulation' | 'Drawing' | 'Export' | 'AI';
  shortcut?: string;
  icon: React.ElementType;
  description: string;
}

interface CADCommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (commandId: string) => void;
}

const ALL_COMMANDS: CommandItem[] = [
  // Features
  { id: 'extrude', name: 'Extrude Boss / Base', category: 'Feature', shortcut: 'E', icon: Box, description: 'Extrude a 2D profile along vector to create solid geometry' },
  { id: 'revolve', name: 'Revolve Boss', category: 'Feature', shortcut: 'R', icon: RotateCw, description: 'Revolve sketch contour 360° around an axis' },
  { id: 'cut', name: 'Extruded Cut', category: 'Feature', shortcut: 'Shift+C', icon: Scissors, description: 'Cut material from solid volume using profile' },
  { id: 'fillet', name: 'Fillet Edges', category: 'Feature', shortcut: 'F', icon: CircleDot, description: 'Round external or internal sharp edges with radius' },
  { id: 'chamfer', name: 'Chamfer Edges', category: 'Feature', shortcut: 'Alt+C', icon: CircleDot, description: 'Bevel sharp edges at 45° angle' },
  { id: 'hole_wizard', name: 'Hole Wizard (ISO / DIN)', category: 'Feature', shortcut: 'H', icon: CircleDot, description: 'Standard tapped, clearance, and counterbore holes' },
  { id: 'pattern', name: 'Circular / Linear Pattern', category: 'Feature', shortcut: 'P', icon: Box, description: 'Array features linearly or radially around center' },
  { id: 'mirror', name: 'Mirror Feature', category: 'Feature', shortcut: 'M', icon: Split, description: 'Reflect geometry across selected datum plane' },

  // Sketch
  { id: 'open_sketcher', name: '2D Constraint Sketcher Canvas', category: 'Sketch', shortcut: 'S', icon: PenTool, description: 'Open full-screen 2D drafting sketcher with geometric constraints' },
  { id: 'sketch_line', name: 'Sketch Line', category: 'Sketch', shortcut: 'L', icon: PenTool, description: 'Draw straight line segment between two points' },
  { id: 'sketch_circle', name: 'Sketch Circle', category: 'Sketch', shortcut: 'C', icon: PenTool, description: 'Draw center-point circle with radius' },

  // Assembly
  { id: 'insert_component', name: 'Insert Assembly Component', category: 'Assembly', shortcut: 'I', icon: Box, description: 'Add a new part or standard hardware into active assembly' },
  { id: 'mate_assistant', name: 'Concentric Mate', category: 'Assembly', shortcut: 'Shift+M', icon: CircleDot, description: 'Align cylindrical axes between two components' },
  { id: 'mate_coincident', name: 'Coincident Mate', category: 'Assembly', shortcut: 'Shift+C', icon: Box, description: 'Mate two planar faces together' },
  { id: 'toggle_exploded', name: 'Exploded Disassembly View', category: 'Assembly', shortcut: 'X', icon: Split, description: 'Interactive exploded view of all assembly components' },

  // Inspect
  { id: 'measure', name: 'Measure Distance & Angle', category: 'Inspect', shortcut: 'M', icon: Compass, description: 'Measure 3D distance, delta coordinates, and angles' },
  { id: 'mass_properties', name: 'Evaluate Mass Properties', category: 'Inspect', shortcut: 'Alt+M', icon: Sliders, description: 'Calculate total mass, volume, surface area, and center of mass' },
  { id: 'interference_detection', name: 'Interference Clash Check', category: 'Inspect', shortcut: 'Ctrl+I', icon: Compass, description: 'Detect 3D kinematic collisions and part interferences' },
  { id: 'toggle_section', name: 'Section Analysis Cut Plane', category: 'Inspect', shortcut: 'Sec', icon: Scissors, description: 'Slice model dynamically to inspect internal features' },

  // Simulation
  { id: 'fea_analysis', name: 'FEA Static Stress Solver', category: 'Simulation', shortcut: 'Ctrl+F', icon: Cpu, description: 'Run finite element analysis for Von Mises stress and deflection' },
  { id: 'fea_safety_factor', name: 'Calculate Safety Factor (FoS)', category: 'Simulation', shortcut: 'Ctrl+S', icon: Cpu, description: 'Evaluate yield strength factor of safety under peak load' },

  // Drawing
  { id: 'tool_drawing', name: 'Open 2D Engineering Drawing', category: 'Drawing', shortcut: 'D', icon: FileSpreadsheet, description: 'Generate orthographic ISO A3 drafting sheet with title block' },
  { id: 'tool_bom', name: 'Bill of Materials (BOM) Table', category: 'Drawing', shortcut: 'B', icon: Table, description: 'Show itemized part list with quantities and materials' },

  // Export
  { id: 'export_step', name: 'Export STEP AP214 / AP242', category: 'Export', shortcut: 'Ctrl+E', icon: Box, description: 'Export exact B-Rep geometry for CNC and CAM machining' },
  { id: 'export_stl', name: 'Export STL (3D Printing)', category: 'Export', shortcut: 'Shift+E', icon: Box, description: 'Export high-res triangulated mesh for 3D printers' },

  // AI
  { id: 'open_vira', name: 'Ask VIRA AI (Search Grounded)', category: 'AI', shortcut: 'V', icon: Bot, description: 'Ask mechanical AI copilot for standards, DFM fixes, and specs' },
];

export const CADCommandSearchModal: React.FC<CADCommandSearchModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = ALL_COMMANDS.filter((cmd) => {
    const q = search.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onExecuteCommand(filtered[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-[12vh] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-[#CBD5E1] rounded-xl shadow-2xl overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#E2E8F0] flex items-center gap-3 bg-[#F8FAFC]">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a CAD command (e.g. fillet, hole, extrude, measure, fea, vira)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-medium"
          />
          <kbd className="bg-white border border-[#CBD5E1] text-[#64748B] text-[10px] font-mono px-1.5 py-0.5 rounded shadow-2xs">
            ESC to exit
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[#64748B]">
              <p className="font-medium text-xs">No CAD commands found for "{search}"</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Try searching "extrude", "fillet", "hole", or "fea"</p>
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onExecuteCommand(cmd.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-900 font-medium' : 'hover:bg-[#F8FAFC] text-[#334155]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#0F172A]">{cmd.name}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-100 text-[#64748B] px-1 py-0.2 rounded">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">{cmd.description}</div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="font-mono text-[10px] bg-white border border-[#CBD5E1] text-[#64748B] px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-mono text-[#64748B] flex items-center justify-between px-3">
          <span>↑↓ to navigate • ↵ to select</span>
          <span>CADVANTA Command Palette</span>
        </div>
      </div>
    </div>
  );
};
