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
} from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      if (onForkProject) onForkProject();
      return;
    }
    if (!inputPrompt.trim() || isLoading) return;
    onExecuteCommand(inputPrompt);
    setInputPrompt('');
  };

  // Quick action suggestions based on current part type
  const getSuggestions = () => {
    switch (part.part_type) {
      case 'shaft':
        return [
          'Make total length 250 mm',
          'Increase main diameter to 40 mm',
          'Add 10 mm DIN keyway',
          'Set step 1 diameter to 25 mm',
          'Switch material to Stainless 316',
        ];
      case 'flange':
        return [
          'Change to 8 bolt holes',
          'Increase outer diameter to 150 mm',
          'Set inner bore to 60 mm',
          'Add 25 mm hub collar',
          'Switch to Aluminium 6061-T6',
        ];
      case 'bracket':
        return [
          'Increase wall thickness to 10 mm',
          'Make height 120 mm',
          'Set hole diameter to 12 mm',
          'Add 8 mm bend radius',
        ];
      case 'planetary_gearbox':
        return [
          'Set gear ratio to 20:1',
          'Change module to 2.5 mm',
          'Switch to EN19 Alloy Steel',
          'Increase ring diameter to 140 mm',
        ];
      case 'gear':
        return [
          'Increase tooth count to 32',
          'Change module to 3.0 mm',
          'Set face width to 30 mm',
        ];
      default:
        return [
          'Increase diameter to 60 mm',
          'Make height 150 mm',
          'Add 30 mm inner bore',
          'Add 5 mm chamfer',
        ];
    }
  };

  return (
    <div className="w-full bg-[#11171C] rounded-lg border border-[rgba(160,180,190,0.15)] p-3 space-y-2.5 shadow-xl text-[#F2F5F6]">
      {/* Clarification Alert Box if required */}
      {clarificationRequired && clarificationQuestion && (
        <div className="p-3 bg-[#161D22] border border-[#00D9FF]/40 rounded-lg flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          <HelpCircle className="w-4 h-4 text-[#00D9FF] shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <div className="font-bold text-[#F2F5F6] font-mono">
              Engineering Clarification Required:
            </div>
            <p className="text-[#AAB6BC] leading-relaxed font-sans">{clarificationQuestion}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                id="btn-clarify-nema17"
                onClick={() =>
                  onExecuteCommand(
                    'Design an L-shaped NEMA 17 motor bracket 42 mm wide, 60 mm high, 4 mm thick with 4x 3.5 mm mounting holes and center pilot hole.'
                  )
                }
                className="px-2.5 py-1 bg-[#1C252B] text-[#00D9FF] hover:bg-[#00D9FF] hover:text-[#0B0F12] border border-[#00D9FF]/30 font-bold rounded text-[11px] font-mono transition-all shadow-xs"
              >
                Use NEMA 17 Standard Mount
              </button>
              <button
                id="btn-clarify-nema23"
                onClick={() =>
                  onExecuteCommand(
                    'Design an L-shaped NEMA 23 motor bracket 60 mm wide, 80 mm high, 6 mm thick with 4x 5 mm mounting holes and 40 mm center pilot.'
                  )
                }
                className="px-2.5 py-1 bg-[#1C252B] text-[#00D9FF] hover:bg-[#00D9FF] hover:text-[#0B0F12] border border-[#00D9FF]/30 font-bold rounded text-[11px] font-mono transition-all shadow-xs"
              >
                Use NEMA 23 Standard Mount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: Pipeline Status & Reasoning Dropdown */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[#AAB6BC]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161D22] border border-[rgba(160,180,190,0.15)] text-[10px] text-[#00D9FF] font-bold uppercase tracking-wider">
            <Terminal className="w-3 h-3 text-[#00D9FF]" />
            <span>CAD Interpreter</span>
          </div>
          {part.stagePipeline && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#8B9AA3] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Pipeline: Parser → Validate → Feature Plan → 3D Mesh</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onOpenViraBot && (
            <button
              onClick={onOpenViraBot}
              className="flex items-center gap-1 text-[11px] text-[#00D9FF] hover:text-[#38E7FF] hover:underline font-mono font-bold"
            >
              <Bot className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Ask VIRA</span>
            </button>
          )}

          {part.reasoning && part.reasoning.length > 0 && (
            <button
              id="btn-toggle-reasoning"
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-[11px] text-[#8B9AA3] hover:text-[#F2F5F6] transition-colors"
            >
              <span>Reasoning ({part.reasoning.length})</span>
              {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Engineering Reasoning Panel */}
      {showReasoning && part.reasoning && (
        <div className="p-3 bg-[#161D22] rounded-lg border border-[rgba(160,180,190,0.15)] text-xs font-mono space-y-1.5 animate-in fade-in">
          <div className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest mb-1">
            CADVANTA Geometric Reasoning:
          </div>
          {part.reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[#AAB6BC]">
              <span className="text-[#00D9FF] font-bold">•</span>
              <span className="leading-relaxed font-sans">{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Conversational Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="input-ai-command"
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading || isViewOnly}
            placeholder={
              isViewOnly
                ? "🔒 View-Only Mode: Design prompt input is locked. Click 'Edit Copy' to modify."
                : "Modify design... (e.g. 'Make total length 250 mm', 'Add 8 mm keyway', 'Switch to IS 2062 Steel')"
            }
            className={`w-full bg-[#161D22] border border-[rgba(160,180,190,0.2)] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F2F5F6] placeholder:text-[#6F7C83] focus:outline-none focus:border-[#00D9FF] transition-all font-sans ${
              isViewOnly ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#00D9FF] text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-[#00D9FF]" />
              <span>Solving 3D CAD...</span>
            </div>
          )}
        </div>

        {isViewOnly ? (
          <button
            id="btn-ai-view-only-fork"
            type="button"
            onClick={onForkProject}
            className="px-4 py-2.5 bg-[#00F5A0] text-[#02140D] hover:bg-[#34EEA9] font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,245,160,0.25)] active:scale-95 shrink-0 font-mono cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Edit Copy</span>
          </button>
        ) : (
          <button
            id="btn-ai-generate"
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-[#00D9FF] text-[#0B0F12] hover:bg-[#38E7FF] disabled:opacity-40 disabled:hover:bg-[#00D9FF] font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,217,255,0.2)] active:scale-95 shrink-0 font-mono"
          >
            <Sparkles className="w-4 h-4" />
            <span>Execute</span>
          </button>
        )}
      </form>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs no-scrollbar">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B9AA3] flex items-center gap-1 shrink-0 font-bold">
          <Zap className="w-3 h-3 text-[#00D9FF]" />
          Quick:
        </span>
        {getSuggestions().map((sug, i) => (
          <button
            key={i}
            id={`btn-suggestion-${i}`}
            onClick={() => onExecuteCommand(sug)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 bg-[#161D22] hover:bg-[#1C252B] hover:border-[#00D9FF]/40 text-[#AAB6BC] hover:text-[#00D9FF] border border-[rgba(160,180,190,0.15)] rounded text-xs font-mono transition-all active:scale-95 shadow-xs"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
};
