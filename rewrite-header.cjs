const fs = require('fs');
let content = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');

const injection = `  const presets = [
    { type: 'shaft' as PartType, label: 'Stepped Shaft', desc: 'Rotational transmission', icon: Activity, isPro: false },
    { type: 'flange' as PartType, label: 'Mounting Flange', desc: 'Pipe connector', icon: Compass, isPro: false },
    { type: 'bracket' as PartType, label: 'L-Bracket', desc: 'Structural mount', icon: Layers, isPro: false },
    { type: 'planetary_gearbox' as PartType, label: 'Planetary Gearbox', desc: 'Epicyclic train', icon: Boxes, isPro: true },
    { type: 'gear' as PartType, label: 'Spur Gear', desc: 'Power transmission', icon: Activity, isPro: true },
    { type: 'helical_gear' as PartType, label: 'Helical Gear', desc: 'Smooth engagement', icon: Activity, isPro: true }
  ];

  const handleSelectPresetClick = (p: any) => {
    if (p.isPro && !isPro) {
      openSubscriptionModal();
      return;
    }
    onSelectPreset(p.type);
    setShowPresetsMenu(false);
  };

  const handleExportSTEP = () => {
    const jsonStr = exportToJSON(part);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerBlobDownload(blob, \`\${part.name || 'cad_model'}_STEP.json\`);
    setShowStepNotification(true);
    setTimeout(() => setShowStepNotification(false), 5000);
    setShowExportMenu(false);
  };

  const handleExportSTL = () => {
    window.dispatchEvent(new CustomEvent('export-stl-request'));
    setShowExportMenu(false);
  };

  const handleExportDXF = () => {
    const dxfStr = exportToDXF(part);
    const blob = new Blob([dxfStr], { type: 'application/dxf' });
    triggerBlobDownload(blob, \`\${part.name || 'cad_model'}_2D.dxf\`);
    setShowExportMenu(false);
  };
`;

// Remove the existing injection by finding the first instance of 'const presets = ['
const startIdx = content.indexOf('  const presets = [');
if (startIdx !== -1) {
    const endIdx = content.indexOf('  return () => {', startIdx);
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx);
    }
}

// Now inject before the return statement of the component.
const compReturnIdx = content.lastIndexOf('  return (\n    <motion.header');
if (compReturnIdx !== -1) {
    content = content.substring(0, compReturnIdx) + injection + '\n' + content.substring(compReturnIdx);
} else {
    const backupIdx = content.lastIndexOf('  return (\n');
    if (backupIdx !== -1) {
        content = content.substring(0, backupIdx) + injection + '\n' + content.substring(backupIdx);
    }
}

fs.writeFileSync('src/components/Header/Header.tsx', content);
console.log('Done');
