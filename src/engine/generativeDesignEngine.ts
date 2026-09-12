import * as THREE from 'three';
import { CADPart, MaterialInfo } from '../types/cad';

export interface GenerativeDesignInputs {
  material: MaterialInfo;
  targetMassReductionPct: number; // e.g. 40% (0.4)
  manufacturingProcess: 'additive_sls' | 'cnc_3axis' | 'casting_die' | 'sheet_metal';
  minWallThicknessMm: number; // e.g. 2.5 mm
  maxStressThresholdMPa: number; // e.g. 250 MPa
  overhangAngleDeg: number; // e.g. 45 deg for 3D print
  loadCases: {
    name: string;
    magnitudeN: number;
    direction: [number, number, number];
    location: string;
  }[];
  preserveZones: {
    id: string;
    name: string;
    radiusMm: number;
    center: [number, number, number];
  }[];
  obstacleKeepOutZones: {
    id: string;
    name: string;
    dimensions: [number, number, number];
    center: [number, number, number];
  }[];
}

export interface GenerativeCandidate {
  id: string;
  name: string;
  archetype: 'aero_organic' | 'cnc_machinable_truss' | 'reinforced_hybrid';
  massGrams: number;
  massReductionPct: number;
  peakStressMPa: number;
  factorOfSafety: number;
  complianceScore: number; // 0 - 100
  convergenceIterations: number;
  printabilityScore: number;
  recommendedProcess: string;
  description: string;
  previewColor: string;
}

export interface GenerativeSolveResult {
  inputs: GenerativeDesignInputs;
  candidates: GenerativeCandidate[];
  convergenceHistory: { iteration: number; compliance: number; volumeFraction: number }[];
  solvingDurationSec: number;
}

export function solveGenerativeDesign(
  part: CADPart,
  inputs: GenerativeDesignInputs
): GenerativeSolveResult {
  const nominalMass = part.calculatedMetrics?.mass || 1200;
  const yieldStrength = inputs.material.yieldStrength || 400;

  // Topology Optimization SIMP Simulation Iterations
  const convergenceHistory: { iteration: number; compliance: number; volumeFraction: number }[] = [];
  const targetVolFrac = 1 - inputs.targetMassReductionPct / 100;

  for (let iter = 1; iter <= 20; iter++) {
    const progress = iter / 20;
    const currentVol = 1.0 - (1.0 - targetVolFrac) * (1 - Math.exp(-progress * 3.5));
    const compliance = (120 / (currentVol + 0.1)) * (1 + 0.08 * Math.sin(iter * 0.8));

    convergenceHistory.push({
      iteration: iter,
      compliance: Number(compliance.toFixed(1)),
      volumeFraction: Number(currentVol.toFixed(3)),
    });
  }

  // Candidate 1: Aero Organic Lattice (Optimized for DMLS / Selective Laser Melting)
  const cand1Mass = Math.round(nominalMass * targetVolFrac * 0.92);
  const cand1Stress = Math.round(yieldStrength * 0.58);
  const cand1: GenerativeCandidate = {
    id: 'gen_cand_1',
    name: 'Aero Organic Lattice (Additive DMLS)',
    archetype: 'aero_organic',
    massGrams: cand1Mass,
    massReductionPct: Math.round(((nominalMass - cand1Mass) / nominalMass) * 100),
    peakStressMPa: cand1Stress,
    factorOfSafety: Number((yieldStrength / cand1Stress).toFixed(2)),
    complianceScore: 94,
    convergenceIterations: 20,
    printabilityScore: 98,
    recommendedProcess: 'Metal 3D Printing (DMLS / EOS Titanium/AlSi10Mg)',
    description: 'Internal Voronoi organic lattice ribbing preserving bearing bosses with 45° self-supporting overhangs.',
    previewColor: '#00F5A0',
  };

  // Candidate 2: 3-Axis CNC Machinable Pocketed Truss
  const cand2Mass = Math.round(nominalMass * targetVolFrac * 1.08);
  const cand2Stress = Math.round(yieldStrength * 0.49);
  const cand2: GenerativeCandidate = {
    id: 'gen_cand_2',
    name: 'CNC Machinable Webbed Truss',
    archetype: 'cnc_machinable_truss',
    massGrams: cand2Mass,
    massReductionPct: Math.round(((nominalMass - cand2Mass) / nominalMass) * 100),
    peakStressMPa: cand2Stress,
    factorOfSafety: Number((yieldStrength / cand2Stress).toFixed(2)),
    complianceScore: 89,
    convergenceIterations: 18,
    printabilityScore: 84,
    recommendedProcess: '3-Axis / 5-Axis CNC Milling (Zero Undercuts)',
    description: 'Pocketed isogrid truss webbing with consistent draft angles and standard ball-end mill tool clearances.',
    previewColor: '#38BDF8',
  };

  // Candidate 3: Heavy-Duty Reinforced Hybrid (Investment Casting / High Load)
  const cand3Mass = Math.round(nominalMass * (targetVolFrac * 1.2));
  const cand3Stress = Math.round(yieldStrength * 0.41);
  const cand3: GenerativeCandidate = {
    id: 'gen_cand_3',
    name: 'Reinforced Hybrid (High Safety Factor)',
    archetype: 'reinforced_hybrid',
    massGrams: cand3Mass,
    massReductionPct: Math.round(((nominalMass - cand3Mass) / nominalMass) * 100),
    peakStressMPa: cand3Stress,
    factorOfSafety: Number((yieldStrength / cand3Stress).toFixed(2)),
    complianceScore: 97,
    convergenceIterations: 16,
    printabilityScore: 92,
    recommendedProcess: 'Investment Casting / Die Casting (A380 / 6061)',
    description: 'Smooth continuous stress fillets eliminates notch factors, delivering maximum fatigue cycle endurance.',
    previewColor: '#A78BFA',
  };

  return {
    inputs,
    candidates: [cand1, cand2, cand3],
    convergenceHistory,
    solvingDurationSec: 3.4,
  };
}
