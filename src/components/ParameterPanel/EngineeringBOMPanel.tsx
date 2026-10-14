import React, { useState } from 'react';
import {
  Table,
  Sliders,
  Layers,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Cpu,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Maximize2,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { CADPart } from '../../types/cad';

interface BOMItem {
  itemNumber: number;
  partNumber: string;
  description: string;
  quantity: number;
  material: string;
  unitMassKg: number;
  totalMassKg: number;
  process: string;
  tolerance: string;
}

interface EngineeringBOMPanelProps {
  activePart: CADPart;
  explodedProgress: number;
  onExplodedChange: (value: number) => void;
  selectedComponent: string | null;
  onSelectComponent: (componentId: string) => void;
  onClose?: () => void;
}

export const EngineeringBOMPanel: React.FC<EngineeringBOMPanelProps> = ({
  activePart,
  explodedProgress,
  onExplodedChange,
  selectedComponent,
  onSelectComponent,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bom' | 'parameters' | 'exploded'>('bom');
  const [isExplodedPlaying, setIsExplodedPlaying] = useState(false);

  // Industry-Standard Bill of Materials for 3-Stage Planetary Gearbox
  const bomData: BOMItem[] = [
    {
      itemNumber: 1,
      partNumber: 'PG-HSG-01',
      description: 'Split Aluminum Housing (Front Half)',
      quantity: 1,
      material: 'Alu 6061-T6',
      unitMassKg: 3.1,
      totalMassKg: 3.1,
      process: '5-Axis CNC Milling',
      tolerance: 'ISO 2768-mK / H7',
    },
    {
      itemNumber: 2,
      partNumber: 'PG-HSG-02',
      description: 'Split Aluminum Housing (Rear Flange)',
      quantity: 1,
      material: 'Alu 6061-T6',
      unitMassKg: 2.85,
      totalMassKg: 2.85,
      process: '5-Axis CNC Milling',
      tolerance: 'ISO 2768-mK / H7',
    },
    {
      itemNumber: 3,
      partNumber: 'PG-RING-01',
      description: 'Internal Ring Gear (Z=90, Mod 2.5)',
      quantity: 1,
      material: 'AISI 4140 (42CrMo4)',
      unitMassKg: 4.8,
      totalMassKg: 4.8,
      process: 'Gear Shaping & Nitriding',
      tolerance: 'DIN 3962 Gr 6',
    },
    {
      itemNumber: 4,
      partNumber: 'PG-SUN-01',
      description: 'Stage 1 Sun Gear (Z=30, Mod 2.5)',
      quantity: 1,
      material: 'AISI 4140 Nitrided',
      unitMassKg: 0.65,
      totalMassKg: 0.65,
      process: 'Hobbing & Tooth Grinding',
      tolerance: 'DIN 3962 Gr 5 (h7)',
    },
    {
      itemNumber: 5,
      partNumber: 'PG-PLN-01',
      description: 'Stage 1 Planet Gears (Z=30, Mod 2.5)',
      quantity: 3,
      material: 'AISI 4140 Hardened',
      unitMassKg: 0.4,
      totalMassKg: 1.2,
      process: 'Hobbing & Finish Honing',
      tolerance: 'Clearance 0.08 mm',
    },
    {
      itemNumber: 6,
      partNumber: 'PG-CAR-01',
      description: 'Planet Carrier 1 (Dual Cage)',
      quantity: 1,
      material: '42CrMo4 Forged',
      unitMassKg: 0.75,
      totalMassKg: 0.75,
      process: 'Turn-Mill Center',
      tolerance: 'True Position 0.015',
    },
    {
      itemNumber: 7,
      partNumber: 'PG-SUN-02',
      description: 'Stage 2 Sun Gear (Z=30, Mod 2.5)',
      quantity: 1,
      material: 'AISI 4140 Nitrided',
      unitMassKg: 0.7,
      totalMassKg: 0.7,
      process: 'Hobbing & Tooth Grinding',
      tolerance: 'DIN 3962 Gr 5 (h7)',
    },
    {
      itemNumber: 8,
      partNumber: 'PG-PLN-02',
      description: 'Stage 2 Planet Gears (Z=30, Mod 2.5)',
      quantity: 3,
      material: 'AISI 4140 Hardened',
      unitMassKg: 0.43,
      totalMassKg: 1.3,
      process: 'Hobbing & Finish Honing',
      tolerance: 'Clearance 0.08 mm',
    },
    {
      itemNumber: 9,
      partNumber: 'PG-CAR-02',
      description: 'Planet Carrier 2 (Dual Cage)',
      quantity: 1,
      material: '42CrMo4 Forged',
      unitMassKg: 0.8,
      totalMassKg: 0.8,
      process: 'Turn-Mill Center',
      tolerance: 'True Position 0.015',
    },
    {
      itemNumber: 10,
      partNumber: 'PG-SUN-03',
      description: 'Stage 3 Sun Gear (Z=30, Mod 2.5)',
      quantity: 1,
      material: 'AISI 4140 Nitrided',
      unitMassKg: 0.75,
      totalMassKg: 0.75,
      process: 'Hobbing & Tooth Grinding',
      tolerance: 'DIN 3962 Gr 5 (h7)',
    },
    {
      itemNumber: 11,
      partNumber: 'PG-PLN-03',
      description: 'Stage 3 Planet Gears (Z=30, Mod 2.5)',
      quantity: 3,
      material: 'AISI 4140 Hardened',
      unitMassKg: 0.45,
      totalMassKg: 1.35,
      process: 'Hobbing & Finish Honing',
      tolerance: 'Clearance 0.08 mm',
    },
    {
      itemNumber: 12,
      partNumber: 'PG-SFT-OUT',
      description: 'Concentric Output Shaft Ø65mm',
      quantity: 1,
      material: 'AISI 4140 Hardened',
      unitMassKg: 2.2,
      totalMassKg: 2.2,
      process: 'CNC Turning & Spline Mill',
      tolerance: 'ISO h7 Spline W65',
    },
    {
      itemNumber: 13,
      partNumber: 'SKF-6208',
      description: 'SKF 6208 Deep Groove Ball Bearings',
      quantity: 4,
      material: '100Cr6 Bearing Steel',
      unitMassKg: 0.37,
      totalMassKg: 1.48,
      process: 'SKF Precision Standard',
      tolerance: 'ISO Normal (H7/h6)',
    },
    {
      itemNumber: 14,
      partNumber: 'SKF-6310',
      description: 'SKF 6310 Output Heavy Duty Bearing',
      quantity: 1,
      material: '100Cr6 Bearing Steel',
      unitMassKg: 1.08,
      totalMassKg: 1.08,
      process: 'SKF Heavy Load',
      tolerance: 'ISO Normal (H7/h6)',
    },
    {
      itemNumber: 15,
      partNumber: 'DIN-471-CIR',
      description: 'DIN 471 External Retaining Circlips',
      quantity: 6,
      material: 'Spring Steel C67S',
      unitMassKg: 0.02,
      totalMassKg: 0.12,
      process: 'Stamped & Tempered',
      tolerance: 'DIN 471 Form A',
    },
    {
      itemNumber: 16,
      partNumber: 'SEAL-NBR-45',
      description: 'Rotary Oil Shaft Seals 45x65x8mm',
      quantity: 2,
      material: 'NBR 70 Shore A',
      unitMassKg: 0.05,
      totalMassKg: 0.1,
      process: 'Molded Elastomer',
      tolerance: 'DIN 3760 Type AS',
    },
    {
      itemNumber: 17,
      partNumber: 'ISO-4762-M8',
      description: 'Hex Socket Head Cap Screws M8x35 10.9',
      quantity: 12,
      material: 'Alloy Steel 10.9 Black',
      unitMassKg: 0.025,
      totalMassKg: 0.3,
      process: 'Cold Heading & Rolled',
      tolerance: 'ISO 965-2 6g',
    },
  ];

  return (
    <div
      id="cadvanta-engineering-bom-panel"
      className="flex flex-col h-full bg-white text-[#0F172A] select-none text-xs border-l border-[#E2E8F0] shadow-xs"
    >
      {/* 1. Panel Header Tabs */}
      <div className="flex items-center px-3 pt-2 border-b border-[#E2E8F0] bg-[#F8FAFC] gap-1 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('bom')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'bom'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>BOM Table</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'parameters'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab('exploded')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'exploded'
              ? 'bg-white text-[#0284C7] border-t-2 border-[#0284C7] font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Exploded Config</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            title="Minimize BOM Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB: BOM TABLE */}
        {activeTab === 'bom' && (
          <div className="space-y-3">
            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
              <div>
                <span className="text-[10px] text-[#64748B] block font-sans">Total Mass</span>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  18.40 kg
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-sans">Line Items</span>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  {bomData.length} Items
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-sans">Total Parts</span>
                <span className="text-sm font-bold font-mono text-[#0284C7]">
                  {bomData.reduce((s, i) => s + i.quantity, 0)} Units
                </span>
              </div>
            </div>

            {/* Structured Table */}
            <div className="border border-[#CBD5E1] rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569]">
                      <th className="py-2 px-2.5 font-bold w-7 text-center">#</th>
                      <th className="py-2 px-2 font-bold">Part No.</th>
                      <th className="py-2 px-2 font-bold">Description</th>
                      <th className="py-2 px-1.5 font-bold text-center">Qty</th>
                      <th className="py-2 px-2 font-bold">Material</th>
                      <th className="py-2 px-2 font-bold text-right">Mass (kg)</th>
                      <th className="py-2 px-2 font-bold">Tolerance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {bomData.map((item) => (
                      <tr
                        key={item.itemNumber}
                        onClick={() => onSelectComponent(item.partNumber)}
                        className={`hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                          selectedComponent === item.partNumber
                            ? 'bg-[#0284C7]/10 font-semibold text-[#0284C7]'
                            : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 text-center text-[#64748B]">
                          {item.itemNumber}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-[#0F172A]">{item.partNumber}</td>
                        <td className="py-1.5 px-2 font-sans text-[#334155]">{item.description}</td>
                        <td className="py-1.5 px-1.5 text-center font-bold text-[#0F172A]">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-[#475569] truncate max-w-[100px]">
                          {item.material}
                        </td>
                        <td className="py-1.5 px-2 text-right font-bold text-[#0F172A]">
                          {item.totalMassKg.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-[10px] text-amber-700 font-semibold">
                          {item.tolerance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
              <span>* Compliant with ISO 10209 & ASME Y14.34</span>
              <button className="flex items-center gap-1 text-[#0284C7] font-semibold hover:underline cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                Export CSV / Excel
              </button>
            </div>
          </div>
        )}

        {/* TAB: ENGINEERING PARAMETERS */}
        {activeTab === 'parameters' && (
          <div className="space-y-4">
            {/* Gearbox Kinematics Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#0284C7]" />
                  Epicyclic Kinematics & Gear Specs
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-[#0284C7] font-bold">
                  Ratio: 64:1 Total
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Gear Module (m)</span>
                  <span className="font-bold text-sm text-[#0F172A]">2.5 mm</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Pressure Angle (α)</span>
                  <span className="font-bold text-sm text-[#0F172A]">20.0° Involute</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Sun Gear Teeth (Zs)</span>
                  <span className="font-bold text-sm text-[#0F172A]">30 Teeth (PCD 75mm)</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Ring Gear Teeth (Zr)</span>
                  <span className="font-bold text-sm text-[#0F172A]">90 Teeth (PCD 225mm)</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Planets / Stage</span>
                  <span className="font-bold text-sm text-[#0F172A]">3 @ 120° Spacing</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Single Stage Ratio</span>
                  <span className="font-bold text-sm text-[#0F172A]">1 + (90/30) = 4.0:1</span>
                </div>
              </div>
            </div>

            {/* Fits, Clearances & Manufacturing Tolerances Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                  Manufacturing Tolerances & Fit Standards
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  ISO 286-1
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#CBD5E1]">
                  <span className="text-[#64748B]">Shaft / Bore Fit Class:</span>
                  <span className="font-mono font-bold text-[#059669]">h7 / H7 Precision Fit</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#CBD5E1]">
                  <span className="text-[#64748B]">Radial Tooth Clearance (Backlash):</span>
                  <span className="font-mono font-bold text-[#059669]">0.08 mm (0.0031 in)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#CBD5E1]">
                  <span className="text-[#64748B]">Bearing Seat Bore Tolerance:</span>
                  <span className="font-mono font-bold text-[#0F172A]">Ø80 H7 (+0.030 / 0.000)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[#CBD5E1]">
                  <span className="text-[#64748B]">Input Shaft Journal:</span>
                  <span className="font-mono font-bold text-[#0F172A]">Ø32 h7 (0.000 / -0.025)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748B]">Gear Tooth Flank Roughness:</span>
                  <span className="font-mono font-bold text-[#0F172A]">Ra ≤ 0.8 µm Ground</span>
                </div>
              </div>
            </div>

            {/* Materials Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
              <span className="font-bold text-xs text-[#0F172A] block">
                Engineering Materials & Structural Mass
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Housing Material</span>
                  <span className="font-bold text-[#0F172A]">Alu 6061-T6 Anodized</span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Density: 2.70 g/cm³</span>
                </div>
                <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Gear & Shaft Steel</span>
                  <span className="font-bold text-[#0F172A]">AISI 4140 Quenched</span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Yield: 655 MPa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EXPLODED VIEW CONFIG */}
        {activeTab === 'exploded' && (
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0284C7]" />
                  Axial Disassembly & Exploded Separation
                </span>
                <span className="font-mono text-xs font-bold text-[#0284C7]">
                  {Math.round(explodedProgress * 100)}%
                </span>
              </div>

              {/* Exploded Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedProgress}
                  onChange={(e) => onExplodedChange(parseFloat(e.target.value))}
                  className="w-full accent-[#0284C7] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
                  <span>0% (Assembled)</span>
                  <span>50%</span>
                  <span>100% (Full Expansion)</span>
                </div>
              </div>

              {/* Exploded Step Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-[#334155]">
                  Disassembly Steps Sequence (Z-Axis Axial):
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>1. Split Aluminum Housing Halves</span>
                    <span className="text-[#0284C7] font-bold">±120 mm</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>2. Input Shaft & SKF 6208 Bearings</span>
                    <span className="text-[#0284C7] font-bold">-90 mm</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>3. Stage 1, 2, 3 Sun Gears & Carriers</span>
                    <span className="text-[#0284C7] font-bold">Cascaded</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>4. Planet Clusters (Radial Expansion)</span>
                    <span className="text-[#0284C7] font-bold">R + 25 mm</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-[#E2E8F0]">
                    <span>5. Concentric Output Shaft & SKF 6310</span>
                    <span className="text-[#0284C7] font-bold">+110 mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel Footer Status */}
      <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-mono text-[#64748B] flex items-center justify-between shrink-0">
        <span>ISO 13348 Gearbox Std</span>
        <span className="text-[#0284C7] font-bold">Total Mass: 18.40 kg</span>
      </div>
    </div>
  );
};
