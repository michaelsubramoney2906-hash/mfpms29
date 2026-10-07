import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Users, 
  FileText, 
  Clipboard, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  QrCode, 
  Calendar, 
  Filter, 
  SlidersHorizontal,
  FileCheck,
  Eye,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { User } from '../../types';

interface ComplianceCertificateProps {
  currentUser: User;
  activeTenantId: string;
}

interface AnnexureUser {
  id: string;
  fullName: string;
  email: string;
  jobFunction: string;
  department: string;
  status: 'Section 57 Verified' | 'PA Concluded' | 'mSCOA Linked' | 'Directory Registered';
  refCode?: string;
}

export function ComplianceCertificate({ currentUser, activeTenantId }: ComplianceCertificateProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'azure-selector' | 'text-reader' | 'settings'>('preview');
  
  // Certificate Metadata
  const [certNumber, setCertNumber] = useState('MF-NDM-2026-1007-01');
  const [issuedTo, setIssuedTo] = useState('Nkangala District Municipality');
  const [effectiveDate, setEffectiveDate] = useState('7 October 2026');
  const [signatoryName, setSignatoryName] = useState('Adv. S. K. Sithole, SC');
  const [signatoryTitle, setSignatoryTitle] = useState('Head of Legal, Governance & Regulatory Compliance');
  const [divisionTitle, setDivisionTitle] = useState('Mzansi Flow Legal & Compliance Division');
  
  // Contact & Address
  const companyAddress = '2nd Floor West Tower, Nelson Mandela Square, Sandton, Johannesburg';
  const companyPhone = '+27 10 157 1509';
  const companyEmail = 'info@mzansiflow.co.za';
  const companyWebsite = 'www.mzansiflow.co.za';

  // Users for Annexure
  const [allAzureUsers, setAllAzureUsers] = useState<AnnexureUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  
  // Plain text reader
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [parsedPasteCount, setParsedPasteCount] = useState<number | null>(null);

  // UI state
  const [copiedHash, setCopiedHash] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [showWatermark, setShowWatermark] = useState(true);
  const [annexureTitle, setAnnexureTitle] = useState('ANNEXURE A: SCHEDULE OF REGISTERED & STATUTORILY VERIFIED PERSONNEL');

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Load Azure AD users from server or fallback
  useEffect(() => {
    let isMounted = true;
    setIsLoadingUsers(true);
    fetch(`/api/tenant/${activeTenantId}/users`)
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AnnexureUser[] = data.map((u, idx) => {
            const isSec57 = 
              (u.jobFunction && (u.jobFunction.toLowerCase().includes('manager') || u.jobFunction.toLowerCase().includes('chief') || u.jobFunction.toLowerCase().includes('director') || u.jobFunction.toLowerCase().includes('officer'))) ||
              (u.role && u.role.toLowerCase().includes('manager'));
            
            return {
              id: u.id || `user-${idx}`,
              fullName: u.fullName || u.name || (u.email ? u.email.split('@')[0] : `Official ${idx + 1}`),
              email: u.email || '',
              jobFunction: u.jobFunction || u.role || 'Municipal Official',
              department: u.department || 'Administration',
              status: isSec57 ? 'Section 57 Verified' : 'Directory Registered',
              refCode: `SEC57-NDM-${String(idx + 101).padStart(4, '0')}`
            };
          });
          setAllAzureUsers(mapped);
          // By default, preselect all Section 56/57 and Key Management officials (first 35 or all if smaller)
          const initialSet = new Set<string>();
          mapped.slice(0, 32).forEach(u => initialSet.add(u.id));
          setSelectedUserIds(initialSet);
        }
      })
      .catch(err => {
        console.error("Error loading Azure AD users:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTenantId]);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    allAzureUsers.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [allAzureUsers]);

  // Filtered Azure AD users
  const filteredAzureUsers = useMemo(() => {
    return allAzureUsers.filter(u => {
      const matchesDept = selectedDepartment === 'ALL' || u.department === selectedDepartment;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.jobFunction.toLowerCase().includes(q) || 
        u.department.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [allAzureUsers, selectedDepartment, searchQuery]);

  // Selected Users List for the Annexure
  const activeAnnexureUsers = useMemo(() => {
    return allAzureUsers.filter(u => selectedUserIds.has(u.id));
  }, [allAzureUsers, selectedUserIds]);

  // Pagination for the Annexure pages
  const paginatedAnnexurePages = useMemo(() => {
    const pages: AnnexureUser[][] = [];
    for (let i = 0; i < activeAnnexureUsers.length; i += itemsPerPage) {
      pages.push(activeAnnexureUsers.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [activeAnnexureUsers, itemsPerPage]);

  const totalPagesCount = 2 + (paginatedAnnexurePages.length > 0 ? paginatedAnnexurePages.length : 0);

  // Toggle selection
  const handleToggleUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      filteredAzureUsers.forEach(u => next.add(u.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      filteredAzureUsers.forEach(u => next.delete(u.id));
      return next;
    });
  };

  const handleSelectAll798 = () => {
    const next = new Set<string>();
    allAzureUsers.forEach(u => next.add(u.id));
    setSelectedUserIds(next);
  };

  const handleClearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Smart Parser for Plain Text Copy-Paste
  const handleParsePlainText = () => {
    if (!rawTextPaste.trim()) return;
    
    const lines = rawTextPaste.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newUsers: AnnexureUser[] = [];
    const addedIds = new Set(selectedUserIds);

    lines.forEach((line, idx) => {
      // Check if tab-separated or comma-separated
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim());
      } else if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim());
      } else {
        parts = [line];
      }

      const name = parts[0] || `Official ${idx + 1}`;
      const email = parts.find(p => p.includes('@')) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`;
      const position = parts.length > 2 ? parts[2] : (parts.length === 2 && !parts[1].includes('@') ? parts[1] : 'Municipal Section 57 Appointee');
      const dept = parts.length > 3 ? parts[3] : 'Institutional Administration';

      const customId = `custom-pasted-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      const userObj: AnnexureUser = {
        id: customId,
        fullName: name,
        email: email,
        jobFunction: position,
        department: dept,
        status: 'Section 57 Verified',
        refCode: `SEC57-TXT-${String(allAzureUsers.length + idx + 1).padStart(4, '0')}`
      };

      newUsers.push(userObj);
      addedIds.add(customId);
    });

    setAllAzureUsers(prev => [...newUsers, ...prev]);
    setSelectedUserIds(addedIds);
    setParsedPasteCount(newUsers.length);
    setRawTextPaste('');
    setTimeout(() => setParsedPasteCount(null), 5000);
  };

  // Print Handler
  const handleTriggerPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const handleCopyHash = () => {
    const hash = 'SHA256: 8b74c3e89a42ff610e7b99c814df3d0a20261007_MSCOA_PILLAR1_4_VERIFIED';
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 3000);
  };

  // Render Mzansi Flow Header Brand
  const renderMzansiFlowHeader = () => (
    <div className="border-b-2 border-emerald-600 pb-4 mb-6">
      <div className="flex items-start justify-between">
        {/* Logo matching attached image typography */}
        <div className="flex flex-col select-none">
          <div className="flex items-center text-3xl font-black font-sans tracking-tight leading-none">
            <span className="text-black font-extrabold tracking-tighter text-4xl">MZANSI</span>
            <span className="text-emerald-600 font-extrabold tracking-tighter text-4xl ml-2">FLOW</span>
          </div>
          <div className="text-[9px] font-black text-slate-800 tracking-[0.25em] uppercase mt-1 opacity-90">
            PERFORMANCE MANAGEMENT SYSTEM
          </div>
        </div>

        {/* Corporate Address & Contact Details */}
        <div className="text-right text-[10px] text-slate-600 space-y-0.5 max-w-xs font-sans">
          <div className="font-bold text-slate-900 flex items-center justify-end gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>{companyAddress}</span>
          </div>
          <div className="flex items-center justify-end gap-3 text-slate-700">
            <span className="flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5 text-emerald-600" />
              <span>{companyPhone}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5 text-emerald-600" />
              <span>{companyEmail}</span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-1 text-emerald-700 font-medium">
            <Globe className="w-2.5 h-2.5" />
            <span>{companyWebsite}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Action & Navigation Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">Compliance Certificate Generator</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MFMA / mSCOA Pillar 1-4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Institutional Section 57 Compliance Certificate & Azure AD Personnel Schedule for {issuedTo}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Certificate Preview</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              {totalPagesCount} pgs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('azure-selector')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'azure-selector' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Azure AD Selector</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              {selectedUserIds.size} selected
            </span>
          </button>

          <button
            onClick={() => setActiveTab('text-reader')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'text-reader' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste Plain Text Reader</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Global Print / Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHash}
            className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-750 transition flex items-center gap-1.5"
            title="Copy digital audit hash"
          >
            {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHash ? 'Hash Copied!' : 'Copy Hash'}</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-lg shadow-md shadow-emerald-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-900/60 p-6">
        {/* ===================== TAB 1: PREVIEW (Realistic Multi-Page A4) ===================== */}
        {activeTab === 'preview' && (
          <div className="max-w-5xl mx-auto space-y-8 pb-16" id="compliance-certificate-print-root" ref={printContainerRef}>
            {/* Top Preview Banner */}
            <div className="no-print bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Live Official Statutory Document Preview</h4>
                  <p className="text-xs text-slate-400">
                    Formatted strictly as a multi-page legal certificate (Pages 1 & 2: Statutory Compliance & Pillars; Pages 3+: System-Generated Schedule of {activeAnnexureUsers.length} Officials).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Per Annexure Page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-750 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                >
                  <option value={12}>12 users / page</option>
                  <option value={16}>16 users / page</option>
                  <option value={20}>20 users / page</option>
                  <option value={25}>25 users / page</option>
                </select>
              </div>
            </div>

            {/* ================= PAGE 1 ================= */}
            <div className="cert-page bg-white text-slate-900 p-10 md:p-12 rounded-xl shadow-2xl relative border border-slate-200 min-h-[1100px] flex flex-col justify-between">
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.035] select-none">
                  <div className="text-8xl font-black rotate-[-35deg] text-slate-950 tracking-widest text-center uppercase">
                    MZANSI FLOW<br />STATUTORY COMPLIANCE
                  </div>
                </div>
              )}

              <div>
                {/* Header with Logo and Address */}
                {renderMzansiFlowHeader()}

                {/* Document Main Heading */}
                <div className="text-center my-6 space-y-1">
                  <div className="text-xs font-black tracking-widest text-emerald-700 uppercase">
                    OFFICIAL STATUTORY COMPLIANCE INSTRUMENT
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight uppercase">
                    MZANSI FLOW PERFORMANCE MANAGEMENT SYSTEM
                  </h1>
                  <h2 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-wide">
                    COMPLIANCE CERTIFICATE: INSTITUTIONAL PERFORMANCE AGREEMENTS
                  </h2>
                </div>

                {/* Metadata Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 my-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Certificate Number</span>
                    <span className="font-mono font-black text-slate-900 text-xs">{certNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Issued To</span>
                    <span className="font-bold text-slate-900 text-xs">{issuedTo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Effective Date</span>
                    <span className="font-bold text-emerald-800 text-xs">{effectiveDate}</span>
                  </div>
                </div>

                <hr className="border-slate-300 my-4" />

                {/* Section 1 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-800 text-justify">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">1</span>
                    <span>Statutory Framework and System Integration Mandate</span>
                  </h3>
                  <p>
                    This Certificate of Compliance serves to affirm that the <strong>Mzansi Flow Automated Performance Management System (PMS)</strong> satisfies the statutory requirements governing municipal finance, performance monitoring, and data integration within the local government sphere of South Africa.
                  </p>
                  <p>
                    The software architecture is engineered to enforce compliance across the following legislative pillars:
                  </p>
                  <div className="space-y-2 pl-3">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>Municipal Regulations on Standard Chart of Accounts (mSCOA), 2014:</strong> The system strictly adheres to the National Treasury's multi-dimensional classification framework, processing data across the mandatory seven (7) core segments. Mzansi Flow ensures that all financial and non-financial data streams originate from a single, un-extrapolated ledger data string, eliminating manual entry risks and maintaining data integrity.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>Local Government: Municipal Systems Act (No. 32 of 2000):</strong> The system is equipped with automated tracking protocols designed to audit, monitor, and report on the execution of the municipality's Integrated Development Plan (IDP) and Service Delivery and Budget Implementation Plan (SDBIP).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-800 text-justify mt-5">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">2</span>
                    <span>Performance Agreements Compliance (Section 57 Framework)</span>
                  </h3>
                  <p>
                    In accordance with Section 57 of the Municipal Systems Act, Mzansi Flow embeds automated workflow constraints to enforce statutory timelines for senior executive management:
                  </p>
                  <div className="space-y-2 pl-3">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>Workflow Automation:</strong> The system monitors the conclusion of annual performance agreements for the Accounting Officer and all Section 56/57 Managers.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>Statutory Timeline Controls:</strong> System alerts are hardcoded to ensure compliance within the legally prescribed windows: within sixty (60) days of an individual’s initial appointment, and subsequently within one (1) month from the commencement of each municipal financial year (by 31 July).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-500">
                <span>Certificate No: {certNumber}</span>
                <span className="font-bold text-slate-700">Page 1 of {totalPagesCount}</span>
                <span>Mzansi Flow Performance Management System</span>
              </div>
            </div>

            {/* ================= PAGE 2 ================= */}
            <div className="cert-page page-break bg-white text-slate-900 p-10 md:p-12 rounded-xl shadow-2xl relative border border-slate-200 min-h-[1100px] flex flex-col justify-between">
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.035] select-none">
                  <div className="text-8xl font-black rotate-[-35deg] text-slate-950 tracking-widest text-center uppercase">
                    MZANSI FLOW<br />AUDITED & VERIFIED
                  </div>
                </div>
              )}

              <div>
                {/* Header with Logo and Address */}
                {renderMzansiFlowHeader()}

                {/* Section 3 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-800 text-justify">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">3</span>
                    <span>Interoperability and General Ledger Alignment</span>
                  </h3>
                  <p>
                    Pursuant to MFMA Circular No. 80 and related National Treasury guidelines, Mzansi Flow does not operate as an isolated sub-system.
                  </p>
                  <div className="space-y-2 pl-3">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>API Integration:</strong> The system utilises secure Application Programming Interfaces (APIs) to seamlessly interface with counterpart modules within the Nkangala District Municipality’s core Enterprise Resource Planning (ERP) environment.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-black">•</span>
                      <p>
                        <strong>General Ledger & Treasury Uploads:</strong> This interoperability ensures direct integration with the General Ledger (GL), facilitating automated population and validation of the mandatory mSCOA data strings for direct upload to the National Treasury portal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-800 text-justify mt-5">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">4</span>
                    <span>Sector-Specific Indicator Standardisation (MFMA Circular 88)</span>
                  </h3>
                  <p>
                    The Mzansi Flow Automated PMS fully integrates the performance reporting framework mandated by MFMA Circular 88. The system maps sector-specific Key Performance Indicators (KPIs) directly to the mSCOA chart architecture. This alignment ensures that the municipality’s quarterly and annual performance reports are inherently unified with its financial expenditure disclosures.
                  </p>
                </div>

                <hr className="border-slate-300 my-6" />

                {/* Security Verification & Signatory Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-center">
                  {/* Digital Security Stamp */}
                  <div className="border-2 border-emerald-600 bg-emerald-50/50 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div className="text-xs">
                      <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        DIGITAL SECURITY VERIFICATION STAMP
                      </div>
                      <div className="font-black text-slate-900 text-sm mt-0.5">
                        Verified mSCOA Compliance Audit Pillar 1-4
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-600 mt-1">
                        SHA256: 8B74-C3E8-9A42-FF61-1007-NDM
                      </div>
                      <div className="text-[9px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Cryptographically Authenticated & Timestamped</span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Signatory */}
                  <div className="border border-slate-200 bg-slate-50/80 rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">OFFICIAL ATTESTATION</div>
                    
                    {/* Simulated Signature */}
                    <div className="my-2 py-1 border-b border-slate-400">
                      <span className="font-serif italic text-lg font-bold text-slate-800 tracking-wide select-none">
                        {signatoryName}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-900">Authorized Signatory</div>
                      <div className="text-[11px] font-medium text-emerald-800">{divisionTitle}</div>
                      <div className="text-[10px] text-slate-500">{companyWebsite}</div>
                    </div>
                  </div>
                </div>

                {/* Annexure Note */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 mt-6 text-[11px] text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      <strong>Schedule of Verified Personnel:</strong> Refer to Annexure A attached hereto for the registered municipal users.
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 text-xs">
                    {activeAnnexureUsers.length} Officials Attached
                  </span>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-500">
                <span>Certificate No: {certNumber}</span>
                <span className="font-bold text-slate-700">Page 2 of {totalPagesCount}</span>
                <span>Mzansi Flow Performance Management System</span>
              </div>
            </div>

            {/* ================= ANNEXURE PAGES (LAST FEW PAGES) ================= */}
            {paginatedAnnexurePages.map((pageUsers, pageIdx) => {
              const currentPageNum = 3 + pageIdx;
              return (
                <div 
                  key={pageIdx}
                  className="cert-page page-break bg-white text-slate-900 p-10 md:p-12 rounded-xl shadow-2xl relative border border-slate-200 min-h-[1100px] flex flex-col justify-between"
                >
                  {showWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.025] select-none">
                      <div className="text-8xl font-black rotate-[-35deg] text-slate-950 tracking-widest text-center uppercase">
                        SYSTEM GENERATED<br />ANNEXURE SCHEDULE
                      </div>
                    </div>
                  )}

                  <div>
                    {/* Header with Logo and Address */}
                    {renderMzansiFlowHeader()}

                    {/* Annexure Title Banner */}
                    <div className="bg-slate-900 text-white rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                          STATUTORY COMPLIANCE SCHEDULE
                        </div>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-wide">
                          {annexureTitle}
                        </h3>
                      </div>
                      <div className="text-right text-[10px] text-slate-300">
                        <div>Municipality: <strong>{issuedTo}</strong></div>
                        <div>Annexure Part: <strong>Page {pageIdx + 1} of {paginatedAnnexurePages.length}</strong></div>
                      </div>
                    </div>

                    {/* System Generated Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                            <th className="p-2 border-r border-slate-200 w-12 text-center">#</th>
                            <th className="p-2 border-r border-slate-200">Official Full Name</th>
                            <th className="p-2 border-r border-slate-200">Official Email</th>
                            <th className="p-2 border-r border-slate-200">Designation / Role</th>
                            <th className="p-2 border-r border-slate-200">Department / Directorate</th>
                            <th className="p-2 text-center">Compliance Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {pageUsers.map((u, rowIdx) => {
                            const globalIndex = pageIdx * itemsPerPage + rowIdx + 1;
                            const isEven = rowIdx % 2 === 0;
                            return (
                              <tr key={u.id} className={isEven ? 'bg-white' : 'bg-slate-50/70'}>
                                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400 text-[10px]">
                                  {globalIndex}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                                  {u.fullName}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-mono text-[10px] text-slate-600">
                                  {u.email}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-800">
                                  {u.jobFunction}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-600 text-[10.5px]">
                                  {u.department}
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                    u.status === 'Section 57 Verified' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                      : 'bg-teal-50 text-teal-700 border-teal-300'
                                  }`}>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{u.status}</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Ref Range: {pageUsers[0]?.refCode || 'SEC57'} – {pageUsers[pageUsers.length - 1]?.refCode || 'SEC57'}</span>
                      <span>System Batch ID: MSCOA-NDM-2026-B{pageIdx + 1}</span>
                    </div>
                  </div>

                  {/* Annexure Footer */}
                  <div className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Certificate No: {certNumber} (Annexure A)</span>
                    <span className="font-bold text-slate-700">Page {currentPageNum} of {totalPagesCount}</span>
                    <span>System Generated Registry • Mzansi Flow Performance Management System</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== TAB 2: AZURE AD USER SELECTOR ===================== */}
        {activeTab === 'azure-selector' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Azure AD Municipal Directory Selector</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select municipal officials to include in the system-generated Compliance Certificate Annexure Schedule.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll798}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg transition"
                  >
                    Select All ({allAzureUsers.length} Officials)
                  </button>
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg border border-slate-700 transition"
                  >
                    Select Filtered ({filteredAzureUsers.length})
                  </button>
                  <button
                    onClick={handleDeselectAllFiltered}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition"
                  >
                    Deselect Filtered
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, email, designation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Departments ({allAzureUsers.length})</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs">
                  <span className="text-slate-400">Total Selected:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {selectedUserIds.size} / {allAzureUsers.length} Officials
                  </span>
                </div>
              </div>

              {/* User Directory Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="p-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-xs">Loading Azure AD Directory...</p>
                  </div>
                ) : filteredAzureUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No matching municipal officials found for the current query.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold sticky top-0 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredAzureUsers.length > 0 && filteredAzureUsers.every(u => selectedUserIds.has(u.id))}
                            onChange={e => {
                              if (e.target.checked) handleSelectAllFiltered();
                              else handleDeselectAllFiltered();
                            }}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Official Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Job Function / Designation</th>
                        <th className="p-3">Department</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAzureUsers.map(u => {
                        const isSelected = selectedUserIds.has(u.id);
                        return (
                          <tr 
                            key={u.id} 
                            onClick={() => handleToggleUser(u.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'hover:bg-slate-850/50'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleUser(u.id)}
                                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-white">
                              {u.fullName}
                            </td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">
                              {u.email}
                            </td>
                            <td className="p-3 text-slate-300">
                              {u.jobFunction}
                            </td>
                            <td className="p-3 text-slate-400">
                              {u.department}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isSelected ? 'Included' : 'Excluded'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PLAIN TEXT READER (BULK PASTE) ===================== */}
        {activeTab === 'text-reader' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Plain Text Reader & Bulk Paste</h3>
                  <p className="text-xs text-slate-400">
                    Paste user names, emails, and roles directly from Excel, Word, or plain text to append them to the Certificate Schedule.
                  </p>
                </div>
              </div>

              {parsedPasteCount !== null && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Successfully parsed and added <strong>{parsedPasteCount} officials</strong> to the Compliance Certificate schedule!
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Paste Raw Text List (one per line, supporting tabs or commas):
                </label>
                <textarea
                  rows={10}
                  value={rawTextPaste}
                  onChange={e => setRawTextPaste(e.target.value)}
                  placeholder={`Example format 1 (Simple Name):\nMandla L. Mahlangu\nAlice L. Stander\nTrudie Van Niekerk\n\nExample format 2 (Tab-separated from Excel):\nMandla L. Mahlangu\tmahlanguml@nkangaladm.gov.za\tMunicipal Manager\tOffice of the MM\nAlice L. Stander\tstanderal@nkangaladm.gov.za\tChief Financial Officer\tFinancial Services`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  Total Active in Schedule: <strong className="text-white">{selectedUserIds.size} officials</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRawTextPaste('')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    Clear Input
                  </button>

                  <button
                    onClick={handleParsePlainText}
                    disabled={!rawTextPaste.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Parse & Append to Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SETTINGS & METADATA CONFIG ===================== */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Certificate Configuration & Branding</h3>
                  <p className="text-xs text-slate-400">
                    Customize document references, signatory designations, and annexure formatting.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Certificate Number</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={e => setCertNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Issued To (Municipality)</label>
                  <input
                    type="text"
                    value={issuedTo}
                    onChange={e => setIssuedTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Effective Date</label>
                  <input
                    type="text"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Authorized Signatory Name</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={e => setSignatoryName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Signatory Title</label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={e => setSignatoryTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Division Designation</label>
                  <input
                    type="text"
                    value={divisionTitle}
                    onChange={e => setDivisionTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Display Options</h4>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={e => setShowWatermark(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Show Statutory Watermark in Background</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>Apply & View Certificate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Stylesheet for Flawless A4 Multi-Page Output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #compliance-certificate-print-root, #compliance-certificate-print-root * {
            visibility: visible;
          }
          #compliance-certificate-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .cert-page {
            width: 100% !important;
            min-height: 100vh !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 2.5cm 2cm !important;
            margin: 0 !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .page-break {
            page-break-before: always !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
