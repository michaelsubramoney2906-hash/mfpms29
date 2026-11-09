import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Trash2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Info,
  Shield,
  Layers,
  FileSpreadsheet,
  Edit3,
  User as UserIcon,
  Users,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import type { User } from '../types';
import {
  extractIppFromDocument,
  ensureNedaPerformancePlanKpis,
  type ExtractedMappedKPI,
  type ExtractedKpaDefinition
} from '../utils/ippParser';
import { TEAM_MODULE_CONFIGS } from './IPMS/teamPADefaults';

const DEPARTMENT_TEAM_GROUPS: { key: 'cds' | 'technical_services' | 'corporate_services' | 'pms_team'; label: string }[] = [
  { key: 'cds', label: 'CDS (Community & Disaster Services) — Teams 1 to 10' },
  { key: 'technical_services', label: 'Technical Services — Teams 1 to 10' },
  { key: 'corporate_services', label: 'Corporate Services — Teams 1 to 10' },
  { key: 'pms_team', label: 'PMS Team — Teams 1 to 10' }
];

export const NEDA_ALLOWED_RECIPIENTS = [
  {
    email: 'ChaukeNH@nkangaladm.gov.za',
    fullName: 'N.H. Chauke',
    jobFunction: 'Senior Manager / Executive Official',
    department: 'NEDA Executive Office'
  },
  {
    email: 'SehlakoLS@neda.gov.za',
    fullName: 'Lekgotla Samuel Sehlako',
    jobFunction: 'Manager: Supply Chain Management',
    department: 'Supply Chain Management'
  },
  {
    email: 'ChaukeKC@neda.gov.za',
    fullName: 'Kulani Collen Chauke',
    jobFunction: 'Chief Financial Officer',
    department: 'Finance and Administration'
  },
  {
    email: 'manganijp@nkangaladm.gov.za',
    fullName: 'Johan Prince Mangani',
    jobFunction: 'Acting Chief Executive Officer',
    department: 'Office of the Chief Executive Officer'
  }
];

interface FredPerformancePlanExtractorProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
}

