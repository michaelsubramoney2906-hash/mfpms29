import fs from 'fs';

const file = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

const importsStr = `import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { asBlob } from "html-docx-js-typescript";`;

if (!content.includes('import { jsPDF } from')) {
  content = content.replace("import ", importsStr + "\nimport ");
}

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
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename + '.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) { console.error("Word export failed", e); alert("Word Export failed."); }
  };
`;

if (!content.includes('exportPDF')) {
  content = content.replace("const loadDraftDocument =", functionsStr + "\n  const loadDraftDocument =");
}

const homeRibbonStr = `
              {activeRibbonTab === 'home' && !showFileBackstage && (
                <div className="flex items-center gap-4 text-gray-800 flex-wrap">
                  <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
                    <select onChange={(e) => { document.execCommand('fontName', false, e.target.value); if (editorRef.current) editorRef.current.focus(); }} className="border border-gray-300 rounded px-1 py-0.5 max-w-[100px] outline-none">
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                    </select>
                    <select onChange={(e) => { document.execCommand('fontSize', false, e.target.value); if (editorRef.current) editorRef.current.focus(); }} className="border border-gray-300 rounded px-1 py-0.5 outline-none max-w-[50px]">
                      <option value="1">10</option>
                      <option value="2">11</option>
                      <option value="3">12</option>
                      <option value="4">14</option>
                      <option value="5">18</option>
                      <option value="6">24</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
                    <button onClick={() => { document.execCommand('bold', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 rounded font-black border border-gray-300 w-6 h-6 flex justify-center items-center">B</button>
                    <button onClick={() => { document.execCommand('italic', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 rounded italic border border-gray-300 w-6 h-6 flex justify-center items-center">I</button>
                    <button onClick={() => { document.execCommand('underline', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 rounded underline border border-gray-300 w-6 h-6 flex justify-center items-center font-bold">U</button>
                    <input type="color" onChange={(e) => { document.execCommand('foreColor', false, e.target.value); if (editorRef.current) editorRef.current.focus(); }} className="w-6 h-6 p-0 border-0 cursor-pointer" title="Text Color" />
                    <input type="color" onChange={(e) => { document.execCommand('hiliteColor', false, e.target.value); if (editorRef.current) editorRef.current.focus(); }} className="w-6 h-6 p-0 border-0 cursor-pointer" title="Highlight Color" />
                  </div>
                  <div className="flex gap-1 border-r pr-3 border-gray-300">
                    <button onClick={() => { document.execCommand('justifyLeft', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Left</button>
                    <button onClick={() => { document.execCommand('justifyCenter', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Center</button>
                    <button onClick={() => { document.execCommand('justifyRight', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Right</button>
                    <button onClick={() => { document.execCommand('justifyFull', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">Justify</button>
                  </div>
                  <div className="flex gap-1 border-r pr-3 border-gray-300">
                    <button onClick={() => { document.execCommand('insertUnorderedList', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">• List</button>
                    <button onClick={() => { document.execCommand('insertOrderedList', false); if (editorRef.current) editorRef.current.focus(); }} className="p-1 hover:bg-gray-200 border border-gray-300 rounded font-bold">1. List</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { document.execCommand('formatBlock', false, '<H1>'); if (editorRef.current) editorRef.current.focus(); }} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-blue-600">Heading 1</button>
                    <button onClick={() => { document.execCommand('formatBlock', false, '<H2>'); if (editorRef.current) editorRef.current.focus(); }} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-blue-500">Subtitle</button>
                    <button onClick={() => { document.execCommand('formatBlock', false, '<P>'); if (editorRef.current) editorRef.current.focus(); }} className="p-1 border border-gray-300 rounded font-bold bg-gray-50 text-gray-700">Normal</button>
                  </div>
                </div>
              )}`;

const homeStart = content.indexOf("{activeRibbonTab === 'home' && !showFileBackstage && (");
if (homeStart > -1) {
  const startDiv = content.indexOf("<div", homeStart);
  const endDiv = content.indexOf(")}", startDiv);
  const oldHome = content.substring(startDiv, endDiv);
  content = content.replace(oldHome, homeRibbonStr.replace("{activeRibbonTab === 'home' && !showFileBackstage && (", "").replace(/}\)$/, ""));
}

content = content.replace(/<button onClick=\{saveDraftDocument\} className="px-2.5 py-1 bg-green-[^"]+">Save as Cloud PDF<\/button>/g, 
  '<button onClick={() => exportPDF(editorRef, "JSC_Document")} className="px-2.5 py-1 bg-red-600 text-white rounded font-bold">Export PDF</button>\n                  <button onClick={() => exportWord(editorRef, "JSC_Document")} className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold">Export Word</button>');

fs.writeFileSync(file, content, 'utf8');

console.log('Fixed JSC');
