const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr && !user) {
      setUser(JSON.parse(userStr));
    }
  }, []);`,
`  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr && !user && userStr !== 'undefined') {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);`
);

content = content.replace(
`      // Restore original admin
      const originalAdminStr = sessionStorage.getItem('originalAdminUser');
      if (originalAdminStr) {
        const originalAdmin = JSON.parse(originalAdminStr);
        sessionStorage.removeItem('originalAdminUser');
        handleSetUser(originalAdmin);
      }`,
`      // Restore original admin
      const originalAdminStr = sessionStorage.getItem('originalAdminUser');
      if (originalAdminStr && originalAdminStr !== 'undefined') {
        try {
          const originalAdmin = JSON.parse(originalAdminStr);
          sessionStorage.removeItem('originalAdminUser');
          handleSetUser(originalAdmin);
        } catch (e) {
          sessionStorage.removeItem('originalAdminUser');
        }
      }`
);

fs.writeFileSync(path, content);
console.log("App.tsx fixed");
