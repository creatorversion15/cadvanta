import * as THREE from 'three';
import { CADPart, FeatureHistoryItem } from '../types/cad';
import { createCADMaterial } from '../cad/geometryGenerators';
import { getMaterialById } from '../materials/materialsDatabase';

export interface SheetMetalCutout {
  id: string;
  type: 'hole' | 'slot';
  x: number;
  y: number;
  diameter?: number;
  width?: number;
  height?: number;
}

export interface SheetMetalLouver {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  pitch: number;
  depth: number;
}

export interface EdgeFlangeDef {
  edge: 'left' | 'right' | 'top' | 'bottom';
  length: number;
  angle: number; // in degrees
  position?: number;
}

export interface SheetMetalParameters {
  thickness: number; // T in mm (e.g. 2.0 mm)
  bendRadius: number; // R in mm (e.g. 2.0 or 3.0 mm)
  kFactor: number; // Neutral axis factor K (0.25 to 0.50, DIN 6935 default 0.44)
  baseLength: number; // L in mm (e.g. 140 mm)
  baseWidth: number; // W in mm (e.g. 90 mm)
  flangeLeftLength: number; // Left flange length in mm
  flangeLeftAngle: number; // Left bend angle in deg (e.g. 90°)
  flangeRightLength: number; // Right flange length in mm
  flangeRightAngle: number; // Right bend angle in deg (e.g. 90°)
  flangeTopLength?: number;
  flangeTopAngle?: number;
  flangeBottomLength?: number;
  flangeBottomAngle?: number;
  reliefType: 'rectangular' | 'tear' | 'round';
  reliefWidth: number; // Relief notch width in mm
  reliefDepth: number; // Relief notch depth in mm
  isFlattened: boolean; // Flat pattern unfolded state
  cutouts?: SheetMetalCutout[];
  louvers?: SheetMetalLouver[];
}

export interface BendCalculationResult {
  bendAllowanceBA: number; // BA in mm
  bendDeductionBD: number; // BD in mm
  setbackSB: number; // Setback OSSB in mm
  developedFlatLength: number; // Total unfolded flat blank length in mm
  developedFlatWidth: number; // Total unfolded flat blank width in mm
  recommendedMinRadius: number; // Minimum recommended bend radius to avoid cracking
  crackRisk: 'Low' | 'Moderate' | 'High';
}

/**
 * FORMULA 1: Bend Allowance (BA)
 * BA = angle(rad) * (R + K * T)
 */
export function calculateBendAllowance(
  angleDeg: number,
  bendRadius: number,
  thickness: number,
  kFactor: number = 0.44
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  return angleRad * (bendRadius + kFactor * thickness);
}

/**
 * FORMULA 2: Outside Setback (OSSB)
 * OSSB = tan(angle(rad) / 2) * (R + T)
 */
export function calculateOutsideSetback(
  angleDeg: number,
  bendRadius: number,
  thickness: number
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  return Math.tan(angleRad / 2) * (bendRadius + thickness);
}

/**
 * FORMULA 3: Flat length of a bent part
 * Flat length = sum of flat leg lengths + sum of BA
 * where flat leg length = outside leg length - OSSB (for outside dimensions)
 */
export function calculateBentFlatLength(
  outsideLegs: number[],
  bendAnglesDeg: number[],
  bendRadius: number,
  thickness: number,
  kFactor: number = 0.44
): {
  flatLength: number;
  flatLegLengths: number[];
  bendAllowances: number[];
  outsideSetbacks: number[];
} {
  const numBends = outsideLegs.length - 1;
  const outsideSetbacks: number[] = [];
  const bendAllowances: number[] = [];

  for (let i = 0; i < numBends; i++) {
    const angle = bendAnglesDeg[i] !== undefined ? bendAnglesDeg[i] : 90;
    const ossb = calculateOutsideSetback(angle, bendRadius, thickness);
    const ba = calculateBendAllowance(angle, bendRadius, thickness, kFactor);
    outsideSetbacks.push(ossb);
    bendAllowances.push(ba);
  }

  const flatLegLengths: number[] = [];
  for (let i = 0; i < outsideLegs.length; i++) {
    let legFlat = outsideLegs[i];
    if (i > 0) {
      legFlat -= outsideSetbacks[i - 1];
    }
    if (i < numBends) {
      legFlat -= outsideSetbacks[i];
    }
    flatLegLengths.push(Math.max(0, legFlat));
  }

  const sumFlatLegs = flatLegLengths.reduce((a, b) => a + b, 0);
  const sumBA = bendAllowances.reduce((a, b) => a + b, 0);
  const flatLength = sumFlatLegs + sumBA;

  return {
    flatLength: Number(flatLength.toFixed(3)),
    flatLegLengths: flatLegLengths.map((l) => Number(l.toFixed(3))),
    bendAllowances: bendAllowances.map((b) => Number(b.toFixed(3))),
    outsideSetbacks: outsideSetbacks.map((s) => Number(s.toFixed(3))),
  };
}

