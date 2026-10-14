import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Download,
  Copy,
  Check,
  RefreshCw,
  X,
  Upload,
  Camera,
  Maximize2,
  ChevronRight,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Eye,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CADPart } from '../../types/cad';

export interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePart?: CADPart;
  initialSourceImage?: string | null;
  onCaptureViewport?: () => string | null;
}

export interface GeneratedImageRecord {
  id: string;
  type: 'create' | 'edit';
  prompt: string;
  imageUrl: string;
  originalImage?: string;
  model: string;
  aspectRatio: string;
  timestamp: string;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', icon: '■' },
  { id: '16:9', label: '16:9 Widescreen', icon: '▬' },
  { id: '4:3', label: '4:3 Standard', icon: '▰' },
  { id: '3:4', label: '3:4 Portrait', icon: '▮' },
  { id: '9:16', label: '9:16 Vertical', icon: '❙' },
];

const CREATE_PROMPT_PRESETS = [
  'Photorealistic studio render of titanium crankshaft on granite inspection table with soft rim lighting',
  'Exploded isometric technical blueprint of planetary gearbox with white line annotations and dimensional callouts',
  'Cross-section cutaway illustration of high-performance turbocharger compressor wheel showing aerodynamic blade flow',
  'CNC 5-axis vertical machining center milling an aerospace aluminium bracket with coolant mist and metal chips',
  'Matte black stealth aerospace drone motor assembly with woven carbon fiber finish and gold anodized bolts',
  'Transparent acrylic housing showing internal brass bevel gears with microscopic oil lubrication film',
];

