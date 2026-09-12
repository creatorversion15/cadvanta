import { CADPart, FeatureHistoryItem } from '../types/cad';

export interface CADPluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: 'feature' | 'exporter' | 'analysis' | 'integration';
  enabled: boolean;
}

export interface CustomFeatureDefinition {
  typeId: string;
  displayName: string;
  icon?: string;
  defaultParameters: Record<string, any>;
  computeGeometry: (params: Record<string, any>, basePart: CADPart) => Partial<FeatureHistoryItem>;
}

export interface CustomExporterDefinition {
  exporterId: string;
  displayName: string;
  fileExtension: string;
  mimeType: string;
  exportModel: (part: CADPart) => { fileName: string; content: string | Blob };
}

export interface CustomAnalysisPanelDefinition {
  panelId: string;
  title: string;
  evaluate: (part: CADPart) => {
    score: number;
    status: 'pass' | 'warning' | 'fail';
    metrics: Record<string, string | number>;
    notes: string[];
  };
}

export interface CADPlugin {
  metadata: CADPluginMetadata;
  customFeatures?: CustomFeatureDefinition[];
  customExporters?: CustomExporterDefinition[];
  customPanels?: CustomAnalysisPanelDefinition[];
  onModelLoaded?: (part: CADPart) => void;
  onFeatureRecomputed?: (featureId: string, part: CADPart) => void;
}

