import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder, FolderPlus, Upload, FileText, Image as ImageIcon, FileSpreadsheet,
  FileCode, Music, Video, Archive, File, Download, Trash2, Edit3, Eye,
  Search, ArrowLeft, ChevronRight, HardDrive, RefreshCw, X, CheckCircle2,
  AlertTriangle, Filter, Grid, List as ListIcon, ShieldCheck, Building2,
  Cloud, Sparkles, FolderTree, Clock, User as UserIcon, Tag, Copy, Maximize2,
  ExternalLink, ZoomIn, ZoomOut, RotateCw, ChevronLeft, Table, Layers, FileCheck, Check,
  Bell, Users, CheckSquare, Square, Send, Info, Mail, AlertCircle, CheckSquare2,
  Share2, Shield, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type { User } from '../types';

export interface SharePointItem {
  id: string;
  name: string;
  originalName?: string;
  parentId: string | null;
  type: 'folder' | 'file';
  size?: number;
  fileType?: string;
  mimeType?: string;
  extension?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByEmail?: string;
  organization?: string;
  color?: string;
  description?: string;
  sharedWith?: string[];
  sharedWithDetails?: Array<{
    email: string;
    fullName?: string;
    jobFunction?: string;
    department?: string;
    organization?: string;
    permission?: string;
    sharedAt?: string;
    sharedBy?: string;
  }>;
  sharePermission?: 'view' | 'download' | 'edit';
  shareNote?: string;
  lastSharedAt?: string;
  lastSharedBy?: string;
  lastSharedByEmail?: string;
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  jobFunction: string;
  department: string;
  organization: string;
  organizationLabel: string;
  role: string;
  systemRole: string;
  source: string;
}

export interface SharePointNotification {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileId: string;
  folderId: string;
  folderName: string;
  organization: string;
  uploadedBy: string;
  uploadedByEmail: string;
  size: number;
  extension: string;
  note?: string;
  createdAt: string;
  recipients: string[];
  readBy?: string[];
}

interface SharePointProps {
  currentUser: User;
  activeTenantId: string;
  initialFolderId?: string | null;
}

interface UploadTask {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ExcelParsedWorkbook {
  sheetNames: string[];
  sheetsData: Record<string, any[][]>;
}

export function SharePoint({ currentUser, activeTenantId, initialFolderId }: SharePointProps) {
  const [items, setItems] = useState<SharePointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || null);
  const [navigationHistory, setNavigationHistory] = useState<(string | null)[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drag and Drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  // Upload tasks queue
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [showUploadQueue, setShowUploadQueue] = useState(false);
  const uploadDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Upload & Notification Modal state
  const [showUploadNotifyModal, setShowUploadNotifyModal] = useState(false);
  const [pendingFilesToUpload, setPendingFilesToUpload] = useState<File[]>([]);
  const [targetUploadFolderId, setTargetUploadFolderId] = useState<string>('folder_nkangala_root');
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [loadingDirectoryUsers, setLoadingDirectoryUsers] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [customNotificationNote, setCustomNotificationNote] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userOrgFilter, setUserOrgFilter] = useState<'all' | 'nkangala' | 'mzansi' | 'managers' | 'auditors'>('all');
  const [isUploadingWithNotify, setIsUploadingWithNotify] = useState(false);

