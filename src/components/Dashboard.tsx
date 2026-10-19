import React, { useState, useEffect } from 'react';
import { Logo, cn } from './Branding';
import { modules, tenants } from '../data';
import type { User, Module } from '../types';
import { isUserUnrestricted, isGlobalAdminEmail } from '../utils/unrestrictedHelper';
import { isUserMatch, isMasterAdminMike } from '../utils/sdbipWorkflowHelper';
import { ChevronDown, LogOut, ShieldCheck, ChevronRight, LayoutGrid, Calendar as CalendarIcon, Bell, ArrowLeft, Layers, Lock, Award } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { SharePoint } from './SharePoint';
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
import { PerformanceAgreements, DEFAULT_TECHNICAL_SERVICES_ROWS, DEFAULT_CORPORATE_SERVICES_ROWS, DEFAULT_PMS_TEAM_ROWS } from './IPMS/PerformanceAgreements';
import { DraftingSuiteFirefighters } from './IPMS/DraftingSuiteFirefighters';
import { DraftingSuiteTeam } from './IPMS/DraftingSuiteTeam';
import { PATemplates } from './IPMS/PATemplates';
import { PerformanceAssessment } from './IPMS/PerformanceAssessment';
import { ReviewTimetable } from './IPMS/ReviewTimetable';
import { DashboardOverview } from './DashboardOverview';
import { SDBIP23 } from './SDBIP/SDBIP23';
import { Organogram } from './IPMS/Organogram';
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
import { IPMSInbox } from './IPMS/IPMSInbox';
import { IPMSDemo } from './IPMS/IPMSDemo';
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
import { PerformanceMonitor } from './Admin/PerformanceMonitor';
import { AuditLogs } from './Admin/AuditLogs';
import { SystemControlPanel } from './Admin/SystemControlPanel';
import { NkangalaBackupVault } from './Admin/NkangalaBackupVault';
import { ComplianceCertificate } from './Admin/ComplianceCertificate';
import { logUserAccess } from '../utils/auditLogger';
import { RiskManagement } from './RiskManagement';
import { FredExtractionAgent } from './FredExtractionAgent';
import { FredSuite } from './FredSuite';
import { GuidedIPMSWorkflow, GUIDE_STEPS } from './IPMS/GuidedIPMSWorkflow';
import { FinancialYearModal } from './FinancialYearModal';
import { FinancialYearSwitcher } from './FinancialYearSwitcher';
import { useFinancialYear } from '../context/FinancialYearContext';
import { SupportModule } from './Support/SupportModule';

const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onImpersonate?: (user: User) => void;
}

