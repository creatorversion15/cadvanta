import * as THREE from 'three';
import { CADPart } from '../types/cad';

export type SurfaceType = 'plane' | 'cylinder' | 'cone' | 'sphere' | 'torus' | 'nurbs_bspline';
export type CurveType = 'line' | 'circle' | 'ellipse' | 'nurbs_bspline';
export type SurfaceContinuity = 'G0' | 'G1' | 'G2';

export interface BRepVertex {
  id: string;
  point: THREE.Vector3;
}

export interface BRepEdge {
  id: string;
  startVertexId: string;
  endVertexId: string;
  curveType: CurveType;
  lengthMm: number;
  controlPoints?: THREE.Vector3[];
  nurbsKnots?: number[];
  nurbsWeights?: number[];
}

export interface BRepLoop {
  id: string;
  edgeIds: string[];
  isOuter: boolean;
}

export interface BRepFace {
  id: string;
  surfaceType: SurfaceType;
  outerLoopId: string;
  innerLoopIds: string[];
  normal: THREE.Vector3;
  areaMm2: number;
  continuity: SurfaceContinuity;
  curvature: {
    gaussian: number;
    mean: number;
    maxPrincipal: number;
    minPrincipal: number;
  };
  controlNet?: {
    uDegree: number;
    vDegree: number;
    controlPoints: THREE.Vector3[][];
    uKnots: number[];
    vKnots: number[];
  };
  color?: string;
}

export interface BRepShell {
  id: string;
  faceIds: string[];
  isClosed: boolean;
}

export interface BRepSolid {
  id: string;
  shellIds: string[];
  volumeMm3: number;
  surfaceAreaMm2: number;
  centerOfMass: THREE.Vector3;
}

export interface BRepBody {
  id: string;
  name: string;
  version: number;
  vertices: Map<string, BRepVertex>;
  edges: Map<string, BRepEdge>;
  loops: Map<string, BRepLoop>;
  faces: Map<string, BRepFace>;
  shells: Map<string, BRepShell>;
  solids: Map<string, BRepSolid>;
  tessellatedMesh?: THREE.Mesh;
}

/**
 * Converts a high-level CADPart parametric specification into a formal
 * Boundary Representation (B-Rep) body with topology, NURBS face surfaces,
 * boundary edge loops, and analytical mass properties.
 */
