import * as THREE from 'three';

export interface SketchPoint {
  x: number;
  y: number;
}

export type Sketch2DType =
  | 'line'
  | 'polyline'
  | 'rectangle'
  | 'circle'
  | 'arc'
  | 'polygon'
  | 'slot'
  | 'text';

export interface SketchEntity2D {
  id: string;
  type: Sketch2DType;
  // Line / Arc / Polyline coordinates
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // Circle / Arc center
  cx?: number;
  cy?: number;
  radius?: number;
  startAngle?: number; // radians or degrees
  endAngle?: number;
  // Rectangle / Slot
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Polyline / Polygon points
  points?: SketchPoint[];
  sides?: number;
  // Text
  text?: string;
  fontSize?: number;
  // Dimensions & Constraints
  dimension?: number;
  constraints?: string[];
  color?: string;
}

export interface SectionProperties {
  area_mm2: number;
  perimeter_mm: number;
  centroid: { cx: number; cy: number };
  Ix_mm4: number;
  Iy_mm4: number;
  Ixy_mm4: number;
  Zx_mm3: number;
  Zy_mm3: number;
  rx_mm: number;
  ry_mm: number;
  isValidProfile: boolean;
  isClosed: boolean;
  hasHoles: boolean;
  warning?: string;
}

export interface SketchValidationResult {
  isClosed: boolean;
  isValid: boolean;
  hasHoles: boolean;
  outerLoops: SketchPoint[][];
  innerLoops: SketchPoint[][];
  warnings: string[];
}

/**
 * Standard vector font definitions for letters A-Z and digits 0-9
 * Defined as normalized 100x100 bounding box contours with inner hole loops where applicable.
 */
