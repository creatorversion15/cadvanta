import { CADPart, EngineeringCalculationResult } from '../types/cad';

export function calculateShaftStressAndTorque(
  powerKw: number,
  rpm: number,
  shaftDiaMm: number,
  yieldStrengthMpa: number,
  bendingMomentNm: number = 0,
  spanLengthMm: number = 200,
  radialForceN: number = 500,
  youngsModulusGpa: number = 205
): EngineeringCalculationResult {
  // 1. Transmitted Torque: T = (9550 * P) / N
  const torqueNm = rpm > 0 ? (9550 * powerKw) / rpm : 0;
  const torqueNmm = torqueNm * 1000;
  const bendingMomentNmm = bendingMomentNm * 1000;

  // 2. Polar Section Modulus Zp = (pi * d^3) / 16
  const d = Math.max(1, shaftDiaMm);
  const Zp = (Math.PI * Math.pow(d, 3)) / 16;
  const Z = (Math.PI * Math.pow(d, 3)) / 32;

  // 3. Torsional Shear Stress tau = T / Zp (MPa)
  const torsionalStressMpa = torqueNmm / Zp;

  // 4. Bending Stress sigma_b = M / Z (MPa)
  const bendingStressMpa = bendingMomentNmm / Z;

  // 5. Equivalent Von Mises Stress = sqrt(sigma_b^2 + 3 * tau^2)
  const vonMisesStressMpa = Math.sqrt(Math.pow(bendingStressMpa, 2) + 3 * Math.pow(torsionalStressMpa, 2));

  // 6. Factor of Safety FoS = Yield Strength / Von Mises Stress
  const fos = vonMisesStressMpa > 0 ? yieldStrengthMpa / vonMisesStressMpa : 99;

  // 7. Deflection under midpoint radial load y = (F * L^3) / (48 * E * I)
  const I = (Math.PI * Math.pow(d, 4)) / 64; // mm^4
  const E_Mpa = youngsModulusGpa * 1000;
  const deflectionMm = (radialForceN * Math.pow(spanLengthMm, 3)) / (48 * E_Mpa * I);

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (fos < 1.5) status = 'critical';
  else if (fos < 2.5) status = 'warning';

  const recs: string[] = [];
  if (fos < 2.0) {
    const recDia = Math.ceil(Math.pow((16 * Math.sqrt(Math.pow(bendingMomentNmm, 2) + Math.pow(torqueNmm, 2)) * 2.5) / (Math.PI * yieldStrengthMpa), 1 / 3));
    recs.push(`Increase shaft diameter to at least Ø${recDia} mm to achieve standard industrial FoS ≥ 2.5.`);
  } else {
    recs.push(`Design is structurally sound for continuous power transmission (FoS = ${fos.toFixed(2)}).`);
  }
  if (deflectionMm > 0.05) {
    recs.push(`Mid-span deflection (${deflectionMm.toFixed(3)} mm) exceeds precision bearing alignment limit (0.05 mm). Increase diameter or reduce bearing span.`);
  }

  return {
    title: 'Shaft Torsional, Bending & Deflection Analysis',
    category: 'Shaft & Stress',
    formula: 'T = (9550 · P) / N,  τ = 16T / (π d³),  σ_v = √(σ_b² + 3τ²),  FoS = S_y / σ_v',
    inputs: {
      power: { value: powerKw, unit: 'kW', label: 'Transmitted Power' },
      speed: { value: rpm, unit: 'RPM', label: 'Rotational Speed' },
      diameter: { value: shaftDiaMm, unit: 'mm', label: 'Shaft Diameter' },
      yieldStrength: { value: yieldStrengthMpa, unit: 'MPa', label: 'Material Yield Strength' },
      span: { value: spanLengthMm, unit: 'mm', label: 'Bearing Span Length' },
    },
    outputs: {
      torque: { value: torqueNm.toFixed(2), unit: 'N·m', label: 'Transmitted Torque' },
      torsionalStress: { value: torsionalStressMpa.toFixed(1), unit: 'MPa', label: 'Torsional Shear Stress (τ)' },
      vonMisesStress: { value: vonMisesStressMpa.toFixed(1), unit: 'MPa', label: 'Von Mises Stress (σ_v)' },
      deflection: { value: deflectionMm.toFixed(4), unit: 'mm', label: 'Centerline Deflection' },
      fos: { value: fos.toFixed(2), unit: '', label: 'Factor of Safety (FoS)' },
    },
    factorOfSafety: Math.round(fos * 100) / 100,
    status,
    interpretation: `At ${powerKw} kW @ ${rpm} RPM, the shaft transmits ${torqueNm.toFixed(2)} N·m. Operating at a von Mises stress of ${vonMisesStressMpa.toFixed(1)} MPa against a material yield limit of ${yieldStrengthMpa} MPa yields a Factor of Safety of ${fos.toFixed(2)} (${status.toUpperCase()}).`,
    recommendations: recs,
  };
}

