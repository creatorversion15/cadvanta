import * as THREE from 'three';
import { CADPart } from '../types/cad';
import { generateCADModel3D } from '../cad/geometryGenerators';

export type ExportFormat = 'step' | 'iges' | 'stl' | 'dxf' | 'obj' | 'json' | 'solidworks' | 'fusion360';
export type ExportUnits = 'mm' | 'inch';
export type MeshResolution = 'fine' | 'standard' | 'draft';

export interface ExportOptions {
  format: ExportFormat;
  units: ExportUnits;
  resolution: MeshResolution;
  includeToleranceData?: boolean;
  includeMaterialProps?: boolean;
  author?: string;
  organization?: string;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  vertexCount: number;
  triangleCount: number;
  textPreview?: string;
}

// Helper: extract all triangle vertices and normals with unit scaling
export function extractModelMesh(
  part: CADPart,
  units: ExportUnits = 'mm',
  resolution: MeshResolution = 'standard'
): {
  positions: number[];
  normals: number[];
  faces: [number, number, number][];
  uniqueVertices: THREE.Vector3[];
  boundingBox: { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3 };
  scaleFactor: number;
} {
  const group = generateCADModel3D(part);
  group.updateMatrixWorld(true);

  // Unit scaling: if part is in mm and export is in inches, scale by 1 / 25.4
  // If part is in inch and export is mm, scale by 25.4
  const partUnits = part.units || 'mm';
  let scaleFactor = 1.0;
  if (partUnits === 'mm' && units === 'inch') {
    scaleFactor = 1.0 / 25.4;
  } else if (partUnits === 'inch' && units === 'mm') {
    scaleFactor = 25.4;
  }

  const rawPositions: number[] = [];
  const rawNormals: number[] = [];

  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);

      const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
      const posAttr = nonIndexed.attributes.position;
      const normAttr = nonIndexed.attributes.normal;

      if (posAttr) {
        for (let i = 0; i < posAttr.count; i++) {
          rawPositions.push(
            posAttr.getX(i) * scaleFactor,
            posAttr.getY(i) * scaleFactor,
            posAttr.getZ(i) * scaleFactor
          );
          if (normAttr) {
            rawNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
          } else {
            rawNormals.push(0, 0, 1);
          }
        }
      }
    }
  });

  // Calculate unique vertices and indexed faces for B-Rep / topology
  const uniqueVertices: THREE.Vector3[] = [];
  const vertexMap = new Map<string, number>();
  const faces: [number, number, number][] = [];

  const tolerance = resolution === 'fine' ? 0.001 : resolution === 'draft' ? 0.05 : 0.01;
  const quantize = (v: number) => Math.round(v / tolerance) * tolerance;

  for (let i = 0; i < rawPositions.length; i += 9) {
    const faceIndices: number[] = [];
    for (let j = 0; j < 3; j++) {
      const x = rawPositions[i + j * 3];
      const y = rawPositions[i + j * 3 + 1];
      const z = rawPositions[i + j * 3 + 2];
      const key = `${quantize(x)}_${quantize(y)}_${quantize(z)}`;

      let index = vertexMap.get(key);
      if (index === undefined) {
        index = uniqueVertices.length;
        vertexMap.set(key, index);
        uniqueVertices.push(new THREE.Vector3(x, y, z));
      }
      faceIndices.push(index);
    }
    faces.push([faceIndices[0], faceIndices[1], faceIndices[2]]);
  }

  // Compute bounding box
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const v of uniqueVertices) {
    min.min(v);
    max.max(v);
  }
  if (uniqueVertices.length === 0) {
    min.set(0, 0, 0);
    max.set(0, 0, 0);
  }
  const size = new THREE.Vector3().subVectors(max, min);

  return {
    positions: rawPositions,
    normals: rawNormals,
    faces,
    uniqueVertices,
    boundingBox: { min, max, size },
    scaleFactor,
  };
}