const EDIT_PROMPT_PRESETS = [
  'Transform this part into a high-contrast engineering blueprint with white schematic lines on navy grid',
  'Apply a brushed aerospace titanium finish with heat-tinted rainbow anodizing on the edges',
  'Explode the outer casing outward along the primary axis to reveal internal gear teeth and ball bearings',
  'Add dramatic studio lighting with neon cyan and emerald green rim highlights on dark matte background',
  'Place this mechanical part on an industrial CNC granite surface plate with dial indicator gauges nearby',
  'Make the outer shell transparent tinted polycarbonate with internal stainless steel mechanism visible',
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  activePart,
  initialSourceImage,
  onCaptureViewport,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');

  // Create Mode State
  const [createPrompt, setCreatePrompt] = useState<string>(() => {
    if (activePart) {
      return `Photorealistic studio render of ${activePart.name.toLowerCase()} made of ${activePart.material?.name || 'titanium'} on a granite inspection table with soft studio lighting`;
    }
    return 'Photorealistic studio render of precision mechanical shaft with brushed steel finish on granite plate';
  });
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');

  // Edit Mode State
  const [sourceImage, setSourceImage] = useState<string | null>(initialSourceImage || null);
  const [editPrompt, setEditPrompt] = useState<string>(
    'Apply a brushed titanium finish with vivid edge rim highlights and high-contrast studio reflections'
  );
  const [compareMode, setCompareMode] = useState<'result' | 'original' | 'split'>('result');

  // Execution & Output State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImageRecord | null>(null);
  const [history, setHistory] = useState<GeneratedImageRecord[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialSourceImage if passed from caller
  useEffect(() => {
    if (initialSourceImage) {
      setSourceImage(initialSourceImage);
      setActiveTab('edit');
    }
  }, [initialSourceImage]);

  // Capture from live 3D CAD viewer
  const handleCaptureFromViewer = () => {
    if (onCaptureViewport) {
      const snap = onCaptureViewport();
      if (snap) {
        setSourceImage(snap);
        setActiveTab('edit');
        setErrorNotice(null);
        return;
      }
    }

    // Try HTML canvas search in CAD view
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      try {
        const snap = canvas.toDataURL('image/png');
        setSourceImage(snap);
        setActiveTab('edit');
        setErrorNotice(null);
      } catch (err) {
        setErrorNotice('Could not capture viewport directly from canvas.');
      }
    } else {
      setErrorNotice('No 3D viewport canvas found to capture.');
    }
  };

  // Handle local file upload for editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorNotice('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImage(event.target.result as string);
        setActiveTab('edit');
        setErrorNotice(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Text-to-Image Generation
  const handleCreateImage = async () => {
    if (!createPrompt.trim()) return;

    setIsGenerating(true);
    setErrorNotice(null);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt.trim(),
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        const record: GeneratedImageRecord = {
          id: `img_${Date.now()}`,
          type: 'create',
          prompt: createPrompt.trim(),
          imageUrl: data.imageUrl,
          model: data.model || 'gemini-3.1-flash-image-preview',
          aspectRatio: data.aspectRatio || aspectRatio,
          timestamp: new Date().toLocaleTimeString(),
        };

        setCurrentResult(record);
        setHistory((prev) => [record, ...prev.slice(0, 19)]);
      } else {
        setErrorNotice(data.error || 'Failed to generate image. Please try again.');
      }
    } catch (err: any) {
      console.error('Image creation request error:', err);
      setErrorNotice(err?.message || 'Network error communicating with image generation server.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Image-to-Image Edit
  const handleEditImage = async () => {
    if (!sourceImage) {
      setErrorNotice('Please upload an image or capture the 3D viewport first.');
      return;
    }
    if (!editPrompt.trim()) {
      setErrorNotice('Please enter text instructions describing how to edit the image.');
      return;
    }

    setIsGenerating(true);
    setErrorNotice(null);

    try {
      const res = await fetch('/api/images/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          image: sourceImage,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        const record: GeneratedImageRecord = {
          id: `img_${Date.now()}`,
          type: 'edit',
          prompt: editPrompt.trim(),
          imageUrl: data.imageUrl,
          originalImage: sourceImage,
          model: data.model || 'gemini-3.1-flash-image-preview',
          aspectRatio: data.aspectRatio || aspectRatio,
          timestamp: new Date().toLocaleTimeString(),
        };

        setCurrentResult(record);
        setHistory((prev) => [record, ...prev.slice(0, 19)]);
      } else {
        setErrorNotice(data.error || 'Failed to edit image. Please try again.');
      }
    } catch (err: any) {
      console.error('Image editing request error:', err);
      setErrorNotice(err?.message || 'Network error communicating with image editing server.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Transfer generated image directly to the Edit tab as input
  const handleSendToEdit = (record: GeneratedImageRecord) => {
    setSourceImage(record.imageUrl);
    setActiveTab('edit');
    setEditPrompt(`Modify this ${record.prompt.slice(0, 60)} with extra engineering detail and high-gloss lighting`);
  };

  // Download image helper
  const handleDownloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy Image / Data URL
  const handleCopyImage = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Copy Prompt
  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-image-studio"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-6xl max-h-[94vh] bg-[#071510] border border-[#00F5A0]/40 rounded-2xl shadow-[0_0_60px_rgba(0,245,160,0.18)] flex flex-col overflow-hidden text-[#F0FDF4] font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(16,185,129,0.2)] bg-[#040C08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/15 border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono tracking-tight text-[#F0FDF4]">
                  AI Image Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-[#8CA89E] font-mono">
                Create & edit photorealistic CAD renders, technical schematics, and concept illustrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] rounded-lg transition-colors cursor-pointer"
              title="Close Image Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[rgba(16,185,129,0.15)] bg-[#05110B]">
          <div className="flex items-center gap-1.5 p-1 bg-[#091D15] rounded-xl border border-[rgba(16,185,129,0.2)]">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.35)]'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Create New Image</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.35)]'
                  : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Edit Existing Image</span>
              {sourceImage && (
                <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              )}
            </button>
          </div>

          {/* Quick 3D Snapshot shortcut */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCaptureFromViewer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#00F5A0] bg-[#0A2318] hover:bg-[#102F22] border border-[#00F5A0]/30 rounded-lg transition-colors cursor-pointer"
              title="Capture active 3D CAD view and open in Image Editor"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture 3D Viewport</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content (2-Column Studio Layout) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(16,185,129,0.18)]">
          
          {/* Left Column: Controls & Prompt Input (5 Cols) */}
          <div className="lg:col-span-5 p-5 space-y-4 flex flex-col bg-[#06140D] overflow-y-auto">
            {errorNotice && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="font-mono">{errorNotice}</span>
              </div>
            )}

            {/* TAB 1: CREATE MODE */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Text Prompt Specification</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#8CA89E]">
                      {createPrompt.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="input-create-image-prompt"
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="Describe the engineering part, lighting, environment, materials, or exploded details..."
                    rows={4}
                    className="w-full p-3 bg-[#0B1E17] border border-[rgba(16,185,129,0.28)] rounded-xl text-xs text-[#F0FDF4] placeholder-[#4E6B60] focus:border-[#00F5A0] focus:outline-none focus:ring-1 focus:ring-[#00F5A0] font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8CA89E] mb-1.5 block">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-mono transition-all cursor-pointer border ${
                          aspectRatio === ratio.id
                            ? 'bg-[#00F5A0] text-[#02140D] font-bold border-[#00F5A0] shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                            : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.18)] hover:bg-[#102B21] hover:text-[#F0FDF4]'
                        }`}
                      >
                        <span className="text-xs mb-0.5">{ratio.icon}</span>
                        <span>{ratio.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Selector */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8CA89E]">
                    Output Detail Resolution
                  </label>
                  <div className="flex items-center gap-1.5 bg-[#0B1E17] p-1 rounded-lg border border-[rgba(16,185,129,0.2)]">
                    {(['1K', '2K'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setImageSize(sz)}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          imageSize === sz
                            ? 'bg-[#00F5A0] text-[#02140D]'
                            : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Engineering Prompt Suggestions */}
                <div className="pt-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8CA89E] mb-2 block flex items-center justify-between">
                    <span>Engineering Inspiration Presets</span>
                    <span className="text-[9px] text-[#00F5A0]">Click to Apply</span>
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {CREATE_PROMPT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCreatePrompt(preset)}
                        className="w-full text-left p-2 rounded-lg bg-[#0B1E17] hover:bg-[#102F22] border border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/40 text-[11px] text-[#C1D6CD] hover:text-[#F0FDF4] transition-all cursor-pointer line-clamp-2"
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate CTA Button */}
                <button
                  id="btn-generate-image"
                  onClick={handleCreateImage}
                  disabled={isGenerating || !createPrompt.trim()}
                  className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isGenerating
                      ? 'bg-[#00F5A0]/50 text-[#02140D] cursor-wait animate-pulse'
                      : 'bg-[#00F5A0] text-[#02140D] hover:bg-[#15FFAE] hover:shadow-[0_0_20px_rgba(0,245,160,0.5)] active:scale-[0.99]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing with gemini-3.1-flash-image-preview...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Image with gemini-3.1-flash-image-preview</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: EDIT MODE */}
            {activeTab === 'edit' && (
              <div className="space-y-4">
                {/* Source Image Preview & Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Source Image to Edit</span>
                    </label>
                    {sourceImage && (
                      <button
                        type="button"
                        onClick={() => setSourceImage(null)}
                        className="text-[10px] font-mono text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>

                  {sourceImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-[#00F5A0]/40 bg-black max-h-40 flex items-center justify-center">
                      <img
                        src={sourceImage}
                        alt="Source to edit"
                        className="max-h-40 w-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-mono bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40 rounded-lg hover:bg-[#153A2B] cursor-pointer"
                        >
                          Replace File
                        </button>
                        <button
                          type="button"
                          onClick={handleCaptureFromViewer}
                          className="px-2.5 py-1 text-[11px] font-mono bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40 rounded-lg hover:bg-[#153A2B] cursor-pointer"
                        >
                          Re-snap 3D View
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[rgba(16,185,129,0.3)] bg-[#0B1E17]/60 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-[#102B21] flex items-center justify-center text-[#00F5A0]">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-[#F0FDF4] font-medium">
                        Upload or capture an image to modify
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#102B21] hover:bg-[#163B2D] border border-[rgba(16,185,129,0.25)] rounded-lg text-xs font-mono text-[#00F5A0] cursor-pointer"
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={handleCaptureFromViewer}
                          className="px-3 py-1.5 bg-[#00F5A0] text-[#02140D] font-bold rounded-lg text-xs font-mono hover:bg-[#15FFAE] cursor-pointer"
                        >
                          Capture 3D View
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Edit Instructions Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#00F5A0] flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Edit Instructions (Text Prompt)</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#8CA89E]">
                      {editPrompt.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="input-edit-image-prompt"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="E.g., Turn into an engineering blueprint, add brushed titanium finish, explode components..."
                    rows={4}
                    className="w-full p-3 bg-[#0B1E17] border border-[rgba(16,185,129,0.28)] rounded-xl text-xs text-[#F0FDF4] placeholder-[#4E6B60] focus:border-[#00F5A0] focus:outline-none focus:ring-1 focus:ring-[#00F5A0] font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Aspect Ratio Selector for Edit */}
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8CA89E] mb-1.5 block">
                    Aspect Ratio (Optional)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-mono transition-all cursor-pointer border ${
                          aspectRatio === ratio.id
                            ? 'bg-[#00F5A0] text-[#02140D] font-bold border-[#00F5A0]'
                            : 'bg-[#0B1E17] text-[#8CA89E] border-[rgba(16,185,129,0.18)] hover:bg-[#102B21]'
                        }`}
                      >
                        <span className="text-xs mb-0.5">{ratio.icon}</span>
                        <span>{ratio.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Presets */}
                <div className="pt-1">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8CA89E] mb-2 block flex items-center justify-between">
                    <span>Quick Edit Directives</span>
                    <span className="text-[9px] text-[#00F5A0]">Click to Apply</span>
                  </label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {EDIT_PROMPT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditPrompt(preset)}
                        className="w-full text-left p-2 rounded-lg bg-[#0B1E17] hover:bg-[#102F22] border border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/40 text-[11px] text-[#C1D6CD] hover:text-[#F0FDF4] transition-all cursor-pointer line-clamp-2"
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit CTA Button */}
                <button
                  id="btn-edit-image"
                  onClick={handleEditImage}
                  disabled={isGenerating || !sourceImage || !editPrompt.trim()}
                  className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isGenerating || !sourceImage
                      ? 'bg-[#00F5A0]/40 text-[#02140D] cursor-not-allowed'
                      : 'bg-[#00F5A0] text-[#02140D] hover:bg-[#15FFAE] hover:shadow-[0_0_20px_rgba(0,245,160,0.5)] active:scale-[0.99]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Applying Edit with gemini-3.1-flash-image-preview...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Apply AI Edit with gemini-3.1-flash-image-preview</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: High-Res Canvas & Results Viewer (7 Cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col bg-[#030A07] overflow-y-auto justify-between space-y-4">
            {/* Viewport Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-[#8CA89E] tracking-wider">
                  CANVAS VIEWPORT
                </span>
                {currentResult && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#102B21] text-[#00F5A0] border border-[rgba(16,185,129,0.25)]">
                    {currentResult.type === 'create' ? 'Generated' : 'Edited'} • {currentResult.aspectRatio}
                  </span>
                )}
              </div>

              {currentResult && currentResult.type === 'edit' && currentResult.originalImage && (
                <div className="flex items-center gap-1 bg-[#0B1E17] p-1 rounded-lg border border-[rgba(16,185,129,0.2)]">
                  <button
                    type="button"
                    onClick={() => setCompareMode('result')}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      compareMode === 'result'
                        ? 'bg-[#00F5A0] text-[#02140D]'
                        : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                    }`}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareMode('original')}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      compareMode === 'original'
                        ? 'bg-[#00F5A0] text-[#02140D]'
                        : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas Box */}
            <div className="flex-1 min-h-[380px] lg:min-h-[440px] rounded-2xl bg-[#020704] border border-[rgba(16,185,129,0.2)] flex items-center justify-center p-3 relative overflow-hidden group">
              {isGenerating ? (
                <div className="text-center space-y-3 p-8">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00F5A0]/10 border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0]">
                    <Sparkles className="w-7 h-7 animate-spin" />
                  </div>
                  <div className="text-sm font-mono font-bold text-[#F0FDF4]">
                    AI Processing In Progress...
                  </div>
                  <div className="text-xs font-mono text-[#8CA89E] max-w-sm">
                    Executing prompt using <strong>gemini-3.1-flash-image-preview</strong> model with precision engineering rendering.
                  </div>
                </div>
              ) : currentResult ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={
                      compareMode === 'original' && currentResult.originalImage
                        ? currentResult.originalImage
                        : currentResult.imageUrl
                    }
                    alt={currentResult.prompt}
                    className="max-h-[460px] max-w-full object-contain rounded-lg shadow-2xl transition-all"
                    referrerPolicy="no-referrer"
                  />

                  {/* Hover Floating Actions on Image */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-[rgba(16,185,129,0.3)] shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setFullscreenImage(currentResult.imageUrl)}
                      title="Inspect Fullscreen"
                      className="p-1.5 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] rounded-lg transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyImage(currentResult.imageUrl)}
                      title="Copy Image URL / Data"
                      className="p-1.5 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-4 h-4 text-[#00F5A0]" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(currentResult.imageUrl, `cadvanta_${currentResult.type}_${Date.now()}`)}
                      title="Download Image (PNG)"
                      className="p-1.5 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#091D15] border border-[rgba(16,185,129,0.2)] flex items-center justify-center text-[#8CA89E]">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-mono font-bold text-[#F0FDF4]">
                    Ready to Generate or Edit
                  </div>
                  <div className="text-xs font-mono text-[#8CA89E] max-w-sm">
                    Enter a prompt or select a preset on the left to create or transform mechanical illustrations using <strong>gemini-3.1-flash-image-preview</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Result Metadata & Primary Actions */}
            {currentResult && (
              <div className="p-3.5 bg-[#071510] border border-[rgba(16,185,129,0.2)] rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono font-bold text-[#00F5A0] uppercase tracking-wider">
                      PROMPT SPECIFICATION:
                    </div>
                    <p className="text-xs text-[#E1EFEA] line-clamp-2 italic">
                      "{currentResult.prompt}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(currentResult.prompt)}
                    className="p-1.5 text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#102B21] rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy Prompt Text"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[rgba(16,185,129,0.15)] flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8CA89E]">
                    <span>Model: <strong className="text-[#00F5A0]">{currentResult.model}</strong></span>
                    <span>•</span>
                    <span>Ratio: <strong>{currentResult.aspectRatio}</strong></span>
                    <span>•</span>
                    <span>{currentResult.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendToEdit(currentResult)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#102B21] hover:bg-[#16382B] text-[#00F5A0] border border-[#00F5A0]/30 transition-colors cursor-pointer"
                      title="Load this image as source to iteratively edit with another prompt"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Send to Edit Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadImage(currentResult.imageUrl, `cadvanta_${currentResult.type}_${Date.now()}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#00F5A0] text-[#02140D] hover:bg-[#15FFAE] transition-colors cursor-pointer shadow-[0_0_12px_rgba(0,245,160,0.3)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Session History Filmstrip */}
            {history.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8CA89E] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3 text-[#00F5A0]" />
                    <span>Session History ({history.length})</span>
                  </span>
                  <span>Click thumbnail to view</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentResult(item)}
                      className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer group ${
                        currentResult?.id === item.id
                          ? 'border-[#00F5A0] shadow-[0_0_10px_rgba(0,245,160,0.4)]'
                          : 'border-[rgba(16,185,129,0.2)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-black/80 text-[#00F5A0]">
                        {item.type === 'create' ? 'GEN' : 'EDT'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </motion.div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen Preview"
            className="max-h-[92vh] max-w-[92vw] object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
