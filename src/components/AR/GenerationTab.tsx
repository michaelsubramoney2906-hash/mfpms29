import React, { useState } from 'react';
import { Upload, FileText, File, Sparkles, Loader2, Image as ImageIcon, Layout, Download, Presentation, LayoutTemplate } from 'lucide-react';
import { cn } from '../Branding';

export function GenerationTab() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [currentSlide, setCurrentSlide] = useState(0);

  const [sourceFileUrl, setSourceFileUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // If it's an image, create a local preview URL so we can render it in the document
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setSourceFileUrl(url);
      } else {
        setSourceFileUrl(null);
      }
    }
  };

  const handleGenerate = async () => {
    if (!file && !prompt) {
      setError('Please provide a file or a prompt.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let fileData = null;
      let mimeType = null;
      if (file) {
        // Read file as base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = reader.result?.toString().split(',')[1] || '';
            resolve(base64);
          };
        });
        reader.readAsDataURL(file);
        fileData = await base64Promise;
        mimeType = file.type;
      }

      const res = await fetch(`/api/fred/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          fileData,
          mimeType
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate content. ' + await res.text());
      }

      const data = await res.json();
      setResult(data);
      setActiveView('preview');
      setCurrentSlide(0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  const renderSlide = (slide: any, index: number) => {
    const themeClasses = {
      dark: 'bg-slate-900 text-white',
      light: 'bg-white text-slate-900 border-2 border-slate-100',
      corporate: 'bg-blue-900 text-white',
      colorful: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
    }[result?.theme || 'light'] || 'bg-white text-slate-900';

    return (
      <div key={index} className={cn("w-full aspect-[16/9] rounded-2xl p-12 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-500", themeClasses)}>
        {/* Background decorations based on theme */}
        {result?.theme === 'colorful' && (
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        )}
        {result?.theme === 'corporate' && (
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-800/50 -skew-x-12 transform origin-top-right pointer-events-none"></div>
        )}

        <div className="relative z-10 flex-1 flex flex-col">
          {slide.type === 'title' ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <h1 className="text-6xl font-black mb-6 tracking-tight leading-tight max-w-4xl">{slide.title}</h1>
              {slide.subtitle && <p className="text-2xl opacity-80 max-w-2xl font-light">{slide.subtitle}</p>}
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-8 tracking-tight">{slide.title}</h2>
              <div className="text-xl opacity-90 leading-relaxed max-w-5xl whitespace-pre-wrap">
                {slide.content}
              </div>
            </>
          )}
        </div>
        
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-sm opacity-50 z-10 font-medium">
          <span>{result?.title || 'Annual Report Presentation'}</span>
          <span>{index + 1}</span>
        </div>
      </div>
    );
  };

  const renderDocument = () => {
    return (
      <div className="bg-slate-100 min-h-screen py-12 flex flex-col items-center">
        {/* A4 Paper Styling Wrapper */}
        <div className="w-[21cm] min-h-[29.7cm] bg-white shadow-2xl mx-auto p-[2.5cm] relative flex flex-col font-serif">
          
          {/* Document Header */}
          <div className="border-b-2 border-indigo-100 pb-12 mb-12 text-center break-inside-avoid">
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">{result?.title}</h1>
            {result?.subtitle && <p className="text-2xl text-slate-500 italic">{result.subtitle}</p>}
            <div className="mt-8 text-sm text-slate-400 uppercase tracking-widest font-sans font-bold">
              Official Document • Generated by Fred AI
            </div>
          </div>

          {/* Source Image Retention (If user uploaded an image, display it beautifully at the top) */}
          {sourceFileUrl && (
            <div className="mb-12 break-inside-avoid rounded-xl overflow-hidden border border-slate-200 shadow-md">
              <img src={sourceFileUrl} alt="Source Reference" className="w-full h-auto object-contain max-h-[400px] bg-slate-50" />
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-sans text-center">
                Figure 1: Original Source Reference
              </div>
            </div>
          )}
          
          {/* Document Body Sections */}
          <div className="flex-1 space-y-12">
            {result?.pages?.map((section: any, idx: number) => (
              <div key={idx} className="break-inside-avoid">
                {section.title && (
                  <h2 className="text-3xl font-bold mb-6 text-slate-800 border-l-4 border-indigo-500 pl-5 tracking-tight">
                    {section.title}
                  </h2>
                )}
                <div className="text-slate-700 leading-loose whitespace-pre-wrap text-[11.5pt] font-serif text-justify">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Document Footer (Page Number Simulation) */}
          <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-sans">
            <span>{result?.title}</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full">
      {activeView === 'edit' ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-700 rounded-full mb-4 shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Generate with Fred AI</h2>
              <p className="text-slate-500 mt-2 text-lg">Instantly turn documents and text prompts into polished presentations and reports.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">1. Upload Source Document (Optional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".doc,.docx,.pdf,.txt,.jpg,.jpeg,.png" />
                  {file ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <FileText className="w-12 h-12 mb-3" />
                      <span className="font-bold">{file.name}</span>
                      <span className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <Upload className="w-8 h-8 text-indigo-400" />
                      </div>
                      <span className="font-bold text-slate-700">Click or drag file to upload</span>
                      <span className="text-sm mt-1">Supports Word, PDF, Text, and Images</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">2. What would you like to create?</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Generate a professional 10-slide presentation summarizing the key financial highlights from this annual report. Use a corporate blue theme."
                  className="w-full h-32 bg-slate-50 border border-slate-300 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || (!file && !prompt)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-lg transition shadow-lg shadow-indigo-600/30 flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate with Fred
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-slate-900">
          <div className="h-16 px-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 text-white">
              <button 
                onClick={() => setActiveView('edit')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition"
              >
                ← Back to Editor
              </button>
              <h3 className="font-bold text-lg">{result?.title || 'Generated Content'}</h3>
              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                {result?.type}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {result?.type === 'presentation' ? (
              <div className="w-full max-w-5xl flex flex-col items-center">
                {/* Main Slide Viewer */}
                <div className="w-full mb-8">
                   {result.pages && result.pages[currentSlide] && renderSlide(result.pages[currentSlide], currentSlide)}
                </div>

                {/* Slide Controls */}
                <div className="flex items-center gap-6 bg-slate-800 px-6 py-3 rounded-full shadow-xl">
                  <button 
                    onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className="p-2 text-white disabled:opacity-30 hover:bg-slate-700 rounded-full transition"
                  >
                    ← Prev
                  </button>
                  <span className="text-white font-bold">
                    {currentSlide + 1} / {result?.pages?.length || 1}
                  </span>
                  <button 
                    onClick={() => setCurrentSlide(prev => Math.min((result?.pages?.length || 1) - 1, prev + 1))}
                    disabled={currentSlide === (result?.pages?.length || 1) - 1}
                    className="p-2 text-white disabled:opacity-30 hover:bg-slate-700 rounded-full transition"
                  >
                    Next →
                  </button>
                </div>
                
                {/* Slide Thumbnails */}
                <div className="mt-8 flex gap-4 overflow-x-auto w-full pb-4 px-4 snap-x">
                  {result?.pages?.map((slide: any, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        "h-24 aspect-[16/9] rounded-lg shrink-0 cursor-pointer snap-start bg-slate-800 border-2 overflow-hidden relative",
                        currentSlide === idx ? "border-indigo-500 ring-4 ring-indigo-500/30" : "border-slate-700 hover:border-slate-500"
                      )}
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-2 text-[8px] text-center text-white/70 overflow-hidden break-words">
                        {slide.title}
                      </div>
                      <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white/50">{idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full pb-20">
                {renderDocument()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
