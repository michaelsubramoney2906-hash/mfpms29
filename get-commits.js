import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      if (file === 'node_modules' || file === 'Nkangala District Municipality' || file === '.npm' || file === '.cache') return;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results.push({ path: fullPath, isDir: true, mtime: stat.mtime });
        results = results.concat(walk(fullPath));
      } else {
        results.push({ path: fullPath, isDir: false, mtime: stat.mtime });
      }
    });
  } catch (e) {}
  return results;
}

const list = walk('/app');
console.log('Total files found in /app:', list.length);
list.forEach(f => {
  if (f.path.includes('.git') || f.path.includes('backup') || f.path.includes('archive') || f.path.includes('zip') || f.path.includes('tgz') || f.path.includes('revert') || f.path.includes('restore')) {
    console.log(`MATCH: ${f.path} (mtime: ${f.mtime.toISOString()})`);
  }
});