/**
 * CADVANTA Plugin Registry and Runtime SDK
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, CADPlugin> = new Map();

  private constructor() {
    this.registerDefaultPlugins();
  }

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerPlugin(plugin: CADPlugin): void {
    this.plugins.set(plugin.metadata.id, plugin);
  }

  public getPlugins(): CADPlugin[] {
    return Array.from(this.plugins.values());
  }

  public togglePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metadata.enabled = !plugin.metadata.enabled;
    }
  }

  public getActiveFeatures(): CustomFeatureDefinition[] {
    const features: CustomFeatureDefinition[] = [];
    this.plugins.forEach((p) => {
      if (p.metadata.enabled && p.customFeatures) {
        features.push(...p.customFeatures);
      }
    });
    return features;
  }

  public getActiveExporters(): CustomExporterDefinition[] {
    const exporters: CustomExporterDefinition[] = [];
    this.plugins.forEach((p) => {
      if (p.metadata.enabled && p.customExporters) {
        exporters.push(...p.customExporters);
      }
    });
    return exporters;
  }

  public getActivePanels(): CustomAnalysisPanelDefinition[] {
    const panels: CustomAnalysisPanelDefinition[] = [];
    this.plugins.forEach((p) => {
      if (p.metadata.enabled && p.customPanels) {
        panels.push(...p.customPanels);
      }
    });
    return panels;
  }

  private registerDefaultPlugins(): void {
    // Plugin 1: Automotive & Aerospace O-Ring Groove Standard (AS568 / ISO 3601)
    this.registerPlugin({
      metadata: {
        id: 'plugin_oring_as568',
        name: 'AS568 / ISO 3601 O-Ring Groove Generator',
        version: '1.2.0',
        author: 'Cadvanta Aerospace Systems',
        description: 'Automates standardized dynamic and static sealing gland grooves according to Parker O-Ring Handbook specifications.',
        category: 'feature',
        enabled: true,
      },
      customFeatures: [
        {
          typeId: 'as568_oring_groove',
          displayName: 'AS568 O-Ring Gland Groove',
          defaultParameters: {
            dash_number: 'AS568-112',
            cross_section_mm: 2.62,
            inner_diameter_mm: 12.37,
            groove_depth_mm: 2.15,
            groove_width_mm: 3.6,
            corner_radius_mm: 0.4,
          },
          computeGeometry: (params, basePart) => {
            return {
              id: `oring_${Date.now()}`,
              name: `O-Ring Groove (${params.dash_number || 'AS568'})`,
              type: 'cut',
              description: `Radial seal gland depth ${params.groove_depth_mm || 2.15}mm, width ${params.groove_width_mm || 3.6}mm`,
              parameters: params,
              enabled: true,
            };
          },
        },
      ],
    });

    // Plugin 2: Product Carbon Footprint & ESG Lifecycle Estimator
    this.registerPlugin({
      metadata: {
        id: 'plugin_esg_carbon',
        name: 'ISO 14067 Embodied Carbon & ESG Evaluator',
        version: '2.0.1',
        author: 'GreenCAD Alliance',
        description: 'Calculates cradle-to-gate carbon emissions (kg CO2e) and recyclability rating based on alloy mass and milling volume.',
        category: 'analysis',
        enabled: true,
      },
      customPanels: [
        {
          panelId: 'esg_carbon_analysis',
          title: 'Carbon Footprint & Eco-Audit',
          evaluate: (part: CADPart) => {
            const massKg = (part.calculatedMetrics?.mass || 800) / 1000;
            const isAlu = part.material.name.toLowerCase().includes('alu');
            const carbonFactor = isAlu ? 11.5 : 2.8; // kg CO2 per kg material
            const totalCO2 = Number((massKg * carbonFactor).toFixed(2));
            const recyclability = isAlu ? 95 : 85;

            return {
              score: Math.max(10, Math.min(100, Math.round(100 - totalCO2 * 4))),
              status: totalCO2 > 15 ? 'warning' : 'pass',
              metrics: {
                'Embodied Carbon': `${totalCO2} kg CO₂e`,
                'Recyclability Index': `${recyclability}%`,
                'Clean Scrap Value': `₹${Math.round(massKg * (part.material.costPerKgInr || 240) * 0.45)}`,
                'Eco Standard': 'ISO 14044 / 14067',
              },
              notes: [
                'Primary alloy production represents 82% of embodied footprint.',
                'Specify 70% post-consumer scrap feed to reduce footprint by 58%.',
              ],
            };
          },
        },
      ],
    });

    // Plugin 3: ANSYS APDL Simulation Script Exporter
    this.registerPlugin({
      metadata: {
        id: 'plugin_ansys_apdl',
        name: 'ANSYS APDL Mechanical Script Exporter',
        version: '1.4.0',
        author: 'Viraj Bansod',
        description: 'Generates ready-to-run ANSYS APDL batch input scripts with material cards (MP, EX, PRXY) and boundary condition constraints.',
        category: 'exporter',
        enabled: true,
      },
      customExporters: [
        {
          exporterId: 'ansys_apdl',
          displayName: 'ANSYS Mechanical APDL (*.dat)',
          fileExtension: 'dat',
          mimeType: 'text/plain',
          exportModel: (part: CADPart) => {
            const E = (part.material.youngsModulus || 205) * 1e9;
            const nu = part.material.poissonsRatio || 0.29;
            const dens = (part.material.density || 7.85) * 1000;

            const script = `! CADVANTA APDL Mechanical Batch Export
! Model: ${part.name}
! Units: SI (m, kg, s, Pa)
/PREP7
ET,1,SOLID186
MPTEMP,,,,,,,,
MPTEMP,1,0
MPDATA,EX,1,,${E.toExponential(4)}
MPDATA,PRXY,1,,${nu}
MPDATA,DENS,1,,${dens}
! Geometry & Mesh Definition
BLOCK,-0.05,0.05,-0.05,0.05,0,0.2
ESIZE,0.005
VMESH,ALL
! Boundary Conditions
NSEL,S,LOC,Z,0
D,ALL,ALL
ALLSEL,ALL
! Static Load Step
NSEL,S,LOC,Z,0.2
F,ALL,FY,-5000
ALLSEL,ALL
/SOLU
SOLVE
FINISH
/POST1
PLNSOL,S,EQV
`;
            return {
              fileName: `${part.name.replace(/\s+/g, '_')}_ANSYS.dat`,
              content: script,
            };
          },
        },
      ],
    });
  }
}
