import React from 'react';

export interface CadVantaLogoProps {
  /**
   * Display mode:
   * - 'icon': Just the 3D chrome 'C' with the faceted emerald green compass arrow
   * - 'wordmark': 3D icon + 'CADVANTA' with green facet in letter 'A'
   * - 'full': 3D icon + 'CADVANTA' wordmark + 'AI FOR BETTER DESIGNS' tagline
   */
  variant?: 'icon' | 'wordmark' | 'full';
  /**
   * Preset sizes or custom icon height in pixels:
   * - 'xs': 18px icon
   * - 'sm': 22px icon
   * - 'md': 30px icon
   * - 'lg': 40px icon
   * - 'xl': 56px icon
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Color theme: 'dark' for dark surfaces, 'light' for white surfaces, 'auto' adopts current text
   */
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  onClick?: () => void;
  showTagline?: boolean;
}

const SIZE_MAP = {
  xs: { iconSize: 18, fontSize: 'text-xs', gap: 'gap-1.5', taglineSize: 'text-[7px]' },
  sm: { iconSize: 22, fontSize: 'text-sm', gap: 'gap-2', taglineSize: 'text-[8px]' },
  md: { iconSize: 30, fontSize: 'text-lg', gap: 'gap-2.5', taglineSize: 'text-[9px]' },
  lg: { iconSize: 42, fontSize: 'text-2xl', gap: 'gap-3', taglineSize: 'text-[11px]' },
  xl: { iconSize: 58, fontSize: 'text-3xl', gap: 'gap-4', taglineSize: 'text-[13px]' },
};

/**
 * CadVantaLogoMark - High-precision vector emblem replicating the official CadVanta 3D brand logo:
 * - Dimensional chrome/silver sweeping 'C' with gradient shading and metallic rim
 * - Emerald green faceted compass arrowhead / prism pointing northeast at the core
 */
export const CadVantaLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 30,
  className = '',
}) => {
  const uniqueId = React.useId().replace(/:/g, '_');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="CadVanta Logo"
    >
      <defs>
        {/* Outer 3D Chrome C Gradient */}
        <linearGradient
          id={`chromeOuter_${uniqueId}`}
          x1="18"
          y1="10"
          x2="85"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="55%" stopColor="#CBD5E1" />
          <stop offset="78%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Inner Chrome Bevel / Shadow Gradient */}
        <linearGradient
          id={`chromeInner_${uniqueId}`}
          x1="45"
          y1="25"
          x2="75"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#94A3B8" />
          <stop offset="85%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Bottom Fold Shadow for 3D Curve */}
        <linearGradient
          id={`foldShadow_${uniqueId}`}
          x1="40"
          y1="55"
          x2="55"
          y2="75"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0F172A" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#334155" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#64748B" stopOpacity="0" />
        </linearGradient>

        {/* Emerald Core - Top Facet (Bright Highlight) */}
        <linearGradient
          id={`emeraldTop_${uniqueId}`}
          x1="44"
          y1="40"
          x2="68"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="40%" stopColor="#00F5A0" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Emerald Core - Right Lower Facet (Teal Depth) */}
        <linearGradient
          id={`emeraldRight_${uniqueId}`}
          x1="55"
          y1="40"
          x2="55"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>

        {/* Emerald Core - Left Bottom Facet (Dark Shaded) */}
        <linearGradient
          id={`emeraldBottom_${uniqueId}`}
          x1="44"
          y1="44"
          x2="54"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>

        {/* Soft Drop Glow */}
        <filter id={`emeraldGlow_${uniqueId}`} x="30" y="20" width="45" height="45" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#00F5A0" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 1. Main Sculpted Chrome Letter 'C' */}
      <path
        d="M 64 22 
           C 54 13, 36 14, 26 25 
           C 14 38, 14 62, 26 75 
           C 37 87, 56 87, 68 76 
           C 71 73, 71 72, 63 64 
           C 54 73, 41 73, 34 65 
           C 27 57, 27 43, 34 35 
           C 41 27, 54 27, 63 34 
           Z"
        fill={`url(#chromeOuter_${uniqueId})`}
      />

      {/* 2. Top-right terminal of C (Sharp 3D bevel cut) */}
      <path
        d="M 63 34
           L 73 24
           C 66 18, 56 14, 46 14
           C 30 14, 18 26, 18 42
           L 27 42
           C 27 31, 35 23, 46 23
           C 53 23, 59 27, 63 34
           Z"
        fill={`url(#chromeInner_${uniqueId})`}
        opacity="0.9"
      />

      {/* 3. Lower 3D Fold Transition (reproducing the iconic twisting fold of the official logo) */}
      <path
        d="M 34 65 
           C 40 72, 52 72, 60 65 
           L 68 76 
           C 55 87, 37 86, 26 75 
           L 34 65 
           Z"
        fill={`url(#foldShadow_${uniqueId})`}
      />

      {/* 4. Chrome Highlight Rim (Specular lighting on upper ridge) */}
      <path
        d="M 28 26
           C 37 17, 52 16, 62 23
           L 60 25
           C 51 19, 38 20, 30 28
           C 21 37, 20 54, 26 67
           L 24 69
           C 17 55, 18 36, 28 26
           Z"
        fill="#FFFFFF"
        opacity="0.75"
      />

      {/* 5. Central 3D Faceted Emerald Compass Arrowhead (Pointing northeast) */}
      <g filter={`url(#emeraldGlow_${uniqueId})`}>
        {/* Top Highlight Facet */}
        <path
          d="M 44 42
             L 70 32
             L 54 44
             Z"
          fill={`url(#emeraldTop_${uniqueId})`}
        />

        {/* Right Under Facet */}
        <path
          d="M 70 32
             L 54 53
             L 54 44
             Z"
          fill={`url(#emeraldRight_${uniqueId})`}
        />

        {/* Bottom Left Triangular Facet */}
        <path
          d="M 44 42
             L 54 44
             L 54 53
             Z"
          fill={`url(#emeraldBottom_${uniqueId})`}
        />

        {/* Sharp Center Ridge Highlight Line */}
        <line
          x1="54"
          y1="44"
          x2="70"
          y2="32"
          stroke="#A7F3D0"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * CadVantaWordmark - The official high-tech geometric CADVANTA wordmark:
 * Features crisp geometric typography with the iconic emerald triangle inside the 'A'
 */
