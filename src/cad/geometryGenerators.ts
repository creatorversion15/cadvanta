import * as THREE from 'three';
import { CADPart, AssemblyComponent } from '../types/cad';
import { getMaterialById } from '../materials/materialsDatabase';

// Helper to create clean metallic PBR materials
export function createCADMaterial(
  colorHex: string | number,
  roughness: number = 0.3,
  metalness: number = 0.85,
  opacity: number = 1.0,
  wireframe: boolean = false
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: roughness,
    metalness: metalness,
    transparent: opacity < 1.0,
    opacity: opacity,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });
}

// 1. STEPPED SHAFT GENERATOR (Fixed with real keyway, multi-step journals, fillets, chamfers)
export function generateShaft3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ShaftAssembly';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const shaftMat = createCADMaterial(matColor, part.material?.roughness || 0.25, part.material?.metalness || 0.88);

  const totalLength = Number(p.total_length || 200);
  const mainDia = Number(p.main_diameter || 60);
  const mainRadius = mainDia / 2;

  const s1Len = Number(p.step1_length || 0);
  const s1Dia = Number(p.step1_diameter || 0);
  const s1Radius = s1Dia > 0 ? s1Dia / 2 : 0;

  const s2Len = Number(p.step2_length || 0);
  const s2Dia = Number(p.step2_diameter || 0);
  const s2Radius = s2Dia > 0 ? s2Dia / 2 : 0;

  const centerLen = Math.max(10, totalLength - s1Len - s2Len);

  // Position cursor starting from negative total length / 2
  let currentZ = -totalLength / 2;

  // Step 1 Section (Left Journal)
  if (s1Len > 0 && s1Radius > 0) {
    const s1Geo = new THREE.CylinderGeometry(s1Radius, s1Radius, s1Len, 48);
    s1Geo.rotateX(Math.PI / 2);
    const s1Mesh = new THREE.Mesh(s1Geo, shaftMat);
    s1Mesh.position.z = currentZ + s1Len / 2;
    s1Mesh.castShadow = true;
    s1Mesh.receiveShadow = true;
    group.add(s1Mesh);

    // Shoulder transition / Fillet ring
    const filletR = Number(p.fillet_radius || 2);
    if (filletR > 0) {
      const shoulderRingGeo = new THREE.TorusGeometry(s1Radius + filletR * 0.4, filletR * 0.6, 16, 48);
      const ringMesh = new THREE.Mesh(shoulderRingGeo, shaftMat);
      ringMesh.position.z = currentZ + s1Len;
      group.add(ringMesh);
    }

    currentZ += s1Len;
  }

  // Main Center Section
  const mainGeo = new THREE.CylinderGeometry(mainRadius, mainRadius, centerLen, 64);
  mainGeo.rotateX(Math.PI / 2);
  const mainMesh = new THREE.Mesh(mainGeo, shaftMat);
  mainMesh.position.z = currentZ + centerLen / 2;
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  // DIN 6885 Keyway feature
  const kwWidth = Number(p.keyway_width || 0);
  const kwDepth = Number(p.keyway_depth || Math.round(kwWidth * 0.55));
  const kwLen = Number(p.keyway_length || Math.min(45, centerLen * 0.7));

  if (kwWidth > 0 && kwDepth > 0) {
    // Generate milled keyway pocket geometry with rounded ends
    const keywayPocketGeo = new THREE.BoxGeometry(kwWidth, kwDepth * 1.5, kwLen);
    const darkSlotMat = createCADMaterial('#1e293b', 0.6, 0.4);
    const keywayMesh = new THREE.Mesh(keywayPocketGeo, darkSlotMat);
    // Position keyway on the top crown of the main journal
    keywayMesh.position.set(0, mainRadius - kwDepth / 2, currentZ + centerLen / 2);
    group.add(keywayMesh);

    // Keyway rounded end caps
    const capGeo = new THREE.CylinderGeometry(kwWidth / 2, kwWidth / 2, kwDepth * 1.5, 24);
    const cap1 = new THREE.Mesh(capGeo, darkSlotMat);
    cap1.position.set(0, mainRadius - kwDepth / 2, currentZ + centerLen / 2 - kwLen / 2);
    group.add(cap1);
    const cap2 = new THREE.Mesh(capGeo, darkSlotMat);
    cap2.position.set(0, mainRadius - kwDepth / 2, currentZ + centerLen / 2 + kwLen / 2);
    group.add(cap2);
  }

  currentZ += centerLen;

  // Step 2 Section (Right Journal)
  if (s2Len > 0 && s2Radius > 0) {
    const s2Geo = new THREE.CylinderGeometry(s2Radius, s2Radius, s2Len, 48);
    s2Geo.rotateX(Math.PI / 2);
    const s2Mesh = new THREE.Mesh(s2Geo, shaftMat);
    s2Mesh.position.z = currentZ + s2Len / 2;
    s2Mesh.castShadow = true;
    s2Mesh.receiveShadow = true;
    group.add(s2Mesh);
  }

  // End Chamfers
  const chamferMat = createCADMaterial('#94a3b8', 0.2, 0.9);
  const chamferGeo = new THREE.ConeGeometry((s1Radius || mainRadius) * 0.98, 2, 32);
  chamferGeo.rotateX(-Math.PI / 2);
  const chamferMesh = new THREE.Mesh(chamferGeo, chamferMat);
  chamferMesh.position.z = -totalLength / 2;
  group.add(chamferMesh);

  return group;
}

// 2. INVOLUTE SPUR & HELICAL GEAR GENERATOR
export function generateGear3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GearPart';
  const p = part.parameters;
  const matColor = part.material?.color || '#94a3b8';
  const gearMat = createCADMaterial(matColor, part.material?.roughness || 0.3, part.material?.metalness || 0.85);

  const numTeeth = Math.max(8, Number(p.teeth_count || 24));
  const moduleVal = Math.max(0.5, Number(p.module || 2.5));
  const faceWidth = Math.max(5, Number(p.face_width || 20));
  const boreDia = Math.max(0, Number(p.bore_diameter || 20));
  const hubDia = Number(p.hub_diameter || boreDia * 1.8);
  const hubWidth = Number(p.hub_width || faceWidth * 0.4);

  // Pitch radius = (m * z) / 2
  const pitchRadius = (moduleVal * numTeeth) / 2;
  const outerRadius = pitchRadius + moduleVal; // Addendum
  const rootRadius = Math.max(pitchRadius - 1.25 * moduleVal, boreDia / 2 + 3); // Dedendum

  // 1. Create Involute 2D Shape
  const shape = new THREE.Shape();
  const totalPoints = numTeeth * 4;

  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2;
    const toothPhase = i % 4;
    let r = rootRadius;
    if (toothPhase === 1 || toothPhase === 2) {
      r = outerRadius;
    }
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  // Center Bore Hole
  if (boreDia > 0) {
    const holePath = new THREE.Path();
    const boreRadius = boreDia / 2;
    holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    // Keyway slot in bore
    if (p.keyway_width) {
      const kwW = Number(p.keyway_width);
      const kwD = Number(p.keyway_depth || kwW * 0.5);
      const kwPath = new THREE.Path();
      kwPath.moveTo(-kwW / 2, boreRadius);
      kwPath.lineTo(-kwW / 2, boreRadius + kwD);
      kwPath.lineTo(kwW / 2, boreRadius + kwD);
      kwPath.lineTo(kwW / 2, boreRadius);
      shape.holes.push(kwPath);
    }
  }

  // Extrude gear teeth
  const extrudeSettings = {
    steps: 1,
    depth: faceWidth,
    bevelEnabled: true,
    bevelThickness: 1.0,
    bevelSize: 0.8,
    bevelSegments: 3,
  };
  const gearGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  gearGeo.center();
  const gearMesh = new THREE.Mesh(gearGeo, gearMat);
  gearMesh.castShadow = true;
  gearMesh.receiveShadow = true;
  group.add(gearMesh);

  // Reinforced Hub Collar
  if (hubWidth > 0 && hubDia > boreDia) {
    const hubGeo = new THREE.CylinderGeometry(hubDia / 2, hubDia / 2, hubWidth, 32);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, gearMat);
    hubMesh.position.z = faceWidth / 2 + hubWidth / 2;
    group.add(hubMesh);
  }

  return group;
}

// 3. FLANGE & COUPLING GENERATOR
export function generateFlange3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FlangePart';
  const p = part.parameters;
  const flangeMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.28, 0.88);

  const outerDia = Number(p.outer_diameter || 120);
  const innerDia = Number(p.inner_diameter || 50);
  const thickness = Number(p.thickness || 14);
  const pcd = Number(p.pitch_circle_diameter || 90);
  const boltHoleDia = Number(p.bolt_hole_diameter || 10);
  const boltCount = Number(p.bolt_hole_count || 6);
  const hubDia = Number(p.hub_diameter || 0);
  const hubH = Number(p.hub_height || 0);

  // 2D Profile shape with center bore and bolt holes
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);

  // Center Bore
  if (innerDia > 0) {
    const centerHole = new THREE.Path();
    centerHole.absarc(0, 0, innerDia / 2, 0, Math.PI * 2, true);
    shape.holes.push(centerHole);
  }

  // Circular Bolt Pattern Holes
  if (boltCount > 0 && boltHoleDia > 0 && pcd > 0) {
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const bx = Math.cos(angle) * (pcd / 2);
      const by = Math.sin(angle) * (pcd / 2);
      const boltHole = new THREE.Path();
      boltHole.absarc(bx, by, boltHoleDia / 2, 0, Math.PI * 2, true);
      shape.holes.push(boltHole);
    }
  }

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 1.0,
    bevelSize: 0.8,
    bevelSegments: 2,
  };
  const flangeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  flangeGeo.center();
  const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);
  flangeMesh.castShadow = true;
  flangeMesh.receiveShadow = true;
  group.add(flangeMesh);

  // Welding Hub Boss
  if (hubH > 0 && hubDia > innerDia) {
    const hubGeo = new THREE.CylinderGeometry(hubDia / 2, hubDia / 2, hubH, 48);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, flangeMat);
    hubMesh.position.z = thickness / 2 + hubH / 2;
    group.add(hubMesh);
  }

  // Dual Flange Coupling Mode
  if (part.part_type === 'flange_coupling' || p.is_coupling) {
    const flange2 = flangeMesh.clone();
    flange2.position.z = -thickness - 2;
    flange2.rotation.y = Math.PI;
    group.add(flange2);

    // Coupling Connecting Bolts
    const boltMat = createCADMaterial('#475569', 0.2, 0.95);
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const bx = Math.cos(angle) * (pcd / 2);
      const by = Math.sin(angle) * (pcd / 2);
      const boltShaftGeo = new THREE.CylinderGeometry(boltHoleDia * 0.45, boltHoleDia * 0.45, thickness * 2.6, 16);
      boltShaftGeo.rotateX(Math.PI / 2);
      const boltMesh = new THREE.Mesh(boltShaftGeo, boltMat);
      boltMesh.position.set(bx, by, -1);
      group.add(boltMesh);

      // Bolt Hex Heads
      const hexHeadGeo = new THREE.CylinderGeometry(boltHoleDia * 0.85, boltHoleDia * 0.85, 6, 6);
      hexHeadGeo.rotateX(Math.PI / 2);
      const head1 = new THREE.Mesh(hexHeadGeo, boltMat);
      head1.position.set(bx, by, thickness / 2 + 4);
      group.add(head1);
      const head2 = new THREE.Mesh(hexHeadGeo, boltMat);
      head2.position.set(bx, by, -thickness * 1.5 - 4);
      group.add(head2);
    }
  }

  return group;
}

// 4. DEEP GROOVE ROLLING BEARING GENERATOR
export function generateBearing3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BallBearing';
  const p = part.parameters;
  const boreDia = Number(p.bore_diameter || 30);
  const outerDia = Number(p.outer_diameter || boreDia * 2.2);
  const width = Number(p.width || Math.round(boreDia * 0.5));

  const ringMat = createCADMaterial('#cbd5e1', 0.18, 0.95);
  const ballMat = createCADMaterial('#e2e8f0', 0.1, 0.98);
  const cageMat = createCADMaterial('#eab308', 0.35, 0.8); // Brass cage

  // Outer Ring
  const orShape = new THREE.Shape();
  orShape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);
  const orHole = new THREE.Path();
  const orInnerR = (outerDia / 2 + boreDia / 2) / 2 + (outerDia - boreDia) * 0.12;
  orHole.absarc(0, 0, orInnerR, 0, Math.PI * 2, true);
  orShape.holes.push(orHole);
  const orGeo = new THREE.ExtrudeGeometry(orShape, { depth: width, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
  orGeo.center();
  const orMesh = new THREE.Mesh(orGeo, ringMat);
  group.add(orMesh);

  // Inner Ring
  const irShape = new THREE.Shape();
  const irOuterR = (outerDia / 2 + boreDia / 2) / 2 - (outerDia - boreDia) * 0.12;
  irShape.absarc(0, 0, irOuterR, 0, Math.PI * 2, false);
  const irHole = new THREE.Path();
  irHole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
  irShape.holes.push(irHole);
  const irGeo = new THREE.ExtrudeGeometry(irShape, { depth: width, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
  irGeo.center();
  const irMesh = new THREE.Mesh(irGeo, ringMat);
  group.add(irMesh);

  // Rolling Balls in Raceway
  const pitchRadius = (outerDia / 2 + boreDia / 2) / 2;
  const ballRadius = (outerDia - boreDia) * 0.18;
  const numBalls = Math.max(6, Math.floor((Math.PI * pitchRadius) / (ballRadius * 1.6)));

  const ballGeo = new THREE.SphereGeometry(ballRadius, 24, 24);
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2;
    const bx = Math.cos(angle) * pitchRadius;
    const by = Math.sin(angle) * pitchRadius;
    const bMesh = new THREE.Mesh(ballGeo, ballMat);
    bMesh.position.set(bx, by, 0);
    group.add(bMesh);
  }

  // Brass Retainer Cage Ring
  const cageGeo = new THREE.TorusGeometry(pitchRadius, ballRadius * 0.45, 12, 32);
  const cageMesh = new THREE.Mesh(cageGeo, cageMat);
  group.add(cageMesh);

  return group;
}

// 5. BEARING HOUSING & PILLOW BLOCK GENERATOR
export function generateBearingHousing3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PillowBlockHousing';
  const p = part.parameters;
  const castMat = createCADMaterial('#475569', 0.55, 0.7); // Cast Iron look

  const housingDia = Number(p.housing_diameter || 90);
  const housingH = Number(p.housing_height || 60);
  const boreDia = Number(p.bore_diameter || 52);
  const flangeDia = Number(p.flange_diameter || housingDia * 1.4);
  const flangeThick = Number(p.flange_thickness || 15);
  const boltCount = Number(p.bolt_count || 4);
  const pcd = Number(p.pitch_circle_diameter || (housingDia + flangeDia) / 2);

  // Base Flange with 4 Bolt Holes
  const shape = new THREE.Shape();
  shape.absarc(0, 0, flangeDia / 2, 0, Math.PI * 2, false);
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
  shape.holes.push(centerHole);

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bx = Math.cos(angle) * (pcd / 2);
    const by = Math.sin(angle) * (pcd / 2);
    const bHole = new THREE.Path();
    bHole.absarc(bx, by, 5, 0, Math.PI * 2, true);
    shape.holes.push(bHole);
  }

  const flangeGeo = new THREE.ExtrudeGeometry(shape, { depth: flangeThick, bevelEnabled: true, bevelThickness: 1, bevelSize: 1 });
  flangeGeo.center();
  const flangeMesh = new THREE.Mesh(flangeGeo, castMat);
  group.add(flangeMesh);

  // Cylindrical Housing Hub Barrel
  const barrelGeo = new THREE.CylinderGeometry(housingDia / 2, housingDia / 2, housingH - flangeThick, 48);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, castMat);
  barrelMesh.position.z = (housingH - flangeThick) / 2 + flangeThick / 2;
  group.add(barrelMesh);

  // Grease Fitting / Nipple
  const nippleMat = createCADMaterial('#eab308', 0.2, 0.9);
  const nippleGeo = new THREE.CylinderGeometry(3, 4, 10, 16);
  const nipple = new THREE.Mesh(nippleGeo, nippleMat);
  nipple.position.set(0, housingDia / 2 + 5, (housingH - flangeThick) / 2);
  group.add(nipple);

  return group;
}

