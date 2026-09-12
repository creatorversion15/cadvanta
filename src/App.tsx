import React, { useState, useEffect, useRef } from 'react';
import { CADPart, PartType, MaterialInfo, ModelVersionSnapshot } from './types/cad';
import { createPresetPart, parsePromptDeterministically, createDefaultFeatures } from './engine/cadParser';
import {
  ensureInitialSnapshot,
  recordModelSnapshot,
  deleteModelSnapshot,
} from './engine/versionManager';
import { DesignRegistryItem } from './data/designRegistry';
import { createPartFromDesign } from './engine/designLoader';
import { Header } from './components/Header/Header';
import { CADViewer } from './components/CADViewer/CADViewer';
import { ParameterPanel } from './components/ParameterPanel/ParameterPanel';
import { AICommand } from './components/AICommand/AICommand';
import { DesignHistory } from './components/DesignHistory/DesignHistory';
import { EngineeringChecks } from './components/EngineeringChecks/EngineeringChecks';
import { TechnicalDrawingModal } from './components/TechnicalDrawing/TechnicalDrawingModal';
import { TestSuiteModal } from './components/Testing/TestSuiteModal';
import { LandingPage } from './components/LandingPage/LandingPage';
import { MakerProfileModal } from './components/Maker/MakerProfileModal';
import { ViraBotModal } from './components/ViraBot/ViraBotModal';
import { ViraFloatingButton } from './components/ViraBot/ViraFloatingButton';
import { SubscriptionModal } from './components/Subscription/SubscriptionModal';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { DesignAccessProvider } from './context/DesignAccessContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { LogoutConfirmModal } from './components/Auth/LogoutConfirmModal';
import { UserProfileModal } from './components/Auth/UserProfileModal';
import { UserAccountModal } from './components/Auth/UserAccountModal';
import { DesignLibraryModal } from './components/DesignLibrary/DesignLibraryModal';
import { ExportModal } from './components/Export/ExportModal';
import { AssemblyModal } from './components/Assembly/AssemblyModal';
import { SheetMetalModal } from './components/SheetMetal/SheetMetalModal';
import { SurfacingModal } from './components/Surfacing/SurfacingModal';
import { FEAModal } from './components/FEA/FEAModal';
import { CollaborationModal } from './components/Collaboration/CollaborationModal';
import { IntegrationsModal } from './components/Integrations/IntegrationsModal';
import { GenerativeDesignModal } from './components/Generative/GenerativeDesignModal';
import { PluginManagerModal } from './components/Plugins/PluginManagerModal';
import { ProjectsDashboard } from './components/Dashboard/ProjectsDashboard';
import { MaterialCostEstimatorModal } from './components/CostEstimator/MaterialCostEstimatorModal';
import { EngineeringChecksModal } from './components/EngineeringChecks/EngineeringChecksModal';
import { ThemeProvider } from './context/ThemeContext';
import { solveAssemblyMates, buildAssemblySceneGroup } from './engine/assemblySolver';
import { parseShareableLink, clearShareableUrl } from './engine/collaborationManager';
import * as THREE from 'three';
import { Sliders, ShieldCheck, History, Eye, Copy, Lock, Sparkles } from 'lucide-react';