export function calculateGearPair(
  powerKw: number,
  rpm: number,
  moduleMm: number,
  pinionTeeth: number,
  gearTeeth: number,
  faceWidthMm: number,
  pressureAngleDeg: number = 20,
  yieldStrengthMpa: number = 600
): EngineeringCalculationResult {
  const gearRatio = gearTeeth / Math.max(1, pinionTeeth);
  const outputRpm = rpm / gearRatio;
  const inputTorqueNm = (9550 * powerKw) / Math.max(1, rpm);
  const outputTorqueNm = inputTorqueNm * gearRatio * 0.96; // 96% efficiency per stage

  const pinionPitchDiaMm = moduleMm * pinionTeeth;
  const gearPitchDiaMm = moduleMm * gearTeeth;
  const centerDistanceMm = (pinionPitchDiaMm + gearPitchDiaMm) / 2;

  // Tangential tooth force Ft = 2000 * T / d (N)
  const tangentialForceN = (2000 * inputTorqueNm) / pinionPitchDiaMm;
  const radAngle = (pressureAngleDeg * Math.PI) / 180;
  const radialSeparatingForceN = tangentialForceN * Math.tan(radAngle);
  const totalNormalForceN = tangentialForceN / Math.cos(radAngle);

  // Pitch line velocity v = (pi * d * n) / 60000 (m/s)
  const pitchLineVelocityMs = (Math.PI * pinionPitchDiaMm * rpm) / 60000;

  // Lewis Bending Stress sigma = Ft / (b * m * Y)
  const Y_formFactor = 0.154 - 0.912 / pinionTeeth; // approximate Lewis form factor for 20 deg full depth
  const toothBendingStressMpa = tangentialForceN / (faceWidthMm * moduleMm * Y_formFactor);
  const fos = yieldStrengthMpa / Math.max(1, toothBendingStressMpa);

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (fos < 1.4) status = 'critical';
  else if (fos < 2.0) status = 'warning';

  return {
    title: 'Involute Gear Mesh & Tooth Stress Calculation',
    category: 'Gears & Drivetrain',
    formula: 'i = z₂ / z₁,  T₂ = T₁ · i · η,  F_t = 2000·T / d_p,  σ_b = F_t / (b · m · Y)',
    inputs: {
      module: { value: moduleMm, unit: 'mm', label: 'Module (m)' },
      z1: { value: pinionTeeth, unit: 'teeth', label: 'Pinion Teeth (z₁)' },
      z2: { value: gearTeeth, unit: 'teeth', label: 'Gear Teeth (z₂)' },
      faceWidth: { value: faceWidthMm, unit: 'mm', label: 'Face Width (b)' },
      speed: { value: rpm, unit: 'RPM', label: 'Input Speed' },
    },
    outputs: {
      ratio: { value: gearRatio.toFixed(2) + ':1', unit: '', label: 'Gear Ratio (i)' },
      outputSpeed: { value: outputRpm.toFixed(1), unit: 'RPM', label: 'Output Speed' },
      outputTorque: { value: outputTorqueNm.toFixed(1), unit: 'N·m', label: 'Output Torque' },
      centerDistance: { value: centerDistanceMm.toFixed(2), unit: 'mm', label: 'Center Distance (a)' },
      tangentialForce: { value: tangentialForceN.toFixed(1), unit: 'N', label: 'Tangential Force (F_t)' },
      bendingStress: { value: toothBendingStressMpa.toFixed(1), unit: 'MPa', label: 'Tooth Bending Stress' },
      fos: { value: fos.toFixed(2), unit: '', label: 'Tooth Bending FoS' },
    },
    factorOfSafety: Math.round(fos * 100) / 100,
    status,
    interpretation: `Gear pair provides ${gearRatio.toFixed(2)}:1 speed reduction (${rpm} → ${outputRpm.toFixed(1)} RPM) and multiplies torque to ${outputTorqueNm.toFixed(1)} N·m. Tangential tooth load is ${tangentialForceN.toFixed(1)} N, producing a bending stress of ${toothBendingStressMpa.toFixed(1)} MPa (FoS = ${fos.toFixed(2)}).`,
    recommendations: [
      `Center-to-center distance required for backlash clearance: ${centerDistanceMm.toFixed(2)} mm ± 0.03 mm.`,
      pitchLineVelocityMs > 10 ? 'High pitch-line velocity (> 10 m/s): Splash or forced oil lubrication recommended.' : 'Grease or bath lubrication adequate for this speed.',
    ],
  };
}

