const fs = require('fs');
let content = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');

// I inserted it twice or in the wrong spot?
// Let's strip out the bad injection and just do it correctly.

const badInjectionStart = `  const presets = [
    { type: 'shaft' as PartType`;
const index = content.indexOf(badInjectionStart);
if (index > -1) {
    // We should probably just rewrite the component body correctly.
}