/**
 * DIN 6935 Sheet Metal Calculation Engine
 */
export function calculateSheetMetalBends(params: SheetMetalParameters): BendCalculationResult {
  const {
    thickness: T,
    bendRadius: R,
    kFactor: K = 0.44,
    baseLength: L,
    baseWidth: W,
    flangeLeftLength: FL = 0,
    flangeLeftAngle: angleL = 90,
    flangeRightLength: FR = 0,
    flangeRightAngle: angleR = 90,
    flangeTopLength: FT = 0,
    flangeTopAngle: angleT = 90,
    flangeBottomLength: FB = 0,
    flangeBottomAngle: angleB = 90,
  } = params;

  // Left flange BA & OSSB
  const baL = FL > 0 ? calculateBendAllowance(angleL, R, T, K) : 0;
  const sbL = FL > 0 ? calculateOutsideSetback(angleL, R, T) : 0;
  const bdL = FL > 0 ? 2 * sbL - baL : 0;

  // Right flange BA & OSSB
  const baR = FR > 0 ? calculateBendAllowance(angleR, R, T, K) : 0;
  const sbR = FR > 0 ? calculateOutsideSetback(angleR, R, T) : 0;
  const bdR = FR > 0 ? 2 * sbR - baR : 0;

  // Top flange BA & OSSB
  const baT = FT > 0 ? calculateBendAllowance(angleT, R, T, K) : 0;
  const sbT = FT > 0 ? calculateOutsideSetback(angleT, R, T) : 0;
  const bdT = FT > 0 ? 2 * sbT - baT : 0;

  // Bottom flange BA & OSSB
  const baB = FB > 0 ? calculateBendAllowance(angleB, R, T, K) : 0;
  const sbB = FB > 0 ? calculateOutsideSetback(angleB, R, T) : 0;
  const bdB = FB > 0 ? 2 * sbB - baB : 0;

  // Total developed flat blank length = Base L + (FL - bdL) + (FR - bdR)
  const developedFlatLength = L + (FL > 0 ? FL - bdL : 0) + (FR > 0 ? FR - bdR : 0);
  const developedFlatWidth = W + (FT > 0 ? FT - bdT : 0) + (FB > 0 ? FB - bdB : 0);

  // Minimum bend radius rule of thumb: R_min >= 1.0 * T for mild steel / 1.5 * T for 6061-T6
  const recommendedMinRadius = Math.max(1.0, T * 1.0);
  const crackRisk = R < T * 0.8 ? 'High' : R < T * 1.0 ? 'Moderate' : 'Low';

  return {
    bendAllowanceBA: Number((baL || baR || calculateBendAllowance(90, R, T, K)).toFixed(3)),
    bendDeductionBD: Number((bdL || bdR || (2 * sbL - baL)).toFixed(3)),
    setbackSB: Number((sbL || sbR || calculateOutsideSetback(90, R, T)).toFixed(3)),
    developedFlatLength: Number(developedFlatLength.toFixed(2)),
    developedFlatWidth: Number(developedFlatWidth.toFixed(2)),
    recommendedMinRadius: Number(recommendedMinRadius.toFixed(2)),
    crackRisk,
  };
}

/**
 * Generate 3D Sheet Metal Model in Three.js (Folded or Flattened)
 */