export const VECTOR_GLYPHS: Record<string, { outer: SketchPoint[]; holes?: SketchPoint[][] }> = {
  A: {
    outer: [
      { x: 0, y: 0 },
      { x: 35, y: 100 },
      { x: 65, y: 100 },
      { x: 100, y: 0 },
      { x: 78, y: 0 },
      { x: 67, y: 32 },
      { x: 33, y: 32 },
      { x: 22, y: 0 },
      { x: 0, y: 0 },
    ],
    holes: [
      [
        { x: 40, y: 50 },
        { x: 50, y: 80 },
        { x: 60, y: 50 },
        { x: 40, y: 50 },
      ],
    ],
  },
  B: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 65, y: 100 },
      { x: 85, y: 85 },
      { x: 85, y: 60 },
      { x: 65, y: 52 },
      { x: 90, y: 45 },
      { x: 90, y: 15 },
      { x: 75, y: 0 },
      { x: 0, y: 0 },
    ],
    holes: [
      [
        { x: 20, y: 58 },
        { x: 20, y: 82 },
        { x: 60, y: 82 },
        { x: 65, y: 70 },
        { x: 60, y: 58 },
        { x: 20, y: 58 },
      ],
      [
        { x: 20, y: 18 },
        { x: 20, y: 44 },
        { x: 65, y: 44 },
        { x: 70, y: 31 },
        { x: 65, y: 18 },
        { x: 20, y: 18 },
      ],
    ],
  },
  C: {
    outer: [
      { x: 85, y: 20 },
      { x: 65, y: 0 },
      { x: 25, y: 0 },
      { x: 0, y: 25 },
      { x: 0, y: 75 },
      { x: 25, y: 100 },
      { x: 65, y: 100 },
      { x: 85, y: 80 },
      { x: 65, y: 80 },
      { x: 50, y: 82 },
      { x: 22, y: 70 },
      { x: 22, y: 30 },
      { x: 50, y: 18 },
      { x: 65, y: 20 },
      { x: 85, y: 20 },
    ],
  },
  D: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 55, y: 100 },
      { x: 90, y: 75 },
      { x: 90, y: 25 },
      { x: 55, y: 0 },
      { x: 0, y: 0 },
    ],
    holes: [
      [
        { x: 22, y: 22 },
        { x: 22, y: 78 },
        { x: 50, y: 78 },
        { x: 68, y: 60 },
        { x: 68, y: 40 },
        { x: 50, y: 22 },
        { x: 22, y: 22 },
      ],
    ],
  },
  E: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 80, y: 100 },
      { x: 80, y: 80 },
      { x: 22, y: 80 },
      { x: 22, y: 60 },
      { x: 70, y: 60 },
      { x: 70, y: 40 },
      { x: 22, y: 40 },
      { x: 22, y: 20 },
      { x: 80, y: 20 },
      { x: 80, y: 0 },
      { x: 0, y: 0 },
    ],
  },
  F: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 80, y: 100 },
      { x: 80, y: 80 },
      { x: 22, y: 80 },
      { x: 22, y: 60 },
      { x: 65, y: 60 },
      { x: 65, y: 40 },
      { x: 22, y: 40 },
      { x: 22, y: 0 },
      { x: 0, y: 0 },
    ],
  },
  H: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 22, y: 100 },
      { x: 22, y: 60 },
      { x: 78, y: 60 },
      { x: 78, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 78, y: 0 },
      { x: 78, y: 40 },
      { x: 22, y: 40 },
      { x: 22, y: 0 },
      { x: 0, y: 0 },
    ],
  },
  I: {
    outer: [
      { x: 15, y: 0 },
      { x: 15, y: 20 },
      { x: 38, y: 20 },
      { x: 38, y: 80 },
      { x: 15, y: 80 },
      { x: 15, y: 100 },
      { x: 85, y: 100 },
      { x: 85, y: 80 },
      { x: 62, y: 80 },
      { x: 62, y: 20 },
      { x: 85, y: 20 },
      { x: 85, y: 0 },
      { x: 15, y: 0 },
    ],
  },
  L: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 25, y: 100 },
      { x: 25, y: 25 },
      { x: 85, y: 25 },
      { x: 85, y: 0 },
      { x: 0, y: 0 },
    ],
  },
  O: {
    outer: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 20 },
      { x: 100, y: 80 },
      { x: 80, y: 100 },
      { x: 20, y: 100 },
      { x: 0, y: 80 },
      { x: 0, y: 20 },
      { x: 20, y: 0 },
    ],
    holes: [
      [
        { x: 30, y: 22 },
        { x: 70, y: 22 },
        { x: 78, y: 32 },
        { x: 78, y: 68 },
        { x: 70, y: 78 },
        { x: 30, y: 78 },
        { x: 22, y: 68 },
        { x: 22, y: 32 },
        { x: 30, y: 22 },
      ],
    ],
  },
  T: {
    outer: [
      { x: 38, y: 0 },
      { x: 38, y: 78 },
      { x: 0, y: 78 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 78 },
      { x: 62, y: 78 },
      { x: 62, y: 0 },
      { x: 38, y: 0 },
    ],
  },
  U: {
    outer: [
      { x: 0, y: 100 },
      { x: 25, y: 100 },
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 75, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 15 },
      { x: 85, y: 0 },
      { x: 15, y: 0 },
      { x: 0, y: 15 },
      { x: 0, y: 100 },
    ],
  },
  // Default rectangular block fallback for other letters
  DEFAULT: {
    outer: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 75, y: 100 },
      { x: 75, y: 0 },
      { x: 0, y: 0 },
    ],
  },
};

/**
 * Validate a 2D sketch profile and identify closed loops and holes
 */
