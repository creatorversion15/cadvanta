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
  Info,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ViewCube } from './ViewCube';
import { DirectModelingHUD, SelectedGeometryInfo } from './DirectModelingHUD';
import {
  MeasurementOverlay,
  MeasurementToolType,
  MeasurementResult,
} from './MeasurementOverlay';

interface CADViewerProps {
  part: CADPart;
  onParameterChange?: (key: string, value: any) => void;
  feaGroup?: THREE.Group | null;
  onClearFEA?: () => void;
  assemblyGroup?: THREE.Group | null;
  onClearAssembly?: () => void;
  onOpenShortcuts?: () => void;
  isActive?: boolean;
  onSelectGeometry?: (selection: SelectedGeometryInfo | null) => void;
  onDirectAction?: (actionId: string, selection: SelectedGeometryInfo) => void;
  onCursorMove?: (pos: { x: number; y: number; z: number }) => void;
  units?: 'mm' | 'inch';
  selectedPlane?: 'XY' | 'XZ' | 'YZ' | null;
  onSelectPlane?: (plane: 'XY' | 'XZ' | 'YZ') => void;
  onOpenSketch?: () => void;
  onOpenImageStudioWithSnapshot?: (snapshotDataUrl: string) => void;
  initialSectionCut?: boolean;
  initialSectionAxis?: 'x' | 'y' | 'z';
  isExplodedActive?: boolean;
  explodedFactor?: number;
}

