import React, { useState, useMemo } from 'react';
import { PartType } from '../../types/cad';
import {
  Sparkles,
  ArrowRight,
  Boxes,
  Cpu,
  ShieldCheck,
  Download,
  Zap,
  Sliders,
  Layers,
  Terminal,
  Bot,
  Linkedin,
  Instagram,
  Github,
  FolderOpen,
  Award,
  ExternalLink,
  Flame,
  Wind,
  Disc,
  Car,
  Truck,
  Shield,
  Factory,
  Plane,
  Compass,
  CheckCircle2,
  ChevronRight,
  Activity,
  BarChart3,
  Crown,
  Lock,
  Unlock,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { useSubscription, UPI_ID, FOUNDER_NAME, SUBSCRIPTION_PRICE_INR } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { SponsoredEngineeringAd } from '../Ads/SponsoredEngineeringAd';

interface LandingPageProps {
  onStartDesign: (initialPrompt?: string, presetType?: PartType) => void;
  onOpenDesignLibrary?: () => void;
  onOpenDashboard?: () => void;
  onOpenViraBot: () => void;
  onOpenMakerModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDesign,
  onOpenDesignLibrary,
  onOpenDashboard,
  onOpenViraBot,
  onOpenMakerModal,
}) => {
  const { isPro, openSubscriptionModal } = useSubscription();
  const { requireAuth } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Automotive');
  const [libraryCategory, setLibraryCategory] = useState<string>('All');

  const industries = [
    {
      id: 'Automotive',
      icon: Car,
      label: 'Automotive',
      desc: 'EV powertrains, dual-clutch packs, forged crankshafts & superchargers',
      specs: 'Efficiency: 96.4% • Thermal Peak: 142°C',
    },
    {
      id: 'Off-Highway',
      icon: Truck,
      label: 'Off-Highway',
      desc: 'Heavy hydraulic pumps, planetary wheel hubs & high-torque reducers',
      specs: 'Continuous Torque: 4,800 Nm • Shock ISO 10816',
    },
    {
      id: 'Defense',
      icon: Shield,
      label: 'Defense',
      desc: 'Armored all-terrain drivelines, Cardan cross spiders & sealed gearboxes',
      specs: 'Ballistic Grade 5 • MIL-STD-810H Certified',
    },
    {
      id: 'Stationary',
      icon: Factory,
      label: 'Stationary',
      desc: 'Industrial turbines, multi-megawatt generation units & Geneva drives',
      specs: 'Service Life: 40,000 hrs • ISO 1940-1 Balancing',
    },
    {
      id: 'Aerospace',
      icon: Plane,
      label: 'Aerospace',
      desc: 'Integrated gas turbine blisks, supersonic impellers & lightweight titanium hubs',
      specs: 'Rim Speed: 480 m/s • Ti-6Al-4V Aerofoil',
    },
    {
      id: 'Robotics',
      icon: Cpu,
      label: 'Robotics',
      desc: 'Zero-backlash cycloidal speed reducers, servo joints & harmonic gears',
      specs: 'Backlash: < 1 arcmin • 11:1 Ratio Compact',
    },
  ];

  const pipelineStages = [
    {
      num: '01',
      title: 'Market study, Benchmarking',
      desc: 'Extract kinematic & thermal targets against ISO standard baselines.',
      highlight: false,
    },
    {
      num: '02',
      title: 'Concept exploration',
      desc: 'Synthesize multi-variable 3D geometries, envelope bounds & mass optimizations in real-time.',
      highlight: true,
    },
    {
      num: '03',
      title: 'System specification',
      desc: 'Simulate Von Mises stress, shaft deflection, natural frequencies & factor of safety.',
      highlight: false,
    },
    {
      num: '04',
      title: 'Component specification',
      desc: 'Export production STL meshes, engineering blueprints & manufacturing CAM G-code.',
      highlight: false,
    },
  ];

  const samplePrompts: {
    title: string;
    prompt: string;
    type: PartType;
    tag: string;
    category: string;
    isPro?: boolean;
  }[] = [
    // IC Engines
    {
      title: 'Inline-4 Engine Cylinder Block',
      prompt: 'Design a heavy cast grey iron 4-cylinder engine block with Ø85 mm bored cylinder liners, 210 mm deck height, cooling water jackets, and 5-main bearing saddles.',
      type: 'engine_cylinder_block' as PartType,
      tag: 'IC Engine',
      category: 'Engines',
      isPro: true,
    },
    {
      title: 'DOHC 16-Valve Cylinder Head',
      prompt: 'Design an aluminum 4-cylinder DOHC 16-valve cylinder head with dual overhead cam towers, pent-roof combustion chambers, 4 valves per cylinder, and spark plug wells.',
      type: 'engine_cylinder_head' as PartType,
      tag: 'Valvetrain',
      category: 'Engines',
      isPro: true,
    },
    {
      title: '4-Cyl Forged Engine Crankshaft',
      prompt: 'Design a heavy forged steel 4-cylinder engine crankshaft with 80 mm stroke, Ø55 mm main journals, Ø48 mm rod journals, counterweights, and 8-bolt flywheel flange.',
      type: 'engine_crankshaft' as PartType,
      tag: 'Engine Crank',
      category: 'Engines',
      isPro: true,
    },
    {
      title: 'IC Engine High-Compression Piston',
      prompt: 'Design a high-compression aluminum engine piston for an 85 mm bore cylinder with 3.5 mm dish bowl, 3-ring pack grooves, and Ø22 mm wrist pin bore.',
      type: 'engine_piston' as PartType,
      tag: 'Engine Core',
      category: 'Engines',
    },
    {
      title: 'Forged H-Beam Connecting Rod',
      prompt: 'Design a forged steel H-beam connecting rod with 140 mm center-to-center length, Ø52 mm big-end bore, Ø22 mm small-end wrist pin bore, and high-tensile rod bolts.',
      type: 'engine_connecting_rod' as PartType,
      tag: 'Engine Rod',
      category: 'Engines',
    },
    {
      title: 'DOHC Multi-Lobe Camshaft',
      prompt: 'Design a precision ground DOHC camshaft with 8 intake/exhaust lobes (9.5 mm lift), 380 mm span length, induction-hardened journals, and timing drive sprocket.',
      type: 'engine_camshaft' as PartType,
      tag: 'Valvetrain',
      category: 'Engines',
    },
    {
      title: 'Combustion Poppet Valve & Seat',
      prompt: 'Design an IC engine poppet valve with Ø34 mm valve head, 45° ground seating face, Ø6 mm stem, 95 mm total length, and dual keeper collet grooves.',
      type: 'engine_valve' as PartType,
      tag: 'Valvetrain',
      category: 'Engines',
      isPro: true,
    },
    {
      title: 'Engine Flywheel & Ring Gear',
      prompt: 'Design an engine flywheel with Ø280 mm inertia rim, 115-tooth starter ring gear, recessed friction face, and 8-bolt crankshaft mounting flange.',
      type: 'engine_flywheel' as PartType,
      tag: 'Engine Inertia',
      category: 'Engines',
    },

    // Turbomachinery & Forced Induction
    {
      title: 'Gas Turbine Rotor (Blisk)',
      prompt: 'Design an aeronautical high-pressure turbine bladed disc (blisk) with Ø260 mm outer diameter, 18 aerofoil blades, fir-tree root geometry, and Ø45 mm center bore.',
      type: 'gas_turbine_blisk' as PartType,
      tag: 'Aerospace',
      category: 'Turbomachinery',
      isPro: true,
    },
    {
      title: 'Twin-Lobe Supercharger Rotor',
      prompt: 'Design a 60° helical twisted twin-lobe roots supercharger rotor with Ø92 mm outer diameter, 160 mm lobe span, and 24 mm splined drive bore.',
      type: 'roots_supercharger_rotor' as PartType,
      tag: 'Forced Induction',
      category: 'Turbomachinery',
      isPro: true,
    },
    {
      title: 'Billet Turbocharger Compressor',
      prompt: 'Design a high-efficiency billet aluminum turbocharger compressor impeller with Ø76 mm exducer, Ø52 mm inducer, 6 full blades and 6 splitter blades.',
      type: 'turbocharger_impeller' as PartType,
      tag: 'Turbocharger',
      category: 'Turbomachinery',
      isPro: true,
    },

    // Drivetrain & Gearboxes
    {
      title: '2-Stage Planetary Gearbox',
      prompt: 'Design a 2-stage planetary gearbox with 16:1 gear reduction ratio, module 2.0, sun teeth 12, planet teeth 24, and ring teeth 60.',
      type: 'planetary_gearbox' as PartType,
      tag: 'Gearbox',
      category: 'Powertrain',
      isPro: true,
    },
    {
      title: 'Multi-Plate Wet Clutch Pack',
      prompt: 'Design an automotive wet clutch assembly with external splined hub, 6 friction discs, inner splines, and helical pressure springs.',
      type: 'clutch_pack' as PartType,
      tag: 'Transmission',
      category: 'Powertrain',
      isPro: true,
    },
    {
      title: 'Universal Joint (Cardan Spider)',
      prompt: 'Design a heavy-duty 4-way universal joint spider cross with Ø28 mm trunnions, needle bearing cups, and dual drive yokes.',
      type: 'universal_joint' as PartType,
      tag: 'Drivetrain',
      category: 'Powertrain',
      isPro: true,
    },

    // Precision Robotics
    {
      title: 'Precision Cycloidal Speed Reducer',
      prompt: 'Design a zero-backlash robotic joint cycloidal drive disc with 11 cycloid lobes, 12 outer ring pins, eccentric cam offset, and 6 torque transfer holes.',
      type: 'cycloidal_drive' as PartType,
      tag: 'Robotics',
      category: 'Robotics',
      isPro: true,
    },
    {
      title: 'Geneva Rotary Indexing Wheel',
      prompt: 'Design a 6-slot Geneva indexing mechanism with 120 mm diameter star wheel, driver crank pin, and locking circular arc.',
      type: 'geneva_mechanism' as PartType,
      tag: 'Mechanisms',
      category: 'Robotics',
      isPro: true,
    },
  ];

  const libraryCategories = ['All', 'Engines', 'Turbomachinery', 'Powertrain', 'Robotics'];

  const filteredLibrary = useMemo(() => {
    if (libraryCategory === 'All') return samplePrompts;
    return samplePrompts.filter((item) => item.category === libraryCategory);
  }, [libraryCategory, samplePrompts]);

  const handleCardClick = (item: typeof samplePrompts[0]) => {
    if (item.isPro && !isPro) {
      requireAuth(
        () => {
          openSubscriptionModal(`Unlock ${item.title} (Hard Design Engine) for ₹${SUBSCRIPTION_PRICE_INR}`, item.type);
        },
        {
          title: 'Sign in to Access CAD Engine',
          subtitle: `Sign in to access and unlock ${item.title} (Hard Design Engine).`,
        }
      );
      return;
    }
    onStartDesign(item.prompt, item.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onStartDesign();
    } else {
      onStartDesign(prompt.trim());
    }
  };

  return (
    <div className="w-full min-h-full bg-[#030A07] text-[#F0FDF4] flex flex-col items-center justify-start overflow-y-auto px-4 py-8 sm:py-14 bg-cad-grid relative">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00F5A0]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Tag & Architecture Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1E17] border border-[rgba(16,185,129,0.22)] text-[#8CA89E] text-[10px] font-mono uppercase tracking-widest font-bold shadow-xs">
          <Boxes className="w-3.5 h-3.5 text-[#00F5A0]" />
          <span>SaaS Platform • Mechanical CAD & Power Systems</span>
        </div>

        <button
          onClick={onOpenMakerModal}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1E17] hover:bg-[#102B21] hover:border-[#00F5A0]/40 border border-[rgba(16,185,129,0.22)] text-[#8CA89E] hover:text-[#F0FDF4] text-[10px] font-mono uppercase tracking-widest font-bold transition-all group"
        >
          <div className="w-4 h-4 rounded-full bg-[#102B21] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold text-[9px] font-mono shrink-0">
            VB
          </div>
          <span>Architect: Viraj Bansod</span>
        </button>

        <button
          onClick={onOpenViraBot}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B1E17] hover:bg-[#102B21] text-[#00F5A0] hover:text-[#34EEA9] border border-[#00F5A0]/30 font-mono text-[10px] uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(0,245,160,0.18)] transition-all"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>VIRA AI Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
        </button>
      </div>

      {/* Main Hero Section */}
      <div className="text-center max-w-4xl space-y-4 relative z-10">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F0FDF4] font-mono leading-tight">
          Size and simulate power systems fast
        </h1>
        <p className="text-sm sm:text-lg text-[#8CA89E] font-sans max-w-2xl mx-auto leading-relaxed">
          Generate application-specific answers and demonstrate performance with unprecedented speed and fidelity. Powered by <strong className="text-[#F0FDF4]">CADVANTA</strong> and the <strong className="text-[#00F5A0]">VIRA AI Engine</strong>.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="hero-btn-launch-studio"
            onClick={() => onStartDesign()}
            className="px-7 py-3.5 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,245,160,0.35)] active:scale-95 cursor-pointer"
          >
            <span>Launch CAD Studio</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {onOpenDashboard && (
            <button
              id="hero-btn-open-dashboard"
              onClick={onOpenDashboard}
              className="px-6 py-3.5 bg-[#0B1E17] hover:bg-[#102B21] text-[#F0FDF4] hover:text-[#00F5A0] border border-[rgba(16,185,129,0.3)] hover:border-[#00F5A0] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#00F5A0]" />
              <span>Projects & Dashboard</span>
            </button>
          )}

          {onOpenDesignLibrary && (
            <button
              id="hero-btn-open-design-library"
              onClick={onOpenDesignLibrary}
              className="px-6 py-3.5 bg-gradient-to-r from-[#102B21] to-[#0B1E17] hover:from-[#153A2C] hover:to-[#102B21] text-[#00F5A0] border border-[#00F5A0]/50 hover:border-[#00F5A0] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,245,160,0.2)] active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#00F5A0]" />
              <span>Explore Design Library (60+)</span>
            </button>
          )}

          <button
            id="hero-btn-open-vira"
            onClick={onOpenViraBot}
            className="px-6 py-3.5 bg-[#0B1E17] hover:bg-[#102B21] text-[#00F5A0] border border-[#00F5A0]/40 hover:border-[#00F5A0] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Consult VIRA AI</span>
          </button>

          <button
            id="hero-btn-pro"
            onClick={() => openSubscriptionModal('Lifetime CADVANTA Pro Subscription')}
            className={`px-5 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer ${
              isPro
                ? 'bg-[#102B21] border border-[#00F5A0] text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.2)]'
                : 'bg-linear-to-r from-[#F59E0B]/20 to-[#00F5A0]/20 border border-[#F59E0B]/50 hover:border-[#00F5A0] text-[#F59E0B] hover:text-[#00F5A0]'
            }`}
          >
            <Crown className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{isPro ? 'PRO ACTIVE (₹1.69)' : 'GET PRO • ₹1.69 ONLY'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Hero Input Box */}
      <div className="w-full max-w-3xl mt-9 relative z-10">
        <form
          onSubmit={handleSubmit}
          className="relative bg-[#071510]/90 backdrop-blur-md border border-[rgba(16,185,129,0.25)] rounded-xl p-2 sm:p-3 shadow-2xl flex flex-col sm:flex-row gap-2 focus-within:border-[#00F5A0] focus-within:ring-1 focus-within:ring-[#00F5A0]/50 transition-all"
        >
          <div className="relative flex-1 flex items-center pl-3">
            <Terminal className="w-5 h-5 text-[#00F5A0] shrink-0 mr-2" />
            <input
              id="hero-input-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Design a stepped shaft 200 mm long, 30 mm diameter with 8 mm keyway..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#F0FDF4] placeholder:text-[#4E6B60] focus:outline-none font-sans"
            />
          </div>
          <button
            id="hero-btn-generate"
            type="submit"
            className="px-6 py-3 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,245,160,0.25)] active:scale-95 shrink-0 font-mono"
          >
            <span>Generate 3D CAD</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* Engineering Design & Sizing Flow Pipeline (ZeBeyond-Style Multi-Stage Diagram) */}
      <div className="w-full max-w-5xl mt-12 space-y-3 relative z-10">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8CA89E] uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[#00F5A0]" />
            <span>Integrated Power System & CAD Sizing Pipeline</span>
          </div>
          <span className="text-[11px] font-mono text-[#4E6B60]">ISO / DIN / ASME Compliant</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineStages.map((stage) => (
            <div
              key={stage.num}
              className={`p-4 rounded-xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                stage.highlight
                  ? 'bg-[#0B231B] border-2 border-[#00F5A0] shadow-[0_0_24px_rgba(0,245,160,0.25)]'
                  : 'bg-[#071510] border border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/30'
              }`}
            >
              {stage.highlight && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#00F5A0] text-[#02140D] font-mono font-extrabold text-[9px] uppercase tracking-wider">
                  Active
                </div>
              )}
              <div className="space-y-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                    stage.highlight
                      ? 'bg-[#00F5A0] text-[#02140D]'
                      : 'bg-[#0B1E17] text-[#00F5A0] border border-[rgba(16,185,129,0.25)]'
                  }`}
                >
                  {stage.num}
                </div>
                <h3 className="font-bold text-xs sm:text-sm font-mono text-[#F0FDF4] leading-snug">
                  {stage.title}
                </h3>
                <p className="text-[11px] text-[#8CA89E] font-sans leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[rgba(16,185,129,0.12)] flex items-center gap-1.5 text-[10px] font-mono text-[#00F5A0]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Deterministic Sizing</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Solutions Explorer (Automotive, Off-Highway, Defense, Aerospace, Robotics) */}
      <div className="w-full max-w-5xl mt-12 space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#00F5A0]" />
              <h2 className="text-sm font-bold font-mono text-[#F0FDF4] uppercase tracking-wider">
                Industry-Specific Engineering Applications
              </h2>
            </div>
            <p className="text-xs text-[#8CA89E] font-sans mt-0.5">
              Select an industry sector to inspect parametric mechanical sizing benchmarks.
            </p>
          </div>
        </div>

        {/* Industry Pill Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isSelected = selectedIndustry === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_12px_rgba(0,245,160,0.3)] scale-[1.02]'
                    : 'bg-[#071510] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ind.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Industry Showcase Card */}
        {(() => {
          const active = industries.find((i) => i.id === selectedIndustry) || industries[0];
          const Icon = active.icon;
          return (
            <div className="p-5 bg-[#071510] border border-[rgba(16,185,129,0.22)] rounded-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0B1E17] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold shadow-md shrink-0">
                  <Icon className="w-6 h-6 text-[#00F5A0]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold font-mono text-[#F0FDF4]">
                      {active.label} Engineering Architecture
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B231B] text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                      Domain Ready
                    </span>
                  </div>
                  <p className="text-xs text-[#8CA89E] font-sans max-w-xl leading-relaxed">
                    {active.desc}
                  </p>
                  <div className="text-[11px] font-mono text-[#00F5A0] pt-1">
                    {active.specs}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStartDesign()}
                className="px-5 py-2.5 bg-[#0B1E17] hover:bg-[#00F5A0] text-[#00F5A0] hover:text-[#02140D] border border-[#00F5A0]/40 hover:border-[#00F5A0] font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 shrink-0 shadow-xs active:scale-95"
              >
                <span>Size in CAD Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}
      </div>

      {/* CADVANTA PRO Subscription Showcase Section */}
      <div className="w-full max-w-5xl mt-14 relative z-10">
        <div className="p-6 sm:p-8 bg-linear-to-b from-[#0B231B] to-[#071510] border-2 border-[#00F5A0]/40 rounded-2xl shadow-[0_0_30px_rgba(0,245,160,0.15)] relative overflow-hidden">
          {/* Ambient Corner Badge */}
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#00F5A0] text-[#02140D] font-mono font-black text-xs uppercase tracking-wider rounded-bl-xl shadow-md flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>₹{SUBSCRIPTION_PRICE_INR} Lifetime Access</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#102B21] border border-[#00F5A0]/30 text-[#00F5A0] font-mono font-bold text-xs uppercase tracking-wider">
                  Premium Tier
                </span>
                <span className="text-xs font-mono text-[#8CA89E]">Instant UPI Auto-Unlock</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F0FDF4] leading-tight">
                Unlock CADVANTA Pro & Hard Design Engines
              </h2>

              <p className="text-xs sm:text-sm text-[#8CA89E] font-sans leading-relaxed">
                Pay just <strong className="text-[#00F5A0]">₹{SUBSCRIPTION_PRICE_INR}</strong> via UPI to <strong className="text-[#F0FDF4] font-mono">{UPI_ID}</strong> ({FOUNDER_NAME}) to immediately unlock all heavy turbomachinery rotors, planetary gearboxes, deep FEA stress solvers, and unlimited VIRA AI assistance.
              </p>

              {/* Pro Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#F0FDF4]">
                  <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  <span>VIRA AI Mechanical Copilot</span>
                </div>
                <div className="flex items-center gap-2 text-[#F0FDF4]">
                  <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  <span>Gas Turbine Blisk & Rotors</span>
                </div>
                <div className="flex items-center gap-2 text-[#F0FDF4]">
                  <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  <span>Precision Cycloidal Drives</span>
                </div>
                <div className="flex items-center gap-2 text-[#F0FDF4]">
                  <CheckCircle2 className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  <span>Production STL & G-Code Export</span>
                </div>
              </div>
            </div>

            {/* Price & Action Button Card */}
            <div className="w-full lg:w-auto p-5 bg-[#071510] border border-[rgba(16,185,129,0.3)] rounded-xl flex flex-col items-center justify-center text-center gap-4 shrink-0 shadow-lg">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#8CA89E] tracking-wider">
                  One-Time Contribution
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#00F5A0]">
                    ₹{SUBSCRIPTION_PRICE_INR}
                  </span>
                  <span className="text-xs font-mono text-[#8CA89E]">/ lifetime</span>
                </div>
                <div className="text-[10px] font-mono text-[#4E6B60]">
                  UPI: {UPI_ID}
                </div>
              </div>

              <button
                onClick={() => openSubscriptionModal('CADVANTA Pro Lifetime Access')}
                className={`w-full px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPro
                    ? 'bg-[#102B21] border border-[#00F5A0] text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.25)]'
                    : 'bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] shadow-[0_0_20px_rgba(0,245,160,0.35)] active:scale-95'
                }`}
              >
                {isPro ? (
                  <>
                    <Crown className="w-4 h-4 fill-current" />
                    <span>PRO ACTIVE • UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Pay ₹{SUBSCRIPTION_PRICE_INR} & Unlock Pro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Mechanical Library Grid */}
      <div className="w-full max-w-5xl mt-12 space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#00F5A0]" />
            <h2 className="text-sm font-bold font-mono text-[#F0FDF4] uppercase tracking-wider">
              Standard Mechanical Engineering Library
            </h2>
            {onOpenDesignLibrary && (
              <button
                onClick={onOpenDesignLibrary}
                className="ml-2 px-2.5 py-0.5 rounded bg-[#00F5A0]/15 hover:bg-[#00F5A0]/30 border border-[#00F5A0]/40 text-[#00F5A0] text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              >
                <span>OPEN FULL LIBRARY (60+)</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {libraryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setLibraryCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  libraryCategory === cat
                    ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-xs'
                    : 'bg-[#071510] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#0B1E17] border border-[rgba(16,185,129,0.18)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredLibrary.map((item, idx) => (
            <button
              key={idx}
              id={`card-preset-${item.type}`}
              onClick={() => handleCardClick(item)}
              className={`group p-4 bg-[#071510] hover:bg-[#0B1E17] border rounded-xl text-left transition-all duration-200 shadow-md flex flex-col justify-between cursor-pointer ${
                item.isPro && !isPro
                  ? 'border-[#F59E0B]/30 hover:border-[#F59E0B]/60'
                  : 'border-[rgba(16,185,129,0.18)] hover:border-[#00F5A0]/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0B1E17] border border-[rgba(16,185,129,0.2)] text-[#00F5A0] font-bold">
                      {item.tag}
                    </span>
                    {item.isPro && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        isPro 
                          ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40' 
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      }`}>
                        {isPro ? <Crown className="w-2.5 h-2.5 fill-current" /> : <Lock className="w-2.5 h-2.5" />}
                        {isPro ? 'PRO UNLOCKED' : `PRO (₹${SUBSCRIPTION_PRICE_INR})`}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4E6B60] group-hover:text-[#00F5A0] group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-[#F0FDF4] text-sm group-hover:text-[#00F5A0] transition-colors font-mono">
                  {item.title}
                </h3>
                <p className="text-xs text-[#8CA89E] font-sans line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[rgba(16,185,129,0.12)] flex items-center justify-between text-[11px] font-mono text-[#8CA89E]">
                <span>Parametric 3D</span>
                <span className="text-[#00F5A0] font-bold group-hover:underline">
                  {item.isPro && !isPro ? `Unlock for ₹${SUBSCRIPTION_PRICE_INR} →` : 'Open in CADVANTA →'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sponsored Industry Solutions & Protected Engineering Portals */}
      <SponsoredEngineeringAd onSelectAction={(p) => onStartDesign(p)} />

      {/* Founder Viraj Bansod Showcase Footer Card (Crest with Social Links, no founder image) */}
      <div className="w-full max-w-5xl mt-14 p-6 bg-[#071510] border border-[rgba(16,185,129,0.22)] rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-xl relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0B1E17] border-2 border-[#00F5A0]/40 shadow-lg flex items-center justify-center font-mono font-bold text-xl text-[#00F5A0] shrink-0 shadow-[0_0_16px_rgba(0,245,160,0.25)]">
            VB
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h4 className="text-base font-bold font-sans text-[#F0FDF4]">Viraj Bansod</h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0B1E17] text-[#00F5A0] border border-[#00F5A0]/30 font-bold">
                Founder & Architect
              </span>
            </div>
            <p className="text-xs text-[#8CA89E] font-sans mt-0.5">
              Mechanical Engineering Student • Creator of CADVANTA 3D & VIRA AI Assistant.
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="https://www.linkedin.com/in/viraj-bansod-46940129a"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B1E17] hover:bg-[#00F5A0] text-[#8CA89E] hover:text-[#02140D] border border-[rgba(16,185,129,0.22)] text-xs font-mono transition-all shadow-xs"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://www.instagram.com/virajbansod1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B1E17] hover:bg-[#00F5A0] text-[#8CA89E] hover:text-[#02140D] border border-[rgba(16,185,129,0.22)] text-xs font-mono transition-all shadow-xs"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://github.com/creatorversion15"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B1E17] hover:bg-[#00F5A0] text-[#8CA89E] hover:text-[#02140D] border border-[rgba(16,185,129,0.22)] text-xs font-mono transition-all shadow-xs"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};