export function generateSheetMetal3D(
  params: SheetMetalParameters,
  materialColor: string = '#38bdf8'
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SheetMetalAssembly';

  const sheetMat = createCADMaterial(materialColor, 0.28, 0.88);
  const darkPocketMat = createCADMaterial('#1e293b', 0.6, 0.4);
  const louverMat = createCADMaterial('#0284c7', 0.35, 0.85);

  const bendLineMat = new THREE.LineDashedMaterial({
    color: 0x00f5a0,
    dashSize: 3,
    gapSize: 2,
    linewidth: 2,
  });

  const {
    thickness: T,
    bendRadius: R,
    baseLength: L,
    baseWidth: W,
    flangeLeftLength: FL = 0,
    flangeLeftAngle: angleL = 90,
    flangeRightLength: FR = 0,
    flangeRightAngle: angleR = 90,
    isFlattened,
    cutouts = [],
    louvers = [],
  } = params;

  const calc = calculateSheetMetalBends(params);

  if (isFlattened) {
    // -------------------------------------------------------------------------
    // 2D Unfolded Flat Pattern View
    // -------------------------------------------------------------------------
    const flatLen = calc.developedFlatLength;
    const flatWid = calc.developedFlatWidth;

    const flatBoxGeo = new THREE.BoxGeometry(flatLen, T, flatWid);
    const flatMesh = new THREE.Mesh(flatBoxGeo, sheetMat);
    flatMesh.castShadow = true;
    flatMesh.receiveShadow = true;
    group.add(flatMesh);

    // Draw Bend Tangent Lines (UP / DOWN bend annotations)
    const leftBendX = -L / 2;
    const rightBendX = L / 2;

    const createBendLine = (x: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, T / 2 + 0.1, -flatWid / 2),
        new THREE.Vector3(x, T / 2 + 0.1, flatWid / 2),
      ]);
      const line = new THREE.Line(geo, bendLineMat);
      line.computeLineDistances();
      return line;
    };

    if (FL > 0) group.add(createBendLine(leftBendX));
    if (FR > 0) group.add(createBendLine(rightBendX));

    // Corner relief notches indication
    if (params.reliefWidth > 0 && params.reliefDepth > 0) {
      const rw = params.reliefWidth;
      const rd = params.reliefDepth;
      const notchGeo = new THREE.BoxGeometry(rw, T * 1.2, rd);
      const notchPositions = [
        [-L / 2, T / 2, -flatWid / 2 + rd / 2],
        [-L / 2, T / 2, flatWid / 2 - rd / 2],
        [L / 2, T / 2, -flatWid / 2 + rd / 2],
        [L / 2, T / 2, flatWid / 2 - rd / 2],
      ];
      notchPositions.forEach(([nx, ny, nz]) => {
        const notchMesh = new THREE.Mesh(notchGeo, darkPocketMat);
        notchMesh.position.set(nx, ny, nz);
        group.add(notchMesh);
      });
    }

    // Cutouts on flat pattern
    cutouts.forEach((cut) => {
      if (cut.type === 'hole') {
        const d = cut.diameter || 10;
        const cylGeo = new THREE.CylinderGeometry(d / 2, d / 2, T * 1.4, 24);
        const cyl = new THREE.Mesh(cylGeo, darkPocketMat);
        cyl.position.set(cut.x, 0, cut.y);
        group.add(cyl);
      } else if (cut.type === 'slot') {
        const sw = cut.width || 20;
        const sh = cut.height || 10;
        const boxGeo = new THREE.BoxGeometry(sw, T * 1.4, sh);
        const slotMesh = new THREE.Mesh(boxGeo, darkPocketMat);
        slotMesh.position.set(cut.x, 0, cut.y);
        group.add(slotMesh);
      }
    });

    // Louver slits on flat pattern
    louvers.forEach((louver) => {
      for (let i = 0; i < louver.count; i++) {
        const louverZ = louver.y + (i - (louver.count - 1) / 2) * louver.pitch;
        const slitGeo = new THREE.BoxGeometry(louver.width, T * 1.4, 3);
        const slitMesh = new THREE.Mesh(slitGeo, darkPocketMat);
        slitMesh.position.set(louver.x, 0, louverZ);
        group.add(slitMesh);
      }
    });

    return group;
  }

  // ---------------------------------------------------------------------------
  // 3D Folded Sheet Metal Body with Bends & Flanges
  // ---------------------------------------------------------------------------

  // 1. Base Web Plate
  const baseGeo = new THREE.BoxGeometry(L, T, W);
  const baseMesh = new THREE.Mesh(baseGeo, sheetMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Cutouts on base web
  cutouts.forEach((cut) => {
    if (cut.type === 'hole') {
      const d = cut.diameter || 10;
      const cylGeo = new THREE.CylinderGeometry(d / 2, d / 2, T * 1.5, 32);
      const cyl = new THREE.Mesh(cylGeo, darkPocketMat);
      cyl.position.set(cut.x, 0, cut.y);
      group.add(cyl);
    } else if (cut.type === 'slot') {
      const sw = cut.width || 20;
      const sh = cut.height || 10;
      const boxGeo = new THREE.BoxGeometry(sw, T * 1.5, sh);
      const slotMesh = new THREE.Mesh(boxGeo, darkPocketMat);
      slotMesh.position.set(cut.x, 0, cut.y);
      group.add(slotMesh);
    }
  });

  // Louver Stamped Louvers on Base Web
  louvers.forEach((louver) => {
    for (let i = 0; i < louver.count; i++) {
      const louverZ = louver.y + (i - (louver.count - 1) / 2) * louver.pitch;
      // Stamped scoop geometry
      const scoopGeo = new THREE.CylinderGeometry(louver.width / 2, louver.width / 2, 4, 16, 1, false, 0, Math.PI);
      scoopGeo.rotateZ(Math.PI / 2);
      const scoopMesh = new THREE.Mesh(scoopGeo, louverMat);
      scoopMesh.position.set(louver.x, T / 2 + 2, louverZ);
      scoopMesh.scale.set(1, louver.depth / 4, 1);
      group.add(scoopMesh);

      // Slit cutout underneath
      const slitGeo = new THREE.BoxGeometry(louver.width * 0.9, T * 1.2, 2.5);
      const slitMesh = new THREE.Mesh(slitGeo, darkPocketMat);
      slitMesh.position.set(louver.x, 0, louverZ);
      group.add(slitMesh);
    }
  });

  // 2. Left Bend Corner & Flange
  if (FL > 0) {
    const leftGroup = new THREE.Group();
    leftGroup.position.set(-L / 2, T / 2, 0);

    const bendRad = R;
    const bendAngleRad = (angleL * Math.PI) / 180;
    const bendCylGeo = new THREE.CylinderGeometry(bendRad + T, bendRad, W, 24, 1, false, 0, bendAngleRad);
    bendCylGeo.rotateZ(Math.PI / 2);
    const bendMesh = new THREE.Mesh(bendCylGeo, sheetMat);
    bendMesh.position.set(0, bendRad, 0);
    leftGroup.add(bendMesh);

    // Flange leg
    const flangeGeo = new THREE.BoxGeometry(T, FL, W);
    flangeGeo.translate(0, FL / 2, 0);
    const flangeMesh = new THREE.Mesh(flangeGeo, sheetMat);
    flangeMesh.position.set(-bendRad, bendRad, 0);
    flangeMesh.rotation.z = Math.PI - bendAngleRad;
    leftGroup.add(flangeMesh);

    group.add(leftGroup);
  }

  // 3. Right Bend Corner & Flange
  if (FR > 0) {
    const rightGroup = new THREE.Group();
    rightGroup.position.set(L / 2, T / 2, 0);

    const bendRad = R;
    const bendAngleRad = (angleR * Math.PI) / 180;

    // Flange leg
    const flangeGeo = new THREE.BoxGeometry(T, FR, W);
    flangeGeo.translate(0, FR / 2, 0);
    const flangeMesh = new THREE.Mesh(flangeGeo, sheetMat);
    flangeMesh.position.set(bendRad, bendRad, 0);
    flangeMesh.rotation.z = -(Math.PI - bendAngleRad);
    rightGroup.add(flangeMesh);

    group.add(rightGroup);
  }

  return group;
}

