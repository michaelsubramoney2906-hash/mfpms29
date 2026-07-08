import fs from 'fs';

const files = [
  'src/components/IPMS/PerformanceAgreements.tsx',
  'src/components/IPMS/PersonalDevelopmentPlan.tsx',
  'src/components/IPMS/JobSpecificCompetencies.tsx'
];

const importsStr = `import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { asBlob } from "html-docx-js-typescript";`;

const functionsStr = `
  const exportPDF = async (ref, filename) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename + '.pdf');
    } catch(e) { console.error("PDF export failed", e); alert("PDF Export failed."); }
  };

  const exportWord = async (ref, filename) => {
    if (!ref.current) return;
    try {
      const htmlStr = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Doc</title></head><body>" + ref.current.innerHTML + "</body></html>";
      const blob = await asBlob(htmlStr);
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename + '.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) { console.error("Word export failed", e); alert("Word Export failed."); }
  };
`;

const homeRibbonStr = `
          <div className="flex items-center gap-4 text-gray-800 flex-wrap">
            <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
              <select onChange={(e) => formatText('fontName', e.target.value)} className="border border-gray-300 rounded px-1 py-0.5 max-w-[100px] outline-none">
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Calibri">Calibri</option>
              </select>
              <select onChange={(e) => formatText('fontSize', e.target.value)} className="border border-gray-300 rounded px-1 py-0.5 outline-none max-w-[50px]">
                <option value="1">10</option>
                <option value="2">11</option>
                <option value="3">12</option>
                <option value="4">14</option>
                <option value="5">18</option>
                <option value="6">24</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
              <button onClick={() => formatText('bold')} className="p-1 hover:bg-gray-200 rounded font-black border border-gray-300 w-6 h-6 flex justify-center items-center">B</button>
              <button onClick={() => formatText('italic')} className="p-1 hover:bg-gray-200 rounded italic border border-gray-300 w-6 h-6 flex justify-center items-center">I</button>
              <button onClick={() => formatText('underline')} className="p-1 hover:bg-gray-200 rounded underline border border-gray-300 w-6 h-6 flex justify-center items-center">U</button>
              <input type="color" onChange={(e) => formatText('foreColor', e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer" title="Text Color" />
              <input type="color" onChange={(e) => formatText('hiliteColor', e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer" title="Highlight Color" />
            </div>
            <div className="flex gap-1 border-r pr-3 border-gray-300">
              <button onClick={() => formatText('justifyLeft')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Left</button>
              <button onClick={() => formatText('justifyCenter')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Center</button>
              <button onClick={() => formatText('justifyRight')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Right</button>
              <button onClick={() => formatText('justifyFull')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Justify</button>
            </div>
            <div className="flex gap-1 border-r pr-3 border-gray-300">
              <button onClick={() => formatText('insertUnorderedList')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">• List</button>
              <button onClick={() => formatText('insertOrderedList')} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">1. List</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => formatText('formatBlock', '<H1>')} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-blue-600">Heading 1</button>
              <button onClick={() => formatText('formatBlock', '<H2>')} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-blue-500">Subtitle</button>
              <button onClick={() => formatText('formatBlock', '<P>')} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-gray-700">Normal</button>
            </div>
          </div>
`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('import { jsPDF } from')) {
    content = content.replace("import ", importsStr + "\nimport ");
  }

  // Inject export functions
  if (!content.includes('exportPDF')) {
    content = content.replace("const formatText = (command", functionsStr + "\n  const formatText = (command");
  }

  // Replace Home tab
  const homeTabRegex = /\{activeRibbonTab === 'home'[^<]*<\/(div|span)>[\s\S]*?(?=\{\/\* (2\.|[A-Z]+))/;
  // It's tricky to use regex for the entire Home tab block. Let's look for a known string.
  // We can replace the contents of the home tab panel.
  
  if (file.includes('PerformanceAgreements.tsx')) {
    const homeStart = content.indexOf("{activeRibbonTab === 'home' && !showFileBackstage && (");
    if (homeStart > -1) {
      const startDiv = content.indexOf("<div", homeStart);
      const endDiv = content.indexOf(")}", startDiv);
      const oldHome = content.substring(startDiv, endDiv);
      content = content.replace(oldHome, homeRibbonStr);
    }
  } else if (file.includes('PersonalDevelopmentPlan.tsx')) {
    const homeStart = content.indexOf("{activeRibbonTab === 'home' && !showFileBackstage && (");
    if (homeStart > -1) {
      const startDiv = content.indexOf("<div", homeStart);
      const endDiv = content.indexOf(")}", startDiv);
      const oldHome = content.substring(startDiv, endDiv);
      content = content.replace(oldHome, homeRibbonStr);
    }
  } else if (file.includes('JobSpecificCompetencies.tsx')) {
    // JSC doesn't have a DraftingSuiteTab child component, it has activeTab === 'drafting'.
    // Let's find its Home ribbon.
    // It has: "Home Tab panel elements" or something similar?
    // Let's just fix its editorRef first to have break-word
  }

  // Prevent words going off page by styling the editorRef contentEditable element
  content = content.replace(/contentEditable(\s*)suppressContentEditableWarning(\s*)className="(.*?)"/g, 'contentEditable\n                  suppressContentEditableWarning\n                  className="$3 break-words whitespace-pre-wrap max-w-full overflow-hidden" style={{wordWrap: "break-word"}}');
  content = content.replace(/min-h-full font-serif text-\[13px\] leading-relaxed outline-none z-10 relative/g, 'min-h-full font-serif text-[13px] leading-relaxed outline-none z-10 relative break-words whitespace-pre-wrap max-w-full overflow-x-hidden');

  // Add the export actions to the Backstage
  // For PerformanceAgreements
  content = content.replace(/<button onClick=\{\(\) => alert\("Save As PDF"\)\} className="px-2.5 py-1 bg-green-[^"]+">Save as PDF<\/button>/g, 
    '<button onClick={() => exportPDF(editorRef, "Document")} className="px-2.5 py-1 bg-red-600 text-white rounded font-bold">Export PDF</button>\n            <button onClick={() => exportWord(editorRef, "Document")} className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">Export Word</button>');

  // For PDP
  content = content.replace(/<button onClick=\{\(\) => alert\("Save As PDF"\)\} className="px-2.5 py-1 bg-green-[^"]+">Save as PDF<\/button>/g, 
    '<button onClick={() => exportPDF(editorRef, "PDP_Document")} className="px-2.5 py-1 bg-red-600 text-white rounded font-bold">Export PDF</button>\n            <button onClick={() => exportWord(editorRef, "PDP_Document")} className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">Export Word</button>');

  // For JSC
  // Actually, wait, does JSC have a backstage? Let's write the file and then check.
  
  fs.writeFileSync(file, content, 'utf8');
}

console.log("Updated files.");
