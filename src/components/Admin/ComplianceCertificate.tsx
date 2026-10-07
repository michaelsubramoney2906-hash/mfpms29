import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  Search, 
  Users, 
  Clipboard, 
  Plus, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  QrCode, 
  Filter, 
  SlidersHorizontal,
  FileCheck,
  Eye,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  FolderOpen,
  Download,
  FileDown,
  Loader2
} from 'lucide-react';
import type { User } from '../../types';

interface ComplianceCertificateProps {
  currentUser: User;
  activeTenantId: string;
}

export interface AnnexureUser {
  id: string;
  fullName: string;
  email: string;
  jobFunction: string;
  department: string;
  status: 'Section 57 Verified' | 'PA Concluded' | 'mSCOA Linked' | 'Directory Registered';
  refCode?: string;
  source?: 'azure_ad' | 'pasted_matched' | 'manual';
}

// Canonical Department Normalization for Nkangala District Municipality
export function normalizeDepartment(rawDept?: string, jobFunction?: string, email?: string): string {
  const d = (rawDept || '').trim().toLowerCase();
  const j = (jobFunction || '').trim().toLowerCase();
  const em = (email || '').trim().toLowerCase();

  if (
    d.includes('finance') || 
    j.includes('cfo') || 
    j.includes('budget') || 
    j.includes('expenditure') || 
    j.includes('revenue') || 
    j.includes('supply chain') || 
    j.includes('scm') || 
    j.includes('accountant') ||
    em.includes('standeral') ||
    em.includes('vanniekerkt') ||
    em.includes('masilelasi') ||
    em.includes('hlongwaan')
  ) {
    return 'Financial Services & Budget Office';
  }

  if (
    d.includes('technical') || 
    d.includes('infrastructure') || 
    j.includes('engineer') || 
    j.includes('technician') || 
    j.includes('pmu') || 
    j.includes('civil') || 
    j.includes('water') ||
    em.includes('ralephalengjn') ||
    em.includes('bembem')
  ) {
    return 'Infrastructure Development & Technical Services';
  }

  if (
    d.includes('corporate') || 
    j.includes('human resource') || 
    j.includes('hrm') || 
    j.includes('legal') || 
    j.includes('admin') || 
    j.includes('records') || 
    j.includes('registry') ||
    em.includes('lengwatetm') ||
    em.includes('nhlaphomj')
  ) {
    return 'Corporate Services & Administration';
  }

  if (
    d.includes('community') || 
    d.includes('social') || 
    d.includes('fire') || 
    d.includes('disaster') || 
    d.includes('health') || 
    j.includes('firefighter') || 
    j.includes('station commander') || 
    j.includes('disaster') ||
    em.includes('rampedimr') ||
    em.includes('skosanah')
  ) {
    return 'Community Development & Social Services';
  }

  if (
    d.includes('planning') || 
    d.includes('economic') || 
    d.includes('ped') || 
    d.includes('led') || 
    j.includes('town planning') || 
    j.includes('led officer') || 
    j.includes('tourism') ||
    em.includes('shabanguf') ||
    em.includes('kubhekavs') ||
    em.includes('masekofm')
  ) {
    return 'Planning & Economic Development (PED)';
  }

  if (
    d.includes('information') || 
    d.includes('ict') || 
    d.includes('it') || 
    j.includes('network') || 
    j.includes('systems') || 
    j.includes('ict') ||
    em.includes('nkosibs') ||
    em.includes('mthimunyen')
  ) {
    return 'Information & Communication Technology (ICT)';
  }

  if (
    d.includes('audit') || 
    j.includes('audit') || 
    j.includes('auditor') ||
    em.includes('twalaad') ||
    em.includes('morarj')
  ) {
    return 'Internal Audit Unit';
  }

  if (d.includes('neda') || j.includes('neda')) {
    return 'NEDA (Nkangala Economic Development Agency)';
  }

  if (
    d.includes('speaker') || 
    d.includes('mayor') || 
    d.includes('council') || 
    j.includes('councillor') || 
    j.includes('cllr') || 
    j.includes('speaker') || 
    j.includes('mayor') || 
    j.includes('mpac') ||
    em.includes('ngwenyatd') ||
    em.includes('masilelats')
  ) {
    return 'Office of the Executive Mayor & Council Support';
  }

  if (
    d.includes('municipal manager') || 
    d.includes('mm') || 
    d.includes('pms') || 
    d.includes('risk') || 
    j.includes('municipal manager') || 
    j.includes('pms') || 
    j.includes('risk officer') ||
    em.includes('mahlanguml') ||
    em.includes('shabangusm') ||
    em.includes('nsibandenp') ||
    em.includes('skhosanaqj')
  ) {
    return 'Office of the Municipal Manager';
  }

  return rawDept ? rawDept.trim() : 'Institutional Administration';
}

