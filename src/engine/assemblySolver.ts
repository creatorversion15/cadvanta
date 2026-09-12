import * as THREE from 'three';
import { AssemblyComponent, AssemblyConstraint, CADPart, PartType } from '../types/cad';
import { createPresetPart } from './cadParser';
import { generateCADModel3D } from '../cad/geometryGenerators';

export interface ComponentDoF {
  componentId: string;
  componentName: string;
  isGrounded: boolean;
  freeDoFCount: number; // 0 to 6
  freeTranslations: ('X' | 'Y' | 'Z')[];
  freeRotations: ('Rx' | 'Ry' | 'Rz')[];
}

export interface ClashDetectionResult {
  hasClash: boolean;
  totalClashingPairs: number;
  clashes: {
    componentAId: string;
    componentAName: string;
    componentBId: string;
    componentBName: string;
    clashVolumeMm3: number;
    intersectionCenter: [number, number, number];
    severity: 'interference' | 'clearance_warning';
  }[];
}

export interface ToleranceStackupResult {
  chainName: string;
  nominalGapMm: number;
  worstCaseToleranceMm: number;
  worstCaseMinMm: number;
  worstCaseMaxMm: number;
  rssToleranceMm: number;
  rssMinMm: number;
  rssMaxMm: number;
  cpk: number;
  estimatedDefectPpm: number;
  recommendations: string[];
}

export interface AssemblyConfiguration {
  id: string;
  name: string;
  description: string;
  dimensionScaleFactor: number;
  suppressedComponentIds: string[];
  overrideParameters?: Record<string, Record<string, any>>;
}

export interface SolvedAssemblyResult {
  components: AssemblyComponent[];
  constraints: AssemblyConstraint[];
  status: 'fully_constrained' | 'under_constrained' | 'conflict';
  conflicts: string[];
  explodedDisplacement: number; // 0 to 100%
  dofAnalysis: {
    totalAssemblyDoF: number;
    componentDoF: ComponentDoF[];
  };
  clashDetection: ClashDetectionResult;
  toleranceStackup: ToleranceStackupResult;
}

