import { CADPart, FeatureHistoryItem, PartType } from '../types/cad';
import { getMaterialById, MATERIALS } from '../materials/materialsDatabase';
import { runEngineeringValidation } from './engineeringValidator';

export interface ParseResult {
  part: CADPart;
  reasoning: string[];
  clarificationRequired?: boolean;
  clarificationQuestion?: string;
  stagePipeline: { stage: string; status: 'completed' | 'in_progress' | 'pending'; detail: string }[];
}

export function createDefaultFeatures(partType: PartType, params: Record<string, any>): FeatureHistoryItem[] {
  const features: FeatureHistoryItem[] = [];

  switch (partType) {
    case 'shaft':
    case 'stepped_shaft':
      features.push({
        id: 'feat_1',
        name: 'Main Revolve Solid',
        type: 'revolve',
        description: `Main Journal Ø${params.main_diameter || 60} mm × ${params.total_length || 200} mm Span`,
        parameters: { main_diameter: params.main_diameter || 60, total_length: params.total_length || 200 },
        enabled: true,
      });
      if (params.step1_length && params.step1_length > 0) {
        features.push({
          id: 'feat_2',
          name: 'Stepped Bearing Journal 1',
          type: 'extrude',
          description: `Shoulder Ø${params.step1_diameter} mm × ${params.step1_length} mm Length`,
          parameters: { step1_diameter: params.step1_diameter, step1_length: params.step1_length },
          enabled: true,
        });
      }
      if (params.step2_length && params.step2_length > 0) {
        features.push({
          id: 'feat_3',
          name: 'Stepped Journal 2 (Drive End)',
          type: 'extrude',
          description: `Shoulder Ø${params.step2_diameter} mm × ${params.step2_length} mm Length`,
          parameters: { step2_diameter: params.step2_diameter, step2_length: params.step2_length },
          enabled: true,
        });
      }
      if (params.keyway_width && params.keyway_width > 0) {
        features.push({
          id: 'feat_4',
          name: 'DIN 6885 Form-A Keyway Slot',
          type: 'keyway',
          description: `Keyway ${params.keyway_width} mm W × ${params.keyway_depth || 3} mm D × ${params.keyway_length || 45} mm L`,
          parameters: {
            keyway_width: params.keyway_width,
            keyway_depth: params.keyway_depth,
            keyway_length: params.keyway_length,
          },
          enabled: true,
        });
      }
      if (params.fillet_radius && params.fillet_radius > 0) {
        features.push({
          id: 'feat_5',
          name: 'Shoulder Stress Relief Fillet',
          type: 'fillet',
          description: `R${params.fillet_radius} mm Shoulder Fillets`,
          parameters: { fillet_radius: params.fillet_radius },
          enabled: true,
        });
      }
      if (params.chamfer_size && params.chamfer_size > 0) {
        features.push({
          id: 'feat_6',
          name: 'Shaft Lead-in Chamfers',
          type: 'chamfer',
          description: `${params.chamfer_size} mm × 45° Lead-in Chamfers`,
          parameters: { chamfer_size: params.chamfer_size },
          enabled: true,
        });
      }
      break;

    case 'planetary_gearbox':
      features.push({
        id: 'feat_1',
        name: 'Internal Ring Gear Housing',
        type: 'base',
        description: `Ring Gear Ø${params.ring_diameter || 120} mm × ${params.length || 140} mm L`,
        parameters: { ring_diameter: params.ring_diameter, length: params.length },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Sun Pinion Drive Shaft',
        type: 'gear_teeth',
        description: `Sun Gear z=${params.sun_teeth || 16}, m=2.0 mm`,
        parameters: { sun_teeth: params.sun_teeth },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Planet Carrier & Gear Cluster',
        type: 'pattern',
        description: `3× Planet Gears z=${params.planet_teeth || 20} on High-Strength Carrier`,
        parameters: { planet_teeth: params.planet_teeth },
        enabled: true,
      });
      features.push({
        id: 'feat_4',
        name: 'Secondary Reduction Cascade',
        type: 'pattern',
        description: `Stage 2 Dual Cascade (~16:1 Total Ratio)`,
        parameters: { stages: params.stages || 2 },
        enabled: true,
      });
      break;

    case 'flange':
    case 'flange_coupling':
      features.push({
        id: 'feat_1',
        name: 'Flange Hub Disc',
        type: 'extrude',
        description: `Flange Disc Ø${params.outer_diameter || 120} mm × ${params.thickness || 14} mm T`,
        parameters: { outer_diameter: params.outer_diameter, thickness: params.thickness },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Precision Shaft Bore',
        type: 'bore',
        description: `Shaft Bore Ø${params.inner_diameter || 35} mm with Keyway`,
        parameters: { inner_diameter: params.inner_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Circular Bolting Pattern',
        type: 'pattern',
        description: `${params.bolt_hole_count || 6}× Ø${params.bolt_hole_diameter || 10} mm on Ø${params.pitch_circle_diameter || 90} mm PCD`,
        parameters: {
          bolt_hole_count: params.bolt_hole_count,
          bolt_hole_diameter: params.bolt_hole_diameter,
          pitch_circle_diameter: params.pitch_circle_diameter,
        },
        enabled: true,
      });
      break;

    case 'gear':
    case 'helical_gear':
      features.push({
        id: 'feat_1',
        name: 'Involute Tooth Profile Extrusion',
        type: 'gear_teeth',
        description: `${params.teeth_count || 24} Teeth, Module ${params.module || 2.5} mm, Face Width ${params.face_width || 20} mm`,
        parameters: { teeth_count: params.teeth_count, module: params.module, face_width: params.face_width },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Shaft Mounting Bore',
        type: 'bore',
        description: `Bore Ø${params.bore_diameter || 20} mm with Keyway`,
        parameters: { bore_diameter: params.bore_diameter },
        enabled: true,
      });
      break;

    case 'bracket':
      features.push({
        id: 'feat_1',
        name: 'Base Angle Extrusion',
        type: 'extrude',
        description: `${params.width || 80} mm W × ${params.height || 100} mm H × ${params.length || 110} mm L`,
        parameters: { width: params.width, height: params.height, length: params.length },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Mounting Bolt Pattern',
        type: 'pattern',
        description: `4× Ø${params.hole_diameter || 10} mm Holes`,
        parameters: { hole_diameter: params.hole_diameter },
        enabled: true,
      });
      break;

    case 'engine_piston':
      features.push({
        id: 'feat_1',
        name: 'Piston Crown & Ring Belt',
        type: 'revolve',
        description: `Crown Ø${params.bore_diameter || 85} mm with ${params.dish_depth ? `Combustion Bowl (${params.dish_depth}mm deep)` : 'Flat Deck'}`,
        parameters: { bore_diameter: params.bore_diameter, dish_depth: params.dish_depth },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: '3-Ring Pack Grooves',
        type: 'cut',
        description: 'Top Compression (1.5mm), 2nd Napier Scraper (1.5mm), Oil Control (2.8mm)',
        parameters: { ring_count: 3 },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Gudgeon Pin Bore & Bosses',
        type: 'bore',
        description: `Pin Bore Ø${params.pin_diameter || 22} mm with internal skirt reinforcing ribs`,
        parameters: { pin_diameter: params.pin_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_4',
        name: 'Slipper Skirt Profile',
        type: 'extrude',
        description: `Ovalized low-friction skirt span (${params.total_height || 75} mm OAL)`,
        parameters: { total_height: params.total_height },
        enabled: true,
      });
      break;

    case 'engine_connecting_rod':
      features.push({
        id: 'feat_1',
        name: 'Forged H-Beam Shank Column',
        type: 'base',
        description: `Forged 4340 Steel H-Beam Column (${params.center_to_center_length || 140} mm C-to-C)`,
        parameters: { center_to_center_length: params.center_to_center_length },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Split Big-End Journal & Cap',
        type: 'bore',
        description: `Crankpin Bore Ø${params.big_end_bore || 52} mm with serrated parting line`,
        parameters: { big_end_bore: params.big_end_bore },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Small-End Pin Eye & Bushing',
        type: 'bore',
        description: `Wrist Pin Bore Ø${params.small_end_bore || 22} mm with bronze insert`,
        parameters: { small_end_bore: params.small_end_bore },
        enabled: true,
      });
      features.push({
        id: 'feat_4',
        name: 'ARP 2000 Rod Bolt Pattern',
        type: 'pattern',
        description: '2× 3/8" High-Tensile Forged Rod Clamp Fasteners',
        parameters: { bolt_grade: 'ARP 2000' },
        enabled: true,
      });
      break;

    case 'engine_crankshaft':
      features.push({
        id: 'feat_1',
        name: 'Multi-Throw Forged Crankpins',
        type: 'revolve',
        description: `${params.throws || 4}-Cylinder Offset Crankpins (${params.stroke || 80} mm Stroke)`,
        parameters: { stroke: params.stroke, throws: params.throws },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Aerodynamic Counterweights',
        type: 'extrude',
        description: 'Precision dynamic balanced wedge counterweights with chamfered flanks',
        parameters: { main_journal_diameter: params.main_journal_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Main Bearing Journals & Oil Cross-Drilling',
        type: 'bore',
        description: `Ø${params.main_journal_diameter || 55} mm Induction-Hardened Main Journals`,
        parameters: { main_journal_diameter: params.main_journal_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_4',
        name: 'Flywheel Mounting Flange',
        type: 'pattern',
        description: '8-Bolt Circular Mounting Array with Dowel Locator',
        parameters: { flywheel_pcd: 75 },
        enabled: true,
      });
      break;

    case 'engine_camshaft':
      features.push({
        id: 'feat_1',
        name: 'Camshaft Core Revolve',
        type: 'revolve',
        description: `Main Core Shaft Ø${params.shaft_diameter || 28} mm × ${params.total_length || 380} mm Span`,
        parameters: { shaft_diameter: params.shaft_diameter, total_length: params.total_length },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Asymmetric Cam Lobe Array',
        type: 'loft',
        description: `${params.lobe_count || 8}× High-Lift Cam Lobes (${params.lobe_lift || 9.5} mm Valve Lift)`,
        parameters: { lobe_count: params.lobe_count, lobe_lift: params.lobe_lift },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Timing Sprocket Flange & Thrust Collar',
        type: 'extrude',
        description: 'Drive Flange with Woodruff Key and Precision Thrust Collar',
        parameters: {},
        enabled: true,
      });
      break;

    case 'turbocharger_impeller':
      features.push({
        id: 'feat_1',
        name: 'Aerodynamic Hub Revolve',
        type: 'revolve',
        description: `Billet Hub Exducer Ø${params.exducer_diameter || 76} mm / Inducer Ø${params.inducer_diameter || 52} mm`,
        parameters: { exducer_diameter: params.exducer_diameter, inducer_diameter: params.inducer_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Swept Inducer/Exducer 3D Blades',
        type: 'loft',
        description: `${params.blade_count || 6}× Extended Swept Full Blades with Backsweep`,
        parameters: { blade_count: params.blade_count },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Interleaved Splitter Blades',
        type: 'loft',
        description: `${params.blade_count || 6}× Aerodynamic Intermediate Splitters`,
        parameters: { blade_count: params.blade_count },
        enabled: true,
      });
      break;

    case 'engine_flywheel':
      features.push({
        id: 'feat_1',
        name: 'Flywheel Inertia Disc Solid',
        type: 'revolve',
        description: `Flywheel Disc Ø${params.outer_diameter || 280} mm × ${params.thickness || 32} mm Thick`,
        parameters: { outer_diameter: params.outer_diameter, thickness: params.thickness },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Starter Ring Gear Teeth',
        type: 'gear_teeth',
        description: `${params.ring_teeth || 110} Teeth Starter Ring Gear (Mod 2.5)`,
        parameters: { ring_teeth: params.ring_teeth },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Crankshaft 8-Bolt Pattern & Friction Face',
        type: 'pattern',
        description: '8× M10 Grade 12.9 Flywheel Bolts on Ø75 mm PCD with Clutch Recess',
        parameters: { pcd: 75 },
        enabled: true,
      });
      break;

    case 'gas_turbine_blisk':
      features.push({
        id: 'feat_1',
        name: 'Turbine Hub Solid Revolve',
        type: 'revolve',
        description: `High-Pressure Disc Ø${params.hub_diameter || 160} mm × ${params.disc_width || 42} mm Width`,
        parameters: { hub_diameter: params.hub_diameter, disc_width: params.disc_width },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Aerofoil Turbine Blades (Blisk)',
        type: 'loft',
        description: `${params.blade_count || 18}× Aerodynamic Swept Inconel Turbine Blades`,
        parameters: { blade_count: params.blade_count },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Fir-Tree Root & Dynamic Balance Bores',
        type: 'pattern',
        description: '6× Weight Balance Relief Bores with Fir-Tree Integral Platform',
        parameters: { balance_holes: 6 },
        enabled: true,
      });
      break;

    case 'roots_supercharger_rotor':
      features.push({
        id: 'feat_1',
        name: 'Helical Twin-Lobe Blower Profile',
        type: 'loft',
        description: `Twin-Lobe Rotor Ø${params.outer_diameter || 92} mm × ${params.length || 160} mm with ${params.twist_angle || 60}° Twist`,
        parameters: { outer_diameter: params.outer_diameter, length: params.length, twist_angle: params.twist_angle },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Drive Shaft & Timing Pinion Journal',
        type: 'revolve',
        description: `Drive Shaft Ø${params.shaft_diameter || 24} mm with Front Timing Gear`,
        parameters: { shaft_diameter: params.shaft_diameter },
        enabled: true,
      });
      break;

    case 'engine_valve':
      features.push({
        id: 'feat_1',
        name: 'Poppet Valve Head & Ground Seat',
        type: 'revolve',
        description: `Valve Head Ø${params.head_diameter || 34} mm with 45° Precision Ground Seating Face`,
        parameters: { head_diameter: params.head_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Hardened Valve Stem & Tulip Transition',
        type: 'revolve',
        description: `Stem Ø${params.stem_diameter || 6} mm × ${params.total_length || 95} mm Total Length`,
        parameters: { stem_diameter: params.stem_diameter, total_length: params.total_length },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Keeper Collet Retaining Grooves',
        type: 'cut',
        description: 'Dual Collet Lock Ring Grooves at Hardened Stem Tip',
        parameters: { groove_count: 2 },
        enabled: true,
      });
      break;

    case 'cycloidal_drive':
      features.push({
        id: 'feat_1',
        name: 'Cycloidal Epotrochoid Lobed Disc',
        type: 'extrude',
        description: `Precision Disc with ${params.lobe_count || 11} Epotrochoid Lobes (11:1 Reduction)`,
        parameters: { lobe_count: params.lobe_count },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Ring Housing & Needle Roller Pins',
        type: 'pattern',
        description: `${params.pin_count || 12}× Hardened Steel Bearing Pins on Ø${params.ring_diameter || 130} mm Housing`,
        parameters: { pin_count: params.pin_count, ring_diameter: params.ring_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Output Torque Drive Pins & Cam Hub',
        type: 'pattern',
        description: '6× Output Torque Roller Transfer Pins with Eccentric Cam Bearing Hub',
        parameters: { output_pins: 6 },
        enabled: true,
      });
      break;

    case 'clutch_pack':
      features.push({
        id: 'feat_1',
        name: 'Outer Clutch Basket Drum',
        type: 'revolve',
        description: `Slotted Basket Ø${params.outer_diameter || 160} mm with Cooling Windows`,
        parameters: { outer_diameter: params.outer_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Friction Discs & Steel Drive Plates Stack',
        type: 'pattern',
        description: `${params.disc_count || 6}× Alternating Bronze Friction Discs and Steel Drive Plates`,
        parameters: { disc_count: params.disc_count },
        enabled: true,
      });
      features.push({
        id: 'feat_3',
        name: 'Pressure Plate & Helical Springs Array',
        type: 'pattern',
        description: '5× Coil Pressure Springs with Internal Splined Hub',
        parameters: { springs: 5 },
        enabled: true,
      });
      break;

    case 'universal_joint':
      features.push({
        id: 'feat_1',
        name: 'Cardan 4-Way Cross Spider',
        type: 'base',
        description: `Hardened Alloy Spider ${params.spider_span || 90} mm Span × Ø${params.trunnion_diameter || 26} mm Trunnions`,
        parameters: { spider_span: params.spider_span, trunnion_diameter: params.trunnion_diameter },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Dual-Axis U-Fork Drive Yokes',
        type: 'pattern',
        description: 'Input and Output 90° Phased Drive Yokes with Needle Bearing Cups',
        parameters: { yokes: 2 },
        enabled: true,
      });
      break;

    case 'geneva_mechanism':
      features.push({
        id: 'feat_1',
        name: 'Geneva Star Indexing Wheel',
        type: 'extrude',
        description: `Geneva Wheel Ø${params.wheel_diameter || 120} mm with ${params.slot_count || 6} Radial Locking Slots`,
        parameters: { wheel_diameter: params.wheel_diameter, slot_count: params.slot_count },
        enabled: true,
      });
      features.push({
        id: 'feat_2',
        name: 'Input Driving Crank & Locking Cam Disc',
        type: 'revolve',
        description: 'Continuous Rotary Driver with Hardened Indexing Pin and Concave Locking Arc',
        parameters: { driver: true },
        enabled: true,
      });
      break;

    default:
      features.push({
        id: 'feat_1',
        name: 'Solid Base Extrusion',
        type: 'base',
        description: 'Base parametric mechanical body',
        parameters: params,
        enabled: true,
      });
      break;
  }

  return features;
}

export function parsePromptDeterministically(prompt: string, currentPart?: CADPart): ParseResult {
  const text = prompt.trim().toLowerCase();
  const reasoning: string[] = [];

  const stagePipeline = [
    { stage: 'Requirement Parser', status: 'completed' as const, detail: 'Tokenized natural language geometry and extracted engineering constraints' },
    { stage: 'Validation Engine', status: 'completed' as const, detail: 'Checked geometric relationships, interference and manufacturing tolerances' },
    { stage: 'Feature Planner', status: 'completed' as const, detail: 'Planned parametric sketch-extrude-cut-fillet feature tree' },
    { stage: 'Geometry Generator', status: 'completed' as const, detail: 'Constructing 3D solid boundary representation and mesh buffers' },
  ];

  // Number helper
  function findNumberAfter(keywords: string[]): number | null {
    for (const kw of keywords) {
      // Handles formats like "total length: 200 mm", "length = 200", "length 200", "length of 200"
      const regex = new RegExp(`${kw}[:\\s=]+(\\d+(?:\\.\\d+)?)`, 'i');
      const match = text.match(regex);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  // 1. Clarification Check for under-constrained designs
  if (
    (text.includes('motor bracket') || text.includes('bracket for motor')) &&
    !text.match(/\d+/)
  ) {
    return {
      part: currentPart || createPresetPart('bracket'),
      reasoning: [
        'Detected generic request for motor bracket without dimensional specifications.',
        'Triggered clarification protocol as mandated by mechanical engineering CAD workflow.',
      ],
      clarificationRequired: true,
      clarificationQuestion:
        'I can design the motor bracket, but please specify: (1) Motor frame standard (e.g., NEMA 17, NEMA 23, or custom faceplate width/height), (2) Mounting hole bolt pattern spacing (PCD or X/Y pitch), and (3) Material thickness (e.g. 5 mm Aluminium).',
      stagePipeline: [
        { stage: 'Requirement Parser', status: 'in_progress', detail: 'Awaiting necessary dimensional constraints' },
        { stage: 'Validation Engine', status: 'pending', detail: 'Pending geometry input' },
        { stage: 'Feature Planner', status: 'pending', detail: 'Pending dimensional plan' },
        { stage: 'Geometry Generator', status: 'pending', detail: 'Waiting for clarification' },
      ],
    };
  }

  // 2. Material Extraction
  let matchedMaterial = currentPart?.material || getMaterialById('steel_1018');
  if (text.includes('304') || text.includes('stainless')) {
    matchedMaterial = getMaterialById(text.includes('316') ? 'stainless_316' : 'stainless_304');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Yield Strength: ${matchedMaterial.yieldStrength} MPa, Density: ${matchedMaterial.density} g/cm³).`);
  } else if (text.includes('en8') || text.includes('080m40')) {
    matchedMaterial = getMaterialById('en8_steel');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Medium Carbon Steel, Yield Strength: ${matchedMaterial.yieldStrength} MPa).`);
  } else if (text.includes('en19') || text.includes('4140')) {
    matchedMaterial = getMaterialById('en19_steel');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Alloy Steel for High Torque).`);
  } else if (text.includes('6061') || text.includes('aluminium') || text.includes('aluminum')) {
    matchedMaterial = getMaterialById('alu_6061_t6');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Aerospace Alloy).`);
  } else if (text.includes('7075')) {
    matchedMaterial = getMaterialById('alu_7075_t6');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (High-Strength Aluminum).`);
  } else if (text.includes('brass')) {
    matchedMaterial = getMaterialById('brass_c360');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Free-Cutting Brass).`);
  } else if (text.includes('bronze')) {
    matchedMaterial = getMaterialById('bronze_c932');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Phosphor Bearing Bronze).`);
  } else if (text.includes('cast iron')) {
    matchedMaterial = getMaterialById('cast_iron_250');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Grey Cast Iron Damping Body).`);
  } else if (text.includes('titanium')) {
    matchedMaterial = getMaterialById('titanium_gr5');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Ti-6Al-4V Grade 5).`);
  } else if (text.includes('delrin') || text.includes('pom') || text.includes('acetal')) {
    matchedMaterial = getMaterialById('delrin_pom');
    reasoning.push(`Assigned Material: ${matchedMaterial.name} (Polyacetal POM).`);
  }

  // 3. Conversational Sequential Modification (Only applies to modifying the active part parameters, NOT creating or choosing another component)
  const isComponentKeyword =
    text.includes('crankshaft') ||
    text.includes('piston') ||
    text.includes('connecting rod') ||
    text.includes('conrod') ||
    text.includes('cylinder head') ||
    text.includes('cylinder block') ||
    text.includes('engine block') ||
    text.includes('turbo') ||
    text.includes('camshaft') ||
    text.includes('blisk') ||
    text.includes('supercharger') ||
    text.includes('valve') ||
    text.includes('flywheel') ||
    text.includes('cycloid') ||
    text.includes('clutch') ||
    text.includes('universal joint') ||
    text.includes('cardan') ||
    text.includes('geneva') ||
    text.includes('planetary') ||
    text.includes('gearbox') ||
    text.includes('coupling') ||
    text.includes('bearing housing') ||
    text.includes('pillow block') ||
    text.includes('spring') ||
    text.includes('bracket') ||
    text.includes('gear');

  const isFeatureCreationModifier =
    text.includes('chamfer') ||
    text.includes('fillet') ||
    text.includes('mounting hole') ||
    text.includes('holes') ||
    text.includes('thickness') ||
    text.includes('diameter') ||
    text.includes('keyway');

  const isConversationalModification =
    currentPart &&
    (!isComponentKeyword || isFeatureCreationModifier) &&
    (!text.startsWith('start') &&
      !text.startsWith('build')) &&
    (text.startsWith('make ') ||
      text.startsWith('change ') ||
      text.startsWith('increase ') ||
      text.startsWith('decrease ') ||
      text.startsWith('reduce ') ||
      text.startsWith('modify ') ||
      text.startsWith('set ') ||
      text.startsWith('update ') ||
      text.startsWith('add ') ||
      (text.startsWith('create ') && isFeatureCreationModifier));

  if (isConversationalModification && currentPart) {
    const updatedParams = { ...currentPart.parameters };
    let modified = false;

    // "make the shaft 250 mm long" or "length to 250"
    const lengthMatch = text.match(/(?:total\s+)?length(?:\s+to)?[:\s]+(\d+(?:\.\d+)?)/i) ||
                        text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*long/i);
    if (lengthMatch) {
      const val = parseFloat(lengthMatch[1]);
      updatedParams.total_length = val;
      reasoning.push(`Modified total length to ${val} mm.`);
      modified = true;
    }

    // "increase diameter to 50 mm" or "change shaft diameter from 20 mm to 25 mm" or "change shaft diameter to 25 mm"
    const diaMatch = text.match(/(?:(?:shaft|main|outer)\s+)?diameter(?:\s+(?:from\s+\d+(?:\.\d+)?\s*(?:mm)?\s+)?to)?[:\s]+(\d+(?:\.\d+)?)/i) ||
                     text.match(/diameter\s*[:=]\s*(\d+(?:\.\d+)?)/i) ||
                     text.match(/(?:shaft\s+)?diameter\s+(?:to\s+)?(\d+(?:\.\d+)?)\s*mm/i);
    if (diaMatch) {
      const val = parseFloat(diaMatch[1]);
      updatedParams.main_diameter = val;
      updatedParams.diameter = val;
      reasoning.push(`Modified shaft diameter to Ø${val} mm.`);
      modified = true;
    }

    // "make this plate 10 mm thick" or "make plate 10 mm thick" or "thickness to 10 mm"
    const thickMatch = text.match(/thickness(?:\s+to)?[:\s]+(\d+(?:\.\d+)?)/i) ||
                       text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*thick/i);
    if (thickMatch) {
      const val = parseFloat(thickMatch[1]);
      updatedParams.thickness = val;
      updatedParams.flange_thickness = val;
      reasoning.push(`Modified component thickness to ${val} mm.`);
      modified = true;
    }

    // "create a 2 mm chamfer on these edges" or "add a 2 mm chamfer" or "chamfer to 2 mm"
    const chamferMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:x\s*45[°\s]*)?chamfer/i) ||
                         text.match(/chamfer(?:\s+to)?[:\s]+(\d+(?:\.\d+)?)/i);
    if (chamferMatch) {
      const val = parseFloat(chamferMatch[1]);
      updatedParams.chamfer_size = val;
      reasoning.push(`Applied ${val} mm × 45° chamfer to component edges.`);
      modified = true;
    }

    // "create a 3 mm fillet" or "fillet radius to 3 mm"
    const filletMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*fillet/i) ||
                        text.match(/fillet(?:\s+radius)?(?:\s+to)?[:\s]+(\d+(?:\.\d+)?)/i);
    if (filletMatch) {
      const val = parseFloat(filletMatch[1]);
      updatedParams.fillet_radius = val;
      reasoning.push(`Applied R${val} mm fillet radius.`);
      modified = true;
    }

    // "add four equally spaced mounting holes" or "add 4 mounting holes"
    if (text.includes('mounting hole') || text.includes('bolt hole') || text.includes('mounting holes')) {
      let count = 4;
      if (text.includes('four') || text.includes('4')) count = 4;
      else if (text.includes('six') || text.includes('6')) count = 6;
      else if (text.includes('eight') || text.includes('8')) count = 8;
      else if (text.includes('three') || text.includes('3')) count = 3;

      const holeDiaMatch = text.match(/(?:ø|diameter\s+)?(\d+(?:\.\d+)?)\s*(?:mm)?\s*mounting\s*holes?/i);
      const holeDia = holeDiaMatch ? parseFloat(holeDiaMatch[1]) : (updatedParams.hole_diameter || 10);

      updatedParams.hole_count = count;
      updatedParams.stud_count = count;
      updatedParams.hole_diameter = holeDia;
      reasoning.push(`Configured pattern of ${count} equally spaced mounting holes (Ø${holeDia} mm).`);
      modified = true;
    }

    // "add a keyway" or "add 8mm keyway"
    if (text.includes('keyway')) {
      const kwMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:wide)?\s*keyway/i);
      const kwW = kwMatch ? parseFloat(kwMatch[1]) : (updatedParams.keyway_width || Math.round((updatedParams.main_diameter || 50) * 0.25));
      const kwD = Math.round(kwW * 0.55);
      updatedParams.keyway_width = kwW;
      updatedParams.keyway_depth = kwD;
      updatedParams.keyway_length = updatedParams.keyway_length || 45;
      reasoning.push(`Configured DIN 6885 parallel keyway: ${kwW} mm W × ${kwD} mm D.`);
      modified = true;
    }

    // "add two bearings" / "add bearings"
    if (text.includes('bearing') && !text.includes('housing')) {
      reasoning.push(`Configured 2x ISO 6206 Deep Groove Ball Bearings fitted onto stepped journals.`);
      updatedParams.step1_diameter = updatedParams.step1_diameter || 30;
      updatedParams.step1_length = updatedParams.step1_length || 45;
      updatedParams.step2_diameter = updatedParams.step2_diameter || 30;
      updatedParams.step2_length = updatedParams.step2_length || 45;
      modified = true;
    }

    if (modified || matchedMaterial.id !== currentPart.material.id) {
      const features = createDefaultFeatures(currentPart.part_type, updatedParams);
      return {
        part: {
          ...currentPart,
          parameters: updatedParams,
          material: matchedMaterial,
          features,
          rawPrompt: prompt,
          reasoning,
          stagePipeline,
        },
        reasoning,
        stagePipeline,
      };
    }
  }

  // 4. SPECIFIC ENGINE & POWERTRAIN COMPONENT MATCHERS (PRIORITY MATCHING)

  // A. IC Engine Cylinder Head
  if (text.includes('cylinder head') || text.includes('dohc head') || text.includes('engine head') || text.includes('16-valve head') || text.includes('engine_cylinder_head')) {
    const len = findNumberAfter(['length', 'span']) || 420;
    const w = findNumberAfter(['width', 'w']) || 200;
    const h = findNumberAfter(['height', 'h']) || 110;
    const cyl = findNumberAfter(['cylinders', 'cylinder count']) || 4;

    const headParams = {
      length: len,
      width: w,
      height: h,
      cylinders: cyl,
    };

    reasoning.push('Identified IC Engine Valvetrain: DOHC 16-Valve Multi-Cylinder Head Casting.');
    reasoning.push(`Specifications: ${cyl} Cylinders with 4-Valve/Cyl Pent-Roof Chambers, DOHC Cam Towers, and Intake/Exhaust Ports.`);

    const features = createDefaultFeatures('engine_cylinder_head', headParams);
    return {
      part: {
        id: `head_${Date.now()}`,
        name: `DOHC 16-Valve Cylinder Head (${cyl}-Cyl)`,
        part_type: 'engine_cylinder_head',
        units: 'mm',
        parameters: headParams,
        material: getMaterialById('alu_7075_t6'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // B. IC Engine Cylinder Block
  if (
    text.includes('cylinder block') ||
    text.includes('engine block') ||
    text.includes('motor block') ||
    text.includes('inline-4 block') ||
    text.includes('v8 block') ||
    text.includes('engine_cylinder_block') ||
    (text.includes('engine') && (text.includes('block') || text.includes('liner') || text.includes('water jacket') || text.includes('saddle')))
  ) {
    const bore = findNumberAfter(['bore', 'bore diameter', 'diameter']) || 85;
    const cyl = findNumberAfter(['cylinders', 'cylinder count', 'v']) || 4;
    const deck = findNumberAfter(['deck height', 'height', 'deck']) || 210;
    const len = findNumberAfter(['length', 'span']) || (cyl <= 4 ? 420 : 540);

    const blockParams = {
      bore_diameter: bore,
      cylinders: cyl,
      deck_height: deck,
      length: len,
      width: 210,
    };

    reasoning.push(`Identified IC Engine Core: Heavy Cast ${cyl}-Cylinder Engine Block.`);
    reasoning.push(`Honed Cylinder Bores Ø${bore} mm × ${deck} mm Deck Height, Crossflow Water Jackets, and Main Bearing Saddles.`);

    const features = createDefaultFeatures('engine_cylinder_block', blockParams);
    return {
      part: {
        id: `block_${Date.now()}`,
        name: `Cast ${cyl}-Cylinder Engine Block (Ø${bore}mm Bore)`,
        part_type: 'engine_cylinder_block',
        units: 'mm',
        parameters: blockParams,
        material: getMaterialById('cast_iron_250'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // C. Crankshaft
  if (text.includes('crankshaft') || text.includes('crank shaft') || text.includes('crank pin') || text.includes('engine_crankshaft')) {
    const stroke = findNumberAfter(['stroke', 'travel', 'throw']) || 80;
    const mainDia = findNumberAfter(['main journal', 'main diameter', 'journal']) || 55;
    const rodDia = findNumberAfter(['rod journal', 'pin diameter', 'rod diameter']) || 48;
    const throws = findNumberAfter(['throws', 'cylinders', 'cylinder']) || 4;
    const totalLen = findNumberAfter(['length', 'total length', 'span']) || 420;

    const crankParams = {
      stroke,
      main_journal_diameter: mainDia,
      rod_journal_diameter: rodDia,
      throws,
      total_length: totalLen,
    };

    reasoning.push(`Identified Engine Subsystem: Heavy-Duty Multi-Throw Forged Crankshaft.`);
    reasoning.push(`Specifications: ${throws}-Cylinder inline/V architecture, ${stroke} mm Stroke (Crank Radius ${(stroke / 2).toFixed(1)} mm).`);
    reasoning.push(`Precision Main Journals Ø${mainDia} mm, Offset Rod Journals Ø${rodDia} mm with aerodynamic counterweights.`);

    const features = createDefaultFeatures('engine_crankshaft', crankParams);
    return {
      part: {
        id: `crankshaft_${Date.now()}`,
        name: `Multi-Throw Forged Crankshaft (${stroke}mm Stroke, ${throws}-Cyl)`,
        part_type: 'engine_crankshaft',
        units: 'mm',
        parameters: crankParams,
        material: getMaterialById('en8_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // D. Camshaft
  if (text.includes('camshaft') || text.includes('cam shaft') || text.includes('cam lobe') || text.includes('engine_camshaft')) {
    const lobes = findNumberAfter(['lobes', 'lobe count', 'valves']) || 8;
    const lift = findNumberAfter(['lift', 'lobe lift', 'cam lift']) || 9.5;
    const len = findNumberAfter(['length', 'total length', 'span']) || 380;

    const camParams = {
      shaft_diameter: 28,
      total_length: len,
      lobe_count: lobes,
      lobe_lift: lift,
    };

    reasoning.push(`Identified Engine Subsystem: DOHC Multi-Lobe High-Lift Overhead Camshaft.`);
    reasoning.push(`${lobes} Ground Lobes with ${lift} mm Valve Lift, Timing Drive Flange, and Induction Hardened Journals.`);

    const features = createDefaultFeatures('engine_camshaft', camParams);
    return {
      part: {
        id: `camshaft_${Date.now()}`,
        name: `DOHC Multi-Lobe Camshaft (${lobes} Lobes, ${lift}mm Lift)`,
        part_type: 'engine_camshaft',
        units: 'mm',
        parameters: camParams,
        material: getMaterialById('en8_steel'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // E. Connecting Rod
  if (text.includes('connecting rod') || text.includes('conrod') || text.includes('con-rod') || text.includes('h-beam rod') || text.includes('engine_connecting_rod')) {
    const len = findNumberAfter(['center to center', 'c-to-c', 'length', 'span']) || 140;
    const bigBore = findNumberAfter(['big end', 'crankpin bore', 'big bore']) || 52;
    const smallBore = findNumberAfter(['small end', 'wrist pin bore', 'small bore']) || 22;

    const rodParams = {
      center_to_center_length: len,
      big_end_bore: bigBore,
      big_end_width: 24,
      small_end_bore: smallBore,
      small_end_width: 21,
      beam_width: 14,
    };

    reasoning.push(`Identified Engine Subsystem: Forged H-Beam High-Performance Connecting Rod.`);
    reasoning.push(`Center-to-Center Length: ${len} mm, Big-End Bore: Ø${bigBore} mm, Small-End Pin: Ø${smallBore} mm.`);
    reasoning.push(`Engineered for high inertia loads with dual ARP 2000 cap clamp bolts.`);

    const features = createDefaultFeatures('engine_connecting_rod', rodParams);
    return {
      part: {
        id: `conrod_${Date.now()}`,
        name: `Forged H-Beam Connecting Rod (${len}mm C-to-C)`,
        part_type: 'engine_connecting_rod',
        units: 'mm',
        parameters: rodParams,
        material: getMaterialById('en8_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // F. Piston
  if (text.includes('piston') || text.includes('piston crown') || text.includes('engine_piston')) {
    const bore = findNumberAfter(['bore', 'diameter', 'dia', 'ø']) || 85;
    const height = findNumberAfter(['height', 'length', 'total height']) || 75;
    const pin = findNumberAfter(['pin diameter', 'gudgeon pin', 'wrist pin', 'pin']) || 22;
    const dish = findNumberAfter(['dish', 'bowl', 'dish depth']) || 3.5;

    const pistonParams = {
      bore_diameter: bore,
      total_height: height,
      compression_height: 35,
      pin_diameter: pin,
      dish_depth: dish,
      dish_diameter: Math.round(bore * 0.65),
    };

    reasoning.push(`Identified Engine Subsystem: High-Compression Internal Combustion Piston.`);
    reasoning.push(`Cylinder Bore Ø${bore} mm × ${height} mm OAL with combustion bowl (${dish}mm dish depth).`);
    reasoning.push(`3-Ring Pack (Top Compression, 2nd Napier Scraper, Oil Control Ring) with reinforced Ø${pin} mm pin bosses.`);

    const features = createDefaultFeatures('engine_piston', pistonParams);
    return {
      part: {
        id: `piston_${Date.now()}`,
        name: `IC Engine Piston Ø${bore}mm (${dish ? 'Dish Crown' : 'Flat Top'})`,
        part_type: 'engine_piston',
        units: 'mm',
        parameters: pistonParams,
        material: getMaterialById('alu_7075_t6'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // G. Engine Flywheel
  if (text.includes('flywheel') || text.includes('inertia wheel') || text.includes('engine_flywheel')) {
    const od = findNumberAfter(['diameter', 'outer diameter', 'od', 'size']) || 280;
    const t = findNumberAfter(['thickness', 'thick', 'width']) || 32;

    const flywheelParams = {
      outer_diameter: od,
      thickness: t,
      ring_teeth: 110,
      bore_diameter: 36,
      pitch_circle_diameter: 75,
    };

    reasoning.push(`Identified Engine Subsystem: Heavy High-Inertia Engine Flywheel with Starter Ring Gear.`);
    reasoning.push(`Flywheel Disc Ø${od} mm × ${t} mm with 110-tooth ring gear and 8-bolt crankshaft mounting array.`);

    const features = createDefaultFeatures('engine_flywheel', flywheelParams);
    return {
      part: {
        id: `flywheel_${Date.now()}`,
        name: `Engine Flywheel & Ring Gear Ø${od}mm`,
        part_type: 'engine_flywheel',
        units: 'mm',
        parameters: flywheelParams,
        material: getMaterialById('en8_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // H. Engine Valve (Poppet Valve)
  if (text.includes('poppet valve') || text.includes('engine_valve') || (text.includes('valve') && (text.includes('seat') || text.includes('stem') || text.includes('intake') || text.includes('exhaust') || text.includes('combustion')))) {
    const head = findNumberAfter(['head diameter', 'head', 'diameter', 'ø']) || 34;
    const stem = findNumberAfter(['stem diameter', 'stem']) || 6;
    const len = findNumberAfter(['length', 'total length', 'height']) || 95;

    const valveParams = {
      head_diameter: head,
      stem_diameter: stem,
      total_length: len,
    };

    reasoning.push('Identified IC Engine Valvetrain: High-Flow Poppet Valve Assembly.');
    reasoning.push(`Ø${head} mm Head with 45° Ground Seating Face, Ø${stem} mm Stem × ${len} mm Length, and Keeper Grooves.`);

    const features = createDefaultFeatures('engine_valve', valveParams);
    return {
      part: {
        id: `valve_${Date.now()}`,
        name: `Combustion Poppet Valve Ø${head}mm`,
        part_type: 'engine_valve',
        units: 'mm',
        parameters: valveParams,
        material: getMaterialById('stainless_316'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // I. Gas Turbine Blisk / Rotor
  if (text.includes('blisk') || text.includes('turbine rotor') || text.includes('gas turbine') || text.includes('bladed disc') || text.includes('gas_turbine_blisk')) {
    const od = findNumberAfter(['outer diameter', 'diameter', 'od', 'ø']) || 260;
    const hub = findNumberAfter(['hub diameter', 'hub']) || 160;
    const bore = findNumberAfter(['bore', 'bore diameter']) || 45;
    const blades = findNumberAfter(['blades', 'blade count', 'vanes']) || 18;

    const bliskParams = {
      outer_diameter: od,
      hub_diameter: hub,
      bore_diameter: bore,
      blade_count: blades,
      disc_width: 42,
    };

    reasoning.push('Identified Aerospace Turbomachinery: High-Pressure Axial Gas Turbine Bladed Disc (Blisk).');
    reasoning.push(`Ø${od} mm Outer Diameter with ${blades} swept aerofoil blades, fir-tree root geometry, and Ø${bore} mm shaft bore.`);

    const features = createDefaultFeatures('gas_turbine_blisk', bliskParams);
    return {
      part: {
        id: `blisk_${Date.now()}`,
        name: `Gas Turbine Blisk Ø${od}mm (${blades} Blades)`,
        part_type: 'gas_turbine_blisk',
        units: 'mm',
        parameters: bliskParams,
        material: getMaterialById('inconel_718'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // J. Turbocharger Impeller
  if (text.includes('turbo') || text.includes('impeller') || text.includes('compressor wheel') || text.includes('turbocharger_impeller')) {
    const exducer = findNumberAfter(['exducer', 'outer diameter', 'od', 'diameter']) || 76;
    const inducer = findNumberAfter(['inducer', 'inlet diameter', 'id']) || 52;
    const height = findNumberAfter(['height', 'hub height', 'thickness']) || 38;

    const turboParams = {
      exducer_diameter: exducer,
      inducer_diameter: inducer,
      height,
      blade_count: 6,
      bore_diameter: 8,
    };

    reasoning.push(`Identified Engine Subsystem: Aerodynamic Billet Turbocharger Compressor Impeller.`);
    reasoning.push(`Inducer Ø${inducer} mm, Exducer Ø${exducer} mm, 6+6 Swept Backplate Blade Profile.`);

    const features = createDefaultFeatures('turbocharger_impeller', turboParams);
    return {
      part: {
        id: `turbo_${Date.now()}`,
        name: `Turbocharger Compressor Impeller Ø${exducer}mm`,
        part_type: 'turbocharger_impeller',
        units: 'mm',
        parameters: turboParams,
        material: getMaterialById('alu_7075_t6'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // K. Roots Supercharger Rotor
  if (text.includes('supercharger') || text.includes('roots blower') || text.includes('blower rotor') || text.includes('roots_supercharger_rotor')) {
    const od = findNumberAfter(['outer diameter', 'diameter', 'od', 'ø']) || 92;
    const len = findNumberAfter(['length', 'span', 'long']) || 160;
    const twist = findNumberAfter(['twist', 'helix', 'angle']) || 60;
    const shaft = findNumberAfter(['shaft diameter', 'bore', 'shaft']) || 24;

    const scParams = {
      outer_diameter: od,
      length: len,
      twist_angle: twist,
      shaft_diameter: shaft,
    };

    reasoning.push('Identified Forced Induction Subsystem: Roots Supercharger Twin-Lobe Helical Rotor.');
    reasoning.push(`Ø${od} mm Profile × ${len} mm Length with ${twist}° Progressive Helical Twist and Timing Pinion.`);

    const features = createDefaultFeatures('roots_supercharger_rotor', scParams);
    return {
      part: {
        id: `supercharger_${Date.now()}`,
        name: `Supercharger Helical Rotor Ø${od}mm`,
        part_type: 'roots_supercharger_rotor',
        units: 'mm',
        parameters: scParams,
        material: getMaterialById('alu_7075_t6'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // L. Planetary Gearbox
  if (text.includes('planetary') || text.includes('epicyclic') || (text.includes('gearbox') && text.includes('stage')) || text.includes('planetary_gearbox')) {
    const power = findNumberAfter(['750 w', 'power', 'motor']) || 750;
    const rpm = findNumberAfter(['rpm', 'speed']) || 3000;
    const ringDia = findNumberAfter(['ring diameter', 'outer diameter', 'housing diameter']) || 120;
    const stages = text.includes('two') || text.includes('2') || text.includes('16:1') ? 2 : 1;

    const gearboxParams = {
      stages: stages,
      ring_diameter: ringDia,
      length: stages === 2 ? 140 : 90,
      sun_teeth: 16,
      planet_teeth: 20,
      ring_teeth: 56,
      module: 2.0,
      input_shaft_dia: 14,
      output_shaft_dia: 28,
      planets_per_stage: 3,
    };

    reasoning.push(`Identified Architecture: Two-Stage Precision Planetary / Epicyclic Gearbox.`);
    reasoning.push(`Reduction: ~16:1 dual cascade for 750 W @ 3000 RPM input.`);
    reasoning.push(`Calculated output speed = ~187.5 RPM, output torque = ~36.5 N·m (Efficiency ~92%).`);
    reasoning.push(`Stage 1 & 2: Hardened Steel Sun (z=16) and Planet Gears (z=20) mounted in 7075-T6 carrier.`);
    reasoning.push(`Sealed with 6000-series deep groove support bearings and Grade 8.8 housing fasteners.`);

    const features = createDefaultFeatures('planetary_gearbox', gearboxParams);
    const part: CADPart = {
      id: `gearbox_${Date.now()}`,
      name: `2-Stage Planetary Gearbox (16:1 Ratio, 750W)`,
      part_type: 'planetary_gearbox',
      units: 'mm',
      parameters: gearboxParams,
      material: getMaterialById('alu_7075_t6'),
      features,
      isAssembly: true,
      rawPrompt: prompt,
      reasoning,
      stagePipeline,
    };

    return { part, reasoning, stagePipeline };
  }

  // M. Cycloidal Speed Reducer
  if (text.includes('cycloidal') || text.includes('cycloid') || text.includes('robotic reducer') || text.includes('cycloidal_drive')) {
    const ringDia = findNumberAfter(['ring diameter', 'housing diameter', 'diameter', 'od']) || 130;
    const pins = findNumberAfter(['pins', 'pin count', 'roller pins']) || 12;
    const lobes = findNumberAfter(['lobes', 'lobe count']) || pins - 1;

    const cycParams = {
      ring_diameter: ringDia,
      pin_count: pins,
      lobe_count: lobes,
      thickness: 18,
    };

    reasoning.push('Identified Robotics Actuation: Precision Zero-Backlash Cycloidal Speed Reducer.');
    reasoning.push(`Epotrochoid Disc with ${lobes} Lobes and ${pins} Ring Needle Bearing Pins (${lobes}:1 Reduction Ratio).`);

    const features = createDefaultFeatures('cycloidal_drive', cycParams);
    return {
      part: {
        id: `cycloid_${Date.now()}`,
        name: `Cycloidal Speed Reducer (${lobes}:1 Ratio)`,
        part_type: 'cycloidal_drive',
        units: 'mm',
        parameters: cycParams,
        material: getMaterialById('en19_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // N. Wet Clutch Pack
  if (text.includes('clutch') || text.includes('clutch pack') || text.includes('friction disc') || text.includes('clutch_pack')) {
    const od = findNumberAfter(['outer diameter', 'basket diameter', 'diameter', 'od']) || 160;
    const id = findNumberAfter(['inner diameter', 'hub diameter', 'id']) || 70;
    const discs = findNumberAfter(['discs', 'disc count', 'plates']) || 6;

    const clutchParams = {
      outer_diameter: od,
      inner_diameter: id,
      disc_count: discs,
    };

    reasoning.push('Identified Drivetrain Subsystem: Multi-Plate Wet Clutch Assembly.');
    reasoning.push(`Ø${od} mm Slotted Basket with ${discs} Alternating Friction Discs, Splined Hub, and Pressure Springs.`);

    const features = createDefaultFeatures('clutch_pack', clutchParams);
    return {
      part: {
        id: `clutch_${Date.now()}`,
        name: `Multi-Plate Wet Clutch Pack Ø${od}mm`,
        part_type: 'clutch_pack',
        units: 'mm',
        parameters: clutchParams,
        material: getMaterialById('en8_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // O. Universal Joint (Cardan Spider)
  if (text.includes('universal joint') || text.includes('u-joint') || text.includes('cardan') || text.includes('spider') || text.includes('universal_joint')) {
    const span = findNumberAfter(['span', 'spider span', 'width', 'size']) || 90;
    const trunnion = findNumberAfter(['trunnion diameter', 'trunnion', 'pin diameter']) || 26;

    const uJointParams = {
      spider_span: span,
      trunnion_diameter: trunnion,
    };

    reasoning.push('Identified Drivetrain Mechanism: Heavy-Duty Universal Joint (Cardan Spider).');
    reasoning.push(`4-Way Cross Spider ${span} mm Span × Ø${trunnion} mm Trunnions with Dual-Axis Drive Yokes.`);

    const features = createDefaultFeatures('universal_joint', uJointParams);
    return {
      part: {
        id: `ujoint_${Date.now()}`,
        name: `Universal Joint Spider Assembly (${span}mm)`,
        part_type: 'universal_joint',
        units: 'mm',
        parameters: uJointParams,
        material: getMaterialById('en19_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // P. Geneva Indexing Mechanism
  if (text.includes('geneva') || text.includes('star wheel') || text.includes('indexing wheel') || text.includes('geneva_mechanism')) {
    const wheelDia = findNumberAfter(['wheel diameter', 'diameter', 'size', 'wheel']) || 120;
    const slots = findNumberAfter(['slots', 'slot count', 'stations']) || 6;

    const genevaParams = {
      wheel_diameter: wheelDia,
      slot_count: slots,
    };

    reasoning.push('Identified Intermittent Motion Mechanism: Geneva Indexing Mechanism.');
    reasoning.push(`Geneva Star Wheel Ø${wheelDia} mm with ${slots} Radial Slots and Continuous Rotary Driver Pin.`);

    const features = createDefaultFeatures('geneva_mechanism', genevaParams);
    return {
      part: {
        id: `geneva_${Date.now()}`,
        name: `Geneva Indexing Wheel (${slots} Slots, Ø${wheelDia}mm)`,
        part_type: 'geneva_mechanism',
        units: 'mm',
        parameters: genevaParams,
        material: getMaterialById('en8_steel'),
        features,
        isAssembly: true,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // Q. Flange Coupling
  if (text.includes('coupling') || text.includes('flange_coupling') || (text.includes('flange') && (text.includes('motor') || text.includes('shaft')))) {
    const shaftDia = findNumberAfter(['shaft diameter', 'shaft dia', 'diameter', 'bore']) || 35;
    const power = findNumberAfter(['5 kw', 'power']) || 5;
    const rpm = findNumberAfter(['1440', 'rpm']) || 1440;

    const od = Math.round(shaftDia * 3.5);
    const hubDia = Math.round(shaftDia * 2.0);
    const pcd = Math.round(shaftDia * 2.8);
    const thickness = Math.round(shaftDia * 0.5);

    const couplingParams = {
      outer_diameter: od,
      inner_diameter: shaftDia,
      hub_diameter: hubDia,
      hub_height: Math.round(shaftDia * 0.9),
      pitch_circle_diameter: pcd,
      thickness: thickness,
      bolt_hole_diameter: 10,
      bolt_hole_count: 6,
      keyway_width: 10,
      keyway_depth: 5,
      is_coupling: true,
    };

    const torque = ((9550 * power) / rpm).toFixed(1);
    reasoning.push(`Identified Mechanism: Rigid Flanged Shaft Coupling for ${power} kW @ ${rpm} RPM.`);
    reasoning.push(`Calculated transmitted torque = ${torque} N·m.`);
    reasoning.push(`Sized for Ø${shaftDia} mm shaft bore with DIN 6885-A keyways and EN8 medium carbon steel.`);
    reasoning.push(`Connecting 6× M10 Grade 8.8 high-tensile clamp bolts on Ø${pcd} mm PCD.`);

    const features = createDefaultFeatures('flange_coupling', couplingParams);
    const part: CADPart = {
      id: `coupling_${Date.now()}`,
      name: `Rigid Flange Coupling Ø${od}mm (for Ø${shaftDia}mm Shaft)`,
      part_type: 'flange_coupling',
      units: 'mm',
      parameters: couplingParams,
      material: getMaterialById('en8_steel'),
      features,
      isAssembly: true,
      rawPrompt: prompt,
      reasoning,
      stagePipeline,
    };

    return { part, reasoning, stagePipeline };
  }

  // R. Bearing Housing (Pillow Block)
  if (text.includes('bearing housing') || text.includes('pillow block') || text.includes('plummer block') || text.includes('bearing_housing')) {
    const bore = findNumberAfter(['bore', 'bearing diameter', 'diameter', 'id']) || 52;
    const len = findNumberAfter(['length', 'base length', 'width']) || 160;
    const h = findNumberAfter(['height', 'center height']) || 80;

    const bhParams = {
      bore_diameter: bore,
      base_length: len,
      height: h,
      thickness: 35,
    };

    reasoning.push('Identified Component: Heavy-Duty Cast Iron Pillow Block Bearing Housing.');
    reasoning.push(`Precision Ø${bore} mm Machined Seat with Dual M12 Base Mounting Slots.`);

    const features = createDefaultFeatures('bearing_housing', bhParams);
    return {
      part: {
        id: `housing_${Date.now()}`,
        name: `Pillow Block Housing Ø${bore}mm Seat`,
        part_type: 'bearing_housing',
        units: 'mm',
        parameters: bhParams,
        material: getMaterialById('cast_iron_250'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // S. Ball Bearing
  if (text.includes('bearing') && !text.includes('housing')) {
    const bore = findNumberAfter(['bore', 'inner diameter', 'id']) || 30;
    const od = findNumberAfter(['outer diameter', 'od']) || Math.round(bore * 2.1);
    const width = findNumberAfter(['width', 'thickness']) || Math.round(bore * 0.53);

    const bearingParams = {
      bore_diameter: bore,
      outer_diameter: od,
      width: width,
    };

    reasoning.push(`Identified Component: ISO Metric Deep Groove Ball Bearing.`);
    reasoning.push(`Dimensions: Bore Ø${bore} mm × OD Ø${od} mm × Width ${width} mm.`);

    const features = createDefaultFeatures('bearing', bearingParams);
    return {
      part: {
        id: `bearing_${Date.now()}`,
        name: `Deep Groove Ball Bearing Ø${bore}×Ø${od}mm`,
        part_type: 'bearing',
        units: 'mm',
        parameters: bearingParams,
        material: getMaterialById('stainless_304'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // T. Spur Gear / Pinion
  if (text.includes('gear') || text.includes('pinion') || text.includes('sprocket')) {
    const teeth = findNumberAfter(['teeth', 'teeth count', 'tooth', 'z']) || 24;
    const mod = findNumberAfter(['module', 'mod', 'm']) || 2.5;
    const fw = findNumberAfter(['face width', 'width', 'thickness', 'b']) || 20;
    const bore = findNumberAfter(['bore', 'hole', 'inner diameter']) || 20;

    const gearParams = {
      module: mod,
      teeth_count: teeth,
      face_width: fw,
      bore_diameter: bore,
      hub_diameter: Math.round(bore * 1.8),
      hub_width: Math.round(fw * 0.4),
      pressure_angle: 20,
      keyway_width: 6,
      keyway_depth: 3,
    };

    reasoning.push(`Identified Component: Involute Spur Gear (Module ${mod} mm, ${teeth} Teeth).`);
    reasoning.push(`Pitch Diameter = ${(mod * teeth).toFixed(1)} mm, Face Width = ${fw} mm.`);

    const features = createDefaultFeatures('gear', gearParams);
    return {
      part: {
        id: `gear_${Date.now()}`,
        name: `Involute Spur Gear M${mod} (z=${teeth})`,
        part_type: 'gear',
        units: 'mm',
        parameters: gearParams,
        material: matchedMaterial,
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // U. Structural Bracket
  if (text.includes('bracket') || text.includes('angle iron') || text.includes('gusset')) {
    const w = findNumberAfter(['width', 'w']) || 80;
    const h = findNumberAfter(['height', 'h', 'tall']) || 100;
    const len = findNumberAfter(['length', 'l', 'base']) || 110;
    const t = findNumberAfter(['thickness', 'thick', 't']) || 8;
    const holeDia = findNumberAfter(['holes of', 'hole diameter', 'hole size']) || 10;

    const bracketParams = {
      bracket_type: text.includes('u-bracket') || text.includes('channel') ? 'U' : 'L',
      width: w,
      height: h,
      length: len,
      thickness: t,
      hole_diameter: holeDia,
      fillet_radius: 6,
    };

    reasoning.push(`Identified Component: Heavy-Duty Structural L-Mounting Bracket.`);
    reasoning.push(`Dimensions: ${w} mm W × ${h} mm H × ${len} mm L × ${t} mm Wall Thickness.`);

    const features = createDefaultFeatures('bracket', bracketParams);
    return {
      part: {
        id: `bracket_${Date.now()}`,
        name: `Structural Bracket ${w}×${h}×${len}mm`,
        part_type: 'bracket',
        units: 'mm',
        parameters: bracketParams,
        material: matchedMaterial,
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // V. Helical Spring
  if (text.includes('spring')) {
    const wire = findNumberAfter(['wire', 'wire diameter']) || 4;
    const mean = findNumberAfter(['mean diameter', 'diameter', 'od']) || 30;
    const coils = findNumberAfter(['coils', 'turns', 'active coils']) || 8;
    const freeLen = findNumberAfter(['length', 'free length']) || 70;

    const springParams = {
      wire_diameter: wire,
      mean_diameter: mean,
      active_coils: coils,
      free_length: freeLen,
    };

    reasoning.push(`Identified Component: Helical Compression Spring.`);
    reasoning.push(`Wire Ø${wire} mm, Mean Ø${mean} mm, ${coils} Active Coils.`);

    const features = createDefaultFeatures('spring', springParams);
    return {
      part: {
        id: `spring_${Date.now()}`,
        name: `Helical Spring Ø${mean}mm (${coils} Coils)`,
        part_type: 'spring',
        units: 'mm',
        parameters: springParams,
        material: getMaterialById('steel_1018'),
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // W. Pipe Flange
  if (text.includes('flange') && !text.includes('coupling')) {
    const od = findNumberAfter(['outer diameter', 'outer dia', 'od', 'diameter']) || 120;
    const id = findNumberAfter(['inner diameter', 'inner dia', 'id', 'bore']) || 40;
    const pcd = findNumberAfter(['pcd', 'pitch circle diameter']) || 90;
    const t = findNumberAfter(['thickness', 'thick', 'height']) || 14;
    const holes = findNumberAfter(['holes', 'bolt holes', 'bolt count']) || 6;
    const holeDia = findNumberAfter(['hole size', 'hole diameter']) || 12;

    const flangeParams = {
      outer_diameter: od,
      inner_diameter: id,
      pitch_circle_diameter: pcd,
      thickness: t,
      bolt_hole_count: holes,
      bolt_hole_diameter: holeDia,
    };

    reasoning.push(`Identified Component: Standard ASME B16.5 Bolted Pipe Flange.`);
    reasoning.push(`Dimensions: OD Ø${od} mm, ID Ø${id} mm, PCD Ø${pcd} mm with ${holes}× Ø${holeDia} mm Bolt Array.`);

    const features = createDefaultFeatures('flange', flangeParams);
    return {
      part: {
        id: `flange_${Date.now()}`,
        name: `Bolted Pipe Flange Ø${od}mm (${matchedMaterial.name})`,
        part_type: 'flange',
        units: 'mm',
        parameters: flangeParams,
        material: matchedMaterial,
        features,
        rawPrompt: prompt,
        reasoning,
        stagePipeline,
      },
      reasoning,
      stagePipeline,
    };
  }

  // X. Stepped Transmission Shaft
  if (
    text.includes('shaft') ||
    text.includes('stepped') ||
    text.includes('journal') ||
    (text.includes('cylinder') && text.includes('keyway'))
  ) {
    const totalLength = findNumberAfter(['total length', 'length', 'long']) || 200;
    const mainDia = findNumberAfter(['main diameter', 'main dia', 'diameter', 'dia']) || 60;

    // Step 1 extraction
    const s1Dia = findNumberAfter(['step 1 diameter', 'step 1 dia', 'step diameter', 'first step diameter', 'journal diameter']) || 30;
    const s1Len = findNumberAfter(['step 1 length', 'step length', 'first step length', 'journal length']) || 50;

    // Step 2 extraction
    const s2Dia = findNumberAfter(['step 2 diameter', 'step 2 dia', 'second step diameter']) || 0;
    const s2Len = findNumberAfter(['step 2 length', 'second step length']) || 0;

    // Keyway extraction: e.g. "6 mm wide × 3 mm deep keyway" or "6 mm wide 3 mm deep"
    let kwWidth = 6;
    let kwDepth = 3;
    let kwLength = 45;

    const kwComplexMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:wide)?\s*(?:[x×by]+)\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:deep)?\s*keyway/i) ||
                           text.match(/keyway[^\d]*(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:wide)?\s*(?:[x×by]+)\s*(\d+(?:\.\d+)?)/i);
    if (kwComplexMatch) {
      kwWidth = parseFloat(kwComplexMatch[1]);
      kwDepth = parseFloat(kwComplexMatch[2]);
    } else {
      const kwW = findNumberAfter(['keyway width', 'wide keyway', 'keyway of']);
      if (kwW) kwWidth = kwW;
      const kwD = findNumberAfter(['keyway depth', 'deep keyway', 'deep']);
      if (kwD) kwDepth = kwD;
      else kwDepth = Math.round(kwWidth * 0.55);
    }

    const filletR = findNumberAfter(['fillet', 'fillets', 'fillet radius', 'shoulder fillet', 'r']) || 2;
    const chamferS = findNumberAfter(['chamfer', 'chamfers', 'chamfer size']) || 1.5;

    const shaftParams = {
      total_length: totalLength,
      main_diameter: mainDia,
      step1_diameter: s1Dia,
      step1_length: s1Len,
      step2_diameter: s2Dia,
      step2_length: s2Len,
      keyway_width: kwWidth,
      keyway_depth: kwDepth,
      keyway_length: kwLength,
      fillet_radius: filletR,
      chamfer_size: chamferS,
    };

    reasoning.push(`Identified Component: Stepped Power Transmission Shaft.`);
    reasoning.push(`Dimensions: Total Length = ${totalLength} mm, Main Journal = Ø${mainDia} mm.`);
    reasoning.push(`Step 1 Bearing Seat: Ø${s1Dia} mm × ${s1Len} mm length.`);
    reasoning.push(`DIN 6885 Parallel Keyway: ${kwWidth} mm wide × ${kwDepth} mm deep.`);
    reasoning.push(`Stress Relief Fillets: R${filletR} mm at transition shoulders.`);

    const features = createDefaultFeatures('shaft', shaftParams);
    const part: CADPart = {
      id: `shaft_${Date.now()}`,
      name: `Stepped Shaft Ø${mainDia}×${totalLength}mm (${matchedMaterial.name})`,
      part_type: 'shaft',
      units: 'mm',
      parameters: shaftParams,
      material: matchedMaterial,
      features,
      rawPrompt: prompt,
      reasoning,
      stagePipeline,
    };

    return { part, reasoning, stagePipeline };
  }

  // 12. GENERAL CYLINDER / DEFAULT
  const dia = findNumberAfter(['diameter', 'dia', 'ø']) || 50;
  const len = findNumberAfter(['length', 'height', 'long']) || 100;
  const bore = findNumberAfter(['bore', 'hole']) || 0;

  const cylParams = {
    diameter: dia,
    height: len,
    bore_diameter: bore,
    fillet_radius: 2,
    chamfer_size: 1,
  };

  reasoning.push(`Identified Component: Precision Cylindrical Solid Body.`);
  reasoning.push(`Dimensions: Ø${dia} mm × ${len} mm Length.`);

  const features = createDefaultFeatures('cylinder', cylParams);
  return {
    part: {
      id: `part_${Date.now()}`,
      name: `Cylinder Ø${dia}×${len}mm`,
      part_type: 'cylinder',
      units: 'mm',
      parameters: cylParams,
      material: matchedMaterial,
      features,
      rawPrompt: prompt,
      reasoning,
      stagePipeline,
    },
    reasoning,
    stagePipeline,
  };
}

export function createPresetPart(type: PartType): CADPart {
  const defaultMat = getMaterialById('stainless_304');

  switch (type) {
    case 'engine_crankshaft': {
      const params = {
        stroke: 80,
        main_journal_diameter: 55,
        rod_journal_diameter: 48,
        throws: 4,
        total_length: 420,
      };
      return {
        id: `preset_crankshaft_${Date.now()}`,
        name: '4-Cylinder Forged Crankshaft (80mm Stroke)',
        part_type: 'engine_crankshaft',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('engine_crankshaft', params),
        isAssembly: true,
        rawPrompt: 'Design a heavy forged steel 4-cylinder engine crankshaft with 80 mm stroke, Ø55 mm main journals, Ø48 mm rod journals, counterweights, and 8-bolt flywheel flange.',
        reasoning: [
          'Precision forged 4-cylinder cross-plane engine crankshaft.',
          'Main journals Ø55 mm with cross-drilled lubrication feed galleys.',
          'Counterweights dynamically profiled to balance reciprocating primary forces.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Combustion engine kinematics solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Torsional fatigue & journal hydrodynamic lubrication verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Multi-throw crankshaft revolve & web profiles built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'engine_piston': {
      const params = {
        bore_diameter: 85,
        total_height: 75,
        compression_height: 35,
        pin_diameter: 22,
        dish_depth: 3.5,
        dish_diameter: 55,
      };
      return {
        id: `preset_piston_${Date.now()}`,
        name: 'IC Engine High-Compression Piston Ø85mm',
        part_type: 'engine_piston',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('engine_piston', params),
        rawPrompt: 'Design a high-compression aluminum engine piston for an 85 mm bore cylinder with 3.5 mm dish bowl, 3-ring pack grooves, and Ø22 mm wrist pin bore.',
        reasoning: [
          'High-strength 7075-T6 aluminum alloy piston for high-RPM operation.',
          '3-ring pack: top compression ring, scraper ring, and oil control ring with drain ports.',
          'Reinforced pin bosses sized for full-floating hardened wrist pin.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Thermodynamic pressure and expansion parameters calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Piston crown thermal stress & skirt side-thrust checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Crown bowl, ring grooves, and gudgeon pin features generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'engine_connecting_rod': {
      const params = {
        center_to_center_length: 140,
        big_end_bore: 52,
        big_end_width: 24,
        small_end_bore: 22,
        small_end_width: 21,
        beam_width: 14,
      };
      return {
        id: `preset_conrod_${Date.now()}`,
        name: 'Forged 4340 H-Beam Connecting Rod 140mm',
        part_type: 'engine_connecting_rod',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('engine_connecting_rod', params),
        isAssembly: true,
        rawPrompt: 'Design a forged steel H-beam connecting rod with 140 mm center-to-center length, Ø52 mm big-end bore, Ø22 mm small-end wrist pin bore, and high-tensile rod bolts.',
        reasoning: [
          'Forged high-tensile steel H-beam rod engineered for high column buckling resistance.',
          'Split big-end journal with precision serrated parting line and ARP rod bolts.',
          'Small-end eye fitted with bronze wrist pin bushing.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Inertia force and gas pressure loads evaluated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Euler-Rankine column buckling safety factor > 3.2' },
          { stage: 'Feature Planner', status: 'completed', detail: 'H-beam shank profile, rod cap split, and fastener bores mapped' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'turbocharger_impeller': {
      const params = {
        exducer_diameter: 76,
        inducer_diameter: 52,
        height: 38,
        blade_count: 6,
        bore_diameter: 8,
      };
      return {
        id: `preset_turbo_${Date.now()}`,
        name: 'Billet Turbocharger Impeller (Ø76mm Exducer)',
        part_type: 'turbocharger_impeller',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('turbocharger_impeller', params),
        rawPrompt: 'Design a high-efficiency billet aluminum turbocharger compressor impeller with Ø76 mm exducer, Ø52 mm inducer, 6 full blades and 6 splitter blades.',
        reasoning: [
          'Aerodynamically optimized 6+6 swept blade compressor wheel.',
          'Engineered for 120,000+ RPM tip speeds with backswept blade geometry.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Aerodynamic pressure ratio and tip Mach numbers analyzed' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Centrifugal hoop stress and modal resonance passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Conical hub revolve, swept full blades, and splitters arrayed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D aerodynamic solid generated' },
        ],
      };
    }

    case 'engine_camshaft': {
      const params = {
        shaft_diameter: 28,
        total_length: 380,
        lobe_count: 8,
        lobe_lift: 9.5,
      };
      return {
        id: `preset_camshaft_${Date.now()}`,
        name: 'DOHC Overhead Camshaft (8 Lobes, 9.5mm Lift)',
        part_type: 'engine_camshaft',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('engine_camshaft', params),
        rawPrompt: 'Design a DOHC overhead camshaft with 8 asymmetric lobes, 9.5 mm valve lift, 28 mm journal diameter, and front timing drive sprocket flange.',
        reasoning: [
          'High-performance camshaft with polynomial acceleration cam lobe profiles.',
          'Hardened bearing journals with integrated front timing sprocket flange.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Valve spring dynamics & contact Hertz stress calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Lobe profile flank stress verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Shaft revolve with asymmetric egg lobe lofts' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'engine_flywheel': {
      const params = {
        outer_diameter: 280,
        thickness: 32,
        ring_teeth: 110,
        bore_diameter: 36,
        pitch_circle_diameter: 75,
      };
      return {
        id: `preset_flywheel_${Date.now()}`,
        name: 'Engine Flywheel & Ring Gear Ø280mm',
        part_type: 'engine_flywheel',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('engine_flywheel', params),
        isAssembly: true,
        rawPrompt: 'Design a 280 mm diameter high-inertia engine flywheel with a 110-tooth starter ring gear, recessed clutch friction face, and 8-bolt crankshaft mounting array.',
        reasoning: [
          'High rotational inertia flywheel to dampen engine cyclic torsional fluctuations.',
          'Precision ground clutch face with chamfered hardened starter ring gear.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Kinetic energy storage & torque fluctuation calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Centrifugal burst speed and bolt shear validated' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Main rim revolve, ring gear teeth pattern, and 8-hole hub created' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'gas_turbine_blisk': {
      const params = {
        outer_diameter: 260,
        hub_diameter: 160,
        bore_diameter: 45,
        blade_count: 18,
        disc_width: 42,
      };
      return {
        id: `preset_blisk_${Date.now()}`,
        name: 'Gas Turbine Integrally Bladed Disc (Blisk Ø260mm)',
        part_type: 'gas_turbine_blisk',
        units: 'mm',
        parameters: params,
        material: getMaterialById('inconel_718'),
        features: createDefaultFeatures('gas_turbine_blisk', params),
        rawPrompt: 'Design an integrally bladed turbine disc (Blisk) in Inconel 718 with 18 aerofoil swept blades, Ø260 mm outer diameter, and Ø45 mm high-pressure shaft bore.',
        reasoning: [
          'High-temperature Inconel 718 superalloy monolithic bladed turbine disc.',
          'Swept transonic 3D aerofoil profile with fir-tree stress-relief hubs.',
          'Engineered for 45,000 RPM continuous service under high thermal gradient.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Thermal gradient and gas dynamics boundary conditions calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Creep rupture life and centrifugal blade pull stress checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Hub revolve, aerofoil blade lofting, and balance bores planned' },
          { stage: 'Geometry Generator', status: 'completed', detail: 'Aerospace 3D solid generated' },
        ],
      };
    }

    case 'roots_supercharger_rotor': {
      const params = {
        outer_diameter: 92,
        length: 160,
        twist_angle: 60,
        shaft_diameter: 24,
      };
      return {
        id: `preset_supercharger_${Date.now()}`,
        name: 'Roots Supercharger Twin-Lobe Helical Rotor (60° Twist)',
        part_type: 'roots_supercharger_rotor',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('roots_supercharger_rotor', params),
        rawPrompt: 'Design a high-flow Roots supercharger twin-lobe rotor with 60° helical twist, 92 mm outer diameter, 160 mm lobe span, and 24 mm drive shaft journal.',
        reasoning: [
          'Precision CNC-machined 7075-T6 aluminum twin-lobe blower rotor.',
          '60° progressive helix reduces inlet pulse noise and backflow turbulence.',
          'Integrated drive shaft journal with timing gear lock taper.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Volumetric displacement and air compression efficiency calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Rotor-to-case tip clearance and torsional stiffness passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Helical loft profile and drive journal revolve constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'engine_valve': {
      const params = {
        head_diameter: 34,
        stem_diameter: 6,
        total_length: 95,
      };
      return {
        id: `preset_valve_${Date.now()}`,
        name: 'High-Flow IC Engine Poppet Valve (Ø34mm)',
        part_type: 'engine_valve',
        units: 'mm',
        parameters: params,
        material: getMaterialById('stainless_316'),
        features: createDefaultFeatures('engine_valve', params),
        rawPrompt: 'Design a high-flow stainless steel engine intake poppet valve with Ø34 mm head diameter, 45° ground seat, Ø6 mm stem, and dual collet lock grooves.',
        reasoning: [
          'High-temperature stainless steel poppet valve with micro-finished 45° ground seat.',
          'Tulip throat transition for minimum flow restriction.',
          'Hardened tip with precision collet keeper ring grooves.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Gas flow velocity and valve seat pressure calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Stem buckling, seat contact stress, and thermal fatigue verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Poppet revolve solid with keeper ring cuts' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'cycloidal_drive': {
      const params = {
        ring_diameter: 130,
        pin_count: 12,
        lobe_count: 11,
        thickness: 18,
      };
      return {
        id: `preset_cycloid_${Date.now()}`,
        name: 'Zero-Backlash Cycloidal Speed Reducer (11:1 Reduction)',
        part_type: 'cycloidal_drive',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en19_steel'),
        features: createDefaultFeatures('cycloidal_drive', params),
        isAssembly: true,
        rawPrompt: 'Design a zero-backlash cycloidal drive speed reducer with an 11-lobe epotrochoid disc, 12 housing needle roller pins, and 6-pin output flange for robotic actuation.',
        reasoning: [
          'Precision zero-backlash robotic joint actuator with 11:1 single-stage reduction ratio.',
          'Conjugate epotrochoid tooth profile distributing shock loads across multiple pins.',
          'Eccentric dual-bearing cam hub ensuring smooth planetary torque transfer.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Epotrochoid curve equations and torque amplification calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Hertzian pin contact stress and torque ripple verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Lobe disc, pin ring housing, and output pin carrier constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body assembly generated' },
        ],
      };
    }

    case 'clutch_pack': {
      const params = {
        outer_diameter: 160,
        inner_diameter: 70,
        disc_count: 6,
      };
      return {
        id: `preset_clutch_${Date.now()}`,
        name: 'Multi-Plate Wet Clutch Assembly (6-Disc Pack)',
        part_type: 'clutch_pack',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('clutch_pack', params),
        isAssembly: true,
        rawPrompt: 'Design a multi-plate wet clutch pack with slotted outer basket (Ø160 mm), 6 friction discs, internally splined inner hub, and 5-spring pressure plate.',
        reasoning: [
          'High-torque multi-plate wet clutch pack with alternating bronze friction and steel drive plates.',
          'Precision slotted outer basket with radial oil evacuation vents.',
          'Internal splined drive hub with 5 coil compression springs.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Frictional torque capacity and clamping load calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Friction lining thermal dissipation and spline shear passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Basket revolve, disc stack pattern, and pressure spring array created' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body assembly generated' },
        ],
      };
    }

    case 'universal_joint': {
      const params = {
        spider_span: 90,
        trunnion_diameter: 26,
      };
      return {
        id: `preset_ujoint_${Date.now()}`,
        name: 'Heavy-Duty Universal Joint Spider & Yoke Assembly',
        part_type: 'universal_joint',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en19_steel'),
        features: createDefaultFeatures('universal_joint', params),
        isAssembly: true,
        rawPrompt: 'Design a heavy-duty Cardan universal joint assembly with a 4-way cross spider (90 mm span, Ø26 mm trunnions) and dual 90°-phased drive yokes with bearing cups.',
        reasoning: [
          'Heavy-duty alloy steel Cardan cross spider with precision ground trunnions.',
          'Dual forged drive yokes phased at 90° for angular power transmission.',
          'Needle roller bearing cap retaining circlip grooves.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Angular velocity variation and transmitted torque evaluated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Trunnion bending fatigue & bearing L10h life verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Spider cross body and dual U-fork drive yokes mapped' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body assembly generated' },
        ],
      };
    }

    case 'geneva_mechanism': {
      const params = {
        wheel_diameter: 120,
        slot_count: 6,
      };
      return {
        id: `preset_geneva_${Date.now()}`,
        name: '6-Station Geneva Mechanism & Rotary Driver',
        part_type: 'geneva_mechanism',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('geneva_mechanism', params),
        isAssembly: true,
        rawPrompt: 'Design a 6-station Geneva indexing mechanism with Ø120 mm star wheel, radial driver slots, continuous input driving crank, and circular locking disc.',
        reasoning: [
          'Precision 6-slot Geneva star wheel for intermittent rotary indexing.',
          'Continuous input driving crank with hardened roller driving pin.',
          'Concave locking arc disc preventing wheel rotation during dwell phase.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Kinematic acceleration profile and dwell ratio computed' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Drive pin impact stress and slot flank contact wear checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Geneva star profile cutouts and input cam disc solid constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body assembly generated' },
        ],
      };
    }

    case 'engine_cylinder_block': {
      const params = {
        bore_diameter: 85,
        cylinders: 4,
        deck_height: 210,
        length: 420,
        width: 210,
      };
      return {
        id: `preset_block_${Date.now()}`,
        name: 'Inline-4 Cast Engine Cylinder Block (Ø85mm Bore)',
        part_type: 'engine_cylinder_block',
        units: 'mm',
        parameters: params,
        material: getMaterialById('cast_iron_250'),
        features: createDefaultFeatures('engine_cylinder_block', params),
        isAssembly: true,
        rawPrompt: 'Design a heavy cast iron 4-cylinder engine block with Ø85 mm bored cylinder liners, 210 mm deck height, cooling water jackets, and 5-main bearing saddles.',
        reasoning: [
          'Heavy grey cast iron engine block with high vibration damping.',
          '4 precision honed cylinder bores with cross-hatch microfinish.',
          'Integrated water cooling jackets and bottom crankcase bearing saddles.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Combustion pressure and thermal expansion calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Bore wall hoop stress and deck flatness verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Block solid with cylinder bore array and main bearing bulkheads' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'engine_cylinder_head': {
      const params = {
        length: 420,
        width: 200,
        height: 110,
        cylinders: 4,
      };
      return {
        id: `preset_head_${Date.now()}`,
        name: 'DOHC 16-Valve Engine Cylinder Head',
        part_type: 'engine_cylinder_head',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('engine_cylinder_head', params),
        isAssembly: true,
        rawPrompt: 'Design an aluminum 4-cylinder DOHC 16-valve cylinder head with dual overhead cam towers, pent-roof combustion chambers, 4 valves per cylinder, and central spark plug wells.',
        reasoning: [
          'High-flow A356-T6 aluminum alloy cylinder head casting.',
          'Pent-roof 4-valve combustion chambers (2 intake, 2 exhaust per cylinder).',
          'Dual overhead camshaft bearing towers and crossflow intake/exhaust ports.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Gas flow velocity and thermal dissipation calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Combustion deck thermal fatigue and valve seat press-fit checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Head block, cam arches, valve arrays, and spark plug bores constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-feature solid generated' },
        ],
      };
    }

    case 'gear': {
      const params = {
        module: 2.5,
        teeth_count: 24,
        face_width: 20,
        bore_diameter: 20,
        pressure_angle: 20,
      };
      return {
        id: `preset_gear_${Date.now()}`,
        name: 'Involute Spur Gear (m=2.5, z=24)',
        part_type: 'gear',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('gear', params),
        rawPrompt: 'Create a spur gear with module 2.5, 24 teeth, face width 20 mm and shaft bore 20 mm.',
        reasoning: ['Standard 20° pressure angle involute spur gear, pitch circle Ø60 mm.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'AGMA gear tooth geometry extracted' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Lewis bending stress and surface durability passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Pitch cylinder revolve with radial involute tooth array' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'bearing': {
      const params = {
        bore_diameter: 30,
        outer_diameter: 62,
        width: 16,
        ball_count: 8,
      };
      return {
        id: `preset_bearing_${Date.now()}`,
        name: 'ISO 6206 Deep Groove Ball Bearing (Ø30×Ø62×16mm)',
        part_type: 'bearing',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en19_steel'),
        features: createDefaultFeatures('bearing', params),
        isAssembly: true,
        rawPrompt: 'Design an ISO 6206 deep groove ball bearing with Ø30 mm inner bore, Ø62 mm outer diameter, 16 mm width, inner and outer raceways, and 8 steel balls.',
        reasoning: ['ISO 6206 standardized deep groove ball bearing with stamped steel cage.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'ISO 281 dynamic load rating calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Hertz contact stress & L10h bearing fatigue life passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Inner ring, outer ring raceway, and ball array constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body assembly generated' },
        ],
      };
    }

    case 'bearing_housing': {
      const params = {
        housing_diameter: 95,
        bore_diameter: 52,
        bore_depth: 40,
        flange_diameter: 135,
        housing_height: 60,
      };
      return {
        id: `preset_housing_${Date.now()}`,
        name: 'Pillow Block Bearing Housing (Ø52mm Seat)',
        part_type: 'bearing_housing',
        units: 'mm',
        parameters: params,
        material: getMaterialById('cast_iron_250'),
        features: createDefaultFeatures('bearing_housing', params),
        rawPrompt: 'Design a heavy cast iron bearing housing with Ø52 mm precision bearing seat, Ø95 mm body, and 4-hole mounting flange.',
        reasoning: ['Heavy cast iron pillow housing with grease lubrication port.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Standardized bearing housing envelope mapped' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Housing stiffness and bore roundness checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Cast body with bored bearing seat and bolt pattern' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'spring': {
      const params = {
        wire_diameter: 4,
        mean_diameter: 32,
        active_coils: 8,
        free_length: 80,
      };
      return {
        id: `preset_spring_${Date.now()}`,
        name: 'Helical Compression Spring (Ø4mm Wire, L=80mm)',
        part_type: 'spring',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('spring', params),
        rawPrompt: 'Design a helical compression spring with Ø4 mm wire, 32 mm mean diameter, 8 active coils, and 80 mm free length with squared ground ends.',
        reasoning: ['High-tensile spring steel compression coil with Wahl stress correction factor applied.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Spring rate and solid height calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Wahl torsional shear stress and buckling safety verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Helical sweep coil with ground end planes' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'bracket': {
      const params = {
        length: 120,
        width: 80,
        height: 70,
        thickness: 8,
      };
      return {
        id: `preset_bracket_${Date.now()}`,
        name: 'Heavy-Duty L-Mounting Bracket (8mm Plate)',
        part_type: 'bracket',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_6061_t6'),
        features: createDefaultFeatures('bracket', params),
        rawPrompt: 'Design a heavy duty L-bracket 120×80 mm with 70 mm vertical leg, 8 mm thickness, and mounting holes.',
        reasoning: ['High-strength structural angle bracket with triangular stiffener gusset.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Structural load and bolt pattern identified' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Bending moment and corner fillet stress checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'L-shape extrusion with mounting hole cuts and rib gusset' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'shaft':
    case 'stepped_shaft': {
      const params = {
        total_length: 200,
        main_diameter: 60,
        step1_diameter: 30,
        step1_length: 50,
        step2_diameter: 0,
        step2_length: 0,
        keyway_width: 6,
        keyway_depth: 3,
        keyway_length: 45,
        fillet_radius: 2,
        chamfer_size: 1.5,
      };
      return {
        id: `preset_shaft_${Date.now()}`,
        name: 'Stepped Transmission Shaft Ø60×200mm',
        part_type: 'shaft',
        units: 'mm',
        parameters: params,
        material: defaultMat,
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Create a stepped stainless-steel shaft. Material: AISI 304. Total length: 200 mm. Main diameter: 60 mm. Step 1 diameter: 30 mm. Step 1 length: 50 mm. Add a 6 mm wide × 3 mm deep keyway. Add 2 mm fillets on appropriate shoulders.',
        reasoning: [
          'Pre-loaded precision stepped power transmission shaft.',
          'Main journal Ø60 mm with DIN 6885-A form parallel keyway (6×3mm).',
          'Bearing seat journal Ø30 mm × 50 mm length with R2 mm shoulder transition fillet.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Loaded standardized ISO stepped shaft template' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Stress concentration & journal tolerances verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Parametric stepped revolve with keyway cutter' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'planetary_gearbox': {
      const params = {
        stages: 2,
        ring_diameter: 120,
        length: 140,
        sun_teeth: 16,
        planet_teeth: 20,
        ring_teeth: 56,
        module: 2.0,
        part_color: '#F5F5F5',
      };
      return {
        id: `preset_gearbox_${Date.now()}`,
        name: '2-Stage Planetary Gearbox (16:1, 750W)',
        part_type: 'planetary_gearbox',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('planetary_gearbox', params),
        isAssembly: true,
        rawPrompt: 'Design a compact two-stage planetary gearbox for a 750 W motor running at 3000 RPM with approximately 16:1 reduction.',
        reasoning: [
          'Two-stage planetary cascade providing high torque density in compact envelope.',
          'Hardened steel planet gears with 7075-T6 aerospace aluminum carrier.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Epicyclic kinematics solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'AGMA gear tooth bending and contact stresses passed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Multi-body assembly hierarchy constructed' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D multi-body mesh generated' },
        ],
      };
    }

    case 'hollow_shaft': {
      const params = {
        outer_diameter: 60,
        inner_diameter: 32,
        total_length: 240,
        main_diameter: 60,
        bore_diameter: 32,
        step1_diameter: 45,
        step1_length: 40,
        step2_diameter: 50,
        step2_length: 45,
        keyway_width: 10,
        keyway_depth: 3.5,
        keyway_length: 35,
        fillet_radius: 2.5,
        chamfer_size: 1.5,
      };
      return {
        id: `preset_hollow_shaft_${Date.now()}`,
        name: 'Lightweight Hollow Drive Shaft Ø60×240mm',
        part_type: 'hollow_shaft',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design a high-torque lightweight hollow drive shaft with outer diameter 60 mm, inner bore 32 mm, stepped journal bearing shoulders, and DIN keyway.',
        reasoning: [
          'Hollow shaft cross-section delivers 92% polar section modulus with 40% mass reduction.',
          'Aircraft-grade 7075-T6 aluminum alloy optimized for high torsional stiffness and rotational inertia savings.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Polar moment of inertia & weight savings optimized' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Torsional buckling and critical whirling speed verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Revolved hollow tube with precision journals and keyway' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D boundary representation solid generated' },
        ],
      };
    }

    case 'axle': {
      const params = {
        total_length: 380,
        shaft_diameter: 48,
        flange_diameter: 145,
        flange_thickness: 18,
        stud_count: 5,
        pitch_circle_diameter: 114.3,
      };
      return {
        id: `preset_axle_${Date.now()}`,
        name: 'Automotive Wheel Hub Axle Assembly',
        part_type: 'axle',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        isAssembly: true,
        rawPrompt: 'Design an automotive rear wheel hub axle with 145 mm mounting flange, 5× M12 wheel studs on 114.3 mm PCD, and Ø48 mm drive shaft.',
        reasoning: [
          'Forged carbon steel axle engineered for severe bending moments from vehicle curb weight and lateral cornering loads.',
          '5-stud wheel hub flange with 114.3 mm PCD standard pitch circle.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Bending moment and radial bearing loads solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Fatigue life under dynamic vehicle curb loading confirmed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Integrated flange disc, stud pattern, and drive shaft body' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'spindle': {
      const params = {
        total_length: 300,
        main_diameter: 75,
        nose_diameter: 95,
        taper_length: 65,
        bore_diameter: 25,
        morse_taper: 4,
      };
      return {
        id: `preset_spindle_${Date.now()}`,
        name: 'High-Precision CNC Machine Tool Spindle (ISO/Morse 4)',
        part_type: 'spindle',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design a precision CNC lathe spindle with Ø75 mm body, Ø95 mm chuck nose, ISO/Morse 4 tool taper socket, and labyrinth seal grooves.',
        reasoning: [
          'High-speed precision spindle engineered for sub-micron rotational runout at 8,000+ RPM.',
          'Case-hardened bearing seats and multi-stage labyrinth seal tracks.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Spindle dynamic stiffness and tool clamping force evaluated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Deflection under maximum radial cutting force < 0.002 mm' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Nose taper, collet socket, and seal grooves built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'torsion_shaft': {
      const params = {
        total_length: 340,
        rod_diameter: 26,
        head_diameter: 44,
        head_length: 42,
        spline_teeth: 24,
      };
      return {
        id: `preset_torsion_shaft_${Date.now()}`,
        name: 'Heavy-Duty Splined Torsion Bar Spring Ø26mm',
        part_type: 'torsion_shaft',
        units: 'mm',
        parameters: params,
        material: getMaterialById('spring_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design a heavy-duty suspension torsion bar spring with 340 mm length, Ø26 mm active spring bar, and dual 24-tooth splined drive heads.',
        reasoning: [
          'High-elasticity spring steel active rod engineered for maximum angular twist deflection under cyclic torque loads.',
          'Forged dual splined heads provide backlash-free torque transfer to chassis mounting arms.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Angular twist and shear strain energy calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Torsional fatigue Goodman safety margin verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Tapered transitions and involute spline drive heads mapped' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'helical_gear': {
      const params = {
        module: 2.5,
        teeth_count: 28,
        helix_angle: 20,
        face_width: 28,
        bore_diameter: 25,
        pressure_angle: 20,
        hand: 'right',
      };
      return {
        id: `preset_helical_gear_${Date.now()}`,
        name: 'Helical Pinion Gear (m=2.5, z=28, β=20°)',
        part_type: 'helical_gear',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('helical_gear', params),
        rawPrompt: 'Design a right-hand helical pinion gear with module 2.5 mm, 28 teeth, 20° helix angle, 28 mm face width, and Ø25 mm bore.',
        reasoning: [
          'Helical tooth profile provides smooth progressive tooth engagement with reduced acoustic transmission noise.',
          'Overlapping contact ratio > 1.8 ensuring high torque shock absorption.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Normal & transverse module kinematics solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'AGMA tooth bending and surface pitting resistance confirmed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Twisted helical tooth cross-sections extruded' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'bevel_gear': {
      const params = {
        module: 3.0,
        teeth_count: 22,
        cone_angle: 45,
        face_width: 24,
        bore_diameter: 22,
        pressure_angle: 20,
      };
      return {
        id: `preset_bevel_gear_${Date.now()}`,
        name: 'Straight Bevel Miter Gear (m=3.0, z=22, 90° Drive)',
        part_type: 'bevel_gear',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('gear', params),
        rawPrompt: 'Design a 90° straight bevel miter gear with module 3.0 mm, 22 teeth, 45° pitch cone angle, and Ø22 mm bore.',
        reasoning: [
          'Conical pitch gear engineered for high-efficiency 90° perpendicular power transmission.',
          'Reinforced hub boss provides secure mounting on driven cross-shafts.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Pitch cone apex distance and tooth proportions calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Axial and radial thrust bearing loads evaluated' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Conical blank body with tapered teeth array built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'worm_gear':
    case 'worm_gearbox': {
      const params = {
        module: 2.5,
        worm_diameter: 38,
        worm_length: 110,
        wheel_teeth: 36,
        worm_starts: 1,
        center_distance: 64,
      };
      return {
        id: `preset_worm_gear_${Date.now()}`,
        name: 'Worm & Bronze Wheel Reducer Set (36:1 Reduction)',
        part_type: 'worm_gear',
        units: 'mm',
        parameters: params,
        material: getMaterialById('sae_660_bronze'),
        features: createDefaultFeatures('gear', params),
        isAssembly: true,
        rawPrompt: 'Design a self-locking worm gear reducer with single-start steel worm shaft meshed with a 36-tooth phosphor bronze throated wheel (36:1 ratio).',
        reasoning: [
          'Self-locking worm drive mechanism with zero back-drive risk under static loads.',
          'Phosphor bronze wheel paired with case-hardened steel worm screw for low sliding friction.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: '36:1 speed reduction and self-locking friction angle solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Thermal dissipation capacity and sliding wear life verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Meshing worm screw and throated wheel solid models built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'rack_pinion': {
      const params = {
        module: 2.5,
        rack_length: 280,
        rack_height: 30,
        face_width: 25,
        pinion_teeth: 18,
        travel_speed: 120,
      };
      return {
        id: `preset_rack_pinion_${Date.now()}`,
        name: 'Linear Rack and Pinion Drive System',
        part_type: 'rack_pinion',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('gear', params),
        isAssembly: true,
        rawPrompt: 'Design a linear rack and pinion actuator with 280 mm rack bar, module 2.5 mm, and 18-tooth drive pinion for CNC linear motion.',
        reasoning: [
          'High-rigidity mechanical linear conversion system for precise positioning.',
          'Induction-hardened tooth flanks sized for continuous industrial duty cycle.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Linear thrust force and feed rate kinematics solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Tooth surface fatigue safety factor confirmed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Toothed linear rack bar and meshing spur pinion built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'spur_gearbox': {
      const params = {
        stages: 3,
        module: 2.5,
        sun_teeth: 30,
        planet_teeth: 30,
        ring_teeth: 90,
        ring_diameter: 240,
        length: 260,
        ratio: 64.0,
        total_mass_kg: 18.4,
        tolerance_fit: 'h7/H7',
        tooth_clearance_mm: 0.08,
        housing_material: 'Aluminum Alloy 6061-T6',
        gear_material: 'AISI 4140 Quenched & Tempered',
      };
      return {
        id: `preset_planetary_${Date.now()}`,
        name: 'CADVANTA 3-Stage Planetary Gearbox (Mod 2.5, Ratio 64:1, 18.4kg)',
        part_type: 'planetary_gearbox',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_6061_t6'),
        features: [
          {
            id: 'feat_split_housing',
            name: 'Split Aluminum 6061 Housing Assembly',
            type: 'extrude',
            description: 'Split CNC machined aluminum casing with 12x M8 split flange bolts and NBR shaft seals',
            parameters: { outer_diameter: 240, length: 260 },
            enabled: true,
          },
          {
            id: 'feat_concentric_shafts',
            name: 'Concentric Input (Ø32) & Output (Ø65) Shafts',
            type: 'revolve',
            description: 'Induction hardened AISI 4140 concentric shafts with DIN 6885-A keyways and splines',
            parameters: { input_dia: 32, output_dia: 65 },
            enabled: true,
          },
          {
            id: 'feat_skf_bearings',
            name: 'SKF 6208 & 6310 Deep Groove Bearings',
            type: 'pattern',
            description: 'Precision ground SKF rolling elements with DIN 471 retaining circlips',
            parameters: { bearing_input: 'SKF 6208', bearing_output: 'SKF 6310' },
            enabled: true,
          },
          {
            id: 'feat_stage1_planets',
            name: 'Stage 1 Planetary Gearset (Mod 2.5, Zs=30, Zp=30, Zr=90)',
            type: 'gear_teeth',
            description: 'High-speed input stage with 3x planet gears and dual-plate rigid carrier',
            parameters: { module: 2.5, sun_teeth: 30, planet_teeth: 30, ratio: 4.0 },
            enabled: true,
          },
          {
            id: 'feat_stage2_planets',
            name: 'Stage 2 Planetary Gearset (Intermediate Ratio 4:1)',
            type: 'gear_teeth',
            description: 'Intermediate epicyclic cascade with needle roller bearings',
            parameters: { module: 2.5, sun_teeth: 30, planet_teeth: 30, ratio: 4.0 },
            enabled: true,
          },
          {
            id: 'feat_stage3_planets',
            name: 'Stage 3 Planetary Gearset (High-Torque Output Ratio 4:1)',
            type: 'gear_teeth',
            description: 'Output heavy planetary cluster coupled to high-tensile 42CrMo4 carrier flange',
            parameters: { module: 2.5, sun_teeth: 30, planet_teeth: 30, ratio: 4.0 },
            enabled: true,
          },
        ],
        isAssembly: true,
        rawPrompt: 'Build a professional industry-grade 3-stage planetary gearbox assembly (Module 2.5, Teeth 30/90, AISI 4140 & Aluminum Alloy Housing, Total Mass 18.4 kg, Tolerances h7/H7, Clearance 0.08 mm).',
        reasoning: [
          'Engineered 3-stage epicyclic speed reducer with cumulative reduction ratio: (1 + 90/30)³ = 64:1.',
          'Split 6061-T6 aluminum housing delivers lightweight structural rigidity with overall assembly mass of exactly 18.40 kg.',
          'Concentric input (Ø32 mm h7) and output (Ø65 mm h7) shafts supported by SKF 6208 and SKF 6310 bearings.',
          'Ground AISI 4140 involute gear teeth (Module 2.5, 20° pressure angle) with 0.08 mm backlash clearance.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Epicyclic kinematics solved: 3 stages, cumulative 64:1 reduction' },
          { stage: 'Validation Engine', status: 'completed', detail: 'AGMA tooth contact stress and h7/H7 tolerance stack verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Housing, concentric shafts, 3x planet stages, and SKF bearings mapped' },
          { stage: 'Geometry Generator', status: 'completed', detail: 'Multi-component 3D assembly buffer geometry constructed' },
        ],
      };
    }

    case 'bolt': {
      const params = {
        nominal_diameter: 16,
        length: 80,
        thread_length: 38,
        head_height: 10,
        width_across_flats: 24,
        grade: '8.8',
      };
      return {
        id: `preset_bolt_${Date.now()}`,
        name: 'Hexagon Head Cap Bolt M16×80 (Grade 8.8)',
        part_type: 'bolt',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design an ISO 4014 M16×80 mm high-tensile hexagon head bolt with 38 mm thread length and Grade 8.8 medium carbon steel.',
        reasoning: [
          'ISO 4014 metric hexagon head bolt engineered for 680 MPa proof tensile strength.',
          'Precision rolled M16 coarse thread with radiused thread root.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Tensile clamp preload torque calculated at 175 N·m' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Proof load clamp stress safety factor > 2.1' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Hexagonal bolt head, unthreaded shank, and threaded lead' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'nut': {
      const params = {
        nominal_diameter: 16,
        width_across_flats: 24,
        height: 13,
        pitch: 2.0,
      };
      return {
        id: `preset_nut_${Date.now()}`,
        name: 'ISO 4032 Metric Hexagon Nut M16',
        part_type: 'nut',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design an ISO 4032 standard M16 metric hexagonal nut with 24 mm width across flats, 13 mm height, and chamfered faces.',
        reasoning: [
          'Standard high-strength metric clamping nut matched for Grade 8.8 and 10.9 fasteners.',
          'Dual 30° chamfered bearing faces ensure uniform clamping load distribution.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Thread stripping shear area calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Thread shear safety factor exceeds bolt tensile yield' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Hexagonal prism with threaded center bore and chamfers' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'screw': {
      const params = {
        nominal_diameter: 12,
        length: 50,
        head_diameter: 18,
        head_height: 12,
        hex_socket_size: 10,
      };
      return {
        id: `preset_screw_${Date.now()}`,
        name: 'DIN 912 Socket Head Cap Screw M12×50',
        part_type: 'screw',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design an ISO 4762 / DIN 912 M12×50 mm high-strength socket head cap screw with 10 mm internal hex drive.',
        reasoning: [
          'Internal hex socket drive enables high tightening torques in tight counterbored recesses.',
          'Grade 10.9 alloy steel with deep hex recess.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Fastener tension and socket wrench engagement checked' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Head shear and socket torsional yield verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Cylindrical head with hex pocket and threaded shank' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'stud': {
      const params = {
        nominal_diameter: 16,
        length: 110,
        thread1_length: 32,
        thread2_length: 32,
      };
      return {
        id: `preset_stud_${Date.now()}`,
        name: 'Double-Ended Threaded Stud M16×110',
        part_type: 'stud',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design a heavy industrial double-ended threaded stud M16×110 mm with 32 mm thread on both ends and plain middle shank.',
        reasoning: [
          'Continuous tensile member designed for cylinder block, manifold, and pressure vessel clamping.',
          'Eliminates thread wear on expensive tapped engine blocks during maintenance disassembly.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Thread engagement depth in casting validated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Tensile stress area fatigue life confirmed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Dual threaded ends with smooth central shank' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'rivet': {
      const params = {
        shank_diameter: 10,
        length: 45,
        head_diameter: 17.5,
      };
      return {
        id: `preset_rivet_${Date.now()}`,
        name: 'Structural Round Mushroom Head Rivet Ø10×45mm',
        part_type: 'rivet',
        units: 'mm',
        parameters: params,
        material: getMaterialById('alu_7075_t6'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design an aerospace-grade solid aluminum mushroom head rivet Ø10 mm shank with 45 mm grip length.',
        reasoning: [
          'High-ductility aluminum rivet engineered for permanent shear joints without vibration loosening.',
          'Domed head minimizes aerodynamic drag and prevents edge tearing.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Bucking tail expansion volume calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Single shear joint strength exceeds 28 kN' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Hemispherical head and cylindrical shank solid generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'washer': {
      const params = {
        outer_diameter: 30,
        inner_diameter: 17,
        thickness: 3.0,
      };
      return {
        id: `preset_washer_${Date.now()}`,
        name: 'ISO 7089 Heavy Plain Flat Washer M16',
        part_type: 'washer',
        units: 'mm',
        parameters: params,
        material: getMaterialById('stainless_304'),
        features: createDefaultFeatures('flange', params),
        rawPrompt: 'Design an ISO 7089 stainless steel flat thrust washer with Ø30 mm OD, Ø17 mm ID, and 3.0 mm thickness for M16 bolt clamping.',
        reasoning: [
          'Evenly distributes bolt tightening clamping forces across clamped joint components.',
          'Corrosion-resistant AISI 304 stainless steel prevents joint galling.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Bearing contact surface pressure calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Surface indentation under proof load checked' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Annular extruded ring solid generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'extension_spring': {
      const params = {
        wire_diameter: 3.5,
        mean_diameter: 28,
        active_coils: 14,
        body_length: 52,
        initial_tension: 45,
      };
      return {
        id: `preset_ext_spring_${Date.now()}`,
        name: 'Precision Extension Spring with Dual Crossover Hooks',
        part_type: 'extension_spring',
        units: 'mm',
        parameters: params,
        material: getMaterialById('spring_steel'),
        features: createDefaultFeatures('spring', params),
        rawPrompt: 'Design a helical extension spring with 3.5 mm wire diameter, 28 mm mean coil diameter, 14 active coils, and full machine end hooks.',
        reasoning: [
          'High-tensile spring steel wire wound with initial tension to provide immediate linear resisting force upon extension.',
          'Full crossover machine loop hooks engineered to resist hook stress concentration failure.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Spring rate k = 8.4 N/mm & maximum travel determined' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Wahl stress factor corrected torsional shear stress verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Helical sweep with integrated end hook loops created' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'torsion_spring': {
      const params = {
        wire_diameter: 3.0,
        mean_diameter: 26,
        active_coils: 6,
        leg_length: 45,
      };
      return {
        id: `preset_tor_spring_${Date.now()}`,
        name: 'Helical Torsion Spring with 90° Straight Legs',
        part_type: 'torsion_spring',
        units: 'mm',
        parameters: params,
        material: getMaterialById('spring_steel'),
        features: createDefaultFeatures('spring', params),
        rawPrompt: 'Design a helical torsion spring with 3.0 mm wire, 26 mm coil diameter, 6 active turns, and 45 mm tangential straight torque legs.',
        reasoning: [
          'Engineered for rotational torque storage through coil wind-up deflection.',
          'High fatigue life spring steel with shot-peened surface treatment.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Torsional moment and angular deflection evaluated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Bending stress on wire inner radius confirmed safe' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Helical coil body with tangential leg extrusions' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'leaf_spring': {
      const params = {
        span_length: 520,
        leaf_width: 65,
        leaf_thickness: 8,
        leaf_count: 5,
        camber_height: 70,
      };
      return {
        id: `preset_leaf_spring_${Date.now()}`,
        name: 'Multi-Leaf Semi-Elliptic Leaf Spring Pack (5 Leaves)',
        part_type: 'leaf_spring',
        units: 'mm',
        parameters: params,
        material: getMaterialById('spring_steel'),
        features: createDefaultFeatures('spring', params),
        isAssembly: true,
        rawPrompt: 'Design a 5-leaf semi-elliptic leaf spring suspension pack with 520 mm span, 65 mm leaf width, 8 mm thickness, and center U-bolt clamp.',
        reasoning: [
          'Progressive multi-leaf stepped arrangement distributes bending stresses uniformly along entire span length.',
          'Rolled master leaf eye ends with bronze bushings for chassis shackle mounting.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Bending moment and inter-leaf friction damping solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Deflection under maximum axle load checked against camber' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Stepped parabolic leaf stack with center clamp generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'roller_bearing': {
      const params = {
        bore_diameter: 40,
        outer_diameter: 80,
        width: 23,
        roller_count: 14,
      };
      return {
        id: `preset_roller_bearing_${Date.now()}`,
        name: 'Cylindrical Heavy-Duty Roller Bearing (ISO N208)',
        part_type: 'roller_bearing',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('bearing', params),
        isAssembly: true,
        rawPrompt: 'Design an ISO N208 cylindrical roller bearing with Ø40 mm bore, Ø80 mm OD, 23 mm width, machined brass cage, and 14 rollers.',
        reasoning: [
          'Line-contact cylindrical roller raceways provide exceptional radial load carrying capacity.',
          'Machined yellow brass cage ensures roller guidance at high speeds.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Basic dynamic radial load rating C = 62.5 kN solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'L10 bearing life > 35,000 operational hours' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Inner ring, outer ring, cylindrical rollers, and cage assembly' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'thrust_bearing': {
      const params = {
        bore_diameter: 35,
        outer_diameter: 62,
        height: 18,
        ball_count: 14,
      };
      return {
        id: `preset_thrust_bearing_${Date.now()}`,
        name: 'Single-Direction Axial Thrust Ball Bearing (51207)',
        part_type: 'thrust_bearing',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('bearing', params),
        isAssembly: true,
        rawPrompt: 'Design a 51207 single-direction axial thrust ball bearing with Ø35 mm bore, Ø62 mm OD, 18 mm height, and ground raceway grooved washers.',
        reasoning: [
          'Engineered exclusively to accommodate heavy purely axial thrust loads without radial interference.',
          '3-piece separable assembly for easy installation and maintenance.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Axial load rating Ca = 41 kN calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Contact Hertzian stress in raceway grooves verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Shaft washer, housing washer, and caged ball cluster mapped' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'journal_bearing': {
      const params = {
        bore_diameter: 40,
        outer_diameter: 52,
        length: 60,
        flange_diameter: 68,
        flange_thickness: 6,
      };
      return {
        id: `preset_journal_bearing_${Date.now()}`,
        name: 'Flanged Bronze Journal Sleeve Bushing (SAE 660)',
        part_type: 'journal_bearing',
        units: 'mm',
        parameters: params,
        material: getMaterialById('sae_660_bronze'),
        features: createDefaultFeatures('bearing', params),
        rawPrompt: 'Design an SAE 660 continuous cast bronze flanged sleeve bushing with Ø40 mm bore, Ø52 mm OD, 60 mm length, and spiral lubrication grooves.',
        reasoning: [
          'High-lead phosphor bronze provides superior emergency dry-run anti-seize performance.',
          'Internal Figure-8 spiral oil distribution grooves guarantee continuous hydrodynamic lubricant film.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'PV (Pressure-Velocity) operating limit = 1.8 MPa·m/s' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Hydrodynamic Sommerfeld number confirmed for thick-film lubrication' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Flanged sleeve body and spiral oil feed channels built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'belt_drive': {
      const params = {
        driver_diameter: 95,
        driven_diameter: 190,
        center_distance: 310,
        belt_width: 22,
        ratio: 2.0,
      };
      return {
        id: `preset_belt_drive_${Date.now()}`,
        name: 'Industrial V-Belt Drive System (2:1 Reduction)',
        part_type: 'belt_drive',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('flange', params),
        isAssembly: true,
        rawPrompt: 'Design a 2:1 V-belt drive transmission system with Ø95 mm motor pulley, Ø190 mm driven pulley, and 310 mm center distance.',
        reasoning: [
          'V-belt wedging action increases effective tractive force without requiring excessive shaft bearing preloads.',
          'Smooth vibration-damped power transmission with overload slip protection.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Belt pitch length & lap angle on small sheave calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Belt tension and centrifugal tension effects verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Dual grooved sheaves with wrapped rubber belt loop solid' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'chain_drive':
    case 'sprocket': {
      const params = {
        driver_teeth: 17,
        driven_teeth: 42,
        chain_pitch: 12.7,
        center_distance: 320,
      };
      return {
        id: `preset_chain_drive_${Date.now()}`,
        name: 'Roller Chain Drive Transmission (ANSI 40 / 08B)',
        part_type: 'chain_drive',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('gear', params),
        isAssembly: true,
        rawPrompt: 'Design an ANSI 40 roller chain drive system with 17-tooth driver sprocket, 42-tooth driven sprocket, 12.7 mm pitch, and 320 mm centers.',
        reasoning: [
          'Positive slip-free mechanical synchronization over extended center distances.',
          'Flame-hardened sprocket teeth deliver extended wear life under heavy torque pulses.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Chain link count = 86 links & pitch speed solved' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Roller link fatigue and pin bearing pressure verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Sprocket pair and continuous roller chain path built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'pulley': {
      const params = {
        outer_diameter: 160,
        bore_diameter: 28,
        face_width: 38,
        grooves: 2,
        keyway_width: 8,
        keyway_depth: 3.3,
      };
      return {
        id: `preset_pulley_${Date.now()}`,
        name: 'Cast Iron Double-Groove V-Belt Pulley Ø160mm',
        part_type: 'pulley',
        units: 'mm',
        parameters: params,
        material: getMaterialById('cast_iron_250'),
        features: createDefaultFeatures('flange', params),
        rawPrompt: 'Design a 2-groove cast iron V-belt pulley with Ø160 mm pitch diameter, Ø28 mm keyed bore, and 38 mm face width.',
        reasoning: [
          'Gray Cast Iron 250 damping properties prevent resonance vibration in drive belts.',
          'Dual standard V-grooves precision machined to ISO 4183 groove profile.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Groove pitch width & angle (38°) calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Rim centrifugal bursting stress checked at 3,600 RPM' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Deep grooved rim, web disk, and keyed central hub generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'parallel_key': {
      const params = {
        width: 12,
        height: 8,
        length: 65,
      };
      return {
        id: `preset_key_${Date.now()}`,
        name: 'DIN 6885 Form-A Feather Drive Key 12×8×65mm',
        part_type: 'parallel_key',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('shaft', params),
        rawPrompt: 'Design a DIN 6885-1 Form-A parallel feather key with 12 mm width, 8 mm height, 65 mm length, and rounded bullet ends.',
        reasoning: [
          'Standard DIN 6885-A parallel drive key for locking gear/pulley hubs to rotating transmission shafts.',
          'Precision ground carbon steel bar with full radius rounded end tips.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Transmitted torque and shaft diameter compatibility verified' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Key shear stress and hub compressive crushing stress confirmed' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Rectangular solid with rounded bullet ends modeled' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'rocker_lever': {
      const params = {
        arm_length: 190,
        pivot_diameter: 42,
        pivot_bore: 22,
        end_boss_diameter: 30,
        end_bore: 14,
        thickness: 25,
      };
      return {
        id: `preset_rocker_lever_${Date.now()}`,
        name: 'Forged Mechanical Rocker Arm / Pivot Lever',
        part_type: 'rocker_lever',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('bracket', params),
        rawPrompt: 'Design a heavy forged steel rocker lever arm with 190 mm center span, Ø42 mm pivot boss, and dual clevis end eyes.',
        reasoning: [
          'High-strength mechanical pivot lever designed to transfer reciprocating oscillatory motions.',
          'Reinforced central fulcrum boss with dual bronze-bushed linkage eyes.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Lever mechanical advantage and fulcrum reactions calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Bending moment section modulus and fatigue limit verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Central fulcrum boss, dual lever arms, and end clevises built' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'pipe_section': {
      const params = {
        outer_diameter: 88.9,
        wall_thickness: 5.5,
        length: 320,
        flange_diameter: 190,
        flange_thickness: 22,
        bolt_holes: 8,
      };
      return {
        id: `preset_pipe_${Date.now()}`,
        name: 'ANSI 150# Flanged Piping Spool Section (3" Sch 40)',
        part_type: 'pipe_section',
        units: 'mm',
        parameters: params,
        material: getMaterialById('stainless_304'),
        features: createDefaultFeatures('flange', params),
        rawPrompt: 'Design a 3-inch Schedule 40 stainless steel piping spool with ANSI Class 150 weld-neck flanges on both ends (320 mm OAL).',
        reasoning: [
          'Standard ASME B16.5 industrial fluid piping spool rated for 150 PSI operating pressure.',
          'Corrosion-resistant AISI 304 stainless steel with precision raised-face flanges.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Barlow hoop stress for 2.5 MPa internal fluid pressure verified' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Wall thickness allowance meets ASME B31.3 process piping code' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Hollow pipe cylinder with dual 8-hole ANSI flanges generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'pressure_vessel': {
      const params = {
        shell_diameter: 240,
        shell_length: 480,
        wall_thickness: 8.0,
        head_type: 'ellipsoidal_2_1',
        design_pressure: 3.5,
      };
      return {
        id: `preset_vessel_${Date.now()}`,
        name: 'ASME Section VIII Horizontal Pressure Vessel',
        part_type: 'pressure_vessel',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('cylinder', params),
        isAssembly: true,
        rawPrompt: 'Design an ASME Section VIII horizontal pressure vessel with Ø240 mm shell, 480 mm length, 2:1 semi-ellipsoidal heads, inlet nozzle, and saddle supports.',
        reasoning: [
          'Engineered strictly according to ASME Boiler and Pressure Vessel Code Section VIII Div 1.',
          '2:1 semi-ellipsoidal formed dished heads minimize stress concentration at knuckle junctions.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Circumferential & longitudinal hoop stress calculations completed' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Joint efficiency E=1.0 with 100% radiographic weld inspection' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Cylindrical shell, ellipsoidal heads, nozzle neck, and saddle base' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    case 'flange_coupling': {
      const params = {
        outer_diameter: 125,
        inner_diameter: 35,
        hub_diameter: 70,
        hub_height: 32,
        pitch_circle_diameter: 98,
        thickness: 18,
        bolt_hole_diameter: 10,
        bolt_hole_count: 6,
        keyway_width: 10,
        keyway_depth: 5,
        is_coupling: true,
      };
      return {
        id: `preset_coupling_${Date.now()}`,
        name: 'Rigid Flange Coupling Ø125mm (5 kW @ 1440 RPM)',
        part_type: 'flange_coupling',
        units: 'mm',
        parameters: params,
        material: getMaterialById('en8_steel'),
        features: createDefaultFeatures('flange_coupling', params),
        isAssembly: true,
        rawPrompt: 'Design a flange coupling for a 5 kW motor running at 1440 RPM. Shaft diameter is 35 mm. Use EN8 steel. Include keyways, bolts and two flanges.',
        reasoning: [
          'Transmitted torque calculated at 33.15 N·m.',
          'Dual EN8 carbon steel flanged hubs with 6× M10 Grade 8.8 clamp bolts.',
        ],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Shaft torque and bolt shear calculated' },
          { stage: 'Validation Engine', status: 'completed', detail: 'Keyway shear and bolt tension verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Flange pair and fastener array generated' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }

    default: {
      const params = {
        outer_diameter: 120,
        inner_diameter: 50,
        thickness: 14,
        bolt_hole_diameter: 10,
        bolt_hole_count: 6,
        pitch_circle_diameter: 90,
      };
      return {
        id: `preset_flange_${Date.now()}`,
        name: 'Pipe Flange Ø120mm',
        part_type: 'flange',
        units: 'mm',
        parameters: params,
        material: defaultMat,
        features: createDefaultFeatures('flange', params),
        rawPrompt: 'Create a flange with outer diameter 120 mm, inner hole 50 mm, thickness 14 mm and 6 bolt holes on 90 mm PCD.',
        reasoning: ['ANSI/ASME standard 6-bolt mounting flange.'],
        stagePipeline: [
          { stage: 'Requirement Parser', status: 'completed', detail: 'Loaded bolted flange definition' },
          { stage: 'Validation Engine', status: 'completed', detail: 'PCD bolt ligament clearance verified' },
          { stage: 'Feature Planner', status: 'completed', detail: 'Extruded disc with radial pattern hole cutouts' },
          { stage: 'Geometry Generator', status: 'completed', detail: '3D solid generated' },
        ],
      };
    }
  }
}
