import * as THREE from 'three';
import { CADPart } from '../types/cad';
import { createCADMaterial } from '../cad/geometryGenerators';

export interface SheetMetalParameters {
  thickness: number; // T in mm (e.g., 2.0 mm)
  bendRadius: number; // R in mm (e.g., 3.0 mm)
  kFactor: number; // Neutral axis factor K (0.25 to 0.50, DIN 6935 default 0.44)
  baseLength: number; // L in mm (e.g., 120 mm)
  baseWidth: number; // W in mm (e.g., 80 mm)
  flangeLeftLength: number; // Left flange length in mm
  flangeLeftAngle: number; // Left bend angle in deg (e.g., 90°)
  flangeRightLength: number; // Right flange length in mm
  flangeRightAngle: number; // Right bend angle in deg (e.g., 90°)
  reliefType: 'rectangular' | 'tear' | 'round';
  reliefWidth: number; // Relief notch width
  reliefDepth: number; // Relief notch depth
  isFlattened: boolean; // Flat pattern unfolded state
}

export interface BendCalculationResult {
  bendAllowanceBA: number; // BA in mm
  bendDeductionBD: number; // BD in mm
  setbackSB: number; // Setback OSSB in mm
  developedFlatLength: number; // Total unfolded flat blank length
  developedFlatWidth: number; // Total unfolded flat blank width
  recommendedMinRadius: number; // Minimum recommended bend radius to avoid cracking
  crackRisk: 'Low' | 'Moderate' | 'High';
}

// DIN 6935 Sheet Metal Calculation Engine
export function calculateSheetMetalBends(params: SheetMetalParameters): BendCalculationResult {
  const { thickness: T, bendRadius: R, kFactor: K, baseLength: L, baseWidth: W, flangeLeftLength: FL, flangeLeftAngle: angleL, flangeRightLength: FR, flangeRightAngle: angleR } = params;

  // Radians for left flange
  const radL = (angleL * Math.PI) / 180;
  const baL = radL * (R + K * T);
  const sbL = (R + T) * Math.tan(radL / 2);
  const bdL = 2 * sbL - baL;

  // Radians for right flange
  const radR = (angleR * Math.PI) / 180;
  const baR = radR * (R + K * T);
  const sbR = (R + T) * Math.tan(radR / 2);
  const bdR = 2 * sbR - baR;

  // Total developed flat blank length = Base + (FL - BD1) + (FR - BD2)
  const developedFlatLength = L + (FL - bdL) + (FR - bdR);
  const developedFlatWidth = W;

  // Minimum bend radius rule of thumb: R_min >= 1.0 * T for mild steel / 1.5 * T for 6061-T6
  const recommendedMinRadius = Math.max(1.0, T * 1.2);
  const crackRisk = R < T * 0.8 ? 'High' : R < T * 1.1 ? 'Moderate' : 'Low';

  return {
    bendAllowanceBA: Number(baL.toFixed(3)),
    bendDeductionBD: Number(bdL.toFixed(3)),
    setbackSB: Number(sbL.toFixed(3)),
    developedFlatLength: Number(developedFlatLength.toFixed(2)),
    developedFlatWidth: Number(developedFlatWidth.toFixed(2)),
    recommendedMinRadius: Number(recommendedMinRadius.toFixed(2)),
    crackRisk,
  };
}

// Generate 3D Sheet Metal Model in Three.js (Folded or Flattened)
export function generateSheetMetal3D(
  params: SheetMetalParameters,
  materialColor: string = '#38bdf8'
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SheetMetalAssembly';

  const sheetMat = createCADMaterial(materialColor, 0.28, 0.88);
  const bendLineMat = new THREE.LineDashedMaterial({
    color: 0x00f5a0,
    dashSize: 3,
    gapSize: 2,
    linewidth: 2,
  });

  const { thickness: T, baseLength: L, baseWidth: W, flangeLeftLength: FL, flangeLeftAngle: angleL, flangeRightLength: FR, flangeRightAngle: angleR, isFlattened } = params;
  const calc = calculateSheetMetalBends(params);

  if (isFlattened) {
    // Render 2D Unfolded Flat Pattern
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

    group.add(createBendLine(leftBendX));
    group.add(createBendLine(rightBendX));

    return group;
  }

  // Render Folded 3D Sheet Metal Body with Bends & Flanges
  // 1. Base Web Plate
  const baseGeo = new THREE.BoxGeometry(L, T, W);
  const baseMesh = new THREE.Mesh(baseGeo, sheetMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Left Bend Corner & Flange
  if (FL > 0) {
    const leftGroup = new THREE.Group();
    leftGroup.position.set(-L / 2, T / 2, 0);

    // Bend cylinder segment
    const bendRad = params.bendRadius;
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

    const bendRad = params.bendRadius;
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

// Generate 2D Flat Pattern DXF specifically for laser cutting & press brakes
export function exportFlatPatternDXF(params: SheetMetalParameters, partName: string): Blob {
  const calc = calculateSheetMetalBends(params);
  const L = calc.developedFlatLength;
  const W = calc.developedFlatWidth;
  const T = params.thickness;

  let dxf = '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n3\n';
  dxf += '0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nCUT_OUTLINE\n70\n0\n62\n3\n6\nCONTINUOUS\n'; // Green = Cutting contour
  dxf += '0\nLAYER\n2\nBEND_LINES\n70\n0\n62\n4\n6\nDASHED\n'; // Cyan = Bend lines
  dxf += '0\nENDTAB\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // Outer Rectangle Polyline (Blank Cut)
  dxf += '0\nLWPOLYLINE\n8\nCUT_OUTLINE\n90\n4\n70\n1\n';
  dxf += `10\n${(-L / 2).toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n`;
  dxf += `10\n${(L / 2).toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n`;
  dxf += `10\n${(L / 2).toFixed(4)}\n20\n${(W / 2).toFixed(4)}\n`;
  dxf += `10\n${(-L / 2).toFixed(4)}\n20\n${(W / 2).toFixed(4)}\n`;

  // Bend Line 1 (Left Bend)
  const b1X = -params.baseLength / 2;
  dxf += `0\nLINE\n8\nBEND_LINES\n10\n${b1X.toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n30\n0.0\n11\n${b1X.toFixed(4)}\n21\n${(W / 2).toFixed(4)}\n31\n0.0\n`;

  // Bend Line 2 (Right Bend)
  const b2X = params.baseLength / 2;
  dxf += `0\nLINE\n8\nBEND_LINES\n10\n${b2X.toFixed(4)}\n20\n${(-W / 2).toFixed(4)}\n30\n0.0\n11\n${b2X.toFixed(4)}\n21\n${(W / 2).toFixed(4)}\n31\n0.0\n`;

  // Bend Notes (Text)
  dxf += `0\nTEXT\n8\nBEND_LINES\n10\n${(b1X - 5).toFixed(4)}\n20\n0.0\n30\n0.0\n40\n4.0\n1\nUP ${params.flangeLeftAngle}° R${params.bendRadius} K=${params.kFactor}\n`;
  dxf += `0\nTEXT\n8\nBEND_LINES\n10\n${(b2X + 2).toFixed(4)}\n20\n0.0\n30\n0.0\n40\n4.0\n1\nUP ${params.flangeRightAngle}° R${params.bendRadius} K=${params.kFactor}\n`;

  dxf += '0\nENDSEC\n0\nEOF\n';

  return new Blob([dxf], { type: 'application/dxf' });
}
