const fs = require('fs');
const content = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');

let depth = 0;
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  if (content[i] === '(') depth++;
  if (content[i] === ')') depth--;
}
console.log('Final paren depth:', depth);
