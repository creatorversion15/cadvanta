import { CADPart, BOMItem, DFMAnalysisResult, GDTFeature } from '../types/cad';

export function generateBOM(part: CADPart): BOMItem[] {
  const p = part.parameters;
  const mat = part.material;
  const density = mat.density || 7.85; // g/cm³
  const rawCostPerKgInr = mat.costPerKgInr || mat.costPerKg || 95.0; // ₹ / kg

  const items: BOMItem[] = [];

  switch (part.part_type) {
    case 'shaft':
    case 'stepped_shaft': {
      const len = Number(p.total_length || 200);
      const dia = Number(p.main_diameter || 60);
      // Mass = Vol * density = pi * (d/20)^2 * (len/10) * density (in grams)
      const volCm3 = Math.PI * Math.pow(dia / 20, 2) * (len / 10);
      const massKg = (volCm3 * density) / 1000;
      // In India: Raw Material Cost + CNC Turning Setup & Cycle (₹650/hr job rate)
      const unitCostInr = massKg * rawCostPerKgInr + 850; // Material + CNC Turning & Keyway slotting in INR
      const unitCostUsd = unitCostInr / 86.5;

      items.push({
        itemNumber: 1,
        partNumber: 'IND-SH-001',
        partName: part.name || 'Stepped Transmission Shaft (IS 5517 / IS 2062)',
        quantity: 1,
        material: mat.name,
        unitMassKg: Math.round(massKg * 100) / 100,
        totalMassKg: Math.round(massKg * 100) / 100,
        manufacturingMethod: 'CNC Turning & Keyway Milling (IS 2048 / DIN 6885)',
        dimensions: `Ø${dia} mm × ${len} mm`,
        hsnCode: '8483 10 99',
        unitCostInr: Math.round(unitCostInr),
        totalCostInr: Math.round(unitCostInr),
        unitCostUsd: Math.round(unitCostUsd * 10) / 10,
        totalCostUsd: Math.round(unitCostUsd * 10) / 10,
      });

      if (p.keyway_width) {
        items.push({
          itemNumber: 2,
          partNumber: 'IS-2048-A',
          partName: `Parallel Drive Key Form A (${p.keyway_width}×${p.keyway_depth || 3}×${p.keyway_length || 45})`,
          quantity: 1,
          material: 'EN8 / C45 Drawn Key Steel (IS 5517)',
          unitMassKg: 0.04,
          totalMassKg: 0.04,
          manufacturingMethod: 'Standard Bought-Out Part (IS 2048 / DIN 6885-A)',
          dimensions: `${p.keyway_width} × ${p.keyway_depth || 3} × ${p.keyway_length || 45} mm`,
          hsnCode: '7318 29 00',
          unitCostInr: 120,
          totalCostInr: 120,
          unitCostUsd: 1.4,
          totalCostUsd: 1.4,
        });
      }
      break;
    }

    case 'planetary_gearbox': {
      items.push(
        {
          itemNumber: 1,
          partNumber: 'PGB-IND-HSG-101',
          partName: 'Internal Ring Gear Housing (IS 733)',
          quantity: 1,
          material: 'Aluminium 7075-T6 Hard Anodized',
          unitMassKg: 1.45,
          totalMassKg: 1.45,
          manufacturingMethod: '5-Axis CNC Mill-Turn & Internal Broaching',
          dimensions: `Ø${p.ring_diameter || 120} × ${p.length || 140} mm`,
          hsnCode: '8483 40 00',
          unitCostInr: 12500,
          totalCostInr: 12500,
          unitCostUsd: 145.0,
          totalCostUsd: 145.0,
        },
        {
          itemNumber: 2,
          partNumber: 'PGB-IND-SUN-102',
          partName: 'Input Sun Pinion Shaft (z=16, m=2.0)',
          quantity: 2,
          material: 'Case-Hardened 16MnCr5 / 20MnCr5 Alloy Steel',
          unitMassKg: 0.32,
          totalMassKg: 0.64,
          manufacturingMethod: 'Gear Hobbing & Induction Tooth Hardening (58-62 HRC)',
          dimensions: 'Ø32 × 75 mm',
          hsnCode: '8483 40 00',
          unitCostInr: 3400,
          totalCostInr: 6800,
          unitCostUsd: 39.0,
          totalCostUsd: 78.0,
        },
        {
          itemNumber: 3,
          partNumber: 'PGB-IND-PLN-103',
          partName: 'Planet Gears (z=20, m=2.0)',
          quantity: 6,
          material: 'Case-Hardened 16MnCr5 Steel',
          unitMassKg: 0.18,
          totalMassKg: 1.08,
          manufacturingMethod: 'Precision Hobbing & Profile Tooth Grinding (IS 4460 / DIN Q6)',
          dimensions: 'Ø44 × 18 mm',
          hsnCode: '8483 40 00',
          unitCostInr: 2250,
          totalCostInr: 13500,
          unitCostUsd: 26.0,
          totalCostUsd: 156.0,
        },
        {
          itemNumber: 4,
          partNumber: 'PGB-IND-CAR-104',
          partName: 'Dual-Flange Planet Carrier Plate',
          quantity: 2,
          material: 'Aluminium 7075-T6 (IS 733 Aero)',
          unitMassKg: 0.55,
          totalMassKg: 1.1,
          manufacturingMethod: 'CNC 4-Axis High-Precision Milling',
          dimensions: 'Ø90 × 40 mm',
          hsnCode: '8483 40 00',
          unitCostInr: 6800,
          totalCostInr: 13600,
          unitCostUsd: 78.0,
          totalCostUsd: 156.0,
        },
        {
          itemNumber: 5,
          partNumber: 'IS-6006-2RS',
          partName: 'Deep Groove Radial Support Bearings (NBC/SKF India)',
          quantity: 4,
          material: '100Cr6 High Carbon Bearing Steel',
          unitMassKg: 0.12,
          totalMassKg: 0.48,
          manufacturingMethod: 'Standard Bought-Out Item (IS 6455 / ISO 281)',
          dimensions: 'Ø30 × Ø55 × 13 mm',
          hsnCode: '8482 10 20',
          unitCostInr: 950,
          totalCostInr: 3800,
          unitCostUsd: 11.0,
          totalCostUsd: 44.0,
        },
        {
          itemNumber: 6,
          partNumber: 'IS-1364-M6x25',
          partName: 'Socket Head Cap Screws Grade 10.9 (Unbrako/TVS)',
          quantity: 8,
          material: 'High-Tensile Alloy Steel (IS 1364 Gr 10.9)',
          unitMassKg: 0.015,
          totalMassKg: 0.12,
          manufacturingMethod: 'Cold Forged & Precision Thread Rolled',
          dimensions: 'M6 × 25 mm',
          hsnCode: '7318 15 00',
          unitCostInr: 45,
          totalCostInr: 360,
          unitCostUsd: 0.5,
          totalCostUsd: 4.0,
        }
      );
      break;
    }

    case 'flange_coupling': {
      const od = Number(p.outer_diameter || 125);
      const th = Number(p.thickness || 18);
      const volCm3 = Math.PI * Math.pow(od / 20, 2) * (th / 10);
      const massKg = (volCm3 * density) / 1000;
      const unitCostInr = massKg * rawCostPerKgInr + 1400; // Material + CNC turning & PCD drilling
      const unitCostUsd = unitCostInr / 86.5;

      items.push(
        {
          itemNumber: 1,
          partNumber: 'IND-CPL-FLG-01',
          partName: 'Flanged Coupling Half (Driving - IS 2693)',
          quantity: 1,
          material: mat.name,
          unitMassKg: Math.round(massKg * 100) / 100,
          totalMassKg: Math.round(massKg * 100) / 100,
          manufacturingMethod: 'CNC Turning & PCD C-Axis Drilling',
          dimensions: `Ø${od} × ${p.hub_height || 32} mm`,
          hsnCode: '8483 60 00',
          unitCostInr: Math.round(unitCostInr),
          totalCostInr: Math.round(unitCostInr),
          unitCostUsd: Math.round(unitCostUsd * 10) / 10,
          totalCostUsd: Math.round(unitCostUsd * 10) / 10,
        },
        {
          itemNumber: 2,
          partNumber: 'IND-CPL-FLG-02',
          partName: 'Flanged Coupling Half (Driven - IS 2693)',
          quantity: 1,
          material: mat.name,
          unitMassKg: Math.round(massKg * 100) / 100,
          totalMassKg: Math.round(massKg * 100) / 100,
          manufacturingMethod: 'CNC Turning & PCD C-Axis Drilling',
          dimensions: `Ø${od} × ${p.hub_height || 32} mm`,
          hsnCode: '8483 60 00',
          unitCostInr: Math.round(unitCostInr),
          totalCostInr: Math.round(unitCostInr),
          unitCostUsd: Math.round(unitCostUsd * 10) / 10,
          totalCostUsd: Math.round(unitCostUsd * 10) / 10,
        },
        {
          itemNumber: 3,
          partNumber: 'IS-1364-M10x45',
          partName: 'Hexagon Fit Fitted Bolts Grade 8.8 (IS 1364)',
          quantity: p.bolt_hole_count || 6,
          material: 'Medium Carbon High Tensile Steel (IS 1367)',
          unitMassKg: 0.045,
          totalMassKg: 0.27,
          manufacturingMethod: 'Precision Ground Fitted Body & Rolled Thread',
          dimensions: 'M10 × 45 mm',
          hsnCode: '7318 15 00',
          unitCostInr: 180,
          totalCostInr: 180 * (p.bolt_hole_count || 6),
          unitCostUsd: 2.1,
          totalCostUsd: 2.1 * (p.bolt_hole_count || 6),
        },
        {
          itemNumber: 4,
          partNumber: 'IS-1364-Nut-M10',
          partName: 'Hex Nyloc Lock Nuts (IS 1364 / DIN 985)',
          quantity: p.bolt_hole_count || 6,
          material: 'Steel Grade 8 Zinc Passivated',
          unitMassKg: 0.012,
          totalMassKg: 0.072,
          manufacturingMethod: 'Cold Formed with Nylon Ring Insert',
          dimensions: 'M10 Standard Pitch',
          hsnCode: '7318 16 00',
          unitCostInr: 45,
          totalCostInr: 45 * (p.bolt_hole_count || 6),
          unitCostUsd: 0.5,
          totalCostUsd: 0.5 * (p.bolt_hole_count || 6),
        }
      );
      break;
    }

    default: {
      const massKg = 1.2;
      const unitCostInr = massKg * rawCostPerKgInr + 1200;
      items.push({
        itemNumber: 1,
        partNumber: 'IND-MECH-001',
        partName: part.name || 'Custom Mechanical Component',
        quantity: 1,
        material: mat.name,
        unitMassKg: massKg,
        totalMassKg: massKg,
        manufacturingMethod: 'CNC Machining (Turning & 3-Axis Milling)',
        dimensions: 'Parametric Envelope',
        hsnCode: '8483 90 00',
        unitCostInr: Math.round(unitCostInr),
        totalCostInr: Math.round(unitCostInr),
        unitCostUsd: Math.round((unitCostInr / 86.5) * 10) / 10,
        totalCostUsd: Math.round((unitCostInr / 86.5) * 10) / 10,
      });
      break;
    }
  }

  return items;
}