export function convertParametricToBRep(part: CADPart): BRepBody {
  const bodyId = `brep_${part.id}`;
  const vertices = new Map<string, BRepVertex>();
  const edges = new Map<string, BRepEdge>();
  const loops = new Map<string, BRepLoop>();
  const faces = new Map<string, BRepFace>();
  const shells = new Map<string, BRepShell>();
  const solids = new Map<string, BRepSolid>();

  const p = part.parameters || {};

  // Construct topology based on fundamental geometric type
  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft' || part.part_type === 'cylinder') {
    const totalL = Number(p.total_length || 180);
    const dMain = Number(p.main_diameter || 50);
    const r = dMain / 2;

    // Create 4 vertices defining cylinder ends
    const v1: BRepVertex = { id: 'v_cyl_top_0', point: new THREE.Vector3(r, 0, totalL / 2) };
    const v2: BRepVertex = { id: 'v_cyl_top_180', point: new THREE.Vector3(-r, 0, totalL / 2) };
    const v3: BRepVertex = { id: 'v_cyl_bot_0', point: new THREE.Vector3(r, 0, -totalL / 2) };
    const v4: BRepVertex = { id: 'v_cyl_bot_180', point: new THREE.Vector3(-r, 0, -totalL / 2) };

    [v1, v2, v3, v4].forEach((v) => vertices.set(v.id, v));

    // Circular edges
    const eTop1: BRepEdge = { id: 'e_top_semi1', startVertexId: v1.id, endVertexId: v2.id, curveType: 'circle', lengthMm: Math.PI * r };
    const eTop2: BRepEdge = { id: 'e_top_semi2', startVertexId: v2.id, endVertexId: v1.id, curveType: 'circle', lengthMm: Math.PI * r };
    const eBot1: BRepEdge = { id: 'e_bot_semi1', startVertexId: v3.id, endVertexId: v4.id, curveType: 'circle', lengthMm: Math.PI * r };
    const eBot2: BRepEdge = { id: 'e_bot_semi2', startVertexId: v4.id, endVertexId: v3.id, curveType: 'circle', lengthMm: Math.PI * r };
    const eSeam: BRepEdge = { id: 'e_cyl_seam', startVertexId: v1.id, endVertexId: v3.id, curveType: 'line', lengthMm: totalL };

    [eTop1, eTop2, eBot1, eBot2, eSeam].forEach((e) => edges.set(e.id, e));

    // Loops
    const loopTop: BRepLoop = { id: 'loop_top', edgeIds: [eTop1.id, eTop2.id], isOuter: true };
    const loopBot: BRepLoop = { id: 'loop_bot', edgeIds: [eBot1.id, eBot2.id], isOuter: true };
    const loopCyl: BRepLoop = { id: 'loop_cyl_outer', edgeIds: [eTop1.id, eTop2.id, eSeam.id, eBot1.id, eBot2.id], isOuter: true };

    [loopTop, loopBot, loopCyl].forEach((l) => loops.set(l.id, l));

    // Faces: Top Planar Cap, Bottom Planar Cap, Cylindrical NURBS mantle
    const faceTop: BRepFace = {
      id: 'face_planar_top',
      surfaceType: 'plane',
      outerLoopId: loopTop.id,
      innerLoopIds: [],
      normal: new THREE.Vector3(0, 0, 1),
      areaMm2: Math.PI * r * r,
      continuity: 'G2',
      curvature: { gaussian: 0, mean: 0, maxPrincipal: 0, minPrincipal: 0 },
    };

    const faceBot: BRepFace = {
      id: 'face_planar_bot',
      surfaceType: 'plane',
      outerLoopId: loopBot.id,
      innerLoopIds: [],
      normal: new THREE.Vector3(0, 0, -1),
      areaMm2: Math.PI * r * r,
      continuity: 'G2',
      curvature: { gaussian: 0, mean: 0, maxPrincipal: 0, minPrincipal: 0 },
    };

    const faceCyl: BRepFace = {
      id: 'face_cyl_mantle',
      surfaceType: 'cylinder',
      outerLoopId: loopCyl.id,
      innerLoopIds: [],
      normal: new THREE.Vector3(1, 0, 0),
      areaMm2: 2 * Math.PI * r * totalL,
      continuity: 'G2',
      curvature: { gaussian: 0, mean: 1 / (2 * r), maxPrincipal: 1 / r, minPrincipal: 0 },
      controlNet: {
        uDegree: 2, // quadratic rational circle
        vDegree: 1, // linear extrusion
        controlPoints: [
          [new THREE.Vector3(r, 0, -totalL / 2), new THREE.Vector3(r, r, -totalL / 2), new THREE.Vector3(0, r, -totalL / 2)],
          [new THREE.Vector3(r, 0, totalL / 2), new THREE.Vector3(r, r, totalL / 2), new THREE.Vector3(0, r, totalL / 2)],
        ],
        uKnots: [0, 0, 0, 1, 1, 1],
        vKnots: [0, 0, 1, 1],
      },
    };

    [faceTop, faceBot, faceCyl].forEach((f) => faces.set(f.id, f));

    // Closed Solid Shell
    const shell: BRepShell = { id: 'shell_main', faceIds: [faceTop.id, faceBot.id, faceCyl.id], isClosed: true };
    shells.set(shell.id, shell);

    const volume = Math.PI * r * r * totalL;
    const solid: BRepSolid = {
      id: 'solid_main',
      shellIds: [shell.id],
      volumeMm3: volume,
      surfaceAreaMm2: 2 * Math.PI * r * r + 2 * Math.PI * r * totalL,
      centerOfMass: new THREE.Vector3(0, 0, 0),
    };
    solids.set(solid.id, solid);
  } else {
    // General Parametric Box / Prismatic Plate representation
    const l = Number(p.length || p.total_length || 120);
    const w = Number(p.width || p.outer_diameter || 80);
    const h = Number(p.thickness || p.total_height || 30);

    const dx = l / 2;
    const dy = w / 2;
    const dz = h / 2;

    // 8 Box Vertices
    const corners: [number, number, number][] = [
      [-dx, -dy, -dz],
      [dx, -dy, -dz],
      [dx, dy, -dz],
      [-dx, dy, -dz],
      [-dx, -dy, dz],
      [dx, -dy, dz],
      [dx, dy, dz],
      [-dx, dy, dz],
    ];

    corners.forEach((pt, i) => {
      vertices.set(`v_box_${i}`, { id: `v_box_${i}`, point: new THREE.Vector3(...pt) });
    });

    // 6 Planar Faces
    const faceDefs: { name: string; normal: [number, number, number]; area: number }[] = [
      { name: 'face_front', normal: [0, 0, 1], area: l * w },
      { name: 'face_back', normal: [0, 0, -1], area: l * w },
      { name: 'face_top', normal: [0, 1, 0], area: l * h },
      { name: 'face_bottom', normal: [0, -1, 0], area: l * h },
      { name: 'face_right', normal: [1, 0, 0], area: w * h },
      { name: 'face_left', normal: [-1, 0, 0], area: w * h },
    ];

    const faceIds: string[] = [];
    faceDefs.forEach((fd, i) => {
      const fId = `face_${fd.name}`;
      faceIds.push(fId);
      faces.set(fId, {
        id: fId,
        surfaceType: 'plane',
        outerLoopId: `loop_${i}`,
        innerLoopIds: [],
        normal: new THREE.Vector3(...fd.normal),
        areaMm2: fd.area,
        continuity: 'G2',
        curvature: { gaussian: 0, mean: 0, maxPrincipal: 0, minPrincipal: 0 },
      });
    });

    const shell: BRepShell = { id: 'shell_box_closed', faceIds, isClosed: true };
    shells.set(shell.id, shell);

    const volume = l * w * h;
    solids.set('solid_box', {
      id: 'solid_box',
      shellIds: [shell.id],
      volumeMm3: volume,
      surfaceAreaMm2: 2 * (l * w + l * h + w * h),
      centerOfMass: new THREE.Vector3(0, 0, 0),
    });
  }

  return {
    id: bodyId,
    name: `${part.name} [B-Rep Solid]`,
    version: 1,
    vertices,
    edges,
    loops,
    faces,
    shells,
    solids,
  };
}