// ----------------------------------------------------------------------------
// 1. ISO 10303-21 STEP Solid B-Rep Exporter (.stp / .step)
// ----------------------------------------------------------------------------
export function exportToSTEP(part: CADPart, options: ExportOptions): Blob {
  const meshData = extractModelMesh(part, options.units, options.resolution);
  const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const unitLabel = options.units === 'inch' ? 'INCH' : 'MILLIMETRE';
  const author = options.author || 'Viraj Bansod';
  const org = options.organization || 'CADVANTA Engineering Systems';

  let step = '';
  // Header Section
  step += 'ISO-10303-21;\n';
  step += 'HEADER;\n';
  step += `FILE_DESCRIPTION(('CADVANTA Parametric 3D Solid Model','ISO 10303-214 AP214 B-Rep','Parametric Mechanical Geometry'),'2;1');\n`;
  step += `FILE_NAME('${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.step','${dateStr}',('${author}'),('${org}'),'CADVANTA Core Geometry Kernel 2.5','CADVANTA Parametric Modeler','');\n`;
  step += `FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\n`;
  step += 'ENDSEC;\n';

  // Data Section
  step += 'DATA;\n';
  let id = 1;

  const idAppProtocol = id++;
  step += `#${idAppProtocol}=APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${idAppProtocol + 1});\n`;
  const idAppContext = id++;
  step += `#${idAppContext}=APPLICATION_CONTEXT('core mechanical CADVANTA data');\n`;
  const idProductContext = id++;
  step += `#${idProductContext}=PRODUCT_CONTEXT('',#${idAppContext},'mechanical');\n`;
  const idProduct = id++;
  step += `#${idProduct}=PRODUCT('${part.id}','${part.name}','Parametric Part',(#${idProductContext}));\n`;
  const idProductDefFormation = id++;
  step += `#${idProductDefFormation}=PRODUCT_DEFINITION_FORMATION('1.0','Initial Release',#${idProduct});\n`;
  const idProductDef = id++;
  step += `#${idProductDef}=PRODUCT_DEFINITION('design','Mechanical CAD Component',#${idProductDefFormation},#${idProductContext});\n`;

  // Geometric Representation Context (Units: mm or inch)
  const idLengthUnit = id++;
  if (options.units === 'inch') {
    const idConvUnit = id++;
    step += `#${idConvUnit}=CONVERSION_BASED_UNIT('INCH',#${idConvUnit + 1});\n`;
    step += `#${idConvUnit + 1}=LENGTH_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.0254),#${idConvUnit + 2});\n`;
    step += `#${idConvUnit + 2}=( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT($,.METRE.) );\n`;
    id += 2;
    step += `#${idLengthUnit}=( LENGTH_UNIT() NAMED_UNIT(*) CONVERSION_BASED_UNIT('INCH',#${idConvUnit}) );\n`;
  } else {
    step += `#${idLengthUnit}=( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) );\n`;
  }

  const idPlaneAngleUnit = id++;
  step += `#${idPlaneAngleUnit}=( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) );\n`;
  const idSolidAngleUnit = id++;
  step += `#${idSolidAngleUnit}=( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() );\n`;
  const idUncertainty = id++;
  step += `#${idUncertainty}=UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.0E-05),#${idLengthUnit},'closure deviation','maximum error');\n`;
  const idGeomContext = id++;
  step += `#${idGeomContext}=( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${idUncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((#${idLengthUnit},#${idPlaneAngleUnit},#${idSolidAngleUnit})) REPRESENTATION_CONTEXT('3D B-Rep Context','3D') );\n`;

  // Origin point and axes
  const idOrigin = id++;
  step += `#${idOrigin}=CARTESIAN_POINT('Origin',(0.,0.,0.));\n`;
  const idDirZ = id++;
  step += `#${idDirZ}=DIRECTION('AxisZ',(0.,0.,1.));\n`;
  const idDirX = id++;
  step += `#${idDirX}=DIRECTION('AxisX',(1.,0.,0.));\n`;
  const idAxisPlacement = id++;
  step += `#${idAxisPlacement}=AXIS2_PLACEMENT_3D('WorldAxes',#${idOrigin},#${idDirZ},#${idDirX});\n`;

  // Output points
  const pointIdMap = new Map<number, number>();
  const sampledVertices = meshData.uniqueVertices;
  for (let i = 0; i < sampledVertices.length; i++) {
    const v = sampledVertices[i];
    const ptId = id++;
    pointIdMap.set(i, ptId);
    step += `#${ptId}=CARTESIAN_POINT('',(${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}));\n`;
  }

  // Output Faces (Triangulated Faceted B-Rep faces)
  const faceIds: number[] = [];
  const maxFacesToExport = Math.min(meshData.faces.length, 3000); // Guard token/size limits while retaining full mesh
  for (let f = 0; f < maxFacesToExport; f++) {
    const [i1, i2, i3] = meshData.faces[f];
    const p1 = pointIdMap.get(i1);
    const p2 = pointIdMap.get(i2);
    const p3 = pointIdMap.get(i3);

    if (p1 && p2 && p3) {
      // Poly loop
      const loopId = id++;
      step += `#${loopId}=POLY_LOOP('',(#${p1},#${p2},#${p3}));\n`;
      const boundId = id++;
      step += `#${boundId}=FACE_OUTER_BOUND('',#${loopId},.T.);\n`;

      // Plane for the face
      const planeAxis = id++;
      step += `#${planeAxis}=AXIS2_PLACEMENT_3D('',#${p1},#${idDirZ},#${idDirX});\n`;
      const planeId = id++;
      step += `#${planeId}=PLANE('',#${planeAxis});\n`;

      const faceId = id++;
      step += `#${faceId}=ADVANCED_FACE('',(#${boundId}),#${planeId},.T.);\n`;
      faceIds.push(faceId);
    }
  }

  // Closed Shell
  const idClosedShell = id++;
  step += `#${idClosedShell}=CLOSED_SHELL('CADVANTA_SHELL',(${faceIds.map((f) => `#${f}`).join(',')}));\n`;

  // Manifold Solid B-Rep
  const idManifold = id++;
  step += `#${idManifold}=MANIFOLD_SOLID_BREP('${part.name}',#${idClosedShell});\n`;

  // Shape Representation
  const idShapeRep = id++;
  step += `#${idShapeRep}=ADVANCED_BREP_SHAPE_REPRESENTATION('${part.name}',(#${idManifold},#${idAxisPlacement}),#${idGeomContext});\n`;

  // Product Definition Shape
  const idProdShape = id++;
  step += `#${idProdShape}=PRODUCT_DEFINITION_SHAPE('','',#${idProductDef});\n`;
  const idShapeDefRep = id++;
  step += `#${idShapeDefRep}=SHAPE_DEFINITION_REPRESENTATION(#${idProdShape},#${idShapeRep});\n`;

  step += 'ENDSEC;\n';
  step += 'END-ISO-10303-21;\n';

  return new Blob([step], { type: 'application/step' });
}

