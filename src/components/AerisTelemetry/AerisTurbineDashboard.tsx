import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Eye,
  Tag,
  Maximize2,
  Ruler,
  Cpu,
  RefreshCw,
  Compass,
  Wind,
  Sun,
  Activity,
  Terminal,
  Download,
  Copy,
  Check,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { AerisTurbineCanvas } from './AerisTurbineCanvas';
import { downloadStandaloneHtml, AERIS_STANDALONE_HTML_CODE } from './aerisStandaloneHtml';

interface AerisTurbineDashboardProps {
  onSwitchToCADModeler?: () => void;
}

interface ComponentSpec {
  material: string;
  mass: string;
  stress: string;
  operatingTemp: string;
  notes: string;
}

const COMPONENT_SPECS: Record<string, ComponentSpec> = {
  'Hybrid Power Core Assembly': {
    material: 'CFRP / 6061-T6 Aluminum / Silicon',
    mass: '14.85 kg',
    stress: '310 MPa (SF: 3.68)',
    operatingTemp: '29.1 °C',
    notes: 'Complete vertical-axis hybrid aerofoil + direct-drive generator module.',
  },
  'Solar PV Array': {
    material: 'Monocrystalline Silicon (22.8% Eff.) / ETFE',
    mass: '3.42 kg',
    stress: '140 MPa (SF: 4.12)',
    operatingTemp: '34.2 °C',
    notes: 'Conformal flexible photovoltaic cells integrated on outer blade curvature.',
  },
  'Curved Aerodynamic Blades': {
    material: 'High-Modulus Carbon Fiber Epoxy Matrix',
    mass: '4.80 kg',
    stress: '420 MPa (SF: 3.20)',
    operatingTemp: '24.5 °C',
    notes: 'Low-starting torque Savonius aerofoil optimized for omnidirectional turbulence.',
  },
  'Central Torque Shaft': {
    material: 'AISI 4140 Quenched & Tempered Alloy Steel',
    mass: '3.10 kg',
    stress: '650 MPa (SF: 5.10)',
    operatingTemp: '28.0 °C',
    notes: 'Precision ground Ø35mm shaft with dual keyways and stepped bearing journals.',
  },
  'Direct-Drive PM Generator': {
    material: 'NdFeB N45 Magnets / 99.9% Oxygen-Free Copper',
    mass: '5.25 kg',
    stress: '280 MPa (SF: 4.50)',
    operatingTemp: '38.4 °C',
    notes: '16-pole direct-drive brushless axial flux generator with passive cooling fins.',
  },
  'Thrust Bearing Assembly': {
    material: 'Chrome Steel 52100 / Silicon Nitride Balls',
    mass: '1.20 kg',
    stress: '820 MPa (SF: 6.20)',
    operatingTemp: '31.2 °C',
    notes: 'Double-row angular contact sealed thrust bearing rated to 42 kN static load.',
  },
};

