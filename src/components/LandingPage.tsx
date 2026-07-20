import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Logo } from './Branding';
import { ShieldCheck, BarChart3, Target, Info, KeyRound, Database, FileSignature, FileCheck } from 'lucide-react';
import { tenants } from '../data';
import type { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [portalMode, setPortalMode] = useState<'municipality' | 'neda'>(() => {
    return (sessionStorage.getItem('preferredPortalMode') as any) || 'municipality';
  });

  useEffect(() => {
    sessionStorage.setItem('preferredPortalMode', portalMode);
  }, [portalMode]);

  const [email, setEmail] = useState('');
  const defaultTenant = tenants.find(t => t.name === "Nkangala District Municipality")?.id || tenants[0].id;
  const [selectedTenant, setSelectedTenant] = useState(defaultTenant);

  const GLOBAL_ADMINS = [
    'mike@mzansiflow.co.za',
    'mike@massivedynamixdistributors.com',
    'audrey@mzansiflow.co.za',
    'delphine@mzansiflow.co.za',
    'qiniso@mzansiflow.co.za',
    'marlan@mzansiflow.co.za'
  ];
  const isGlobalAdmin = GLOBAL_ADMINS.includes(email.trim().toLowerCase());

  const PASSWORD_REQUIRED_EMAILS = [
    'mike@mzansiflow.co.za',
    'mike@massivedynamixdistributors.com',
    'audrey@mzansiflow.co.za',
    'marlan@mzansiflow.co.za',
    'qiniso@mzansiflow.co.za',
    'delphine@mzansiflow.co.za'
  ];
  const isPasswordRequired = PASSWORD_REQUIRED_EMAILS.includes(email.trim().toLowerCase());
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [overridePassword, setOverridePassword] = useState('8655M9sznnes01*');

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/config/manager-password')
      .then(res => res.json())
      .then(data => {
        if (data.managerOverridePassword) {
          setOverridePassword(data.managerOverridePassword);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/tenant/nkangala_auto/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort alphabetically
          const sorted = data.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
          setUsers(sorted);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setPasswordError('');
  }, [email, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const lowerEmail = email.trim().toLowerCase();
    
    // Find internal user profile if exists
    const internalProfile = users.find(u => u.email.toLowerCase() === lowerEmail);
    
    // Strictly enforce allowed domains: mzansiflow.co.za, azure AD, nkangaladm.gov.za, massivedynamixdistributors.com and test accounts
    const isMzansiFlow = lowerEmail.endsWith('@mzansiflow.co.za');
    const isNkangala = lowerEmail.endsWith('@nkangaladm.gov.za');
    const isMDD = lowerEmail.endsWith('@massivedynamixdistributors.com');
    const isTestAccount = lowerEmail.endsWith('@local') || lowerEmail.includes('test');
    const isAzureAd = lowerEmail.endsWith('.onmicrosoft.com'); // Typical Azure AD fallback
    
    if (!isMzansiFlow && !isNkangala && !isTestAccount && !isAzureAd && !isMDD) {
      setPasswordError('Unauthorized access. Only @mzansiflow.co.za, @nkangaladm.gov.za, @massivedynamixdistributors.com, Azure AD users, and test accounts are allowed.');
      return;
    }

    if (isPasswordRequired) {
      const expectedPassword = (lowerEmail === 'mike@mzansiflow.co.za' || lowerEmail === 'mike@massivedynamixdistributors.com') ? overridePassword : 'Deskjet01*';
      if (password !== expectedPassword) {
        setPasswordError('Incorrect password. Please enter the correct password.');
        return;
      }
    }

    setPasswordError('');
    
    const userRole = (isGlobalAdmin || internalProfile?.role === 'admin' || internalProfile?.role === 'Global Administrator' || internalProfile?.role === 'Systems Administrator') ? 'admin' : 'tenant_user';

    // Prepare full user object
    const finalUser: User = {
      email: lowerEmail,
      role: userRole as any,
      tenantId: isGlobalAdmin ? undefined : (internalProfile?.tenantId || internalProfile?.tenant_id || selectedTenant),
      fullName: internalProfile?.fullName || internalProfile?.full_name || lowerEmail.split('@')[0],
      jobFunction: internalProfile?.jobFunction || internalProfile?.job_function,
      department: internalProfile?.department,
      manager: internalProfile?.manager,
      reportTo: internalProfile?.reportTo,
      level: internalProfile?.level,
      systemRole: internalProfile?.systemRole || internalProfile?.role || 'Standard User',
      portalMode: portalMode
    };

    onLogin(finalUser);
  };

  const handleAzureSSO = async () => {
    try {
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
      const res = await fetch(`/api/auth/azure?tenantId=${selectedTenant}&redirectUri=${redirectUri}`);
      const data = await res.json();
      if (data.url) {
        const authWindow = window.open(data.url, 'oauth_popup', 'width=500,height=600');
        if (!authWindow) {
          alert("Please allow popups for this site to sign in with Azure AD.");
        }
      } else {
        alert(data.error || "Azure AD SSO is not properly configured.");
      }
    } catch (err) {
      console.error(err);
      alert("Error initiating Azure AD SSO.");
    }
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  const xOffset = useTransform(smoothX, [-0.5, 0.5], [-35, 35]);
  const yOffset = useTransform(smoothY, [-0.5, 0.5], [-35, 35]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const xPct = (clientX / innerWidth) - 0.5;
    const yPct = (clientY / innerHeight) - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  return (
    <div 
      className="min-h-screen relative flex font-sans overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Background Image / Gradient */}
      <motion.div 
        className="absolute inset-[-50px] bg-cover bg-center z-0 opacity-80"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
          x: xOffset,
          y: yOffset
        }}
      ></motion.div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-transparent z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row h-screen">
        {/* Left Content - Selling Points */}
        <div className="flex-1 border-r text-white border-white/10 backdrop-blur-sm bg-black/20 overflow-y-auto hide-scrollbar">
          <div className="min-h-full p-12 lg:p-24 flex flex-col justify-center">
            <div className="max-w-2xl space-y-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                The Flow of <span className="text-green-500">Excellence</span>
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed uppercase tracking-widest font-semibold mb-12">
                Performance Management Perfected
              </p>

            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2 }
                }
              }}
              className="flex flex-col space-y-6"
            >
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5 text-white" />,
                  title: "Tenant Isolation",
                  desc: "Data is encrypted and isolated per municipality. Zero leak architecture with deep role-based access.",
                },
                {
                  icon: <BarChart3 className="w-5 h-5 text-white" />,
                  title: "Real-time Reporting",
                  desc: "Automated SDBIP generation, interactive dashboards, and real-time tracking for predictive insights.",
                },
                {
                  icon: <Target className="w-5 h-5 text-white" />,
                  title: "Global Oversight",
                  desc: "Integrated support for Global Admins with comprehensive audit logs and multi-tenant observability.",
                },
                {
                  icon: <FileSignature className="w-5 h-5 text-white" />,
                  title: "Automated Appraisals",
                  desc: "Automate APRs and bi-annual assessments integrated seamlessly with IPMS.",
                },
                {
                  icon: <FileCheck className="w-5 h-5 text-white" />,
                  title: "MSCOA Compliance",
                  desc: "Full statutory alignment with built-in metadata matching for National Treasury regulations.",
                }
              ].map((pro, index) => (
                <motion.div 
                  key={index}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="group flex items-start space-x-5 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-colors cursor-pointer"
                >
                  <div className="bg-green-600/80 group-hover:bg-green-500 p-3 rounded-xl flex-shrink-0 transition-colors shadow-lg shadow-green-900/20">
                    {pro.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg mb-1 text-white group-hover:text-green-400 transition-colors">{pro.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{pro.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          </div>
        </div>

        {/* Right Content - Login Area */}
        <div className="w-full md:w-[480px] bg-white overflow-y-auto hide-scrollbar">
          <div className="min-h-full w-full px-12 py-12 flex flex-col justify-center">
            <div className="w-full">
              
              {/* Portal Mode Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
                <button
                  type="button"
                  onClick={() => setPortalMode('municipality')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all cursor-pointer text-center ${
                    portalMode === 'municipality'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-950'
                  }`}
                >
                  Nkangala Municipality
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('neda')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all cursor-pointer text-center ${
                    portalMode === 'neda'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-950'
                  }`}
                >
                  NEDA Subsidiary
                </button>
              </div>

              <div className="mb-8 transform scale-[0.85] origin-top-left">
                {portalMode === 'neda' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-black text-xs">N</span>
                    <span className="text-sm font-black uppercase tracking-widest text-emerald-800">NEDA Subsidiary</span>
                  </div>
                ) : (
                  <Logo />
                )}
                <p className="text-sm text-gray-500 mt-6 font-medium">
                  {portalMode === 'neda'
                    ? "Access Nkangala Economic Development Agency's autonomous administrative suite."
                    : "Welcome back. Please sign in to access your municipality's tenant."}
                </p>
              </div>

          <div className="space-y-6">
            <button
              onClick={handleAzureSSO}
              className="w-full bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold py-4 px-4 transition-all duration-200 text-xs tracking-widest flex items-center justify-center gap-3 rounded-sm shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.462 0H0v7.19h7.462V0zM16 0H8.538v7.19H16V0zM7.462 8.211H0V16h7.462V8.211zm8.538 0H8.538V16H16V8.211z"/>
              </svg>
              Sign In with Azure AD (SSO)
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Or use manual</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Manager / Override Email</label>
                <input 
                  type="email" 
                  list="user-list"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mike@mzansiflow.co.za"
                  className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-200 focus:border-green-600 transition-colors outline-none font-medium text-gray-900 rounded-none"
                />
                <datalist id="user-list">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>{u.fullName}</option>
                  ))}
                </datalist>
              </div>

              {isPasswordRequired && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 mt-4 overflow-hidden"
                >
                  <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Enter Secure Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-200 focus:border-green-600 transition-colors outline-none font-medium text-gray-900 rounded-none font-mono"
                  />
                  {passwordError && (
                    <p className="text-red-600 text-xs font-bold mt-1">{passwordError}</p>
                  )}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Municipality (Tenant)</label>
                {isGlobalAdmin ? (
                  <div className="w-full px-4 py-3 bg-green-50 border-b-2 border-green-600 text-green-700 font-bold uppercase tracking-widest text-xs flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {isPasswordRequired ? 'Global Access Credentials Needed' : 'Global Access Granted'}
                  </div>
                ) : (
                  <select 
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-200 focus:border-green-600 transition-colors appearance-none outline-none font-medium text-gray-900 cursor-pointer rounded-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5rem top 50%', backgroundSize: '.65rem auto' }}
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id} disabled={t.name !== "Nkangala District Municipality"}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-start gap-1.5 mt-2 bg-blue-50/50 p-2 rounded text-[10px] text-blue-700 font-bold uppercase tracking-wider border border-blue-100">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>Configured specifically for nkangaladm.gov.za secure tenant</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 transition-all duration-200 text-xs tracking-widest mt-8 flex items-center justify-center gap-2 rounded-sm"
              >
                <KeyRound className="w-4 h-4" /> Start Manual Access
              </button>
            </form>


          </div>

          <div className="pt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-6">
            &copy; {new Date().getFullYear()} Mzansi Flow PMS<br/>
            Secure Tenant Gateway
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