export function validateSketchProfile(entities: SketchEntity2D[]): SketchValidationResult {
  const warnings: string[] = [];
  const outerLoops: SketchPoint[][] = [];
  const innerLoops: SketchPoint[][] = [];

  if (!entities || entities.length === 0) {
    return {
      isClosed: false,
      isValid: false,
      hasHoles: false,
      outerLoops: [],
      innerLoops: [],
      warnings: ['Sketch is empty. Draw at least one closed geometry.'],
    };
  }

  // 1. Separate circles and rectangles which are inherently closed
  entities.forEach((ent) => {
    if (ent.type === 'circle' && ent.cx !== undefined && ent.cy !== undefined && ent.radius) {
      const pts: SketchPoint[] = [];
      const segments = 48;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push({
          x: ent.cx + Math.cos(theta) * ent.radius,
          y: ent.cy + Math.sin(theta) * ent.radius,
        });
      }
      outerLoops.push(pts);
    } else if (ent.type === 'rectangle' && ent.width && ent.height) {
      const x0 = ent.x ?? -ent.width / 2;
      const y0 = ent.y ?? -ent.height / 2;
      outerLoops.push([
        { x: x0, y: y0 },
        { x: x0 + ent.width, y: y0 },
        { x: x0 + ent.width, y: y0 + ent.height },
        { x: x0, y: y0 + ent.height },
        { x: x0, y: y0 },
      ]);
    } else if (ent.type === 'polygon' && ent.points && ent.points.length >= 3) {
      outerLoops.push([...ent.points, ent.points[0]]);
    } else if (ent.type === 'text') {
      const char = (ent.text || 'A').toUpperCase().charAt(0);
      const glyph = VECTOR_GLYPHS[char] || VECTOR_GLYPHS.DEFAULT;
      const h = ent.height || ent.fontSize || 50;
      const scale = h / 100;
      const cx = ent.x || 0;
      const cy = ent.y || 0;

      outerLoops.push(glyph.outer.map((p) => ({ x: cx + (p.x - 50) * scale, y: cy + (p.y - 50) * scale })));
      if (glyph.holes) {
        glyph.holes.forEach((hLoop) => {
          innerLoops.push(hLoop.map((p) => ({ x: cx + (p.x - 50) * scale, y: cy + (p.y - 50) * scale })));
        });
      }
    }
  });

  // 2. Connect line segments into loops
  const lines = entities.filter((e) => e.type === 'line' && e.startX !== undefined && e.endX !== undefined);
  if (lines.length > 0) {
    const chain = buildChainedPolyline(lines);
    if (chain.isClosed) {
      outerLoops.push(chain.points);
    } else {
      warnings.push(`Open line chain detected (gap = ${chain.gapMm.toFixed(2)} mm between endpoints). Close outline to form solid.`);
    }
  }

  // 3. Classify loops: largest loop is outer, smaller loops inside outer loop become inner holes
  if (outerLoops.length > 1) {
    // Sort loops by approximate bounding box area
    outerLoops.sort((a, b) => computePolygonArea(b) - computePolygonArea(a));
    const mainLoop = outerLoops[0];
    const candidateHoles = outerLoops.slice(1);

    const actualHoles: SketchPoint[][] = [];
    candidateHoles.forEach((cLoop) => {
      // Check if centroid of candidate is inside mainLoop
      const cCenter = computeCentroid(cLoop);
      if (isPointInsidePolygon(cCenter, mainLoop)) {
        actualHoles.push(cLoop);
      }
    });

    return {
      isClosed: outerLoops.length > 0 && warnings.length === 0,
      isValid: warnings.length === 0,
      hasHoles: actualHoles.length > 0 || innerLoops.length > 0,
      outerLoops: [mainLoop],
      innerLoops: [...actualHoles, ...innerLoops],
      warnings,
    };
  }

  const isClosed = (outerLoops.length > 0 || innerLoops.length > 0) && warnings.length === 0;

  return {
    isClosed,
    isValid: isClosed,
    hasHoles: innerLoops.length > 0,
    outerLoops,
    innerLoops,
    warnings,
  };
}

/**
 * Connect line segments into a continuous chain
 */