export function runDFMAnalysis(part: CADPart): DFMAnalysisResult {
  const p = part.parameters;
  const warnings: string[] = [];
  const costDrivers: string[] = [];
  const suggestions: string[] = [];
  let score = 92;
  let recProcess = 'CNC Lathe Turning (Single-Setup with Live Tooling)';
  let estTime = 18; // minutes
  let minWall = 6.0;
  let maxAspect = 3.2;

  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft') {
    const len = Number(p.total_length || 200);
    const mainDia = Number(p.main_diameter || 60);
    const s1Dia = Number(p.step1_diameter || 30);
    const filletR = Number(p.fillet_radius || 2);
    const kwWidth = Number(p.keyway_width || 0);

    maxAspect = len / Math.max(1, s1Dia || mainDia);
    if (maxAspect > 8) {
      warnings.push(`Shaft length-to-diameter ratio (${maxAspect.toFixed(1)}:1) is high. Tailstock center support & steady rest required to prevent deflection chatter.`);
      costDrivers.push('Steady-rest setup and multi-pass turning time.');
      score -= 8;
      estTime += 12;
    }

    if (filletR < 1.0) {
      warnings.push('Shoulder fillet radius < 1.0 mm causes sharp tool edge wear and elevates notch fatigue stress.');
      suggestions.push('Increase shoulder fillet to R1.5 - R2.0 mm for standard insert nose radius.');
      score -= 5;
    } else {
      suggestions.push(`R${filletR} mm shoulder fillet perfectly matches standard ISO turning tool nose radii (r_eps = 0.8 - 1.2 mm).`);
    }

    if (kwWidth > 0) {
      suggestions.push(`DIN 6885 keyway (${kwWidth} mm) can be cut with standard imperial/metric end mill in 2 passes on live-tooling turret.`);
    }
  } else if (part.part_type === 'planetary_gearbox') {
    recProcess = 'Multi-Process: CNC Mill-Turn, Gear Hobbing & Profile Grinding';
    estTime = 145;
    score = 88;
    minWall = 4.5;
    costDrivers.push('Precision gear tooth grinding to DIN Q6 tolerance.');
    costDrivers.push('Induction hardening and cryogenic stabilization.');
    suggestions.push('Specify AGMA Class 10 / DIN 6 gear quality for silent running above 2500 RPM.');
  } else if (part.part_type === 'flange' || part.part_type === 'flange_coupling') {
    recProcess = 'CNC Turning followed by PCD Drill Pattern C-Axis Cycle';
    estTime = 24;
    score = 95;
    minWall = Number(p.thickness || 14);
    suggestions.push('Through-holes on PCD allow single drill cycle without flipping workpiece.');
  }

  return {
    score: Math.max(50, Math.min(100, score)),
    recommendedProcess: recProcess,
    estimatedMachiningTimeMin: estTime,
    toolAccessibility: score > 85 ? 'Good' : 'Moderate',
    minWallThicknessMm: minWall,
    maxAspectDepthRatio: Math.round(maxAspect * 10) / 10,
    warnings,
    costDrivers,
    suggestions,
  };
}