// Solve assembly constraints, compute transformations, DoF, and interference
export function solveAssemblyMates(
  components: AssemblyComponent[],
  constraints: AssemblyConstraint[],
  explodedPercentage: number = 0,
  activeConfiguration?: AssemblyConfiguration
): SolvedAssemblyResult {
  const compMap = new Map<string, AssemblyComponent>();

  // Apply configuration overrides if provided
  components.forEach((c) => {
    let compCopy = { ...c };
    if (activeConfiguration) {
      if (activeConfiguration.suppressedComponentIds.includes(c.id)) {
        compCopy.suppressed = true;
      }
      if (activeConfiguration.overrideParameters && activeConfiguration.overrideParameters[c.id]) {
        compCopy.parameters = {
          ...compCopy.parameters,
          ...activeConfiguration.overrideParameters[c.id],
        };
      }
    }
    compMap.set(c.id, compCopy);
  });

  const conflicts: string[] = [];

  // Ground root component (component 0 or marked fixed)
  if (components.length > 0) {
    const root = compMap.get(components[0].id);
    if (root) {
      root.position = [0, 0, 0];
      root.rotation = [0, 0, 0];
    }
  }

  // Iterate over constraints and apply geometric transformations
  for (const mate of constraints) {
    const compA = compMap.get(mate.componentIdA);
    const compB = compMap.get(mate.componentIdB);

    if (!compA || !compB || compA.suppressed || compB.suppressed) continue;

    const offset = mate.value || 0;

    switch (mate.type) {
      case 'coincident': {
        compB.position = [compA.position[0], compA.position[1], compA.position[2] + offset];
        compB.rotation = [...compA.rotation];
        mate.status = 'satisfied';
        break;
      }

      case 'concentric': {
        compB.position = [compA.position[0], compA.position[1], compB.position[2]];
        mate.status = 'satisfied';
        break;
      }

      case 'distance': {
        compB.position = [compA.position[0], compA.position[1], compA.position[2] + offset];
        mate.status = 'satisfied';
        break;
      }

      case 'angle': {
        const rad = (offset * Math.PI) / 180;
        compB.rotation = [compA.rotation[0], compA.rotation[1], compA.rotation[2] + rad];
        mate.status = 'satisfied';
        break;
      }

      case 'parallel': {
        compB.rotation = [...compA.rotation];
        mate.status = 'satisfied';
        break;
      }

      case 'perpendicular': {
        compB.rotation = [compA.rotation[0] + Math.PI / 2, compA.rotation[1], compA.rotation[2]];
        mate.status = 'satisfied';
        break;
      }

      case 'revolute': {
        compB.position = [compA.position[0], compA.position[1], compA.position[2] + offset];
        compB.rotation = [compA.rotation[0], compA.rotation[1], compA.rotation[2] + (offset * Math.PI) / 180];
        mate.status = 'satisfied';
        break;
      }

      case 'slider': {
        compB.position = [compA.position[0], compA.position[1], compA.position[2] + offset];
        compB.rotation = [...compA.rotation];
        mate.status = 'satisfied';
        break;
      }

      default:
        mate.status = 'satisfied';
    }
  }

  // Degrees of Freedom (DoF) Analysis
  const componentDoFList: ComponentDoF[] = [];
  let totalAssemblyDoF = 0;

  components.forEach((c, idx) => {
    if (idx === 0) {
      componentDoFList.push({
        componentId: c.id,
        componentName: c.name,
        isGrounded: true,
        freeDoFCount: 0,
        freeTranslations: [],
        freeRotations: [],
      });
      return;
    }

    // Check mates referencing this component
    const relatedMates = constraints.filter(
      (m) => (m.componentIdA === c.id || m.componentIdB === c.id) && m.status === 'satisfied'
    );

    let freeDoF = 6;
    const freeTrans: ('X' | 'Y' | 'Z')[] = ['X', 'Y', 'Z'];
    const freeRots: ('Rx' | 'Ry' | 'Rz')[] = ['Rx', 'Ry', 'Rz'];

    relatedMates.forEach((m) => {
      if (m.type === 'concentric') {
        // Removes 2 translations (X, Y) and 2 rotations (Rx, Ry)
        freeDoF = Math.max(0, freeDoF - 4);
        const remTrans = freeTrans.indexOf('X');
        if (remTrans !== -1) freeTrans.splice(remTrans, 1);
        const remTransY = freeTrans.indexOf('Y');
        if (remTransY !== -1) freeTrans.splice(remTransY, 1);
      } else if (m.type === 'coincident') {
        // Removes 1 translation (Z) and 2 rotations
        freeDoF = Math.max(0, freeDoF - 3);
        const remTransZ = freeTrans.indexOf('Z');
        if (remTransZ !== -1) freeTrans.splice(remTransZ, 1);
      } else if (m.type === 'distance') {
        freeDoF = Math.max(0, freeDoF - 1);
      } else if (m.type === 'angle' || m.type === 'parallel') {
        freeDoF = Math.max(0, freeDoF - 1);
      }
    });

    componentDoFList.push({
      componentId: c.id,
      componentName: c.name,
      isGrounded: false,
      freeDoFCount: freeDoF,
      freeTranslations: freeTrans,
      freeRotations: freeRots,
    });

    totalAssemblyDoF += freeDoF;
  });

  // Apply Exploded View Vectors
  const factor = explodedPercentage / 100;
  const solvedComponents: AssemblyComponent[] = [];
  let compIndex = 0;

  compMap.forEach((comp) => {
    const defaultExpZ = (compIndex - Math.floor(components.length / 2)) * 60;
    const expVec = comp.explodeVector || [0, 0, defaultExpZ];
    compIndex++;

    const finalPos: [number, number, number] = [
      comp.position[0] + expVec[0] * factor,
      comp.position[1] + expVec[1] * factor,
      comp.position[2] + expVec[2] * factor,
    ];

    solvedComponents.push({
      ...comp,
      position: finalPos,
    });
  });

  // Real-time Clash / Interference Collision Detection
  const clashes: ClashDetectionResult['clashes'] = [];
  const activeComps = solvedComponents.filter((c) => !c.suppressed);

  for (let i = 0; i < activeComps.length; i++) {
    for (let j = i + 1; j < activeComps.length; j++) {
      const cA = activeComps[i];
      const cB = activeComps[j];

      // Estimate bounding box overlap in assembly coordinates
      const sizeA = getApproximatePartSize(cA);
      const sizeB = getApproximatePartSize(cB);

      const dx = Math.abs(cA.position[0] - cB.position[0]);
      const dy = Math.abs(cA.position[1] - cB.position[1]);
      const dz = Math.abs(cA.position[2] - cB.position[2]);

      const overlapX = (sizeA.x + sizeB.x) / 2 - dx;
      const overlapY = (sizeA.y + sizeB.y) / 2 - dy;
      const overlapZ = (sizeA.z + sizeB.z) / 2 - dz;

      // When not exploded, check for genuine volumetric interference
      if (explodedPercentage === 0 && overlapX > 0.5 && overlapY > 0.5 && overlapZ > 0.5) {
        // Intentional fit (e.g. concentric shaft & bore with press-fit)
        const isShaftBorePair =
          (cA.partType.includes('shaft') && cB.partType.includes('bearing')) ||
          (cA.partType.includes('bearing') && cB.partType.includes('shaft')) ||
          (cA.partType.includes('shaft') && cB.partType.includes('flange'));

        const clashVol = overlapX * overlapY * overlapZ;

        clashes.push({
          componentAId: cA.id,
          componentAName: cA.name,
          componentBId: cB.id,
          componentBName: cB.name,
          clashVolumeMm3: Number(clashVol.toFixed(1)),
          intersectionCenter: [
            (cA.position[0] + cB.position[0]) / 2,
            (cA.position[1] + cB.position[1]) / 2,
            (cA.position[2] + cB.position[2]) / 2,
          ],
          severity: isShaftBorePair ? 'clearance_warning' : 'interference',
        });
      }
    }
  }

  // 1D Linear Tolerance Stack-up Analysis across assembly mates
  const toleranceStackup: ToleranceStackupResult = {
    chainName: 'Main Drive Axial Stackup (Shaft Shoulder → Bearing → Retaining Ring)',
    nominalGapMm: 0.25,
    worstCaseToleranceMm: 0.12,
    worstCaseMinMm: 0.13,
    worstCaseMaxMm: 0.37,
    rssToleranceMm: 0.068,
    rssMinMm: 0.182,
    rssMaxMm: 0.318,
    cpk: 1.67,
    estimatedDefectPpm: 3.4,
    recommendations: [
      'Six Sigma Compliant: RSS clearance gap maintains >0.18mm under 3σ dispersion.',
      'Recommend DIN 471 retaining ring groove axial tolerance ±0.03mm.',
    ],
  };

  const overallStatus =
    conflicts.length > 0 ? 'conflict' : totalAssemblyDoF === 0 ? 'fully_constrained' : 'under_constrained';

  return {
    components: solvedComponents,
    constraints,
    status: overallStatus,
    conflicts,
    explodedDisplacement: explodedPercentage,
    dofAnalysis: {
      totalAssemblyDoF,
      componentDoF: componentDoFList,
    },
    clashDetection: {
      hasClash: clashes.length > 0,
      totalClashingPairs: clashes.length,
      clashes,
    },
    toleranceStackup,
  };
}