function buildChainedPolyline(lines: SketchEntity2D[]): { points: SketchPoint[]; isClosed: boolean; gapMm: number } {
  if (lines.length === 0) return { points: [], isClosed: false, gapMm: 0 };

  const unused = [...lines];
  const first = unused.shift()!;
  const pts: SketchPoint[] = [
    { x: first.startX!, y: first.startY! },
    { x: first.endX!, y: first.endY! },
  ];

  const TOL = 1.0; // 1mm snap tolerance

  while (unused.length > 0) {
    const lastPt = pts[pts.length - 1];
    let foundIdx = -1;
    let reversed = false;

    for (let i = 0; i < unused.length; i++) {
      const line = unused[i];
      const dStart = Math.hypot(line.startX! - lastPt.x, line.startY! - lastPt.y);
      const dEnd = Math.hypot(line.endX! - lastPt.x, line.endY! - lastPt.y);

      if (dStart <= TOL) {
        foundIdx = i;
        reversed = false;
        break;
      } else if (dEnd <= TOL) {
        foundIdx = i;
        reversed = true;
        break;
      }
    }

    if (foundIdx >= 0) {
      const nextLine = unused.splice(foundIdx, 1)[0];
      if (reversed) {
        pts.push({ x: nextLine.startX!, y: nextLine.startY! });
      } else {
        pts.push({ x: nextLine.endX!, y: nextLine.endY! });
      }
    } else {
      break;
    }
  }

  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  const gap = Math.hypot(firstPt.x - lastPt.x, firstPt.y - lastPt.y);

  if (gap <= TOL && pts.length >= 3) {
    pts[pts.length - 1] = { ...firstPt }; // close strictly
    return { points: pts, isClosed: true, gapMm: 0 };
  }

  return { points: pts, isClosed: false, gapMm: gap };
}

/**
 * Green's theorem polygon area computation
 */
export function computePolygonArea(pts: SketchPoint[]): number {
  if (!pts || pts.length < 3) return 0;
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Centroid calculation for arbitrary polygon
 */
export function computeCentroid(pts: SketchPoint[]): SketchPoint {
  if (!pts || pts.length < 3) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  let signedArea = 0;
  const n = pts.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const factor = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    signedArea += factor;
    cx += (pts[i].x + pts[j].x) * factor;
    cy += (pts[i].y + pts[j].y) * factor;
  }

  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-6) {
    return pts[0] || { x: 0, y: 0 };
  }

  cx = cx / (6 * signedArea);
  cy = cy / (6 * signedArea);
  return { x: cx, y: cy };
}

/**
 * Point in polygon test (ray casting algorithm)
 */