function CADVANTAWorkspace() {
  // Application State
  const [activePart, setActivePart] = useState<CADPart>(() => createPresetPart('shaft'));
  const [isHome, setIsHome] = useState<boolean>(false);
  const [isDashboard, setIsDashboard] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'params' | 'checks' | 'history'>('params');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState<boolean>(false);
  const [isTestSuiteModalOpen, setIsTestSuiteModalOpen] = useState<boolean>(false);
  const [isMakerModalOpen, setIsMakerModalOpen] = useState<boolean>(false);
  const [isViraBotOpen, setIsViraBotOpen] = useState<boolean>(false);
  const [isDesignLibraryOpen, setIsDesignLibraryOpen] = useState<boolean>(false);

  // New Engineering Tool Modals State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAssemblyModalOpen, setIsAssemblyModalOpen] = useState<boolean>(false);
  const [isSheetMetalModalOpen, setIsSheetMetalModalOpen] = useState<boolean>(false);
  const [isSurfacingModalOpen, setIsSurfacingModalOpen] = useState<boolean>(false);
  const [isFEAModalOpen, setIsFEAModalOpen] = useState<boolean>(false);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState<boolean>(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState<boolean>(false);
  const [isGenerativeDesignModalOpen, setIsGenerativeDesignModalOpen] = useState<boolean>(false);
  const [isPluginManagerModalOpen, setIsPluginManagerModalOpen] = useState<boolean>(false);
  const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState<boolean>(false);
  const [isEngineeringChecksModalOpen, setIsEngineeringChecksModalOpen] = useState<boolean>(false);
  const [feaModelGroup, setFeaModelGroup] = useState<THREE.Group | null>(null);
  const [assemblyModelGroup, setAssemblyModelGroup] = useState<THREE.Group | null>(null);

  // Model Version History & Snapshots State
  const [modelVersions, setModelVersions] = useState<ModelVersionSnapshot[]>([]);
  const lastSnapshotPartRef = useRef<CADPart>(activePart);
  const latestPartRef = useRef<CADPart>(activePart);
  const paramDebounceTimerRef = useRef<any>(null);

  // Shareable Link & View-Only Mode State
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
  const [shareAuthor, setShareAuthor] = useState<string>('');

  // Sync latest part ref
  useEffect(() => {
    latestPartRef.current = activePart;
  }, [activePart]);

  // Initialize base model snapshot or load shared project on load
  useEffect(() => {
    // 1. Check if opened via shareable link
    const shared = parseShareableLink();
    if (shared) {
      setActivePart(shared.part);
      latestPartRef.current = shared.part;
      lastSnapshotPartRef.current = JSON.parse(JSON.stringify(shared.part));
      setIsViewOnly(shared.permission === 'view');
      setShareAuthor(shared.author || 'Collaborator');
      const initialVers = ensureInitialSnapshot(shared.part);
      setModelVersions(initialVers);
      return;
    }

    // 2. Default workspace initialization
    const initialVers = ensureInitialSnapshot(activePart);
    setModelVersions(initialVers);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(activePart));
  }, []);

  // Fork a shared view-only project into a personal editable copy
  const handleForkAndEdit = () => {
    setIsViewOnly(false);
    clearShareableUrl();
    const forkedPart: CADPart = {
      ...activePart,
      id: `part_fork_${Date.now()}`,
      name: `${activePart.name} (My Copy)`,
      metadata: { ...activePart.metadata, viewOnly: false, forkedFrom: activePart.id },
    };
    setActivePart(forkedPart);
    latestPartRef.current = forkedPart;
    const { versions: updated } = recordModelSnapshot(
      forkedPart,
      'direct_edit',
      'Forked shared project into editable workspace',
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(forkedPart));
  };

  // Exit view-only mode and reset to standard CAD workspace
  const handleExitViewOnly = () => {
    setIsViewOnly(false);
    clearShareableUrl();
    const defaultPart = createPresetPart('shaft');
    setActivePart(defaultPart);
    latestPartRef.current = defaultPart;
    const initialVers = ensureInitialSnapshot(defaultPart);
    setModelVersions(initialVers);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(defaultPart));
  };

  const [clarification, setClarification] = useState<{ required: boolean; question?: string }>({
    required: false,
  });

  // OS detection for keyboard shortcut labels (⌘ on macOS, Ctrl+ on Windows/Linux)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
  const shortcutModifier = isMac ? '⌘' : 'Ctrl+';

  // Global Keyboard Shortcut Listener for Quick Sidebar Tab Navigation (Cmd/Ctrl+1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Cmd on macOS, Ctrl on Windows/Linux, or Alt as an alternative modifier
      const hasModifier = (e.metaKey || e.ctrlKey || e.altKey) && !e.shiftKey;
      if (!hasModifier) return;

      // Do not intercept if a full-screen modal or dialog is currently open
      if (
        isDrawingModalOpen ||
        isTestSuiteModalOpen ||
        isMakerModalOpen ||
        isViraBotOpen ||
        isDesignLibraryOpen
      ) {
        return;
      }

      // Check for key 1 / Digit1 / Numpad1 -> Parameter tab
      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        setActiveSidebarTab('params');
        setIsHome(false);
        return;
      }

      // Check for key 2 / Digit2 / Numpad2 -> Checks & FEA tab
      if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        setActiveSidebarTab('checks');
        setIsHome(false);
        return;
      }

      // Check for key 3 / Digit3 / Numpad3 -> History / Feature Tree tab
      if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault();
        setActiveSidebarTab('history');
        setIsHome(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isDrawingModalOpen,
    isTestSuiteModalOpen,
    isMakerModalOpen,
    isViraBotOpen,
    isDesignLibraryOpen,
  ]);

  // Handle Conversational AI Command Submission
  const handleExecuteAICommand = async (promptText: string) => {
    setIsLoading(true);
    setClarification({ required: false });

    try {
      // Call Backend API
      const res = await fetch('/api/cad/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          currentPart: activePart,
          units: activePart.units,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clarificationRequired) {
          setClarification({
            required: true,
            question: data.clarificationQuestion,
          });
        }
        if (data.part) {
          setActivePart(data.part);
          const { versions: updated } = recordModelSnapshot(
            data.part,
            'ai_prompt',
            `AI: ${promptText.slice(0, 45)}`,
            lastSnapshotPartRef.current
          );
          setModelVersions(updated);
          lastSnapshotPartRef.current = JSON.parse(JSON.stringify(data.part));
        }
      } else {
        // Deterministic Client-side Fallback
        const fallback = parsePromptDeterministically(promptText, activePart);
        if (fallback.clarificationRequired) {
          setClarification({
            required: true,
            question: fallback.clarificationQuestion,
          });
        }
        setActivePart(fallback.part);
        const { versions: updated } = recordModelSnapshot(
          fallback.part,
          'ai_prompt',
          `AI: ${promptText.slice(0, 45)}`,
          lastSnapshotPartRef.current
        );
        setModelVersions(updated);
        lastSnapshotPartRef.current = JSON.parse(JSON.stringify(fallback.part));
      }
    } catch (err) {
      console.warn('Network error, executing fallback deterministic parser:', err);
      const fallback = parsePromptDeterministically(promptText, activePart);
      if (fallback.clarificationRequired) {
        setClarification({
          required: true,
          question: fallback.clarificationQuestion,
        });
      }
      setActivePart(fallback.part);
      const { versions: updated } = recordModelSnapshot(
        fallback.part,
        'ai_prompt',
        `AI: ${promptText.slice(0, 45)}`,
        lastSnapshotPartRef.current
      );
      setModelVersions(updated);
      lastSnapshotPartRef.current = JSON.parse(JSON.stringify(fallback.part));
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Parameter Slider Changes (Live Instant Update + Debounced Snapshot)
  const handleParameterChange = (paramKey: string, value: any) => {
    if (isViewOnly) return;
    setActivePart((prev) => {
      const updatedParams = { ...prev.parameters, [paramKey]: value };
      const updatedFeatures = createDefaultFeatures(prev.part_type, updatedParams);
      const updatedPart = {
        ...prev,
        parameters: updatedParams,
        features: updatedFeatures,
      };

      // Debounced snapshot saving on parameter edit
      if (paramDebounceTimerRef.current) clearTimeout(paramDebounceTimerRef.current);
      paramDebounceTimerRef.current = setTimeout(() => {
        const { versions: updated } = recordModelSnapshot(
          updatedPart,
          'param_edit',
          `Param: ${paramKey.replace(/_/g, ' ')} = ${value}`,
          lastSnapshotPartRef.current
        );
        setModelVersions(updated);
        lastSnapshotPartRef.current = JSON.parse(JSON.stringify(updatedPart));
      }, 700);

      return updatedPart;
    });
  };

  // Material Change (Major Edit -> Immediate Snapshot)
  const handleMaterialChange = (material: MaterialInfo) => {
    if (isViewOnly) return;
    setActivePart((prev) => {
      const updatedPart = {
        ...prev,
        material,
      };
      const { versions: updated } = recordModelSnapshot(
        updatedPart,
        'material_change',
        `Material: ${material.name}`,
        lastSnapshotPartRef.current
      );
      setModelVersions(updated);
      lastSnapshotPartRef.current = JSON.parse(JSON.stringify(updatedPart));
      return updatedPart;
    });
  };

  // Preset Selection (Major Edit -> Immediate Snapshot)
  const handleSelectPreset = (type: PartType) => {
    if (isViewOnly) {
      setIsViewOnly(false);
      clearShareableUrl();
    }
    const newPart = createPresetPart(type);
    setActivePart(newPart);
    const { versions: updated } = recordModelSnapshot(
      newPart,
      'preset_change',
      `Preset: ${newPart.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(newPart));
    setClarification({ required: false });
    setIsHome(false);
  };

  // Select design model from Design Library (Major Edit -> Immediate Snapshot)
  const handleSelectDesign = (design: DesignRegistryItem) => {
    if (isViewOnly) {
      setIsViewOnly(false);
      clearShareableUrl();
    }
    const newPart = createPartFromDesign(design);
    setActivePart(newPart);
    const { versions: updated } = recordModelSnapshot(
      newPart,
      'preset_change',
      `Library: ${design.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(newPart));
    setClarification({ required: false });
    setIsHome(false);
  };

  // Restore previous version
  const handleRestoreVersion = (snapshot: ModelVersionSnapshot) => {
    if (isViewOnly) {
      handleForkAndEdit();
      return;
    }
    const restoredPart = JSON.parse(JSON.stringify(snapshot.part));
    setActivePart(restoredPart);
    const { versions: updated } = recordModelSnapshot(
      restoredPart,
      'restore',
      `Restored: ${snapshot.versionTag} (${snapshot.title})`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(restoredPart));
  };

  // Manual Milestone Snapshot
  const handleSaveManualSnapshot = (customTitle?: string) => {
    if (isViewOnly) return;
    const note = customTitle || `Milestone: ${activePart.name}`;
    const { versions: updated } = recordModelSnapshot(
      activePart,
      'manual_snapshot',
      note,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(activePart));
  };

  // Delete version snapshot
  const handleDeleteVersion = (versionId: string) => {
    if (isViewOnly) return;
    const updated = deleteModelSnapshot(versionId);
    setModelVersions(updated);
  };

  // Add component to assembly
  const handleAddToAssembly = (design: DesignRegistryItem) => {
    // In multi-body mode or current workspace, append feature / note
    handleSelectDesign(design);
  };

  // Start from Landing Page
  const handleStartFromLanding = (initialPrompt?: string, presetType?: PartType) => {
    if (presetType) {
      handleSelectPreset(presetType);
    } else if (initialPrompt) {
      handleExecuteAICommand(initialPrompt);
    }
    setIsHome(false);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#030A07] text-[#F0FDF4] overflow-hidden font-sans selection:bg-[#00F5A0] selection:text-[#030A07] relative">
      {/* Ambient background engineering grid & emerald glow */}
      <div className="absolute inset-0 bg-cad-grid pointer-events-none opacity-40 z-0" />
      <div className="absolute inset-0 bg-emerald-glow pointer-events-none z-0" />

      {/* Top Application Header */}
      <div className="relative z-40">
        <Header
          part={activePart}
          onSelectPreset={handleSelectPreset}
          onOpenDesignLibrary={() => setIsDesignLibraryOpen(true)}
          onOpenDrawingModal={() => setIsDrawingModalOpen(true)}
          onOpenTestSuiteModal={() => setIsTestSuiteModalOpen(true)}
          onOpenViraBot={() => setIsViraBotOpen(true)}
          onOpenMakerModal={() => setIsMakerModalOpen(true)}
          onOpenDashboard={() => {
            setIsDashboard(!isDashboard);
            setIsHome(false);
          }}
          isDashboard={isDashboard}
          onGoHome={() => {
            setIsHome(!isHome);
            setIsDashboard(false);
          }}
          isHome={isHome}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenAssemblyModal={() => setIsAssemblyModalOpen(true)}
          onOpenSheetMetalModal={() => setIsSheetMetalModalOpen(true)}
          onOpenSurfacingModal={() => setIsSurfacingModalOpen(true)}
          onOpenFEAModal={() => setIsFEAModalOpen(true)}
          onOpenCollaborationModal={() => setIsCollaborationModalOpen(true)}
          onOpenIntegrationsModal={() => setIsIntegrationsModalOpen(true)}
          onOpenGenerativeDesignModal={() => setIsGenerativeDesignModalOpen(true)}
          onOpenPluginManagerModal={() => setIsPluginManagerModalOpen(true)}
          onOpenCostEstimatorModal={() => setIsCostEstimatorOpen(true)}
          onOpenEngineeringChecksModal={() => setIsEngineeringChecksModalOpen(true)}
        />
      </div>

      {/* View-Only Mode Notification Banner */}
      {isViewOnly && (
        <div
          id="banner-view-only-mode"
          className="relative z-30 bg-[#071510] border-b border-[#00F5A0]/40 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#F0FDF4] shadow-[0_4px_25px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#102B21] border border-[#00F5A0]/50 text-[#00F5A0] font-bold text-[10px] tracking-wider uppercase shadow-[0_0_10px_rgba(0,245,160,0.2)]">
              <Eye className="w-3.5 h-3.5 text-[#00F5A0] animate-pulse" />
              <span>View-Only Mode</span>
            </div>
            <div className="text-xs text-[#8CA89E]">
              Shared Model: <strong className="text-[#F0FDF4]">{activePart.name}</strong>
              {shareAuthor && (
                <span className="hidden sm:inline text-[#8CA89E]">
                  {' '}• Shared by <span className="text-[#00F5A0] font-bold">{shareAuthor}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-fork-project-banner"
              type="button"
              onClick={handleForkAndEdit}
              className="px-3.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] active:scale-95 cursor-pointer"
              title="Duplicate this shared model to edit parameters and execute AI prompts"
            >
              <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Duplicate & Edit My Copy</span>
            </button>
            <button
              id="btn-exit-view-only-banner"
              type="button"
              onClick={handleExitViewOnly}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.25)] font-mono text-xs transition-colors cursor-pointer"
              title="Return to standard CAD workspace"
            >
              <span>Exit View Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isHome ? (
        <div className="relative z-10 flex-1 overflow-hidden">
          <LandingPage
            onStartDesign={handleStartFromLanding}
            onOpenDesignLibrary={() => setIsDesignLibraryOpen(true)}
            onOpenDashboard={() => {
              setIsDashboard(true);
              setIsHome(false);
            }}
            onOpenViraBot={() => setIsViraBotOpen(true)}
            onOpenMakerModal={() => setIsMakerModalOpen(true)}
          />
        </div>
      ) : isDashboard ? (
        <div className="relative z-10 flex-1 overflow-y-auto">
          <ProjectsDashboard
            currentPart={activePart}
            onOpenProject={(part) => {
              setActivePart(part);
              setIsDashboard(false);
              setIsHome(false);
            }}
            onNewProject={(type) => {
              const newP = createPresetPart(type || 'shaft');
              setActivePart(newP);
              setIsDashboard(false);
              setIsHome(false);
            }}
            onClose={() => setIsDashboard(false)}
          />
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden p-2 gap-2 bg-[#030A07]/70 backdrop-blur-xs">
          {/* Left / Secondary Control Sidebar */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 h-[40vh] md:h-full gap-2">
            {/* Sidebar Navigation Tabs */}
            <div className="flex items-center p-1 bg-[#071510] rounded-lg border border-[rgba(16,185,129,0.18)] shrink-0 text-xs font-mono">
              <button
                id="tab-parameters"
                onClick={() => setActiveSidebarTab('params')}
                title={`Parameters (${shortcutModifier}1)`}
                className={`flex-1 py-1.5 px-1 rounded flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeSidebarTab === 'params'
                    ? 'bg-[#00F5A0] text-[#030A07] font-bold shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Parameters</span>
                <kbd
                  className={`hidden sm:inline-flex items-center justify-center px-1 py-0.2 rounded text-[9px] font-mono leading-none border transition-colors shrink-0 ${
                    activeSidebarTab === 'params'
                      ? 'bg-[#030A07]/20 border-[#030A07]/30 text-[#030A07]'
                      : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E]'
                  }`}
                >
                  {shortcutModifier}1
                </kbd>
              </button>

              <button
                id="tab-checks"
                onClick={() => setActiveSidebarTab('checks')}
                title={`Checks & FEA (${shortcutModifier}2)`}
                className={`flex-1 py-1.5 px-1 rounded flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeSidebarTab === 'checks'
                    ? 'bg-[#00F5A0] text-[#030A07] font-bold shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Checks & FEA</span>
                <kbd
                  className={`hidden sm:inline-flex items-center justify-center px-1 py-0.2 rounded text-[9px] font-mono leading-none border transition-colors shrink-0 ${
                    activeSidebarTab === 'checks'
                      ? 'bg-[#030A07]/20 border-[#030A07]/30 text-[#030A07]'
                      : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E]'
                  }`}
                >
                  {shortcutModifier}2
                </kbd>
              </button>

              <button
                id="tab-history"
                onClick={() => setActiveSidebarTab('history')}
                title={`Feature Tree & History (${shortcutModifier}3)`}
                className={`flex-1 py-1.5 px-1 rounded flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeSidebarTab === 'history'
                    ? 'bg-[#00F5A0] text-[#030A07] font-bold shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17]'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">History</span>
                {modelVersions.length > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded font-bold ${
                      activeSidebarTab === 'history'
                        ? 'bg-[#030A07]/30 text-[#030A07]'
                        : 'bg-[#102B21] text-[#00F5A0]'
                    }`}
                  >
                    {modelVersions.length}
                  </span>
                )}
                <kbd
                  className={`hidden sm:inline-flex items-center justify-center px-1 py-0.2 rounded text-[9px] font-mono leading-none border transition-colors shrink-0 ${
                    activeSidebarTab === 'history'
                      ? 'bg-[#030A07]/20 border-[#030A07]/30 text-[#030A07]'
                      : 'bg-[#0B1E17] border-[rgba(16,185,129,0.2)] text-[#8CA89E]'
                  }`}
                >
                  {shortcutModifier}3
                </kbd>
              </button>
            </div>

            {/* Sidebar Active Panel View */}
            <div className="flex-1 overflow-hidden">
              {activeSidebarTab === 'params' && (
                <ParameterPanel
                  part={activePart}
                  onParameterChange={handleParameterChange}
                  onMaterialChange={handleMaterialChange}
                  onUnitChange={(newUnit) => {
                    setActivePart((prev) => ({
                      ...prev,
                      units: newUnit,
                    }));
                  }}
                  isViewOnly={isViewOnly}
                  onForkProject={handleForkAndEdit}
                  onOpenCostEstimator={() => setIsCostEstimatorOpen(true)}
                />
              )}
              {activeSidebarTab === 'checks' && (
                <EngineeringChecks
                  part={activePart}
                  onApplyFix={handleParameterChange}
                  onOpenModal={() => setIsEngineeringChecksModalOpen(true)}
                />
              )}
              {activeSidebarTab === 'history' && (
                <DesignHistory
                  part={activePart}
                  onPartUpdate={setActivePart}
                  versions={modelVersions}
                  onRestoreVersion={handleRestoreVersion}
                  onSaveManualSnapshot={handleSaveManualSnapshot}
                  onDeleteVersion={handleDeleteVersion}
                />
              )}
            </div>
          </div>

          {/* Right Main CAD Workspace & Interactive 3D Canvas */}
          <div className="flex-1 flex flex-col h-full gap-2 overflow-hidden">
            {/* 3D CAD Viewport */}
            <div className="flex-1 w-full min-h-[300px] rounded-lg overflow-hidden border border-[rgba(16,185,129,0.22)] relative bg-[#040E0A] shadow-2xl">
              <CADViewer
                part={activePart}
                onParameterChange={handleParameterChange}
                feaGroup={feaModelGroup}
                onClearFEA={() => setFeaModelGroup(null)}
                assemblyGroup={assemblyModelGroup}
                onClearAssembly={() => setAssemblyModelGroup(null)}
              />
            </div>

            {/* AI Conversational Command Bar */}
            <div className="shrink-0">
              <AICommand
                part={activePart}
                onExecuteCommand={handleExecuteAICommand}
                isLoading={isLoading}
                clarificationRequired={clarification.required}
                clarificationQuestion={clarification.question}
                onOpenViraBot={() => setIsViraBotOpen(true)}
                isViewOnly={isViewOnly}
                onForkProject={handleForkAndEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating VIRA AI Bot Trigger Button */}
      <ViraFloatingButton onClick={() => setIsViraBotOpen(true)} />

      {/* Master Design Library & Marketplace Modal */}
      <DesignLibraryModal
        isOpen={isDesignLibraryOpen}
        onClose={() => setIsDesignLibraryOpen(false)}
        activePart={activePart}
        onSelectDesign={handleSelectDesign}
        onAddToAssembly={handleAddToAssembly}
      />

      {/* VIRA AI Personalized Assistant Modal */}
      <ViraBotModal
        isOpen={isViraBotOpen}
        onClose={() => setIsViraBotOpen(false)}
        currentPart={activePart}
        onExecutePrompt={handleExecuteAICommand}
        onApplyCADModification={handleExecuteAICommand}
        onSelectPreset={handleSelectPreset}
        onApplyPartUpdate={setActivePart}
      />

      {/* Maker Profile Modal (Viraj Bansod) */}
      <MakerProfileModal
        isOpen={isMakerModalOpen}
        onClose={() => setIsMakerModalOpen(false)}
      />

      {/* 2D Engineering Blueprint Modal */}
      <TechnicalDrawingModal
        part={activePart}
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
      />

      {/* Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteModalOpen}
        onClose={() => setIsTestSuiteModalOpen(false)}
        onRunTest={handleExecuteAICommand}
        currentPart={activePart}
      />

      {/* CADVANTA PRO Subscription Modal (₹1.69 via UPI) */}
      <SubscriptionModal
        onSelectPreset={handleSelectPreset}
        onOpenViraBot={() => setIsViraBotOpen(true)}
      />

      {/* Production Firebase Authentication Modal (Google OAuth + Phone OTP) */}
      <AuthModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal />

      {/* Authenticated Engineer Profile & Details Modal */}
      <UserProfileModal />

      {/* Engineer Account & Security Settings Modal */}
      <UserAccountModal />

      {/* Unified Export Panel (STEP, IGES, STL, DXF) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        part={activePart}
        onOpenIntegrations={() => {
          setIsExportModalOpen(false);
          setIsIntegrationsModalOpen(true);
        }}
      />

      {/* Multi-Part Assembly Modeling with Mates & Exploded View */}
      <AssemblyModal
        isOpen={isAssemblyModalOpen}
        onClose={() => setIsAssemblyModalOpen(false)}
        activePart={activePart}
        onUpdateAssembly={(components, constraints, explodePct) => {
          const solved = solveAssemblyMates(components, constraints, explodePct);
          const group = buildAssemblySceneGroup(solved, true);
          setAssemblyModelGroup(group);
          setIsAssemblyModalOpen(false);
        }}
      />

      {/* Sheet Metal Design (Flange, Bend Radius, K-Factor, Unfold DXF) */}
      <SheetMetalModal
        isOpen={isSheetMetalModalOpen}
        onClose={() => setIsSheetMetalModalOpen(false)}
        onApplySheetMetalPart={(smPart) => {
          setActivePart(smPart);
          setIsSheetMetalModalOpen(false);
        }}
      />

      {/* Surfacing Tools (Loft, Sweep, Fill Patch, Zebra Striping) */}
      <SurfacingModal
        isOpen={isSurfacingModalOpen}
        onClose={() => setIsSurfacingModalOpen(false)}
        onApplySurface={(surfPart) => {
          setActivePart(surfPart);
          setIsSurfacingModalOpen(false);
        }}
      />

      {/* FEA Static Stress & Deflection Simulation */}
      <FEAModal
        isOpen={isFEAModalOpen}
        onClose={() => setIsFEAModalOpen(false)}
        part={activePart}
        onApplyFEAModel={(group) => {
          setFeaModelGroup(group);
          setIsFEAModalOpen(false);
        }}
      />

      {/* Collaboration, Version Snapshots & 3D Annotations */}
      <CollaborationModal
        isOpen={isCollaborationModalOpen}
        onClose={() => setIsCollaborationModalOpen(false)}
        currentPart={activePart}
        onRestoreVersion={(restoredPart) => {
          setActivePart(restoredPart);
          setIsCollaborationModalOpen(false);
        }}
      />

      {/* CAD Integrations (SolidWorks, Fusion 360, Webhooks) */}
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        currentPart={activePart}
      />

      {/* Generative Design & SIMP Topology Optimization */}
      <GenerativeDesignModal
        isOpen={isGenerativeDesignModalOpen}
        onClose={() => setIsGenerativeDesignModalOpen(false)}
        part={activePart}
      />

      {/* Plugin Manager & Developer Extensibility SDK */}
      <PluginManagerModal
        isOpen={isPluginManagerModalOpen}
        onClose={() => setIsPluginManagerModalOpen(false)}
        part={activePart}
      />

      {/* Material & Cost Estimator Modal (Part & Assembly Rollup) */}
      <MaterialCostEstimatorModal
        isOpen={isCostEstimatorOpen}
        onClose={() => setIsCostEstimatorOpen(false)}
        activePart={activePart}
        onUpdatePartMaterial={handleMaterialChange}
      />

      {/* Engineering Checks & Validation Modal (Formal PDF Report) */}
      <EngineeringChecksModal
        isOpen={isEngineeringChecksModalOpen}
        onClose={() => setIsEngineeringChecksModalOpen(false)}
        activePart={activePart}
        onApplyFix={handleParameterChange}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <DesignAccessProvider>
            <CADVANTAWorkspace />
          </DesignAccessProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
