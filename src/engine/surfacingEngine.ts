import * as THREE from 'three';
import { createCADMaterial } from '../cad/geometryGenerators';

export type SurfaceToolType = 'loft' | 'sweep' | 'fill_patch';

export interface SurfacingParameters {
  toolType: SurfaceToolType;
  // Loft settings
  loftProfile1: 'circle' | 'rectangle' | 'ellipse' | 'airfoil';
  loftProfile2: 'circle' | 'rectangle' | 'ellipse' | 'airfoil';
  profile1Size: number; // e.g. 50 mm
  profile2Size: number; // e.g. 30 mm
  loftHeight: number; // e.g. 100 mm
  guideCurvature: number; // Curvature bulge factor (0 to 1)

  // Sweep settings
  sweepProfileRadius: number; // e.g. 15 mm
  sweepPathLength: number; // e.g. 120 mm
  sweepTurns: number; // For helical path, e.g. 1.5
  sweepTwistDeg: number; // Twist along path

  // Fill / Patch settings
  patchWidth: number; // e.g. 80 mm
  patchLength: number; // e.g. 120 mm
  crownBulge: number; // Aerodynamic curvature bulge e.g. 20 mm

  // Visualization inspection
  showZebraStripes: boolean;
  showNormals: boolean;
  showBoundaryWireframe: boolean;
}

// Generate Zebra Stripes Shader Material for Surface Curvature & Continuity Evaluation (G0, G1, G2)
export function createZebraStripeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      stripeCount: { value: 24.0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float stripeCount;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 reflectDir = reflect(-viewDir, normal);
        
        // Striped reflection pattern
        float stripe = sin(reflectDir.y * stripeCount);
        float color = step(0.0, stripe);
        
        // Emerald-mint & obsidian zebra stripes
        vec3 mintStripe = vec3(0.0, 0.96, 0.63);
        vec3 darkStripe = vec3(0.02, 0.06, 0.04);
        gl_FragColor = vec4(mix(darkStripe, mintStripe, color), 1.0);
      }
    `,
  });
}

// Generate Non-Solid Surfacing Geometry
export function generateSurfaceGeometry3D(
  params: SurfacingParameters,
  baseColor: string = '#00f5a0'
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SurfacingGroup';

  const defaultMat = params.showZebraStripes
    ? createZebraStripeMaterial()
    : createCADMaterial(baseColor, 0.15, 0.9, 0.95);

  switch (params.toolType) {
    case 'loft': {
      // Generate lofted surface transitioning between Profile 1 (Z=0) and Profile 2 (Z=H)
      const H = params.loftHeight;
      const R1 = params.profile1Size / 2;
      const R2 = params.profile2Size / 2;
      const segmentsU = 48;
      const segmentsV = 32;

      const geom = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const indices: number[] = [];
      const normals: number[] = [];

      for (let v = 0; v <= segmentsV; v++) {
        const t = v / segmentsV;
        const currentZ = t * H;
        // Apply guide curvature bulge
        const bulge = Math.sin(t * Math.PI) * (params.guideCurvature * 20);
        const currentR = (1 - t) * R1 + t * R2 + bulge;

        for (let u = 0; u <= segmentsU; u++) {
          const theta = (u / segmentsU) * Math.PI * 2;
          let x = 0;
          let y = 0;

          // Profile 1 to Profile 2 shape morph
          if (params.loftProfile1 === 'rectangle' && t < 0.5) {
            const rx = Math.sign(Math.cos(theta)) * Math.min(Math.abs(Math.cos(theta)), 0.8) * currentR * 1.3;
            const ry = Math.sign(Math.sin(theta)) * Math.min(Math.abs(Math.sin(theta)), 0.8) * currentR * 0.9;
            x = rx;
            y = ry;
          } else {
            x = Math.cos(theta) * currentR;
            y = Math.sin(theta) * currentR * (params.loftProfile2 === 'ellipse' ? 0.65 : 1.0);
          }

          vertices.push(x, y, currentZ);
          normals.push(x / currentR, y / currentR, 0);
        }
      }

      for (let v = 0; v < segmentsV; v++) {
        for (let u = 0; u < segmentsU; u++) {
          const row1 = v * (segmentsU + 1);
          const row2 = (v + 1) * (segmentsU + 1);
          indices.push(row1 + u, row2 + u, row1 + u + 1);
          indices.push(row1 + u + 1, row2 + u, row2 + u + 1);
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, defaultMat);
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }

    case 'sweep': {
      // 3D Path Sweep with Frenet frame
      class SweepCurve extends THREE.Curve<THREE.Vector3> {
        constructor() {
          super();
        }

        getPoint(t: number): THREE.Vector3 {
          const len = params.sweepPathLength;
          const turns = params.sweepTurns;
          const x = Math.sin(t * Math.PI * 2 * turns) * (params.sweepProfileRadius * 1.5);
          const y = Math.cos(t * Math.PI * 2 * turns) * (params.sweepProfileRadius * 1.5);
          const z = t * len;
          return new THREE.Vector3(x, y, z);
        }
      }

      const path = new SweepCurve();
      const geom = new THREE.TubeGeometry(path, 64, params.sweepProfileRadius, 32, false);
      const mesh = new THREE.Mesh(geom, defaultMat);
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }

    case 'fill_patch':
    default: {
      // Aerodynamic / Sculpted Non-Solid Boundary Surface Patch (Coons / Bezier Bicubic Patch)
      const W = params.patchWidth;
      const L = params.patchLength;
      const B = params.crownBulge;
      const segments = 32;

      const geom = new THREE.PlaneGeometry(W, L, segments, segments);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Double sine parabolic dome crown
        const z = Math.cos((x / W) * Math.PI) * Math.cos((y / L) * Math.PI) * B;
        pos.setZ(i, z);
      }
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, defaultMat);
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }
  }

  // Visualization helper: Surface boundary wireframe
  if (params.showBoundaryWireframe) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const wireGeo = new THREE.WireframeGeometry(child.geometry);
        const wireMat = new THREE.LineBasicMaterial({ color: 0x00f5a0, linewidth: 1 });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        group.add(wire);
      }
    });
  }

  return group;
}
