import { AssemblyComponent, AssemblyConstraint, PartType } from '../types/cad';

export interface MechanicalFeature {
  id: string;
  name: string;
  type: 'cylindrical_journal' | 'cylindrical_bore' | 'planar_face' | 'pin_joint' | 'keyway' | 'flange_mount' | 'gear_pitch';
  diameter?: number;
  length?: number;
  width?: number;
  normal?: [number, number, number];
  centerOffset?: [number, number, number];
  description: string;
}

export interface SmartMateSuggestion {
  id: string;
  componentIdA: string;
  componentNameA: string;
  partTypeA: PartType;
  featureA: MechanicalFeature;

  componentIdB: string;
  componentNameB: string;
  partTypeB: PartType;
  featureB: MechanicalFeature;

  suggestedType: AssemblyConstraint['type'];
  confidence: number; // 0 to 100
  fitClass: string; // e.g. "ISO H7/h6 Locational Fit", "Flush Shoulder Contact", "Coaxial Kinematic"
  spatialDistanceMm: number;
  radialOffsetMm: number;
  axialDistanceMm: number;
  suggestedValue: number;
  dofRemoved: string; // e.g. "4 DoF (Tx, Ty, Rx, Ry)"
  engineeringRationale: string;
  isApplied: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface SmartAssemblyAnalysis {
  suggestions: SmartMateSuggestion[];
  totalSuggestions: number;
  highConfidenceCount: number;
  unappliedCount: number;
  assemblyCohesionScore: number; // 0 to 100
  kinematicReadiness: string;
  featureSummary: {
    componentId: string;
    componentName: string;
    features: MechanicalFeature[];
  }[];
}

/**
 * Extracts mechanical features from a component based on its part type and geometry parameters.
 */
export function extractComponentFeatures(comp: AssemblyComponent): MechanicalFeature[] {
  const p = comp.parameters || {};
  const pt = comp.partType;
  const features: MechanicalFeature[] = [];

  if (pt.includes('shaft')) {
    const mainD = Number(p.main_diameter || 50);
    const step1D = Number(p.step1_diameter || 35);
    const totalL = Number(p.total_length || 200);

    features.push({
      id: `${comp.id}_main_journal`,
      name: `Main Shaft Journal Ø${mainD}mm`,
      type: 'cylindrical_journal',
      diameter: mainD,
      length: totalL,
      normal: [0, 0, 1],
      centerOffset: [0, 0, 0],
      description: `Primary transmission shaft journal Ø${mainD}mm for heavy-duty torque transfer`,
    });

    if (step1D && step1D !== mainD) {
      features.push({
        id: `${comp.id}_step_journal`,
        name: `Stepped Journal Ø${step1D}mm`,
        type: 'cylindrical_journal',
        diameter: step1D,
        length: Number(p.step1_length || 50),
        normal: [0, 0, 1],
        centerOffset: [0, 0, 30],
        description: `Precision bearing/coupling seat diameter Ø${step1D}mm (ISO js6/k5)`,
      });

      features.push({
        id: `${comp.id}_shoulder_face`,
        name: `Shaft Shoulder Stop Face (Ø${mainD} → Ø${step1D})`,
        type: 'planar_face',
        diameter: mainD,
        normal: [0, 0, 1],
        centerOffset: [0, 0, 25],
        description: `Ground axial thrust reference shoulder face`,
      });
    }

    if (p.keyway_width) {
      features.push({
        id: `${comp.id}_keyway`,
        name: `DIN 6885 Form A Keyway (${p.keyway_width}mm)`,
        type: 'keyway',
        width: Number(p.keyway_width),
        description: `Torsional lock keyway groove for positive drive coupling`,
      });
    }
  } else if (pt.includes('flange')) {
    const od = Number(p.outer_diameter || 140);
    const id = Number(p.inner_diameter || 35);
    const th = Number(p.thickness || 20);
    const pcd = Number(p.pitch_circle_diameter || 105);

    features.push({
      id: `${comp.id}_bore`,
      name: `Flange Hub Bore Ø${id}mm`,
      type: 'cylindrical_bore',
      diameter: id,
      length: th,
      normal: [0, 0, 1],
      description: `Coupling hub bore Ø${id}mm designed for shaft journal fit (ISO H7)`,
    });

    features.push({
      id: `${comp.id}_mating_face`,
      name: `Flange Coupling Joint Face Ø${od}mm`,
      type: 'planar_face',
      diameter: od,
      normal: [0, 0, 1],
      description: `Precision-machined flat coupling contact plane for torque transmission`,
    });

    features.push({
      id: `${comp.id}_pcd`,
      name: `Bolt Hole Circle PCD Ø${pcd}mm`,
      type: 'flange_mount',
      diameter: pcd,
      description: `${p.bolt_hole_count || 6}-hole standard fastener pattern for rigid clamping`,
    });
  } else if (pt.includes('bearing')) {
    const bore = Number(p.bore_diameter || 35);
    const od = Number(p.outer_diameter || 72);
    const w = Number(p.width || 17);

    features.push({
      id: `${comp.id}_inner_bore`,
      name: `Bearing Inner Ring Bore Ø${bore}mm`,
      type: 'cylindrical_bore',
      diameter: bore,
      length: w,
      normal: [0, 0, 1],
      description: `Precision inner race bore Ø${bore}mm designed for shaft seating (ISO 286 j6/k5)`,
    });

    features.push({
      id: `${comp.id}_outer_ring`,
      name: `Bearing Outer Ring Ø${od}mm`,
      type: 'cylindrical_journal',
      diameter: od,
      length: w,
      normal: [0, 0, 1],
      description: `Bearing outer housing locate surface Ø${od}mm`,
    });

    features.push({
      id: `${comp.id}_side_face`,
      name: `Bearing Thrust Face (Width ${w}mm)`,
      type: 'planar_face',
      diameter: od,
      normal: [0, 0, 1],
      description: `Bearing inner/outer ring datum thrust face for axial positioning`,
    });
  } else if (pt.includes('piston')) {
    const bore = Number(p.bore_diameter || 85);
    const pinD = Number(p.pin_diameter || 22);
    const h = Number(p.total_height || 75);

    features.push({
      id: `${comp.id}_crown_axis`,
      name: `Piston Cylinder Axis Ø${bore}mm`,
      type: 'cylindrical_journal',
      diameter: bore,
      length: h,
      normal: [0, 0, 1],
      description: `Cylinder bore sliding axis and crown combustion surface`,
    });

    features.push({
      id: `${comp.id}_wrist_pin_bore`,
      name: `Wrist Pin Boss Bore Ø${pinD}mm`,
      type: 'pin_joint',
      diameter: pinD,
      normal: [1, 0, 0],
      description: `Transverse wrist pin journal bore Ø${pinD}mm connecting to small end`,
    });

    features.push({
      id: `${comp.id}_wrist_center_plane`,
      name: `Piston Pin Center Symmetry Plane`,
      type: 'planar_face',
      normal: [0, 1, 0],
      description: `Longitudinal centerline symmetry plane for rod small end centering`,
    });
  } else if (pt.includes('rod')) {
    const smallEnd = Number(p.small_end_bore || 22);
    const bigEnd = Number(p.big_end_bore || 52);
    const l = Number(p.center_to_center_length || 142);

    features.push({
      id: `${comp.id}_small_end`,
      name: `Connecting Rod Small End Bore Ø${smallEnd}mm`,
      type: 'pin_joint',
      diameter: smallEnd,
      normal: [1, 0, 0],
      description: `Bushed wrist pin bore Ø${smallEnd}mm designed to mate with piston pin boss`,
    });

    features.push({
      id: `${comp.id}_big_end`,
      name: `Connecting Rod Big End Journal Bore Ø${bigEnd}mm`,
      type: 'cylindrical_bore',
      diameter: bigEnd,
      normal: [1, 0, 0],
      description: `Crankshaft crankpin journal bore Ø${bigEnd}mm with split shell bearings`,
    });

    features.push({
      id: `${comp.id}_centerline_plane`,
      name: `Rod Beam Center Symmetry Plane (${l}mm C-C)`,
      type: 'planar_face',
      normal: [0, 1, 0],
      description: `Center symmetry web plane along ${l}mm center-to-center connecting arm`,
    });
  } else if (pt.includes('gear')) {
    const mod = Number(p.module || 2.0);
    const teeth = Number(p.teeth || 30);
    const pd = mod * teeth;
    const bore = Number(p.bore_diameter || 30);

    features.push({
      id: `${comp.id}_bore`,
      name: `Gear Shaft Bore Ø${bore}mm`,
      type: 'cylindrical_bore',
      diameter: bore,
      normal: [0, 0, 1],
      description: `Drive shaft mount bore Ø${bore}mm with keyway seat`,
    });

    features.push({
      id: `${comp.id}_pitch_circle`,
      name: `Pitch Circle PCD Ø${pd}mm (z=${teeth})`,
      type: 'gear_pitch',
      diameter: pd,
      description: `Theoretical kinematic rolling pitch circle for involute meshing`,
    });

    features.push({
      id: `${comp.id}_thrust_face`,
      name: `Gear Hub Thrust Face`,
      type: 'planar_face',
      normal: [0, 0, 1],
      description: `Axial gear face against shaft locating ring`,
    });
  } else {
    // Generic mechanical component fallback
    features.push({
      id: `${comp.id}_center_axis`,
      name: `${comp.name} Symmetry Axis`,
      type: 'cylindrical_journal',
      diameter: 40,
      normal: [0, 0, 1],
      description: `Centerline geometry axis for coaxial alignment`,
    });
    features.push({
      id: `${comp.id}_base_face`,
      name: `${comp.name} Mounting Reference Face`,
      type: 'planar_face',
      normal: [0, 0, 1],
      description: `Primary planar mounting contact face`,
    });
  }

  return features;
}

/**
 * Intelligent Smart Assembly constraint analysis engine.
 * Inspects spatial proximity, rotational vectors, and mechanical feature compatibility.
 */
export function analyzeSmartAssemblyMates(
  components: AssemblyComponent[],
  existingConstraints: AssemblyConstraint[],
  maxProximityThresholdMm: number = 250
): SmartAssemblyAnalysis {
  const suggestions: SmartMateSuggestion[] = [];
  const activeComps = components.filter((c) => !c.suppressed);

  // Extract features for each component
  const featureMap = new Map<string, MechanicalFeature[]>();
  const featureSummary: SmartAssemblyAnalysis['featureSummary'] = [];

  activeComps.forEach((c) => {
    const fList = extractComponentFeatures(c);
    featureMap.set(c.id, fList);
    featureSummary.push({
      componentId: c.id,
      componentName: c.name,
      features: fList,
    });
  });

  // Helper to check if a mate is already applied in existing constraints
  const isMateAlreadyApplied = (
    cIdA: string,
    cIdB: string,
    mateType: AssemblyConstraint['type']
  ): boolean => {
    return existingConstraints.some((m) => {
      const matchPair =
        (m.componentIdA === cIdA && m.componentIdB === cIdB) ||
        (m.componentIdA === cIdB && m.componentIdB === cIdA);
      return matchPair && m.type === mateType;
    });
  };

  // Compare every pair of components
  for (let i = 0; i < activeComps.length; i++) {
    for (let j = i + 1; j < activeComps.length; j++) {
      const compA = activeComps[i];
      const compB = activeComps[j];

      // Spatial calculations
      const dx = compA.position[0] - compB.position[0];
      const dy = compA.position[1] - compB.position[1];
      const dz = compA.position[2] - compB.position[2];

      const spatialDist = Math.hypot(dx, dy, dz);
      const radialOffset = Math.hypot(dx, dy);
      const axialDist = Math.abs(dz);

      // Skip pairs that are far apart beyond proximity threshold
      if (spatialDist > maxProximityThresholdMm) continue;

      const featsA = featureMap.get(compA.id) || [];
      const featsB = featureMap.get(compB.id) || [];

      // 1. Evaluate Cylindrical Concentric Coaxial Mates (Shaft / Journal ↔ Bore / Ring)
      featsA.forEach((fa) => {
        featsB.forEach((fb) => {
          // Check for Shaft-to-Bore or Pin-to-Hole pairing
          const isJournalToBore =
            (fa.type === 'cylindrical_journal' && fb.type === 'cylindrical_bore') ||
            (fa.type === 'cylindrical_bore' && fb.type === 'cylindrical_journal') ||
            (fa.type === 'pin_joint' && fb.type === 'pin_joint') ||
            (fa.type === 'cylindrical_journal' && fb.type === 'pin_joint') ||
            (fa.type === 'pin_joint' && fb.type === 'cylindrical_bore');

          if (isJournalToBore) {
            const dA = fa.diameter || 0;
            const dB = fb.diameter || 0;
            const deltaD = Math.abs(dA - dB);

            let confidence = 0;
            let fitClass = 'Coaxial Kinematic Fit';

            if (deltaD < 0.2) {
              confidence = 98;
              fitClass = 'ISO 286 H7/h6 Precision Clearance Fit';
            } else if (deltaD <= 2.0) {
              confidence = 92;
              fitClass = 'Locational Clearance Fit (ΔD ≤ 2mm)';
            } else if (deltaD <= 6.0) {
              confidence = 78;
              fitClass = 'Transition / Close-Tolerance Shaft Fit';
            } else {
              confidence = 60;
              fitClass = 'General Coaxial Alignment';
            }

            // Proximity bonus: if radial offset is already close (< 20mm), high confidence
            if (radialOffset < 15) {
              confidence = Math.min(99, confidence + 5);
            }

            const alreadyApplied = isMateAlreadyApplied(compA.id, compB.id, 'concentric');

            suggestions.push({
              id: `smart_${compA.id}_${compB.id}_concentric_${fa.id}_${fb.id}`,
              componentIdA: compA.id,
              componentNameA: compA.name,
              partTypeA: compA.partType,
              featureA: fa,
              componentIdB: compB.id,
              componentNameB: compB.name,
              partTypeB: compB.partType,
              featureB: fb,
              suggestedType: 'concentric',
              confidence,
              fitClass,
              spatialDistanceMm: Number(spatialDist.toFixed(1)),
              radialOffsetMm: Number(radialOffset.toFixed(1)),
              axialDistanceMm: Number(axialDist.toFixed(1)),
              suggestedValue: 0,
              dofRemoved: '-4 DoF (X, Y Trans + Rx, Ry Rot)',
              engineeringRationale: `Locks radial axes of ${fa.name} and ${fb.name} together. Diameter match ΔD = ${deltaD.toFixed(1)}mm. Retains axial rotation & translation for drive transfer.`,
              isApplied: alreadyApplied,
              priority: confidence >= 90 ? 'high' : confidence >= 75 ? 'medium' : 'low',
            });
          }

          // 2. Evaluate Planar Coincident / Distance Face Mates
          const isFacePair = fa.type === 'planar_face' && fb.type === 'planar_face';
          if (isFacePair) {
            let confidence = 75;
            let fitClass = 'Planar Thrust Stop Contact';
            let suggestedValue = 0;

            // If concentric mate exists or is likely, face coincident is high priority
            const hasConcentric =
              isMateAlreadyApplied(compA.id, compB.id, 'concentric') ||
              suggestions.some(
                (s) =>
                  (s.componentIdA === compA.id && s.componentIdB === compB.id) ||
                  (s.componentIdA === compB.id && s.componentIdB === compA.id)
              );

            if (hasConcentric) {
              confidence += 15;
            }

            if (axialDist < 60) {
              confidence += 8;
            }

            confidence = Math.min(96, Math.max(50, confidence));

            // If axial gap is moderate, suggest either flush coincident or offset distance
            const suggestedType: AssemblyConstraint['type'] =
              axialDist > 2 && axialDist < 50 ? 'coincident' : 'coincident';

            const alreadyApplied =
              isMateAlreadyApplied(compA.id, compB.id, 'coincident') ||
              isMateAlreadyApplied(compA.id, compB.id, 'distance');

            suggestions.push({
              id: `smart_${compA.id}_${compB.id}_coincident_${fa.id}_${fb.id}`,
              componentIdA: compA.id,
              componentNameA: compA.name,
              partTypeA: compA.partType,
              featureA: fa,
              componentIdB: compB.id,
              componentNameB: compB.name,
              partTypeB: compB.partType,
              featureB: fb,
              suggestedType,
              confidence,
              fitClass,
              spatialDistanceMm: Number(spatialDist.toFixed(1)),
              radialOffsetMm: Number(radialOffset.toFixed(1)),
              axialDistanceMm: Number(axialDist.toFixed(1)),
              suggestedValue,
              dofRemoved: '-3 DoF (Z Trans + Rx, Ry Rot)',
              engineeringRationale: `Locates axial thrust face between ${fa.name} and ${fb.name}. Establishes solid metal-to-metal seating shoulder with zero axial play.`,
              isApplied: alreadyApplied,
              priority: confidence >= 85 ? 'high' : 'medium',
            });
          }

          // 3. Evaluate Kinematic Pin Joint / Revolute Mate
          const isPinPair =
            (fa.type === 'pin_joint' && fb.type === 'pin_joint') ||
            (compA.partType.includes('piston') && compB.partType.includes('rod'));

          if (isPinPair && fa.id.includes('wrist') && fb.id.includes('small_end')) {
            const alreadyApplied = isMateAlreadyApplied(compA.id, compB.id, 'revolute');
            suggestions.push({
              id: `smart_${compA.id}_${compB.id}_revolute_${fa.id}_${fb.id}`,
              componentIdA: compA.id,
              componentNameA: compA.name,
              partTypeA: compA.partType,
              featureA: fa,
              componentIdB: compB.id,
              componentNameB: compB.name,
              partTypeB: compB.partType,
              featureB: fb,
              suggestedType: 'revolute',
              confidence: 94,
              fitClass: 'Kinematic Oscillating Pin Joint',
              spatialDistanceMm: Number(spatialDist.toFixed(1)),
              radialOffsetMm: Number(radialOffset.toFixed(1)),
              axialDistanceMm: Number(axialDist.toFixed(1)),
              suggestedValue: 0,
              dofRemoved: '-5 DoF (All except oscillating Ry)',
              engineeringRationale: `Revolute kinematic freedom allows connecting rod to oscillate ±18° around wrist pin centerline during piston reciprocation.`,
              isApplied: alreadyApplied,
              priority: 'high',
            });
          }
        });
      });
    }
  }

  // Deduplicate suggestions with identical component pair and mate type
  const uniqueSuggestionsMap = new Map<string, SmartMateSuggestion>();
  suggestions.forEach((s) => {
    const key = `${s.componentIdA}_${s.componentIdB}_${s.suggestedType}`;
    const reverseKey = `${s.componentIdB}_${s.componentIdA}_${s.suggestedType}`;
    if (!uniqueSuggestionsMap.has(key) && !uniqueSuggestionsMap.has(reverseKey)) {
      uniqueSuggestionsMap.set(key, s);
    } else {
      // Keep the one with higher confidence
      const existing = uniqueSuggestionsMap.get(key) || uniqueSuggestionsMap.get(reverseKey)!;
      if (s.confidence > existing.confidence) {
        uniqueSuggestionsMap.set(key, s);
        uniqueSuggestionsMap.delete(reverseKey);
      }
    }
  });

  const dedupedSuggestions = Array.from(uniqueSuggestionsMap.values()).sort(
    (a, b) => b.confidence - a.confidence
  );

  const highConfidenceCount = dedupedSuggestions.filter((s) => s.confidence >= 85).length;
  const unappliedCount = dedupedSuggestions.filter((s) => !s.isApplied).length;

  // Calculate overall assembly cohesion score
  const appliedCount = dedupedSuggestions.filter((s) => s.isApplied).length;
  const cohesionScore =
    dedupedSuggestions.length > 0
      ? Math.round((appliedCount / Math.max(1, dedupedSuggestions.length)) * 100)
      : 100;

  const kinematicReadiness =
    unappliedCount === 0
      ? 'Fully Constrained Kinematic Train'
      : unappliedCount <= 2
      ? 'Partially Constrained — Minor DoF Open'
      : 'Under-Constrained Multi-Body Assembly';

  return {
    suggestions: dedupedSuggestions,
    totalSuggestions: dedupedSuggestions.length,
    highConfidenceCount,
    unappliedCount,
    assemblyCohesionScore: cohesionScore,
    kinematicReadiness,
    featureSummary,
  };
}

/**
 * Convenience helper to generate smart mate suggestions directly.
 */
export function generateSmartMateSuggestions(
  components: AssemblyComponent[],
  existingConstraints: AssemblyConstraint[] = []
): SmartMateSuggestion[] {
  return analyzeSmartAssemblyMates(components, existingConstraints).suggestions;
}
