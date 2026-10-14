import React, { useState } from 'react';
import {
  CADPart,
  EngineeringCheck,
  BOMItem,
  DFMAnalysisResult,
  GDTFeature,
  EngineeringCalculationResult,
} from '../../types/cad';
import { runEngineeringValidation } from '../../engine/engineeringValidator';
import { runComprehensiveCalculations } from '../../engineering/engineeringCalculations';
import { generateBOM, runDFMAnalysis, getGDTFeatures } from '../../validation/dfmValidator';
import {
  generateEngineeringChecksPDF,
  generateEngineeringSummaryReportPDF,
} from '../../engine/pdfReportGenerator';
import { CadVantaLogoMark } from '../Brand/CadVantaLogo';
import {
  isImperial,
  formatMass,
  formatLength,
  formatTolerance,
  convertCalculationOutput,
  convertDimensionsString,
} from '../../utils/unitConversion';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Wrench,
  Calculator,
  ListTree,
  Cpu,
  FileText,
  Download,
  Info,
  Layers,
  Sparkles,
  Check,
  Ruler,
  Scale,
} from 'lucide-react';

interface EngineeringChecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePart: CADPart;
  onApplyFix?: (paramKey: string, autoFixValue: any) => void;
  onUnitChange?: (unit: 'mm' | 'inch') => void;
}