export function calculateBearingLife(
  bearingType: string,
  boreDiaMm: number,
  rpm: number,
  radialLoadN: number,
  axialLoadN: number = 0
): EngineeringCalculationResult {
  // Approximate Basic Dynamic Load Rating C (kN) based on bore size for ISO 6200 series
  const C_kN = Math.max(5, (boreDiaMm * boreDiaMm * 0.02) + 8);
  const C_N = C_kN * 1000;

  // Equivalent dynamic load P = X*Fr + Y*Fa (approx for deep groove)
  const P_N = Math.max(100, radialLoadN + 0.5 * axialLoadN);

  // L10 life in million revs = (C / P)^3 for ball, ^(10/3) for roller
  const L10_millions = Math.pow(C_N / P_N, 3);
  // L10h in operating hours = (10^6 / (60 * n)) * (C / P)^3
  const L10h = (1000000 / (60 * Math.max(1, rpm))) * L10_millions;

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (L10h < 8000) status = 'critical'; // under 1 year continuous
  else if (L10h < 20000) status = 'warning';

  return {
    title: 'ISO 281 Rolling Bearing L₁₀ Rating Life',
    category: 'Bearings',
    formula: 'P = X·F_r + Y·F_a,  L₁₀ = (C / P)³,  L₁₀_h = (10⁶ / (60·n)) · L₁₀',
    inputs: {
      bore: { value: boreDiaMm, unit: 'mm', label: 'Bore Diameter (d)' },
      speed: { value: rpm, unit: 'RPM', label: 'Rotational Speed' },
      radialLoad: { value: radialLoadN, unit: 'N', label: 'Radial Load (F_r)' },
      axialLoad: { value: axialLoadN, unit: 'N', label: 'Thrust Load (F_a)' },
    },
    outputs: {
      dynamicRating: { value: C_kN.toFixed(1), unit: 'kN', label: 'Dynamic Capacity (C)' },
      equivLoad: { value: P_N.toFixed(1), unit: 'N', label: 'Equivalent Load (P)' },
      lifeMillions: { value: L10_millions.toFixed(1), unit: 'M revs', label: 'L₁₀ Revolutions' },
      lifeHours: { value: Math.round(L10h).toLocaleString(), unit: 'hours', label: 'L₁₀h Rating Life' },
    },
    factorOfSafety: Math.round((C_N / P_N) * 10) / 10,
    status,
    interpretation: `Under ${radialLoadN} N radial load at ${rpm} RPM, the Ø${boreDiaMm} mm bearing has an estimated ISO 281 basic rating life of ${Math.round(L10h).toLocaleString()} operating hours (90% reliability without fatigue).`,
    recommendations: [
      L10h > 20000 ? 'Bearing life exceeds industrial 20,000h machine requirement.' : 'Consider upsizing to higher capacity series if intended for continuous 24/7 duty.',
    ],
  };
}