export const CADViewer: React.FC<CADViewerProps> = React.memo(({
  part,
  feaGroup,
  onClearFEA,
  assemblyGroup,
  onClearAssembly,
  onOpenShortcuts,
  isActive = true,
  onSelectGeometry,
  onDirectAction,
  onCursorMove,
  units = 'mm',
  selectedPlane = null,
  onSelectPlane,
  onOpenSketch,
  onOpenImageStudioWithSnapshot,
  initialSectionCut = false,
  initialSectionAxis = 'z',
  isExplodedActive = false,
  explodedFactor = 0,
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
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  // Viewer state
  const { theme } = useTheme();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('shaded_edges');
  const [projection, setProjection] = useState<CameraProjection>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [enableSectionCut, setEnableSectionCut] = useState<boolean>(initialSectionCut);
  const [sectionAxis, setSectionAxis] = useState<'x' | 'y' | 'z'>(initialSectionAxis);
  const [sectionOffset, setSectionOffset] = useState<number>(0);

  useEffect(() => {
    setEnableSectionCut(initialSectionCut);
  }, [initialSectionCut]);

  useEffect(() => {
    setSectionAxis(initialSectionAxis);
  }, [initialSectionAxis]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<CameraView>('iso');
  const [modelMetrics, setModelMetrics] = useState<GeneratedCADModel | null>(null);

  // Direct Modeling & Interactive Selection state
  const [selectedGeometry, setSelectedGeometry] = useState<SelectedGeometryInfo | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive 3D Measurement Tool state
  const [showMeasureRibbon, setShowMeasureRibbon] = useState<boolean>(false);
  const [measurementTool, setMeasurementTool] = useState<MeasurementToolType>('none');
  const [measurementPoints, setMeasurementPoints] = useState<THREE.Vector3[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementResult | null>(null);

  // Datum Reference Planes state
  const [showDatumPlanes, setShowDatumPlanes] = useState<boolean>(false);
  const datumPlanesGroupRef = useRef<THREE.Group | null>(null);

  // Assembly Mating Spheres Indicator state in 3D Viewer
  const [showMatingSpheresInViewer, setShowMatingSpheresInViewer] = useState<boolean>(true);
  const [showMatingLegendInViewer, setShowMatingLegendInViewer] = useState<boolean>(false);

  useEffect(() => {
    if (assemblyGroup) {
      const indicators = assemblyGroup.getObjectByName('Assembly_Mating_Indicators');
      if (indicators) {
        indicators.visible = showMatingSpheresInViewer;
      }
    }
  }, [assemblyGroup, showMatingSpheresInViewer]);

  // ViewCube Camera Incremental Rotation
  const handleRotateCamera = (deltaTheta: number, deltaPhi: number) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
    const radius = offset.length();
    let theta = Math.atan2(offset.x, offset.z);
    let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

    theta += deltaTheta;
    phi = Math.max(0.08, Math.min(Math.PI - 0.08, phi + deltaPhi));

    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);

    camera.position.copy(cameraTargetRef.current).add(offset);
    camera.lookAt(cameraTargetRef.current);
  };

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

    // Helper function to create dark grey gradient texture (#1E2228 to #2A2F36)
    const createDarkGradient = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#2A2F36'); // top
        gradient.addColorStop(1, '#1E2228'); // bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    // Scene with dark grey gradient (#1E2228 to #2A2F36)
    const scene = new THREE.Scene();
    scene.background = createDarkGradient();
    sceneRef.current = scene;

    // Camera (Default Perspective)
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 3000);
    camera.position.set(200, 180, 260);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer with soft shadows
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

    // Calibrated Lighting for White Part:
    // 1. One ambient light (intensity 0.9)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // 2. One main directional light from the top-right-front (intensity ~1.2)
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(300, 400, 300);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    // 3. One soft fill light from the left (intensity ~0.5)
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-300, 100, 100);
    scene.add(dirLight2);

    // Engineering Grid Plane (subdivisions in 10mm / 50mm on dark gradient)
    const gridHelper = new THREE.GridHelper(
      500,
      50,
      0x475569, // major grid line color
      0x28303a  // minor grid line color
    );
    gridHelper.position.y = -60;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // XYZ Coordinate Trihedron
    const axesHelper = new THREE.AxesHelper(60);
    axesHelper.position.set(-160, -55, 160);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Datum Reference Planes (Top XY, Front XZ, Right YZ)
    const datumGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry(160, 160);

    const xyMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const xyMesh = new THREE.Mesh(planeGeo, xyMat);
    datumGroup.add(xyMesh);

    const xzMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const xzMesh = new THREE.Mesh(planeGeo, xzMat);
    xzMesh.rotation.x = Math.PI / 2;
    datumGroup.add(xzMesh);

    const yzMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const yzMesh = new THREE.Mesh(planeGeo, yzMat);
    yzMesh.rotation.y = Math.PI / 2;
    datumGroup.add(yzMesh);

    datumGroup.visible = false;
    scene.add(datumGroup);
    datumPlanesGroupRef.current = datumGroup;

    // Model group container
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render loop (only draws to screen when isActive is true)
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (isActiveRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
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

  // When returning to the CAD tab, immediately sync size and render
  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive && containerRef.current && rendererRef.current && cameraRef.current && sceneRef.current) {
      const container = containerRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
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
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [isActive]);

  // Update Scene background to dark grey gradient (#1E2228 to #2A2F36)
  useEffect(() => {
    if (!sceneRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#2A2F36'); // top
      gradient.addColorStop(1, '#1E2228'); // bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    sceneRef.current.background = texture;
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
      const effectivePart = (explodedFactor !== undefined && explodedFactor !== null)
        ? {
            ...part,
            parameters: {
              ...part.parameters,
              exploded_factor: explodedFactor,
            },
          }
        : part;
      const generated = buildCADSceneModel(effectivePart, displayMode, clippingPlane);
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
  }, [part, displayMode, enableSectionCut, sectionAxis, sectionOffset, feaGroup, assemblyGroup, explodedFactor]);

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

  // Viewport Hotkeys & Custom CAD Workspace Events (e.g. from Mobile View Controls)
  useEffect(() => {
    const handleViewportKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'r' || (e.code === 'Space' && !e.repeat)) {
        e.preventDefault();
        resetCamera();
      } else if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 'g') {
        e.preventDefault();
        setShowGrid((prev) => !prev);
      } else if (key === 'a') {
        e.preventDefault();
        setShowAxes((prev) => !prev);
      } else if (key === 'w') {
        e.preventDefault();
        setDisplayMode((prev) => {
          if (prev === 'shaded_edges') return 'wireframe';
          if (prev === 'wireframe') return 'xray';
          return 'shaded_edges';
        });
      } else if (key === 's') {
        e.preventDefault();
        setEnableSectionCut((prev) => !prev);
      }
    };

    // Custom CAD Events from Mobile controls
    const handleSetCameraView = (e: Event) => {
      const customEvent = e as CustomEvent<{ view: CameraView }>;
      if (customEvent.detail?.view) {
        setCameraView(customEvent.detail.view);
      }
    };
    const handleFitViewEvent = () => resetCamera();
    const handleToggleProjectionEvent = () => toggleProjection();
    const handleToggleGridEvent = () => setShowGrid((prev) => !prev);
    const handleToggleDimensionsEvent = () => setShowDimensions((prev) => !prev);
    const handleSetDisplayModeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: DisplayMode }>;
      if (customEvent.detail?.mode) {
        setDisplayMode(customEvent.detail.mode);
      }
    };
    const handleToggleSectionCutEvent = () => setEnableSectionCut((prev) => !prev);

    window.addEventListener('keydown', handleViewportKeyDown);
    window.addEventListener('cad-set-camera-view', handleSetCameraView);
    window.addEventListener('cad-fit-view', handleFitViewEvent);
    window.addEventListener('cad-toggle-projection', handleToggleProjectionEvent);
    window.addEventListener('cad-toggle-grid', handleToggleGridEvent);
    window.addEventListener('cad-toggle-dimensions', handleToggleDimensionsEvent);
    window.addEventListener('cad-set-display-mode', handleSetDisplayModeEvent);
    window.addEventListener('cad-toggle-section-cut', handleToggleSectionCutEvent);

    return () => {
      window.removeEventListener('keydown', handleViewportKeyDown);
      window.removeEventListener('cad-set-camera-view', handleSetCameraView);
      window.removeEventListener('cad-fit-view', handleFitViewEvent);
      window.removeEventListener('cad-toggle-projection', handleToggleProjectionEvent);
      window.removeEventListener('cad-toggle-grid', handleToggleGridEvent);
      window.removeEventListener('cad-toggle-dimensions', handleToggleDimensionsEvent);
      window.removeEventListener('cad-set-display-mode', handleSetDisplayModeEvent);
      window.removeEventListener('cad-toggle-section-cut', handleToggleSectionCutEvent);
    };
  }, [setCameraView]);

  // Touch Gesture Handling for Mobile Devices
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartMidpointRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      isPanningRef.current = false;
      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      isPanningRef.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      touchStartMidpointRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      previousMousePositionRef.current = { ...touchStartMidpointRef.current };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (e.touches.length === 1 && isDraggingRef.current) {
      // Single touch: Orbit rotation
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const deltaX = clientX - previousMousePositionRef.current.x;
      const deltaY = clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: clientX, y: clientY };

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
    } else if (e.touches.length === 2) {
      // Two touches: Pinch-to-zoom + Two-finger pan
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);

      // Pinch zoom
      if (touchStartDistRef.current !== null && touchStartDistRef.current > 0) {
        const ratio = currentDist / touchStartDistRef.current;
        const zoomDelta = ratio > 1 ? 0.96 : 1.04;

        if (camera instanceof THREE.PerspectiveCamera) {
          const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
          offset.multiplyScalar(zoomDelta);
          if (offset.length() > 30 && offset.length() < 1400) {
            camera.position.copy(cameraTargetRef.current).add(offset);
            camera.lookAt(cameraTargetRef.current);
          }
        } else if (camera instanceof THREE.OrthographicCamera) {
          camera.zoom = Math.max(0.2, Math.min(5.0, camera.zoom / zoomDelta));
          camera.updateProjectionMatrix();
        }
      }
      touchStartDistRef.current = currentDist;

      // Two-finger pan
      const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const panDeltaX = currentMidX - previousMousePositionRef.current.x;
      const panDeltaY = currentMidY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: currentMidX, y: currentMidY };

      const panSpeed = 0.25;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.matrix.extractBasis(right, up, new THREE.Vector3());

      const panOffset = new THREE.Vector3()
        .addScaledVector(right, -panDeltaX * panSpeed)
        .addScaledVector(up, panDeltaY * panSpeed);

      camera.position.add(panOffset);
      cameraTargetRef.current.add(panOffset);
      camera.lookAt(cameraTargetRef.current);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    touchStartDistRef.current = null;
    touchStartMidpointRef.current = null;
  };

  // Mouse Orbit / Pan / Zoom Events
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
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

    // Track 3D cursor position for CAD status bar
    if (containerRef.current && modelGroupRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const hits = raycaster.intersectObjects(modelGroupRef.current.children, true);
      if (hits.length > 0) {
        const p = hits[0].point;
        onCursorMove?.({ x: p.x, y: p.y, z: p.z });
      } else {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
          onCursorMove?.({ x: intersectPoint.x, y: intersectPoint.y, z: intersectPoint.z });
        }
      }
    }

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

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    isPanningRef.current = false;

    // Detect click vs drag (less than 6px moved)
    const distMoved = Math.hypot(
      e.clientX - mouseDownPosRef.current.x,
      e.clientY - mouseDownPosRef.current.y
    );
    if (distMoved < 6 && containerRef.current && cameraRef.current && modelGroupRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObjects(modelGroupRef.current.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;

        // 1. Measurement mode handling
        if (measurementTool !== 'none') {
          if (measurementTool === 'distance' || measurementTool === 'point_to_point') {
            const nextPts = [...measurementPoints, point];
            if (nextPts.length === 1) {
              setMeasurementPoints(nextPts);
              setCurrentMeasurement({
                type: 'distance',
                value: 0,
                unit: units,
                label: 'Pick 2nd point to complete measurement...',
                details: { point1: [point.x, point.y, point.z] },
              });
            } else if (nextPts.length >= 2) {
              const p1 = nextPts[0];
              const p2 = nextPts[1];
              const dist = p1.distanceTo(p2);
              const val = units === 'inch' ? dist / 25.4 : dist;
              const dx = units === 'inch' ? Math.abs(p2.x - p1.x) / 25.4 : Math.abs(p2.x - p1.x);
              const dy = units === 'inch' ? Math.abs(p2.y - p1.y) / 25.4 : Math.abs(p2.y - p1.y);
              const dz = units === 'inch' ? Math.abs(p2.z - p1.z) / 25.4 : Math.abs(p2.z - p1.z);
              setCurrentMeasurement({
                type: 'distance',
                value: val,
                unit: units,
                label: `Distance: ${val.toFixed(2)} ${units}`,
                details: {
                  deltaX: dx,
                  deltaY: dy,
                  deltaZ: dz,
                  point1: [p1.x, p1.y, p1.z],
                  point2: [p2.x, p2.y, p2.z],
                },
              });
              setMeasurementPoints([]);
            }
          } else if (measurementTool === 'diameter' || measurementTool === 'radius') {
            const dia = (part.parameters.diameter || 50);
            const val = measurementTool === 'radius' ? dia / 2 : dia;
            setCurrentMeasurement({
              type: measurementTool,
              value: val,
              unit: units,
              label: `${measurementTool === 'diameter' ? 'Diameter Ø' : 'Radius R'}: ${val.toFixed(2)} ${units}`,
            });
          }
          return;
        }

        // 2. Direct modeling geometry selection
        const faceNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        faceNormal.transformDirection(hit.object.matrixWorld);

        const isCurved = Math.abs(faceNormal.y) < 0.1 && (Math.abs(faceNormal.x) > 0.4 || Math.abs(faceNormal.z) > 0.4);
        const label = isCurved
          ? `Cylindrical Surface (Ø${(part.parameters.diameter || 50)}mm)`
          : `Planar Face (Normal [${faceNormal.x.toFixed(2)}, ${faceNormal.y.toFixed(2)}, ${faceNormal.z.toFixed(2)}])`;

        const geoInfo: SelectedGeometryInfo = {
          type: 'face',
          id: `face_${Date.now()}`,
          label,
          details: {
            normal: [faceNormal.x, faceNormal.y, faceNormal.z],
            point: [point.x, point.y, point.z],
          },
          screenPosition: {
            x: Math.min(rect.width - 240, Math.max(30, e.clientX - rect.left)),
            y: Math.min(rect.height - 180, Math.max(70, e.clientY - rect.top)),
          },
        };
        setSelectedGeometry(geoInfo);
        onSelectGeometry?.(geoInfo);
      } else {
        // Clicked outside model
        if (measurementTool === 'none') {
          setSelectedGeometry(null);
          onSelectGeometry?.(null);
        }
      }
    }
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

  // Toggle Datum Planes Visibility
  useEffect(() => {
    if (datumPlanesGroupRef.current) datumPlanesGroupRef.current.visible = showDatumPlanes;
  }, [showDatumPlanes]);

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

  const handleSendToImageStudio = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const snap = rendererRef.current.domElement.toDataURL('image/png');
      if (onOpenImageStudioWithSnapshot) {
        onOpenImageStudioWithSnapshot(snap);
      }
    } catch (err) {
      console.error('Failed to capture viewport for Image Studio:', err);
    }
  }, [onOpenImageStudioWithSnapshot]);

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-[#2A2F36] to-[#1E2228] select-none overflow-hidden touch-none">
      {/* Top Floating CAD Controls Toolbar (Desktop Only - on mobile, accessed via compact View sheet) */}
      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 hidden md:flex items-center flex-wrap gap-1.5 sm:gap-2 pointer-events-none max-w-[calc(100%-120px)]">
        {/* View Angle Presets */}
        <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 p-1 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] dark:border-[rgba(16,185,129,0.22)] shadow-md overflow-x-auto no-scrollbar shrink-0">
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-[#475569] dark:text-[#8CA89E] px-1.5 py-0.5 font-bold">
            VIEW
          </span>
          {(['iso', 'front', 'top', 'right'] as CameraView[]).map((v) => (
            <button
              key={v}
              id={`btn-view-${v}`}
              onClick={() => setCameraView(v)}
              className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-mono uppercase rounded font-bold transition-all shrink-0 cursor-pointer min-h-[30px] sm:min-h-[28px] flex items-center justify-center ${
                activeView === v
                  ? 'bg-[#0284C7] text-white shadow-xs dark:bg-[#00F5A0] dark:text-[#02140D]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
              }`}
            >
              <span className="hidden sm:inline">{v}</span>
              <span className="sm:hidden">{v === 'iso' ? 'ISO' : v[0].toUpperCase()}</span>
            </button>
          ))}
          <button
            id="btn-camera-reset"
            onClick={resetCamera}
            title="Reset Camera & Target"
            className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0284C7] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#00F5A0] rounded transition-colors ml-0.5 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CAD Display Mode & Visual Toggles */}
        <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 p-1 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] dark:border-[rgba(16,185,129,0.22)] shadow-md overflow-x-auto no-scrollbar shrink-0">
          <button
            id="btn-mode-shaded-edges"
            onClick={() => setDisplayMode('shaded_edges')}
            title="Shaded with Engineering Edges"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-all cursor-pointer ${
              displayMode === 'shaded_edges'
                ? 'bg-[#0284C7] text-white font-bold shadow-xs dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            id="btn-mode-wireframe"
            onClick={() => setDisplayMode('wireframe')}
            title="Technical Wireframe"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-all cursor-pointer ${
              displayMode === 'wireframe'
                ? 'bg-[#0284C7] text-white font-bold shadow-xs dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            id="btn-mode-xray"
            onClick={() => setDisplayMode('xray')}
            title="X-Ray Ghost (Internal Features)"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-all cursor-pointer ${
              displayMode === 'xray'
                ? 'bg-[#0284C7] text-white font-bold shadow-xs dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#CBD5E1] dark:bg-[rgba(16,185,129,0.25)] mx-0.5 sm:mx-1" />

          {/* Perspective / Orthographic Toggle */}
          <button
            id="btn-toggle-projection"
            onClick={toggleProjection}
            title={`Camera: ${projection === 'perspective' ? 'Perspective 3D' : 'Orthographic CAD'}`}
            className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-mono font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0284C7] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#00F5A0] rounded transition-colors min-h-[28px] flex items-center justify-center cursor-pointer"
          >
            <span className="hidden sm:inline">{projection === 'perspective' ? 'PERS' : 'ORTHO'}</span>
            <span className="sm:hidden">{projection === 'perspective' ? '3D' : '2D'}</span>
          </button>

          {/* Grid Toggle */}
          <button
            id="btn-toggle-grid"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Engineering Grid"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              showGrid
                ? 'text-white bg-[#0284C7] border border-[#0284C7] dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dimensions Overlay Toggle */}
          <button
            id="btn-toggle-dimensions"
            onClick={() => setShowDimensions(!showDimensions)}
            title="Toggle 3D Dimension Annotations"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              showDimensions
                ? 'text-white bg-[#0284C7] border border-[#0284C7] dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Interactive 3D Measurement Tool Ribbon Toggle */}
          <button
            id="btn-toggle-measurement-ribbon"
            onClick={() => {
              const nextState = !showMeasureRibbon;
              setShowMeasureRibbon(nextState);
              if (!nextState) {
                setMeasurementTool('none');
                setCurrentMeasurement(null);
                setMeasurementPoints([]);
              } else {
                setMeasurementTool('distance');
              }
            }}
            title="Interactive CAD Measurement Tools (Distance, Diameter, Angle)"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              showMeasureRibbon || measurementTool !== 'none'
                ? 'text-white bg-[#0284C7] border border-[#0284C7] shadow-xs dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0284C7] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#00F5A0]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Datum Reference Planes Toggle (XY, XZ, YZ) */}
          <button
            id="btn-toggle-datum-planes"
            onClick={() => setShowDatumPlanes(!showDatumPlanes)}
            title="Toggle Datum Reference Planes (Top XY, Front XZ, Right YZ)"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              showDatumPlanes
                ? 'text-white bg-[#0284C7] border border-[#0284C7] dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Section Cut Tool Toggle */}
          <button
            id="btn-toggle-section-cut"
            onClick={() => setEnableSectionCut(!enableSectionCut)}
            title="Cross-Section Cut Plane"
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              enableSectionCut
                ? 'text-white bg-[#0284C7] border border-[#0284C7] dark:bg-[#00F5A0] dark:text-[#02140D]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#CBD5E1] dark:bg-[rgba(16,185,129,0.25)] mx-0.5" />

          {/* Capture Viewport: High-Resolution Transparent PNG for Documentation */}
          <div className="relative flex items-center" ref={captureMenuRef}>
            <button
              id="btn-capture-viewport"
              onClick={() => handleCaptureViewport()}
              disabled={isCapturing}
              title="Capture Viewport (High-Resolution Transparent PNG for Documentation)"
              className={`flex items-center gap-1.5 px-2 py-1 min-h-[28px] rounded transition-all text-xs font-mono font-bold cursor-pointer ${
                isCapturing
                  ? 'bg-[#0284C7] text-white shadow-md animate-pulse dark:bg-[#00F5A0] dark:text-[#02140D]'
                  : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-xs dark:bg-[#102B21] dark:border dark:border-[rgba(16,185,129,0.25)] dark:text-[#00F5A0] dark:hover:bg-[#00F5A0] dark:hover:text-[#02140D]'
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
              className="p-1 min-w-[24px] min-h-[28px] ml-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0284C7] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.25)] dark:text-[#8CA89E] dark:hover:text-[#00F5A0] dark:hover:bg-[#153529] transition-colors cursor-pointer flex items-center justify-center"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  captureMenuOpen ? 'rotate-180 text-[#0284C7] dark:text-[#00F5A0]' : ''
                }`}
              />
            </button>

            {/* Capture Options Popover Menu */}
            {captureMenuOpen && (
              <div
                id="menu-capture-options"
                className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-[#081611]/98 border border-[#CBD5E1] dark:border-[rgba(16,185,129,0.3)] rounded-xl shadow-xl backdrop-blur-xl z-50 text-xs font-mono space-y-2.5 text-[#0F172A] dark:text-[#F0FDF4] animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0] dark:border-[rgba(16,185,129,0.18)]">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-[#8CA89E] uppercase tracking-wider">
                    Capture Settings
                  </span>
                  <span className="text-[9px] text-[#0284C7] bg-[#E0F2FE] dark:text-[#00F5A0] dark:bg-[#00F5A0]/10 px-1.5 py-0.5 rounded font-bold border border-[#BAE6FD] dark:border-[#00F5A0]/20">
                    Transparent PNG
                  </span>
                </div>

                {/* Resolution Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#64748B] dark:text-[#8CA89E] block">Export Resolution:</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setCaptureResolution('2k')}
                      className={`px-2 py-1 rounded text-left border flex items-center justify-between transition-all cursor-pointer ${
                        captureResolution === '2k'
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] dark:bg-[#00F5A0]/15 dark:border-[#00F5A0] dark:text-[#00F5A0] font-bold'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] dark:bg-[#0B1E17] dark:border-[rgba(16,185,129,0.15)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
                      }`}
                    >
                      <span>2.5K High-Res</span>
                      {captureResolution === '2k' && <Check className="w-3 h-3 text-[#0284C7] dark:text-[#00F5A0]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureResolution('4k')}
                      className={`px-2 py-1 rounded text-left border flex items-center justify-between transition-all cursor-pointer ${
                        captureResolution === '4k'
                          ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] dark:bg-[#00F5A0]/15 dark:border-[#00F5A0] dark:text-[#00F5A0] font-bold'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] dark:bg-[#0B1E17] dark:border-[rgba(16,185,129,0.15)] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4]'
                      }`}
                    >
                      <span>4K Ultra-HD</span>
                      {captureResolution === '4k' && <Check className="w-3 h-3 text-[#0284C7] dark:text-[#00F5A0]" />}
                    </button>
                  </div>
                </div>

                {/* Include Grid Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-[#64748B] dark:text-[#8CA89E] hover:text-[#0F172A] dark:hover:text-[#F0FDF4]">
                  <input
                    type="checkbox"
                    checked={captureIncludeGrid}
                    onChange={(e) => setCaptureIncludeGrid(e.target.checked)}
                    className="rounded accent-[#0284C7] dark:accent-[#00F5A0] cursor-pointer"
                  />
                  <span>Include floor grid in capture</span>
                </label>

                {/* Action button in menu */}
                <button
                  type="button"
                  onClick={() => handleCaptureViewport()}
                  className="w-full py-1.5 px-3 bg-[#0284C7] hover:bg-[#0369A1] text-white dark:bg-[#00F5A0] dark:hover:bg-[#34EEA9] dark:text-[#02140D] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture ({captureResolution === '4k' ? '4K UHD' : '2.5K High-Res'})</span>
                </button>

                {onOpenImageStudioWithSnapshot && (
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureMenuOpen(false);
                      handleSendToImageStudio();
                    }}
                    className="w-full py-1.5 px-3 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#059669] border border-[#A7F3D0] dark:bg-[#092218] dark:hover:bg-[#102F21] dark:text-[#00F5A0] dark:border-[#00F5A0]/40 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
                    title="Send active 3D view to AI Image Studio to edit with gemini-3.1-flash-image-preview"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#059669] dark:text-[#00F5A0]" />
                    <span>AI Edit in Image Studio</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#CBD5E1] dark:bg-[rgba(16,185,129,0.25)] mx-0.5" />

          <button
            id="btn-fullscreen"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Canvas"
            className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0284C7] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:text-[#00F5A0] dark:hover:bg-[#153529] rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* FEA Stress Simulation Active Banner */}
      {feaGroup && (
        <div className="absolute top-16 left-3 z-10 px-3 py-2 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] dark:border-[#00F5A0]/60 shadow-md flex items-center gap-3 text-xs font-mono text-[#0F172A] dark:text-[#F0FDF4]">
          <div className="flex items-center gap-1.5 text-[#0284C7] dark:text-[#00F5A0] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] dark:bg-[#00F5A0] animate-ping" />
            <span>FEA STRESS MESH DISPLAY</span>
          </div>
          <span className="text-[11px] text-[#64748B] dark:text-[#8CA89E]">Von Mises Colormap Overlay</span>
          {onClearFEA && (
            <button
              type="button"
              onClick={onClearFEA}
              className="px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] dark:bg-[#102B21] dark:hover:bg-[#16382B] text-[#0284C7] dark:text-[#00F5A0] border border-[#CBD5E1] dark:border-[#00F5A0]/40 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Exit FEA View
            </button>
          )}
        </div>
      )}

      {/* Assembly Multi-Part Kinematic Active Banner */}
      {assemblyGroup && !feaGroup && (
        <div className="absolute top-16 left-3 z-10 flex flex-col gap-2">
          <div className="px-3 py-2 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] dark:border-[#00F5A0]/60 shadow-md flex items-center gap-3 text-xs font-mono text-[#0F172A] dark:text-[#F0FDF4] flex-wrap">
            <div className="flex items-center gap-1.5 text-[#0284C7] dark:text-[#00F5A0] font-bold">
              <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#00F5A0]" />
              <span>ASSEMBLY VIEW ACTIVE</span>
            </div>
            <span className="text-[11px] text-[#64748B] dark:text-[#8CA89E] hidden md:inline">
              Kinematic Mates & Interference Solved
            </span>

            {/* Mating Indicator Spheres Toggle */}
            <button
              type="button"
              onClick={() => setShowMatingSpheresInViewer((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 border ${
                showMatingSpheresInViewer
                  ? 'bg-[#E0F2FE] text-[#0284C7] border-[#0284C7] dark:bg-[#102B21] dark:text-[#00F5A0] dark:border-[#00F5A0]/50'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] dark:bg-[#071510] dark:text-[#8CA89E] dark:border-[rgba(16,185,129,0.2)]'
              }`}
              title="Toggle color-coded mating indicator spheres in 3D scene"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  showMatingSpheresInViewer ? 'bg-[#0284C7] dark:bg-[#00F5A0] animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span>{showMatingSpheresInViewer ? 'Mating Spheres: ON' : 'Mating Spheres: OFF'}</span>
            </button>

            {/* Legend Popover Toggle */}
            <button
              type="button"
              onClick={() => setShowMatingLegendInViewer((prev) => !prev)}
              className="p-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:hover:bg-[#16382B] text-[#64748B] hover:text-[#0284C7] dark:text-[#8CA89E] dark:hover:text-[#00F5A0] border border-[#E2E8F0] dark:border-[rgba(16,185,129,0.2)] cursor-pointer"
              title="Mating Points Color Legend"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {onClearAssembly && (
              <button
                type="button"
                onClick={onClearAssembly}
                className="px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] dark:bg-[#102B21] dark:hover:bg-[#16382B] text-[#0284C7] dark:text-[#00F5A0] border border-[#CBD5E1] dark:border-[#00F5A0]/40 text-[10px] font-bold cursor-pointer transition-colors"
              >
                Exit Assembly Mode
              </button>
            )}
          </div>

          {/* Color-Coded Mating Spheres Legend Popover */}
          {showMatingLegendInViewer && (
            <div className="p-3 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-xl border border-[#CBD5E1] dark:border-[#00F5A0]/40 shadow-xl text-[11px] font-mono space-y-1.5 max-w-xs text-[#0F172A] dark:text-[#F0FDF4] animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[#0284C7] dark:text-[#00F5A0] font-bold text-[10px] uppercase tracking-wider">
                <span>Smart Mating Points Legend</span>
                <button
                  type="button"
                  onClick={() => setShowMatingLegendInViewer(false)}
                  className="text-[#64748B] hover:text-[#0F172A] dark:text-[#8CA89E] dark:hover:text-[#F0FDF4] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-[#8CA89E]">
                Color-coded spheres in 3D mark aligned kinematic contact interfaces:
              </div>
              <div className="space-y-1 text-[10px] pt-1.5 border-t border-[#E2E8F0] dark:border-[rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-[#00F5A0]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                  <span>Concentric Axis (Shaft ↔ Bearing Bore)</span>
                </div>
                <div className="flex items-center gap-2 text-[#F59E0B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
                  <span>Coincident Face (Shoulder ↔ Ring)</span>
                </div>
                <div className="flex items-center gap-2 text-[#8B5CF6]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                  <span>Distance Offset (Axial Spacing)</span>
                </div>
                <div className="flex items-center gap-2 text-[#F43F5E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-[0_0_6px_#F43F5E]" />
                  <span>Revolute Pin (Hinge / Wrist Pin)</span>
                </div>
                <div className="flex items-center gap-2 text-[#0284C7] dark:text-[#38BDF8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] shadow-[0_0_6px_#0284C7]" />
                  <span>Parallel Plane (Flange Orientation)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Section Cut Toolbar (when active) */}
      {enableSectionCut && (
        <div className="absolute top-16 left-3 z-10 p-2.5 bg-white/95 dark:bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[#CBD5E1] dark:border-[#00F5A0]/40 shadow-xl flex items-center gap-3 text-xs text-[#0F172A] dark:text-[#F0FDF4]">
          <div className="flex items-center gap-1.5 text-[#0284C7] dark:text-[#00F5A0] font-bold font-mono">
            <Scissors className="w-3.5 h-3.5" />
            <span>SECTION SLICE:</span>
          </div>
          <div className="flex gap-1">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => setSectionAxis(axis)}
                className={`px-2 py-0.5 font-mono uppercase font-bold rounded cursor-pointer ${
                  sectionAxis === axis
                    ? 'bg-[#0284C7] text-white dark:bg-[#00F5A0] dark:text-[#02140D]'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] dark:bg-[#102B21] dark:border-[rgba(16,185,129,0.18)] dark:text-[#8CA89E] dark:hover:bg-[#153529]'
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
            className="w-28 accent-[#0284C7] dark:accent-[#00F5A0] cursor-pointer"
          />
          <span className="font-mono text-[#0F172A] dark:text-[#F0FDF4] font-bold w-12 text-right">{sectionOffset} mm</span>
        </div>
      )}

      {/* 3D WebGL Canvas Viewport with Touch & Mouse Orbit/Pan/Zoom */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Interactive 3D Orientation ViewCube */}
      <ViewCube
        onSelectView={setCameraView}
        currentView={activeView}
        onRotateCamera={handleRotateCamera}
      />

      {/* Contextual Direct Modeling HUD (Extrude, Pocket Cut, Fillet, Chamfer, Hole) */}
      <DirectModelingHUD
        selection={selectedGeometry}
        onClearSelection={() => {
          setSelectedGeometry(null);
          onSelectGeometry?.(null);
        }}
        onAction={(actionId) => {
          if (selectedGeometry) {
            onDirectAction?.(actionId, selectedGeometry);
          }
        }}
        onOpenSketch={onOpenSketch}
      />

      {/* Interactive Engineering Measurement Ribbon & HUD */}
      {(showMeasureRibbon || measurementTool !== 'none') && (
        <MeasurementOverlay
          activeTool={measurementTool}
          onSelectTool={(tool) => {
            setMeasurementTool(tool);
            setMeasurementPoints([]);
            if (tool === 'none') {
              setCurrentMeasurement(null);
              setShowMeasureRibbon(false);
            }
          }}
          currentMeasurement={currentMeasurement}
          onClearMeasurement={() => {
            setCurrentMeasurement(null);
            setMeasurementPoints([]);
          }}
          units={units}
        />
      )}

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

      {/* 3D Interactive Bounding Dimensions HUD (Desktop only - accessible via mobile view menu) */}
      {showDimensions && modelMetrics && (
        <div className="absolute top-auto bottom-3 left-3 pointer-events-none hidden md:flex flex-col gap-1 p-2.5 bg-[#0B1E17]/95 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.18)] text-[11px] font-mono text-[#8CA89E] shadow-xl z-10">
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

      {/* Mouse & Touch Navigation Legend HUD (Lower Right - Desktop only) */}
      <div className="absolute bottom-2.5 right-2.5 hidden md:flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#0B1E17]/90 backdrop-blur-md rounded-lg border border-[rgba(16,185,129,0.18)] text-[9px] sm:text-[10px] font-mono text-[#8CA89E] shadow-sm select-none pointer-events-none">
        {/* Mobile touch gesture badge */}
        <div className="sm:hidden flex items-center gap-1.5 text-[#00F5A0] font-bold">
          <span>👆 Orbit</span>
          <span>•</span>
          <span>✌️ Zoom / Pan</span>
        </div>

        {/* Desktop mouse guide */}
        <div className="hidden sm:block">
          <span className="text-[#F0FDF4] font-bold">LMB:</span> Rotate
        </div>
        <div className="hidden sm:block">
          <span className="text-[#F0FDF4] font-bold">RMB / Shift:</span> Pan
        </div>
        <div className="hidden sm:block">
          <span className="text-[#F0FDF4] font-bold">Wheel:</span> Zoom
        </div>
        {onOpenShortcuts && (
          <button
            id="btn-hud-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            className="hidden sm:flex pointer-events-auto items-center gap-1 pl-2 border-l border-[rgba(16,185,129,0.25)] text-[#00F5A0] hover:text-[#34EEA9] cursor-pointer font-bold transition-colors"
            title="Open Keyboard Shortcuts Cheat Sheet (Press '?')"
          >
            <kbd className="px-1 py-0.5 rounded bg-[#102B21] border border-[rgba(16,185,129,0.35)] text-[#00F5A0] text-[9px] font-bold font-mono leading-none">
              ?
            </kbd>
            <span>Hotkeys</span>
          </button>
        )}
      </div>
    </div>
  );
});