  // SharePoint Upload Notifications stream
  const [notifications, setNotifications] = useState<SharePointNotification[]>([]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('emerald');

  const [renameTarget, setRenameTarget] = useState<SharePointItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SharePointItem | null>(null);

  // Document Sharing Modal State (Azure AD & Enterprise Cross-Tenant Collaboration)
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetItem, setShareTargetItem] = useState<SharePointItem | null>(null);
  const [shareSelectedRecipients, setShareSelectedRecipients] = useState<Set<string>>(new Set());
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [shareOrgFilter, setShareOrgFilter] = useState<'all' | 'nkangala' | 'mzansi' | 'managers' | 'auditors'>('all');
  const [sharePermission, setSharePermission] = useState<'view' | 'download' | 'edit'>('view');
  const [shareNote, setShareNote] = useState('');
  const [isSharingDocument, setIsSharingDocument] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);

  // Universal File Viewer State
  const [previewFile, setPreviewFile] = useState<{
    item: SharePointItem;
    payload?: { dataUrl?: string; textContent?: string };
    loading: boolean;
  } | null>(null);

  // Document Rendered Outputs
  const [renderedWordHtml, setRenderedWordHtml] = useState<string | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ExcelParsedWorkbook | null>(null);
  const [activeExcelSheet, setActiveExcelSheet] = useState<string>('');
  const [excelSearch, setExcelSearch] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Escape key closes viewer or active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShareModal) {
          setShowShareModal(false);
          setShareTargetItem(null);
          setShareSuccessToast(null);
        } else if (previewFile) {
          handleCloseViewer();
        } else if (showUploadNotifyModal) {
          setShowUploadNotifyModal(false);
          setPendingFilesToUpload([]);
        } else if (showNotificationsDrawer) {
          setShowNotificationsDrawer(false);
        } else if (showNewFolderModal) {
          setShowNewFolderModal(false);
        } else if (renameTarget) {
          setRenameTarget(null);
        } else if (deleteTarget) {
          setDeleteTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShareModal, previewFile, showUploadNotifyModal, showNotificationsDrawer, showNewFolderModal, renameTarget, deleteTarget]);

  // Fetch Directory Users from Azure AD & Municipal base
  const fetchDirectoryUsers = async () => {
    try {
      setLoadingDirectoryUsers(true);
      const res = await fetch('/api/sharepoint/directory-users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const seen = new Set<string>();
          const deduped: DirectoryUser[] = [];
          data.users.forEach((u: DirectoryUser) => {
            const emailKey = (u.email || '').toLowerCase().trim();
            if (emailKey && !seen.has(emailKey)) {
              seen.add(emailKey);
              deduped.push(u);
            } else if (!emailKey) {
              deduped.push(u);
            }
          });
          setDirectoryUsers(deduped);
        }
      }
    } catch (err) {
      console.error('Failed to load directory users:', err);
    } finally {
      setLoadingDirectoryUsers(false);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/sharepoint/notifications?userEmail=${encodeURIComponent(currentUser.email || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error('Failed to fetch SharePoint notifications:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch('/api/sharepoint/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email })
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  // Safe Navigation Handler that updates history
  const navigateToFolder = (targetId: string | null) => {
    if (targetId !== currentFolderId) {
      setNavigationHistory(prev => [...prev, currentFolderId]);
      setCurrentFolderId(targetId);
    }
  };

  // Back button handler
  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const prevFolder = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentFolderId(prevFolder);
    } else if (currentFolder?.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else if (currentFolderId !== null) {
      setCurrentFolderId(null);
    }
  };

  // Load items from Supabase backend API
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sharepoint/items');
      if (res.ok) {
        const data = await res.json();
        if (data && data.items) {
          setItems(data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load SharePoint items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchDirectoryUsers();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser.email]);

  // Compute unread notifications count
  const unreadNotifsCount = useMemo(() => {
    const myEmail = (currentUser.email || '').toLowerCase().trim();
    return notifications.filter(n => !(n.readBy || []).map(e => e.toLowerCase()).includes(myEmail)).length;
  }, [notifications, currentUser.email]);

  // Update current folder if initialFolderId prop changes
  useEffect(() => {
    if (initialFolderId !== undefined) {
      setCurrentFolderId(initialFolderId);
    }
  }, [initialFolderId]);

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return items.find(it => it.id === currentFolderId && it.type === 'folder') || null;
  }, [items, currentFolderId]);

  // Breadcrumb path from root to current folder
  const breadcrumbs = useMemo(() => {
    const trail: SharePointItem[] = [];
    let curr = currentFolder;
    while (curr) {
      trail.unshift(curr);
      if (curr.parentId) {
        curr = items.find(it => it.id === curr?.parentId && it.type === 'folder') || null;
      } else {
        break;
      }
    }
    return trail;
  }, [items, currentFolder]);

  // Recursive folder size & item count calculation
  const folderStatsMap = useMemo(() => {
    const stats = new Map<string, { totalBytes: number; fileCount: number; folderCount: number }>();
    
    // Initialize stats for each folder
    items.forEach(it => {
      if (it.type === 'folder') {
        stats.set(it.id, { totalBytes: 0, fileCount: 0, folderCount: 0 });
      }
    });

    // Helper to add recursively
    const addStats = (parentId: string | null, size: number, isFile: boolean) => {
      let pId = parentId;
      const visited = new Set<string>();
      while (pId && !visited.has(pId)) {
        visited.add(pId);
        const cur = stats.get(pId);
        if (cur) {
          cur.totalBytes += size;
          if (isFile) {
            cur.fileCount += 1;
          } else {
            cur.folderCount += 1;
          }
        }
        const parentFolder = items.find(it => it.id === pId);
        pId = parentFolder?.parentId || null;
      }
    };

    items.forEach(it => {
      if (it.type === 'file') {
        addStats(it.parentId, it.size || 0, true);
      } else if (it.type === 'folder' && it.parentId) {
        addStats(it.parentId, 0, false);
      }
    });

    return stats;
  }, [items]);

  // Filtered & Sorted items in current folder
  const displayedItems = useMemo(() => {
    let list = items.filter(it => {
      // Direct children of currentFolderId (null = root level)
      if (it.parentId !== currentFolderId) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = it.name.toLowerCase().includes(q);
        const matchesUploader = (it.createdBy || '').toLowerCase().includes(q) || (it.createdByEmail || '').toLowerCase().includes(q);
        const matchesOrg = (it.organization || '').toLowerCase().includes(q);
        const matchesExt = (it.extension || '').toLowerCase().includes(q);
        if (!matchesName && !matchesUploader && !matchesOrg && !matchesExt) return false;
      }

      // Format Filter
      if (formatFilter !== 'all') {
        if (formatFilter === 'folders') return it.type === 'folder';
        if (formatFilter === 'shared') {
          return it.type === 'file' && Array.isArray(it.sharedWith) && it.sharedWith.length > 0;
        }
        if (it.type === 'folder') return false; // if filtering by file formats, omit folders
        const ext = (it.extension || '').toLowerCase();
        if (formatFilter === 'pdf') return ext === 'pdf';
        if (formatFilter === 'excel') return ['xlsx', 'xls', 'csv', 'tsv'].includes(ext);
        if (formatFilter === 'word') return ['docx', 'doc', 'rtf', 'odt'].includes(ext);
        if (formatFilter === 'images') return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
        if (formatFilter === 'media') return ['mp3', 'wav', 'mp4', 'webm', 'mov', 'ogg'].includes(ext);
        if (formatFilter === 'code') return ['txt', 'json', 'sql', 'md', 'ts', 'js', 'html', 'css', 'yaml', 'xml'].includes(ext);
        if (formatFilter === 'archives') return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
      }

      return true;
    });

    // Always sort folders first in grid/list, then apply sort criteria
    return list.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'size') {
        const sizeA = a.type === 'folder' ? (folderStatsMap.get(a.id)?.totalBytes || 0) : (a.size || 0);
        const sizeB = b.type === 'folder' ? (folderStatsMap.get(b.id)?.totalBytes || 0) : (b.size || 0);
        comparison = sizeA - sizeB;
      } else if (sortBy === 'type') {
        const typeA = a.type === 'folder' ? 'folder' : (a.extension || 'file');
        const typeB = b.type === 'folder' ? 'folder' : (b.extension || 'file');
        comparison = typeA.localeCompare(typeB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, currentFolderId, searchQuery, formatFilter, sortBy, sortOrder, folderStatsMap]);

  // Format File Size
  const formatBytes = (bytes: number = 0, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format Date and Time
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        full: `${d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
      };
    } catch {
      return { date: '—', time: '—', full: '—' };
    }
  };

  // Detect format category & icon
  const getFileFormatBadge = (item: SharePointItem) => {
    if (item.type === 'folder') {
      return {
        label: 'Folder',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        icon: Folder
      };
    }

    const ext = (item.extension || '').toLowerCase();
    if (ext === 'pdf') {
      return { label: 'PDF Document', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: FileText };
    }
    if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
      return { label: 'Excel Spreadsheet', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: FileSpreadsheet };
    }
    if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) {
      return { label: 'Word Document', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: FileText };
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
      return { label: 'Image', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: ImageIcon };
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return { label: 'Audio', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30', icon: Music };
    }
    if (['mp4', 'webm', 'mov'].includes(ext)) {
      return { label: 'Video', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', icon: Video };
    }
    if (['txt', 'json', 'sql', 'md', 'ts', 'js', 'html', 'css', 'yaml', 'xml'].includes(ext)) {
      return { label: ext.toUpperCase() + ' Code/Text', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', icon: FileCode };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { label: 'Archive', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: Archive };
    }
    return { label: ext ? ext.toUpperCase() : 'Binary File', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: File };
  };

  // Total Storage Overview
  const totalStats = useMemo(() => {
    const nkangalaFolder = items.find(it => it.id === 'folder_nkangala_root');
    const mzansiFolder = items.find(it => it.id === 'folder_mzansiflow_root');

    const nkBytes = nkangalaFolder ? (folderStatsMap.get('folder_nkangala_root')?.totalBytes || 0) : 0;
    const nkFiles = nkangalaFolder ? (folderStatsMap.get('folder_nkangala_root')?.fileCount || 0) : 0;
    const mfBytes = mzansiFolder ? (folderStatsMap.get('folder_mzansiflow_root')?.totalBytes || 0) : 0;
    const mfFiles = mzansiFolder ? (folderStatsMap.get('folder_mzansiflow_root')?.fileCount || 0) : 0;

    return {
      totalBytes: nkBytes + mfBytes,
      totalFiles: nkFiles + mfFiles,
      nkangala: { bytes: nkBytes, files: nkFiles },
      mzansi: { bytes: mfBytes, files: mfFiles }
    };
  }, [items, folderStatsMap]);

  // Filtered Directory Users for Azure AD selection in upload modal
  const filteredDirectoryUsers = useMemo(() => {
    return directoryUsers.filter(u => {
      // Organization / role filter
      if (userOrgFilter === 'nkangala' && u.organization !== 'nkangaladm.gov.za') return false;
      if (userOrgFilter === 'mzansi' && u.organization !== 'mzansiflow.co.za') return false;
      if (userOrgFilter === 'managers' && !['manager', 'head', 'lead', 'director', 'cfo', 'supervisor', 'admin'].some(term => 
        (u.jobFunction || '').toLowerCase().includes(term) || (u.role || '').toLowerCase().includes(term) || (u.systemRole || '').toLowerCase().includes(term)
      )) return false;
      if (userOrgFilter === 'auditors' && !['audit', 'internal control', 'risk', 'compliance', 'analyst', 'pmu'].some(term => 
        (u.department || '').toLowerCase().includes(term) || (u.jobFunction || '').toLowerCase().includes(term)
      )) return false;

      // Search query
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const match = u.fullName.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      (u.department && u.department.toLowerCase().includes(q)) ||
                      (u.jobFunction && u.jobFunction.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [directoryUsers, userOrgFilter, userSearchQuery]);

  // Directory Selection Helpers
  const toggleUserSelection = (email: string) => {
    const norm = email.toLowerCase().trim();
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      if (next.has(norm)) {
        next.delete(norm);
      } else {
        next.add(norm);
      }
      return next;
    });
  };

  const selectAllFilteredUsers = () => {
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      filteredDirectoryUsers.forEach(u => next.add(u.email.toLowerCase().trim()));
      return next;
    });
  };

  const clearAllUserSelections = () => {
    setSelectedRecipients(new Set());
  };

  const selectByOrgPreset = (org: 'nkangala' | 'mzansi') => {
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      directoryUsers.forEach(u => {
        if ((org === 'nkangala' && u.organization === 'nkangaladm.gov.za') ||
            (org === 'mzansi' && u.organization === 'mzansiflow.co.za')) {
          next.add(u.email.toLowerCase().trim());
        }
      });
      return next;
    });
  };

  const selectTwentyUploadUsers = () => {
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      const pool = filteredDirectoryUsers.length >= 20 ? filteredDirectoryUsers : directoryUsers;
      const targets = pool.slice(0, 20);
      targets.forEach(u => next.add(u.email.toLowerCase().trim()));
      return next;
    });
  };

  const selectOneUploadUser = (email: string) => {
    setSelectedRecipients(new Set([email.toLowerCase().trim()]));
  };

  // Open Document Share Modal
  const handleOpenShareModal = (item: SharePointItem) => {
    setShareTargetItem(item);
    setShareSearchQuery('');
    setShareOrgFilter('all');
    setSharePermission(item.sharePermission || 'view');
    setShareNote('');
    setShareSuccessToast(null);

    const initialRecipients = new Set<string>();
    if (item.sharedWith && Array.isArray(item.sharedWith)) {
      item.sharedWith.forEach(e => initialRecipients.add(e.toLowerCase().trim()));
    }
    setShareSelectedRecipients(initialRecipients);

    if (directoryUsers.length === 0) {
      fetchDirectoryUsers();
    }
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareTargetItem(null);
    setShareSuccessToast(null);
    setShareSelectedRecipients(new Set());
  };

  // Filtered Directory Users for Share Modal
  const filteredShareUsers = useMemo(() => {
    return directoryUsers.filter(u => {
      if (shareOrgFilter === 'nkangala' && u.organization !== 'nkangaladm.gov.za') return false;
      if (shareOrgFilter === 'mzansi' && u.organization !== 'mzansiflow.co.za') return false;
      if (shareOrgFilter === 'managers' && !['manager', 'head', 'lead', 'director', 'cfo', 'supervisor', 'admin'].some(term => 
        (u.jobFunction || '').toLowerCase().includes(term) || (u.role || '').toLowerCase().includes(term) || (u.systemRole || '').toLowerCase().includes(term)
      )) return false;
      if (shareOrgFilter === 'auditors' && !['audit', 'internal control', 'risk', 'compliance', 'analyst', 'pmu'].some(term => 
        (u.department || '').toLowerCase().includes(term) || (u.jobFunction || '').toLowerCase().includes(term)
      )) return false;

      if (shareSearchQuery.trim()) {
        const q = shareSearchQuery.toLowerCase();
        const match = u.fullName.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      (u.department && u.department.toLowerCase().includes(q)) ||
                      (u.jobFunction && u.jobFunction.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [directoryUsers, shareOrgFilter, shareSearchQuery]);

  // Share selection toggle
  const toggleShareUser = (email: string) => {
    const norm = email.toLowerCase().trim();
    setShareSelectedRecipients(prev => {
      const next = new Set(prev);
      if (next.has(norm)) {
        next.delete(norm);
      } else {
        next.add(norm);
      }
      return next;
    });
  };

  // Quick 1 User preset: selects just this single user
  const handleSelect1User = (user: DirectoryUser) => {
    const norm = user.email.toLowerCase().trim();
    setShareSelectedRecipients(new Set([norm]));
  };

  // Quick 20 Users preset: selects up to 20 users from filtered list (or directory)
  const handleSelectTwentyUsers = () => {
    setShareSelectedRecipients(prev => {
      const next = new Set(prev);
      const pool = filteredShareUsers.length >= 20 ? filteredShareUsers : directoryUsers;
      const targets = pool.slice(0, 20);
      targets.forEach(u => next.add(u.email.toLowerCase().trim()));
      return next;
    });
  };

  // Select all Mzansi Flow users
  const handleSelectAllMzansiUsers = () => {
    setShareSelectedRecipients(prev => {
      const next = new Set(prev);
      directoryUsers.forEach(u => {
        if (u.organization === 'mzansiflow.co.za') {
          next.add(u.email.toLowerCase().trim());
        }
      });
      return next;
    });
  };

  // Select all Nkangala users
  const handleSelectAllNkangalaUsers = () => {
    setShareSelectedRecipients(prev => {
      const next = new Set(prev);
      directoryUsers.forEach(u => {
        if (u.organization === 'nkangaladm.gov.za') {
          next.add(u.email.toLowerCase().trim());
        }
      });
      return next;
    });
  };

  // Select all filtered users
  const handleSelectAllFilteredShare = () => {
    setShareSelectedRecipients(prev => {
      const next = new Set(prev);
      filteredShareUsers.forEach(u => next.add(u.email.toLowerCase().trim()));
      return next;
    });
  };

  // Clear selections
  const handleClearShareSelections = () => {
    setShareSelectedRecipients(new Set());
  };

  // Submit sharing
  const handleShareDocumentSubmit = async () => {
    if (!shareTargetItem) return;
    if (shareSelectedRecipients.size === 0) {
      alert("Please select at least 1 user to share this document with.");
      return;
    }

    try {
      setIsSharingDocument(true);
      const recipientList = Array.from(shareSelectedRecipients);
      const res = await fetch('/api/sharepoint/share-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: shareTargetItem.id,
          recipientEmails: recipientList,
          sharedBy: currentUser.fullName || currentUser.email.split('@')[0],
          sharedByEmail: currentUser.email,
          permission: sharePermission,
          note: shareNote
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to share document.');
      }

      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      } else if (data.item) {
        setItems(prev => prev.map(it => it.id === data.item.id ? data.item : it));
      }

      const count = recipientList.length;
      setShareSuccessToast(`Successfully shared "${shareTargetItem.name}" with ${count} user${count === 1 ? '' : 's'}!`);
      fetchNotifications();

      setTimeout(() => {
        setShowShareModal(false);
        setShareTargetItem(null);
        setShareSuccessToast(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error sharing document:', err);
      alert(err.message || 'Error sharing document.');
    } finally {
      setIsSharingDocument(false);
    }
  };

  // Handle Drag & Drop Uploads
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Open the Upload & Notification Modal when files are selected or dropped
  const handleInitiateUpload = (files: File[], targetFolderId?: string) => {
    if (!files || files.length === 0) return;

    const folderId = targetFolderId || currentFolderId || 'folder_nkangala_root';
    setPendingFilesToUpload(files);
    setTargetUploadFolderId(folderId);
    setCustomNotificationNote('');
    setNotifyEnabled(true);
    setUserSearchQuery('');
    setUserOrgFilter('all');

    // Pre-select recipients based on folder context
    const targetFolderObj = items.find(it => it.id === folderId);
    const isNkangalaTarget = targetFolderObj ? targetFolderObj.organization === 'nkangaladm.gov.za' : true;

    // Load directory users if not already present
    if (directoryUsers.length === 0) {
      fetchDirectoryUsers();
    }

    // Default pre-select: target org users (e.g. Nkangala or Mzansi)
    const initialSelection = new Set<string>();
    directoryUsers.forEach(u => {
      if (isNkangalaTarget && u.organization === 'nkangaladm.gov.za') {
        initialSelection.add(u.email.toLowerCase().trim());
      } else if (!isNkangalaTarget && u.organization === 'mzansiflow.co.za') {
        initialSelection.add(u.email.toLowerCase().trim());
      }
    });

    setSelectedRecipients(initialSelection);
    setShowUploadNotifyModal(true);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleInitiateUpload(Array.from(files), targetFolderId || currentFolderId || 'folder_nkangala_root');
    }
  };

  // Upload processor with Automatic Auto-Dismiss when completed and Azure AD notifications dispatch
  const processFilesUpload = async (
    fileList: File[], 
    targetFolderId: string, 
    notifiedEmails: string[] = [], 
    notifyNote: string = ''
  ) => {
    if (uploadDismissTimeoutRef.current) {
      clearTimeout(uploadDismissTimeoutRef.current);
    }

    setIsUploadingWithNotify(true);
    setShowUploadQueue(true);
    const newTasks: UploadTask[] = fileList.map(f => ({
      id: `${f.name}_${Date.now()}_${Math.random()}`,
      name: f.name,
      size: f.size,
      progress: 10,
      status: 'uploading'
    }));

    setUploadQueue(prev => [...newTasks, ...prev]);

    // Determine target organization from folder or user
    const targetFolder = items.find(it => it.id === targetFolderId);
    const org = targetFolder?.organization || (currentUser.email.includes('nkangala') ? 'nkangaladm.gov.za' : 'mzansiflow.co.za');

    let completedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const task = newTasks[i];

      try {
        const isText = file.type.startsWith('text/') || ['json', 'sql', 'md', 'csv', 'tsv', 'xml', 'yaml', 'yml'].some(ext => file.name.endsWith('.' + ext));
        
        let dataUrl = '';
        let textContent = '';

        if (isText && file.size < 5 * 1024 * 1024) {
          textContent = await file.text();
        }

        // Convert to dataUrl for preview support
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (pe) => {
            if (pe.lengthComputable) {
              const pct = Math.round((pe.loaded / pe.total) * 60);
              setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, progress: Math.max(20, pct) } : t));
            }
          };
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, progress: 85 } : t));

        // Submit to backend with notification payload
        const res = await fetch('/api/sharepoint/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            originalName: file.name,
            parentId: targetFolderId,
            size: file.size,
            fileType: file.type || file.name.split('.').pop() || 'dat',
            mimeType: file.type || 'application/octet-stream',
            dataUrl: dataUrl,
            textContent: textContent,
            uploadedBy: currentUser.fullName || currentUser.email,
            uploadedByEmail: currentUser.email,
            organization: org,
            description: `Uploaded to ${targetFolder?.name || 'SharePoint'} on ${new Date().toLocaleString()}`,
            notifyUserEmails: notifiedEmails,
            notifyNote: notifyNote
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }

        completedCount++;
        setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, progress: 100, status: 'completed' } : t));
      } catch (err: any) {
        console.error('File upload error:', err);
        setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', error: err.message } : t));
      }
    }

    setIsUploadingWithNotify(false);
    setShowUploadNotifyModal(false);
    setPendingFilesToUpload([]);
    fetchNotifications();

    // Auto-disappear upload progress popup automatically after completion (2.5 seconds)
    uploadDismissTimeoutRef.current = setTimeout(() => {
      setShowUploadQueue(false);
      setUploadQueue(prev => prev.filter(t => t.status === 'error'));
    }, 2500);
  };

  // Create Sub-Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const targetParent = currentFolderId || 'folder_nkangala_root';
      const targetFolderObj = items.find(it => it.id === targetParent);
      const org = targetFolderObj?.organization || (currentUser.email.includes('nkangala') ? 'nkangaladm.gov.za' : 'mzansiflow.co.za');

      const res = await fetch('/api/sharepoint/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: targetParent,
          createdBy: currentUser.fullName || currentUser.email,
          createdByEmail: currentUser.email,
          organization: org,
          color: newFolderColor,
          description: newFolderDescription.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
        setShowNewFolderModal(false);
        setNewFolderName('');
        setNewFolderDescription('');
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Rename File or Folder
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;

    try {
      const res = await fetch(`/api/sharepoint/item/${renameTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameNewName.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
        setRenameTarget(null);
        setRenameNewName('');
      }
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  // Delete File or Folder
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/sharepoint/item/${deleteTarget.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
        if (currentFolderId === deleteTarget.id) {
          setCurrentFolderId(deleteTarget.parentId || null);
        }
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Universal In-System Document Opener (Word, Excel, PDF, Images, Text)
  const handleOpenFile = async (item: SharePointItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
      return;
    }

    setPreviewFile({ item, loading: true });
    setRenderedWordHtml(null);
    setParsedExcel(null);
    setActiveExcelSheet('');
    setExcelSearch('');
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setZoomLevel(100);
    setRotation(0);

    try {
      const res = await fetch(`/api/sharepoint/file/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.file) {
          const payload = {
            dataUrl: data.file.dataUrl,
            textContent: data.file.textContent
          };

          setPreviewFile({ item, payload, loading: false });

          const ext = (item.extension || '').toLowerCase();

          // 1. Process Word Documents (.docx)
          if (ext === 'docx' && payload.dataUrl) {
            try {
              const base64 = payload.dataUrl.includes(',') ? payload.dataUrl.split(',')[1] : payload.dataUrl;
              const binaryStr = atob(base64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
              setRenderedWordHtml(result.value);
            } catch (wordErr) {
              console.warn('Word DOCX parsing warning:', wordErr);
            }
          }

          // 2. Process Excel Spreadsheets (.xlsx, .xls, .csv, .tsv)
          if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext) && (payload.dataUrl || payload.textContent)) {
            try {
              let workbook: XLSX.WorkBook;
              if (payload.dataUrl && ext !== 'csv' && ext !== 'tsv') {
                const base64 = payload.dataUrl.includes(',') ? payload.dataUrl.split(',')[1] : payload.dataUrl;
                workbook = XLSX.read(base64, { type: 'base64' });
              } else if (payload.textContent) {
                workbook = XLSX.read(payload.textContent, { type: 'string' });
              } else if (payload.dataUrl) {
                const base64 = payload.dataUrl.includes(',') ? payload.dataUrl.split(',')[1] : payload.dataUrl;
                workbook = XLSX.read(base64, { type: 'base64' });
              } else {
                throw new Error("No spreadsheet stream");
              }

              const sheetNames = workbook.SheetNames || ['Sheet1'];
              const sheetsData: Record<string, any[][]> = {};
              sheetNames.forEach(name => {
                const sheet = workbook.Sheets[name];
                sheetsData[name] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
              });

              setParsedExcel({ sheetNames, sheetsData });
              setActiveExcelSheet(sheetNames[0] || '');
            } catch (xlErr) {
              console.warn('Excel parse warning:', xlErr);
            }
          }

          // 3. Process PDF Documents
          if (ext === 'pdf' && payload.dataUrl) {
            try {
              const base64 = payload.dataUrl.includes(',') ? payload.dataUrl.split(',')[1] : payload.dataUrl;
              const binaryStr = atob(base64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              setPdfBlobUrl(blobUrl);
            } catch (pdfErr) {
              console.warn('PDF blob generation error:', pdfErr);
            }
          }

          return;
        }
      }
      setPreviewFile({ item, loading: false });
    } catch (err) {
      console.error('Failed to load file preview:', err);
      setPreviewFile({ item, loading: false });
    }
  };

  // Close viewer and clean up blob URLs
  const handleCloseViewer = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPreviewFile(null);
    setRenderedWordHtml(null);
    setParsedExcel(null);
  };

  // Download File Action
  const handleDownloadFile = async (item: SharePointItem) => {
    try {
      const res = await fetch(`/api/sharepoint/file/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.file && (data.file.dataUrl || data.file.textContent)) {
          const downloadLink = document.createElement('a');
          downloadLink.download = item.name;
          if (data.file.dataUrl) {
            downloadLink.href = data.file.dataUrl;
          } else {
            const blob = new Blob([data.file.textContent], { type: 'text/plain;charset=utf-8' });
            downloadLink.href = URL.createObjectURL(blob);
          }
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Filtered Excel Rows for current active sheet
  const activeExcelRows = useMemo(() => {
    if (!parsedExcel || !activeExcelSheet) return [];
    const rows = parsedExcel.sheetsData[activeExcelSheet] || [];
    if (!excelSearch.trim()) return rows;
    const q = excelSearch.toLowerCase();
    return rows.filter((row: any[]) =>
      row.some(cell => String(cell || '').toLowerCase().includes(q))
    );
  }, [parsedExcel, activeExcelSheet, excelSearch]);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e)}
    >
      {/* Drag & Drop Fullscreen Dropzone Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-emerald-950/85 backdrop-blur-md border-4 border-dashed border-emerald-400 flex flex-col items-center justify-center p-8 transition-all animate-in fade-in duration-150 pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-6 animate-bounce">
            <Upload className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">Drop Large Files to Upload</h3>
          <p className="text-emerald-200 text-base font-semibold max-w-md text-center">
            Files will be stored securely on Supabase and shared to{' '}
            <span className="text-white underline font-bold">
              {currentFolder ? currentFolder.name : 'Nkangala District Municipality'}
            </span>
          </p>
          <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-mono text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Drag & Drop Active • @nkangaladm.gov.za & @mzansiflow.co.za</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Share Point</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Cloud Persistence
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Cross-Organizational Large File Sharing & Actual In-System Document View
            </p>
          </div>
        </div>

        {/* Global Storage & Quick Controls */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Drawer Toggle */}
          <button
            onClick={() => setShowNotificationsDrawer(prev => !prev)}
            title="Share Point Document Upload Notifications"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              unreadNotifsCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-md shadow-amber-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Bell className={`w-4 h-4 ${unreadNotifsCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 font-mono">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Action Buttons */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>New Sub-Folder</span>
          </button>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleInitiateUpload(Array.from(e.target.files), currentFolderId || 'folder_nkangala_root');
                // Reset file input value so same files can be re-selected if needed
                e.target.value = '';
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>

          <button
            onClick={fetchItems}
            disabled={loading}
            title="Refresh Share Point Drive"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIMPLE SWITCH BETWEEN NKANGALA AND MZANSI FLOW REPOSITORIES */}
      {/* ========================================================= */}
      <div className="px-6 py-2.5 bg-slate-900/95 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Quick Switch:
          </span>

          {/* Nkangala Switch Button */}
          <button
            onClick={() => navigateToFolder('folder_nkangala_root')}
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentFolderId === 'folder_nkangala_root' || (currentFolder && currentFolder.organization === 'nkangaladm.gov.za')
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/40'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Nkangala District Municipality</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/30 text-emerald-200">
              {totalStats.nkangala.files} files ({formatBytes(totalStats.nkangala.bytes)})
            </span>
          </button>

          {/* Mzansi Flow Switch Button */}
          <button
            onClick={() => navigateToFolder('folder_mzansiflow_root')}
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentFolderId === 'folder_mzansiflow_root' || (currentFolder && currentFolder.organization === 'mzansiflow.co.za')
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50 border border-sky-400/40'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-300 shrink-0" />
            <span>Mzansi Flow</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/30 text-sky-200">
              {totalStats.mzansi.files} files ({formatBytes(totalStats.mzansi.bytes)})
            </span>
          </button>

          {/* Root All Folders View */}
          <button
            onClick={() => navigateToFolder(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentFolderId === null
                ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All Drives
          </button>
        </div>

        {/* Global summary badge */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          <span>Total Managed:</span>
          <strong className="text-emerald-400">{totalStats.totalFiles} documents</strong>
          <span>•</span>
          <strong className="text-slate-200">{formatBytes(totalStats.totalBytes)}</strong>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Navigation Breadcrumb Bar with PROMINENT BACK ARROW & Filters */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          
          {/* Breadcrumb Trail & Dedicated Back Arrow */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar text-xs font-semibold py-1">
            
            {/* Dedicated Prominent Back Arrow Button */}
            <button
              onClick={handleGoBack}
              disabled={currentFolderId === null && navigationHistory.length === 0}
              title="Go Back to Previous Folder"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                currentFolderId !== null || navigationHistory.length > 0
                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40 shadow-sm cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Root Drive */}
            <button
              onClick={() => navigateToFolder(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentFolderId === null
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Root</span>
            </button>

            {breadcrumbs.map((f, idx) => (
              <React.Fragment key={f.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <button
                  onClick={() => navigateToFolder(f.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors max-w-[220px] truncate cursor-pointer ${
                    idx === breadcrumbs.length - 1
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f.id === 'folder_nkangala_root' ? (
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : f.id === 'folder_mzansiflow_root' ? (
                    <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate">{f.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search, Filter, Sort, and View Controls */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files or folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Format Filter Dropdown */}
            <div className="relative">
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="shared">Shared Documents</option>
                <option value="folders">Folders Only</option>
                <option value="pdf">PDF Documents</option>
                <option value="excel">Excel & Spreadsheets</option>
                <option value="word">Word Documents (.docx)</option>
                <option value="images">Images</option>
                <option value="media">Audio & Video</option>
                <option value="code">Code & Text</option>
                <option value="archives">Archives (.zip)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [any, any];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Largest Size</option>
                <option value="size-asc">Smallest Size</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Root Level Banner (if at root level) */}
          {currentFolderId === null && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nkangala District Municipality Root Card */}
                <div
                  onClick={() => navigateToFolder('folder_nkangala_root')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'folder_nkangala_root')}
                  className="group relative bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/90 border-2 border-emerald-600/40 hover:border-emerald-500 p-6 rounded-2xl transition-all cursor-pointer shadow-xl hover:shadow-emerald-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Municipal Repository
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4 group-hover:text-emerald-300 transition-colors">
                    Nkangala District Municipality
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Official repository for municipal scorecards, SDBIP evidences, performance agreements, and cross-departmental documentation.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      {folderStatsMap.get('folder_nkangala_root')?.fileCount || 0} Files •{' '}
                      {formatBytes(folderStatsMap.get('folder_nkangala_root')?.totalBytes || 0)}
                    </span>
                    <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Folder <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Mzansi Flow Root Card */}
                <div
                  onClick={() => navigateToFolder('folder_mzansiflow_root')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'folder_mzansiflow_root')}
                  className="group relative bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-slate-900/90 border-2 border-sky-600/40 hover:border-sky-500 p-6 rounded-2xl transition-all cursor-pointer shadow-xl hover:shadow-sky-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Cloud className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      Enterprise Cloud
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4 group-hover:text-sky-300 transition-colors">
                    Mzansi Flow
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Central enterprise drive for system templates, legislative blueprints, release frameworks, and shared operational tools.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      {folderStatsMap.get('folder_mzansiflow_root')?.fileCount || 0} Files •{' '}
                      {formatBytes(folderStatsMap.get('folder_mzansiflow_root')?.totalBytes || 0)}
                    </span>
                    <span className="text-sky-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Folder <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Items Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>{currentFolder ? currentFolder.name : 'All Drive Folders & Files'}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono">
                {displayedItems.length} items
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Drag files anywhere to upload here
              </span>
            </div>
          </div>

          {/* Empty State */}
          {!loading && displayedItems.length === 0 && (
            <div className="py-20 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-900/20">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-4">
                <FolderPlus className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">This folder is empty</h4>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                Drag and drop Word, Excel, PDF documents, or large media files directly into this area, or create a new sub-folder.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Create Sub-Folder
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Upload Files Now
                </button>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayedItems.map((item) => {
                const badge = getFileFormatBadge(item);
                const BadgeIcon = badge.icon;
                const dt = formatDateTime(item.createdAt);
                const itemSize = item.type === 'folder' 
                  ? folderStatsMap.get(item.id)?.totalBytes || 0 
                  : item.size || 0;
                const fileCount = item.type === 'folder' ? folderStatsMap.get(item.id)?.fileCount || 0 : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenFile(item)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      if (item.type === 'folder') {
                        e.stopPropagation();
                        handleDrop(e, item.id);
                      }
                    }}
                    className={`group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg ${
                      item.type === 'folder' ? 'hover:border-amber-500/50' : 'hover:border-emerald-500/50'
                    }`}
                  >
                    {/* Top Row: Icon & Actions Menu */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          item.type === 'folder'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : badge.color
                        }`}
                      >
                        <BadgeIcon className="w-5 h-5" />
                      </div>

                      {/* Item Quick Action Icons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenShareModal(item);
                            }}
                            title="Share Document with Azure AD & Enterprise Users"
                            className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(item);
                            }}
                            title="View Actual Document"
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.type === 'file' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(item);
                            }}
                            title="Download File"
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget(item);
                            setRenameNewName(item.name);
                          }}
                          title="Rename"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {item.id !== 'folder_nkangala_root' && item.id !== 'folder_mzansiflow_root' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(item);
                            }}
                            title="Delete"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug break-words">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}

                      {/* File Shared Badge */}
                      {item.type === 'file' && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {item.sharedWith && item.sharedWith.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenShareModal(item);
                              }}
                              title={`Shared with ${item.sharedWith.length} user(s)`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all cursor-pointer"
                            >
                              <Users className="w-3 h-3 text-blue-400" />
                              <span>Shared ({item.sharedWith.length})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenShareModal(item);
                              }}
                              title="Share this document with 1 or 20 users"
                              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 font-medium transition-colors cursor-pointer"
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Share</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata Badges: Date/Time, Format, Size */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {item.type === 'folder'
                            ? `${fileCount} files • ${formatBytes(itemSize)}`
                            : formatBytes(itemSize)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {dt.date} {dt.time}
                        </span>
                        <span className="truncate max-w-[80px]" title={item.createdBy || 'System'}>
                          {item.createdBy?.split(' ')[0] || 'System'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List / Table View */}
          {viewMode === 'list' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Format / Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Date & Time Uploaded</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {displayedItems.map((item) => {
                    const badge = getFileFormatBadge(item);
                    const BadgeIcon = badge.icon;
                    const dt = formatDateTime(item.createdAt);
                    const itemSize = item.type === 'folder' 
                      ? folderStatsMap.get(item.id)?.totalBytes || 0 
                      : item.size || 0;
                    const fileCount = item.type === 'folder' ? folderStatsMap.get(item.id)?.fileCount || 0 : null;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenFile(item)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                item.type === 'folder'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : badge.color
                              }`}
                            >
                              <BadgeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate max-w-md">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-[10px] text-slate-500 truncate max-w-sm">
                                  {item.description}
                                </p>
                              )}
                              {item.type === 'file' && (
                                <div className="mt-1 flex items-center gap-2">
                                  {item.sharedWith && item.sharedWith.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenShareModal(item);
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                      title={`Shared with: ${item.sharedWith.join(', ')}`}
                                    >
                                      <Users className="w-3 h-3 text-blue-400" />
                                      <span>Shared with {item.sharedWith.length} user{item.sharedWith.length === 1 ? '' : 's'}</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenShareModal(item);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 font-medium transition-colors cursor-pointer"
                                    >
                                      <Share2 className="w-2.5 h-2.5" />
                                      <span>Share</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Format */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {item.type === 'folder' ? (
                            <span>{fileCount} files ({formatBytes(itemSize)})</span>
                          ) : (
                            <span>{formatBytes(itemSize)}</span>
                          )}
                        </td>

                        {/* Date and Time */}
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          <div>{dt.date}</div>
                          <div className="text-[10px] text-slate-500">{dt.time}</div>
                        </td>

                        {/* Uploaded By */}
                        <td className="py-3 px-4">
                          <div className="text-slate-300 font-medium truncate max-w-[140px]">
                            {item.createdBy || 'System'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                            {item.createdByEmail || item.organization || ''}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {item.type === 'file' && (
                              <button
                                type="button"
                                onClick={() => handleOpenShareModal(item)}
                                title="Share Document with Azure AD & Enterprise Users"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {item.type === 'file' && (
                              <button
                                onClick={() => handleOpenFile(item)}
                                title="View Actual Document in System"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {item.type === 'file' && (
                              <button
                                onClick={() => handleDownloadFile(item)}
                                title="Download"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setRenameTarget(item);
                                setRenameNewName(item.name);
                              }}
                              title="Rename"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {item.id !== 'folder_nkangala_root' && item.id !== 'folder_mzansiflow_root' && (
                              <button
                                onClick={() => setDeleteTarget(item)}
                                title="Delete"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* ================================================= */}
      {/* UPLOAD QUEUE WITH AUTOMATIC DISMISS               */}
      {/* ================================================= */}
      {uploadQueue.length > 0 && showUploadQueue && (
        <div className="absolute bottom-4 right-4 z-40 w-96 max-h-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Uploading ({uploadQueue.filter(t => t.status === 'completed').length}/{uploadQueue.length})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {uploadQueue.every(t => t.status === 'completed') && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Auto-closing...
                </span>
              )}
              <button
                onClick={() => setShowUploadQueue(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
            {uploadQueue.map(task => (
              <div key={task.id} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={task.name}>
                    {task.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatBytes(task.size)}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.status === 'error'
                        ? 'bg-rose-500'
                        : task.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] mt-1 text-slate-400">
                  <span>{task.status === 'completed' ? 'Uploaded to Supabase' : task.status === 'error' ? 'Failed' : `${task.progress}%`}</span>
                  {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {task.status === 'error' && <span className="text-rose-400">{task.error || 'Error'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL: NEW SUB-FOLDER CREATION                     */}
      {/* ================================================= */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Sub-Folder</h3>
                  <p className="text-xs text-slate-400">
                    Inside: <span className="text-emerald-400 font-bold">{currentFolder ? currentFolder.name : 'Nkangala District Municipality'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDBIP Portfolios Q3, Audited Financials, Policy Drafts..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short note about what documents are placed here..."
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL: RENAME ITEM                                */}
      {/* ================================================= */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Rename {renameTarget.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <button
                onClick={() => setRenameTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  New Name
                </label>
                <input
                  type="text"
                  required
                  value={renameNewName}
                  onChange={(e) => setRenameNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL: DELETE CONFIRMATION                         */}
      {/* ================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete {deleteTarget.type === 'folder' ? 'Folder & Contents' : 'File'}?
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-rose-400">"{deleteTarget.name}"</span>?
                  {deleteTarget.type === 'folder' && ' All files and sub-folders inside will also be deleted from Supabase.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD FILES & AZURE AD DIRECTORY USER NOTIFICATION PICKER         */}
      {/* ========================================================================= */}
      {showUploadNotifyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 my-auto overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Upload to SharePoint & Notify Users
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select target directory users from Azure AD to receive immediate alerts
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUploadNotifyModal(false);
                  setPendingFilesToUpload([]);
                }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cancel Upload (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Destination Folder & Staged Files Overview */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-emerald-400" />
                    Target Destination:
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    {items.find(it => it.id === targetUploadFolderId)?.name || 'SharePoint Root'}
                  </span>
                </div>

                {/* Staged Files List */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {pendingFilesToUpload.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate">{f.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {formatBytes(f.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Toggle Banner */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Notify Azure AD Directory Users</h4>
                      <p className="text-[11px] text-slate-400">
                        Send notifications to users across Nkangala District Municipality & Mzansi Flow
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifyEnabled(!notifyEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifyEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifyEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {notifyEnabled && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    
                    {/* Quick Filters */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400" />
                          Directory Filter:
                        </span>

                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          <button
                            type="button"
                            onClick={selectTwentyUploadUsers}
                            className="px-2 py-0.5 rounded bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer border border-blue-700/50"
                            title="Select up to 20 users"
                          >
                            20 Users
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (filteredDirectoryUsers.length > 0) {
                                selectOneUploadUser(filteredDirectoryUsers[0].email);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-700/50"
                            title="Select 1 user"
                          >
                            1 User
                          </button>
                          <button
                            type="button"
                            onClick={selectAllFilteredUsers}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={clearAllUserSelections}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setUserOrgFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            userOrgFilter === 'all'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          All ({directoryUsers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserOrgFilter('nkangala');
                            selectByOrgPreset('nkangala');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            userOrgFilter === 'nkangala'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building2 className="w-3 h-3 text-blue-400" />
                          Nkangala DM ({directoryUsers.filter(u => u.organization === 'nkangaladm.gov.za').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserOrgFilter('mzansi');
                            selectByOrgPreset('mzansi');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            userOrgFilter === 'mzansi'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Cloud className="w-3 h-3 text-teal-400" />
                          Mzansi Flow ({directoryUsers.filter(u => u.organization === 'mzansiflow.co.za').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserOrgFilter('managers')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            userOrgFilter === 'managers'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Managers & Reviewers
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserOrgFilter('auditors')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            userOrgFilter === 'auditors'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Auditors & PMU
                        </button>
                      </div>
                    </div>

                    {/* Directory User Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search Azure AD directory by name, email, department, job title..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Selected Count Indicator */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-400">
                        Showing <strong className="text-slate-200">{filteredDirectoryUsers.length}</strong> users
                      </span>
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px]">
                        {selectedRecipients.size} user{selectedRecipients.size === 1 ? '' : 's'} selected for notification
                      </span>
                    </div>

                    {/* User Selection Checkbox List */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                      {loadingDirectoryUsers ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Loading Azure AD Directory...</span>
                        </div>
                      ) : filteredDirectoryUsers.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No users matched your directory filter or search criteria.
                        </div>
                      ) : (
                        filteredDirectoryUsers.map((u, idx) => {
                          const isSelected = selectedRecipients.has(u.email.toLowerCase().trim());
                          const isNkangala = u.organization === 'nkangaladm.gov.za';
                          
                          return (
                            <div
                              key={u.id ? `dir-user-${u.id}-${idx}` : `dir-user-${u.email || 'user'}-${idx}`}
                              onClick={() => toggleUserSelection(u.email)}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm'
                                  : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-600 border-emerald-500 text-white'
                                      : 'border-slate-700 bg-slate-950 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>

                                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                                  {u.fullName.charAt(0) || 'U'}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-bold text-xs truncate">{u.fullName}</span>
                                    <span
                                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${
                                        isNkangala
                                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                          : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                                      }`}
                                    >
                                      {isNkangala ? 'Nkangala DM' : 'Mzansi Flow'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                                    <span>{u.email}</span>
                                    {u.jobFunction && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-300">{u.jobFunction}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {u.department || 'General'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Optional Notification Message Note */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Optional Upload Message / Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Please review the updated municipal SDBIP quarterly portfolio attachment..."
                        value={customNotificationNote}
                        onChange={(e) => setCustomNotificationNote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadNotifyModal(false);
                  setPendingFilesToUpload([]);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {notifyEnabled && (
                  <button
                    type="button"
                    disabled={isUploadingWithNotify}
                    onClick={() => {
                      processFilesUpload(
                        pendingFilesToUpload,
                        targetUploadFolderId,
                        [],
                        ''
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Upload Without Notifying
                  </button>
                )}

                <button
                  type="button"
                  disabled={isUploadingWithNotify}
                  onClick={() => {
                    const recipientList = notifyEnabled ? Array.from(selectedRecipients) : [];
                    processFilesUpload(
                      pendingFilesToUpload,
                      targetUploadFolderId,
                      recipientList,
                      customNotificationNote
                    );
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingWithNotify ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {notifyEnabled && selectedRecipients.size > 0
                          ? `Upload & Notify (${selectedRecipients.size} Users)`
                          : 'Upload to SharePoint'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: SHAREPOINT DOCUMENT UPLOAD NOTIFICATIONS               */}
      {/* ========================================================================= */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SharePoint Notifications</h3>
                  <p className="text-[11px] text-slate-400">
                    Uploaded documents & cross-organizational activity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    title="Mark all notifications as read"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsDrawer(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Drawer (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-300 mb-1">No Notifications Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    When teammates from Nkangala DM or Mzansi Flow upload documents and select you for notifications, they will appear here.
                  </p>
                </div>
              ) : (
                notifications.map(notif => {
                  const myEmail = (currentUser.email || '').toLowerCase().trim();
                  const isUnread = !(notif.readBy || []).map(e => e.toLowerCase()).includes(myEmail);
                  const isNkangala = notif.organization === 'nkangaladm.gov.za';
                  const matchingItem = items.find(it => it.id === notif.fileId);

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnread
                          ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isUnread ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                            }`}
                          />
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isNkangala
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                            }`}
                          >
                            {isNkangala ? 'Nkangala DM' : 'Mzansi Flow'}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(notif.createdAt).date} {formatDateTime(notif.createdAt).time}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-1">{notif.title}</h4>
                      
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate">{notif.fileName}</span>
                        <span>•</span>
                        <span className="font-mono">{formatBytes(notif.size)}</span>
                      </div>

                      {notif.note && (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 italic mb-3">
                          "{notif.note}"
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400">
                          By: <strong className="text-slate-200">{notif.uploadedBy}</strong>
                        </span>

                        {matchingItem && (
                          <button
                            onClick={() => {
                              setShowNotificationsDrawer(false);
                              handleOpenFile(matchingItem);
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Document</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHAREPOINT DOCUMENT SHARING MODAL (AZURE AD & ENTERPRISE CROSS-TENANT)     */}
      {/* ========================================================================= */}
      {showShareModal && shareTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-950/50 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
                    <span>Share Document</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Azure AD & Mzansi Flow
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Collaborate with 1 user, 20 users, or cross-tenant teams
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseShareModal}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Toast */}
            {shareSuccessToast && (
              <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-3 flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{shareSuccessToast}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Target Document Card */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${getFileFormatBadge(shareTargetItem).color}`}>
                    {React.createElement(getFileFormatBadge(shareTargetItem).icon, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{shareTargetItem.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatBytes(shareTargetItem.size || 0)}</span>
                      <span>•</span>
                      <span>Format: {shareTargetItem.extension?.toUpperCase() || 'FILE'}</span>
                      <span>•</span>
                      <span>Owner: {shareTargetItem.createdBy || 'System'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">Sharing As</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {currentUser.email?.includes('nkangala') ? '🏛️ @nkangaladm.gov.za' : '⚡ @mzansiflow.co.za'}
                  </span>
                </div>
              </div>

              {/* Vice-Versa Cross-Tenant Banner */}
              <div className="p-3 rounded-xl border transition-all bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">
                        Cross-Tenant Active Directory Directory
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {currentUser.email?.includes('nkangala')
                          ? 'As an @nkangaladm.gov.za user, you can view and share with all @mzansiflow.co.za users.'
                          : 'As an @mzansiflow.co.za user, you can search and share with all 740+ @nkangaladm.gov.za Azure Active Directory users.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter(shareOrgFilter === 'mzansi' ? 'all' : 'mzansi')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        shareOrgFilter === 'mzansi'
                          ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700'
                      }`}
                    >
                      <Cloud className="w-3.5 h-3.5 text-teal-400" />
                      <span>@mzansiflow.co.za ({directoryUsers.filter(u => u.organization === 'mzansiflow.co.za').length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter(shareOrgFilter === 'nkangala' ? 'all' : 'nkangala')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        shareOrgFilter === 'nkangala'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>@nkangaladm.gov.za ({directoryUsers.filter(u => u.organization === 'nkangaladm.gov.za').length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Directory Filter Tabs */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        shareOrgFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Users ({directoryUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter('nkangala')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        shareOrgFilter === 'nkangala'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3 h-3 text-blue-400" />
                      <span>Nkangala Azure AD ({directoryUsers.filter(u => u.organization === 'nkangaladm.gov.za').length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter('mzansi')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        shareOrgFilter === 'mzansi'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Cloud className="w-3 h-3 text-teal-400" />
                      <span>Mzansi Flow Team ({directoryUsers.filter(u => u.organization === 'mzansiflow.co.za').length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter('managers')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        shareOrgFilter === 'managers'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Managers & Directors
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrgFilter('auditors')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        shareOrgFilter === 'auditors'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Auditors & PMU
                    </button>
                  </div>
                </div>

                {/* Azure Active Directory Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Azure Active Directory by user name, @mzansiflow.co.za, @nkangaladm.gov.za, department..."
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                  {shareSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setShareSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Selection Buttons (1 user, 20 users, all) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      Showing <strong className="text-slate-200">{filteredShareUsers.length}</strong> users
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      shareSelectedRecipients.size > 0
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {shareSelectedRecipients.size === 0
                        ? '0 users selected'
                        : `${shareSelectedRecipients.size} user${shareSelectedRecipients.size === 1 ? '' : 's'} selected`}
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectTwentyUsers}
                      className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/50 font-semibold transition-all cursor-pointer shadow-sm"
                      title="Quickly select up to 20 users"
                    >
                      🎯 Select 20 Users
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (filteredShareUsers.length > 0) {
                          handleSelect1User(filteredShareUsers[0]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-700/50 font-semibold transition-all cursor-pointer shadow-sm"
                      title="Quickly select 1 user"
                    >
                      ⚡ Select 1 User
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllMzansiUsers}
                      className="px-2.5 py-1 rounded-lg bg-teal-900/40 hover:bg-teal-800 text-teal-300 hover:text-white border border-teal-700/50 font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      ☁️ All Mzansi Flow
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllNkangalaUsers}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      🏛️ All Nkangala DM
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredShare}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer border border-slate-700"
                    >
                      Select All Filtered
                    </button>
                    {shareSelectedRecipients.size > 0 && (
                      <button
                        type="button"
                        onClick={handleClearShareSelections}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold transition-all cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Users Chips Carousel */}
                {shareSelectedRecipients.size > 0 && (
                  <div className="p-2.5 bg-slate-950/90 border border-blue-900/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        Selected Recipients ({shareSelectedRecipients.size}):
                      </span>
                      <button
                        type="button"
                        onClick={handleClearShareSelections}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        Deselect all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {Array.from(shareSelectedRecipients).map((email, idx) => {
                        const userObj = directoryUsers.find(u => u.email.toLowerCase().trim() === email);
                        const displayName = userObj?.fullName || email.split('@')[0];
                        const isNkangala = email.includes('nkangala') || email.endsWith('.gov.za');

                        return (
                          <span
                            key={`share-chip-${email}-${idx}`}
                            className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                              isNkangala
                                ? 'bg-blue-950/60 text-blue-200 border-blue-700/40'
                                : 'bg-teal-950/60 text-teal-200 border-teal-700/40'
                            }`}
                          >
                            <span>{displayName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              ({isNkangala ? '🏛️ Nkangala' : '⚡ Mzansi'})
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShareUser(email)}
                              className="w-3.5 h-3.5 rounded hover:bg-black/30 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Directory Users Selection List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950/60">
                  {loadingDirectoryUsers ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Loading Azure Active Directory...</span>
                    </div>
                  ) : filteredShareUsers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No directory users matched your search or filter.
                    </div>
                  ) : (
                    filteredShareUsers.map((u, idx) => {
                      const isSelected = shareSelectedRecipients.has(u.email.toLowerCase().trim());
                      const isNkangala = u.organization === 'nkangaladm.gov.za';

                      return (
                        <div
                          key={u.id ? `share-user-${u.id}-${idx}` : `share-user-${u.email || 'user'}-${idx}`}
                          onClick={() => toggleShareUser(u.email)}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-sm'
                              : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Checkbox */}
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'border-slate-700 bg-slate-950 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>

                            {/* User Avatar */}
                            <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isNkangala
                                ? 'bg-blue-950 text-blue-300 border-blue-700/50'
                                : 'bg-teal-950 text-teal-300 border-teal-700/50'
                            }`}>
                              {u.fullName.charAt(0) || 'U'}
                            </div>

                            {/* User Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-xs text-slate-100 truncate">{u.fullName}</span>
                                <span
                                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${
                                    isNkangala
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                      : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                                  }`}
                                >
                                  {isNkangala ? '🏛️ Nkangala Azure AD' : '⚡ Mzansi Flow Team'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                                <span className="font-mono text-slate-300">{u.email}</span>
                                {u.jobFunction && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-300 truncate">{u.jobFunction}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Department & Quick 1-User Pick */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block max-w-[130px] truncate">
                              {u.department || 'General'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect1User(u);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Select only this 1 user"
                            >
                              Solo 1-User
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Permissions & Communique Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  
                  {/* Permission selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Access Permission
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSharePermission('view')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          sharePermission === 'view'
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-blue-300" />
                        <span>Can View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharePermission('download')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          sharePermission === 'download'
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-300" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharePermission('edit')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          sharePermission === 'edit'
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5 mx-auto mb-1 text-purple-300" />
                        <span>Can Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Share Note / Communique Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Optional Share Note / Communique
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please review the municipal SDBIP quarterly portfolio attachment..."
                      value={shareNote}
                      onChange={(e) => setShareNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSharingDocument || shareSelectedRecipients.size === 0}
                onClick={handleShareDocumentSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharingDocument ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sharing Document...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>
                      {shareSelectedRecipients.size === 0
                        ? 'Select Recipients to Share'
                        : shareSelectedRecipients.size === 1
                        ? 'Share Document with 1 User'
                        : shareSelectedRecipients.size === 20
                        ? 'Share Document with 20 Users'
                        : `Share Document (${shareSelectedRecipients.size} Users)`}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTUAL IN-SYSTEM DOCUMENT VIEWER (WORD DOCX, EXCEL SPREADSHEET, PDF)      */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          {/* Viewer Top Toolbar with Back Arrow & Prominent Close Button */}
          <div className="px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              
              {/* Back to Drive button */}
              <button
                onClick={handleCloseViewer}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 shrink-0 cursor-pointer"
                title="Return to SharePoint Drive (Esc)"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Drive</span>
              </button>

              <div className="h-6 w-px bg-slate-800" />

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  getFileFormatBadge(previewFile.item).color
                }`}
              >
                {React.createElement(getFileFormatBadge(previewFile.item).icon, { className: 'w-4 h-4' })}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {previewFile.item.name}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                  <span>Format: <strong className="text-slate-200">{previewFile.item.extension?.toUpperCase() || 'FILE'}</strong></span>
                  <span>•</span>
                  <span>Size: <strong className="text-slate-200">{formatBytes(previewFile.item.size)}</strong></span>
                  <span>•</span>
                  <span>Uploaded: <strong className="text-slate-200">{formatDateTime(previewFile.item.createdAt).full}</strong></span>
                  <span>•</span>
                  <span>By: <strong className="text-slate-200">{previewFile.item.createdBy}</strong></span>
                </div>
              </div>
            </div>

            {/* Viewer Action Controls */}
            <div className="flex items-center gap-2">
              
              {/* Zoom Controls for Word or Images */}
              {['docx', 'doc', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 15, 40))}
                    className="p-1 hover:text-emerald-400"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] text-slate-300">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 15, 250))}
                    className="p-1 hover:text-emerald-400"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {['png', 'jpg', 'jpeg'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1 hover:text-emerald-400 ml-1 border-l border-slate-700"
                      title="Rotate"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Share Document in Viewer */}
              <button
                type="button"
                onClick={() => handleOpenShareModal(previewFile.item)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Share this document with 1 or 20 users"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Document</span>
              </button>

              <button
                onClick={() => handleDownloadFile(previewFile.item)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>

              {/* HIGH VISIBILITY CLOSE BUTTON */}
              <button
                onClick={handleCloseViewer}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 border border-rose-500/50 cursor-pointer"
                title="Close Document Viewer (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Close Viewer</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 rounded text-[10px] bg-rose-800/80 font-mono">Esc</kbd>
              </button>
            </div>
          </div>

          {/* Viewer Main Canvas / Document Body */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/95 relative">
            {previewFile.loading ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs font-mono">Loading document payload from Supabase...</p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                
                {/* ============================================== */}
                {/* 1. ACTUAL WORD DOCUMENT VIEWER (.docx, .doc)   */}
                {/* ============================================== */}
                {['docx', 'doc', 'rtf', 'odt'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="w-full h-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-white text-sm">Microsoft Word In-System Reader</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          DOCX Formatted Canvas
                        </span>
                        <button
                          onClick={handleCloseViewer}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                          title="Close Document Viewer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-900/60 flex justify-center">
                      {renderedWordHtml ? (
                        <div
                          style={{
                            zoom: `${zoomLevel}%`
                          }}
                          className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl font-serif text-sm sm:text-base leading-relaxed selection:bg-blue-200 selection:text-blue-900 border border-slate-300 min-h-[700px]"
                          dangerouslySetInnerHTML={{ __html: renderedWordHtml }}
                        />
                      ) : previewFile.payload?.textContent ? (
                        <div
                          style={{ zoom: `${zoomLevel}%` }}
                          className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl font-sans text-sm leading-relaxed border border-slate-300 whitespace-pre-wrap"
                        >
                          {previewFile.payload.textContent}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                          <FileText className="w-16 h-16 text-blue-400 mb-4" />
                          <h4 className="text-lg font-bold text-white mb-2">{previewFile.item.name}</h4>
                          <p className="text-xs text-slate-400 max-w-md mb-6">
                            This Word Document is stored on Supabase. You can download and open it directly in Microsoft Word or Office 365.
                          </p>
                          <button
                            onClick={() => handleDownloadFile(previewFile.item)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            Download Word Document (.docx)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 2. ACTUAL EXCEL SPREADSHEET VIEWER (.xlsx, .xls, .csv)   */}
                {/* ======================================================== */}
                {['xlsx', 'xls', 'csv', 'tsv'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="w-full h-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    
                    {/* Excel Header Toolbar */}
                    <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-white text-sm">Microsoft Excel In-System Spreadsheet Inspector</span>
                      </div>

                      {/* Search within spreadsheet & Close */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter rows in sheet..."
                            value={excelSearch}
                            onChange={(e) => setExcelSearch(e.target.value)}
                            className="w-48 bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20">
                          {activeExcelRows.length} rows
                        </span>
                        <button
                          onClick={handleCloseViewer}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                          title="Close Spreadsheet Inspector"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    {/* Sheet Tabs Bar (if workbook has multiple sheets) */}
                    {parsedExcel && parsedExcel.sheetNames.length > 1 && (
                      <div className="px-6 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1 overflow-x-auto hide-scrollbar">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mr-2 flex items-center gap-1">
                          <Table className="w-3 h-3" /> Sheets:
                        </span>
                        {parsedExcel.sheetNames.map(sheetName => (
                          <button
                            key={sheetName}
                            onClick={() => setActiveExcelSheet(sheetName)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeExcelSheet === sheetName
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {sheetName}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Interactive Spreadsheet Table Grid */}
                    <div className="flex-1 overflow-auto bg-slate-950 p-4">
                      {parsedExcel && activeExcelRows.length > 0 ? (
                        <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <tbody>
                              {activeExcelRows.map((row: any[], rowIdx: number) => (
                                <tr
                                  key={rowIdx}
                                  className={`border-b border-slate-800/80 transition-colors ${
                                    rowIdx === 0
                                      ? 'bg-slate-900 font-bold text-emerald-300 sticky top-0 shadow-sm'
                                      : 'hover:bg-slate-900/50 text-slate-200'
                                  }`}
                                >
                                  {/* Row index indicator */}
                                  <td className="py-2 px-3 bg-slate-950 text-slate-600 font-mono text-[10px] border-r border-slate-800 select-none w-10 text-center">
                                    {rowIdx + 1}
                                  </td>
                                  {row.map((cell: any, cellIdx: number) => (
                                    <td
                                      key={cellIdx}
                                      className="py-2 px-3 border-r border-slate-800/60 max-w-xs truncate"
                                      title={String(cell || '')}
                                    >
                                      {cell !== null && cell !== undefined ? String(cell) : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : previewFile.payload?.textContent ? (
                        <pre className="whitespace-pre overflow-x-auto text-xs font-mono text-slate-300 p-4 bg-slate-900 rounded-xl border border-slate-800">
                          {previewFile.payload.textContent}
                        </pre>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <FileSpreadsheet className="w-12 h-12 text-emerald-400 mb-3" />
                          <h4 className="text-base font-bold text-white mb-1">{previewFile.item.name}</h4>
                          <p className="text-xs text-slate-400 mb-4 max-w-sm">
                            Spreadsheet binary data is preserved on Supabase. Download to open in Microsoft Excel or Google Sheets.
                          </p>
                          <button
                            onClick={() => handleDownloadFile(previewFile.item)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                          >
                            Download Spreadsheet (.xlsx)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================== */}
                {/* 3. ACTUAL PDF DOCUMENT VIEWER                  */}
                {/* ============================================== */}
                {previewFile.item.extension?.toLowerCase() === 'pdf' && (
                  <div className="w-full h-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
                    <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-white text-xs">PDF Document Viewer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          Interactive PDF Canvas
                        </span>
                        <button
                          onClick={handleCloseViewer}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                          title="Close PDF Viewer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 w-full h-full bg-slate-950">
                      {pdfBlobUrl || previewFile.payload?.dataUrl ? (
                        <iframe
                          src={pdfBlobUrl || previewFile.payload?.dataUrl}
                          title={previewFile.item.name}
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <FileText className="w-16 h-16 text-rose-400 mb-4" />
                          <h4 className="text-lg font-bold text-white mb-2">{previewFile.item.name}</h4>
                          <p className="text-xs text-slate-400 max-w-md mb-6">
                            This PDF is stored on Supabase. Click below to download or view natively.
                          </p>
                          <button
                            onClick={() => handleDownloadFile(previewFile.item)}
                            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            Download & Open PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================== */}
                {/* 4. IMAGE VIEWER                                */}
                {/* ============================================== */}
                {['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4 relative">
                    {previewFile.payload?.dataUrl ? (
                      <div className="relative">
                        <img
                          src={previewFile.payload.dataUrl}
                          alt={previewFile.item.name}
                          style={{
                            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease-out'
                          }}
                          className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                        <p className="text-xs">No image preview stream available.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================== */}
                {/* 5. CODE & TEXT VIEWER                          */}
                {/* ============================================== */}
                {['txt', 'json', 'sql', 'md', 'ts', 'js', 'html', 'css', 'yaml', 'xml'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="w-full h-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-sky-400" />
                        <span className="font-bold text-white text-sm">{previewFile.item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (previewFile.payload?.textContent) {
                              navigator.clipboard.writeText(previewFile.payload.textContent);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Content</span>
                        </button>
                        <button
                          onClick={handleCloseViewer}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                          title="Close Code Viewer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200">
                      <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                        {previewFile.payload?.textContent || 'Empty file content.'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* ============================================== */}
                {/* 6. MEDIA VIEWER (AUDIO / VIDEO)                */}
                {/* ============================================== */}
                {['mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl relative">
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={handleCloseViewer}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                        title="Close Media Player"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    </div>

                    {['mp4', 'webm', 'mov'].includes(previewFile.item.extension?.toLowerCase() || '') ? (
                      <video
                        controls
                        src={previewFile.payload?.dataUrl}
                        className="w-full max-h-[60vh] rounded-xl border border-slate-800 bg-black mt-4"
                      />
                    ) : (
                      <div className="py-8">
                        <Music className="w-16 h-16 text-pink-400 mx-auto mb-4 animate-bounce" />
                        <h4 className="text-lg font-bold text-white mb-4">{previewFile.item.name}</h4>
                        <audio controls src={previewFile.payload?.dataUrl} className="w-full" />
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================== */}
                {/* 7. GENERIC / BINARY FALLBACK                   */}
                {/* ============================================== */}
                {!['docx', 'doc', 'rtf', 'odt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'xlsx', 'xls', 'csv', 'tsv', 'txt', 'json', 'sql', 'md', 'ts', 'js', 'html', 'css', 'yaml', 'xml', 'mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov'].includes(previewFile.item.extension?.toLowerCase() || '') && (
                  <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative">
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={handleCloseViewer}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Close Viewer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 text-emerald-400 mx-auto flex items-center justify-center mb-4">
                      <File className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{previewFile.item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mb-4">
                      {formatBytes(previewFile.item.size)} • {previewFile.item.fileType || 'Binary Document'}
                    </p>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      This file format is securely persisted in the Supabase repository. You can download it directly to view in your desktop application.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleDownloadFile(previewFile.item)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download File</span>
                      </button>
                      <button
                        onClick={handleCloseViewer}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
