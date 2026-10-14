import React, { useState, useMemo } from 'react';
import { CADPart, MaterialInfo, AssemblyComponent } from '../../types/cad';
import { MATERIALS, getMaterialById, calculateMass, calculatePartVolumeCm3 } from '../../engine/materials';
import {
  generateCostEstimatorPDF,
  generateEngineeringSummaryReportPDF,
} from '../../engine/pdfReportGenerator';
import {
  isImperial,
  formatMass,
  formatVolume,
  formatDensity,
  formatRatePerWeight,
  KG_TO_LB,
  CM3_TO_IN3,
} from '../../utils/unitConversion';
import {
  X,
  DollarSign,
  Calculator,
  Scale,
  Ruler,
  Layers,
  Check,
  Cpu,
  TrendingUp,
  Download,
  Copy,
  Info,
  Sliders,
  Sparkles,
  FileText,
} from 'lucide-react';

interface MaterialCostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePart: CADPart;
  onUpdatePartMaterial: (material: MaterialInfo) => void;
  onUnitChange?: (unit: 'mm' | 'inch') => void;
  assemblyComponents?: AssemblyComponent[];
  onUpdateAssemblyComponentMaterial?: (componentId: string, materialId: string) => void;
}

type Currency = 'INR' | 'USD' | 'EUR';

const CURRENCY_RATES: Record<Currency, { symbol: string; rateFromInr: number }> = {
  INR: { symbol: '₹', rateFromInr: 1 },
  USD: { symbol: '$', rateFromInr: 1 / 86.5 },
  EUR: { symbol: '€', rateFromInr: 1 / 93.2 },
};

