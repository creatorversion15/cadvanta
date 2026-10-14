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
import { ShortcutCheatSheetModal } from './components/Shortcuts/ShortcutCheatSheetModal';
import { ThemeProvider } from './context/ThemeContext';
import { solveAssemblyMates, buildAssemblySceneGroup } from './engine/assemblySolver';
import { parseShareableLink, clearShareableUrl } from './engine/collaborationManager';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { ModelFeatureTree } from './components/FeatureTree/ModelFeatureTree';
import { SketcherWorkspace } from './components/Sketcher/SketcherWorkspace';
import { CADStatusBar } from './components/StatusBar/CADStatusBar';
import { DirectFeatureModal } from './components/DirectModeling/DirectFeatureModal';
import { PartLibraryModal } from './components/PartLibrary/PartLibraryModal';
import { ImageStudioModal } from './components/ImageStudio/ImageStudioModal';
import { ParametricFeatureEngine } from './engine/parametricFeatureEngine';
import { SelectedGeometryInfo } from './components/CADViewer/DirectModelingHUD';
import { CADVANTAWorkspace as CADVANTAWorkspaceView } from './components/CADWorkspace/CADVANTAWorkspace';
import { DrawingConverterModal } from './components/DrawingConverter/DrawingConverterModal';
import { EngineeringSummaryModal } from './components/EngineeringSummary/EngineeringSummaryModal';
import * as THREE from 'three';
import { Sliders, ShieldCheck, History, Eye, Copy, Lock, Sparkles, Box, Layers, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function CADVANTAWorkspace() {
  // Application State
  const [activePart, setActivePart] = useState<CADPart>(() => createPresetPart('planetary_gearbox'));
  const [isHome, setIsHome] = useState<boolean>(false);
  const [isDashboard, setIsDashboard] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'viewer' | 'params'>('viewer');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'tree' | 'params' | 'checks' | 'history'>('tree');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState<boolean>(false);
  const [isTestSuiteModalOpen, setIsTestSuiteModalOpen] = useState<boolean>(false);
  const [isMakerModalOpen, setIsMakerModalOpen] = useState<boolean>(false);
  const [isViraBotOpen, setIsViraBotOpen] = useState<boolean>(false);
  const [isDesignLibraryOpen, setIsDesignLibraryOpen] = useState<boolean>(false);
  const [isDrawingConverterOpen, setIsDrawingConverterOpen] = useState<boolean>(false);
  const [isEngineeringSummaryOpen, setIsEngineeringSummaryOpen] = useState<boolean>(false);

  // Parametric Feature Engine & Feature Tree
  const featureEngineRef = useRef<ParametricFeatureEngine>(new ParametricFeatureEngine(activePart));
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [rollbackIndex, setRollbackIndex] = useState<number>(activePart.features ? activePart.features.length - 1 : 0);
  const [selectedPlane, setSelectedPlane] = useState<'XY' | 'XZ' | 'YZ'>('XZ');

  // Direct Modeling & Geometry Picking State
  const [selectedGeometry, setSelectedGeometry] = useState<SelectedGeometryInfo | null>(null);
  const [directActionModal, setDirectActionModal] = useState<{
    isOpen: boolean;
    actionId: string;
    selection: SelectedGeometryInfo | null;
  } | null>(null);

  // 2D Parametric Sketcher State
  const [isSketcherOpen, setIsSketcherOpen] = useState<boolean>(false);

  // Standard Hardware Library State
  const [isPartLibraryOpen, setIsPartLibraryOpen] = useState<boolean>(false);

  // Live 3D Cursor Tracking for Engineering Status Bar
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<CADPart[]>([]);
  const [redoStack, setRedoStack] = useState<CADPart[]>([]);

  const pushUndo = (currentPart: CADPart) => {
    setUndoStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(currentPart))]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(activePart))]);
    featureEngineRef.current.initializeFromPart(previous);
    setActivePart(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(activePart))]);
    featureEngineRef.current.initializeFromPart(next);
    setActivePart(next);
  };

  // Toggle Units
  const handleToggleUnits = () => {
    setActivePart((prev) => {
      const nextUnit = prev.units === 'mm' ? 'inch' : 'mm';
      pushUndo(prev);
      return { ...prev, units: nextUnit };
    });
  };

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
  const [isShortcutCheatSheetOpen, setIsShortcutCheatSheetOpen] = useState<boolean>(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState<boolean>(false);
  const [imageStudioInitialImage, setImageStudioInitialImage] = useState<string | null>(null);
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

  // Cached view persistence state for sub-10ms instant tab switching
  const [hasVisitedHome, setHasVisitedHome] = useState<boolean>(isHome);
  const [hasVisitedDashboard, setHasVisitedDashboard] = useState<boolean>(isDashboard);
  const [hasVisitedCAD, setHasVisitedCAD] = useState<boolean>(!isHome && !isDashboard);

  // Cached sidebar tabs persistence
  const [hasVisitedChecks, setHasVisitedChecks] = useState<boolean>(false);
  const [hasVisitedHistory, setHasVisitedHistory] = useState<boolean>(false);

  useEffect(() => {
    if (isHome) setHasVisitedHome(true);
    if (isDashboard) setHasVisitedDashboard(true);
    if (!isHome && !isDashboard) setHasVisitedCAD(true);
  }, [isHome, isDashboard]);

  useEffect(() => {
    if (activeSidebarTab === 'checks') setHasVisitedChecks(true);
    if (activeSidebarTab === 'history') setHasVisitedHistory(true);
  }, [activeSidebarTab]);

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

  // Global Keyboard Shortcut Listener for '?' Cheat Sheet, Cmd/Ctrl+K, Modals & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. Escape key: Close cheat sheet overlay if open
      if (e.key === 'Escape') {
        if (isShortcutCheatSheetOpen) {
          e.preventDefault();
          setIsShortcutCheatSheetOpen(false);
          return;
        }
      }

      // 2. '?' or Shift+'/' key: Toggle Shortcut Cheat Sheet overlay (when not in an input field)
      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !isInput) {
        e.preventDefault();
        setIsShortcutCheatSheetOpen((prev) => !prev);
        return;
      }

      // 3. Cmd/Ctrl + K: Focus Conversational CAD Command Bar
      if (!isInput && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const inputEl = document.getElementById('input-ai-command') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
        return;
      }

      // If user is typing in an input field, do not trigger navigation hotkeys
      if (isInput) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Undo / Redo shortcuts (Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z, Cmd/Ctrl + Y)
      if (isCmdOrCtrl) {
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }
        if (key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // 4. Sidebar tabs with Cmd/Ctrl/Alt + 1, 2, 3, 4
      const hasModifier = (e.metaKey || e.ctrlKey || e.altKey) && !e.shiftKey;
      if (hasModifier) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          setActiveSidebarTab('tree');
          setIsHome(false);
          return;
        }
        if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          setActiveSidebarTab('params');
          setIsHome(false);
          return;
        }
        if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          setActiveSidebarTab('checks');
          setIsHome(false);
          return;
        }
        if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          setActiveSidebarTab('history');
          setIsHome(false);
          return;
        }
      }

      // 5. Check if any modal is currently open before running single-key hotkeys
      const isAnyModalOpen =
        isShortcutCheatSheetOpen ||
        isDrawingModalOpen ||
        isTestSuiteModalOpen ||
        isMakerModalOpen ||
        isViraBotOpen ||
        isDesignLibraryOpen ||
        isExportModalOpen ||
        isAssemblyModalOpen ||
        isSheetMetalModalOpen ||
        isSurfacingModalOpen ||
        isFEAModalOpen ||
        isCollaborationModalOpen ||
        isIntegrationsModalOpen ||
        isGenerativeDesignModalOpen ||
        isPluginManagerModalOpen ||
        isCostEstimatorOpen ||
        isEngineeringChecksModalOpen ||
        isSketcherOpen ||
        isPartLibraryOpen ||
        Boolean(directActionModal);

      if (isAnyModalOpen) return;

      // Single-key global workspace navigation (when no modifier key is active)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'k') {
          e.preventDefault();
          setIsSketcherOpen(true);
          return;
        }
        if (key === 'p') {
          e.preventDefault();
          setIsPartLibraryOpen(true);
          return;
        }
        if (key === 'v') {
          e.preventDefault();
          setIsViraBotOpen(true);
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          setIsDrawingModalOpen(true);
          return;
        }
        if (key === 't') {
          e.preventDefault();
          setIsTestSuiteModalOpen(true);
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          setIsMakerModalOpen(true);
          return;
        }
        if (key === 'l') {
          e.preventDefault();
          setIsDesignLibraryOpen(true);
          return;
        }
        if (key === 'e') {
          e.preventDefault();
          setIsExportModalOpen(true);
          return;
        }
        if (key === 'c') {
          e.preventDefault();
          setIsCollaborationModalOpen(true);
          return;
        }
        if (key === 'h') {
          e.preventDefault();
          setIsHome((prev) => !prev);
          return;
        }
        if (e.key === '1' || e.code === 'Digit1') {
          e.preventDefault();
          setActiveSidebarTab('tree');
          setIsHome(false);
          return;
        }
        if (e.key === '2' || e.code === 'Digit2') {
          e.preventDefault();
          setActiveSidebarTab('params');
          setIsHome(false);
          return;
        }
        if (e.key === '3' || e.code === 'Digit3') {
          e.preventDefault();
          setActiveSidebarTab('checks');
          setIsHome(false);
          return;
        }
        if (e.key === '4' || e.code === 'Digit4') {
          e.preventDefault();
          setActiveSidebarTab('history');
          setIsHome(false);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isShortcutCheatSheetOpen,
    isDrawingModalOpen,
    isTestSuiteModalOpen,
    isMakerModalOpen,
    isViraBotOpen,
    isDesignLibraryOpen,
    isExportModalOpen,
    isAssemblyModalOpen,
    isSheetMetalModalOpen,
    isSurfacingModalOpen,
    isFEAModalOpen,
    isCollaborationModalOpen,
    isIntegrationsModalOpen,
    isGenerativeDesignModalOpen,
    isPluginManagerModalOpen,
    isCostEstimatorOpen,
    isEngineeringChecksModalOpen,
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

  // Sync Parametric Feature Engine when activePart changes
  useEffect(() => {
    featureEngineRef.current.initializeFromPart(activePart);
    if (activePart.features) {
      setRollbackIndex(activePart.features.length - 1);
    }
  }, [activePart.id, activePart.part_type]);

  // VIRA Direct CAD Model & Feature Tree Updates
  const handleViraApplyPartUpdate = (updatedPart: CADPart) => {
    pushUndo(activePart);
    setActivePart(updatedPart);
    latestPartRef.current = updatedPart;
    const { versions: updated } = recordModelSnapshot(
      updatedPart,
      'ai_prompt',
      `VIRA: ${updatedPart.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(updatedPart));
    setIsHome(false);
  };

  // Feature Tree Handlers
  const handleSelectFeature = (featureId: string) => {
    setSelectedFeatureId(featureId);
  };

  const handleToggleSuppressFeature = (featureId: string) => {
    pushUndo(activePart);
    const res = featureEngineRef.current.toggleFeatureSuppression(featureId, activePart);
    setActivePart(res.part);
    const { versions: updated } = recordModelSnapshot(
      res.part,
      'feature_suppress',
      `Toggled Feature: ${featureId}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(res.part));
  };

  const handleDeleteFeature = (featureId: string) => {
    pushUndo(activePart);
    const res = featureEngineRef.current.deleteFeature(featureId, activePart);
    setActivePart(res.part);
    const { versions: updated } = recordModelSnapshot(
      res.part,
      'feature_delete',
      `Deleted Feature: ${featureId}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(res.part));
  };

  const handleSetRollbackIndex = (index: number) => {
    setRollbackIndex(index);
    const res = featureEngineRef.current.setRollbackIndex(index, activePart);
    setActivePart(res.part);
  };

  const handleEditFeature = (feat: any) => {
    setSelectedFeatureId(feat.id);
    setActiveSidebarTab('params');
  };

  // Direct Modeling Apply Handler
  const handleApplyDirectFeature = (featureData: {
    type: string;
    name: string;
    parameters: Record<string, any>;
    description: string;
  }) => {
    pushUndo(activePart);
    const res = featureEngineRef.current.addFeature(
      {
        name: featureData.name,
        type: featureData.type as any,
        description: featureData.description,
        parameters: featureData.parameters,
      },
      activePart
    );
    setActivePart(res.part);
    const { versions: updated } = recordModelSnapshot(
      res.part,
      'feature_add',
      `Applied ${featureData.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(res.part));
    setDirectActionModal(null);
  };

  // 2D Sketch Extrude Handler
  const handleFinishSketchAndExtrude = (params: {
    operation: 'extrude' | 'cut' | 'revolve';
    depthMm: number;
    direction?: 'blind' | 'symmetric';
    entities: any[];
    sketchName: string;
  }) => {
    pushUndo(activePart);
    const opTitle =
      params.operation === 'extrude'
        ? 'Extrude Boss'
        : params.operation === 'cut'
        ? 'Cut Pocket'
        : 'Revolve Boss';
    const featureName = `${opTitle} (${params.depthMm}mm)`;
    const direction = params.direction || 'blind';

    const res = featureEngineRef.current.addFeature(
      {
        name: featureName,
        type: params.operation as any,
        description: `${params.sketchName} on ${selectedPlane} plane, depth: ${params.depthMm}mm, direction: ${direction} (${params.entities.length} entities)`,
        parameters: {
          depth: params.depthMm,
          plane: selectedPlane,
          direction: direction,
          entityCount: params.entities.length,
        },
      },
      activePart
    );

    const updatedPart: CADPart = {
      ...res.part,
      part_type: 'sketch_extrusion',
      name: `Extruded Model (${params.depthMm}mm)`,
      custom_extrusion: {
        entities: params.entities,
        depth: params.depthMm,
        direction: direction,
        operation: params.operation === 'cut' ? 'cut' : 'boss',
        plane: selectedPlane,
      },
      parameters: {
        ...res.part.parameters,
        extrusion_depth: params.depthMm,
        extrusion_direction: direction,
        sketch_plane: selectedPlane,
        length: params.depthMm,
        width: 120,
        height: 80,
        depth: params.depthMm,
        entity_count: params.entities.length,
      },
    };

    setActivePart(updatedPart);
    latestPartRef.current = updatedPart;
    const { versions: updated } = recordModelSnapshot(
      updatedPart,
      'sketch_extrude',
      `Sketch: ${featureName}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(updatedPart));
    setIsSketcherOpen(false);
  };

  // Standard Part Insert Handler
  const handleInsertStandardPart = (insertedPart: CADPart) => {
    pushUndo(activePart);
    setActivePart(insertedPart);
    featureEngineRef.current.initializeFromPart(insertedPart);
    const { versions: updated } = recordModelSnapshot(
      insertedPart,
      'part_insert',
      `Inserted: ${insertedPart.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(insertedPart));
    setIsPartLibraryOpen(false);
  };

  // Handle Reconstructed 3D CAD Model from 2D-to-3D Converter
  const handleReconstructedPartLoaded = (reconstructedPart: CADPart) => {
    pushUndo(activePart);
    featureEngineRef.current.initializeFromPart(reconstructedPart);
    setActivePart(reconstructedPart);
    latestPartRef.current = reconstructedPart;
    const { versions: updated } = recordModelSnapshot(
      reconstructedPart,
      'direct_edit',
      `2D-to-3D: ${reconstructedPart.name}`,
      lastSnapshotPartRef.current
    );
    setModelVersions(updated);
    lastSnapshotPartRef.current = JSON.parse(JSON.stringify(reconstructedPart));
    setIsHome(false);
    setIsDashboard(false);
    setIsDrawingConverterOpen(false);
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

      {/* Top Application Header - Rendered on Home and Dashboard */}
      {(isHome || isDashboard) && (
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
            onOpenShortcuts={() => setIsShortcutCheatSheetOpen(true)}
            onOpenSketcher={() => setIsSketcherOpen(true)}
            onOpenPartLibrary={() => setIsPartLibraryOpen(true)}
            onOpenImageStudio={() => {
              setImageStudioInitialImage(null);
              setIsImageStudioOpen(true);
            }}
            onOpenDrawingConverter={() => setIsDrawingConverterOpen(true)}
            onOpenEngineeringSummary={() => setIsEngineeringSummaryOpen(true)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
          />
        </div>
      )}

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

      {/* Main Content Area: Instant Multi-View Keep-Alive for Sub-10ms Tab Switching */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col w-full h-full">
        {/* Landing Page View */}
        {hasVisitedHome && (
          <div
            className={`w-full h-full flex-1 overflow-hidden flex-col ${
              isHome ? 'flex' : 'hidden'
            }`}
            style={{ display: isHome ? 'flex' : 'none' }}
          >
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
        )}

        {/* Projects Dashboard View */}
        {hasVisitedDashboard && (
          <div
            className={`w-full h-full flex-1 overflow-y-auto flex-col ${
              isDashboard ? 'flex' : 'hidden'
            }`}
            style={{ display: isDashboard ? 'flex' : 'none' }}
          >
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
        )}

        {/* 3D CAD Workspace View - Persistent in memory */}
        {hasVisitedCAD && (
          <div
            className={`w-full h-full overflow-hidden flex-1 ${
              !isHome && !isDashboard ? 'flex' : 'hidden'
            }`}
            style={{ display: !isHome && !isDashboard ? 'flex' : 'none' }}
          >
            <CADVANTAWorkspaceView
              activePart={activePart}
              onParameterChange={handleParameterChange}
              onMaterialChange={handleMaterialChange}
              onUnitChange={(newUnit) => {
                setActivePart((prev) => ({
                  ...prev,
                  units: newUnit,
                }));
              }}
              onOpenSketch={() => setIsSketcherOpen(true)}
              onOpenShortcuts={() => setIsShortcutCheatSheetOpen(true)}
              onOpenDrawingModal={() => setIsDrawingModalOpen(true)}
              onOpenTestSuiteModal={() => setIsTestSuiteModalOpen(true)}
              onOpenCostEstimator={() => setIsCostEstimatorOpen(true)}
              onExecuteCommand={handleExecuteAICommand}
              cursorPos={cursorPos}
              setCursorPos={setCursorPos}
              selectedGeometry={selectedGeometry}
              setSelectedGeometry={setSelectedGeometry}
              modelVersions={modelVersions}
              onRestoreVersion={handleRestoreVersion}
              onSaveManualSnapshot={handleSaveManualSnapshot}
              onDeleteVersion={handleDeleteVersion}
              onSelectPreset={handleSelectPreset}
              onOpenDesignLibrary={() => setIsDesignLibraryOpen(true)}
              onOpenDashboard={() => {
                setIsDashboard(true);
                setIsHome(false);
              }}
              onGoHome={() => {
                setIsHome(true);
                setIsDashboard(false);
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenAssemblyModal={() => setIsAssemblyModalOpen(true)}
              onOpenFEAModal={() => setIsFEAModalOpen(true)}
              onOpenViraBot={() => setIsViraBotOpen(true)}
              onOpenDrawingConverter={() => setIsDrawingConverterOpen(true)}
              onOpenEngineeringSummary={() => setIsEngineeringSummaryOpen(true)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
            />
          </div>
        )}
      </div>

      {/* Floating VIRA AI Bot Trigger Button (Hidden on mobile in CAD Studio to prevent covering model) */}
      <div className={!isHome && !isDashboard ? 'hidden md:block' : 'block'}>
        <ViraFloatingButton onClick={() => setIsViraBotOpen(true)} />
      </div>

      {/* Master Design Library & Marketplace Modal */}
      {isDesignLibraryOpen && (
        <DesignLibraryModal
          isOpen={isDesignLibraryOpen}
          onClose={() => setIsDesignLibraryOpen(false)}
          activePart={activePart}
          onSelectDesign={handleSelectDesign}
          onAddToAssembly={handleAddToAssembly}
        />
      )}

      {/* VIRA AI Personalized Assistant Modal */}
      {isViraBotOpen && (
        <ViraBotModal
          isOpen={isViraBotOpen}
          onClose={() => setIsViraBotOpen(false)}
          currentPart={activePart}
          onExecutePrompt={handleExecuteAICommand}
          onApplyCADModification={handleExecuteAICommand}
          onSelectPreset={handleSelectPreset}
          onApplyPartUpdate={handleViraApplyPartUpdate}
          onOpenDrawingConverter={() => setIsDrawingConverterOpen(true)}
          onOpenEngineeringSummary={() => setIsEngineeringSummaryOpen(true)}
        />
      )}

      {/* Maker Profile Modal (Viraj Bansod) */}
      {isMakerModalOpen && (
        <MakerProfileModal
          isOpen={isMakerModalOpen}
          onClose={() => setIsMakerModalOpen(false)}
        />
      )}

      {/* 2D Engineering Blueprint Modal */}
      {isDrawingModalOpen && (
        <TechnicalDrawingModal
          part={activePart}
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
        />
      )}

      {/* Vanta 2D-to-3D Intelligent CAD Converter Modal */}
      {isDrawingConverterOpen && (
        <DrawingConverterModal
          isOpen={isDrawingConverterOpen}
          onClose={() => setIsDrawingConverterOpen(false)}
          onModelReconstructed={handleReconstructedPartLoaded}
        />
      )}

      {/* Automated Formal Engineering Summary PDF Exporter Modal */}
      {isEngineeringSummaryOpen && (
        <EngineeringSummaryModal
          isOpen={isEngineeringSummaryOpen}
          onClose={() => setIsEngineeringSummaryOpen(false)}
          activePart={activePart}
        />
      )}

      {/* Test Suite Modal */}
      {isTestSuiteModalOpen && (
        <TestSuiteModal
          isOpen={isTestSuiteModalOpen}
          onClose={() => setIsTestSuiteModalOpen(false)}
          onRunTest={handleExecuteAICommand}
          currentPart={activePart}
        />
      )}

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
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          part={activePart}
          onOpenIntegrations={() => {
            setIsExportModalOpen(false);
            setIsIntegrationsModalOpen(true);
          }}
        />
      )}

      {/* Multi-Part Assembly Modeling with Mates & Exploded View */}
      {isAssemblyModalOpen && (
        <AssemblyModal
          isOpen={isAssemblyModalOpen}
          onClose={() => setIsAssemblyModalOpen(false)}
          activePart={activePart}
          onUpdateAssembly={(components, constraints, explodePct, showMatingIndicators = true) => {
            const solved = solveAssemblyMates(components, constraints, explodePct);
            const group = buildAssemblySceneGroup(solved, true, {
              showMatingIndicators,
              activeSuggestions: solved.smartSuggestions,
            });
            setAssemblyModelGroup(group);
            setIsAssemblyModalOpen(false);
          }}
        />
      )}

      {/* Sheet Metal Design (Flange, Bend Radius, K-Factor, Unfold DXF) */}
      {isSheetMetalModalOpen && (
        <SheetMetalModal
          isOpen={isSheetMetalModalOpen}
          onClose={() => setIsSheetMetalModalOpen(false)}
          onApplySheetMetalPart={(smPart) => {
            setActivePart(smPart);
            setIsSheetMetalModalOpen(false);
          }}
        />
      )}

      {/* Surfacing Tools (Loft, Sweep, Fill Patch, Zebra Striping) */}
      {isSurfacingModalOpen && (
        <SurfacingModal
          isOpen={isSurfacingModalOpen}
          onClose={() => setIsSurfacingModalOpen(false)}
          onApplySurface={(surfPart) => {
            setActivePart(surfPart);
            setIsSurfacingModalOpen(false);
          }}
        />
      )}

      {/* FEA Static Stress & Deflection Simulation */}
      {isFEAModalOpen && (
        <FEAModal
          isOpen={isFEAModalOpen}
          onClose={() => setIsFEAModalOpen(false)}
          part={activePart}
          onApplyFEAModel={(group) => {
            setFeaModelGroup(group);
            setIsFEAModalOpen(false);
          }}
        />
      )}

      {/* Collaboration, Version Snapshots & 3D Annotations */}
      {isCollaborationModalOpen && (
        <CollaborationModal
          isOpen={isCollaborationModalOpen}
          onClose={() => setIsCollaborationModalOpen(false)}
          currentPart={activePart}
          onRestoreVersion={(restoredPart) => {
            setActivePart(restoredPart);
            setIsCollaborationModalOpen(false);
          }}
        />
      )}

      {/* CAD Integrations (SolidWorks, Fusion 360, Webhooks) */}
      {isIntegrationsModalOpen && (
        <IntegrationsModal
          isOpen={isIntegrationsModalOpen}
          onClose={() => setIsIntegrationsModalOpen(false)}
          currentPart={activePart}
        />
      )}

      {/* Generative Design & SIMP Topology Optimization */}
      {isGenerativeDesignModalOpen && (
        <GenerativeDesignModal
          isOpen={isGenerativeDesignModalOpen}
          onClose={() => setIsGenerativeDesignModalOpen(false)}
          part={activePart}
        />
      )}

      {/* Plugin Manager & Developer Extensibility SDK */}
      {isPluginManagerModalOpen && (
        <PluginManagerModal
          isOpen={isPluginManagerModalOpen}
          onClose={() => setIsPluginManagerModalOpen(false)}
          part={activePart}
        />
      )}

      {/* Material & Cost Estimator Modal (Part & Assembly Rollup) */}
      {isCostEstimatorOpen && (
        <MaterialCostEstimatorModal
          isOpen={isCostEstimatorOpen}
          onClose={() => setIsCostEstimatorOpen(false)}
          activePart={activePart}
          onUpdatePartMaterial={handleMaterialChange}
          onUnitChange={(newUnit) => {
            setActivePart((prev) => ({
              ...prev,
              units: newUnit,
            }));
          }}
        />
      )}

      {/* Engineering Checks & Validation Modal (Formal PDF Report) */}
      {isEngineeringChecksModalOpen && (
        <EngineeringChecksModal
          isOpen={isEngineeringChecksModalOpen}
          onClose={() => setIsEngineeringChecksModalOpen(false)}
          activePart={activePart}
          onApplyFix={handleParameterChange}
          onUnitChange={(newUnit) => {
            setActivePart((prev) => ({
              ...prev,
              units: newUnit,
            }));
          }}
        />
      )}

      {/* Direct Feature Modeling Parameter Modal */}
      {directActionModal && (
        <DirectFeatureModal
          isOpen={directActionModal.isOpen}
          onClose={() => setDirectActionModal(null)}
          actionId={directActionModal.actionId}
          selection={directActionModal.selection}
          onApplyFeature={handleApplyDirectFeature}
        />
      )}

      {/* 2D Parametric Sketcher Workspace Modal */}
      {isSketcherOpen && (
        <SketcherWorkspace
          isOpen={isSketcherOpen}
          onClose={() => setIsSketcherOpen(false)}
          activePlane={selectedPlane}
          onFinishSketchAndExtrude={handleFinishSketchAndExtrude}
          activePart={activePart}
        />
      )}

      {/* Standard Hardware Part Library Modal */}
      {isPartLibraryOpen && (
        <PartLibraryModal
          isOpen={isPartLibraryOpen}
          onClose={() => setIsPartLibraryOpen(false)}
          onInsertPart={handleInsertStandardPart}
        />
      )}

      {/* AI Image Studio Modal - Powered by gemini-3.1-flash-image-preview */}
      {isImageStudioOpen && (
        <ImageStudioModal
          isOpen={isImageStudioOpen}
          onClose={() => {
            setIsImageStudioOpen(false);
            setImageStudioInitialImage(null);
          }}
          initialImage={imageStudioInitialImage}
          partName={activePart.name}
          onCaptureViewport={() => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
            if (canvas) {
              try {
                return canvas.toDataURL('image/png');
              } catch (e) {
                console.error('Failed to capture canvas data:', e);
              }
            }
            return null;
          }}
        />
      )}

      {/* Keyboard Shortcuts & Hotkeys Cheat Sheet Overlay */}
      {isShortcutCheatSheetOpen && (
        <ShortcutCheatSheetModal
          isOpen={isShortcutCheatSheetOpen}
          onClose={() => setIsShortcutCheatSheetOpen(false)}
          onNavigateTab={(tab) => {
            setActiveSidebarTab(tab);
            setIsHome(false);
          }}
          onOpenVira={() => setIsViraBotOpen(true)}
          onOpenDrawing={() => setIsDrawingModalOpen(true)}
          onOpenTestSuite={() => setIsTestSuiteModalOpen(true)}
          onOpenMaker={() => setIsMakerModalOpen(true)}
          onOpenLibrary={() => setIsDesignLibraryOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenCollaboration={() => setIsCollaborationModalOpen(true)}
          onToggleHome={() => setIsHome((prev) => !prev)}
          onFocusAICommand={() => {
            const inputEl = document.getElementById('input-ai-command') as HTMLInputElement | null;
            if (inputEl) {
              inputEl.focus();
              inputEl.select();
            }
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Visible on <lg screens) */}
      <MobileBottomNav
        currentScreen={isHome ? 'home' : isDashboard ? 'dashboard' : 'cad'}
        isDesignLibraryOpen={isDesignLibraryOpen}
        onNavigateHome={() => {
          setIsHome(true);
          setIsDashboard(false);
        }}
        onNavigateCAD={() => {
          setIsHome(false);
          setIsDashboard(false);
          setMobileTab('viewer');
        }}
        onNavigateLibrary={() => setIsDesignLibraryOpen(true)}
        onNavigateMaterials={() => {
          setIsHome(false);
          setIsDashboard(false);
          setMobileTab('params');
          setActiveSidebarTab('params');
        }}
        onNavigateProjects={() => {
          setIsDashboard(true);
          setIsHome(false);
        }}
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
