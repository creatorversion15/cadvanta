const fs = require('fs');
let content = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');

const oldCode = `  const handleExportDXF = () => {
    const dxfStr = exportToDXF(part);
    const blob = new Blob([dxfStr], { type: 'application/dxf' });
    triggerBlobDownload(blob, \`\${part.name || 'cad_model'}_2D.dxf\`);
    setShowExportMenu(false);
  };`;

const newCode = `  const handleExportDXF = () => {
    const blob = exportToDXF(part, { format: 'dxf', units: part.units === 'inch' ? 'inch' : 'mm', resolution: 'standard' });
    triggerBlobDownload(blob, \`\${part.name || 'cad_model'}_2D.dxf\`);
    setShowExportMenu(false);
  };`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/Header/Header.tsx', content);
