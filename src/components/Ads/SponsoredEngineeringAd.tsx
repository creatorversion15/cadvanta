import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ExternalLink,
  Shield,
  Sparkles,
  Layers,
  Cpu,
  Lock,
  ArrowRight,
  Boxes,
  Zap,
} from 'lucide-react';

export interface SponsoredAdItem {
  id: string;
  title: string;
  sponsor: string;
  tag: string;
  description: string;
  actionText: string;
  linkPrompt?: string;
  isProtected?: boolean;
}

export const SPONSORED_ADS: SponsoredAdItem[] = [
  {
    id: 'ad_ansys_fea',
    title: 'Ansys FEA Von-Mises Non-Linear Stress Solver Integration',
    sponsor: 'Engineering Simulation Partner',
    tag: 'Advanced FEA',
    description: 'Directly couple CADVANTA parametric 3D B-Rep geometries with high-order tetrahedral mesh stress solvers for fatigue and cyclic load prediction.',
    actionText: 'Access Advanced FEA Pipeline',
    linkPrompt: 'Coupled Ansys FEA Von Mises stress validation on high-speed rotor shaft',
    isProtected: true,
  },
  {
    id: 'ad_haas_cnc',
    title: '5-Axis High-Speed CNC Toolpath & G-Code Generator',
    sponsor: 'Precision Manufacturing',
    tag: 'CAM Milling',
    description: 'Generate optimized ISO 6983 G-code toolpaths for multi-axis CNC milling centers with automatic ball-nose cutter compensation.',
    actionText: 'Unlock CAM Toolpath Suite',
    linkPrompt: 'Generate 5-axis CNC G-Code toolpath for turbine blisk impeller milling',
    isProtected: true,
  },
  {
    id: 'ad_bosch_rexroth',
    title: 'Bosch Rexroth Industrial Hydro-Mechanical Power Packs',
    sponsor: 'Fluid Power Alliance',
    tag: 'Power Systems',
    description: 'Parametric sizing calculation and ISO hydraulic schematics for high-pressure axial piston pumps and servo proportional valves.',
    actionText: 'Inspect Hydraulic Specifications',
    linkPrompt: 'Design high-pressure hydraulic manifold block with SAE flange ports',
    isProtected: true,
  },
];

interface SponsoredEngineeringAdProps {
  onSelectAction?: (prompt: string) => void;
}

export const SponsoredEngineeringAd: React.FC<SponsoredEngineeringAdProps> = ({ onSelectAction }) => {
  const { user, requireAuth } = useAuth();

  const handleAdClick = (ad: SponsoredAdItem) => {
    // Check if protected and enforce authentication requirement
    if (ad.isProtected) {
      requireAuth(
        () => {
          if (onSelectAction && ad.linkPrompt) {
            onSelectAction(ad.linkPrompt);
          }
        },
        {
          title: 'Sign in to Access Partner Engineering Content',
          subtitle: `Sign in to access ${ad.title} (${ad.sponsor}).`,
        }
      );
    } else {
      if (onSelectAction && ad.linkPrompt) {
        onSelectAction(ad.linkPrompt);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mt-12 space-y-4 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00F5A0] shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold font-mono text-[#F0FDF4] uppercase tracking-wider">
            Sponsored Industry Solutions & Protected Partner Portals
          </h2>
        </div>
        <span className="self-start sm:self-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#102B21] border border-[#00F5A0]/30 text-[#00F5A0] shrink-0">
          Verified Industry Content
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {SPONSORED_ADS.map((ad) => (
          <div
            key={ad.id}
            id={`sponsored-ad-${ad.id}`}
            onClick={() => handleAdClick(ad)}
            className="group p-4 bg-[#071510] hover:bg-[#0B1E17] border border-[rgba(16,185,129,0.22)] hover:border-[#00F5A0]/60 rounded-xl transition-all duration-200 shadow-lg flex flex-col justify-between cursor-pointer relative overflow-hidden active:scale-99"
          >
            {/* Top Tag & Sponsor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[#102B21] border border-[#00F5A0]/30 text-[#00F5A0] font-bold">
                  {ad.tag}
                </span>
                <div className="flex items-center gap-1">
                  {ad.isProtected && !user && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1C2521] text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-0.5 font-bold">
                      <Lock className="w-2.5 h-2.5" />
                      <span>SIGN-IN REQUIRED</span>
                    </span>
                  )}
                  {user && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                      UNLOCKED
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#8CA89E] tracking-tight">
                {ad.sponsor}
              </div>

              <h3 className="font-bold text-[#F0FDF4] text-xs sm:text-sm font-mono leading-snug group-hover:text-[#00F5A0] transition-colors">
                {ad.title}
              </h3>

              <p className="text-xs text-[#8CA89E] font-sans line-clamp-3 leading-relaxed">
                {ad.description}
              </p>
            </div>

            {/* Bottom Trigger Action */}
            <div className="mt-4 pt-2.5 border-t border-[rgba(16,185,129,0.12)] flex items-center justify-between text-xs font-mono">
              <span className="text-[#00F5A0] font-bold flex items-center gap-1 group-hover:underline">
                <span>{ad.actionText}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#4E6B60] group-hover:text-[#00F5A0]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