export const CadVantaWordmark: React.FC<{
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}> = ({ theme = 'auto', className = '' }) => {
  const isLight = theme === 'light';
  const textColor = isLight ? 'text-[#0F172A]' : 'text-[#F0FDF4]';

  return (
    <div className={`flex items-baseline font-sans font-black tracking-wider uppercase ${textColor} ${className}`}>
      <span>C</span>
      {/* First 'A' with embedded emerald triangle counter */}
      <span className="relative inline-flex items-center justify-center">
        <span>A</span>
        <span
          className="absolute w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#00F5A0] pointer-events-none"
          style={{ bottom: '26%' }}
          aria-hidden="true"
        />
      </span>
      <span>D</span>
      <span className="text-[#00F5A0]">V</span>
      <span>A</span>
      <span>N</span>
      <span>T</span>
      <span>A</span>
    </div>
  );
};

/**
 * CadVantaLogo - The complete official CadVanta brand identity component
 */
export const CadVantaLogo: React.FC<CadVantaLogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  theme = 'auto',
  className = '',
  onClick,
  showTagline = false,
}) => {
  const sizeConfig = typeof size === 'number' ? null : SIZE_MAP[size];
  const pixelSize = typeof size === 'number' ? size : sizeConfig?.iconSize || 30;
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => (e.key === 'Enter' || e.key === ' ' ? onClick?.() : undefined) : undefined}
      className={`inline-flex items-center ${sizeConfig?.gap || 'gap-2.5'} select-none transition-opacity ${
        isInteractive ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
      title="CADVANTA | AI for Better Mechanical Designs"
    >
      {/* 3D Chrome + Emerald Emblem Mark */}
      <CadVantaLogoMark size={pixelSize} />

      {/* Wordmark and Tagline */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`${sizeConfig?.fontSize || 'text-lg'} font-sans font-black tracking-tight`}>
            <CadVantaWordmark theme={theme} />
          </div>

          {(variant === 'full' || showTagline) && (
            <span
              className={`${
                sizeConfig?.taglineSize || 'text-[9px]'
              } font-sans font-semibold tracking-[0.24em] uppercase text-[#8CA89E] mt-0.5 whitespace-nowrap`}
            >
              AI FOR BETTER DESIGNS
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CadVantaLogo;