export function isPointInsidePolygon(point: SketchPoint, polygon: SketchPoint[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * RULE 6: Compute verified 2D Section Properties on any sketch profile
 * Returns Area (mm²), Centroid, Ix (mm⁴), Iy (mm⁴), Section Modulus Zx, Zy
 */
export function computeSectionProperties(entities: SketchEntity2D[]): SectionProperties {
  const validation = validateSketchProfile(entities);

  if (!validation.isClosed || validation.outerLoops.length === 0) {
    return {
      area_mm2: 0,
      perimeter_mm: 0,
      centroid: { cx: 0, cy: 0 },
      Ix_mm4: 0,
      Iy_mm4: 0,
      Ixy_mm4: 0,
      Zx_mm3: 0,
      Zy_mm3: 0,
      rx_mm: 0,
      ry_mm: 0,
      isValidProfile: false,
      isClosed: false,
      hasHoles: false,
      warning: validation.warnings[0] || 'Open profile',
    };
  }

  const outer = validation.outerLoops[0];
  let totalArea = computePolygonArea(outer);
  let totalPerimeter = 0;

  for (let i = 0; i < outer.length - 1; i++) {
    totalPerimeter += Math.hypot(outer[i + 1].x - outer[i].x, outer[i + 1].y - outer[i].y);
  }

  // Centroid computation using outer boundary
  const centroid = computeCentroid(outer);
  const cx = centroid.x;
  const cy = centroid.y;

  // Moments of inertia about centroid using polygon integrals:
  // Ix = sum((y_i^2 + y_i*y_j + y_j^2) * (x_i*y_j - x_j*y_i)) / 12
  // Iy = sum((x_i^2 + x_i*x_j + x_j^2) * (x_i*y_j - x_j*y_i)) / 12
  let Ix = 0;
  let Iy = 0;
  let Ixy = 0;

  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // Shift coords relative to centroid
    const xi = outer[i].x - cx;
    const yi = outer[i].y - cy;
    const xj = outer[j].x - cx;
    const yj = outer[j].y - cy;

    const cross = xi * yj - xj * yi;
    Ix += (yi * yi + yi * yj + yj * yj) * cross;
    Iy += (xi * xi + xi * xj + xj * xj) * cross;
    Ixy += (xi * yj + 2 * xi * yi + 2 * xj * yj + xj * yi) * cross;
  }

  Ix = Math.abs(Ix / 12);
  Iy = Math.abs(Iy / 12);
  Ixy = Math.abs(Ixy / 24);

  // Subtract holes contribution
  if (validation.innerLoops && validation.innerLoops.length > 0) {
    validation.innerLoops.forEach((hLoop) => {
      const hArea = computePolygonArea(hLoop);
      totalArea -= hArea;
      const hCentroid = computeCentroid(hLoop);

      // Hole moment of inertia
      let hIx = 0;
      let hIy = 0;
      const hn = hLoop.length;
      for (let i = 0; i < hn; i++) {
        const j = (i + 1) % hn;
        const xi = hLoop[i].x - cx;
        const yi = hLoop[i].y - cy;
        const xj = hLoop[j].x - cx;
        const yj = hLoop[j].y - cy;
        const cross = xi * yj - xj * yi;
        hIx += (yi * yi + yi * yj + yj * yj) * cross;
        hIy += (xi * xi + xi * xj + xj * xj) * cross;
      }
      hIx = Math.abs(hIx / 12);
      hIy = Math.abs(hIy / 12);

      // Parallel axis theorem: I_sub = I_hole + A_hole * d^2
      const dy = hCentroid.y - cy;
      const dx = hCentroid.x - cx;
      Ix -= (hIx + hArea * dy * dy);
      Iy -= (hIy + hArea * dx * dx);
    });
  }

  // Extreme fiber distances for Section Modulus
  let maxY = 0;
  let maxX = 0;
  outer.forEach((p) => {
    maxY = Math.max(maxY, Math.abs(p.y - cy));
    maxX = Math.max(maxX, Math.abs(p.x - cx));
  });

  const Zx = maxY > 0 ? Ix / maxY : 0;
  const Zy = maxX > 0 ? Iy / maxX : 0;

  const rx = totalArea > 0 ? Math.sqrt(Ix / totalArea) : 0;
  const ry = totalArea > 0 ? Math.sqrt(Iy / totalArea) : 0;

  return {
    area_mm2: Number(totalArea.toFixed(2)),
    perimeter_mm: Number(totalPerimeter.toFixed(2)),
    centroid: { cx: Number(cx.toFixed(2)), cy: Number(cy.toFixed(2)) },
    Ix_mm4: Number(Ix.toFixed(1)),
    Iy_mm4: Number(Iy.toFixed(1)),
    Ixy_mm4: Number(Ixy.toFixed(1)),
    Zx_mm3: Number(Zx.toFixed(1)),
    Zy_mm3: Number(Zy.toFixed(1)),
    rx_mm: Number(rx.toFixed(2)),
    ry_mm: Number(ry.toFixed(2)),
    isValidProfile: true,
    isClosed: true,
    hasHoles: validation.hasHoles,
  };
}

/**
 * Convert 2D Sketch to Three.js Shape (with automatic holes)
 */
export function createThreeShapeFromSketch(entities: SketchEntity2D[]): THREE.Shape | null {
  const validation = validateSketchProfile(entities);
  if (!validation.isClosed || validation.outerLoops.length === 0) return null;

  const outerPts = validation.outerLoops[0];
  const shape = new THREE.Shape();
  shape.moveTo(outerPts[0].x, outerPts[0].y);
  for (let i = 1; i < outerPts.length; i++) {
    shape.lineTo(outerPts[i].x, outerPts[i].y);
  }
  shape.closePath();

  // Add inner loops as holes
  if (validation.innerLoops && validation.innerLoops.length > 0) {
    validation.innerLoops.forEach((hPts) => {
      const holePath = new THREE.Path();
      holePath.moveTo(hPts[0].x, hPts[0].y);
      for (let i = 1; i < hPts.length; i++) {
        holePath.lineTo(hPts[i].x, hPts[i].y);
      }
      holePath.closePath();
      shape.holes.push(holePath);
    });
  }

  return shape;
}

/**
 * DXF Exporter for 2D Sketches (AutoCAD R12 compatible ASCII DXF format)
 */
export function exportSketchToDXF(entities: SketchEntity2D[], sketchName: string = 'CADVANTA_SKETCH'): string {
  const lines: string[] = [];

  // DXF Header
  lines.push('0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'TABLES', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  entities.forEach((e) => {
    if (e.type === 'line' && e.startX !== undefined && e.endX !== undefined) {
      lines.push('0', 'LINE', '8', sketchName);
      lines.push('10', String(e.startX), '20', String(e.startY), '30', '0.0');
      lines.push('11', String(e.endX), '21', String(e.endY), '31', '0.0');
    } else if (e.type === 'circle' && e.cx !== undefined && e.cy !== undefined && e.radius) {
      lines.push('0', 'CIRCLE', '8', sketchName);
      lines.push('10', String(e.cx), '20', String(e.cy), '30', '0.0');
      lines.push('40', String(e.radius));
    } else if (e.type === 'arc' && e.cx !== undefined && e.cy !== undefined && e.radius) {
      lines.push('0', 'ARC', '8', sketchName);
      lines.push('10', String(e.cx), '20', String(e.cy), '30', '0.0');
      lines.push('40', String(e.radius));
      lines.push('50', String(((e.startAngle || 0) * 180) / Math.PI));
      lines.push('51', String(((e.endAngle || Math.PI) * 180) / Math.PI));
    } else if (e.type === 'rectangle' && e.width && e.height) {
      const x0 = e.x ?? -e.width / 2;
      const y0 = e.y ?? -e.height / 2;
      const pts = [
        { x: x0, y: y0 },
        { x: x0 + e.width, y: y0 },
        { x: x0 + e.width, y: y0 + e.height },
        { x: x0, y: y0 + e.height },
      ];
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        lines.push('0', 'LINE', '8', sketchName);
        lines.push('10', String(pts[i].x), '20', String(pts[i].y), '30', '0.0');
        lines.push('11', String(pts[next].x), '21', String(pts[next].y), '31', '0.0');
      }
    }
  });

  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