export function FredPerformancePlanExtractor({
  currentUser,
  activeTenantId,
  onNavigateToIPMS
}: FredPerformancePlanExtractorProps) {
  // Helper to resolve the initial target employee to one of the 4 approved NEDA users
  const resolveApprovedNedaUser = (email?: string) => {
    if (!email) return NEDA_ALLOWED_RECIPIENTS[3]; // default to ManganiJP
    const clean = email.toLowerCase().trim();
    const found = NEDA_ALLOWED_RECIPIENTS.find(u => {
      const uEmail = u.email.toLowerCase().trim();
      return uEmail === clean ||
        (clean.includes('mangani') && uEmail.includes('mangani')) ||
        (clean.includes('chaukekc') && uEmail.includes('chaukekc')) ||
        (clean.includes('chaukenh') && uEmail.includes('chaukenh')) ||
        (clean.includes('sehlako') && uEmail.includes('sehlako'));
    });
    return found || NEDA_ALLOWED_RECIPIENTS[3];
  };

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMappedKPI[]>([]);
  const [extractedKpas, setExtractedKpas] = useState<ExtractedKpaDefinition[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKpa, setFilterKpa] = useState<string>('all');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  // State for Azure AD directory users
  const [azureUsers, setAzureUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [targetEmployeeEmail, setTargetEmployeeEmail] = useState<string>(currentUser?.email || 'manganijp@nkangaladm.gov.za');
  const [selectedTargetUser, setSelectedTargetUser] = useState<any>(currentUser);
  const [selectedPlanDestination, setSelectedPlanDestination] = useState<string>('team-1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all directory users across Nkangala & NEDA
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      try {
        const [resNkangala, resNeda] = await Promise.all([
          fetch(`/api/tenant/tenant-229/users`),
          fetch(`/api/tenant/neda/users`)
        ]);
        let combined: any[] = [];
        if (resNkangala.ok) {
          const d = await resNkangala.json();
          if (Array.isArray(d)) combined = [...combined, ...d];
        }
        if (resNeda.ok) {
          const d = await resNeda.json();
          if (Array.isArray(d)) combined = [...combined, ...d];
        }
        const map = new Map<string, any>();
        combined.forEach(u => {
          const em = (u.email || '').toLowerCase().trim();
          if (em && !map.has(em)) map.set(em, u);
        });
        if (active) {
          const list = Array.from(map.values());
          setAzureUsers(list);
          const currentClean = (currentUser?.email || '').toLowerCase().trim();
          const match = list.find(u => (u.email || '').toLowerCase().trim() === currentClean);
          if (match) {
            setSelectedTargetUser(match);
            setTargetEmployeeEmail(match.email);
          }
        }
      } catch (e) {
        console.warn("Error fetching Azure AD users:", e);
      }
    };
    fetchUsers();
    return () => { active = false; };
  }, [currentUser]);

  // Load existing extraction snapshot if available
  useEffect(() => {
    setExtractedItems([]);
    setExtractedKpas([]);
    setSourceFileName('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const loadSavedSnapshot = async () => {
      try {
        const targetEmail = (targetEmployeeEmail || currentUser?.email || '').toLowerCase().trim();
        if (!targetEmail) return;
        const effectiveTenantId = (targetEmail.endsWith('@neda.gov.za') || targetEmail.includes('neda.gov.za')) ? 'neda' : 'tenant-229';
        const res = await fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data.data;
          if (items && Array.isArray(items) && items.length > 0) {
            setExtractedItems(items.map((it: any, idx: number) => ({
              ...it,
              _id: it._id || `ipp-item-${idx}-${Date.now()}`,
              _selected: it._selected !== false
            })));
            if (data.kpas && Array.isArray(data.kpas)) {
              setExtractedKpas(data.kpas);
            }
            if (data.fileName || data.sourceFileName) {
              setSourceFileName(data.fileName || data.sourceFileName);
            }
          }
        }
      } catch (err) {
        // Silent fail on initial load
      }
    };
    loadSavedSnapshot();
  }, [targetEmployeeEmail, currentUser.email]);

  // Handle File Upload & Extraction
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsExtracting(true);
    setStatusMessage({
      type: 'info',
      text: `Processing Performance Agreement "${file.name}"... Parsing Functional KPAs & Scorecard KPIs verbatim.`
    });

    try {
      const result = await extractIppFromDocument(file, activeTenantId);
      
      if (!result.items || result.items.length === 0) {
        throw new Error('No performance plan items could be found in the uploaded agreement. Please verify the document contains an Annexure A Performance Plan scorecard table.');
      }

      const formattedItems: ExtractedMappedKPI[] = result.items.map((item, idx) => ({
        ...item,
        _id: `ipp-item-${Date.now()}-${idx + 1}`,
        _selected: true
      }));

      setExtractedItems(formattedItems);
      setExtractedKpas(result.kpas || []);
      setSourceFileName(file.name);
      
      setStatusMessage({
        type: 'success',
        text: `Successfully extracted ${formattedItems.length} KPIs and ${result.kpas?.length || 0} Functional KPAs from "${file.name}" with 100% verbatim fidelity.`
      });

      // Persist snapshot to server
      const targetEmail = (targetEmployeeEmail || currentUser?.email || '').toLowerCase().trim();
      const effectiveTenantId = (targetEmail.endsWith('@neda.gov.za') || targetEmail.includes('neda.gov.za')) ? 'neda' : 'tenant-229';
      try {
        await fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: formattedItems,
            kpas: result.kpas || [],
            sourceFileName: file.name,
            timestamp: new Date().toISOString()
          })
        });
      } catch (saveErr) {
        console.warn("Snapshot auto-save error:", saveErr);
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setStatusMessage({
        type: 'error',
        text: `Extraction failed: ${err.message || 'Unknown error occurred while parsing document.'}`
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Push Extracted Data Verbatim to Selected Official Profile
  const handlePushToPerformancePlan = async () => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to push to the Performance Plan.' });
      return;
    }

    const targetEmail = (targetEmployeeEmail || currentUser?.email || '').toLowerCase().trim();
    if (!targetEmail) {
      setStatusMessage({ type: 'error', text: 'Please select a valid official from Azure AD directory.' });
      return;
    }

    setIsPushing(true);
    const targetName = selectedTargetUser?.fullName || selectedTargetUser?.full_name || targetEmail;
    const effectiveTenantId = (targetEmail.endsWith('@neda.gov.za') || targetEmail.includes('neda.gov.za')) ? 'neda' : 'tenant-229';

    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim KPIs directly into Performance Plan for ${targetName} (${targetEmail})...`
    });

    try {
      // Map strictly and verbatim as per required field definitions:
      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const poeVal = it["poe"] || it["portfolio of evidence"] || it["means of verification"] || '';
        const kpiNoVal = it["kpi no"] || `KPI-${idx + 1}`;
        const kpiDescVal = it["kpi description"] || it["kpi"] || '';
        const wtVal = it["wt"] || it["%wt"] || '0';
        const baselineVal = it["baseline"] || '';
        const annualTargetVal = it["annual target"] || '';
        const q1Val = it["1st qtr target"] || '';
        const q2Val = it["2nd qtr target"] || '';
        const q3Val = it["3rd qtr target"] || '';
        const q4Val = it["4th qtr target"] || '';
        const budgetVal = it["budget"] || '';

        return {
          id: `ipp-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: kpiNoVal,
          "kpi no": kpiNoVal,
          kpi: kpiDescVal,
          kpiDescription: kpiDescVal,
          "kpi description": kpiDescVal,
          weighting: wtVal,
          wt: wtVal,
          "%wt": wtVal,
          baseline: baselineVal,
          annualTarget: annualTargetVal,
          "annual target": annualTargetVal,
          q1Target: q1Val,
          "1st qtr target": q1Val,
          q2Target: q2Val,
          "2nd qtr target": q2Val,
          q3Target: q3Val,
          "3rd qtr target": q3Val,
          q4Target: q4Val,
          "4th qtr target": q4Val,
          poe: poeVal,
          "1st qtr poe": poeVal,
          "2nd qtr poe": poeVal,
          "3rd qtr poe": poeVal,
          "4th qtr poe": poeVal,
          annualRequiredPoe: poeVal,
          q1Poe: poeVal,
          q2Poe: poeVal,
          midtermPoe: poeVal,
          q3Poe: poeVal,
          q4Poe: poeVal,
          budget: budgetVal,
          kpa: functionalKpa,
          functionalKpa: functionalKpa,
          mscoaCode: 'Operational',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          myScore: '3.0'
        };
      });

      const planMetadata: any = {
        name: selectedTargetUser?.fullName || selectedTargetUser?.full_name || targetEmail,
        period: '2026/2027 Financial Year',
        department: selectedTargetUser?.department || 'Administration',
        position: selectedTargetUser?.jobFunction || selectedTargetUser?.job_function || 'Official',
        email: targetEmail,
        manager: selectedTargetUser?.manager || 'Line Manager',
        managerEmail: selectedTargetUser?.managerEmail || '',
        reportTo: selectedTargetUser?.reportTo || selectedTargetUser?.manager || 'Line Manager',
        _isFredExtracted: true,
        _replacePlan: true,
        _allowItemDeletion: true,
        _isCleared: false,
        _extractedFrom: sourceFileName || 'Performance Agreement',
        _pushedAt: new Date().toISOString()
      };

      // Helper to retry once on gateway timeouts (502/503/504)
      const fetchWithRetry = async (url: string, options: RequestInit, retries = 1): Promise<Response> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const response = await fetch(url, options);
            if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < retries) {
              await new Promise(r => setTimeout(r, 800));
              continue;
            }
            return response;
          } catch (err) {
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 800));
              continue;
            }
            throw err;
          }
        }
        return fetch(url, options);
      };

      // Push strictly to the target individual's NEDA pplan endpoint
      const res = await fetchWithRetry(`/api/tenant/${effectiveTenantId}/pplan?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: planItems
        })
      });

      if (!res.ok) {
        let errDetail = '';
        try {
          const errJson = await res.json();
          if (errJson?.error) errDetail = ` (${errJson.error})`;
        } catch (e) {}
        throw new Error(`Server returned error status ${res.status}${errDetail}`);
      }

      // Concurrently align the user's KPIs and KPAs registers strictly in NEDA and clear extraction snapshots
      const uniqueKpaTitles = Array.from(new Set(
        (extractedKpas.length > 0
          ? extractedKpas.map((k: any) => k.kpa || k.functionalKpa || k.title || k.name || '')
          : planItems.map(it => it.kpa)
        ).map(s => String(s || '').trim()).filter(Boolean)
      ));
      const kpaPayload = uniqueKpaTitles.map((title, idx) => ({
        id: `kpa-extracted-${idx + 1}`,
        title,
        nationalKpa: title,
        parentObjective: 'To ensure sustainable service delivery and clean audit compliance',
        mscoaCode: 'Operational',
        weighting: ''
      }));

      await Promise.allSettled([
        fetch(`/api/tenant/${effectiveTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kpis: planItems, replace: true })
        }),
        ...(kpaPayload.length > 0 ? [
          fetch(`/api/tenant/${effectiveTenantId}/kpas?userId=${encodeURIComponent(targetEmail)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kpas: kpaPayload, customKpaTable: null })
          })
        ] : []),
        fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' }),
        fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/ipp?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
      ]);

      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: effectiveTenantId, userId: targetEmail } }));
      window.dispatchEvent(new CustomEvent('neda-kpis-updated', { detail: { tenantId: effectiveTenantId, userId: targetEmail } }));

      // Clear the local state immediately so Extraction Engine forgets the extraction
      setExtractedItems([]);
      setExtractedKpas([]);
      setSourceFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs verbatim into the Performance Plan for ${targetName} (${targetEmail})!`
      });

    } catch (err: any) {
      console.error("Push to Performance Plan error:", err);
      setStatusMessage({
        type: 'error',
        text: `Failed to push to Performance Plan: ${err.message || 'Unknown server error.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Push Extracted Data Verbatim to the Team Performance Plan
  const handlePushToTeamPerformancePlan = async () => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to push to the Team Performance Plan.' });
      return;
    }

    setIsPushing(true);
    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim KPIs directly into the Team Performance Plan...`
    });

    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;

      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const poeVal = it["poe"] || it["portfolio of evidence"] || it["means of verification"] || '';
        
        return {
          id: `team-ipp-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: it["kpi no"] || `KPI-${idx + 1}`,
          kpi: it["kpi description"] || '',
          weighting: it["%wt"] || '0',
          baseline: it["baseline"] || '',
          annualTarget: it["annual target"] || '',
          q1Target: it["1st qtr target"] || '',
          q2Target: it["2nd qtr target"] || '',
          q3Target: it["3rd qtr target"] || '',
          q4Target: it["4th qtr target"] || '',
          poe: poeVal,
          annualRequiredPoe: poeVal,
          q1Poe: poeVal,
          q2Poe: poeVal,
          midtermPoe: poeVal,
          q3Poe: poeVal,
          q4Poe: poeVal,
          budget: it["budget"] || 'R0.00',
          kpa: functionalKpa,
          mscoaCode: 'Operational',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          myScore: '3.0'
        };
      });

      const planMetadata = {
        name: 'Team Performance Plan',
        period: '2025/2026 Financial Year',
        department: currentUser.department || 'Administration',
        position: 'Team Scorecard',
        email: targetEmail,
        _isFredExtracted: true,
        _isCleared: false,
        _extractedFrom: sourceFileName || 'Performance Agreement',
        _pushedAt: new Date().toISOString()
      };

      const normTarget = targetEmail.toLowerCase().trim();
      const effectiveTenantId = (normTarget.endsWith('@neda.gov.za') || normTarget.includes('neda.gov.za'))
        ? 'neda'
        : ((activeTenantId === 'global' || activeTenantId === 'nkangala_auto' || !activeTenantId) ? 'tenant-229' : activeTenantId);

      let res = await fetch(`/api/tenant/${effectiveTenantId}/team-pplan?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: planItems
        })
      });
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        await new Promise(r => setTimeout(r, 800));
        res = await fetch(`/api/tenant/${effectiveTenantId}/team-pplan?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: planMetadata,
            items: planItems
          })
        });
      }

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      // Clear local state immediately so Fred forgets the extraction
      setExtractedItems([]);
      setExtractedKpas([]);
      setSourceFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Clear saved extraction snapshots from server/Supabase
      try {
        await Promise.allSettled([
          fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' }),
          fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/ipp?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
        ]);
      } catch (e) {}

      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs verbatim into the Team Performance Plan! Fred has saved the plan and forgotten the mapped extraction, ready for the next document.`
      });

    } catch (err: any) {
      console.error("Push to Team Performance Plan error:", err);
      setStatusMessage({
        type: 'error',
        text: `Failed to push to Team Performance Plan: ${err.message || 'Unknown server error.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Push Verbatim KPIs directly into Team Performance Plan 2 (Specifically for dimpems@nkangaladm.gov.za)
  const handlePushToTeamPerformancePlan2 = async () => {
    const selected = extractedItems.filter(i => i._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'No KPIs selected. Please check at least one KPI to push.'
      });
      return;
    }

    setIsPushing(true);
    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim KPIs directly into Team Performance Plan 2...`
    });

    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;

      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const poeVal = it["poe"] || it["portfolio of evidence"] || it["means of verification"] || '';
        
        return {
          id: `team2-ipp-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: it["kpi no"] || `KPI-${idx + 1}`,
          kpi: it["kpi description"] || '',
          weighting: it["%wt"] || '0',
          baseline: it["baseline"] || '',
          annualTarget: it["annual target"] || '',
          q1Target: it["1st qtr target"] || '',
          q2Target: it["2nd qtr target"] || '',
          q3Target: it["3rd qtr target"] || '',
          q4Target: it["4th qtr target"] || '',
          poe: poeVal,
          annualRequiredPoe: poeVal,
          q1Poe: poeVal,
          q2Poe: poeVal,
          midtermPoe: poeVal,
          q3Poe: poeVal,
          q4Poe: poeVal,
          budget: it["budget"] || 'R0.00',
          kpa: functionalKpa,
          mscoaCode: 'Operational',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          myScore: '3.0'
        };
      });

      const planMetadata = {
        name: 'Team Performance Plan 2',
        period: '2025/2026 Financial Year',
        department: currentUser.department || 'Administration',
        position: 'Team Scorecard 2',
        email: targetEmail,
        _isFredExtracted: true,
        _isCleared: false,
        _extractedFrom: sourceFileName || 'Performance Agreement',
        _pushedAt: new Date().toISOString()
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplan-2?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: planItems
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      // Clear local state immediately so Fred forgets the extraction
      setExtractedItems([]);
      setExtractedKpas([]);
      setSourceFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Clear saved extraction snapshots from server/Supabase
      try {
        await Promise.allSettled([
          fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' }),
          fetch(`/api/tenant/${activeTenantId}/fred-extraction/ipp?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
        ]);
      } catch (e) {}

      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs verbatim into Team Performance Plan 2! Fred has saved the plan and forgotten the mapped extraction, ready for the next document.`
      });

    } catch (err: any) {
      console.error("Push to Team Performance Plan 2 error:", err);
      setStatusMessage({
        type: 'error',
        text: `Failed to push to Team Performance Plan 2: ${err.message || 'Unknown server error.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePushToTeamPerformancePlanWithEmail = async (overrideEmail: string, destinationName: string) => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to push.' });
      return;
    }

    setIsPushing(true);
    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim KPIs directly into ${destinationName}...`
    });

    try {
      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const poeVal = it["poe"] || it["portfolio of evidence"] || it["means of verification"] || '';
        
        return {
          id: `team-ipp-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: it["kpi no"] || `KPI-${idx + 1}`,
          kpi: it["kpi description"] || '',
          weighting: it["%wt"] || '0',
          baseline: it["baseline"] || '',
          annualTarget: it["annual target"] || '',
          q1Target: it["1st qtr target"] || '',
          q2Target: it["2nd qtr target"] || '',
          q3Target: it["3rd qtr target"] || '',
          q4Target: it["4th qtr target"] || '',
          poe: poeVal,
          annualRequiredPoe: poeVal,
          q1Poe: poeVal,
          q2Poe: poeVal,
          midtermPoe: poeVal,
          q3Poe: poeVal,
          q4Poe: poeVal,
          budget: it["budget"] || 'R0.00',
          kpa: functionalKpa,
          mscoaCode: 'Operational',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          myScore: '3.0'
        };
      });

      const planMetadata = {
        name: destinationName,
        period: '2025/2026 Financial Year',
        department: currentUser.department || 'Administration',
        position: destinationName,
        email: overrideEmail,
        _isFredExtracted: true,
        _isCleared: false,
        _extractedFrom: sourceFileName || 'Performance Agreement',
        _pushedAt: new Date().toISOString()
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplan?userId=${encodeURIComponent(overrideEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: planItems
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      setExtractedItems([]);
      setExtractedKpas([]);
      setSourceFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs verbatim into ${destinationName}! Fred has saved the plan and forgotten the mapped extraction, ready for the next document.`
      });

    } catch (err: any) {
      console.error(`Push to ${destinationName} error:`, err);
      setStatusMessage({
        type: 'error',
        text: `Failed to push to ${destinationName}: ${err.message || 'Unknown server error.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Push Extracted Data Verbatim to a specific Departmental Team (CDS, Technical Services, Corporate Services, PMS Team — Teams 1 to 10)
  const handlePushToDepartmentTeam = async (deptSuffix: string, teamNum: number) => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to push to the selected Departmental Team.' });
      return;
    }

    const deptConfig = TEAM_MODULE_CONFIGS[deptSuffix];
    const teamPreset = deptConfig?.teams?.[teamNum - 1];
    const deptTitle = deptConfig?.title || deptSuffix.toUpperCase();
    const teamName = teamPreset?.name || `Team ${teamNum}`;
    const fullDestinationLabel = `${deptTitle} — Team ${teamNum} (${teamName})`;

    setIsPushing(true);
    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim KPIs directly into ${fullDestinationLabel}...`
    });

    try {
      const effectiveTenantId = 'tenant-229';
      const deptTeamScope = `dept_team_${deptSuffix}_team_${teamNum}`;
      const docId = `draft_doc_${deptSuffix}_team_${teamNum}_${effectiveTenantId}`;

      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const poeVal = it["poe"] || it["portfolio of evidence"] || it["means of verification"] || '';
        const kpiNoVal = it["kpi no"] || `KPI-${idx + 1}`;
        const kpiDescVal = it["kpi description"] || it["kpi"] || '';
        const wtVal = it["wt"] || it["%wt"] || '0';
        const baselineVal = it["baseline"] || '';
        const annualTargetVal = it["annual target"] || '';
        const q1Val = it["1st qtr target"] || '';
        const q2Val = it["2nd qtr target"] || '';
        const q3Val = it["3rd qtr target"] || '';
        const q4Val = it["4th qtr target"] || '';
        const budgetVal = it["budget"] || 'R0.00';

        return {
          id: `${deptSuffix}-team${teamNum}-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: kpiNoVal,
          "kpi no": kpiNoVal,
          kpi: kpiDescVal,
          kpiDescription: kpiDescVal,
          "kpi description": kpiDescVal,
          weighting: wtVal,
          wt: wtVal,
          "%wt": wtVal,
          baseline: baselineVal,
          annualTarget: annualTargetVal,
          "annual target": annualTargetVal,
          q1Target: q1Val,
          "1st qtr target": q1Val,
          q2Target: q2Val,
          "2nd qtr target": q2Val,
          q3Target: q3Val,
          "3rd qtr target": q3Val,
          q4Target: q4Val,
          "4th qtr target": q4Val,
          poe: poeVal,
          annualRequiredPoe: poeVal,
          q1Poe: poeVal,
          q2Poe: poeVal,
          midtermPoe: poeVal,
          q3Poe: poeVal,
          q4Poe: poeVal,
          budget: budgetVal,
          kpa: functionalKpa,
          functionalKpa: functionalKpa,
          mscoaCode: 'Operational',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          myScore: '3.0'
        };
      });

      const planMetadata = {
        name: fullDestinationLabel,
        period: '2026/2027 Financial Year',
        department: deptTitle,
        position: `Team ${teamNum} (${teamName})`,
        email: deptTeamScope,
        _isFredExtracted: true,
        _isCleared: false,
        _extractedFrom: sourceFileName || 'Performance Agreement',
        _pushedAt: new Date().toISOString()
      };

      // 1. Save to the compartmented team-pplan key for this exact department & team slot (1..10)
      const teamPlanRes = await fetch(`/api/tenant/${effectiveTenantId}/team-pplan?userId=${encodeURIComponent(deptTeamScope)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: planItems
        })
      });

      if (!teamPlanRes.ok) {
        throw new Error(`Server returned error status ${teamPlanRes.status}`);
      }

      // 2. Non-destructively merge pulledFilteredPplanItems into the team's PA Drafting Document (draft_doc_<dept>_team_<1..10>_tenant-229)
      let existingDraftState: any = {};
      try {
        const existingRes = await fetch(`/api/tenant/${effectiveTenantId}/pa-drafting-doc?userId=default&documentId=${encodeURIComponent(docId)}&force=true&t=${Date.now()}`);
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          if (existingData?.html) {
            existingDraftState = typeof existingData.html === 'string'
              ? JSON.parse(existingData.html)
              : existingData.html;
          }
        }
      } catch {}

      const mergedDraftState = {
        ...existingDraftState,
        customTeamName: existingDraftState?.customTeamName || teamName,
        teamIndex: teamNum - 1,
        financialYear: existingDraftState?.financialYear || '2026/2027 Financial Year',
        headers: Array.isArray(existingDraftState?.headers) && existingDraftState.headers.length > 0
          ? existingDraftState.headers
          : (deptConfig?.defaultHeaders || ['No.', 'Full Name (Team Members)', 'Employee Number / Designation', 'Team Role']),
        tableRows: Array.isArray(existingDraftState?.tableRows) && existingDraftState.tableRows.length > 0
          ? existingDraftState.tableRows
          : (teamPreset?.defaultRows || []),
        coverPage: existingDraftState?.coverPage ||
          `PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${deptTitle.toUpperCase()} — ${teamName.toUpperCase()}\n\nFOR THE FINANCIAL YEAR: 2026/2027`,
        purpose: existingDraftState?.purpose ||
          `The purpose of this agreement is to specify performance expectations and operational standards for members of the ${deptTitle} (${teamName}), aligning operational deliverables with municipal strategic goals.`,
        validity: existingDraftState?.validity ||
          'This agreement will be valid for the 2026/2027 financial year or until superseded by a revised team agreement.',
        reporting: existingDraftState?.reporting ||
          `Members of the ${deptTitle} (${teamName}) will report directly through their designated team leaders and line managers to the Municipal Manager and Executive Leadership.`,
        pulledFilteredPplanItems: planItems,
        isPPlanAdopted: true,
        annexureA: true,
        updatedAt: new Date().toISOString()
      };

      await fetch(`/api/tenant/${effectiveTenantId}/pa-drafting-doc?userId=default&documentId=${encodeURIComponent(docId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: mergedDraftState,
          htmlDocumentId: docId
        })
      });

      window.dispatchEvent(
        new CustomEvent('dept-team-pplan-updated', {
          detail: { deptSuffix, teamNum, items: planItems }
        })
      );
      if (deptSuffix === 'pms_team') {
        window.dispatchEvent(
          new CustomEvent('pms-team-pa-updated', {
            detail: { teamNum, items: planItems }
          })
        );
      }

      // Clear local extractor state and server extraction snapshot
      setExtractedItems([]);
      setExtractedKpas([]);
      setSourceFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const targetEmail = (targetEmployeeEmail || currentUser.email || '').toLowerCase().trim();
      try {
        await Promise.allSettled([
          fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' }),
          fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/ipp?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
        ]);
      } catch {}

      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs verbatim into ${fullDestinationLabel}! Open ${deptTitle} → Team ${teamNum} in IPMS to view Annexure A.`
      });
    } catch (err: any) {
      console.error(`Push to ${fullDestinationLabel} error:`, err);
      setStatusMessage({
        type: 'error',
        text: `Failed to push to ${fullDestinationLabel}: ${err.message || 'Unknown server error.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  const getDestinationShortLabel = (dest: string) => {
    if (dest === 'team-1') return 'Team 1';
    if (dest === 'team-2') return 'Team 2';
    if (dest === 'individual') return 'Individual Plan';
    if (dest === 'team-leader-dual') return 'Dual Plan';
    if (dest.startsWith('dept:')) {
      const [, deptSuffix, teamNumStr] = dest.split(':');
      const shortDept =
        deptSuffix === 'cds' ? 'CDS' :
        deptSuffix === 'technical_services' ? 'Technical Svcs' :
        deptSuffix === 'corporate_services' ? 'Corporate Svcs' :
        deptSuffix === 'pms_team' ? 'PMS' : deptSuffix;
      return `${shortDept} Team ${teamNumStr}`;
    }
    return 'Selected Plan';
  };

  const handlePushToSelectedDestination = async () => {
    if (selectedPlanDestination.startsWith('dept:')) {
      const [, deptSuffix, teamNumStr] = selectedPlanDestination.split(':');
      const teamNum = Number(teamNumStr) || 1;
      await handlePushToDepartmentTeam(deptSuffix, teamNum);
      return;
    }
    if (selectedPlanDestination === 'individual') {
      await handlePushToPerformancePlan();
    } else if (selectedPlanDestination === 'team-2') {
      await handlePushToTeamPerformancePlan2();
    } else if (selectedPlanDestination === 'team-leader-dual') {
      await handlePushToTeamPerformancePlanWithEmail((targetEmployeeEmail || currentUser.email) + '_team', 'Team Leader Dual Plan');
    } else {
      await handlePushToTeamPerformancePlan();
    }
  };

  // Reset / Clear Extractor
  const handleClearExtractor = async () => {
    setExtractedItems([]);
    setExtractedKpas([]);
    setSourceFileName('');
    setSelectedFile(null);
    setStatusMessage({ type: 'info', text: 'Performance Plan Extractor has been completely cleared. Ready for a new document upload.' });
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;
      await Promise.allSettled([
        fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' }),
        fetch(`/api/tenant/${activeTenantId}/fred-extraction/ipp?userId=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
      ]);
    } catch (e) {
      console.warn("Failed to delete extraction ledger:", e);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setExtractedItems(prev => prev.map(item => item._id === id ? { ...item, _selected: !item._selected } : item));
  };

  const handleSelectAll = () => {
    const allSelected = extractedItems.every(i => i._selected !== false);
    setExtractedItems(prev => prev.map(item => ({ ...item, _selected: !allSelected })));
  };

  // Field editing
  const handleFieldChange = (id: string, field: keyof ExtractedMappedKPI, value: string) => {
    setExtractedItems(prev => prev.map(item => item._id === id ? { ...item, [field]: value } : item));
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setExtractedItems(prev => prev.filter(item => item._id !== id));
  };

  // Filtered items
  const filteredItems = extractedItems.filter(item => {
    const matchesSearch = 
      (item["kpi description"] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item["kpi no"] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item["functional kpa"] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item["poe"] || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKpa = filterKpa === 'all' || 
      (item["functional kpa"] || '').toLowerCase().includes(filterKpa.toLowerCase()) ||
      (item["kpa"] || '').toLowerCase().includes(filterKpa.toLowerCase());

    return matchesSearch && matchesKpa;
  });

  const selectedCount = extractedItems.filter(i => i._selected !== false).length;

  return (
    <div id="performance-plan-extractor" className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Sparkles className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight">EXTRACTION ENGINE — Performance Plan Extractor</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  NEDA IPMS Profile
                </span>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  1:1 Verbatim Grounding
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1.5 max-w-3xl leading-relaxed">
                Extracts all <strong className="text-emerald-300">Functional KPAs</strong> and <strong className="text-amber-300">KPIs</strong> from the uploaded Performance Agreement (Annexure A scorecard) with 100% verbatim fidelity. Pushes directly to whichever official profile is selected from the Azure AD user database.
              </p>
            </div>
          </div>

          {/* Action Push & Clear Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-clear-extractor-header"
              type="button"
              onClick={handleClearExtractor}
              className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold transition border border-slate-700 hover:border-rose-700/50 cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Clear Extractor and reset workspace for next source document"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Extractor</span>
            </button>

            {extractedItems.length > 0 && (
              <>
                <button
                  id="btn-push-to-performance-plan"
                  type="button"
                  onClick={handlePushToPerformancePlan}
                  disabled={isPushing || selectedCount === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isPushing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                  <span>Push to Performance Plan ({selectedCount})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Target Profile Bar & Azure AD Directory Search Picker */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-300">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Selected Target Official (Azure AD Directory):</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-black rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer shadow-inner flex items-center gap-2 min-w-[300px] justify-between"
              >
                <span className="truncate">
                  {selectedTargetUser?.fullName || selectedTargetUser?.full_name || targetEmployeeEmail || 'Select Official'} — {selectedTargetUser?.jobFunction || selectedTargetUser?.job_function || 'Official'} ({targetEmployeeEmail})
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>

              {isPickerOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Azure AD directory by name, email, department..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                    {azureUsers
                      .filter(u => {
                        if (!userSearchTerm) return true;
                        const q = userSearchTerm.toLowerCase();
                        return (
                          (u.fullName || u.full_name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q) ||
                          (u.jobFunction || u.job_function || '').toLowerCase().includes(q) ||
                          (u.department || '').toLowerCase().includes(q)
                        );
                      })
                      .map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedTargetUser(u);
                            setTargetEmployeeEmail(u.email);
                            setIsPickerOpen(false);
                            setUserSearchTerm('');
                          }}
                          className="w-full text-left p-2 hover:bg-slate-900 transition flex flex-col gap-0.5 cursor-pointer rounded-lg"
                        >
                          <span className="font-bold text-white text-xs">{u.fullName || u.full_name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">{u.email}</span>
                          {(u.jobFunction || u.job_function || u.department) && (
                            <span className="text-[10px] text-slate-400">
                              {u.jobFunction || u.job_function} {u.department ? `(${u.department})` : ''}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/50 uppercase tracking-wider">
              Azure AD Directory Target
            </span>
          </div>

          {onNavigateToIPMS && (
            <button
              type="button"
              onClick={() => onNavigateToIPMS('pplan')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition text-xs"
            >
              <span>View Annual Performance Planner Grid</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 border ${
          statusMessage.type === 'error'
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            : statusMessage.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200'
        }`}>
          <div className="flex items-start gap-3">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            )}
            <div className="font-medium">{statusMessage.text}</div>
          </div>
          {(extractedItems.length > 0 || sourceFileName) && (
            <button
              type="button"
              onClick={handleClearExtractor}
              className="px-3 py-1.5 bg-slate-900/90 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-xs font-bold text-slate-300 hover:text-rose-200 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Extractor</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-slate-950/80 border-2 border-dashed border-indigo-600/40 hover:border-indigo-500/80 rounded-2xl p-8 text-center transition group relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.xls,.doc"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          disabled={isExtracting}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-900/40 border border-indigo-500/40 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition shadow-lg">
            {isExtracting ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isExtracting ? 'Extracting Verbatim Performance Plan...' : 'Upload Performance Agreement (PDF / DOCX / XLSX)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Drag & drop the signed Performance Agreement here, or click to browse. The engine extracts Functional KPAs and Scorecard KPIs strictly from Annexure A (Performance Plan) with 100% verbatim fidelity and zero dreaming.
            </p>
          </div>
          {sourceFileName && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                <span>Loaded: {sourceFileName} ({extractedItems.length} KPIs)</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearExtractor();
                }}
                className="pointer-events-auto px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-700/50 transition cursor-pointer flex items-center gap-1 shadow"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear Extractor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Data Grid & Verbatim Mappings */}
      {extractedItems.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-4 p-5">
          
          {/* Controls & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search extracted KPIs or KPAs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>

              {/* Functional KPA Filter */}
              <select
                value={filterKpa}
                onChange={(e) => setFilterKpa(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Functional KPAs ({extractedKpas.length} KPAs • {extractedItems.length} KPIs)</option>
                {extractedKpas.map((k, idx) => (
                  <option key={idx} value={k.kpaName || k.fullTitle || `KPA ${idx + 1}`}>
                    {k.fullTitle || k.kpaName || `KPA ${idx + 1}`} ({k.weighting || ''}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Plan / Team Selector & Push Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-750">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-300">Target Plan / Team:</span>
                <select
                  value={selectedPlanDestination}
                  onChange={(e) => setSelectedPlanDestination(e.target.value)}
                  className="bg-slate-950 text-emerald-300 font-bold text-xs px-2 py-1 rounded-lg border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer max-w-[340px]"
                >
                  <optgroup label="Individual & General Team Plans">
                    <option value="individual">👤 Individual Performance Plan (Selected Official)</option>
                    <option value="team-1">👥 Team Performance Plan (Team 1)</option>
                    <option value="team-2">👥 Team Performance Plan 2 (Team 2)</option>
                    <option value="team-leader-dual">👥 Team Leader Dual Plan (_team)</option>
                  </optgroup>
                  {DEPARTMENT_TEAM_GROUPS.map(group => {
                    const cfg = TEAM_MODULE_CONFIGS[group.key];
                    if (!cfg || !Array.isArray(cfg.teams)) return null;
                    return (
                      <optgroup key={group.key} label={group.label}>
                        {cfg.teams.map((t, idx) => {
                          const teamNum = idx + 1;
                          return (
                            <option key={`${group.key}-${teamNum}`} value={`dept:${group.key}:${teamNum}`}>
                              👥 Team {teamNum}: {t.name}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <button
                id="btn-top-push-selected-destination"
                type="button"
                onClick={handlePushToSelectedDestination}
                disabled={isPushing || selectedCount === 0}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isPushing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-emerald-200" />
                )}
                <span>
                  Push {selectedCount} to {getDestinationShortLabel(selectedPlanDestination)}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-750 transition cursor-pointer flex items-center gap-1.5"
              >
                {extractedItems.every(i => i._selected !== false) ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>{extractedItems.every(i => i._selected !== false) ? 'Deselect All' : 'Select All'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearExtractor}
                className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold border border-slate-750 hover:border-rose-700/50 transition cursor-pointer flex items-center gap-1.5"
                title="Clear all extracted items and reset extractor"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Extractor</span>
              </button>

              <span className="text-xs font-semibold text-slate-400">
                Selected: <strong className="text-indigo-400">{selectedCount}</strong> of {extractedItems.length}
              </span>
            </div>
          </div>

          {/* Verbatim Mapping Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/95 sticky top-0 z-20 text-[11px] font-black uppercase tracking-wider text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={extractedItems.length > 0 && extractedItems.every(i => i._selected !== false)}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-20">KPI No</th>
                  <th className="p-3 min-w-[280px]">Key Performance Indicator (KPI Description)</th>
                  <th className="p-3 w-16 text-center">% WT</th>
                  <th className="p-3 min-w-[200px]">Functional Area KPA</th>
                  <th className="p-3 w-28">Baseline (2025/26)</th>
                  <th className="p-3 w-28">Annual Target</th>
                  <th className="p-3 w-24">1st Qtr Target</th>
                  <th className="p-3 w-24">2nd Qtr Target</th>
                  <th className="p-3 w-24">3rd Qtr Target</th>
                  <th className="p-3 w-24">4th Qtr Target</th>
                  <th className="p-3 min-w-[180px]">Portfolio of Evidence (POE)</th>
                  <th className="p-3 w-28">Budget (R'000)</th>
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-950">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-slate-500">
                      No KPIs match the current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isSelected = item._selected !== false;
                    const isEditing = editingRowId === item._id;

                    return (
                      <tr
                        key={item._id || idx}
                        className={`transition hover:bg-slate-900/60 ${
                          isSelected ? 'bg-slate-950' : 'bg-slate-950/40 opacity-60'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => item._id && handleToggleSelect(item._id)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item["kpi no"]}
                              onChange={(e) => item._id && handleFieldChange(item._id, "kpi no", e.target.value)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          ) : (
                            item["kpi no"]
                          )}
                        </td>
                        <td className="p-3 text-slate-200">
                          {isEditing ? (
                            <textarea
                              value={item["kpi description"]}
                              onChange={(e) => item._id && handleFieldChange(item._id, "kpi description", e.target.value)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white resize-y"
                              rows={2}
                            />
                          ) : (
                            <div className="line-clamp-2 hover:line-clamp-none font-medium">
                              {item["kpi description"]}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-amber-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item["%wt"]}
                              onChange={(e) => item._id && handleFieldChange(item._id, "%wt", e.target.value)}
                              className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-center text-white"
                            />
                          ) : (
                            `${item["%wt"]}%`
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/40 text-indigo-300 text-[11px] font-semibold">
                            {item["functional kpa"] || item["kpa"] || 'Functional KPA'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item["baseline"]}
                              onChange={(e) => item._id && handleFieldChange(item._id, "baseline", e.target.value)}
                              className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          ) : (
                            item["baseline"] || '-'
                          )}
                        </td>
                        <td className="p-3 font-semibold text-emerald-300 text-[11px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item["annual target"]}
                              onChange={(e) => item._id && handleFieldChange(item._id, "annual target", e.target.value)}
                              className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          ) : (
                            item["annual target"] || '-'
                          )}
                        </td>
                        <td className="p-3 text-slate-300 text-[11px]">{item["1st qtr target"] || '-'}</td>
                        <td className="p-3 text-slate-300 text-[11px]">{item["2nd qtr target"] || '-'}</td>
                        <td className="p-3 text-slate-300 text-[11px]">{item["3rd qtr target"] || '-'}</td>
                        <td className="p-3 text-slate-300 text-[11px]">{item["4th qtr target"] || '-'}</td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          <div className="line-clamp-2 hover:line-clamp-none">{item["poe"] || '-'}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-teal-300">{item["budget"] || 'R0.00'}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => item._id && handleDeleteRow(item._id)}
                            className="p-1 hover:bg-rose-950/60 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Push & Clear Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
              <span>Showing <strong className="text-white">{filteredItems.length}</strong> verbatim KPIs extracted from source agreement.</span>
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-750">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-300">Target Plan / Team:</span>
                <select
                  value={selectedPlanDestination}
                  onChange={(e) => setSelectedPlanDestination(e.target.value)}
                  className="bg-slate-950 text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer max-w-[360px]"
                >
                  <optgroup label="Individual & General Team Plans">
                    <option value="individual">👤 Individual Performance Plan (Selected Official)</option>
                    <option value="team-1">👥 Team Performance Plan (Team 1)</option>
                    <option value="team-2">👥 Team Performance Plan 2 (Team 2)</option>
                    <option value="team-leader-dual">👥 Team Leader Dual Plan (_team)</option>
                  </optgroup>
                  {DEPARTMENT_TEAM_GROUPS.map(group => {
                    const cfg = TEAM_MODULE_CONFIGS[group.key];
                    if (!cfg || !Array.isArray(cfg.teams)) return null;
                    return (
                      <optgroup key={group.key} label={group.label}>
                        {cfg.teams.map((t, idx) => {
                          const teamNum = idx + 1;
                          return (
                            <option key={`${group.key}-${teamNum}`} value={`dept:${group.key}:${teamNum}`}>
                              👥 Team {teamNum}: {t.name}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleClearExtractor}
                className="px-3.5 py-2 bg-slate-900 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold border border-slate-750 hover:border-rose-700/50 transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Clear</span>
              </button>

              <button
                id="btn-bottom-push-selected-destination"
                type="button"
                onClick={handlePushToSelectedDestination}
                disabled={isPushing || selectedCount === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isPushing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 text-emerald-200" />
                )}
                <span>
                  Push {selectedCount} to {getDestinationShortLabel(selectedPlanDestination)}
                </span>
              </button>

              <button
                id="btn-bottom-push-to-team-performance-plan-2"
                type="button"
                onClick={handlePushToTeamPerformancePlan2}
                disabled={isPushing || selectedCount === 0}
                className="px-3.5 py-2 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="Direct 1-click Push to Team Performance Plan 2"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Push Team 2</span>
              </button>

              <button
                id="btn-bottom-push-to-team-performance-plan"
                type="button"
                onClick={handlePushToTeamPerformancePlan}
                disabled={isPushing || selectedCount === 0}
                className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="Direct 1-click Push to Team Performance Plan 1"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Push Team 1</span>
              </button>

              <button
                id="btn-bottom-push-to-performance-plan"
                type="button"
                onClick={handlePushToPerformancePlan}
                disabled={isPushing || selectedCount === 0}
                className="px-3.5 py-2 bg-slate-900 hover:bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                title="Direct 1-click Push to Individual Performance Plan"
              >
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Push Individual</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
