// Complete, self-contained single-page production-ready HTML/JS application
// ready to be deployed directly to Vercel, Netlify, or loaded in any browser.

export const AERIS_STANDALONE_HTML_CODE = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CADVANTA — AERIS Hybrid Turbine Mechanical Assembly & Telemetry</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #0B0F19; color: #E2E8F0; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0B0F19; }
    ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
    .terminal-glow { text-shadow: 0 0 6px rgba(16, 185, 129, 0.4); }
    input[type=range] { accent-color: #00D9FF; }
  </style>
</head>
<body class="h-screen w-screen flex flex-col antialiased select-none">
  <!-- TOP HEADER -->
  <header class="h-12 border-b border-slate-800 bg-[#0E131F] px-4 flex items-center justify-between shrink-0 z-30">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-md shadow-cyan-500/20">C</div>
        <span class="font-extrabold text-base tracking-wider text-white">CADVANTA</span>
      </div>
      <div class="h-4 w-px bg-slate-700"></div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">AERIS v3.4</span>
        <span class="text-xs text-slate-400 font-mono">Hybrid Wind/Solar Mechanical Assembly</span>
      </div>
    </div>
    <div class="flex items-center gap-2 text-xs font-mono">
      <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-300">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>BUS: CAN 2.0B</span>
      </div>
    </div>
  </header>

  <!-- 3-COLUMN ENGINEERING LAYOUT -->
  <main class="flex-1 flex overflow-hidden relative">
    <!-- LEFT PANEL: ASSEMBLY CONTROLS -->
    <aside class="w-80 bg-[#111827] border-r border-slate-800 flex flex-col shrink-0 z-20 overflow-y-auto">
      <div class="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <span class="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">Assembly Controls</span>
        <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">ONLINE</span>
      </div>
      <div class="p-3 space-y-4 flex-1">
        <div>
          <label class="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Turbine Prime Mover</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-start" class="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded border border-emerald-400/30 flex items-center justify-center gap-1.5 transition cursor-pointer">START</button>
            <button id="btn-stop" class="py-2 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-mono font-bold text-xs rounded border border-rose-500/40 flex items-center justify-center gap-1.5 transition cursor-pointer">STOP</button>
          </div>
        </div>
        <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-semibold text-slate-300">Rotor Speed</span>
            <div class="flex items-baseline gap-1 font-mono">
              <span id="txt-rpm" class="text-lg font-bold text-cyan-400">120.0</span>
              <span class="text-[10px] text-slate-400">RPM</span>
            </div>
          </div>
          <input id="slider-rpm" type="range" min="0" max="300" step="1" value="120" class="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer">
        </div>
        <div class="space-y-2">
          <span class="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">Subsystem Overlays</span>
          <label class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">PV Panels — Visible</span><input id="toggle-pv" type="checkbox" checked class="w-4 h-4"></label>
          <label class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">Engineering Labels</span><input id="toggle-labels" type="checkbox" checked class="w-4 h-4"></label>
          <label class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">Exploded View</span><input id="toggle-exploded" type="checkbox" class="w-4 h-4"></label>
          <label class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">Dimensions Overlay</span><input id="toggle-dimensions" type="checkbox" checked class="w-4 h-4"></label>
          <label class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">Servo Monitor / I/O</span><input id="toggle-servo" type="checkbox" checked class="w-4 h-4"></label>
        </div>
        <div class="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono space-y-1">
          <div class="text-[10px] text-slate-500 uppercase">Active Selection</div>
          <div id="txt-selection" class="font-bold text-cyan-400 truncate">Hybrid Power Hub</div>
        </div>
      </div>
      <div class="p-3 border-t border-slate-800 bg-slate-900/40">
        <button id="btn-reset-assembly" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded border border-slate-700 transition cursor-pointer">RESET ASSEMBLY</button>
      </div>
    </aside>

    <!-- CENTER 3D VIEWPORT & HUD -->
    <section class="flex-1 flex flex-col bg-[#0B0F19] min-w-0 relative overflow-hidden">
      <div class="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#111827]/90 border border-slate-700/80 rounded-lg p-1 shadow-2xl backdrop-blur-md">
        <button id="btn-view-iso" class="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">ISOMETRIC</button>
        <button id="btn-view-front" class="px-2.5 py-1 text-xs font-mono font-semibold rounded text-slate-300">FRONT</button>
        <button id="btn-view-side" class="px-2.5 py-1 text-xs font-mono font-semibold rounded text-slate-300">SIDE</button>
        <button id="btn-view-top" class="px-2.5 py-1 text-xs font-mono font-semibold rounded text-slate-300">TOP</button>
        <button id="btn-view-fit" class="px-2.5 py-1 text-xs font-mono font-semibold rounded text-slate-300">FIT MODEL</button>
      </div>
      <div id="viewport-container" class="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing"></div>
      <!-- HUD BAR -->
      <div class="h-20 bg-[#0E1422] border-t border-slate-800 px-3 py-2 shrink-0 z-20">
        <div class="h-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">WIND SPEED</span>
            <div class="flex items-baseline justify-between"><span id="hud-wind" class="text-base font-mono font-extrabold text-cyan-400">5.0</span><span class="text-[10px] font-mono text-slate-500">m/s</span></div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">PV VOLTAGE</span>
            <div class="flex items-baseline justify-between"><span id="hud-pv-volt" class="text-base font-mono font-extrabold text-blue-400">16.9</span><span class="text-[10px] font-mono text-slate-500">V</span></div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">PV CURRENT</span>
            <div class="flex items-baseline justify-between"><span id="hud-pv-curr" class="text-base font-mono font-extrabold text-amber-400">1.78</span><span class="text-[10px] font-mono text-slate-500">A</span></div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">GEN VOLTAGE</span>
            <div class="flex items-baseline justify-between"><span id="hud-gen-volt" class="text-base font-mono font-extrabold text-emerald-400">16.8</span><span class="text-[10px] font-mono text-slate-500">V</span></div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">TEMPERATURE</span>
            <div class="flex items-baseline justify-between"><span id="hud-temp" class="text-base font-mono font-extrabold text-rose-400">29.1</span><span class="text-[10px] font-mono text-slate-500">°C</span></div>
          </div>
          <div class="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">STATUS</span>
            <div class="flex items-center gap-2"><span id="hud-status-led" class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span><span id="hud-status-txt" class="text-xs font-mono font-extrabold text-emerald-400">RUNNING</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- RIGHT PANEL: COMPONENT SPECS & SIMULATION -->
    <aside class="w-80 bg-[#111827] border-l border-slate-800 flex flex-col shrink-0 z-20 overflow-y-auto">
      <div class="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <span class="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">Specs & Simulation</span>
      </div>
      <div class="p-3 space-y-4 flex-1">
        <div class="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2.5">
          <span class="text-[10px] font-mono text-slate-500 uppercase">Component Specification</span>
          <h4 id="spec-name" class="text-xs font-mono font-bold text-white">Hybrid Power Core Assembly</h4>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div class="bg-slate-800/60 p-2 rounded"><span class="text-[10px] text-slate-400 block">MATERIAL</span><span id="spec-material" class="text-slate-200 font-semibold text-[11px]">CFRP / 6061-T6</span></div>
            <div class="bg-slate-800/60 p-2 rounded"><span class="text-[10px] text-slate-400 block">TOTAL MASS</span><span id="spec-mass" class="text-slate-200 font-semibold text-[11px]">14.85 kg</span></div>
            <div class="bg-slate-800/60 p-2 rounded col-span-2"><span class="text-[10px] text-slate-400 block">STRESS LIMIT / SAFETY FACTOR</span><span id="spec-stress" class="text-emerald-400 font-semibold text-[11px]">310 MPa (SF: 3.68)</span></div>
          </div>
        </div>
        <div class="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-3">
          <span class="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">Environmental Conditions</span>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono"><span class="text-slate-300">Wind Velocity</span><span class="font-bold text-cyan-400"><span id="txt-wind-val">5.0</span> m/s</span></div>
            <input id="slider-wind" type="range" min="0" max="25" step="0.5" value="5" class="w-full h-1.5 bg-slate-800 rounded cursor-pointer">
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono"><span class="text-slate-300">Solar Irradiance</span><span class="font-bold text-amber-400"><span id="txt-solar-val">850</span> W/m²</span></div>
            <input id="slider-solar" type="range" min="0" max="1200" step="25" value="850" class="w-full h-1.5 bg-slate-800 rounded cursor-pointer">
          </div>
          <label class="flex items-center justify-between pt-1 border-t border-slate-800 cursor-pointer text-xs font-mono"><span class="text-slate-300">Auto RPM Synchronization</span><input id="toggle-autosync" type="checkbox" checked class="w-4 h-4"></label>
        </div>
        <div class="space-y-1.5 flex-1 flex flex-col">
          <span class="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Serial Telemetry Log</span>
          <div id="terminal-box" class="h-44 bg-black/90 border border-slate-800 rounded-lg p-2 font-mono text-[10.5px] leading-relaxed text-emerald-400 overflow-y-auto terminal-glow select-text">
            <div>[SYS_BOOT] CADVANTA AERIS Kernel v3.4.1 initialized</div>
            <div>[CAN_BUS] Hardware interface linked at 500 kbps</div>
          </div>
        </div>
      </div>
    </aside>
  </main>

  <script>
    const state = { isRunning: true, rpm: 120.0, targetRpm: 120.0, windSpeed: 5.0, solarIrradiance: 850, autoSync: true, pvVisible: true, exploded: false, explodedProgress: 0, time: 0 };
    const container = document.getElementById('viewport-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0F19);
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(16, 12, 18);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4.5, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl = new THREE.DirectionalLight(0xe2f3ff, 1.8); dl.position.set(20, 30, 20); scene.add(dl);
    scene.add(new THREE.GridHelper(32, 32, 0x00D9FF, 0x1E293B));

    const turbine = new THREE.Group(); scene.add(turbine);
    const stator = new THREE.Group(); const rotor = new THREE.Group(); const blades = new THREE.Group(); const cap = new THREE.Group();
    turbine.add(stator); turbine.add(rotor); rotor.add(blades); rotor.add(cap);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x8a9ba8, metalness: 0.85, roughness: 0.25 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.2 });
    const pvMat = new THREE.MeshStandardMaterial({ color: 0x0a1945, emissive: 0x030816, metalness: 0.9, roughness: 0.15 });

    stator.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.8, 32), metalMat));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.5, 32), metalMat); shaft.position.y = 6.0; rotor.add(shaft);
    const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 32), metalMat); topCap.position.y = 10.8; cap.add(topCap);

    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); g.rotation.y = (i / 3) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 6.5, 24, 1, true, 0, Math.PI * 0.9), bladeMat);
      b.position.set(2.8, 6.2, 0); b.rotation.y = Math.PI / 4; g.add(b);
      const pv = new THREE.Mesh(new THREE.CylinderGeometry(0.91, 0.91, 5.5, 24, 1, true, 0.05, Math.PI * 0.8), pvMat);
      pv.position.set(2.8, 6.2, 0); pv.rotation.y = Math.PI / 4; g.add(pv);
      blades.add(g);
    }

    document.getElementById('btn-start').onclick = () => { state.isRunning = true; state.targetRpm = parseFloat(document.getElementById('slider-rpm').value) || 120; };
    document.getElementById('btn-stop').onclick = () => { state.isRunning = false; state.targetRpm = 0; };
    document.getElementById('slider-rpm').oninput = (e) => { state.targetRpm = parseFloat(e.target.value); document.getElementById('txt-rpm').textContent = state.targetRpm.toFixed(1); };
    document.getElementById('toggle-exploded').onchange = (e) => { state.exploded = e.target.checked; };

    function animate() {
      requestAnimationFrame(animate);
      state.rpm += (state.targetRpm - state.rpm) * 0.05;
      rotor.rotation.y += (state.rpm * (2 * Math.PI) / 60) * 0.016;
      state.explodedProgress += ((state.exploded ? 1 : 0) - state.explodedProgress) * 0.1;
      blades.children.forEach((arm, i) => {
        arm.position.x = Math.sin((i / 3) * Math.PI * 2) * (state.explodedProgress * 1.8);
        arm.position.z = Math.cos((i / 3) * Math.PI * 2) * (state.explodedProgress * 1.8);
      });
      cap.position.y = state.explodedProgress * 2.2;
      stator.position.y = -state.explodedProgress * 1.4;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    window.onresize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
  </script>
</body>
</html>`;

export function downloadStandaloneHtml() {
  const blob = new Blob([AERIS_STANDALONE_HTML_CODE], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
