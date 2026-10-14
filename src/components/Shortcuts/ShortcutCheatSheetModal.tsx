import React, { useState, useMemo, useEffect } from 'react';
import {
  Keyboard,
  X,
  Search,
  Sliders,
  CheckCircle2,
  GitBranch,
  Bot,
  FileText,
  TestTube,
  Hammer,
  BookOpen,
  Download,
  Share2,
  Home,
  RotateCcw,
  Maximize2,
  Grid,
  Compass,
  Layers,
  Scissors,
  Mouse,
  Terminal,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ShortcutCategory =
  | 'all'
  | 'general'
  | 'sidebar'
  | 'viewport'
  | 'tools'
  | 'ai';

export interface ShortcutItem {
  id: string;
  keys: string[];
  title: string;
  description: string;
  category: Exclude<ShortcutCategory, 'all'>;
  actionId?: string;
  icon?: React.ReactNode;
}

interface ShortcutCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: 'params' | 'checks' | 'history') => void;
  onOpenVira?: () => void;
  onOpenDrawing?: () => void;
  onOpenTestSuite?: () => void;
  onOpenMaker?: () => void;
  onOpenLibrary?: () => void;
  onOpenExport?: () => void;
  onOpenCollaboration?: () => void;
  onToggleHome?: () => void;
  onFocusAICommand?: () => void;
}