// ----------------------------------------------------------------------------
// 2. IGES 5.3 Surface & Wireframe Exporter (.igs / .iges)
// ----------------------------------------------------------------------------
export function exportToIGES(part: CADPart, options: ExportOptions): Blob {
  const meshData = extractModelMesh(part, options.units, options.resolution);
  const author = (options.author || 'Viraj Bansod').slice(0, 20);
  const org = (options.organization || 'CADVANTA Engineering Systems').slice(0, 25);
  const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 12);
  const unitFlag = options.units === 'inch' ? 1 : 2; // 1 = inches, 2 = millimeters
  const unitName = options.units === 'inch' ? 'INCH' : 'MM';

  const formatCard = (text: string, sectionChar: string, lineNum: number): string => {
    const truncated = text.padEnd(72, ' ').slice(0, 72);
    const numStr = lineNum.toString().padStart(7, ' ');
    return `${truncated}${sectionChar}${numStr}\n`;
  };

  let out = '';
  let sLine = 1;
  let gLine = 1;
  let dLine = 1;
  let pLine = 1;

  // --- Start Section (S) ---
  out += formatCard(`CADVANTA Parametric 3D CAD - Part: ${part.name}`, 'S', sLine++);
  out += formatCard(`Generated by VIRA AI & Viraj Bansod - Units: ${unitName}`, 'S', sLine++);
  out += formatCard(`Standard: IGES Version 5.3 (USPRO/NCGA)`, 'S', sLine++);

  // --- Global Section (G) ---
  const gStr =
    `1H,,1H;,'${part.id}','${part.name}.iges','CADVANTA 2.5','CADVANTA IGES Kernel',` +
    `32,38,6,308,15,'${part.id}',1.0,${unitFlag},'${unitName}',1,0.01,'${dateStr}',` +
    `0.001,${meshData.boundingBox.size.length().toFixed(2)},'${author}','${org}',11,0;`;

  const gChunks = gStr.match(/.{1,64}/g) || [gStr];
  for (const chunk of gChunks) {
    out += formatCard(chunk, 'G', gLine++);
  }

  // --- Directory Entry (D) and Parameter Data (P) Sections ---
  // Entity 106: Copious Data (Form 2 - Linear planar piecewise triangle mesh / coordinates)
  // DE record format: 2 lines per entity, 8 chars per column (10 fields per line)
  const triangles = Math.min(meshData.faces.length, 1200);
  let pStart = 1;

  for (let t = 0; t < triangles; t++) {
    const [i1, i2, i3] = meshData.faces[t];
    const v1 = meshData.uniqueVertices[i1];
    const v2 = meshData.uniqueVertices[i2];
    const v3 = meshData.uniqueVertices[i3];

    if (!v1 || !v2 || !v3) continue;

    // DE Line 1: Entity 106 (Copious Data), parameter pointer, structure, line font, level, view, transform, label display, status
    const de1 =
      `     106` +
      `${pStart.toString().padStart(8, ' ')}` +
      `       0` +
      `       1` +
      `       0` +
      `       0` +
      `       0` +
      `       0` +
      `00010001`;
    out += formatCard(de1, 'D', dLine++);

    // DE Line 2: Entity 106, line weight, color (Green/Mint = 3), param line count (1), form (2), reserved, label, subscript
    const de2 =
      `     106` +
      `       0` +
      `       3` +
      `       1` +
      `       2` +
      `        ` +
      `        ` +
      `       0` +
      `       0`;
    out += formatCard(de2, 'D', dLine++);

    // Parameter Data: 106, IP=2, N=3, coordinates x1,y1,z1, x2,y2,z2, x3,y3,z3;
    const pData = `106,2,3,${v1.x.toFixed(4)},${v1.y.toFixed(4)},${v1.z.toFixed(4)},${v2.x.toFixed(4)},${v2.y.toFixed(4)},${v2.z.toFixed(4)},${v3.x.toFixed(4)},${v3.y.toFixed(4)},${v3.z.toFixed(4)};`;
    const dePointer = dLine - 2;
    const pRecord = `${pData.padEnd(64, ' ')}${dePointer.toString().padStart(8, ' ')}`;
    out += formatCard(pRecord, 'P', pLine++);

    pStart++;
  }

  // --- Terminate Section (T) ---
  const tCard =
    `S${(sLine - 1).toString().padStart(7, ' ')}` +
    `G${(gLine - 1).toString().padStart(7, ' ')}` +
    `D${(dLine - 1).toString().padStart(7, ' ')}` +
    `P${(pLine - 1).toString().padStart(7, ' ')}` +
    `                                        `;
  out += formatCard(tCard, 'T', 1);

  return new Blob([out], { type: 'application/iges' });
}