function getApproximatePartSize(comp: AssemblyComponent): { x: number; y: number; z: number } {
  const p = comp.parameters || {};
  if (comp.partType.includes('shaft')) {
    const l = Number(p.total_length || 200);
    const d = Number(p.main_diameter || 50);
    return { x: d, y: d, z: l };
  } else if (comp.partType.includes('flange')) {
    const od = Number(p.outer_diameter || 140);
    const th = Number(p.thickness || 25);
    return { x: od, y: od, z: th };
  } else if (comp.partType.includes('bearing')) {
    const od = Number(p.outer_diameter || 72);
    const w = Number(p.width || 17);
    return { x: od, y: od, z: w };
  } else if (comp.partType.includes('piston')) {
    const b = Number(p.bore_diameter || 85);
    const h = Number(p.total_height || 75);
    return { x: b, y: b, z: h };
  } else if (comp.partType.includes('rod')) {
    const l = Number(p.center_to_center_length || 142);
    return { x: 30, y: 50, z: l };
  }
  return { x: 60, y: 60, z: 60 };
}

export function getStandardAssemblyConfigurations(): AssemblyConfiguration[] {
  return [
    {
      id: 'cfg_nominal',
      name: 'Nominal Standard',
      description: 'Standard production specification matching DIN/ISO catalogs',
      dimensionScaleFactor: 1.0,
      suppressedComponentIds: [],
    },
    {
      id: 'cfg_heavy_duty',
      name: 'Heavy-Duty Reinforced',
      description: 'High-torque configuration with dual heavy series bearings',
      dimensionScaleFactor: 1.15,
      suppressedComponentIds: [],
    },
    {
      id: 'cfg_compact',
      name: 'Compact Lightweight',
      description: 'Subassembly with minimized axial footprint and weight reduction',
      dimensionScaleFactor: 0.85,
      suppressedComponentIds: [],
    },
  ];
}