export function calculateBoltPreload(
  threadSizeM: number,
  boltGrade: string = '8.8',
  torqueCoeffK: number = 0.2
): EngineeringCalculationResult {
  // Metric thread stress area As (mm²)
  const stressAreaMap: Record<number, number> = {
    4: 8.78, 5: 14.2, 6: 20.1, 8: 36.6, 10: 58.0, 12: 84.3, 14: 115, 16: 157, 20: 245, 24: 353, 30: 561,
  };
  const As = stressAreaMap[threadSizeM] || Math.PI * Math.pow(threadSizeM * 0.45, 2);

  // Proof strength Sp (MPa) based on ISO 898-1 grade
  let Sp_Mpa = 580; // Grade 8.8
  if (boltGrade === '10.9') Sp_Mpa = 830;
  else if (boltGrade === '12.9') Sp_Mpa = 970;
  else if (boltGrade === '4.8') Sp_Mpa = 310;

  // Preload clamp force Fp = 0.75 * As * Sp (N)
  const preloadForceN = 0.75 * As * Sp_Mpa;

  // Tightening Torque T = K * Fp * d (N·m)
  const tighteningTorqueNm = (torqueCoeffK * preloadForceN * (threadSizeM / 1000));

  return {
    title: 'VDI 2230 Bolted Joint Preload & Tightening Torque',
    category: 'Fasteners',
    formula: 'F_p = 0.75 · A_s · S_p,  T_tighten = K · F_p · d',
    inputs: {
      thread: { value: `M${threadSizeM}`, unit: '', label: 'Metric Thread Size' },
      grade: { value: boltGrade, unit: 'ISO 898-1', label: 'Fastener Property Class' },
      torqueFactor: { value: torqueCoeffK, unit: '', label: 'Nut Friction Factor (K)' },
    },
    outputs: {
      stressArea: { value: As.toFixed(1), unit: 'mm²', label: 'Tensile Stress Area (A_s)' },
      preload: { value: (preloadForceN / 1000).toFixed(2), unit: 'kN', label: 'Clamp Preload (F_p)' },
      torque: { value: tighteningTorqueNm.toFixed(1), unit: 'N·m', label: 'Recommended Tightening Torque' },
    },
    status: 'safe',
    interpretation: `Grade ${boltGrade} M${threadSizeM} bolt provides ${(preloadForceN / 1000).toFixed(2)} kN joint clamping force when torqued to ${tighteningTorqueNm.toFixed(1)} N·m.`,
    recommendations: [
      'Use calibrated torque wrench to prevent over-stretching or joint loosening under cyclic fatigue.',
    ],
  };
}