/**
 * Generate 2D Flat Pattern DXF specifically for laser cutting & press brakes
 */
export function exportFlatPatternDXF(params: SheetMetalParameters, partName: string): Blob {
  const calc = calculateSheetMetalBends(params);
  const L = calc.developedFlatLength;
  const W = calc.developedFlatWidth;
  const T = params.thickness;

  let dxf = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n4\n';
  dxf += '0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nCUT_OUTLINE\n70\n0\n62\n3\n6\nCONTINUOUS\n'; // Green = Outer Cutting contour
  dxf += '0\nLAYER\n2\nBEND_LINES\n70\n0\n62\n4\n6\nDASHED\n'; // Cyan = Bend lines
  dxf += '0\nLAYER\n2\nCUTOUTS\n70\n0\n62\n1\n6\nCONTINUOUS\n'; // Red = Internal Holes/Slots
  dxf += '0\nENDTAB\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // Outer Rectangle Polyline (Blank Cut)
  dxf += '0\nLWPOLYLINE\n8\nCUT_OUTLINE\n90\n4\n70\n1\n';
  dxf += `10\n${(-L / 2).toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n`;
  dxf += `10\n${(L / 2).toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n`;
  dxf += `10\n${(L / 2).toFixed(4)}\n20\n${(W / 2).toFixed(4)}\n`;
  dxf += `10\n${(-L / 2).toFixed(4)}\n20\n${(W / 2).toFixed(4)}\n`;

  // Bend Line 1 (Left Bend)
  if (params.flangeLeftLength > 0) {
    const b1X = -params.baseLength / 2;
    dxf += `0\nLINE\n8\nBEND_LINES\n10\n${b1X.toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n30\n0.0\n11\n${b1X.toFixed(4)}\n21\n${(W / 2).toFixed(4)}\n31\n0.0\n`;
    dxf += `0\nTEXT\n8\nBEND_LINES\n10\n${(b1X - 5).toFixed(4)}\n20\n0.0\n30\n0.0\n40\n4.0\n1\nUP ${params.flangeLeftAngle}° R${params.bendRadius} BA=${calc.bendAllowanceBA}mm K=${params.kFactor}\n`;
  }

  // Bend Line 2 (Right Bend)
  if (params.flangeRightLength > 0) {
    const b2X = params.baseLength / 2;
    dxf += `0\nLINE\n8\nBEND_LINES\n10\n${b2X.toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n30\n0.0\n11\n${b2X.toFixed(4)}\n21\n${(W / 2).toFixed(4)}\n31\n0.0\n`;
    dxf += `0\nTEXT\n8\nBEND_LINES\n10\n${(b2X + 2).toFixed(4)}\n20\n0.0\n30\n0.0\n40\n4.0\n1\nUP ${params.flangeRightAngle}° R${params.bendRadius} BA=${calc.bendAllowanceBA}mm K=${params.kFactor}\n`;
  }

  // Internal cutouts (Holes & Slots)
  if (params.cutouts) {
    params.cutouts.forEach((cut) => {
      if (cut.type === 'hole') {
        const dia = cut.diameter || 10;
        dxf += `0\nCIRCLE\n8\nCUTOUTS\n10\n${cut.x.toFixed(4)}\n20\n${cut.y.toFixed(4)}\n30\n0.0\n40\n${(dia / 2).toFixed(4)}\n`;
      } else if (cut.type === 'slot') {
        const sw = cut.width || 20;
        const sh = cut.height || 10;
        const x1 = cut.x - sw / 2;
        const y1 = cut.y - sh / 2;
        const x2 = cut.x + sw / 2;
        const y2 = cut.y + sh / 2;
        dxf += '0\nLWPOLYLINE\n8\nCUTOUTS\n90\n4\n70\n1\n';
        dxf += `10\n${x1.toFixed(4)}\n20\n${y1.toFixed(4)}\n`;
        dxf += `10\n${x2.toFixed(4)}\n20\n${y1.toFixed(4)}\n`;
        dxf += `10\n${x2.toFixed(4)}\n20\n${y2.toFixed(4)}\n`;
        dxf += `10\n${x1.toFixed(4)}\n20\n${y2.toFixed(4)}\n`;
      }
    });
  }

  // Louver lines
  if (params.louvers) {
    params.louvers.forEach((louver) => {
      for (let i = 0; i < louver.count; i++) {
        const ly = louver.y + (i - (louver.count - 1) / 2) * louver.pitch;
        const lx1 = louver.x - louver.width / 2;
        const lx2 = louver.x + louver.width / 2;
        dxf += `0\nLINE\n8\nCUTOUTS\n10\n${lx1.toFixed(4)}\n20\n${ly.toFixed(4)}\n30\n0.0\n11\n${lx2.toFixed(4)}\n21\n${ly.toFixed(4)}\n31\n0.0\n`;
      }
    });
  }

  dxf += '0\nENDSEC\n0\nEOF\n';

  return new Blob([dxf], { type: 'application/dxf' });
}
