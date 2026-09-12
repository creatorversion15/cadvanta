import React, { useRef } from 'react';
import { CADPart } from '../../types/cad';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface TechnicalDrawingModalProps {
  part: CADPart;
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalDrawingModal: React.FC<TechnicalDrawingModalProps> = ({
  part,
  isOpen,
  onClose,
}) => {
  const drawingRef = useRef<SVGSVGElement | null>(null);

  if (!isOpen) return null;

  const params = part.parameters;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const downloadSVG = () => {
    if (!drawingRef.current) return;
    const svgData = new XMLSerializer().serializeToString(drawingRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${part.name.replace(/[^a-zA-Z0-9]/g, '_')}_drawing.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printDrawing = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-black" />
            <h3 className="font-bold text-black font-mono text-xs uppercase tracking-wide">
              CADVANTA 2D Engineering Blueprint — {part.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-drawing"
              onClick={printDrawing}
              className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 text-black rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              id="btn-download-drawing-svg"
              onClick={downloadSVG}
              className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SVG</span>
            </button>
            <button
              id="btn-close-drawing"
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Blueprint Canvas Viewport (High-Contrast White Paper & Black Technical Drawing) */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-100 flex items-center justify-center">
          <div className="w-[880px] bg-white border-2 border-black p-5 shadow-xl rounded-lg text-black font-mono select-none">
            {/* SVG Engineering Blueprint */}
            <svg
              ref={drawingRef}
              viewBox="0 0 840 540"
              className="w-full h-auto bg-white border-2 border-black"
            >
              {/* Outer Border & Grid Lines */}
              <rect x="15" y="15" width="810" height="510" fill="none" stroke="#000000" strokeWidth="2" />
              <rect x="22" y="22" width="796" height="496" fill="none" stroke="#71717a" strokeWidth="0.75" />

              {/* Title Block (Bottom Right) */}
              <g transform="translate(460, 410)">
                <rect x="0" y="0" width="360" height="110" fill="#f4f4f5" stroke="#000000" strokeWidth="1.5" />
                <line x1="0" y1="28" x2="360" y2="28" stroke="#71717a" strokeWidth="1" />
                <line x1="0" y1="56" x2="360" y2="56" stroke="#71717a" strokeWidth="1" />
                <line x1="0" y1="84" x2="360" y2="84" stroke="#71717a" strokeWidth="1" />
                <line x1="180" y1="28" x2="180" y2="110" stroke="#71717a" strokeWidth="1" />

                <text x="10" y="19" fill="#000000" fontSize="12" fontWeight="bold">
                  CADVANTA — PARAMETRIC CAD PLATFORM
                </text>
                <text x="10" y="46" fill="#52525b" fontSize="9">
                  PART NAME:
                </text>
                <text x="75" y="46" fill="#000000" fontSize="10" fontWeight="bold">
                  {part.name.substring(0, 20)}
                </text>

                <text x="10" y="73" fill="#52525b" fontSize="9">
                  MATERIAL:
                </text>
                <text x="75" y="73" fill="#000000" fontSize="10">
                  {part.material.name.substring(0, 15)}
                </text>

                <text x="10" y="100" fill="#52525b" fontSize="9">
                  LEAD MAKER:
                </text>
                <text x="80" y="100" fill="#000000" fontSize="10" fontWeight="bold">
                  VIRAJ BANSOD
                </text>

                <text x="190" y="46" fill="#52525b" fontSize="9">
                  UNITS / SCALE:
                </text>
                <text x="270" y="46" fill="#000000" fontSize="10">
                  {part.units.toUpperCase()} (1:1)
                </text>

                <text x="190" y="73" fill="#52525b" fontSize="9">
                  DATE:
                </text>
                <text x="235" y="73" fill="#000000" fontSize="10">
                  {dateStr}
                </text>

                <text x="190" y="100" fill="#52525b" fontSize="9">
                  TOLERANCE:
                </text>
                <text x="260" y="100" fill="#000000" fontSize="10" fontWeight="bold">
                  IS 2102 / ISO 2768-m
                </text>
              </g>

              {/* View 1: FRONT ELEVATION */}
              <g transform="translate(80, 60)">
                <text x="0" y="0" fill="#000000" fontSize="12" fontWeight="bold">
                  VIEW A — FRONT ELEVATION
                </text>

                {/* Centerline */}
                <line x1="-20" y1="130" x2="320" y2="130" stroke="#71717a" strokeWidth="0.8" strokeDasharray="12,3,2,3" />

                {/* Geometric outline drawing based on part */}
                {part.part_type === 'shaft' && (
                  <g transform="translate(0, 70)">
                    {/* Main Section */}
                    <rect x="80" y="20" width="180" height="80" fill="#e4e4e7" stroke="#000000" strokeWidth="1.5" />
                    {/* Step Section */}
                    <rect x="0" y="35" width="80" height="50" fill="#e4e4e7" stroke="#000000" strokeWidth="1.5" />
                    {/* Keyway */}
                    <rect x="120" y="20" width="60" height="15" fill="#ffffff" stroke="#71717a" strokeWidth="1" strokeDasharray="3,2" />

                    {/* Dimension Leader Lines */}
                    {/* Total Length */}
                    <line x1="0" y1="-25" x2="260" y2="-25" stroke="#000000" strokeWidth="1" />
                    <line x1="0" y1="-30" x2="0" y2="35" stroke="#71717a" strokeWidth="0.5" />
                    <line x1="260" y1="-30" x2="260" y2="20" stroke="#71717a" strokeWidth="0.5" />
                    <text x="110" y="-30" fill="#000000" fontSize="11" fontWeight="bold">
                      {params.total_length || 200} mm
                    </text>

                    {/* Step 1 Length */}
                    <line x1="0" y1="115" x2="80" y2="115" stroke="#000000" strokeWidth="1" />
                    <line x1="0" y1="85" x2="0" y2="120" stroke="#71717a" strokeWidth="0.5" />
                    <line x1="80" y1="85" x2="80" y2="120" stroke="#71717a" strokeWidth="0.5" />
                    <text x="25" y="130" fill="#000000" fontSize="10">
                      {params.step1_length || 50} mm
                    </text>

                    {/* Main Diameter */}
                    <line x1="280" y1="20" x2="280" y2="100" stroke="#000000" strokeWidth="1" />
                    <text x="290" y="65" fill="#000000" fontSize="10" fontWeight="bold">
                      Ø{params.main_diameter || 30}
                    </text>
                  </g>
                )}

                {part.part_type === 'flange' && (
                  <g transform="translate(40, 50)">
                    {/* Flange Front View (Cross Section) */}
                    <rect x="0" y="40" width="220" height="35" fill="#e4e4e7" stroke="#000000" strokeWidth="1.5" />
                    {/* Center Bore Cutout */}
                    <rect x="65" y="40" width="90" height="35" fill="#ffffff" stroke="#71717a" strokeWidth="1" />
                    {/* Bolt Holes */}
                    <rect x="25" y="40" width="15" height="35" fill="#ffffff" stroke="#71717a" strokeWidth="1" strokeDasharray="3,2" />
                    <rect x="180" y="40" width="15" height="35" fill="#ffffff" stroke="#71717a" strokeWidth="1" strokeDasharray="3,2" />

                    {/* Dimensions */}
                    <line x1="0" y1="15" x2="220" y2="15" stroke="#000000" strokeWidth="1" />
                    <text x="90" y="10" fill="#000000" fontSize="11" fontWeight="bold">
                      Ø{params.outer_diameter || 120} mm
                    </text>
                    <text x="85" y="62" fill="#52525b" fontSize="10">
                      Ø{params.inner_diameter || 50} BORE
                    </text>
                  </g>
                )}

                {part.part_type !== 'shaft' && part.part_type !== 'flange' && (
                  <g transform="translate(30, 60)">
                    <rect x="0" y="0" width="200" height="120" fill="#e4e4e7" stroke="#000000" strokeWidth="1.5" rx="6" />
                    <circle cx="100" cy="60" r="30" fill="#ffffff" stroke="#71717a" strokeWidth="1" />
                    <text x="75" y="64" fill="#000000" fontSize="10" fontWeight="bold">
                      Ø30 mm
                    </text>
                  </g>
                )}
              </g>

              {/* View 2: RIGHT / PLAN VIEW */}
              <g transform="translate(480, 60)">
                <text x="0" y="0" fill="#000000" fontSize="12" fontWeight="bold">
                  VIEW B — TOP / SECTION VIEW
                </text>

                {/* Circular Profile Projection */}
                <g transform="translate(130, 130)">
                  <circle cx="0" cy="0" r="85" fill="#e4e4e7" stroke="#000000" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="45" fill="#ffffff" stroke="#71717a" strokeWidth="1" />
                  {/* Bolt Circle (PCD) */}
                  <circle cx="0" cy="0" r="65" fill="none" stroke="#71717a" strokeWidth="0.8" strokeDasharray="8,3" />

                  {/* PCD Bolt Holes */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={i}
                        cx={Math.cos(rad) * 65}
                        cy={Math.sin(rad) * 65}
                        r="6"
                        fill="#ffffff"
                        stroke="#000000"
                        strokeWidth="1"
                      />
                    );
                  })}

                  <line x1="-100" y1="0" x2="100" y2="0" stroke="#71717a" strokeWidth="0.8" strokeDasharray="8,3" />
                  <line x1="0" y1="-100" x2="0" y2="100" stroke="#71717a" strokeWidth="0.8" strokeDasharray="8,3" />

                  <text x="-50" y="115" fill="#52525b" fontSize="10" fontWeight="bold">
                    PCD Ø{params.pitch_circle_diameter || 90} mm (IS 1538)
                  </text>
                </g>
              </g>

              {/* View 3: ISOMETRIC WIREFRAME THUMBNAIL */}
              <g transform="translate(80, 340)">
                <text x="0" y="0" fill="#000000" fontSize="11" fontWeight="bold">
                  ISOMETRIC PROJECTION
                </text>
                <g transform="translate(100, 70)">
                  <polygon
                    points="0,-40 60,-10 60,40 0,70 -60,40 -60,-10"
                    fill="#e4e4e7"
                    stroke="#000000"
                    strokeWidth="1.2"
                  />
                  <line x1="0" y1="-40" x2="0" y2="70" stroke="#000000" strokeWidth="1" />
                  <line x1="0" y1="15" x2="60" y2="-10" stroke="#000000" strokeWidth="1" />
                  <line x1="0" y1="15" x2="-60" y2="-10" stroke="#000000" strokeWidth="1" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
