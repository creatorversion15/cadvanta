import { UnitSystem } from '../components/ParameterPanel/UnitToggle';

export const MM_TO_INCH = 1 / 25.4;
export const INCH_TO_MM = 25.4;
export const KG_TO_LB = 2.20462262;
export const LB_TO_KG = 1 / 2.20462262;
export const CM3_TO_IN3 = 1 / 16.387064;
export const IN3_TO_CM3 = 16.387064;
export const DENSITY_G_CM3_TO_LB_IN3 = 0.036127292;
export const MPA_TO_KSI = 0.1450377;
export const NM_TO_LBF_IN = 8.85074579;
export const N_TO_LBF = 0.22480894;

export function isImperial(unitSystemOrUnit: UnitSystem | 'mm' | 'inch' | undefined): boolean {
  return unitSystemOrUnit === 'imperial' || unitSystemOrUnit === 'inch';
}

/**
 * Format mass dynamically based on current unit system.
 * Metric: '450 g' or '1.25 kg'
 * Imperial: '2.76 lb' (or '1.4 oz' for sub-0.1 lb)
 */
export function formatMass(
  massKg: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const lb = massKg * KG_TO_LB;
    if (lb < 0.1) {
      const oz = lb * 16;
      return includeUnit ? `${oz.toFixed(1)} oz` : oz.toFixed(1);
    }
    return includeUnit ? `${lb.toFixed(2)} lb` : lb.toFixed(2);
  }

  // Metric
  if (massKg < 1 && massKg > 0) {
    const g = Math.round(massKg * 1000);
    return includeUnit ? `${g} g` : `${g}`;
  }
  return includeUnit ? `${massKg.toFixed(2)} kg` : massKg.toFixed(2);
}

/**
 * Format solid volume dynamically.
 * Metric: '145.2 cm³'
 * Imperial: '8.86 in³'
 */
export function formatVolume(
  volCm3: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const in3 = volCm3 * CM3_TO_IN3;
    return includeUnit ? `${in3.toFixed(2)} in³` : in3.toFixed(2);
  }
  return includeUnit ? `${volCm3.toFixed(1)} cm³` : volCm3.toFixed(1);
}

/**
 * Format material density dynamically.
 * Metric: '7.85 g/cm³'
 * Imperial: '0.2836 lb/in³'
 */
export function formatDensity(
  densityGcm3: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const lbIn3 = densityGcm3 * DENSITY_G_CM3_TO_LB_IN3;
    return includeUnit ? `${lbIn3.toFixed(4)} lb/in³` : lbIn3.toFixed(4);
  }
  return includeUnit ? `${densityGcm3.toFixed(2)} g/cm³` : densityGcm3.toFixed(2);
}

/**
 * Format linear dimension (mm -> inches).
 * Metric: '50.0 mm'
 * Imperial: '1.97 in'
 */
export function formatLength(
  lenMm: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  precision = 2,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const inch = lenMm * MM_TO_INCH;
    return includeUnit ? `${inch.toFixed(precision)} in` : inch.toFixed(precision);
  }
  return includeUnit ? `${lenMm.toFixed(precision > 1 ? 1 : precision)} mm` : lenMm.toFixed(precision > 1 ? 1 : precision);
}

/**
 * Format GD&T tolerance (mm -> inches).
 * Metric: '±0.05 mm'
 * Imperial: '±0.0020 in'
 */
export function formatTolerance(
  tolMm: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includePrefix = true
): string {
  const prefix = includePrefix ? '±' : '';
  if (isImperial(unitSystem)) {
    const inVal = tolMm * MM_TO_INCH;
    return `${prefix}${inVal.toFixed(4)} in`;
  }
  return `${prefix}${tolMm} mm`;
}

/**
 * Format mechanical stress or yield strength.
 * Metric: '370 MPa'
 * Imperial: '53.7 ksi'
 */
export function formatStress(
  stressMpa: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const ksi = stressMpa * MPA_TO_KSI;
    return includeUnit ? `${ksi.toFixed(1)} ksi` : ksi.toFixed(1);
  }
  return includeUnit ? `${stressMpa.toFixed(0)} MPa` : stressMpa.toFixed(0);
}

