import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  CADPart,
  DisplayMode,
  CameraView,
  CameraProjection,
} from '../../types/cad';
import { buildCADSceneModel, GeneratedCADModel } from '../../engine/geometryGenerator';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Box,
  Eye,
  Grid,
  Compass,
  Scissors,
  Ruler,
  Layers,
  Camera,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CADViewerProps {
  part: CADPart;
  onParameterChange?: (key: string, value: any) => void;
  feaGroup?: THREE.Group | null;
  onClearFEA?: () => void;
  assemblyGroup?: THREE.Group | null;
  onClearAssembly?: () => void;
}

export const CADViewer: React.FC<CADViewerProps> = ({
  part,
  feaGroup,
  onClearFEA,
  assemblyGroup,
  onClearAssembly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const edgesRef = useRef<THREE.LineSegments | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Viewer state
  const { theme } = useTheme();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('shaded_edges');
  const [projection, setProjection] = useState<CameraProjection>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [enableSectionCut, setEnableSectionCut] = useState<boolean>(false);
  const [sectionAxis, setSectionAxis] = useState<'x' | 'y' | 'z'>('z');
  const [sectionOffset, setSectionOffset] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<CameraView>('iso');
  const [modelMetrics, setModelMetrics] = useState<GeneratedCADModel | null>(null);

  // Viewport Capture state (High-res transparent PNG export)
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);
  const [captureMenuOpen, setCaptureMenuOpen] = useState<boolean>(false);
  const [captureResolution, setCaptureResolution] = useState<'2k' | '4k'>('2k');
  const [captureIncludeGrid, setCaptureIncludeGrid] = useState<boolean>(false);
  const [captureToast, setCaptureToast] = useState<{
    visible: boolean;
    message: string;
    resolution: string;
  } | null>(null);
  const captureMenuRef = useRef<HTMLDivElement>(null);

  // Close capture dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (captureMenuRef.current && !captureMenuRef.current.contains(e.target as Node)) {
        setCaptureMenuOpen(false);
      }
    };
    if (captureMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [captureMenuOpen]);

  // Orbit control state (custom robust CAD orbit/pan/zoom)
  const isDraggingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 300,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030A07);
    sceneRef.current = scene;

    // Camera (Default Perspective)
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 3000);
    camera.position.set(200, 180, 260);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (Studio CAD Engineering Setup for Deep Emerald Workstation)
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(300, 400, 300);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x86a79c, 0.6);
    dirLight2.position.set(-300, -200, -300);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0x00f5a0, 0.4);
    rimLight.position.set(0, -300, 200);
    scene.add(rimLight);

    // Engineering Grid Plane (subdivisions in 10mm / 50mm) - Mint center / Deep Emerald grid
    const gridHelper = new THREE.GridHelper(500, 50, 0x00f5a0, 0x0e2b20);
    gridHelper.position.y = -60;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // XYZ Coordinate Trihedron
    const axesHelper = new THREE.AxesHelper(60);
    axesHelper.position.set(-160, -55, 160);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Model group container
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (cameraRef.current instanceof THREE.PerspectiveCamera) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      } else if (cameraRef.current instanceof THREE.OrthographicCamera) {
        const frustum = 250;
        const asp = w / h;
        cameraRef.current.left = (-frustum * asp) / 2;
        cameraRef.current.right = (frustum * asp) / 2;
        cameraRef.current.top = frustum / 2;
        cameraRef.current.bottom = -frustum / 2;
        cameraRef.current.updateProjectionMatrix();
      }
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update Scene background & grid tone when Theme changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (theme === 'light') {
      sceneRef.current.background = new THREE.Color(0xF1F5F9);
    } else {
      sceneRef.current.background = new THREE.Color(0x030A07);
    }
  }, [theme]);

  // Update Geometry whenever Part parameters or Display Mode or Section Cut changes
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;

    // Clear previous mesh
    while (modelGroupRef.current.children.length > 0) {
      const obj = modelGroupRef.current.children[0];
      modelGroupRef.current.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    // Section cut clipping plane if active
    let clippingPlane: THREE.Plane | undefined;
    if (enableSectionCut) {
      let normal = new THREE.Vector3(0, 0, 1);
      if (sectionAxis === 'x') normal = new THREE.Vector3(1, 0, 0);
      else if (sectionAxis === 'y') normal = new THREE.Vector3(0, 1, 0);
      else if (sectionAxis === 'z') normal = new THREE.Vector3(0, 0, 1);
      clippingPlane = new THREE.Plane(normal, sectionOffset);
    }

    if (feaGroup) {
      modelGroupRef.current.add(feaGroup);
    } else if (assemblyGroup) {
      modelGroupRef.current.add(assemblyGroup);
    } else {
      const generated = buildCADSceneModel(part, displayMode, clippingPlane);
      modelGroupRef.current.add(generated.group);
      edgesRef.current = generated.edges;
      meshRef.current = generated.mesh;
      setModelMetrics(generated);

      // Adjust grid position to be just below the bottom of the bounding box
      if (gridHelperRef.current) {
        const bottomY = generated.boundingBox.min.y;
        gridHelperRef.current.position.y = bottomY - 5;
      }
    }
  }, [part, displayMode, enableSectionCut, sectionAxis, sectionOffset, feaGroup, assemblyGroup]);

  // Handle Camera View Presets
  const setCameraView = useCallback((view: CameraView) => {
    setActiveView(view);
    const camera = cameraRef.current;
    if (!camera) return;

    const dist = 320;
    const target = cameraTargetRef.current;

    switch (view) {
      case 'iso':
        camera.position.set(dist * 0.7, dist * 0.6, dist * 0.7);
        break;
      case 'front':
        camera.position.set(0, 0, dist);
        break;
      case 'back':
        camera.position.set(0, 0, -dist);
        break;
      case 'top':
        camera.position.set(0, dist, 0);
        break;
      case 'bottom':
        camera.position.set(0, -dist, 0);
        break;
      case 'left':
        camera.position.set(-dist, 0, 0);
        break;
      case 'right':
        camera.position.set(dist, 0, 0);
        break;
    }

    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, []);

  // Projection Toggle (Perspective <-> Orthographic)
  const toggleProjection = () => {
    if (!containerRef.current || !sceneRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const aspect = w / h;

    if (projection === 'perspective') {
      const frustum = 300;
      const ortho = new THREE.OrthographicCamera(
        (-frustum * aspect) / 2,
        (frustum * aspect) / 2,
        frustum / 2,
        -frustum / 2,
        1,
        3000
      );
      if (cameraRef.current) {
        ortho.position.copy(cameraRef.current.position);
        ortho.lookAt(cameraTargetRef.current);
      }
      cameraRef.current = ortho;
      setProjection('orthographic');
    } else {
      const persp = new THREE.PerspectiveCamera(45, aspect, 1, 3000);
      if (cameraRef.current) {
        persp.position.copy(cameraRef.current.position);
        persp.lookAt(cameraTargetRef.current);
      }
      cameraRef.current = persp;
      setProjection('perspective');
    }
  };

  // Reset Camera
  const resetCamera = () => {
    cameraTargetRef.current.set(0, 0, 0);
    setCameraView('iso');
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Mouse Orbit / Pan / Zoom Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || e.shiftKey) {
      isPanningRef.current = true;
    } else if (e.button === 0) {
      isDraggingRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    const camera = cameraRef.current;
    if (!camera) return;

    if (isDraggingRef.current) {
      // Orbit Rotation
      const rotSpeed = 0.008;
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
      // Pan Translation
      const panSpeed = 0.35;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();

      camera.matrix.extractBasis(right, up, new THREE.Vector3());

      const panOffset = new THREE.Vector3()
        .addScaledVector(right, -deltaX * panSpeed)
        .addScaledVector(up, deltaY * panSpeed);

      camera.position.add(panOffset);
      cameraTargetRef.current.add(panOffset);
      camera.lookAt(cameraTargetRef.current);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const camera = cameraRef.current;
    if (!camera) return;

    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;

    if (camera instanceof THREE.PerspectiveCamera) {
      const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
      offset.multiplyScalar(zoomFactor);
      if (offset.length() > 30 && offset.length() < 1200) {
        camera.position.copy(cameraTargetRef.current).add(offset);
        camera.lookAt(cameraTargetRef.current);
      }
    } else if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = Math.max(0.2, Math.min(5.0, camera.zoom / zoomFactor));
      camera.updateProjectionMatrix();
    }
  };

  // Toggle Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showGrid]);

  // Toggle Axes Visibility
  useEffect(() => {
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showAxes]);

  // Capture Viewport: generates a high-resolution, transparent-background PNG of the 3D scene for documentation usage
  const handleCaptureViewport = useCallback(
    (preset?: '2k' | '4k') => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const container = containerRef.current;
      if (!renderer || !scene || !camera || !container) return;

      const resChoice = preset || captureResolution;
      setIsCapturing(true);
      setCaptureMenuOpen(false);

      // Trigger visual camera shutter flash
      setShowShutterFlash(true);
      setTimeout(() => setShowShutterFlash(false), 200);

      requestAnimationFrame(() => {
        try {
          const originalBackground = scene.background;
          const originalGridVisible = gridHelperRef.current ? gridHelperRef.current.visible : false;
          const originalAxesVisible = axesHelperRef.current ? axesHelperRef.current.visible : false;
          const originalSize = new THREE.Vector2();
          renderer.getSize(originalSize);
          const originalPixelRatio = renderer.getPixelRatio();

          // 1. Transparent background: null out scene background & clear alpha buffer
          scene.background = null;
          renderer.setClearColor(0x000000, 0);

          // 2. Clean Part Isolation for documentation: hide grid and axes unless explicitly included
          if (!captureIncludeGrid) {
            if (gridHelperRef.current) gridHelperRef.current.visible = false;
            if (axesHelperRef.current) axesHelperRef.current.visible = false;
          }

          // 3. High-Resolution target dimension (2K: 2560px, 4K: 3840px max dimension)
          const baseWidth = originalSize.x || container.clientWidth || 800;
          const baseHeight = originalSize.y || container.clientHeight || 600;
          const targetDim = resChoice === '4k' ? 3840 : 2560;
          const scale = Math.max(2, Math.min(4, targetDim / Math.max(baseWidth, baseHeight)));
          const captureWidth = Math.round(baseWidth * scale);
          const captureHeight = Math.round(baseHeight * scale);

          // 4. Temporarily resize renderer to high-resolution
          renderer.setPixelRatio(1);
          renderer.setSize(captureWidth, captureHeight, false);

          // 5. Update camera aspect ratio & projection
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = captureWidth / captureHeight;
            camera.updateProjectionMatrix();
          } else if (camera instanceof THREE.OrthographicCamera) {
            camera.updateProjectionMatrix();
          }

          // 6. Render the transparent high-res frame
          renderer.clear();
          renderer.render(scene, camera);

          // 7. Extract PNG with alpha channel intact
          const dataUrl = renderer.domElement.toDataURL('image/png');

          // 8. Restore viewport size & camera projection immediately
          renderer.setSize(originalSize.x, originalSize.y, false);
          renderer.setPixelRatio(originalPixelRatio);

          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = originalSize.x / originalSize.y;
            camera.updateProjectionMatrix();
          } else if (camera instanceof THREE.OrthographicCamera) {
            camera.updateProjectionMatrix();
          }

          // 9. Restore scene background & helper visibility
          scene.background = originalBackground;
          if (gridHelperRef.current) gridHelperRef.current.visible = originalGridVisible;
          if (axesHelperRef.current) axesHelperRef.current.visible = originalAxesVisible;

          // 10. Re-render regular scene
          renderer.render(scene, camera);

          // 11. Trigger download of high-resolution transparent PNG
          const partName = (part.name || part.part_type || 'cad_model')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `${partName}_documentation_${resChoice.toUpperCase()}_${timestamp}.png`;

          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 12. Show confirmation toast
          setCaptureToast({
            visible: true,
            message: 'Viewport Captured for Documentation',
            resolution: `${captureWidth} × ${captureHeight} px`,
          });
          setTimeout(() => setCaptureToast(null), 4000);
        } catch (err) {
          console.error('Failed to capture high-res transparent viewport:', err);
        } finally {
          setIsCapturing(false);
        }
      });
    },
    [part, captureResolution, captureIncludeGrid]
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030A07] select-none overflow-hidden rounded-lg">
      {/* Top Floating CAD Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View Angle Presets */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.22)] shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8CA89E] px-2 py-0.5 font-bold">
            VIEW
          </span>
          {(['iso', 'front', 'top', 'right'] as CameraView[]).map((v) => (
            <button
              key={v}
              id={`btn-view-${v}`}
              onClick={() => setCameraView(v)}
              className={`px-2.5 py-1 text-xs font-mono uppercase rounded font-bold transition-all ${
                activeView === v
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                  : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
              }`}
            >
              {v}
            </button>
          ))}
          <button
            id="btn-camera-reset"
            onClick={resetCamera}
            title="Reset Camera & Target"
            className="p-1 bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#153529] rounded transition-colors ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CAD Display Mode & Visual Toggles */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.22)] shadow-xl">
          <button
            id="btn-mode-shaded-edges"
            onClick={() => setDisplayMode('shaded_edges')}
            title="Shaded with Engineering Edges"
            className={`p-1.5 rounded transition-all ${
              displayMode === 'shaded_edges'
                ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            id="btn-mode-wireframe"
            onClick={() => setDisplayMode('wireframe')}
            title="Technical Wireframe"
            className={`p-1.5 rounded transition-all ${
              displayMode === 'wireframe'
                ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            id="btn-mode-xray"
            onClick={() => setDisplayMode('xray')}
            title="X-Ray Ghost (Internal Features)"
            className={`p-1.5 rounded transition-all ${
              displayMode === 'xray'
                ? 'bg-[#00F5A0] text-[#02140D] font-bold shadow-[0_0_10px_rgba(0,245,160,0.3)]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[rgba(16,185,129,0.25)] mx-1" />

          {/* Perspective / Orthographic Toggle */}
          <button
            id="btn-toggle-projection"
            onClick={toggleProjection}
            title={`Camera: ${projection === 'perspective' ? 'Perspective 3D' : 'Orthographic CAD'}`}
            className="px-2 py-1 text-xs font-mono font-bold bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#153529] rounded transition-colors"
          >
            {projection === 'perspective' ? 'PERS' : 'ORTHO'}
          </button>

          {/* Grid Toggle */}
          <button
            id="btn-toggle-grid"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Engineering Grid"
            className={`p-1.5 rounded transition-colors ${
              showGrid
                ? 'text-[#02140D] bg-[#00F5A0] border border-[#00F5A0]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Dimensions Overlay Toggle */}
          <button
            id="btn-toggle-dimensions"
            onClick={() => setShowDimensions(!showDimensions)}
            title="Toggle 3D Dimension Annotations"
            className={`p-1.5 rounded transition-colors ${
              showDimensions
                ? 'text-[#02140D] bg-[#00F5A0] border border-[#00F5A0]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Section Cut Tool Toggle */}
          <button
            id="btn-toggle-section-cut"
            onClick={() => setEnableSectionCut(!enableSectionCut)}
            title="Cross-Section Cut Plane"
            className={`p-1.5 rounded transition-colors ${
              enableSectionCut
                ? 'text-[#02140D] bg-[#00F5A0] border border-[#00F5A0]'
                : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#F0FDF4] hover:bg-[#153529]'
            }`}
          >
            <Scissors className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[rgba(16,185,129,0.25)] mx-0.5" />

          {/* Capture Viewport: High-Resolution Transparent PNG for Documentation */}
          <div className="relative flex items-center" ref={captureMenuRef}>
            <button
              id="btn-capture-viewport"
              onClick={() => handleCaptureViewport()}
              disabled={isCapturing}
              title="Capture Viewport (High-Resolution Transparent PNG for Documentation)"
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all text-xs font-mono font-bold cursor-pointer ${
                isCapturing
                  ? 'bg-[#00F5A0] text-[#02140D] shadow-[0_0_15px_rgba(0,245,160,0.5)] animate-pulse'
                  : 'bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#00F5A0] hover:bg-[#00F5A0] hover:text-[#02140D] hover:shadow-[0_0_12px_rgba(0,245,160,0.35)]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Capture Viewport</span>
            </button>

            {/* Dropdown chevron for Capture Settings */}
            <button
              id="btn-capture-options"
              onClick={() => setCaptureMenuOpen((prev) => !prev)}
              title="Capture Resolution & Export Settings"
              className="p-1 ml-0.5 rounded bg-[#102B21] border border-[rgba(16,185,129,0.25)] text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#153529] transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  captureMenuOpen ? 'rotate-180 text-[#00F5A0]' : ''
                }`}
              />
            </button>

            {/* Capture Options Popover Menu */}
            {captureMenuOpen && (
              <div
                id="menu-capture-options"
                className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#081611]/98 border border-[rgba(16,185,129,0.3)] rounded-xl shadow-2xl backdrop-blur-xl z-50 text-xs font-mono space-y-2.5 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(16,185,129,0.18)]">
                  <span className="text-[10px] font-bold text-[#8CA89E] uppercase tracking-wider">
                    Capture Settings
                  </span>
                  <span className="text-[9px] text-[#00F5A0] bg-[#00F5A0]/10 px-1.5 py-0.5 rounded font-bold border border-[#00F5A0]/20">
                    Transparent PNG
                  </span>
                </div>

                {/* Resolution Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8CA89E] block">Export Resolution:</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setCaptureResolution('2k')}
                      className={`px-2 py-1 rounded text-left border flex items-center justify-between transition-all cursor-pointer ${
                        captureResolution === '2k'
                          ? 'bg-[#00F5A0]/15 border-[#00F5A0] text-[#00F5A0] font-bold'
                          : 'bg-[#0B1E17] border-[rgba(16,185,129,0.15)] text-[#8CA89E] hover:text-[#F0FDF4]'
                      }`}
                    >
                      <span>2.5K High-Res</span>
                      {captureResolution === '2k' && <Check className="w-3 h-3 text-[#00F5A0]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureResolution('4k')}
                      className={`px-2 py-1 rounded text-left border flex items-center justify-between transition-all cursor-pointer ${
                        captureResolution === '4k'
                          ? 'bg-[#00F5A0]/15 border-[#00F5A0] text-[#00F5A0] font-bold'
                          : 'bg-[#0B1E17] border-[rgba(16,185,129,0.15)] text-[#8CA89E] hover:text-[#F0FDF4]'
                      }`}
                    >
                      <span>4K Ultra-HD</span>
                      {captureResolution === '4k' && <Check className="w-3 h-3 text-[#00F5A0]" />}
                    </button>
                  </div>
                </div>

                {/* Include Grid Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-[#8CA89E] hover:text-[#F0FDF4]">
                  <input
                    type="checkbox"
                    checked={captureIncludeGrid}
                    onChange={(e) => setCaptureIncludeGrid(e.target.checked)}
                    className="rounded accent-[#00F5A0] cursor-pointer"
                  />
                  <span>Include floor grid in capture</span>
                </label>

                {/* Action button in menu */}
                <button
                  type="button"
                  onClick={() => handleCaptureViewport()}
                  className="w-full py-1.5 px-3 bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,245,160,0.3)] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture ({captureResolution === '4k' ? '4K UHD' : '2.5K High-Res'})</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[rgba(16,185,129,0.25)] mx-0.5" />

          <button
            id="btn-fullscreen"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Canvas"
            className="p-1.5 bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:text-[#00F5A0] hover:bg-[#153529] rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* FEA Stress Simulation Active Banner */}
      {feaGroup && (
        <div className="absolute top-16 left-3 z-10 px-3 py-2 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#00F5A0]/60 shadow-[0_0_20px_rgba(0,245,160,0.2)] flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#00F5A0] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>FEA STRESS MESH DISPLAY</span>
          </div>
          <span className="text-[11px] text-[#8CA89E]">Von Mises Colormap Overlay</span>
          {onClearFEA && (
            <button
              type="button"
              onClick={onClearFEA}
              className="px-2 py-0.5 rounded bg-[#102B21] hover:bg-[#16382B] text-[#00F5A0] border border-[#00F5A0]/40 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Exit FEA View
            </button>
          )}
        </div>
      )}

      {/* Assembly Multi-Part Kinematic Active Banner */}
      {assemblyGroup && !feaGroup && (
        <div className="absolute top-16 left-3 z-10 px-3 py-2 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#00F5A0]/60 shadow-[0_0_20px_rgba(0,245,160,0.2)] flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#00F5A0] font-bold">
            <Layers className="w-4 h-4 text-[#00F5A0]" />
            <span>ASSEMBLY VIEW ACTIVE</span>
          </div>
          <span className="text-[11px] text-[#8CA89E]">Kinematic Mates & Interference Solved</span>
          {onClearAssembly && (
            <button
              type="button"
              onClick={onClearAssembly}
              className="px-2 py-0.5 rounded bg-[#102B21] hover:bg-[#16382B] text-[#00F5A0] border border-[#00F5A0]/40 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Exit Assembly Mode
            </button>
          )}
        </div>
      )}

      {/* Dynamic Section Cut Toolbar (when active) */}
      {enableSectionCut && (
        <div className="absolute top-16 left-3 z-10 p-2.5 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#00F5A0]/40 shadow-2xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#00F5A0] font-bold font-mono">
            <Scissors className="w-3.5 h-3.5" />
            <span>SECTION SLICE:</span>
          </div>
          <div className="flex gap-1">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => setSectionAxis(axis)}
                className={`px-2 py-0.5 font-mono uppercase font-bold rounded ${
                  sectionAxis === axis ? 'bg-[#00F5A0] text-[#02140D]' : 'bg-[#102B21] border border-[rgba(16,185,129,0.18)] text-[#8CA89E] hover:bg-[#153529]'
                }`}
              >
                {axis}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={sectionOffset}
            onChange={(e) => setSectionOffset(parseFloat(e.target.value))}
            className="w-28 accent-[#00F5A0] cursor-pointer"
          />
          <span className="font-mono text-[#F0FDF4] font-bold w-12 text-right">{sectionOffset} mm</span>
        </div>
      )}

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Viewport Shutter Flash Effect */}
      {showShutterFlash && (
        <div className="absolute inset-0 bg-[#00F5A0]/20 pointer-events-none z-40 transition-opacity duration-200" />
      )}

      {/* Viewport Capture Notification Toast */}
      {captureToast && (
        <div
          id="toast-viewport-capture"
          className="absolute top-16 right-3 z-40 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#081611]/95 border border-[#00F5A0] rounded-xl shadow-[0_0_25px_rgba(0,245,160,0.35)] backdrop-blur-md text-xs font-mono animate-in fade-in slide-in-from-top-2"
        >
          <div className="p-1.5 rounded-md bg-[#00F5A0]/15 text-[#00F5A0]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[#F0FDF4] font-bold flex items-center gap-1.5">
              <span>{captureToast.message}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-ping" />
            </div>
            <div className="text-[10px] text-[#8CA89E] mt-0.5">
              {captureToast.resolution} • RGBA Alpha
            </div>
          </div>
        </div>
      )}

      {/* 3D Interactive Bounding Dimensions HUD (Floating lower left) */}
      {showDimensions && modelMetrics && (
        <div className="absolute bottom-3 left-3 pointer-events-none flex flex-col gap-1 p-2.5 bg-[#0B1E17]/90 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.18)] text-[11px] font-mono text-[#8CA89E] shadow-xl">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#00F5A0] flex items-center gap-1.5">
            <Ruler className="w-3 h-3 text-[#00F5A0]" />
            <span>Envelope Dimensions</span>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1 text-[#8CA89E]">
            <div>
              <span className="text-[#4E6B60]">X: </span>
              <span className="text-[#F0FDF4] font-bold">
                {part.units === 'inch'
                  ? (modelMetrics.boundingBox.size.x / 25.4).toFixed(2)
                  : modelMetrics.boundingBox.size.x.toFixed(1)}
              </span> {part.units === 'inch' ? 'in' : 'mm'}
            </div>
            <div>
              <span className="text-[#4E6B60]">Y: </span>
              <span className="text-[#F0FDF4] font-bold">
                {part.units === 'inch'
                  ? (modelMetrics.boundingBox.size.y / 25.4).toFixed(2)
                  : modelMetrics.boundingBox.size.y.toFixed(1)}
              </span> {part.units === 'inch' ? 'in' : 'mm'}
            </div>
            <div>
              <span className="text-[#4E6B60]">Z: </span>
              <span className="text-[#F0FDF4] font-bold">
                {part.units === 'inch'
                  ? (modelMetrics.boundingBox.size.z / 25.4).toFixed(2)
                  : modelMetrics.boundingBox.size.z.toFixed(1)}
              </span> {part.units === 'inch' ? 'in' : 'mm'}
            </div>
          </div>
        </div>
      )}

      {/* Coordinate HUD (Lower Center/Left) */}
      <div className="absolute bottom-3 left-64 hidden sm:flex gap-4 text-[10px] text-[#8CA89E] font-mono bg-[#0B1E17]/90 px-3 py-1.5 rounded-lg border border-[rgba(16,185,129,0.18)] shadow-xs">
        <div>X: <span className="text-[#00F5A0] font-bold">0.00</span></div>
        <div>Y: <span className="text-[#00F5A0] font-bold">12.50</span></div>
        <div>Z: <span className="text-[#00F5A0] font-bold">0.00</span></div>
      </div>

      {/* Mouse Navigation Legend HUD (Lower Right) */}
      <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-3 px-3 py-1.5 bg-[#0B1E17]/90 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.18)] text-[10px] font-mono text-[#8CA89E] shadow-sm">
        <div>
          <span className="text-[#F0FDF4] font-bold">LMB:</span> Rotate
        </div>
        <div>
          <span className="text-[#F0FDF4] font-bold">RMB / Shift:</span> Pan
        </div>
        <div>
          <span className="text-[#F0FDF4] font-bold">Wheel:</span> Zoom
        </div>
      </div>
    </div>
  );
};