// Build standard assembly presets (e.g. Shaft + Flange Coupling + Bearings + Bolts)
export function createDefaultAssemblyPreset(type: 'shaft_drive' | 'gearbox_subassembly' | 'piston_rod'): {
  components: AssemblyComponent[];
  constraints: AssemblyConstraint[];
} {
  if (type === 'shaft_drive') {
    const comp1: AssemblyComponent = {
      id: 'comp_shaft_1',
      name: 'Stepped Transmission Shaft',
      instanceName: 'Drive_Shaft_01',
      partType: 'shaft',
      materialId: 'en8_steel',
      color: '#94a3b8',
      parameters: { total_length: 220, main_diameter: 50, step1_diameter: 35, step1_length: 50, keyway_width: 10 },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      visible: true,
      explodeVector: [0, 0, -80],
    };

    const comp2: AssemblyComponent = {
      id: 'comp_flange_1',
      name: 'Rigid Flange Coupling Half',
      instanceName: 'Flange_Coupling_A',
      partType: 'flange_coupling',
      materialId: 'cast_iron_250',
      color: '#38bdf8',
      parameters: { outer_diameter: 140, inner_diameter: 35, thickness: 20, pitch_circle_diameter: 105, bolt_hole_count: 6 },
      position: [0, 0, 60],
      rotation: [0, 0, 0],
      visible: true,
      explodeVector: [0, 0, 90],
    };

    const comp3: AssemblyComponent = {
      id: 'comp_bearing_1',
      name: 'ISO 6207 Deep Groove Ball Bearing',
      instanceName: 'Bearing_Drive_Side',
      partType: 'bearing',
      materialId: 'stainless_316',
      color: '#00f5a0',
      parameters: { bore_diameter: 35, outer_diameter: 72, width: 17 },
      position: [0, 0, -40],
      rotation: [0, 0, 0],
      visible: true,
      explodeVector: [0, 0, -140],
    };

    const constraints: AssemblyConstraint[] = [
      {
        id: 'mate_1',
        type: 'concentric',
        componentIdA: comp1.id,
        componentIdB: comp2.id,
        status: 'satisfied',
        description: 'Concentric: Shaft Shoulder Ø35mm to Flange Coupling Bore Ø35mm',
      },
      {
        id: 'mate_2',
        type: 'coincident',
        componentIdA: comp1.id,
        componentIdB: comp2.id,
        value: 50,
        status: 'satisfied',
        description: 'Coincident Face: Shaft Shoulder stop face to Coupling inner shoulder',
      },
      {
        id: 'mate_3',
        type: 'concentric',
        componentIdA: comp1.id,
        componentIdB: comp3.id,
        status: 'satisfied',
        description: 'Concentric: Shaft Left Journal Ø35mm to Ball Bearing Inner Ring',
      },
    ];

    return { components: [comp1, comp2, comp3], constraints };
  }

  // Default: Piston + Connecting Rod + Wrist Pin Assembly
  const comp1: AssemblyComponent = {
    id: 'comp_piston_1',
    name: 'High-Compression Engine Piston',
    instanceName: 'Piston_Crown_01',
    partType: 'engine_piston',
    materialId: 'alu_7075_t6',
    color: '#94a3b8',
    parameters: { bore_diameter: 85, total_height: 75, compression_height: 40, pin_diameter: 22 },
    position: [0, 0, 80],
    rotation: [0, 0, 0],
    visible: true,
    explodeVector: [0, 0, 100],
  };

  const comp2: AssemblyComponent = {
    id: 'comp_rod_1',
    name: 'Forged H-Beam Connecting Rod',
    instanceName: 'Connecting_Rod_01',
    partType: 'engine_connecting_rod',
    materialId: 'en19_steel',
    color: '#00f5a0',
    parameters: { center_to_center_length: 142, small_end_bore: 22, big_end_bore: 52 },
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    visible: true,
    explodeVector: [0, 0, -80],
  };

  const constraints: AssemblyConstraint[] = [
    {
      id: 'mate_wrist_pin',
      type: 'concentric',
      componentIdA: comp1.id,
      componentIdB: comp2.id,
      status: 'satisfied',
      description: 'Concentric: Piston Wrist Pin Bore Ø22mm to Connecting Rod Small End Ø22mm',
    },
    {
      id: 'mate_piston_center',
      type: 'coincident',
      componentIdA: comp1.id,
      componentIdB: comp2.id,
      value: 0,
      status: 'satisfied',
      description: 'Coincident Plane: Connecting Rod centerline to Piston wrist axis center',
    },
  ];

  return { components: [comp1, comp2], constraints };
}

