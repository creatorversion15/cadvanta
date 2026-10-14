const fs = require('fs');
const content = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '(') depth++;
    if (line[j] === ')') depth--;
  }
}
console.log('Final paren depth:', depth);

let currentDepth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let localDepth = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '(') localDepth++;
    if (line[j] === ')') localDepth--;
  }
  currentDepth += localDepth;
  if (localDepth > 0) {
    console.log(`Line ${i + 1}: +${localDepth} -> Total: ${currentDepth}`);
  } else if (localDepth < 0) {
    console.log(`Line ${i + 1}: ${localDepth} -> Total: ${currentDepth}`);
  }
}
