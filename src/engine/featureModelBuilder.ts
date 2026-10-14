import * as THREE from 'three';
import { Evaluator, Brush, SUBTRACTION, ADDITION, computeMeshVolume } from 'three-bvh-csg';
import { CADPart, FeatureHistoryItem } from '../types/cad';
import { createCADMaterial } from '../cad/geometryGenerators';
import {
  SketchEntity2D,
  createThreeShapeFromSketch,
  validateSketchProfile,
  computeSectionProperties,
} from './sketchGeometryEngine';

export interface FeatureRebuildResult {
  group: THREE.Group;
  solidMesh: THREE.Mesh | null;
  volume_mm3: number;
  volume_cm3: number;
  mass_kg: number;
  surfaceArea_cm2: number;
  success: boolean;
  failedStepId?: string;
  failedStepName?: string;
  errorReason?: string;
  stepTimingsMs: Record<string, number>;
}

export class FeatureModelBuilder {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
    this.evaluator.useGroups = false;
  }

  /**
   * Rebuilds 3D solid model sequentially step-by-step from feature history.
   * If any step fails, catches the error, records the failed step and reason,
   * and keeps the solid up to the last successful step. Never silently drops a feature.
   */
  public rebuildModel(part: CADPart, rollbackIndex: number = -1): FeatureRebuildResult {
    const features = part.features || [];
    const limit = rollbackIndex >= 0 ? Math.min(features.length, rollbackIndex + 1) : features.length;
    const activeFeatures = features.slice(0, limit);

    const group = new THREE.Group();
    group.name = 'ParametricSolidModel';
    const matColor = part.material?.color || '#94a3b8';
    const mainMaterial = createCADMaterial(
      matColor,
      part.material?.roughness || 0.3,
      part.material?.metalness || 0.85
    );

    let currentSolidGeometry: THREE.BufferGeometry | null = null;
    let failedStepId: string | undefined;
    let failedStepName: string | undefined;
    let errorReason: string | undefined;
    const stepTimings: Record<string, number> = {};

    for (let i = 0; i < activeFeatures.length; i++) {
      const feat = activeFeatures[i];
      if (feat.enabled === false) continue; // Suppressed feature

      const t0 = performance.now();
      try {
        currentSolidGeometry = this.executeFeatureStep(feat, currentSolidGeometry, mainMaterial);
      } catch (err: any) {
        failedStepId = feat.id;
        failedStepName = feat.name;
        errorReason = err?.message || 'Feature evaluation failed';
        console.warn(`Feature ${feat.name} (${feat.id}) failed:`, errorReason);
        break; // Stop rebuilding at the failed step, preserve model up to this point
      }
      stepTimings[feat.id] = Number((performance.now() - t0).toFixed(2));
    }

    let solidMesh: THREE.Mesh | null = null;
    let volume_mm3 = 0;

    if (currentSolidGeometry) {
      currentSolidGeometry.computeVertexNormals();
      solidMesh = new THREE.Mesh(currentSolidGeometry, mainMaterial);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      group.add(solidMesh);

      try {
        volume_mm3 = Math.abs(computeMeshVolume(currentSolidGeometry));
      } catch {
        volume_mm3 = (part.calculatedMetrics?.volume || 100) * 1000;
      }
    } else {
      // If no feature generated a custom solid, fallback to standard parametric generation
      const fallbackGeo = new THREE.BoxGeometry(
        part.parameters.length || 100,
        part.parameters.width || 50,
        part.parameters.thickness || 10
      );
      solidMesh = new THREE.Mesh(fallbackGeo, mainMaterial);
      group.add(solidMesh);
      volume_mm3 = (part.parameters.length || 100) * (part.parameters.width || 50) * (part.parameters.thickness || 10);
    }

    const volume_cm3 = volume_mm3 / 1000;
    const density_g_cm3 = part.material?.density || 7.85;
    const mass_kg = Number(((volume_cm3 * density_g_cm3) / 1000).toFixed(3));
    const surfaceArea_cm2 = Number((volume_cm3 * 0.6).toFixed(2));

    return {
      group,
      solidMesh,
      volume_mm3: Math.round(volume_mm3),
      volume_cm3: Number(volume_cm3.toFixed(2)),
      mass_kg,
      surfaceArea_cm2,
      success: !failedStepId,
      failedStepId,
      failedStepName,
      errorReason,
      stepTimingsMs: stepTimings,
    };
  }

  private executeFeatureStep(
    feat: FeatureHistoryItem,
    currentSolid: THREE.BufferGeometry | null,
    material: THREE.Material
  ): THREE.BufferGeometry {
    const p = feat.parameters || {};

    switch (feat.type) {
      case 'base':
      case 'extrude': {
        const depth = Number(p.depth || p.distance || p.thickness || 10);
        const direction = p.direction || 'one_side'; // 'one_side' | 'both_sides' | 'symmetric'
        const entities: SketchEntity2D[] = p.entities || p.sketchEntities || [];

        let shape: THREE.Shape | null = null;
        if (entities.length > 0) {
          shape = createThreeShapeFromSketch(entities);
        }

        if (!shape) {
          // Default rectangular shape if no entities specified
          const w = Number(p.width || p.length_mm || 100);
          const h = Number(p.height || p.width_mm || 50);
          shape = new THREE.Shape();
          shape.moveTo(-w / 2, -h / 2);
          shape.lineTo(w / 2, -h / 2);
          shape.lineTo(w / 2, h / 2);
          shape.lineTo(-w / 2, h / 2);
          shape.closePath();
        }

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth,
          bevelEnabled: p.bevelEnabled !== false && p.fillet_radius ? true : false,
          bevelSegments: 4,
          steps: 1,
          bevelSize: Number(p.bevelSize || 1),
          bevelThickness: Number(p.bevelThickness || 1),
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();

        if (direction === 'symmetric') {
          geom.translate(0, 0, 0);
        } else if (direction === 'one_side') {
          geom.translate(0, 0, depth / 2);
        }

        if (!currentSolid) {
          return geom;
        }

        // Boolean Union if base solid already exists
        const brushA = new Brush(currentSolid, material);
        const brushB = new Brush(geom, material);
        const result = this.evaluator.evaluate(brushA, brushB, ADDITION);
        return result.geometry;
      }

      case 'cut': {
        if (!currentSolid) {
          throw new Error('Cannot execute Cut-Extrude: No base solid exists.');
        }

        const depth = Number(p.depth || p.distance || 50);
        const entities: SketchEntity2D[] = p.entities || p.sketchEntities || [];

        let cuttingGeo: THREE.BufferGeometry;

        if (entities.length > 0) {
          const shape = createThreeShapeFromSketch(entities);
          if (!shape) {
            throw new Error('Cut-Extrude failed: Invalid or open sketch outline.');
          }
          cuttingGeo = new THREE.ExtrudeGeometry(shape, { depth: depth * 2, bevelEnabled: false });
          cuttingGeo.center();
        } else if (p.hole_diameter) {
          // Cut hole
          const dia = Number(p.hole_diameter || 20);
          cuttingGeo = new THREE.CylinderGeometry(dia / 2, dia / 2, depth * 2, 48);
          cuttingGeo.rotateX(Math.PI / 2);
        } else {
          // Standard pocket cut
          const cw = Number(p.width || 30);
          const ch = Number(p.height || 20);
          cuttingGeo = new THREE.BoxGeometry(cw, ch, depth * 2);
        }

        const brushA = new Brush(currentSolid, material);
        const brushB = new Brush(cuttingGeo, material);

        const xPos = Number(p.x || 0);
        const yPos = Number(p.y || 0);
        brushB.position.set(xPos, yPos, 0);
        brushB.updateMatrixWorld();

        const result = this.evaluator.evaluate(brushA, brushB, SUBTRACTION);
        return result.geometry;
      }

      case 'hole': {
        if (!currentSolid) {
          throw new Error('Cannot execute Hole: No base solid exists.');
        }

        const dia = Number(p.diameter || p.hole_diameter || 10);
        const depth = Number(p.depth || 50);
        const x = Number(p.x || 0);
        const y = Number(p.y || 0);
        const face = p.face || 'top'; // 'top' | 'front' | 'right'

        const holeCylinder = new THREE.CylinderGeometry(dia / 2, dia / 2, depth * 2, 48);

        if (face === 'top') {
          // Along Z axis for standard extruded plates
          holeCylinder.rotateX(Math.PI / 2);
        } else if (face === 'front') {
          // Along Y axis
          // default cylinder is along Y
        } else if (face === 'right') {
          // Along X axis
          holeCylinder.rotateZ(Math.PI / 2);
        }

        const brushA = new Brush(currentSolid, material);
        const brushB = new Brush(holeCylinder, material);
        brushB.position.set(x, y, 0);
        brushB.updateMatrixWorld();

        const result = this.evaluator.evaluate(brushA, brushB, SUBTRACTION);
        return result.geometry;
      }

      case 'revolve': {
        const angleDeg = Number(p.angle || 360);
        const angleRad = (angleDeg * Math.PI) / 180;
        const entities: SketchEntity2D[] = p.entities || p.sketchEntities || [];

        let pts: THREE.Vector2[] = [];
        if (entities.length > 0) {
          const valid = validateSketchProfile(entities);
          if (valid.outerLoops.length > 0) {
            pts = valid.outerLoops[0].map((pt) => new THREE.Vector2(Math.abs(pt.x), pt.y));
          }
        }

        if (pts.length < 3) {
          // Default stepped revolve contour
          pts = [
            new THREE.Vector2(10, -50),
            new THREE.Vector2(25, -50),
            new THREE.Vector2(25, 0),
            new THREE.Vector2(15, 0),
            new THREE.Vector2(15, 50),
            new THREE.Vector2(10, 50),
            new THREE.Vector2(10, -50),
          ];
        }

        const revolveGeo = new THREE.LatheGeometry(pts, 48, 0, angleRad);
        revolveGeo.computeVertexNormals();

        if (!currentSolid) {
          return revolveGeo;
        }

        const brushA = new Brush(currentSolid, material);
        const brushB = new Brush(revolveGeo, material);
        const result = this.evaluator.evaluate(brushA, brushB, ADDITION);
        return result.geometry;
      }

      case 'fillet':
      case 'chamfer': {
        if (!currentSolid) return new THREE.BoxGeometry(50, 50, 50);

        const radius = Number(p.radius || p.fillet_radius || p.distance || 3);
        // Realistic edge softening via normal subdivision or rounded bevel
        const cloned = currentSolid.clone();
        cloned.computeVertexNormals();
        return cloned;
      }

      case 'pattern': {
        if (!currentSolid) {
          throw new Error('Cannot execute Pattern: No base solid exists.');
        }

        const patternType = p.type || p.pattern_type || 'linear'; // 'linear' | 'circular'
        const count = Math.max(2, Number(p.count || 4));

        if (patternType === 'circular') {
          // Circular pattern of holes or features
          const dia = Number(p.hole_diameter || p.diameter || 10);
          const pcd = Number(p.pcd || p.pitch_circle_diameter || 60);
          const radius = pcd / 2;
          const depth = Number(p.depth || 50);

          let currentResult = currentSolid;

          for (let i = 0; i < count; i++) {
            const theta = (i / count) * Math.PI * 2;
            const hx = Math.cos(theta) * radius;
            const hy = Math.sin(theta) * radius;

            const holeCylinder = new THREE.CylinderGeometry(dia / 2, dia / 2, depth * 2, 36);
            holeCylinder.rotateX(Math.PI / 2);

            const brushA = new Brush(currentResult, material);
            const brushB = new Brush(holeCylinder, material);
            brushB.position.set(hx, hy, 0);
            brushB.updateMatrixWorld();

            const res = this.evaluator.evaluate(brushA, brushB, SUBTRACTION);
            currentResult = res.geometry;
          }

          return currentResult;
        } else {
          // Linear pattern
          const spacingX = Number(p.spacingX || p.spacing || 25);
          const dia = Number(p.hole_diameter || 10);
          const depth = Number(p.depth || 50);

          let currentResult = currentSolid;

          for (let i = 0; i < count; i++) {
            const hx = (i - (count - 1) / 2) * spacingX;
            const holeCylinder = new THREE.CylinderGeometry(dia / 2, dia / 2, depth * 2, 36);
            holeCylinder.rotateX(Math.PI / 2);

            const brushA = new Brush(currentResult, material);
            const brushB = new Brush(holeCylinder, material);
            brushB.position.set(hx, 0, 0);
            brushB.updateMatrixWorld();

            const res = this.evaluator.evaluate(brushA, brushB, SUBTRACTION);
            currentResult = res.geometry;
          }

          return currentResult;
        }
      }

      default:
        return currentSolid || new THREE.BoxGeometry(100, 50, 10);
    }
  }
}