export const AerisTurbineDashboard: React.FC<AerisTurbineDashboardProps> = ({
  onSwitchToCADModeler,
}) => {
  // Assembly & Simulation state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [targetRpm, setTargetRpm] = useState<number>(120.0);
  const [currentRpm, setCurrentRpm] = useState<number>(120.0);
  const [windSpeed, setWindSpeed] = useState<number>(5.0);
  const [solarIrradiance, setSolarIrradiance] = useState<number>(850);
  const [autoSyncRpm, setAutoSyncRpm] = useState<boolean>(true);

  // Subsystem toggles
  const [pvVisible, setPvVisible] = useState<boolean>(true);
  const [labelsVisible, setLabelsVisible] = useState<boolean>(true);
  const [explodedView, setExplodedView] = useState<boolean>(false);
  const [dimensionsVisible, setDimensionsVisible] = useState<boolean>(true);
  const [servoMonitor, setServoMonitor] = useState<boolean>(true);

  // Active selection
  const [selectedPart, setSelectedPart] = useState<string>('Hybrid Power Core Assembly');

  // Camera preset
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'side' | 'top' | 'fit' | null>(
    null
  );

  // Standalone code modal
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Serial Monitor Log
  const [logs, setLogs] = useState<string[]>([
    '[00:00:01] [SYS_BOOT] CADVANTA AERIS Kernel v3.4.1 initialized',
    '[00:00:02] [CAN_BUS] Hardware interface linked at 500 kbps',
    '[00:00:02] [MPPT] Solar tracker online. P_max = 142.4W (Tracking 99.4%)',
    '[00:00:03] [GEN_CTRL] Field excitation coil active: 16.8V nominal',
    '[00:00:04] [RPM_LOCK] Rotor velocity locked at 120.0 RPM',
  ]);
  const [autoScrollLog, setAutoScrollLog] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (autoScrollLog && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScrollLog]);

  // Telemetry real-time loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Smoothly ramp RPM toward target
      setCurrentRpm((prev) => {
        const diff = targetRpm - prev;
        if (Math.abs(diff) < 0.2) return targetRpm;
        return prev + diff * 0.12;
      });

      // Append serial log telemetry periodically
      if (isRunning && Math.random() < 0.35) {
        const timeStr = new Date().toTimeString().substring(0, 8);
        const pvVolt = (16.2 + (solarIrradiance / 1200) * 4.8).toFixed(1);
        const pvCurr = (
          (solarIrradiance / 1200) *
          2.4 *
          (0.96 + Math.sin(Date.now() / 1000) * 0.04)
        ).toFixed(2);
        const genVolt = ((currentRpm / 300) * 24.5).toFixed(1);

        const messages = [
          `[${timeStr}] [TELEMETRY] Rotor: ${currentRpm.toFixed(1)} RPM | Gen: ${genVolt}V`,
          `[${timeStr}] [MPPT_TRACK] PV: ${pvVolt}V @ ${pvCurr}A -> Power: ${(
            parseFloat(pvVolt) * parseFloat(pvCurr)
          ).toFixed(1)}W`,
          `[${timeStr}] [BEARING_MON] Thrust axial load: ${(4.2 + (currentRpm / 300) * 8.1).toFixed(
            2
          )} kN (OK)`,
          `[${timeStr}] [YAW_BRAKE] Electro-magnetic brake status: DISENGAGED`,
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        setLogs((prev) => [...prev.slice(-40), msg]);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, targetRpm, solarIrradiance, currentRpm]);

  // Handle Wind velocity change
  const handleWindChange = (newWind: number) => {
    setWindSpeed(newWind);
    if (autoSyncRpm && isRunning) {
      // Aerodynamic tip-speed ratio formula
      const tsr = 2.1;
      const diam = 5.6;
      const calculatedRpm = Math.min(300, (60 * tsr * newWind) / (Math.PI * diam));
      setTargetRpm(Math.round(calculatedRpm * 10) / 10);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setTargetRpm(currentRpm > 10 ? currentRpm : 120);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toTimeString().substring(0, 8)}] [CMD] PRIME_MOVER_ENGAGED -> START`,
    ]);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTargetRpm(0);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toTimeString().substring(0, 8)}] [CMD] ELEC_BRAKE_ENGAGED -> STOPPED`,
    ]);
  };

  const handleResetAssembly = () => {
    setCameraPreset('iso');
    setExplodedView(false);
    setSelectedPart('Hybrid Power Core Assembly');
    setLogs((prev) => [
      ...prev,
      `[${new Date().toTimeString().substring(0, 8)}] [RESET] CAD Assembly & Camera reset to ISOMETRIC`,
    ]);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(AERIS_STANDALONE_HTML_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeSpec = COMPONENT_SPECS[selectedPart] || COMPONENT_SPECS['Hybrid Power Core Assembly'];

  // Calculated Telemetry metrics
  const pvVoltageCalc = (16.2 + (solarIrradiance / 1200) * 4.8).toFixed(1);
  const pvCurrentCalc = (
    (solarIrradiance / 1200) *
    2.4 *
    (0.96 + Math.sin(Date.now() / 1500) * 0.04)
  ).toFixed(2);
  const genVoltageCalc = ((currentRpm / 300) * 24.5).toFixed(1);
  const tempCalc = (25.0 + (currentRpm / 300) * 8.5 + (solarIrradiance / 1200) * 3.0).toFixed(1);

  return (
    <div className="w-full h-screen flex flex-col bg-[#0B0F19] text-[#E2E8F0] font-sans select-none overflow-hidden">
      
      {/* ===================================================================== */}
      {/* TOP NAVIGATION BAR */}
      {/* ===================================================================== */}
      <header className="h-12 border-b border-slate-800 bg-[#0E131F] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-md shadow-cyan-500/20">
              C
            </div>
            <span className="font-extrabold text-base tracking-wider text-white">CADVANTA</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              AERIS v3.4
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline font-mono">
              Vertical-Axis Wind/Solar Hybrid Mechanical Assembly
            </span>
          </div>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Switch to Parametric Modeler Button */}
          {onSwitchToCADModeler && (
            <button
              onClick={onSwitchToCADModeler}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Open CADVANTA Parametric 3D Feature Modeler"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">3D Parametric Modeler</span>
            </button>
          )}

          {/* Export Standalone HTML (for Vercel) */}
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-500/10"
            title="View or export the self-contained single-page HTML file for Vercel"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>VERCEL STANDALONE</span>
          </button>

          {/* Quick Direct Download Button */}
          <button
            onClick={downloadStandaloneHtml}
            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded font-bold transition flex items-center gap-1 cursor-pointer"
            title="Download index.html directly"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.HTML</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN 3-COLUMN DESKTOP ENGINEERING SUITE */}
      {/* ===================================================================== */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* ------------------------------------------------------------------- */}
        {/* LEFT PANEL: ASSEMBLY CONTROLS */}
        {/* ------------------------------------------------------------------- */}
        <aside className="w-72 sm:w-80 bg-[#111827] border-r border-slate-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          {/* Panel Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
                Assembly Controls
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          <div className="p-3 space-y-4 flex-1">
            {/* Top Action Row: START & STOP */}
            <div>
              <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Turbine Prime Mover
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-start"
                  onClick={handleStart}
                  className={`py-2 px-3 rounded border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg ${
                    isRunning
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-900/30'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START</span>
                </button>

                <button
                  id="btn-stop"
                  onClick={handleStop}
                  className={`py-2 px-3 rounded border font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isRunning
                      ? 'bg-rose-600 text-white border-rose-400 shadow-rose-900/40'
                      : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/40'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP</span>
                </button>
              </div>
            </div>

            {/* Motor Speed Control (RPM Slider & Numeric Readout) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                  <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
                  Rotor Speed
                </span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-extrabold text-cyan-400">{currentRpm.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400">RPM</span>
                </div>
              </div>
              <input
                id="slider-rpm"
                type="range"
                min="0"
                max="300"
                step="1"
                value={targetRpm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTargetRpm(val);
                  setAutoSyncRpm(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <button onClick={() => { setTargetRpm(0); setAutoSyncRpm(false); }} className="hover:text-cyan-400 cursor-pointer">0</button>
                <button onClick={() => { setTargetRpm(75); setAutoSyncRpm(false); }} className="hover:text-cyan-400 cursor-pointer">75</button>
                <button onClick={() => { setTargetRpm(150); setAutoSyncRpm(false); }} className="hover:text-cyan-400 cursor-pointer">150</button>
                <button onClick={() => { setTargetRpm(225); setAutoSyncRpm(false); }} className="hover:text-cyan-400 cursor-pointer">225</button>
                <button onClick={() => { setTargetRpm(300); setAutoSyncRpm(false); }} className="hover:text-cyan-400 cursor-pointer">300</button>
              </div>
            </div>

            {/* Interactive Toggle Switches */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Subsystem Overlays
              </span>

              {/* Toggle: PV Panels */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition">
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300">PV Panels — Visible</span>
                </div>
                <input
                  type="checkbox"
                  checked={pvVisible}
                  onChange={(e) => setPvVisible(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle: Engineering Labels */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">Engineering Labels</span>
                </div>
                <input
                  type="checkbox"
                  checked={labelsVisible}
                  onChange={(e) => setLabelsVisible(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle: Exploded View */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">Exploded View</span>
                </div>
                <input
                  type="checkbox"
                  checked={explodedView}
                  onChange={(e) => setExplodedView(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle: Dimensions Overlay */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-slate-300">Dimensions Overlay</span>
                </div>
                <input
                  type="checkbox"
                  checked={dimensionsVisible}
                  onChange={(e) => setDimensionsVisible(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle: Servo Monitor / I/O */}
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs font-mono transition">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Servo Monitor / I/O</span>
                </div>
                <input
                  type="checkbox"
                  checked={servoMonitor}
                  onChange={(e) => setServoMonitor(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            {/* Selection Info Box */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Selection</div>
              <div className="font-bold text-cyan-400 truncate">{selectedPart}</div>
              <div className="text-[10px] text-slate-400">Click 3D geometry or labels to inspect</div>
            </div>
          </div>

          {/* Reset Assembly Button */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/40">
            <button
              id="btn-reset-assembly"
              onClick={handleResetAssembly}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESET ASSEMBLY</span>
            </button>
          </div>
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* CENTER WORKSPACE: 3D VIEWPORT & HUD */}
        {/* ------------------------------------------------------------------- */}
        <section className="flex-1 flex flex-col bg-[#0B0F19] min-w-0 relative overflow-hidden">
          
          {/* Top Floating Viewport Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#111827]/90 border border-slate-700/80 rounded-lg p-1 shadow-2xl backdrop-blur-md">
            <button
              id="btn-view-iso"
              onClick={() => setCameraPreset('iso')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition cursor-pointer ${
                cameraPreset === 'iso' || !cameraPreset
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ISOMETRIC
            </button>
            <button
              id="btn-view-front"
              onClick={() => setCameraPreset('front')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition cursor-pointer ${
                cameraPreset === 'front'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              FRONT
            </button>
            <button
              id="btn-view-side"
              onClick={() => setCameraPreset('side')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition cursor-pointer ${
                cameraPreset === 'side'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              SIDE
            </button>
            <button
              id="btn-view-top"
              onClick={() => setCameraPreset('top')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition cursor-pointer ${
                cameraPreset === 'top'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              TOP
            </button>
            <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
            <button
              id="btn-view-fit"
              onClick={() => setCameraPreset('fit')}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>FIT MODEL</span>
            </button>
          </div>

          {/* 3D Three.js Mechanical Turbine Canvas */}
          <div className="flex-1 w-full h-full relative">
            <AerisTurbineCanvas
              rpm={currentRpm}
              isRunning={isRunning}
              pvVisible={pvVisible}
              labelsVisible={labelsVisible}
              exploded={explodedView}
              dimensionsVisible={dimensionsVisible}
              onSelectComponent={(name) => setSelectedPart(name)}
              selectedPart={selectedPart}
              solarIrradiance={solarIrradiance}
              cameraPreset={cameraPreset}
              onCameraPresetHandled={() => setCameraPreset(null)}
            />
          </div>

          {/* Bottom Live Telemetry HUD Bar (6-Column Grid) */}
          <div className="h-20 bg-[#0E1422] border-t border-slate-800 px-3 py-2 shrink-0 z-20">
            <div className="h-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              
              {/* Metric 1: Wind Speed */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  WIND SPEED
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-cyan-400">
                    {windSpeed.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">m/s</span>
                </div>
              </div>

              {/* Metric 2: PV Voltage */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sun className="w-3 h-3 text-blue-400" />
                  PV VOLTAGE
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-blue-400">
                    {pvVoltageCalc}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">V</span>
                </div>
              </div>

              {/* Metric 3: PV Current */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" />
                  PV CURRENT
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-amber-400">
                    {pvCurrentCalc}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">A</span>
                </div>
              </div>

              {/* Metric 4: Generator Voltage */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-emerald-400" />
                  GEN VOLTAGE
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-emerald-400">
                    {genVoltageCalc}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">V</span>
                </div>
              </div>

              {/* Metric 5: Temperature */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-400" />
                  TEMPERATURE
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-rose-400">
                    {tempCalc}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">°C</span>
                </div>
              </div>

              {/* Metric 6: Status */}
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  SYSTEM STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span
                    className={`text-xs font-mono font-extrabold ${
                      isRunning ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isRunning ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* RIGHT PANEL: COMPONENT SPECS & SIMULATION */}
        {/* ------------------------------------------------------------------- */}
        <aside className="w-72 sm:w-80 bg-[#111827] border-l border-slate-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          
          {/* Panel Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
                Specs & Simulation
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              ISO 9001
            </span>
          </div>

          <div className="p-3 space-y-4 flex-1">
            
            {/* Selected Component Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">
                    Component Specification
                  </span>
                  <h4 className="text-xs font-mono font-bold text-white leading-tight">
                    {selectedPart}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  CAD ID #042
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-800/60 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block">MATERIAL</span>
                  <span className="text-slate-200 font-semibold text-[11px] block truncate" title={activeSpec.material}>
                    {activeSpec.material}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block">TOTAL MASS</span>
                  <span className="text-slate-200 font-semibold text-[11px] block">
                    {activeSpec.mass}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded col-span-2">
                  <span className="text-[10px] text-slate-400 block">STRESS LIMIT / SAFETY FACTOR</span>
                  <span className="text-emerald-400 font-semibold text-[11px] block">
                    {activeSpec.stress}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-mono italic leading-normal">
                {activeSpec.notes}
              </p>
            </div>

            {/* Wind / Solar Environment Simulation Section */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-3">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Environmental Boundary Conditions
              </span>

              {/* Wind Velocity Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    Wind Velocity
                  </span>
                  <div className="flex items-baseline gap-1 font-bold text-cyan-400">
                    <span>{windSpeed.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400">m/s</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={windSpeed}
                  onChange={(e) => handleWindChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0 m/s</span>
                  <span>10 (Breeze)</span>
                  <span>25 (Gale)</span>
                </div>
              </div>

              {/* Solar Irradiance Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Solar Irradiance
                  </span>
                  <div className="flex items-baseline gap-1 font-bold text-amber-400">
                    <span>{solarIrradiance}</span>
                    <span className="text-[10px] text-slate-400">W/m²</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="25"
                  value={solarIrradiance}
                  onChange={(e) => setSolarIrradiance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0 (Night)</span>
                  <span>600 (Overcast)</span>
                  <span>1200 (Peak)</span>
                </div>
              </div>

              {/* Auto RPM Synchronization Toggle */}
              <label className="flex items-center justify-between pt-1 border-t border-slate-800 cursor-pointer text-xs font-mono">
                <span className="text-slate-300">Auto RPM Synchronization</span>
                <input
                  type="checkbox"
                  checked={autoSyncRpm}
                  onChange={(e) => setAutoSyncRpm(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            {/* Serial Monitor / I/O Terminal */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Serial Telemetry Log
                </span>
                <button
                  onClick={() => setLogs([`[${new Date().toTimeString().substring(0, 8)}] [CLEARED] Serial buffer emptied`])}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  CLEAR
                </button>
              </div>
              <div className="h-44 bg-black/90 border border-slate-800 rounded-lg p-2 font-mono text-[10.5px] leading-relaxed text-emerald-400 overflow-y-auto select-text shadow-inner">
                {logs.map((line, idx) => (
                  <div key={idx} className="hover:bg-emerald-950/30 px-0.5 rounded">
                    {line}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>
        </aside>

      </main>

      {/* ===================================================================== */}
      {/* STANDALONE VERCEL EXPORT MODAL */}
      {/* ===================================================================== */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-white">
                    Self-Contained Standalone Single-Page Application (Vercel Ready)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Zero dependencies required. HTML5 + Tailwind CSS CDN + Three.js
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Code Preview */}
            <div className="p-4 flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 font-mono">
                <span className="text-cyan-400 font-bold">Vercel Deployment Instructions:</span>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-400">
                  <li>Download this file as <code className="text-slate-200">index.html</code></li>
                  <li>Drop it into an empty folder or push to a GitHub repository</li>
                  <li>Deploy to Vercel, Netlify, GitHub Pages, or open directly in any browser!</li>
                </ol>
              </div>

              <div className="flex-1 bg-black/90 border border-slate-800 rounded p-3 overflow-auto font-mono text-[11px] text-slate-300">
                <pre>{AERIS_STANDALONE_HTML_CODE.substring(0, 1400)}...
{`\n\n/* [${AERIS_STANDALONE_HTML_CODE.length.toLocaleString()} bytes of complete standalone Three.js & Tailwind code ready to run] */`}</pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/60">
              <button
                onClick={copyCodeToClipboard}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'COPIED TO CLIPBOARD' : 'COPY HTML CODE'}</span>
              </button>

              <button
                onClick={downloadStandaloneHtml}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD index.html</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
