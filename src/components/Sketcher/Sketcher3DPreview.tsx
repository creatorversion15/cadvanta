import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  Box,
  Sliders,
  Eye,
} from 'lucide-react';
import { buildShapeFromEntities } from '../../cad/geometryGenerators';

interface Sketcher3DPreviewProps {
  entities: any[];
  activePlane: 'XY' | 'XZ' | 'YZ';
  extrudeDepth: number;
  direction: 'blind' | 'symmetric';
  partColor?: string;
  onDepthChange: (depth: number) => void;
  onDirectionChange: (dir: 'blind' | 'symmetric') => void;
  onFinishAndExtrude: () => void;
}

export const Sketcher3DPreview: React.FC<Sketcher3DPreviewProps> = ({
  entities,
  activePlane,
  extrudeDepth,
  direction,
  partColor = '#F5F5F5',
  onDepthChange,
  onDirectionChange,
  onFinishAndExtrude,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Orbit state
  const isDraggingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const datumMeshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene with dark grey gradient
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Gradient background texture (#2A2F36 top to #1E2228 bottom)
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#2A2F36');
      grad.addColorStop(1, '#1E2228');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2, 512);
      const bgTexture = new THREE.CanvasTexture(bgCanvas);
      scene.background = bgTexture;
    } else {
      scene.background = new THREE.Color(0x1e2228);
    }

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(160, 140, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Lighting (Calibrated for white satin part)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(300, 400, 300);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-300, 100, 100);
    scene.add(fillLight);

    // Floor Engineering Grid
    const gridHelper = new THREE.GridHelper(300, 30, 0x475569, 0x334155);
    gridHelper.position.y = -40;
    scene.add(gridHelper);

    // Coordinate Trihedron Axes Helper
    const axesHelper = new THREE.AxesHelper(35);
    axesHelper.position.set(-110, -35, 110);
    scene.add(axesHelper);

    // Datum Plane Preview Frame
    const planeGeo = new THREE.PlaneGeometry(160, 160);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const datumMesh = new THREE.Mesh(planeGeo, planeMat);
    scene.add(datumMesh);
    datumMeshRef.current = datumMesh;

    // Extruded Mesh Container Group
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update Datum Plane Frame on activePlane change
  useEffect(() => {
    const datumMesh = datumMeshRef.current;
    if (!datumMesh) return;
    const planeColor = activePlane === 'XY' ? 0x10b981 : activePlane === 'XZ' ? 0x38bdf8 : 0xf43f5e;
    if (datumMesh.material instanceof THREE.MeshBasicMaterial) {
      datumMesh.material.color.setHex(planeColor);
    }
    datumMesh.rotation.set(0, 0, 0);
    if (activePlane === 'XZ') datumMesh.rotation.x = Math.PI / 2;
    if (activePlane === 'YZ') datumMesh.rotation.y = Math.PI / 2;
  }, [activePlane]);

  // Update Extruded 3D Mesh in Real-Time
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const group = meshGroupRef.current;

    // Clear previous children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    try {
      const depth = Math.max(2, extrudeDepth);
      const shape = buildShapeFromEntities(entities);

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: depth,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: Math.min(2, depth * 0.05),
        bevelThickness: Math.min(2, depth * 0.05),
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // Centering according to direction
      if (direction === 'symmetric') {
        geo.translate(0, 0, -depth / 2);
      }

      // Align with selected datum plane
      if (activePlane === 'XZ') {
        geo.rotateX(-Math.PI / 2);
      } else if (activePlane === 'YZ') {
        geo.rotateY(Math.PI / 2);
      }

      // Satin white PBR material (#F5F5F5, metalness 0.1, roughness 0.45)
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(partColor || '#F5F5F5'),
        metalness: 0.1,
        roughness: 0.45,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Add thin dark-grey CAD edge outlines (#3A3A3A, 1px)
      const edgesGeom = new THREE.EdgesGeometry(geo, 22);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x3a3a3a,
        linewidth: 1,
      });
      const edges = new THREE.LineSegments(edgesGeom, edgesMat);
      mesh.add(edges);

      group.add(mesh);
    } catch (err) {
      console.warn('Failed to rebuild preview extrusion:', err);
    }
  }, [entities, extrudeDepth, direction, activePlane, partColor]);

  // Mouse & Touch Orbit Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = e.button === 0;
    isPanningRef.current = e.button === 2;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.007;
      const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
      const radius = offset.length();

      let theta = Math.atan2(offset.x, offset.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

      theta -= deltaX * rotSpeed;
      phi -= deltaY * rotSpeed;
      phi = Math.max(0.05, Math.min(Math.PI - 0.05, phi));

      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);

      camera.position.copy(cameraTargetRef.current).add(offset);
      camera.lookAt(cameraTargetRef.current);
    } else if (isPanningRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      const panSpeed = 0.3;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.matrix.extractBasis(right, up, new THREE.Vector3());

      const panDelta = right.clone().multiplyScalar(-deltaX * panSpeed).add(up.clone().multiplyScalar(deltaY * panSpeed));
      camera.position.add(panDelta);
      cameraTargetRef.current.add(panDelta);
      camera.lookAt(cameraTargetRef.current);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
    offset.multiplyScalar(factor);
    if (offset.length() > 20 && offset.length() < 1200) {
      camera.position.copy(cameraTargetRef.current).add(offset);
      camera.lookAt(cameraTargetRef.current);
    }
  };

  const resetView = () => {
    const camera = cameraRef.current;
    if (!camera) return;
    cameraTargetRef.current.set(0, 0, 0);
    camera.position.set(160, 140, 200);
    camera.lookAt(0, 0, 0);
  };

  return (
    <div
      className="w-full h-full relative select-none overflow-hidden flex flex-col bg-[#1E2228]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top HUD: Synchronized 3D Solid Preview Banner */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0B1E17]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[rgba(16,185,129,0.25)] shadow-md text-xs font-mono text-[#F0FDF4]">
        <div className="flex items-center gap-1.5 text-[#00F5A0] font-bold">
          <Box className="w-4 h-4 text-[#00F5A0]" />
          <span>LIVE 3D SOLID PREVIEW</span>
        </div>
        <span className="text-[10px] text-[#8CA89E]">
          Plane: <strong className="text-[#F0FDF4]">{activePlane}</strong>
        </span>
        <button
          onClick={resetView}
          className="p-1 rounded hover:bg-[#102B21] text-[#8CA89E] hover:text-[#00F5A0] ml-1 transition-colors cursor-pointer"
          title="Reset 3D Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Floating Extrude Boss Controls HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#0B1E17]/95 backdrop-blur-md border border-[rgba(16,185,129,0.3)] rounded-xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        {/* Depth Slider & Stepper */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-[11px] font-bold text-[#00F5A0] uppercase whitespace-nowrap">
            Depth:
          </span>
          <input
            type="range"
            min="2"
            max="300"
            step="1"
            value={extrudeDepth}
            onChange={(e) => onDepthChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#00F5A0] cursor-pointer"
          />
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number"
              min="1"
              max="1000"
              value={extrudeDepth}
              onChange={(e) => onDepthChange(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-16 bg-[#07130F] border border-[rgba(16,185,129,0.3)] rounded px-1.5 py-0.5 text-center text-xs text-[#00F5A0] font-bold"
            />
            <span className="text-[#8CA89E] text-[11px]">mm</span>
          </div>
        </div>

        {/* Direction Toggle */}
        <div className="flex items-center gap-1 bg-[#07130F] p-0.5 rounded-lg border border-[rgba(16,185,129,0.2)] shrink-0">
          <button
            type="button"
            onClick={() => onDirectionChange('blind')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              direction === 'blind'
                ? 'bg-[#00F5A0] text-[#02140D]'
                : 'text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            Blind
          </button>
          <button
            type="button"
            onClick={() => onDirectionChange('symmetric')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              direction === 'symmetric'
                ? 'bg-[#00F5A0] text-[#02140D]'
                : 'text-[#8CA89E] hover:text-[#F0FDF4]'
            }`}
          >
            Symmetric
          </button>
        </div>

        {/* Primary Finish & Extrude Action Button */}
        <button
          type="button"
          onClick={onFinishAndExtrude}
          className="w-full sm:w-auto px-4 py-2 bg-[#00F5A0] hover:bg-[#00D68B] text-[#02140D] font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finish & Extrude</span>
        </button>
      </div>
    </div>
  );
};
