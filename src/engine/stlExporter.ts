import * as THREE from 'three';
import { CADPart } from '../types/cad';
import { generateCADModel3D } from '../cad/geometryGenerators';

// Extract all meshes in a group into flat triangle positions and normals
function extractGroupTriangles(group: THREE.Group): { positions: number[]; normals: number[] } {
  const positions: number[] = [];
  const normals: number[] = [];

  group.updateMatrixWorld(true);

  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);

      const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
      const posAttr = nonIndexed.attributes.position;
      const normAttr = nonIndexed.attributes.normal;

      if (posAttr) {
        for (let i = 0; i < posAttr.count; i++) {
          positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
          if (normAttr) {
            normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
          } else {
            normals.push(0, 0, 1);
          }
        }
      }
    }
  });

  return { positions, normals };
}

// Generate Binary STL Blob from Three.js Model Group
export function exportToSTLBinary(part: CADPart): Blob {
  const group = generateCADModel3D(part);
  const { positions } = extractGroupTriangles(group);
  const trianglesCount = Math.floor(positions.length / 9);

  // Binary STL Header: 80 bytes header + 4 bytes uint32 triangle count + 50 bytes per triangle
  const bufferSize = 80 + 4 + trianglesCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Write header
  const headerStr = `MechAI Parametric CAD - Part: ${part.name.substring(0, 40)}`;
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 0);
  }

  // Write triangle count
  view.setUint32(80, trianglesCount, true);

  let offset = 84;
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < trianglesCount; i++) {
    const idx = i * 9;
    p1.set(positions[idx], positions[idx + 1], positions[idx + 2]);
    p2.set(positions[idx + 3], positions[idx + 4], positions[idx + 5]);
    p3.set(positions[idx + 6], positions[idx + 7], positions[idx + 8]);

    // Compute Face Normal
    v1.subVectors(p2, p1);
    v2.subVectors(p3, p1);
    normal.crossVectors(v1, v2).normalize();

    // Normal Vector (3 floats)
    view.setFloat32(offset, isNaN(normal.x) ? 0 : normal.x, true);
    view.setFloat32(offset + 4, isNaN(normal.y) ? 0 : normal.y, true);
    view.setFloat32(offset + 8, isNaN(normal.z) ? 1 : normal.z, true);

    // Vertex 1 (3 floats)
    view.setFloat32(offset + 12, p1.x, true);
    view.setFloat32(offset + 16, p1.y, true);
    view.setFloat32(offset + 20, p1.z, true);

    // Vertex 2 (3 floats)
    view.setFloat32(offset + 24, p2.x, true);
    view.setFloat32(offset + 28, p2.y, true);
    view.setFloat32(offset + 32, p2.z, true);

    // Vertex 3 (3 floats)
    view.setFloat32(offset + 36, p3.x, true);
    view.setFloat32(offset + 40, p3.y, true);
    view.setFloat32(offset + 44, p3.z, true);

    // Attribute byte count (uint16 = 0)
    view.setUint16(offset + 48, 0, true);

    offset += 50;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

// Generate Wavefront OBJ text from BufferGeometry
export function exportToOBJ(part: CADPart): Blob {
  const group = generateCADModel3D(part);
  const { positions, normals } = extractGroupTriangles(group);

  let objText = `# MechAI Parametric CAD Generator\n# Part: ${part.name}\n# Units: ${part.units}\no ${part.id}\n\n`;

  const totalVertices = positions.length / 3;
  for (let i = 0; i < totalVertices; i++) {
    const idx = i * 3;
    objText += `v ${positions[idx].toFixed(4)} ${positions[idx + 1].toFixed(4)} ${positions[idx + 2].toFixed(4)}\n`;
  }

  for (let i = 0; i < normals.length / 3; i++) {
    const idx = i * 3;
    objText += `vn ${normals[idx].toFixed(4)} ${normals[idx + 1].toFixed(4)} ${normals[idx + 2].toFixed(4)}\n`;
  }

  objText += `\ns 1\n`;

  const totalTriangles = Math.floor(positions.length / 9);
  for (let i = 0; i < totalTriangles; i++) {
    const v1 = i * 3 + 1;
    const v2 = i * 3 + 2;
    const v3 = i * 3 + 3;
    objText += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
  }

  return new Blob([objText], { type: 'text/plain' });
}

// Generate JSON Parametric CAD definition
export function exportToJSON(part: CADPart): Blob {
  const exportData = {
    generator: 'MechAI — AI Mechanical Design Engineer',
    version: '1.0.0-cad-prototype',
    exportedAt: new Date().toISOString(),
    part,
  };
  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}

// Helper to download a Blob to disk
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
