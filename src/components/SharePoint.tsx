import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder, FolderPlus, Upload, FileText, Image as ImageIcon, FileSpreadsheet,
  FileCode, Music, Video, Archive, File, Download, Trash2, Edit3, Eye,
  Search, ArrowLeft, ChevronRight, HardDrive, RefreshCw, X, CheckCircle2,
  AlertTriangle, Filter, Grid, List as ListIcon, ShieldCheck, Building2,
  Cloud, Sparkles, FolderTree, Clock, User as UserIcon, Tag, Copy, Maximize2,
  ExternalLink, ZoomIn, ZoomOut, RotateCw, ChevronLeft, Table, Layers, FileCheck, Check
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

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('emerald');

  const [renameTarget, setRenameTarget] = useState<SharePointItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SharePointItem | null>(null);

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
  }, []);

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

  const handleDrop = async (e: React.DragEvent, targetFolderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFilesUpload(Array.from(files), targetFolderId || currentFolderId || 'folder_nkangala_root');
    }
  };

  // Upload processor with Automatic Auto-Dismiss when completed
  const processFilesUpload = async (fileList: File[], targetFolderId: string) => {
    if (uploadDismissTimeoutRef.current) {
      clearTimeout(uploadDismissTimeoutRef.current);
    }

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

        // Submit to backend
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
            description: `Uploaded to ${targetFolder?.name || 'SharePoint'} on ${new Date().toLocaleString()}`
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
        <div className="flex items-center gap-3">
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
                processFilesUpload(Array.from(e.target.files), currentFolderId || 'folder_nkangala_root');
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
      {/* ACTUAL IN-SYSTEM DOCUMENT VIEWER (WORD DOCX, EXCEL SPREADSHEET, PDF)      */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          {/* Viewer Top Toolbar with Back Arrow */}
          <div className="px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              
              {/* Back to Drive button */}
              <button
                onClick={handleCloseViewer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 shrink-0 cursor-pointer"
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

              <button
                onClick={() => handleDownloadFile(previewFile.item)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>

              <button
                onClick={handleCloseViewer}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-4 h-4" />
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
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        DOCX Formatted Canvas
                      </span>
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

                      {/* Search within spreadsheet */}
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        Interactive PDF Canvas
                      </span>
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
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    {previewFile.payload?.dataUrl ? (
                      <img
                        src={previewFile.payload.dataUrl}
                        alt={previewFile.item.name}
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                          transition: 'transform 0.2s ease-out'
                        }}
                        className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800"
                      />
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
                  <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
                    {['mp4', 'webm', 'mov'].includes(previewFile.item.extension?.toLowerCase() || '') ? (
                      <video
                        controls
                        src={previewFile.payload?.dataUrl}
                        className="w-full max-h-[60vh] rounded-xl border border-slate-800 bg-black"
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
                  <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
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
                    <button
                      onClick={() => handleDownloadFile(previewFile.item)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </button>
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
