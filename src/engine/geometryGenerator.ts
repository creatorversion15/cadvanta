import * as THREE from 'three';
import { CADPart, DisplayMode } from '../types/cad';
import { generateCADModel3D } from '../cad/geometryGenerators';

export interface GeneratedCADModel {
  group: THREE.Group;
  mesh?: THREE.Mesh;
  edges?: THREE.LineSegments;
  boundingBox: {
    min: THREE.Vector3;
    max: THREE.Vector3;
    size: THREE.Vector3;
  };
  volumeCm3: number;
  surfaceAreaCm2: number;
  centerOfMass: THREE.Vector3;
}

export function buildCADSceneModel(
  part: CADPart,
  displayMode: DisplayMode = 'shaded_edges',
  clippingPlane?: THREE.Plane
): GeneratedCADModel {
  // Generate the 3D parametric CAD Model
  const group = generateCADModel3D(part);

  // Compute Bounding Box
  const bbox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  let totalVolume = 0;
  let totalArea = 0;
  const centerOfMass = new THREE.Vector3();
  let vertexCount = 0;

  const isXRay = displayMode === 'xray';
  const isWireframe = displayMode === 'wireframe';
  const isEdges = displayMode === 'shaded_edges' || isWireframe;

  // Process all meshes inside the group
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = !isXRay && !isWireframe;
      child.receiveShadow = !isXRay && !isWireframe;

      // Handle clipping planes & wireframe
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (clippingPlane) mat.clippingPlanes = [clippingPlane];
            mat.wireframe = isWireframe;
            mat.transparent = isXRay;
            mat.opacity = isXRay ? 0.35 : 1.0;
            mat.clipShadows = true;
          });
        } else {
          if (clippingPlane) child.material.clippingPlanes = [clippingPlane];
          child.material.wireframe = isWireframe;
          child.material.transparent = isXRay;
          child.material.opacity = isXRay ? 0.35 : 1.0;
          child.material.clipShadows = true;
        }
      }

      // Add CAD sharp edge outlines
      if (isEdges && child.geometry) {
        const edgesGeom = new THREE.EdgesGeometry(child.geometry, 22);
        const edgesMat = new THREE.LineBasicMaterial({
          color: isWireframe ? 0x00f0ff : 0x3a3a3a,
          linewidth: 1,
          clippingPlanes: clippingPlane ? [clippingPlane] : [],
          transparent: isXRay,
          opacity: isXRay ? 0.4 : 0.95,
        });
        const edges = new THREE.LineSegments(edgesGeom, edgesMat);
        edges.name = 'CADEdgeOutline';
        child.add(edges);
      }

      // Calculate approximate geometry metrics
      if (child.geometry && child.geometry.attributes.position) {
        const pos = child.geometry.attributes.position;
        vertexCount += pos.count;
      }
    }
  });

  // Calculate analytical mass / volume based on envelope & density
  const dimX = Math.max(1, size.x);
  const dimY = Math.max(1, size.y);
  const dimZ = Math.max(1, size.z);

  // Analytical volumetric estimation
  let volumeCm3 = 0;
  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft') {
    const mainD = Number(part.parameters.main_diameter || 60);
    const totL = Number(part.parameters.total_length || 200);
    volumeCm3 = (Math.PI * Math.pow(mainD / 20, 2) * (totL / 10)) * 0.92;
  } else if (part.part_type === 'planetary_gearbox') {
    volumeCm3 = 450.0;
  } else if (part.part_type === 'flange_coupling' || part.part_type === 'flange') {
    const od = Number(part.parameters.outer_diameter || 120);
    const th = Number(part.parameters.thickness || 18);
    volumeCm3 = (Math.PI * Math.pow(od / 20, 2) * (th / 10)) * 0.72;
  } else {
    volumeCm3 = ((dimX * dimY * dimZ) / 1000) * 0.65;
  }

  totalArea = (2 * (dimX * dimY + dimY * dimZ + dimZ * dimX)) / 100;
  bbox.getCenter(centerOfMass);

  return {
    group,
    boundingBox: {
      min: bbox.min,
      max: bbox.max,
      size,
    },
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    surfaceAreaCm2: Math.round(totalArea * 100) / 100,
    centerOfMass,
  };
}