export function calculateHelicalSpring(
  wireDiaMm: number,
  meanDiaMm: number,
  activeCoils: number,
  shearModulusGpa: number = 79.3 // Music wire / Spring steel
): EngineeringCalculationResult {
  const G = shearModulusGpa * 1000; // MPa
  const d = wireDiaMm;
  const D = meanDiaMm;
  const n = activeCoils;

  // Spring index C = D / d
  const C = D / d;
  // Wahl stress correction factor Kw = (4C - 1)/(4C - 4) + 0.615/C
  const Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;

  // Spring Rate k = (G * d^4) / (8 * D^3 * n) (N/mm)
  const springRateNmm = (G * Math.pow(d, 4)) / (8 * Math.pow(D, 3) * n);

  // Deflection at 100 N load
  const loadN = 100;
  const deflectionMm = loadN / Math.max(0.01, springRateNmm);
  // Shear stress tau = Kw * (8 * F * D) / (pi * d^3)
  const shearStressMpa = Kw * (8 * loadN * D) / (Math.PI * Math.pow(d, 3));

  return {
    title: 'Helical Compression Spring Stiffness & Wahl Stress',
    category: 'Springs',
    formula: 'k = (G · d⁴) / (8 · D³ · n),  K_w = (4C - 1)/(4C - 4) + 0.615/C,  τ = K_w · 8FD / (π d³)',
    inputs: {
      wireDia: { value: wireDiaMm, unit: 'mm', label: 'Wire Diameter (d)' },
      meanDia: { value: meanDiaMm, unit: 'mm', label: 'Mean Coil Diameter (D)' },
      coils: { value: activeCoils, unit: 'turns', label: 'Active Coils (n)' },
    },
    outputs: {
      springIndex: { value: C.toFixed(2), unit: '', label: 'Spring Index (C = D/d)' },
      rate: { value: springRateNmm.toFixed(2), unit: 'N/mm', label: 'Spring Stiffness Rate (k)' },
      deflection: { value: deflectionMm.toFixed(1), unit: 'mm', label: 'Deflection @ 100 N' },
      shearStress: { value: shearStressMpa.toFixed(1), unit: 'MPa', label: 'Torsional Stress (τ)' },
    },
    factorOfSafety: Math.round((700 / Math.max(1, shearStressMpa)) * 10) / 10,
    status: C < 4 || C > 12 ? 'warning' : 'safe',
    interpretation: `Spring rate is ${springRateNmm.toFixed(2)} N/mm with a spring index of ${C.toFixed(2)}. At 100 N working compression, deflection is ${deflectionMm.toFixed(1)} mm.`,
    recommendations: [
      C < 4 ? 'Spring index C < 4 makes coiling difficult and elevates stress concentration.' : C > 12 ? 'Spring index C > 12 may lead to buckling; guide rod recommended.' : 'Spring index within optimal manufacturability range (4 to 12).',
    ],
  };
}

export function runComprehensiveCalculations(part: CADPart): EngineeringCalculationResult[] {
  const results: EngineeringCalculationResult[] = [];
  const p = part.parameters;
  const mat = part.material;

  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft' || part.part_type === 'flange_coupling') {
    const dia = Number(p.main_diameter || p.shaft_diameter || 30);
    const len = Number(p.total_length || 200);
    results.push(calculateShaftStressAndTorque(5.0, 1440, dia, mat.yieldStrength, 25, len, 450, mat.youngsModulus));
    results.push(calculateBearingLife('Deep Groove 6206', dia, 1440, 1200, 300));
  } else if (part.part_type === 'gear' || part.part_type === 'helical_gear' || part.part_type === 'planetary_gearbox' || part.part_type === 'spur_gearbox') {
    const m = Number(p.module || 2.5);
    const z1 = Number(p.teeth_count || p.sun_teeth || 20);
    const z2 = Number(p.gear_teeth || p.ring_teeth || 60);
    const b = Number(p.face_width || 20);
    results.push(calculateGearPair(2.2, 1440, m, z1, z2, b, p.pressure_angle || 20, mat.yieldStrength));
    results.push(calculateBearingLife('Angular Contact', p.bore_diameter || 20, 1440, 950, 400));
  } else if (part.part_type === 'bolt' || part.part_type === 'flange') {
    const boltSize = Number(p.bolt_hole_diameter || p.shaft_diameter || 10);
    results.push(calculateBoltPreload(boltSize, '8.8', 0.2));
  } else if (part.part_type === 'spring') {
    results.push(calculateHelicalSpring(Number(p.wire_diameter || 3), Number(p.mean_diameter || 24), Number(p.active_coils || 8)));
  } else {
    // General engineering check
    results.push(calculateShaftStressAndTorque(3.0, 1440, 30, mat.yieldStrength, 15, 150, 300, mat.youngsModulus));
  }

  return results;
}
