const fs = require('fs');
let content = fs.readFileSync('src/components/AICommand/AICommand.tsx', 'utf8');

// Replace cyan with mint
content = content.replace(/#00D9FF/g, '#00F5A0');
// Replace hover cyan with hover mint
content = content.replace(/#38E7FF/g, '#34EEA9');

// Replace dark blue grays with cadvanta green grays
content = content.replace(/#11171C/g, '#07130F');
content = content.replace(/rgba\(160,180,190,0.15\)/g, 'rgba(16,185,129,0.15)');
content = content.replace(/rgba\(160,180,190,0.2\)/g, 'rgba(16,185,129,0.2)');
content = content.replace(/#F2F5F6/g, '#F0FDF4');
content = content.replace(/#161D22/g, '#0B1E17');
content = content.replace(/#AAB6BC/g, '#8CA89E');
content = content.replace(/#0B0F12/g, '#02140D');
content = content.replace(/#1C252B/g, '#102B21');
content = content.replace(/#8B9AA3/g, '#8CA89E');
content = content.replace(/#6F7C83/g, '#8CA89E');

fs.writeFileSync('src/components/AICommand/AICommand.tsx', content);
console.log('AICommand colors refactored.');