// 6. FASTENERS (BOLT, NUT, WASHER)
export function generateBolt3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FastenerBolt';
  const p = part.parameters;
  const boltMat = createCADMaterial('#64748b', 0.25, 0.9);

  const shaftDia = Number(p.shaft_diameter || 12);
  const shaftLen = Number(p.shaft_length || 60);
  const headDia = Number(p.head_diameter || shaftDia * 1.7);
  const headH = Number(p.head_height || shaftDia * 0.7);
  const isHex = p.head_type !== 'socket';

  // Head (Hexagon or Socket Cylindrical)
  const headGeo = new THREE.CylinderGeometry(headDia / 2, headDia / 2, headH, isHex ? 6 : 32);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, boltMat);
  headMesh.position.z = headH / 2;
  group.add(headMesh);

  // Socket hex recess if socket head
  if (!isHex) {
    const socketGeo = new THREE.CylinderGeometry(shaftDia * 0.4, shaftDia * 0.4, headH * 0.6, 6);
    socketGeo.rotateX(Math.PI / 2);
    const darkMat = createCADMaterial('#1e293b', 0.5, 0.5);
    const socketMesh = new THREE.Mesh(socketGeo, darkMat);
    socketMesh.position.z = headH * 0.8;
    group.add(socketMesh);
  }

  // Smooth Shank + Threaded Section
  const shankGeo = new THREE.CylinderGeometry(shaftDia / 2, shaftDia / 2, shaftLen, 32);
  shankGeo.rotateX(Math.PI / 2);
  const shankMesh = new THREE.Mesh(shankGeo, boltMat);
  shankMesh.position.z = -shaftLen / 2;
  group.add(shankMesh);

  // Thread Visual Grooves
  const threadLen = Number(p.thread_length || shaftLen * 0.65);
  const threadMat = createCADMaterial('#475569', 0.35, 0.85);
  const threadRingsGeo = new THREE.CylinderGeometry(shaftDia * 0.48, shaftDia * 0.48, threadLen, 32);
  threadRingsGeo.rotateX(Math.PI / 2);
  const threadMesh = new THREE.Mesh(threadRingsGeo, threadMat);
  threadMesh.position.z = -shaftLen + threadLen / 2;
  group.add(threadMesh);

  return group;
}

// 7. HELICAL COMPRESSION SPRING
export function generateSpring3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HelicalSpring';
  const p = part.parameters;
  const springMat = createCADMaterial('#94a3b8', 0.2, 0.95);

  const wireDia = Number(p.wire_diameter || 4);
  const meanDia = Number(p.mean_diameter || 30);
  const activeCoils = Number(p.active_coils || 8);
  const freeLength = Number(p.free_length || 70);

  // Create 3D Helix Curve
  const helixPoints: THREE.Vector3[] = [];
  const numPoints = 200;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const angle = t * activeCoils * Math.PI * 2;
    const x = Math.cos(angle) * (meanDia / 2);
    const y = Math.sin(angle) * (meanDia / 2);
    const z = (t - 0.5) * freeLength;
    helixPoints.push(new THREE.Vector3(x, y, z));
  }
  const helixPath = new THREE.CatmullRomCurve3(helixPoints);
  const tubeGeo = new THREE.TubeGeometry(helixPath, 256, wireDia / 2, 16, false);
  const springMesh = new THREE.Mesh(tubeGeo, springMat);
  springMesh.castShadow = true;
  group.add(springMesh);

  return group;
}

// 8. BRACKET & MOUNTING PLATE
export function generateBracket3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StructuralBracket';
  const p = part.parameters;
  const bracketMat = createCADMaterial(part.material?.color || '#94a3b8', 0.3, 0.8);

  const w = Number(p.width || 80);
  const h = Number(p.height || 100);
  const len = Number(p.length || 110);
  const t = Number(p.thickness || 8);
  const holeDia = Number(p.hole_diameter || 10);
  const isU = p.bracket_type === 'U';

  // L-Profile 2D shape with bend radius
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(len, 0);
  shape.lineTo(len, t);
  shape.lineTo(t, t);
  shape.lineTo(t, h);
  if (isU) {
    shape.lineTo(len, h);
    shape.lineTo(len, h - t);
    shape.lineTo(t, h - t);
  } else {
    shape.lineTo(0, h);
  }
  shape.closePath();

  const extrudeSettings = {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
  };
  const bracketGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  bracketGeo.center();
  const bracketMesh = new THREE.Mesh(bracketGeo, bracketMat);
  bracketMesh.castShadow = true;
  group.add(bracketMesh);

  // Add Gusset Stiffener Triangle if heavy duty
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(t + 2, t + 2);
  gussetShape.lineTo(len * 0.7, t + 2);
  gussetShape.lineTo(t + 2, h * 0.7);
  gussetShape.closePath();
  const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, { depth: t * 0.8 });
  gussetGeo.center();
  const gussetMesh = new THREE.Mesh(gussetGeo, bracketMat);
  group.add(gussetMesh);

  return group;
}

// 9. PLANETARY GEARBOX ASSEMBLY (Test Scenario 2)
export function generatePlanetaryGearbox3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PlanetaryGearboxAssembly';
  const p = part.parameters;

  const housingMat = createCADMaterial('#475569', 0.45, 0.7, 0.85); // Transparent casing
  const sunMat = createCADMaterial('#eab308', 0.25, 0.9); // Gold/Bronze Sun
  const planetMat = createCADMaterial('#cbd5e1', 0.25, 0.9); // Hardened Steel Planets
  const carrierMat = createCADMaterial('#0284c7', 0.3, 0.8); // Anodized Blue Carrier
  const shaftMat = createCADMaterial('#94a3b8', 0.2, 0.95);
  const boltMat = createCADMaterial('#1e293b', 0.3, 0.8);

  const stageCount = Number(p.stages || 2);
  const ringDia = Number(p.ring_diameter || 120);
  const ringRadius = ringDia / 2;
  const housingLen = Number(p.length || (stageCount === 2 ? 140 : 90));
  const sunTeeth = Number(p.sun_teeth || 16);
  const planetTeeth = Number(p.planet_teeth || 20);
  const moduleVal = 2.0;

  const sunRadius = (moduleVal * sunTeeth) / 2;
  const planetRadius = (moduleVal * planetTeeth) / 2;
  const orbitRadius = sunRadius + planetRadius;
  const numPlanets = 3;

  // 1. External Cylindrical Housing Ring Gear
  const housingShape = new THREE.Shape();
  housingShape.absarc(0, 0, ringRadius, 0, Math.PI * 2, false);
  const innerCut = new THREE.Path();
  innerCut.absarc(0, 0, ringRadius - 12, 0, Math.PI * 2, true);
  housingShape.holes.push(innerCut);

  const housingGeo = new THREE.ExtrudeGeometry(housingShape, { depth: housingLen, bevelEnabled: true, bevelThickness: 2, bevelSize: 1 });
  housingGeo.center();
  const housingMesh = new THREE.Mesh(housingGeo, housingMat);
  group.add(housingMesh);

  // 2. Input Shaft & Sun Gear 1
  const inputShaftGeo = new THREE.CylinderGeometry(9, 9, 50, 32);
  inputShaftGeo.rotateX(Math.PI / 2);
  const inputShaft = new THREE.Mesh(inputShaftGeo, shaftMat);
  inputShaft.position.z = -housingLen / 2 - 20;
  group.add(inputShaft);

  const sun1Geo = new THREE.CylinderGeometry(sunRadius, sunRadius, 18, 24);
  sun1Geo.rotateX(Math.PI / 2);
  const sun1Mesh = new THREE.Mesh(sun1Geo, sunMat);
  sun1Mesh.position.z = -housingLen / 4;
  group.add(sun1Mesh);

  // 3. Stage 1 Planet Gears (3x)
  for (let i = 0; i < numPlanets; i++) {
    const angle = (i / numPlanets) * Math.PI * 2;
    const px = Math.cos(angle) * orbitRadius;
    const py = Math.sin(angle) * orbitRadius;

    const pGeo = new THREE.CylinderGeometry(planetRadius, planetRadius, 16, 24);
    pGeo.rotateX(Math.PI / 2);
    const pMesh = new THREE.Mesh(pGeo, planetMat);
    pMesh.position.set(px, py, -housingLen / 4);
    group.add(pMesh);

    // Planet Pin
    const pinGeo = new THREE.CylinderGeometry(4, 4, 28, 16);
    pinGeo.rotateX(Math.PI / 2);
    const pinMesh = new THREE.Mesh(pinGeo, boltMat);
    pinMesh.position.set(px, py, -housingLen / 4);
    group.add(pinMesh);
  }

  // 4. Stage 1 Planet Carrier Disc
  const carrier1Geo = new THREE.CylinderGeometry(orbitRadius + 8, orbitRadius + 8, 8, 32);
  carrier1Geo.rotateX(Math.PI / 2);
  const carrier1Mesh = new THREE.Mesh(carrier1Geo, carrierMat);
  carrier1Mesh.position.z = -housingLen / 4 + 12;
  group.add(carrier1Mesh);

  // 5. Stage 2 Cascade (if two-stage)
  if (stageCount >= 2) {
    const sun2Geo = new THREE.CylinderGeometry(sunRadius * 1.1, sunRadius * 1.1, 18, 24);
    sun2Geo.rotateX(Math.PI / 2);
    const sun2Mesh = new THREE.Mesh(sun2Geo, sunMat);
    sun2Mesh.position.z = housingLen / 4;
    group.add(sun2Mesh);

    for (let i = 0; i < numPlanets; i++) {
      const angle = (i / numPlanets) * Math.PI * 2 + Math.PI / 3;
      const px = Math.cos(angle) * orbitRadius;
      const py = Math.sin(angle) * orbitRadius;

      const p2Geo = new THREE.CylinderGeometry(planetRadius, planetRadius, 18, 24);
      p2Geo.rotateX(Math.PI / 2);
      const p2Mesh = new THREE.Mesh(p2Geo, planetMat);
      p2Mesh.position.set(px, py, housingLen / 4);
      group.add(p2Mesh);
    }

    const carrier2Geo = new THREE.CylinderGeometry(orbitRadius + 10, orbitRadius + 10, 10, 32);
    carrier2Geo.rotateX(Math.PI / 2);
    const carrier2Mesh = new THREE.Mesh(carrier2Geo, carrierMat);
    carrier2Mesh.position.z = housingLen / 4 + 14;
    group.add(carrier2Mesh);
  }

  // 6. High-Torque Output Shaft with Keyway
  const outputShaftGeo = new THREE.CylinderGeometry(16, 16, 60, 32);
  outputShaftGeo.rotateX(Math.PI / 2);
  const outputShaft = new THREE.Mesh(outputShaftGeo, shaftMat);
  outputShaft.position.z = housingLen / 2 + 25;
  group.add(outputShaft);

  // End Flange Mount & Fasteners
  const endFlangeGeo = new THREE.CylinderGeometry(ringRadius + 8, ringRadius + 8, 12, 32);
  endFlangeGeo.rotateX(Math.PI / 2);
  const endFlange = new THREE.Mesh(endFlangeGeo, housingMat);
  endFlange.position.z = -housingLen / 2;
  group.add(endFlange);

  return group;
}

// 10. CRANK-SLIDER & MECHANISMS
export function generateCrankSlider3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CrankSliderMechanism';

  const linkMat = createCADMaterial('#0284c7', 0.3, 0.8);
  const crankMat = createCADMaterial('#eab308', 0.25, 0.9);
  const pistonMat = createCADMaterial('#cbd5e1', 0.2, 0.9);
  const guideMat = createCADMaterial('#475569', 0.5, 0.7, 0.6);

  // Rotating Crank
  const crankGeo = new THREE.BoxGeometry(16, 50, 10);
  crankGeo.translate(0, 20, 0);
  const crank = new THREE.Mesh(crankGeo, crankMat);
  crank.rotation.z = Math.PI / 4;
  group.add(crank);

  // Connecting Rod
  const rodGeo = new THREE.BoxGeometry(12, 110, 8);
  rodGeo.translate(0, 50, 0);
  const rod = new THREE.Mesh(rodGeo, linkMat);
  rod.position.set(25, 25, 12);
  rod.rotation.z = -Math.PI / 8;
  group.add(rod);

  // Slider Piston
  const pistonGeo = new THREE.BoxGeometry(45, 35, 30);
  const piston = new THREE.Mesh(pistonGeo, pistonMat);
  piston.position.set(0, 120, 0);
  group.add(piston);

  // Guide Cylinder
  const guideGeo = new THREE.BoxGeometry(60, 160, 40);
  const guide = new THREE.Mesh(guideGeo, guideMat);
  guide.position.set(0, 120, 0);
  group.add(guide);

  return group;
}

// 11. HYDRAULIC / PNEUMATIC CYLINDER
export function generateHydraulicCylinder3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HydraulicActuator';

  const barrelMat = createCADMaterial('#0284c7', 0.3, 0.8);
  const rodMat = createCADMaterial('#f8fafc', 0.08, 0.98); // Hard Chrome
  const capMat = createCADMaterial('#1e293b', 0.4, 0.8);

  const stroke = 120;
  const bore = 50;

  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(bore / 2 + 8, bore / 2 + 8, stroke + 40, 32);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  group.add(barrel);

  // Chrome Piston Rod
  const rodGeo = new THREE.CylinderGeometry(14, 14, stroke + 80, 32);
  rodGeo.rotateX(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.z = stroke * 0.4;
  group.add(rod);

  // Front & Rear End Caps with Clevis Mounts
  const capGeo = new THREE.BoxGeometry(bore + 20, bore + 20, 20);
  const rearCap = new THREE.Mesh(capGeo, capMat);
  rearCap.position.z = -(stroke + 40) / 2;
  group.add(rearCap);

  const frontCap = new THREE.Mesh(capGeo, capMat);
  frontCap.position.z = (stroke + 40) / 2;
  group.add(frontCap);

  return group;
}

