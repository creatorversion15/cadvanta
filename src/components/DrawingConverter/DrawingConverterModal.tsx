import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Box,
  RefreshCw,
  Cpu,
  Ruler,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';
import { CADPart } from '../../types/cad';
import {
  DrawingAnalysisResult,
  ReconstructedCADModel,
  SampleDrawingDefinition,
} from '../../types/drawingConverter';
import {
  SAMPLE_ENGINEERING_DRAWINGS,
  preprocessDrawingCanvas,
  PreprocessingOptions,
} from '../../engine/drawingPreprocessor';
import { reconstruct3DModelFromDrawing } from '../../engine/drawingReconstructionEngine';
import { DrawingReviewTable } from './DrawingReviewTable';
import { AmbiguityResolverPanel } from './AmbiguityResolverPanel';
import { ReconstructionPreviewViewport } from './ReconstructionPreviewViewport';

interface DrawingConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelReconstructed: (part: CADPart) => void;
}

export type ConverterStep = 'upload' | 'analysis' | 'reconstruction';
export type InputMode = 'photo' | 'drawing' | 'samples';

export const DrawingConverterModal: React.FC<DrawingConverterModalProps> = ({
  isOpen,
  onClose,
  onModelReconstructed,
}) => {
  const [currentStep, setCurrentStep] = useState<ConverterStep>('upload');
  const [inputMode, setInputMode] = useState<InputMode>('photo');

  // Uploaded File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [dxfTextContent, setDxfTextContent] = useState<string | null>(null);

  // Gallery Sample State (only active when explicitly selected from Samples tab)
  const [selectedSample, setSelectedSample] = useState<SampleDrawingDefinition | null>(null);

  // Calibration Reference (for photos and drawings without printed scale)
  const [calibrationValue, setCalibrationValue] = useState<string>('');
  const [calibrationFeatureKey, setCalibrationFeatureKey] = useState<string>('');

  // Preprocessing
  const [prepOptions, setPrepOptions] = useState<PreprocessingOptions>({
    contrast: 1.2,
    threshold: 0,
    invert: false,
    deskewAngleDeg: 0,
  });

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<DrawingAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Reconstruction State
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconstructedModel, setReconstructedModel] = useState<ReconstructedCADModel | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setAnalysisError(null);
    setSelectedSample(null); // Never replace upload with library preset

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setAnalysisError('File size exceeds the 25 MB limit. Please upload an optimized image or drawing.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'dxf', 'dwg'];
    if (!allowed.includes(ext || '')) {
      setAnalysisError('Unsupported format. Please upload JPG, PNG, WEBP, PDF, or DXF files.');
      return;
    }

    setSelectedFile(file);

    if (ext === 'dxf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDxfTextContent((event.target?.result as string) || null);
        setFilePreviewUrl(null);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreviewUrl((event.target?.result as string) || null);
        setDxfTextContent(null);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF
      setFilePreviewUrl(null);
      setDxfTextContent(null);
    }
  };

  // Select preloaded sample drawing (Explicit Library test mode only)
  const handleSelectSample = (sample: SampleDrawingDefinition) => {
    setSelectedSample(sample);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setDxfTextContent(null);
    setAnalysisError(null);
  };

  // Execute drawing/photo analysis (Gemini multimodal or DXF direct extraction)
  const handleAnalyzeDrawing = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStatus('Uploading and reading input geometry...');

    try {
      // 1. If user explicitly picked an industrial blueprint sample from the gallery tab
      if (selectedSample && !selectedFile) {
        setAnalysisStatus('Loading verified industrial blueprint specifications...');
        await new Promise((r) => setTimeout(r, 400));
        setAnalysisResult(JSON.parse(JSON.stringify(selectedSample.analysisPreset)));
        setCurrentStep('analysis');
        return;
      }

      // 2. Real Upload Analysis
      if (!selectedFile) {
        throw new Error('Please select an engineering drawing or photo to analyze.');
      }

      const format = (selectedFile.name.split('.').pop()?.toLowerCase() || 'png') as any;

      setAnalysisStatus(
        inputMode === 'photo'
          ? 'AI Vision Engine: Inspecting 3D object geometry, shapes & edges...'
          : 'AI Metrology Engine: Optical character recognition & view projection extraction...'
      );

      let base64Data: string | undefined = undefined;
      if (filePreviewUrl) {
        base64Data = filePreviewUrl;
      } else if (selectedFile && selectedFile.type.startsWith('image/')) {
        base64Data = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(selectedFile);
        });
      }

      const calibrationRef =
        calibrationValue && !isNaN(parseFloat(calibrationValue))
          ? {
              featureKey: calibrationFeatureKey || 'diameter',
              measuredValue: parseFloat(calibrationValue),
              unit: 'mm' as const,
            }
          : undefined;

      const response = await fetch('/api/cad/convert-2d-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          format,
          base64Data,
          dxfContent: dxfTextContent || undefined,
          sourceType: inputMode === 'photo' ? 'photo' : 'engineering_drawing',
          userCalibrationReference: calibrationRef,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server analysis error: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'Drawing analysis returned empty geometry data.');
      }

      setAnalysisResult(data.analysis);
      setCurrentStep('analysis');
    } catch (err: any) {
      console.error('Drawing analysis failed:', err);
      setAnalysisError(err?.message || 'Drawing analysis failed. Please verify the file and retry.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // Update a dimension edited by the user
  const handleUpdateDimension = (id: string, updatedValue: number, updatedTolerance?: string) => {
    if (!analysisResult) return;
    setAnalysisResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dimensions: prev.dimensions.map((d) =>
          d.id === id ? { ...d, value: updatedValue, tolerance: updatedTolerance ?? d.tolerance } : d
        ),
      };
    });
  };

  // Ambiguity selection
  const handleSelectAmbiguityOption = (ambiguityId: string, optionId: string) => {
    if (!analysisResult) return;
    setAnalysisResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ambiguities: prev.ambiguities.map((a) =>
          a.id === ambiguityId ? { ...a, selectedOptionId: optionId, resolved: true } : a
        ),
      };
    });
  };

  // Apply Scale Calibration across all dimensions
  const handleApplyScaleCalibration = (referenceDimId: string, targetValue: number) => {
    if (!analysisResult || targetValue <= 0) return;
    const refDim = analysisResult.dimensions.find((d) => d.id === referenceDimId);
    if (!refDim || refDim.value <= 0) return;

    const scale = targetValue / refDim.value;
    setAnalysisResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dimensions: prev.dimensions.map((d) => {
          if (['linear', 'diameter', 'radius', 'chamfer'].includes(d.type)) {
            return { ...d, value: Math.round(d.value * scale * 10) / 10 };
          }
          return d;
        }),
      };
    });
  };

  // Run 3D CAD Reconstruction
  const handleReconstruct = () => {
    if (!analysisResult) return;
    setIsReconstructing(true);
    try {
      const model = reconstruct3DModelFromDrawing(analysisResult);
      setReconstructedModel(model);
      setCurrentStep('reconstruction');
    } catch (err: any) {
      console.error('Reconstruction error:', err);
      setAnalysisError(err?.message || '3D Solid Reconstruction failed.');
    } finally {
      setIsReconstructing(false);
    }
  };

  // Final Action: Send to CAD Workspace
  const handleOpenInWorkspace = () => {
    if (!reconstructedModel) return;
    onModelReconstructed(reconstructedModel.part);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm font-mono tracking-tight text-slate-900 dark:text-slate-100">
                  VANTA 2D & PHOTO-TO-3D CAD CONVERTER
                </h2>
                <span className="text-[10px] bg-emerald-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">
                  AI CAD Solid Synthesis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Multimodal Computer Vision • OCR Metrology • Parametric B-Rep Solids • STEP/STL Export
              </p>
            </div>
          </div>

          {/* Workflow Stepper Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setCurrentStep('upload')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentStep === 'upload'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              1. Input & Inspect
            </button>
            <span className="text-slate-400">→</span>
            <button
              onClick={() => analysisResult && setCurrentStep('analysis')}
              disabled={!analysisResult}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentStep === 'analysis'
                  ? 'bg-emerald-600 text-white font-bold'
                  : analysisResult
                  ? 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
            >
              2. Review Geometry
            </button>
            <span className="text-slate-400">→</span>
            <button
              onClick={() => reconstructedModel && setCurrentStep('reconstruction')}
              disabled={!reconstructedModel}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentStep === 'reconstruction'
                  ? 'bg-emerald-600 text-white font-bold'
                  : reconstructedModel
                  ? 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
            >
              3. 3D Model
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close converter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 no-scrollbar">
          {/* Error Banner */}
          {analysisError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
              <button
                onClick={() => setAnalysisError(null)}
                className="text-xs underline hover:no-underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: INPUT MODE SELECTION & UPLOAD */}
          {/* ========================================================================= */}
          {currentStep === 'upload' && (
            <div className="flex flex-col gap-4">
              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('photo');
                    setSelectedSample(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    inputMode === 'photo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Physical Part Photo (Photo-to-3D)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode('drawing');
                    setSelectedSample(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    inputMode === 'drawing'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>2D Technical Blueprint (PDF / DXF / Image)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode('samples');
                    if (!selectedSample) setSelectedSample(SAMPLE_ENGINEERING_DRAWINGS[0]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    inputMode === 'samples'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Industrial Blueprint Gallery (5 Presets)</span>
                </button>
              </div>

              {/* Mode Info Tip */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg text-[11px] font-mono text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  {inputMode === 'photo' && (
                    <span>
                      <strong>Real Photo-to-3D Mode:</strong> Upload a photo of any mechanical part (machined shaft, bracket, bolt, flange, gear, or housing). AI vision analyzes visual contours, cylindrical journals, and edge features. You can enter a reference measurement below or in the review stage to calibrate scale accurately.
                    </span>
                  )}
                  {inputMode === 'drawing' && (
                    <span>
                      <strong>2D Drawing-to-3D Mode:</strong> Upload engineering technical drawings (PDF, DXF, PNG, JPG). AI vision performs OCR on dimensional callouts, tolerances, and multi-view orthographic projections (Front, Top, Section).
                    </span>
                  )}
                  {inputMode === 'samples' && (
                    <span>
                      <strong>Industrial Gallery Mode:</strong> Instant one-click test with verified ISO standard blueprints (Stepped transmission shaft, flanged mounting plate, pipe coupling, bushing sleeve, or angle bracket).
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Section (Active for Photo & Drawing modes) */}
                {inputMode !== 'samples' ? (
                  <div className="flex flex-col gap-3">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 transition-all text-center min-h-[220px]"
                    >
                      {inputMode === 'photo' ? (
                        <Camera className="w-10 h-10 text-emerald-500 mb-2" />
                      ) : (
                        <Upload className="w-10 h-10 text-emerald-500 mb-2" />
                      )}
                      <h3 className="text-sm font-bold font-mono">
                        {inputMode === 'photo'
                          ? 'Drag & Drop Part Photograph'
                          : 'Drag & Drop 2D Engineering Blueprint'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                        {inputMode === 'photo'
                          ? 'Supports JPG, PNG, WEBP photos of physical objects & mechanical assemblies (up to 25 MB).'
                          : 'Supports PDF blueprints, DXF vector drawings, PNG, JPG (up to 25 MB).'}
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={
                          inputMode === 'photo'
                            ? '.jpg,.jpeg,.png,.webp'
                            : '.pdf,.png,.jpg,.jpeg,.webp,.dxf,.dwg'
                        }
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-mono text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Browse Files
                      </button>

                      {selectedFile && (
                        <div className="mt-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-md text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>

                    {/* Scale Calibration Input (Particularly useful for photos) */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reference Calibration (Optional):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Feature Type</label>
                          <select
                            value={calibrationFeatureKey}
                            onChange={(e) => setCalibrationFeatureKey(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                          >
                            <option value="diameter">Main Diameter (Ø)</option>
                            <option value="length">Total Length (L)</option>
                            <option value="width">Width (W)</option>
                            <option value="thickness">Thickness (T)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Known Value (mm)</label>
                          <input
                            type="number"
                            placeholder="e.g. 50"
                            value={calibrationValue}
                            onChange={(e) => setCalibrationValue(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        If provided, AI vision scales all estimated dimensions proportionally to this measurement.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Pre-Loaded Industrial Blueprints Gallery */
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono tracking-wide text-slate-700 dark:text-slate-300">
                        Industrial Blueprint Gallery:
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded">
                        5 Presets
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                      {SAMPLE_ENGINEERING_DRAWINGS.map((sample) => {
                        const isSelected = selectedSample?.id === sample.id;
                        return (
                          <div
                            key={sample.id}
                            onClick={() => handleSelectSample(sample)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-10 rounded overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                                <div
                                  dangerouslySetInnerHTML={{ __html: sample.thumbnailSvg }}
                                  className="w-full h-full"
                                />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                                  {sample.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {sample.dimensionsSummary}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isSelected ? 'Active' : 'Select'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Preview Window */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Visual Input Inspection:{' '}
                      {selectedFile ? selectedFile.name : selectedSample ? selectedSample.title : 'No File Uploaded'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {selectedFile
                        ? inputMode === 'photo'
                          ? 'Physical Part Photo'
                          : 'Engineering Drawing'
                        : selectedSample
                        ? 'ISO Standard Specification'
                        : ''}
                    </span>
                  </div>

                  <div className="w-full h-[260px] bg-[#0F172A] rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-300 dark:border-slate-800">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Uploaded file preview"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : selectedSample ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: selectedSample.thumbnailSvg }}
                        className="w-full h-full max-w-xl"
                      />
                    ) : dxfTextContent ? (
                      <div className="text-xs font-mono text-emerald-400 text-center p-4">
                        <Cpu className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                        DXF Vector Drawing loaded ({dxfTextContent.length} bytes ASCII).
                        <br />
                        Direct geometric vector entities ready for solid parsing.
                      </div>
                    ) : (
                      <div className="text-center p-6 text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
                        {inputMode === 'photo' ? (
                          <Camera className="w-8 h-8 text-slate-600" />
                        ) : (
                          <Upload className="w-8 h-8 text-slate-600" />
                        )}
                        <span>
                          {inputMode === 'photo'
                            ? 'Upload a photo of a mechanical part to preview.'
                            : 'Upload an engineering drawing (PDF/PNG/DXF) to preview.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleAnalyzeDrawing}
                  disabled={isAnalyzing || (!selectedFile && !selectedSample)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{analysisStatus || 'Analyzing Geometry...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {inputMode === 'photo'
                          ? 'Analyze Photo & Synthesize 3D CAD Geometry'
                          : 'Analyze Drawing & Extract Features'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: REVIEW DETECTED DIMENSIONS, SCALE CALIBRATION & AMBIGUITY RESOLVER */}
          {/* ========================================================================= */}
          {currentStep === 'analysis' && analysisResult && (
            <div className="flex flex-col gap-4">
              {/* Part Overview Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {analysisResult.partName}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      {analysisResult.sourceType === 'photo' ? 'Photo-to-3D Model' : '2D Blueprint Model'}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Archetype:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 capitalize">
                      {analysisResult.detectedPartType.replace(/_/g, ' ')}
                    </strong>{' '}
                    • Views: {analysisResult.detectedViews?.join(', ') || '3D Inspection'} •{' '}
                    {analysisResult.dimensions.length} Dimensions Detected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">AI Confidence</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {Math.round(analysisResult.overallConfidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Scale Calibration / Missing Measurement Rescaler */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      Scale Calibration Tool:
                    </span>
                    <span className="text-[11px] text-amber-800/80 dark:text-amber-400 block">
                      Select a dimension below and enter your real measured size to proportionally rescale the entire CAD model.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    id="scale-ref-dim"
                    defaultValue={analysisResult.dimensions[0]?.id || ''}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded text-xs"
                  >
                    {analysisResult.dimensions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}: {d.value} mm
                      </option>
                    ))}
                  </select>
                  <input
                    id="scale-target-val"
                    type="number"
                    placeholder="Actual mm"
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded text-xs"
                  />
                  <button
                    onClick={() => {
                      const selectEl = document.getElementById('scale-ref-dim') as HTMLSelectElement;
                      const inputEl = document.getElementById('scale-target-val') as HTMLInputElement;
                      if (selectEl && inputEl && inputEl.value) {
                        handleApplyScaleCalibration(selectEl.value, parseFloat(inputEl.value));
                        inputEl.value = '';
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    Rescale
                  </button>
                </div>
              </div>

              {/* Editable Dimensions Table */}
              <DrawingReviewTable
                dimensions={analysisResult.dimensions}
                onUpdateDimension={handleUpdateDimension}
              />

              {/* Ambiguity Resolution Panel */}
              {analysisResult.ambiguities && analysisResult.ambiguities.length > 0 && (
                <AmbiguityResolverPanel
                  ambiguities={analysisResult.ambiguities}
                  onSelectOption={handleSelectAmbiguityOption}
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Input</span>
                </button>

                <button
                  onClick={handleReconstruct}
                  disabled={isReconstructing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isReconstructing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reconstructing Solid Geometry...</span>
                    </>
                  ) : (
                    <>
                      <Box className="w-4 h-4" />
                      <span>Reconstruct 3D Parametric CAD Solid</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: 3D MODEL PREVIEW & CAD WORKSPACE OPEN */}
          {/* ========================================================================= */}
          {currentStep === 'reconstruction' && reconstructedModel && (
            <div className="flex flex-col gap-4">
              <ReconstructionPreviewViewport
                model={reconstructedModel}
                onOpenInWorkspace={handleOpenInWorkspace}
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setCurrentStep('analysis')}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dimensions</span>
                </button>

                <button
                  onClick={handleOpenInWorkspace}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Box className="w-4 h-4" />
                  <span>Open in Cadvanta CAD Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