export function getGDTFeatures(part: CADPart): GDTFeature[] {
  const p = part.parameters;
  const features: GDTFeature[] = [];

  if (part.part_type === 'shaft' || part.part_type === 'stepped_shaft') {
    features.push(
      {
        id: 'gdt_1',
        featureName: 'Main Bearing Journal (Ø' + (p.step1_diameter || 30) + ' mm)',
        symbol: 'cylindricity',
        toleranceMm: 0.008,
        datumA: 'A',
        explanation: 'Maintains uniform hydrodynamic/rolling contact across bearing inner ring (ISO k5/m5 fit).',
      },
      {
        id: 'gdt_2',
        featureName: 'Shaft Centerline Axis Runout',
        symbol: 'runout',
        toleranceMm: 0.015,
        datumA: 'A',
        datumB: 'B',
        explanation: 'Prevents dynamic imbalance and vibration at speeds up to 3600 RPM.',
      },
      {
        id: 'gdt_3',
        featureName: 'Keyway Centerline Symmetry',
        symbol: 'position',
        toleranceMm: 0.03,
        datumA: 'A',
        datumB: 'B',
        materialCondition: 'MMC',
        explanation: 'Ensures parallel alignment with shaft axis for easy key insertion and torque transmission.',
      },
      {
        id: 'gdt_4',
        featureName: 'Shoulder Thrust Face',
        symbol: 'perpendicularity',
        toleranceMm: 0.012,
        datumA: 'A',
        explanation: 'Guarantees square seating against bearing inner race to prevent cocking.',
      }
    );
  } else {
    features.push(
      {
        id: 'gdt_1',
        featureName: 'Primary Mounting Face',
        symbol: 'flatness',
        toleranceMm: 0.02,
        datumA: 'A',
        explanation: 'Provides zero-gap planar contact under bolting clamp pressure.',
      },
      {
        id: 'gdt_2',
        featureName: 'Bolt Hole Pattern Array',
        symbol: 'position',
        toleranceMm: 0.08,
        datumA: 'A',
        materialCondition: 'MMC',
        explanation: 'True position tolerance ensures interchangeability with mating flange bolts.',
      }
    );
  }

  return features;
}
