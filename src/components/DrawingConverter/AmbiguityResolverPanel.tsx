import React from 'react';
import { DrawingAmbiguity } from '../../types/drawingConverter';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface AmbiguityResolverPanelProps {
  ambiguities: DrawingAmbiguity[];
  onSelectOption: (ambiguityId: string, optionId: string) => void;
}

export const AmbiguityResolverPanel: React.FC<AmbiguityResolverPanelProps> = ({
  ambiguities,
  onSelectOption,
}) => {
  if (ambiguities.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 font-mono">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Ambiguity Resolver: {ambiguities.length} interpretation{ambiguities.length > 1 ? 's' : ''} require user confirmation
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {ambiguities.map((amb) => (
          <div
            key={amb.id}
            className="p-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{amb.title}</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {amb.question}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {amb.options.map((opt) => {
                const isSelected = amb.selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSelectOption(amb.id, opt.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {opt.label}
                      </span>
                      {opt.isRecommended && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono uppercase">
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
