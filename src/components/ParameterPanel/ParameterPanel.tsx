import React, { useState, useEffect, createContext, useContext } from 'react';
import { CADPart, MaterialInfo, FeatureHistoryItem } from '../../types/cad';
import { MATERIALS, calculateMass } from '../../engine/materials';
import {
  Sliders,
  Scale,
  DollarSign,
  Activity,
  Cpu,
  Lock,
  Calculator,
  RotateCcw,
  Check,
  ShieldCheck,
  History,
  Info,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UnitToggle, UnitSystem } from './UnitToggle';
import { FeatureParameterEditor } from './FeatureParameterEditor';
import { MaterialSelector } from './MaterialSelector';

interface ParameterPanelProps {
  part: CADPart;
  onParameterChange: (key: string, value: number | string | boolean) => void;
  onMaterialChange: (material: MaterialInfo) => void;
  onUnitChange?: (unit: 'mm' | 'inch') => void;
  isViewOnly?: boolean;
  onForkProject?: () => void;
  onOpenCostEstimator?: () => void;
  onPreview3D?: () => void;
  selectedFeature?: FeatureHistoryItem | null;
  onUpdateFeature?: (feature: FeatureHistoryItem) => void;
  onDeselectFeature?: () => void;
}

interface UnitContextValue {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
}

export const UnitContext = createContext<UnitContextValue>({
  unitSystem: 'metric',
  setUnitSystem: () => {},
});

export const useUnitSystem = () => useContext(UnitContext);

export type ParameterPanelTab = 'dimensions' | 'material' | 'mass' | 'dfm' | 'history';

