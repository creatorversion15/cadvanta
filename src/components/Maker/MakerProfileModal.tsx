import React from 'react';
import { CadVantaLogo, CadVantaLogoMark } from '../Brand/CadVantaLogo';
import {
  X,
  Linkedin,
  Instagram,
  Github,
  ExternalLink,
  Sparkles,
  Award,
  Cpu,
  Boxes,
  CheckCircle2,
  Copy,
  Compass,
  Zap,
} from 'lucide-react';

interface MakerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MakerProfileModal: React.FC<MakerProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/viraj-bansod-46940129a',
      handle: 'viraj-bansod-46940129a',
      icon: Linkedin,
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/virajbansod1',
      handle: '@virajbansod1',
      icon: Instagram,
    },
    {
      name: 'GitHub',
      url: 'https://github.com/creatorversion15',
      handle: 'creatorversion15',
      icon: Github,
    },
  ];

  const handleCopy = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#F0FDF4]">
        {/* Header with technical emerald accent */}
        <div className="p-4 bg-[#0B1E17] border-b border-[rgba(16,185,129,0.18)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold text-xs font-mono shadow-[0_0_8px_rgba(0,245,160,0.2)]">
              VB
            </div>
            <div>
              <span className="font-bold text-[#F0FDF4] font-mono text-xs uppercase tracking-wider block leading-tight">
                Founder Profile
              </span>
              <span className="text-[10px] text-[#8CA89E] font-mono">
                CADVANTA Architect
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Main Founder Bio Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Precision CAD Emblem with Mint Glow (No founder image, geometric crest only) */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl p-0.5 shadow-xl bg-gradient-to-tr from-[#00F5A0] via-[#102B21] to-[#071510]">
                <div className="w-full h-full rounded-2xl border-2 border-[#071510] bg-[#0B1E17] flex flex-col items-center justify-center relative overflow-hidden p-2">
                  {/* Subtle Grid Reticle in background */}
                  <div className="absolute inset-0 bg-cad-grid opacity-30 pointer-events-none" />
                  <CadVantaLogoMark size={50} className="mb-0.5" />
                  <span className="font-mono font-black text-[11px] text-[#F0FDF4] tracking-wider">
                    CAD<span className="text-[#00F5A0]">VANTA</span>
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#00F5A0] text-[#02140D] p-1 rounded-full shadow-[0_0_8px_rgba(0,245,160,0.4)]">
                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h2 className="text-2xl font-extrabold text-[#F0FDF4] font-sans tracking-tight">
                  Viraj Bansod
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/30 font-bold tracking-wider self-center sm:self-auto">
                  Founder
                </span>
              </div>
              <p className="text-xs text-[#00F5A0] font-mono font-medium">
                Mechanical Engineering Student
              </p>
              <p className="text-xs text-[#8CA89E] font-sans leading-relaxed pt-1">
                Founder and architect behind <strong className="text-[#F0FDF4]">CADVANTA</strong> and the <strong className="text-[#00F5A0]">VIRA</strong> engineering assistant. Passionate about mechanical design, 3D CAD, product development, and engineering automation.
              </p>
            </div>
          </div>

          {/* Project Identity Spotlight */}
          <div className="p-4 bg-[#0B1E17] border border-[rgba(16,185,129,0.18)] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.12)] pb-2.5">
              <CadVantaLogo variant="full" size="md" showTagline />
              <span className="text-[10px] font-mono text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-0.5 rounded border border-[#00F5A0]/20 hidden sm:inline-block">
                AI Mechanical CAD
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-[#00F5A0] font-mono italic text-[11px]">
                “From Engineering Idea to Intelligent Design.”
              </div>
              <p className="text-[#8CA89E] font-sans leading-relaxed text-[11px]">
                CADVANTA helps mechanical engineers and students turn natural-language requirements into 3D CAD models, engineering drawings, calculations, design analysis and manufacturing-ready concepts.
              </p>
            </div>
          </div>

          {/* Social Links List */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#8CA89E] font-bold tracking-wider">
              Connect with Viraj Bansod
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <div
                    key={link.name}
                    className="p-3 bg-[#0B1E17] border border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/50 rounded-lg flex items-center justify-between transition-all group hover:bg-[#102B21]"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="p-2 rounded bg-[#102B21] border border-[rgba(16,185,129,0.22)] text-[#00F5A0] group-hover:border-[#00F5A0]/40 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#F0FDF4] font-mono flex items-center gap-1.5">
                          <span>{link.name}</span>
                          <ExternalLink className="w-3 h-3 text-[#4E6B60] group-hover:text-[#00F5A0] transition-colors" />
                        </div>
                        <div className="text-[11px] text-[#8CA89E] truncate font-sans">
                          {link.url}
                        </div>
                      </div>
                    </a>

                    <button
                      onClick={() => handleCopy(link.url, link.name)}
                      className="p-2 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#071510] rounded transition-colors text-xs font-mono ml-2 shrink-0 flex items-center gap-1 border border-transparent hover:border-[rgba(16,185,129,0.18)]"
                      title="Copy URL"
                    >
                      {copiedLink === link.name ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                          <span className="text-[10px] text-[#00F5A0] font-bold">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Highlights Grid */}
          <div className="p-3.5 bg-[#0B1E17] border border-[rgba(16,185,129,0.18)] rounded-lg space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#8CA89E] font-bold tracking-wider">
              Engineering Pillars & Focus Areas
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#F0FDF4]">
              <div className="flex items-center gap-2 p-2 bg-[#102B21] rounded border border-[rgba(16,185,129,0.18)]">
                <Boxes className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                <span className="text-[11px]">Parametric 3D CAD</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#102B21] rounded border border-[rgba(16,185,129,0.18)]">
                <Sparkles className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                <span className="text-[11px]">VIRA AI Assistant</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#102B21] rounded border border-[rgba(16,185,129,0.18)]">
                <Cpu className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                <span className="text-[11px]">Mechanical Design</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#102B21] rounded border border-[rgba(16,185,129,0.18)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                <span className="text-[11px]">Engineering Automation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#0B1E17] border-t border-[rgba(16,185,129,0.18)] flex items-center justify-between text-[11px] font-mono text-[#8CA89E]">
          <span>CADVANTA • Built by Viraj Bansod</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold rounded text-xs transition-all uppercase tracking-wider shadow-[0_0_12px_rgba(0,245,160,0.25)] active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
