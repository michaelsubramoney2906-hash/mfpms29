const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`    const userStr = localStorage.getItem('currentUser');
    if (userStr && !user && userStr !== 'undefined') {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        localStorage.removeItem('currentUser');
      }
    }`,
`    const userStr = localStorage.getItem('currentUser');
    if (userStr && !user && userStr !== 'undefined' && userStr !== '[object Object]') {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        localStorage.removeItem('currentUser');
      }
    }`
);
fs.writeFileSync(path, content);
console.log("App fixed again");
