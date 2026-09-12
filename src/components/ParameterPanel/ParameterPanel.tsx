import React, { useState, useEffect, createContext, useContext } from 'react';
import { CADPart, MaterialInfo } from '../../types/cad';
import { MATERIALS, calculateMass } from '../../engine/materials';
import { Sliders, Scale, DollarSign, Activity, Cpu, Lock, Calculator, ExternalLink } from 'lucide-react';
import { UnitToggle, UnitSystem } from './UnitToggle';

interface ParameterPanelProps {
  part: CADPart;
  onParameterChange: (key: string, value: number | string | boolean) => void;
  onMaterialChange: (material: MaterialInfo) => void;
  onUnitChange?: (unit: 'mm' | 'inch') => void;
  isViewOnly?: boolean;
  onForkProject?: () => void;
  onOpenCostEstimator?: () => void;
}

interface UnitContextValue {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
}

export const UnitContext = createContext<UnitContextValue>({
  unitSystem: 'metric',
  setUnitSystem: () => {},
});

export const useUnitSystem = () => useContext(UnitContext);

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  part,
  onParameterChange,
  onMaterialChange,
  onUnitChange,
  isViewOnly = false,
  onForkProject,
  onOpenCostEstimator,
}) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    part.units === 'inch' ? 'imperial' : 'metric'
  );

  useEffect(() => {
    if (part.units === 'inch' && unitSystem !== 'imperial') {
      setUnitSystem('imperial');
    } else if (part.units === 'mm' && unitSystem !== 'metric') {
      setUnitSystem('metric');
    }
  }, [part.units]);

  const handleUnitToggle = (newSystem: UnitSystem) => {
    if (isViewOnly) return;
    setUnitSystem(newSystem);
    if (onUnitChange) {
      onUnitChange(newSystem === 'imperial' ? 'inch' : 'mm');
    }
  };

  const params = part.parameters;
  const metrics = part.calculatedMetrics;
  const volume = metrics?.volume || 100;
  const massInfo = calculateMass(volume, part.material);

  const handleSafeParamChange = (key: string, value: number | string | boolean) => {
    if (isViewOnly) return;
    onParameterChange(key, value);
  };

  // Render parameter controls tailored to each part type
  const renderParameters = () => {
    switch (part.part_type) {
      case 'cylinder':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-cylinder-diameter"
              label="Outer Diameter"
              value={params.diameter || 50}
              min={5}
              max={300}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('diameter', val)}
            />
            <ParamSlider
              id="param-cylinder-height"
              label="Height"
              value={params.height || 100}
              min={5}
              max={500}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('height', val)}
            />
            <ParamSlider
              id="param-cylinder-bore"
              label="Center Bore (Through-hole)"
              value={params.bore_diameter || 0}
              min={0}
              max={Math.max(0, (params.diameter || 50) - 2)}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
            <ParamSlider
              id="param-cylinder-fillet"
              label="Edge Fillet Radius"
              value={params.fillet_radius || 0}
              min={0}
              max={15}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('fillet_radius', val)}
            />
          </div>
        );

      case 'shaft':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Main Body
            </div>
            <ParamSlider
              id="param-shaft-total-length"
              label="Total Shaft Length"
              value={params.total_length || 200}
              min={30}
              max={600}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('total_length', val)}
            />
            <ParamSlider
              id="param-shaft-main-dia"
              label="Main Diameter"
              value={params.main_diameter || 30}
              min={8}
              max={150}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('main_diameter', val)}
            />

            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1 pt-2">
              Step 1 Journal (Drive End)
            </div>
            <ParamSlider
              id="param-shaft-step1-dia"
              label="Step 1 Diameter"
              value={params.step1_diameter || 0}
              min={0}
              max={params.main_diameter || 150}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('step1_diameter', val)}
            />
            <ParamSlider
              id="param-shaft-step1-len"
              label="Step 1 Length"
              value={params.step1_length || 0}
              min={0}
              max={Math.max(0, (params.total_length || 200) - 20)}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('step1_length', val)}
            />

            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1 pt-2">
              DIN 6885 / IS 2048 Keyway
            </div>
            <ParamSlider
              id="param-shaft-keyway-w"
              label="Keyway Width"
              value={params.keyway_width || 0}
              min={0}
              max={Math.round((params.main_diameter || 30) * 0.5)}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('keyway_width', val)}
            />
            <ParamSlider
              id="param-shaft-keyway-d"
              label="Keyway Depth"
              value={params.keyway_depth || 0}
              min={0}
              max={Math.round((params.main_diameter || 30) * 0.4)}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('keyway_depth', val)}
            />
            <ParamSlider
              id="param-shaft-keyway-l"
              label="Keyway Length"
              value={params.keyway_length || 40}
              min={10}
              max={150}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('keyway_length', val)}
            />
          </div>
        );

      case 'flange':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-flange-od"
              label="Outer Diameter (OD)"
              value={params.outer_diameter || 120}
              min={40}
              max={400}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-flange-id"
              label="Inner Hole / Bore (ID)"
              value={params.inner_diameter || 50}
              min={10}
              max={Math.max(10, (params.outer_diameter || 120) - 20)}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('inner_diameter', val)}
            />
            <ParamSlider
              id="param-flange-thickness"
              label="Flange Thickness"
              value={params.thickness || 14}
              min={4}
              max={60}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('thickness', val)}
            />

            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1 pt-2">
              Bolting Pattern (IS 1538)
            </div>
            <ParamSlider
              id="param-flange-pcd"
              label="Pitch Circle Diameter (PCD)"
              value={params.pitch_circle_diameter || 90}
              min={(params.inner_diameter || 50) + 15}
              max={(params.outer_diameter || 120) - 15}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('pitch_circle_diameter', val)}
            />
            <ParamSlider
              id="param-flange-bolt-count"
              label="Bolt Hole Count"
              value={params.bolt_hole_count || 6}
              min={2}
              max={24}
              step={1}
              unit="holes"
              onChange={(val) => onParameterChange('bolt_hole_count', val)}
            />
            <ParamSlider
              id="param-flange-bolt-dia"
              label="Bolt Hole Diameter"
              value={params.bolt_hole_diameter || 10}
              min={3}
              max={30}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bolt_hole_diameter', val)}
            />

            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1 pt-2">
              Hub Collar
            </div>
            <ParamSlider
              id="param-flange-hub-h"
              label="Hub Boss Height"
              value={params.hub_height || 0}
              min={0}
              max={100}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('hub_height', val)}
            />
          </div>
        );

      case 'box_plate':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-plate-length"
              label="Plate Length"
              value={params.length || 160}
              min={20}
              max={500}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-plate-width"
              label="Plate Width"
              value={params.width || 110}
              min={20}
              max={500}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('width', val)}
            />
            <ParamSlider
              id="param-plate-thickness"
              label="Thickness"
              value={params.thickness || 15}
              min={2}
              max={60}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('thickness', val)}
            />
            <ParamSlider
              id="param-plate-hole-dia"
              label="Mounting Hole Diameter"
              value={params.hole_diameter || 8}
              min={0}
              max={30}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('hole_diameter', val)}
            />
            <ParamSlider
              id="param-plate-fillet"
              label="Corner Fillet Radius"
              value={params.fillet_radius || 8}
              min={0}
              max={40}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('fillet_radius', val)}
            />
            <ParamSlider
              id="param-plate-center-hole"
              label="Center Pilot Hole"
              value={params.center_hole_diameter || 0}
              min={0}
              max={Math.min(params.length || 160, params.width || 110) * 0.6}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('center_hole_diameter', val)}
            />
          </div>
        );

      case 'bracket':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-bracket-width"
              label="Bracket Width"
              value={params.width || 80}
              min={20}
              max={300}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('width', val)}
            />
            <ParamSlider
              id="param-bracket-height"
              label="Vertical Wall Height"
              value={params.height || 100}
              min={20}
              max={300}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('height', val)}
            />
            <ParamSlider
              id="param-bracket-length"
              label="Base Foot Length"
              value={params.length || 110}
              min={20}
              max={300}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-bracket-thickness"
              label="Wall Thickness"
              value={params.thickness || 8}
              min={2}
              max={30}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('thickness', val)}
            />
            <ParamSlider
              id="param-bracket-hole-dia"
              label="Mounting Hole Diameter"
              value={params.hole_diameter || 10}
              min={0}
              max={25}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('hole_diameter', val)}
            />
            <ParamSlider
              id="param-bracket-fillet"
              label="Bend Fillet Radius"
              value={params.fillet_radius || 6}
              min={0}
              max={20}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('fillet_radius', val)}
            />
          </div>
        );

      case 'bolt':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-bolt-shaft-dia"
              label="Metric Size (Shaft Ø)"
              value={params.shaft_diameter || 12}
              min={3}
              max={48}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('shaft_diameter', val)}
            />
            <ParamSlider
              id="param-bolt-shaft-len"
              label="Total Shaft Length"
              value={params.shaft_length || 60}
              min={10}
              max={300}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('shaft_length', val)}
            />
            <ParamSlider
              id="param-bolt-thread-len"
              label="Threaded Length"
              value={params.thread_length || 35}
              min={5}
              max={params.shaft_length || 60}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('thread_length', val)}
            />
            <ParamSlider
              id="param-bolt-head-dia"
              label="Hex Head Width Across Corners"
              value={params.head_diameter || 21}
              min={(params.shaft_diameter || 12) + 2}
              max={80}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('head_diameter', val)}
            />
            <ParamSlider
              id="param-bolt-head-height"
              label="Head Thickness"
              value={params.head_height || 8}
              min={2}
              max={30}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('head_height', val)}
            />
          </div>
        );

      case 'gear':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-gear-module"
              label="Metric Module (m)"
              value={params.module || 2.5}
              min={0.5}
              max={10}
              step={0.25}
              unit="mm"
              onChange={(val) => onParameterChange('module', val)}
            />
            <ParamSlider
              id="param-gear-teeth"
              label="Number of Teeth (Z)"
              value={params.teeth_count || 24}
              min={10}
              max={80}
              step={1}
              unit="teeth"
              onChange={(val) => onParameterChange('teeth_count', val)}
            />
            <ParamSlider
              id="param-gear-face-w"
              label="Face Width (b)"
              value={params.face_width || 20}
              min={5}
              max={80}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('face_width', val)}
            />
            <ParamSlider
              id="param-gear-bore"
              label="Shaft Bore (d)"
              value={params.bore_diameter || 20}
              min={6}
              max={Math.max(6, ((params.module || 2.5) * (params.teeth_count || 24)) * 0.6)}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
          </div>
        );

      case 'bearing_housing':
        return (
          <div className="space-y-4">
            <ParamSlider
              id="param-bh-housing-dia"
              label="Housing Body Outer Ø"
              value={params.housing_diameter || 95}
              min={30}
              max={250}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('housing_diameter', val)}
            />
            <ParamSlider
              id="param-bh-bore"
              label="Bearing Seat Bore Ø"
              value={params.bore_diameter || 52}
              min={15}
              max={(params.housing_diameter || 95) - 10}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
            <ParamSlider
              id="param-bh-depth"
              label="Bearing Seat Depth"
              value={params.bore_depth || 40}
              min={10}
              max={params.housing_height || 60}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_depth', val)}
            />
            <ParamSlider
              id="param-bh-flange-dia"
              label="Mounting Base Flange Ø"
              value={params.flange_diameter || 135}
              min={(params.housing_diameter || 95) + 20}
              max={350}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('flange_diameter', val)}
            />
          </div>
        );

      case 'engine_crankshaft':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Crankshaft Kinematics
            </div>
            <ParamSlider
              id="param-crank-stroke"
              label="Piston Stroke (Throw × 2)"
              value={params.stroke || 80}
              min={40}
              max={160}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('stroke', val)}
            />
            <ParamSlider
              id="param-crank-main-dia"
              label="Main Journal Diameter Ø"
              value={params.main_journal_diameter || 55}
              min={30}
              max={100}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('main_journal_diameter', val)}
            />
            <ParamSlider
              id="param-crank-rod-dia"
              label="Connecting Rod Pin Ø"
              value={params.rod_journal_diameter || 48}
              min={25}
              max={90}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('rod_journal_diameter', val)}
            />
            <ParamSlider
              id="param-crank-total-len"
              label="Crankshaft Total Length"
              value={params.total_length || 420}
              min={200}
              max={800}
              step={10}
              unit="mm"
              onChange={(val) => onParameterChange('total_length', val)}
            />
          </div>
        );

      case 'engine_piston':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Crown & Skirt Dimensions
            </div>
            <ParamSlider
              id="param-piston-bore"
              label="Cylinder Bore Diameter Ø"
              value={params.bore_diameter || 85}
              min={50}
              max={160}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
            <ParamSlider
              id="param-piston-height"
              label="Overall Piston Height"
              value={params.total_height || 75}
              min={40}
              max={140}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('total_height', val)}
            />
            <ParamSlider
              id="param-piston-dish"
              label="Combustion Bowl Dish Depth"
              value={params.dish_depth || 3.5}
              min={0}
              max={12}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('dish_depth', val)}
            />
            <ParamSlider
              id="param-piston-pin-dia"
              label="Gudgeon / Wrist Pin Ø"
              value={params.pin_diameter || 22}
              min={12}
              max={40}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('pin_diameter', val)}
            />
          </div>
        );

      case 'engine_connecting_rod':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Connecting Rod Architecture
            </div>
            <ParamSlider
              id="param-rod-c2c"
              label="Center-to-Center Length"
              value={params.center_to_center_length || 140}
              min={80}
              max={280}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('center_to_center_length', val)}
            />
            <ParamSlider
              id="param-rod-big-bore"
              label="Big-End Crankpin Bore Ø"
              value={params.big_end_bore || 52}
              min={30}
              max={90}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('big_end_bore', val)}
            />
            <ParamSlider
              id="param-rod-small-bore"
              label="Small-End Wrist Pin Bore Ø"
              value={params.small_end_bore || 22}
              min={12}
              max={40}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('small_end_bore', val)}
            />
            <ParamSlider
              id="param-rod-beam-width"
              label="H-Beam Column Width"
              value={params.beam_width || 14}
              min={8}
              max={30}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('beam_width', val)}
            />
          </div>
        );

      case 'turbocharger_impeller':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Aerodynamic Compressor Geometry
            </div>
            <ParamSlider
              id="param-turbo-exducer"
              label="Exducer Major Diameter Ø"
              value={params.exducer_diameter || 76}
              min={40}
              max={150}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('exducer_diameter', val)}
            />
            <ParamSlider
              id="param-turbo-inducer"
              label="Inducer Inlet Diameter Ø"
              value={params.inducer_diameter || 52}
              min={25}
              max={110}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('inducer_diameter', val)}
            />
            <ParamSlider
              id="param-turbo-height"
              label="Hub Overall Height"
              value={params.height || 38}
              min={18}
              max={80}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('height', val)}
            />
            <ParamSlider
              id="param-turbo-blade-count"
              label="Full Blade Count"
              value={params.blade_count || 6}
              min={4}
              max={12}
              step={1}
              unit="blades"
              onChange={(val) => onParameterChange('blade_count', val)}
            />
          </div>
        );

      case 'engine_camshaft':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Valvetrain & Cam Lobe Dynamics
            </div>
            <ParamSlider
              id="param-cam-lift"
              label="Cam Peak Lobe Lift"
              value={params.lobe_lift || 9.5}
              min={4}
              max={16}
              step={0.25}
              unit="mm"
              onChange={(val) => onParameterChange('lobe_lift', val)}
            />
            <ParamSlider
              id="param-cam-lobes"
              label="Total Lobe Count"
              value={params.lobe_count || 8}
              min={2}
              max={24}
              step={2}
              unit="lobes"
              onChange={(val) => onParameterChange('lobe_count', val)}
            />
            <ParamSlider
              id="param-cam-shaft-dia"
              label="Journal Core Diameter Ø"
              value={params.shaft_diameter || 28}
              min={18}
              max={45}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('shaft_diameter', val)}
            />
            <ParamSlider
              id="param-cam-length"
              label="Total Camshaft Length"
              value={params.total_length || 380}
              min={150}
              max={700}
              step={10}
              unit="mm"
              onChange={(val) => onParameterChange('total_length', val)}
            />
          </div>
        );

      case 'engine_flywheel':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8B9AA3] font-mono border-b border-[rgba(160,180,190,0.15)] pb-1">
              Flywheel Inertia & Clutch Ring
            </div>
            <ParamSlider
              id="param-flywheel-od"
              label="Flywheel Outer Diameter Ø"
              value={params.outer_diameter || 280}
              min={150}
              max={450}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-flywheel-thick"
              label="Flywheel Disc Thickness"
              value={params.thickness || 32}
              min={12}
              max={65}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('thickness', val)}
            />
            <ParamSlider
              id="param-flywheel-teeth"
              label="Starter Ring Gear Teeth"
              value={params.ring_teeth || 110}
              min={60}
              max={180}
              step={2}
              unit="teeth"
              onChange={(val) => onParameterChange('ring_teeth', val)}
            />
            <ParamSlider
              id="param-flywheel-pcd"
              label="Crankshaft Bolt PCD Ø"
              value={params.pitch_circle_diameter || 75}
              min={40}
              max={140}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('pitch_circle_diameter', val)}
            />
          </div>
        );

      case 'engine_cylinder_block':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Cylinder Block Cast Geometry
            </div>
            <ParamSlider
              id="param-block-bore"
              label="Cylinder Liner Bore Ø"
              value={params.bore_diameter || 85}
              min={50}
              max={150}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
            <ParamSlider
              id="param-block-deck"
              label="Deck Height"
              value={params.deck_height || params.height || 210}
              min={120}
              max={350}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('deck_height', val)}
            />
            <ParamSlider
              id="param-block-length"
              label="Block Total Length"
              value={params.length || 420}
              min={200}
              max={800}
              step={10}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-block-width"
              label="Block Width"
              value={params.width || 210}
              min={140}
              max={350}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('width', val)}
            />
            <ParamSlider
              id="param-block-cylinders"
              label="Number of Cylinders"
              value={params.cylinders || 4}
              min={1}
              max={8}
              step={1}
              unit="cylinders"
              onChange={(val) => onParameterChange('cylinders', val)}
            />
          </div>
        );

      case 'engine_cylinder_head':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              DOHC Valvetrain & Head Deck
            </div>
            <ParamSlider
              id="param-head-length"
              label="Cylinder Head Length"
              value={params.length || 420}
              min={200}
              max={800}
              step={10}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-head-width"
              label="Cylinder Head Width"
              value={params.width || 200}
              min={140}
              max={320}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('width', val)}
            />
            <ParamSlider
              id="param-head-height"
              label="Head Overall Height"
              value={params.height || 110}
              min={60}
              max={200}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('height', val)}
            />
            <ParamSlider
              id="param-head-cylinders"
              label="Combustion Chambers"
              value={params.cylinders || 4}
              min={1}
              max={8}
              step={1}
              unit="cylinders"
              onChange={(val) => onParameterChange('cylinders', val)}
            />
          </div>
        );

      case 'gas_turbine_blisk':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              High-Pressure Blisk Rotor
            </div>
            <ParamSlider
              id="param-blisk-od"
              label="Tip Outer Diameter Ø"
              value={params.outer_diameter || 260}
              min={120}
              max={500}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-blisk-hub"
              label="Hub Disc Diameter Ø"
              value={params.hub_diameter || 160}
              min={80}
              max={350}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('hub_diameter', val)}
            />
            <ParamSlider
              id="param-blisk-blades"
              label="Aerofoil Blade Count"
              value={params.blade_count || 18}
              min={8}
              max={36}
              step={1}
              unit="blades"
              onChange={(val) => onParameterChange('blade_count', val)}
            />
            <ParamSlider
              id="param-blisk-disc-width"
              label="Disc Width (Rim Thickness)"
              value={params.disc_width || 42}
              min={15}
              max={90}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('disc_width', val)}
            />
            <ParamSlider
              id="param-blisk-bore"
              label="Shaft Bore Diameter Ø"
              value={params.bore_diameter || 45}
              min={15}
              max={100}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('bore_diameter', val)}
            />
          </div>
        );

      case 'roots_supercharger_rotor':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Helical Twin-Lobe Blower Rotor
            </div>
            <ParamSlider
              id="param-sc-od"
              label="Rotor Major Diameter Ø"
              value={params.outer_diameter || 92}
              min={40}
              max={180}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-sc-length"
              label="Rotor Lobe Span Length"
              value={params.length || 160}
              min={80}
              max={350}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-sc-twist"
              label="Helical Twist Angle"
              value={params.twist_angle || 60}
              min={0}
              max={120}
              step={5}
              unit="deg"
              onChange={(val) => onParameterChange('twist_angle', val)}
            />
            <ParamSlider
              id="param-sc-shaft"
              label="Drive Journal Diameter Ø"
              value={params.shaft_diameter || 24}
              min={12}
              max={50}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('shaft_diameter', val)}
            />
          </div>
        );

      case 'engine_valve':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Combustion Poppet Valve Geometry
            </div>
            <ParamSlider
              id="param-valve-head"
              label="Valve Head Diameter Ø"
              value={params.head_diameter || 34}
              min={18}
              max={65}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('head_diameter', val)}
            />
            <ParamSlider
              id="param-valve-stem"
              label="Stem Diameter Ø"
              value={params.stem_diameter || 6}
              min={4}
              max={14}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('stem_diameter', val)}
            />
            <ParamSlider
              id="param-valve-length"
              label="Total Overall Length"
              value={params.total_length || 95}
              min={50}
              max={180}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('total_length', val)}
            />
          </div>
        );

      case 'cycloidal_drive':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Robotic Cycloidal Drive
            </div>
            <ParamSlider
              id="param-cyc-ring"
              label="Ring Housing Outer Ø"
              value={params.ring_diameter || 130}
              min={60}
              max={280}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('ring_diameter', val)}
            />
            <ParamSlider
              id="param-cyc-pins"
              label="Ring Needle Pin Count"
              value={params.pin_count || 12}
              min={6}
              max={24}
              step={1}
              unit="pins"
              onChange={(val) => onParameterChange('pin_count', val)}
            />
            <ParamSlider
              id="param-cyc-lobes"
              label="Epotrochoid Disc Lobes"
              value={params.lobe_count || 11}
              min={5}
              max={23}
              step={1}
              unit="lobes"
              onChange={(val) => onParameterChange('lobe_count', val)}
            />
            <ParamSlider
              id="param-cyc-thick"
              label="Cycloid Disc Thickness"
              value={params.thickness || 18}
              min={8}
              max={45}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('thickness', val)}
            />
          </div>
        );

      case 'clutch_pack':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Multi-Plate Clutch Pack
            </div>
            <ParamSlider
              id="param-clutch-od"
              label="Outer Basket Diameter Ø"
              value={params.outer_diameter || 160}
              min={90}
              max={320}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('outer_diameter', val)}
            />
            <ParamSlider
              id="param-clutch-id"
              label="Inner Splined Hub Ø"
              value={params.inner_diameter || 70}
              min={40}
              max={160}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('inner_diameter', val)}
            />
            <ParamSlider
              id="param-clutch-discs"
              label="Friction Plate Count"
              value={params.disc_count || 6}
              min={2}
              max={12}
              step={1}
              unit="discs"
              onChange={(val) => onParameterChange('disc_count', val)}
            />
          </div>
        );

      case 'universal_joint':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Cardan Universal Joint Spider
            </div>
            <ParamSlider
              id="param-ujoint-span"
              label="Cross Spider Span"
              value={params.spider_span || 90}
              min={40}
              max={220}
              step={2}
              unit="mm"
              onChange={(val) => onParameterChange('spider_span', val)}
            />
            <ParamSlider
              id="param-ujoint-trunnion"
              label="Trunnion Pin Diameter Ø"
              value={params.trunnion_diameter || 26}
              min={12}
              max={60}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('trunnion_diameter', val)}
            />
          </div>
        );

      case 'geneva_mechanism':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Geneva Indexing Wheel
            </div>
            <ParamSlider
              id="param-geneva-dia"
              label="Star Wheel Diameter Ø"
              value={params.wheel_diameter || 120}
              min={60}
              max={280}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('wheel_diameter', val)}
            />
            <ParamSlider
              id="param-geneva-slots"
              label="Indexing Slot Count"
              value={params.slot_count || 6}
              min={3}
              max={12}
              step={1}
              unit="stations"
              onChange={(val) => onParameterChange('slot_count', val)}
            />
          </div>
        );

      case 'planetary_gearbox':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Epicyclic Planetary Gearbox
            </div>
            <ParamSlider
              id="param-pg-ring-dia"
              label="Ring Gear Housing Ø"
              value={params.ring_diameter || 120}
              min={60}
              max={250}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('ring_diameter', val)}
            />
            <ParamSlider
              id="param-pg-length"
              label="Gearbox Total Length"
              value={params.length || 140}
              min={60}
              max={300}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('length', val)}
            />
            <ParamSlider
              id="param-pg-stages"
              label="Planetary Reduction Stages"
              value={params.stages || 2}
              min={1}
              max={3}
              step={1}
              unit="stages"
              onChange={(val) => onParameterChange('stages', val)}
            />
            <ParamSlider
              id="param-pg-sun-teeth"
              label="Sun Pinion Teeth"
              value={params.sun_teeth || 16}
              min={10}
              max={32}
              step={1}
              unit="teeth"
              onChange={(val) => onParameterChange('sun_teeth', val)}
            />
          </div>
        );

      case 'spring':
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Helical Spring Coil Parameters
            </div>
            <ParamSlider
              id="param-spring-wire"
              label="Wire Diameter Ø"
              value={params.wire_diameter || 4}
              min={1}
              max={16}
              step={0.5}
              unit="mm"
              onChange={(val) => onParameterChange('wire_diameter', val)}
            />
            <ParamSlider
              id="param-spring-mean"
              label="Mean Coil Diameter Ø"
              value={params.mean_diameter || 32}
              min={10}
              max={90}
              step={1}
              unit="mm"
              onChange={(val) => onParameterChange('mean_diameter', val)}
            />
            <ParamSlider
              id="param-spring-coils"
              label="Active Coil Count"
              value={params.active_coils || 8}
              min={3}
              max={24}
              step={1}
              unit="coils"
              onChange={(val) => onParameterChange('active_coils', val)}
            />
            <ParamSlider
              id="param-spring-free-len"
              label="Free Uncompressed Length"
              value={params.free_length || 80}
              min={25}
              max={250}
              step={5}
              unit="mm"
              onChange={(val) => onParameterChange('free_length', val)}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8CA89E] font-mono border-b border-[rgba(16,185,129,0.18)] pb-1">
              Parametric Dimensions
            </div>
            {Object.entries(params).map(([k, v]) => {
              if (typeof v !== 'number') return null;
              return (
                <ParamSlider
                  key={k}
                  id={`param-generic-${k}`}
                  label={k.replace(/_/g, ' ')}
                  value={v}
                  min={Math.max(1, Math.round(v * 0.2))}
                  max={Math.max(10, Math.round(v * 3))}
                  step={1}
                  unit="mm"
                  onChange={(val) => onParameterChange(k, val)}
                />
              );
            })}
          </div>
        );
    }
  };

  return (
    <UnitContext.Provider value={{ unitSystem, setUnitSystem: handleUnitToggle }}>
      <div className="w-full h-full flex flex-col bg-[#11171C] rounded-lg border border-[rgba(160,180,190,0.15)] shadow-xl overflow-hidden text-[#F2F5F6]">
        {/* Panel Header */}
        <div className="p-3 border-b border-[rgba(160,180,190,0.15)] flex items-center justify-between bg-[#161D22]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00D9FF]" />
            <h2 className="text-xs font-bold font-mono text-[#F2F5F6] tracking-wide uppercase">Parametric CAD Controls</h2>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C252B] border border-[rgba(160,180,190,0.15)] text-[#00D9FF] font-bold">
            {part.part_type.replace('_', ' ')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Unit Conversion Toggle Component */}
          <UnitToggle
            unitSystem={unitSystem}
            onChange={handleUnitToggle}
            disabled={isViewOnly}
          />

          {isViewOnly && (
            <div className="p-3 rounded-xl bg-[#071510] border border-[#00F5A0]/40 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(0,245,160,0.1)]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00F5A0]">
                <Lock className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px]">View-Only Mode</div>
                  <div className="text-[11px] text-[#8CA89E]">Parameters locked for inspection</div>
                </div>
              </div>
              {onForkProject && (
                <button
                  type="button"
                  onClick={onForkProject}
                  className="px-2.5 py-1.5 rounded-lg bg-[#00F5A0] hover:bg-[#34EEA9] text-[#02140D] font-mono text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Edit Copy
                </button>
              )}
            </div>
          )}

          {/* Parametric Dimension Sliders */}
          <div className={isViewOnly ? 'pointer-events-none opacity-80' : ''}>{renderParameters()}</div>

          {/* Material & Physical Properties Section */}
          <div className="pt-3 border-t border-[rgba(16,185,129,0.18)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8CA89E] font-mono">
                <Cpu className="w-3.5 h-3.5 text-[#00F5A0]" />
                <span>Material & Cost Estimator</span>
              </div>
              {onOpenCostEstimator && (
                <button
                  type="button"
                  onClick={onOpenCostEstimator}
                  className="flex items-center gap-1 text-[10px] font-mono text-[#00F5A0] hover:text-[#34EEA9] hover:underline cursor-pointer"
                  title="Open detailed Cost Estimator & Assembly Rollup"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Full Rollup</span>
                </button>
              )}
            </div>

            {/* Running Total Spotlight Badge */}
            <div className="p-3 bg-gradient-to-r from-[#071E14] to-[#0B2A1E] rounded-xl border border-[#00F5A0]/40 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-[#00F5A0] uppercase font-bold block">Part Running Total:</span>
                <span className="text-lg font-black text-[#F0FDF4]">
                  ₹{(massInfo.estCostInr || massInfo.estCostUsd * 86.5).toFixed(2)} INR
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8CA89E] block">Net Mass:</span>
                <span className="text-xs font-bold text-[#00F5A0]">
                  {unitSystem === 'imperial'
                    ? `${(massInfo.massKg * 2.20462).toFixed(2)} lb`
                    : massInfo.massGrams < 1000
                    ? `${massInfo.massGrams} g`
                    : `${massInfo.massKg} kg`}
                </span>
              </div>
            </div>

            {/* Material Selector Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#8CA89E] block font-mono">Selected Engineering Material</label>
                <span className="text-[10px] text-[#00F5A0] font-mono font-bold">
                  {unitSystem === 'imperial'
                    ? `₹${Math.round((part.material.costPerKgInr || 240) / 2.20462)}/lb`
                    : `₹${part.material.costPerKgInr || 240}/kg`}
                </span>
              </div>
              <select
                id="select-material"
                disabled={isViewOnly}
                value={part.material.id}
                onChange={(e) => {
                  if (isViewOnly) return;
                  const found = MATERIALS.find((m) => m.id === e.target.value);
                  if (found) onMaterialChange(found);
                }}
                className={`w-full bg-[#0B1E17] border border-[rgba(16,185,129,0.22)] rounded-lg px-3 py-2 text-xs text-[#F0FDF4] focus:outline-none focus:border-[#00F5A0] transition-colors font-mono ${
                  isViewOnly ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {MATERIALS.map((mat) => (
                  <option key={mat.id} value={mat.id} className="bg-[#0B1E17] text-[#F0FDF4]">
                    {unitSystem === 'imperial'
                      ? `${mat.name} (${(mat.density * 0.036127).toFixed(3)} lb/in³) — ₹${Math.round((mat.costPerKgInr || 240) / 2.20462)}/lb`
                      : `${mat.name} (${mat.density} g/cm³) — ₹${mat.costPerKgInr || 240}/kg`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#8CA89E] mt-1.5 leading-relaxed font-sans">{part.material.description}</p>
            </div>

            {/* Physical Quantities Table HUD */}
            <div className="p-3 bg-[#0B1E17] rounded-lg border border-[rgba(16,185,129,0.18)] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#8CA89E] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#00F5A0]" />
                  Density:
                </span>
                <span className="text-[#F0FDF4] font-bold">
                  {unitSystem === 'imperial'
                    ? `${(part.material.density * 0.036127).toFixed(3)} lb/in³`
                    : `${part.material.density.toFixed(2)} g/cm³`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8CA89E] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00F5A0]" />
                  Yield Strength:
                </span>
                <span className="text-[#F0FDF4] font-bold">
                  {unitSystem === 'imperial'
                    ? `${Math.round(part.material.yieldStrength * 0.145038)} ksi`
                    : `${part.material.yieldStrength} MPa`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8CA89E]">Calculated Volume:</span>
                <span className="text-[#F0FDF4] font-bold">
                  {unitSystem === 'imperial'
                    ? `${(volume * 0.0610237).toFixed(2)} in³`
                    : `${volume.toFixed(1)} cm³`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(16,185,129,0.15)] pt-1.5">
                <span className="text-[#8CA89E] font-semibold">Estimated Mass:</span>
                <span className="text-[#00F5A0] font-bold text-sm">
                  {unitSystem === 'imperial'
                    ? `${(massInfo.massKg * 2.20462).toFixed(2)} lb`
                    : massInfo.massGrams < 1000
                    ? `${massInfo.massGrams} g`
                    : `${massInfo.massKg} kg`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8CA89E] flex items-center gap-1 font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-[#00F5A0]" />
                  Raw Material Cost:
                </span>
                <span className="text-[#00F5A0] font-bold font-mono text-sm">
                  ₹{(massInfo.estCostInr || massInfo.estCostUsd * 86.5).toFixed(2)} INR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnitContext.Provider>
  );
};