/**
 * Format torque.
 * Metric: '120.5 N·m'
 * Imperial: '1066.5 lbf·in'
 */
export function formatTorque(
  torqueNm: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const lbfIn = torqueNm * NM_TO_LBF_IN;
    return includeUnit ? `${lbfIn.toFixed(1)} lbf·in` : lbfIn.toFixed(1);
  }
  return includeUnit ? `${torqueNm.toFixed(1)} N·m` : torqueNm.toFixed(1);
}

/**
 * Format force.
 * Metric: '500 N'
 * Imperial: '112.4 lbf'
 */
export function formatForce(
  forceN: number,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined,
  includeUnit = true
): string {
  if (isImperial(unitSystem)) {
    const lbf = forceN * N_TO_LBF;
    return includeUnit ? `${lbf.toFixed(1)} lbf` : lbf.toFixed(1);
  }
  return includeUnit ? `${forceN.toFixed(0)} N` : forceN.toFixed(0);
}

/**
 * Convert raw material unit rate ($/kg or $/lb).
 */
export function formatRatePerWeight(
  ratePerKg: number,
  formatCurrency: (val: number) => string,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined
): { rateStr: string; unitLabel: string } {
  if (isImperial(unitSystem)) {
    const ratePerLb = ratePerKg / KG_TO_LB;
    return {
      rateStr: formatCurrency(ratePerLb),
      unitLabel: 'per lb',
    };
  }
  return {
    rateStr: formatCurrency(ratePerKg),
    unitLabel: 'per kg',
  };
}

/**
 * Parses and converts dimension strings (e.g., "Ø60 mm × 200 mm" -> "Ø2.36 in × 7.87 in").
 */
export function convertDimensionsString(
  dimStr: string,
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined
): string {
  if (!isImperial(unitSystem) || !dimStr) {
    return dimStr;
  }

  // Look for numbers followed by mm or standalone dimensions
  return dimStr.replace(/(\d+(?:\.\d+)?)\s*(?:mm)?/gi, (match, numStr) => {
    const mmVal = parseFloat(numStr);
    if (isNaN(mmVal)) return match;
    const inVal = mmVal * MM_TO_INCH;
    return `${inVal.toFixed(2)} in`;
  });
}

/**
 * Dynamically converts output values in Engineering Calculations based on unit system.
 */
export function convertCalculationOutput(
  out: { value: number | string; unit: string; label: string },
  unitSystem: UnitSystem | 'mm' | 'inch' | undefined
): { value: string; unit: string; label: string } {
  if (!isImperial(unitSystem)) {
    return {
      value: String(out.value),
      unit: out.unit,
      label: out.label,
    };
  }

  const num = typeof out.value === 'number' ? out.value : parseFloat(out.value);
  if (isNaN(num)) {
    return { value: String(out.value), unit: out.unit, label: out.label };
  }

  const u = out.unit.toLowerCase().trim();

  if (u === 'mm') {
    const inVal = num * MM_TO_INCH;
    return {
      value: inVal < 0.01 ? inVal.toFixed(4) : inVal.toFixed(3),
      unit: 'in',
      label: out.label,
    };
  }
  if (u === 'mpa') {
    return {
      value: (num * MPA_TO_KSI).toFixed(1),
      unit: 'ksi',
      label: out.label,
    };
  }
  if (u === 'n·m' || u === 'nm' || u === 'n-m') {
    return {
      value: (num * NM_TO_LBF_IN).toFixed(1),
      unit: 'lbf·in',
      label: out.label,
    };
  }
  if (u === 'n') {
    return {
      value: (num * N_TO_LBF).toFixed(1),
      unit: 'lbf',
      label: out.label,
    };
  }
  if (u === 'kg') {
    return {
      value: (num * KG_TO_LB).toFixed(2),
      unit: 'lb',
      label: out.label,
    };
  }
  if (u === 'cm³' || u === 'cm3') {
    return {
      value: (num * CM3_TO_IN3).toFixed(2),
      unit: 'in³',
      label: out.label,
    };
  }

  return {
    value: String(out.value),
    unit: out.unit,
    label: out.label,
  };
}
