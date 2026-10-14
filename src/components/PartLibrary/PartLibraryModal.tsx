import React, { useState } from 'react';
import { CADPart, PartType } from '../../types/cad';
import {
  Box,
  CircleDot,
  Layers,
  Search,
  Plus,
  X,
  Check,
  Cpu,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { createPresetPart } from '../../engine/cadParser';

export interface StandardComponent {
  id: string;
  name: string;
  category: 'Bearings' | 'Fasteners' | 'Gears' | 'Motors' | 'Power Transmission';
  standard: string;
  partType: PartType;
  sizes: {
    label: string;
    description: string;
    parameters: Record<string, any>;
  }[];
}

const STANDARD_LIBRARY: StandardComponent[] = [
  {
    id: 'bearing_deep_groove',
    name: 'Deep Groove Ball Bearing',
    category: 'Bearings',
    standard: 'ISO 15 / DIN 625',
    partType: 'cylinder',
    sizes: [
      { label: '608 (Ø8 × Ø22 × 7mm)', description: 'Skate & 3D Printer standard', parameters: { diameter: 22, height: 7, bore_diameter: 8 } },
      { label: '6200 (Ø10 × Ø30 × 9mm)', description: 'Small electric motor bearing', parameters: { diameter: 30, height: 9, bore_diameter: 10 } },
      { label: '6204 (Ø20 × Ø47 × 14mm)', description: 'General industrial transmission', parameters: { diameter: 47, height: 14, bore_diameter: 20 } },
      { label: '6305 (Ø25 × Ø62 × 17mm)', description: 'Heavy machine spindle bearing', parameters: { diameter: 62, height: 17, bore_diameter: 25 } },
    ],
  },
  {
    id: 'hex_bolt_iso4014',
    name: 'Hexagon Head Bolt',
    category: 'Fasteners',
    standard: 'ISO 4014 / DIN 931',
    partType: 'shaft',
    sizes: [
      { label: 'M6 × 30 mm', description: 'Class 8.8 medium tensile bolt', parameters: { length: 30, diameter: 6, step_length: 6, step_diameter: 10 } },
      { label: 'M8 × 45 mm', description: 'Class 8.8 structural bolt', parameters: { length: 45, diameter: 8, step_length: 8, step_diameter: 13 } },
      { label: 'M10 × 60 mm', description: 'Class 10.9 high tensile bolt', parameters: { length: 60, diameter: 10, step_length: 10, step_diameter: 16 } },
      { label: 'M12 × 80 mm', description: 'Heavy flange clamping bolt', parameters: { length: 80, diameter: 12, step_length: 12, step_diameter: 18 } },
    ],
  },
  {
    id: 'spur_gear_iso53',
    name: 'Involute Spur Gear',
    category: 'Gears',
    standard: 'ISO 53 / AGMA 2001',
    partType: 'gear',
    sizes: [
      { label: 'Module 1.5, Z=24 (Ø36mm)', description: 'Precision instrument reduction', parameters: { num_teeth: 24, module: 1.5, face_width: 15, bore_diameter: 12 } },
      { label: 'Module 2.0, Z=30 (Ø60mm)', description: 'Medium torque drive gear', parameters: { num_teeth: 30, module: 2.0, face_width: 20, bore_diameter: 20 } },
      { label: 'Module 2.5, Z=40 (Ø100mm)', description: 'Heavy machine feed drive', parameters: { num_teeth: 40, module: 2.5, face_width: 25, bore_diameter: 25 } },
    ],
  },
  {
    id: 'stepper_motor_nema',
    name: 'Hybrid Stepper Motor',
    category: 'Motors',
    standard: 'NEMA ICS 16-2001',
    partType: 'cylinder',
    sizes: [
      { label: 'NEMA 17 (42 × 42 × 40mm)', description: '1.8° Step Angle, 0.44 Nm Torque', parameters: { diameter: 42, height: 40, bore_diameter: 5 } },
      { label: 'NEMA 23 (57 × 57 × 56mm)', description: 'CNC Mill & Router Axis Drive', parameters: { diameter: 57, height: 56, bore_diameter: 8 } },
      { label: 'NEMA 34 (86 × 86 × 80mm)', description: 'Heavy industrial actuator', parameters: { diameter: 86, height: 80, bore_diameter: 14 } },
    ],
  },
  {
    id: 'stepped_transmission_shaft',
    name: 'Precision Stepped Shaft',
    category: 'Power Transmission',
    standard: 'DIN 748',
    partType: 'shaft',
    sizes: [
      { label: 'Ø25 × 180 mm Standard', description: 'Dual bearing journals with keyway', parameters: { length: 180, diameter: 25, step_length: 40, step_diameter: 35 } },
      { label: 'Ø35 × 250 mm Heavy Duty', description: 'Gearbox output pinion shaft', parameters: { length: 250, diameter: 35, step_length: 60, step_diameter: 48 } },
    ],
  },
];

interface PartLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPart: (part: CADPart) => void;
}

