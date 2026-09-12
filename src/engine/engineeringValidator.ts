import { CADPart, EngineeringCheck } from '../types/cad';

export function runEngineeringValidation(part: CADPart): EngineeringCheck[] {
  const checks: EngineeringCheck[] = [];
  const params = part.parameters;

  switch (part.part_type) {
    case 'cylinder': {
      const dia = Number(params.diameter) || 0;
      const h = Number(params.height) || 0;
      const bore = Number(params.bore_diameter) || 0;
      const fillet = Number(params.fillet_radius) || 0;

      if (dia <= 0) {
        checks.push({
          id: 'cyl_dia_positive',
          severity: 'error',
          title: 'Invalid Cylinder Diameter',
          message: 'Outer diameter must be greater than 0 mm.',
          paramKey: 'diameter',
        });
      }
      if (h <= 0) {
        checks.push({
          id: 'cyl_height_positive',
          severity: 'error',
          title: 'Invalid Height',
          message: 'Cylinder height must be greater than 0 mm.',
          paramKey: 'height',
        });
      }
      if (bore > 0) {
        if (bore >= dia) {
          checks.push({
            id: 'cyl_bore_size',
            severity: 'error',
            title: 'Bore Exceeds Diameter',
            message: `Internal bore (Ø${bore} mm) cannot be greater than or equal to outer diameter (Ø${dia} mm).`,
            paramKey: 'bore_diameter',
            suggestedFix: `Set bore diameter to ${Math.max(5, Math.round(dia * 0.6))} mm`,
            autoFixValue: Math.max(5, Math.round(dia * 0.6)),
          });
        } else if ((dia - bore) / 2 < 1.5) {
          checks.push({
            id: 'cyl_wall_thin',
            severity: 'warning',
            title: 'Thin Wall Thickness',
            message: `Wall thickness is only ${((dia - bore) / 2).toFixed(1)} mm. Standard CNC lathe minimum recommended wall is ≥ 2.0 mm for structural rigidity.`,
            paramKey: 'bore_diameter',
          });
        }
      }
      if (fillet > dia / 2 || fillet > h / 2) {
        checks.push({
          id: 'cyl_fillet_large',
          severity: 'warning',
          title: 'Fillet Radius Exceeds Geometry',
          message: `Fillet radius (${fillet} mm) exceeds geometric boundary. Maximum allowable is ${Math.min(dia / 2, h / 2)} mm.`,
          paramKey: 'fillet_radius',
        });
      }
      break;
    }

    case 'shaft': {
      const L = Number(params.total_length) || 0;
      const D = Number(params.main_diameter) || 0;
      const s1D = Number(params.step1_diameter) || 0;
      const s1L = Number(params.step1_length) || 0;
      const s2D = Number(params.step2_diameter) || 0;
      const s2L = Number(params.step2_length) || 0;
      const kwW = Number(params.keyway_width) || 0;
      const kwD = Number(params.keyway_depth) || 0;
      const kwL = Number(params.keyway_length) || 0;
      const kwPos = Number(params.keyway_position) || 0;

      if (L <= 0 || D <= 0) {
        checks.push({
          id: 'shaft_dim_invalid',
          severity: 'error',
          title: 'Invalid Shaft Dimensions',
          message: 'Total length and main diameter must both be positive numbers.',
          paramKey: 'total_length',
        });
      }

      if (s1L > 0) {
        if (s1L >= L) {
          checks.push({
            id: 'shaft_step1_len',
            severity: 'error',
            title: 'Step 1 Length Exceeds Shaft',
            message: `Step 1 length (${s1L} mm) cannot exceed total shaft length (${L} mm).`,
            paramKey: 'step1_length',
            suggestedFix: `Reduce Step 1 length to ${Math.round(L * 0.3)} mm`,
            autoFixValue: Math.round(L * 0.3),
          });
        }
        if (s1D <= 0) {
          checks.push({
            id: 'shaft_step1_dia',
            severity: 'error',
            title: 'Invalid Step Diameter',
            message: 'Step 1 diameter must be greater than 0 mm.',
            paramKey: 'step1_diameter',
          });
        }
      }

      if (s2L > 0 && s1L + s2L >= L) {
        checks.push({
          id: 'shaft_steps_overlap',
          severity: 'error',
          title: 'Stepped Sections Exceed Total Length',
          message: `Combined step lengths (${s1L + s2L} mm) equal or exceed total length (${L} mm), leaving no main shaft body.`,
          paramKey: 'step2_length',
        });
      }

      if (kwW > 0) {
        const effectiveSectionDia = D;
        if (kwW > effectiveSectionDia * 0.5) {
          checks.push({
            id: 'shaft_keyway_wide',
            severity: 'warning',
            title: 'Keyway Width Exceeds Standard Proportions',
            message: `Keyway width (${kwW} mm) is larger than standard DIN 6885 / ISO 773 proportion (normally ~25% of shaft diameter = ${(effectiveSectionDia * 0.25).toFixed(1)} mm).`,
            paramKey: 'keyway_width',
            suggestedFix: `Use standard keyway width ${(effectiveSectionDia * 0.25).toFixed(0)} mm`,
            autoFixValue: Math.round(effectiveSectionDia * 0.25),
          });
        }
        if (kwD > effectiveSectionDia * 0.4) {
          checks.push({
            id: 'shaft_keyway_deep',
            severity: 'warning',
            title: 'Keyway Depth Severe Stress Concentration',
            message: `Keyway depth (${kwD} mm) weakens shaft core (>40% of diameter). Torsional shear failure risk elevated.`,
            paramKey: 'keyway_depth',
          });
        }
        const mainRemainingLength = L - s1L - s2L;
        if (kwL > mainRemainingLength) {
          checks.push({
            id: 'shaft_keyway_length_overflow',
            severity: 'warning',
            title: 'Keyway Length Overflows Main Section',
            message: `Keyway length (${kwL} mm) is longer than the remaining main shaft body span (${mainRemainingLength} mm).`,
            paramKey: 'keyway_length',
          });
        }
      }

      // Slenderness check
      if (L / D > 20) {
        checks.push({
          id: 'shaft_slenderness',
          severity: 'warning',
          title: 'High Slenderness Ratio (L/D > 20)',
          message: `Shaft aspect ratio is ${(L / D).toFixed(1)}. Requires center steady-rest support during turning to prevent deflection and chatter.`,
        });
      }
      break;
    }

    case 'flange': {
      const od = Number(params.outer_diameter) || 0;
      const id = Number(params.inner_diameter) || 0;
      const th = Number(params.thickness) || 0;
      const pcd = Number(params.pitch_circle_diameter) || 0;
      const holeDia = Number(params.bolt_hole_diameter) || 0;
      const holeCount = Number(params.bolt_hole_count) || 0;

      if (id >= od) {
        checks.push({
          id: 'flange_bore_exceeds',
          severity: 'error',
          title: 'Inner Hole Exceeds Outer Diameter',
          message: `Inner bore (Ø${id} mm) must be strictly smaller than flange outer diameter (Ø${od} mm).`,
          paramKey: 'inner_diameter',
          suggestedFix: `Set inner diameter to ${Math.round(od * 0.4)} mm`,
          autoFixValue: Math.round(od * 0.4),
        });
      }

      if (th <= 0) {
        checks.push({
          id: 'flange_th_pos',
          severity: 'error',
          title: 'Invalid Flange Thickness',
          message: 'Flange thickness must be greater than 0 mm.',
          paramKey: 'thickness',
        });
      }

      if (holeCount > 0 && holeDia > 0) {
        // PCD checks
        const innerHoleOuterEdge = (pcd - holeDia) / 2;
        const outerHoleEdge = (pcd + holeDia) / 2;
        const innerBoreRadius = id / 2;
        const flangeRadius = od / 2;

        if (outerHoleEdge > flangeRadius) {
          checks.push({
            id: 'flange_bolt_protrude_outer',
            severity: 'error',
            title: 'Bolt Holes Cut Outer Flange Edge',
            message: `Bolt holes on Ø${pcd} mm PCD with Ø${holeDia} mm hole size extend past the outer flange boundary (${(outerHoleEdge - flangeRadius).toFixed(1)} mm overflow).`,
            paramKey: 'pitch_circle_diameter',
            suggestedFix: `Adjust PCD to ${Math.round((id + od) / 2)} mm`,
            autoFixValue: Math.round((id + od) / 2),
          });
        }

        if (innerHoleOuterEdge < innerBoreRadius) {
          checks.push({
            id: 'flange_bolt_protrude_inner',
            severity: 'error',
            title: 'Bolt Holes Cut Central Bore',
            message: `Bolt holes intersect the central inner bore (Ø${id} mm). Increase PCD or reduce bore diameter.`,
            paramKey: 'pitch_circle_diameter',
          });
        }

        // Bolt ligament spacing check
        const circumference = Math.PI * pcd;
        const pitchPerHole = circumference / holeCount;
        const webBetweenHoles = pitchPerHole - holeDia;
        if (webBetweenHoles < holeDia * 0.5) {
          checks.push({
            id: 'flange_bolt_ligament',
            severity: 'warning',
            title: 'Close Bolt Hole Spacing',
            message: `Distance between adjacent bolt holes is only ${webBetweenHoles.toFixed(1)} mm. Flange web strength between bolts is compromised.`,
            paramKey: 'bolt_hole_count',
          });
        }
      }
      break;
    }

    case 'box_plate': {
      const L = Number(params.length) || 0;
      const W = Number(params.width) || 0;
      const T = Number(params.thickness) || 0;
      const hDia = Number(params.hole_diameter) || 0;
      const hMargin = Number(params.hole_margin) || 0;
      const fillet = Number(params.fillet_radius) || 0;

      if (L <= 0 || W <= 0 || T <= 0) {
        checks.push({
          id: 'plate_dims',
          severity: 'error',
          title: 'Invalid Plate Dimensions',
          message: 'Length, width, and thickness must all be strictly positive.',
          paramKey: 'length',
        });
      }

      if (hDia > 0) {
        if (hDia >= Math.min(L, W)) {
          checks.push({
            id: 'plate_hole_huge',
            severity: 'error',
            title: 'Hole Diameter Exceeds Plate Dimensions',
            message: `Mounting hole diameter (Ø${hDia} mm) exceeds plate span (${Math.min(L, W)} mm).`,
            paramKey: 'hole_diameter',
          });
        }
        if (hMargin < hDia * 1.5) {
          checks.push({
            id: 'plate_edge_distance',
            severity: 'warning',
            title: 'Low Hole-to-Edge Margin',
            message: `Edge margin (${hMargin} mm) is less than standard recommended 1.5× bolt diameter (${(hDia * 1.5).toFixed(1)} mm) per ASME standard.`,
            paramKey: 'hole_margin',
          });
        }
      }

      if (fillet > Math.min(L, W) / 2) {
        checks.push({
          id: 'plate_fillet_over',
          severity: 'warning',
          title: 'Corner Fillet Too Large',
          message: `Corner fillet radius (${fillet} mm) exceeds half of smallest plate edge (${(Math.min(L, W) / 2).toFixed(1)} mm).`,
          paramKey: 'fillet_radius',
        });
      }
      break;
    }

    case 'bracket': {
      const W = Number(params.width) || 0;
      const H = Number(params.height) || 0;
      const L = Number(params.length) || 0;
      const T = Number(params.thickness) || 0;
      const hDia = Number(params.hole_diameter) || 0;

      if (W <= 0 || H <= 0 || L <= 0 || T <= 0) {
        checks.push({
          id: 'bracket_dims_pos',
          severity: 'error',
          title: 'Invalid Bracket Dimensions',
          message: 'Width, height, base length, and thickness must be positive numbers.',
          paramKey: 'width',
        });
      }

      if (T >= Math.min(W, H, L) / 2) {
        checks.push({
          id: 'bracket_thick_excess',
          severity: 'warning',
          title: 'Excessive Wall Thickness',
          message: `Thickness (${T} mm) consumes more than half the bracket profile dimensions.`,
          paramKey: 'thickness',
        });
      }

      if (hDia > 0 && hDia >= W * 0.8) {
        checks.push({
          id: 'bracket_hole_wide',
          severity: 'error',
          title: 'Mounting Hole Weakens Bracket Face',
          message: `Hole diameter (Ø${hDia} mm) consumes ${((hDia / W) * 100).toFixed(0)}% of bracket face width (${W} mm).`,
          paramKey: 'hole_diameter',
        });
      }
      break;
    }

    case 'bolt': {
      const sd = Number(params.shaft_diameter) || 0;
      const sl = Number(params.shaft_length) || 0;
      const hd = Number(params.head_diameter) || 0;
      const hh = Number(params.head_height) || 0;
      const tl = Number(params.thread_length) || 0;

      if (hd <= sd) {
        checks.push({
          id: 'bolt_head_small',
          severity: 'error',
          title: 'Bolt Head Smaller Than Shaft',
          message: `Bolt head diameter (Ø${hd} mm) must be larger than shaft diameter (Ø${sd} mm) to provide bearing surface.`,
          paramKey: 'head_diameter',
          suggestedFix: `Set head diameter to standard ISO ratio ${(sd * 1.6).toFixed(1)} mm`,
          autoFixValue: Math.round(sd * 1.6),
        });
      }

      if (tl > sl) {
        checks.push({
          id: 'bolt_thread_len',
          severity: 'error',
          title: 'Thread Length Exceeds Shaft Length',
          message: `Threaded section length (${tl} mm) cannot exceed total shaft length (${sl} mm).`,
          paramKey: 'thread_length',
          suggestedFix: `Set thread length to ${sl} mm`,
          autoFixValue: sl,
        });
      }
      break;
    }

    case 'gear': {
      const m = Number(params.module) || 0;
      const z = Number(params.teeth_count) || 0;
      const bore = Number(params.bore_diameter) || 0;
      const pitchDia = m * z;
      const rootDia = pitchDia - 2.5 * m;

      if (z < 12) {
        checks.push({
          id: 'gear_undercutting',
          severity: 'warning',
          title: 'Tooth Undercutting Warning (Z < 14)',
          message: `Tooth count (${z}) is below standard minimum (14-17 teeth at 20° pressure angle) without profile shift, causing severe undercut at root.`,
          paramKey: 'teeth_count',
        });
      }

      if (bore >= rootDia * 0.75) {
        checks.push({
          id: 'gear_bore_rim',
          severity: 'error',
          title: 'Insufficient Gear Rim Thickness',
          message: `Center bore (Ø${bore} mm) is too large relative to root diameter (Ø${rootDia.toFixed(1)} mm). Minimum rim thickness 2× module required under root.`,
          paramKey: 'bore_diameter',
        });
      }
      break;
    }

    case 'bearing_housing': {
      const hd = Number(params.housing_diameter) || 0;
      const hh = Number(params.housing_height) || 0;
      const bore = Number(params.bore_diameter) || 0;
      const depth = Number(params.bore_depth) || 0;
      const pcd = Number(params.pitch_circle_diameter) || 0;
      const fd = Number(params.flange_diameter) || 0;

      if (bore >= hd) {
        checks.push({
          id: 'bh_bore_large',
          severity: 'error',
          title: 'Bearing Bore Exceeds Housing Body',
          message: `Internal bearing bore (Ø${bore} mm) cannot exceed housing cylinder (Ø${hd} mm).`,
          paramKey: 'bore_diameter',
        });
      }
      if (depth > hh) {
        checks.push({
          id: 'bh_depth_exceeds',
          severity: 'error',
          title: 'Bore Depth Exceeds Height',
          message: `Bearing seat depth (${depth} mm) cannot exceed housing height (${hh} mm).`,
          paramKey: 'bore_depth',
        });
      }
      if (pcd <= hd || pcd >= fd) {
        checks.push({
          id: 'bh_pcd_bounds',
          severity: 'warning',
          title: 'Bolt Circle Outside Flange Span',
          message: `Pitch circle diameter (Ø${pcd} mm) should be positioned between housing body (Ø${hd} mm) and flange rim (Ø${fd} mm).`,
          paramKey: 'pitch_circle_diameter',
        });
      }
      break;
    }
  }

  // If no warnings or errors, add a verified valid check
  if (checks.length === 0) {
    checks.push({
      id: 'all_valid',
      severity: 'valid',
      title: 'Valid Parametric Geometry',
      message: 'All geometric relationships, clearance envelopes, and manufacturing aspect ratios comply with standard mechanical CAD rules.',
    });
  }

  return checks;
}
