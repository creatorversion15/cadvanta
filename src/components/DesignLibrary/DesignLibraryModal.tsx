import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  DESIGN_REGISTRY,
  DESIGN_PACKS,
  DesignRegistryItem,
  DesignCategory,
  getAllCategories,
} from '../../data/designRegistry';
import { useDesignAccess } from '../../context/DesignAccessContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { DesignCard } from './DesignCard';
import { DesignDetailsModal } from './DesignDetailsModal';
import { PremiumUnlockModal } from './PremiumUnlockModal';
import { CADPart, PartType } from '../../types/cad';

interface DesignLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePart?: CADPart;
  onSelectDesign: (design: DesignRegistryItem) => void;
  onAddToAssembly?: (design: DesignRegistryItem) => void;
}

type AccessFilter = 'all' | 'free' | 'premium' | 'unlocked' | 'locked';
type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
type ViewMode = 'all_categories' | 'my_designs';
type MyDesignsSubTab = 'all_owned' | 'favorites' | 'recents' | 'purchased' | 'free';

export const DesignLibraryModal: React.FC<DesignLibraryModalProps> = ({
  isOpen,
  onClose,
  activePart,
  onSelectDesign,
  onAddToAssembly,
}) => {
  const {
    getDesignAccessStatus,
    canAccessDesign,
    isDesignLocked,
    favoriteDesignIds,
    recentDesignIds,
    unlockedDesignIds,
    recordRecentDesign,
    openUnlockModal,
  } = useDesignAccess();

  const { isPro, openSubscriptionModal } = useSubscription();
  const { requireAuth } = useAuth();

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all_categories');
  const [myDesignsTab, setMyDesignsTab] = useState<MyDesignsSubTab>('all_owned');

  const categories = useMemo(() => ['All', ...getAllCategories()], []);

  // Filter logic
  const filteredDesigns = useMemo(() => {
    return DESIGN_REGISTRY.filter((design) => {
      // 1. My Designs view filtering
      if (viewMode === 'my_designs') {
        if (myDesignsTab === 'favorites') {
          if (!favoriteDesignIds.includes(design.id)) return false;
        } else if (myDesignsTab === 'recents') {
          if (!recentDesignIds.includes(design.id)) return false;
        } else if (myDesignsTab === 'purchased') {
          if (!unlockedDesignIds.includes(design.id)) return false;
        } else if (myDesignsTab === 'free') {
          if (design.access !== 'FREE') return false;
        } else {
          // all_owned
          if (!canAccessDesign(design.id)) return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && viewMode === 'all_categories') {
        if (design.category !== selectedCategory) return false;
      }

      // 3. Access filter
      if (accessFilter === 'free' && design.access !== 'FREE') return false;
      if (accessFilter === 'premium' && design.access !== 'PREMIUM') return false;
      if (accessFilter === 'unlocked' && !canAccessDesign(design.id)) return false;
      if (accessFilter === 'locked' && !isDesignLocked(design.id)) return false;

      // 4. Difficulty filter
      if (difficultyFilter !== 'all' && design.difficulty !== difficultyFilter) return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = design.name.toLowerCase().includes(q);
        const matchesCategory = design.category.toLowerCase().includes(q);
        const matchesDesc = design.description.toLowerCase().includes(q);
        const matchesStandard = design.standard.toLowerCase().includes(q);
        const matchesTags = design.tags.some((t) => t.toLowerCase().includes(q));
        const matchesApps = design.applications.some((a) => a.toLowerCase().includes(q));

        return matchesName || matchesCategory || matchesDesc || matchesStandard || matchesTags || matchesApps;
      }

      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    accessFilter,
    difficultyFilter,
    viewMode,
    myDesignsTab,
    favoriteDesignIds,
    recentDesignIds,
    unlockedDesignIds,
    isPro,
  ]);

  if (!isOpen) return null;

  const handleSelectDesignInternal = (design: DesignRegistryItem) => {
    if (isDesignLocked(design.id)) {
      requireAuth(
        () => {
          openUnlockModal({
            type: 'single',
            design,
            priceInr: design.priceInr || 99,
          });
        },
        {
          title: 'Sign in to Unlock Design',
          subtitle: `Sign in to access and customize "${design.name}".`,
        }
      );
      return;
    }

    recordRecentDesign(design.id);
    onSelectDesign(design);
    onClose();
  };

  const handleDesignActivated = (designId: string) => {
    const design = DESIGN_REGISTRY.find((d) => d.id === designId);
    if (design) {
      recordRecentDesign(design.id);
      onSelectDesign(design);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[94vh] bg-[#040E0A] border border-[rgba(16,185,129,0.3)] rounded-2xl shadow-[0_0_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        {/* =========================================================
            1. TOP MASTER HEADER BAR
            ========================================================= */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#071913] via-[#0B251C] to-[#071913] border-b border-[rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#102B21] to-[#040E0A] border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.2)]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-bold text-[#F0FDF4] tracking-wide flex items-center gap-2">
                  <span>CADVANTA MECHANICAL DESIGN LIBRARY</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5A0]/15 border border-[#00F5A0]/40 text-[#00F5A0] text-[10px] font-mono font-bold">
                  60+ MODELS
                </span>
              </div>
              <p className="text-xs text-[#8CA89E] mt-0.5">
                Search, inspect, unlock and generate ISO/DIN standard mechanical models with live FEA & 3D CAD geometry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: All vs My Designs */}
            <div className="bg-[#07130F] p-1 rounded-xl border border-[rgba(16,185,129,0.2)] flex items-center gap-1">
              <button
                id="btn-tab-all-designs"
                onClick={() => setViewMode('all_categories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'all_categories'
                    ? 'bg-[#102B21] text-[#00F5A0] shadow-sm border border-[#00F5A0]/30'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Designs</span>
              </button>

              <button
                id="btn-tab-my-designs"
                onClick={() => setViewMode('my_designs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'my_designs'
                    ? 'bg-[#102B21] text-[#00F5A0] shadow-sm border border-[#00F5A0]/30'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>My Designs</span>
              </button>
            </div>

            {/* Pro Status or Pro Upgrade Banner */}
            {isPro ? (
              <span className="px-3 py-1.5 rounded-xl bg-[#00D9FF]/20 border border-[#00D9FF]/50 text-[#00D9FF] text-xs font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> PRO ACTIVE
              </span>
            ) : (
              <button
                id="btn-header-unlock-pro"
                onClick={() => openSubscriptionModal('Unlock all 60+ designs via CADVANTA PRO')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#07130F] text-xs font-mono font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>UNLOCK ALL (₹1.69)</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#102B21] transition-colors border border-[rgba(16,185,129,0.2)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            2. SEARCH & FILTER CONTROLS BAR
            ========================================================= */}
        <div className="px-6 py-3 bg-[#07130F] border-b border-[rgba(16,185,129,0.15)] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 text-[#8CA89E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-designs"
              type="text"
              placeholder="Search designs, standards (ISO/DIN/AGMA), tags, materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#040E0A] border border-[rgba(16,185,129,0.25)] focus:border-[#00F5A0] rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-[#F0FDF4] placeholder:text-[#4E6B60] outline-none shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8CA89E] hover:text-[#F0FDF4]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Access Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-[#8CA89E] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Access:
            </span>
            {(['all', 'free', 'premium', 'unlocked', 'locked'] as AccessFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAccessFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                  accessFilter === f
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40'
                    : 'bg-[#040E0A] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.15)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Difficulty Filter Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#8CA89E] uppercase mr-1">Level:</span>
            {(['all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as DifficultyFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                  difficultyFilter === d
                    ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40'
                    : 'bg-[#040E0A] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.15)]'
                }`}
              >
                {d === 'all' ? 'ALL' : d}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================
            3. CATEGORIES & SUB-TABS NAVIGATION
            ========================================================= */}
        <div className="px-6 py-2.5 bg-[#040E0A] border-b border-[rgba(16,185,129,0.1)] overflow-x-auto flex items-center gap-2 custom-scrollbar">
          {viewMode === 'my_designs' ? (
            /* Sub-tabs for My Designs */
            <>
              <button
                onClick={() => setMyDesignsTab('all_owned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  myDesignsTab === 'all_owned'
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Accessible Designs</span>
              </button>

              <button
                onClick={() => setMyDesignsTab('favorites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  myDesignsTab === 'favorites'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Favorite Designs ({favoriteDesignIds.length})</span>
              </button>

              <button
                onClick={() => setMyDesignsTab('recents')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  myDesignsTab === 'recents'
                    ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 font-bold'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Recently Used</span>
              </button>

              <button
                onClick={() => setMyDesignsTab('purchased')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  myDesignsTab === 'purchased'
                    ? 'bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/40 font-bold'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Purchased Models ({unlockedDesignIds.length})</span>
              </button>

              <button
                onClick={() => setMyDesignsTab('free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  myDesignsTab === 'free'
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold'
                    : 'text-[#8CA89E] hover:text-[#F0FDF4]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Free Designs</span>
              </button>
            </>
          ) : (
            /* Category Chips */
            categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold shadow-sm'
                    : 'bg-[#07130F] text-[#8CA89E] hover:text-[#F0FDF4] border border-[rgba(16,185,129,0.15)]'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>

        {/* =========================================================
            4. MAIN SCROLLABLE CONTENT AREA
            ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#040E0A] to-[#020705]">
          {/* Design Packs Banner Strip (if viewing all and no search) */}
          {viewMode === 'all_categories' && selectedCategory === 'All' && !searchQuery && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F0FDF4]">
                    FEATURED DESIGN PACKS (SAVE UP TO 60%)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DESIGN_PACKS.slice(0, 3).map((pack) => (
                  <div
                    key={pack.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-[#0B1E17] to-[#040E0A] border border-[rgba(245,158,11,0.3)] hover:border-[#F59E0B] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold">
                          {pack.designIds.length} MODELS INCLUDED
                        </span>
                        <span className="text-sm font-mono font-bold text-[#00F5A0]">
                          ₹{pack.priceInr}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono font-bold text-[#F0FDF4]">{pack.name}</h4>
                      <p className="text-[11px] text-[#8CA89E] mt-1 line-clamp-2 leading-relaxed">
                        {pack.description}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        requireAuth(
                          () =>
                            openUnlockModal({
                              type: 'pack',
                              pack,
                              priceInr: pack.priceInr,
                            }),
                          {
                            title: 'Sign in to Unlock Design Pack',
                            subtitle: `Sign in to purchase and access "${pack.name}".`,
                          }
                        )
                      }
                      className="mt-3 w-full py-2 px-3 rounded-lg bg-[#F59E0B]/10 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/40 text-[#F59E0B] hover:text-[#F0FDF4] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>UNLOCK PACK (₹{pack.priceInr})</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-[#8CA89E] pb-1 border-b border-[rgba(16,185,129,0.1)]">
            <span>
              Showing <strong className="text-[#00F5A0]">{filteredDesigns.length}</strong> mechanical
              designs
            </span>
            {searchQuery && (
              <span>
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Models Grid */}
          {filteredDesigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onSelect={handleSelectDesignInternal}
                  onAddToAssembly={onAddToAssembly}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#102B21] border border-[rgba(16,185,129,0.2)] flex items-center justify-center text-[#8CA89E] mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-mono font-bold text-[#F0FDF4]">No mechanical designs found</h4>
              <p className="text-xs text-[#8CA89E] max-w-sm mx-auto">
                Try adjusting your search keywords or switching category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setAccessFilter('all');
                  setDifficultyFilter('all');
                  setViewMode('all_categories');
                }}
                className="px-4 py-2 rounded-xl bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-bold hover:bg-[#153A2C] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Modals (Details & Payment) */}
      <DesignDetailsModal
        onSelectDesign={handleSelectDesignInternal}
        onAddToAssembly={onAddToAssembly}
      />
      <PremiumUnlockModal onDesignActivated={handleDesignActivated} />
    </div>
  );
};