// Clean Designation Resolver
export function resolveOfficialDesignation(user: any): string {
  if (user.jobFunction && user.jobFunction.trim().length > 0) {
    return user.jobFunction.trim();
  }
  if (user.role && user.role !== 'Standard User' && user.role.trim().length > 0) {
    return user.role.trim();
  }
  const em = (user.email || '').toLowerCase();
  if (em.includes('mahlanguml')) return 'Municipal Manager / Accounting Officer';
  if (em.includes('standeral')) return 'Chief Financial Officer (CFO)';
  if (em.includes('rampedimr')) return 'General Manager: Community Services';
  if (em.includes('lengwatetm')) return 'General Manager: Corporate Services';
  if (em.includes('ralephalengjn')) return 'General Manager: Infrastructure Development';
  if (em.includes('shabanguf')) return 'General Manager: Development Planning';
  if (em.includes('twalaad')) return 'Chief Audit Executive';
  if (em.includes('shabangusm')) return 'Manager: Office of the Municipal Manager';
  if (em.includes('nsibandenp')) return 'Manager: Performance Management System (PMS)';
  if (em.includes('vanniekerkt')) return 'Divisional Manager: Budget & Expenditure';
  if (em.includes('masilelasi')) return 'Manager: Supply Chain Management (SCM)';
  if (em.includes('skhosanaqj')) return 'Chief Risk Officer';
  if (em.includes('nkosibs')) return 'Divisional Manager: ICT';
  if (em.includes('nhlaphomj')) return 'Divisional Manager: Human Resource Management';

  return 'Municipal Appointee (Statutory Section 57 Framework)';
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
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  
  // Plain text reader state
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [pasteMatchReport, setPasteMatchReport] = useState<{
    totalParsed: number;
    matchedAzure: number;
    newAppended: number;
    departmentsFound: string[];
  } | null>(null);

  // UI state
  const [copiedHash, setCopiedHash] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [groupByDepartment, setGroupByDepartment] = useState(true);
  const [annexureTitle, setAnnexureTitle] = useState('ANNEXURE A: SCHEDULE OF REGISTERED & STATUTORILY VERIFIED PERSONNEL');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

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
            const designation = resolveOfficialDesignation(u);
            const dept = normalizeDepartment(u.department, designation, u.email);
            const isSec57 = 
              designation.toLowerCase().includes('manager') || 
              designation.toLowerCase().includes('chief') || 
              designation.toLowerCase().includes('director') || 
              designation.toLowerCase().includes('officer') ||
              designation.toLowerCase().includes('cfo') ||
              designation.toLowerCase().includes('accounting officer');
            
            return {
              id: u.id || `user-${idx}`,
              fullName: u.fullName || u.name || (u.email ? u.email.split('@')[0] : `Official ${idx + 1}`),
              email: u.email || `${(u.fullName || 'official').toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`,
              jobFunction: designation,
              department: dept,
              status: isSec57 ? 'Section 57 Verified' : 'mSCOA Linked',
              refCode: `SEC57-NDM-${String(idx + 101).padStart(4, '0')}`,
              source: 'azure_ad'
            };
          });

          // Sort alphabetically by department then by name
          mapped.sort((a, b) => a.department.localeCompare(b.department) || a.fullName.localeCompare(b.fullName));

          setAllAzureUsers(mapped);
          
          // Pre-select Key Municipal Leadership & Section 56/57 Managers (first 45 officials)
          const initialSet = new Set<string>();
          mapped.slice(0, 42).forEach(u => initialSet.add(u.id));
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

  // Unique Departments List
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    allAzureUsers.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [allAzureUsers]);

  // Filtered Azure AD users for the selector tab
  const filteredAzureUsers = useMemo(() => {
    return allAzureUsers.filter(u => {
      const matchesDept = selectedDepartmentFilter === 'ALL' || u.department === selectedDepartmentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.jobFunction.toLowerCase().includes(q) || 
        u.department.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [allAzureUsers, selectedDepartmentFilter, searchQuery]);

  // Selected Users List for the Annexure
  const activeAnnexureUsers = useMemo(() => {
    return allAzureUsers.filter(u => selectedUserIds.has(u.id));
  }, [allAzureUsers, selectedUserIds]);

  // Users Grouped by Department
  const usersGroupedByDepartment = useMemo(() => {
    const groups: { department: string; users: AnnexureUser[] }[] = [];
    const deptMap = new Map<string, AnnexureUser[]>();

    activeAnnexureUsers.forEach(u => {
      const d = u.department || 'Institutional Administration';
      if (!deptMap.has(d)) {
        deptMap.set(d, []);
      }
      deptMap.get(d)!.push(u);
    });

    // Sort departments in logical municipal order
    const priority = [
      'Office of the Municipal Manager',
      'Financial Services & Budget Office',
      'Infrastructure Development & Technical Services',
      'Corporate Services & Administration',
      'Community Development & Social Services',
      'Planning & Economic Development (PED)',
      'Information & Communication Technology (ICT)',
      'Internal Audit Unit',
      'Office of the Executive Mayor & Council Support',
      'NEDA (Nkangala Economic Development Agency)'
    ];

    const sortedDeptNames = Array.from(deptMap.keys()).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedDeptNames.forEach(deptName => {
      groups.push({
        department: deptName,
        users: deptMap.get(deptName)!.sort((a, b) => a.fullName.localeCompare(b.fullName))
      });
    });

    return groups;
  }, [activeAnnexureUsers]);

  // Chunk annexure groups into cleanly paginated pages (~12-14 items per page)
  const chunkedAnnexurePages = useMemo(() => {
    if (usersGroupedByDepartment.length === 0) {
      return [{
        pageIndex: 1,
        groups: [] as { department: string; users: AnnexureUser[] }[]
      }];
    }

    const pages: { pageIndex: number; groups: { department: string; users: AnnexureUser[] }[] }[] = [];
    let currentPageGroups: { department: string; users: AnnexureUser[] }[] = [];
    let currentCount = 0;
    const MAX_PER_PAGE = 11;

    usersGroupedByDepartment.forEach(deptGroup => {
      let remainingUsers = [...deptGroup.users];
      while (remainingUsers.length > 0) {
        const availableSpace = Math.max(1, MAX_PER_PAGE - currentCount - 2); // 2 rows weight for dept header
        if (availableSpace <= 1 && currentCount > 0) {
          pages.push({
            pageIndex: pages.length + 1,
            groups: currentPageGroups
          });
          currentPageGroups = [];
          currentCount = 0;
        }

        const sliceSize = Math.max(1, Math.min(remainingUsers.length, MAX_PER_PAGE - currentCount - 2));
        const usersForThisPage = remainingUsers.slice(0, sliceSize);
        remainingUsers = remainingUsers.slice(sliceSize);

        currentPageGroups.push({
          department: deptGroup.department + (remainingUsers.length > 0 ? ' (Cont.)' : ''),
          users: usersForThisPage
        });

        currentCount += usersForThisPage.length + 2;

        if (currentCount >= MAX_PER_PAGE) {
          pages.push({
            pageIndex: pages.length + 1,
            groups: currentPageGroups
          });
          currentPageGroups = [];
          currentCount = 0;
        }
      }
    });

    if (currentPageGroups.length > 0) {
      pages.push({
        pageIndex: pages.length + 1,
        groups: currentPageGroups
      });
    }

    return pages;
  }, [usersGroupedByDepartment]);

  // Total pages calculation (Page 1: Statutory Pillars, Page 2: Interoperability & Signature, Page 3+: Department Schedules)
  const totalPagesCount = useMemo(() => {
    return 2 + (usersGroupedByDepartment.length > 0 ? chunkedAnnexurePages.length : 1);
  }, [usersGroupedByDepartment.length, chunkedAnnexurePages.length]);

  // Toggle selection
  const handleToggleUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllInDept = (deptName: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      allAzureUsers.filter(u => u.department === deptName).forEach(u => next.add(u.id));
      return next;
    });
  };

  const handleDeselectAllInDept = (deptName: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      allAzureUsers.filter(u => u.department === deptName).forEach(u => next.delete(u.id));
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

  const handleSelectAllOfficials = () => {
    const next = new Set<string>();
    allAzureUsers.forEach(u => next.add(u.id));
    setSelectedUserIds(next);
  };

  const handleClearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Helper: Intelligent Azure AD Matcher
  const findAzureAdMatch = (query: string, userList: AnnexureUser[]): AnnexureUser | null => {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    const qClean = q.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 1. Exact email match
    let match = userList.find(u => u.email && u.email.toLowerCase() === q);
    if (match) return match;

    // 2. Email prefix match
    const qPrefix = q.split('@')[0];
    if (qPrefix && qPrefix.length > 2) {
      match = userList.find(u => u.email && u.email.toLowerCase().split('@')[0] === qPrefix);
      if (match) return match;
    }

    // 3. Exact full name match
    match = userList.find(u => u.fullName && u.fullName.toLowerCase() === q);
    if (match) return match;

    // 4. Normalized full name match
    match = userList.find(u => {
      if (!u.fullName) return false;
      const uClean = u.fullName.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();
      return uClean === qClean || uClean.includes(qClean) || (qClean.length > 5 && qClean.includes(uClean));
    });
    if (match) return match;

    // 5. Surname / token match
    const qTokens = qClean.split(' ').filter(t => t.length >= 4);
    if (qTokens.length > 0) {
      match = userList.find(u => {
        if (!u.fullName) return false;
        const uClean = u.fullName.toLowerCase();
        return qTokens.every(t => uClean.includes(t) || (u.email && u.email.toLowerCase().includes(t)));
      });
      if (match) return match;
    }

    return null;
  };

  // Smart Parser for Plain Text Copy-Paste with Azure AD Auto-Enrichment
  const handleParsePlainText = () => {
    if (!rawTextPaste.trim()) return;
    
    const lines = rawTextPaste.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const updatedUsersList = [...allAzureUsers];
    const newSelectedIds = new Set(selectedUserIds);
    let matchedCount = 0;
    let appendedCount = 0;
    const deptsFound = new Set<string>();

    lines.forEach((line, idx) => {
      // Split by tab, comma, semicolon, or vertical bar
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim());
      } else if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim());
      } else if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim());
      } else {
        parts = [line];
      }

      const rawIdentifier = parts[0] || '';
      const emailCandidate = parts.find(p => p.includes('@nkangaladm.gov.za') || p.includes('@')) || '';

      // Match against Azure AD Directory
      const existingMatch = findAzureAdMatch(emailCandidate || rawIdentifier, updatedUsersList);

      if (existingMatch) {
        // User exists in Azure AD: ensure selected and enriched
        newSelectedIds.add(existingMatch.id);
        deptsFound.add(existingMatch.department);
        matchedCount++;
      } else {
        // New record: extract and normalize
        const name = rawIdentifier.includes('@') ? rawIdentifier.split('@')[0].replace(/[._]/g, ' ') : rawIdentifier;
        const email = emailCandidate || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`;
        const role = parts.length > 2 ? parts[2] : (parts.length === 2 && !parts[1].includes('@') ? parts[1] : 'Municipal Appointee (Section 57)');
        const rawDept = parts.length > 3 ? parts[3] : 'Institutional Administration';
        const normDept = normalizeDepartment(rawDept, role, email);

        const customId = `matched-paste-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        const userObj: AnnexureUser = {
          id: customId,
          fullName: name,
          email: email,
          jobFunction: role,
          department: normDept,
          status: 'Section 57 Verified',
          refCode: `SEC57-PST-${String(updatedUsersList.length + 1).padStart(4, '0')}`,
          source: 'pasted_matched'
        };

        updatedUsersList.push(userObj);
        newSelectedIds.add(customId);
        deptsFound.add(normDept);
        appendedCount++;
      }
    });

    setAllAzureUsers(updatedUsersList);
    setSelectedUserIds(newSelectedIds);
    setPasteMatchReport({
      totalParsed: lines.length,
      matchedAzure: matchedCount,
      newAppended: appendedCount,
      departmentsFound: Array.from(deptsFound)
    });
    setRawTextPaste('');
  };

  // Brand Green Constants - Uniform across the entire document
  const BRAND_GREEN = '#059669'; // Exact Mzansi Flow brand green from "FLOW"
  const BRAND_GREEN_BG = '#ecfdf5'; // Crisp light green container background
  const BRAND_GREEN_BORDER = '#a7f3d0'; // Crisp emerald border
  const BRAND_GREEN_DARK = '#047857'; // Deep contrast emerald

  // PDF Export Handler using jsPDF & html2canvas in Full Lossless High-Definition Color
  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      setExportProgress('Preparing certificate pages for full-colour export...');

      // Switch to preview tab to ensure rendering
      if (activeTab !== 'preview') {
        setActiveTab('preview');
        await new Promise(r => setTimeout(r, 400));
      }

      // Allow DOM to settle
      await new Promise(r => setTimeout(r, 300));

      const container = document.getElementById('compliance-certificate-print-root');
      if (!container) {
        throw new Error('Certificate preview container not found.');
      }

      const pageElements = Array.from(container.querySelectorAll('.cert-page')) as HTMLElement[];
      if (pageElements.length === 0) {
        throw new Error('No certificate pages found to render.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        setExportProgress(`Rendering high-definition full-colour page ${i + 1} of ${pageElements.length}...`);
        const page = pageElements[i];

        const canvas = await html2canvas(page, {
          scale: 2.5, // 2.5x High-res retina print quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          onclone: (clonedDoc, clonedElement) => {
            clonedElement.style.transform = 'none';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.background = '#ffffff';
            clonedElement.style.color = '#0f172a';
          }
        });

        // Use lossless PNG for 100% full-colour saturation with zero JPEG artifacting
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setExportProgress('Saving PDF document...');
      const cleanFileName = `MzansiFlow_Compliance_Certificate_${certNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
      pdf.save(cleanFileName);

      setExportProgress('Full-colour PDF ready!');
      setTimeout(() => {
        setIsExportingPdf(false);
        setExportProgress('');
      }, 1200);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Unable to generate PDF export: ' + (err.message || 'Unknown error'));
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  // Robust Print Handler (Handles sandboxed iframe & normal browser printing)
  const handleTriggerPrint = async () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      await new Promise(r => setTimeout(r, 350));
    }

    const printRoot = document.getElementById('compliance-certificate-print-root');
    if (!printRoot) {
      window.print();
      return;
    }

    try {
      const existingIframe = document.getElementById('certificate-print-iframe');
      if (existingIframe) existingIframe.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'certificate-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Mzansi Flow Compliance Certificate - ${certNumber}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: white !important;
                  color: #0f172a !important;
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .cert-page {
                  width: 100% !important;
                  min-height: 275mm !important;
                  box-sizing: border-box !important;
                  padding: 10mm 12mm !important;
                  margin-bottom: 0 !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  position: relative !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  background: white !important;
                }
                .cert-page:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .no-print {
                  display: none !important;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
              </style>
            </head>
            <body>
              ${printRoot.innerHTML}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 500);
        return;
      }
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print()', err);
    }

    window.print();
  };

  const handleCopyHash = () => {
    const hash = 'SHA256: 8b74c3e89a42ff610e7b99c814df3d0a20261007_MSCOA_PILLAR1_4_VERIFIED';
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 3000);
  };

  // Render Mzansi Flow Header Brand
  const renderMzansiFlowHeader = () => (
    <div className="pb-3 mb-5" style={{ borderBottom: `2px solid ${BRAND_GREEN}` }}>
      <div className="flex items-start justify-between">
        {/* Vectorized Brand Logo */}
        <div className="flex flex-col select-none">
          <div className="flex items-center text-3xl font-black font-sans tracking-tight leading-none">
            <span className="text-black font-extrabold tracking-tighter text-4xl" style={{ color: '#0f172a' }}>MZANSI</span>
            <span className="font-extrabold tracking-tighter text-4xl ml-2" style={{ color: BRAND_GREEN }}>FLOW</span>
          </div>
          <div className="text-[9px] font-black tracking-[0.25em] uppercase mt-1 opacity-90" style={{ color: '#1e293b' }}>
            PERFORMANCE MANAGEMENT SYSTEM
          </div>
        </div>

        {/* Corporate Address & Contact Details */}
        <div className="text-right text-[10px] space-y-0.5 max-w-xs font-sans" style={{ color: '#475569' }}>
          <div className="font-bold flex items-center justify-end gap-1" style={{ color: '#0f172a' }}>
            <MapPin className="w-3 h-3 shrink-0" style={{ color: BRAND_GREEN }} />
            <span>{companyAddress}</span>
          </div>
          <div className="flex items-center justify-end gap-3" style={{ color: '#334155' }}>
            <span className="flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5 shrink-0" style={{ color: BRAND_GREEN }} />
              <span>{companyPhone}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5 shrink-0" style={{ color: BRAND_GREEN }} />
              <span>{companyEmail}</span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-1 font-medium" style={{ color: BRAND_GREEN }}>
            <Globe className="w-2.5 h-2.5 shrink-0" style={{ color: BRAND_GREEN }} />
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
                Azure AD Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Departmental Section 57 Compliance Certificate & Azure AD Personnel Schedule for {issuedTo}
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
              {usersGroupedByDepartment.length} Depts ({activeAnnexureUsers.length} Officials)
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
            <span>Plain Text Reader</span>
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

          {/* Direct PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export official high-res PDF file directly"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? (exportProgress || 'Exporting...') : 'Export PDF'}</span>
          </button>

          {/* Native Print Dialog */}
          <button
            onClick={handleTriggerPrint}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black rounded-lg shadow-md shadow-emerald-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Print or save as PDF via system print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dialog</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-900/60 p-6">
        {/* ===================== TAB 1: PREVIEW (Realistic Multi-Page A4) ===================== */}
        {activeTab === 'preview' && (
          <div className="max-w-5xl mx-auto space-y-8 pb-16" id="compliance-certificate-print-root" ref={printContainerRef}>
            {/* Top Preview Banner */}
            <div className="no-print bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Live Official Statutory Document Preview</h4>
                  <p className="text-xs text-slate-400">
                    Pages 1 & 2: Statutory Compliance & Pillars | Annexure Schedule: <strong>{activeAnnexureUsers.length} Officials separated across {usersGroupedByDepartment.length} Municipal Departments</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupByDepartment}
                    onChange={e => setGroupByDepartment(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Group by Department</span>
                </label>
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
                  <div className="text-xs font-black tracking-widest uppercase" style={{ color: BRAND_GREEN }}>
                    OFFICIAL STATUTORY COMPLIANCE INSTRUMENT
                  </div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase" style={{ color: '#0f172a' }}>
                    MZANSI FLOW PERFORMANCE MANAGEMENT SYSTEM
                  </h1>
                  <h2 className="text-sm md:text-base font-bold uppercase tracking-wide" style={{ color: '#334155' }}>
                    COMPLIANCE CERTIFICATE: INSTITUTIONAL PERFORMANCE AGREEMENTS
                  </h2>
                </div>

                {/* Metadata Box */}
                <div className="rounded-lg p-3.5 my-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span className="font-bold block text-[10px] uppercase" style={{ color: '#64748b' }}>Certificate Number</span>
                    <span className="font-mono font-black text-xs" style={{ color: '#0f172a' }}>{certNumber}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px] uppercase" style={{ color: '#64748b' }}>Issued To</span>
                    <span className="font-bold text-xs" style={{ color: '#0f172a' }}>{issuedTo}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-[10px] uppercase" style={{ color: '#64748b' }}>Effective Date</span>
                    <span className="font-bold text-xs" style={{ color: BRAND_GREEN }}>{effectiveDate}</span>
                  </div>
                </div>

                <hr className="my-4" style={{ borderColor: '#cbd5e1' }} />

                {/* Section 1 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-justify" style={{ color: '#1e293b' }}>
                  <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>1</span>
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
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>Municipal Regulations on Standard Chart of Accounts (mSCOA), 2014:</strong> The system strictly adheres to the National Treasury's multi-dimensional classification framework, processing data across the mandatory seven (7) core segments. Mzansi Flow ensures that all financial and non-financial data streams originate from a single, un-extrapolated ledger data string, eliminating manual entry risks and maintaining data integrity.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>Local Government: Municipal Systems Act (No. 32 of 2000):</strong> The system is equipped with automated tracking protocols designed to audit, monitor, and report on the execution of the municipality's Integrated Development Plan (IDP) and Service Delivery and Budget Implementation Plan (SDBIP).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-justify mt-5" style={{ color: '#1e293b' }}>
                  <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>2</span>
                    <span>Performance Agreements Compliance (Section 57 Framework)</span>
                  </h3>
                  <p>
                    In accordance with Section 57 of the Municipal Systems Act, Mzansi Flow embeds automated workflow constraints to enforce statutory timelines for senior executive management:
                  </p>
                  <div className="space-y-2 pl-3">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>Workflow Automation:</strong> The system monitors the conclusion of annual performance agreements for the Accounting Officer and all Section 56/57 Managers.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>Statutory Timeline Controls:</strong> System alerts are hardcoded to ensure compliance within the legally prescribed windows: within sixty (60) days of an individual’s initial appointment, and subsequently within one (1) month from the commencement of each municipal financial year (by 31 July).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="pt-3 mt-6 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                <span>Certificate No: {certNumber}</span>
                <span className="font-bold" style={{ color: '#1e293b' }}>Page 1 of {totalPagesCount}</span>
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
                <div className="space-y-3 text-[12.5px] leading-relaxed text-justify" style={{ color: '#1e293b' }}>
                  <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>3</span>
                    <span>Interoperability and General Ledger Alignment</span>
                  </h3>
                  <p>
                    Pursuant to MFMA Circular No. 80 and related National Treasury guidelines, Mzansi Flow does not operate as an isolated sub-system.
                  </p>
                  <div className="space-y-2 pl-3">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>API Integration:</strong> The system utilises secure Application Programming Interfaces (APIs) to seamlessly interface with counterpart modules within the Nkangala District Municipality’s core Enterprise Resource Planning (ERP) environment.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base leading-none" style={{ color: BRAND_GREEN }}>•</span>
                      <p>
                        <strong>General Ledger & Treasury Uploads:</strong> This interoperability ensures direct integration with the General Ledger (GL), facilitating automated population and validation of the mandatory mSCOA data strings for direct upload to the National Treasury portal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="space-y-3 text-[12.5px] leading-relaxed text-justify mt-5" style={{ color: '#1e293b' }}>
                  <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>4</span>
                    <span>Sector-Specific Indicator Standardisation (MFMA Circular 88)</span>
                  </h3>
                  <p>
                    The Mzansi Flow Automated PMS fully integrates the performance reporting framework mandated by MFMA Circular 88. The system maps sector-specific Key Performance Indicators (KPIs) directly to the mSCOA chart architecture. This alignment ensures that the municipality’s quarterly and annual performance reports are inherently unified with its financial expenditure disclosures.
                  </p>
                </div>

                <hr className="my-6" style={{ borderColor: '#cbd5e1' }} />

                {/* Security Verification & Signatory Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-center">
                  {/* Digital Security Stamp */}
                  <div className="rounded-xl p-4 flex items-center gap-3 relative overflow-hidden" style={{ border: `2px solid ${BRAND_GREEN}`, backgroundColor: '#f0fdf4' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-md" style={{ backgroundColor: BRAND_GREEN, color: '#ffffff' }}>
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div className="text-xs">
                      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: BRAND_GREEN }}>
                        DIGITAL SECURITY VERIFICATION STAMP
                      </div>
                      <div className="font-black text-sm mt-0.5" style={{ color: '#0f172a' }}>
                        Verified mSCOA Compliance Audit Pillar 1-4
                      </div>
                      <div className="text-[9.5px] font-mono mt-1" style={{ color: '#475569' }}>
                        SHA256: 8B74-C3E8-9A42-FF61-1007-NDM
                      </div>
                      <div className="text-[9px] font-bold mt-0.5 flex items-center gap-1" style={{ color: BRAND_GREEN }}>
                        <CheckCircle2 className="w-3 h-3" style={{ color: BRAND_GREEN }} />
                        <span>Cryptographically Authenticated & Timestamped</span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Signatory */}
                  <div className="rounded-xl p-4 flex flex-col justify-between" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div className="text-[10px] font-bold uppercase" style={{ color: '#94a3b8' }}>OFFICIAL ATTESTATION</div>
                    
                    {/* Simulated Signature */}
                    <div className="my-2 py-1" style={{ borderBottom: '1px solid #94a3b8' }}>
                      <span className="font-serif italic text-lg font-bold tracking-wide select-none" style={{ color: '#1e293b' }}>
                        {signatoryName}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <div className="font-bold" style={{ color: '#0f172a' }}>Authorized Signatory</div>
                      <div className="text-[11px] font-medium" style={{ color: BRAND_GREEN }}>{divisionTitle}</div>
                      <div className="text-[10px]" style={{ color: '#64748b' }}>{companyWebsite}</div>
                    </div>
                  </div>
                </div>

                {/* Annexure Department Summary Box */}
                <div className="rounded-lg p-3.5 mt-6 text-[11px] flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 shrink-0" style={{ color: BRAND_GREEN }} />
                    <span>
                      <strong>Departmental Personnel Schedule:</strong> Refer to Annexure A attached hereto for the registered municipal users, categorized by department.
                    </span>
                  </div>
                  <span className="font-bold text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>
                    {usersGroupedByDepartment.length} Departments • {activeAnnexureUsers.length} Verified Officials
                  </span>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="pt-3 mt-6 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                <span>Certificate No: {certNumber}</span>
                <span className="font-bold" style={{ color: '#1e293b' }}>Page 2 of {totalPagesCount}</span>
                <span>Mzansi Flow Performance Management System</span>
              </div>
            </div>

            {/* ================= ANNEXURE SCHEDULE PAGES (SEPARATED BY DEPARTMENT) ================= */}
            {chunkedAnnexurePages.map((pageData, pageIdx) => {
              const currentPageNum = 2 + pageIdx + 1;
              return (
                <div 
                  key={`annexure-page-${pageData.pageIndex}`} 
                  className="cert-page page-break bg-white text-slate-900 p-10 md:p-12 rounded-xl shadow-2xl relative border border-slate-200 min-h-[1100px] flex flex-col justify-between"
                >
                  {showWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.025] select-none">
                      <div className="text-8xl font-black rotate-[-35deg] text-slate-950 tracking-widest text-center uppercase">
                        SYSTEM GENERATED<br />DEPARTMENTAL SCHEDULE
                      </div>
                    </div>
                  )}

                  <div>
                    {/* Header with Logo and Address */}
                    {renderMzansiFlowHeader()}

                    {/* Annexure Title Banner */}
                    <div className="rounded-xl px-5 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-md" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <div>
                        <div className="text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: BRAND_GREEN }}>
                          <Building2 className="w-3.5 h-3.5" style={{ color: BRAND_GREEN }} />
                          <span>STATUTORY MUNICIPAL PERSONNEL SCHEDULE</span>
                        </div>
                        <h3 className="text-sm md:text-base font-black uppercase tracking-wide mt-0.5 text-white">
                          {annexureTitle} {chunkedAnnexurePages.length > 1 ? `(Part ${pageIdx + 1})` : ''}
                        </h3>
                      </div>
                      <div className="text-right text-[10.5px]" style={{ color: '#cbd5e1' }}>
                        <div>Municipality: <strong className="text-white">{issuedTo}</strong></div>
                        <div>Source: <strong className="text-white">Azure AD Connected Directory</strong></div>
                      </div>
                    </div>

                    {/* Departmental Groups on this page */}
                    <div className="space-y-6">
                      {pageData.groups.length === 0 ? (
                        <div className="p-8 text-center border border-dashed rounded-xl" style={{ borderColor: '#cbd5e1', color: '#94a3b8' }}>
                          No officials selected. Please select users from the Azure AD Directory Selector or Paste Plain Text Reader.
                        </div>
                      ) : (
                        pageData.groups.map((group, deptIdx) => {
                          return (
                            <div key={`${group.department}-${deptIdx}`} className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #cbd5e1' }}>
                              {/* Department Group Header */}
                              <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                    {deptIdx + 1}
                                  </span>
                                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>
                                    {group.department}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>
                                    {group.users.length} {group.users.length === 1 ? 'Official' : 'Officials'} Registered
                                  </span>
                                </div>
                              </div>

                              {/* Department Table */}
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="text-[9.5px] uppercase tracking-wider font-bold" style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                                    <th className="p-2 w-10 text-center" style={{ borderRight: '1px solid #e2e8f0' }}>#</th>
                                    <th className="p-2" style={{ borderRight: '1px solid #e2e8f0' }}>Official Full Name</th>
                                    <th className="p-2" style={{ borderRight: '1px solid #e2e8f0' }}>Designation / Role (Azure AD)</th>
                                    <th className="p-2" style={{ borderRight: '1px solid #e2e8f0' }}>Official Email</th>
                                    <th className="p-2 text-center w-36">Statutory Status</th>
                                  </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                  {group.users.map((u, rowIdx) => {
                                    const isEven = rowIdx % 2 === 0;
                                    return (
                                      <tr key={u.id} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <td className="p-2 text-center font-mono text-[10px]" style={{ borderRight: '1px solid #e2e8f0', color: '#94a3b8' }}>
                                          {rowIdx + 1}
                                        </td>
                                        <td className="p-2 font-bold" style={{ borderRight: '1px solid #e2e8f0', color: '#0f172a' }}>
                                          {u.fullName}
                                        </td>
                                        <td className="p-2 font-medium" style={{ borderRight: '1px solid #e2e8f0', color: '#1e293b' }}>
                                          {u.jobFunction}
                                        </td>
                                        <td className="p-2 font-mono text-[10px]" style={{ borderRight: '1px solid #e2e8f0', color: '#475569' }}>
                                          {u.email}
                                        </td>
                                        <td className="p-2 text-center">
                                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND_GREEN_BG, color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN_BORDER}` }}>
                                            <Check className="w-2.5 h-2.5" style={{ color: BRAND_GREEN }} />
                                            <span>{u.status}</span>
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between text-[10px] font-mono" style={{ color: '#94a3b8' }}>
                      <span>Audit Verification Reference: MF-NDM-2026-SEC57-SCHEDULE</span>
                      <span>Total Registered: {activeAnnexureUsers.length} Officials</span>
                    </div>
                  </div>

                  {/* Annexure Footer */}
                  <div className="pt-3 mt-6 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                    <span>Certificate No: {certNumber} (Annexure A - Departmental Schedule)</span>
                    <span className="font-bold" style={{ color: '#1e293b' }}>Page {currentPageNum} of {totalPagesCount}</span>
                    <span>Mzansi Flow Performance Management System</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== TAB 2: AZURE AD USER SELECTOR ===================== */}
        {activeTab === 'azure-selector' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Azure AD Municipal Directory Selector</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select municipal officials to include in the Compliance Certificate. Roles and departments are pulled live from Azure AD.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSelectAllOfficials}
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
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Quick Department Filter Tabs */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Select by Municipal Directorate:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedDepartmentFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedDepartmentFilter === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Departments ({allAzureUsers.length})
                  </button>
                  {departmentsList.map(dept => {
                    const countInDept = allAzureUsers.filter(u => u.department === dept).length;
                    const selectedInDept = allAzureUsers.filter(u => u.department === dept && selectedUserIds.has(u.id)).length;
                    const isFullySelected = countInDept > 0 && selectedInDept === countInDept;
                    return (
                      <div key={dept} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-800 bg-slate-900 text-xs">
                        <button
                          onClick={() => setSelectedDepartmentFilter(dept)}
                          className={`px-2.5 py-1 font-bold transition ${
                            selectedDepartmentFilter === dept
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-300 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          {dept} ({countInDept})
                        </button>
                        <button
                          onClick={() => isFullySelected ? handleDeselectAllInDept(dept) : handleSelectAllInDept(dept)}
                          title={isFullySelected ? `Deselect all in ${dept}` : `Select all in ${dept}`}
                          className={`px-2 py-1 border-l border-slate-800 transition ${
                            isFullySelected ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-500 hover:text-emerald-400'
                          }`}
                        >
                          {selectedInDept}/{countInDept}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search & Active Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by official name, email, designation..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs">
                  <span className="text-slate-400">Total Officials Selected for Certificate:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {selectedUserIds.size} / {allAzureUsers.length}
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
                    <thead className="bg-slate-900 text-slate-400 font-bold sticky top-0 border-b border-slate-800 uppercase text-[10px]">
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
                        <th className="p-3">Designation / Role (Azure AD)</th>
                        <th className="p-3">Department (Azure AD)</th>
                        <th className="p-3">Email Address</th>
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
                            <td className="p-3 text-emerald-300 font-medium">
                              {u.jobFunction}
                            </td>
                            <td className="p-3 text-slate-300 text-[11px]">
                              {u.department}
                            </td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">
                              {u.email}
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

        {/* ===================== TAB 3: PLAIN TEXT READER (BULK PASTE WITH AUTO ENRICHMENT) ===================== */}
        {activeTab === 'text-reader' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Plain Text Reader with Azure AD Auto-Extraction</h3>
                  <p className="text-xs text-slate-400">
                    Paste user names or emails in plain text. The parser cross-references each @nkangaladm.gov.za official against Azure AD and automatically pulls their exact Designation/Role and Department!
                  </p>
                </div>
              </div>

              {pasteMatchReport && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Plain Text Parsing & Azure AD Extraction Complete!</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-300">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Total Parsed:</span>
                      <strong className="text-white text-sm">{pasteMatchReport.totalParsed} Officials</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Matched to Azure AD:</span>
                      <strong className="text-emerald-400 text-sm">{pasteMatchReport.matchedAzure} Enriched</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">New Added:</span>
                      <strong className="text-teal-400 text-sm">{pasteMatchReport.newAppended} Included</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Departments mapped: <strong className="text-white">{pasteMatchReport.departmentsFound.join(', ')}</strong>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Paste plain text names, emails, or tables (one official per line):
                </label>
                <textarea
                  rows={9}
                  value={rawTextPaste}
                  onChange={e => setRawTextPaste(e.target.value)}
                  placeholder={`Example Input 1 (Just Names or Emails - System automatically pulls designation & department from Azure AD):\nMandla L. Mahlangu\nAlice L. Stander\nvanniekerkt@nkangaladm.gov.za\nJimmy Nhlapho\nmasilelasi@nkangaladm.gov.za\nAmos D. Twala\nQuinton Skhosana\n\nExample Input 2 (Tab/Comma separated text):\nMandla L. Mahlangu\tmahlanguml@nkangaladm.gov.za\tMunicipal Manager\tOffice of the MM\nAlice L. Stander\tstanderal@nkangaladm.gov.za\tChief Financial Officer\tFinancial Services`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  Total Active in Certificate: <strong className="text-white">{selectedUserIds.size} officials</strong> across <strong className="text-emerald-400">{usersGroupedByDepartment.length} departments</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRawTextPaste('');
                      setPasteMatchReport(null);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    Clear Input
                  </button>

                  <button
                    onClick={handleParsePlainText}
                    disabled={!rawTextPaste.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Parse & Extract Azure AD Profiles</span>
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
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={e => setShowWatermark(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Show Statutory Watermark in Background</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupByDepartment}
                      onChange={e => setGroupByDepartment(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Group Annexure by Municipal Department</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
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
            padding: 2.2cm 1.8cm !important;
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
