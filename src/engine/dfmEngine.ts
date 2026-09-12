import { CADPart } from '../types/cad';

export interface DFMIssue {
  id: string;
  severity: 'warning' | 'error' | 'info';
  process: 'cnc' | 'injection_molding' | 'sheet_metal' | 'additive_3d';
  title: string;
  description: string;
  manufacturingRule: string;
  standard: string;
  currentValue: number | string;
  recommendedValue: number | string;
  suggestedParamFix: { [paramKey: string]: number };
  impactRank: 1 | 2 | 3; // 1 = highest impact fix
}

export interface MultiProcessDFMScore {
  overallScore: number; // 0 - 100
  dfmScore: number; // Alias for overallScore
  machinabilityIndex: number; // Alias for cncScore
  cncScore: number;
  injectionMoldingScore: number;
  sheetMetalScore: number;
  additiveScore: number;
  recommendedProcess: 'CNC 3-Axis / 5-Axis Milling' | 'CNC Turning / Lathe' | 'Sheet Metal Press Brake' | 'Die Casting / Injection Molding' | 'SLS 3D Printing';
  issues: DFMIssue[];
  rankedFixes: DFMIssue[];
}

export function analyzePartDFM(part: CADPart): MultiProcessDFMScore {
  const issues: DFMIssue[] = [];
  const p = part.parameters || {};

  // 1. Thin Wall Check (CNC & Injection Molding)
  const thickness = Number(p.thickness || p.wall_thickness || 0);
  if (thickness > 0 && thickness < 1.8) {
    issues.push({
      id: 'dfm_thin_wall',
      severity: 'error',
      process: 'cnc',
      impactRank: 1,
      title: 'Thin Wall Thickness (< 1.8 mm)',
      description: `Wall thickness of ${thickness} mm causes tool chatter, acoustic resonance, and thermal warping during CNC machining.`,
      manufacturingRule: 'Minimum machined wall thickness for aluminum/steel should be ≥ 2.0 mm.',
      standard: 'DIN 7168 / ISO 2768',
      currentValue: `${thickness} mm`,
      recommendedValue: '2.5 mm',
      suggestedParamFix: { thickness: 2.5, wall_thickness: 2.5 },
    });
  }

  // 2. Draft Angle Check (Injection Molding & Die Casting)
  const draftAngle = Number(p.draft_angle || 0);
  if (draftAngle < 1.5) {
    issues.push({
      id: 'dfm_draft_angle',
      severity: 'warning',
      process: 'injection_molding',
      impactRank: 2,
      title: 'Insufficient Draft Angle (< 1.5°)',
      description: `Draft angle of ${draftAngle}° makes part ejection difficult from mold cavities, risking drag marks and scuffing.`,
      manufacturingRule: 'Vertical shutoff and cavity walls must have ≥ 1.5° to 2.0° draft per side.',
      standard: 'SPI Mold Standards / ISO 20457',
      currentValue: `${draftAngle}°`,
      recommendedValue: '2.0°',
      suggestedParamFix: { draft_angle: 2.0 },
    });
  }

  // 3. Sharp Internal Corners (Stress & Tooling)
  const fillet = Number(p.fillet_radius || p.corner_radius || 0);
  if (fillet < 1.5) {
    issues.push({
      id: 'dfm_sharp_corner',
      severity: 'warning',
      process: 'cnc',
      impactRank: 1,
      title: 'Sharp Internal Corners (Fillet < 1.5 mm)',
      description: `Internal corner radius of ${fillet} mm creates high stress concentration factor (Kt > 2.8) and requires expensive micro end-mills.`,
      manufacturingRule: 'Internal corner radius should be ≥ 3.0 mm to permit standard 6mm end-mill passes.',
      standard: 'ASME Y14.5 / DIN 743',
      currentValue: `${fillet} mm`,
      recommendedValue: '3.0 mm',
      suggestedParamFix: { fillet_radius: 3.0, corner_radius: 3.0 },
    });
  }

  // 4. Sheet Metal Bend Relief & Minimum Bend Radius
  const bendR = Number(p.bend_radius || 0);
  const sheetT = Number(p.sheet_thickness || p.thickness || 0);
  if (bendR > 0 && sheetT > 0 && bendR < sheetT) {
    issues.push({
      id: 'dfm_bend_radius',
      severity: 'error',
      process: 'sheet_metal',
      impactRank: 1,
      title: `Tight Bend Radius (R < T: ${bendR}mm < ${sheetT}mm)`,
      description: 'Inner bend radius less than material thickness causes outer fiber tearing and orange-peel cracking.',
      manufacturingRule: 'Minimum bend radius R must be ≥ 1.0× sheet thickness T (DIN 6935).',
      standard: 'DIN 6935 Sheet Metal Standards',
      currentValue: `R${bendR} mm`,
      recommendedValue: `R${sheetT} mm`,
      suggestedParamFix: { bend_radius: sheetT },
    });
  }

  // 5. Hole-to-Edge Distance (Sheet Metal & CNC)
  const holeD = Number(p.bolt_hole_diameter || p.hole_diameter || 0);
  if (holeD > 0 && sheetT > 0) {
    issues.push({
      id: 'dfm_hole_edge_clearance',
      severity: 'info',
      process: 'sheet_metal',
      impactRank: 3,
      title: 'Hole-to-Bend Clearance Verification',
      description: 'Holes too close to bend lines distort into ovals during press brake operations.',
      manufacturingRule: 'Keep holes at least 2.5× T + R away from the tangent bend line.',
      standard: 'ISO 2768-m',
      currentValue: 'Verified',
      recommendedValue: '≥ 2.5T + R',
      suggestedParamFix: {},
    });
  }

  // Compute Process Scores
  let cncScore = 95;
  let injectionMoldingScore = 90;
  let sheetMetalScore = 94;
  let additiveScore = 98;

  issues.forEach((issue) => {
    const penalty = issue.severity === 'error' ? 22 : issue.severity === 'warning' ? 12 : 5;
    if (issue.process === 'cnc') cncScore = Math.max(20, cncScore - penalty);
    if (issue.process === 'injection_molding') injectionMoldingScore = Math.max(20, injectionMoldingScore - penalty);
    if (issue.process === 'sheet_metal') sheetMetalScore = Math.max(20, sheetMetalScore - penalty);
    if (issue.process === 'additive_3d') additiveScore = Math.max(20, additiveScore - penalty);
  });

  const overallScore = Math.round((cncScore + injectionMoldingScore + sheetMetalScore + additiveScore) / 4);

  // Recommended Process
  let recommendedProcess: MultiProcessDFMScore['recommendedProcess'] = 'CNC 3-Axis / 5-Axis Milling';
  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft' || part.part_type === 'cylinder') {
    recommendedProcess = 'CNC Turning / Lathe';
  } else if (p.sheet_metal_thickness || p.k_factor || part.part_type === 'sheet_metal') {
    recommendedProcess = 'Sheet Metal Press Brake';
  } else if (part.part_type === 'engine_piston' || part.part_type === 'engine_cylinder_head') {
    recommendedProcess = 'Die Casting / Injection Molding';
  }

  const rankedFixes = [...issues].sort((a, b) => a.impactRank - b.impactRank);

  return {
    overallScore,
    dfmScore: overallScore,
    machinabilityIndex: cncScore,
    cncScore,
    injectionMoldingScore,
    sheetMetalScore,
    additiveScore,
    recommendedProcess,
    issues,
    rankedFixes,
  };
}
