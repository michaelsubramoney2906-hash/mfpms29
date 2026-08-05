const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr && !user) {
      setUser(JSON.parse(userStr));
    }
  }, []);
`;

code = code.replace('export default function App() {\n  const [user, setUser] = useState<User | null>(null);', 'export default function App() {\n  const [user, setUser] = useState<User | null>(null);\n' + injection);

fs.writeFileSync('src/App.tsx', code);