/**
 * Direct-Edit Mode: Push / Pull face by offset distance in mm.
 * Offsets the selected face along its surface normal vector and re-computes
 * connected boundary vertices and edges in the B-Rep topology.
 */
export function directEditPushPullFace(
  body: BRepBody,
  faceId: string,
  offsetDistanceMm: number
): { success: boolean; modifiedBody: BRepBody; deltaVolumeMm3: number; message: string } {
  const targetFace = body.faces.get(faceId);
  if (!targetFace) {
    return {
      success: false,
      modifiedBody: body,
      deltaVolumeMm3: 0,
      message: `Face '${faceId}' was not found in B-Rep topology.`,
    };
  }

  const normal = targetFace.normal.clone().normalize();
  const offsetVec = normal.clone().multiplyScalar(offsetDistanceMm);

  // Deep clone body structures
  const newVertices = new Map(body.vertices);
  const newFaces = new Map(body.faces);
  const newSolids = new Map(body.solids);

  // Offset connected vertices
  const loop = body.loops.get(targetFace.outerLoopId);
  if (loop) {
    loop.edgeIds.forEach((eId) => {
      const edge = body.edges.get(eId);
      if (edge) {
        const vStart = newVertices.get(edge.startVertexId);
        if (vStart) {
          newVertices.set(edge.startVertexId, {
            ...vStart,
            point: vStart.point.clone().add(offsetVec),
          });
        }
        const vEnd = newVertices.get(edge.endVertexId);
        if (vEnd) {
          newVertices.set(edge.endVertexId, {
            ...vEnd,
            point: vEnd.point.clone().add(offsetVec),
          });
        }
      }
    });
  }

  const deltaVolume = targetFace.areaMm2 * offsetDistanceMm;

  // Update solid volume
  const solid = body.solids.get('solid_main') || Array.from(body.solids.values())[0];
  if (solid) {
    newSolids.set(solid.id, {
      ...solid,
      volumeMm3: Math.max(10, solid.volumeMm3 + deltaVolume),
    });
  }

  const updatedBody: BRepBody = {
    ...body,
    version: body.version + 1,
    vertices: newVertices,
    faces: newFaces,
    solids: newSolids,
  };

  return {
    success: true,
    modifiedBody: updatedBody,
    deltaVolumeMm3: deltaVolume,
    message: `Direct-edit push/pull successful: Offset face '${faceId}' by ${offsetDistanceMm > 0 ? '+' : ''}${offsetDistanceMm.toFixed(2)}mm (ΔVolume: ${(deltaVolume / 1000).toFixed(2)}cm³).`,
  };
}