// 12. IC ENGINE PISTON & CROWN 3D GENERATOR
export function generateEnginePiston3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EnginePiston';
  const p = part.parameters;
  const boreDia = Number(p.bore_diameter || p.diameter || 85);
  const totalHeight = Number(p.total_height || p.height || 75);
  const compressionHeight = Number(p.compression_height || 35);
  const pinDia = Number(p.pin_diameter || 22);
  const dishDepth = Number(p.dish_depth || 3.5);
  const dishDia = Number(p.dish_diameter || boreDia * 0.65);
  const radius = boreDia / 2;

  const aluMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.28, 0.82);
  const darkGrooveMat = createCADMaterial('#1e293b', 0.6, 0.4);
  const bronzeMat = createCADMaterial('#d97706', 0.35, 0.8);

  // Crown & Ring Belt (Top Section)
  const crownHeight = compressionHeight;
  const crownGeo = new THREE.CylinderGeometry(radius * 0.995, radius * 0.995, crownHeight, 64);
  const crownMesh = new THREE.Mesh(crownGeo, aluMat);
  crownMesh.position.y = (totalHeight - crownHeight) / 2;
  group.add(crownMesh);

  // Combustion Bowl / Crown Dish Depression
  if (dishDepth > 0) {
    const dishGeo = new THREE.CylinderGeometry(dishDia / 2, (dishDia / 2) * 0.9, dishDepth, 48);
    const dishMesh = new THREE.Mesh(dishGeo, darkGrooveMat);
    dishMesh.position.y = totalHeight / 2 - dishDepth / 2;
    group.add(dishMesh);
  }

  // 3x Piston Ring Grooves (Top compression, 2nd scraper, oil control)
  const ringGrooveWidth = 1.5;
  const ringDepths = [radius * 0.93, radius * 0.93, radius * 0.91];
  const ringOffsets = [6, 12, 18]; // mm below crown deck

  ringOffsets.forEach((offset, idx) => {
    const ringGeo = new THREE.TorusGeometry(ringDepths[idx], ringGrooveWidth / 2, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, darkGrooveMat);
    ringMesh.position.y = totalHeight / 2 - offset;
    group.add(ringMesh);
  });

  // Piston Skirt (Lower Section with Slipper Cutouts)
  const skirtHeight = totalHeight - crownHeight;
  const skirtGeo = new THREE.CylinderGeometry(radius, radius, skirtHeight, 64, 1, true);
  const skirtMesh = new THREE.Mesh(skirtGeo, aluMat);
  skirtMesh.position.y = -crownHeight / 2;
  group.add(skirtMesh);

  // Gudgeon / Wrist Pin Bosses (Reinforced internal cylinders)
  const bossRadius = pinDia * 0.95;
  const bossGeo = new THREE.CylinderGeometry(bossRadius, bossRadius, boreDia * 0.96, 32);
  bossGeo.rotateZ(Math.PI / 2);
  const bossMesh = new THREE.Mesh(bossGeo, aluMat);
  bossMesh.position.y = (totalHeight / 2) - compressionHeight;
  group.add(bossMesh);

  // Wrist Pin (Hardened Steel Pin inside boss)
  const pinGeo = new THREE.CylinderGeometry(pinDia / 2, pinDia / 2, boreDia * 0.98, 32);
  pinGeo.rotateZ(Math.PI / 2);
  const pinMesh = new THREE.Mesh(pinGeo, createCADMaterial('#94a3b8', 0.15, 0.95));
  pinMesh.position.y = (totalHeight / 2) - compressionHeight;
  group.add(pinMesh);

  return group;
}

// 13. FORGED H-BEAM CONNECTING ROD 3D GENERATOR
export function generateEngineConnectingRod3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ConnectingRod';
  const p = part.parameters;
  const c2cLength = Number(p.center_to_center_length || p.length || 140);
  const bigBore = Number(p.big_end_bore || 52);
  const bigWidth = Number(p.big_end_width || 24);
  const smallBore = Number(p.small_end_bore || 22);
  const smallWidth = Number(p.small_end_width || 21);
  const beamWidth = Number(p.beam_width || 14);

  const steelMat = createCADMaterial(part.material?.color || '#94a3b8', 0.25, 0.9);
  const bronzeMat = createCADMaterial('#d97706', 0.35, 0.8);
  const darkMat = createCADMaterial('#1e293b', 0.4, 0.6);

  // Big End Housing
  const bigEndOuterRadius = (bigBore / 2) + 12;
  const bigEndGeo = new THREE.CylinderGeometry(bigEndOuterRadius, bigEndOuterRadius, bigWidth, 48);
  bigEndGeo.rotateX(Math.PI / 2);
  const bigEndMesh = new THREE.Mesh(bigEndGeo, steelMat);
  bigEndMesh.position.y = -c2cLength / 2;
  group.add(bigEndMesh);

  // Big End Bore Cutout
  const bigBoreGeo = new THREE.CylinderGeometry(bigBore / 2, bigBore / 2, bigWidth * 1.05, 48);
  bigBoreGeo.rotateX(Math.PI / 2);
  const bigBoreMesh = new THREE.Mesh(bigBoreGeo, darkMat);
  bigBoreMesh.position.y = -c2cLength / 2;
  group.add(bigBoreMesh);

  // Big End Split Line & Rod Bolts
  const bolt1Geo = new THREE.CylinderGeometry(4, 4, bigWidth * 1.2, 16);
  bolt1Geo.rotateX(Math.PI / 2);
  const bolt1 = new THREE.Mesh(bolt1Geo, createCADMaterial('#f8fafc', 0.2, 0.9));
  bolt1.position.set(-bigEndOuterRadius * 0.75, -c2cLength / 2, 0);
  group.add(bolt1);

  const bolt2 = bolt1.clone();
  bolt2.position.set(bigEndOuterRadius * 0.75, -c2cLength / 2, 0);
  group.add(bolt2);

  // Small End Pin Eye
  const smallEndOuterRadius = (smallBore / 2) + 8;
  const smallEndGeo = new THREE.CylinderGeometry(smallEndOuterRadius, smallEndOuterRadius, smallWidth, 48);
  smallEndGeo.rotateX(Math.PI / 2);
  const smallEndMesh = new THREE.Mesh(smallEndGeo, steelMat);
  smallEndMesh.position.y = c2cLength / 2;
  group.add(smallEndMesh);

  // Small End Bronze Bushing
  const smallBushingGeo = new THREE.CylinderGeometry(smallBore / 2, smallBore / 2, smallWidth * 1.02, 32);
  smallBushingGeo.rotateX(Math.PI / 2);
  const smallBushingMesh = new THREE.Mesh(smallBushingGeo, bronzeMat);
  smallBushingMesh.position.y = c2cLength / 2;
  group.add(smallBushingMesh);

  // H-Beam / I-Beam Shank Connecting Column
  const shankLength = c2cLength - bigEndOuterRadius - smallEndOuterRadius + 10;
  const shankGeo = new THREE.BoxGeometry(beamWidth, shankLength, 12);
  const shankMesh = new THREE.Mesh(shankGeo, steelMat);
  shankMesh.position.y = 0;
  group.add(shankMesh);

  // H-Beam Flanges / Web Recess
  const recessGeo = new THREE.BoxGeometry(beamWidth * 0.65, shankLength * 0.85, 13);
  const recessMesh = new THREE.Mesh(recessGeo, darkMat);
  recessMesh.position.y = 0;
  group.add(recessMesh);

  return group;
}

// 14. MULTI-THROW ENGINE CRANKSHAFT 3D GENERATOR
export function generateEngineCrankshaft3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineCrankshaft';
  const p = part.parameters;
  const mainDia = Number(p.main_journal_diameter || 55);
  const rodDia = Number(p.rod_journal_diameter || 48);
  const stroke = Number(p.stroke || 80);
  const throwCount = Number(p.throws || p.cylinders || 4);
  const totalLength = Number(p.total_length || 420);
  const crankRadius = stroke / 2;

  const crankMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.22, 0.9);
  const darkWebMat = createCADMaterial('#1e293b', 0.5, 0.7);

  const mainRadius = mainDia / 2;
  const rodRadius = rodDia / 2;
  const sectionLen = (totalLength - 80) / throwCount;

  let currentZ = -totalLength / 2;

  // Front Snout (Timing gear & pulley seat with keyway)
  const snoutLen = 40;
  const snoutGeo = new THREE.CylinderGeometry(mainRadius * 0.7, mainRadius * 0.7, snoutLen, 48);
  snoutGeo.rotateX(Math.PI / 2);
  const snoutMesh = new THREE.Mesh(snoutGeo, crankMat);
  snoutMesh.position.z = currentZ + snoutLen / 2;
  group.add(snoutMesh);
  currentZ += snoutLen;

  // Generate Multi-Throw Crankpin & Counterweight Units
  const angles = throwCount === 4 ? [0, Math.PI, Math.PI, 0] : [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

  for (let i = 0; i < throwCount; i++) {
    // 1. Main Journal
    const mainJLen = 22;
    const mainJGeo = new THREE.CylinderGeometry(mainRadius, mainRadius, mainJLen, 48);
    mainJGeo.rotateX(Math.PI / 2);
    const mainJMesh = new THREE.Mesh(mainJGeo, crankMat);
    mainJMesh.position.z = currentZ + mainJLen / 2;
    group.add(mainJMesh);
    currentZ += mainJLen;

    const angle = angles[i % angles.length];
    const offX = Math.cos(angle) * crankRadius;
    const offY = Math.sin(angle) * crankRadius;

    // 2. Front Counterweight Web
    const webGeo = new THREE.BoxGeometry(mainDia * 1.6, crankRadius * 2.4, 14);
    const webMesh = new THREE.Mesh(webGeo, darkWebMat);
    webMesh.position.set(-offX * 0.6, -offY * 0.6, currentZ + 7);
    group.add(webMesh);
    currentZ += 14;

    // 3. Offset Crankpin (Connecting Rod Journal)
    const pinLen = 24;
    const pinGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, pinLen, 48);
    pinGeo.rotateX(Math.PI / 2);
    const pinMesh = new THREE.Mesh(pinGeo, crankMat);
    pinMesh.position.set(offX, offY, currentZ + pinLen / 2);
    group.add(pinMesh);
    currentZ += pinLen;

    // 4. Rear Counterweight Web
    const web2Mesh = webMesh.clone();
    web2Mesh.position.set(-offX * 0.6, -offY * 0.6, currentZ + 7);
    group.add(web2Mesh);
    currentZ += 14;
  }

  // Rear Main Journal & Flywheel Flange
  const rearJLen = 25;
  const rearJGeo = new THREE.CylinderGeometry(mainRadius, mainRadius, rearJLen, 48);
  rearJGeo.rotateX(Math.PI / 2);
  const rearJMesh = new THREE.Mesh(rearJGeo, crankMat);
  rearJMesh.position.z = currentZ + rearJLen / 2;
  group.add(rearJMesh);
  currentZ += rearJLen;

  // Flywheel Flange with 8-bolt circle
  const flangeDia = mainDia * 1.8;
  const flangeGeo = new THREE.CylinderGeometry(flangeDia / 2, flangeDia / 2, 15, 64);
  flangeGeo.rotateX(Math.PI / 2);
  const flangeMesh = new THREE.Mesh(flangeGeo, crankMat);
  flangeMesh.position.z = currentZ + 7.5;
  group.add(flangeMesh);

  // 8x Flywheel Bolt Holes
  for (let b = 0; b < 8; b++) {
    const bAng = (b * Math.PI * 2) / 8;
    const bRad = (flangeDia / 2) * 0.72;
    const bGeo = new THREE.CylinderGeometry(4, 4, 16, 16);
    bGeo.rotateX(Math.PI / 2);
    const bMesh = new THREE.Mesh(bGeo, darkWebMat);
    bMesh.position.set(Math.cos(bAng) * bRad, Math.sin(bAng) * bRad, currentZ + 7.5);
    group.add(bMesh);
  }

  return group;
}

// 15. DOHC MULTI-LOBE CAMSHAFT 3D GENERATOR
export function generateEngineCamshaft3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineCamshaft';
  const p = part.parameters;
  const shaftDia = Number(p.shaft_diameter || 28);
  const totalLength = Number(p.total_length || 380);
  const lobeCount = Number(p.lobe_count || 8);
  const lobeLift = Number(p.lobe_lift || 9.5);
  const baseRadius = shaftDia / 2 + 6;

  const camMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.2, 0.92);
  const groundLobeMat = createCADMaterial('#f8fafc', 0.15, 0.95);

  // Main Core Shaft
  const shaftGeo = new THREE.CylinderGeometry(shaftDia / 2, shaftDia / 2, totalLength, 48);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, camMat);
  group.add(shaftMesh);

  // Timing Drive Sprocket Flange (Front)
  const flangeGeo = new THREE.CylinderGeometry(shaftDia * 1.2, shaftDia * 1.2, 12, 48);
  flangeGeo.rotateX(Math.PI / 2);
  const flangeMesh = new THREE.Mesh(flangeGeo, camMat);
  flangeMesh.position.z = -totalLength / 2 + 10;
  group.add(flangeMesh);

  // Generate Asymmetric Egg-Profile Cam Lobes
  const lobeSpan = (totalLength - 60) / lobeCount;
  const startZ = -totalLength / 2 + 35;

  for (let i = 0; i < lobeCount; i++) {
    const lobeZ = startZ + i * lobeSpan;
    const angle = (i * 1.1) % (Math.PI * 2);

    // Base circle portion
    const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 14, 32);
    baseGeo.rotateX(Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeo, groundLobeMat);
    baseMesh.position.z = lobeZ;
    group.add(baseMesh);

    // High Lift Cam Nose (offset cylinder/wedge)
    const noseGeo = new THREE.CylinderGeometry(baseRadius * 0.45, baseRadius * 0.45, 14, 32);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, groundLobeMat);
    const noseX = Math.cos(angle) * lobeLift;
    const noseY = Math.sin(angle) * lobeLift;
    noseMesh.position.set(noseX, noseY, lobeZ);
    group.add(noseMesh);
  }

  return group;
}

// 16. TURBOCHARGER COMPRESSOR IMPELLER 3D GENERATOR
export function generateTurbochargerImpeller3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TurbochargerImpeller';
  const p = part.parameters;
  const exducerDia = Number(p.exducer_diameter || p.outer_diameter || 76);
  const inducerDia = Number(p.inducer_diameter || 52);
  const hubHeight = Number(p.height || 38);
  const bladeCount = Number(p.blade_count || 6); // 6 full + 6 splitter blades
  const boreDia = Number(p.bore_diameter || 8);

  const titaniumMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.25, 0.88);
  const bladeMat = createCADMaterial('#f1f5f9', 0.2, 0.92);

  // Aerodynamic Conical Center Hub
  const hubGeo = new THREE.CylinderGeometry(inducerDia * 0.35, exducerDia / 2, hubHeight, 64);
  const hubMesh = new THREE.Mesh(hubGeo, titaniumMat);
  group.add(hubMesh);

  // Central Shaft Bore
  const boreGeo = new THREE.CylinderGeometry(boreDia / 2, boreDia / 2, hubHeight * 1.05, 32);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.5, 0.5));
  group.add(boreMesh);

  // Base Backplate
  const backplateGeo = new THREE.CylinderGeometry(exducerDia / 2, exducerDia / 2, 4, 64);
  const backplateMesh = new THREE.Mesh(backplateGeo, titaniumMat);
  backplateMesh.position.y = -hubHeight / 2 + 2;
  group.add(backplateMesh);

  // Swept Aerodynamic Full Blades & Splitter Blades
  for (let b = 0; b < bladeCount; b++) {
    const angle = (b * Math.PI * 2) / bladeCount;

    // Full Primary Swept Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(inducerDia * 0.35, hubHeight / 2);
    bladeShape.quadraticCurveTo(inducerDia * 0.45, 0, exducerDia / 2, -hubHeight / 2 + 3);
    bladeShape.lineTo(exducerDia / 2 - 4, -hubHeight / 2 + 3);
    bladeShape.quadraticCurveTo(inducerDia * 0.4, 0, inducerDia * 0.35 - 2, hubHeight / 2);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4 });
    bladeGeo.center();
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.rotation.y = angle;
    bladeMesh.rotation.z = -0.15; // Aerodynamic backward sweep
    group.add(bladeMesh);

    // Secondary Splitter Blade (Starts 30% down from inducer)
    const splitterAngle = angle + (Math.PI / bladeCount);
    const splitterShape = new THREE.Shape();
    splitterShape.moveTo(inducerDia * 0.42, hubHeight * 0.2);
    splitterShape.quadraticCurveTo(inducerDia * 0.48, 0, exducerDia / 2, -hubHeight / 2 + 3);
    splitterShape.lineTo(exducerDia / 2 - 4, -hubHeight / 2 + 3);
    splitterShape.quadraticCurveTo(inducerDia * 0.42, 0, inducerDia * 0.42 - 2, hubHeight * 0.2);
    splitterShape.closePath();

    const splitterGeo = new THREE.ExtrudeGeometry(splitterShape, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3 });
    splitterGeo.center();
    const splitterMesh = new THREE.Mesh(splitterGeo, bladeMat);
    splitterMesh.rotation.y = splitterAngle;
    splitterMesh.rotation.z = -0.18;
    group.add(splitterMesh);
  }

  return group;
}

