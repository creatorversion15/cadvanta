import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SolvedAssemblyResult, buildAssemblySceneGroup } from '../../engine/assemblySolver';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Sparkles, Layers } from 'lucide-react';

interface AssemblyPreview3DProps {
  solved: SolvedAssemblyResult;
  showMatingIndicators?: boolean;
  highlightedMateId?: string | null;
  onSelectMate?: (mateId: string) => void;
  className?: string;
}

export const AssemblyPreview3D: React.FC<AssemblyPreview3DProps> = ({
  solved,
  showMatingIndicators = true,
  highlightedMateId = null,
  onSelectMate,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const assemblyGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Camera Orbit parameters
  const isDraggingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 340,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const [activeMatesCount, setActiveMatesCount] = useState<number>(0);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const s = sphericalRef.current;
    const t = targetRef.current;

    const x = t.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = t.y + s.radius * Math.cos(s.phi);
    const z = t.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(t);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040e0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(200, 300, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x86a79c, 0.6);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0x00f5a0, 0.4);
    rimLight.position.set(0, -200, 150);
    scene.add(rimLight);

    // Subtle Grid
    const grid = new THREE.GridHelper(300, 30, 0x00f5a0, 0x0f2d22);
    grid.position.y = -60;
    scene.add(grid);

    // Render loop
    const renderScene = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(renderScene);
    };
    renderScene();

    // Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [updateCameraPosition]);

  // Update Assembly Geometry when solved, showMatingIndicators, or highlightedMateId changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing assembly group
    if (assemblyGroupRef.current) {
      scene.remove(assemblyGroupRef.current);
      assemblyGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      assemblyGroupRef.current = null;
    }

    try {
      const group = buildAssemblySceneGroup(solved, false, {
        showMatingIndicators,
        highlightedMateId,
        activeSuggestions: solved.smartSuggestions,
      });

      scene.add(group);
      assemblyGroupRef.current = group;

      // Count mating indicator points
      const indicators = group.getObjectByName('Assembly_Mating_Indicators');
      if (indicators) {
        const count = indicators.children.filter(
          (c) => c instanceof THREE.Mesh && c.userData?.isMatingIndicator
        ).length;
        setActiveMatesCount(count);
      } else {
        setActiveMatesCount(0);
      }
    } catch (e) {
      console.error('Error generating assembly preview scene:', e);
    }
  }, [solved, showMatingIndicators, highlightedMateId]);

  // Pointer event handlers for orbiting and zooming
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    isPanningRef.current = e.button === 2 || e.shiftKey;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    if (isPanningRef.current) {
      // Pan
      const factor = sphericalRef.current.radius * 0.0015;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      if (cameraRef.current) {
        cameraRef.current.matrix.extractBasis(right, up, new THREE.Vector3());
        targetRef.current.addScaledVector(right, -deltaX * factor);
        targetRef.current.addScaledVector(up, deltaY * factor);
        updateCameraPosition();
      }
    } else {
      // Orbit
      const rotateSpeed = 0.008;
      sphericalRef.current.theta -= deltaX * rotateSpeed;
      sphericalRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, sphericalRef.current.phi - deltaY * rotateSpeed)
      );
      updateCameraPosition();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.25;
    sphericalRef.current.radius = Math.max(
      60,
      Math.min(1200, sphericalRef.current.radius + zoomFactor)
    );
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    sphericalRef.current = {
      radius: 340,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };
    targetRef.current.set(0, 0, 0);
    updateCameraPosition();
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    const factor = inOut === 'in' ? -50 : 50;
    sphericalRef.current.radius = Math.max(60, Math.min(1200, sphericalRef.current.radius + factor));
    updateCameraPosition();
  };

  return (
    <div
      className={`relative w-full h-full min-h-[260px] rounded-xl overflow-hidden border border-[#00F5A0]/25 bg-[#030c08] select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Floating Top-Left Status Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-lg bg-[#071610]/90 backdrop-blur-md border border-[#00F5A0]/40 flex items-center gap-1.5 text-[11px] font-mono shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#00F5A0] animate-pulse" />
          <span className="font-bold text-[#F0FDF4]">SMART MATES 3D PREVIEW</span>
        </div>

        {showMatingIndicators && activeMatesCount > 0 && (
          <div className="px-2 py-0.5 rounded-md bg-[#102B21]/90 backdrop-blur-md border border-[#00F5A0]/30 text-[10px] font-mono text-[#00F5A0] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>{activeMatesCount} Mating Spheres Active</span>
          </div>
        )}
      </div>

      {/* Floating Camera Controls Top-Right */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleZoom('in')}
          className="p-1.5 rounded-lg bg-[#071610]/85 hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#00F5A0] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom('out')}
          className="p-1.5 rounded-lg bg-[#071610]/85 hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#00F5A0] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg bg-[#071610]/85 hover:bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#00F5A0] transition-colors cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Color-Coded Sphere Legend */}
      <div className="absolute bottom-2 left-2 right-2 z-10 px-2.5 py-1.5 rounded-lg bg-[#05140E]/90 backdrop-blur-md border border-[rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono pointer-events-none">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#8CA89E] font-bold">Mating Spheres:</span>
          <div className="flex items-center gap-1 text-[#00F5A0]">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] shadow-[0_0_8px_#00F5A0]" />
            <span>Concentric Axis</span>
          </div>
          <div className="flex items-center gap-1 text-[#F59E0B]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span>Coincident Face</span>
          </div>
          <div className="flex items-center gap-1 text-[#8B5CF6]">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <span>Distance Offset</span>
          </div>
          <div className="flex items-center gap-1 text-[#38BDF8]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
            <span>Parallel Plane</span>
          </div>
        </div>

        <span className="text-[#8CA89E] text-[9px] hidden sm:inline">
          Drag to Orbit • Right-Click/Shift to Pan • Scroll to Zoom
        </span>
      </div>
    </div>
  );
};
