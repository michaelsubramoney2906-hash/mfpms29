import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GitFork, Users, Building, Search, Plus, Trash2, Edit3, Save, RefreshCw, 
  Download, Filter, ChevronRight, ChevronDown, CheckCircle, AlertTriangle, 
  UserCheck, Briefcase, Mail, Phone, MapPin, Layers, LayoutGrid, Table as TableIcon,
  PieChart, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, X, Shield, Star,
  Award, Eye, FileText, Check, ArrowRight, UserPlus, UserMinus, HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../Branding';

export interface OrganogramNode {
  id: string;
  postNumber?: string;
  title: string;
  name: string;
  email: string;
  department: string;
  division?: string;
  parentId?: string | null;
  level: number; // 0 = Executive/MM, 1 = HOD/Director, 2 = Senior Manager, 3 = Assistant Director/Officer, 4 = Staff
  salaryBand?: string;
  occupationalCategory?: string;
  status: 'occupied' | 'vacant_funded' | 'vacant_unfunded';
  employmentType?: 'Permanent' | '5-Year Contract' | 'Fixed-Term' | 'Internship' | 'Acting';
  location?: string;
  phone?: string;
  avatarUrl?: string;
  
  // Performance indicators
  kpiCount?: number;
  kpiCompletion?: number;
  latestScore?: string | number;
  paStatus?: 'Signed' | 'Draft' | 'Submitted' | 'Under Review' | 'Not Started';
}

interface OrganogramProps {
  currentUser: {
    email: string;
    role?: string;
    fullName?: string;
    jobFunction?: string;
    department?: string;
    manager?: string;
  };
  activeTenantId: string;
  onClose?: () => void;
}

const DEFAULT_DEPARTMENTS = [
  "Office of the Municipal Manager",
  "Financial Services (Budget & Treasury)",
  "Corporate Services",
  "Infrastructure Development & Technical Services",
  "Community Services & Public Safety",
  "Planning & Economic Development",
  "Strategic Executive Support"
];

const SALARY_BANDS = [
  "Executive Level 1 (Section 56/57)",
  "Task Grade 19-20 (Senior Management)",
  "Task Grade 16-18 (Middle Management)",
  "Task Grade 13-15 (Specialist / Officer)",
  "Task Grade 9-12 (Senior Administrative)",
  "Task Grade 5-8 (Operational Staff)",
  "Task Grade 1-4 (General Support)"
];

const OCCUPATIONAL_CATEGORIES = [
  "Top Management",
  "Senior Management",
  "Professionally Qualified & Experienced Specialists",
  "Skilled Technical & Academically Qualified Workers",
  "Semi-Skilled & Discretionary Decision Making",
  "Unskilled & Defined Decision Making"
];