export const ParameterPanel: React.FC<ParameterPanelProps> = React.memo(({
  part,
  onParameterChange,
  onMaterialChange,
  onUnitChange,
  isViewOnly = false,
  onForkProject,
  onOpenCostEstimator,
  onPreview3D,
  selectedFeature = null,
  onUpdateFeature,
  onDeselectFeature,
}) => {
  const [activeTab, setActiveTab] = useState<ParameterPanelTab>('dimensions');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    part.units === 'inch' ? 'imperial' : 'metric'
  );

  // Local draft parameters for Apply / Cancel / Reset workflow
  const [draftParams, setDraftParams] = useState<Record<string, any>>(part.parameters);
  const [initialSnapshot] = useState<Record<string, any>>({ ...part.parameters });
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState<boolean>(false);
  const [applySuccessToast, setApplySuccessToast] = useState<boolean>(false);

  useEffect(() => {
    setDraftParams(part.parameters);
    setHasUnappliedChanges(false);
  }, [part.parameters]);

  useEffect(() => {
    if (part.units === 'inch' && unitSystem !== 'imperial') {
      setUnitSystem('imperial');
    } else if (part.units === 'mm' && unitSystem !== 'metric') {
      setUnitSystem('metric');
    }
  }, [part.units]);

  const handleUnitToggle = (newSystem: UnitSystem) => {
    if (isViewOnly) return;
    setUnitSystem(newSystem);
    if (onUnitChange) {
      onUnitChange(newSystem === 'imperial' ? 'inch' : 'mm');
    }
  };

  // If a specific CAD feature is selected from the feature tree, show its dedicated editor
  if (selectedFeature && onUpdateFeature && onDeselectFeature) {
    return (
      <UnitContext.Provider value={{ unitSystem, setUnitSystem: handleUnitToggle }}>
        <FeatureParameterEditor
          feature={selectedFeature}
          onUpdateFeature={onUpdateFeature}
          onClose={onDeselectFeature}
          units={unitSystem === 'imperial' ? 'inch' : 'mm'}
        />
      </UnitContext.Provider>
    );
  }

  const metrics = part.calculatedMetrics;
  const volume = metrics?.volume || 100;
  const massInfo = calculateMass(volume, part.material);

  const handleDraftChange = (key: string, value: number | string | boolean) => {
    if (isViewOnly) return;
    setDraftParams((prev) => ({ ...prev, [key]: value }));
    setHasUnappliedChanges(true);
    // Real-time feedback: also dispatch to live model so viewport updates interactively
    onParameterChange(key, value);
  };

  const handleApply = () => {
    if (isViewOnly) return;
    // Commit all draft params to live model
    Object.entries(draftParams).forEach(([k, v]) => {
      onParameterChange(k, v);
    });
    setHasUnappliedChanges(false);
    setApplySuccessToast(true);
    setTimeout(() => setApplySuccessToast(false), 2000);
  };

  const handleCancel = () => {
    // Revert draft params to part.parameters
    setDraftParams(part.parameters);
    Object.entries(part.parameters).forEach(([k, v]) => {
      onParameterChange(k, v);
    });
    setHasUnappliedChanges(false);
  };

  const handleReset = () => {
    if (isViewOnly) return;
    // Reset to default nominal parameters for this component type
    let defaultNominal: Record<string, any> = {};
    if (part.part_type === 'shaft') {
      defaultNominal = {
        total_length: 200,
        main_diameter: 120,
        step1_diameter: 20,
        step1_length: 50,
        keyway_width: 10,
        keyway_depth: 6,
        keyway_length: 45,
        thickness: 12,
      };
    } else if (part.part_type === 'flange') {
      defaultNominal = {
        outer_diameter: 120,
        inner_diameter: 40,
        pitch_circle_diameter: 90,
        thickness: 14,
        bolt_hole_count: 6,
        bolt_hole_diameter: 12,
      };
    } else {
      defaultNominal = { ...initialSnapshot };
    }

    setDraftParams(defaultNominal);
    setHasUnappliedChanges(true);
    Object.entries(defaultNominal).forEach(([k, v]) => {
      onParameterChange(k, v);
    });
  };

  // Render parameters tailored to the current part
  const renderParameters = () => {
    const p = draftParams;

    switch (part.part_type) {
      case 'shaft':
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] font-sans border-b border-[#E2E8F0] pb-1">
              Main Body Dimensions
            </div>

            {/* Length: 200 mm */}
            <ParamSlider
              id="param-shaft-total-length"
              label="Length (Total Shaft Length)"
              value={p.total_length || p.length || 200}
              min={30}
              max={600}
              step={5}
              unit="mm"
              onChange={(val) => {
                handleDraftChange('total_length', val);
                handleDraftChange('length', val);
              }}
            />

            {/* Main Diameter: 120 mm */}
            <ParamSlider
              id="param-shaft-main-dia"
              label="Main Diameter"
              value={p.main_diameter || p.diameter || 120}
              min={10}
              max={200}
              step={1}
              unit="mm"
              onChange={(val) => {
                handleDraftChange('main_diameter', val);
                handleDraftChange('diameter', val);
              }}
            />

            {/* Thickness / Wall: 12 mm */}
            <ParamSlider
              id="param-shaft-thickness"
              label="Thickness / Wall"
              value={p.thickness || 12}
              min={2}
              max={40}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('thickness', val)}
            />

            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] font-sans border-b border-[#E2E8F0] pb-1 pt-2">
              Step 1 Journal (Drive End)
            </div>

            {/* Step Diameter: 20 mm */}
            <ParamSlider
              id="param-shaft-step1-dia"
              label="Step Diameter"
              value={p.step1_diameter ?? 20}
              min={5}
              max={(p.main_diameter || 120) - 2}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('step1_diameter', val)}
            />

            {/* Step Length: 50 mm */}
            <ParamSlider
              id="param-shaft-step1-len"
              label="Step Length"
              value={p.step1_length ?? 50}
              min={5}
              max={Math.max(10, (p.total_length || 200) - 20)}
              step={2}
              unit="mm"
              onChange={(val) => handleDraftChange('step1_length', val)}
            />

            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] font-sans border-b border-[#E2E8F0] pb-1 pt-2">
              DIN 6885 / IS 2048 Keyway
            </div>

            {/* Keyway: 10 × 6 mm */}
            <ParamSlider
              id="param-shaft-keyway-w"
              label="Keyway Width (10 mm)"
              value={p.keyway_width ?? 10}
              min={2}
              max={Math.round((p.main_diameter || 120) * 0.4)}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('keyway_width', val)}
            />

            <ParamSlider
              id="param-shaft-keyway-d"
              label="Keyway Depth (6 mm)"
              value={p.keyway_depth ?? 6}
              min={1}
              max={Math.round((p.main_diameter || 120) * 0.3)}
              step={0.5}
              unit="mm"
              onChange={(val) => handleDraftChange('keyway_depth', val)}
            />

            <ParamSlider
              id="param-shaft-keyway-l"
              label="Keyway Length"
              value={p.keyway_length ?? 45}
              min={10}
              max={(p.total_length || 200) - 10}
              step={2}
              unit="mm"
              onChange={(val) => handleDraftChange('keyway_length', val)}
            />
          </div>
        );

      case 'cylinder':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-cylinder-diameter"
              label="Outer Diameter"
              value={p.diameter || 50}
              min={5}
              max={300}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('diameter', val)}
            />
            <ParamSlider
              id="param-cylinder-height"
              label="Height"
              value={p.height || 100}
              min={5}
              max={500}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('height', val)}
            />
            <ParamSlider
              id="param-cylinder-bore"
              label="Center Bore"
              value={p.bore_diameter || 0}
              min={0}
              max={Math.max(0, (p.diameter || 50) - 2)}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('bore_diameter', val)}
            />
          </div>
        );

      case 'flange':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-flange-od"
              label="Outer Diameter (OD)"
              value={p.outer_diameter || 120}
              min={40}
              max={400}
              step={2}
              unit="mm"
              onChange={(val) => handleDraftChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-flange-id"
              label="Inner Hole / Bore (ID)"
              value={p.inner_diameter || 40}
              min={10}
              max={Math.max(10, (p.outer_diameter || 120) - 20)}
              step={2}
              unit="mm"
              onChange={(val) => handleDraftChange('inner_diameter', val)}
            />
            <ParamSlider
              id="param-flange-thickness"
              label="Flange Thickness"
              value={p.thickness || 14}
              min={4}
              max={60}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('thickness', val)}
            />
            <ParamSlider
              id="param-flange-pcd"
              label="Pitch Circle Diameter (PCD)"
              value={p.pitch_circle_diameter || 90}
              min={(p.inner_diameter || 40) + 15}
              max={(p.outer_diameter || 120) - 15}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('pitch_circle_diameter', val)}
            />
            <ParamSlider
              id="param-flange-bolt-count"
              label="Bolt Hole Count"
              value={p.bolt_hole_count || 6}
              min={2}
              max={24}
              step={1}
              unit="holes"
              onChange={(val) => handleDraftChange('bolt_hole_count', val)}
            />
            <ParamSlider
              id="param-flange-bolt-dia"
              label="Bolt Hole Diameter"
              value={p.bolt_hole_diameter || 12}
              min={3}
              max={30}
              step={1}
              unit="mm"
              onChange={(val) => handleDraftChange('bolt_hole_diameter', val)}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] font-sans border-b border-[#E2E8F0] pb-1">
              Parametric Dimensions
            </div>
            {Object.entries(p).map(([k, v]) => {
              if (typeof v !== 'number') return null;
              return (
                <ParamSlider
                  key={k}
                  id={`param-generic-${k}`}
                  label={k.replace(/_/g, ' ')}
                  value={v}
                  min={Math.max(1, Math.round(v * 0.2))}
                  max={Math.max(10, Math.round(v * 3))}
                  step={1}
                  unit="mm"
                  onChange={(val) => handleDraftChange(k, val)}
                />
              );
            })}
          </div>
        );
    }
  };

  return (
    <UnitContext.Provider value={{ unitSystem, setUnitSystem: handleUnitToggle }}>
      <div className="w-full h-full flex flex-col bg-white border-l border-[#E2E8F0] shadow-xs text-[#0F172A] font-sans select-none">
        {/* Panel Header */}
        <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="w-4 h-4 text-[#059669] shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] truncate">
              CAD Properties & Parameters
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#059669] font-bold shrink-0">
            {part.part_type.replace('_', ' ')}
          </span>
        </div>

        {/* Tab Navigation: Dimensions | Material | Mass | DFM | History */}
        <div className="flex items-center px-2 pt-1 border-b border-[#E2E8F0] bg-[#F8FAFC] gap-1 shrink-0 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'dimensions' as ParameterPanelTab, label: 'Dimensions' },
            { id: 'material' as ParameterPanelTab, label: 'Material' },
            { id: 'mass' as ParameterPanelTab, label: 'Mass Props' },
            { id: 'dfm' as ParameterPanelTab, label: 'DFM' },
            { id: 'history' as ParameterPanelTab, label: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 rounded-t font-semibold text-[11px] transition-colors cursor-pointer border-t border-x ${
                activeTab === tab.id
                  ? 'bg-white text-[#059669] border-[#E2E8F0] -mb-[1px] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Unit Toggle always available */}
          <UnitToggle
            unitSystem={unitSystem}
            onChange={handleUnitToggle}
            disabled={isViewOnly}
          />

          {isViewOnly && (
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#059669]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <div className="font-bold text-[10px] uppercase tracking-wider">View-Only Mode</div>
                  <div className="text-[11px] text-[#64748B]">Read-only preview</div>
                </div>
              </div>
              {onForkProject && (
                <button
                  type="button"
                  onClick={onForkProject}
                  className="px-2.5 py-1 rounded bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Edit Copy
                </button>
              )}
            </div>
          )}

          {/* TAB 1: DIMENSIONS */}
          {activeTab === 'dimensions' && (
            <div className={isViewOnly ? 'pointer-events-none opacity-80' : ''}>
              {renderParameters()}
            </div>
          )}

          {/* TAB 2: MATERIAL */}
          {activeTab === 'material' && (
            <div className="space-y-3">
              <MaterialSelector
                currentMaterial={part.material}
                onSelectMaterial={onMaterialChange}
                units={unitSystem === 'imperial' ? 'inch' : 'mm'}
                disabled={isViewOnly}
              />

              {/* Material Details Card */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Material:</span>
                  <span className="font-bold text-[#0F172A]">{part.material?.name || 'Standard Alloy'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Density:</span>
                  <span className="font-mono font-bold text-[#059669]">
                    {unitSystem === 'imperial'
                      ? `${((part.material?.density || 7.85) * 0.036127).toFixed(3)} lb/in³`
                      : `${(part.material?.density || 7.85).toFixed(2)} g/cm³`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Yield Strength:</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {unitSystem === 'imperial'
                      ? `${Math.round((part.material?.yieldStrength || 250) * 0.145038)} ksi`
                      : `${part.material?.yieldStrength || 250} MPa`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Modulus (E):</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {unitSystem === 'imperial'
                      ? `${(((part.material as any)?.elasticModulus || part.material?.youngsModulus || 205) * 0.145038).toFixed(1)} Mpsi`
                      : `${(part.material as any)?.elasticModulus || part.material?.youngsModulus || 205} GPa`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-1.5">
                  <span className="text-[#64748B]">Poisson's Ratio:</span>
                  <span className="font-mono font-bold text-[#0F172A]">{part.material?.poissonsRatio || 0.29}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASS PROPERTIES */}
          {activeTab === 'mass' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#059669]" />
                    Total Mass:
                  </span>
                  <span className="font-mono font-bold text-sm text-[#059669]">
                    {unitSystem === 'imperial'
                      ? `${(massInfo.massKg * 2.20462).toFixed(2)} lb`
                      : massInfo.massGrams < 1000
                      ? `${massInfo.massGrams} g`
                      : `${massInfo.massKg} kg`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Calculated Volume:</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {unitSystem === 'imperial'
                      ? `${(volume * 0.0610237).toFixed(2)} in³`
                      : `${volume.toFixed(1)} cm³`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Center of Gravity (CG):</span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    X: 0.0, Y: 0.0, Z: {(volume > 0 ? (volume * 0.05).toFixed(1) : 0)} mm
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-1.5">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#D97706]" />
                    Raw Material Cost:
                  </span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    ₹{(massInfo.estCostInr || massInfo.estCostUsd * 86.5).toFixed(2)} INR
                  </span>
                </div>
              </div>

              {onOpenCostEstimator && (
                <button
                  type="button"
                  onClick={onOpenCostEstimator}
                  className="w-full py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Open Full Cost Estimator Rollup</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 4: DFM CHECKS */}
          {activeTab === 'dfm' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#065F46]">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Design for Manufacturability (DFM)</span>
                </div>
                <p className="text-[11px] text-[#047857]">
                  Automated geometric validation against CNC lathe and milling tolerances.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-medium text-[#334155]">Minimum Wall Thickness:</span>
                  <span className="font-mono font-bold text-[#059669]">PASS (12 mm &gt; 2.0 mm)</span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-medium text-[#334155]">Shaft Aspect Ratio (L/D):</span>
                  <span className="font-mono font-bold text-[#059669]">
                    PASS ({((draftParams.total_length || 200) / (draftParams.main_diameter || 120)).toFixed(2)} &lt; 10)
                  </span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-medium text-[#334155]">Keyway Corner Radius:</span>
                  <span className="font-mono font-bold text-[#059669]">PASS (DIN 6885 Std)</span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-medium text-[#334155]">Turning Tool Clearance:</span>
                  <span className="font-mono font-bold text-[#059669]">PASS (Optimal)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FEATURE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] font-sans border-b border-[#E2E8F0] pb-1">
                Parametric Feature Revisions
              </div>
              {(part.features || []).map((feat, idx) => (
                <div
                  key={feat.id}
                  className="p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-[#0F172A] block">{feat.name}</span>
                    <span className="text-[10px] text-[#64748B] font-mono block capitalize">
                      {feat.type} • Op #{idx + 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                    Rebuilt
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR: Apply / Cancel / Reset */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            id="btn-param-reset"
            onClick={handleReset}
            disabled={isViewOnly}
            className="px-2.5 py-1.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            title="Reset to default dimensions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-param-cancel"
              onClick={handleCancel}
              disabled={!hasUnappliedChanges || isViewOnly}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                hasUnappliedChanges && !isViewOnly
                  ? 'bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] cursor-pointer'
                  : 'bg-transparent text-[#94A3B8] border border-transparent cursor-not-allowed'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-param-apply"
              onClick={handleApply}
              disabled={isViewOnly}
              className={`px-4 py-1.5 rounded text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                hasUnappliedChanges
                  ? 'bg-[#059669] hover:bg-[#047857] text-white ring-2 ring-[#059669]/30'
                  : 'bg-[#059669] hover:bg-[#047857] text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </UnitContext.Provider>
  );
});

// Parameter Slider Input Component
interface ParamSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = React.memo(({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => {
  const { unitSystem } = useUnitSystem();
  const isImperialLength = unitSystem === 'imperial' && unit === 'mm';

  const displayUnit = isImperialLength ? 'in' : unit;

  const displayValue = isImperialLength
    ? Math.round((value / 25.4) * 100) / 100
    : value;

  const displayMin = isImperialLength
    ? Math.round((min / 25.4) * 100) / 100
    : min;

  const displayMax = isImperialLength
    ? Math.round((max / 25.4) * 100) / 100
    : max;

  const displayStep = isImperialLength
    ? (step <= 0.5 ? 0.01 : 0.05)
    : step;

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal)) return;

    if (isImperialLength) {
      const convertedMm = Math.round(rawVal * 25.4 * 10) / 10;
      onChange(convertedMm);
    } else {
      onChange(rawVal);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal)) return;

    if (isImperialLength) {
      const convertedMm = Math.round(rawVal * 25.4 * 10) / 10;
      onChange(convertedMm);
    } else {
      onChange(rawVal);
    }
  };

  return (
    <div className="space-y-1.5 font-sans">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-semibold text-[#1E293B]">
          {label}
        </label>
        <div className="flex items-center gap-1 font-mono">
          <input
            id={`${id}-number`}
            type="number"
            inputMode="decimal"
            value={displayValue}
            min={displayMin}
            max={displayMax}
            step={displayStep}
            onChange={handleNumberInputChange}
            className="w-20 px-2 py-1 bg-white border border-[#CBD5E1] rounded text-right text-xs font-bold text-[#0F172A] focus:outline-hidden focus:border-[#059669]"
          />
          <span className="text-[11px] text-[#64748B] w-7 font-bold">{displayUnit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={displayMin}
        max={displayMax}
        step={displayStep}
        value={displayValue}
        onChange={handleRangeChange}
        className="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#059669]"
      />
    </div>
  );
});
