import React, { useState } from 'react';
import { CADPart } from '../../types/cad';
import { TEST_SUITE } from '../../testing/cadTestSuite';
import { Play, CheckCircle2, X, Sparkles, Terminal, Activity, ArrowRight } from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTest: (prompt: string) => void;
  currentPart: CADPart;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isOpen,
  onClose,
  onRunTest,
  currentPart,
}) => {
  const [selectedTestId, setSelectedTestId] = useState<string>(TEST_SUITE[0].id);

  if (!isOpen) return null;

  const currentTest = TEST_SUITE.find((t) => t.id === selectedTestId) || TEST_SUITE[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full h-full sm:h-auto sm:max-w-4xl bg-white sm:border-2 sm:border-black sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-none sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-3 sm:p-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-black shrink-0" />
            <h3 className="font-bold text-black font-mono text-xs uppercase tracking-wide truncate">
              CADVANTA Benchmark & Test Suite
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close test suite"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">
          {/* Test Case Selection List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50 p-3 space-y-2 shrink-0 max-h-48 md:max-h-none overflow-y-auto">
            <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1">
              Test Scenarios
            </div>
            {TEST_SUITE.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTestId(t.id)}
                className={`w-full text-left p-3 min-h-[44px] rounded-lg border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                  selectedTestId === t.id
                    ? 'bg-black text-white font-bold shadow-sm border-black'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:text-black hover:border-zinc-400'
                }`}
              >
                <div className="font-bold font-mono text-xs leading-snug">{t.title}</div>
                <div
                  className={`text-[10px] font-sans line-clamp-2 ${
                    selectedTestId === t.id ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {t.description}
                </div>
              </button>
            ))}
          </div>

          {/* Test Details & Execution Console */}
          <div className="flex-1 p-4 sm:p-5 bg-white flex flex-col justify-between overflow-y-auto gap-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono text-zinc-500 font-semibold uppercase">Selected Test</div>
                <h2 className="text-base font-bold text-black font-mono mt-0.5">{currentTest.title}</h2>
                <p className="text-xs text-zinc-600 font-sans mt-1 leading-relaxed">
                  {currentTest.description}
                </p>
              </div>

              {/* Exact Prompt Box */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
                  <Terminal className="w-3.5 h-3.5 text-black" />
                  <span>Engineering Prompt String</span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-xs text-zinc-900 leading-relaxed select-all break-words">
                  {currentTest.prompt}
                </div>
              </div>

              {/* Expectations & Target Specs */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5 font-mono">
                <div className="text-[10px] uppercase text-zinc-500 font-bold">Verification Criteria:</div>
                <div className="text-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Expected Part Type: <strong className="text-black">{currentTest.expectedPartType}</strong></span>
                </div>
                <div className="text-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Min Feature Nodes: <strong className="text-black">{currentTest.expectedFeatureCountMin}</strong></span>
                </div>
                {currentTest.isAssembly && (
                  <div className="text-zinc-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>Multi-Body Kinematic Assembly Check</span>
                  </div>
                )}
              </div>
            </div>

            {/* Execute Test Button */}
            <div className="pt-4 border-t border-zinc-200 flex justify-end">
              <button
                id="btn-run-selected-test"
                onClick={() => {
                  onRunTest(currentTest.prompt);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-3 min-h-[44px] bg-black text-white hover:bg-zinc-800 font-black rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Benchmark In CADVANTA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