export const EngineeringChecksModal: React.FC<EngineeringChecksModalProps> = ({
  isOpen,
  onClose,
  activePart,
  onApplyFix,
  onUnitChange,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'fea' | 'dfm' | 'bom'>('rules');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const isImperialUnit = isImperial(activePart.units);

  const geometricChecks: EngineeringCheck[] = runEngineeringValidation(activePart);
  const calculations: EngineeringCalculationResult[] = runComprehensiveCalculations(activePart);
  const bomItems: BOMItem[] = generateBOM(activePart);
  const dfm: DFMAnalysisResult = runDFMAnalysis(activePart);
  const gdt: GDTFeature[] = getGDTFeatures(activePart);

  const errorChecks = geometricChecks.filter((c) => c.severity === 'error');
  const warningChecks = geometricChecks.filter((c) => c.severity === 'warning');
  const passChecks = geometricChecks.filter((c) => c.severity === 'valid');

  const hasErrors = errorChecks.length > 0;
  const hasWarnings = warningChecks.length > 0;

  const totalCost = bomItems.reduce(
    (acc, it) => acc + (it.totalCostInr || (it.totalCostUsd ? it.totalCostUsd * 86.5 : 0)),
    0
  );
  const totalMass = bomItems.reduce((acc, it) => acc + it.totalMassKg, 0);
  const primaryFos = calculations.find((c) => c.factorOfSafety !== undefined)?.factorOfSafety || 2.5;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGeneratePDF = () => {
    generateEngineeringSummaryReportPDF(activePart, {
      downloadImmediately: true,
    });
    showNotification('Generated formal 3-Page Engineering Summary PDF (Costs, FEA & DFM)!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div
        id="modal-engineering-checks"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[rgba(16,185,129,0.3)] bg-[#030A07] text-[#F0FDF4] shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden"
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
            <div className="p-1.5 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
              <CadVantaLogoMark size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F0FDF4] tracking-tight">
                  <span className="text-[#00F5A0]">CADVANTA</span> Checks & DFM Validation
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    hasErrors
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : hasWarnings
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-[#00F5A0]/20 text-[#00F5A0] border-[#00F5A0]/40'
                  }`}
                >
                  {hasErrors
                    ? `${errorChecks.length} Violations`
                    : hasWarnings
                    ? `${warningChecks.length} Warnings`
                    : 'All Rules Passed'}
                </span>
              </div>
              <p className="text-xs text-[#8CA89E] font-sans mt-0.5">
                ISO 2768, ISO 1101, ASME Y14.5 & analytical stress compliance for {activePart.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit System Toggle (Metric vs Imperial) */}
            <div className="flex items-center bg-[#0B1E17] p-1 rounded-lg border border-[rgba(16,185,129,0.2)] text-xs">
              <button
                id="btn-eng-unit-metric"
                type="button"
                onClick={() => onUnitChange && onUnitChange('mm')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                  !isImperialUnit
                    ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
                title="Display in Metric units (mm, cm³, kg, MPa)"
              >
                <Ruler className="w-3 h-3" />
                <span>mm / kg</span>
              </button>
              <button
                id="btn-eng-unit-imperial"
                type="button"
                onClick={() => onUnitChange && onUnitChange('inch')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
                  isImperialUnit
                    ? 'bg-[#00F5A0] text-[#02140D] shadow-xs'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
                title="Display in Imperial units (in, in³, lb, ksi)"
              >
                <Scale className="w-3 h-3" />
                <span>in / lb</span>
              </button>
            </div>

            {/* Prominent Generate PDF Summary Button in Header */}
            <button
              id="btn-generate-pdf-engineering-modal-header"
              type="button"
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] active:scale-95 shrink-0"
              title="Download formal Engineering Validation & DFM PDF Report"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Generate PDF Summary</span>
              <span className="sm:hidden">PDF Report</span>
            </button>

            <button
              id="btn-close-engineering-checks-modal"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#05110C] border-b border-[rgba(16,185,129,0.15)] shrink-0">
          <div className="p-2.5 rounded-lg bg-[#071911] border border-[rgba(16,185,129,0.2)]">
            <div className="text-[10px] text-[#8CA89E] uppercase font-bold">Health Status</div>
            <div
              className={`text-sm font-bold mt-1 ${
                hasErrors ? 'text-red-400' : hasWarnings ? 'text-amber-400' : 'text-[#00F5A0]'
              }`}
            >
              {hasErrors ? 'Action Required' : hasWarnings ? 'Warning Review' : 'Certified OK'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#071911] border border-[rgba(16,185,129,0.2)]">
            <div className="text-[10px] text-[#8CA89E] uppercase font-bold">Factor of Safety</div>
            <div className="text-sm font-bold text-[#00F5A0] mt-1">
              {primaryFos.toFixed(2)}x{' '}
              <span className="text-[10px] font-normal text-[#8CA89E]">(Min: 1.5x)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#071911] border border-[rgba(16,185,129,0.2)]">
            <div className="text-[10px] text-[#8CA89E] uppercase font-bold">DFM Feasibility</div>
            <div className="text-sm font-bold text-[#F0FDF4] mt-1 truncate">
              {dfm.toolAccessibility} ({dfm.score}/100)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#071911] border border-[rgba(16,185,129,0.2)]">
            <div className="text-[10px] text-[#8CA89E] uppercase font-bold">Estimated Cost & Mass</div>
            <div className="text-sm font-bold text-[#00F5A0] mt-1">
              ₹ {Math.round(totalCost).toLocaleString('en-IN')}{' '}
              <span className="text-[10px] font-normal text-[#8CA89E]">({formatMass(totalMass, activePart.units)})</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#071510] border-b border-[rgba(16,185,129,0.15)] shrink-0">
          <button
            id="tab-eng-rules"
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rules & Checks ({geometricChecks.length})</span>
          </button>

          <button
            id="tab-eng-fea"
            type="button"
            onClick={() => setActiveTab('fea')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fea'
                ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Structural & FEA ({calculations.length})</span>
          </button>

          <button
            id="tab-eng-dfm"
            type="button"
            onClick={() => setActiveTab('dfm')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dfm'
                ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>DFM & GD&T Matrix</span>
          </button>

          <button
            id="tab-eng-bom"
            type="button"
            onClick={() => setActiveTab('bom')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bom'
                ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>BOM Itemization ({bomItems.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: RULES & CONSTRAINT CHECKS */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8CA89E]">
                <span>Parametric constraints & geometric boundary rules evaluated:</span>
                <span>
                  {errorChecks.length} Errors, {warningChecks.length} Warnings, {passChecks.length} Passed
                </span>
              </div>

              {geometricChecks.map((check) => {
                const isError = check.severity === 'error';
                const isWarning = check.severity === 'warning';

                return (
                  <div
                    key={check.id}
                    id={`modal-check-${check.id}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isError
                        ? 'bg-red-950/20 border-red-500/40 text-red-200'
                        : isWarning
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-[#071911] border-[rgba(16,185,129,0.25)] text-[#F0FDF4]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isError ? (
                            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-[#00F5A0] shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{check.title}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                isError
                                  ? 'bg-red-500/20 text-red-400'
                                  : isWarning
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-[#00F5A0]/20 text-[#00F5A0]'
                              }`}
                            >
                              {check.severity}
                            </span>
                          </div>
                          <p className="text-xs text-[#8CA89E] font-sans mt-1 leading-relaxed">
                            {check.message}
                          </p>
                          {check.suggestedFix && (
                            <div className="mt-2 text-xs font-mono text-[#00F5A0] bg-[#030E09] p-2 rounded border border-[rgba(16,185,129,0.2)]">
                              Suggested Fix: {check.suggestedFix}
                            </div>
                          )}
                        </div>
                      </div>

                      {check.autoFixValue !== undefined && onApplyFix && check.paramKey && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyFix(check.paramKey!, check.autoFixValue);
                            showNotification(`Applied automatic fix for ${check.title}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Auto Fix</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: FEA / STRESS CALCULATIONS */}
          {activeTab === 'fea' && (
            <div className="space-y-4">
              {calculations.map((calc, idx) => {
                const isSafe = (calc.factorOfSafety || 2.5) >= 2.0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#071911] border border-[rgba(16,185,129,0.25)] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-2">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-[#00F5A0]" />
                        <span className="text-sm font-bold text-[#F0FDF4]">{calc.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isSafe
                            ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        FoS: {(calc.factorOfSafety || 2.5).toFixed(2)}x ({calc.status.toUpperCase()})
                      </span>
                    </div>

                    <p className="text-xs text-[#8CA89E] font-sans leading-relaxed">
                      {calc.interpretation}
                    </p>

                    {/* Dynamic Outputs Grid with Unit Conversion */}
                    {calc.outputs && Object.keys(calc.outputs).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {Object.entries(calc.outputs).slice(0, 4).map(([key, out]) => {
                          const converted = convertCalculationOutput(out, activePart.units);
                          return (
                            <div key={key} className="bg-[#030E09] p-2 rounded border border-[rgba(16,185,129,0.15)]">
                              <span className="text-[#8CA89E] block text-[10px] truncate">{converted.label}:</span>
                              <span className="text-[#00F5A0] font-bold text-sm">{converted.value}</span>{' '}
                              <span className="text-[#8CA89E] text-[10px]">{converted.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {calc.recommendations && calc.recommendations.length > 0 && (
                      <div className="bg-[#030E09] p-2.5 rounded-lg border border-[rgba(16,185,129,0.15)] text-xs text-[#00F5A0] space-y-1 font-mono">
                        {calc.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-[#8CA89E]">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: DFM & GD&T MATRIX */}
          {activeTab === 'dfm' && (
            <div className="space-y-4">
              {/* DFM Overview Box */}
              <div className="p-4 rounded-xl bg-[#071911] border border-[rgba(16,185,129,0.25)] space-y-3">
                <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-2">
                  <span className="text-sm font-bold text-[#F0FDF4]">Manufacturing Feasibility</span>
                  <span className="text-xs font-bold text-[#00F5A0]">Score: {dfm.score}/100</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#030E09] p-2.5 rounded border border-[rgba(16,185,129,0.15)]">
                    <span className="text-[#8CA89E] block">Recommended Process:</span>
                    <span className="text-[#F0FDF4] font-bold mt-1 block">{dfm.recommendedProcess}</span>
                  </div>
                  <div className="bg-[#030E09] p-2.5 rounded border border-[rgba(16,185,129,0.15)]">
                    <span className="text-[#8CA89E] block">Estimated Cycle Time:</span>
                    <span className="text-[#00F5A0] font-bold mt-1 block">
                      ~{dfm.estimatedMachiningTimeMin} minutes
                    </span>
                  </div>
                  <div className="bg-[#030E09] p-2.5 rounded border border-[rgba(16,185,129,0.15)]">
                    <span className="text-[#8CA89E] block">Min Wall Thickness:</span>
                    <span className="text-[#F0FDF4] font-bold mt-1 block">
                      {formatLength(dfm.minWallThicknessMm, activePart.units)}
                    </span>
                  </div>
                </div>

                {dfm.suggestions && dfm.suggestions.length > 0 && (
                  <div className="pt-2 text-xs space-y-1">
                    <span className="text-[#8CA89E] font-bold block">DFM Recommendations:</span>
                    {dfm.suggestions.map((sug, sIdx) => (
                      <div key={sIdx} className="text-[#00F5A0] flex items-start gap-1.5 font-sans">
                        <span>•</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GD&T Tolerance Callout Table */}
              <div className="p-4 rounded-xl bg-[#071911] border border-[rgba(16,185,129,0.25)] space-y-3">
                <span className="text-sm font-bold text-[#F0FDF4] block border-b border-[rgba(16,185,129,0.2)] pb-2">
                  GD&T Feature Matrix (ISO 1101 / ASME Y14.5)
                </span>

                <div className="space-y-2">
                  {gdt.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-3 rounded-lg bg-[#030E09] border border-[rgba(16,185,129,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F0FDF4]">{feat.featureName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 text-[10px] font-bold">
                            [{feat.symbol.toUpperCase()}]
                          </span>
                        </div>
                        <p className="text-xs text-[#8CA89E] font-sans mt-0.5">{feat.explanation}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-[#00F5A0] font-bold">±{formatTolerance(feat.toleranceMm, activePart.units)}</span>
                        <span className="text-[#8CA89E]">Datum: {feat.datumA || 'A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOM ITEMIZATION */}
          {activeTab === 'bom' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-[rgba(16,185,129,0.25)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#071911] text-[#00F5A0] border-b border-[rgba(16,185,129,0.2)]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Part Name</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-right">Mass ({isImperialUnit ? 'lb' : 'kg'})</th>
                      <th className="py-2.5 px-3 text-right">Cost (INR)</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(16,185,129,0.1)]">
                    {bomItems.map((item) => (
                      <tr key={item.itemNumber} className="hover:bg-[#071911]/50">
                        <td className="py-2.5 px-3 text-[#8CA89E]">{item.itemNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-[#F0FDF4]">{item.partName}</td>
                        <td className="py-2.5 px-3 text-[#8CA89E]">{item.material}</td>
                        <td className="py-2.5 px-3 text-right text-[#F0FDF4]">{formatMass(item.totalMassKg, activePart.units, false)}</td>
                        <td className="py-2.5 px-3 text-right text-[#00F5A0] font-bold">
                          ₹ {Math.round(item.totalCostInr || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-[#8CA89E] text-[11px]">{item.manufacturingMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[rgba(16,185,129,0.2)] bg-[#071510] shrink-0 text-xs">
          <div className="text-[#8CA89E] font-sans flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>
              Formal engineering validation is calculated dynamically from geometry and material properties.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Generate PDF Summary Button in Footer */}
            <button
              id="btn-generate-pdf-engineering-modal-footer"
              type="button"
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,245,160,0.25)] cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Generate PDF Summary</span>
            </button>

            <button
              id="btn-close-engineering-checks-bottom"
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
