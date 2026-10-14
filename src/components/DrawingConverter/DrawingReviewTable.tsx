import React from 'react';
import { DetectedDimension } from '../../types/drawingConverter';
import { Check, Edit2, AlertTriangle, HelpCircle } from 'lucide-react';

interface DrawingReviewTableProps {
  dimensions: DetectedDimension[];
  onUpdateDimension: (id: string, updatedValue: number, updatedTolerance?: string) => void;
}

export const DrawingReviewTable: React.FC<DrawingReviewTableProps> = ({
  dimensions,
  onUpdateDimension,
}) => {
  return (
    <div className="w-full overflow-hidden border border-[#E2E8F0] dark:border-slate-800 rounded-lg bg-white dark:bg-[#0B132B]">
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide font-mono">
            Detected Dimensions ({dimensions.length})
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-full font-semibold">
            Editable
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Click values to modify
        </span>
      </div>

      <div className="overflow-x-auto max-h-[340px] overflow-y-auto no-scrollbar">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] sticky top-0 z-10 border-b border-[#E2E8F0] dark:border-slate-800">
            <tr>
              <th className="py-2 px-3">Feature Label</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2 text-right">Value (mm)</th>
              <th className="py-2 px-2">Tolerance</th>
              <th className="py-2 px-2">View</th>
              <th className="py-2 px-2 text-center">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-800 dark:text-slate-200">
            {dimensions.map((dim) => {
              const confidencePercent = Math.round(dim.confidence * 100);
              const confColor =
                confidencePercent >= 90
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                  : confidencePercent >= 75
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40';

              return (
                <tr
                  key={dim.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {dim.label}
                    {dim.isAmbiguous && (
                      <span title={dim.ambiguityNote || 'Multiple interpretations possible'}>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline" />
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-500 uppercase text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {dim.type}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={dim.value}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          onUpdateDimension(dim.id, val, dim.tolerance);
                        }
                      }}
                      className="w-20 text-right px-1.5 py-1 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-emerald-400"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={dim.tolerance || ''}
                      placeholder="±0.1"
                      onChange={(e) => {
                        onUpdateDimension(dim.id, dim.value, e.target.value);
                      }}
                      className="w-16 px-1.5 py-1 text-[11px] font-mono bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded text-slate-600 dark:text-slate-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-slate-500 capitalize text-[11px]">
                    {dim.view}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${confColor}`}
                    >
                      {confidencePercent}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
