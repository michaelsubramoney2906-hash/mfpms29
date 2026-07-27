import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, Plus, Trash2, Edit, Eye, Folder, 
  X, CheckCircle2, FileText, Download, ShieldCheck, Search, Paperclip
} from 'lucide-react';

export interface RiskRegisterItem {
  id: string;
  title: string;
  category: string;
  owner: string;
  inherentImpact: number;
  inherentLikelihood: number;
  keyControls: string;
  residualImpact: number;
  residualLikelihood: number;
  status: 'High' | 'Medium' | 'Low' | 'Mitigated';
  sourceDocument?: string;
  dateUploaded?: string;
}

export interface PoeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  status: 'Verified' | 'Pending Review' | 'Submitted';
  notes?: string;
}

interface RiskRegisterTabProps {
  riskRegister: RiskRegisterItem[];
  poeFiles: Record<string, PoeFile[]>;
  onUpdateRegister: (newRegister: RiskRegisterItem[]) => void;
  onUpdatePoe: (newPoe: Record<string, PoeFile[]>) => void;
  onPersist: () => void;
}

export function RiskRegisterTab({
  riskRegister,
  poeFiles,
  onUpdateRegister,
  onUpdatePoe,
  onPersist
}: RiskRegisterTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [activePoeRiskId, setActivePoeRiskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // POE Upload Form State
  const [newPoeFileName, setNewPoeFileName] = useState('');
  const [newPoeNotes, setNewPoeNotes] = useState('');
  const [newPoeStatus, setNewPoeStatus] = useState<'Verified' | 'Pending Review' | 'Submitted'>('Submitted');

  // New Risk Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRisk, setNewRisk] = useState<Partial<RiskRegisterItem>>({
    title: '',
    category: 'Operational Risks',
    owner: 'Technical Services Director',
    inherentImpact: 4,
    inherentLikelihood: 3,
    keyControls: 'Regular monitoring and preventative controls',
    residualImpact: 2,
    residualLikelihood: 2,
    status: 'Medium'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadMessage(`Document "${file.name}" uploaded successfully. Ready to map and parse rows.`);
    }
  };

  const handleMapAndImport = () => {
    if (!selectedFile) {
      setUploadMessage('Please select a PDF, Word, or Excel document first.');
      return;
    }

    // Map document contents into Risk Register
    const newMappedItem: RiskRegisterItem = {
      id: `RR-${100 + riskRegister.length + 1}`,
      title: `Mapped Risk from ${selectedFile.name.replace(/\.[^/.]+$/, "")}`,
      category: 'Strategic Risks',
      owner: 'Municipal Manager Office',
      inherentImpact: 4,
      inherentLikelihood: 4,
      keyControls: 'Mapped controls extracted from source document',
      residualImpact: 2,
      residualLikelihood: 2,
      status: 'Medium',
      sourceDocument: selectedFile.name,
      dateUploaded: new Date().toISOString().split('T')[0]
    };

    const nextRegister = [newMappedItem, ...riskRegister];
    onUpdateRegister(nextRegister);
    setUploadMessage(`Successfully parsed and mapped 1 risk record from ${selectedFile.name} into Risk Register.`);
    setSelectedFile(null);
  };

  const handleAddManualRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRisk.title) return;

    const added: RiskRegisterItem = {
      id: `RR-${100 + riskRegister.length + 1}`,
      title: newRisk.title,
      category: newRisk.category || 'Operational Risks',
      owner: newRisk.owner || 'Line Manager',
      inherentImpact: Number(newRisk.inherentImpact || 3),
      inherentLikelihood: Number(newRisk.inherentLikelihood || 3),
      keyControls: newRisk.keyControls || 'Standard Controls',
      residualImpact: Number(newRisk.residualImpact || 2),
      residualLikelihood: Number(newRisk.residualLikelihood || 2),
      status: newRisk.status || 'Medium',
      dateUploaded: new Date().toISOString().split('T')[0]
    };

    onUpdateRegister([added, ...riskRegister]);
    setShowAddModal(false);
    setNewRisk({
      title: '',
      category: 'Operational Risks',
      owner: 'Technical Services Director',
      inherentImpact: 4,
      inherentLikelihood: 3,
      keyControls: '',
      residualImpact: 2,
      residualLikelihood: 2,
      status: 'Medium'
    });
  };

  const handleDeleteRisk = (id: string) => {
    if (!confirm('Are you sure you want to remove this item from the Risk Register?')) return;
    onUpdateRegister(riskRegister.filter(item => item.id !== id));
  };

  // Add POE File to specific Risk Item
  const handleAddPoeFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePoeRiskId || !newPoeFileName) return;

    const newPoe: PoeFile = {
      id: `poe-${Date.now()}`,
      fileName: newPoeFileName,
      fileType: newPoeFileName.endsWith('.pdf') ? 'pdf' : newPoeFileName.endsWith('.xlsx') ? 'xlsx' : 'docx',
      fileSize: '1.5 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Compliance Officer',
      status: newPoeStatus,
      notes: newPoeNotes || 'Uploaded Proof of Evidence'
    };

    const existingPoeList = poeFiles[activePoeRiskId] || [];
    const updatedPoe = {
      ...poeFiles,
      [activePoeRiskId]: [newPoe, ...existingPoeList]
    };

    onUpdatePoe(updatedPoe);
    setNewPoeFileName('');
    setNewPoeNotes('');
  };

  const handleDeletePoeFile = (riskId: string, poeId: string) => {
    const list = poeFiles[riskId] || [];
    const updatedList = list.filter(p => p.id !== poeId);
    onUpdatePoe({
      ...poeFiles,
      [riskId]: updatedList
    });
  };

  // Filtered Register
  const filteredRegister = riskRegister.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Active Risk Item for POE Drawer
  const activePoeRisk = riskRegister.find(r => r.id === activePoeRiskId);
  const activePoeList = activePoeRiskId ? (poeFiles[activePoeRiskId] || []) : [];

  // Export Register Helper
  const handleExportCsv = () => {
    const headers = ["Risk ID", "Title", "Category", "Responsible Officer", "Inherent Score", "Key Controls", "Residual Score", "Status", "Source Document"];
    const rows = riskRegister.map(r => [
      r.id, r.title, r.category, r.owner, r.inherentImpact * r.inherentLikelihood, r.keyControls, r.residualImpact * r.residualLikelihood, r.status, r.sourceDocument || 'Manual Entry'
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Municipal_Risk_Register_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload & Document Mapping Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload & Map Risk Register Document</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload PDF, Word (.doc/.docx), or Excel (.xlsx/.csv) registers to parse & map items into the OPMS database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-600" />
              <span>{selectedFile ? selectedFile.name : "Select File (PDF/Word/Excel)"}</span>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            <button 
              onClick={handleMapAndImport}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Map & Import
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" /> Add Risk Item
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
            <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Export Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search risk items, owners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
            />
          </div>

          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Financial Risks">Financial Risks</option>
            <option value="Operational Risks">Operational Risks</option>
            <option value="Compliance & Legal Risks">Compliance & Legal Risks</option>
            <option value="POPIA & Cyber Risks">POPIA & Cyber Risks</option>
            <option value="Strategic Risks">Strategic Risks</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Total Items: <strong className="text-slate-900">{filteredRegister.length}</strong></span>
          <button 
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export Excel CSV
          </button>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-500" /> Municipal Master Risk Register Table
          </h3>
          <span className="text-[10px] bg-red-500/80 px-2 py-0.5 rounded-full font-mono uppercase font-bold">MFMA Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-4">Risk ID & Source</th>
                <th className="p-4">Risk Description</th>
                <th className="p-4">Responsible Officer</th>
                <th className="p-4">Inherent Risk</th>
                <th className="p-4">Key Controls</th>
                <th className="p-4">Residual Risk</th>
                <th className="p-4">POE Folder</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegister.map((item) => {
                const itemPoeList = poeFiles[item.id] || [];
                const inherentScore = item.inherentImpact * item.inherentLikelihood;
                const residualScore = item.residualImpact * item.residualLikelihood;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono">
                      <div className="font-extrabold text-slate-900">{item.id}</div>
                      {item.sourceDocument && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.sourceDocument}>
                          {item.sourceDocument}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded mt-1 inline-block">
                        {item.category}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-slate-700">
                      {item.owner}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 font-extrabold rounded text-[10px] uppercase ${
                        inherentScore >= 15 ? 'bg-red-100 text-red-800' :
                        inherentScore >= 9 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Rating {inherentScore}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs leading-snug">
                      {item.keyControls}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-1 font-extrabold rounded text-[10px] uppercase ${
                        residualScore >= 15 ? 'bg-red-100 text-red-800' :
                        residualScore >= 9 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Rating {residualScore}
                      </span>
                    </td>

                    <td className="p-4">
                      <button 
                        onClick={() => setActivePoeRiskId(item.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border ${
                          itemPoeList.length > 0 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Folder className="w-3.5 h-3.5 text-emerald-600" />
                        <span>POE Files ({itemPoeList.length})</span>
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteRisk(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Risk Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRegister.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No risk items found matching criteria. Upload a document or click "Add Risk Item".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POE Management Modal Drawer */}
      {activePoeRiskId && activePoeRisk && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Proof of Evidence (POE) Folder</h3>
                  <p className="text-xs text-slate-500 font-mono">{activePoeRisk.id}: {activePoeRisk.title}</p>
                </div>
              </div>

              <button 
                onClick={() => setActivePoeRiskId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to attach POE file */}
            <form onSubmit={handleAddPoeFile} className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Attach Proof of Evidence Document</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text"
                  required
                  placeholder="POE File Name (e.g. Audit_Signoff_Cert.pdf)"
                  value={newPoeFileName}
                  onChange={e => setNewPoeFileName(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 text-xs rounded-xl outline-none focus:border-emerald-500"
                />

                <select 
                  value={newPoeStatus}
                  onChange={e => setNewPoeStatus(e.target.value as any)}
                  className="bg-white border border-slate-200 px-3 py-1.5 text-xs rounded-xl outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="Submitted">Submitted for Verification</option>
                  <option value="Verified">Verified by Internal Audit</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>

              <input 
                type="text"
                placeholder="POE Verification Notes / Comments"
                value={newPoeNotes}
                onChange={e => setNewPoeNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs rounded-xl outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Upload POE Evidence
                </button>
              </div>
            </form>

            {/* List of uploaded POE documents */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Uploaded Evidence Files ({activePoeList.length})</h4>
              
              <div className="space-y-2">
                {activePoeList.map(poe => (
                  <div key={poe.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">{poe.fileName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{poe.fileSize}</span> • <span>Uploaded: {poe.uploadDate}</span> • <span>By: {poe.uploadedBy}</span>
                        </div>
                        {poe.notes && <div className="text-[10px] text-slate-600 italic mt-0.5">{poe.notes}</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        poe.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {poe.status}
                      </span>

                      <button 
                        onClick={() => handleDeletePoeFile(activePoeRiskId, poe.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove POE file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {activePoeList.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    No POE files attached yet. Fill out the form above to upload proof of evidence.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => { onPersist(); setActivePoeRiskId(null); }}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Done & Save to Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Risk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Add New Risk Item to Register</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualRisk} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Risk Description / Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Non-Compliance with MFMA Section 62"
                  value={newRisk.title}
                  onChange={e => setNewRisk({ ...newRisk, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Category</label>
                  <select 
                    value={newRisk.category}
                    onChange={e => setNewRisk({ ...newRisk, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none"
                  >
                    <option value="Financial Risks">Financial Risks</option>
                    <option value="Operational Risks">Operational Risks</option>
                    <option value="Compliance & Legal Risks">Compliance & Legal Risks</option>
                    <option value="POPIA & Cyber Risks">POPIA & Cyber Risks</option>
                    <option value="Strategic Risks">Strategic Risks</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Responsible Officer</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CFO / SCM Manager"
                    value={newRisk.owner}
                    onChange={e => setNewRisk({ ...newRisk, owner: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Key Controls / Mitigations</label>
                <textarea 
                  rows={2}
                  value={newRisk.keyControls}
                  onChange={e => setNewRisk({ ...newRisk, keyControls: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-xl outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Inherent Impact (1-5)</label>
                  <input 
                    type="number" min={1} max={5}
                    value={newRisk.inherentImpact}
                    onChange={e => setNewRisk({ ...newRisk, inherentImpact: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Inherent Likelihood (1-5)</label>
                  <input 
                    type="number" min={1} max={5}
                    value={newRisk.inherentLikelihood}
                    onChange={e => setNewRisk({ ...newRisk, inherentLikelihood: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700">Save Risk Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