// 17. ENGINE FLYWHEEL WITH STARTER RING GEAR 3D GENERATOR
export function generateEngineFlywheel3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineFlywheel';
  const p = part.parameters;
  const outerDia = Number(p.outer_diameter || 280);
  const thickness = Number(p.thickness || 32);
  const ringTeeth = Number(p.ring_teeth || 110);
  const boreDia = Number(p.bore_diameter || 36);
  const pcd = Number(p.pitch_circle_diameter || 75);

  const castIronMat = createCADMaterial(part.material?.color || '#64748b', 0.4, 0.7);
  const ringGearMat = createCADMaterial('#f8fafc', 0.2, 0.95);
  const frictionFaceMat = createCADMaterial('#94a3b8', 0.15, 0.85);

  // Main Heavy Flywheel Rim & Web
  const rimGeo = new THREE.CylinderGeometry(outerDia / 2, outerDia / 2, thickness, 64);
  const rimMesh = new THREE.Mesh(rimGeo, castIronMat);
  group.add(rimMesh);

  // Recessed Clutch Friction Face
  const frictionFaceGeo = new THREE.CylinderGeometry((outerDia / 2) * 0.78, (outerDia / 2) * 0.78, 2, 64);
  const frictionMesh = new THREE.Mesh(frictionFaceGeo, frictionFaceMat);
  frictionMesh.position.y = thickness / 2 + 0.5;
  group.add(frictionMesh);

  // Outer Starter Ring Gear Teeth
  const toothCount = Math.min(72, ringTeeth);
  const toothRadius = (outerDia / 2) + 1.5;
  for (let t = 0; t < toothCount; t++) {
    const angle = (t * Math.PI * 2) / toothCount;
    const toothGeo = new THREE.BoxGeometry(2.5, thickness * 0.45, 3.5);
    const toothMesh = new THREE.Mesh(toothGeo, ringGearMat);
    toothMesh.position.set(Math.cos(angle) * toothRadius, -thickness * 0.25, Math.sin(angle) * toothRadius);
    toothMesh.rotation.y = -angle;
    group.add(toothMesh);
  }

  // Crankshaft 8-Bolt Hub Pattern
  for (let b = 0; b < 8; b++) {
    const bAngle = (b * Math.PI * 2) / 8;
    const bX = Math.cos(bAngle) * (pcd / 2);
    const bZ = Math.sin(bAngle) * (pcd / 2);
    const boltHoleGeo = new THREE.CylinderGeometry(5.5, 5.5, thickness * 1.1, 24);
    const boltHole = new THREE.Mesh(boltHoleGeo, createCADMaterial('#0f172a', 0.5, 0.5));
    boltHole.position.set(bX, 0, bZ);
    group.add(boltHole);
  }

  // Center Pilot Bearing Bore
  const boreGeo = new THREE.CylinderGeometry(boreDia / 2, boreDia / 2, thickness * 1.1, 32);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.5, 0.5));
  group.add(boreMesh);

  return group;
}

// 18. MULTI-VALVE ENGINE CYLINDER HEAD 3D GENERATOR
export function generateEngineCylinderHead3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineCylinderHead';
  const p = part.parameters;
  const length = Number(p.length || 380);
  const width = Number(p.width || 180);
  const height = Number(p.height || 110);
  const cylinders = Number(p.cylinders || 4);

  const aluCastMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.35, 0.75);
  const darkPortMat = createCADMaterial('#1e293b', 0.6, 0.4);
  const valveMat = createCADMaterial('#f8fafc', 0.2, 0.9);

  // Main Cylinder Head Cast Block
  const blockGeo = new THREE.BoxGeometry(width, height, length);
  const blockMesh = new THREE.Mesh(blockGeo, aluCastMat);
  group.add(blockMesh);

  // DOHC Cam Towers / Lifter Wells (Top Deck)
  const towerGeo = new THREE.CylinderGeometry(18, 18, length * 0.9, 32);
  towerGeo.rotateX(Math.PI / 2);
  const intakeCamMesh = new THREE.Mesh(towerGeo, aluCastMat);
  intakeCamMesh.position.set(-width * 0.25, height / 2 + 5, 0);
  group.add(intakeCamMesh);

  const exhaustCamMesh = new THREE.Mesh(towerGeo, aluCastMat);
  exhaustCamMesh.position.set(width * 0.25, height / 2 + 5, 0);
  group.add(exhaustCamMesh);

  // Cylinders Combustion Chambers & 4-Valve Arrays (Bottom Deck)
  const cylSpan = (length - 40) / cylinders;
  const startZ = -length / 2 + 25;

  for (let c = 0; c < cylinders; c++) {
    const cZ = startZ + c * cylSpan;

    // Combustion Chamber Dome
    const domeGeo = new THREE.CylinderGeometry(38, 38, 8, 32);
    const domeMesh = new THREE.Mesh(domeGeo, darkPortMat);
    domeMesh.position.set(0, -height / 2 + 4, cZ);
    group.add(domeMesh);

    // 2x Intake Valves (Larger Ø)
    const vInGeo = new THREE.CylinderGeometry(16, 16, 4, 24);
    const vIn1 = new THREE.Mesh(vInGeo, valveMat);
    vIn1.position.set(-16, -height / 2 + 2, cZ - 14);
    group.add(vIn1);
    const vIn2 = new THREE.Mesh(vInGeo, valveMat);
    vIn2.position.set(-16, -height / 2 + 2, cZ + 14);
    group.add(vIn2);

    // 2x Exhaust Valves (Smaller Ø)
    const vExGeo = new THREE.CylinderGeometry(13, 13, 4, 24);
    const vEx1 = new THREE.Mesh(vExGeo, valveMat);
    vEx1.position.set(16, -height / 2 + 2, cZ - 14);
    group.add(vEx1);
    const vEx2 = new THREE.Mesh(vExGeo, valveMat);
    vEx2.position.set(16, -height / 2 + 2, cZ + 14);
    group.add(vEx2);

    // Center Spark Plug / Direct Injector Bore
    const plugGeo = new THREE.CylinderGeometry(6, 6, 10, 16);
    const plugMesh = new THREE.Mesh(plugGeo, createCADMaterial('#0f172a', 0.5, 0.5));
    plugMesh.position.set(0, -height / 2 + 4, cZ);
    group.add(plugMesh);
  }

  return group;
}

// 19. CAST ENGINE CYLINDER BLOCK 3D GENERATOR
export function generateEngineCylinderBlock3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineCylinderBlock';
  const p = part.parameters;
  const boreDia = Number(p.bore_diameter || 85);
  const cylinders = Number(p.cylinders || 4);
  const deckHeight = Number(p.deck_height || p.height || 210);
  const length = Number(p.length || 420);
  const width = Number(p.width || 210);

  const blockMat = createCADMaterial(part.material?.color || '#475569', 0.4, 0.7);
  const linerMat = createCADMaterial('#94a3b8', 0.2, 0.9);

  // Main Cast Engine Block Solid
  const blockGeo = new THREE.BoxGeometry(width, deckHeight, length);
  const blockMesh = new THREE.Mesh(blockGeo, blockMat);
  group.add(blockMesh);

  // Bored Cylinders with Cast Iron Liners
  const cylSpan = (length - 40) / cylinders;
  const startZ = -length / 2 + 25;

  for (let i = 0; i < cylinders; i++) {
    const cZ = startZ + i * cylSpan;
    const boreGeo = new THREE.CylinderGeometry(boreDia / 2, boreDia / 2, deckHeight * 1.05, 48);
    const boreMesh = new THREE.Mesh(boreGeo, linerMat);
    boreMesh.position.set(0, 0, cZ);
    group.add(boreMesh);
  }

  return group;
}

// 18. GAS TURBINE ROTOR BLISK GENERATOR (High-Pressure Bladed Disc)
export function generateGasTurbineBlisk3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GasTurbineBlisk';
  const p = part.parameters;
  const matColor = part.material?.color || '#94a3b8';
  const bliskMat = createCADMaterial(matColor, 0.2, 0.9);
  const darkInconel = createCADMaterial('#475569', 0.35, 0.85);

  const outerDia = Number(p.outer_diameter || 260);
  const outerRadius = outerDia / 2;
  const hubDia = Number(p.hub_diameter || 160);
  const hubRadius = hubDia / 2;
  const boreDia = Number(p.bore_diameter || 45);
  const boreRadius = boreDia / 2;
  const bladeCount = Number(p.blade_count || 18);
  const discWidth = Number(p.disc_width || 42);

  // Central Disc Solid (revolved contour)
  const discGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, discWidth, 64);
  discGeo.rotateX(Math.PI / 2);
  const discMesh = new THREE.Mesh(discGeo, bliskMat);
  discMesh.castShadow = true;
  group.add(discMesh);

  // Central Bore hole
  const boreGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, discWidth + 4, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  group.add(boreMesh);

  // Fir-Tree Rim Platform
  const rimGeo = new THREE.CylinderGeometry(hubRadius + 6, hubRadius + 6, discWidth * 0.8, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, darkInconel);
  group.add(rimMesh);

  // Aerodynamic Turbine Aerofoil Blades
  const bladeSpan = outerRadius - (hubRadius + 6);
  const bladeChord = 28;

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i * 2 * Math.PI) / bladeCount;

    // Aerofoil cross-section shape
    const foilShape = new THREE.Shape();
    foilShape.moveTo(0, 0);
    foilShape.bezierCurveTo(bladeChord * 0.3, 4, bladeChord * 0.7, 5, bladeChord, 1);
    foilShape.bezierCurveTo(bladeChord * 0.8, -1, bladeChord * 0.4, -2, 0, 0);

    const bladeGeo = new THREE.ExtrudeGeometry(foilShape, {
      depth: bladeSpan,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.5,
      bevelThickness: 0.5,
    });

    const bladeMesh = new THREE.Mesh(bladeGeo, bliskMat);
    // Orient aerofoil along radial direction with aerodynamic stagger angle (32 deg)
    bladeMesh.rotation.z = angle;
    bladeMesh.rotation.y = 0.55; // stagger angle
    bladeMesh.position.set(
      Math.cos(angle) * (hubRadius + 6),
      Math.sin(angle) * (hubRadius + 6),
      -discWidth * 0.2
    );
    bladeMesh.castShadow = true;
    group.add(bladeMesh);
  }

  // Balancing Holes array
  for (let b = 0; b < 6; b++) {
    const bAngle = (b * 2 * Math.PI) / 6;
    const bGeo = new THREE.CylinderGeometry(4, 4, discWidth + 2, 16);
    bGeo.rotateX(Math.PI / 2);
    const bMesh = new THREE.Mesh(bGeo, createCADMaterial('#1e293b', 0.8, 0.2));
    bMesh.position.set(Math.cos(bAngle) * (hubRadius * 0.65), Math.sin(bAngle) * (hubRadius * 0.65), 0);
    group.add(bMesh);
  }

  return group;
}

// 19. ROOTS SUPERCHARGER TWIN-LOBE ROTOR GENERATOR
export function generateRootsSupercharger3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RootsSuperchargerRotor';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const rotorMat = createCADMaterial(matColor, 0.25, 0.85);
  const darkShaft = createCADMaterial('#334155', 0.4, 0.8);

  const outerDia = Number(p.outer_diameter || 92);
  const outerR = outerDia / 2;
  const lobeSpan = Number(p.length || 160);
  const shaftDia = Number(p.shaft_diameter || 24);
  const shaftR = shaftDia / 2;
  const twistAngle = Number(p.twist_angle || 60) * (Math.PI / 180); // 60 deg twist

  // Construct twin-lobe / tri-lobe cross section slices with progressive helical rotation
  const slices = 28;
  const sliceThickness = lobeSpan / slices;

  for (let s = 0; s < slices; s++) {
    const frac = s / (slices - 1);
    const currentZ = -lobeSpan / 2 + s * sliceThickness;
    const currentRot = (frac - 0.5) * twistAngle;

    // Twin-lobe figure-8 / oval lobe shape
    const lobeShape = new THREE.Shape();
    const w = outerR;
    const h = outerR * 0.52;

    lobeShape.moveTo(0, h);
    lobeShape.bezierCurveTo(w, h * 0.9, w, -h * 0.9, 0, -h);
    lobeShape.bezierCurveTo(-w, -h * 0.9, -w, h * 0.9, 0, h);

    const sliceGeo = new THREE.ExtrudeGeometry(lobeShape, {
      depth: sliceThickness * 1.05,
      bevelEnabled: false,
    });

    const sliceMesh = new THREE.Mesh(sliceGeo, rotorMat);
    sliceMesh.position.z = currentZ;
    sliceMesh.rotation.z = currentRot;
    sliceMesh.castShadow = true;
    group.add(sliceMesh);
  }

  // Central Drive Shaft through ends
  const totalShaftLen = lobeSpan + 70;
  const shaftGeo = new THREE.CylinderGeometry(shaftR, shaftR, totalShaftLen, 32);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, darkShaft);
  shaftMesh.castShadow = true;
  group.add(shaftMesh);

  // Drive End Timing Gear / Splines
  const gearGeo = new THREE.CylinderGeometry(shaftR * 1.5, shaftR * 1.5, 18, 24);
  gearGeo.rotateX(Math.PI / 2);
  const gearMesh = new THREE.Mesh(gearGeo, darkShaft);
  gearMesh.position.z = lobeSpan / 2 + 20;
  group.add(gearMesh);

  return group;
}

// 20. ENGINE POPPET VALVE GENERATOR (Combustion Valve & Seat)
export function generateEngineValve3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EnginePoppetValve';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const valveMat = createCADMaterial(matColor, 0.2, 0.9);
  const seatMat = createCADMaterial('#f59e0b', 0.3, 0.7); // Ground 45 deg seating face

  const headDia = Number(p.head_diameter || 34);
  const headR = headDia / 2;
  const stemDia = Number(p.stem_diameter || 6);
  const stemR = stemDia / 2;
  const totalLength = Number(p.total_length || 95);

  // 1. Valve Head Disk with 45° Chamfer Seat
  const headDiskGeo = new THREE.CylinderGeometry(headR, headR - 2.5, 3.5, 48);
  headDiskGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headDiskGeo, valveMat);
  headMesh.position.z = -totalLength / 2;
  group.add(headMesh);

  // 45° Precision Ground Seating Ring
  const seatRingGeo = new THREE.CylinderGeometry(headR, headR - 1.8, 1.8, 48);
  seatRingGeo.rotateX(Math.PI / 2);
  const seatMesh = new THREE.Mesh(seatRingGeo, seatMat);
  seatMesh.position.z = -totalLength / 2 + 2.5;
  group.add(seatMesh);

  // 2. Tulip Curved Transition
  const tulipGeo = new THREE.CylinderGeometry(stemR * 1.8, headR - 1.8, 14, 32);
  tulipGeo.rotateX(Math.PI / 2);
  const tulipMesh = new THREE.Mesh(tulipGeo, valveMat);
  tulipMesh.position.z = -totalLength / 2 + 10;
  group.add(tulipMesh);

  // 3. Stem Column
  const stemLen = totalLength - 20;
  const stemGeo = new THREE.CylinderGeometry(stemR, stemR, stemLen, 32);
  stemGeo.rotateX(Math.PI / 2);
  const stemMesh = new THREE.Mesh(stemGeo, valveMat);
  stemMesh.position.z = -totalLength / 2 + 18 + stemLen / 2;
  stemMesh.castShadow = true;
  group.add(stemMesh);

  // 4. Keeper / Collet Lock Grooves at Tip
  const tipZ = totalLength / 2 - 3;
  const grooveGeo = new THREE.CylinderGeometry(stemR * 0.75, stemR * 0.75, 2.5, 24);
  grooveGeo.rotateX(Math.PI / 2);
  const grooveMesh = new THREE.Mesh(grooveGeo, createCADMaterial('#1e293b', 0.6, 0.4));
  grooveMesh.position.z = tipZ;
  group.add(grooveMesh);

  // Hardened Tip Cap
  const tipGeo = new THREE.CylinderGeometry(stemR * 1.05, stemR * 1.05, 3, 24);
  tipGeo.rotateX(Math.PI / 2);
  const tipMesh = new THREE.Mesh(tipGeo, valveMat);
  tipMesh.position.z = totalLength / 2;
  group.add(tipMesh);

  return group;
}