export const MaterialCostEstimatorModal: React.FC<MaterialCostEstimatorModalProps> = ({
  isOpen,
  onClose,
  activePart,
  onUpdatePartMaterial,
  onUnitChange,
  assemblyComponents = [],
  onUpdateAssemblyComponentMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<'part' | 'assembly'>('part');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customPriceMultiplier, setCustomPriceMultiplier] = useState<number>(1.0); // Machining/waste multiplier
  const [notification, setNotification] = useState<string | null>(null);

  const isImperialUnit = isImperial(activePart.units);

  // Local state for assembly component material overrides if parent doesn't provide it
  const [localCompMaterials, setLocalCompMaterials] = useState<Record<string, string>>({});

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Single Part Calculations
  const partVolumeCm3 = useMemo(() => {
    return calculatePartVolumeCm3(activePart.part_type, activePart.parameters);
  }, [activePart.part_type, activePart.parameters]);

  const partMassInfo = useMemo(() => {
    return calculateMass(partVolumeCm3, activePart.material);
  }, [partVolumeCm3, activePart.material]);

  const partCostRawInr = partMassInfo.estCostInr;
  const partCostTotalInr = partCostRawInr * customPriceMultiplier;

  // Format currency helper
  const formatCost = (inrValue: number): string => {
    const { symbol, rateFromInr } = CURRENCY_RATES[currency];
    const converted = inrValue * rateFromInr;
    if (currency === 'INR') {
      return `${symbol} ${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const rateInfo = formatRatePerWeight(
    activePart.material.costPerKgInr || 95,
    formatCost,
    activePart.units
  );

  // 2. Full Assembly Calculations
  // If assemblyComponents is empty, create default components based on the project
  const effectiveComponents: AssemblyComponent[] = useMemo(() => {
    if (assemblyComponents && assemblyComponents.length > 0) {
      return assemblyComponents;
    }
    // Default fallback assembly if none active
    return [
      {
        id: 'comp-1',
        name: activePart.name || 'Primary Drive Shaft',
        partType: activePart.part_type,
        instanceName: 'Component-1',
        materialId: activePart.material.id,
        parameters: activePart.parameters,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        visible: true,
      },
      {
        id: 'comp-2',
        name: 'High-Torque Pinion Gear',
        partType: 'gear',
        instanceName: 'Component-2',
        materialId: 'en19_steel',
        parameters: { pitch_diameter: 95, face_width: 25, teeth_count: 24 },
        position: [40, 0, 0],
        rotation: [0, 0, 0],
        visible: true,
      },
      {
        id: 'comp-3',
        name: 'Deep Groove Radial Bearing 6208',
        partType: 'bearing',
        instanceName: 'Component-3',
        materialId: 'en8_steel',
        parameters: { outer_diameter: 80, inner_diameter: 40, width: 18 },
        position: [-60, 0, 0],
        rotation: [0, 0, 0],
        visible: true,
      },
      {
        id: 'comp-4',
        name: 'Cast Iron Bearing Flange Housing',
        partType: 'bearing_housing',
        instanceName: 'Component-4',
        materialId: 'cast_iron_250',
        parameters: { outer_diameter: 130, thickness: 35 },
        position: [-60, 0, 0],
        rotation: [0, 0, 0],
        visible: true,
      },
      {
        id: 'comp-5',
        name: 'Rigid Flange Output Coupling',
        partType: 'flange_coupling',
        instanceName: 'Component-5',
        materialId: 'alu_6061_t6',
        parameters: { outer_diameter: 120, thickness: 20 },
        position: [110, 0, 0],
        rotation: [0, 0, 0],
        visible: true,
      },
    ];
  }, [assemblyComponents, activePart]);

  // Assembly itemized calculation
  const assemblyAnalysis = useMemo(() => {
    let totalVolumeCm3 = 0;
    let totalMassKg = 0;
    let totalMaterialCostInr = 0;

    const items = effectiveComponents.map((comp) => {
      const matId = localCompMaterials[comp.id] || comp.materialId || 'steel_1018';
      const mat = getMaterialById(matId);
      const volCm3 = calculatePartVolumeCm3(comp.partType, comp.parameters || {});
      const mass = calculateMass(volCm3, mat);
      const unitCostInr = mass.estCostInr;

      totalVolumeCm3 += volCm3;
      totalMassKg += mass.massKg;
      totalMaterialCostInr += unitCostInr;

      return {
        comp,
        material: mat,
        volumeCm3: volCm3,
        massKg: mass.massKg,
        massGrams: mass.massGrams,
        costInr: unitCostInr,
      };
    });

    const totalCostWithMultiplier = totalMaterialCostInr * customPriceMultiplier;

    return {
      items,
      totalVolumeCm3: Math.round(totalVolumeCm3 * 10) / 10,
      totalMassKg: Math.round(totalMassKg * 100) / 100,
      totalMaterialCostInr: Math.round(totalMaterialCostInr * 10) / 10,
      totalCostWithMultiplier: Math.round(totalCostWithMultiplier * 10) / 10,
    };
  }, [effectiveComponents, localCompMaterials, customPriceMultiplier]);

  const handleSetCompMaterial = (compId: string, matId: string) => {
    setLocalCompMaterials((prev) => ({ ...prev, [compId]: matId }));
    if (onUpdateAssemblyComponentMaterial) {
      onUpdateAssemblyComponentMaterial(compId, matId);
    }
  };

  const handleBatchSetMaterial = (matId: string) => {
    const updated: Record<string, string> = {};
    effectiveComponents.forEach((c) => {
      updated[c.id] = matId;
      if (onUpdateAssemblyComponentMaterial) {
        onUpdateAssemblyComponentMaterial(c.id, matId);
      }
    });
    setLocalCompMaterials(updated);
    const m = getMaterialById(matId);
    showNotification(`Assigned ${m.name} to all ${effectiveComponents.length} assembly parts`);
  };

  const handleCopyBOM = () => {
    const volHeader = isImperialUnit ? 'Volume (in³)' : 'Volume (cm³)';
    const massHeader = isImperialUnit ? 'Mass (lb)' : 'Mass (kg)';
    const rateHeader = isImperialUnit ? 'Price/lb (INR)' : 'Price/kg (INR)';
    let csv = `Item #,Part Name,Part Type,Material,Density,${volHeader},${massHeader},${rateHeader},Cost (INR)\n`;
    assemblyAnalysis.items.forEach((item, idx) => {
      const volDisp = isImperialUnit ? (item.volumeCm3 * CM3_TO_IN3).toFixed(2) : item.volumeCm3.toFixed(2);
      const massDisp = isImperialUnit ? (item.massKg * KG_TO_LB).toFixed(3) : item.massKg.toFixed(3);
      const rateDisp = isImperialUnit ? ((item.material.costPerKgInr || 95) / KG_TO_LB).toFixed(2) : (item.material.costPerKgInr || 95);
      const densityDisp = isImperialUnit ? (item.material.density * 0.036127).toFixed(4) + ' lb/in³' : item.material.density + ' g/cm³';
      csv += `${idx + 1},"${item.comp.name}",${item.comp.partType},"${item.material.name}","${densityDisp}",${volDisp},${massDisp},${rateDisp},${item.costInr.toFixed(2)}\n`;
    });
    const totVol = isImperialUnit ? (assemblyAnalysis.totalVolumeCm3 * CM3_TO_IN3).toFixed(2) + ' in³' : assemblyAnalysis.totalVolumeCm3 + ' cm³';
    const totMass = isImperialUnit ? (assemblyAnalysis.totalMassKg * KG_TO_LB).toFixed(2) + ' lb' : assemblyAnalysis.totalMassKg + ' kg';
    csv += `\nTOTAL ASSEMBLY,,,,"${totVol}","${totMass}",,"INR ${assemblyAnalysis.totalMaterialCostInr}"\n`;

    navigator.clipboard.writeText(csv).then(() => {
      showNotification(`BOM Cost Table (${isImperialUnit ? 'Imperial' : 'Metric'}) copied to clipboard`);
    });
  };

  const handleDownloadBOM = () => {
    const volHeader = isImperialUnit ? 'Volume (in³)' : 'Volume (cm³)';
    const massHeader = isImperialUnit ? 'Mass (lb)' : 'Mass (kg)';
    const rateHeader = isImperialUnit ? 'Price/lb (INR)' : 'Price/kg (INR)';
    let csv = `Item #,Part Name,Part Type,Material,Density,${volHeader},${massHeader},${rateHeader},Cost (INR)\n`;
    assemblyAnalysis.items.forEach((item, idx) => {
      const volDisp = isImperialUnit ? (item.volumeCm3 * CM3_TO_IN3).toFixed(2) : item.volumeCm3.toFixed(2);
      const massDisp = isImperialUnit ? (item.massKg * KG_TO_LB).toFixed(3) : item.massKg.toFixed(3);
      const rateDisp = isImperialUnit ? ((item.material.costPerKgInr || 95) / KG_TO_LB).toFixed(2) : (item.material.costPerKgInr || 95);
      const densityDisp = isImperialUnit ? (item.material.density * 0.036127).toFixed(4) + ' lb/in³' : item.material.density + ' g/cm³';
      csv += `${idx + 1},"${item.comp.name}",${item.comp.partType},"${item.material.name}","${densityDisp}",${volDisp},${massDisp},${rateDisp},${item.costInr.toFixed(2)}\n`;
    });
    const totVol = isImperialUnit ? (assemblyAnalysis.totalVolumeCm3 * CM3_TO_IN3).toFixed(2) + ' in³' : assemblyAnalysis.totalVolumeCm3 + ' cm³';
    const totMass = isImperialUnit ? (assemblyAnalysis.totalMassKg * KG_TO_LB).toFixed(2) + ' lb' : assemblyAnalysis.totalMassKg + ' kg';
    csv += `\nTOTAL ASSEMBLY,,,,"${totVol}","${totMass}",,"INR ${assemblyAnalysis.totalMaterialCostInr}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activePart.name.replace(/\s+/g, '_')}_Material_BOM_${isImperialUnit ? 'Imperial' : 'Metric'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Downloaded Material Cost BOM (${isImperialUnit ? 'Imperial in/lb' : 'Metric mm/kg'})`);
  };

  const handleGeneratePDF = () => {
    generateCostEstimatorPDF(activePart, {
      currency,
      multiplier: customPriceMultiplier,
      components: effectiveComponents,
      activeTab,
    });
    showNotification('Generated formal Material Cost PDF Summary Report!');
  };

  const handleGenerateFullSummaryPDF = () => {
    generateEngineeringSummaryReportPDF(activePart, {
      currency,
      multiplier: customPriceMultiplier,
      downloadImmediately: true,
    });
    showNotification('Generated formal 3-Page Engineering Summary Report (Costs, FEA & DFM)!');
  };

  if (!isOpen) return null;

  // Filtered materials
  const filteredMaterials = MATERIALS.filter((m) => {
    if (categoryFilter === 'all') return true;
    return m.category?.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-material-cost-estimator"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[rgba(16,185,129,0.3)] bg-[#030A07] text-[#F0FDF4] shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
      >
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-4 right-16 z-50 px-3.5 py-1.5 rounded-lg bg-[#00F5A0] text-[#02140D] font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F0FDF4] tracking-tight">Material & Cost Estimator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold uppercase">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-[#8CA89E] font-sans mt-0.5">
                Volumetric mass calculation & real-time raw material cost estimation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit System Toggle (Metric vs Imperial) */}
            <div className="flex items-center bg-[#0B1E17] p-1 rounded-lg border border-[rgba(16,185,129,0.2)] text-xs">
              <button
                id="btn-cost-unit-metric"
                type="button"
                onClick={() => onUnitChange && onUnitChange('mm')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                  !isImperialUnit
                    ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
                title="Display in Metric units (mm, cm³, kg, ₹/kg)"
              >
                <Ruler className="w-3 h-3" />
                <span>mm / kg</span>
              </button>
              <button
                id="btn-cost-unit-imperial"
                type="button"
                onClick={() => onUnitChange && onUnitChange('inch')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                  isImperialUnit
                    ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
                title="Display in Imperial units (in, in³, lb, $/lb)"
              >
                <Scale className="w-3 h-3" />
                <span>in / lb</span>
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-[#0B1E17] p-1 rounded-lg border border-[rgba(16,185,129,0.2)] text-xs">
              {(['INR', 'USD', 'EUR'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  id={`btn-currency-${curr.toLowerCase()}`}
                  onClick={() => setCurrency(curr)}
                  className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                    currency === curr
                      ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                      : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                  }`}
                >
                  {curr === 'INR' ? '₹ INR' : curr === 'USD' ? '$ USD' : '€ EUR'}
                </button>
              ))}
            </div>

            {/* Generate PDF Summary Button in Header */}
            <button
              id="btn-generate-pdf-cost-header"
              type="button"
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] active:scale-95 shrink-0"
              title="Download a formal PDF report of material costs and BOM rollup"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Cost Report (PDF)</span>
              <span className="sm:hidden">Cost PDF</span>
            </button>

            <button
              id="btn-generate-full-engineering-summary"
              type="button"
              onClick={handleGenerateFullSummaryPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(0,245,160,0.3)] text-[#00F5A0] font-bold text-xs cursor-pointer transition-all active:scale-95 shrink-0"
              title="Download formal 3-page Engineering Summary Report with FEA, Material Costs & DFM"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Full Dossier (PDF)</span>
              <span className="sm:hidden">Dossier</span>
            </button>

            <button
              id="btn-close-cost-estimator"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#05110C] border-b border-[rgba(16,185,129,0.15)] shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="tab-part-cost"
              onClick={() => setActiveTab('part')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'part'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>Single Part ({activePart.name})</span>
              <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                {formatCost(partCostTotalInr)}
              </span>
            </button>

            <button
              id="tab-assembly-cost"
              onClick={() => setActiveTab('assembly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'assembly'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                  : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Full Assembly Rollup ({effectiveComponents.length} Parts)</span>
              <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                {formatCost(assemblyAnalysis.totalCostWithMultiplier)}
              </span>
            </button>
          </div>

          {/* Machining / Scrap Multiplier Slider */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#8CA89E]">
            <span title="Adjust multiplier for manufacturing scrap, swarf loss, and raw billet sizing">
              Raw Stock Allowance:
            </span>
            <select
              value={customPriceMultiplier}
              onChange={(e) => setCustomPriceMultiplier(Number(e.target.value))}
              className="bg-[#0B1E17] border border-[rgba(16,185,129,0.25)] rounded px-2 py-1 text-xs text-[#00F5A0] font-bold focus:outline-none cursor-pointer"
            >
              <option value={1.0}>1.0x (Net Material Only)</option>
              <option value={1.15}>1.15x (+15% Swarf Allowance)</option>
              <option value={1.3}>1.30x (+30% Standard Billet)</option>
              <option value={1.5}>1.50x (+50% Forging / Heavy Cut)</option>
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'part' ? (
            /* ========================================================= */
            /* SINGLE PART TAB                                          */
            /* ========================================================= */
            <div className="space-y-6">
              {/* Part Running Total Spotlight Card */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-[#071E14] via-[#092419] to-[#071E14] border border-[#00F5A0]/40 shadow-[0_4px_25px_rgba(0,245,160,0.1)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-[#00F5A0] uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Part Material Cost Running Total</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-[#F0FDF4] mt-1 font-mono tracking-tight">
                      {formatCost(partCostTotalInr)}
                    </div>
                    <div className="text-xs text-[#8CA89E] font-sans mt-1">
                      Part: <strong className="text-[#F0FDF4]">{activePart.name}</strong> • Material:{' '}
                      <strong className="text-[#00F5A0]">{activePart.material.name}</strong>
                    </div>
                  </div>

                  {/* Stat Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Part Volume</div>
                      <div className="text-base font-bold text-[#F0FDF4] mt-0.5">
                        {formatVolume(partVolumeCm3, activePart.units)}
                      </div>
                      <div className="text-[9px] text-[#8CA89E]">
                        {isImperialUnit
                          ? `${partVolumeCm3.toFixed(1)} cm³ equiv.`
                          : `${(partVolumeCm3 * 1000).toFixed(0)} mm³`}
                      </div>
                    </div>

                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Calculated Mass</div>
                      <div className="text-base font-bold text-[#00F5A0] mt-0.5">
                        {formatMass(partMassInfo.massKg, activePart.units)}
                      </div>
                      <div className="text-[9px] text-[#8CA89E]">
                        {formatDensity(activePart.material.density, activePart.units)}
                      </div>
                    </div>

                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Unit Rate</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5">
                        {rateInfo.rateStr}
                      </div>
                      <div className="text-[9px] text-[#8CA89E]">{rateInfo.unitLabel} raw alloy</div>
                    </div>
                  </div>
                </div>

                {/* Analytical Formula Card */}
                <div className="mt-4 pt-3 border-t border-[rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between text-xs text-[#8CA89E] font-mono">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>
                      Formula:{' '}
                      <code className="text-[#F0FDF4] bg-black/40 px-1.5 py-0.5 rounded">
                        Volume ({formatVolume(partVolumeCm3, activePart.units)}) × Density ({formatDensity(activePart.material.density, activePart.units)}) = Mass ({formatMass(partMassInfo.massKg, activePart.units)}) @ {rateInfo.rateStr} {rateInfo.unitLabel}
                      </code>
                    </span>
                  </div>
                  {customPriceMultiplier > 1 && (
                    <span className="text-amber-300 text-[11px]">
                      Allowance applied: {customPriceMultiplier}x
                    </span>
                  )}
                </div>
              </div>

              {/* Preset Material Assignment Selector */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#00F5A0]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F0FDF4]">
                      Assign Preset Material to Part
                    </span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 text-xs">
                    {['all', 'ferrous', 'non-ferrous', 'polymer', 'superalloy'].map((cat) => (
                      <button
                        key={cat}
                        id={`btn-filter-mat-${cat}`}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-[#00F5A0] text-[#02140D]'
                            : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredMaterials.map((mat) => {
                    const isSelected = activePart.material.id === mat.id;
                    const calculated = calculateMass(partVolumeCm3, mat);
                    const costInr = calculated.estCostInr * customPriceMultiplier;

                    return (
                      <div
                        key={mat.id}
                        id={`card-material-${mat.id}`}
                        onClick={() => {
                          onUpdatePartMaterial(mat);
                          showNotification(`Assigned ${mat.name} to ${activePart.name}`);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                          isSelected
                            ? 'bg-[#072418] border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)] ring-1 ring-[#00F5A0]'
                            : 'bg-[#071510] hover:bg-[#0B1E17] border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/30"
                                style={{ backgroundColor: mat.color || '#94a3b8' }}
                              />
                              <span className="font-bold text-xs text-[#F0FDF4] truncate">{mat.name}</span>
                            </div>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-[#00F5A0] text-[#02140D] font-bold text-[9px] shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#8CA89E] mt-1 font-mono">
                            {mat.standard} • {mat.category}
                          </div>
                          <p className="text-[11px] text-[#8CA89E] font-sans mt-1.5 line-clamp-2 leading-relaxed">
                            {mat.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[rgba(16,185,129,0.15)] flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-[#8CA89E] block">Est. Part Cost:</span>
                            <span className="font-bold text-[#00F5A0] text-sm">{formatCost(costInr)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#8CA89E] block">Mass:</span>
                            <span className="font-bold text-[#F0FDF4]">
                              {formatMass(calculated.massKg, activePart.units)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* FULL ASSEMBLY ROLLUP TAB                                  */
            /* ========================================================= */
            <div className="space-y-6">
              {/* Assembly Running Total Spotlight Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-[#071E14] via-[#092419] to-[#071E14] border border-[#00F5A0]/40 shadow-[0_4px_25px_rgba(0,245,160,0.1)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-[#00F5A0] uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      <span>Full Assembly Material Running Total</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-[#F0FDF4] mt-1 font-mono tracking-tight">
                      {formatCost(assemblyAnalysis.totalCostWithMultiplier)}
                    </div>
                    <div className="text-xs text-[#8CA89E] font-sans mt-1">
                      Aggregated across all <strong className="text-[#00F5A0]">{effectiveComponents.length}</strong>{' '}
                      kinematic components in the current assembly model.
                    </div>
                  </div>

                  {/* Assembly Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Total Solid Volume</div>
                      <div className="text-base font-bold text-[#F0FDF4] mt-0.5">
                        {formatVolume(assemblyAnalysis.totalVolumeCm3, activePart.units)}
                      </div>
                    </div>

                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Total Net Mass</div>
                      <div className="text-base font-bold text-[#00F5A0] mt-0.5">
                        {formatMass(assemblyAnalysis.totalMassKg, activePart.units)}
                      </div>
                    </div>

                    <div className="p-3 bg-[#030A07]/80 rounded-lg border border-[rgba(16,185,129,0.2)]">
                      <div className="text-[10px] text-[#8CA89E] uppercase">Avg Part Cost</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5">
                        {formatCost(assemblyAnalysis.totalCostWithMultiplier / (effectiveComponents.length || 1))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch Preset Shortcuts & Export Actions */}
                <div className="mt-4 pt-3 border-t border-[rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8CA89E]">Quick Batch Apply:</span>
                    <button
                      type="button"
                      onClick={() => handleBatchSetMaterial('alu_6061_t6')}
                      className="px-2 py-1 rounded bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] text-[11px] font-bold cursor-pointer"
                    >
                      All Al 6061
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetMaterial('en8_steel')}
                      className="px-2 py-1 rounded bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] text-[11px] font-bold cursor-pointer"
                    >
                      All Steel EN8
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetMaterial('abs_plastic')}
                      className="px-2 py-1 rounded bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] text-[11px] font-bold cursor-pointer"
                    >
                      All ABS Plastic
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetMaterial('ss_304')}
                      className="px-2 py-1 rounded bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] text-[11px] font-bold cursor-pointer"
                    >
                      All SS 304
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-copy-bom-costs"
                      type="button"
                      onClick={handleCopyBOM}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.25)] font-bold cursor-pointer transition-colors"
                      title="Copy itemized BOM table to clipboard as CSV"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </button>
                    <button
                      id="btn-download-bom-costs"
                      type="button"
                      onClick={handleDownloadBOM}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] border border-[rgba(16,185,129,0.3)] font-bold cursor-pointer transition-all"
                      title="Download itemized BOM with costs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
                      <span>BOM (.csv)</span>
                    </button>
                    <button
                      id="btn-generate-pdf-cost-assembly"
                      type="button"
                      onClick={handleGeneratePDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(0,245,160,0.25)]"
                      title="Download a formal PDF report of material costs and BOM rollup"
                    >
                      <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Generate PDF Summary</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Component-by-Component Itemized Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F0FDF4] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>Itemized Assembly Component Cost Breakdown</span>
                  </span>
                  <span className="text-xs text-[#8CA89E]">
                    Change material per component to see immediate live cost rollup
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[rgba(16,185,129,0.25)] bg-[#071510]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#102B21] border-b border-[rgba(16,185,129,0.25)] text-[#00F5A0]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Component Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Assigned Material</th>
                        <th className="py-2.5 px-3 text-right">Volume ({isImperialUnit ? 'in³' : 'cm³'})</th>
                        <th className="py-2.5 px-3 text-right">Mass ({isImperialUnit ? 'lb' : 'kg'})</th>
                        <th className="py-2.5 px-3 text-right">Rate/{isImperialUnit ? 'lb' : 'kg'}</th>
                        <th className="py-2.5 px-3 text-right">Item Cost</th>
                        <th className="py-2.5 px-3 text-center">Cost %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(16,185,129,0.1)] text-[#F0FDF4]">
                      {assemblyAnalysis.items.map((item, idx) => {
                        const itemCost = item.costInr * customPriceMultiplier;
                        const pctOfTotal =
                          assemblyAnalysis.totalCostWithMultiplier > 0
                            ? (itemCost / assemblyAnalysis.totalCostWithMultiplier) * 100
                            : 0;
                        const itemRateInfo = formatRatePerWeight(
                          item.material.costPerKgInr || 95,
                          formatCost,
                          activePart.units
                        );

                        return (
                          <tr key={item.comp.id} className="hover:bg-[#0B1E17] transition-colors">
                            <td className="py-2.5 px-3 text-[#8CA89E]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-[#F0FDF4]">{item.comp.name}</td>
                            <td className="py-2.5 px-3 text-[#8CA89E] text-[11px]">{item.comp.partType}</td>
                            <td className="py-2 px-3">
                              {/* Material Dropdown per Component */}
                              <select
                                value={item.material.id}
                                onChange={(e) => handleSetCompMaterial(item.comp.id, e.target.value)}
                                className="bg-[#0B1E17] border border-[rgba(16,185,129,0.25)] hover:border-[#00F5A0] rounded px-2 py-1 text-xs text-[#00F5A0] font-bold focus:outline-none cursor-pointer max-w-[190px] truncate"
                              >
                                {MATERIALS.map((m) => (
                                  <option key={m.id} value={m.id} className="bg-[#0B1E17] text-[#F0FDF4]">
                                    {m.name} ({isImperialUnit ? `${formatCost((m.costPerKgInr || 95) / KG_TO_LB)}/lb` : `₹${m.costPerKgInr || 95}/kg`})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#8CA89E]">
                              {formatVolume(item.volumeCm3, activePart.units, false)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#F0FDF4]">
                              {formatMass(item.massKg, activePart.units, false)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#8CA89E]">
                              {itemRateInfo.rateStr}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#00F5A0]">
                              {formatCost(itemCost)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 h-1.5 rounded-full bg-[#030A07] overflow-hidden">
                                  <div
                                    className="h-full bg-[#00F5A0] rounded-full"
                                    style={{ width: `${Math.min(100, pctOfTotal)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-[#8CA89E] w-8 text-right">
                                  {pctOfTotal.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#0B1E17] border-t-2 border-[#00F5A0]/40 font-bold text-[#F0FDF4]">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 uppercase tracking-wider text-[#00F5A0]">
                          Assembly Running Total:
                        </td>
                        <td className="py-3 px-3 text-right text-[#8CA89E]">
                          {formatVolume(assemblyAnalysis.totalVolumeCm3, activePart.units)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#00F5A0]">
                          {formatMass(assemblyAnalysis.totalMassKg, activePart.units)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#8CA89E]">—</td>
                        <td className="py-3 px-3 text-right text-base text-[#00F5A0]">
                          {formatCost(assemblyAnalysis.totalCostWithMultiplier)}
                        </td>
                        <td className="py-3 px-3 text-center text-[#8CA89E]">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[rgba(16,185,129,0.2)] bg-[#071510] shrink-0 text-xs">
          <div className="text-[#8CA89E] font-sans flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>
              Running total updates automatically as part geometry, volume, and material specifications are changed.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-generate-pdf-cost-footer"
              type="button"
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,245,160,0.25)] cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Generate PDF Summary</span>
            </button>

            <button
              id="btn-close-modal-bottom"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)] font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
