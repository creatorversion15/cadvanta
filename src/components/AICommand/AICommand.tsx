import React, { useState } from 'react';
import { CADPart } from '../../types/cad';
import {
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Zap,
  Bot,
  Lock,
  Wand2,
  Sliders,
  FileQuestion,
  TrendingDown,
  CornerDownLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type AIActionMode = 'generate' | 'modify' | 'explain' | 'optimize';

interface AICommandProps {
  part: CADPart;
  onExecuteCommand: (prompt: string) => Promise<void>;
  isLoading: boolean;
  clarificationRequired?: boolean;
  clarificationQuestion?: string;
  onOpenViraBot?: () => void;
  isViewOnly?: boolean;
  onForkProject?: () => void;
}

export const AICommand: React.FC<AICommandProps> = ({
  part,
  onExecuteCommand,
  isLoading,
  clarificationRequired,
  clarificationQuestion,
  onOpenViraBot,
  isViewOnly = false,
  onForkProject,
}) => {
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [showReasoning, setShowReasoning] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<AIActionMode>('generate');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isViewOnly) {
      if (onForkProject) onForkProject();
      return;
    }
    if (!inputPrompt.trim() || isLoading) return;

    let fullPrompt = inputPrompt.trim();
    if (activeMode === 'explain' && !fullPrompt.toLowerCase().startsWith('explain')) {
      fullPrompt = `Explain mechanical design and engineering properties: ${fullPrompt}`;
    } else if (activeMode === 'optimize' && !fullPrompt.toLowerCase().startsWith('optimize')) {
      fullPrompt = `Optimize mass and stress: ${fullPrompt}`;
    }

    onExecuteCommand(fullPrompt);
    setInputPrompt('');
  };

  const handleModeChange = (mode: AIActionMode) => {
    setActiveMode(mode);
    if (mode === 'optimize') {
      setInputPrompt(`Optimize ${part.name} for minimal mass while maintaining factor of safety > 2.0`);
    } else if (mode === 'explain') {
      setInputPrompt(`Explain stress concentrations, critical sections, and load paths for ${part.name}`);
    }
  };

  const handleLoadExample = () => {
    setActiveMode('generate');
    setInputPrompt(
      'Create a stepped shaft, 200 mm long, main diameter 120 mm, step diameter 20 mm × 50 mm, with a 10 × 6 mm keyway.'
    );
  };

  const getPlaceholder = () => {
    if (isViewOnly) {
      return "🔒 View-Only Mode: Design prompt is locked. Click 'Edit Copy' to modify.";
    }
    switch (activeMode) {
      case 'generate':
        return "Describe geometry... e.g. 'Create a stepped shaft, 200 mm long, main diameter 120 mm, step diameter 20 mm × 50 mm, with a 10 × 6 mm keyway.'";
      case 'modify':
        return `Modify ${part.name}... e.g. 'Make length 250 mm', 'Increase diameter to 60 mm', 'Add 8 mm keyway'`;
      case 'explain':
        return `Ask about ${part.name}... e.g. 'Explain torsional stress capacity', 'Check fatigue notch sensitivity'`;
      case 'optimize':
        return `Optimize ${part.name}... e.g. 'Reduce weight by 20%', 'Hollow core bore', 'Add stress relief fillets'`;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-[#CBD5E1] p-2.5 sm:p-3 space-y-2 text-[#0F172A] shadow-md shrink-0 select-none">
      <AnimatePresence>
        {/* Clarification Alert Box if required */}
        {clarificationRequired && clarificationQuestion && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="p-3 bg-[#F8FAFC] border border-[#059669]/40 rounded flex items-start gap-3 text-xs overflow-hidden shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="font-bold text-[#0F172A] font-mono">
                Engineering Clarification Required:
              </div>
              <p className="text-[#475569] leading-relaxed font-sans">{clarificationQuestion}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onExecuteCommand(
                      'Design an L-shaped NEMA 17 motor bracket 42 mm wide, 60 mm high, 4 mm thick with 4x 3.5 mm mounting holes and center pilot hole.'
                    )
                  }
                  className="px-2.5 py-1.5 bg-white text-[#059669] hover:bg-[#059669] hover:text-white border border-[#CBD5E1] font-bold rounded text-[11px] font-mono transition-all cursor-pointer min-h-[32px] flex items-center"
                >
                  Use NEMA 17 Standard Mount
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onExecuteCommand(
                      'Design an L-shaped NEMA 23 motor bracket 60 mm wide, 80 mm high, 6 mm thick with 4x 5 mm mounting holes and 40 mm center pilot.'
                    )
                  }
                  className="px-2.5 py-1.5 bg-white text-[#059669] hover:bg-[#059669] hover:text-white border border-[#CBD5E1] font-bold rounded text-[11px] font-mono transition-all cursor-pointer min-h-[32px] flex items-center"
                >
                  Use NEMA 23 Standard Mount
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header: 4 Action Modes (Generate, Modify, Explain, Optimize) + Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-0.5 rounded border border-[#E2E8F0]">
          {([
            { id: 'generate', label: 'Generate', icon: Wand2 },
            { id: 'modify', label: 'Modify', icon: Sliders },
            { id: 'explain', label: 'Explain', icon: FileQuestion },
            { id: 'optimize', label: 'Optimize', icon: TrendingDown },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleModeChange(id)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMode === id
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#EDF2F7]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Preset Example Quick Trigger */}
          <button
            type="button"
            onClick={handleLoadExample}
            className="text-[10px] text-[#059669] hover:underline font-mono cursor-pointer flex items-center gap-1 bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#CBD5E1]"
            title="Load: Stepped shaft 200 mm long, main Ø120, step Ø20x50, 10x6 keyway"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span className="hidden md:inline">Example:</span> Stepped Shaft 200mm
          </button>

          {part.reasoning && part.reasoning.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <span>Log ({part.reasoning.length})</span>
              {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {onOpenViraBot && (
            <button
              type="button"
              onClick={onOpenViraBot}
              className="flex items-center gap-1 text-[11px] text-[#059669] hover:underline font-mono font-bold cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask VIRA</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Engineering Reasoning Panel */}
      <AnimatePresence>
        {showReasoning && part.reasoning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs font-mono space-y-1 overflow-hidden"
          >
            <div className="text-[10px] font-bold text-[#059669] uppercase tracking-widest mb-1">
              Geometric Reasoning & CAD Action Pipeline:
            </div>
            {part.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[#475569]">
                <span className="text-[#059669] font-bold">•</span>
                <span className="leading-relaxed font-sans">{r}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Conversational Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            id="input-ai-command"
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading || isViewOnly}
            placeholder={getPlaceholder()}
            className={`w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669] transition-all font-mono min-h-[38px] ${
              isViewOnly ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#059669] text-xs font-mono bg-white/90 px-2 py-0.5 rounded border border-[#E2E8F0] shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />
              <span className="hidden sm:inline">Solving 3D CAD...</span>
            </div>
          )}
        </div>

        {isViewOnly ? (
          <button
            id="btn-ai-view-only-fork"
            type="button"
            onClick={onForkProject}
            className="px-3 py-2 min-h-[38px] bg-[#059669] text-white hover:bg-[#047857] font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shrink-0 font-mono cursor-pointer shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Edit Copy</span>
          </button>
        ) : (
          <button
            id="btn-ai-generate"
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-3.5 py-2 min-h-[38px] bg-[#059669] hover:bg-[#047857] disabled:opacity-40 disabled:hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-xs shrink-0 font-mono cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{activeMode === 'explain' ? 'Explain' : activeMode === 'optimize' ? 'Optimize' : 'Execute'}</span>
          </button>
        )}
      </form>
    </div>
  );
};
