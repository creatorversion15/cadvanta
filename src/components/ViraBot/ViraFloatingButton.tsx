import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface ViraFloatingButtonProps {
  onClick: () => void;
}

export const ViraFloatingButton: React.FC<ViraFloatingButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-20 lg:bottom-5 right-3 lg:right-5 z-30 lg:z-40 flex items-center gap-2">
      <button
        id="btn-open-vira-bot"
        onClick={onClick}
        className="group relative flex items-center gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-[#161D22] hover:bg-[#1C252B] border border-[#00D9FF]/40 text-[#F2F5F6] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(0,217,255,0.2)] transition-all duration-200 active:scale-95 cursor-pointer"
        title="Open VIRA Personalized AI Engineering Assistant"
      >
        <div className="w-6 h-6 rounded-full bg-[#00D9FF] text-[#0B0F12] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)] shrink-0">
          <Bot className="w-3.5 h-3.5 text-[#0B0F12]" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] sm:text-[11px] font-mono font-black tracking-wider leading-none text-[#F2F5F6]">
            VIRA AI BOT
          </span>
          <span className="text-[8px] font-mono text-[#00D9FF] leading-tight">
            by Viraj Bansod
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-[#00D9FF] animate-ping ml-0.5 shrink-0" />
      </button>
    </div>
  );
};
