const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

const TABS_CODE = `

      {/* TABS NAVIGATION */}
      <div className="flex bg-slate-950/50 border border-slate-800 rounded-xl p-1 gap-1 shrink-0">
        <button onClick={() => setActiveTab('upload')} className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 \${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}\`}>
          <Upload className="w-4 h-4" /> Upload Document
        </button>
        <button onClick={() => setActiveTab('paste')} className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 \${activeTab === 'paste' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}\`}>
          <FileText className="w-4 h-4" /> Paste Table
        </button>
        <button onClick={() => setActiveTab('results')} className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 \${activeTab === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}\`}>
          <Table className="w-4 h-4" /> Data Mapping
        </button>
        <button onClick={() => setActiveTab('json')} className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 \${activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}\`}>
          <Code2 className="w-4 h-4" /> JSON Schema
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] border-dashed">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Upload Scorecard Document</h2>
          <p className="text-slate-400 text-sm mb-6 text-center max-w-md">
            Upload a PDF, Word (.docx), or Excel (.xlsx/.csv) file containing your performance scorecard table. The engine will automatically extract and map the KPIs.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.xlsx,.xls,.csv,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition cursor-pointer"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {isProcessing ? 'Extracting Data...' : 'Select File to Extract'}
          </button>
        </div>
      )}

      {activeTab === 'paste' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Paste Table Content</h2>
            <button
              onClick={handleProcessPastedTable}
              disabled={isProcessing || !pasteText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition text-sm cursor-pointer"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Extract KPIs from Pasted Data'}
            </button>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your Excel or Word table here..."
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 font-mono resize-none"
          />
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">`;

// We need to inject TABS_CODE right before the Unsaved changes notification banner.
const SEARCH = `              </div>
            )}
            </div>
          </div>`;

const REPLACE = SEARCH + TABS_CODE;
content = content.replace(SEARCH, REPLACE);

// Now close the results tab wrapper right before {/* 4. JSON SCHEMA VIEW TAB */}
const SEARCH2 = `        </div>

      {/* 4. JSON SCHEMA VIEW TAB */}`;

const REPLACE2 = `        </div>
      )}

      {/* 4. JSON SCHEMA VIEW TAB */}`;

content = content.replace(SEARCH2, REPLACE2);

// Finally, update the button labels based on the user request.
content = content.replace(
  '<span>Push to IPMS Performance Plan</span>',
  '<span>Push to Personal Performance Plan</span>'
);

content = content.replace(
  '<span>Push to Individual Performance Plan</span>',
  '<span>Push to Personal Performance Plan</span>'
);

fs.writeFileSync(path, content);
console.log("Restored Tabs and Layout!");