export function Dashboard({ user, onLogout, onImpersonate }: DashboardProps) {
  const { financialYear, isPriorYear, getEffectiveYearForModule } = useFinancialYear();
  const userEmail = (user.email || '').toLowerCase().trim();
  
  // Check if session is currently impersonating another persona
  const isCurrentlyImpersonating = typeof window !== 'undefined' && 
    !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));

  // True Impersonation Rule: If impersonating, the persona strictly inherits ONLY the target user's real rights.
  // Administrator panel and command center are completely disabled when impersonating (no dual role bleed).
  const isTargetGlobalAdmin = isGlobalAdminEmail(userEmail);
  const isUnrestricted = isCurrentlyImpersonating ? false : isUserUnrestricted(user);
  
  const isCommandCenterAuthorized = isCurrentlyImpersonating 
    ? false
    : (isUnrestricted || isTargetGlobalAdmin);

  const getSavedModule = (): Module => {
    try {
      const savedModId = sessionStorage.getItem('dashboard_active_module_id') || localStorage.getItem('dashboard_active_module_id');
      if (savedModId) {
        const found = modules.find(m => m.id === savedModId);
        if (found) return found;
      }
    } catch (e) {}
    return isCommandCenterAuthorized 
      ? modules[0] 
      : (modules.find(m => m.id === 'ipms') || modules[1]);
  };

  const getSavedSubModule = (): any => {
    try {
      const savedSubModStr = sessionStorage.getItem('dashboard_active_submodule') || localStorage.getItem('dashboard_active_submodule');
      if (savedSubModStr) {
        return JSON.parse(savedSubModStr);
      }
    } catch (e) {}
    return null;
  };

  const [activeModule, setActiveModuleState] = useState<Module>(getSavedModule);
  const [activeSubModule, setActiveSubModuleState] = useState<any>(getSavedSubModule);

  const setActiveModule = (mod: Module) => {
    try {
      sessionStorage.setItem('dashboard_active_module_id', mod.id);
      localStorage.setItem('dashboard_active_module_id', mod.id);
    } catch (e) {}
    setActiveModuleState(mod);
  };

  const setActiveSubModule = (subMod: any) => {
    try {
      if (subMod) {
        sessionStorage.setItem('dashboard_active_submodule', JSON.stringify(subMod));
        localStorage.setItem('dashboard_active_submodule', JSON.stringify(subMod));
      } else {
        sessionStorage.removeItem('dashboard_active_submodule');
        localStorage.removeItem('dashboard_active_submodule');
      }
    } catch (e) {}
    setActiveSubModuleState(subMod);
  };
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
  const [fullUserProfile, setFullUserProfile] = useState<User>(user);
  const [completedIPMSSteps, setCompletedIPMSSteps] = useState<string[]>([]);
  const [lockedStepAlert, setLockedStepAlert] = useState<{ isOpen: boolean; currentClickedName: string; requiredPrevName: string } | null>(null);

  // User domain identification
  const activeUserEmail = ((fullUserProfile?.email || user.email) || '').toLowerCase().trim();
  const isNkangalaUser = activeUserEmail.endsWith('@nkangaladm.gov.za') || activeUserEmail.includes('@nkangaladm.gov.za');

  const availableTenants = user.role === 'admin' 
    ? [{ id: 'global', name: 'Global Administrator Space' }, ...tenants]
    : tenants;

  const resolvedUserTenant = (user.tenantId === 'nkangala_auto' || (!user.tenantId && user.email?.toLowerCase().includes('nkangala')) || user.email?.toLowerCase().includes('shabangu'))
    ? 'tenant-229'
    : (user.tenantId || tenants[0].id);

  const [activeTenantId, setActiveTenantId] = useState<string>(
    (user.role === 'admin' && !isCurrentlyImpersonating && !isNkangalaUser) ? 'global' : resolvedUserTenant
  );

  const currentTenant = availableTenants.find(t => 
    t.id === activeTenantId || 
    (activeTenantId === 'nkangala_auto' && t.id === 'tenant-229') ||
    (t.id === 'tenant-229' && (activeTenantId === 'tenant-229' || activeTenantId === 'nkangala_auto')) ||
    (t.name.toLowerCase().includes('nkangala') && (user.email?.toLowerCase().includes('nkangala') || activeTenantId === 'tenant-229' || activeTenantId === 'nkangala_auto'))
  ) || availableTenants[0];

  useEffect(() => {
    setFullUserProfile(user);
    if (user) {
      const isUserNkangala = Boolean(user.email?.toLowerCase().includes('nkangala') || user.email?.toLowerCase().includes('shabangu') || user.tenantId === 'nkangala_auto' || user.tenantId === 'tenant-229');
      const isImpersonatedSession = typeof window !== 'undefined' && !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));
      if (isUserNkangala) {
        setActiveTenantId('tenant-229');
      } else if (isImpersonatedSession || user.role !== 'admin') {
        setActiveTenantId(user.tenantId || tenants[0].id);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (activeModule.id !== 'ipms') return;
      try {
        const emailParam = (user?.email || 'default').toLowerCase().trim();
        const res = await fetchWithRetry(`/api/tenant/${activeTenantId}/ipms-progress?userId=${emailParam}`);
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
    // Fetch only the current user's profile rather than downloading the entire user directory
    const fetchProfile = async () => {
      if (!user?.email) return;
      try {
        const targetTenant = activeTenantId === 'global' ? tenants[0].id : activeTenantId;
        const res = await fetchWithRetry(`/api/tenant/${targetTenant}/users?q=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const usersList: User[] = await res.json();
            const match = Array.isArray(usersList)
              ? usersList.find(u => (u.email || '').toLowerCase().trim() === user.email.toLowerCase().trim())
              : null;
            if (match) {
              setFullUserProfile(prev => ({ ...prev, ...match }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch full user profile:", e);
      }
    };
    fetchProfile();
  }, [activeTenantId, user.email]);

  useEffect(() => {
    const fetchUnlocks = async () => {
      try {
        const email = (fullUserProfile?.email || user?.email || '').trim().toLowerCase();
        if (!email) return;
        const tenantToQuery = activeTenantId === 'global' ? (tenants[0]?.id || 'tenant-229') : activeTenantId;
        const res = await fetch(`/api/tenant/${tenantToQuery}/user-module-unlocks?userEmail=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.unlockedModuleIds) && data.unlockedModuleIds.length > 0) {
            setUnlockedModules(prev => Array.from(new Set([...prev, ...data.unlockedModuleIds])));
          }
        }
      } catch (e) {
        console.error("Failed to load user module unlocks:", e);
      }
    };
    fetchUnlocks();

    const handleModuleUnlocked = (evt: any) => {
      const detail = evt?.detail;
      if (detail?.unlockedModule?.id) {
        setUnlockedModules(prev => Array.from(new Set([...prev, detail.unlockedModule.id])));
      }
      fetchUnlocks();
    };

    window.addEventListener('sdbip_module_unlocked', handleModuleUnlocked);
    return () => window.removeEventListener('sdbip_module_unlocked', handleModuleUnlocked);
  }, [user.email, fullUserProfile.email, activeTenantId]);

  const [reportsUnlocked, setReportsUnlocked] = useState(false);

  // Fetch whether reports are unlocked for standard users or managers
  useEffect(() => {
    const checkReportsUnlock = async () => {
      const profileToUse = fullUserProfile || user;
      if (activeModule.id !== 'ipms' || !profileToUse || !profileToUse.email || !activeTenantId) return;

      const email = (profileToUse.email || '').toLowerCase().trim();
      const role = (profileToUse.role || '').toLowerCase().trim();
      const systemRole = (profileToUse.systemRole || '').toLowerCase().trim();
      const jobFunction = (profileToUse.jobFunction || '').toLowerCase().trim();
      const department = (profileToUse.department || '').toLowerCase().trim();

      const isAuditorUser = role.includes('auditor') || 
                            systemRole.includes('auditor') || 
                            jobFunction.includes('auditor') || 
                            role.includes('audit') || 
                            systemRole.includes('audit') || 
                            jobFunction.includes('audit') ||
                            department.includes('audit') ||
                            email === 'mike@mzansiflow.co.za' ||
                            email.endsWith('@mzansiflow.co.za');

      const isTargetManagerEmail = ['joubertm@nkangaladm.gov.za', 'magampeas@nkangaladm.gov.za', 'segamiy@nkangaladm.gov.za', 'singhn@nkangaladm.gov.za', 'tloujmt@nkangaladm.gov.za', 'fenyanep@nkangaladm.gov.za'].includes(email) || 
                                    email.includes('singhn') || email.includes('joubertm') || email.includes('magampeas') || email.includes('segamiy') || email.includes('tloujmt') || email.includes('fenyanep');

      const isManagerUser = role === 'manager' || 
                            role === 'approver' || 
                            role === 'admin' || 
                            systemRole.includes('manager') || 
                            systemRole.includes('admin') || 
                            jobFunction.includes('manager') ||
                            jobFunction.includes('director') ||
                            jobFunction.includes('head of') ||
                            jobFunction.includes('divisional manager') ||
                            email.includes('khuboni') ||
                            isTargetManagerEmail;

      const isStdUser = !isAuditorUser && !isManagerUser && profileToUse.role !== 'admin';

      if (isUnrestricted || isUserUnrestricted(profileToUse) || isAuditorUser || profileToUse.role === 'admin') {
        setReportsUnlocked(true);
        return;
      }

      if (isStdUser) {
        try {
          const tenantToUse = (activeTenantId && activeTenantId !== 'undefined' && activeTenantId !== 'null')
            ? activeTenantId
            : resolvedUserTenant;
          const res = await fetchWithRetry(`/api/tenant/${tenantToUse}/reports-unlock-status?userId=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            setReportsUnlocked(!!data?.unlocked);
          } else {
            setReportsUnlocked(false);
          }
        } catch (e) {
          setReportsUnlocked(false);
        }
      } else if (isManagerUser) {
        try {
          const tenantToUse = (activeTenantId && activeTenantId !== 'undefined' && activeTenantId !== 'null')
            ? activeTenantId
            : resolvedUserTenant;
          const res = await fetchWithRetry(`/api/tenant/${tenantToUse}/reports-unlock-status?isManager=true`);
          if (res.ok) {
            const data = await res.json();
            setReportsUnlocked(!!data?.unlocked);
          } else {
            setReportsUnlocked(false);
          }
        } catch (e) {
          setReportsUnlocked(false);
        }
      }
    };

    checkReportsUnlock();
    // Re-check periodically every 60s or when activeTenantId/activeModule/user changes
    const interval = setInterval(checkReportsUnlock, 60000);
    return () => clearInterval(interval);
  }, [activeTenantId, activeModule.id, activeUserEmail, fullUserProfile?.role, completedIPMSSteps.length]);

  const getFilteredSteps = () => {
    const profileToUse = fullUserProfile || user;
    if (!profileToUse || isUnrestricted || isUserUnrestricted(profileToUse)) return GUIDE_STEPS;

    const email = (profileToUse.email || '').toLowerCase().trim();
    const role = (profileToUse.role || '').toLowerCase().trim();
    const systemRole = (profileToUse.systemRole || '').toLowerCase().trim();
    const jobFunction = (profileToUse.jobFunction || '').toLowerCase().trim();
    const department = (profileToUse.department || '').toLowerCase().trim();

    const isAuditorUser = role.includes('auditor') || 
                          systemRole.includes('auditor') || 
                          jobFunction.includes('auditor') || 
                          role.includes('audit') || 
                          systemRole.includes('audit') || 
                          jobFunction.includes('audit') ||
                          department.includes('audit') ||
                          email === 'mike@mzansiflow.co.za' ||
                          email.endsWith('@mzansiflow.co.za');

    const isTargetManagerEmail = ['joubertm@nkangaladm.gov.za', 'magampeas@nkangaladm.gov.za', 'segamiy@nkangaladm.gov.za', 'singhn@nkangaladm.gov.za', 'tloujmt@nkangaladm.gov.za', 'fenyanep@nkangaladm.gov.za'].includes(email) || 
                                  email.includes('singhn') || email.includes('joubertm') || email.includes('magampeas') || email.includes('segamiy') || email.includes('tloujmt') || email.includes('fenyanep');

    const isManagerUser = role === 'manager' || 
                          role === 'approver' || 
                          role === 'admin' || 
                          systemRole.includes('manager') || 
                          systemRole.includes('admin') || 
                          jobFunction.includes('manager') ||
                          jobFunction.includes('director') ||
                          jobFunction.includes('head of') ||
                          jobFunction.includes('supervisor') ||
                          jobFunction.includes('lead') ||
                          jobFunction.includes('divisional manager') || 
                          email.includes('khuboni') ||
                          isTargetManagerEmail;

    const isPMSTeam = email === 'zulune@nkangaladm.gov.za' || 
                      email === 'nsibandenp@nkangaladm.gov.za' || 
                      email === 'sakisd@nkangaladm.gov.za' || 
                      email === 'lukhelema@nkangaladm.gov.za' ||
                      jobFunction.includes('pms');

    const isStdUser = !isPMSTeam && !isAuditorUser && !isManagerUser && profileToUse.role !== 'admin';

    return GUIDE_STEPS.filter(step => {
      // 1. Standard users cannot go past self evaluation (no manager approval, no internal audit)
      if (isStdUser) {
        if (step.id === 'ipms-manager-review' || step.id === 'ipms-internal-audit') {
          return false;
        }
        if (step.id === 'ipms-reports' && !reportsUnlocked) {
          return false;
        }
      }

      // 2. Managers will see up to managers approval module and not see internal audit module
      if (isManagerUser && !isAuditorUser && profileToUse.role !== 'admin') {
        if (step.id === 'ipms-internal-audit') {
          return false;
        }
        if (step.id === 'ipms-reports' && !reportsUnlocked) {
          return false;
        }
      }

      return true;
    });
  };

  const [sdbipSubmitterEmails, setSdbipSubmitterEmails] = useState<string[]>([]);
  const [sdbipApproverEmails, setSdbipApproverEmails] = useState<string[]>([]);

  useEffect(() => {
    const fetchSdbipAssignments = async () => {
      try {
        const tenantToUse = activeTenantId || 'tenant-229';
        const res = await fetch(`/api/tenant/${tenantToUse}/sdbip`);
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.items || [];
        const subSet = new Set<string>();
        const appSet = new Set<string>();
        rows.forEach((r: any) => {
          if (r.submitter) subSet.add(r.submitter);
          if (r.submitterEmail) subSet.add(r.submitterEmail);
          if (r.submitterName) subSet.add(r.submitterName);
          if (r.person) subSet.add(r.person);
          if (r.responsibleUnit) subSet.add(r.responsibleUnit);

          if (r.approver) appSet.add(r.approver);
          if (r.approverEmail) appSet.add(r.approverEmail);
          if (r.approverName) appSet.add(r.approverName);
        });
        setSdbipSubmitterEmails(Array.from(subSet));
        setSdbipApproverEmails(Array.from(appSet));
      } catch (err) {
        console.warn("Failed to load SDBIP assignments in Dashboard:", err);
      }
    };
    fetchSdbipAssignments();
  }, [activeTenantId]);

  const profileForMatching = fullUserProfile || user;
  const isSdbipSubmitter = sdbipSubmitterEmails.some(s => isUserMatch(s, profileForMatching));
  const isSdbipApprover = sdbipApproverEmails.some(a => isUserMatch(a, profileForMatching));

  const getFilteredSubModules = (mod: Module) => {
    if (!mod) return [];

    const profileToUse = fullUserProfile || user;
    const email = (profileToUse?.email || '').toLowerCase().trim();
    const fullName = (profileToUse?.fullName || (profileToUse as any)?.full_name || (profileToUse as any)?.name || '').toLowerCase().trim();
    const role = (profileToUse?.role || '').toLowerCase().trim();
    const systemRole = (profileToUse?.systemRole || '').toLowerCase().trim();
    const jobFunction = (profileToUse?.jobFunction || '').toLowerCase().trim();
    const department = (profileToUse?.department || '').toLowerCase().trim();

    const isMasterAdmin = 
      isMasterAdminMike(profileToUse) || 
      isGlobalAdminEmail(email) || 
      (email.endsWith('@mzansiflow.co.za') && !email.includes('nkangaladm'));

    const isExtractorAuthorizedUser = 
      isNkangalaUser ||
      email.endsWith('@nkangaladm.gov.za') ||
      email.includes('nkangaladm') ||
      email === 'delphine@mzansiflow.co.za' || 
      email === 'audrey@mzansiflow.co.za' || 
      email === 'mike@mzansiflow.co.za' || 
      email.endsWith('@mzansiflow.co.za');

    // All @nkangaladm.gov.za users can see and use the performance plan extractor, gm extractor, sdbip extractor and core competencies extractor
    if (mod.id === 'more' && !isExtractorAuthorizedUser) {
      const restrictedMoreIds = ['fred', 'fred-ipp', 'fred-gm', 'fred-sdbip', 'fred-ccomp', 'fred-core-competencies', 'fred-performance-plan'];
      return mod.subModules.filter(sub => !restrictedMoreIds.includes(sub.id));
    }

    // Administrator module is restricted for all @nkangaladm.gov.za users
    // The only people that can log into administrator are all @mzansiflow.co.za users
    if (mod.id === 'admin') {
      if (isNkangalaUser || !activeUserEmail.endsWith('@mzansiflow.co.za') && !activeUserEmail.includes('@mzansiflow.co.za')) {
        return [];
      }
    }

    if (mod.id === 'opms-admin' || mod.id === 'opms') {
      if (isMasterAdmin) return mod.subModules;

      const isJayvantiMorar = email === 'morarj@nkangaladm.gov.za' ||
                              email.includes('morarj') ||
                              fullName.includes('jayvanti') ||
                              (fullName.includes('morar') && !fullName.includes('morari'));

      const isNamedReviewer = !isJayvantiMorar && (
                              email === 'zulune@nkangaladm.gov.za' ||
                              email === 'khuboniy@nkangaladm.gov.za' ||
                              email === 'lukhelema@nkangaladm.gov.za' ||
                              fullName.includes('noluthando') || fullName.includes('zulu') ||
                              fullName.includes('yena') || fullName.includes('khuboni') ||
                              fullName.includes('mduduzi') || fullName.includes('lukhele'));

      const isInternalAuditUser = !isJayvantiMorar && (
                                  email === 'seeranepl@nkangaladm.gov.za' ||
                                  email === 'masemolak@nkangaladm.gov.za' ||
                                  email === 'mpanzacs@nkangaladm.gov.za' ||
                                  email.includes('audit') ||
                                  role.includes('internal audit') || role.includes('audit') ||
                                  systemRole.includes('audit') ||
                                  jobFunction.includes('internal audit') || jobFunction.includes('audit') ||
                                  department.includes('audit') ||
                                  fullName.includes('peggy') || fullName.includes('seerane') ||
                                  fullName.includes('katlego') || fullName.includes('masemola') ||
                                  fullName.includes('sthembile') || fullName.includes('mpanza'));

      const isSubmitter = isJayvantiMorar || isSdbipSubmitter;
      const isApprover = !isJayvantiMorar && isSdbipApprover;

      // Strict role resolution for OPMS workflow modules (no dual roles):
      // Jayvanti Morar is strictly restricted to Submitter only (no dual roles)
      // Designated submitters have access to Submitter module (e.g. Nompumelelo Nsibande, Jayvanti Morar)
      // Designated approvers have access to Approver module (e.g. Sibusiso Shabangu, Amos Twala)
      // Appointed PMU Reviewers have access to Reviewer module (e.g. Noluthando Zulu, Mduduzi Lukhele)
      // Appointed Internal Auditors have access to Audit module (e.g. Peggy Seerane, Katlego Masemola)
      const canAccessSubmitter = isSubmitter || isMasterAdmin;
      const canAccessApprover = !isJayvantiMorar && (isApprover || isMasterAdmin);
      const canAccessReviewer = !isJayvantiMorar && (isNamedReviewer || isMasterAdmin);
      const canAccessAuditor = !isJayvantiMorar && (isInternalAuditUser || isMasterAdmin);

      return mod.subModules.filter(sub => {
        if (sub.id === 'opms-submitter') {
          return canAccessSubmitter;
        }
        if (sub.id === 'opms-approver') {
          return canAccessApprover;
        }
        if (sub.id === 'opms-reviewer') {
          return canAccessReviewer;
        }
        if (sub.id === 'opms-audit') {
          return canAccessAuditor;
        }
        return true;
      });
    }

    if (isUnrestricted || isUserUnrestricted(fullUserProfile || user)) return mod.subModules;

    if (mod.id !== 'ipms') return mod.subModules;

    const isDPMCUser = email === 'dpmc@mzansiflow.co.za' || email === 'test.dpmc@local' || role.includes('dpmc') || systemRole.includes('dpmc') || jobFunction.includes('dpmc');

    const isAuditorUser = (email === 'audit@mzansiflow.co.za' || email === 'test.auditor@local' || 
                          role.includes('auditor') || 
                          systemRole.includes('auditor') || 
                          jobFunction.includes('auditor') || 
                          role.includes('audit') || 
                          systemRole.includes('audit') || 
                          jobFunction.includes('audit') ||
                          department.includes('audit') ||
                          email === 'mike@mzansiflow.co.za') && 
                          email !== 'user@mzansiflow.co.za' && 
                          email !== 'manager@mzansiflow.co.za' && 
                          email !== 'dpmc@mzansiflow.co.za';

    const isTargetManagerEmail = ['joubertm@nkangaladm.gov.za', 'magampeas@nkangaladm.gov.za', 'segamiy@nkangaladm.gov.za', 'singhn@nkangaladm.gov.za', 'tloujmt@nkangaladm.gov.za', 'fenyanep@nkangaladm.gov.za'].includes(email) || 
                                  email.includes('singhn') || email.includes('joubertm') || email.includes('magampeas') || email.includes('segamiy') || email.includes('tloujmt') || email.includes('fenyanep');

    const isManagerUser = (email === 'manager@mzansiflow.co.za' || email === 'test.manager@local' ||
                          Boolean((profileToUse as any)?.hasSubordinates) ||
                          role === 'manager' || 
                          role === 'approver' || 
                          role === 'admin' || 
                          systemRole.includes('manager') || 
                          systemRole.includes('admin') || 
                          jobFunction.includes('manager') ||
                          jobFunction.includes('director') ||
                          jobFunction.includes('head of') ||
                          jobFunction.includes('supervisor') ||
                          jobFunction.includes('lead') ||
                          jobFunction.includes('divisional manager') || 
                          email.includes('khuboni') ||
                          isTargetManagerEmail) &&
                          email !== 'user@mzansiflow.co.za' && 
                          email !== 'audit@mzansiflow.co.za' && 
                          email !== 'dpmc@mzansiflow.co.za';

    const isPMSTeam = email === 'zulune@nkangaladm.gov.za' || 
                      email === 'nsibandenp@nkangaladm.gov.za' || 
                      email === 'sakisd@nkangaladm.gov.za' || 
                      email === 'lukhelema@nkangaladm.gov.za' ||
                      jobFunction.includes('pms');

    const isStdUser = email === 'user@mzansiflow.co.za' || (!isPMSTeam && !isAuditorUser && !isManagerUser && !isDPMCUser && profileToUse?.role !== 'admin');

    return mod.subModules.filter(sub => {
      // Extractor modules (Performance Plan, GM, SDBIP, Core Competencies) are visible to all @nkangaladm.gov.za users
      const extractorIds = ['fred', 'fred-ipp', 'fred-gm', 'fred-sdbip', 'fred-ccomp', 'fred-core-competencies', 'fred-performance-plan'];
      if (extractorIds.includes(sub.id)) {
        return true;
      }

      // Specific 3 modules requested ONLY for dimpems@nkangaladm.gov.za profile
      if (sub.id === 'team-pplan-2' || sub.id === 'team-pdp-2' || sub.id === 'team-jsc-2') {
        return email === 'dimpems@nkangaladm.gov.za' || email.includes('dimpems');
      }

      // Demo module is always directly visible to all users
      if (sub.id === 'ipms-demo') {
        return true;
      }

      // DPMC module visible to DPMC members and Admins
      if (sub.id === 'ipms-dpmc') {
        return isDPMCUser || isAuditorUser || profileToUse?.role === 'admin' || user.role === 'admin';
      }

      // 0. Team Dashboard is strictly reserved for managers and line management
      if (sub.id === 'ipms-team-dashboard') {
        if (isStdUser) {
          return false;
        }
      }

      // 1. Standard users cannot go past self evaluation
      if (isStdUser) {
        if (sub.id === 'ipms-manager-review' || sub.id === 'ipms-internal-audit' || sub.id === 'ipms-dpmc') {
          return false;
        }
      }

      // 2. Managers will see up to managers approval module and not see internal audit module
      if (isManagerUser && !isAuditorUser && profileToUse?.role !== 'admin') {
        if (sub.id === 'ipms-internal-audit' || sub.id === 'ipms-dpmc') {
          return false;
        }
      }

      // 3. Internal Audit Oversight is strictly restricted to internal auditors and global/systems admins
      if (sub.id === 'ipms-internal-audit') {
        const isAuthorizedAuditor = isAuditorUser || 
          user.role === 'admin' || 
          user.systemRole === 'Global Administrator' || 
          user.systemRole === 'Systems Administrator' ||
          user.systemRole === 'admin';
        if (!isAuthorizedAuditor) {
          return false;
        }
      }

      // Reports visibility filter:
      if (sub.id === 'ipms-reports') {
        if (isStdUser || (isManagerUser && !isAuditorUser && profileToUse?.role !== 'admin')) {
          return reportsUnlocked;
        }
      }

      return true;
    });
  };

  const isMzansiFlowUser = activeUserEmail.endsWith('@mzansiflow.co.za') || activeUserEmail.includes('@mzansiflow.co.za');
  const canAccessAdministrator = !isNkangalaUser && isMzansiFlowUser;

  const handleSubModuleSelect = (sub: any) => {
    // Extractor modules are accessible to all @nkangaladm.gov.za users, delphine, audrey, and mzansiflow users
    if ((activeModule.id === 'more' || activeModule.id === 'ipms')) {
      const restrictedMoreIds = ['fred', 'fred-ipp', 'fred-gm', 'fred-sdbip', 'fred-ccomp', 'fred-core-competencies', 'fred-performance-plan'];
      const isExtractorAuthorizedUser = 
        isNkangalaUser ||
        activeUserEmail.endsWith('@nkangaladm.gov.za') ||
        activeUserEmail.includes('nkangaladm') ||
        activeUserEmail === 'delphine@mzansiflow.co.za' || 
        activeUserEmail === 'audrey@mzansiflow.co.za' || 
        activeUserEmail === 'mike@mzansiflow.co.za' || 
        activeUserEmail.endsWith('@mzansiflow.co.za');
      if (restrictedMoreIds.includes(sub.id) && !isExtractorAuthorizedUser) {
        return;
      }
    }

    // Administrator module is strictly restricted for all @nkangaladm.gov.za users
    if (activeModule.id === 'admin' && !canAccessAdministrator) {
      return;
    }

    if (activeModule.id === 'ipms') {
      const profileToUse = fullUserProfile || user;
      const email = (profileToUse?.email || '').toLowerCase().trim();
      const role = (profileToUse?.role || '').toLowerCase().trim();
      const systemRole = (profileToUse?.systemRole || '').toLowerCase().trim();
      const jobFunction = (profileToUse?.jobFunction || '').toLowerCase().trim();
      
      const isGlobalOrSystemAdmin = role === 'admin' || systemRole === 'global administrator' || systemRole === 'systems administrator' || email.includes('massivedynamixdistributors.com');
      const isPMSTeam = email === 'zulune@nkangaladm.gov.za' || 
                        email === 'nsibandenp@nkangaladm.gov.za' || 
                        email === 'sakisd@nkangaladm.gov.za' || 
                        email === 'lukhelema@nkangaladm.gov.za' ||
                        jobFunction.includes('pms');
      const isTargetManagerEmail = ['joubertm@nkangaladm.gov.za', 'magampeas@nkangaladm.gov.za', 'segamiy@nkangaladm.gov.za', 'singhn@nkangaladm.gov.za', 'tloujmt@nkangaladm.gov.za', 'fenyanep@nkangaladm.gov.za'].includes(email) || 
                                    email.includes('singhn') || email.includes('joubertm') || email.includes('magampeas') || email.includes('segamiy') || email.includes('tloujmt') || email.includes('fenyanep');
      const isManagerUser = role === 'manager' || 
                            role === 'approver' || 
                            role === 'admin' || 
                            systemRole.includes('manager') || 
                            systemRole.includes('admin') || 
                            jobFunction.includes('manager') ||
                            jobFunction.includes('director') ||
                            jobFunction.includes('head of') ||
                            jobFunction.includes('supervisor') ||
                            jobFunction.includes('lead') ||
                            jobFunction.includes('divisional manager') || 
                            email.includes('khuboni') ||
                            isTargetManagerEmail ||
                            email.includes('mike@massivedynamixdistributors.com');

      const isDirectAccess = sub.id === 'ipms-demo' || sub.id === 'ipms-evaluation' || sub.id === 'pplan' || sub.id === 'team-pplan' || sub.id === 'team-pplan-2' || sub.id === 'pdp' || sub.id === 'team-pdp' || sub.id === 'team-pdp-2' || sub.id === 'pa' || sub.id === 'pa-cds-team' || sub.id === 'pa-technical-services' || sub.id === 'pa-corporate-services' || sub.id === 'pa-pms-team' || sub.id === 'pa-templates' || sub.id === 'jsc' || sub.id === 'team-jsc' || sub.id === 'team-jsc-2' || sub.id === 'ccomp' || sub.id === 'fred-ccomp' || sub.id === 'fred-core-competencies' || sub.id === 'fred' || sub.id === 'fred-ipp' || sub.id === 'fred-gm' || sub.id === 'fred-sdbip' || sub.id === 'ipms-kpi' || sub.id === 'ipms-kpa' || sub.id === 'organogram' || sub.id === 'ipms-inbox' || sub.id === 'review-timetable' || sub.id === 'performance-assessment';
      const isBypassAll = isNkangalaUser || isUnrestricted || isUserUnrestricted(profileToUse) || isGlobalOrSystemAdmin || isPMSTeam || isManagerUser || isDirectAccess;

      if (!isBypassAll) {
        const filteredSteps = getFilteredSteps();
        const guideIndex = filteredSteps.findIndex(s => s.id === sub.id);
        if (guideIndex > 0) {
          const prevStep = filteredSteps[guideIndex - 1];
          const isDPMCBypass = sub.id === 'ipms-dpmc' && user.email.toLowerCase() === 'test.dpmc@local';
          const isManagerBypass = sub.id === 'ipms-manager-review';
          
          if (prevStep && prevStep.id === 'ipms-manager-review') {
            if (guideIndex - 2 >= 0) {
              const stepBeforePrev = filteredSteps[guideIndex - 2];
              if (stepBeforePrev && !completedIPMSSteps.includes(stepBeforePrev.id)) {
                setLockedStepAlert({
                  isOpen: true,
                  currentClickedName: sub.name,
                  requiredPrevName: stepBeforePrev.name
                });
                return;
              }
            }
          } else if (!completedIPMSSteps.includes(prevStep.id) && !isDPMCBypass && !isManagerBypass) {
            setLockedStepAlert({
              isOpen: true,
              currentClickedName: sub.name,
              requiredPrevName: prevStep.name
            });
            return;
          }
        }
      }
    }
    setActiveSubModule(sub);
    
    // Log user sub-module access to Supabase in real-time (excludes mike@mzansiflow.co.za)
    if (fullUserProfile && fullUserProfile.email) {
      logUserAccess({
        email: fullUserProfile.email,
        fullName: fullUserProfile.fullName,
        tenantId: activeTenantId || fullUserProfile.tenantId,
        role: fullUserProfile.role || fullUserProfile.systemRole,
        department: fullUserProfile.department,
        action: 'Sub-Module Navigation',
        moduleId: activeModule.id,
        moduleName: activeModule.name,
        subModuleId: sub.id,
        subModuleName: sub.name,
        details: `User navigated to ${sub.name} in ${activeModule.name}`
      }).catch(() => {});
    }
  };

  const isSystemsOrGlobalAdmin = isCurrentlyImpersonating
    ? false
    : (
        canAccessAdministrator && (
          isUnrestricted ||
          isTargetGlobalAdmin ||
          user.role === 'admin' || 
          user.systemRole === 'Global Administrator' || 
          user.systemRole === 'Systems Administrator'
        )
      );

  const displayedModules = modules.filter(mod => {
    if (mod.id === 'dashboard') {
      return isCommandCenterAuthorized;
    }
    if (mod.id === 'admin') {
      // Administrator module is strictly restricted for all @nkangaladm.gov.za users
      // Only @mzansiflow.co.za users can access/log into Administrator
      return canAccessAdministrator;
    }
    return true;
  });

  useEffect(() => {
    if (activeModule && activeModule.id === 'dashboard' && !isCommandCenterAuthorized) {
      setActiveModule(modules.find(m => m.id === 'ipms') || modules[1]);
    }
    if (activeModule && activeModule.id === 'admin' && !canAccessAdministrator) {
      setActiveModule(displayedModules.find(m => m.id === 'ipms') || displayedModules[0] || modules[1]);
      setActiveSubModule(null);
    }
    // In IPMS, remove the authorization failed banner by ensuring activeSubModule is not 'um'
    if (activeModule && activeModule.id === 'ipms' && activeSubModule && activeSubModule.id === 'um') {
      setActiveSubModule(null);
    }
  }, [activeModule, activeSubModule, isCommandCenterAuthorized, canAccessAdministrator]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-100">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white text-slate-900 z-50 shadow-xs">
        <div className="flex items-center space-x-2">
          <Logo isDashboardMenu={true} />
        </div>

        {/* Global Navigation */}
        <nav className="flex space-x-1 overflow-x-auto hide-scrollbar">
          {displayedModules.map((mod) => (
            <div key={mod.id} className="relative group flex-shrink-0">
              <button
                onClick={() => {
                  setActiveModule(mod);
                  setActiveSubModule(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 border-b-2 cursor-pointer transition-colors text-sm font-bold relative",
                  activeModule.id === mod.id 
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                {mod.name}
                {getFilteredSubModules(mod).length > 0 && <ChevronDown className={cn("w-4 h-4 ml-1 opacity-60", activeModule.id === mod.id && "rotate-180 opacity-100")} />}
              </button>

              {/* Dropdown Menu */}
              {getFilteredSubModules(mod).length > 0 && (
              <div className="absolute top-[100%] left-0 mt-1 w-72 border border-slate-200 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top max-h-[60vh] overflow-y-auto hide-scrollbar p-1 pointer-events-none group-hover:pointer-events-auto group-hover:-translate-y-0.5 rounded-xl">
                <div className="space-y-0.5">
                  {getFilteredSubModules(mod).map(sub => (
                    <button 
                      key={sub.id}
                      onClick={() => { setActiveModule(mod); handleSubModuleSelect(sub); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold transition-colors text-left group/btn rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    >
                      <sub.icon className="w-4 h-4 transition-colors text-slate-500 group-hover/btn:text-emerald-600" />
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
            <p className="text-[11px] font-black uppercase tracking-widest leading-none text-slate-900">
              {user.isReadOnly || user.email?.toLowerCase() === 'sivend@mzansiflow.co.za' ? 'READ-ONLY USER' : user.role.replace('_', ' ')}
            </p>
            <p className="text-[10px] font-bold text-slate-500">{user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors text-[11px] uppercase tracking-wider shadow-xs cursor-pointer border bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800"
            title="Sign Out of Mzansi Flow"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-600" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Mandatory Financial Year Selection Lightbox Modal */}
      <FinancialYearModal />

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 -z-10 bg-slate-950 opacity-100">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        </div>

        <div className="flex-1 p-8 xl:p-10 max-w-[1600px] mx-auto w-full flex flex-col gap-8 relative z-10 overflow-auto hide-scrollbar">
          
          {/* Module Header or Sub-Module Header */}
          <div className="flex items-center justify-between">
            <div>
              {activeSubModule ? (
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveSubModule(null)} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-white">{activeSubModule.name}</h3>
                    <p className="text-xs mt-1 text-slate-400">Manage settings and configurations</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white">{activeModule.name} Modules</h3>
                  <p className="text-xs mt-1 text-slate-400">Management Suite for System-Wide Performance Oversight</p>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-2xl shadow-sm border bg-slate-900 border-slate-800">
                <FinancialYearSwitcher />
              </div>

              {activeModule.id === 'opms-admin' && (
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Municipality</span>
                  {user.role === 'admin' ? (
                    <select 
                      value={activeTenantId}
                      onChange={(e) => setActiveTenantId(e.target.value)}
                      className="text-sm font-bold rounded px-2.5 py-1 focus:ring-0 cursor-pointer mt-1 border transition-colors bg-slate-900 border-slate-700 text-white"
                    >
                      {availableTenants.map(t => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm font-bold uppercase mt-1 text-white">{currentTenant.name}</span>
                  )}
                </div>
              )}
              <div className="hidden lg:block">
                 <div className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter shadow-sm flex items-center gap-1.5 border bg-slate-900 text-emerald-400 border-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active Tenant: {currentTenant.name}
                 </div>
              </div>
              {activeModule.id === 'ipms' && isNkangalaUser && (
                <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>IPMS Unlocked</span>
                </div>
              )}
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
              availableSubModules={getFilteredSubModules(activeModule)}
            />
          )}

        {/* Content Area */}
        {activeModule.id === 'dashboard' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <DashboardOverview currentUser={fullUserProfile} activeTenantId={activeTenantId} />
            </div>
        ) : (activeSubModule && !(activeModule.id === 'ipms' && activeSubModule.id === 'um')) ? (
          <RestrictedModuleWrapper
            currentUser={fullUserProfile}
            item={activeSubModule}
            unlockedModules={unlockedModules}
            onUnlock={(id) => setUnlockedModules(prev => [...prev, id])}
            onClose={() => setActiveSubModule(null)}
          >
            {activeSubModule.id === 'perf' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <PerformanceMonitor currentUser={fullUserProfile} activeTenantId={activeTenantId} />
            </div>
          ) : activeSubModule.id === 'al' || activeSubModule.id === 'slat' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <AuditLogs currentUser={fullUserProfile} activeTenantId={activeTenantId} />
            </div>
          ) : activeSubModule.id === 'um' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <UserManagement 
                currentUser={fullUserProfile} 
                activeTenantId={activeTenantId} 
                onImpersonate={onImpersonate} 
                onNavigateToCommandCenter={() => {
                  setActiveModule(modules[0]);
                  setActiveSubModule(null);
                  window.dispatchEvent(new CustomEvent('command-center-force-refresh'));
                }}
              />
            </div>
          ) : activeSubModule.id === 'scp' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <SystemControlPanel 
                currentUser={fullUserProfile} 
                activeTenantId={activeTenantId} 
                onImpersonate={onImpersonate}
                onNavigateToCommandCenter={() => {
                  setActiveModule(modules[0]);
                  setActiveSubModule(null);
                  window.dispatchEvent(new CustomEvent('command-center-force-refresh'));
                }}
              />
            </div>
          ) : activeSubModule.id === 'compliance-cert' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <ComplianceCertificate
                currentUser={fullUserProfile}
                activeTenantId={activeTenantId}
              />
            </div>
          ) : activeSubModule.id === 'backups' ? (
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
              <NkangalaBackupVault
                currentUser={fullUserProfile}
                activeTenantId={activeTenantId}
                onImpersonate={onImpersonate}
              />
            </div>
          ) : activeSubModule.id === 'sharepoint' || activeSubModule.id === 'sharepoint-drives' || activeSubModule.id === 'sharepoint-nkangala' || activeSubModule.id === 'sharepoint-mzansiflow' || activeSubModule.id === 'chat' || activeSubModule.id === 'ca' || activeSubModule.id === 'hds' || activeSubModule.id === 'admin-chat' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <SharePoint
                  currentUser={fullUserProfile}
                  activeTenantId={activeTenantId}
                  initialFolderId={
                    activeSubModule.id === 'sharepoint-nkangala'
                      ? 'folder_nkangala_root'
                      : activeSubModule.id === 'sharepoint-mzansiflow'
                      ? 'folder_mzansiflow_root'
                      : null
                  }
                />
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
          ) : activeSubModule.id === 'jsc' || activeSubModule.id === 'team-jsc' || activeSubModule.id === 'team-jsc-2' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <JobSpecificCompetencies 
                   currentUser={fullUserProfile} 
                   activeTenantId={activeTenantId} 
                   isTeamJSC={activeSubModule.id === 'team-jsc'} 
                   isTeamJSC2={activeSubModule.id === 'team-jsc-2'} 
                 />
              </div>
          ) : activeSubModule.id === 'ccomp' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <CoreCompetencies 
                   currentUser={fullUserProfile} 
                   activeTenantId={activeTenantId} 
                   onNavigateToSubModule={(subId) => {
                     const ipmsModule = modules.find(m => m.id === 'ipms');
                     if (ipmsModule) {
                       const targetSub = ipmsModule.subModules?.find(s => s.id === (subId || 'fred-ccomp')) || { id: subId || 'fred-ccomp', name: 'Fred - Core Competencies Extractor', icon: Award };
                       setActiveModule(ipmsModule);
                       handleSubModuleSelect(targetSub);
                     }
                   }}
                 />
              </div>
          ) : activeSubModule.id === 'pdp' || activeSubModule.id === 'team-pdp' || activeSubModule.id === 'team-pdp-2' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PersonalDevelopmentPlan 
                   currentUser={fullUserProfile} 
                   activeTenantId={activeTenantId} 
                   isTeamPdp={activeSubModule.id === 'team-pdp'} 
                   isTeamPdp2={activeSubModule.id === 'team-pdp-2'} 
                 />
              </div>
          ) : activeSubModule.id === 'pplan' || activeSubModule.id === 'team-pplan' || activeSubModule.id === 'team-pplan-2' || activeSubModule.id === 'pa' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PerformanceAgreements 
                   currentUser={fullUserProfile} 
                   activeTenantId={activeTenantId} 
                   isPlan={activeSubModule.id === 'pplan' || activeSubModule.id === 'team-pplan' || activeSubModule.id === 'team-pplan-2'} 
                   isTeamPlan={activeSubModule.id === 'team-pplan'}
                   isTeamPlan2={activeSubModule.id === 'team-pplan-2'}
                 />
              </div>
          ) : activeSubModule.id === 'pa-cds-team' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <DraftingSuiteFirefighters currentUser={fullUserProfile as any} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'pa-technical-services' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <DraftingSuiteTeam 
                   currentUser={fullUserProfile as any} 
                   activeTenantId={activeTenantId} 
                   teamTitle="Technical Services Team"
                   documentIdSuffix="technical_services"
                   defaultRows={DEFAULT_TECHNICAL_SERVICES_ROWS}
                 />
              </div>
          ) : activeSubModule.id === 'pa-corporate-services' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <DraftingSuiteTeam 
                   currentUser={fullUserProfile as any} 
                   activeTenantId={activeTenantId} 
                   teamTitle="Corporate Services Team"
                   documentIdSuffix="corporate_services"
                   defaultRows={DEFAULT_CORPORATE_SERVICES_ROWS}
                 />
              </div>
          ) : activeSubModule.id === 'pa-pms-team' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <DraftingSuiteTeam 
                   currentUser={fullUserProfile as any} 
                   activeTenantId={activeTenantId} 
                   teamTitle="PMS Team"
                   documentIdSuffix="pms_team"
                   defaultRows={DEFAULT_PMS_TEAM_ROWS}
                 />
              </div>
          ) : activeSubModule.id === 'pa-templates' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PATemplates currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'performance-assessment' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <PerformanceAssessment currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'review-timetable' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <ReviewTimetable currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-team-dashboard' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <TeamDashboard currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'organogram' || activeSubModule.id === 'ipms-organogram' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <Organogram currentUser={fullUserProfile} activeTenantId={activeTenantId} onClose={() => setActiveSubModule(null)} />
              </div>
          ) : activeSubModule.id === 'ipms-kpa' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <KPAIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-kpi' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <KPIIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} />
              </div>
          ) : activeSubModule.id === 'ipms-evaluation' || activeSubModule.id === 'team-evaluation' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <EvaluationIPMS currentUser={fullUserProfile} activeTenantId={activeTenantId} isTeamEvaluation={activeSubModule.id === 'team-evaluation'} />
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
          ) : activeSubModule.id === 'opms-audit' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <InternalAudit currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ipms-reports' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <Reports currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ipms-inbox' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <IPMSInbox currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'ipms-demo' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <IPMSDemo 
                   currentUser={fullUserProfile} 
                   activeTenantId={activeTenantId} 
                   onImpersonate={onImpersonate}
                   onNavigateToSubModule={(subId: string) => {
                     const ipmsModule = modules.find(m => m.id === 'ipms');
                     if (ipmsModule) {
                       const targetSub = ipmsModule.subModules?.find(s => s.id === subId);
                       if (targetSub) {
                         setActiveModule(ipmsModule);
                         handleSubModuleSelect(targetSub);
                       }
                     }
                   }}
                />
             </div>
          ) : activeSubModule.id === 'fred' || activeSubModule.id === 'fred-ipp' || activeSubModule.id === 'fred-gm' || activeSubModule.id === 'fred-performance-plan' || activeSubModule.id === 'fred-sdbip' || activeSubModule.id === 'fred-ccomp' || activeSubModule.id === 'fred-core-competencies' ? (
              <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                 <FredSuite 
                    currentUser={fullUserProfile} 
                    activeTenantId={activeTenantId} 
                    initialSubModule={activeSubModule.id === 'fred-sdbip' ? 'sdbip' : activeSubModule.id === 'fred-gm' ? 'gm-extractor' : (activeSubModule.id === 'fred-ccomp' || activeSubModule.id === 'fred-core-competencies') ? 'core-competencies' : 'performance-plan'}
                    onNavigateToIPMS={(subId) => {
                      const ipmsModule = modules.find(m => m.id === 'ipms');
                      if (ipmsModule) {
                        const normalizedSubId = (!subId || subId === 'appg') ? 'pplan' : subId;
                        const targetSub = ipmsModule.subModules?.find(s => s.id === normalizedSubId) || { id: 'pplan', name: 'Performance Plan', icon: Layers };
                        setActiveModule(ipmsModule);
                        handleSubModuleSelect(targetSub);
                      }
                    }}
                    onNavigateToSDBIP={(tab) => {
                      if (tab) {
                        sessionStorage.setItem('sdbip_active_tab', tab);
                      }
                      const opmsModule = modules.find(m => m.id === 'opms-admin' || m.id === 'opms');
                      if (opmsModule) {
                        const sdbipSub = opmsModule.subModules?.find(s => s.id === 'sdbip-tl') || { id: 'sdbip-tl', name: 'SDBIP Top Layer', icon: Layers };
                        setActiveModule(opmsModule);
                        handleSubModuleSelect(sdbipSub);
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('sdbip:switch_tab', { detail: { tab, refresh: true } }));
                        }, 100);
                      }
                    }}
                 />
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
          ) : activeSubModule.id === 'fbi' || activeSubModule.id === 'fea' ? (
              <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative z-10 p-12 text-center flex flex-col items-center justify-center text-slate-300">
                 <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl max-w-md">
                   <h3 className="text-xl font-bold text-rose-400 mb-2">Fred AI Extraction Disabled</h3>
                   <p className="text-sm text-slate-400">The Fred AI Extraction Agent and Fred Business Intelligence have been disabled to ensure 100% manual control over KPI data without automated background alterations.</p>
                 </div>
              </div>
           ) : activeSubModule.id === 'mfa' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <MzansiFlowAcademy currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'rm' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <RiskManagement currentUser={fullUserProfile} activeTenantId={activeTenantId} />
             </div>
          ) : activeSubModule.id === 'support-chat' || activeSubModule.id === 'support-tickets' || activeSubModule.id === 'tl' ? (
             <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <SupportModule
                  currentUser={fullUserProfile}
                  activeTenantId={activeTenantId}
                  initialSubModuleId={activeSubModule.id}
                />
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-2xl bg-white/5 py-32 relative z-10">
               <activeSubModule.icon className="w-12 h-12 text-gray-400 mb-4 opacity-50" />
               <h4 className="text-xl font-bold text-white mb-2">{activeSubModule.name}</h4>
               <p className="text-gray-400 text-sm">This module component is under construction.</p>
            </div>
          )}
        </RestrictedModuleWrapper>
        ) : activeModule.id === 'support' ? (
          <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
            <SupportModule
              currentUser={fullUserProfile}
              activeTenantId={activeTenantId}
              initialSubModuleId={null}
            />
          </div>
        ) : activeModule.id === 'sharepoint' ? (
          <div className="flex-1 min-h-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl relative z-10">
            <SharePoint currentUser={fullUserProfile} activeTenantId={activeTenantId} />
          </div>
        ) : (
          <>
            {/* Sub-modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
              {getFilteredSubModules(activeModule).map(sub => (
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
              <span>Showing {getFilteredSubModules(activeModule).length} of {getFilteredSubModules(activeModule).length} Sub-Modules</span>
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
