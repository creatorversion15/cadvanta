import React, { useState } from 'react';
import { MaterialInfo } from '../../types/cad';
import { MATERIALS } from '../../materials/materialsDatabase';
import {
  Cpu,
  Layers,
  Activity,
  Scale,
  Shield,
  Zap,
  ChevronDown,
  Check,
  Search,
} from 'lucide-react';

interface MaterialSelectorProps {
  currentMaterial: MaterialInfo;
  onSelectMaterial: (material: MaterialInfo) => void;
  units?: 'mm' | 'inch';
  disabled?: boolean;
}

// 7 primary engineering materials
const PRIMARY_MATERIAL_IDS = [
  'stainless_304',
  'steel_1018',
  'alu_6061_t6',
  'alu_7075_t6',
  'brass_c360',
  'copper_c110',
  'titanium_gr5',
];

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  currentMaterial,
  onSelectMaterial,
  units = 'mm',
  disabled = false,
}) => {
  const [showAllDropdown, setShowAllDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const primaryMaterials = PRIMARY_MATERIAL_IDS.map(
    (id) => MATERIALS.find((m) => m.id === id) || MATERIALS[0]
  );

  const filteredAllMaterials = MATERIALS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.standard?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isImperial = units === 'inch';

  const formatDensity = (densityGcm3: number) => {
    if (isImperial) {
      return `${(densityGcm3 * 0.036127).toFixed(3)} lb/in³`;
    }
    return `${densityGcm3.toFixed(2)} g/cm³`;
  };

  const formatStrength = (mpa: number) => {
    if (isImperial) {
      return `${Math.round(mpa * 0.145038)} ksi`;
    }
    return `${mpa} MPa`;
  };

  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#334155] font-semibold uppercase tracking-wider text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-[#059669]" />
          <span>Engineering Material</span>
        </div>
        <span className="text-[10px] text-[#64748B] uppercase font-bold font-mono">
          {currentMaterial.category || 'Alloy'}
        </span>
      </div>

      {/* Primary Material Quick-Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {primaryMaterials.map((mat) => {
          const isSelected = mat.id === currentMaterial.id;
          return (
            <button
              key={mat.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMaterial(mat)}
              className={`p-2 rounded text-left transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#ECFDF5] border-[#059669] text-[#065F46] shadow-xs'
                  : 'bg-white border-[#E2E8F0] text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-bold text-[11px] truncate ${isSelected ? 'text-[#059669]' : 'text-[#0F172A]'}`}>
                  {(mat?.name || mat?.id || 'Material').split('(')[0].trim()}
                </span>
                {isSelected && <Check className="w-3 h-3 text-[#059669] shrink-0" />}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1 font-mono">
                <span>{formatDensity(mat.density)}</span>
                <span>σy: {formatStrength(mat.yieldStrength)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Extended Material Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowAllDropdown(!showAllDropdown)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[11px] text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
              style={{ backgroundColor: currentMaterial.color || '#94a3b8' }}
            />
            <span className="font-semibold truncate text-[#0F172A]">
              {currentMaterial.name}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${showAllDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showAllDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#CBD5E1] rounded-lg shadow-xl p-2 z-50 text-xs">
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search material database..."
                className="w-full pl-8 pr-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs text-[#0F172A] outline-hidden focus:border-[#059669]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredAllMaterials.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => {
                    onSelectMaterial(mat);
                    setShowAllDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                    mat.id === currentMaterial.id
                      ? 'bg-[#ECFDF5] text-[#065F46] font-bold'
                      : 'hover:bg-[#F1F5F9] text-[#334155]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="truncate block font-medium">{mat.name}</span>
                    <span className="text-[10px] text-[#64748B] font-mono block">
                      {formatDensity(mat.density)} • σy {formatStrength(mat.yieldStrength)}
                    </span>
                  </div>
                  {mat.id === currentMaterial.id && (
                    <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