// 21. ROBOTIC CYCLOIDAL DRIVE REDUCER GENERATOR
export function generateCycloidalDrive3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CycloidalDrive';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const discMat = createCADMaterial(matColor, 0.25, 0.85);
  const pinMat = createCADMaterial('#38bdf8', 0.2, 0.9);
  const darkCase = createCADMaterial('#334155', 0.4, 0.7);

  const ringDia = Number(p.ring_diameter || 130);
  const ringR = ringDia / 2;
  const pinCount = Number(p.pin_count || 12);
  const lobeCount = Number(p.lobe_count || pinCount - 1);
  const thickness = Number(p.thickness || 18);
  const discR = ringR - 8;

  // 1. Outer Pin Ring Housing
  const caseShape = new THREE.Shape();
  caseShape.absarc(0, 0, ringR + 14, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, ringR - 6, 0, Math.PI * 2, true);
  caseShape.holes.push(holePath);
  const caseExtrude = new THREE.ExtrudeGeometry(caseShape, { depth: thickness + 6, bevelEnabled: true, bevelThickness: 1, bevelSize: 1 });
  caseExtrude.center();
  const caseMesh = new THREE.Mesh(caseExtrude, darkCase);
  group.add(caseMesh);

  // 2. Outer Ring Bearing Pins
  const pinRadius = 4.5;
  for (let i = 0; i < pinCount; i++) {
    const angle = (i * 2 * Math.PI) / pinCount;
    const pinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius, thickness + 4, 24);
    pinGeo.rotateX(Math.PI / 2);
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.set(Math.cos(angle) * ringR, Math.sin(angle) * ringR, 0);
    group.add(pinMesh);
  }

  // 3. Precision Cycloidal Lobe Disc (Mathematical Epotrochoid contour)
  const cycShape = new THREE.Shape();
  const points = 180;
  for (let j = 0; j <= points; j++) {
    const t = (j * 2 * Math.PI) / points;
    const r = discR + 3.8 * Math.cos(lobeCount * t);
    const x = r * Math.cos(t) + 2.5; // eccentric offset
    const y = r * Math.sin(t);
    if (j === 0) cycShape.moveTo(x, y);
    else cycShape.lineTo(x, y);
  }
  cycShape.closePath();

  const discGeo = new THREE.ExtrudeGeometry(cycShape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8 });
  discGeo.center();
  const discMesh = new THREE.Mesh(discGeo, discMat);
  discMesh.position.set(2.5, 0, 0); // eccentric offset
  discMesh.castShadow = true;
  group.add(discMesh);

  // 4. Output Torque Transfer Bores & Roller Pins (6 arrayed holes)
  const holeR = 11;
  for (let h = 0; h < 6; h++) {
    const hAngle = (h * 2 * Math.PI) / 6;
    const hDist = discR * 0.52;
    const boreGeo = new THREE.CylinderGeometry(holeR, holeR, thickness + 1, 24);
    boreGeo.rotateX(Math.PI / 2);
    const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
    boreMesh.position.set(2.5 + Math.cos(hAngle) * hDist, Math.sin(hAngle) * hDist, 0);
    group.add(boreMesh);

    // Inner Output Drive Pin
    const outPinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius, thickness + 8, 24);
    outPinGeo.rotateX(Math.PI / 2);
    const outPinMesh = new THREE.Mesh(outPinGeo, pinMat);
    outPinMesh.position.set(Math.cos(hAngle) * hDist, Math.sin(hAngle) * hDist, 0);
    group.add(outPinMesh);
  }

  // 5. Central Eccentric Bearing Hub
  const hubGeo = new THREE.CylinderGeometry(18, 18, thickness + 10, 32);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, darkCase);
  group.add(hubMesh);

  return group;
}

// 22. MULTI-PLATE WET CLUTCH ASSEMBLY GENERATOR
export function generateClutchPack3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ClutchPack';
  const p = part.parameters;
  const matColor = part.material?.color || '#94a3b8';
  const basketMat = createCADMaterial('#475569', 0.3, 0.8);
  const frictionMat = createCADMaterial('#b45309', 0.6, 0.4); // Bronze/Organic friction material
  const steelMat = createCADMaterial(matColor, 0.2, 0.9);

  const outerDia = Number(p.outer_diameter || 160);
  const outerR = outerDia / 2;
  const innerDia = Number(p.inner_diameter || 70);
  const innerR = innerDia / 2;
  const discCount = Number(p.disc_count || 6);

  // Outer Clutch Basket Drum with cooling vents
  const basketGeo = new THREE.CylinderGeometry(outerR + 4, outerR + 4, discCount * 9 + 18, 48, 1, true);
  basketGeo.rotateX(Math.PI / 2);
  const basketMesh = new THREE.Mesh(basketGeo, basketMat);
  group.add(basketMesh);

  // Inner Splined Hub
  const hubGeo = new THREE.CylinderGeometry(innerR, innerR, discCount * 9 + 25, 32);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, basketMat);
  group.add(hubMesh);

  // Stack of Alternating Friction Discs & Steel Plates
  for (let d = 0; d < discCount; d++) {
    const zPos = -((discCount * 9) / 2) + d * 9;

    // Friction Disc (outer tabs)
    const fRingGeo = new THREE.RingGeometry(innerR + 4, outerR - 2, 48);
    const fMesh = new THREE.Mesh(fRingGeo, frictionMat);
    fMesh.position.z = zPos;
    group.add(fMesh);

    // Steel Drive Plate (inner splines)
    const sRingGeo = new THREE.RingGeometry(innerR + 1, outerR - 5, 48);
    const sMesh = new THREE.Mesh(sRingGeo, steelMat);
    sMesh.position.z = zPos + 4;
    group.add(sMesh);
  }

  // Pressure Plate & Clutch Springs
  const pPlateGeo = new THREE.CylinderGeometry(outerR, outerR, 6, 48);
  pPlateGeo.rotateX(Math.PI / 2);
  const pPlateMesh = new THREE.Mesh(pPlateGeo, steelMat);
  pPlateMesh.position.z = (discCount * 9) / 2 + 8;
  group.add(pPlateMesh);

  for (let c = 0; c < 5; c++) {
    const cAngle = (c * 2 * Math.PI) / 5;
    const sprGeo = new THREE.CylinderGeometry(6, 6, 16, 16);
    sprGeo.rotateX(Math.PI / 2);
    const sprMesh = new THREE.Mesh(sprGeo, createCADMaterial('#38bdf8', 0.3, 0.8));
    sprMesh.position.set(Math.cos(cAngle) * (outerR * 0.6), Math.sin(cAngle) * (outerR * 0.6), (discCount * 9) / 2 + 14);
    group.add(sprMesh);
  }

  return group;
}

// 23. UNIVERSAL JOINT (CARDAN SPIDER CROSS & YOKES)
export function generateUniversalJoint3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'UniversalJoint';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const spiderMat = createCADMaterial('#f59e0b', 0.25, 0.85); // Hardened alloy spider
  const yokeMat = createCADMaterial(matColor, 0.3, 0.8);

  const span = Number(p.spider_span || 90);
  const trunnionDia = Number(p.trunnion_diameter || 26);
  const trunnionR = trunnionDia / 2;

  // 1. Central 4-Way Cross Spider
  // Horizontal Trunnion Arm (X-axis)
  const armXGeo = new THREE.CylinderGeometry(trunnionR, trunnionR, span, 32);
  armXGeo.rotateZ(Math.PI / 2);
  const armX = new THREE.Mesh(armXGeo, spiderMat);
  group.add(armX);

  // Vertical Trunnion Arm (Y-axis)
  const armYGeo = new THREE.CylinderGeometry(trunnionR, trunnionR, span, 32);
  const armY = new THREE.Mesh(armYGeo, spiderMat);
  group.add(armY);

  // 4 Bearing Caps on spider tips
  const capR = trunnionR * 1.15;
  const capLen = 14;
  const capOffsets = [
    { x: span / 2, y: 0, z: 0, rx: 0, ry: Math.PI / 2 },
    { x: -span / 2, y: 0, z: 0, rx: 0, ry: Math.PI / 2 },
    { x: 0, y: span / 2, z: 0, rx: Math.PI / 2, ry: 0 },
    { x: 0, y: -span / 2, z: 0, rx: Math.PI / 2, ry: 0 },
  ];

  capOffsets.forEach((pos) => {
    const cGeo = new THREE.CylinderGeometry(capR, capR, capLen, 24);
    cGeo.rotateX(pos.rx);
    cGeo.rotateY(pos.ry);
    const cMesh = new THREE.Mesh(cGeo, createCADMaterial('#334155', 0.3, 0.8));
    cMesh.position.set(pos.x, pos.y, pos.z);
    group.add(cMesh);
  });

  // 2. Input Drive Yoke (U-Fork along X-axis, connected at -Z)
  const yoke1 = new THREE.Group();
  const fork1Geo = new THREE.BoxGeometry(18, span + 18, 28);
  const fork1Mesh = new THREE.Mesh(fork1Geo, yokeMat);
  fork1Mesh.position.set(0, 0, -32);
  yoke1.add(fork1Mesh);

  const hub1Geo = new THREE.CylinderGeometry(trunnionR * 1.6, trunnionR * 1.6, 45, 32);
  hub1Geo.rotateX(Math.PI / 2);
  const hub1Mesh = new THREE.Mesh(hub1Geo, yokeMat);
  hub1Mesh.position.set(0, 0, -55);
  yoke1.add(hub1Mesh);
  group.add(yoke1);

  // 3. Output Drive Yoke (U-Fork along Y-axis, connected at +Z)
  const yoke2 = new THREE.Group();
  const fork2Geo = new THREE.BoxGeometry(span + 18, 18, 28);
  const fork2Mesh = new THREE.Mesh(fork2Geo, yokeMat);
  fork2Mesh.position.set(0, 0, 32);
  yoke2.add(fork2Mesh);

  const hub2Geo = new THREE.CylinderGeometry(trunnionR * 1.6, trunnionR * 1.6, 45, 32);
  hub2Geo.rotateX(Math.PI / 2);
  const hub2Mesh = new THREE.Mesh(hub2Geo, yokeMat);
  hub2Mesh.position.set(0, 0, 55);
  yoke2.add(hub2Mesh);
  group.add(yoke2);

  return group;
}

// 24. GENEVA MECHANISM INDEXING WHEEL GENERATOR
export function generateGenevaMechanism3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GenevaMechanism';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const wheelMat = createCADMaterial(matColor, 0.25, 0.85);
  const driverMat = createCADMaterial('#38bdf8', 0.2, 0.9);
  const baseMat = createCADMaterial('#1e293b', 0.5, 0.5);

  const slotCount = Number(p.slot_count || 6);
  const wheelDia = Number(p.wheel_diameter || 120);
  const wheelR = wheelDia / 2;
  const thickness = 14;

  // 1. Geneva Star Wheel with Radial Slots and Concave Locking Arcs
  const genevaGroup = new THREE.Group();
  const discGeo = new THREE.CylinderGeometry(wheelR, wheelR, thickness, 64);
  discGeo.rotateX(Math.PI / 2);
  const discMesh = new THREE.Mesh(discGeo, wheelMat);
  genevaGroup.add(discMesh);

  // Radial Milled Drive Slots
  for (let s = 0; s < slotCount; s++) {
    const sAngle = (s * 2 * Math.PI) / slotCount;
    const slotGeo = new THREE.BoxGeometry(9, wheelR * 0.65, thickness + 2);
    const slotMesh = new THREE.Mesh(slotGeo, createCADMaterial('#0f172a', 0.8, 0.2));
    slotMesh.position.set(Math.cos(sAngle) * (wheelR * 0.6), Math.sin(sAngle) * (wheelR * 0.6), 0);
    slotMesh.rotation.z = sAngle + Math.PI / 2;
    genevaGroup.add(slotMesh);
  }

  // Central Pivot Bore
  const boreGeo = new THREE.CylinderGeometry(12, 12, thickness + 4, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  genevaGroup.add(boreMesh);
  group.add(genevaGroup);

  // 2. Input Driver Crank with Driving Pin
  const driverCenterOffset = wheelR * 1.15;
  const driverGroup = new THREE.Group();
  driverGroup.position.set(driverCenterOffset, 0, 0);

  const crankDiscGeo = new THREE.CylinderGeometry(wheelR * 0.45, wheelR * 0.45, thickness * 0.75, 48);
  crankDiscGeo.rotateX(Math.PI / 2);
  const crankMesh = new THREE.Mesh(crankDiscGeo, driverMat);
  driverGroup.add(crankMesh);

  // Hardened Drive Pin that engages star slot
  const pinGeo = new THREE.CylinderGeometry(4, 4, thickness * 1.4, 24);
  pinGeo.rotateX(Math.PI / 2);
  const pinMesh = new THREE.Mesh(pinGeo, createCADMaterial('#f59e0b', 0.2, 0.9));
  pinMesh.position.set(-wheelR * 0.32, 0, thickness * 0.3);
  driverGroup.add(pinMesh);

  group.add(driverGroup);

  return group;
}

// ==========================================
// ADDITIONAL MECHANICAL GENERATORS (CATEGORIES 1-7)
// ==========================================

// 1. Hollow Shaft
export function generateHollowShaft3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HollowShaftPart';
  const p = part.parameters;
  const matColor = part.material?.color || '#cbd5e1';
  const mat = createCADMaterial(matColor, 0.25, 0.88);
  const darkBoreMat = createCADMaterial('#0f172a', 0.8, 0.2);

  const length = Number(p.length || p.total_length || 220);
  const outerDia = Number(p.outer_diameter || p.main_diameter || 60);
  const innerDia = Number(p.inner_diameter || p.bore_diameter || 32);

  // Outer Cylinder
  const outerGeo = new THREE.CylinderGeometry(outerDia / 2, outerDia / 2, length, 64);
  outerGeo.rotateX(Math.PI / 2);
  const outerMesh = new THREE.Mesh(outerGeo, mat);
  group.add(outerMesh);

  // Inner Hollow Core Cutout visualizer
  const boreGeo = new THREE.CylinderGeometry(innerDia / 2, innerDia / 2, length + 2, 48);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, darkBoreMat);
  group.add(boreMesh);

  // End Chamfers
  const chamferGeo = new THREE.TorusGeometry(outerDia / 2 - 1, 1.2, 16, 48);
  const chamfer1 = new THREE.Mesh(chamferGeo, mat);
  chamfer1.position.z = length / 2;
  const chamfer2 = new THREE.Mesh(chamferGeo, mat);
  chamfer2.position.z = -length / 2;
  group.add(chamfer1);
  group.add(chamfer2);

  return group;
}

