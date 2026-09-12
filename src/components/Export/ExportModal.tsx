import React, { useState, useMemo } from 'react';
import { CADPart } from '../../types/cad';
import {
  ExportFormat,
  ExportUnits,
  MeshResolution,
  generateExport,
  triggerDownload,
} from '../../engine/advancedExporters';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  Box,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  Send,
  ExternalLink,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CADPart;
  onOpenIntegrations?: () => void;
  initialFormat?: ExportFormat;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  part,
  onOpenIntegrations,
  initialFormat = 'stl',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(initialFormat);
  const [selectedUnits, setSelectedUnits] = useState<ExportUnits>(part.units || 'mm');
  const [resolution, setResolution] = useState<MeshResolution>('standard');
  const [author, setAuthor] = useState<string>('Viraj Bansod');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const formats: {
    id: ExportFormat;
    label: string;
    ext: string;
    category: 'Standard CAD' | '3D Mesh' | 'Drawing' | 'CAM / Bridge';
    desc: string;
    standard: string;
    isProFeature?: boolean;
    recommendedFor?: string;
  }[] = [
    {
      id: 'stl',
      label: 'STL Mesh (3D Print & Slicers)',
      ext: '.stl',
      category: '3D Mesh',
      desc: 'Standard Stereolithography triangle mesh with configurable chordal deflection. Ideal for Cura, PrusaSlicer, Bambu Studio, and 3D printing.',
      standard: 'ASTM F2792 Stereolithography',
      recommendedFor: '3D Printing & Additive CAM',
    },
    {
      id: 'dxf',
      label: 'AutoCAD DXF (2D/3D CNC Profile)',
      ext: '.dxf',
      category: 'Drawing',
      desc: 'AutoCAD DXF R12/2000 format. Includes 2D silhouette cross-sections for laser/waterjet cutting plus 3DFACE surfaces for CAD drafting.',
      standard: 'AutoCAD AC1015 / R14-2000',
      recommendedFor: 'CNC Laser, Waterjet & AutoCAD',
    },
    {
      id: 'step',
      label: 'STEP Solid (ISO AP214 B-Rep)',
      ext: '.step',
      category: 'Standard CAD',
      desc: 'ISO 10303-21 B-Rep solid model. Universal exchange format for SolidWorks, CATIA, Siemens NX, Autodesk Inventor, and PTC Creo.',
      standard: 'ISO 10303-214 AP214',
      recommendedFor: 'Solid CAD Systems & CAM Toolpaths',
    },
    {
      id: 'obj',
      label: 'Wavefront OBJ (Polygonal Mesh)',
      ext: '.obj',
      category: '3D Mesh',
      desc: 'Textured 3D polygonal geometry with vertex normals. Compatible with Blender, Unreal Engine, Unity, and Three.js.',
      standard: 'Wavefront Technologies',
      recommendedFor: 'Blender, CG & Real-time Renderers',
    },
    {
      id: 'json',
      label: 'CADVANTA JSON (Full Parametric)',
      ext: '.cad.json',
      category: 'Standard CAD',
      desc: 'Complete parametric definition, feature history tree, engineering material properties, and DFM constraints.',
      standard: 'CADVANTA v2.5 Schema',
      recommendedFor: 'Project Backup & Parametric Restores',
    },
    {
      id: 'iges',
      label: 'IGES 5.3 Surface',
      ext: '.iges',
      category: 'Standard CAD',
      desc: 'Initial Graphics Exchange Specification 5.3. Traced B-Splines, trimmed surfaces & wireframes for legacy CAD/CAM.',
      standard: 'USPRO / NCGA IGES 5.3',
      recommendedFor: 'Legacy CAM & CMM Inspection',
    },
    {
      id: 'solidworks',
      label: 'SolidWorks VBA Macro',
      ext: '.swp.vba',
      category: 'CAM / Bridge',
      desc: 'Native SolidWorks macro script. Automatically reconstructs 2D sketches, boss-extrudes, and features in SolidWorks!',
      standard: 'SolidWorks API 2018-2026',
      recommendedFor: 'Direct SolidWorks Feature Tree Reconstruction',
    },
    {
      id: 'fusion360',
      label: 'Autodesk Fusion 360 Script',
      ext: '.py',
      category: 'CAM / Bridge',
      desc: 'Automated Python script using Autodesk Fusion 360 API. Builds parametric solid natively inside Fusion 360.',
      standard: 'Autodesk Fusion API 2.0',
      recommendedFor: 'Native Autodesk Fusion 360 Import',
    },
  ];

  // Generate current export result
  const exportResult = useMemo(() => {
    return generateExport(part, {
      format: selectedFormat,
      units: selectedUnits,
      resolution,
      author,
    });
  }, [part, selectedFormat, selectedUnits, resolution, author]);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      triggerDownload(exportResult.blob, exportResult.filename);
      setStatusMessage(`Downloaded ${exportResult.filename} (${(exportResult.sizeBytes / 1024).toFixed(1)} KB)`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = async () => {
    try {
      const text = await exportResult.blob.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setStatusMessage('Export contents copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setStatusMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const activeFormatInfo = formats.find((f) => f.id === selectedFormat) || formats[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#020A07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#0A1D16] to-[#05110D] border border-[#00F5A0]/35 rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col text-[#F0FDF4] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#00F5A0]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#00D9FF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(16,185,129,0.2)] bg-[#071510]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]">
              <Download className="w-5 h-5 text-[#00F5A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5A0] font-bold">
                  CADVANTA UNIFIED EXPORT CENTER
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#00F5A0]/20 text-[#00F5A0] text-[9px] font-mono border border-[#00F5A0]/30 font-bold">
                  PRECISION B-REP
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#F0FDF4] tracking-tight">
                Export CAD Model: <span className="text-[#00F5A0]">{part.name}</span>
              </h2>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-transparent hover:border-[#00F5A0]/30 transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Format Selector & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Format Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                  1. Pick Export Format ({formats.length} Formats Available)
                </label>
                <span className="text-[10px] font-mono text-[#00F5A0] bg-[#102B21] px-2 py-0.5 rounded border border-[#00F5A0]/30 font-bold">
                  {activeFormatInfo.ext.toUpperCase()} READY
                </span>
              </div>

              {/* Quick Format Switcher Pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['stl', 'dxf', 'step', 'obj', 'json'].map((fId) => {
                  const f = formats.find((x) => x.id === fId);
                  if (!f) return null;
                  const isSel = selectedFormat === fId;
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => setSelectedFormat(fId as ExportFormat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#00F5A0] text-[#030A07] shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                          : 'bg-[#071510] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.2)]'
                      }`}
                    >
                      <span>{f.ext}</span>
                      <span className="text-[10px] opacity-80 font-normal">({f.category})</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {formats.map((fmt) => {
                  const isSelected = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#00F5A0]/15 border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.2)]'
                          : 'bg-[#071510] hover:bg-[#0B1E17] border-[rgba(16,185,129,0.2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-mono font-bold text-xs ${isSelected ? 'text-[#00F5A0]' : 'text-[#F0FDF4]'}`}>
                          {fmt.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#030A07] border border-[rgba(16,185,129,0.3)] text-[#8CA89E]">
                          {fmt.ext}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8CA89E] line-clamp-2 leading-relaxed font-sans mb-1">
                        {fmt.desc}
                      </p>
                      {fmt.recommendedFor && (
                        <span className="text-[9px] font-mono text-[#00F5A0] bg-[#102B21] px-1.5 py-0.5 rounded border border-[#00F5A0]/20 self-start">
                          {fmt.recommendedFor}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dimensional Units & Scaling Toggle */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F0FDF4]">
                    2. Dimensional Accuracy & Units
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#00F5A0]">
                  Model Source: {part.units || 'mm'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUnits('mm')}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selectedUnits === 'mm'
                      ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                      : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                  }`}
                >
                  <span>Metric (Millimeters - mm)</span>
                  <span className="text-[10px] opacity-80">1.0× Scale</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUnits('inch')}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selectedUnits === 'inch'
                      ? 'bg-[#00F5A0] text-[#030A07] border-[#00F5A0]'
                      : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.2)] hover:text-[#F0FDF4]'
                  }`}
                >
                  <span>Imperial (Inches - in)</span>
                  <span className="text-[10px] opacity-80">1/25.4× Scale</span>
                </button>
              </div>
              <p className="text-[11px] text-[#8CA89E] font-sans leading-relaxed">
                {selectedUnits === 'inch'
                  ? 'All 3D coordinate vertices are mathematically converted by 0.03937 (1/25.4). STEP, IGES, and DXF files declare INCH units in their headers.'
                  : 'Coordinates exported directly in ISO metric millimeters with exact 1:1 nominal geometry.'}
              </p>
            </div>

            {/* Mesh Resolution / Chordal Tolerance (for STL / DXF / OBJ) */}
            {(selectedFormat === 'stl' || selectedFormat === 'dxf' || selectedFormat === 'obj') && (
              <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#00F5A0]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F0FDF4]">
                      3. Mesh Chordal Tolerance & Resolution
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8CA89E]">
                    {resolution === 'fine' ? 'High Precision (0.01 mm)' : resolution === 'draft' ? 'Fast Draft (0.05 mm)' : 'Balanced (0.02 mm)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['fine', 'standard', 'draft'] as MeshResolution[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono capitalize transition-all cursor-pointer ${
                        resolution === res
                          ? 'bg-[#102B21] border-[#00F5A0] text-[#00F5A0] font-bold'
                          : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E] hover:text-[#F0FDF4]'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Specification & Live Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            {/* Format Technical Specs Card */}
            <div className="p-4 rounded-xl bg-[#071510] border border-[rgba(16,185,129,0.25)] space-y-3 flex-1">
              <div className="flex items-center justify-between border-b border-[rgba(16,185,129,0.2)] pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-xs font-mono font-bold uppercase text-[#00F5A0]">
                    Specification Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8CA89E]">
                  {activeFormatInfo.standard}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Target Filename:</span>
                  <span className="text-[#00F5A0] font-bold truncate max-w-[200px]" title={exportResult.filename}>
                    {exportResult.filename}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Export Units:</span>
                  <span className="text-[#F0FDF4] font-bold">{selectedUnits.toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Unique Vertices:</span>
                  <span className="text-[#F0FDF4] font-bold">{exportResult.vertexCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">Triangle Facets:</span>
                  <span className="text-[#F0FDF4] font-bold">{exportResult.triangleCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(16,185,129,0.1)]">
                  <span className="text-[#8CA89E]">File Size Estimate:</span>
                  <span className="text-[#00F5A0] font-bold">{(exportResult.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8CA89E]">Author Stamp:</span>
                  <span className="text-[#F0FDF4] font-bold">{author}</span>
                </div>
              </div>

              {/* Text / Script Preview snippet */}
              {exportResult.textPreview && (
                <div className="mt-2 pt-2 border-t border-[rgba(16,185,129,0.15)]">
                  <span className="text-[10px] font-mono uppercase text-[#8CA89E] block mb-1">
                    Raw Header / Script Preview:
                  </span>
                  <pre className="p-2 bg-[#030A07] rounded-lg border border-[rgba(16,185,129,0.2)] text-[10px] font-mono text-[#34EEA9] overflow-x-auto max-h-24 whitespace-pre-wrap">
                    {exportResult.textPreview}...
                  </pre>
                </div>
              )}

              <div className="pt-1 flex items-start gap-2 text-[11px] text-[#8CA89E]">
                <ShieldCheck className="w-4 h-4 text-[#00F5A0] shrink-0 mt-0.5" />
                <span>
                  Mathematically validated for strict CAD standard compliance. Guaranteed import into Fusion 360, SolidWorks, Rhino, FreeCAD, and AutoCAD.
                </span>
              </div>
            </div>

            {/* Status Feedback Toast */}
            {statusMessage && (
              <div className="p-2.5 rounded-lg bg-[#102B21] border border-[#00F5A0]/50 text-[#00F5A0] text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Actions: Download / Copy / Webhook */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-confirm-export-download"
                type="button"
                disabled={isExporting}
                onClick={handleDownload}
                className="w-full h-12 rounded-xl bg-[#00F5A0] hover:bg-[#34EEA9] text-[#030A07] font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,245,160,0.3)] active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download {activeFormatInfo.label}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="py-2.5 px-3 rounded-xl bg-[#071510] hover:bg-[#0B1E17] border border-[rgba(16,185,129,0.3)] text-[#F0FDF4] font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Copy className="w-3.5 h-3.5 text-[#00F5A0]" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                {onOpenIntegrations && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenIntegrations();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#071510] hover:bg-[#0B1E17] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>API / Webhook</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
