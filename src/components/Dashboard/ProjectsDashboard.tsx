import React, { useState, useEffect, useMemo } from 'react';
import { CADPart, PartType } from '../../types/cad';
import {
  getAllProjectsOffline,
  savePartOffline,
  deleteProjectOffline,
  ProjectRecord,
} from '../../engine/offlineStorage';
import { createPresetPart } from '../../engine/cadParser';
import {
  Search,
  Filter,
  Calendar,
  FolderOpen,
  Trash2,
  Copy,
  Plus,
  ArrowUpDown,
  Clock,
  Tag,
  Box,
  Check,
  X,
  Sparkles,
  Layers,
  Download,
  ExternalLink,
  ChevronDown,
  FileCode,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ProjectsDashboardProps {
  onOpenProject: (part: CADPart) => void;
  onNewProject: (presetType?: PartType) => void;
  onClose?: () => void;
  currentPart?: CADPart;
}

// Preset samples seeded if user storage is empty
const INITIAL_SEED_PROJECTS: Array<{ type: PartType; name: string; dateOffsetDays: number }> = [
  { type: 'stepped_shaft', name: 'Stepped Transmission Input Shaft (AISI 4140)', dateOffsetDays: 0 },
  { type: 'gear', name: 'Planetary Sun Reduction Gear 24T (Steel 8620)', dateOffsetDays: 1 },
  { type: 'bearing_housing', name: 'Precision Double-Flanged Bearing Housing (Bronze 932)', dateOffsetDays: 2 },
  { type: 'helical_gear', name: 'High-Torque Helical Pinion Drive (Steel 4340)', dateOffsetDays: 4 },
  { type: 'shaft', name: 'High-Speed Spindle Drive Shaft (SS 304)', dateOffsetDays: 7 },
  { type: 'pulley', name: 'Dual-Groove V-Belt Power Transmission Pulley (Al 7075)', dateOffsetDays: 12 },
];

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  onOpenProject,
  onNewProject,
  onClose,
  currentPart,
}) => {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load and seed projects
  const loadProjects = async () => {
    setIsLoading(true);
    try {
      let records = await getAllProjectsOffline();

      // If active part is available, ensure it's saved
      if (currentPart && !records.some((r) => r.id === currentPart.id)) {
        await savePartOffline(currentPart);
        records = await getAllProjectsOffline();
      }

      // Seed if empty
      if (records.length === 0) {
        for (const seed of INITIAL_SEED_PROJECTS) {
          const part = createPresetPart(seed.type);
          part.name = seed.name;
          const fakeTime = Date.now() - seed.dateOffsetDays * 86400000;
          await savePartOffline(part);
        }
        records = await getAllProjectsOffline();
      }

      setProjects(records);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Live filtering and sorting
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return projects
      .filter((record) => {
        const part = record.part;
        const name = (record.name || part?.name || '').toLowerCase();
        const partType = (part?.part_type || record.type || '').toLowerCase();
        const material = (part?.material?.name || '').toLowerCase();

        // 1. Search Query Filter (name, part type, material)
        if (q && !name.includes(q) && !partType.includes(q) && !material.includes(q)) {
          return false;
        }

        // 2. Project Type Filter
        if (selectedType !== 'all') {
          if (partType !== selectedType.toLowerCase()) {
            return false;
          }
        }

        // 3. Date Modified Filter
        if (dateRangeFilter !== 'all') {
          const ageMs = now - (record.savedAt || now);
          if (dateRangeFilter === 'today' && ageMs > 86400000) return false;
          if (dateRangeFilter === 'week' && ageMs > 7 * 86400000) return false;
          if (dateRangeFilter === 'month' && ageMs > 30 * 86400000) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return (b.savedAt || 0) - (a.savedAt || 0);
        }
        if (sortBy === 'date_asc') {
          return (a.savedAt || 0) - (b.savedAt || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });
  }, [projects, searchQuery, selectedType, sortBy, dateRangeFilter]);

  // Actions
  const handleDuplicate = async (record: ProjectRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const clonedPart: CADPart = JSON.parse(JSON.stringify(record.part));
      clonedPart.id = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      clonedPart.name = `${clonedPart.name} (Copy)`;
      await savePartOffline(clonedPart);
      await loadProjects();
      showToast(`Duplicated: ${clonedPart.name}`);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProjectOffline(id);
      setDeleteConfirmId(null);
      await loadProjects();
      showToast('Project deleted');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const availableTypes: { id: string; label: string }[] = [
    { id: 'all', label: 'All Part Types' },
    { id: 'shaft', label: 'Shafts & Axles' },
    { id: 'stepped_shaft', label: 'Stepped Shafts' },
    { id: 'gear', label: 'Gears & Pinions' },
    { id: 'helical_gear', label: 'Helical Gears' },
    { id: 'bearing', label: 'Bearings' },
    { id: 'bearing_housing', label: 'Bearing Housings & Flanges' },
    { id: 'pulley', label: 'Pulleys & Sheaves' },
    { id: 'bracket', label: 'Brackets & Mounts' },
    { id: 'sprocket', label: 'Sprockets' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-[#020D08] text-[#F0FDF4] transition-colors">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-[#102B21] border border-[#00F5A0] rounded-lg shadow-xl text-xs font-mono text-[#00F5A0] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#00F5A0]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(16,185,129,0.15)] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
                <Box className="w-5 h-5 text-[#00F5A0]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#F0FDF4] tracking-tight">
                  Projects & Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-[#8CA89E] font-mono mt-0.5">
                  Manage, search, filter, and inspect parametric mechanical CAD parts & assemblies
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onClose && (
              <button
                id="btn-back-to-cad"
                onClick={onClose}
                className="px-3 py-2 rounded-lg bg-[#0B1E17] hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-xs font-mono text-[#8CA89E] hover:text-[#F0FDF4] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Back to 3D CAD</span>
              </button>
            )}

            <button
              id="btn-new-project"
              onClick={() => onNewProject('shaft')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F5A0] to-[#00D98B] hover:brightness-110 text-[#02140D] text-xs font-mono font-bold transition-all shadow-md hover:shadow-[#00F5A0]/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#02140D]" />
              <span>New CAD Project</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#0B1E17] border border-[rgba(16,185,129,0.2)] rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Live Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8CA89E]" />
              <input
                id="project-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, type, or material (live update)..."
                className="w-full pl-9 pr-9 py-2.5 bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-lg text-xs sm:text-sm font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] focus:outline-none focus:border-[#00F5A0] transition-colors"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA89E] hover:text-[#00F5A0] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Project Type */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  id="filter-project-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-lg text-xs font-mono text-[#F0FDF4] focus:outline-none focus:border-[#00F5A0] appearance-none cursor-pointer pr-8"
                >
                  {availableTypes.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#071510] text-[#F0FDF4]">
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E] pointer-events-none" />
              </div>
            </div>

            {/* Filter / Sort by Date or Name */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  id="filter-sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#071510] border border-[rgba(16,185,129,0.25)] rounded-lg text-xs font-mono text-[#F0FDF4] focus:outline-none focus:border-[#00F5A0] appearance-none cursor-pointer pr-8"
                >
                  <option value="date_desc" className="bg-[#071510] text-[#F0FDF4]">
                    Sort: Recently Modified
                  </option>
                  <option value="date_asc" className="bg-[#071510] text-[#F0FDF4]">
                    Sort: Oldest Modified
                  </option>
                  <option value="name_asc" className="bg-[#071510] text-[#F0FDF4]">
                    Sort: Name (A → Z)
                  </option>
                  <option value="name_desc" className="bg-[#071510] text-[#F0FDF4]">
                    Sort: Name (Z → A)
                  </option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Date Filter Chips & Match Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(16,185,129,0.1)] text-xs font-mono">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-[#8CA89E] flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Modified:</span>
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Past 7 Days' },
                { id: 'month', label: 'Past 30 Days' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  id={`filter-date-${chip.id}`}
                  onClick={() => setDateRangeFilter(chip.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer shrink-0 ${
                    dateRangeFilter === chip.id
                      ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                      : 'bg-[#071510] hover:bg-[#102B21] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.15)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="text-[#8CA89E] text-[11px] font-mono shrink-0">
              Showing <span className="text-[#00F5A0] font-bold">{filteredProjects.length}</span> of{' '}
              {projects.length} projects
            </div>
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-mono text-[#8CA89E]">Loading CAD repository...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-[#0B1E17]/60 border border-[rgba(16,185,129,0.15)] space-y-3">
            <FolderOpen className="w-10 h-10 text-[#8CA89E] mx-auto opacity-50" />
            <h3 className="text-sm font-mono font-bold text-[#F0FDF4]">No matching projects found</h3>
            <p className="text-xs text-[#8CA89E] max-w-sm mx-auto font-mono">
              Try adjusting your search query or reset filter options to view available CAD designs.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setDateRangeFilter('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#102B21] border border-[#00F5A0]/40 text-xs font-mono text-[#00F5A0] hover:bg-[#16382B] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((record) => {
              const part = record.part;
              const isCurrent = currentPart && currentPart.id === record.id;
              const material = part?.material?.name || 'Aluminum 6061-T6';
              const partType = part?.part_type || 'shaft';

              return (
                <div
                  key={record.id}
                  id={`project-card-${record.id}`}
                  onClick={() => onOpenProject(part)}
                  className={`group relative rounded-xl p-4 bg-[#0B1E17] hover:bg-[#102B21] border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-lg ${
                    isCurrent
                      ? 'border-[#00F5A0] ring-1 ring-[#00F5A0]/40'
                      : 'border-[rgba(16,185,129,0.2)] hover:border-[#00F5A0]/50'
                  }`}
                >
                  {/* Top Bar: Type Pill & Active Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] font-mono uppercase tracking-wider font-semibold">
                      {partType.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00F5A0] text-[#02140D] font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[#8CA89E] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8CA89E]" />
                        <span>{formatDate(record.savedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Material */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-mono font-bold text-[#F0FDF4] group-hover:text-[#00F5A0] transition-colors truncate">
                      {record.name || part?.name || 'Unnamed Project'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#8CA89E]">
                      <Tag className="w-3 h-3 text-[#00F5A0] shrink-0" />
                      <span className="truncate">{material}</span>
                    </div>
                  </div>

                  {/* Param Highlights */}
                  {part?.parameters && (
                    <div className="p-2 rounded-lg bg-[#071510] border border-[rgba(16,185,129,0.1)] text-[11px] font-mono text-[#8CA89E] flex items-center justify-between">
                      <span className="text-[#8CA89E]">Parameters:</span>
                      <span className="text-[#F0FDF4] font-medium">
                        {Object.keys(part.parameters).length} dynamic constraints
                      </span>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div className="pt-2 border-t border-[rgba(16,185,129,0.12)] flex items-center justify-between gap-2">
                    <button
                      id={`btn-open-proj-${record.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProject(part);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#102B21] group-hover:bg-[#00F5A0] text-xs font-mono text-[#00F5A0] group-hover:text-[#02140D] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Open in 3D</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-duplicate-proj-${record.id}`}
                        title="Duplicate Project"
                        onClick={(e) => handleDuplicate(record, e)}
                        className="p-1.5 rounded-lg hover:bg-[#16382B] text-[#8CA89E] hover:text-[#F0FDF4] transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === record.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDelete(record.id, e)}
                            className="px-1.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono hover:bg-red-500 hover:text-white"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="p-1 text-[#8CA89E] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-delete-proj-${record.id}`}
                          title="Delete Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(record.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#8CA89E] hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