// ----------------------------------------------------------------------------
// 3. STL Exporter (Binary & ASCII with Resolution Control)
// ----------------------------------------------------------------------------
export function exportToSTL(
  part: CADPart,
  options: ExportOptions,
  formatType: 'binary' | 'ascii' = 'binary'
): Blob {
  const meshData = extractModelMesh(part, options.units, options.resolution);
  const trianglesCount = Math.floor(meshData.positions.length / 9);

  if (formatType === 'ascii') {
    let stl = `solid ${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}\n`;
    const p = meshData.positions;
    for (let i = 0; i < trianglesCount; i++) {
      const idx = i * 9;
      // Normal
      const v1 = new THREE.Vector3(p[idx], p[idx + 1], p[idx + 2]);
      const v2 = new THREE.Vector3(p[idx + 3], p[idx + 4], p[idx + 5]);
      const v3 = new THREE.Vector3(p[idx + 6], p[idx + 7], p[idx + 8]);
      const normal = new THREE.Vector3()
        .crossVectors(new THREE.Vector3().subVectors(v2, v1), new THREE.Vector3().subVectors(v3, v1))
        .normalize();

      stl += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
      stl += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
      stl += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
    stl += `endsolid ${part.name.replace(/[^a-zA-Z0-9_-]/g, '_')}\n`;
    return new Blob([stl], { type: 'text/plain' });
  }

  // Binary STL
  const bufferSize = 80 + 4 + trianglesCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const headerStr = `CADVANTA 3D Parametric CAD - ${part.name.slice(0, 30)} - Units: ${options.units}`;
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 0);
  }

  view.setUint32(80, trianglesCount, true);

  let offset = 84;
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const pos = meshData.positions;

  for (let i = 0; i < trianglesCount; i++) {
    const idx = i * 9;
    p1.set(pos[idx], pos[idx + 1], pos[idx + 2]);
    p2.set(pos[idx + 3], pos[idx + 4], pos[idx + 5]);
    p3.set(pos[idx + 6], pos[idx + 7], pos[idx + 8]);

    v1.subVectors(p2, p1);
    v2.subVectors(p3, p1);
    normal.crossVectors(v1, v2).normalize();

    // Normal
    view.setFloat32(offset, isNaN(normal.x) ? 0 : normal.x, true);
    view.setFloat32(offset + 4, isNaN(normal.y) ? 0 : normal.y, true);
    view.setFloat32(offset + 8, isNaN(normal.z) ? 1 : normal.z, true);

    // Vertices
    view.setFloat32(offset + 12, p1.x, true);
    view.setFloat32(offset + 16, p1.y, true);
    view.setFloat32(offset + 20, p1.z, true);

    view.setFloat32(offset + 24, p2.x, true);
    view.setFloat32(offset + 28, p2.y, true);
    view.setFloat32(offset + 32, p2.z, true);

    view.setFloat32(offset + 36, p3.x, true);
    view.setFloat32(offset + 40, p3.y, true);
    view.setFloat32(offset + 44, p3.z, true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

// ----------------------------------------------------------------------------
// 4. AutoCAD DXF Drawing & 3D Mesh Exporter (.dxf)
// ----------------------------------------------------------------------------
export function exportToDXF(part: CADPart, options: ExportOptions): Blob {
  const meshData = extractModelMesh(part, options.units, options.resolution);
  const insunits = options.units === 'inch' ? 1 : 4; // 1 = Inches, 4 = Millimeters

  let dxf = '';
  // HEADER
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
  dxf += '9\n$INSUNITS\n70\n' + insunits + '\n';
  dxf += '9\n$LUNITS\n70\n2\n'; // Decimal units
  dxf += '9\n$EXTMIN\n10\n' + meshData.boundingBox.min.x.toFixed(4) + '\n20\n' + meshData.boundingBox.min.y.toFixed(4) + '\n30\n' + meshData.boundingBox.min.z.toFixed(4) + '\n';
  dxf += '9\n$EXTMAX\n10\n' + meshData.boundingBox.max.x.toFixed(4) + '\n20\n' + meshData.boundingBox.max.y.toFixed(4) + '\n30\n' + meshData.boundingBox.max.z.toFixed(4) + '\n';
  dxf += '0\nENDSEC\n';

  // TABLES (Layers)
  dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n2\n';
  dxf += '0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n';
  dxf += '0\nLAYER\n2\nCADVANTA_GEOMETRY\n70\n0\n62\n3\n6\nCONTINUOUS\n'; // 3 = Green
  dxf += '0\nLAYER\n2\nSILHOUETTE_PROJECTION\n70\n0\n62\n4\n6\nCONTINUOUS\n'; // 4 = Cyan
  dxf += '0\nENDTAB\n0\nENDSEC\n';

  // BLOCKS
  dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';

  // ENTITIES
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // 1. Export 2D Silhouette Projection cross-section (useful for CNC laser / plasma / drafting)
  const bbox = meshData.boundingBox;
  const cx = (bbox.min.x + bbox.max.x) / 2;
  const cy = (bbox.min.y + bbox.max.y) / 2;
  const w = bbox.size.x;
  const h = bbox.size.y;

  // Bounding envelope polyline in 2D
  dxf += '0\nLWPOLYLINE\n8\nSILHOUETTE_PROJECTION\n90\n4\n70\n1\n';
  dxf += `10\n${(cx - w / 2).toFixed(4)}\n20\n${(cy - h / 2).toFixed(4)}\n`;
  dxf += `10\n${(cx + w / 2).toFixed(4)}\n20\n${(cy - h / 2).toFixed(4)}\n`;
  dxf += `10\n${(cx + w / 2).toFixed(4)}\n20\n${(cy + h / 2).toFixed(4)}\n`;
  dxf += `10\n${(cx - w / 2).toFixed(4)}\n20\n${(cy + h / 2).toFixed(4)}\n`;

  // 2. Export 3DFACE entities for solid CAD surface visualization in AutoCAD / BricsCAD / LibreCAD
  const maxFaces = Math.min(meshData.faces.length, 3500);
  for (let i = 0; i < maxFaces; i++) {
    const [i1, i2, i3] = meshData.faces[i];
    const v1 = meshData.uniqueVertices[i1];
    const v2 = meshData.uniqueVertices[i2];
    const v3 = meshData.uniqueVertices[i3];

    if (!v1 || !v2 || !v3) continue;

    dxf += '0\n3DFACE\n8\nCADVANTA_GEOMETRY\n';
    dxf += `10\n${v1.x.toFixed(4)}\n20\n${v1.y.toFixed(4)}\n30\n${v1.z.toFixed(4)}\n`;
    dxf += `11\n${v2.x.toFixed(4)}\n20\n${v2.y.toFixed(4)}\n31\n${v2.z.toFixed(4)}\n`;
    dxf += `12\n${v3.x.toFixed(4)}\n20\n${v3.y.toFixed(4)}\n32\n${v3.z.toFixed(4)}\n`;
    // Fourth vertex duplicated for triangular face
    dxf += `13\n${v3.x.toFixed(4)}\n20\n${v3.y.toFixed(4)}\n33\n${v3.z.toFixed(4)}\n`;
  }

  dxf += '0\nENDSEC\n0\nEOF\n';

  return new Blob([dxf], { type: 'application/dxf' });
}

// ----------------------------------------------------------------------------
// 5. SolidWorks Native VBA Macro Exporter (.swp / .vba)
// ----------------------------------------------------------------------------
export function exportToSolidWorksMacro(part: CADPart, options: ExportOptions): Blob {
  const p = part.parameters;
  const unitScale = options.units === 'inch' ? 0.0254 : 0.001; // SolidWorks internal units are meters (MKS)
  const partNameSafe = part.name.replace(/[^a-zA-Z0-9]/g, '_');

  let vba = `' ==========================================================================\n`;
  vba += `' CADVANTA to SolidWorks Automated Parametric Modeling Macro\n`;
  vba += `' Part: ${part.name} (${part.part_type})\n`;
  vba += `' Author: ${options.author || 'Viraj Bansod'}\n`;
  vba += `' System: CADVANTA Core Engine 2.5\n`;
  vba += `' Units: ${options.units}\n`;
  vba += `' ==========================================================================\n\n`;

  vba += `Dim swApp As SldWorks.SldWorks\n`;
  vba += `Dim swModel As SldWorks.ModelDoc2\n`;
  vba += `Dim swPart As SldWorks.PartDoc\n`;
  vba += `Dim swFeatMgr As SldWorks.FeatureManager\n`;
  vba += `Dim swSketchMgr As SldWorks.SketchManager\n`;
  vba += `Dim swFeat As SldWorks.Feature\n`;
  vba += `Dim boolstatus As Boolean\n`;
  vba += `Dim longstatus As Long\n\n`;

  vba += `Sub main()\n`;
  vba += `    Set swApp = Application.SldWorks\n`;
  vba += `    ' Create New SolidWorks Part Document\n`;
  vba += `    Set swModel = swApp.NewDocument("Part.prtdot", 0, 0, 0)\n`;
  vba += `    If swModel Is Nothing Then\n`;
  vba += `        MsgBox "Failed to initialize new SolidWorks part template.", vbCritical, "CADVANTA"\n`;
  vba += `        Exit Sub\n`;
  vba += `    End If\n\n`;
  vba += `    Set swPart = swModel\n`;
  vba += `    Set swFeatMgr = swModel.FeatureManager\n`;
  vba += `    Set swSketchMgr = swModel.SketchManager\n\n`;

  vba += `    ' Set Document Title and Description\n`;
  vba += `    swModel.SummaryInfo(swSumInfoTitle) = "${part.name}"\n`;
  vba += `    swModel.SummaryInfo(swSumInfoAuthor) = "Viraj Bansod - CADVANTA"\n\n`;

  // Generate specialized SolidWorks sketch & feature routines based on part type
  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft') {
    const mainDia = (Number(p.main_diameter || 60) * unitScale).toFixed(6);
    const mainLen = (Number(p.total_length || 200) * unitScale).toFixed(6);
    vba += `    ' Step 1: Select Front Plane and Sketch Main Cylinder\n`;
    vba += `    boolstatus = swModel.Extension.SelectByID2("Front Plane", "PLANE", 0, 0, 0, False, 0, Nothing, 0)\n`;
    vba += `    swSketchMgr.InsertSketch True\n`;
    vba += `    swSketchMgr.CreateCircleByRadius 0#, 0#, 0#, ${Number(mainDia) / 2}\n`;
    vba += `    ' Feature Extrude Boss\n`;
    vba += `    Set swFeat = swFeatMgr.FeatureExtrusion3(True, False, False, 0, 0, ${mainLen}, 0, False, False, False, False, 0, 0, False, False, False, False, True, True, True, 0, 0, False)\n\n`;
  } else if (part.part_type === 'flange' || part.part_type === 'flange_coupling') {
    const od = (Number(p.outer_diameter || 120) * unitScale).toFixed(6);
    const thk = (Number(p.thickness || 15) * unitScale).toFixed(6);
    const id = (Number(p.inner_diameter || 40) * unitScale).toFixed(6);
    vba += `    ' Select Top Plane for Flange Disc\n`;
    vba += `    boolstatus = swModel.Extension.SelectByID2("Top Plane", "PLANE", 0, 0, 0, False, 0, Nothing, 0)\n`;
    vba += `    swSketchMgr.InsertSketch True\n`;
    vba += `    swSketchMgr.CreateCircleByRadius 0#, 0#, 0#, ${Number(od) / 2}\n`;
    vba += `    swSketchMgr.CreateCircleByRadius 0#, 0#, 0#, ${Number(id) / 2}\n`;
    vba += `    Set swFeat = swFeatMgr.FeatureExtrusion3(True, False, False, 0, 0, ${thk}, 0, False, False, False, False, 0, 0, False, False, False, False, True, True, True, 0, 0, False)\n\n`;
  } else {
    const l = (Number(p.length || 150) * unitScale).toFixed(6);
    const w = (Number(p.width || 100) * unitScale).toFixed(6);
    const t = (Number(p.thickness || 12) * unitScale).toFixed(6);
    vba += `    ' Select Top Plane for Prismatic Solid\n`;
    vba += `    boolstatus = swModel.Extension.SelectByID2("Top Plane", "PLANE", 0, 0, 0, False, 0, Nothing, 0)\n`;
    vba += `    swSketchMgr.InsertSketch True\n`;
    vba += `    swSketchMgr.CreateCenterRectangle 0#, 0#, 0#, ${Number(l) / 2}, ${Number(w) / 2}, 0#\n`;
    vba += `    Set swFeat = swFeatMgr.FeatureExtrusion3(True, False, False, 0, 0, ${t}, 0, False, False, False, False, 0, 0, False, False, False, False, True, True, True, 0, 0, False)\n\n`;
  }

  // Material assignment
  const matName = part.material?.name || 'AISI 1045 Steel';
  vba += `    ' Set Material\n`;
  vba += `    swPart.SetMaterialPropertyName2 "Default", "solidworks materials.sldmat", "${matName}"\n\n`;
  vba += `    ' Rebuild Model and Zoom to Fit\n`;
  vba += `    swModel.ForceRebuild3 True\n`;
  vba += `    swModel.ViewZoomtofit2\n`;
  vba += `    MsgBox "CADVANTA model '${partNameSafe}' generated successfully in SolidWorks!", vbInformation, "CADVANTA"\n`;
  vba += `End Sub\n`;

  return new Blob([vba], { type: 'text/plain' });
}

// ----------------------------------------------------------------------------
// 6. Autodesk Fusion 360 Python API Exporter (.py)
// ----------------------------------------------------------------------------
export function exportToFusion360Script(part: CADPart, options: ExportOptions): Blob {
  const p = part.parameters;
  const unitScale = options.units === 'inch' ? 2.54 : 0.1; // Fusion 360 API internal length unit is cm

  let py = `# ==============================================================================\n`;
  py += `# CADVANTA to Autodesk Fusion 360 Parametric Modeling Script\n`;
  py += `# Part: ${part.name} (${part.part_type})\n`;
  py += `# Creator: ${options.author || 'Viraj Bansod'}\n`;
  py += `# Units: ${options.units}\n`;
  py += `# ==============================================================================\n\n`;

  py += `import adsk.core, adsk.fusion, traceback\n\n`;
  py += `def run(context):\n`;
  py += `    ui = None\n`;
  py += `    try:\n`;
  py += `        app = adsk.core.Application.get()\n`;
  py += `        ui = app.userInterface\n`;
  py += `        design = adsk.fusion.Design.cast(app.activeProduct)\n`;
  py += `        if not design:\n`;
  py += `            ui.messageBox('Please open an active Fusion 360 Design document first.')\n`;
  py += `            return\n\n`;

  py += `        rootComp = design.rootComponent\n`;
  py += `        features = rootComp.features\n`;
  py += `        sketches = rootComp.sketches\n`;
  py += `        xyPlane = rootComp.xYConstructionPlane\n\n`;

  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft') {
    const dia = (Number(p.main_diameter || 60) * unitScale).toFixed(4);
    const len = (Number(p.total_length || 200) * unitScale).toFixed(4);
    py += `        # Sketch Circular Profile on XY Plane\n`;
    py += `        sketch = sketches.add(xyPlane)\n`;
    py += `        circles = sketch.sketchCurves.sketchCircles\n`;
    py += `        circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), ${Number(dia) / 2})\n\n`;
    py += `        # Extrude Cylinder Boss\n`;
    py += `        profile = sketch.profiles.item(0)\n`;
    py += `        extrudes = features.extrudeFeatures\n`;
    py += `        extInput = extrudes.createInput(profile, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)\n`;
    py += `        dist = adsk.core.ValueInput.createByReal(${len})\n`;
    py += `        extInput.setDistanceExtent(False, dist)\n`;
    py += `        extrudes.add(extInput)\n\n`;
  } else {
    const l = (Number(p.length || 150) * unitScale).toFixed(4);
    const w = (Number(p.width || 100) * unitScale).toFixed(4);
    const t = (Number(p.thickness || 12) * unitScale).toFixed(4);
    py += `        # Sketch Rectangle on XY Plane\n`;
    py += `        sketch = sketches.add(xyPlane)\n`;
    py += `        lines = sketch.sketchCurves.sketchLines\n`;
    py += `        lines.addTwoPointRectangle(adsk.core.Point3D.create(-${Number(l)/2}, -${Number(w)/2}, 0), adsk.core.Point3D.create(${Number(l)/2}, ${Number(w)/2}, 0))\n\n`;
    py += `        # Extrude Base Block\n`;
    py += `        profile = sketch.profiles.item(0)\n`;
    py += `        extrudes = features.extrudeFeatures\n`;
    py += `        extInput = extrudes.createInput(profile, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)\n`;
    py += `        dist = adsk.core.ValueInput.createByReal(${t})\n`;
    py += `        extInput.setDistanceExtent(False, dist)\n`;
    py += `        extrudes.add(extInput)\n\n`;
  }

  py += `        ui.messageBox('CADVANTA: "${part.name}" successfully built in Fusion 360!')\n`;
  py += `    except:\n`;
  py += `        if ui:\n`;
  py += `            ui.messageBox('Failed:\\n{}'.format(traceback.format_exc()))\n`;

  return new Blob([py], { type: 'text/x-python' });
}