// 2. Axle (Wheel Drive Axle with Flange Hub)
export function generateAxle3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VehicleAxlePart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.3, 0.85);

  const length = Number(p.total_length || p.length || 350);
  const shaftDia = Number(p.shaft_diameter || 45);
  const flangeDia = Number(p.flange_diameter || 140);
  const flangeThick = Number(p.flange_thickness || 18);

  // Main Axle Shaft
  const shaftGeo = new THREE.CylinderGeometry(shaftDia / 2, shaftDia / 2, length, 48);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, mat);
  shaftMesh.position.z = -flangeThick / 2;
  group.add(shaftMesh);

  // Wheel Hub Flange
  const flangeGeo = new THREE.CylinderGeometry(flangeDia / 2, flangeDia / 2, flangeThick, 64);
  flangeGeo.rotateX(Math.PI / 2);
  const flangeMesh = new THREE.Mesh(flangeGeo, mat);
  flangeMesh.position.z = length / 2 - flangeThick / 2;
  group.add(flangeMesh);

  // Wheel Stud Array (5-lug or 6-lug)
  const studCount = Number(p.stud_count || 5);
  const pcd = Number(p.pitch_circle_diameter || 108);
  for (let i = 0; i < studCount; i++) {
    const angle = (i * 2 * Math.PI) / studCount;
    const studGeo = new THREE.CylinderGeometry(6, 6, 25, 24);
    studGeo.rotateX(Math.PI / 2);
    const studMesh = new THREE.Mesh(studGeo, createCADMaterial('#f59e0b', 0.2, 0.9));
    studMesh.position.set(Math.cos(angle) * (pcd / 2), Math.sin(angle) * (pcd / 2), length / 2 + 10);
    group.add(studMesh);
  }

  // Splined Drive End (Opposite End)
  const splineGeo = new THREE.CylinderGeometry((shaftDia * 0.92) / 2, (shaftDia * 0.92) / 2, 45, 32);
  splineGeo.rotateX(Math.PI / 2);
  const splineMesh = new THREE.Mesh(splineGeo, createCADMaterial('#334155', 0.5, 0.6));
  splineMesh.position.z = -length / 2 + 22.5;
  group.add(splineMesh);

  return group;
}

// 3. Spindle (Machine Tool High-Speed Spindle with Morse Taper)
export function generateSpindle3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MachineSpindlePart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#e2e8f0', 0.2, 0.9);

  const length = Number(p.total_length || 280);
  const mainDia = Number(p.main_diameter || 70);
  const noseDia = Number(p.nose_diameter || 90);
  const taperLen = Number(p.taper_length || 60);

  // Spindle Main Body
  const bodyGeo = new THREE.CylinderGeometry(mainDia / 2, mainDia / 2, length - taperLen - 40, 48);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat);
  bodyMesh.position.z = -20;
  group.add(bodyMesh);

  // Precision Nose with Collet Taper
  const noseGeo = new THREE.CylinderGeometry(noseDia / 2, mainDia / 2, 40, 48);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, mat);
  noseMesh.position.z = length / 2 - 20;
  group.add(noseMesh);

  // Internal Tooling Taper Socket
  const taperGeo = new THREE.ConeGeometry(24, taperLen, 32);
  taperGeo.rotateX(-Math.PI / 2);
  const taperMesh = new THREE.Mesh(taperGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  taperMesh.position.z = length / 2 - 10;
  group.add(taperMesh);

  // Labyrinth Seal Grooves
  for (let g = 0; g < 3; g++) {
    const sealGeo = new THREE.TorusGeometry(mainDia / 2 + 0.5, 1.5, 16, 48);
    const sealMesh = new THREE.Mesh(sealGeo, createCADMaterial('#475569', 0.5, 0.5));
    sealMesh.position.z = length / 2 - 50 - g * 8;
    group.add(sealMesh);
  }

  return group;
}

// 4. Torsion Shaft (Splined Torsion Bar)
export function generateTorsionShaft3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TorsionShaftPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.25, 0.85);

  const length = Number(p.total_length || 320);
  const rodDia = Number(p.rod_diameter || 28);
  const headDia = Number(p.head_diameter || 42);
  const headLen = Number(p.head_length || 40);

  // Central Spring Rod
  const rodGeo = new THREE.CylinderGeometry(rodDia / 2, rodDia / 2, length - headLen * 2, 48);
  rodGeo.rotateX(Math.PI / 2);
  const rodMesh = new THREE.Mesh(rodGeo, mat);
  group.add(rodMesh);

  // Dual Splined Heads
  [-1, 1].forEach((dir) => {
    const headGeo = new THREE.CylinderGeometry(headDia / 2, headDia / 2, headLen, 32);
    headGeo.rotateX(Math.PI / 2);
    const headMesh = new THREE.Mesh(headGeo, createCADMaterial('#334155', 0.4, 0.7));
    headMesh.position.z = dir * (length / 2 - headLen / 2);
    group.add(headMesh);

    // Taper Transition Neck
    const neckGeo = new THREE.CylinderGeometry(dir === 1 ? headDia / 2 : rodDia / 2, dir === 1 ? rodDia / 2 : headDia / 2, 15, 32);
    neckGeo.rotateX(Math.PI / 2);
    const neckMesh = new THREE.Mesh(neckGeo, mat);
    neckMesh.position.z = dir * (length / 2 - headLen - 7.5);
    group.add(neckMesh);
  });

  return group;
}

// 5. Helical Gear
export function generateHelicalGear3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HelicalGearPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.28, 0.85);

  const teeth = Math.max(10, Number(p.teeth_count || 28));
  const mod = Math.max(0.5, Number(p.module || 2.5));
  const faceW = Math.max(8, Number(p.face_width || 25));
  const boreDia = Math.max(0, Number(p.bore_diameter || 25));
  const helixAngle = Number(p.helix_angle || 20);

  const pitchR = (mod * teeth) / 2;
  const outerR = pitchR + mod;
  const rootR = Math.max(pitchR - 1.25 * mod, boreDia / 2 + 4);

  // Create Twisted Helical Slice Stack
  const slices = 12;
  const sliceH = faceW / slices;
  const totalTwistRad = (Math.tan((helixAngle * Math.PI) / 180) * faceW) / pitchR;

  for (let s = 0; s < slices; s++) {
    const shape = new THREE.Shape();
    const rot = (s / slices) * totalTwistRad;

    for (let i = 0; i < teeth; i++) {
      const a = (i * 2 * Math.PI) / teeth + rot;
      const step = (2 * Math.PI) / teeth;

      const r1 = rootR;
      const r2 = outerR;

      if (i === 0) shape.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      else shape.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);

      shape.lineTo(Math.cos(a + step * 0.25) * r2, Math.sin(a + step * 0.25) * r2);
      shape.lineTo(Math.cos(a + step * 0.55) * r2, Math.sin(a + step * 0.55) * r2);
      shape.lineTo(Math.cos(a + step * 0.8) * r1, Math.sin(a + step * 0.8) * r1);
    }
    shape.closePath();

    if (boreDia > 0) {
      const hole = new THREE.Path();
      hole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: sliceH, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -faceW / 2 + s * sliceH;
    group.add(mesh);
  }

  // Central Hub
  if (boreDia > 0) {
    const hubGeo = new THREE.CylinderGeometry(boreDia * 0.8, boreDia * 0.8, faceW + 12, 32);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, mat);
    group.add(hubMesh);
  }

  return group;
}

// 6. Bevel Gear (Conical Pitch Miter / Bevel Gear)
export function generateBevelGear3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BevelGearPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.25, 0.85);

  const teeth = Math.max(10, Number(p.teeth_count || 20));
  const mod = Math.max(1, Number(p.module || 3.0));
  const boreDia = Math.max(0, Number(p.bore_diameter || 22));
  const faceW = Number(p.face_width || 22);

  const pitchR = (mod * teeth) / 2;
  const outerR = pitchR + mod;
  const coneH = pitchR * 1.2;

  // Conical Gear Body
  const coneGeo = new THREE.ConeGeometry(outerR, coneH, teeth);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMesh = new THREE.Mesh(coneGeo, mat);
  coneMesh.position.z = coneH / 4;
  group.add(coneMesh);

  // Back Hub
  const hubGeo = new THREE.CylinderGeometry(pitchR * 0.65, pitchR * 0.75, faceW, 32);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, mat);
  hubMesh.position.z = -faceW / 2;
  group.add(hubMesh);

  // Bore Cutout
  const boreGeo = new THREE.CylinderGeometry(boreDia / 2, boreDia / 2, coneH + faceW + 4, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  group.add(boreMesh);

  return group;
}

// 7. Worm Gear Set (Worm Screw + Throated Worm Wheel)
export function generateWormGear3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WormGearSet';
  const p = part.parameters;
  const wormMat = createCADMaterial('#cbd5e1', 0.2, 0.9);
  const bronzeMat = createCADMaterial('#d97706', 0.3, 0.8); // Phosphor Bronze Wheel

  const wormDia = Number(p.worm_diameter || 38);
  const wormLen = Number(p.worm_length || 110);
  const wheelTeeth = Number(p.wheel_teeth || 36);
  const mod = Number(p.module || 2.5);

  const wheelPitchR = (mod * wheelTeeth) / 2;

  // 1. Worm Screw (Horizontal X-Axis)
  const wormBodyGeo = new THREE.CylinderGeometry(wormDia / 2, wormDia / 2, wormLen, 48);
  wormBodyGeo.rotateZ(Math.PI / 2);
  const wormMesh = new THREE.Mesh(wormBodyGeo, wormMat);
  wormMesh.position.set(0, wheelPitchR + wormDia / 2 - 2, 0);
  group.add(wormMesh);

  // Helical Thread Coil on Worm
  const threadCount = 6;
  for (let t = 0; t < threadCount; t++) {
    const threadGeo = new THREE.TorusGeometry(wormDia / 2 + 1.2, 2.2, 16, 32);
    threadGeo.rotateY(Math.PI / 2);
    const threadMesh = new THREE.Mesh(threadGeo, wormMat);
    threadMesh.position.set(-wormLen / 3 + t * (wormLen / (threadCount + 1)), wheelPitchR + wormDia / 2 - 2, 0);
    group.add(threadMesh);
  }

  // 2. Throated Bronze Worm Wheel (Meshing below)
  const wheelGeo = new THREE.CylinderGeometry(wheelPitchR + mod, wheelPitchR + mod, 22, wheelTeeth);
  const wheelMesh = new THREE.Mesh(wheelGeo, bronzeMat);
  wheelMesh.position.set(0, 0, 0);
  group.add(wheelMesh);

  // Wheel Hub and Bore
  const boreGeo = new THREE.CylinderGeometry(18, 18, 30, 32);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  group.add(boreMesh);

  return group;
}

// 8. Rack and Pinion
export function generateRackPinion3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RackPinionPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.3, 0.85);

  const rackLen = Number(p.rack_length || 260);
  const rackH = Number(p.rack_height || 30);
  const rackW = Number(p.face_width || 25);
  const mod = Number(p.module || 2.5);
  const pinionTeeth = Number(p.pinion_teeth || 18);

  const pinionR = (mod * pinionTeeth) / 2;

  // 1. Linear Gear Rack Bar
  const rackBarGeo = new THREE.BoxGeometry(rackLen, rackH, rackW);
  const rackMesh = new THREE.Mesh(rackBarGeo, mat);
  rackMesh.position.set(0, -rackH / 2, 0);
  group.add(rackMesh);

  // Rack Cut Teeth
  const toothPitch = Math.PI * mod;
  const toothCount = Math.floor(rackLen / toothPitch);
  for (let i = 0; i < toothCount; i++) {
    const xPos = -rackLen / 2 + (i + 0.5) * toothPitch;
    const toothGeo = new THREE.BoxGeometry(mod * 1.5, mod * 2.2, rackW);
    const toothMesh = new THREE.Mesh(toothGeo, mat);
    toothMesh.position.set(xPos, mod, 0);
    group.add(toothMesh);
  }

  // 2. Meshing Pinion Gear
  const pinionGeo = new THREE.CylinderGeometry(pinionR + mod, pinionR + mod, rackW, pinionTeeth);
  pinionGeo.rotateX(Math.PI / 2);
  const pinionMesh = new THREE.Mesh(pinionGeo, createCADMaterial('#38bdf8', 0.25, 0.85));
  pinionMesh.position.set(0, pinionR + mod * 2, 0);
  group.add(pinionMesh);

  // Pinion Center Shaft
  const shaftGeo = new THREE.CylinderGeometry(10, 10, rackW + 30, 24);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, createCADMaterial('#cbd5e1', 0.2, 0.9));
  shaftMesh.position.set(0, pinionR + mod * 2, 0);
  group.add(shaftMesh);

  return group;
}

// 9. Hex Nut
export function generateHexNut3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HexNutPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#cbd5e1', 0.25, 0.88);

  const nomDia = Number(p.nominal_diameter || 16);
  const widthAcrossFlats = Number(p.width_across_flats || nomDia * 1.6);
  const height = Number(p.height || nomDia * 0.8);

  // Hexagonal Prism Nut Body
  const nutGeo = new THREE.CylinderGeometry(widthAcrossFlats / 1.732, widthAcrossFlats / 1.732, height, 6);
  nutGeo.rotateX(Math.PI / 2);
  const nutMesh = new THREE.Mesh(nutGeo, mat);
  group.add(nutMesh);

  // Threaded Central Bore
  const boreGeo = new THREE.CylinderGeometry(nomDia / 2, nomDia / 2, height + 2, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  group.add(boreMesh);

  // Thread Helical Ridges visualizer
  for (let t = 0; t < 4; t++) {
    const tGeo = new THREE.TorusGeometry(nomDia / 2 - 0.2, 0.4, 8, 24);
    const tMesh = new THREE.Mesh(tGeo, createCADMaterial('#64748b', 0.4, 0.6));
    tMesh.position.z = -height / 2 + (t + 1) * (height / 5);
    group.add(tMesh);
  }

  return group;
}

// 10. Socket Head Cap Screw
export function generateSocketScrew3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SocketScrewPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#334155', 0.35, 0.8);

  const nomDia = Number(p.nominal_diameter || 12);
  const length = Number(p.length || 50);
  const headDia = Number(p.head_diameter || nomDia * 1.5);
  const headH = Number(p.head_height || nomDia);
  const hexSocketSize = Number(p.hex_socket_size || nomDia * 0.8);

  // Cylindrical Cap Head
  const headGeo = new THREE.CylinderGeometry(headDia / 2, headDia / 2, headH, 36);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, mat);
  headMesh.position.z = headH / 2;
  group.add(headMesh);

  // Allen Hex Socket Recess
  const socketGeo = new THREE.CylinderGeometry(hexSocketSize / 1.732, hexSocketSize / 1.732, headH * 0.6, 6);
  socketGeo.rotateX(Math.PI / 2);
  const socketMesh = new THREE.Mesh(socketGeo, createCADMaterial('#0f172a', 0.9, 0.1));
  socketMesh.position.z = headH * 0.75;
  group.add(socketMesh);

  // Threaded Shank
  const shankGeo = new THREE.CylinderGeometry(nomDia / 2, nomDia / 2, length, 32);
  shankGeo.rotateX(Math.PI / 2);
  const shankMesh = new THREE.Mesh(shankGeo, mat);
  shankMesh.position.z = -length / 2;
  group.add(shankMesh);

  return group;
}

// 11. Threaded Stud
export function generateThreadedStud3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ThreadedStudPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#cbd5e1', 0.25, 0.88);

  const nomDia = Number(p.nominal_diameter || 16);
  const length = Number(p.length || 100);
  const threadLen1 = Number(p.thread1_length || 30);
  const threadLen2 = Number(p.thread2_length || 30);

  // Plain Center Shank
  const shankGeo = new THREE.CylinderGeometry(nomDia / 2, nomDia / 2, length, 32);
  shankGeo.rotateX(Math.PI / 2);
  const shankMesh = new THREE.Mesh(shankGeo, mat);
  group.add(shankMesh);

  // Threaded Ends (Darker ridged appearance)
  const tMat = createCADMaterial('#94a3b8', 0.4, 0.7);
  const t1Geo = new THREE.CylinderGeometry(nomDia / 2 + 0.3, nomDia / 2 + 0.3, threadLen1, 32);
  t1Geo.rotateX(Math.PI / 2);
  const t1Mesh = new THREE.Mesh(t1Geo, tMat);
  t1Mesh.position.z = length / 2 - threadLen1 / 2;
  group.add(t1Mesh);

  const t2Geo = new THREE.CylinderGeometry(nomDia / 2 + 0.3, nomDia / 2 + 0.3, threadLen2, 32);
  t2Geo.rotateX(Math.PI / 2);
  const t2Mesh = new THREE.Mesh(t2Geo, tMat);
  t2Mesh.position.z = -length / 2 + threadLen2 / 2;
  group.add(t2Mesh);

  return group;
}

