import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Folder, 
  ChevronRight, 
  File, 
  ArrowLeft, 
  Search, 
  Upload, 
  Trash2, 
  Download, 
  Loader2, 
  FileText, 
  Image, 
  AlertCircle,
  CheckCircle,
  FileCode,
  Eye
} from 'lucide-react';
import type { User } from '../types';
import { PriorArchiveViewer } from './PriorArchiveViewer';

interface PriorSystemArchiveProps {
  currentUser: User;
  activeTenantId: string;
}

interface ArchiveFile {
  id: string;
  name: string;
  year: string;
  folder: string;
  size: string;
  mimeType: string;
  base64: string;
  uploadedAt: string;
  uploadedBy: string;
  isFolderPlaceholder?: boolean;
}

const ARCHIVE_YEARS = [
  '2016/2017',
  '2017-2018',
  '2018-2019',
  '2019-2020',
  '2020-2021',
  '2021-2022',
  '2022-2023',
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027'
].reverse();

const FOLDERS = [
  'IDP',
  'Annual Report',
  'Annual Performance Report',
  'MTAS',
  'Performance Agreements',
  'SDBIP',
  'Risk Management',
  'Portfolios of Evidence'
];

export function PriorSystemArchive({ currentUser, activeTenantId }: PriorSystemArchiveProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Storage and Loading States
  const [allFiles, setAllFiles] = useState<ArchiveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingFile, setViewingFile] = useState<ArchiveFile | null>(null);

  // Folder creation forms state
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Fresh Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Get immediate sub-folders at the current selected folder path
  const getSubFolders = (): string[] => {
    if (!selectedYear) return [];
    if (!selectedFolder) {
      // Root level of the year: get all top-level folders
      const topLevelFolders = allFiles
        .filter(f => f.year === selectedYear)
        .map(f => f.folder.split('/')[0]);
      return Array.from(new Set([...FOLDERS, ...topLevelFolders]));
    } else {
      // Sub-folder level: find folders having current path as prefix
      const prefix = `${selectedFolder}/`;
      const subPaths = allFiles
        .filter(f => f.year === selectedYear && f.folder.startsWith(prefix))
        .map(f => {
          const relative = f.folder.slice(prefix.length);
          return relative.split('/')[0];
        })
        .filter(name => name.trim() !== "");
      return Array.from(new Set(subPaths));
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      showToast("Please enter a valid folder name", "info");
      return;
    }
    if (!selectedYear) {
      showToast("Please select a financial year first", "info");
      return;
    }

    // Check if folder already exists (case-insensitive check)
    const existingFolders = getSubFolders().map(f => f.toLowerCase());
    if (existingFolders.includes(trimmed.toLowerCase())) {
      showToast(`A folder named "${trimmed}" already exists in the current level.`, "error");
      return;
    }

    const fullFolderPath = selectedFolder ? `${selectedFolder}/${trimmed}` : trimmed;

    // Create a special folder placeholder document so it's persisted in Supabase
    const placeholderItem: ArchiveFile = {
      id: `folder-placeholder-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: "", // empty name marks it as a placeholder
      year: selectedYear,
      folder: fullFolderPath,
      size: "0 KB",
      mimeType: "application/x-directory-placeholder",
      base64: "data:application/directory;base64,ZW1wdHk=", // dummy Base64 value
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.fullName || currentUser.email || "Auditor",
      isFolderPlaceholder: true
    };

    const updatedList = [placeholderItem, ...allFiles];
    setLoading(true);
    try {
      await saveDocuments(updatedList);
      setAllFiles(updatedList);
      showToast(`Successfully created custom folder "${trimmed}"!`);
      setNewFolderName('');
      setShowFolderForm(false);
    } catch (err) {
      // toast shown in saveDocuments
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedYear || !selectedFolder) return;
    if (!window.confirm(`Are you sure you want to permanently delete the entire folder "${selectedFolder.split('/').pop()}" and all its contents from Supabase?`)) {
      return;
    }

    const updated = allFiles.filter(f => !(
      f.year === selectedYear && 
      (f.folder === selectedFolder || f.folder.startsWith(`${selectedFolder}/`))
    ));
    setLoading(true);
    try {
      await saveDocuments(updated);
      setAllFiles(updated);
      showToast(`Successfully deleted folder "${selectedFolder.split('/').pop()}" and all its contents.`);
      if (selectedFolder.includes('/')) {
        const lastSlashIdx = selectedFolder.lastIndexOf('/');
        setSelectedFolder(selectedFolder.substring(0, lastSlashIdx));
      } else {
        setSelectedFolder(null);
      }
    } catch (err) {
      // toast handled
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all archived files for this tenant on initialization
  useEffect(() => {
    if (!activeTenantId) return;
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/prior-documents`)
      .then(res => {
        if (!res.ok) throw new Error("Could not retrieve archives");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.documents)) {
          setAllFiles(data.documents);
        } else {
          setAllFiles([]);
        }
      })
      .catch(err => {
        console.error("Error loading archive documents:", err);
        showToast("Failed to load legacy document records from Supabase", "error");
      })
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  // Save documents list helper to Supabase
  const saveDocuments = async (updatedDocs: ArchiveFile[]) => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/prior-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: updatedDocs })
      });
      if (!res.ok) throw new Error("Server rejected save operation");
    } catch (err) {
      console.error("Error saving archive documents:", err);
      showToast("Database sync error. Failed to persist change.", "error");
      throw err;
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Define custom file path resolver for automatic folder grouping mapping
  const getTargetFolderForFile = (relativePath: string, defaultFolder: string): string => {
    if (!relativePath) return defaultFolder;
    // Replace backslashes if present (e.g. Windows paths)
    const cleanPath = relativePath.replace(/\\/g, '/');
    const parts = cleanPath.split('/').filter(p => p.trim() !== "");
    if (parts.length > 0) {
      if (selectedFolder) {
        // If we are currently inside a folder, append cleanPath under it recursively
        return `${selectedFolder}/${parts.join('/')}`;
      }
      const topFolder = parts[0];
      // Match case-insensitively with standard folders
      const matched = FOLDERS.find(f => f.toLowerCase() === topFolder.toLowerCase());
      if (matched) {
        const remaining = parts.slice(1);
        return remaining.length > 0 ? `${matched}/${remaining.join('/')}` : matched;
      }
      // Return beautiful casing of top subfolders
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('/');
    }
    return defaultFolder;
  };

  // Traverses directories & files recursively via DataTransferItems webkit Get Entries
  const scanDroppedItems = async (
    items: DataTransferItemList,
    fallbackFiles: FileList
  ): Promise<Array<{ file: File; targetFolder: string }>> => {
    const fileEntries: Array<{ file: File; targetFolder: string }> = [];

    const traverseEntry = async (entry: any, relativePath: string = ""): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file((f: File) => resolve(f), (err: any) => reject(err));
        });
        const pathForFolder = relativePath ? relativePath : (selectedFolder || "Portfolios of Evidence");
        const folderName = getTargetFolderForFile(pathForFolder, selectedFolder || "Portfolios of Evidence");
        fileEntries.push({ file, targetFolder: folderName });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries));
          });
        };

        let dirEntries: any[] = [];
        let fetched = await readEntries();
        while (fetched.length > 0) {
          dirEntries = dirEntries.concat(fetched);
          fetched = await readEntries();
        }

        const promises = dirEntries.map(e => 
          traverseEntry(e, relativePath ? `${relativePath}/${entry.name}` : entry.name)
        );
        await Promise.all(promises);
      }
    };

    const traversePromises: Promise<void>[] = [];
    let hasEntries = false;

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            hasEntries = true;
            traversePromises.push(traverseEntry(entry));
          }
        }
      }
    }

    if (hasEntries) {
      await Promise.all(traversePromises);
    } else {
      // Fallback to flat iteration if webkitGetAsEntry is unsupported 
      for (let i = 0; i < fallbackFiles.length; i++) {
        const file = fallbackFiles[i];
        const relativePath = file.webkitRelativePath || "";
        const folderName = getTargetFolderForFile(relativePath, selectedFolder || "Portfolios of Evidence");
        fileEntries.push({ file, targetFolder: folderName });
      }
    }

    return fileEntries;
  };

  // Master upload function that persists base64 and directory mapping to Supabase
  const handleUploadWithFolders = async (filesWithFolders: Array<{ file: File; targetFolder: string }>) => {
    if (!selectedYear) {
      showToast("Please choose a Financial Year first.", "info");
      return;
    }
    setUploading(true);
    const newItems: ArchiveFile[] = [];

    for (let i = 0; i < filesWithFolders.length; i++) {
      const { file, targetFolder } = filesWithFolders[i];

      // Format size
      let sizeStr = "";
      if (file.size < 1024 * 1024) {
        sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      } else {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      try {
        const base64Data = await convertToBase64(file);
        const fileItem: ArchiveFile = {
          id: `archive-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i}`,
          name: file.name,
          year: selectedYear,
          folder: targetFolder,
          size: sizeStr,
          mimeType: file.type || "application/octet-stream",
          base64: base64Data,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.fullName || currentUser.email || "Auditor"
        };
        newItems.push(fileItem);
      } catch (err) {
        console.error("Error reading file:", file.name, err);
        showToast(`Failed to parse file: "${file.name}"`, "error");
      }
    }

    if (newItems.length > 0) {
      const updatedList = [...newItems, ...allFiles];
      try {
        await saveDocuments(updatedList);
        setAllFiles(updatedList);
        showToast(`Successfully processed and loaded ${newItems.length} file(s) into corresponding folder(s)!`);
      } catch (err) {
        // Notification is handled inside saveDocuments
      }
    }
    setUploading(false);
  };

  // Multiple files uploader (fallback)
  const handleUpload = async (filesToUpload: FileList | File[]) => {
    const list: Array<{ file: File; targetFolder: string }> = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      list.push({
        file: filesToUpload[i],
        targetFolder: selectedFolder || "Portfolios of Evidence"
      });
    }
    await handleUploadWithFolders(list);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if ((e.dataTransfer.items && e.dataTransfer.items.length > 0) || (e.dataTransfer.files && e.dataTransfer.files.length > 0)) {
      try {
        setUploading(true);
        const parsedFiles = await scanDroppedItems(e.dataTransfer.items, e.dataTransfer.files);
        if (parsedFiles.length > 0) {
          await handleUploadWithFolders(parsedFiles);
        } else {
          showToast("No files found to upload.", "info");
        }
      } catch (err) {
        console.error("Error scanning dropped directories:", err);
        showToast("Error processing directory structure.", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  // Dedicated folder picker handler (supports multi-directory selects)
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const list: Array<{ file: File; targetFolder: string }> = [];
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // webkitRelativePath contains e.g. "SDBIP/q3/report.pdf" or "Audit 2024/doc.xlsx"
        const relativePath = file.webkitRelativePath || "";
        const folderName = getTargetFolderForFile(relativePath, selectedFolder || "Portfolios of Evidence");
        list.push({ file, targetFolder: folderName });
      }
      if (list.length > 0) {
        await handleUploadWithFolders(list);
      }
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${fileName}" from Supabase database archive?`)) {
      return;
    }

    const updated = allFiles.filter(f => f.id !== fileId);
    try {
      await saveDocuments(updated);
      setAllFiles(updated);
      showToast(`Deleted "${fileName}" from archive.`);
    } catch (err) {
      // Error is caught and displayed by saveDocuments
    }
  };

  const downloadFile = (fileItem: ArchiveFile) => {
    try {
      const link = document.createElement('a');
      link.href = fileItem.base64;
      link.download = fileItem.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading "${fileItem.name}"...`);
    } catch (err) {
      console.error("Error downloading file:", err);
      showToast("Download failed", "error");
    }
  };

  // Filters within folder, ignore folder directory placeholders
  const currentFolderFiles = allFiles.filter(
    f => f.year === selectedYear && f.folder === selectedFolder && !f.isFolderPlaceholder && f.name !== ""
  );

  const filteredFolderFiles = currentFolderFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mime: string) => {
    const m = mime.toLowerCase();
    if (m.includes('pdf')) {
      return <FileText className="w-8 h-8 text-rose-500" />;
    }
    if (m.includes('word') || m.includes('msword') || m.includes('officedocument.word') || m.endsWith('.doc') || m.endsWith('.docx')) {
      return <FileDocumentIcon />;
    }
    if (m.includes('image/') || m.includes('png') || m.includes('jpg') || m.includes('jpeg') || m.includes('webp')) {
      return <Image className="w-8 h-8 text-emerald-500" />;
    }
    return <File className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div id="prior_archive_container" className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Toast Popups Indicator */}
      {toast && (
        <div className={`absolute top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl animate-bounce text-sm font-bold min-w-[300px] transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          {toast.type === 'info' && <Database className="w-5 h-5 text-indigo-600 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Database className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Prior System Archive
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Access legacy documentation, audits, and historical Portfolios of Evidence</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation / Breadcrumbs Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100/50">
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  if (selectedFolder) {
                    if (selectedFolder.includes('/')) {
                      const lastSlashIdx = selectedFolder.lastIndexOf('/');
                      setSelectedFolder(selectedFolder.substring(0, lastSlashIdx));
                    } else {
                      setSelectedFolder(null);
                    }
                  } else {
                    setSelectedYear(null);
                  }
                }}
                disabled={!selectedYear}
                className={`p-2 rounded-lg transition-colors ${selectedYear ? 'text-slate-600 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => { setSelectedYear(null); setSelectedFolder(null); }}
                  className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${!selectedYear ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Archive Root
                </button>
                {selectedYear && (
                  <>
                    <div className="flex items-center px-1 text-slate-400"><ChevronRight className="w-4 h-4"/></div>
                    <button 
                      onClick={() => setSelectedFolder(null)}
                      className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${!selectedFolder ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Folder className="w-4 h-4" /> {selectedYear}
                    </button>
                  </>
                )}
                {selectedFolder && (() => {
                  const parts = selectedFolder.split('/');
                  return parts.map((part, index) => {
                    const currentPath = parts.slice(0, index + 1).join('/');
                    const isLast = index === parts.length - 1;
                    return (
                      <React.Fragment key={currentPath}>
                        <div className="flex items-center px-1 text-slate-400"><ChevronRight className="w-4 h-4"/></div>
                        <button 
                          onClick={() => {
                            if (!isLast) {
                              setSelectedFolder(currentPath);
                            }
                          }}
                          disabled={isLast}
                          className={`px-3 py-1.5 text-sm font-bold rounded-md flex items-center gap-2 transition-colors ${isLast ? 'bg-white text-indigo-700 shadow-sm cursor-default' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                        >
                          <Folder className="w-4 h-4" /> {part}
                        </button>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>
            
            {/* Real Search capability */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={selectedFolder ? "Search files inside folder..." : "Search archive..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="mt-4 text-slate-500 font-bold">Querying legacy archives database from Supabase...</p>
              </div>
            ) : !selectedYear ? (
              /* Archive Root: Select Financial Year */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                {ARCHIVE_YEARS.filter(y => y.toLowerCase().includes(searchQuery.toLowerCase())).map(year => {
                  const yearFilesCount = allFiles.filter(f => f.year === year).length;
                  return (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-400 hover:shadow-xl transition-all group text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{year}</h3>
                        <p className="text-xs text-slate-500 font-medium">Financial Year Archive</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                          {yearFilesCount} documents
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !selectedFolder ? (
              /* Sub-level: Select Folder mapping dynamic and bulk folders import tool */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                  {getSubFolders().filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).map(folder => {
                    const folderFilesCount = allFiles.filter(f => f.year === selectedYear && (f.folder === folder || f.folder.startsWith(`${folder}/`)) && !f.isFolderPlaceholder && f.name !== "").length;
                    const isPoeFolder = folder === 'Portfolios of Evidence';
                    return (
                      <button
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        className={`bg-white border text-left rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden ${
                          isPoeFolder ? 'border-violet-200 hover:border-violet-400' : 'border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform ${
                          isPoeFolder ? 'bg-violet-50/20' : 'bg-amber-50/20'
                        }`} />
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isPoeFolder 
                            ? 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white' 
                            : 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                        }`}>
                          <Folder className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">{folder}</h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {isPoeFolder ? 'Regulatory evidence base' : 'Archived Records'}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isPoeFolder ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {folderFilesCount} files stored
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Create Custom Folder Card Inline Trigger or Form */}
                  {showFolderForm ? (
                    <form 
                      onSubmit={handleCreateFolder}
                      className="bg-white border-2 border-indigo-500 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xl transition-all text-left relative overflow-hidden min-h-[142px] animate-fade-in"
                    >
                      <div>
                        <h4 className="font-extrabold text-[10px] text-indigo-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5" />
                          <span>New Folder Name</span>
                        </h4>
                        <input
                          type="text"
                          required
                          autoFocus
                          placeholder="e.g. Audit Q1 SLA"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setShowFolderForm(false); setNewFolderName(''); }}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[10px] uppercase font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowFolderForm(true)}
                      className="bg-dashed border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/20 hover:bg-indigo-50/5 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-all group text-left cursor-pointer min-h-[142px] animate-fade-in"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <span className="text-xl font-bold">+</span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-700 group-hover:text-indigo-900 transition-colors text-sm">Create Folder</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Add custom category</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Bulk Directory Import Tool Widget */}
                <div className="border border-indigo-100 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/20 p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                          <Upload className="w-4 h-4" />
                        </span>
                        Bulk Legacy Folder Import Tool (Multiple Folders Supported)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                        Have a collection of folders on your computer? Select or drag & drop multiple folders here. The system will recursively scan directory structures, convert files (images, Word, PDF) to Base64, and sync them directly to Supabase. Unmatched structures create dynamic custom categories!
                      </p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <label className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:shadow cursor-pointer font-bold text-[11px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm">
                        <Folder className="w-4 h-4 text-indigo-600 animate-bounce" />
                        <span>Select Folder Directory</span>
                        <input 
                          type="file" 
                          multiple 
                          {...{ webkitdirectory: "", directory: "" }} 
                          onChange={handleFolderInputChange}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[170px] ${
                      isDragging 
                        ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99] shadow-inner font-bold' 
                        : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/30'
                    }`}
                  >
                    {uploading ? (
                      <div className="space-y-3">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-indigo-700">Recursively scanning directory structures & parsing files to Supabase...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto shadow-xs border border-indigo-100">
                          <Folder className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Drag & Drop legacy folder directories here
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">Accepts folder drags containing images, Word documents, and PDFs</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Inside Selected Folder view with Upload Area & File management */
              <div className="space-y-6 w-full animate-fade-in flex flex-col">
                
                {/* Nested Sub-folders section */}
                <div className="bg-slate-100/40 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span>Sub-folders inside {selectedFolder.split('/').pop()}</span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getSubFolders().map(subName => {
                      const fullPath = `${selectedFolder}/${subName}`;
                      const folderFilesCount = allFiles.filter(f => f.year === selectedYear && (f.folder === fullPath || f.folder.startsWith(`${fullPath}/`)) && !f.isFolderPlaceholder && f.name !== "").length;
                      return (
                        <button
                          key={subName}
                          onClick={() => {
                            setSelectedFolder(fullPath);
                            setShowFolderForm(false);
                          }}
                          className="bg-white border border-slate-200 text-left rounded-2xl p-4 flex items-center gap-3 hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 text-sm truncate" title={subName}>{subName}</h4>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              {folderFilesCount} files
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Inline Create Sub-folder card inside active folder view! */}
                    {showFolderForm ? (
                      <form 
                        onSubmit={handleCreateFolder}
                        className="bg-white border-2 border-indigo-500 rounded-2xl p-3 flex items-center gap-2 hover:shadow-md transition-all text-left w-full h-[58px]"
                      >
                        <input
                          type="text"
                          required
                          autoFocus
                          placeholder="Sub-folder name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 min-w-0"
                        />
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="submit"
                            className="px-2.5 py-1.5 text-[10px] uppercase font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowFolderForm(false); setNewFolderName(''); }}
                            className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all border cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowFolderForm(true)}
                        className="bg-dashed border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/10 hover:bg-indigo-50/5 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all group text-left cursor-pointer h-[58px]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <span className="text-base font-bold">+</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-600 group-hover:text-indigo-900 text-sm">Add Subfolder</h4>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-h-[450px]">
                  
                  {/* Left Area: Always Working Dropzone Support Drag and Drop & Multiple Select click */}
                  <div className="w-full lg:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                      <span className="p-1 text-indigo-600 bg-indigo-50 rounded-lg">
                        <Upload className="w-4 h-4" />
                      </span>
                      Archive Uploader tool
                    </h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      Upload multiple regulatory evidence files, layouts, images, and documents into this folder for the financial year {selectedYear}.
                    </p>

                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                        isDragging 
                          ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99] shadow-inner' 
                          : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                      }`}
                    >
                      {uploading ? (
                        <div className="space-y-3">
                          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-indigo-700">Converting and syncing files with Supabase...</p>
                        </div>
                      ) : (
                        <label className="cursor-pointer block w-full space-y-4">
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-full w-fit mx-auto shadow-sm">
                            <Upload className="w-6 h-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Drag & Drop legacy files here
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">or Click to browse computer</p>
                          </div>
                          <div className="text-[9px] text-slate-400 bg-slate-100 p-2 rounded-lg leading-snug">
                            Word documents, PDFs, or Image captures
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Right Area: View Files list with delete/download abilities */}
                  <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 min-h-[400px]">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{selectedFolder.split('/').pop()}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Files stored inside `{selectedYear} &gt; {selectedFolder.replace(/\//g, " > ")}`</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDeleteFolder}
                          className="p-1 px-3 text-[10px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-all font-bold uppercase tracking-wider border border-rose-100 cursor-pointer"
                          title="Delete this entire folder and all its files from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Folder</span>
                        </button>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          {filteredFolderFiles.length} file(s)
                        </span>
                      </div>
                    </div>

                    {filteredFolderFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[250px] border border-dashed rounded-xl bg-slate-50/50">
                        <File className="w-12 h-12 text-slate-300 transform scale-90 mb-4 opacity-50" />
                        <p className="font-semibold text-slate-500 text-sm">No files uploaded in this archive folder yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Use the uploader on the left to add documents directly to Supabase.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFolderFiles.map((file) => (
                          <div 
                            key={file.id} 
                            className="border border-slate-150 rounded-xl p-4 flex items-start gap-3 bg bg-white hover:border-slate-300 hover:shadow-md transition-all group"
                          >
                            <div className="p-2 bg-slate-50 rounded-lg shrink-0 border">
                              {getFileIcon(file.mimeType)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 mt-1 font-medium">
                                <span>Size: <strong className="text-slate-600">{file.size}</strong></span>
                                <span>•</span>
                                <span>By: <strong className="text-slate-600">{file.uploadedBy}</strong></span>
                                <span>•</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 items-end shrink-0">
                              <button
                                onClick={() => setViewingFile(file)}
                                className="p-1 px-2.5 text-[10px] bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-md font-bold flex items-center gap-1 transition-all border border-indigo-100 shadow-sm cursor-pointer"
                                title="Open document view in original format"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => downloadFile(file)}
                                className="p-1 px-2.5 text-[10px] bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md font-semibold flex items-center gap-1 transition-all border cursor-pointer"
                                title="Download document option"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Get</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteFile(file.id, file.name)}
                                className="p-1 px-2.5 text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                                title="Delete from Supabase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Del</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingFile && (
        <PriorArchiveViewer 
          file={viewingFile} 
          onClose={() => setViewingFile(null)} 
        />
      )}
    </div>
  );
}

// Inline quick custom Word Icon
function FileDocumentIcon() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center bg-blue-50 border border-blue-100 rounded text-blue-600 font-extrabold text-[10px] tracking-tight">
      DOCX
    </div>
  );
}
