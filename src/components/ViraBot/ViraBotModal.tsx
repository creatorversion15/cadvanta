import React, { useState, useRef, useEffect } from 'react';
import { CADPart, PartType } from '../../types/cad';
import { analyzePartDFM, DFMIssue } from '../../engine/dfmEngine';
import { explainPartIssuesInPlainLanguage, PlainLanguageDFMFix } from '../../engine/viraExplanationEngine';
import { calculateShaftStressAndTorque } from '../../engineering/engineeringCalculations';
import { processViraCADRequest, ViraAgentResponse } from '../../engine/viraCadAgent';
import {
  X,
  Send,
  Bot,
  Sparkles,
  Layers,
  Wrench,
  Search,
  CheckCircle2,
  FolderOpen,
  Sliders,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Cpu,
  Boxes,
  AlertTriangle,
  FileText,
  FileCode,
  Compass,
  Link2,
  ChevronDown,
  Key,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolidWorksApiConsole } from './SolidWorksApiConsole';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  SUPPORTED_AI_MODELS,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
  getAIModelById,
  isAnthropicModel,
  AIModelOption,
} from '../../config/aiModels';
import {
  CopilotProposal,
  RecognizedGeometry,
  RecognizedFastener,
  SketchDiagnostic,
  FailedFeatureDiagnostic,
  AssemblyHealth,
  DrawingViewsPlan,
  AutomatedBOMItem,
} from '../../engine/viraEngineeringCopilot';
import { runEngineeringAccuracyTests } from '../../engine/viraEngineeringTools';
import { CadVantaLogoMark } from '../Brand/CadVantaLogo';

interface ViraBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPart: CADPart;
  onExecutePrompt?: (prompt: string) => void;
  onApplyCADModification?: (prompt: string) => void;
  onSelectPreset?: (type: PartType) => void;
  onApplyPartUpdate?: (part: CADPart) => void;
  onOpenDrawingConverter?: () => void;
  onOpenEngineeringSummary?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'vira';
  text: string;
  timestamp: string;
  cadActionLabel?: string;
  cadDiffSummary?: {
    type: string;
    details: string[];
    affectedParams?: Record<string, any>;
    featuresModified?: string[];
  };
  suggestedAction?: {
    label: string;
    prompt: string;
    paramFix?: Record<string, any>;
  };
  suggestedFixes?: PlainLanguageDFMFix[];
  proposal?: CopilotProposal;
  recognizedGeometries?: RecognizedGeometry[];
  recognizedFasteners?: RecognizedFastener[];
  sketchDiagnostics?: SketchDiagnostic[];
  featureDiagnostics?: FailedFeatureDiagnostic[];
  assemblyHealth?: AssemblyHealth;
  drawingAndBOM?: { drawingPlan: DrawingViewsPlan; bom: AutomatedBOMItem[] };
  designIntent?: { purpose: string; governingStandards: string[]; keyEngineeringRules: string[]; criticalStresses: string[] };
  accuracyTestSuite?: ReturnType<typeof runEngineeringAccuracyTests>;
  grounded?: boolean;
  searchSources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
}

const VIRA_STORAGE_KEY = 'cadvanta_vira_session_messages';