// 12. Rivet (Domed Mushroom Head Rivet)
export function generateRivet3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RivetPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#cbd5e1', 0.3, 0.8);

  const shankDia = Number(p.shank_diameter || 10);
  const length = Number(p.length || 45);
  const headDia = Number(p.head_diameter || shankDia * 1.75);

  // Domed Head (Half Sphere)
  const domeGeo = new THREE.SphereGeometry(headDia / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.rotateX(Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, mat);
  domeMesh.position.z = 0;
  group.add(domeMesh);

  // Shank
  const shankGeo = new THREE.CylinderGeometry(shankDia / 2, shankDia / 2, length, 32);
  shankGeo.rotateX(Math.PI / 2);
  const shankMesh = new THREE.Mesh(shankGeo, mat);
  shankMesh.position.z = -length / 2;
  group.add(shankMesh);

  return group;
}

// 13. Washer (Flat / Spring Lock Washer)
export function generateWasher3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WasherPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#e2e8f0', 0.2, 0.9);

  const outerDia = Number(p.outer_diameter || 32);
  const innerDia = Number(p.inner_diameter || 16);
  const thickness = Number(p.thickness || 3.0);

  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerDia / 2, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3 });
  geo.center();
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  return group;
}

// 14. Extension Spring (Helical Coil with Dual Crossover End Hooks)
export function generateExtensionSpring3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ExtensionSpringPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.2, 0.85);

  const wireDia = Number(p.wire_diameter || 3.5);
  const meanDia = Number(p.mean_diameter || 28);
  const coils = Number(p.active_coils || 14);
  const bodyLen = Number(p.body_length || coils * (wireDia + 0.2));

  // Helical Body
  const points: THREE.Vector3[] = [];
  const totalSteps = coils * 36;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const angle = t * coils * 2 * Math.PI;
    const x = Math.cos(angle) * (meanDia / 2);
    const y = Math.sin(angle) * (meanDia / 2);
    const z = -bodyLen / 2 + t * bodyLen;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const coilGeo = new THREE.TubeGeometry(curve, totalSteps, wireDia / 2, 16, false);
  const coilMesh = new THREE.Mesh(coilGeo, mat);
  group.add(coilMesh);

  // Crossover Loop Hooks on both ends
  [-1, 1].forEach((dir) => {
    const hookGeo = new THREE.TorusGeometry(meanDia / 2, wireDia / 2, 16, 32, Math.PI * 1.2);
    hookGeo.rotateY(Math.PI / 2);
    const hookMesh = new THREE.Mesh(hookGeo, mat);
    hookMesh.position.set(0, 0, dir * (bodyLen / 2 + meanDia / 2));
    group.add(hookMesh);
  });

  return group;
}

// 15. Torsion Spring (Helical Coil with Tangential Straight Legs)
export function generateTorsionSpring3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TorsionSpringPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.2, 0.85);

  const wireDia = Number(p.wire_diameter || 3.0);
  const meanDia = Number(p.mean_diameter || 26);
  const coils = Number(p.active_coils || 6);
  const legLen = Number(p.leg_length || 45);
  const bodyLen = coils * (wireDia + 0.4);

  // Helix
  const points: THREE.Vector3[] = [];
  const totalSteps = coils * 36;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const angle = t * coils * 2 * Math.PI;
    const x = Math.cos(angle) * (meanDia / 2);
    const y = Math.sin(angle) * (meanDia / 2);
    const z = -bodyLen / 2 + t * bodyLen;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const coilGeo = new THREE.TubeGeometry(curve, totalSteps, wireDia / 2, 16, false);
  const coilMesh = new THREE.Mesh(coilGeo, mat);
  group.add(coilMesh);

  // Straight Tangential Legs
  const leg1Geo = new THREE.CylinderGeometry(wireDia / 2, wireDia / 2, legLen, 16);
  leg1Geo.rotateZ(Math.PI / 2);
  const leg1 = new THREE.Mesh(leg1Geo, mat);
  leg1.position.set(meanDia / 2 + legLen / 2, 0, -bodyLen / 2);
  group.add(leg1);

  const leg2Geo = new THREE.CylinderGeometry(wireDia / 2, wireDia / 2, legLen, 16);
  const leg2 = new THREE.Mesh(leg2Geo, mat);
  leg2.position.set(0, meanDia / 2 + legLen / 2, bodyLen / 2);
  group.add(leg2);

  return group;
}

// 16. Leaf Spring (Multi-Leaf Stacked Parabolic Spring Pack)
export function generateLeafSpring3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'LeafSpringPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#475569', 0.4, 0.7);

  const span = Number(p.span_length || 500);
  const leafW = Number(p.leaf_width || 60);
  const leafThick = Number(p.leaf_thickness || 8);
  const leafCount = Number(p.leaf_count || 5);
  const camber = Number(p.camber_height || 65);

  for (let i = 0; i < leafCount; i++) {
    const curSpan = span * (1 - (i * 0.16));
    const points: THREE.Vector3[] = [];
    const steps = 30;

    for (let s = 0; s <= steps; s++) {
      const u = (s / steps) * 2 - 1; // -1 to 1
      const x = u * (curSpan / 2);
      // Parabolic curve y = camber * (1 - u^2)
      const y = camber * (1 - u * u) - i * (leafThick + 0.5);
      points.push(new THREE.Vector3(x, y, 0));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    // Extrude rectangular cross section along curve
    const leafShape = new THREE.Shape();
    leafShape.moveTo(-leafW / 2, -leafThick / 2);
    leafShape.lineTo(leafW / 2, -leafThick / 2);
    leafShape.lineTo(leafW / 2, leafThick / 2);
    leafShape.lineTo(-leafW / 2, leafThick / 2);
    leafShape.closePath();

    const geo = new THREE.ExtrudeGeometry(leafShape, { extrudePath: curve, steps: 30 });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  // Master Leaf Eye Ends
  [-1, 1].forEach((dir) => {
    const eyeGeo = new THREE.TorusGeometry(18, 6, 16, 32);
    eyeGeo.rotateX(Math.PI / 2);
    const eyeMesh = new THREE.Mesh(eyeGeo, mat);
    eyeMesh.position.set(dir * (span / 2), 0, 0);
    group.add(eyeMesh);
  });

  // Center U-Bolt Clamp
  const clampGeo = new THREE.BoxGeometry(leafW * 1.3, leafCount * leafThick * 1.4, leafW * 1.2);
  const clampMesh = new THREE.Mesh(clampGeo, createCADMaterial('#0f172a', 0.7, 0.4));
  clampMesh.position.set(0, camber - (leafCount * leafThick) / 2, 0);
  group.add(clampMesh);

  return group;
}

// 17. Roller Bearing (Cylindrical Roller Bearing)
export function generateRollerBearing3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RollerBearingPart';
  const p = part.parameters;
  const steelMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.2, 0.9);
  const brassCageMat = createCADMaterial('#f59e0b', 0.35, 0.75);

  const boreDia = Number(p.bore_diameter || 40);
  const outerDia = Number(p.outer_diameter || 80);
  const width = Number(p.width || 22);
  const rollerCount = Number(p.roller_count || 12);

  const meanR = (boreDia + outerDia) / 4;
  const rollerDia = (outerDia - boreDia) * 0.28;

  // Inner Ring
  const innerShape = new THREE.Shape();
  innerShape.absarc(0, 0, meanR - rollerDia / 2 - 1, 0, Math.PI * 2, false);
  const innerHole = new THREE.Path();
  innerHole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
  innerShape.holes.push(innerHole);
  const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: width, bevelEnabled: false });
  innerGeo.center();
  const innerMesh = new THREE.Mesh(innerGeo, steelMat);
  group.add(innerMesh);

  // Outer Ring
  const outerShape = new THREE.Shape();
  outerShape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);
  const outerHole = new THREE.Path();
  outerHole.absarc(0, 0, meanR + rollerDia / 2 + 1, 0, Math.PI * 2, true);
  outerShape.holes.push(outerHole);
  const outerGeo = new THREE.ExtrudeGeometry(outerShape, { depth: width, bevelEnabled: false });
  outerGeo.center();
  const outerMesh = new THREE.Mesh(outerGeo, steelMat);
  group.add(outerMesh);

  // Cylindrical Rollers Array
  for (let r = 0; r < rollerCount; r++) {
    const angle = (r * 2 * Math.PI) / rollerCount;
    const rGeo = new THREE.CylinderGeometry(rollerDia / 2, rollerDia / 2, width * 0.8, 24);
    rGeo.rotateX(Math.PI / 2);
    const rMesh = new THREE.Mesh(rGeo, steelMat);
    rMesh.position.set(Math.cos(angle) * meanR, Math.sin(angle) * meanR, 0);
    group.add(rMesh);
  }

  // Brass Retainer Cage Rings
  [-1, 1].forEach((dir) => {
    const cageGeo = new THREE.TorusGeometry(meanR, 1.2, 16, 48);
    const cageMesh = new THREE.Mesh(cageGeo, brassCageMat);
    cageMesh.position.z = dir * (width * 0.38);
    group.add(cageMesh);
  });

  return group;
}

// 18. Thrust Bearing (3-Piece Ball/Roller Thrust Bearing)
export function generateThrustBearing3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ThrustBearingPart';
  const p = part.parameters;
  const steelMat = createCADMaterial(part.material?.color || '#cbd5e1', 0.2, 0.9);
  const brassMat = createCADMaterial('#d97706', 0.3, 0.7);

  const boreDia = Number(p.bore_diameter || 35);
  const outerDia = Number(p.outer_diameter || 62);
  const height = Number(p.height || 18);
  const ballCount = Number(p.ball_count || 14);

  const washerThick = height * 0.26;
  const ballDia = height * 0.42;
  const meanR = (boreDia + outerDia) / 4;

  // Top Raceway Washer
  const topShape = new THREE.Shape();
  topShape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);
  const topHole = new THREE.Path();
  topHole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
  topShape.holes.push(topHole);
  const topGeo = new THREE.ExtrudeGeometry(topShape, { depth: washerThick, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
  topGeo.center();
  const topMesh = new THREE.Mesh(topGeo, steelMat);
  topMesh.position.z = height / 2 - washerThick / 2;
  group.add(topMesh);

  // Bottom Raceway Washer
  const botGeo = new THREE.ExtrudeGeometry(topShape, { depth: washerThick, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
  botGeo.center();
  const botMesh = new THREE.Mesh(botGeo, steelMat);
  botMesh.position.z = -height / 2 + washerThick / 2;
  group.add(botMesh);

  // Ball Array in Brass Cage
  for (let b = 0; b < ballCount; b++) {
    const angle = (b * 2 * Math.PI) / ballCount;
    const bGeo = new THREE.SphereGeometry(ballDia / 2, 24, 24);
    const bMesh = new THREE.Mesh(bGeo, steelMat);
    bMesh.position.set(Math.cos(angle) * meanR, Math.sin(angle) * meanR, 0);
    group.add(bMesh);
  }

  // Brass Retainer Disc
  const cageShape = new THREE.Shape();
  cageShape.absarc(0, 0, meanR + ballDia * 0.6, 0, Math.PI * 2, false);
  const cageHole = new THREE.Path();
  cageHole.absarc(0, 0, meanR - ballDia * 0.6, 0, Math.PI * 2, true);
  cageShape.holes.push(cageHole);
  const cageGeo = new THREE.ExtrudeGeometry(cageShape, { depth: 2, bevelEnabled: false });
  cageGeo.center();
  const cageMesh = new THREE.Mesh(cageGeo, brassMat);
  group.add(cageMesh);

  return group;
}

// 19. Journal Bearing (Bronze Sleeve Bushing with Spiral Oil Grooves)
export function generateJournalBearing3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'JournalBearingPart';
  const p = part.parameters;
  const bronzeMat = createCADMaterial(part.material?.color || '#d97706', 0.35, 0.75); // SAE 660 Bronze

  const boreDia = Number(p.bore_diameter || 40);
  const outerDia = Number(p.outer_diameter || 50);
  const length = Number(p.length || 60);
  const flangeDia = Number(p.flange_diameter || 65);
  const flangeThick = Number(p.flange_thickness || 6);

  // Main Bushing Body
  const bodyShape = new THREE.Shape();
  bodyShape.absarc(0, 0, outerDia / 2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, boreDia / 2, 0, Math.PI * 2, true);
  bodyShape.holes.push(hole);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: length, bevelEnabled: false });
  bodyGeo.center();
  const bodyMesh = new THREE.Mesh(bodyGeo, bronzeMat);
  group.add(bodyMesh);

  // Thrust Flange Collar
  if (flangeDia > outerDia) {
    const flangeShape = new THREE.Shape();
    flangeShape.absarc(0, 0, flangeDia / 2, 0, Math.PI * 2, false);
    flangeShape.holes.push(hole);
    const flangeGeo = new THREE.ExtrudeGeometry(flangeShape, { depth: flangeThick, bevelEnabled: false });
    flangeGeo.center();
    const flangeMesh = new THREE.Mesh(flangeGeo, bronzeMat);
    flangeMesh.position.z = length / 2 - flangeThick / 2;
    group.add(flangeMesh);
  }

  // Spiral Lubrication Oil Groove visualizer
  const grooveGeo = new THREE.TorusGeometry(boreDia / 2 + 0.3, 1.2, 12, 32);
  const grooveMesh = new THREE.Mesh(grooveGeo, createCADMaterial('#451a03', 0.8, 0.2));
  group.add(grooveMesh);

  return group;
}

// 20. Belt Drive (Twin Pulley System with Wrapped V-Belt)
export function generateBeltDrive3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BeltDriveAssembly';
  const p = part.parameters;
  const sheaveMat = createCADMaterial('#94a3b8', 0.3, 0.85);
  const rubberBeltMat = createCADMaterial('#1e293b', 0.8, 0.1); // Matte Black Rubber

  const driverDia = Number(p.driver_diameter || 90);
  const drivenDia = Number(p.driven_diameter || 180);
  const centerDist = Number(p.center_distance || 300);
  const width = Number(p.belt_width || 22);

  // Driver Pulley (Left)
  const d1Geo = new THREE.CylinderGeometry(driverDia / 2, driverDia / 2, width, 48);
  d1Geo.rotateX(Math.PI / 2);
  const d1Mesh = new THREE.Mesh(d1Geo, sheaveMat);
  d1Mesh.position.x = -centerDist / 2;
  group.add(d1Mesh);

  // Driven Pulley (Right)
  const d2Geo = new THREE.CylinderGeometry(drivenDia / 2, drivenDia / 2, width, 48);
  d2Geo.rotateX(Math.PI / 2);
  const d2Mesh = new THREE.Mesh(d2Geo, sheaveMat);
  d2Mesh.position.x = centerDist / 2;
  group.add(d2Mesh);

  // Wrapped V-Belt Loop (Top and Bottom Spans)
  const topSpanGeo = new THREE.BoxGeometry(centerDist, width * 0.75, 8);
  const topSpan = new THREE.Mesh(topSpanGeo, rubberBeltMat);
  topSpan.position.set(0, (driverDia + drivenDia) / 4, 0);
  group.add(topSpan);

  const botSpan = new THREE.Mesh(topSpanGeo, rubberBeltMat);
  botSpan.position.set(0, -(driverDia + drivenDia) / 4, 0);
  group.add(botSpan);

  return group;
}

