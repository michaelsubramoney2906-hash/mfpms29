const fs = require('fs'); const lines = fs.readFileSync('server.ts', 'utf-8').split('
'); const res = []; lines.forEach((l, i) => { if (l.includes('sdbip-officials')) res.push(i + ': ' + l.substring(0, 100)); }); console.log(res.join('
'));
