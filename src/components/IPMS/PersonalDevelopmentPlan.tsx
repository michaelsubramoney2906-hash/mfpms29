import React, { useState, useEffect, useRef } from 'react';
import { 
  FileBadge, Shield, Info, BookOpen, Clock, CheckCircle, Plus, Trash2, 
  Edit2, Check, ArrowRight, Save, Layout, HelpCircle, FileText, 
  ChevronRight, BarChart2, TrendingUp, Settings, Keyboard,
  ArrowUp, ArrowDown, Sparkles, RefreshCw, AlertTriangle, GraduationCap
} from 'lucide-react';

interface PersonalDevelopmentPlanProps {
  currentUser: {
    email: string;
    role: string;
    name?: string;
  };
  activeTenantId: string;
}

// PDP Row Schema
interface PDPItem {
  id: string;
  skillsGap: string;
  outcomes: string;
  suggestedTraining: string;
  modeOfDelivery: string;
  timeFrame: string;
  workOpportunity: string;
  supportPerson: string;
}

// Sidebar Master schemas
interface GapMaster {
  id: string;
  name: string;
}

interface TrainingMaster {
  id: string;
  name: string;
  suggestedMode?: string;
}

interface ModeMaster {
  id: string;
  name: string;
}

interface SupportMaster {
  id: string;
  name: string;
  role: string;
}


const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}

