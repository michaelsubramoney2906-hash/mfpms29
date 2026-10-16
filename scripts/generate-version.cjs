const fs = require('fs');
const path = require('path');

function generateVersion(syncDistOnly = false) {
  const publicDir = path.join(__dirname, '..', 'public');
  const publicVersionFile = path.join(publicDir, 'version.json');

  let payload = null;
  if (syncDistOnly && fs.existsSync(publicVersionFile)) {
    try {
      payload = JSON.parse(fs.readFileSync(publicVersionFile, 'utf8'));
    } catch (e) {
      payload = null;
    }
  }

  if (!payload || !payload.version) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const version = `v${dateStr}.${timeStr}-${randomSuffix}`;
    
    payload = {
      version,
      buildTime: now.toISOString(),
      formattedDate: `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`,
      platform: 'Digital Ocean / Production Node.js',
      app: 'Mzansi Flow PMS'
    };

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(publicVersionFile, JSON.stringify(payload, null, 2), 'utf8');
  }

  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    try {
      fs.mkdirSync(distDir, { recursive: true });
    } catch (e) {}
  }
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify(payload, null, 2), 'utf8');
    fs.writeFileSync(path.join(distDir, 'version.txt'), payload.version, 'utf8');
  }

  console.log(`[Version Generator] ${syncDistOnly ? 'Synced' : 'Generated'} build version: ${payload.version}`);
  return payload;
}

if (require.main === module) {
  const syncDistOnly = process.argv.includes('--sync-dist');
  generateVersion(syncDistOnly);
}

module.exports = { generateVersion };
