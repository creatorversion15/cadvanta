import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface AerisCanvasProps {
  rpm: number;
  isRunning: boolean;
  pvVisible: boolean;
  labelsVisible: boolean;
  exploded: boolean;
  dimensionsVisible: boolean;
  onSelectComponent: (name: string) => void;
  selectedPart: string;
  solarIrradiance: number;
  cameraPreset?: 'iso' | 'front' | 'side' | 'top' | 'fit' | null;
  onCameraPresetHandled?: () => void;
}

export const AerisTurbineCanvas: React.FC<AerisCanvasProps> = ({
  rpm,
  isRunning,
  pvVisible,
  labelsVisible,
  exploded,
  dimensionsVisible,
  onSelectComponent,
  selectedPart,
  solarIrradiance,
  cameraPreset,
  onCameraPresetHandled,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rotorGroupRef = useRef<THREE.Group | null>(null);
  const statorGroupRef = useRef<THREE.Group | null>(null);
  const bladesGroupRef = useRef<THREE.Group | null>(null);
  const capGroupRef = useRef<THREE.Group | null>(null);
  const dimGroupRef = useRef<THREE.Group | null>(null);
  const pvMeshesRef = useRef<THREE.Mesh[]>([]);
  const bladeMeshesRef = useRef<THREE.Mesh[]>([]);
  const shaftMeshRef = useRef<THREE.Mesh | null>(null);
  const statorMeshRef = useRef<THREE.Mesh | null>(null);
  const bearingMeshRef = useRef<THREE.Mesh | null>(null);

  // Animation values
  const explodedProgressRef = useRef(0);
  const currentRpmRef = useRef(rpm);
  const isRunningRef = useRef(isRunning);
  const pvVisibleRef = useRef(pvVisible);
  const dimensionsVisibleRef = useRef(dimensionsVisible);

  useEffect(() => {
    currentRpmRef.current = rpm;
  }, [rpm]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    pvVisibleRef.current = pvVisible;
    pvMeshesRef.current.forEach((m) => {
      m.visible = pvVisible;
    });
  }, [pvVisible]);

  useEffect(() => {
    dimensionsVisibleRef.current = dimensionsVisible;
    if (dimGroupRef.current) {
      dimGroupRef.current.visible = dimensionsVisible;
    }
  }, [dimensionsVisible]);

  // Camera preset handler
  useEffect(() => {
    if (!cameraPreset || !cameraRef.current) return;

    const camera = cameraRef.current;
    if (cameraPreset === 'iso' || cameraPreset === 'fit') {
      camera.position.set(16, 12, 18);
      camera.lookAt(0, 4.5, 0);
    } else if (cameraPreset === 'front') {
      camera.position.set(0, 4.5, 22);
      camera.lookAt(0, 4.5, 0);
    } else if (cameraPreset === 'side') {
      camera.position.set(22, 4.5, 0);
      camera.lookAt(0, 4.5, 0);
    } else if (cameraPreset === 'top') {
      camera.position.set(0, 24, 0.01);
      camera.lookAt(0, 0, 0);
    }

    if (onCameraPresetHandled) {
      onCameraPresetHandled();
    }
  }, [cameraPreset, onCameraPresetHandled]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.02);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(16, 12, 18);
    camera.lookAt(0, 4.5, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const dirKey = new THREE.DirectionalLight(0xe2f3ff, 1.8);
    dirKey.position.set(18, 30, 18);
    dirKey.castShadow = true;
    scene.add(dirKey);

    const dirFill = new THREE.DirectionalLight(0x00d9ff, 0.55);
    dirFill.position.set(-18, 10, -18);
    scene.add(dirFill);

    const dirGround = new THREE.DirectionalLight(0x10b981, 0.3);
    dirGround.position.set(0, -10, 0);
    scene.add(dirGround);

    // 5. Grid Floor & Boundary
    const grid = new THREE.GridHelper(32, 32, 0x00d9ff, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const ringGeo = new THREE.RingGeometry(5.95, 6.05, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // 6. Geometry & Hierarchy
    const turbineAssembly = new THREE.Group();
    scene.add(turbineAssembly);

    const statorGroup = new THREE.Group();
    const rotorGroup = new THREE.Group();
    const shaftGroup = new THREE.Group();
    const capGroup = new THREE.Group();
    const bladesGroup = new THREE.Group();

    statorGroupRef.current = statorGroup;
    rotorGroupRef.current = rotorGroup;
    capGroupRef.current = capGroup;
    bladesGroupRef.current = bladesGroup;

    turbineAssembly.add(statorGroup);
    turbineAssembly.add(rotorGroup);
    rotorGroup.add(shaftGroup);
    rotorGroup.add(bladesGroup);
    rotorGroup.add(capGroup);

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.35,
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.45,
      roughness: 0.25,
    });
    const pvMat = new THREE.MeshStandardMaterial({
      color: 0x0c1b48,
      emissive: 0x040b20,
      metalness: 0.9,
      roughness: 0.18,
    });
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.3,
    });

    // Stator Base (Direct-drive generator)
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.4, 32), darkAlloyMat);
    basePlate.position.y = 0.2;
    statorGroup.add(basePlate);

    const statorHousing = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.8, 32), darkAlloyMat);
    statorHousing.position.y = 1.3;
    statorGroup.add(statorHousing);
    statorMeshRef.current = statorHousing;

    // Stator Coils
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.4), copperMat);
      coil.position.set(Math.cos(angle) * 1.5, 1.3, Math.sin(angle) * 1.5);
      coil.rotation.y = -angle;
      statorGroup.add(coil);
    }

    // Lower thrust bearing hub
    const bearingHub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32), metalMat);
    bearingHub.position.y = 2.4;
    statorGroup.add(bearingHub);
    bearingMeshRef.current = bearingHub;

    // Central Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8.5, 32), metalMat);
    shaft.position.y = 6.0;
    shaftGroup.add(shaft);
    shaftMeshRef.current = shaft;

    // Top Fairing Cap
    const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 32), metalMat);
    topCap.position.y = 10.8;
    capGroup.add(topCap);

    // 3 Curved Blades with Integrated PV
    const bladeCount = 3;
    const bladeRadius = 2.8;
    const bladeHeight = 6.5;
    const pvs: THREE.Mesh[] = [];
    const blades: THREE.Mesh[] = [];

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = angle;

      // Connecting Aerodynamic Struts
      [3.5, 6.2, 9.0].forEach((lvl) => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(bladeRadius, 0.1, 0.35), darkAlloyMat);
        strut.position.set(bladeRadius / 2, lvl, 0);
        bladeArm.add(strut);
      });

      // Curved Aerofoil Blade
      const bladeGeo = new THREE.CylinderGeometry(0.9, 0.9, bladeHeight, 24, 1, true, 0, Math.PI * 0.9);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(bladeRadius, 6.2, 0);
      blade.rotation.y = Math.PI / 4;
      bladeArm.add(blade);
      blades.push(blade);

      // Curved PV Solar Layer
      const pvGeo = new THREE.CylinderGeometry(0.91, 0.91, bladeHeight * 0.85, 24, 1, true, 0.05, Math.PI * 0.8);
      const pv = new THREE.Mesh(pvGeo, pvMat);
      pv.position.set(bladeRadius, 6.2, 0);
      pv.rotation.y = Math.PI / 4;
      pv.visible = pvVisibleRef.current;
      bladeArm.add(pv);
      pvs.push(pv);

      bladesGroup.add(bladeArm);
    }
    pvMeshesRef.current = pvs;
    bladeMeshesRef.current = blades;

    // Dimension lines
    const dimGroup = new THREE.Group();
    scene.add(dimGroup);
    dimGroupRef.current = dimGroup;

    const lineMat = new THREE.LineBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.6 });
    const hLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.2, 0, 0),
      new THREE.Vector3(-4.2, 11.4, 0),
    ]);
    dimGroup.add(new THREE.Line(hLineGeo, lineMat));

    const dLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.8, 11.6, 0),
      new THREE.Vector3(3.8, 11.6, 0),
    ]);
    dimGroup.add(new THREE.Line(dLineGeo, lineMat));

    // Mouse drag-to-rotate implementation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = Math.atan2(camera.position.x, camera.position.z);
    let sphericalPhi = Math.acos(camera.position.y / camera.position.length());
    let sphericalRadius = camera.position.length();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= dx * 0.008;
      sphericalPhi -= dy * 0.008;
      sphericalPhi = Math.max(0.1, Math.min(Math.PI / 2 + 0.05, sphericalPhi));

      const targetY = 4.5;
      camera.position.x = sphericalRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = targetY + sphericalRadius * Math.cos(sphericalPhi);
      camera.position.z = sphericalRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(0, targetY, 0);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRadius = Math.max(8, Math.min(45, sphericalRadius + e.deltaY * 0.02));
      const targetY = 4.5;
      camera.position.x = sphericalRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = targetY + sphericalRadius * Math.cos(sphericalPhi);
      camera.position.z = sphericalRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(0, targetY, 0);
    };

    // Raycaster for part selection
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const hits = raycaster.intersectObjects(turbineAssembly.children, true);

      if (hits.length > 0) {
        const hitObj = hits[0].object as THREE.Mesh;
        if (hitObj === shaftMeshRef.current) {
          onSelectComponent('Central Torque Shaft');
        } else if (hitObj === statorMeshRef.current || hitObj === basePlate) {
          onSelectComponent('Direct-Drive PM Generator');
        } else if (pvMeshesRef.current.includes(hitObj)) {
          onSelectComponent('Solar PV Array');
        } else if (bladeMeshesRef.current.includes(hitObj)) {
          onSelectComponent('Curved Aerodynamic Blades');
        } else if (hitObj === bearingMeshRef.current) {
          onSelectComponent('Thrust Bearing Assembly');
        } else {
          onSelectComponent('Hybrid Power Core Assembly');
        }
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('click', onClick);

    // Render loop
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      animId = requestAnimationFrame(renderLoop);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Rotation based on active RPM
      if (rotorGroupRef.current) {
        const speed = (currentRpmRef.current * (2 * Math.PI) / 60) * delta;
        rotorGroupRef.current.rotation.y += speed;
      }

      // Exploded view animation
      const targetExp = exploded ? 1.0 : 0.0;
      explodedProgressRef.current += (targetExp - explodedProgressRef.current) * 0.1;
      const ep = explodedProgressRef.current;

      if (bladesGroupRef.current) {
        bladesGroupRef.current.children.forEach((arm, i) => {
          const radialAngle = (i / bladeCount) * Math.PI * 2;
          arm.position.x = Math.sin(radialAngle) * (ep * 1.8);
          arm.position.z = Math.cos(radialAngle) * (ep * 1.8);
        });
      }

      if (capGroupRef.current) {
        capGroupRef.current.position.y = ep * 2.2;
      }
      if (statorGroupRef.current) {
        statorGroupRef.current.position.y = -ep * 1.4;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(renderLoop);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('click', onClick);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [exploded, onSelectComponent]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Engineering Labels Overlay */}
      {labelsVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            onClick={() => onSelectComponent('Solar PV Array')}
            className="absolute top-[28%] left-[54%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <div className="flex items-center gap-1.5 bg-[#0E1422]/90 border border-slate-700/80 px-2 py-0.5 rounded shadow-lg backdrop-blur-xs hover:border-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="text-[10.5px] font-mono font-bold text-blue-400">Solar PV Array (Mono-Si)</span>
            </div>
          </div>

          <div
            onClick={() => onSelectComponent('Curved Aerodynamic Blades')}
            className="absolute top-[42%] left-[36%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <div className="flex items-center gap-1.5 bg-[#0E1422]/90 border border-slate-700/80 px-2 py-0.5 rounded shadow-lg backdrop-blur-xs hover:border-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span className="text-[10.5px] font-mono font-bold text-cyan-400">Aerodynamic VAWT Blade</span>
            </div>
          </div>

          <div
            onClick={() => onSelectComponent('Central Torque Shaft')}
            className="absolute top-[22%] left-[48%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <div className="flex items-center gap-1.5 bg-[#0E1422]/90 border border-slate-700/80 px-2 py-0.5 rounded shadow-lg backdrop-blur-xs hover:border-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-[10.5px] font-mono font-bold text-amber-400">Central Torque Shaft</span>
            </div>
          </div>

          <div
            onClick={() => onSelectComponent('Direct-Drive PM Generator')}
            className="absolute top-[72%] left-[49%] pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <div className="flex items-center gap-1.5 bg-[#0E1422]/90 border border-slate-700/80 px-2 py-0.5 rounded shadow-lg backdrop-blur-xs hover:border-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10.5px] font-mono font-bold text-emerald-400">Direct-Drive Generator</span>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions Overlay Legend */}
      {dimensionsVisible && (
        <div className="absolute top-4 left-4 pointer-events-none bg-[#0E1422]/80 border border-slate-800 p-2 rounded text-[10px] font-mono text-cyan-400 space-y-0.5 backdrop-blur-xs">
          <div>HEIGHT: 850 mm</div>
          <div>ROTOR DIA: Ø 480 mm</div>
          <div>BASE DIA: Ø 260 mm</div>
        </div>
      )}
    </div>
  );
};
