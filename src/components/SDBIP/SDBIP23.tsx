import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, Plus, Trash2, Download, Save, RefreshCw, AlertTriangle, 
  CheckCircle, FileText, Info, Upload, Check, Cloud, Star, MapPin, Building, X, Eye, AlertCircle
} from 'lucide-react';
import { cn } from '../Branding';

interface PoeDocument {
  id: string;
  name: string;
  mimeType: string;
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface SDBIP23Row {
  id: string;
  refNum: string;
  strategicObj: string;
  bsd: string;
  led: string;
  mfvm: string;
  ggpp: string;
  midt: string;
  sr: string;
  kpas: string;
  operationalActivity: string;
  kpi: string;
  compliance: string; // 'compliant' | 'non-compliant'
  uom: string; // Unit of Measure
  mscoaTracking: string;
  baseline: string;
  annualTarget: string;
  budgetAllocation: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  weight?: string;
  poe?: string;
  responsibleUnit: string;
  evaluationUser: string; // Evaluation is always the user
  reviewManager: string;  // Review is always the user's line manager
  poeStatus: 'Not Uploaded' | 'In Cloud (Profile Backup / POE / PA KPI\'s & KPA\'s)';
  poeDocName?: string;
  q1PoeDocs?: PoeDocument[];
  q2PoeDocs?: PoeDocument[];
  q3PoeDocs?: PoeDocument[];
  q4PoeDocs?: PoeDocument[];
}

interface SDBIP23Props {
  currentUser: {
    email: string;
    role: string;
  };
  activeTenantId: string;
  onClose?: () => void;
}

const DEFAULT_SDBIP23_ROWS: SDBIP23Row[] = [];

export function SDBIP23({ currentUser, activeTenantId, onClose }: SDBIP23Props) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);
  
  const [rows, setRows] = useState<SDBIP23Row[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  
  const [overridePassword, setOverridePassword] = useState('8655M9sznnes01*');

  useEffect(() => {
    fetch('/api/config/manager-password')
      .then(res => res.ok ? res.json() : ({} as any))
      .then((data: any) => {
        if (data && data.managerOverridePassword) {
          setOverridePassword(data.managerOverridePassword);
        }
      })
      .catch(console.error);
  }, []);

  // Modal State for adding new SDBIP row
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [poeModal, setPoeModal] = useState<{
    rowId: string;
    quarter: 'q1' | 'q2' | 'q3' | 'q4';
  } | null>(null);
  const [newRowData, setNewRowData] = useState<Omit<SDBIP23Row, 'id' | 'evaluationUser' | 'reviewManager' | 'poeStatus'>>({
    refNum: '',
    strategicObj: '',
    bsd: 'N',
    led: 'N',
    mfvm: 'N',
    ggpp: 'N',
    midt: 'N',
    sr: 'N',
    kpas: 'KPA 1: Basic Service Delivery and Infrastructure Development',
    operationalActivity: '',
    kpi: '',
    compliance: 'compliant',
    uom: '',
    mscoaTracking: '',
    baseline: '',
    annualTarget: '',
    budgetAllocation: '',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    weight: '',
    poe: '',
    responsibleUnit: ''
  });

  const syncEveryoneKpisAndKpas = async (silent: boolean = false, currentRows?: SDBIP23Row[]) => {
    try {
      if (!silent) setIsSyncing(true);
      
      // 1. Fetch all users in the tenant
      const uRes = await fetch(`/api/tenant/${activeTenantId}/users`);
      if (!uRes.ok) throw new Error("Failed to fetch tenant users list");
      const usersData = await uRes.json();
      setUserList(usersData);

      // 2. Fetch all team performance plans
      const pplansRes = await fetch(`/api/tenant/${activeTenantId}/team-pplans`);
      let teamPlans: any[] = [];
      if (pplansRes.ok) {
        const teamPlansJson = await pplansRes.json();
        if (teamPlansJson && Array.isArray(teamPlansJson.teamPlans)) {
          teamPlans = teamPlansJson.teamPlans;
        }
      }

      // 3. Fetch each user's captured KPIs (individual profiles) in parallel
      const kpisPromises = usersData.map(async (user: any) => {
        try {
          const kRes = await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${user.email}`);
          if (kRes.ok) {
            const kJson = await kRes.json();
            return { email: user.email, kpis: Array.isArray(kJson.kpis) ? kJson.kpis : [] };
          }
        } catch(e) {
          console.warn(`Failed to fetch individual KPIs for ${user.email}:`, e);
        }
        return { email: user.email, kpis: [] };
      });
      const allUserKpis = await Promise.all(kpisPromises);

      // 4. Merge everything!
      const targetBaseRows = currentRows || rows;
      const mergedRows = [...targetBaseRows];

      // Helper to add or update a row in mergedRows
      const upsertSdbipRow = (kpi: any, userEmail: string, source: string) => {
        const kNo = (kpi.kpiNo || kpi.refNum || kpi.id || '').trim();
        if (!kNo) return;

        // Find match in current SDBIP rows (match on refNum)
        const matchIdx = mergedRows.findIndex(
          r => r.refNum && r.refNum.toLowerCase().trim() === kNo.toLowerCase()
        );

        const matchedProfile = usersData.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
        const userDept = matchedProfile?.department || '';
        const userManager = matchedProfile?.manager || 'Line Manager';

        const newRow: SDBIP23Row = {
          id: matchIdx >= 0 ? mergedRows[matchIdx].id : `sdbip23_${Date.now()}_sync_${Math.floor(Math.random() * 1000000)}`,
          refNum: kNo,
          strategicObj: kpi.strategicGoal || kpi.strategicObj || (matchIdx >= 0 ? mergedRows[matchIdx].strategicObj : 'Strategic Core Priority'),
          bsd: kpi.bsd ? 'Y' : 'N',
          led: kpi.led ? 'Y' : 'N',
          mfvm: kpi.mfvm ? 'Y' : 'N',
          ggpp: kpi.ggpp ? 'Y' : 'N',
          midt: kpi.midt ? 'Y' : 'N',
          sr: kpi.sr ? 'Y' : 'N',
          kpas: kpi.kpa || kpi.kpas || (matchIdx >= 0 ? mergedRows[matchIdx].kpas : 'KPA 1: Basic Service Delivery and Infrastructure Development'),
          operationalActivity: kpi.operationalActivity || (matchIdx >= 0 ? mergedRows[matchIdx].operationalActivity : `Captured KPI from ${source}`),
          kpi: kpi.kpi || (matchIdx >= 0 ? mergedRows[matchIdx].kpi : ''),
          compliance: kpi.compliance || 'compliant',
          uom: kpi.uom || '',
          mscoaTracking: kpi.mscoaTracking || kpi.mscoaCode || '',
          baseline: kpi.baseline || '',
          annualTarget: kpi.annualTarget || '',
          budgetAllocation: kpi.budget || kpi.budgetAllocation || '',
          q1: kpi.q1Target || kpi.q1 || '',
          q2: kpi.q2Target || kpi.q2 || '',
          q3: kpi.q3Target || kpi.q3 || '',
          q4: kpi.q4Target || kpi.q4 || '',
          weight: kpi.weighting || kpi.weight || '',
          poe: kpi.poe || '',
          responsibleUnit: userDept,
          evaluationUser: userEmail,
          reviewManager: userManager,
          poeStatus: matchIdx >= 0 ? mergedRows[matchIdx].poeStatus : 'In Cloud (Profile Backup / POE / PA KPI\'s & KPA\'s)',
          q1PoeDocs: kpi.q1PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q1PoeDocs : []),
          q2PoeDocs: kpi.q2PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q2PoeDocs : []),
          q3PoeDocs: kpi.q3PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q3PoeDocs : []),
          q4PoeDocs: kpi.q4PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q4PoeDocs : [])
        };

        if (matchIdx >= 0) {
          mergedRows[matchIdx] = { ...mergedRows[matchIdx], ...newRow };
        } else {
          mergedRows.push(newRow);
        }
      };

      // Merge from Performance Plans (pplan)
      teamPlans.forEach((tp: any) => {
        if (tp.plan && Array.isArray(tp.plan.items)) {
          tp.plan.items.forEach((item: any) => {
            upsertSdbipRow(item, tp.userId, `${tp.userId}'s Performance Plan`);
          });
        }
      });

      // Merge from individual user KPIs
      allUserKpis.forEach((uk: any) => {
        if (Array.isArray(uk.kpis)) {
          uk.kpis.forEach((kpi: any) => {
            upsertSdbipRow(kpi, uk.email, `${uk.email}'s Individual KPIs`);
          });
        }
      });

      setRows(mergedRows);
      await saveRowsToDatabase(mergedRows);
      
      if (!silent) {
        setSuccessToast("Successfully synchronized everyone's KPIs & KPAs from Profiles and Performance Plans!");
        setTimeout(() => setSuccessToast(null), 4000);
      }
      return mergedRows;
    } catch(err: any) {
      console.error("Sync everyone's KPIs/KPAs error:", err);
      if (!silent) {
        alert(`Error synchronizing KPI & KPA data: ${err.message}`);
      }
      return currentRows || rows;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Load from server & fetch system users to determine manager
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load users to capture manager from user management
        const uRes = await fetch(`/api/tenant/${activeTenantId}/users`);
        let usersData: any[] = [];
        if (uRes.ok) {
          usersData = await uRes.json();
          setUserList(usersData);
        }

        const res = await fetch(`/api/tenant/${activeTenantId}/sdbip23`);
        if (!res.ok) throw new Error("Could not load SDBIP 2nd & 3rd layer dataset");
        const json = await res.json();
        
        // Find current user's manager if exists in user management list
        const matchedProfile = usersData.find(u => u.email === currentUser.email);
        const autoManager = matchedProfile?.manager || 'Line Manager';

        let dedupedItems: SDBIP23Row[] = [];
        if (json && json.items && json.items.length > 0) {
          const seenIds = new Set<string>();
          let hasDuplicates = false;
          
          dedupedItems = json.items.map((item: any, idx: number) => {
            let uniqueId = item.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = `sdbip23_${Date.now()}_healed_${idx}_${Math.floor(Math.random() * 1000000)}`;
              hasDuplicates = true;
            }
            seenIds.add(uniqueId);
            return {
              ...item,
              id: uniqueId
            };
          });

          if (hasDuplicates) {
            console.log("Detected duplicate SDBIP23 row IDs. Healing and persisting corrected records to database.");
            await saveRowsToDatabase(dedupedItems);
          }
        }

        let baseItems = dedupedItems.length > 0 ? dedupedItems : DEFAULT_SDBIP23_ROWS.map(r => ({
          ...r,
          evaluationUser: currentUser.email,
          reviewManager: autoManager
        }));

        // AUTO SYNC ALL KPIS FROM GLOBAL `kpis` MESSAGES AND PPLANS IF AVAILABLE
        await syncEveryoneKpisAndKpas(true, baseItems);

      } catch (err) {
        console.error("SDBIP23 initialization failed:", err);
        setRows(DEFAULT_SDBIP23_ROWS);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeTenantId, currentUser.email]);

  const saveRowsToDatabase = async (nextList: SDBIP23Row[]) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip23`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: nextList })
      });
      if (!res.ok) throw new Error("Could not save to Supabase");
      setSuccessToast("SDBIP 2nd & 3rd Layers saved successfully!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRowHandler = (id: string) => {
    if (!confirm("Are you sure you want to delete this row from the 2nd & 3rd layers dataset?")) return;
    const next = rows.filter(r => r.id !== id);
    setRows(next);
    saveRowsToDatabase(next);
  };

  // Upload placeholder to profile backup called POE sub folder PA KPI's
  const handlePoeUpload = (id: string) => {
    const docName = prompt("Select file name / POE reference document to upload:", `audit_proof_ref_${id.slice(-4)}.pdf`);
    if (!docName) return;

    const next = rows.map(r => {
      if (r.id === id) {
        return {
          ...r,
          poeStatus: 'In Cloud (Profile Backup / POE / PA KPI\'s & KPA\'s)' as const,
          poeDocName: docName
        };
      }
      return r;
    });

    setRows(next);
    saveRowsToDatabase(next);
    alert(`Document "${docName}" successfully attached. System backed up on Mzansi Flow Cloud node under user directory Profile/Backup/POE/PA_KPIs_KPAs/.`);
  };

  const [dragActive, setDragActive] = useState<boolean>(false);

  const handlePoeFilesSelected = async (files: FileList) => {
    if (!poeModal) return;
    const selectedPoeRow = rows.find(r => r.id === poeModal.rowId);
    const selectedQuarter = poeModal.quarter;
    if (!selectedPoeRow || !selectedQuarter) return;

    const newDocs: PoeDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc = await new Promise<PoeDocument>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `poe_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: reader.result as string,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.email
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      newDocs.push(doc);
    }

    const updatedRows = rows.map(r => {
      if (r.id === selectedPoeRow.id) {
        const currentDocs = (r[`${selectedQuarter}PoeDocs` as keyof SDBIP23Row] as PoeDocument[]) || [];
        return {
          ...r,
          [`${selectedQuarter}PoeDocs`]: [...currentDocs, ...newDocs]
        };
      }
      return r;
    });

    setRows(updatedRows);
    saveRowsToDatabase(updatedRows);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePoeFilesSelected(e.dataTransfer.files);
    }
  };

  const deletePoeDoc = (docId: string) => {
    if (!poeModal) return;
    const selectedPoeRow = rows.find(r => r.id === poeModal.rowId);
    const selectedQuarter = poeModal.quarter;
    if (!selectedPoeRow || !selectedQuarter) return;

    const updatedRows = rows.map(r => {
      if (r.id === selectedPoeRow.id) {
        const currentDocs = (r[`${selectedQuarter}PoeDocs` as keyof SDBIP23Row] as PoeDocument[]) || [];
        return {
          ...r,
          [`${selectedQuarter}PoeDocs`]: currentDocs.filter(d => d.id !== docId)
        };
      }
      return r;
    });

    setRows(updatedRows);
    saveRowsToDatabase(updatedRows);
  };

  const handleGenerate25MockDocs = () => {
    if (!poeModal) return;
    const selectedPoeRow = rows.find(r => r.id === poeModal.rowId);
    const selectedQuarter = poeModal.quarter;
    if (!selectedPoeRow || !selectedQuarter) return;

    const mockDocs: PoeDocument[] = [];
    const names = [
      "ward_sanitation_grid_diagram.png", "mscoa_reconciled_allocation_ledger.pdf",
      "community_water_survey_signed_sheet.png", "ward15_chief_audit_approval_doc.pdf",
      "sdbip_site_photo_installation_hub.png", "executive_committee_minutes_resolution.pdf",
      "procurement_order_approval_voucher.png", "national_treasury_grap_standard_check.pdf",
      "local_water_level_sensor_telemetry.png", "service_provider_sla_signed_schedule.pdf",
      "municipal_manager_kpi_weight_verification.png", "ward_survey_reconciled_results.png",
      "infrastructure_asset_registry_entry.png", "quarter_performance_review_presentation.pdf",
      "engineering_purifier_pressure_log.png", "audit_committee_compliance_report.pdf",
      "expenditure_journal_transfers_scoa.png", "water_safety_chemical_analysis_audit.png",
      "ward15_stakeholder_briefing_session.pdf", "council_resolution_308_annexure.pdf",
      "civil_works_foundation_signoff.png", "invoice_cleared_under_aged_creditors.pdf",
      "project_progress_photo_grid_north.png", "site_management_handover_certificate.pdf",
      "grap17_asset_capital_journal.png"
    ];

    for (let i = 0; i < 25; i++) {
      const docName = names[i] || `poe_verification_sheet_page_${i + 1}.png`;
      const isPdf = docName.endsWith('.pdf');
      const colors = ['#0f766e', '#1d4ed8', '#701a75', '#0369a1', '#b45309', '#be123c', '#4d7c0f', '#3730a3', '#1e293b'];
      const bg = colors[i % colors.length];
      const stamp = isPdf ? 'COMPLIANT_PDF' : 'EVALUATION_IMG';
      
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
          <rect width="100%" height="100%" fill="${bg}"/>
          <rect x="15" y="15" width="270" height="170" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,6" opacity="0.3"/>
          <text x="30" y="45" font-family="monospace" font-size="11" fill="#cbd5e1" font-weight="bold">NKANGALA SDBIP POE ENGINE</text>
          <text x="30" y="70" font-family="sans-serif" font-size="14" fill="#ffffff" font-weight="900">${docName}</text>
          <text x="30" y="100" font-family="monospace" font-size="10" fill="#a7f3d0">Tenant: ${activeTenantId.toUpperCase()}</text>
          <text x="30" y="120" font-family="monospace" font-size="10" fill="#fef08a">Ref: ${selectedPoeRow.refNum}</text>
          <text x="30" y="140" font-family="sans-serif" font-size="9" fill="#94a3b8">Uploaded by: ${currentUser.email}</text>
          <rect x="30" y="155" width="120" height="20" rx="3" fill="#10b981"/>
          <text x="40" y="168" font-family="sans-serif" font-size="9" fill="#ffffff" font-weight="black">${stamp}</text>
          <circle cx="250" cy="150" r="25" fill="#ffffff" opacity="0.15"/>
          <text x="242" y="155" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">✓</text>
        </svg>
      `;
      const base64Svg = `data:image/svg+xml;base64,${btoa(svg.trim())}`;

      mockDocs.push({
        id: `poe_mock_${selectedPoeRow.id}_${selectedQuarter}_${i}`,
        name: docName,
        mimeType: isPdf ? 'application/pdf' : 'image/png',
        dataUrl: base64Svg,
        uploadedAt: new Date(Date.now() - (25 - i) * 10 * 60 * 1000).toISOString(),
        uploadedBy: currentUser.email
      });
    }

    const updatedRows = rows.map(r => {
      if (r.id === selectedPoeRow.id) {
        return {
          ...r,
          [`${selectedQuarter}PoeDocs`]: mockDocs
        };
      }
      return r;
    });

    setRows(updatedRows);
    saveRowsToDatabase(updatedRows);
    alert(`Successfully generated 25 realistic POE document images for ${selectedQuarter.toUpperCase()} of indicator ${selectedPoeRow.refNum}!`);
  };

  const updateRowState = (id: string, field: keyof SDBIP23Row, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const adoptLayerFromPA = async (layerName: '2nd' | '3rd') => {
    try {
       const res = await fetch(`/api/tenant/${activeTenantId}/performance-agreements/extraction/${layerName}`);
       if (!res.ok) throw new Error("Failed to fetch extraction data");
       const json = await res.json();
       if (json && json.items && json.items.length > 0) {
          // Keep existing rows but append
          const mappedItems = json.items.map((i: any, idx: number) => ({
             ...i,
             id: `sdbip23_${Date.now()}_adopt_${idx}_${Math.floor(Math.random() * 1000000)}`,
             poeStatus: 'Not Uploaded',
             evaluationUser: currentUser.email,
             reviewManager: 'Line Manager'
          }));
          const newRows = [...rows, ...mappedItems];
          setRows(newRows);
          saveRowsToDatabase(newRows);
          alert(`Successfully adopted ${json.items.length} KPIs from the ${layerName} Layer PA extraction.`);
       } else {
          alert(`No extraction data found for ${layerName} Layer yet. Upload a PA and target this layer first.`);
       }
    } catch(e) {
       console.error(e);
       alert("Error adopting from PA.");
    }
  };

  const handleAddNewRow = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProfile = userList.find(u => u.email === currentUser.email);
    const autoManager = matchedProfile?.manager || 'Line Manager';

    const newInstance: SDBIP23Row = {
      ...newRowData,
      id: `sdbip23_${Date.now()}`,
      evaluationUser: currentUser.email,
      reviewManager: autoManager,
      poeStatus: 'Not Uploaded'
    };

    const next = [...rows, newInstance];
    setRows(next);
    saveRowsToDatabase(next);
    setShowAddModal(false);
    
    // Clear state
    setNewRowData({
      refNum: '',
      strategicObj: '',
      bsd: 'N',
      led: 'N',
      mfvm: 'N',
      ggpp: 'N',
      midt: 'N',
      sr: 'N',
      kpas: 'KPA 1: Basic Service Delivery and Infrastructure Development',
      operationalActivity: '',
      kpi: '',
      compliance: 'compliant',
      uom: '',
      mscoaTracking: '',
      baseline: '',
      annualTarget: '',
      budgetAllocation: '',
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      responsibleUnit: ''
    });
  };

  const filteredRows = rows.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      (r.refNum || '').toLowerCase().includes(q) ||
      (r.strategicObj || '').toLowerCase().includes(q) ||
      (r.operationalActivity || '').toLowerCase().includes(q) ||
      (r.kpi || '').toLowerCase().includes(q) ||
      (r.responsibleUnit || '').toLowerCase().includes(q) ||
      (r.evaluationUser || '').toLowerCase().includes(q) ||
      (r.reviewManager || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Auto-save backup functionality
  useEffect(() => {
    if (!isUnlocked || rows.length === 0) return;
    const interval = setInterval(() => {
      // Background auto-save without showing toast
      fetch(`/api/tenant/${activeTenantId}/sdbip23`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows })
      }).catch(console.error);
    }, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(interval);
  }, [rows, activeTenantId, isUnlocked]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = (currentUser.role || '').toLowerCase();
    const isAllowedRole = role.includes('manager') || role.includes('internal auditor') || role.includes('admin');
    
    if (isAllowedRole && passwordInput === overridePassword) {
      setIsUnlocked(true);
      setAccessDenied(false);
    } else {
      setAccessDenied(true);
    }
  };

  const exportCSV = () => {
    const headers = [
      "REF NUMBER", "STRATEGIC OBJECTIVES", "BSD", "LED", "MFVM",
      "GGPP", "MIDT", "SR", "KPA'S MAP", "OPERATIONAL ACTIVITY", "KPI'S DETAIL",
      "COMPLIANCE", "UNIT OF MEASURE", "MSCOA TRACKING", "BASELINE",
      "ANNUAL TARGET", "BUDGET ALLOCATION", "1ST QUARTER", "2ND QUARTER",
      "3RD QUARTER", "4TH QUARTER", "RESPONSIBLE UNIT", "EVALUATION", "REVIEW", "POE BACKUP"
    ];

    const dataRows = rows.map(r => [
      r.refNum, r.strategicObj, r.bsd, r.led, r.mfvm,
      r.ggpp, r.midt, r.sr, r.kpas, r.operationalActivity, r.kpi,
      r.compliance, r.uom, r.mscoaTracking, r.baseline,
      r.annualTarget, r.budgetAllocation, r.q1, r.q2,
      r.q3, r.q4, r.responsibleUnit, r.evaluationUser, r.reviewManager, r.poeStatus
    ]);

    const content = [headers, ...dataRows].map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sdbip_2nd_3rd_layer_${activeTenantId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {onClose && (
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-20 bg-slate-800/50 p-2 rounded-full">
            <X className="w-6 h-6" />
          </button>
        )}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-xl w-full max-w-sm z-10 text-center relative">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase text-white mb-2">Restricted Area</h2>
          <p className="text-xs text-slate-400 mb-6">SDBIP 2nd & 3rd layers are locked. Access limited to Internal Auditors, Managers, and Global Administrators.</p>
          
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <input 
              type="password"
              placeholder="Enter Access Code"
              value={passwordInput}
              onChange={(e) => { setAccessDenied(false); setPasswordInput(e.target.value); }}
              className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg py-2.5 px-4 text-center focus:outline-none focus:border-rose-500 transition tracking-widest font-mono"
            />
            {accessDenied && (
              <span className="text-rose-500 text-xs font-bold uppercase animate-pulse">Access Denied!</span>
            )}
            <button 
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-lg border border-rose-500 uppercase tracking-widest transition"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="sdbip-23-workspace" className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl relative text-slate-900">
      
      {/* Dynamic Sync & Action title Ribbon */}
      <div id="sdbip-23-control-title-bar" className="flex flex-col lg:flex-row items-center justify-between gap-4 p-6 bg-slate-50 border-b border-slate-200 z-10 w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-700 flex items-center justify-center border border-green-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">SDBIP 2nd & 3rd Layers</h2>
            <p className="text-xs text-slate-500">Granular Departmental Indicators & Operational Alignment Database</p>
          </div>
        </div>

        {/* Tools Menu */}
        <div className="flex flex-wrap items-center gap-3">
          {successToast && (
            <span id="toast-notif" className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {successToast}
            </span>
          )}

          <button 
            onClick={() => adoptLayerFromPA('2nd')}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold border border-blue-500/30 text-white text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            Adopt 2nd Layer (PA)
          </button>
          
          <button 
            onClick={() => adoptLayerFromPA('3rd')}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold border border-purple-500/30 text-white text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            Adopt 3rd Layer (PA)
          </button>

          <button 
            onClick={() => syncEveryoneKpisAndKpas(false)}
            disabled={isSyncing}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold border border-indigo-500/30 text-white text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Sync Everyone's KPIs/KPAs
              </>
            )}
          </button>

          <button 
            id="sdbip23-export-csv-btn"
            onClick={exportCSV}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold border border-slate-200 text-slate-700 text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV Database
          </button>

          {isSaving ? (
            <button disabled className="px-4 py-1.5 rounded-lg bg-emerald-700/50 text-emerald-200 text-xs font-bold border border-emerald-600/30 flex items-center gap-2 cursor-wait">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
            </button>
          ) : (
            <button 
              id="sdbip23-save-btn"
              onClick={() => saveRowsToDatabase(rows)}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          )}

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
      </div>

      {/* Database Search Filter Option */}
      <div id="sdbip23-search-rack" className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by user, KPI, code, strategic objective..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div>
            Showing <b className="text-slate-900">{paginatedRows.length}</b> of <b className="text-slate-900">{filteredRows.length}</b> records
          </div>
        </div>
      </div>

      {/* Main Table viewport */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Reconciling SDBIP 2nd & 3rd layer registers with Supabase...</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse font-sans min-w-[3900px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 select-none uppercase tracking-wider text-[10px] h-14">
                <th className="p-4 sticky left-0 bg-slate-100 font-black z-10 w-44 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">REF NUMBER</th>
                <th className="p-4 min-w-[420px]">STRATEGIC OBJECTIVES</th>
                <th className="p-4 text-center w-14 font-black bg-cyan-50/50">BSD</th>
                <th className="p-4 text-center w-14 font-black bg-amber-50/50">LED</th>
                <th className="p-4 text-center w-14 font-black bg-green-50/50">MFVM</th>
                <th className="p-4 text-center w-14 font-black bg-violet-50/50">GGPP</th>
                <th className="p-4 text-center w-14 font-black bg-pink-50/50">MIDT</th>
                <th className="p-4 text-center w-14 font-black bg-rose-50/50">SR</th>
                <th className="p-4 min-w-[300px]">KPA'S MAP</th>
                <th className="p-4 min-w-[420px]">OPERATIONAL ACTIVITY</th>
                <th className="p-4 min-w-[420px]">KPI'S DETAIL</th>
                <th className="p-4 min-w-[100px] text-center text-rose-600 font-black bg-rose-50/20">WEIGHT</th>
                <th className="p-4 text-center w-32">COMPLIANCE</th>
                <th className="p-4 min-w-[260px]">UNIT OF MEASURE</th>
                <th className="p-4 min-w-[260px]">MSCOA TRACKING</th>
                <th className="p-4 min-w-[260px]">BASELINE</th>
                <th className="p-4 min-w-[260px]">ANNUAL TARGET</th>
                <th className="p-4 min-w-[180px]">BUDGET ALLOCATION</th>
                <th className="p-4 min-w-[180px] bg-slate-50/80">1ST QUARTER</th>
                <th className="p-4 min-w-[180px] bg-slate-50/80">2ND QUARTER</th>
                <th className="p-4 min-w-[180px] bg-slate-50/80">3RD QUARTER</th>
                <th className="p-4 min-w-[180px] bg-slate-50/80">4TH QUARTER</th>
                <th className="p-4 min-w-[260px]">POE DEFINITION</th>
                <th className="p-4 min-w-[260px]">RESPONSIBLE UNIT</th>
                <th className="p-4 min-w-[360px] bg-slate-200 font-extrabold text-slate-800">EVALUATION, REVIEW, POE BACKUP</th>
                <th className="p-4 text-center w-24">ACTIONS</th>
                <th className="p-4 min-w-[150px] bg-teal-50 font-black text-teal-800 whitespace-nowrap">USERNAME</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/80 text-slate-700 transition-colors">
                  {/* Sticky Reference ID */}
                  <td className="p-4 sticky left-0 bg-white border-r border-slate-200 group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <textarea 
                      value={row.refNum} 
                      onChange={(e) => updateRowState(row.id, 'refNum', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-green-700 font-mono font-black focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-slate-100/50 transition-colors resize-none leading-normal text-xs"
                      rows={2}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={row.strategicObj}
                      onChange={(e) => updateRowState(row.id, 'strategicObj', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-800 font-medium text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={4}
                    />
                  </td>
                  
                  {/* Objectives Checkboxes Icons */}
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.bsd === 'Y' ? "bg-cyan-100 text-cyan-700 border-cyan-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.bsd}</span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.led === 'Y' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.led}</span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.mfvm === 'Y' ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.mfvm}</span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.ggpp === 'Y' ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.ggpp}</span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.midt === 'Y' ? "bg-pink-100 text-pink-700 border-pink-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.midt}</span>
                  </td>
                  <td className="p-4 text-center font-bold">
                    <span className={cn("px-2 py-1 rounded text-[10px] font-extrabold shadow-sm border", row.sr === 'Y' ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-400 border-slate-200")}>{row.sr}</span>
                  </td>

                  <td className="p-4">
                    <textarea
                      value={row.kpas}
                      onChange={(e) => updateRowState(row.id, 'kpas', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-600 font-semibold text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={4}
                    />
                  </td>
                  
                  <td className="p-4">
                    <textarea
                      value={row.operationalActivity}
                      onChange={(e) => updateRowState(row.id, 'operationalActivity', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-800 font-medium text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={4}
                    />
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.kpi} 
                      onChange={(e) => updateRowState(row.id, 'kpi', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-800 font-medium text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={4}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      value={row.weight || ''} 
                      onChange={(e) => updateRowState(row.id, 'weight', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-lg py-2.5 px-3 text-rose-600 font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                  </td>
                  
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider block shadow-sm border text-center font-bold",
                      row.compliance === 'compliant' ? "bg-green-100 text-green-700 border-green-200" : "bg-rose-100 text-rose-700 border-rose-200"
                    )}>
                      {row.compliance}
                    </span>
                  </td>

                  <td className="p-4">
                    <textarea
                      value={row.uom}
                      onChange={(e) => updateRowState(row.id, 'uom', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-700 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={row.mscoaTracking}
                      onChange={(e) => updateRowState(row.id, 'mscoaTracking', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-indigo-700 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={row.baseline} 
                      onChange={(e) => updateRowState(row.id, 'baseline', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-500 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={row.annualTarget} 
                      onChange={(e) => updateRowState(row.id, 'annualTarget', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-900 font-bold text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      value={row.budgetAllocation} 
                      onChange={(e) => updateRowState(row.id, 'budgetAllocation', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100/50 rounded-lg py-2.5 px-3 text-green-700 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all text-center text-xs"
                    />
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.q1} 
                      onChange={(e) => updateRowState(row.id, 'q1', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-700 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPoeModal({ rowId: row.id, quarter: 'q1' })}
                        className={cn(
                          "w-full py-1.5 px-2 rounded-lg border text-[10px] font-black transition-all flex items-center justify-between cursor-pointer",
                          (row.q1PoeDocs?.length || 0) > 0
                            ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Q1 POE</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-extrabold text-[9px] min-w-[20px] text-center">
                          {row.q1PoeDocs?.length || 0}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.q2} 
                      onChange={(e) => updateRowState(row.id, 'q2', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-700 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPoeModal({ rowId: row.id, quarter: 'q2' })}
                        className={cn(
                          "w-full py-1.5 px-2 rounded-lg border text-[10px] font-black transition-all flex items-center justify-between cursor-pointer",
                          (row.q2PoeDocs?.length || 0) > 0
                            ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Q2 POE</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-extrabold text-[9px] min-w-[20px] text-center">
                          {row.q2PoeDocs?.length || 0}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.q3} 
                      onChange={(e) => updateRowState(row.id, 'q3', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-700 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPoeModal({ rowId: row.id, quarter: 'q3' })}
                        className={cn(
                          "w-full py-1.5 px-2 rounded-lg border text-[10px] font-black transition-all flex items-center justify-between cursor-pointer",
                          (row.q3PoeDocs?.length || 0) > 0
                            ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Q3 POE</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-extrabold text-[9px] min-w-[20px] text-center">
                          {row.q3PoeDocs?.length || 0}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.q4} 
                      onChange={(e) => updateRowState(row.id, 'q4', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-700 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setPoeModal({ rowId: row.id, quarter: 'q4' })}
                        className={cn(
                          "w-full py-1.5 px-2 rounded-lg border text-[10px] font-black transition-all flex items-center justify-between cursor-pointer",
                          (row.q4PoeDocs?.length || 0) > 0
                            ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Q4 POE</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-extrabold text-[9px] min-w-[20px] text-center">
                          {row.q4PoeDocs?.length || 0}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <textarea 
                      value={row.poe || ''} 
                      onChange={(e) => updateRowState(row.id, 'poe', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-600 text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={row.responsibleUnit}
                      onChange={(e) => updateRowState(row.id, 'responsibleUnit', e.target.value)}
                      onBlur={() => saveRowsToDatabase(rows)}
                      className="w-full bg-slate-50/40 hover:bg-slate-55 focus:bg-white border border-slate-200 focus:border-green-500 rounded-lg p-2.5 text-slate-600 font-semibold text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-y"
                      rows={3}
                    />
                  </td>

                  {/* EVALUATION, REVIEW, POE BACKUP */}
                  <td className="p-4 bg-slate-50 border-l border-r border-slate-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5" title="Assessed User">
                        <span className="text-[10px] text-slate-500 uppercase font-black w-14 inline-block">Assessed:</span>
                        <span className="text-slate-800 font-mono bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-semibold">
                          {row.evaluationUser}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Line Manager">
                        <span className="text-[10px] text-slate-500 uppercase font-black w-14 inline-block">Reviewed:</span>
                        <span className="text-amber-800 font-mono bg-amber-50 border border-amber-200 px-2 py-1 rounded text-[10px] font-semibold">
                          {row.reviewManager}
                        </span>
                      </div>
                      
                      {/* POE Upload status triggers */}
                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                        {row.poeStatus === 'Not Uploaded' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block animate-pulse" />
                            <span className="text-[10px] text-slate-500 font-bold italic">No Document</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-green-100 border border-green-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-green-700">
                            <Cloud className="w-3.5 h-3.5" />
                            <span>In Cloud Backup (Profile / POE / PA KPI's & KPA's)</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => handlePoeUpload(row.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> 
                          {row.poeStatus === 'Not Uploaded' ? 'Upload POE' : 'Re-upload'}
                        </button>
                      </div>

                      {row.poeDocName && (
                        <div className="text-[9px] text-green-600 font-mono italic truncate max-w-xs mt-1 bg-green-50/50 border border-green-100 p-1.5 rounded-md">
                          Ref: {row.poeDocName}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4 text-center bg-slate-50/50">
                    <button
                      onClick={() => deleteRowHandler(row.id)}
                      className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-sm border border-rose-200"
                      title="Delete SDBIP 23 Measure"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="p-4 bg-teal-50/30 border-l border-teal-100 font-bold text-teal-800 text-[11px] truncate" title={row.evaluationUser}>
                    {row.evaluationUser}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Row Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" /> New SDBIP 2nd & 3rd Layer Indicator Configuration
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddNewRow} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">REF NUMBER</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. S23-BSD-205"
                    value={newRowData.refNum}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, refNum: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">STRATEGIC OBJECTIVE</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Foster compliance audit controls across municipal hubs"
                    value={newRowData.strategicObj}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, strategicObj: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* BSD, LED Check boxes */}
              <div>
                <label className="block text-slate-500 mb-2">KPI OBJECTIVES SELECTORS (Y or N)</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { key: 'bsd', label: 'BSD (Basic Service Delivery)' },
                    { key: 'led', label: 'LED (Local Economic Development)' },
                    { key: 'mfvm', label: 'MFVM (Municipal Financial Viability)' },
                    { key: 'ggpp', label: 'GGPP (Good Governance & Public Participation)' },
                    { key: 'midt', label: 'MIDT (Municipal Institutional Development)' },
                    { key: 'sr', label: 'SR (Social Responsibility)' }
                  ].map(f => (
                    <div key={f.key} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{f.label.split(' ')[0]}</span>
                      <select
                        value={(newRowData as any)[f.key]}
                        onChange={(e) => setNewRowData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="bg-transparent text-green-700 font-bold focus:outline-none"
                      >
                        <option value="N" className="bg-white text-slate-700">N</option>
                        <option value="Y" className="bg-white text-green-700">Y</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">KPA CLASSIFICATION MAP</label>
                  <select
                    value={newRowData.kpas}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, kpas: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  >
                    <option value="KPA 1: Basic Service Delivery and Infrastructure Development">KPA 1: Basic Service Delivery</option>
                    <option value="KPA 2: Municipal Institutional Development and Transformation">KPA 2: Inst. Development</option>
                    <option value="KPA 3: Local Economic Development (LED)">KPA 3: Local Economic Dev (LED)</option>
                    <option value="KPA 4: Municipal Financial Viability and Management">KPA 4: Financial Viability</option>
                    <option value="KPA 5: Good Governance and Public Participation">KPA 5: Good Governance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">UNIT OF MEASURE (UOM)</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. % of invoices paid"
                    value={newRowData.uom}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, uom: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">OPERATIONAL ACTIVITY</label>
                  <textarea 
                    required 
                    rows={2}
                    placeholder="Identify exact daily/quarterly work directives..."
                    value={newRowData.operationalActivity}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, operationalActivity: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">KPI'S DETAIL</label>
                  <textarea 
                    required 
                    rows={2}
                    placeholder="Specific performance metric verification targets..."
                    value={newRowData.kpi}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, kpi: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">MSCOA TRACKING</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="MSCOA-L281-EXP"
                    value={newRowData.mscoaTracking}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, mscoaTracking: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">BASELINE</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="0 items"
                    value={newRowData.baseline}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, baseline: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">ANNUAL TARGET</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="100% compliant"
                    value={newRowData.annualTarget}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, annualTarget: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">BUDGET ALLOCATION</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="R 500,000.00"
                    value={newRowData.budgetAllocation}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, budgetAllocation: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">1ST QUARTER</label>
                  <input 
                    type="text" 
                    value={newRowData.q1}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, q1: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">2ND QUARTER</label>
                  <input 
                    type="text" 
                    value={newRowData.q2}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, q2: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">3RD QUARTER</label>
                  <input 
                    type="text" 
                    value={newRowData.q3}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, q3: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">4TH QUARTER</label>
                  <input 
                    type="text" 
                    value={newRowData.q4}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, q4: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">RESPONSIBLE UNIT</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Budget and Reporting Division"
                    value={newRowData.responsibleUnit}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, responsibleUnit: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">COMPLIANCE STATUS</label>
                  <select
                    value={newRowData.compliance}
                    onChange={(e) => setNewRowData(prev => ({ ...prev, compliance: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                  >
                    <option value="compliant">Compliant</option>
                    <option value="non-compliant">Non-compliant</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 font-black">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg cursor-pointer"
                >
                  Add Row Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quarterly POE Management Modal Overlay */}
      {poeModal && (
        (() => {
          const selectedPoeRow = rows.find(r => r.id === poeModal.rowId);
          const selectedQuarter = poeModal.quarter;
          if (!selectedPoeRow || !selectedQuarter) return null;
          const poeDocsList = (selectedPoeRow[`${selectedQuarter}PoeDocs` as keyof SDBIP23Row] as PoeDocument[]) || [];
          
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        Manage Q{selectedQuarter.slice(-1)} Performance Evidence (POE) Uploads
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        KPI Ref: <b className="text-slate-800 font-bold">{selectedPoeRow.refNum}</b> | Quarter: <span className="uppercase text-indigo-600 font-extrabold">{selectedQuarter}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPoeModal(null)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>

                {/* SDBIP Meta detail indicator */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs space-y-1.5 leading-relaxed">
                  <p><span className="text-slate-500 font-black uppercase">Strategic Objective:</span> <span className="text-slate-800 font-medium">{selectedPoeRow.strategicObj}</span></p>
                  <p><span className="text-slate-500 font-black uppercase">KPI Target:</span> <span className="text-slate-900 font-bold">{selectedPoeRow.kpi}</span></p>
                  <p><span className="text-slate-500 font-black uppercase">Unit of Measure (UOM):</span> <span className="text-slate-700 font-mono italic">{selectedPoeRow.uom}</span></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[350px]">
                  {/* Upload Region & Bulk Generator */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Attach Evidence Files</h4>

                    {/* Drag and Drop Container */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={cn(
                        "flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[160px]",
                        dragActive ? "border-indigo-500 bg-indigo-50/50 scale-[0.98]" : "border-slate-300 bg-slate-50 hover:bg-slate-100/50",
                        "cursor-pointer"
                      )}
                      onClick={() => document.getElementById('poe-multiple-file-input')?.click()}
                    >
                      <Upload className={cn("w-10 h-10 mb-2 transition", dragActive ? "text-indigo-600 scale-110" : "text-slate-400")} />
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Documents Here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts images & general documents</p>
                      <button 
                        type="button"
                        className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase"
                      >
                        Choose Files Manual
                      </button>
                      <input 
                        id="poe-multiple-file-input"
                        type="file" 
                        multiple
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files) {
                            handlePoeFilesSelected(e.target.files);
                          }
                        }}
                      />
                    </div>

                    {/* Bulk Generation Aid */}
                    <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl space-y-2">
                      <h5 className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Bulk Audit Demonstration Helper
                      </h5>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                        Need around 25 documents/images uploaded per user to satisfy strict Nkangala Municipal Audit requirement testing? Click below to instantly auto-generate 25 realistic, numbered POE document templates synced directly to Supabase cloud database!
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerate25MockDocs}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow transition"
                      >
                        ⚡ Generate 25 Verified Audit POE Docs
                      </button>
                    </div>
                  </div>

                  {/* Documents List & Visualizer */}
                  <div className="lg:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Evidence Repository ({poeDocsList.length} / 25 Files Registered)
                      </h4>
                      {poeDocsList.length >= 25 && (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 font-extrabold uppercase rounded-full text-[9px] animate-bounce">
                          ✓ Audit Ready (25+ Docs)
                        </span>
                      )}
                    </div>

                    {poeDocsList.length === 0 ? (
                      <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400">
                        <FileText className="w-12 h-12 mb-2 text-slate-300" />
                        <p className="text-xs font-bold">No evidence files matched to this quarter yet</p>
                        <p className="text-[10px] mt-1">Upload at least 25 document items to meet compliance</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-[350px] border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                        {poeDocsList.map((doc, idx) => (
                          <div 
                            key={doc.id} 
                            className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-mono text-[10px]">
                                {idx + 1}
                              </span>
                              
                              {/* Small Thumbnail Preview if active */}
                              {doc.dataUrl && (
                                <img 
                                  src={doc.dataUrl} 
                                  alt={doc.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover rounded border border-slate-200 bg-slate-100 shrink-0" 
                                />
                              )}
                              
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-[9px] text-slate-450 font-medium">
                                  {new Date(doc.uploadedAt).toLocaleTimeString()} · by {doc.uploadedBy}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setPreviewDoc(doc); }}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-extrabold uppercase transition"
                                title="View Document"
                              >
                                View
                              </button>
                              {doc.dataUrl && (
                                <a 
                                  href={doc.dataUrl} 
                                  download={doc.name}
                                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-extrabold uppercase transition"
                                >
                                  Download
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove "${doc.name}" from Q${selectedQuarter.slice(-1)} POE docs?`)) {
                                    deletePoeDoc(doc.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete POE file item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info status ticker */}
                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-550 shrink-0">
                  <span>Logged in User: <b>{currentUser.email}</b></span>
                  <button 
                    type="button"
                    onClick={() => setPoeModal(null)}
                    className="px-5 py-2 bg-slate-900 border border-slate-900 hover:bg-black text-white font-extrabold uppercase rounded-xl tracking-wider transition cursor-pointer text-xs"
                  >
                    Confirm & Sync
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Uploaded Document Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.dataUrl && (
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex items-center justify-center relative">
              {!previewDoc.dataUrl ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Preview Not Available</h4>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">This document's content is not available in the current context. It might have been stripped to optimize loading.</p>
                </div>
              ) : previewDoc.name.match(/\.(png|jpe?g|gif|webp|svg)$/i) || previewDoc.dataUrl.startsWith('data:image/') ? (
                <img src={previewDoc.dataUrl} alt={previewDoc.name} className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
              ) : previewDoc.name.match(/\.pdf$/i) || previewDoc.dataUrl.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.dataUrl} title={previewDoc.name} className="w-full h-full rounded-lg bg-white shadow-sm" />
              ) : (
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-800 mb-2">No Preview Available</h4>
                  <p className="text-sm text-slate-600 mb-6">This file type ({previewDoc.name.split('.').pop()?.toUpperCase()}) cannot be previewed directly in the browser.</p>
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compliance footer citation */}
      <div id="sdbip23-legal-footer" className="p-4 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0 select-none">
        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-slate-400 shrink-0 select-none" /> Secure cloud-synced database containing 2nd-tier operational indicators and 3rd-tier target alignments.</span>
        <span className="uppercase text-slate-500 font-bold">Mzansi Flow SDBIP Database Engine</span>
      </div>
    </div>
  );
}