export const ViraBotModal: React.FC<ViraBotModalProps> = ({
  isOpen,
  onClose,
  currentPart,
  onExecutePrompt,
  onApplyCADModification,
  onSelectPreset,
  onApplyPartUpdate,
  onOpenDrawingConverter,
  onOpenEngineeringSummary,
}) => {
  const { isPro } = useSubscription();

  // Multi-turn session memory: preserve conversation across modal toggles and browser session
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(VIRA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: '1',
        sender: 'vira',
        text: `Hello! I am **VIRA**, your AI CAD Engineering Assistant in **CADVANTA**, created by **Viraj Bansod**.\n\nI work directly with Cadvanta's actual parametric CAD models, feature tree, sketches, dimensions, constraints, and saved project database. **I never output fake images or mockups — everything I generate is an editable 3D CAD solid in your viewport.**\n\nTry asking me:\n- 📐 *"Create a shaft 200 mm long and 40 mm diameter"*\n- 🔄 *"Change diameter to 50 mm"*\n- 🔲 *"Remove the chamfer"* or *"Make a 20 mm hole"*\n- ⚙️ *"Design a planetary gear"*\n- 🔗 *"Make the shaft concentric with the bearing"*\n- 📂 *"Open my gearbox"*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'dfm' | 'standards' | 'solidworks'>('agent');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [standardsQuery, setStandardsQuery] = useState<string>('ISO 286 shaft tolerance fits for bearings');
  const [standardsLoading, setStandardsLoading] = useState<boolean>(false);
  const [standardsResult, setStandardsResult] = useState<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Model selection: Claude (Anthropic) or Gemini, persisted across sessions
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cadvanta_vira_model');
      if (saved) return saved;
    } catch {}
    return DEFAULT_ANTHROPIC_MODEL;
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    anthropicConfigured: boolean;
    geminiConfigured: boolean;
  }>({ anthropicConfigured: false, geminiConfigured: true });

  useEffect(() => {
    fetch('/api/vira/models')
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          setAiStatus({
            anthropicConfigured: Boolean(data.providers.anthropic?.configured),
            geminiConfigured: Boolean(data.providers.gemini?.configured),
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
    try {
      localStorage.setItem('cadvanta_vira_model', modelId);
    } catch {}
  };

  const handleStandardsSearch = async (q?: string) => {
    const textToSearch = q || standardsQuery;
    if (!textToSearch.trim()) return;
    setStandardsLoading(true);
    try {
      const res = await fetch('/api/engineering/grounded-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSearch, category: 'Mechanical Engineering Standards' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStandardsResult(data);
      }
    } catch (err) {
      console.error('Standards search failed:', err);
    } finally {
      setStandardsLoading(false);
    }
  };

  // Real-time analysis of current part's DFM and validation health
  const dfmAnalysis = analyzePartDFM(currentPart);
  const plainIssues = explainPartIssuesInPlainLanguage(currentPart);

  // Persist session messages
  useEffect(() => {
    try {
      sessionStorage.setItem(VIRA_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: '🔍 Inspect Geometry', prompt: 'Inspect model geometry and topology' },
    { label: '🔩 Fasteners & Sizing', prompt: 'Recognize fasteners and recommend hardware sizes' },
    { label: '❓ "What\'s Wrong?"', prompt: "What's wrong with the feature tree and model?" },
    { label: '📐 Sketch Constraints', prompt: 'Analyze sketch constraints and check for errors' },
    { label: '📋 Drawing & BOM', prompt: 'Generate automatic 2D drawing views and engineering BOM' },
    { label: '🔗 Smart Mates', prompt: 'Analyze assembly mates and suggest constraints' },
    { label: '📐 Shaft Ø40 × 200mm', prompt: 'Create a shaft 200 mm long and 40 mm diameter' },
    { label: '🔄 Change Diameter to 50mm', prompt: 'Change diameter to 50 mm' },
    { label: '🔲 Remove Chamfer', prompt: 'Remove the chamfer' },
    { label: '🔘 Make 20mm Hole', prompt: 'Make a 20 mm hole' },
    { label: '⚙️ 4 Holes Pattern', prompt: 'Make four holes around the shaft' },
    { label: '🛡️ Round Edges 3mm', prompt: 'Round these edges by 3 mm' },
    { label: '🕳️ Shell Hollow Core', prompt: 'Make the housing hollow' },
    { label: '📊 Validate & FoS', prompt: 'Calculate the Von Mises stress and safety factor for the current part' },
    { label: '🌐 ISO / DIN Standards', prompt: 'Search live engineering databases for ISO 286-1 shaft tolerance fits and DIN 6885 keyways' },
  ];

  // Apply a direct parameter fix from plain-language suggestion
  const handleApplyDirectFix = (paramFix: Record<string, any>, fixTitle: string) => {
    if (!onApplyPartUpdate) return;
    const updatedPart: CADPart = {
      ...currentPart,
      parameters: {
        ...currentPart.parameters,
        ...paramFix,
      },
    };
    onApplyPartUpdate(updatedPart);

    const confirmationMsg: Message = {
      id: String(Date.now()),
      sender: 'vira',
      text: `✓ Applied suggested fix for **${fixTitle}**!\n- Updated parameters: \`${JSON.stringify(paramFix)}\`\n- Model geometry recomputed in 3D viewport.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmationMsg]);
  };

  const handleApplyDFMFix = (issue: DFMIssue) => {
    handleApplyDirectFix(issue.suggestedParamFix, issue.title);
    setActiveTab('agent');
  };

  const handleRunTests = async () => {
    try {
      const res = await fetch('/api/vira/tests');
      if (res.ok) {
        const testSuite = await res.json();
        const testMsg: Message = {
          id: String(Date.now()),
          sender: 'vira',
          text: `### 🧪 Vira AI Accuracy Verification Test Suite (${testSuite.all_passed ? `ALL ${testSuite.total_tests || testSuite.tests?.length || 12} TESTS PASSED` : 'FAILED'})\nAccuracy is VIRA's first priority. Real verified SI formulas tested:`,
          accuracyTestSuite: testSuite,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, testMsg]);
        return;
      }
    } catch {
      // fallback
    }
    const localSuite = runEngineeringAccuracyTests();
    const testMsg: Message = {
      id: String(Date.now()),
      sender: 'vira',
      text: `### 🧪 Vira AI Accuracy Verification Test Suite (${localSuite.all_passed ? `ALL ${localSuite.total_tests || localSuite.tests?.length || 12} TESTS PASSED` : 'FAILED'})\nAccuracy is VIRA's first priority. Real verified SI formulas tested:`,
      accuracyTestSuite: localSuite,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, testMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    if (!query) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const isClaude = isAnthropicModel(selectedModel);
      const activeModelOption = getAIModelById(selectedModel);

      // Multi-turn history formatted for backend AI models
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      // =========================================================================
      // 1. ANTHROPIC CLAUDE REASONING LAYER (User -> Frontend -> Secure Server API -> Claude)
      // =========================================================================
      if (isClaude) {
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(), 28000);

        try {
          const response = await fetch('/api/vira/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: query,
              currentPart,
              history: historyPayload,
              model: selectedModel,
              provider: 'anthropic',
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutTimer);

          if (response.ok) {
            const data = await response.json();
            const viraMsg: Message = {
              id: String(Date.now() + 1),
              sender: 'vira',
              text: data.reply || 'Understood. What would you like to compute or adjust next?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestedFixes: data.suggestedFixes,
              suggestedAction: data.suggestedAction,
              cadDiffSummary: data.suggestedParamFix
                ? {
                    type: 'parameter_modification',
                    details: Object.entries(data.suggestedParamFix).map(
                      ([k, v]) => `${k.replace(/_/g, ' ')}: ${v} mm`
                    ),
                    affectedParams: data.suggestedParamFix,
                  }
                : undefined,
            };
            setMessages((prev) => [...prev, viraMsg]);
            setIsTyping(false);
            return;
          }

          // Error handling from server
          const errData = await response.json().catch(() => null);
          const errorCode = errData?.code || 'ANTHROPIC_ERROR';
          let errorExplanation = '';

          if (errorCode === 'MISSING_API_KEY') {
            errorExplanation = `### 🔑 ANTHROPIC_API_KEY Required\n\nTo use **${activeModelOption?.name || selectedModel}**, add your Anthropic API Key:\n\n1. In **Google AI Studio**, open the **Secrets** or Environment panel.\n2. Add a new secret called: \`ANTHROPIC_API_KEY\`\n3. Paste your API key from [console.anthropic.com](https://console.anthropic.com).\n4. After saving, ask your question again.\n\n*Tip: You can switch to **Gemini 3.8 Flash** in the top model menu to continue immediately.*`;
          } else if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            errorExplanation = `⚠️ **Anthropic Rate Limit**: Rate limits were reached on the Anthropic API. Please wait a moment before trying again, or switch to Gemini.`;
          } else if (errorCode === 'API_TIMEOUT') {
            errorExplanation = `⏱️ **Anthropic Timeout**: Request to ${activeModelOption?.name || 'Claude'} timed out after 25 seconds. Please try again.`;
          } else if (errorCode === 'INVALID_MODEL') {
            errorExplanation = `⚠️ **Invalid Model ID**: ${errData?.error || 'Model is not recognized by Anthropic.'}`;
          } else {
            errorExplanation = `⚠️ **Anthropic Error**: ${errData?.error || 'An error occurred with the Claude API.'}\n\nYou can switch to another model or Gemini in the top-right model selector.`;
          }

          const errorMsg: Message = {
            id: String(Date.now() + 1),
            sender: 'vira',
            text: errorExplanation,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setIsTyping(false);
          return;
        } catch (fetchErr: any) {
          clearTimeout(timeoutTimer);
          const isTimeout = fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted');
          const errorMsg: Message = {
            id: String(Date.now() + 1),
            sender: 'vira',
            text: isTimeout
              ? `⏱️ **Request Timeout**: Claude reasoning request timed out. Please try again or switch to Gemini.`
              : `⚠️ **Connection Error**: Unable to reach Cadvanta AI server. Please verify your connection or model settings.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setIsTyping(false);
          return;
        }
      }

      // =========================================================================
      // 2. GEMINI & NATIVE CAD AGENT PIPELINE
      // =========================================================================
      // 1. EXECUTE NATIVE VIRA CAD AGENT DIRECTLY (0ms latency, real geometry, feature tree, saved projects)
      const cadResponse: ViraAgentResponse = await processViraCADRequest(query, currentPart);

      // If the CAD agent performed a real CAD action or copilot inspection workflow
      if (
        cadResponse.action.type !== 'none' ||
        cadResponse.proposal ||
        cadResponse.recognizedGeometries ||
        cadResponse.recognizedFasteners ||
        cadResponse.sketchDiagnostics ||
        cadResponse.featureDiagnostics ||
        cadResponse.assemblyHealth ||
        cadResponse.drawingAndBOM ||
        cadResponse.designIntent ||
        cadResponse.accuracyTestSuite
      ) {
        if (cadResponse.action.updatedPart && onApplyPartUpdate) {
          onApplyPartUpdate(cadResponse.action.updatedPart);
        }

        const viraMsg: Message = {
          id: String(Date.now() + 1),
          sender: 'vira',
          text: cadResponse.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cadActionLabel: cadResponse.action.label,
          cadDiffSummary: cadResponse.action.affectedParams
            ? {
                type: cadResponse.action.type,
                details: Object.entries(cadResponse.action.affectedParams).map(
                  ([k, v]) => `${k.replace(/_/g, ' ')}: ${v} mm`
                ),
                affectedParams: cadResponse.action.affectedParams,
              }
            : undefined,
          suggestedAction: cadResponse.suggestedAction,
          proposal: cadResponse.proposal,
          recognizedGeometries: cadResponse.recognizedGeometries,
          recognizedFasteners: cadResponse.recognizedFasteners,
          sketchDiagnostics: cadResponse.sketchDiagnostics,
          featureDiagnostics: cadResponse.featureDiagnostics,
          assemblyHealth: cadResponse.assemblyHealth,
          drawingAndBOM: cadResponse.drawingAndBOM,
          designIntent: cadResponse.designIntent,
          accuracyTestSuite: cadResponse.accuracyTestSuite,
        };

        setMessages((prev) => [...prev, viraMsg]);
        setIsTyping(false);
        return;
      }

      // 2. FOR INFORMATIONAL / STANDARDS / DFM QUESTIONS: Query Backend with Google Search Grounding & Gemini
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), 14000);

      try {
        const response = await fetch('/api/vira/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            currentPart,
            history: historyPayload,
            model: selectedModel,
            provider: 'gemini',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutTimer);

        if (response.ok) {
          const data = await response.json();
          const viraMsg: Message = {
            id: String(Date.now() + 1),
            sender: 'vira',
            text: data.reply || cadResponse.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedFixes: data.suggestedFixes,
            suggestedAction: data.suggestedAction,
            accuracyTestSuite: data.accuracyTestSuite,
            grounded: data.grounded,
            searchSources: data.searchSources,
            searchQueries: data.searchQueries,
          };
          setMessages((prev) => [...prev, viraMsg]);
        } else {
          throw new Error('API fallback');
        }
      } catch {
        // Deterministic fallback response from CAD Agent
        const fallbackMsg: Message = {
          id: String(Date.now() + 1),
          sender: 'vira',
          text: cadResponse.reply,
          accuracyTestSuite: cadResponse.accuracyTestSuite,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('VIRA Agent execution error:', err);
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'vira',
        text: `I processed your CAD request for **${currentPart.name}**. What specific dimension, feature, or mate would you like me to adjust on this solid model?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetSession = () => {
    const initial: Message = {
      id: String(Date.now()),
      sender: 'vira',
      text: `Conversation memory reset for active model **${currentPart.name}**. I am **VIRA**, your CADVANTA mechanical assistant created by **Viraj Bansod**. What engineering model or feature tree operation can we execute?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initial]);
    try {
      sessionStorage.removeItem(VIRA_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`w-full ${
              isExpanded ? 'max-w-5xl h-[92vh]' : 'max-w-2xl h-[82vh]'
            } bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans text-slate-800 transition-all duration-300`}
          >
            {/* Header: Clean Professional Light CAD Interface */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                  <CadVantaLogoMark size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-sm text-slate-900 tracking-tight">
                      CAD<span className="text-emerald-600">VANTA</span> VIRA
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                      AI CAD Engineering Agent
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Created by Viraj Bansod • Real CAD Only (No Fake Previews)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Active Model Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600">
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium truncate max-w-[110px]">{currentPart.name}</span>
                  <span className="text-slate-400">({currentPart.features?.length || 0} feats)</span>
                </div>

                {/* AI Reasoning Model Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                      isAnthropicModel(selectedModel)
                        ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
                        : 'bg-emerald-50/90 border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-xs'
                    }`}
                    title="Select AI Reasoning Model (Claude / Gemini)"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAnthropicModel(selectedModel)
                          ? aiStatus.anthropicConfigured
                            ? 'bg-amber-500'
                            : 'bg-amber-400 ring-2 ring-amber-200'
                          : aiStatus.geminiConfigured
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="font-semibold">
                      {getAIModelById(selectedModel)?.name ||
                        (isAnthropicModel(selectedModel) ? 'Claude' : 'Gemini')}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>

                  {isModelDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsModelDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="font-bold text-slate-800 tracking-tight">AI Reasoning Engine</span>
                          <span className="text-[10px] text-slate-500 font-mono">Vira AI</span>
                        </div>

                        {/* Anthropic Claude Section */}
                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Anthropic Claude</span>
                          {!aiStatus.anthropicConfigured && (
                            <span className="text-[9px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Secret needed
                            </span>
                          )}
                        </div>
                        {SUPPORTED_AI_MODELS.filter((m) => m.provider === 'anthropic').map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full px-3 py-1.5 text-left flex items-start justify-between hover:bg-amber-50/60 transition-colors cursor-pointer ${
                              selectedModel === m.id
                                ? 'bg-amber-50/80 text-amber-950 font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-900">{m.name}</span>
                                {m.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {m.description}
                              </div>
                            </div>
                            {selectedModel === m.id && (
                              <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                          </button>
                        ))}

                        {/* Google Gemini Section */}
                        <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider border-t border-slate-100 mt-1 flex items-center justify-between">
                          <span>Google Gemini</span>
                          {aiStatus.geminiConfigured && (
                            <span className="text-[9px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Connected
                            </span>
                          )}
                        </div>
                        {SUPPORTED_AI_MODELS.filter((m) => m.provider === 'gemini').map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full px-3 py-1.5 text-left flex items-start justify-between hover:bg-emerald-50/60 transition-colors cursor-pointer ${
                              selectedModel === m.id
                                ? 'bg-emerald-50/80 text-emerald-950 font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-900">{m.name}</span>
                                {m.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {m.description}
                              </div>
                            </div>
                            {selectedModel === m.id && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </button>
                        ))}

                        <div className="px-3 py-1.5 border-t border-slate-100 mt-1 bg-slate-50 text-[10px] text-slate-500 leading-tight">
                          Claude serves as reasoning intelligence; Cadvanta controlled engineering tools handle CAD calculations.
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Reset Session Memory */}
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Reset conversation memory"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Expand / Minimize Modal */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer hidden md:block"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center px-4 bg-slate-100/70 border-b border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('agent')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'agent'
                    ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>CAD Engineering Copilot</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dfm')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'dfm'
                    ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-slate-600" />
                <span>DFM & Validation ({dfmAnalysis.issues.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('standards')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'standards'
                    ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>ASME / ISO Standards Grounding</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('solidworks')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'solidworks'
                    ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center gap-1">
                  <span>SolidWorks API</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                    COM Bridge
                  </span>
                </span>
              </button>
            </div>

            {/* Tab 1: CAD Engineering Copilot Chat */}
            {activeTab === 'agent' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
                {/* Quick Prompts Bar */}
                <div className="px-3 py-2 bg-white border-b border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0 mr-1">
                    Quick Commands:
                  </span>
                  <button
                    type="button"
                    onClick={handleRunTests}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    title="Run Vira AI Engineering Accuracy Verification Test Suite"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Run tests</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('solidworks')}
                    className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    title="Open SolidWorks API Console & COM Bridge"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SolidWorks API</span>
                  </button>
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 text-[11px] font-mono transition-colors shrink-0 cursor-pointer"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'vira' && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white font-sans font-medium shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 font-sans shadow-xs space-y-2'
                        }`}
                      >
                        {/* Real CAD Action Confirmation Pill */}
                        {msg.cadActionLabel && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold mb-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>CAD ACTION EXECUTED: {msg.cadActionLabel}</span>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed">
                          {msg.text}
                        </div>

                        {/* Parametric diff details with in-place live sliders */}
                        {msg.cadDiffSummary && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-2">
                            <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Sliders className="w-3 h-3 text-emerald-600" />
                                <span>Parametric Update Applied to 3D Viewport:</span>
                              </span>
                              <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded font-bold">
                                In-Place Adjust
                              </span>
                            </div>
                            <div className="space-y-1">
                              {msg.cadDiffSummary.details.map((d, i) => (
                                <div key={i} className="text-emerald-700 font-semibold">
                                  • {d}
                                </div>
                              ))}
                            </div>

                            {/* In-place sliders for each affected parameter */}
                            {msg.cadDiffSummary.affectedParams && (
                              <div className="pt-2 border-t border-slate-200 space-y-2">
                                <div className="text-[10px] font-bold text-slate-700 uppercase">
                                  Fine-Tune Dimension In-Place:
                                </div>
                                {Object.entries(msg.cadDiffSummary.affectedParams).map(([paramKey, val]) => {
                                  const currentVal = Number(currentPart.parameters[paramKey] ?? val);
                                  const min = paramKey.includes('radius') ? 1 : 5;
                                  const max = paramKey.includes('diameter') ? 300 : paramKey.includes('length') ? 600 : 150;
                                  const step = paramKey.includes('radius') ? 0.5 : 1;

                                  return (
                                    <div key={paramKey} className="p-1.5 rounded bg-white border border-slate-200 space-y-1">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-semibold text-slate-800 capitalize truncate">
                                          {paramKey.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-bold text-emerald-700">{currentVal}</span>
                                          <span className="text-slate-400">mm</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleApplyDirectFix({ [paramKey]: Math.max(1, currentVal - 5) }, paramKey)}
                                          className="px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer"
                                        >
                                          -5
                                        </button>
                                        <input
                                          type="range"
                                          min={min}
                                          max={max}
                                          step={step}
                                          value={currentVal}
                                          onChange={(e) => {
                                            const n = parseFloat(e.target.value);
                                            if (!isNaN(n)) handleApplyDirectFix({ [paramKey]: n }, paramKey);
                                          }}
                                          className="flex-1 accent-emerald-600 cursor-pointer h-1.5"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleApplyDirectFix({ [paramKey]: currentVal + 5 }, paramKey)}
                                          className="px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer"
                                        >
                                          +5
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Plain-Language Suggested Fixes */}
                        {msg.suggestedFixes && msg.suggestedFixes.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                            <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              <span>Engineering Fix Recommendations:</span>
                            </div>
                            <div className="space-y-1.5">
                              {msg.suggestedFixes.map((fix, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800 text-[11px]">
                                      {fix.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {fix.recommendedChange}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyDirectFix(fix.paramFix, fix.title)}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                                  >
                                    Apply
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CAD Copilot Proposal & Workflow Stepper */}
                        {msg.proposal && (
                          <div className="p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2.5 font-sans mt-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                                  CAD Copilot Workflow & Invariants
                                </span>
                              </div>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                                {msg.proposal.kernelEngine}
                              </span>
                            </div>

                            {/* 7-Step Workflow Chain */}
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                Copilot Lifecycle Stage:
                              </div>
                              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                                {(['UNDERSTAND', 'INSPECT', 'PREVIEW', 'CONFIRM', 'APPLY', 'VALIDATE', 'UPDATE'] as const).map((stage, sIdx) => (
                                  <React.Fragment key={stage}>
                                    <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>{stage}</span>
                                    </div>
                                    {sIdx < 6 && <span className="text-slate-600 text-[10px]">→</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>

                            {/* Parametric Diff Table */}
                            {msg.proposal.parametricDiff && msg.proposal.parametricDiff.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-mono text-slate-400 uppercase">
                                  Parametric Delta:
                                </div>
                                <div className="rounded border border-slate-800 overflow-hidden divide-y divide-slate-800/60 text-[10px] font-mono bg-slate-950/50">
                                  {msg.proposal.parametricDiff.map((diff, dIdx) => (
                                    <div key={dIdx} className="px-2.5 py-1 flex items-center justify-between">
                                      <span className="text-slate-300 capitalize">{diff.key.replace(/_/g, ' ')}:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500 line-through">{diff.from}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="text-emerald-400 font-bold">{diff.to} {diff.unit}</span>
                                        <span className="px-1 rounded bg-emerald-950 text-emerald-300 text-[9px]">
                                          {diff.delta}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                              <span>Euler Check: {msg.proposal.eulerPoincareCheck}</span>
                              <span className="text-emerald-400">Geometry Active in Viewport</span>
                            </div>
                          </div>
                        )}

                        {/* Smart Selection & Recognized Topologies */}
                        {msg.recognizedGeometries && msg.recognizedGeometries.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-800 font-mono flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-600" />
                                Recognized Topologies ({msg.recognizedGeometries.length})
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">B-Rep Feature Detection</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.recognizedGeometries.map((g) => (
                                <div key={g.id} className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{g.name}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[9px] uppercase">
                                      {g.type.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 text-[9px] font-mono flex flex-wrap gap-2">
                                    {Object.entries(g.dimensions).map(([k, v]) => (
                                      <span key={k}>{k}: <strong className="text-slate-700">{v}</strong></span>
                                    ))}
                                  </div>
                                  <div className="text-[9px] text-blue-900 bg-blue-50/60 p-1 rounded font-mono">
                                    💡 {g.matingRecommendation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fastener Recognition & Hardware Sizing */}
                        {msg.recognizedFasteners && msg.recognizedFasteners.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-900 font-mono flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-amber-700" />
                                Recognized Fasteners & Hardware Sizing
                              </span>
                              <span className="text-[9px] font-mono text-amber-700 font-bold">ISO / DIN Standards</span>
                            </div>
                            <div className="space-y-1.5">
                              {msg.recognizedFasteners.map((f, idx) => (
                                <div key={idx} className="p-2 rounded bg-white border border-amber-200 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">
                                      Hole Ø{f.holeDiameterMm}mm → {f.matchedNominal}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[9px]">
                                      Qty: {f.quantity}×
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-600">
                                    <div>Standard: <strong className="text-slate-800">{f.standard}</strong></div>
                                    <div>Grip Length: <strong className="text-slate-800">{f.recommendedGripLengthMm} mm</strong></div>
                                    <div>Torque: <strong className="text-emerald-700">{f.tighteningTorqueNm} N·m</strong></div>
                                    <div>Proof Load: <strong className="text-slate-800">{f.proofLoadKn} kN</strong></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* "What's Wrong?" Root-Cause Analysis for Features */}
                        {msg.featureDiagnostics && msg.featureDiagnostics.length > 0 && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-rose-900 font-mono flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                Feature Failure & "What's Wrong?" Root Cause
                              </span>
                              <span className="text-[9px] font-mono text-rose-700">{msg.featureDiagnostics.length} issue(s) detected</span>
                            </div>
                            <div className="space-y-2">
                              {msg.featureDiagnostics.map((diag, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-white border border-rose-200 space-y-1.5 text-[10px]">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{diag.errorTitle}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                      diag.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {diag.status}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 leading-normal">{diag.rootCauseAnalysis}</p>
                                  <div className="p-1 rounded bg-slate-50 text-[9px] font-mono text-slate-500 border border-slate-200">
                                    Kernel Root Cause: {diag.kernelExplanation}
                                  </div>
                                  {diag.quickRepairLabel && (
                                    <button
                                      type="button"
                                      onClick={() => handleApplyDirectFix(diag.correctedParams, diag.quickRepairLabel)}
                                      className="w-full mt-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Wrench className="w-3 h-3" />
                                      <span>One-Click Repair: {diag.quickRepairLabel}</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sketch Diagnostics & Constraints */}
                        {msg.sketchDiagnostics && msg.sketchDiagnostics.length > 0 && (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-900 font-mono flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                                Sketch Constraints & Kinematics Audit
                              </span>
                              <span className="text-[9px] font-mono text-indigo-700">Degrees of Freedom</span>
                            </div>
                            <div className="space-y-1.5">
                              {msg.sketchDiagnostics.map((sk, idx) => (
                                <div key={idx} className="p-2 rounded bg-white border border-indigo-200 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">{sk.sketchName}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[9px]">
                                      DoF: {sk.degreesOfFreedom}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 text-[10px]">{sk.issueDescription}</p>
                                  {sk.autoFixLabel && (
                                    <button
                                      type="button"
                                      onClick={() => handleApplyDirectFix(sk.autoFixParams, sk.autoFixLabel)}
                                      className="py-1 px-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-bold cursor-pointer"
                                    >
                                      Auto-Fix: {sk.autoFixLabel}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Automatic 2D Drawing & Engineering BOM */}
                        {msg.drawingAndBOM && (
                          <div className="p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 font-sans mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                Automated 2D Drawing Layout & Engineering BOM
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                Sheet: {msg.drawingAndBOM.drawingPlan.sheetStandard}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                Orthogonal Views & ASME Y14.5 Datums:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {msg.drawingAndBOM.drawingPlan.recommendedViews.map((v, idx) => (
                                  <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                                    <div className="font-bold text-slate-200">{v.title}</div>
                                    <div className="text-slate-400 text-[9px]">{v.purpose}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                Commercial Bill of Materials (BOM):
                              </div>
                              <div className="overflow-x-auto rounded border border-slate-800 max-h-48">
                                <table className="w-full text-[9px] font-mono text-left divide-y divide-slate-800">
                                  <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0">
                                    <tr>
                                      <th className="p-1.5">#</th>
                                      <th className="p-1.5">Part #</th>
                                      <th className="p-1.5">Description</th>
                                      <th className="p-1.5">Material</th>
                                      <th className="p-1.5">Qty</th>
                                      <th className="p-1.5">Mass</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                                    {msg.drawingAndBOM.bom.map((b) => (
                                      <tr key={b.itemNo}>
                                        <td className="p-1.5 text-slate-400">{b.itemNo}</td>
                                        <td className="p-1.5 font-bold text-slate-200">{b.partNumber}</td>
                                        <td className="p-1.5 text-slate-300">{b.description}</td>
                                        <td className="p-1.5 text-slate-400">{b.material}</td>
                                        <td className="p-1.5 text-emerald-400 font-bold">{b.quantity}</td>
                                        <td className="p-1.5 text-slate-300">{b.totalMassKg} kg</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Smart Assembly Mates */}
                        {msg.assemblyHealth && msg.assemblyHealth.smartMateSuggestions && msg.assemblyHealth.smartMateSuggestions.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-900 font-mono flex items-center gap-1.5">
                                <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                                Smart Mate Suggestions ({msg.assemblyHealth.smartMateSuggestions.length})
                              </span>
                              <span className="text-[9px] font-mono text-emerald-700 font-bold">
                                Cohesion: {msg.assemblyHealth.cohesionScore}%
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {msg.assemblyHealth.smartMateSuggestions.map((mate) => (
                                <div key={mate.id} className="p-2 rounded bg-white border border-emerald-200 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">
                                      {mate.componentNameA} ↔ {mate.componentNameB}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[9px] uppercase">
                                      {mate.suggestedType} ({mate.confidence}%)
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-600 font-mono">
                                    {mate.fitClass} • Removes {mate.dofRemoved}
                                  </div>
                                  <p className="text-[9px] text-slate-500">{mate.engineeringRationale}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Design Intent Summary */}
                        {msg.designIntent && (
                          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5 text-[10px] mt-2">
                            <div className="text-[11px] font-mono font-bold text-blue-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                              Design Intent & Governing Standards
                            </div>
                            <p className="text-slate-700 leading-normal">{msg.designIntent.purpose}</p>
                            <div className="text-[9px] font-mono text-blue-800 flex flex-wrap gap-1 pt-1">
                              {msg.designIntent.governingStandards.map((std, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-blue-100/70 border border-blue-200">
                                  {std}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Accuracy Verification Test Panel */}
                        {msg.accuracyTestSuite && (
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-slate-100 font-sans space-y-3 mt-2 shadow-md">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="font-bold text-xs font-mono tracking-tight text-white">
                                  Vira AI Accuracy Verification Test Suite
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {msg.accuracyTestSuite.passed_tests} / {msg.accuracyTestSuite.total_tests} PASSED • Tolerance ≤ 1.0%
                              </span>
                            </div>

                            <div className="space-y-2">
                              {msg.accuracyTestSuite.tests.map((test) => (
                                <div key={test.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200">{test.name}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${test.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                                      {test.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                                    </span>
                                  </div>

                                  <div className="text-[10px] text-slate-400">{test.description}</div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 rounded bg-slate-900/60 border border-slate-800/50 text-[10px]">
                                    <div>
                                      <span className="text-slate-500">Expected: </span>
                                      <span className="text-slate-300 font-bold">
                                        {Object.entries(test.expected).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' • ')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Actual: </span>
                                      <span className="text-emerald-400 font-bold">
                                        {Object.entries(test.actual).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' • ')}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                                    <span className="truncate max-w-[280px]">Formula: {test.formula}</span>
                                    <span className="text-emerald-300 font-semibold shrink-0">Tolerance: {test.tolerance}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                              <span>SI conversions: 1 MPa = 10⁶ Pa • 1 GPa = 10⁹ Pa</span>
                              <button
                                type="button"
                                onClick={handleRunTests}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold cursor-pointer transition-colors"
                              >
                                Re-run Suite
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Suggested Action Quick Pill */}
                        {msg.suggestedAction && (
                          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-mono text-slate-600 font-semibold">{msg.suggestedAction.label}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.suggestedAction?.paramFix) {
                                  handleApplyDirectFix(msg.suggestedAction.paramFix, msg.suggestedAction.label);
                                } else if (msg.suggestedAction?.prompt.includes('SolidWorks')) {
                                  setActiveTab('solidworks');
                                } else if (msg.suggestedAction?.prompt.toLowerCase().includes('2d to 3d') && onOpenDrawingConverter) {
                                  onClose();
                                  onOpenDrawingConverter();
                                } else if (
                                  (msg.suggestedAction?.prompt.toLowerCase().includes('engineering summary') ||
                                    msg.suggestedAction?.prompt.toLowerCase().includes('pdf report') ||
                                    msg.suggestedAction?.prompt.toLowerCase().includes('summary report') ||
                                    msg.suggestedAction?.prompt.toLowerCase().includes('dossier')) &&
                                  onOpenEngineeringSummary
                                ) {
                                  onClose();
                                  onOpenEngineeringSummary();
                                } else {
                                  handleSendMessage(msg.suggestedAction!.prompt);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>{msg.suggestedAction.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="text-[9px] font-mono text-slate-400 text-right pt-0.5">
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-2.5 items-center text-slate-400 text-xs font-mono animate-pulse">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span>VIRA is analyzing CAD geometry & recomputing solid...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Field */}
                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder='Ask VIRA: e.g. "Create a shaft 200 mm long and 40 mm diameter", "Change diameter to 50 mm", "Open my gearbox"'
                      className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isTyping}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute</span>
                    </button>
                  </form>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-1">
                    <span>⚡ Real CAD Engine Active • Geometry & Feature Tree Update in Real-Time</span>
                    <span>Continuous Session Memory</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: DFM & Validation Health */}
            {activeTab === 'dfm' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">DFM Readiness</div>
                    <div className="text-xl font-bold font-mono text-emerald-600">{dfmAnalysis.dfmScore}/100</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Machinability</div>
                    <div className="text-xl font-bold font-mono text-blue-600">{dfmAnalysis.machinabilityIndex}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">CNC Score</div>
                    <div className="text-xl font-bold font-mono text-slate-800">{dfmAnalysis.cncScore}%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Process</div>
                    <div className="text-xs font-bold font-mono text-slate-800 mt-1 truncate">{dfmAnalysis.recommendedProcess}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {dfmAnalysis.issues.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                      ✓ Perfect DFM compliance! All wall thicknesses, draft angles, and corner radii meet CNC & machining standards.
                    </div>
                  ) : (
                    dfmAnalysis.issues.map((iss) => (
                      <div
                        key={iss.id}
                        className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                iss.severity === 'error'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {iss.severity}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-900">{iss.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{iss.standard}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{iss.description}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="text-[11px] font-mono text-slate-500">
                            Current: <span className="text-red-600 font-bold">{iss.currentValue}</span> → Rec:{' '}
                            <span className="text-emerald-600 font-bold">{iss.recommendedValue}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyDFMFix(iss)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Apply 1-Click Fix</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: ASME / ISO Standards Grounding */}
            {activeTab === 'standards' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8FAFC]">
                {/* Search Bar */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Live Google Search Grounding for Standards</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      gemini-3.8-flash
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleStandardsSearch();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={standardsQuery}
                      onChange={(e) => setStandardsQuery(e.target.value)}
                      placeholder="e.g. ISO 286 shaft fits, DIN 6885 keyways, SKF 6205 bearing dimensions, M12 bolt torque..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-sans"
                    />
                    <button
                      type="submit"
                      disabled={standardsLoading || !standardsQuery.trim()}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{standardsLoading ? 'Searching...' : 'Ground'}</span>
                    </button>
                  </form>

                  {/* Quick Preset Queries */}
                  <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin pt-1">
                    {[
                      { label: '📐 ISO 286 Bearing Fits', q: 'ISO 286 shaft tolerance fits for deep groove ball bearings' },
                      { label: '🔑 DIN 6885 Keyways', q: 'DIN 6885-1 parallel drive key dimensions for shaft diameters' },
                      { label: '🔩 ASME B1.1 Threads', q: 'ASME B1.1 thread pitch diameters and bolt torque ratings' },
                      { label: '🛡️ AISI 4140 Yield', q: 'AISI 4140 steel tensile yield strength and hardness specifications' },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setStandardsQuery(btn.q);
                          handleStandardsSearch(btn.q);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[10px] font-mono border border-slate-200 cursor-pointer shrink-0"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grounding Results */}
                {standardsLoading ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-spin">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700">
                      Querying Live Google Search Grounding...
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Searching verified engineering standards and technical specs
                    </div>
                  </div>
                ) : standardsResult ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified Engineering Specification</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Query: "{standardsResult.query}"
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap p-3 rounded-lg bg-slate-50 border border-slate-200">
                      {standardsResult.reply}
                    </div>

                    {/* Verified web links */}
                    {standardsResult.searchSources && standardsResult.searchSources.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          Google Search Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {standardsResult.searchSources.map((src: any, i: number) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] hover:underline"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <div className="font-bold text-xs text-slate-800 mb-1">ISO 286-1 Limits & Fits</div>
                      <div className="text-[11px] text-slate-600">
                        H7/h6 locational clearance, H7/js6 transition, and H7/p6 press fits for rotating transmission shafts.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <div className="font-bold text-xs text-slate-800 mb-1">DIN 6885-1 Feather Keys</div>
                      <div className="text-[11px] text-slate-600">
                        Standard keyway width & depth rules based on shaft diameter to prevent torsional shearing.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <div className="font-bold text-xs text-slate-800 mb-1">ASME B1.1 Screw Threads</div>
                      <div className="text-[11px] text-slate-600">
                        Thread pitch diameters, tensile stress areas, and bolt preload torque calculations.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <div className="font-bold text-xs text-slate-800 mb-1">IS 5517 / EN8 Carbon Steel</div>
                      <div className="text-[11px] text-slate-600">
                        Medium carbon steel mechanical specifications, yield strengths (465 MPa), and typical market rates.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: SolidWorks API Console & Local COM Bridge */}
            {activeTab === 'solidworks' && (
              <SolidWorksApiConsole currentPart={currentPart} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