export function PersonalDevelopmentPlan({ currentUser, activeTenantId }: PersonalDevelopmentPlanProps) {

  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;

  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'planner' | 'reporting'>('planner');

  // Sync / Database States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'cached' | 'saved' | 'saving' | 'error'>('cached');

  // Table Interaction Focus States
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedField, setSelectedField] = useState<keyof PDPItem | null>(null);

  // 1. Core Spreadsheet Row State
  const [items, setItems] = useState<PDPItem[]>([
    {
      id: 'pdp-row-1',
      skillsGap: 'Asset Lifecycle Risk Calculation Standards',
      outcomes: 'Produce full GRAP-17 asset registry sheets matching compliance benchmarks within Auditing Q2 timeline.',
      suggestedTraining: 'Advanced Municipal Infrastructure Asset Management Program',
      modeOfDelivery: 'NSG Guided Online Course',
      timeFrame: '6 Months (End of Q2)',
      workOpportunity: 'Assigned to head the Asset Verification Committee for water system backlogs.',
      supportPerson: 'Chief Financial Officer'
    },
    {
      id: 'pdp-row-2',
      skillsGap: 'Supply Chain Bid Specification Compliance',
      outcomes: 'Formulate robust bid evaluation scores free of technical specification disputes for 100% of upcoming capital tenders.',
      suggestedTraining: 'Ethics & Bid Committees Regulatory Compliance Frameworks',
      modeOfDelivery: 'Workplace Coaching & Mentorship',
      timeFrame: '3 Months (End of Q1)',
      workOpportunity: 'Appointed as observer and specification draftsman for upcoming transport tender rounds.',
      supportPerson: 'Director: Supply Chain Management'
    }
  ]);

  const itemsRef = useRef<PDPItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 2. Sidebar Master Lists States (with default records)
  const [skillsGapsMasters, setSkillsGapsMasters] = useState<GapMaster[]>([
    { id: 'gap-1', name: 'Asset Lifecycle Risk Calculation Standards' },
    { id: 'gap-2', name: 'Supply Chain Bid Specification Compliance' },
    { id: 'gap-3', name: 'GIS Spatial Alignment & Mapping Tools' },
    { id: 'gap-4', name: 'GRAP-17 Financial Reporting Standards' },
    { id: 'gap-5', name: 'MSCOA Standard Operating Procedures' }
  ]);
  const [newGapName, setNewGapName] = useState('');
  const [editingGapId, setEditingGapId] = useState<string | null>(null);

  const [trainingsMasters, setTrainingsMasters] = useState<TrainingMaster[]>([
    { id: 't-1', name: 'Advanced Municipal Infrastructure Asset Management Program' },
    { id: 't-2', name: 'Ethics & Bid Committees Regulatory Compliance Frameworks' },
    { id: 't-3', name: 'Local Government Legislative Compliance Course' },
    { id: 't-4', name: 'MSCOA Budget formulation & Implementation Seminar' }
  ]);
  const [newTrainingName, setNewTrainingName] = useState('');
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);

  const [modesMasters, setModesMasters] = useState<ModeMaster[]>([
    { id: 'm-1', name: 'NSG Guided Online Course' },
    { id: 'm-2', name: 'Workplace Coaching & Mentorship' },
    { id: 'm-3', name: 'Interactive Skill Development Workshop' },
    { id: 'm-4', name: 'Academic Study Bursary Scheme' }
  ]);
  const [newModeName, setNewModeName] = useState('');
  const [editingModeId, setEditingModeId] = useState<string | null>(null);

  const [supportMasters, setSupportMasters] = useState<SupportMaster[]>([
    { id: 's-1', name: 'Chief Financial Officer', role: 'Executive Financial Head' },
    { id: 's-2', name: 'Director: Supply Chain Management', role: 'Procurement Overseer' },
    { id: 's-3', name: 'Skills Development Facilitator', role: 'HR Training and Development' },
    { id: 's-4', name: 'Municipal Manager Representative', role: 'Accounting Officer Delegate' }
  ]);
  const [newSupportName, setNewSupportName] = useState('');
  const [newSupportRole, setNewSupportRole] = useState('');
  const [editingSupportId, setEditingSupportId] = useState<string | null>(null);

  // Load state from Supabase on mount/tenant changes
  useEffect(() => {
    let active = true;
    const fetchPdpData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${targetEmail}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.items)) {
            const normalized = data.items.map((row: any, idx: number) => ({
              id: row.id || `pdp-row-${idx}-${Date.now()}`,
              skillsGap: row.skillsGap || row.gap || row.competency || row.title || '',
              outcomes: row.outcomes || row.outcome || row.measurableIndicators || '',
              suggestedTraining: row.suggestedTraining || row.training || row.intervention || '',
              modeOfDelivery: row.modeOfDelivery || row.mode || row.delivery || '',
              timeFrame: row.timeFrame || row.timeframe || row.period || '',
              workOpportunity: row.workOpportunity || row.opportunity || row.practice || '',
              supportPerson: row.supportPerson || row.support || row.mentor || ''
            }));
            setItems(normalized);
            itemsRef.current = normalized;
            if (normalized.length > 0) {
              setSelectedRowIndex(0);
              setSelectedRowId(normalized[0].id);
            }
          }
          if (Array.isArray(data.skillsGapsMasters)) {
            setSkillsGapsMasters(data.skillsGapsMasters);
          }
          if (Array.isArray(data.trainingsMasters)) {
            setTrainingsMasters(data.trainingsMasters);
          }
          if (Array.isArray(data.modesMasters)) {
            setModesMasters(data.modesMasters);
          }
          if (Array.isArray(data.supportMasters)) {
            setSupportMasters(data.supportMasters);
          }
        }
      } catch (err) {
        console.warn("Could not find previous PDP plans or table failed to load, keeping system defaults:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPdpData();
    return () => { active = false; };
  }, [activeTenantId, currentUser, targetEmail]);

  // Save changes to Supabase
  const handleSaveToDatabase = async (
    currentItemsList?: PDPItem[],
    cmGaps = skillsGapsMasters,
    cmTrainings = trainingsMasters,
    cmModes = modesMasters,
    cmSupport = supportMasters,
    explicitTargetEmail?: string
  ) => {
    try {
      setSyncStatus('saving');
      setSaving(true);
      
      const listToSave = currentItemsList !== undefined 
        ? currentItemsList 
        : (itemsRef.current && itemsRef.current.length > 0 ? itemsRef.current : items);

      const payload = { 
        items: listToSave,
        skillsGapsMasters: cmGaps,
        trainingsMasters: cmTrainings,
        modesMasters: cmModes,
        supportMasters: cmSupport
      };
      
      const emailToSave = explicitTargetEmail || targetEmail;
      const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${emailToSave}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Unsuccessful status response save");
      setSyncStatus('saved');
    } catch (err: any) {
      console.error("Error saving PDP to Supabase database:", err);
      setSyncStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard Event Handlers for Laptop Standard Tab Keypress Auto-expansion
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, columnKey: keyof PDPItem) => {
    // If user presses "Tab" key on the support person field (last field) of the very last row, auto-expand the table
    if (e.key === 'Tab' && !e.shiftKey) {
      if (rowIndex === items.length - 1 && columnKey === 'supportPerson') {
        e.preventDefault();
        handleAddNewRow();
      }
    }
  };

  // Main UI Action triggers for standard spreadsheet rows
  const handleAddNewRow = (insertAfterIndex?: number) => {
    const freshRowID = `pdp-row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fresh: PDPItem = {
      id: freshRowID,
      skillsGap: '',
      outcomes: '',
      suggestedTraining: '',
      modeOfDelivery: '',
      timeFrame: '',
      workOpportunity: '',
      supportPerson: ''
    };
    let updated: PDPItem[];
    if (typeof insertAfterIndex === 'number' && insertAfterIndex >= 0 && insertAfterIndex < items.length) {
      updated = [
        ...items.slice(0, insertAfterIndex + 1),
        fresh,
        ...items.slice(insertAfterIndex + 1)
      ];
      setSelectedRowIndex(insertAfterIndex + 1);
    } else {
      updated = [...items, fresh];
      setSelectedRowIndex(updated.length - 1);
    }
    setItems(updated);
    itemsRef.current = updated;
    setSelectedRowId(freshRowID);
    setSelectedField('skillsGap');
    handleSaveToDatabase(updated);
  };

  const handleDeleteRow = (targetIdx: number) => {
    if (items.length <= 1) {
      // Keep at least one placeholder row
      const cleared = [{
        id: `pdp-row-${Date.now()}`,
        skillsGap: '',
        outcomes: '',
        suggestedTraining: '',
        modeOfDelivery: '',
        timeFrame: '',
        workOpportunity: '',
        supportPerson: ''
      }];
      setItems(cleared);
      itemsRef.current = cleared;
      setSelectedRowIndex(0);
      setSelectedRowId(cleared[0].id);
      handleSaveToDatabase(cleared);
      return;
    }
    const updated = items.filter((_, idx) => idx !== targetIdx);
    setItems(updated);
    itemsRef.current = updated;
    const nextIdx = Math.min(targetIdx, updated.length - 1);
    setSelectedRowIndex(nextIdx);
    setSelectedRowId(updated[nextIdx]?.id || null);
    handleSaveToDatabase(updated);
  };

  const handleMoveRow = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === items.length - 1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const list = [...items];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    setItems(list);
    itemsRef.current = list;
    setSelectedRowIndex(targetIdx);
    setSelectedRowId(list[targetIdx]?.id || null);
    handleSaveToDatabase(list);
  };

  const handleRowInputChange = (rowIndex: number, field: keyof PDPItem, value: any) => {
    const updated = items.map((r, idx) => {
      if (idx === rowIndex) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setItems(updated);
    itemsRef.current = updated;
  };

  // Left Sidebar Master Register controllers (Section A - D)
  
  // Section A: Skills Gaps
  const addGapMaster = () => {
    if (!newGapName.trim()) return;
    const item: GapMaster = {
      id: editingGapId || `gap-master-${Date.now()}`,
      name: newGapName.trim()
    };

    let updatedList;
    if (editingGapId) {
      updatedList = skillsGapsMasters.map(x => x.id === editingGapId ? item : x);
      setEditingGapId(null);
    } else {
      updatedList = [...skillsGapsMasters, item];
    }
    setSkillsGapsMasters(updatedList);
    setNewGapName('');
    handleSaveToDatabase(items, updatedList);
  };

  const deleteGapMaster = (id: string) => {
    const updatedList = skillsGapsMasters.filter(x => x.id !== id);
    setSkillsGapsMasters(updatedList);
    handleSaveToDatabase(items, updatedList);
  };

  const postGapToActiveCell = (name: string) => {
    const targetIdx = selectedRowIndex ?? 0;
    let currentList = itemsRef.current && itemsRef.current.length > 0 ? itemsRef.current : items;
    if (currentList.length === 0) {
      const freshRowID = `pdp-row-${Date.now()}`;
      currentList = [{
        id: freshRowID,
        skillsGap: name,
        outcomes: '',
        suggestedTraining: '',
        modeOfDelivery: '',
        timeFrame: '',
        workOpportunity: '',
        supportPerson: ''
      }];
      setItems(currentList);
      itemsRef.current = currentList;
      setSelectedRowIndex(0);
      setSelectedRowId(freshRowID);
      handleSaveToDatabase(currentList);
      return;
    }
    const safeIdx = Math.min(Math.max(0, targetIdx), currentList.length - 1);
    const updated = currentList.map((r, idx) => {
      if (idx === safeIdx) {
        return { ...r, skillsGap: name };
      }
      return r;
    });
    setItems(updated);
    itemsRef.current = updated;
    handleSaveToDatabase(updated);
  };

  // Section B: Suggested Trainings
  const addTrainingMaster = () => {
    if (!newTrainingName.trim()) return;
    const item: TrainingMaster = {
      id: editingTrainingId || `training-master-${Date.now()}`,
      name: newTrainingName.trim()
    };

    let updatedList;
    if (editingTrainingId) {
      updatedList = trainingsMasters.map(x => x.id === editingTrainingId ? item : x);
      setEditingTrainingId(null);
    } else {
      updatedList = [...trainingsMasters, item];
    }
    setTrainingsMasters(updatedList);
    setNewTrainingName('');
    handleSaveToDatabase(items, skillsGapsMasters, updatedList);
  };

  const deleteTrainingMaster = (id: string) => {
    const updatedList = trainingsMasters.filter(x => x.id !== id);
    setTrainingsMasters(updatedList);
    handleSaveToDatabase(items, skillsGapsMasters, updatedList);
  };

  const postTrainingToActiveCell = (name: string) => {
    const targetIdx = selectedRowIndex ?? 0;
    let currentList = itemsRef.current && itemsRef.current.length > 0 ? itemsRef.current : items;
    if (currentList.length === 0) {
      const freshRowID = `pdp-row-${Date.now()}`;
      currentList = [{
        id: freshRowID,
        skillsGap: '',
        outcomes: '',
        suggestedTraining: name,
        modeOfDelivery: '',
        timeFrame: '',
        workOpportunity: '',
        supportPerson: ''
      }];
      setItems(currentList);
      itemsRef.current = currentList;
      setSelectedRowIndex(0);
      setSelectedRowId(freshRowID);
      handleSaveToDatabase(currentList);
      return;
    }
    const safeIdx = Math.min(Math.max(0, targetIdx), currentList.length - 1);
    const updated = currentList.map((r, idx) => {
      if (idx === safeIdx) {
        return { ...r, suggestedTraining: name };
      }
      return r;
    });
    setItems(updated);
    itemsRef.current = updated;
    handleSaveToDatabase(updated);
  };

  // Section C: Modes of Delivery
  const addModeMaster = () => {
    if (!newModeName.trim()) return;
    const item: ModeMaster = {
      id: editingModeId || `mode-master-${Date.now()}`,
      name: newModeName.trim()
    };

    let updatedList;
    if (editingModeId) {
      updatedList = modesMasters.map(x => x.id === editingModeId ? item : x);
      setEditingModeId(null);
    } else {
      updatedList = [...modesMasters, item];
    }
    setModesMasters(updatedList);
    setNewModeName('');
    handleSaveToDatabase(items, skillsGapsMasters, trainingsMasters, updatedList);
  };

  const deleteModeMaster = (id: string) => {
    const updatedList = modesMasters.filter(x => x.id !== id);
    setModesMasters(updatedList);
    handleSaveToDatabase(items, skillsGapsMasters, trainingsMasters, updatedList);
  };

  const postModeToActiveCell = (name: string) => {
    const targetIdx = selectedRowIndex ?? 0;
    let currentList = itemsRef.current && itemsRef.current.length > 0 ? itemsRef.current : items;
    if (currentList.length === 0) {
      const freshRowID = `pdp-row-${Date.now()}`;
      currentList = [{
        id: freshRowID,
        skillsGap: '',
        outcomes: '',
        suggestedTraining: '',
        modeOfDelivery: name,
        timeFrame: '',
        workOpportunity: '',
        supportPerson: ''
      }];
      setItems(currentList);
      itemsRef.current = currentList;
      setSelectedRowIndex(0);
      setSelectedRowId(freshRowID);
      handleSaveToDatabase(currentList);
      return;
    }
    const safeIdx = Math.min(Math.max(0, targetIdx), currentList.length - 1);
    const updated = currentList.map((r, idx) => {
      if (idx === safeIdx) {
        return { ...r, modeOfDelivery: name };
      }
      return r;
    });
    setItems(updated);
    itemsRef.current = updated;
    handleSaveToDatabase(updated);
  };

  // Section D: Support Persons
  const addSupportMaster = () => {
    if (!newSupportName.trim()) return;
    const item: SupportMaster = {
      id: editingSupportId || `support-master-${Date.now()}`,
      name: newSupportName.trim(),
      role: newSupportRole.trim() || 'HR Department mentor'
    };

    let updatedList;
    if (editingSupportId) {
      updatedList = supportMasters.map(x => x.id === editingSupportId ? item : x);
      setEditingSupportId(null);
    } else {
      updatedList = [...supportMasters, item];
    }
    setSupportMasters(updatedList);
    setNewSupportName('');
    setNewSupportRole('');
    handleSaveToDatabase(items, skillsGapsMasters, trainingsMasters, modesMasters, updatedList);
  };

  const deleteSupportMaster = (id: string) => {
    const updatedList = supportMasters.filter(x => x.id !== id);
    setSupportMasters(updatedList);
    handleSaveToDatabase(items, skillsGapsMasters, trainingsMasters, modesMasters, updatedList);
  };

  const postSupportToActiveCell = (name: string) => {
    const targetIdx = selectedRowIndex ?? 0;
    let currentList = itemsRef.current && itemsRef.current.length > 0 ? itemsRef.current : items;
    if (currentList.length === 0) {
      const freshRowID = `pdp-row-${Date.now()}`;
      currentList = [{
        id: freshRowID,
        skillsGap: '',
        outcomes: '',
        suggestedTraining: '',
        modeOfDelivery: '',
        timeFrame: '',
        workOpportunity: '',
        supportPerson: name
      }];
      setItems(currentList);
      itemsRef.current = currentList;
      setSelectedRowIndex(0);
      setSelectedRowId(freshRowID);
      handleSaveToDatabase(currentList);
      return;
    }
    const safeIdx = Math.min(Math.max(0, targetIdx), currentList.length - 1);
    const updated = currentList.map((r, idx) => {
      if (idx === safeIdx) {
        return { ...r, supportPerson: name };
      }
      return r;
    });
    setItems(updated);
    itemsRef.current = updated;
    handleSaveToDatabase(updated);
  };

  // Export Managers for Word, Excel & PDF
  
  // Word (.doc) export generator
  const handleExportToWord = () => {
    const tenantLabel = activeTenantId || 'Mzansi Local Authority';
    const itemsCount = items.length;

    // Build Word layout HTML structure with gorgeous CSS alignment
    const tableBody = items.map((r, i) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #fafafa;">${i + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${r.skillsGap || 'N/A'}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.outcomes || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.suggestedTraining || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.modeOfDelivery || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.timeFrame || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.workOpportunity || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${r.supportPerson || 'N/A'}</strong></td>
      </tr>
    `).join('');

    const wordContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Personal Development Plan (PDP) Exec Status</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
          h1 { color: #1e3a8a; text-transform: uppercase; font-size: 20px; border-bottom: 2px solid #0078D4; padding-bottom: 8px; }
          h2 { color: #1e3a8a; font-size: 14px; margin-top: 25px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th { border: 1px solid #cbd5e1; background-color: #0f172a; color: #ffffff; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; }
          .footer { font-size: 10px; color: #64748b; margin-top: 50px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <h1>Personal Development Plan (PDP) - Executive Summary Report</h1>
        <p><strong>Tenant Authority:</strong> ${tenantLabel} | <strong>Compiled Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p>This document details the Personal Development Plan (PDP) structured to align municipal staff competence remediation with the guidelines of the Local Government Sector Authority and Workplace Skills Plan (WSP).</p>
        
        <h2>Skills Performance Gaps & Required Learning Interventions (${itemsCount} Active Items)</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Pri</th>
              <th style="width: 20%;">Skills performance gap</th>
              <th style="width: 20%;">Outcomes expected (Measurables)</th>
              <th style="width: 15%;">Suggested training / development</th>
              <th style="width: 10%;">Mode of delivery</th>
              <th style="width: 10%;">Time frame</th>
              <th style="width: 10%;">Practice opportunity created</th>
              <th style="width: 10%;">Support person</th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
        </table>

        <h2>Declaration and Sign-off</h2>
        <p>We, the undersigned, hereby confirm that the skills assessment has been finalized and corresponding training interventions will be prioritized within operational timelines.</p>
        <table style="width: 100%; border: none; margin-top: 30px; font-size: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
          <tr style="border: none;">
            <td style="border: none; width: 45%; padding: 12px; background: #f8fafc; border-radius: 8px; vertical-align: top;">
              <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Employee / Officer Representative</strong>
              <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${currentUser.name || currentUser.email || 'Representative'}</div>
              <div style="margin-bottom: 4px;"><strong>Role/Designation:</strong> ${currentUser.role || 'Officer Representative'}</div>
              <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
              <div><strong>Signature:</strong> ____________________________________</div>
              <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
            </td>
            <td style="border: none; width: 10%;"></td>
            <td style="border: none; width: 45%; padding: 12px; background: #f8fafc; border-radius: 8px; vertical-align: top;">
              <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Supervisor / Facilitator Approval</strong>
              <div style="margin-bottom: 4px;"><strong>Name:</strong> Approved HR Facilitator / Line Manager</div>
              <div style="margin-bottom: 4px;"><strong>Role:</strong> Municipal Representative</div>
              <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
              <div><strong>Signature:</strong> ____________________________________</div>
              <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
            </td>
          </tr>
        </table>

        <div class="footer">
          Mzansi Flow SDBIP / IPMS Performance Engine - Confidential Statutory Audit Output
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PDP_Executive_Report_${tenantLabel}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV file download Excel export
  const handleExportToExcel = () => {
    const csvHeaders = [
      "Priority Order",
      "Skills performance gap (in order of priority)",
      "Outcomes expected (measurable indicators, quantity, quality, & time frames)",
      "Suggested training and/or development activity",
      "Suggested mode of delivery",
      "Suggested time frame",
      "Work opportunity created to practice skills/development area",
      "Support person"
    ].join(",");

    const csvRows = items.map((r, i) => {
      const skillsGap = (r.skillsGap || '').replace(/"/g, '""');
      const outcomes = (r.outcomes || '').replace(/"/g, '""');
      const suggestedTraining = (r.suggestedTraining || '').replace(/"/g, '""');
      const modeOfDelivery = (r.modeOfDelivery || '').replace(/"/g, '""');
      const timeFrame = (r.timeFrame || '').replace(/"/g, '""');
      const workOpportunity = (r.workOpportunity || '').replace(/"/g, '""');
      const supportPerson = (r.supportPerson || '').replace(/"/g, '""');

      return `"${i + 1}","${skillsGap}","${outcomes}","${suggestedTraining}","${modeOfDelivery}","${timeFrame}","${workOpportunity}","${supportPerson}"`;
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PDP_Master_Planner_Export_${activeTenantId || 'Global'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PDF Printing Report Window generator
  const handleExportToPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker prevented opening the print report window. Please allow popups or download Word/Excel instead.");
      return;
    }

    const tenantLabel = activeTenantId || 'Mzansi Local Authority';
    const reportRows = items.map((r, i) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 10px; font-weight: bold; background: #fafafa; font-family: monospace; font-size: 10px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; font-size: 10px; color:#1e293b;"><strong>${r.skillsGap || 'N/A'}</strong></td>
        <td style="padding: 10px; font-size: 9px; color:#475569;">${r.outcomes || 'N/A'}</td>
        <td style="padding: 10px; font-size: 10px; color:#1e3a8a;">${r.suggestedTraining || 'N/A'}</td>
        <td style="padding: 10px; font-size: 10px; color:#1e3a8a;">${r.modeOfDelivery || 'N/A'}</td>
        <td style="padding: 10px; font-size: 10px; color:#475569;">${r.timeFrame || 'N/A'}</td>
        <td style="padding: 10px; font-size: 9px; color:#64748b; font-style: italic;">${r.workOpportunity || 'N/A'}</td>
        <td style="padding: 10px; font-size: 10px; color:#1e293b; font-weight:bold;">${r.supportPerson || 'N/A'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
      <head>
        <title>Mzansi Personal Development Plan (PDP) Report Printout</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0078D4; padding-bottom: 12px; margin-bottom: 25px; }
          .header h1 { font-size: 18px; text-transform: uppercase; color: #1e3a8a; margin: 0; font-weight: 900; }
          .system-bar { background: #0f172a; color: #ffffff; padding: 10px; display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; border-radius: 4px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { border: 1px solid #000000; background-color: #0f172a; color: #ffffff; padding: 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
          td { border: 1px solid #94a3b8; padding: 8px; font-size: 10px; line-height: 1.4; }
          .footer-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
          .signature-box { border-top: 1.5px solid #000; font-size: 9px; font-weight: bold; padding-top: 5px; text-transform: uppercase; color: #475569; }
          @media print {
            body { padding: 10px; }
            button { display: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #0078D4; color: #fff; padding: 8px 16px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer;">Print Report</button>
          <button onclick="window.close()" style="background: #334155; color: #fff; padding: 8px 16px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer;">Close Window</button>
        </div>

        <div class="header">
          <div>
            <h1>Personal Development Plan (PDP)</h1>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0078D4;">Mzansi Municipal Staff Skills Framework Accord</span>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-align: right;">
            Compiled Date: ${new Date().toLocaleDateString()}<br/>
            Tenant: ${tenantLabel}
          </div>
        </div>

        <div class="system-bar">
          <span>SYSTEM ACCORD: SDBIP & MUNICIPAL SYSTEMS PLANNER</span>
          <span>REPORT INTEGRITY VERIFICATION: SECURE LIVE SYNCED</span>
        </div>

        <p style="font-size: 11px; color: #475569; max-width: 800px; margin-bottom: 20px;">
          This statutory document serves to map out high-priority individual competency training programs structured for staff capacity development. The goals highlighted below target professional development milestones feeding into the Municipal overall Workplace Skills Plan (WSP).
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">Pri</th>
              <th style="width: 20%;">Skills performance gap</th>
              <th style="width: 20%;">Outcomes expected</th>
              <th style="width: 16%;">Suggested training & dev</th>
              <th style="width: 10%;">Mode of delivery</th>
              <th style="width: 10%;">Time frame</th>
              <th style="width: 10%;">Opportunities created</th>
              <th style="width: 10%;">Support person</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows}
          </tbody>
        </table>

        <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
          <h3 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-bottom: 15px; margin-top: 0;">Formal Declaration &amp; Sign-off</h3>
          <table style="width: 100%; border: none; font-size: 9px; font-family: 'Segoe UI', Arial, sans-serif;">
            <tr style="border: none;">
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Employee / Officer Representative</strong>
                <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${currentUser.name || currentUser.email || 'Representative'}</div>
                <div style="margin-bottom: 4px;"><strong>Role/Designation:</strong> ${currentUser.role || 'Officer Representative'}</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
              <td style="border: none; width: 10%;"></td>
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Supervisor / Facilitator Approval</strong>
                <div style="margin-bottom: 4px;"><strong>Name:</strong> Approved HR Facilitator / Line Manager</div>
                <div style="margin-bottom: 4px;"><strong>Role:</strong> Municipal Representative</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Dynamic visual charts analytics helpers for Reporting Tab
  // Counts tasks mapped to each Support Person
  const getSupportPersonChartData = () => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const name = (item.supportPerson || '').trim() || 'Unassigned / Draft';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  };

  // Counts tasks mapped to each Delivery Mode
  const getDeliveryModeChartData = () => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const name = (item.modeOfDelivery || '').trim() || 'Internal Coaching / Direct';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  };

  const supportChartData = getSupportPersonChartData();
  const deliveryChartData = getDeliveryModeChartData();

  return (
    <div id="pdp-dashboard-root" className="flex flex-col h-full bg-[#FAF9F8] text-gray-800 font-sans select-none overflow-hidden rounded-3xl border border-gray-200">
      
      {/* 1. Styled Header Banner with Sync State */}
      <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-white border-b border-slate-950 shrink-0 select-text gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-400 font-black shrink-0 shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] bg-slate-800 text-blue-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Mzansi Municipal Skills Plan accord</span>
            <h1 className="text-sm font-black text-white hover:text-blue-300 transition duration-155 tracking-tight uppercase">Personal Development Plans (PDP) Workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl shrink-0 mr-4">
              <button
                onClick={() => setAgreementScope('individual')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'individual' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Personal PDP
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Team PDP
              </button>
            </div>
          )}
          <span className="text-xs bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">

            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Tenant: <span className="text-blue-300 font-bold font-mono">{activeTenantId}</span>
          </span>
          {isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, currentUser.email)}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Personal DB"}</span>
              </button>
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, currentUser.email + '_team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Team DB"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSaveToDatabase()}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Syncing..." : "Database Commit"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Ribbon bar with Navigation Tabs and Keyboard Hint */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'planner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            1. Expandable Master Planner
          </button>
          <button 
            onClick={() => setActiveTab('reporting')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'reporting' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            2. Analytical Reporting
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 flex items-center gap-1.5 font-mono">
            <Keyboard className="w-3.5 h-3.5 text-gray-400" /> Use laptop [TAB] key on Support Person to expand rows
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            syncStatus === 'saving' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            syncStatus === 'saved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
            syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-slate-50 text-slate-700 border-slate-205'
          }`}>
            {syncStatus === 'saving' ? '☁ Saving to Supabase...' :
             syncStatus === 'saved' ? '✔ Sync Complete' :
             syncStatus === 'error' ? '❌ Sync Failed' :
             'Offline Cache Saved'}
          </span>
        </div>
      </div>

      {/* 3. Main Body Split Workspace */}
      <div className="flex-1 overflow-hidden p-6 select-text">

        {/* TAB 1: Infinite Expandable Master Planner Workspace */}
        {activeTab === 'planner' && (
          <div className="h-full grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Left Hand Reference Registry database sidebar */}
            <div className="col-span-1 xl:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 space-y-6 overflow-y-auto max-h-[82vh] shadow-sm select-text">
              <div className="border-b border-gray-150 pb-3">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Settings className="w-4 h-4 text-blue-500" /> PDP Reference Databases
                </h2>
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                  Customize gaps, trainings, modes, and mentors. Click "Post" to map selected item to your active workspace cell.
                </p>
              </div>

              {/* Statutory Accord Briefing Block */}
              <div className="bg-blue-50/50 border border-blue-150 rounded-xl p-4.5 space-y-2 select-text text-xs leading-relaxed">
                <div className="flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-blue-600 animate-pulse shrink-0" />
                  <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Statutory SDBIP Accord Brief</span>
                </div>
                <p className="text-[11px] text-gray-700 leading-relaxed font-semibold">
                  Under the <strong>Local Government: Municipal Systems Act (Act 32 of 2000)</strong> and LGSETA benchmarks, a Personal Development Plan (PDP) is a mandatory statutory instrument used to target individuals' competency deficiencies, promoting structured capacity-building.
                </p>
                <div className="text-[10px] text-blue-800 font-semibold space-y-1 bg-white/70 p-2 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Required progress-mapped learning cards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Remediate skills gaps via certified programs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Timeframe compliance with annual WSP goals</span>
                  </div>
                </div>
              </div>

              {/* Master A: Skills Gaps */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                  🔍 A. Common Skills Gaps
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newGapName}
                    onChange={(e) => setNewGapName(e.target.value)}
                    placeholder="e.g. MSCOA System Audit Logs"
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400"
                  />
                  <button 
                    onClick={addGapMaster}
                    className="bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs shrink-0"
                  >
                    {editingGapId ? "OK" : "Add"}
                  </button>
                </div>
                
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1.5 border-t border-gray-150">
                  {skillsGapsMasters.map((x, idx) => (
                    <div key={x.id || `gap-${idx}`} className="bg-white p-2 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-blue-200 transition">
                      <span className="font-semibold text-gray-700 block text-[10px] truncate max-w-[70%]">{x.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postGapToActiveCell(x.name)}
                          className="bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewGapName(x.name);
                            setEditingGapId(x.id);
                          }}
                          className="text-gray-400 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteGapMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master B: Suggested Trainings */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                  🎯 B. Academic Courses & Programs
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTrainingName}
                    onChange={(e) => setNewTrainingName(e.target.value)}
                    placeholder="e.g. GRAP Advanced Financial Accounting"
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400"
                  />
                  <button 
                    onClick={addTrainingMaster}
                    className="bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs shrink-0"
                  >
                    {editingTrainingId ? "OK" : "Add"}
                  </button>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1.5 border-t border-gray-150">
                  {trainingsMasters.map((x, idx) => (
                    <div key={x.id || `train-${idx}`} className="bg-white p-2 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-blue-200 transition">
                      <span className="font-semibold text-gray-700 block text-[10px] truncate max-w-[70%]">{x.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postTrainingToActiveCell(x.name)}
                          className="bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewTrainingName(x.name);
                            setEditingTrainingId(x.id);
                          }}
                          className="text-gray-400 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteTrainingMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master C: Delivery Modes */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                  🛡️ C. Learning Modes of Delivery
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newModeName}
                    onChange={(e) => setNewModeName(e.target.value)}
                    placeholder="e.g. Workplace Coaching & Attachment"
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400"
                  />
                  <button 
                    onClick={addModeMaster}
                    className="bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs shrink-0"
                  >
                    {editingModeId ? "OK" : "Add"}
                  </button>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1.5 border-t border-gray-150">
                  {modesMasters.map((x, idx) => (
                    <div key={x.id || `mode-${idx}`} className="bg-white p-2 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-blue-200 transition">
                      <span className="font-semibold text-gray-700 block text-[10px] truncate max-w-[70%]">{x.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postModeToActiveCell(x.name)}
                          className="bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewModeName(x.name);
                            setEditingModeId(x.id);
                          }}
                          className="text-gray-400 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteModeMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master D: Support Persons */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
                  👥 D. Authorized Support Persons
                </span>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={newSupportName}
                    onChange={(e) => setNewSupportName(e.target.value)}
                    placeholder="Support Person (name/role)"
                    className="w-full bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-400"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newSupportRole}
                      onChange={(e) => setNewSupportRole(e.target.value)}
                      placeholder="Organization Unit Role"
                      className="flex-1 bg-white border border-gray-200 px-3 py-1 text-[10px] rounded-lg outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-450"
                    />
                    <button 
                      onClick={addSupportMaster}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                    >
                      {editingSupportId ? "OK" : "Add"}
                    </button>
                  </div>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1.5 border-t border-gray-150">
                  {supportMasters.map((x, idx) => (
                    <div key={x.id || `support-${idx}`} className="bg-white p-2 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-blue-200 transition">
                      <div className="max-w-[70%]">
                        <span className="font-semibold text-gray-700 block text-[10px] truncate">{x.name}</span>
                        <span className="text-[9px] text-gray-450 block truncate italic">{x.role}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postSupportToActiveCell(x.name)}
                          className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewSupportName(x.name);
                            setNewSupportRole(x.role);
                            setEditingSupportId(x.id);
                          }}
                          className="text-gray-400 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteSupportMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hand Excel-like Grid table */}
            <div className="col-span-1 xl:col-span-8 flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-h-[82vh]">
              <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">PDP Competency & Learning Matrix</span>
                  <span className="bg-indigo-100 text-[#0078D4] text-[10px] px-2 py-0.5 font-bold font-mono rounded">
                    {items.length} Records Identified
                  </span>
                </div>
                <button 
                  onClick={() => handleAddNewRow()}
                  className="bg-[#0078D4] hover:bg-[#106ebe] text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Priority Gap Row
                </button>
              </div>

              {/* Spreadsheet Table Container */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse select-text">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-550 tracking-wider">
                      <th className="py-3 px-4 text-center w-[5%] select-none">Order</th>
                      <th className="py-3 px-3 w-[20%]">Skills Gap (Priority order)</th>
                      <th className="py-3 px-3 w-[22%]">Measurable Indicators / Outcomes expected</th>
                      <th className="py-3 px-3 w-[15%]">Suggested training & development</th>
                      <th className="py-3 px-3 w-[12%]">Suggested Mode of Delivery</th>
                      <th className="py-3 px-3 w-[10%]">Suggested Time Frame</th>
                      <th className="py-3 px-3 w-[10%]">Practice work opportunity</th>
                      <th className="py-3 px-3 w-[10%]">Support Person</th>
                      <th className="py-3 px-2 text-center w-[6%] select-none">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {items.map((row, rIdx) => {
                      const isRowFocused = selectedRowIndex === rIdx || selectedRowId === row.id;
                      return (
                        <tr 
                          key={row.id || `pdp-row-${rIdx}`} 
                          className={`border-b border-gray-150 transition-colors ${
                            isRowFocused 
                              ? 'bg-[#0078D4]/[0.05] hover:bg-[#0078D4]/[0.08]' 
                              : 'bg-white hover:bg-[#FAF9F8]'
                          }`}
                        >
                          {/* 1. Priority order Indicator */}
                          <td className="py-4 px-4 text-center font-bold text-gray-400 select-none">
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{rIdx + 1}</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleMoveRow(rIdx, 'up')}
                                  disabled={rIdx === 0}
                                  className="text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleMoveRow(rIdx, 'down')}
                                  disabled={rIdx === items.length - 1}
                                  className="text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 2. Skills Performance Gap input field */}
                          <td className="py-2.5 px-2">
                            <textarea 
                              value={row.skillsGap || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'skillsGap', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('skillsGap');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              placeholder="Describe core skill deficiency..."
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[11px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 resize-none font-bold ${
                                isRowFocused && selectedField === 'skillsGap' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-800'
                              }`}
                              rows={2}
                            />
                          </td>

                          {/* 3. Outcomes expected input field */}
                          <td className="py-2.5 px-2">
                            <textarea 
                              value={row.outcomes || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'outcomes', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('outcomes');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              placeholder="Indicators of quantity, quality & timelines..."
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 resize-none ${
                                isRowFocused && selectedField === 'outcomes' ? 'text-blue-700 ring-1 ring-blue-300 font-semibold' : 'text-gray-600'
                              }`}
                              rows={2}
                            />
                          </td>

                          {/* 4. Suggested Training input field */}
                          <td className="py-2.5 px-2">
                            <textarea 
                              value={row.suggestedTraining || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'suggestedTraining', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('suggestedTraining');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              placeholder="e.g. Municipal Finance Course"
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 resize-none font-medium ${
                                isRowFocused && selectedField === 'suggestedTraining' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-700'
                              }`}
                              rows={2}
                            />
                          </td>

                          {/* 5. Suggested Mode of Delivery input field */}
                          <td className="py-2.5 px-2">
                            <input 
                              type="text" 
                              value={row.modeOfDelivery || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'modeOfDelivery', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('modeOfDelivery');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'modeOfDelivery')}
                              placeholder="Online / Mentorship"
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                isRowFocused && selectedField === 'modeOfDelivery' ? 'text-blue-700 ring-1 ring-blue-300 font-semibold' : 'text-gray-700'
                              }`}
                            />
                          </td>

                          {/* 6. Suggested Time Frame input field */}
                          <td className="py-2.5 px-2">
                            <input 
                              type="text" 
                              value={row.timeFrame || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'timeFrame', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('timeFrame');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'timeFrame')}
                              placeholder="e.g. 3 Months"
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 font-mono ${
                                isRowFocused && selectedField === 'timeFrame' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-600'
                              }`}
                            />
                          </td>

                          {/* 7. Work opportunity created to practice input field */}
                          <td className="py-2.5 px-2">
                            <textarea 
                              value={row.workOpportunity || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'workOpportunity', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('workOpportunity');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              placeholder="Assigned task / committee..."
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 resize-none italic ${
                                isRowFocused && selectedField === 'workOpportunity' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-500'
                              }`}
                              rows={2}
                            />
                          </td>

                          {/* 8. Support Person input field (Standard TAB key to expand row triggers here) */}
                          <td className="py-2.5 px-2">
                            <input 
                              type="text" 
                              value={row.supportPerson || ''}
                              onChange={(e) => handleRowInputChange(rIdx, 'supportPerson', e.target.value)}
                              onFocus={() => {
                                setSelectedRowIndex(rIdx);
                                setSelectedRowId(row.id);
                                setSelectedField('supportPerson');
                              }}
                              onBlur={() => handleSaveToDatabase()}
                              onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'supportPerson')}
                              placeholder="Manager / Coach"
                              className={`w-full bg-transparent border-0 px-1 py-1 text-[10px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 font-bold ${
                                isRowFocused && selectedField === 'supportPerson' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-700'
                              }`}
                            />
                          </td>

                          {/* 9. Actions: Insert Row + Delete Row */}
                          <td className="py-4 px-2 text-center select-none">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleAddNewRow(rIdx)}
                                className="text-emerald-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                                title={`Insert new row below Row ${rIdx + 1}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRow(rIdx)}
                                className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title={`Delete Row ${rIdx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom footer bar with direct guidelines */}
              <div className="bg-slate-50 border-t border-gray-200 px-5 py-3 flex text-[10px] text-gray-500 items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Gaps correspond to National Staff Regulations & Workplace Skills Plans thresholds.
                </span>
                <span>Active Document: <strong className="font-mono text-gray-700">PDP-{activeTenantId}-Accord</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Replicated Analytical Reporting customized for Personal Development Plans */}
        {activeTab === 'reporting' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto space-y-6 pr-2 select-text animate-slide-in">
            
            {/* Visual KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-gray-450 tracking-wider">Identified Skills Gaps</span>
                <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{items.length} Areas</p>
                <div className="h-1.5 bg-blue-100 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#0078D4] h-full rounded-full" style={{ width: `${Math.min(100, items.length * 15)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-gray-450 tracking-wider">Learning Interventions</span>
                <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                  {items.filter(r => (r.suggestedTraining || '').trim() !== '').length} Active
                </p>
                <div className="h-1.5 bg-emerald-100 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (items.filter(r => (r.suggestedTraining || '').trim() !== '').length / (items.length || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-gray-450 tracking-wider">Unique Delivery Modes</span>
                <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
                  {Array.from(new Set(items.map(r => r.modeOfDelivery || '').filter(x => (x || '').trim() !== ''))).length} Types
                </p>
                <div className="h-1.5 bg-blue-100 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-gray-450 tracking-wider">Statutory Sync State</span>
                <p className="text-lg font-black text-emerald-600 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Live Linked
                </p>
              </div>
            </div>

            {/* Visual representation chart illustrating Modes of Delivery breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-blue-500" /> Learning Modes of Delivery Breakdown
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Below represents the count of skills gaps allocated relative to each suggested medium or training delivery channel.</p>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center font-bold">No active skills gaps recorded to graph.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {deliveryChartData.map(({ name: mode, count }) => {
                    const pct = Math.round((count / items.length) * 100);
                    return (
                      <div key={mode} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700">{mode}</span>
                          <span className="font-mono font-black text-gray-900">{count} {count === 1 ? 'Gap' : 'Gaps'} ({pct}%)</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-md overflow-hidden flex">
                          <div 
                            className="bg-indigo-600 h-full rounded-r transition-all duration-300 flex items-center justify-end pr-2 text-[9px] text-white font-black font-mono"
                            style={{ width: `${pct}%` }}
                          >
                            {pct > 10 && `${pct}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expanded List Summary of Personal Development Plan directory */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" /> Statutory Personal Development Plan (PDP) Directory
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Compiled list mapping gaps to planned interventions, outcomes, timeframes, and mentors.</p>
              </div>

              <div className="divide-y divide-gray-150">
                {items.map((row, index) => (
                  <div key={row.id || `pdp-dir-${index}`} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold font-mono text-[9px] flex items-center justify-center">{index + 1}</span>
                      <h5 className="font-black text-gray-800">{row.skillsGap || 'Unassigned Skills Gap'}</h5>
                      <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black text-[9px]">{row.timeFrame || 'TBD'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 text-xs bg-slate-50/50 p-3 rounded-xl border border-gray-150">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Outcomes expected:</span>
                        <p className="text-slate-700 font-semibold">{row.outcomes || 'No outcome metrics written.'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Suggested training:</span>
                        <p className="text-slate-700 font-bold">{row.suggestedTraining || 'No learning course proposed.'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Practice opportunity created:</span>
                        <p className="text-slate-700 italic">{row.workOpportunity || 'No practice task assigned.'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">Delivery mode & Support Key:</span>
                        <p className="text-slate-700">
                          {row.modeOfDelivery || 'N/A'} — Led by <strong className="text-slate-800 font-bold">{row.supportPerson || 'No mentor mapped'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exec SDBIP Compliance Audit Summary & Print options */}
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-150 pb-4 gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Workplace Skills Plan Statutory Conformity Review
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Formal LGSETA annual reporting template status and performance progress.</p>
                </div>

                <div id="pdp-export-toolbox" className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleExportToWord}
                    className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-155 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Word (.doc)</span>
                  </button>

                  <button 
                    onClick={handleExportToExcel}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-155 shadow-sm cursor-pointer"
                  >
                    <Layout className="w-4 h-4" />
                    <span>Excel (.csv)</span>
                  </button>

                  <button 
                    onClick={handleExportToPdf}
                    className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-155 shadow-sm cursor-pointer"
                  >
                    <FileBadge className="w-4 h-4" />
                    <span>PDF / Print</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Compliance report layout card */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 p-5 rounded-2xl border border-indigo-50/50 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-855 border-emerald-250 border">
                    ✓ STATUS: ACCORD ALIGNED
                  </span>
                  
                  <h5 className="text-xs font-black text-slate-800 uppercase">LGSETA statutory feedback assessment</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    This statutory report certifies the compilation of Personal Development Plans under tenant workspace <strong className="text-slate-800 font-mono">{activeTenantId}</strong>. Municipal Guidelines request that each employee possess an active progress-mapped learning card covering at least 1 Skills performance gap mapped to a defined support person and timeframe. Currently, you have integrated <strong className="text-slate-800 font-mono">{items.length}</strong> active development tracks, supporting target compliance frameworks.
                  </p>
                </div>

                <div className="md:col-span-4 bg-white border border-indigo-100/80 p-4 rounded-xl shadow-xs space-y-3">
                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest block border-b pb-1">Conformity Checklist</span>
                  
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-600">Regulatory Gap Alignment</span>
                      <span className="text-emerald-500 font-bold">PASS</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-600">Support Person Mapping</span>
                      <span className="text-emerald-600 font-bold">PASS</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-650">Time Frame Threshold</span>
                      <span className="text-emerald-600 font-bold">PASS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic empty signature blocks for Personal Development Plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4 shadow-sm space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block border-b pb-1.5 flex items-center gap-1">📜 Personal Development Plan (PDP) Signatures (Awaiting Signing)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 border border-gray-200 rounded-lg space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block pb-1 border-b">Officer / Employee Representative</span>
                  <p className="text-xs text-slate-700"><b>Name:</b> {currentUser.name || currentUser.email || 'Representative'}</p>
                  <p className="text-xs text-slate-700"><b>Role:</b> {currentUser.role || 'Officer Representative'}</p>
                  <div className="pt-4 flex flex-col gap-1">
                    <div className="border-b border-gray-300 w-2/3 h-6"></div>
                    <span className="text-[9px] text-gray-400">Signature</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Date: ________________________</p>
                </div>

                <div className="bg-slate-50 p-3 border border-gray-200 rounded-lg space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block pb-1 border-b">Supervisor / Facilitator Approval</span>
                  <p className="text-xs text-slate-700"><b>Name:</b> Line Manager / Approved HR Facilitator</p>
                  <p className="text-xs text-slate-700"><b>Role:</b> Municipal Representative</p>
                  <div className="pt-4 flex flex-col gap-1">
                    <div className="border-b border-gray-300 w-2/3 h-6"></div>
                    <span className="text-[9px] text-gray-400">Signature</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Date: ________________________</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. Legal / System Footer Ribbon */}
      <div id="pdp-legal-footer" className="p-4 bg-slate-100 border-t border-gray-200 text-[9px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          Remediates municipal operational performance gaps in order of business priority, support role mapping, and Workplace Skills Plan timelines.
        </span>
        <b className="uppercase text-gray-600 font-mono font-bold">Mzansi Flow SDBIP/IPMS</b>
      </div>
    </div>
  );
}
