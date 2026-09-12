import React, { useState } from 'react';
import { CADPart, EngineeringCheck, BOMItem, DFMAnalysisResult, GDTFeature, EngineeringCalculationResult } from '../../types/cad';
import { runEngineeringValidation } from '../../engine/engineeringValidator';
import { runComprehensiveCalculations } from '../../engineering/engineeringCalculations';
import { generateBOM, runDFMAnalysis, getGDTFeatures } from '../../validation/dfmValidator';
import { generateEngineeringChecksPDF } from '../../engine/pdfReportGenerator';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Wrench,
  Calculator,
  ListTree,
  Cpu,
  FileText,
  Maximize2,
} from 'lucide-react';

interface EngineeringChecksProps {
  part: CADPart;
  onApplyFix?: (paramKey: string, autoFixValue: any) => void;
  onOpenModal?: () => void;
}

export const EngineeringChecks: React.FC<EngineeringChecksProps> = ({
  part,
  onApplyFix,
  onOpenModal,
}) => {
  const [subTab, setSubTab] = useState<'checks' | 'fea' | 'bom' | 'dfm'>('checks');

  const geometricChecks: EngineeringCheck[] = runEngineeringValidation(part);
  const calculations: EngineeringCalculationResult[] = runComprehensiveCalculations(part);
  const bomItems: BOMItem[] = generateBOM(part);
  const dfm: DFMAnalysisResult = runDFMAnalysis(part);
  const gdt: GDTFeature[] = getGDTFeatures(part);

  const hasErrors = geometricChecks.some((c) => c.severity === 'error');
  const hasWarnings = geometricChecks.some((c) => c.severity === 'warning');

  const totalCost = bomItems.reduce((acc, it) => acc + (it.totalCostInr || (it.totalCostUsd ? it.totalCostUsd * 83 : 0)), 0);
  const totalMass = bomItems.reduce((acc, it) => acc + it.totalMassKg, 0);

  const primaryFos = calculations.find((c) => c.factorOfSafety !== undefined)?.factorOfSafety || 2.5;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg border border-zinc-300 shadow-sm overflow-hidden text-black">
      {/* Panel Top Navigation */}
      <div className="border-b border-zinc-200 bg-zinc-50 p-1.5 flex items-center justify-between gap-1">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setSubTab('checks')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-all flex items-center gap-1 shrink-0 ${
              subTab === 'checks'
                ? 'bg-black text-white font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          <button
            onClick={() => setSubTab('fea')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-all flex items-center gap-1 shrink-0 ${
              subTab === 'fea'
                ? 'bg-black text-white font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>FEA</span>
          </button>

          <button
            onClick={() => setSubTab('bom')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-all flex items-center gap-1 shrink-0 ${
              subTab === 'bom'
                ? 'bg-black text-white font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>BOM</span>
          </button>

          <button
            onClick={() => setSubTab('dfm')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-all flex items-center gap-1 shrink-0 ${
              subTab === 'dfm'
                ? 'bg-black text-white font-bold'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>DFM</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            id="btn-generate-pdf-top-engineering"
            type="button"
            onClick={() => generateEngineeringChecksPDF(part)}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-[10px] font-mono font-bold cursor-pointer transition-colors"
            title="Download PDF report"
          >
            <FileText className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {onOpenModal && (
            <button
              id="btn-expand-engineering-checks-modal"
              type="button"
              onClick={onOpenModal}
              className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 hover:text-black transition-colors cursor-pointer"
              title="Expand to Full Engineering Checks Modal"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}

          {subTab === 'checks' && (
            <div>
              {hasErrors ? (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 border border-black text-black">
                  Violation
                </span>
              ) : hasWarnings ? (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-400 text-zinc-800">
                  Warning
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-black">
                  Valid
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab 1: Geometric Validation Checks */}
      {subTab === 'checks' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {geometricChecks.map((check) => {
            const isError = check.severity === 'error';
            const isWarning = check.severity === 'warning';

            return (
              <div
                key={check.id}
                id={`check-${check.id}`}
                className="p-2.5 rounded-lg border text-xs bg-white border-zinc-200 text-zinc-800 shadow-xs"
              >
                <div className="flex items-start gap-2">
                  {isError ? (
                    <XCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="font-bold font-mono flex items-center justify-between">
                      <span className="text-black">{check.title}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300">
                        {check.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-sans">
                      {check.message}
                    </p>

                    {check.suggestedFix && check.paramKey && onApplyFix && (
                      <div className="pt-1.5 flex items-center justify-between border-t border-zinc-200 mt-1">
                        <span className="text-[10px] font-mono text-zinc-700">
                          {check.suggestedFix}
                        </span>
                        <button
                          id={`btn-apply-fix-${check.id}`}
                          onClick={() => onApplyFix(check.paramKey!, check.autoFixValue)}
                          className="px-2 py-0.5 bg-black hover:bg-zinc-800 text-white font-bold text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                        >
                          <Wrench className="w-3 h-3" />
                          Fix
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-tab 2: Engineering Calculations & Stress */}
      {subTab === 'fea' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Primary Safety Factor Banner */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Design Safety Factor (FoS)</div>
              <div className="text-2xl font-black font-mono text-black">
                {primaryFos.toFixed(2)} ×
              </div>
              <div className="text-[10px] text-zinc-600">Criteria: IS 800 / Von Mises Distortion Energy</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Yield Strength</div>
              <div className="text-base font-bold font-mono text-black">
                {part.material.yieldStrength} MPa
              </div>
              <div className="text-[10px] text-zinc-600">{part.material.name}</div>
            </div>
          </div>

          {/* Detailed Analytical Result Cards */}
          <div className="space-y-2">
            {calculations.map((calc, idx) => (
              <div key={idx} className="p-2.5 bg-white border border-zinc-200 rounded-lg text-xs shadow-xs">
                <div className="flex items-center justify-between font-mono font-bold text-black mb-1">
                  <span>{calc.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-zinc-100 text-black border border-zinc-300">
                    {calc.status.toUpperCase()}
                  </span>
                </div>

                {/* Outputs grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-1">
                  {Object.entries(calc.outputs).slice(0, 4).map(([key, out]) => (
                    <div key={key}>
                      <span className="text-zinc-500">{out.label}: </span>
                      <span className="text-black font-bold">{out.value}</span> {out.unit}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-600 font-mono pt-1">
                  Formula: {calc.formula}
                </div>
                <div className="text-[10px] text-zinc-600 pt-0.5 leading-relaxed font-sans">
                  {calc.interpretation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 3: Bill of Materials (BOM) */}
      {subTab === 'bom' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-xs">
            <div>
              <span className="text-zinc-600">Total Mass: </span>
              <span className="text-black font-bold">{totalMass.toFixed(2)} kg</span>
            </div>
            <div>
              <span className="text-zinc-600">Est. Unit Cost: </span>
              <span className="text-black font-bold">₹{totalCost.toFixed(2)} INR</span>
            </div>
          </div>

          <div className="space-y-2">
            {bomItems.map((item) => (
              <div key={item.itemNumber} className="p-2.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono shadow-xs">
                <div className="flex items-center justify-between text-black font-bold mb-1">
                  <span>#{item.itemNumber} {item.partName}</span>
                  <span className="text-zinc-700">Qty: {item.quantity}</span>
                </div>
                <div className="text-[11px] text-zinc-700 font-sans">
                  <span className="text-zinc-500">PN: </span>{item.partNumber} | <span className="text-zinc-500">Mat: </span>{item.material}
                  {item.hsnCode && (
                    <span className="ml-1 text-zinc-500 font-mono text-[10px]">| HSN: {item.hsnCode}</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-600 pt-1 font-sans">
                  <span className="text-zinc-500">Process: </span>{item.manufacturingMethod}
                </div>
                <div className="flex justify-between items-center pt-1.5 text-[11px] border-t border-zinc-200 mt-1.5">
                  <span className="text-zinc-600">{item.dimensions}</span>
                  <span className="text-black font-bold">₹{(item.totalCostInr || (item.totalCostUsd ? item.totalCostUsd * 83 : 0)).toFixed(2)} INR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 4: DFM & GD&T */}
      {subTab === 'dfm' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* DFM Feasibility Score */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="flex justify-between items-center mb-1 font-mono text-xs">
              <span className="text-zinc-700">DFM Manufacturability Score</span>
              <span className="font-bold text-black text-sm">{dfm.score}/100</span>
            </div>
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-black"
                style={{ width: `${dfm.score}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-800 font-sans">
              <span className="text-zinc-500 font-mono">Process: </span>{dfm.recommendedProcess}
            </div>
            <div className="text-[11px] text-zinc-800 font-sans mt-0.5">
              <span className="text-zinc-500 font-mono">Cycle Time: </span>~{dfm.estimatedMachiningTimeMin} minutes
            </div>
            {dfm.complianceStandard && (
              <div className="text-[11px] text-zinc-700 font-mono mt-1 pt-1 border-t border-zinc-200">
                Standard: {dfm.complianceStandard}
              </div>
            )}
          </div>

          {/* GD&T Tolerance Callouts */}
          <div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">
              IS 10721 / ISO 1101 / ASME Y14.5 GD&T Matrix
            </div>
            <div className="space-y-1.5">
              {gdt.map((g) => (
                <div key={g.id} className="p-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono shadow-xs">
                  <div className="flex items-center justify-between text-zinc-900 font-semibold">
                    <span className="text-[11px]">{g.featureName}</span>
                    <span className="text-black bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300 text-[10px] font-bold">
                      {g.symbol} | ⌖ {g.toleranceMm} mm
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-600 font-sans pt-1">
                    {g.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Engineering Checks Panel Footer */}
      <div className="p-2 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-2 shrink-0">
        <div className="text-[10px] text-zinc-500 font-mono truncate">
          FoS: {primaryFos.toFixed(2)}x | {hasErrors ? 'Violation' : hasWarnings ? 'Warning' : 'Compliant'}
        </div>
        <button
          id="btn-generate-pdf-engineering-checks"
          type="button"
          onClick={() => generateEngineeringChecksPDF(part)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black hover:bg-zinc-800 text-white text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          title="Download formal Engineering Validation & DFM PDF Report"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>Generate PDF Summary</span>
        </button>
      </div>
    </div>
  );
};
