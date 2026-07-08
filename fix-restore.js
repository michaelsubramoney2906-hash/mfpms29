import fs from 'fs';

const lines = fs.readFileSync('server.ts', 'utf8').split('\n');

const originalLines = [
  ...lines.slice(0, 1380),
  ...lines.slice(2696)
];

const newContent = originalLines.join('\n');

fs.writeFileSync('server.ts', newContent, 'utf8');
console.log('Restored server.ts completely.');
