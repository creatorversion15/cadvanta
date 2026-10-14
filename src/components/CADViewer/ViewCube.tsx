import React, { useState } from 'react';
import { CameraView } from '../../types/cad';
import { Compass, RotateCw } from 'lucide-react';

interface ViewCubeProps {
  onSelectView: (view: CameraView) => void;
  currentView?: CameraView;
  onRotateCamera?: (dir: 'left' | 'right' | 'up' | 'down') => void;
}

export const ViewCube: React.FC<ViewCubeProps> = ({
  onSelectView,
  currentView = 'iso',
  onRotateCamera,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <div className="absolute top-3 right-3 z-20 select-none hidden md:flex flex-col items-center pointer-events-auto font-sans">
      {/* 3D Isometric ViewCube Widget */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Compass Ring Base */}
        <div className="absolute inset-0 rounded-full border border-[#CBD5E1] bg-white/90 backdrop-blur-md flex items-center justify-center pointer-events-none shadow-md">
          <span className="absolute top-1 text-[9px] font-mono font-bold text-[#059669]">N</span>
          <span className="absolute bottom-1 text-[9px] font-mono font-bold text-[#64748B]">S</span>
          <span className="absolute right-1 text-[9px] font-mono font-bold text-[#64748B]">E</span>
          <span className="absolute left-1 text-[9px] font-mono font-bold text-[#64748B]">W</span>
        </div>

        {/* Isometric 3D Cube (CSS 3D projection) */}
        <div
          className="relative w-14 h-14 sm:w-16 sm:h-16"
          style={{
            perspective: '400px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          <div
            className="w-full h-full relative"
            style={{
              transformStyle: 'preserve-3d',
              transform:
                currentView === 'front'
                  ? 'rotateX(0deg) rotateY(0deg)'
                  : currentView === 'back'
                  ? 'rotateX(0deg) rotateY(180deg)'
                  : currentView === 'top'
                  ? 'rotateX(-90deg) rotateY(0deg)'
                  : currentView === 'bottom'
                  ? 'rotateX(90deg) rotateY(0deg)'
                  : currentView === 'right'
                  ? 'rotateX(0deg) rotateY(-90deg)'
                  : currentView === 'left'
                  ? 'rotateX(0deg) rotateY(90deg)'
                  : 'rotateX(-28deg) rotateY(38deg)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* FRONT FACE */}
            <div
              onClick={() => onSelectView('front')}
              onMouseEnter={() => setHoveredZone('FRONT')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'front'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'FRONT'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'translateZ(28px)',
              }}
              title="View Front (XZ Plane)"
            >
              FRONT
            </div>

            {/* BACK FACE */}
            <div
              onClick={() => onSelectView('back')}
              onMouseEnter={() => setHoveredZone('BACK')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'back'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'BACK'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'rotateY(180deg) translateZ(28px)',
              }}
              title="View Back"
            >
              BACK
            </div>

            {/* TOP FACE */}
            <div
              onClick={() => onSelectView('top')}
              onMouseEnter={() => setHoveredZone('TOP')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'top'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'TOP'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'rotateX(90deg) translateZ(28px)',
              }}
              title="View Top (XY Plane)"
            >
              TOP
            </div>

            {/* BOTTOM FACE */}
            <div
              onClick={() => onSelectView('bottom')}
              onMouseEnter={() => setHoveredZone('BOTTOM')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'bottom'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'BOTTOM'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'rotateX(-90deg) translateZ(28px)',
              }}
              title="View Bottom"
            >
              BTM
            </div>

            {/* RIGHT FACE */}
            <div
              onClick={() => onSelectView('right')}
              onMouseEnter={() => setHoveredZone('RIGHT')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'right'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'RIGHT'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'rotateY(90deg) translateZ(28px)',
              }}
              title="View Right (YZ Plane)"
            >
              RIGHT
            </div>

            {/* LEFT FACE */}
            <div
              onClick={() => onSelectView('left')}
              onMouseEnter={() => setHoveredZone('LEFT')}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute inset-0 border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] cursor-pointer transition-colors shadow-xs ${
                currentView === 'left'
                  ? 'bg-[#059669] text-white'
                  : hoveredZone === 'LEFT'
                  ? 'bg-[#ECFDF5] text-[#059669]'
                  : 'bg-white/95 text-[#0F172A]'
              }`}
              style={{
                transform: 'rotateY(-90deg) translateZ(28px)',
              }}
              title="View Left"
            >
              LEFT
            </div>
          </div>
        </div>
      </div>

      {/* Camera Rotation & Home View Quick Ribbon */}
      <div className="flex items-center gap-1 mt-1 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#CBD5E1] shadow-xs text-[10px] font-mono">
        <button
          type="button"
          onClick={() => onSelectView('iso')}
          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
            currentView === 'iso'
              ? 'bg-[#059669] text-white'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
          }`}
          title="Isometric Standard Engineering View"
        >
          ISO
        </button>
        {onRotateCamera && (
          <>
            <span className="text-[#CBD5E1]">|</span>
            <button
              type="button"
              onClick={() => onRotateCamera('left')}
              className="p-1 text-[#475569] hover:text-[#059669] hover:bg-[#F1F5F9] rounded cursor-pointer"
              title="Rotate Camera 45° Left"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={() => onRotateCamera('right')}
              className="p-1 text-[#475569] hover:text-[#059669] hover:bg-[#F1F5F9] rounded cursor-pointer"
              title="Rotate Camera 45° Right"
            >
              ↷
            </button>
          </>
        )}
      </div>
    </div>
  );
};
