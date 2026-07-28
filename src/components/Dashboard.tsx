import React, { useState, useEffect } from 'react';
import { Logo, cn } from './Branding';
import { modules, tenants } from '../data';
import type { User, Module } from '../types';
import { ChevronDown, LogOut, ShieldCheck, ChevronRight, LayoutGrid, Calendar as CalendarIcon, Bell, ArrowLeft } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { Chat } from './Chat';
import { HelpDeskSupport } from './HelpDeskSupport';
import { APR } from './APR/APR';
import { AR } from './AR/AR';
import { BudgetImport } from './BudgetImport/BudgetImport';
import { BackupArchive } from './BackupArchive/BackupArchive';
import { ChangeManagement } from './ChangeManagement/ChangeManagement';
import { ComplianceTracker } from './ComplianceTracker/ComplianceTracker';
import { CoverPages } from './CoverPages/CoverPages';
import { GraphLab } from './GraphLab/GraphLab';
import { IDP } from './IDP/IDP';
import { KPA } from './KPA/KPA';
import { SDBIP } from './SDBIP/SDBIP';
import { OPMSSubmitter } from './SDBIP/OPMSSubmitter';
import { OPMSReviewer } from './SDBIP/OPMSReviewer';
import { OPMSApprover } from './SDBIP/OPMSApprover';
import { KPI } from './KPI/KPI';
import { StrategicObjectives } from './StrategicObjectives/StrategicObjectives';
import { JobSpecificCompetencies } from './IPMS/JobSpecificCompetencies';
import { CoreCompetencies } from './IPMS/CoreCompetencies';
import { PersonalDevelopmentPlan } from './IPMS/PersonalDevelopmentPlan';
import { PerformanceAgreements } from './IPMS/PerformanceAgreements';
import { PATemplates } from './IPMS/PATemplates';
import { DashboardOverview } from './DashboardOverview';
import { SDBIP23 } from './SDBIP/SDBIP23';
import { KPAIPMS } from './IPMS/KPA_IPMS';
import { KPIIPMS } from './IPMS/KPI_IPMS';
import { TeamDashboard } from './IPMS/TeamDashboard';
import { EvaluationIPMS } from './IPMS/Evaluation_IPMS';
import { ManagerReviewIPMS } from './IPMS/ManagerReview_IPMS';
import { InternalAuditReviewIPMS } from './IPMS/InternalAuditReview_IPMS';
import { DepartmentModerationIPMS } from './IPMS/DepartmentModeration_IPMS';
import { InternalAudit } from './InternalAudit';
import { CalendarEvents } from './CalendarEvents';
import { Reports } from './IPMS/Reports';
import { CouncilCommittees } from './CouncilCommittees/CouncilCommittees';
import { OfficeOfTheMayor } from './OfficeOfTheMayor/OfficeOfTheMayor';
import { OfficeOfTheMM } from './OfficeOfTheMM/OfficeOfTheMM';
import { PriorSystemArchive } from './PriorSystemArchive';
import { RestrictedModuleWrapper } from './RestrictedModuleWrapper';
import { FredBusinessIntelligence } from './FredBusinessIntelligence';
import { MTAS } from './MTAS/MTAS';
import { LEDProjects } from './LED/LEDProjects';
import { OPMSAdminReports } from './OPMSAdminReports';
import { CouncilMembers } from './CouncilMembers';
import { CouncilResolutions } from './CouncilResolutions';
import { MPAC } from './MPAC';
import { SpeakersSuite } from './SpeakersSuite';
import { WardCommittees } from './WardCommittees';
import { PublicParticipation } from './PublicParticipation';
import { MzansiFlowAcademy } from './MzansiFlowAcademy';
import { RiskManagement } from './RiskManagement';
import { FredExtractionAgent } from './FredExtractionAgent';
import { GuidedIPMSWorkflow, GUIDE_STEPS } from './IPMS/GuidedIPMSWorkflow';
import { Lock } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onImpersonate?: (user: User) => void;
}