export const ShortcutCheatSheetModal: React.FC<ShortcutCheatSheetModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenVira,
  onOpenDrawing,
  onOpenTestSuite,
  onOpenMaker,
  onOpenLibrary,
  onOpenExport,
  onOpenCollaboration,
  onToggleHome,
  onFocusAICommand,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory>('all');

  // OS Detection for command key representation (⌘ vs Ctrl)
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  // Keyboard listener for Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Comprehensive shortcut dictionary
  const shortcuts: ShortcutItem[] = useMemo(
    () => [
      // General & Navigation
      {
        id: 'toggle_shortcuts',
        keys: ['?'],
        title: 'Shortcut Cheat Sheet',
        description: 'Toggle this interactive keyboard hotkeys overlay anytime',
        category: 'general',
        icon: <HelpCircle className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'close_modal',
        keys: ['Esc'],
        title: 'Close Modal / Cancel',
        description: 'Dismiss any open dialog, modal, drawer, or dropdown menu',
        category: 'general',
        icon: <X className="w-4 h-4 text-[#8CA89E]" />,
      },
      {
        id: 'focus_ai_command',
        keys: [modifierKey, 'K'],
        title: 'Focus AI Command Bar',
        description: 'Instantly focus the natural language CAD Interpreter input',
        category: 'ai',
        actionId: 'focus_ai',
        icon: <Terminal className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'submit_ai_command',
        keys: ['Enter'],
        title: 'Execute AI Command',
        description: 'Submit conversational prompt to modify 3D CAD geometry',
        category: 'ai',
        icon: <Sparkles className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'toggle_home_view',
        keys: ['H'],
        title: 'Toggle Home Dashboard',
        description: 'Switch between the project overview dashboard and 3D CAD workspace',
        category: 'general',
        actionId: 'toggle_home',
        icon: <Home className="w-4 h-4 text-[#00F5A0]" />,
      },

      // Sidebar Panels
      {
        id: 'sidebar_params',
        keys: [modifierKey, '1'],
        title: 'Parameters & Dimensions',
        description: 'Open active part geometric dimensions, materials & live sliders',
        category: 'sidebar',
        actionId: 'tab_params',
        icon: <Sliders className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'sidebar_checks',
        keys: [modifierKey, '2'],
        title: 'Checks, DFM & FEA',
        description: 'Review manufacturability warnings, tolerances, and FEA stress state',
        category: 'sidebar',
        actionId: 'tab_checks',
        icon: <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'sidebar_history',
        keys: [modifierKey, '3'],
        title: 'Feature Tree & Snapshots',
        description: 'Inspect CAD generation pipeline stages, history log & revert versions',
        category: 'sidebar',
        actionId: 'tab_history',
        icon: <GitBranch className="w-4 h-4 text-[#00F5A0]" />,
      },

      // Quick Tools & Modals
      {
        id: 'open_vira_bot',
        keys: ['V'],
        title: 'Ask VIRA (Mechanical AI)',
        description: 'Launch VIRA engineering assistant for DFM explanations & stress math',
        category: 'tools',
        actionId: 'open_vira',
        icon: <Bot className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_drawing_modal',
        keys: ['D'],
        title: '2D Technical Drawing',
        description: 'Generate ASME/ISO compliant orthographic projections, sections & DXF',
        category: 'tools',
        actionId: 'open_drawing',
        icon: <FileText className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_test_suite',
        keys: ['T'],
        title: 'Test Suite & Benchmarks',
        description: 'Run automated geometry benchmarks, regression tests & validation',
        category: 'tools',
        actionId: 'open_test_suite',
        icon: <TestTube className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_maker_studio',
        keys: ['M'],
        title: 'CAD Maker Studio',
        description: 'Generate CNC milling toolpaths, G-code, 3D printing slicing & laser DXF',
        category: 'tools',
        actionId: 'open_maker',
        icon: <Hammer className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_design_library',
        keys: ['L'],
        title: 'Engineering Design Library',
        description: 'Browse 50+ parametric engineering standards, gears, shafts & bearings',
        category: 'tools',
        actionId: 'open_library',
        icon: <BookOpen className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_export_modal',
        keys: ['E'],
        title: 'Export CAD / CAM Formats',
        description: 'Export model to STEP B-Rep solid, STL mesh, DXF drawing, or OBJ',
        category: 'tools',
        actionId: 'open_export',
        icon: <Download className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'open_collaboration',
        keys: ['C'],
        title: 'Collaborate & Share',
        description: 'Generate shareable project links, invite reviewers & pin 3D annotations',
        category: 'tools',
        actionId: 'open_collab',
        icon: <Share2 className="w-4 h-4 text-[#00F5A0]" />,
      },

      // 3D Viewport & Camera Navigation
      {
        id: 'camera_reset',
        keys: ['R', 'or', 'Space'],
        title: 'Reset Camera View',
        description: 'Reset camera distance and focus to the default isometric CAD viewpoint',
        category: 'viewport',
        icon: <RotateCcw className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'toggle_fullscreen',
        keys: ['F'],
        title: 'Toggle Fullscreen',
        description: 'Expand the 3D WebGL viewport canvas to fill the entire monitor',
        category: 'viewport',
        icon: <Maximize2 className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'toggle_grid',
        keys: ['G'],
        title: 'Toggle Floor Grid',
        description: 'Show or hide the millimeter engineering coordinate floor grid',
        category: 'viewport',
        icon: <Grid className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'toggle_axes',
        keys: ['A'],
        title: 'Toggle Coordinate Axes',
        description: 'Show or hide 3D world origin RGB axes (X: Red, Y: Green, Z: Blue)',
        category: 'viewport',
        icon: <Compass className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'cycle_display_mode',
        keys: ['W'],
        title: 'Cycle Display Mode',
        description: 'Switch between Shaded with Edges, Technical Wireframe, and X-Ray Ghost',
        category: 'viewport',
        icon: <Layers className="w-4 h-4 text-[#00F5A0]" />,
      },
      {
        id: 'toggle_section_cut',
        keys: ['S'],
        title: 'Cross-Section Plane Cut',
        description: 'Slice model with interactive X, Y, or Z plane to inspect internal geometry',
        category: 'viewport',
        icon: <Scissors className="w-4 h-4 text-[#00F5A0]" />,
      },
    ],
    [modifierKey]
  );

  // Filter shortcuts by search query and selected category
  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shortcuts.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [shortcuts, selectedCategory, searchQuery]);

  // Trigger quick interactive actions directly from the cheat sheet
  const handleExecuteAction = (actionId?: string) => {
    if (!actionId) return;
    onClose();
    switch (actionId) {
      case 'focus_ai':
        if (onFocusAICommand) onFocusAICommand();
        break;
      case 'toggle_home':
        if (onToggleHome) onToggleHome();
        break;
      case 'tab_params':
        if (onNavigateTab) onNavigateTab('params');
        break;
      case 'tab_checks':
        if (onNavigateTab) onNavigateTab('checks');
        break;
      case 'tab_history':
        if (onNavigateTab) onNavigateTab('history');
        break;
      case 'open_vira':
        if (onOpenVira) onOpenVira();
        break;
      case 'open_drawing':
        if (onOpenDrawing) onOpenDrawing();
        break;
      case 'open_test_suite':
        if (onOpenTestSuite) onOpenTestSuite();
        break;
      case 'open_maker':
        if (onOpenMaker) onOpenMaker();
        break;
      case 'open_library':
        if (onOpenLibrary) onOpenLibrary();
        break;
      case 'open_export':
        if (onOpenExport) onOpenExport();
        break;
      case 'open_collab':
        if (onOpenCollaboration) onOpenCollaboration();
        break;
      default:
        break;
    }
  };

  const categories: { id: ShortcutCategory; label: string }[] = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'general', label: 'General & Navigation' },
    { id: 'sidebar', label: 'Sidebar Tabs' },
    { id: 'viewport', label: '3D Viewport & Camera' },
    { id: 'tools', label: 'Engineering Modals' },
    { id: 'ai', label: 'AI & Interpreter' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="shortcut-cheat-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#071510] border border-[rgba(16,185,129,0.3)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(16,185,129,0.18)] bg-[#0B1E17]/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.2)]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="shortcuts-dialog-title"
                  className="text-base font-mono font-bold text-[#F0FDF4] tracking-tight"
                >
                  CADVANTA Keyboard Shortcuts & Navigation
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#00F5A0] font-semibold hidden sm:inline-block">
                  {isMac ? 'macOS Keymap' : 'Win / Linux Keymap'}
                </span>
              </div>
              <p className="text-xs text-[#8CA89E] font-sans mt-0.5">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[#102B21] border border-[rgba(16,185,129,0.3)] text-[#00F5A0] font-mono font-bold text-[10px]">?</kbd> anywhere in workspace to toggle this cheat sheet
              </p>
            </div>
          </div>

          <button
            id="btn-close-shortcuts-sheet"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#102B21] hover:bg-[#16382B] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#F0FDF4] text-xs font-mono transition-colors cursor-pointer"
            title="Close Cheat Sheet (Esc)"
          >
            <span>Close</span>
            <kbd className="text-[10px] px-1 py-0.5 rounded bg-[#071510] text-[#8CA89E]">Esc</kbd>
            <X className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-[rgba(16,185,129,0.14)] bg-[#030A07]/70 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4E6B60]" />
            <input
              id="input-search-shortcuts"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotkeys (e.g. camera, tab, vira, zoom, export, grid)..."
              className="w-full pl-9 pr-8 py-2 bg-[#0B1E17] border border-[rgba(16,185,129,0.25)] focus:border-[#00F5A0] rounded-xl text-xs font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] focus:outline-none transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E] hover:text-[#F0FDF4] text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                    : 'bg-[#0B1E17] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] border border-[rgba(16,185,129,0.18)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Shortcuts Grid */}
          {filteredShortcuts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredShortcuts.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#0B1E17]/80 hover:bg-[#102B21] border border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/40 transition-colors group shadow-xs cursor-default"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-[#071510] border border-[rgba(16,185,129,0.15)] group-hover:border-[#00F5A0]/30 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#F0FDF4] truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#071510] text-[#4E6B60] group-hover:text-[#8CA89E] uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8CA89E] font-sans leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Keycaps */}
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, idx) =>
                        k === 'or' ? (
                          <span key={idx} className="text-[10px] text-[#4E6B60] font-mono px-0.5">
                            or
                          </span>
                        ) : (
                          <kbd
                            key={idx}
                            className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-[#071510] border border-[rgba(16,185,129,0.3)] shadow-[inset_0_-1px_0_rgba(16,185,129,0.25)] text-[#00F5A0] font-mono text-[11px] font-bold"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>

                    {/* Interactive Jump Button if action supported */}
                    {item.actionId && (
                      <button
                        onClick={() => handleExecuteAction(item.actionId)}
                        title="Jump to this panel / tool now"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#00F5A0] text-[#02140D] hover:bg-[#34EEA9] transition-all cursor-pointer shadow-xs ml-1"
                      >
                        <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-[#8CA89E] space-y-2">
              <Keyboard className="w-8 h-8 text-[#4E6B60] mx-auto opacity-50" />
              <p>No shortcuts match "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-[#00F5A0] hover:underline font-bold text-xs"
              >
                Clear filter & show all
              </button>
            </div>
          )}

          {/* 3D Mouse & Gesture Navigation Reference Panel */}
          <div className="mt-6 p-4 rounded-xl bg-[#030A07] border border-[rgba(16,185,129,0.22)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mouse className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-xs font-mono font-bold text-[#F0FDF4] uppercase tracking-wider">
                  3D Viewport Mouse & Trackpad Navigation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8CA89E]">CAD Orbit Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-[#0B1E17] border border-[rgba(16,185,129,0.15)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F0FDF4]">Orbit / Rotate</span>
                  <span className="text-[10px] font-mono text-[#00F5A0] font-bold">LMB</span>
                </div>
                <p className="text-[11px] text-[#8CA89E] font-sans">
                  Click and drag with the left mouse button to rotate the model around the origin.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0B1E17] border border-[rgba(16,185,129,0.15)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F0FDF4]">Pan Viewport</span>
                  <span className="text-[10px] font-mono text-[#00F5A0] font-bold">RMB or Shift+LMB</span>
                </div>
                <p className="text-[11px] text-[#8CA89E] font-sans">
                  Right-click drag or hold Shift while left-dragging to slide the camera target plane.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0B1E17] border border-[rgba(16,185,129,0.15)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F0FDF4]">Zoom In / Out</span>
                  <span className="text-[10px] font-mono text-[#00F5A0] font-bold">Wheel / Pinch</span>
                </div>
                <p className="text-[11px] text-[#8CA89E] font-sans">
                  Roll mouse scroll wheel or pinch trackpad to smoothly zoom in on fine features.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-[rgba(16,185,129,0.18)] bg-[#0B1E17]/90 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#8CA89E]">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
            <span>
              Pro Tip: Use <kbd className="px-1 py-0.5 bg-[#071510] text-[#00F5A0] rounded text-[10px] font-bold">{modifierKey}+1/2/3</kbd> to jump between sidebar tabs in one keystroke
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold rounded-lg transition-colors cursor-pointer text-center"
          >
            Got it (Esc)
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
