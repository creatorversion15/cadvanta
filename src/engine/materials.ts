import { MaterialInfo } from '../types/cad';
import { MATERIALS as ALL_MATERIALS, getMaterialById as getMatById, createCustomMaterial } from '../materials/materialsDatabase';

export const MATERIALS: MaterialInfo[] = ALL_MATERIALS;

export function getMaterialById(id: string): MaterialInfo {
  return getMatById(id);
}

export const DEFAULT_MATERIAL: MaterialInfo = ALL_MATERIALS[0];

export function calculateMass(
  volumeCm3: number,
  densityOrMaterial: number | MaterialInfo,
  costPerKg?: number
): {
  massGrams: number;
  massKg: number;
  estCostInr: number;
  estCostUsd: number;
  grams: number;
  kilograms: number;
} {
  let density = 7.85;
  let rawCostPerKg = 95.0;

  if (typeof densityOrMaterial === 'object' && densityOrMaterial !== null) {
    density = densityOrMaterial.density || 7.85;
    rawCostPerKg = densityOrMaterial.costPerKg || densityOrMaterial.costPerKgInr || 95.0;
  } else if (typeof densityOrMaterial === 'number') {
    density = densityOrMaterial;
    if (typeof costPerKg === 'number') {
      rawCostPerKg = costPerKg;
    }
  }

  const grams = volumeCm3 * density;
  const kilograms = grams / 1000;
  const estCostInr = kilograms * rawCostPerKg;
  const estCostUsd = estCostInr / 86.5; // conversion ref if needed

  return {
    massGrams: Math.round(grams * 10) / 10,
    massKg: Math.round(kilograms * 1000) / 1000,
    estCostInr: Math.round(estCostInr * 10) / 10,
    estCostUsd: Math.round(estCostUsd * 100) / 100,
    grams: Math.round(grams * 10) / 10,
    kilograms: Math.round(kilograms * 1000) / 1000,
  };
}

/**
 * Calculates accurate analytical part volume in cm3
 */
export function calculatePartVolumeCm3(partType: string, parameters: Record<string, any> = {}): number {
  if (partType === 'shaft' || partType === 'stepped_shaft' || partType === 'axle' || partType === 'spindle') {
    const mainD = Number(parameters.main_diameter || parameters.diameter || 60);
    const totL = Number(parameters.total_length || parameters.length || 200);
    return Math.max(0.1, (Math.PI * Math.pow(mainD / 20, 2) * (totL / 10)) * 0.92);
  } else if (partType === 'hollow_shaft') {
    const od = Number(parameters.outer_diameter || 60);
    const id = Number(parameters.inner_diameter || 35);
    const totL = Number(parameters.total_length || 200);
    return Math.max(0.1, (Math.PI * (Math.pow(od / 20, 2) - Math.pow(id / 20, 2)) * (totL / 10)));
  } else if (partType === 'gear' || partType === 'helical_gear' || partType === 'bevel_gear' || partType === 'worm_gear') {
    const d = Number(parameters.pitch_diameter || parameters.outer_diameter || parameters.diameter || 120);
    const w = Number(parameters.face_width || parameters.width || 25);
    return Math.max(0.1, (Math.PI * Math.pow(d / 20, 2) * (w / 10)) * 0.68);
  } else if (partType === 'bearing' || partType === 'roller_bearing' || partType === 'thrust_bearing') {
    const od = Number(parameters.outer_diameter || 80);
    const id = Number(parameters.inner_diameter || 40);
    const w = Number(parameters.width || 18);
    return Math.max(0.1, (Math.PI * (Math.pow(od / 20, 2) - Math.pow(id / 20, 2)) * (w / 10)) * 0.85);
  } else if (partType === 'bearing_housing' || partType === 'flanged_bearing') {
    const od = Number(parameters.outer_diameter || 130);
    const th = Number(parameters.thickness || 35);
    return Math.max(0.1, (Math.PI * Math.pow(od / 20, 2) * (th / 10)) * 0.55);
  } else if (partType === 'flange' || partType === 'flange_coupling') {
    const od = Number(parameters.outer_diameter || 120);
    const th = Number(parameters.thickness || 18);
    return Math.max(0.1, (Math.PI * Math.pow(od / 20, 2) * (th / 10)) * 0.72);
  } else if (partType === 'pulley') {
    const d = Number(parameters.diameter || parameters.pitch_diameter || 140);
    const w = Number(parameters.width || 30);
    return Math.max(0.1, (Math.PI * Math.pow(d / 20, 2) * (w / 10)) * 0.58);
  } else if (partType === 'sprocket') {
    const d = Number(parameters.pitch_diameter || parameters.diameter || 130);
    const w = Number(parameters.thickness || parameters.width || 12);
    return Math.max(0.1, (Math.PI * Math.pow(d / 20, 2) * (w / 10)) * 0.62);
  } else if (partType === 'bracket') {
    const l = Number(parameters.length || 100);
    const w = Number(parameters.width || 60);
    const h = Number(parameters.height || 40);
    const th = Number(parameters.thickness || 6);
    return Math.max(0.1, ((l * w + w * h) * th) / 1000);
  } else if (partType === 'bolt' || partType === 'screw' || partType === 'stud') {
    const d = Number(parameters.thread_diameter || parameters.nominal_diameter || parameters.diameter || 12);
    const l = Number(parameters.total_length || parameters.length || 60);
    return Math.max(0.05, (Math.PI * Math.pow(d / 20, 2) * (l / 10)) * 1.15);
  } else if (partType === 'nut' || partType === 'washer') {
    const od = Number(parameters.width_across_flats || parameters.outer_diameter || 24);
    const th = Number(parameters.height || parameters.thickness || 10);
    return Math.max(0.05, (Math.PI * Math.pow(od / 20, 2) * (th / 10)) * 0.65);
  }
  // Generic parametric bounding volume
  const dimX = Math.max(5, Number(parameters.length || parameters.total_length || parameters.outer_diameter || 80));
  const dimY = Math.max(5, Number(parameters.width || parameters.diameter || parameters.main_diameter || 50));
  const dimZ = Math.max(5, Number(parameters.height || parameters.thickness || 30));
  return Math.max(0.1, ((dimX * dimY * dimZ) / 1000) * 0.62);
}

export { createCustomMaterial };
