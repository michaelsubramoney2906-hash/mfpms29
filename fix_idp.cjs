const fs = require('fs');
const path = 'src/components/IDP/IDP.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`        const mayorData = JSON.parse(localStorage.getItem('mz_mayor_profile') || '{}');
        if (mayorData.name) {
          setMayorProfile(mayorData);
        }`,
`        let mayorData = {};
        try {
          const str = localStorage.getItem('mz_mayor_profile');
          if (str && str !== 'undefined') mayorData = JSON.parse(str);
        } catch (e) {}
        if (mayorData.name) {
          setMayorProfile(mayorData);
        }`
);

content = content.replace(
`        const mmData = JSON.parse(localStorage.getItem('mz_mm_profile') || '{}');
        if (mmData.name) {
          setMmProfile(mmData);
        }`,
`        let mmData = {};
        try {
          const str = localStorage.getItem('mz_mm_profile');
          if (str && str !== 'undefined') mmData = JSON.parse(str);
        } catch(e) {}
        if (mmData.name) {
          setMmProfile(mmData);
        }`
);

fs.writeFileSync(path, content);
console.log("IDP fixed");