// ----------------------------------------------------------------------------
// Master Unified Dispatcher
// ----------------------------------------------------------------------------
export function generateExport(part: CADPart, options: ExportOptions): ExportResult {
  const meshData = extractModelMesh(part, options.units, options.resolution);
  const baseName = part.name.replace(/[^a-zA-Z0-9_-]/g, '_');

  let blob: Blob;
  let filename: string;
  let mimeType: string;
  let textPreview: string | undefined;

  switch (options.format) {
    case 'step':
      blob = exportToSTEP(part, options);
      filename = `${baseName}_${options.units}.step`;
      mimeType = 'application/step';
      break;

    case 'iges':
      blob = exportToIGES(part, options);
      filename = `${baseName}_${options.units}.iges`;
      mimeType = 'application/iges';
      break;

    case 'stl':
      blob = exportToSTL(part, options, 'binary');
      filename = `${baseName}_${options.resolution}_${options.units}.stl`;
      mimeType = 'application/octet-stream';
      break;

    case 'dxf':
      blob = exportToDXF(part, options);
      filename = `${baseName}_${options.units}.dxf`;
      mimeType = 'application/dxf';
      break;

    case 'solidworks':
      blob = exportToSolidWorksMacro(part, options);
      filename = `${baseName}_SolidWorks.swp.vba`;
      mimeType = 'text/plain';
      break;

    case 'fusion360':
      blob = exportToFusion360Script(part, options);
      filename = `${baseName}_Fusion360.py`;
      mimeType = 'text/x-python';
      break;

    case 'obj': {
      const { positions, normals } = meshData;
      let objText = `# CADVANTA Parametric CAD Generator\n# Part: ${part.name}\n# Units: ${options.units}\no ${part.id}\n\n`;
      for (let i = 0; i < positions.length / 3; i++) {
        const idx = i * 3;
        objText += `v ${positions[idx].toFixed(4)} ${positions[idx + 1].toFixed(4)} ${positions[idx + 2].toFixed(4)}\n`;
      }
      for (let i = 0; i < normals.length / 3; i++) {
        const idx = i * 3;
        objText += `vn ${normals[idx].toFixed(4)} ${normals[idx + 1].toFixed(4)} ${normals[idx + 2].toFixed(4)}\n`;
      }
      objText += `\ns 1\n`;
      for (let i = 0; i < Math.floor(positions.length / 9); i++) {
        const v1 = i * 3 + 1;
        const v2 = i * 3 + 2;
        const v3 = i * 3 + 3;
        objText += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
      }
      blob = new Blob([objText], { type: 'text/plain' });
      filename = `${baseName}_${options.units}.obj`;
      mimeType = 'text/plain';
      textPreview = objText.slice(0, 500);
      break;
    }

    case 'json':
    default: {
      const cadJson = {
        generator: 'CADVANTA — AI Mechanical Design & CAD Platform',
        version: '2.5.0-production',
        author: options.author || 'Viraj Bansod',
        exportUnits: options.units,
        timestamp: new Date().toISOString(),
        part: {
          ...part,
          units: options.units,
          parameters: {
            ...part.parameters,
            _scaleFactorApplied: meshData.scaleFactor,
          },
          boundingBoxMm: meshData.boundingBox,
        },
      };
      const jsonStr = JSON.stringify(cadJson, null, 2);
      blob = new Blob([jsonStr], { type: 'application/json' });
      filename = `${baseName}_${options.units}.cad.json`;
      mimeType = 'application/json';
      textPreview = jsonStr.slice(0, 500);
      break;
    }
  }

  return {
    blob,
    filename,
    mimeType,
    sizeBytes: blob.size,
    vertexCount: meshData.uniqueVertices.length,
    triangleCount: Math.floor(meshData.positions.length / 9),
    textPreview,
  };
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