/**
 * STL Exporter for 3D Mesh (ASCII STL format)
 */
export function exportMeshToSTL(object: THREE.Object3D, partName: string = 'CADVANTA_MODEL'): string {
  const stlLines: string[] = [`solid ${partName.replace(/\s+/g, '_')}`];

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);

      const pos = geo.attributes.position;
      const index = geo.index;

      const getTriangle = (a: number, b: number, c: number) => {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, a);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, b);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, c);

        const cb = new THREE.Vector3().subVectors(vC, vB);
        const ab = new THREE.Vector3().subVectors(vA, vB);
        const normal = cb.cross(ab).normalize();

        stlLines.push(`  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}`);
        stlLines.push('    outer loop');
        stlLines.push(`      vertex ${vA.x.toFixed(4)} ${vA.y.toFixed(4)} ${vA.z.toFixed(4)}`);
        stlLines.push(`      vertex ${vB.x.toFixed(4)} ${vB.y.toFixed(4)} ${vB.z.toFixed(4)}`);
        stlLines.push(`      vertex ${vC.x.toFixed(4)} ${vC.y.toFixed(4)} ${vC.z.toFixed(4)}`);
        stlLines.push('    endloop');
        stlLines.push('  endfacet');
      };

      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          getTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          getTriangle(i, i + 1, i + 2);
        }
      }
    }
  });

  stlLines.push(`endsolid ${partName.replace(/\s+/g, '_')}`);
  return stlLines.join('\n');
}