// Parameter Slider Input Component
interface ParamSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => {
  const { unitSystem } = useUnitSystem();
  const isImperialLength = unitSystem === 'imperial' && unit === 'mm';

  // Calculate display parameters
  const displayUnit = isImperialLength ? 'in' : unit;

  // Format numeric value for display (converting mm -> in if imperial)
  const displayValue = isImperialLength
    ? Math.round((value / 25.4) * 100) / 100
    : value;

  const displayMin = isImperialLength
    ? Math.round((min / 25.4) * 100) / 100
    : min;

  const displayMax = isImperialLength
    ? Math.round((max / 25.4) * 100) / 100
    : max;

  const displayStep = isImperialLength
    ? (step <= 0.5 ? 0.01 : 0.05)
    : step;

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal)) return;

    if (isImperialLength) {
      // Convert entered inches back to canonical mm for the CAD model
      const convertedMm = Math.round(rawVal * 25.4 * 10) / 10;
      onChange(convertedMm);
    } else {
      onChange(rawVal);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal)) return;

    if (isImperialLength) {
      const convertedMm = Math.round(rawVal * 25.4 * 10) / 10;
      onChange(convertedMm);
    } else {
      onChange(rawVal);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-semibold text-[#F0FDF4] font-sans">
          {label}
        </label>
        <div className="flex items-center gap-1 font-mono">
          <input
            id={`${id}-number`}
            type="number"
            value={displayValue}
            min={displayMin}
            max={displayMax}
            step={displayStep}
            onChange={handleNumberInputChange}
            className="w-20 bg-[#0B1E17] border border-[rgba(16,185,129,0.22)] rounded px-1.5 py-0.5 text-right text-xs font-bold text-[#F0FDF4] focus:outline-none focus:border-[#00F5A0]"
          />
          <span className="text-[11px] text-[#8CA89E] w-7 font-bold">{displayUnit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={displayMin}
        max={displayMax}
        step={displayStep}
        value={displayValue}
        onChange={handleRangeChange}
        className="w-full h-1.5 bg-[#102B21] rounded appearance-none cursor-pointer accent-[#00F5A0]"
      />
    </div>
  );
};