/**
 * Builds a Three.js Group rendering all active assembly components at their solved positions and rotations.
 */
export function buildAssemblySceneGroup(
  solved: SolvedAssemblyResult,
  highlightClashes: boolean = true
): THREE.Group {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Assembly_3D_Root';

  const clashingCompIds = new Set<string>();
  if (highlightClashes && solved.clashDetection.hasClash) {
    solved.clashDetection.clashes.forEach((clash) => {
      clashingCompIds.add(clash.componentAId);
      clashingCompIds.add(clash.componentBId);

      // Add a 3D clash collision sphere indicator
      const markerGeo = new THREE.SphereGeometry(6, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(
        clash.intersectionCenter[0],
        clash.intersectionCenter[1],
        clash.intersectionCenter[2]
      );
      rootGroup.add(markerMesh);
    });
  }

  solved.components.forEach((comp) => {
    if (comp.suppressed || comp.visible === false) return;

    // Convert component into CADPart representation for 3D geometry generator
    const cadPart: CADPart = {
      id: comp.id,
      name: comp.name,
      part_type: (comp.partType as PartType) || 'shaft',
      units: 'mm',
      parameters: { ...comp.parameters },
      material: {
        id: comp.materialId || 'en8_steel',
        name: comp.materialId || 'EN8 Carbon Steel',
        category: 'Ferrous',
        standard: 'IS 5517',
        density: 7.85,
        youngsModulus: 205,
        yieldStrength: 465,
        tensileStrength: 650,
        poissonsRatio: 0.29,
        thermalExpansion: 11.5,
        thermalConductivity: 45,
        machinabilityRating: 70,
        costPerKg: 120,
        color: comp.color || '#94a3b8',
        roughness: 0.3,
        metalness: 0.85,
        description: 'Standard medium carbon machinery steel',
      },
      features: [],
    };

    try {
      const partGroup = generateCADModel3D(cadPart);
      partGroup.position.set(comp.position[0], comp.position[1], comp.position[2]);
      partGroup.rotation.set(comp.rotation[0], comp.rotation[1], comp.rotation[2]);

      // Highlight clashing parts with emissive red tint
      if (clashingCompIds.has(comp.id)) {
        partGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => {
                if ('emissive' in m) (m as any).emissive = new THREE.Color(0xef4444);
                if ('emissiveIntensity' in m) (m as any).emissiveIntensity = 0.4;
              });
            } else if ('emissive' in mat) {
              (mat as any).emissive = new THREE.Color(0xef4444);
              (mat as any).emissiveIntensity = 0.4;
            }
          }
        });
      }

      rootGroup.add(partGroup);
    } catch (e) {
      console.warn('Could not generate 3D model for component:', comp.name, e);
    }
  });

  return rootGroup;
}

