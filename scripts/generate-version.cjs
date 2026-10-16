const fs = require('fs');
const path = require('path');

function generateVersion() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const version = `v${dateStr}.${timeStr}-${randomSuffix}`;
  
  const payload = {
    version,
    buildTime: now.toISOString(),
    formattedDate: `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`,
    platform: 'Digital Ocean / Production Node.js',
    app: 'Mzansi Flow PMS'
  };

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(payload, null, 2), 'utf8');

  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    try {
      fs.mkdirSync(distDir, { recursive: true });
    } catch (e) {}
  }
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify(payload, null, 2), 'utf8');
    fs.writeFileSync(path.join(distDir, 'version.txt'), version, 'utf8');
  }

  console.log(`[Version Generator] Generated build version: ${version}`);
  return payload;
}

if (require.main === module) {
  generateVersion();
}

module.exports = { generateVersion };
