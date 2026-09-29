import React from 'react';
import { FileText, Save, Download } from 'lucide-react';

interface ElectronicReportingTabProps {
  commentary?: string;
  onSaveCommentary?: (newComm: string) => void;
  [key: string]: any;
}

export function ElectronicReportingTab({ commentary = '', onSaveCommentary }: ElectronicReportingTabProps) {
  const [text, setText] = React.useState(commentary);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm uppercase">Electronic Risk Commentary & Statutory Reporting</h3>
        </div>
        <button
          onClick={() => onSaveCommentary && onSaveCommentary(text)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Commentary</span>
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder="Enter municipal risk commentary, mitigating factors, and oversight observations..."
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}
