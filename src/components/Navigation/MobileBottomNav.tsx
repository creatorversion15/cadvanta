import React from 'react';
import { Home, Compass, Layers, Scale, FolderOpen } from 'lucide-react';

interface MobileBottomNavProps {
  currentScreen: 'home' | 'cad' | 'dashboard';
  isDesignLibraryOpen: boolean;
  onNavigateHome: () => void;
  onNavigateCAD: () => void;
  onNavigateLibrary: () => void;
  onNavigateMaterials: () => void;
  onNavigateProjects: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  isDesignLibraryOpen,
  onNavigateHome,
  onNavigateCAD,
  onNavigateLibrary,
  onNavigateMaterials,
  onNavigateProjects,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071510]/95 backdrop-blur-xl border-t border-[rgba(16,185,129,0.2)] px-2 py-1 flex items-center justify-around select-none shadow-[0_-4px_25px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      {/* 1. Home */}
      <button
        id="nav-btn-mobile-home"
        type="button"
        onClick={onNavigateHome}
        className={`flex-1 min-h-[48px] py-1 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'home' && !isDesignLibraryOpen
            ? 'text-[#00F5A0] font-bold'
            : 'text-[#8CA89E] hover:text-[#F0FDF4] active:scale-95'
        }`}
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentScreen === 'home' && !isDesignLibraryOpen
              ? 'bg-[#00F5A0]/15 text-[#00F5A0]'
              : 'text-[#8CA89E]'
          }`}
        >
          <Home className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono tracking-tight leading-none">Home</span>
      </button>

      {/* 2. CAD Generator / Studio */}
      <button
        id="nav-btn-mobile-cad"
        type="button"
        onClick={onNavigateCAD}
        className={`flex-1 min-h-[48px] py-1 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'cad' && !isDesignLibraryOpen
            ? 'text-[#00F5A0] font-bold'
            : 'text-[#8CA89E] hover:text-[#F0FDF4] active:scale-95'
        }`}
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentScreen === 'cad' && !isDesignLibraryOpen
              ? 'bg-[#00F5A0]/15 text-[#00F5A0]'
              : 'text-[#8CA89E]'
          }`}
        >
          <Compass className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono tracking-tight leading-none">CAD Studio</span>
      </button>

      {/* 3. Design Library */}
      <button
        id="nav-btn-mobile-library"
        type="button"
        onClick={onNavigateLibrary}
        className={`flex-1 min-h-[48px] py-1 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          isDesignLibraryOpen
            ? 'text-[#00F5A0] font-bold'
            : 'text-[#8CA89E] hover:text-[#F0FDF4] active:scale-95'
        }`}
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            isDesignLibraryOpen
              ? 'bg-[#00F5A0]/15 text-[#00F5A0]'
              : 'text-[#8CA89E]'
          }`}
        >
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono tracking-tight leading-none">Library</span>
      </button>

      {/* 4. Materials */}
      <button
        id="nav-btn-mobile-materials"
        type="button"
        onClick={onNavigateMaterials}
        className="flex-1 min-h-[48px] py-1 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl text-[#8CA89E] hover:text-[#F0FDF4] active:scale-95 transition-all cursor-pointer"
      >
        <div className="p-1 rounded-lg text-[#8CA89E]">
          <Scale className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono tracking-tight leading-none">Materials</span>
      </button>

      {/* 5. Projects / Dashboard */}
      <button
        id="nav-btn-mobile-projects"
        type="button"
        onClick={onNavigateProjects}
        className={`flex-1 min-h-[48px] py-1 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'dashboard' && !isDesignLibraryOpen
            ? 'text-[#00F5A0] font-bold'
            : 'text-[#8CA89E] hover:text-[#F0FDF4] active:scale-95'
        }`}
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentScreen === 'dashboard' && !isDesignLibraryOpen
              ? 'bg-[#00F5A0]/15 text-[#00F5A0]'
              : 'text-[#8CA89E]'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono tracking-tight leading-none">Projects</span>
      </button>
    </nav>
  );
};