export function Organogram({ currentUser, activeTenantId, onClose }: OrganogramProps) {
  const [nodes, setNodes] = useState<OrganogramNode[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'directory' | 'register' | 'analytics'>('tree');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  
  // Tree UI state
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<OrganogramNode | null>(null);
  
  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<OrganogramNode | null>(null);
  const [formValues, setFormValues] = useState<Partial<OrganogramNode>>({});
  
  // Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Departments List
  const availableDepartments = useMemo(() => {
    const set = new Set<string>(DEFAULT_DEPARTMENTS);
    nodes.forEach(n => {
      if (n.department) set.add(n.department);
    });
    usersList.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).filter(Boolean);
  }, [nodes, usersList]);

  // Load initial data
  useEffect(() => {
    loadOrganogramData();
  }, [activeTenantId]);

  const loadOrganogramData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Users
      const uRes = await fetch(`/api/tenant/${activeTenantId}/users?t=${Date.now()}`);
      let uData: any[] = [];
      if (uRes.ok) {
        uData = await uRes.json();
        setUsersList(uData);
      }

      // 2. Fetch Performance Plans for score/KPI linkage
      const pRes = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      let pData: any[] = [];
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson && Array.isArray(pJson.teamPlans)) {
          pData = pJson.teamPlans;
          setTeamPlans(pData);
        }
      }

      // 3. Fetch Saved Organogram from Supabase
      const orgRes = await fetch(`/api/tenant/${activeTenantId}/organogram?t=${Date.now()}`);
      let loadedNodes: OrganogramNode[] = [];
      if (orgRes.ok) {
        const orgJson = await orgRes.json();
        if (orgJson && Array.isArray(orgJson.nodes) && orgJson.nodes.length > 0) {
          const mmNode = orgJson.nodes.find((n: any) => n.level === 0 || n.email?.toLowerCase().includes('mahlanguml'));
          loadedNodes = orgJson.nodes.map((n: any) => {
            if (n.email?.toLowerCase().includes('shabangusm') && mmNode) {
              return { ...n, parentId: mmNode.id, department: 'Office of the Municipal Manager' };
            }
            return n;
          });
        }
      }

      // If no organogram exists yet in Supabase, auto-generate from Users directory
      if (loadedNodes.length === 0 && uData.length > 0) {
        loadedNodes = generateInitialOrganogramFromUsers(uData, pData);
        // Automatically save initial generated nodes to Supabase
        await saveNodesToDatabase(loadedNodes, true);
      }

      setNodes(loadedNodes);
    } catch (err) {
      console.error("Failed to load organogram:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sensible organogram tree hierarchy from tenant users
  const generateInitialOrganogramFromUsers = (users: any[], pplans: any[]): OrganogramNode[] => {
    const generated: OrganogramNode[] = [];

    // Find Municipal Manager / Top Executive
    const mmUser = users.find(u => 
      (u.role === 'ADMIN' || u.jobFunction?.toLowerCase().includes('municipal manager') || u.role?.toLowerCase().includes('executive'))
    ) || users[0];

    const mmNodeId = `post_mm_${Date.now()}`;
    if (mmUser) {
      generated.push({
        id: mmNodeId,
        postNumber: 'POST-001',
        title: mmUser.jobFunction || 'Municipal Manager / Accounting Officer',
        name: mmUser.fullName || mmUser.email,
        email: mmUser.email,
        department: 'Office of the Municipal Manager',
        division: 'Executive Management',
        parentId: null,
        level: 0,
        salaryBand: 'Executive Level 1 (Section 56/57)',
        occupationalCategory: 'Top Management',
        status: 'occupied',
        employmentType: '5-Year Contract',
        location: 'Civic Centre - Head Office',
        phone: mmUser.phone || '013 249 2000',
        kpiCount: 12,
        kpiCompletion: 85,
        latestScore: '3.8',
        paStatus: 'Signed'
      });
    }

    // Identify and link other users
    users.forEach((user, idx) => {
      if (user.email === mmUser?.email) return;

      const userEmail = user.email.toLowerCase();
      const userJob = (user.jobFunction || '').toLowerCase();
      const userDept = user.department || 'Corporate Services';
      
      // Determine hierarchical level
      let level = 3;
      let salaryBand = 'Task Grade 13-15 (Specialist / Officer)';
      let occCat = 'Skilled Technical & Academically Qualified Workers';

      if (userJob.includes('general manager') || userJob.includes('director') || userJob.includes('cfo') || userJob.includes('hod')) {
        level = 1;
        salaryBand = 'Executive Level 1 (Section 56/57)';
        occCat = 'Senior Management';
      } else if (userJob.includes('senior manager') || userJob.includes('unit head') || userJob.includes('head of')) {
        level = 2;
        salaryBand = 'Task Grade 19-20 (Senior Management)';
        occCat = 'Professionally Qualified & Experienced Specialists';
      } else if (userJob.includes('manager') || userJob.includes('assistant director')) {
        level = 2;
        salaryBand = 'Task Grade 16-18 (Middle Management)';
        occCat = 'Professionally Qualified & Experienced Specialists';
      } else if (userJob.includes('officer') || userJob.includes('specialist') || userJob.includes('accountant') || userJob.includes('engineer')) {
        level = 3;
        salaryBand = 'Task Grade 13-15 (Specialist / Officer)';
        occCat = 'Skilled Technical & Academically Qualified Workers';
      } else {
        level = 4;
        salaryBand = 'Task Grade 9-12 (Senior Administrative)';
        occCat = 'Semi-Skilled & Discretionary Decision Making';
      }

      // Determine parent manager
      let parentId: string | null = mmNodeId;
      if (userEmail.includes('shabangusm')) {
        parentId = mmNodeId;
      } else if (user.manager) {
        const mgrUser = users.find(m => m.email?.toLowerCase() === user.manager?.toLowerCase() || m.fullName?.toLowerCase() === user.manager?.toLowerCase());
        if (mgrUser && mgrUser.email !== user.email) {
          const matchExisting = generated.find(g => g.email.toLowerCase() === mgrUser.email.toLowerCase());
          if (matchExisting) {
            parentId = matchExisting.id;
          }
        }
      }

      // Check performance plan info
      const plan = pplans.find(p => p.userId?.toLowerCase() === userEmail);
      const kpis = plan?.plan?.items || [];
      const kpiCount = kpis.length > 0 ? kpis.length : 8;

      generated.push({
        id: `post_${idx + 2}_${Date.now()}`,
        postNumber: `POST-${String(idx + 2).padStart(3, '0')}`,
        title: user.jobFunction || 'Municipal Officer',
        name: user.fullName || user.email,
        email: user.email,
        department: userDept,
        division: user.jobFunction ? `${user.jobFunction} Unit` : 'Operations',
        parentId: level === 1 ? mmNodeId : parentId,
        level,
        salaryBand,
        occupationalCategory: occCat,
        status: 'occupied',
        employmentType: 'Permanent',
        location: 'Civic Centre',
        phone: user.phone || '013 249 2000',
        kpiCount,
        kpiCompletion: 75,
        latestScore: '3.5',
        paStatus: 'Signed'
      });
    });

    // Add standard vacant posts for municipal planning
    const sampleVacancies: Partial<OrganogramNode>[] = [
      {
        title: 'Manager: Project Management Unit (PMU)',
        department: 'Infrastructure Development & Technical Services',
        level: 2,
        salaryBand: 'Task Grade 16-18 (Middle Management)',
        status: 'vacant_funded',
        employmentType: 'Permanent'
      },
      {
        title: 'Senior Internal Auditor',
        department: 'Strategic Executive Support',
        level: 2,
        salaryBand: 'Task Grade 16-18 (Middle Management)',
        status: 'vacant_funded',
        employmentType: 'Permanent'
      },
      {
        title: 'Senior Town Planner (SPLUMA Compliance)',
        department: 'Planning & Economic Development',
        level: 2,
        salaryBand: 'Task Grade 16-18 (Middle Management)',
        status: 'vacant_unfunded',
        employmentType: 'Permanent'
      }
    ];

    sampleVacancies.forEach((vac, vIdx) => {
      generated.push({
        id: `post_vac_${vIdx + 1}_${Date.now()}`,
        postNumber: `VAC-${String(vIdx + 1).padStart(3, '0')}`,
        title: vac.title || 'Vacant Post',
        name: vac.status === 'vacant_funded' ? '[Vacant - Funded Post]' : '[Vacant - Unfunded Post]',
        email: '',
        department: vac.department || 'Corporate Services',
        division: 'Planning & Administration',
        parentId: mmNodeId,
        level: vac.level || 2,
        salaryBand: vac.salaryBand || 'Task Grade 16-18 (Middle Management)',
        occupationalCategory: 'Professionally Qualified & Experienced Specialists',
        status: vac.status as any,
        employmentType: 'Permanent',
        location: 'Civic Centre',
        kpiCount: 0,
        kpiCompletion: 0,
        latestScore: '-',
        paStatus: 'Not Started'
      });
    });

    return generated;
  };

  // Save nodes to Supabase
  const saveNodesToDatabase = async (nodesToSave: OrganogramNode[], silent: boolean = false) => {
    try {
      if (!silent) setIsSaving(true);
      const res = await fetch(`/api/tenant/${activeTenantId}/organogram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodes: nodesToSave,
          departments: availableDepartments
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }

      if (!silent) {
        setSuccessToast("Organogram structure & reporting hierarchy saved to Supabase!");
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } catch (err: any) {
      console.error("Save organogram error:", err);
      if (!silent) {
        alert(`Error saving organogram: ${err.message}`);
      }
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  // Sync users with Organogram
  const handleSyncWithUsers = async () => {
    try {
      setIsSyncing(true);
      const uRes = await fetch(`/api/tenant/${activeTenantId}/users?t=${Date.now()}`);
      if (!uRes.ok) throw new Error("Failed to fetch user directory");
      const usersData: any[] = await uRes.json();
      setUsersList(usersData);

      const nextNodes = [...nodes];
      
      // Upsert missing users
      usersData.forEach((u, idx) => {
        const existingIdx = nextNodes.findIndex(n => n.email && n.email.toLowerCase() === u.email?.toLowerCase());
        if (existingIdx >= 0) {
          nextNodes[existingIdx] = {
            ...nextNodes[existingIdx],
            name: u.fullName || nextNodes[existingIdx].name,
            title: u.jobFunction || nextNodes[existingIdx].title,
            department: u.department || nextNodes[existingIdx].department,
            phone: u.phone || nextNodes[existingIdx].phone
          };
        } else {
          // Add as new node under MM or root
          const rootNode = nextNodes.find(n => n.level === 0) || nextNodes[0];
          nextNodes.push({
            id: `post_sync_${idx}_${Date.now()}`,
            postNumber: `POST-${String(nextNodes.length + 1).padStart(3, '0')}`,
            title: u.jobFunction || 'Municipal Staff',
            name: u.fullName || u.email,
            email: u.email,
            department: u.department || 'Corporate Services',
            division: 'Operations',
            parentId: rootNode ? rootNode.id : null,
            level: 3,
            salaryBand: 'Task Grade 13-15 (Specialist / Officer)',
            occupationalCategory: 'Skilled Technical & Academically Qualified Workers',
            status: 'occupied',
            employmentType: 'Permanent',
            location: 'Civic Centre',
            kpiCount: 6,
            kpiCompletion: 70,
            latestScore: '3.2',
            paStatus: 'Signed'
          });
        }
      });

      setNodes(nextNodes);
      await saveNodesToDatabase(nextNodes);
      setSuccessToast("Synchronized all staff members from User Directory into Organogram!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Node collapse / expand
  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAllNodes = () => setCollapsedNodeIds(new Set());
  const collapseAllNodes = () => {
    const rootNodes = nodes.filter(n => !n.parentId || n.level === 0);
    const nonRootIds = nodes.filter(n => n.parentId && n.level > 0).map(n => n.id);
    setCollapsedNodeIds(new Set(nonRootIds));
  };

  // Add / Edit Modal handlers
  const handleOpenAddModal = (parentPostId?: string) => {
    setEditingNode(null);
    setFormValues({
      postNumber: `POST-${String(nodes.length + 1).padStart(3, '0')}`,
      title: '',
      name: '',
      email: '',
      department: availableDepartments[0] || 'Corporate Services',
      division: 'Administration',
      parentId: parentPostId || (nodes[0]?.id || null),
      level: 3,
      salaryBand: SALARY_BANDS[3],
      occupationalCategory: OCCUPATIONAL_CATEGORIES[3],
      status: 'occupied',
      employmentType: 'Permanent',
      location: 'Civic Centre',
      phone: '',
      paStatus: 'Signed'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (node: OrganogramNode) => {
    setEditingNode(node);
    setFormValues({ ...node });
    setIsModalOpen(true);
  };

  const handleSaveModalForm = () => {
    if (!formValues.title) {
      alert("Position title is required.");
      return;
    }

    let nextNodes: OrganogramNode[];

    if (editingNode) {
      // Edit existing
      nextNodes = nodes.map(n => n.id === editingNode.id ? ({ ...n, ...formValues } as OrganogramNode) : n);
    } else {
      // Create new
      const newNode: OrganogramNode = {
        id: `post_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        postNumber: formValues.postNumber || `POST-${String(nodes.length + 1).padStart(3, '0')}`,
        title: formValues.title || 'New Position',
        name: formValues.status === 'vacant_funded' ? '[Vacant - Funded]' : formValues.status === 'vacant_unfunded' ? '[Vacant - Unfunded]' : (formValues.name || 'Incumbent Name'),
        email: formValues.email || '',
        department: formValues.department || availableDepartments[0] || 'Corporate Services',
        division: formValues.division || 'Administration',
        parentId: formValues.parentId || null,
        level: Number(formValues.level ?? 3),
        salaryBand: formValues.salaryBand || SALARY_BANDS[3],
        occupationalCategory: formValues.occupationalCategory || OCCUPATIONAL_CATEGORIES[3],
        status: formValues.status || 'occupied',
        employmentType: formValues.employmentType || 'Permanent',
        location: formValues.location || 'Civic Centre',
        phone: formValues.phone || '',
        kpiCount: formValues.status === 'occupied' ? 6 : 0,
        kpiCompletion: formValues.status === 'occupied' ? 70 : 0,
        latestScore: formValues.status === 'occupied' ? '3.0' : '-',
        paStatus: formValues.paStatus || (formValues.status === 'occupied' ? 'Signed' : 'Not Started')
      };
      nextNodes = [...nodes, newNode];
    }

    setNodes(nextNodes);
    saveNodesToDatabase(nextNodes);
    setIsModalOpen(false);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (!target) return;

    if (confirm(`Are you sure you want to remove position "${target.title}" (${target.name}) from the Organogram? Direct reports will be re-assigned to the higher parent position.`)) {
      const parentOfTarget = target.parentId;
      const nextNodes = nodes
        .filter(n => n.id !== nodeId)
        .map(n => n.parentId === nodeId ? { ...n, parentId: parentOfTarget } : n);

      setNodes(nextNodes);
      saveNodesToDatabase(nextNodes);
      if (selectedNodeDetails?.id === nodeId) {
        setSelectedNodeDetails(null);
      }
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Department filter
      if (selectedDeptFilter !== 'ALL' && node.department !== selectedDeptFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL' && node.status !== selectedStatusFilter) {
        return false;
      }
      // Level filter
      if (selectedLevelFilter !== 'ALL' && String(node.level) !== selectedLevelFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = [
          node.title,
          node.name,
          node.email,
          node.department,
          node.division,
          node.postNumber,
          node.salaryBand,
          node.location
        ].filter(Boolean).join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [nodes, selectedDeptFilter, selectedStatusFilter, selectedLevelFilter, searchQuery]);

  // Hierarchical tree structure builder
  interface TreeNode extends OrganogramNode {
    children: TreeNode[];
  }

  const hierarchyTree = useMemo((): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    nodes.forEach(n => {
      nodeMap.set(n.id, { ...n, children: [] });
    });

    const roots: TreeNode[] = [];

    nodeMap.forEach(treeNode => {
      if (treeNode.parentId && nodeMap.has(treeNode.parentId)) {
        const parent = nodeMap.get(treeNode.parentId)!;
        parent.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    // Sort roots and children by level and title
    const sortNodes = (arr: TreeNode[]) => {
      arr.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
      arr.forEach(child => sortNodes(child.children));
    };

    sortNodes(roots);
    return roots;
  }, [nodes]);

  // Statistics & Analytics
  const stats = useMemo(() => {
    const totalPosts = nodes.length;
    const occupied = nodes.filter(n => n.status === 'occupied').length;
    const vacantFunded = nodes.filter(n => n.status === 'vacant_funded').length;
    const vacantUnfunded = nodes.filter(n => n.status === 'vacant_unfunded').length;
    const vacancyRate = totalPosts > 0 ? ((vacantFunded + vacantUnfunded) / totalPosts * 100).toFixed(1) : '0';

    const deptCounts: Record<string, { total: number; occupied: number; vacant: number }> = {};
    nodes.forEach(n => {
      const dept = n.department || 'General Administration';
      if (!deptCounts[dept]) {
        deptCounts[dept] = { total: 0, occupied: 0, vacant: 0 };
      }
      deptCounts[dept].total++;
      if (n.status === 'occupied') deptCounts[dept].occupied++;
      else deptCounts[dept].vacant++;
    });

    const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    nodes.forEach(n => {
      levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
    });

    return {
      totalPosts,
      occupied,
      vacantFunded,
      vacantUnfunded,
      vacancyRate,
      deptCounts,
      levelCounts
    };
  }, [nodes]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = nodes.map((n, idx) => {
      const parentNode = nodes.find(p => p.id === n.parentId);
      return {
        'Post No': n.postNumber || `POST-${idx + 1}`,
        'Position Title': n.title,
        'Incumbent Name': n.name,
        'Email Address': n.email,
        'Directorate / Department': n.department,
        'Division / Unit': n.division || '-',
        'Reports To (Manager)': parentNode ? `${parentNode.title} (${parentNode.name})` : 'Council / Executive Mayor',
        'Post Level': n.level === 0 ? 'Executive (MM)' : n.level === 1 ? 'HOD / Director' : n.level === 2 ? 'Senior Manager' : n.level === 3 ? 'Officer / Specialist' : 'Staff',
        'Salary Band': n.salaryBand || '-',
        'Occupational Category': n.occupationalCategory || '-',
        'Post Status': n.status === 'occupied' ? 'Occupied' : n.status === 'vacant_funded' ? 'Vacant (Funded)' : 'Vacant (Unfunded)',
        'Employment Type': n.employmentType || 'Permanent',
        'Location': n.location || 'Civic Centre',
        'Phone': n.phone || '-',
        'Performance Agreement Status': n.paStatus || '-',
        'KPI Count': n.kpiCount || 0,
        'Performance Score': n.latestScore || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organogram_Register");
    XLSX.writeFile(wb, `Organogram_Establishment_Register_${activeTenantId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Helper for node level styling
  const getNodeLevelConfig = (level: number, status: string) => {
    if (status === 'vacant_funded') {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        cardBorder: 'border-amber-400 bg-amber-50/40',
        pillBg: 'bg-amber-500 text-white',
        levelLabel: 'Funded Vacancy'
      };
    }
    if (status === 'vacant_unfunded') {
      return {
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        cardBorder: 'border-rose-400 bg-rose-50/40',
        pillBg: 'bg-rose-500 text-white',
        levelLabel: 'Unfunded Vacancy'
      };
    }

    switch (level) {
      case 0:
        return {
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          cardBorder: 'border-indigo-500 bg-gradient-to-br from-indigo-50/70 to-white shadow-indigo-100',
          pillBg: 'bg-indigo-600 text-white',
          levelLabel: 'Executive / Accounting Officer'
        };
      case 1:
        return {
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
          cardBorder: 'border-teal-500 bg-gradient-to-br from-teal-50/60 to-white shadow-teal-100',
          pillBg: 'bg-teal-600 text-white',
          levelLabel: 'Head of Department (HOD)'
        };
      case 2:
        return {
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          cardBorder: 'border-blue-400 bg-gradient-to-br from-blue-50/50 to-white shadow-blue-100',
          pillBg: 'bg-blue-600 text-white',
          levelLabel: 'Senior Manager / Unit Head'
        };
      case 3:
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          cardBorder: 'border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-white shadow-emerald-100',
          pillBg: 'bg-emerald-600 text-white',
          levelLabel: 'Officer / Specialist'
        };
      default:
        return {
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
          cardBorder: 'border-slate-300 bg-white',
          pillBg: 'bg-slate-600 text-white',
          levelLabel: 'Operational Staff'
        };
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeBranch = (node: TreeNode) => {
    const isCollapsed = collapsedNodeIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const config = getNodeLevelConfig(node.level, node.status);
    const isSelected = selectedNodeDetails?.id === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center select-none">
        
        {/* Node Card */}
        <div 
          onClick={() => setSelectedNodeDetails(node)}
          className={cn(
            "relative w-72 rounded-2xl border-2 p-3.5 shadow-md transition-all duration-200 cursor-pointer text-left group hover:shadow-xl hover:-translate-y-0.5",
            config.cardBorder,
            isSelected && "ring-4 ring-emerald-400 border-emerald-600 shadow-2xl scale-[1.02]"
          )}
        >
          {/* Top Post Badge & Level Pill */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono bg-slate-900 text-white shadow-2xs">
              {node.postNumber || 'POST'}
            </span>
            <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight border", config.badgeBg)}>
              {config.levelLabel}
            </span>
          </div>

          {/* Title & Department */}
          <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
            {node.title}
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
            {node.department}
          </p>

          {/* Incumbent Name & Email */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 uppercase shadow-xs",
                node.status === 'occupied' ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"
              )}>
                {node.status === 'occupied' ? (node.name ? node.name.charAt(0) : 'U') : 'V'}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-bold truncate",
                  node.status === 'occupied' ? "text-slate-800" : "text-amber-700 italic"
                )}>
                  {node.name}
                </p>
                {node.email && (
                  <p className="text-[9px] text-slate-400 truncate">
                    {node.email}
                  </p>
                )}
              </div>
            </div>

            {/* Performance Badge */}
            {node.status === 'occupied' && node.latestScore && (
              <div className="text-right shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Score</span>
                <span className="text-[10px] font-black text-emerald-600">{node.latestScore}</span>
              </div>
            )}
          </div>

          {/* Card Action Overlay Controls */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddModal(node.id);
                }}
                className="p-1 rounded-md hover:bg-emerald-100 text-emerald-700 transition"
                title="Add Direct Report under this post"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(node);
                }}
                className="p-1 rounded-md hover:bg-blue-100 text-blue-700 transition"
                title="Edit Position & Incumbent"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNode(node.id);
                }}
                className="p-1 rounded-md hover:bg-rose-100 text-rose-700 transition"
                title="Remove Position"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Reports Count Badge */}
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeCollapse(node.id);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-black transition"
              >
                <span>{node.children.length} Reports</span>
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Tree Connectors & Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center">
            {/* Vertical stem down from parent */}
            <div className="w-0.5 h-6 bg-slate-300" />
            
            {/* Children Container */}
            <div className="relative flex items-start justify-center gap-6 pt-2">
              {/* Horizontal crossbar connector spanning children */}
              {node.children.length > 1 && (
                <div 
                  className="absolute top-0 h-0.5 bg-slate-300"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `calc(100% - 288px)`
                  }}
                />
              )}

              {/* Render each child */}
              {node.children.map(child => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical stem from crossbar down to child */}
                  <div className="w-0.5 h-4 bg-slate-300 -mt-2 mb-2" />
                  {renderTreeBranch(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="organogram-master-suite" className={cn(
      "flex flex-col h-full bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-300 font-sans select-text",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-none"
    )}>
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-fade-in text-xs font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="p-5 bg-white border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
              IPMS ORGANIZATIONAL STRUCTURE
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
              TENANT: {activeTenantId}
            </span>
          </div>
          <h1 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mt-1">
            <GitFork className="w-5 h-5 text-emerald-600 shrink-0" />
            Municipal Organogram & Reporting Hierarchy Suite
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Interactive multi-level post establishment register, departmental reporting lines, and performance accountability map.
          </p>
        </div>

        {/* Action Buttons & View Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          
          {/* Tab Switchers */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tree')}
              className={cn(
                "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer",
                activeTab === 'tree' ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Org Tree</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={cn(
                "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer",
                activeTab === 'directory' ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Directorate Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={cn(
                "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer",
                activeTab === 'register' ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Establishment Register</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer",
                activeTab === 'analytics' ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Workforce Analytics</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncWithUsers}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Sync positions with current tenant User Directory"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing..." : "Sync Directory"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Position</span>
          </button>

          <button
            type="button"
            onClick={() => saveNodesToDatabase(nodes)}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Organogram"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Export Post Establishment Register to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Organogram"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats / Summary Bar */}
      <div className="bg-slate-900 text-white px-6 py-3 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs shrink-0 border-b border-slate-800 select-none">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Positions</span>
          <span className="text-base font-black text-white">{stats.totalPosts}</span>
        </div>
        <div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Occupied Posts</span>
          <span className="text-base font-black text-emerald-400">{stats.occupied}</span>
        </div>
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Funded Vacancies</span>
          <span className="text-base font-black text-amber-400">{stats.vacantFunded}</span>
        </div>
        <div>
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Unfunded Vacancies</span>
          <span className="text-base font-black text-rose-400">{stats.vacantUnfunded}</span>
        </div>
        <div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Vacancy Rate</span>
          <span className="text-base font-black text-cyan-400">{stats.vacancyRate}%</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shrink-0">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by position title, incumbent, email, post no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Directorate Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Directorates ({availableDepartments.length})</option>
            {availableDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Post Status Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Post Statuses</option>
            <option value="occupied">Occupied Posts</option>
            <option value="vacant_funded">Vacant (Funded)</option>
            <option value="vacant_unfunded">Vacant (Unfunded)</option>
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Hierarchy Levels</option>
            <option value="0">Level 0: Executive / Accounting Officer</option>
            <option value="1">Level 1: Head of Department (HOD)</option>
            <option value="2">Level 2: Senior Manager / Unit Head</option>
            <option value="3">Level 3: Officer / Specialist</option>
            <option value="4">Level 4: Operational Staff</option>
          </select>
        </div>

      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto bg-slate-50 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-600 font-bold">Loading Organogram from Supabase cloud database...</p>
          </div>
        ) : activeTab === 'tree' ? (
          /* Visual Interactive Org Tree */
          <div className="p-8 min-w-max flex flex-col items-center relative">
            
            {/* Floating Zoom & Tree Controls */}
            <div className="fixed bottom-8 left-8 z-30 bg-white/95 backdrop-blur shadow-xl border border-slate-300 rounded-2xl p-2 flex items-center gap-2 select-none">
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(prev + 0.15, 1.8))}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(prev - 0.15, 0.4))}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1.0)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{Math.round(zoomScale * 100)}%</span>
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={expandAllNodes}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllNodes}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Collapse
              </button>
            </div>

            {/* Scale Container */}
            <div 
              style={{ 
                transform: `scale(${zoomScale})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="flex flex-col items-center gap-12 pt-4 pb-32"
            >
              {hierarchyTree.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-md">
                  <GitFork className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Organogram Positions Found</h3>
                  <p className="text-xs text-slate-500 mt-1">Click below to synchronize all staff from your user directory or add the first executive position.</p>
                  <button
                    type="button"
                    onClick={handleSyncWithUsers}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Sync User Directory
                  </button>
                </div>
              ) : (
                hierarchyTree.map(root => renderTreeBranch(root))
              )}
            </div>

          </div>
        ) : activeTab === 'directory' ? (
          /* Directorate Grid View */
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableDepartments.map(dept => {
              const deptNodes = nodes.filter(n => n.department === dept);
              const hod = deptNodes.find(n => n.level <= 1);
              const occupiedCount = deptNodes.filter(n => n.status === 'occupied').length;
              const vacantCount = deptNodes.filter(n => n.status !== 'occupied').length;

              return (
                <div key={dept} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="p-4 bg-slate-900 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                        DIRECTORATE
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {deptNodes.length} Posts
                      </span>
                    </div>
                    <h2 className="text-sm font-black text-white mt-1 line-clamp-2">
                      {dept}
                    </h2>
                  </div>

                  {/* Summary Bar */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="text-emerald-700">{occupiedCount} Occupied</span>
                    <span className="text-amber-700">{vacantCount} Vacancies</span>
                  </div>

                  {/* Head of Department info */}
                  {hod && (
                    <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {hod.name ? hod.name.charAt(0) : 'H'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-tight text-emerald-800 block">Lead Official</span>
                        <p className="text-xs font-black text-slate-900 truncate">{hod.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{hod.title}</p>
                      </div>
                    </div>
                  )}

                  {/* Posts List */}
                  <div className="p-3 flex-1 overflow-y-auto max-h-80 space-y-2">
                    {deptNodes.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => setSelectedNodeDetails(post)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{post.title}</p>
                          <p className={cn(
                            "text-[10px] font-semibold truncate",
                            post.status === 'occupied' ? "text-slate-500" : "text-amber-600 italic"
                          )}>
                            {post.name}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight shrink-0",
                          post.status === 'occupied' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        )}>
                          L{post.level}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        ) : activeTab === 'register' ? (
          /* Post Establishment Register Table */
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs bg-white rounded-2xl overflow-hidden border border-slate-300 shadow-sm min-w-[1200px]">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  <th className="p-3 w-12 text-center">No.</th>
                  <th className="p-3 w-28 font-mono">Post No</th>
                  <th className="p-3 min-w-[220px]">Position Title</th>
                  <th className="p-3 min-w-[200px]">Incumbent Name</th>
                  <th className="p-3 min-w-[220px]">Directorate</th>
                  <th className="p-3 min-w-[180px]">Reports To</th>
                  <th className="p-3 w-20 text-center">Level</th>
                  <th className="p-3 min-w-[160px]">Salary Band</th>
                  <th className="p-3 w-28 text-center">Status</th>
                  <th className="p-3 w-24 text-center">PA Status</th>
                  <th className="p-3 w-20 text-center">Score</th>
                  <th className="p-3 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredNodes.map((post, idx) => {
                  const parent = nodes.find(p => p.id === post.parentId);
                  return (
                    <tr key={post.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{post.postNumber || `POST-${idx + 1}`}</td>
                      <td className="p-3 font-black text-slate-900">{post.title}</td>
                      <td className="p-3">
                        <span className={cn(
                          "font-bold",
                          post.status === 'occupied' ? "text-slate-800" : "text-amber-700 italic"
                        )}>
                          {post.name}
                        </span>
                        {post.email && <span className="block text-[10px] text-slate-400">{post.email}</span>}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{post.department}</td>
                      <td className="p-3 text-slate-600">{parent ? parent.title : 'Executive Mayor / Council'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-[10px]">
                          L{post.level}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-[11px]">{post.salaryBand || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight",
                          post.status === 'occupied' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        )}>
                          {post.status === 'occupied' ? 'Occupied' : 'Vacant'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {post.paStatus || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black text-emerald-700">{post.latestScore || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(post)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-700 transition"
                            title="Edit Post"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNode(post.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition"
                            title="Delete Post"
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
        ) : (
          /* Workforce Analytics View */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Directorate Headcount Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                <Building className="w-4 h-4 text-emerald-600" />
                Directorate Post Distribution & Vacancy Rates
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.deptCounts).map(([dept, count]) => {
                  const percent = stats.totalPosts > 0 ? (count.total / stats.totalPosts * 100).toFixed(0) : '0';
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{dept}</span>
                        <span>{count.occupied} Occupied / {count.vacant} Vacant ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full" 
                          style={{ width: `${(count.occupied / (count.total || 1)) * 100}%` }}
                        />
                        <div 
                          className="bg-amber-400 h-full" 
                          style={{ width: `${(count.vacant / (count.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hierarchical Levels Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-indigo-600" />
                Establishment Tier Distribution
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900">Level 0: Executive / MM</span>
                  <span className="font-black text-indigo-700">{stats.levelCounts[0] || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                  <span className="font-bold text-teal-900">Level 1: HOD / Directors</span>
                  <span className="font-black text-teal-700">{stats.levelCounts[1] || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900">Level 2: Senior Managers</span>
                  <span className="font-black text-blue-700">{stats.levelCounts[2] || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900">Level 3: Officers & Specialists</span>
                  <span className="font-black text-emerald-700">{stats.levelCounts[3] || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900">Level 4: Staff & Administrative</span>
                  <span className="font-black text-slate-700">{stats.levelCounts[4] || 0}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Side Details Drawer (When a node is clicked) */}
      {selectedNodeDetails && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-40 border-l border-slate-300 flex flex-col animate-slide-left">
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-900 text-[10px] font-black uppercase">
                {selectedNodeDetails.postNumber || 'POST'}
              </span>
              <span className="text-xs font-bold text-slate-300">Position Profile</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeDetails(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {selectedNodeDetails.title}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {selectedNodeDetails.department}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Incumbent</span>
              <p className="text-sm font-black text-slate-800">{selectedNodeDetails.name}</p>
              {selectedNodeDetails.email && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedNodeDetails.email}</span>
                </p>
              )}
              {selectedNodeDetails.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedNodeDetails.phone}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Post Details</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">Status</span>
                  <span className="font-black text-slate-800 uppercase">{selectedNodeDetails.status}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">Employment Type</span>
                  <span className="font-black text-slate-800">{selectedNodeDetails.employmentType || 'Permanent'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-[9px] text-slate-400 font-bold block">Salary Band</span>
                  <span className="font-black text-slate-800">{selectedNodeDetails.salaryBand || '-'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-[9px] text-slate-400 font-bold block">Occupational Category</span>
                  <span className="font-black text-slate-800">{selectedNodeDetails.occupationalCategory || '-'}</span>
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            {selectedNodeDetails.status === 'occupied' && (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">IPMS Performance Link</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-bold">PA Status:</span>
                  <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{selectedNodeDetails.paStatus || 'Signed'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-bold">Target KPIs:</span>
                  <span className="font-black text-slate-900">{selectedNodeDetails.kpiCount || 8} Measures</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-bold">Performance Score:</span>
                  <span className="font-black text-emerald-700 text-sm">{selectedNodeDetails.latestScore || '3.5'} / 5.0</span>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOpenEditModal(selectedNodeDetails);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Position</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNode(selectedNodeDetails.id)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold border border-rose-200 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  POSITION ESTABLISHMENT CONFIGURATOR
                </span>
                <h2 className="text-base font-black text-white mt-0.5">
                  {editingNode ? "Edit Position Details" : "Add New Organogram Position"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Position Title */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    value={formValues.title || ''}
                    onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                    placeholder="e.g. Senior Manager: Financial Reporting & SCM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Post Number */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Post Number
                  </label>
                  <input
                    type="text"
                    value={formValues.postNumber || ''}
                    onChange={(e) => setFormValues({ ...formValues, postNumber: e.target.value })}
                    placeholder="e.g. POST-012"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Directorate / Department */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Directorate / Department
                  </label>
                  <select
                    value={formValues.department || availableDepartments[0]}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Reports To (Parent Node) */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Reports To (Direct Superior Post)
                  </label>
                  <select
                    value={formValues.parentId || ''}
                    onChange={(e) => setFormValues({ ...formValues, parentId: e.target.value || null })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Council / Executive Mayor (Top Level Root) --</option>
                    {nodes.filter(n => !editingNode || n.id !== editingNode.id).map(n => (
                      <option key={n.id} value={n.id}>
                        {n.title} - ({n.name || 'Vacant'}) [{n.department}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Post Status */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Post Status
                  </label>
                  <select
                    value={formValues.status || 'occupied'}
                    onChange={(e) => {
                      const st = e.target.value as any;
                      setFormValues({ 
                        ...formValues, 
                        status: st,
                        name: st === 'vacant_funded' ? '[Vacant - Funded]' : st === 'vacant_unfunded' ? '[Vacant - Unfunded]' : formValues.name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="occupied">Occupied</option>
                    <option value="vacant_funded">Vacant (Funded)</option>
                    <option value="vacant_unfunded">Vacant (Unfunded)</option>
                  </select>
                </div>

                {/* Hierarchy Level */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Hierarchy Level
                  </label>
                  <select
                    value={formValues.level ?? 3}
                    onChange={(e) => setFormValues({ ...formValues, level: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={0}>Level 0: Executive / Accounting Officer (MM)</option>
                    <option value={1}>Level 1: Head of Department / Director</option>
                    <option value={2}>Level 2: Senior Manager / Unit Head</option>
                    <option value={3}>Level 3: Officer / Specialist</option>
                    <option value={4}>Level 4: Staff / Administrative</option>
                  </select>
                </div>

                {/* Incumbent Name */}
                {formValues.status === 'occupied' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                        Incumbent Full Name
                      </label>
                      <input
                        type="text"
                        value={formValues.name || ''}
                        onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                        placeholder="e.g. Sibusiso Shabangu"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                        Incumbent Email
                      </label>
                      <input
                        type="email"
                        value={formValues.email || ''}
                        onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                        placeholder="e.g. sibusiso@nkangaladm.gov.za"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

                {/* Salary Band */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Salary Band
                  </label>
                  <select
                    value={formValues.salaryBand || SALARY_BANDS[3]}
                    onChange={(e) => setFormValues({ ...formValues, salaryBand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {SALARY_BANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formValues.employmentType || 'Permanent'}
                    onChange={(e) => setFormValues({ ...formValues, employmentType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="5-Year Contract">5-Year Contract (Section 56/57)</option>
                    <option value="Fixed-Term">Fixed-Term Contract</option>
                    <option value="Acting">Acting Appointment</option>
                    <option value="Internship">Internship / Graduate</option>
                  </select>
                </div>

                {/* Occupational Category */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">
                    Occupational Category (DoEL Statutory Standard)
                  </label>
                  <select
                    value={formValues.occupationalCategory || OCCUPATIONAL_CATEGORIES[3]}
                    onChange={(e) => setFormValues({ ...formValues, occupationalCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {OCCUPATIONAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalForm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Position</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