// 21. Chain Drive (Dual Sprockets with Roller Chain Loop)
export function generateChainDrive3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ChainDriveAssembly';
  const p = part.parameters;
  const steelMat = createCADMaterial('#cbd5e1', 0.25, 0.85);
  const chainLinkMat = createCADMaterial('#475569', 0.4, 0.7);

  const driverTeeth = Number(p.driver_teeth || 17);
  const drivenTeeth = Number(p.driven_teeth || 42);
  const pitch = Number(p.chain_pitch || 12.7);
  const centerDist = Number(p.center_distance || 320);

  const r1 = (driverTeeth * pitch) / (2 * Math.PI);
  const r2 = (drivenTeeth * pitch) / (2 * Math.PI);

  // Driver Sprocket
  const s1Geo = new THREE.CylinderGeometry(r1, r1, 8, driverTeeth);
  s1Geo.rotateX(Math.PI / 2);
  const s1Mesh = new THREE.Mesh(s1Geo, steelMat);
  s1Mesh.position.x = -centerDist / 2;
  group.add(s1Mesh);

  // Driven Sprocket
  const s2Geo = new THREE.CylinderGeometry(r2, r2, 8, drivenTeeth);
  s2Geo.rotateX(Math.PI / 2);
  const s2Mesh = new THREE.Mesh(s2Geo, steelMat);
  s2Mesh.position.x = centerDist / 2;
  group.add(s2Mesh);

  // Chain Link Array Loop
  const linkCount = 28;
  for (let i = 0; i < linkCount; i++) {
    const u = i / linkCount;
    let x = 0, y = 0;
    if (u < 0.5) {
      // Top Span
      x = -centerDist / 2 + (u / 0.5) * centerDist;
      y = (r1 + r2) / 2;
    } else {
      // Bottom Span
      x = centerDist / 2 - ((u - 0.5) / 0.5) * centerDist;
      y = -(r1 + r2) / 2;
    }
    const linkGeo = new THREE.BoxGeometry(10, 4, 10);
    const linkMesh = new THREE.Mesh(linkGeo, chainLinkMat);
    linkMesh.position.set(x, y, 0);
    group.add(linkMesh);
  }

  return group;
}

// 22. V-Belt Pulley Sheave
export function generatePulley3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PulleySheavePart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.28, 0.85);

  const outerDia = Number(p.outer_diameter || 150);
  const boreDia = Number(p.bore_diameter || 28);
  const faceW = Number(p.face_width || 36);
  const grooveCount = Number(p.grooves || 2);

  // Sheave Rim
  const rimGeo = new THREE.CylinderGeometry(outerDia / 2, outerDia / 2, faceW, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, mat);
  group.add(rimMesh);

  // V-Grooves Cutouts (Darker tapered slots)
  const darkSlotMat = createCADMaterial('#0f172a', 0.8, 0.2);
  for (let g = 0; g < grooveCount; g++) {
    const zOffset = -faceW / 2 + ((g + 1) * faceW) / (grooveCount + 1);
    const gGeo = new THREE.TorusGeometry(outerDia / 2 - 2, 4, 16, 48);
    const gMesh = new THREE.Mesh(gGeo, darkSlotMat);
    gMesh.position.z = zOffset;
    group.add(gMesh);
  }

  // Central Hub with Keyway Bore
  const hubGeo = new THREE.CylinderGeometry(boreDia * 1.1, boreDia * 1.1, faceW + 10, 32);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, mat);
  group.add(hubMesh);

  const boreGeo = new THREE.CylinderGeometry(boreDia / 2, boreDia / 2, faceW + 14, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, darkSlotMat);
  group.add(boreMesh);

  return group;
}

// 23. Parallel Drive Key (DIN 6885 Form-A)
export function generateParallelKey3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ParallelKeyPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#cbd5e1', 0.25, 0.9);

  const width = Number(p.width || 12);
  const height = Number(p.height || 8);
  const length = Number(p.length || 60);

  // Rectangular Body
  const bodyGeo = new THREE.BoxGeometry(width, height, length - width);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat);
  group.add(bodyMesh);

  // Rounded Bullet Ends (Form A)
  [-1, 1].forEach((dir) => {
    const endGeo = new THREE.CylinderGeometry(width / 2, width / 2, height, 32);
    const endMesh = new THREE.Mesh(endGeo, mat);
    endMesh.position.z = dir * ((length - width) / 2);
    group.add(endMesh);
  });

  return group;
}

// 24. Rocker Lever Arm
export function generateRockerLever3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RockerLeverPart';
  const p = part.parameters;
  const mat = createCADMaterial(part.material?.color || '#94a3b8', 0.3, 0.85);

  const armLen = Number(p.arm_length || 180);
  const pivotDia = Number(p.pivot_diameter || 40);
  const pivotBore = Number(p.pivot_bore || 20);
  const endDia = Number(p.end_boss_diameter || 28);
  const endBore = Number(p.end_bore || 12);
  const thickness = Number(p.thickness || 24);

  // Central Pivot Boss
  const pivotGeo = new THREE.CylinderGeometry(pivotDia / 2, pivotDia / 2, thickness * 1.3, 32);
  pivotGeo.rotateX(Math.PI / 2);
  const pivotMesh = new THREE.Mesh(pivotGeo, mat);
  group.add(pivotMesh);

  // Pivot Bore
  const pBoreGeo = new THREE.CylinderGeometry(pivotBore / 2, pivotBore / 2, thickness * 1.4, 24);
  pBoreGeo.rotateX(Math.PI / 2);
  const pBoreMesh = new THREE.Mesh(pBoreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
  group.add(pBoreMesh);

  // Dual Connecting Lever Arms & Clevis Bosses
  [-1, 1].forEach((dir) => {
    const beamGeo = new THREE.BoxGeometry(armLen / 2, thickness * 0.75, thickness);
    const beamMesh = new THREE.Mesh(beamGeo, mat);
    beamMesh.position.x = dir * (armLen / 4);
    group.add(beamMesh);

    const endGeo = new THREE.CylinderGeometry(endDia / 2, endDia / 2, thickness, 32);
    endGeo.rotateX(Math.PI / 2);
    const endMesh = new THREE.Mesh(endGeo, mat);
    endMesh.position.x = dir * (armLen / 2);
    group.add(endMesh);

    const eBoreGeo = new THREE.CylinderGeometry(endBore / 2, endBore / 2, thickness + 2, 24);
    eBoreGeo.rotateX(Math.PI / 2);
    const eBoreMesh = new THREE.Mesh(eBoreGeo, createCADMaterial('#0f172a', 0.8, 0.2));
    eBoreMesh.position.x = dir * (armLen / 2);
    group.add(eBoreMesh);
  });

  return group;
}

// 25. Industrial Piping Spool Section
export function generatePipeSection3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PipeSectionPart';
  const p = part.parameters;
  const pipeMat = createCADMaterial(part.material?.color || '#64748b', 0.35, 0.8);
  const darkBoreMat = createCADMaterial('#0f172a', 0.8, 0.2);

  const length = Number(p.length || 300);
  const outerDia = Number(p.outer_diameter || 88.9); // 3" Schedule 40
  const wallThick = Number(p.wall_thickness || 5.5);
  const flangeDia = Number(p.flange_diameter || 190);
  const flangeThick = Number(p.flange_thickness || 20);
  const innerDia = outerDia - 2 * wallThick;

  // Main Pipe Body
  const pipeGeo = new THREE.CylinderGeometry(outerDia / 2, outerDia / 2, length, 48);
  pipeGeo.rotateX(Math.PI / 2);
  const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
  group.add(pipeMesh);

  // Internal Hollow Fluid Bore
  const boreGeo = new THREE.CylinderGeometry(innerDia / 2, innerDia / 2, length + 2, 32);
  boreGeo.rotateX(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, darkBoreMat);
  group.add(boreMesh);

  // Weld-Neck ANSI Flanges on both ends
  [-1, 1].forEach((dir) => {
    const fGeo = new THREE.CylinderGeometry(flangeDia / 2, flangeDia / 2, flangeThick, 48);
    fGeo.rotateX(Math.PI / 2);
    const fMesh = new THREE.Mesh(fGeo, pipeMat);
    fMesh.position.z = dir * (length / 2 - flangeThick / 2);
    group.add(fMesh);

    // Bolt Hole Array (4 or 8 holes)
    const boltCount = 8;
    const pcd = flangeDia * 0.78;
    for (let b = 0; b < boltCount; b++) {
      const angle = (b * 2 * Math.PI) / boltCount;
      const bHoleGeo = new THREE.CylinderGeometry(9, 9, flangeThick + 2, 16);
      bHoleGeo.rotateX(Math.PI / 2);
      const bHoleMesh = new THREE.Mesh(bHoleGeo, darkBoreMat);
      bHoleMesh.position.set(Math.cos(angle) * (pcd / 2), Math.sin(angle) * (pcd / 2), dir * (length / 2 - flangeThick / 2));
      group.add(bHoleMesh);
    }
  });

  return group;
}

// 26. Pressure Vessel (Horizontal ASME Boiler with Ellipsoidal Heads & Saddle Supports)
export function generatePressureVessel3D(part: CADPart): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PressureVesselPart';
  const p = part.parameters;
  const shellMat = createCADMaterial(part.material?.color || '#475569', 0.35, 0.8);
  const nozzleMat = createCADMaterial('#94a3b8', 0.25, 0.85);

  const shellDia = Number(p.shell_diameter || 220);
  const shellLen = Number(p.shell_length || 450);
  const headDepth = shellDia * 0.28; // 2:1 Semi-Ellipsoidal Head

  // Cylindrical Main Shell
  const shellGeo = new THREE.CylinderGeometry(shellDia / 2, shellDia / 2, shellLen, 48);
  shellGeo.rotateZ(Math.PI / 2);
  const shellMesh = new THREE.Mesh(shellGeo, shellMat);
  group.add(shellMesh);

  // 2:1 Ellipsoidal End Caps (Left & Right)
  [-1, 1].forEach((dir) => {
    const headGeo = new THREE.SphereGeometry(shellDia / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    headGeo.rotateZ(-dir * (Math.PI / 2));
    headGeo.scale(headDepth / (shellDia / 2), 1, 1);
    const headMesh = new THREE.Mesh(headGeo, shellMat);
    headMesh.position.x = dir * (shellLen / 2);
    group.add(headMesh);
  });

  // Top Inlet Nozzle Neck with Flange
  const nozzleGeo = new THREE.CylinderGeometry(28, 28, 45, 32);
  const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzleMesh.position.set(0, shellDia / 2 + 22.5, 0);
  group.add(nozzleMesh);

  const nFlangeGeo = new THREE.CylinderGeometry(42, 42, 10, 32);
  const nFlangeMesh = new THREE.Mesh(nFlangeGeo, nozzleMat);
  nFlangeMesh.position.set(0, shellDia / 2 + 45, 0);
  group.add(nFlangeMesh);

  // Dual Structural Saddle Support Feet
  [-1, 1].forEach((dir) => {
    const saddleGeo = new THREE.BoxGeometry(25, shellDia * 0.55, shellDia * 1.15);
    const saddleMesh = new THREE.Mesh(saddleGeo, createCADMaterial('#1e293b', 0.6, 0.4));
    saddleMesh.position.set(dir * (shellLen * 0.32), -shellDia * 0.4, 0);
    group.add(saddleMesh);
  });

  return group;
}

// Universal Entry Dispatcher
export function generateCADModel3D(part: CADPart): THREE.Group {
  switch (part.part_type) {
    case 'shaft':
    case 'stepped_shaft':
      return generateShaft3D(part);

    case 'hollow_shaft':
      return generateHollowShaft3D(part);

    case 'axle':
      return generateAxle3D(part);

    case 'spindle':
      return generateSpindle3D(part);

    case 'torsion_shaft':
      return generateTorsionShaft3D(part);

    case 'gear':
      return generateGear3D(part);

    case 'helical_gear':
      return generateHelicalGear3D(part);

    case 'bevel_gear':
      return generateBevelGear3D(part);

    case 'worm_gear':
    case 'worm_gearbox':
      return generateWormGear3D(part);

    case 'rack_pinion':
      return generateRackPinion3D(part);

    case 'flange':
      return generateFlange3D(part);

    case 'flange_coupling':
      return generateFlange3D(part);

    case 'bearing':
      return generateBearing3D(part);

    case 'roller_bearing':
      return generateRollerBearing3D(part);

    case 'thrust_bearing':
      return generateThrustBearing3D(part);

    case 'journal_bearing':
      return generateJournalBearing3D(part);

    case 'bearing_housing':
      return generateBearingHousing3D(part);

    case 'pulley':
      return generatePulley3D(part);

    case 'belt_drive':
      return generateBeltDrive3D(part);

    case 'sprocket':
    case 'chain_drive':
      return generateChainDrive3D(part);

    case 'bracket':
      return generateBracket3D(part);

    case 'bolt':
      return generateBolt3D(part);

    case 'nut':
      return generateHexNut3D(part);

    case 'screw':
      return generateSocketScrew3D(part);

    case 'stud':
      return generateThreadedStud3D(part);

    case 'rivet':
      return generateRivet3D(part);

    case 'washer':
      return generateWasher3D(part);

    case 'spring':
      return generateSpring3D(part);

    case 'extension_spring':
      return generateExtensionSpring3D(part);

    case 'torsion_spring':
      return generateTorsionSpring3D(part);

    case 'leaf_spring':
      return generateLeafSpring3D(part);

    case 'parallel_key':
      return generateParallelKey3D(part);

    case 'rocker_lever':
      return generateRockerLever3D(part);

    case 'pipe_section':
      return generatePipeSection3D(part);

    case 'pressure_vessel':
      return generatePressureVessel3D(part);

    case 'planetary_gearbox':
    case 'spur_gearbox':
      return generatePlanetaryGearbox3D(part);

    case 'crank_slider':
    case 'four_bar_mechanism':
      return generateCrankSlider3D(part);

    case 'universal_joint':
      return generateUniversalJoint3D(part);

    case 'geneva_mechanism':
      return generateGenevaMechanism3D(part);

    case 'hydraulic_cylinder':
    case 'lead_screw':
      return generateHydraulicCylinder3D(part);

    case 'engine_piston':
      return generateEnginePiston3D(part);

    case 'engine_connecting_rod':
      return generateEngineConnectingRod3D(part);

    case 'engine_crankshaft':
      return generateEngineCrankshaft3D(part);

    case 'engine_camshaft':
      return generateEngineCamshaft3D(part);

    case 'turbocharger_impeller':
      return generateTurbochargerImpeller3D(part);

    case 'engine_flywheel':
      return generateEngineFlywheel3D(part);

    case 'engine_cylinder_head':
      return generateEngineCylinderHead3D(part);

    case 'engine_cylinder_block':
      return generateEngineCylinderBlock3D(part);

    case 'gas_turbine_blisk':
      return generateGasTurbineBlisk3D(part);

    case 'roots_supercharger_rotor':
      return generateRootsSupercharger3D(part);

    case 'engine_valve':
      return generateEngineValve3D(part);

    case 'cycloidal_drive':
      return generateCycloidalDrive3D(part);

    case 'clutch_pack':
      return generateClutchPack3D(part);

    default:
      // Solid Box Plate / Cylinder fallback
      if (part.parameters.length && part.parameters.width) {
        const shape = new THREE.Shape();
        const l = Number(part.parameters.length || 150);
        const w = Number(part.parameters.width || 100);
        const t = Number(part.parameters.thickness || 12);
        shape.moveTo(-l / 2, -w / 2);
        shape.lineTo(l / 2, -w / 2);
        shape.lineTo(l / 2, w / 2);
        shape.lineTo(-l / 2, w / 2);
        shape.closePath();

        const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 1, bevelSize: 1 });
        geo.center();
        const mesh = new THREE.Mesh(geo, createCADMaterial(part.material?.color || '#94a3b8'));
        const g = new THREE.Group();
        g.add(mesh);
        return g;
      }
      return generateShaft3D(part);
  }
}