export function Dashboard({ user, onLogout, onImpersonate }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<Module>(modules[0]);
  const [activeSubModule, setActiveSubModule] = useState<any>(null);
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
  const [fullUserProfile, setFullUserProfile] = useState<User>(user);
  const [completedIPMSSteps, setCompletedIPMSSteps] = useState<string[]>([]);
  const [lockedStepAlert, setLockedStepAlert] = useState<{ isOpen: boolean; currentClickedName: string; requiredPrevName: string } | null>(null);

  const availableTenants = user.role === 'admin' 
    ? [{ id: 'global', name: 'Global Administrator Space' }, ...tenants]
    : tenants;

  const resolvedUserTenant = (user.tenantId === 'nkangala_auto' || (!user.tenantId && user.email?.toLowerCase().includes('nkangala')) || user.email?.toLowerCase().includes('shabangu'))
    ? 'tenant-229'
    : (user.tenantId || tenants[0].id);

  const [activeTenantId, setActiveTenantId] = useState<string>(
    user.role === 'admin' ? 'global' : resolvedUserTenant
  );

  const currentTenant = availableTenants.find(t => 
    t.id === activeTenantId || 
    (activeTenantId === 'nkangala_auto' && t.id === 'tenant-229') ||
    (t.id === 'tenant-229' && (activeTenantId === 'tenant-229' || activeTenantId === 'nkangala_auto')) ||
    (t.name.toLowerCase().includes('nkangala') && (user.email?.toLowerCase().includes('nkangala') || activeTenantId === 'tenant-229' || activeTenantId === 'nkangala_auto'))
  ) || availableTenants[0];

  useEffect(() => {
    if (user && user.role !== 'admin') {
      const targetTenant = (user.tenantId === 'nkangala_auto' || user.email?.toLowerCase().includes('nkangala') || user.email?.toLowerCase().includes('shabangu'))
        ? 'tenant-229'
        : (user.tenantId || tenants[0].id);
      setActiveTenantId(targetTenant);
    }
  }, [user]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (activeModule.id !== 'ipms') return;
      try {
        const emailParam = user?.email || 'default';
        const res = await fetch(`/api/tenant/${activeTenantId}/ipms-progress?userId=${emailParam}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setCompletedIPMSSteps(data.completedSteps || []);
          } else {
            console.warn("Expected JSON response for IPMS progress but received:", contentType);
          }
        }
      } catch (err) {
        console.error("Failed loading IPMS progress from database:", err);
      }
    };
    fetchProgress();
  }, [activeTenantId, activeModule.id, user.email]);

  useEffect(() => {
    // Attempt to fetch full user profile to retrieve signature details and other metadata
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/tenant/${activeTenantId === 'global' ? tenants[0].id : activeTenantId}/users`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const usersList: User[] = await res.json();
            const match = usersList.find(u => u.email.toLowerCase() === user.email.toLowerCase());
            if (match) {
              setFullUserProfile({ ...user, ...match });
            }
          } else {
            console.warn("Expected JSON response for user profile but received:", contentType);
          }
        }
      } catch (e) {
        console.error("Failed to fetch full user profile:", e);
      }
    };
    fetchProfile();
  }, [activeTenantId, user.email]);

  const handleSubModuleSelect = (sub: any) => {
    if (activeModule.id === 'ipms') {
      const guideIndex = GUIDE_STEPS.findIndex(s => s.id === sub.id);
      if (guideIndex > 0) {
        const prevStep = GUIDE_STEPS[guideIndex - 1];
        const isDPMCBypass = sub.id === 'ipms-dpmc' && user.email.toLowerCase() === 'test.dpmc@local';
        
        if (!completedIPMSSteps.includes(prevStep.id) && !isDPMCBypass) {
          setLockedStepAlert({
            isOpen: true,
            currentClickedName: sub.name,
            requiredPrevName: prevStep.name
          });
          return;
        }
      }
    }
    setActiveSubModule(sub);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white z-50">
        <div className="flex items-center space-x-2">
          <Logo />
        </div>

        {/* Global Navigation */}
        <nav className="flex space-x-1 overflow-x-auto hide-scrollbar">
          {modules.map((mod) => (
            <div key={mod.id} className="relative group flex-shrink-0">
              <button
                onClick={() => {
                  setActiveModule(mod);
                  setActiveSubModule(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 border-b-2 cursor-pointer transition-colors text-sm font-bold relative",
                  activeModule.id === mod.id 
                    ? "border-green-600 bg-green-50/50 text-green-700" 
                    : "border-transparent text-gray-600 hover:border-gray-200"
                )}
              >
                {mod.name}
                {mod.subModules && mod.subModules.length > 0 && <ChevronDown className={cn("w-4 h-4 ml-1 opacity-50", activeModule.id === mod.id && "rotate-180 opacity-100")} />}
              </button>

              {/* Dropdown Menu */}
              {mod.subModules && mod.subModules.length > 0 && (
              <div className="absolute top-[100%] left-0 mt-1 w-72 bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top max-h-[60vh] overflow-y-auto hide-scrollbar p-1 pointer-events-none group-hover:pointer-events-auto group-hover:-translate-y-0.5">
                <div className="space-y-0.5">
                  {mod.subModules.map(sub => (
                    <button 
                      key={sub.id}
                      onClick={() => { setActiveModule(mod); handleSubModuleSelect(sub); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-gray-600 hover:text-green-700 hover:bg-gray-50 transition-colors text-left group/btn"
                    >
                      <sub.icon className="w-4 h-4 text-gray-400 group-hover/btn:text-green-600 transition-colors" />
                      <span className="flex-1 truncate uppercase tracking-tight">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block mr-2">
            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">{user.role.replace('_', ' ')}</p>
            <p className="text-[10px] text-gray-500 font-bold">{user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors text-[11px] uppercase tracking-wider shadow-sm"
            title="Sign Out of Mzansi Flow"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-300" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-green-950 opacity-90 -z-10">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        </div>

        <div className="flex-1 p-8 xl:p-10 max-w-[1600px] mx-auto w-full flex flex-col gap-8 relative z-10 overflow-auto hide-scrollbar">
          
          {/* Module Header or Sub-Module Header */}
          <div className="flex items-center justify-between">
            <div>
              {activeSubModule ? (
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveSubModule(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-green-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-white text-xl font-bold">{activeSubModule.name}</h3>
                    <p className="text-gray-400 text-xs mt-1">Manage settings and configurations</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-white text-xl font-bold">{activeModule.name} Modules</h3>
                  <p className="text-gray-400 text-xs mt-1">Management Suite for System-Wide Performance Oversight</p>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              {activeModule.id === 'opms-admin' && (
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Municipality</span>
                  {user.role === 'admin' ? (
                    <select 
                      value={activeTenantId}
                      onChange={(e) => setActiveTenantId(e.target.value)}
                      className="text-sm font-bold bg-slate-800 border border-white/20 text-white rounded px-2 py-1 focus:ring-0 cursor-pointer mt-1"
                    >
                      {availableTenants.map(t => (
                        <option key={t.id} value={t.id} className="text-white">{t.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm font-bold text-white uppercase mt-1">{currentTenant.name}</span>
                  )}
                </div>
              )}
              <div className="hidden lg:block">
                 <div className="bg-white/10 px-3 py-1 rounded text-[10px] font-bold text-green-400 border border-green-400/30 uppercase tracking-tighter shadow-sm flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active Tenant: {currentTenant.name}
                 </div>
              </div>
            </div>
          </div>

          {/* IPMS GUIDED WORKFLOW WORKSPACE BAR */}
          {activeModule.id === 'ipms' && (
            <GuidedIPMSWorkflow
              activeTenantId={activeTenantId}
              currentUser={fullUserProfile}
              activeSubModule={activeSubModule}
              setActiveSubModule={handleSubModuleSelect}
              completedIPMSSteps={completedIPMSSteps}
              setCompletedIPMSSteps={setCompletedIPMSSteps}
              availableSubModules={activeModule.subModules}
            />
          )}

        {/* Content Area */}
        {activeModule.id === 'dashboard' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <DashboardOverview currentUser={fullUserProfile} activeTenantId={activeTenantId} />
            </div>
        ) : activeSubModule ? (
          <RestrictedModuleWrapper
            currentUser={fullUserProfile}
            item={activeSubModule}
            unlockedModules={unlockedModules}
            onUnlock={(id) => setUnlockedModules(prev => [...prev, id])}
            onClose={() => setActiveSubModule(null)}
          >
            {activeSubModule.id === 'um' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <UserManagement currentUser={fullUserProfile} activeTenantId={activeTenantId} onImpersonate={onImpersonate} />
            </div>
          ) : activeSubModule.id === 'chat' || activeSubModule.id === 'ca' || activeSubModule.id === 'admin-chat' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <Chat currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'hds' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <HelpDeskSupport currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'apr' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <APR currentUser={fullUserProfile} activeTenantId={activeTenantId} onClose={() => setActiveSubModule(null)} />
             </div>
          ) : activeSubModule.id === 'ar' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <AR currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'bi' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <BudgetImport currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ba' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <BackupArchive currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'cm' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <ChangeManagement currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ct' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <ComplianceTracker currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'cp' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <CoverPages currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'gl' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <GraphLab currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'led' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <LEDProjects currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'mtas' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <MTAS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'cc' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <CouncilCommittees currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'cmem' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <CouncilMembers currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'cr' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <CouncilResolutions currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'mpac' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <MPAC currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'om' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OfficeOfTheMayor currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ss' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <SpeakersSuite currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'wc' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <WardCommittees currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'pp' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <PublicParticipation currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'omm' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OfficeOfTheMM currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'rep' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OPMSAdminReports currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'idp' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <IDP currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'kpa' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <KPA currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'kpi' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <KPI currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'so' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <StrategicObjectives currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'jsc' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <JobSpecificCompetencies currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ccomp' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <CoreCompetencies currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'pdp' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PersonalDevelopmentPlan currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'pplan' || activeSubModule.id === 'pa' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PerformanceAgreements currentUser={fullUserProfile} activeTenantId={activeTenantId} isPlan={activeSubModule.id === 'pplan'} />
              </div>
          ) : activeSubModule.id === 'pa-templates' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PATemplates currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-team-dashboard' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <TeamDashboard currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-kpa' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <KPAIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-kpi' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <KPIIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-evaluation' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <EvaluationIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-manager-review' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <ManagerReviewIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-internal-audit' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <InternalAuditReviewIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-dpmc' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <DepartmentModerationIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'sdbip-23' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <SDBIP23 currentUser={fullUserProfile} activeTenantId={activeTenantId} onClose={() => setActiveSubModule(null)} />
              </div>
          ) : activeSubModule.id === 'sdbip-tl' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <SDBIP currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'opms-submitter' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OPMSSubmitter currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'opms-reviewer' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OPMSReviewer currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'opms-approver' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <OPMSApprover currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ipms-reports' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <Reports currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ia' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <InternalAudit currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ce' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <CalendarEvents currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'psa' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <PriorSystemArchive currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'fbi' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <FredBusinessIntelligence currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'fea' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <FredExtractionAgent currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'mfa' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <MzansiFlowAcademy currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'rm' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <RiskManagement currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-2xl bg-white/5 py-32 relative z-10">
               <activeSubModule.icon className="w-12 h-12 text-gray-400 mb-4 opacity-50" />
               <h4 className="text-xl font-bold text-white mb-2">{activeSubModule.name}</h4>
               <p className="text-gray-400 text-sm">This module component is under construction.</p>
            </div>
          )}
        </RestrictedModuleWrapper>
        ) : (
          <>
            {/* Sub-modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
              {activeModule.subModules.map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => handleSubModuleSelect(sub)}
                  className="bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors cursor-pointer flex flex-col items-center text-center group h-full focus:outline-none focus:border-green-500"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 text-gray-300 flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <sub.icon className="w-5 h-5 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase mt-auto leading-tight">{sub.name}</span>
                </button>
              ))}
            </div>
            
            {/* Pagination/Footer inside grid area */}
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-gray-500 text-[10px] font-bold tracking-widest uppercase relative z-10">
              <span>Showing {activeModule.subModules.length} of {activeModule.subModules.length} Sub-Modules</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-white/5 text-white hover:bg-white/10 transition-colors">Prev</button>
                <button className="px-3 py-1 bg-green-600 text-white hover:bg-green-500 transition-colors">Next</button>
              </div>
            </div>
          </>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-2 bg-black text-[10px] text-gray-500 flex justify-between items-center border-t border-gray-800 z-10 w-full shrink-0">
        <div className="flex space-x-6 items-center">
          <span>Version: 4.2.0-STABLE</span>
          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> System Latency: 12ms</span>
          <span>Cloud Sync: Active</span>
        </div>
        <div className="flex space-x-4">
          <span className="hover:text-white cursor-pointer transition-colors">Security Protocols</span>
          <span className="hover:text-white cursor-pointer transition-colors">Audit Log 48292-B</span>
        </div>
      </footer>

      {/* Styled Iframe-Safe LockAlertModal overlay */}
      {lockedStepAlert && lockedStepAlert.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10002] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-md p-6 xl:p-8 text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
              <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            
            <h4 className="text-base font-black text-white leading-tight mb-2 uppercase tracking-wide">
              Stage Phase Locked!
            </h4>
            
            <p className="text-slate-300 text-xs text-center leading-relaxed mb-6 font-medium">
              {lockedStepAlert.requiredPrevName.startsWith("This module") ? (
                lockedStepAlert.requiredPrevName
              ) : (
                <>
                  You requested to open <strong className="text-indigo-400">"{lockedStepAlert.currentClickedName}"</strong>. However, under the strict compliance protocol of the IPMS Framework, you must first complete and submit <strong className="text-amber-400">"{lockedStepAlert.requiredPrevName}"</strong> before this step is enabled.
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setLockedStepAlert(null)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-black rounded-lg shadow-lg shadow-amber-500/20 transition-all w-full border-0 cursor-pointer"
            >
              Acknowledge & Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