export const PartLibraryModal: React.FC<PartLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertPart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedComp, setSelectedComp] = useState<StandardComponent>(STANDARD_LIBRARY[0]);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);

  if (!isOpen) return null;

  const categories = ['All', 'Bearings', 'Fasteners', 'Gears', 'Motors', 'Power Transmission'];

  const filteredComponents = STANDARD_LIBRARY.filter((comp) => {
    const matchesCat = selectedCategory === 'All' || comp.category === selectedCategory;
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.standard.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInsert = () => {
    const size = selectedComp.sizes[selectedSizeIndex] || selectedComp.sizes[0];
    const basePart = createPresetPart(selectedComp.partType);
    const newPart: CADPart = {
      ...basePart,
      id: `part_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${selectedComp.name} - ${size.label}`,
      part_type: selectedComp.partType,
      parameters: {
        ...basePart.parameters,
        ...size.parameters,
      },
    };
    onInsertPart(newPart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#07130F] border border-[#00F5A0]/40 rounded-xl max-w-4xl w-full h-[600px] flex flex-col shadow-2xl overflow-hidden font-mono text-[#F0FDF4]">
        {/* Header */}
        <div className="p-4 bg-[#0B1E17] border-b border-[rgba(16,185,129,0.2)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Box className="w-5 h-5 text-[#00F5A0]" />
            <div>
              <h2 className="text-sm font-bold text-[#F0FDF4] uppercase tracking-wider">
                Standard Mechanical Parts Library
              </h2>
              <p className="text-[10px] text-[#8CA89E]">
                ISO / DIN / ANSI standard parametric engineering components
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8CA89E] hover:text-[#F0FDF4] rounded-lg hover:bg-[#102B21] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Categories & Search */}
          <div className="w-64 border-r border-[rgba(16,185,129,0.15)] bg-[#050C0A] p-3 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ISO, DIN, Bolts..."
                className="w-full bg-[#07130F] border border-[rgba(16,185,129,0.2)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F0FDF4] placeholder-[#8CA89E]/50 focus:outline-hidden focus:border-[#00F5A0]"
              />
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8CA89E] font-bold uppercase tracking-wider px-2">
                Categories
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#00F5A0] text-[#02140D] font-bold'
                      : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Middle Column: Component Grid */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredComponents.map((comp) => {
                const isSelected = selectedComp.id === comp.id;
                return (
                  <div
                    key={comp.id}
                    onClick={() => {
                      setSelectedComp(comp);
                      setSelectedSizeIndex(0);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B1E17] border-[#00F5A0] shadow-md'
                        : 'bg-[#07130F] border-[rgba(16,185,129,0.15)] hover:border-[#00F5A0]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#00F5A0] font-bold uppercase">
                        {comp.category}
                      </span>
                      <span className="text-[9px] text-[#8CA89E] bg-[#050C0A] px-1.5 py-0.5 rounded border border-[rgba(16,185,129,0.1)]">
                        {comp.standard}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#F0FDF4] mb-1">
                      {comp.name}
                    </div>
                    <div className="text-[10px] text-[#8CA89E]">
                      {comp.sizes.length} standard sizes available
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Parametric Size Inspector */}
          <div className="w-80 border-l border-[rgba(16,185,129,0.15)] bg-[#050C0A] p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-[#00F5A0] font-bold uppercase tracking-wider block">
                  Select Size & Parameters
                </span>
                <h3 className="text-sm font-bold text-[#F0FDF4] mt-0.5">
                  {selectedComp.name}
                </h3>
                <span className="text-[10px] text-[#8CA89E]">
                  Standard: {selectedComp.standard}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-[#8CA89E] block uppercase font-bold">
                  Standard Dimension:
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin">
                  {selectedComp.sizes.map((size, idx) => {
                    const isSizeSelected = selectedSizeIndex === idx;
                    return (
                      <div
                        key={size.label}
                        onClick={() => setSelectedSizeIndex(idx)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSizeSelected
                            ? 'bg-[#102B21] border-[#00F5A0] text-[#F0FDF4]'
                            : 'bg-[#07130F] border-[rgba(16,185,129,0.15)] text-[#8CA89E] hover:text-[#F0FDF4]'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-[#00F5A0]">
                          {size.label}
                        </div>
                        <div className="text-[10px] text-[#8CA89E] mt-0.5">
                          {size.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Insert Button */}
            <button
              onClick={handleInsert}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00F5A0] hover:bg-[#00D68B] text-[#02140D] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Insert into Model</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
