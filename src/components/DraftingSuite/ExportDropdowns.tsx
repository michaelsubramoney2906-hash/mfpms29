import React, { useState, useEffect } from 'react';

interface ExportDropdownsProps {
  activeTenantId: string;
  onInsertHTML: (html: string) => void;
  onInsertImage?: (src: string) => void;
}

export function ExportDropdowns({ activeTenantId, onInsertHTML, onInsertImage }: ExportDropdownsProps) {
  const [tenantCovers, setTenantCovers] = useState<any[]>([]);
  const [tenantGraphs, setTenantGraphs] = useState<any[]>([]);
  const [tenantCoverImages, setTenantCoverImages] = useState<any[]>([]);
  const [showCovers, setShowCovers] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [showCoverImages, setShowCoverImages] = useState(false);

  useEffect(() => {
    fetch(`/api/tenant/${activeTenantId}/coverpages`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTenantCovers(data))
      .catch(console.error);

    fetch(`/api/tenant/${activeTenantId}/graphs`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTenantGraphs(data))
      .catch(console.error);

    fetch(`/api/tenant/${activeTenantId}/coverpages/images`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTenantCoverImages(data))
      .catch(console.error);
  }, [activeTenantId]);

  // Combine directly uploaded cover images and background images from cover configs
  const allImages: { id: string; name: string; url: string; source: string }[] = [];
  
  // 1. Add direct uploads
  tenantCoverImages.forEach(img => {
    if (img && img.url) {
      const isCompiledDesign = img.name && (img.name.startsWith('Designed Cover') || img.name.includes('Front') || img.name.includes('Back'));
      allImages.push({
        id: img.id || `uploaded_${img.name}`,
        name: img.name || 'Cover Background',
        url: img.url,
        source: isCompiledDesign ? 'Designed Cover Page Canvas' : 'Uploaded Background'
      });
    }
  });

  // Sort designed cover canvases to the absolute top of the list for quick access
  allImages.sort((a, b) => {
    const aIsDesign = a.source === 'Designed Cover Page Canvas' ? 1 : 0;
    const bIsDesign = b.source === 'Designed Cover Page Canvas' ? 1 : 0;
    return bIsDesign - aIsDesign;
  });

  // 2. Add bgImage from cover page configs
  tenantCovers.forEach((cp, idx) => {
    if (cp.config && cp.config.bgImage && !allImages.some(x => x.url === cp.config.bgImage)) {
      allImages.push({
        id: `config_bg_${idx}`,
        name: `${cp.config.documentTitle || 'Cover Design'} Background`,
        url: cp.config.bgImage,
        source: `Saved Cover - ${cp.config.coverDesign || 'Modern'}`
      });
    }
  });

  const handleInsertCover = (config: any) => {
    let coverHTML = '';
    
    if (config?.coverDesign === 'minimalist') {
      coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', sans-serif; min-height: 440px; position: relative; background-color: #ffffff; color: #111827; padding: 48px; border: 12px solid #f8fafc; box-sizing: border-box;">
          ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<img src="${config.selectedLogo}" style="height: 60px; margin-bottom: 24px;" alt="Logo" />` : ''}
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${config?.primaryColor || '#15803d'}; letter-spacing: 0.15em; margin-bottom: 32px;">${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}</div>
          
          <h1 style="font-size: 32px; font-weight: 900; margin: 0 0 16px 0; text-transform: uppercase; color: #000; letter-spacing: -0.02em;">${config?.documentType || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
          <p style="font-size: 16px; color: ${config?.primaryColor || '#15803d'}; margin: 0 0 40px 0; font-weight: 600;">${config?.documentTitle || 'Strategic Documentation'}</p>
          
          <div style="display: flex; gap: 16px; color: #64748b; font-size: 12px; font-weight: 600;">
            <span style="background-color: #f1f5f9; padding: 4px 12px; border-radius: 4px;">${config?.financialYear || 'FY 2024/2025'}</span>
            ${config?.isConfidential ? '<span style="background-color: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 4px;">CONFIDENTIAL</span>' : ''}
          </div>
        </div><p><br/></p>
      `;
    } else if (config?.coverDesign === 'corporate') {
      coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', sans-serif; min-height: 480px; position: relative; background-color: #ffffff; color: #111827; padding: 0; display: flex; border-left: 20px solid ${config?.primaryColor || '#15803d'}; box-sizing: border-box; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="padding: 48px; flex: 1;">
            ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<img src="${config.selectedLogo}" style="height: 60px; margin-bottom: 24px;" alt="Logo" />` : ''}
            <div style="width: 48px; border-top: 4px solid ${config?.secondaryColor || '#ca8a04'}; margin-bottom: 24px;"></div>
            
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; letter-spacing: 0.15em; margin-bottom: 8px;">${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}</div>
            <h1 style="font-size: 36px; font-weight: 900; margin: 0 0 16px 0; text-transform: uppercase; color: #0f172a; line-height: 1.1;">${config?.documentType || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
            <h3 style="font-size: 18px; color: #475569; margin: 0 0 40px 0; font-weight: 500; border-left: 4px solid ${config?.primaryColor || '#15803d'}; padding-left: 12px;">${config?.documentTitle || 'Strategic Documentation'}</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
              <span style="background-color: #f1f5f9; color: #1e293b; padding: 6px 16px; font-weight: bold; font-size: 12px; letter-spacing: 0.05em;">${config?.financialYear || 'FY 2024/2025'}</span>
            </div>
          </div>
        </div><p><br/></p>
      `;
    } else if (config?.coverDesign === 'editorial') {
      coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', serif; min-height: 480px; position: relative; background-color: #faf9f6; color: #111827; padding: 48px; border: 16px solid ${config?.primaryColor || '#15803d'}; box-sizing: border-box; text-align: center; border-image: initial;">
          ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<img src="${config.selectedLogo}" style="height: 80px; margin: 0 auto 24px auto; display: block; mix-blend-mode: multiply;" alt="Logo" />` : ''}
          
          <div style="font-size: 14px; text-transform: uppercase; font-weight: 500; color: #1e293b; letter-spacing: 0.2em; margin-bottom: 24px;">${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}</div>
          
          <div style="width: 100%; height: 1px; background-color: #cbd5e1; margin: 32px 0;"></div>
          
          <h1 style="font-size: 42px; font-weight: 400; margin: 0 0 24px 0; color: #0f172a; line-height: 1;">${config?.documentType || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
          <h3 style="font-size: 20px; color: #475569; margin: 0 0 40px 0; font-style: italic;">${config?.documentTitle || 'Strategic Documentation'}</h3>
          
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 500; color: #64748b; letter-spacing: 0.3em; margin-top: 40px; margin-bottom: 12px;">${config?.financialYear || 'FY 2024/2025'}</div>
          <div style="width: 64px; height: 1px; background-color: ${config?.secondaryColor || '#ca8a04'}; margin: 0 auto;"></div>
        </div><p><br/></p>
      `;
    } else if (config?.coverDesign === 'bold') {
      coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', sans-serif; min-height: 480px; position: relative; background-color: #0f172a; color: #ffffff; padding: 48px; box-sizing: border-box; text-align: left; display: flex; flex-direction: column; justify-content: flex-end;">
          ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<div style="position: absolute; top: 0; left: 0; background: white; padding: 16px; border-bottom-right-radius: 24px;"><img src="${config.selectedLogo}" style="height: 60px;" alt="Logo" /></div>` : ''}
          <div style="font-size: 14px; text-transform: uppercase; font-weight: 700; color: #cbd5e1; letter-spacing: 0.2em; margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
            <span style="width: 32px; height: 4px; background-color: ${config?.secondaryColor || '#ca8a04'}; display: inline-block;"></span>
            ${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}
          </div>
          
          <h1 style="font-size: 48px; font-weight: 900; margin: 0 0 24px 0; line-height: 1; letter-spacing: -0.02em; text-transform: uppercase;">${config?.documentType || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
          <h3 style="font-size: 24px; color: ${config?.primaryColor || '#15803d'}; margin: 0 0 40px 0; font-weight: 500;">${config?.documentTitle || 'Strategic Documentation'}</h3>
          
          <div style="font-size: 14px; font-family: monospace; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
            <span>${config?.financialYear || 'FY 2024/2025'}</span>
            ${config?.isConfidential ? '<span style="border: 1px solid rgba(248,113,113,0.3); color: #f87171; padding: 4px 12px; text-transform: uppercase;">CONFIDENTIAL</span>' : ''}
          </div>
        </div><p><br/></p>
      `;
    } else if (config?.coverDesign === 'classic') {
       coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', sans-serif; min-height: 440px; position: relative; background-color: #ffffff; color: #111827; padding: 0; border: 1px solid #e2e8f0; box-sizing: border-box; text-align: center;">
          <div style="height: 12px; width: 100%; background-color: ${config?.primaryColor || '#15803d'};"></div>
          <div style="padding: 48px;">
            ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<img src="${config.selectedLogo}" style="height: 80px; margin: 0 auto 32px auto; display: block;" alt="Logo" />` : ''}
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${config?.primaryColor || '#15803d'}; letter-spacing: 0.15em; margin-bottom: 32px;">${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}</div>
            
            <h1 style="font-size: 32px; font-weight: 800; margin: 0 0 16px 0; text-transform: uppercase; color: #1e293b; letter-spacing: 0.05em;">${config?.documentType || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
            <h3 style="font-size: 16px; color: #64748b; margin: 0 0 32px 0; font-weight: 500;">${config?.documentTitle || 'Strategic Documentation'}</h3>
            
            <div style="display: inline-block; background-color: rgba(21, 128, 61, 0.1); color: ${config?.primaryColor || '#15803d'}; padding: 8px 24px; font-weight: bold; font-size: 14px; letter-spacing: 0.1em; border-radius: 99px;">${config?.financialYear || 'FY 2024/2025'}</div>
          </div>
          <div style="height: 16px; width: 100%; background-color: ${config?.secondaryColor || '#ca8a04'}; position: absolute; bottom: 0; left: 0;"></div>
        </div><p><br/></p>
      `;
    } else {
      // Default / Modern
      coverHTML = `
        <div class="draft-suite-cover-page-block" style="font-family: '${config?.titleFont || 'Space Grotesk'}', sans-serif; min-height: 400px; border: 4px solid ${config?.primaryColor || '#15803d'}; border-radius: 12px; padding: 32px; margin-bottom: 40px; position: relative; background-color: #ffffff; color: #111827; box-sizing: border-box; text-align: left;">
          ${config?.selectedLogo && typeof config?.selectedLogo === 'string' && config.selectedLogo.length > 10 ? `<img src="${config.selectedLogo}" style="height: 60px; margin-bottom: 16px;" alt="Logo" />` : ''}
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${config?.primaryColor || '#15803d'}; letter-spacing: 0.15em; margin-bottom: 24px; text-align: center;">LOCAL MUNICIPALITY REPORT COVER</div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 16px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px;">${config?.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY'}</div>
          </div>
  
          <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; border-top: 2px solid ${config?.secondaryColor || '#ca8a04'}; border-bottom: 2px solid ${config?.secondaryColor || '#ca8a04'}; padding: 20px 0;">
            <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; color: #000;">${config?.documentTitle || 'INTEGRATED DEVELOPMENT PLAN'}</h1>
            <p style="font-size: 12px; color: #475569; margin: 8px 0 0 0; text-transform: uppercase;">${config?.documentSubtitle || 'FY 2024/2025'}</p>
          </div>
  
          <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 600;">
            <div>REPUBLIC OF SOUTH AFRICA</div>
            <div>OFFICER SIGN-OFF: ${config?.signOffMM || 'Accounting Officer'}</div>
          </div>
        </div>
        <p><br/></p>
      `;
    }
    
    onInsertHTML(coverHTML);
    setShowCovers(false);
  };

  const handleInsertGraph = (graph: any) => {
    const graphHTML = `
      <div class="draft-suite-graph-block" style="margin: 24px 0; text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 12px; font-family: sans-serif;">${graph.title || 'Performance Chart'}</h3>
        <img src="${graph.fileDataUrl}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #f1f5f9; display: block; margin: 0 auto;" alt="Chart" />
        <p style="font-size: 10px; color: #64748b; margin-top: 10px; font-family: monospace; text-transform: uppercase;">${graph.graphType ? graph.graphType.toUpperCase() : 'BAR'} CHART - EXPORTED FROM GRAPH LAB</p>
      </div>
      <p><br/></p>
    `;
    onInsertHTML(graphHTML);
    setShowGraphs(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Covers Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowCovers(!showCovers); setShowGraphs(false); setShowCoverImages(false); }}
          className="flex flex-col items-center justify-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold border border-dashed border-gray-250 hover:border-blue-300 transition-colors"
          title="Insert Saved Covers from Cover Page Module"
        >
          <span className="text-base mb-0.5">👑</span>
          <span className="font-bold text-blue-700">Muni Cover ({tenantCovers.length})</span>
        </button>
        {showCovers && (
          <div className="absolute top-12 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] p-2 text-slate-800 text-left max-h-60 overflow-y-auto">
            <div className="text-[9px] font-black uppercase text-gray-450 p-1.5 select-none font-sans">Select Cover Page to Insert</div>
            {tenantCovers.length === 0 ? (
              <div className="text-xs text-gray-400 p-2 italic">No custom covers found for this municipality.</div>
            ) : (
              tenantCovers.map((cp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertCover(cp.config)}
                  className="w-full text-left p-1.5 hover:bg-indigo-50 rounded text-xs transition-colors flex flex-col border-b border-gray-100 font-sans cursor-pointer"
                >
                  <span className="font-bold text-slate-850">{cp.config?.documentTitle || 'ANNUAL REPORT'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">Created by: {cp.userEmail}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cover Images Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowCoverImages(!showCoverImages); setShowCovers(false); setShowGraphs(false); }}
          className="flex flex-col items-center justify-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold border border-dashed border-gray-250 hover:border-purple-300 transition-colors"
          title="Import background images from Cover Pages Module"
        >
          <span className="text-base mb-0.5">🖼️</span>
          <span className="font-bold text-purple-700">Cover Images ({allImages.length})</span>
        </button>
        {showCoverImages && (
          <div className="absolute top-12 left-0 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] p-2 text-slate-800 text-left max-h-80 overflow-y-auto">
            <div className="text-[9px] font-black uppercase text-gray-450 p-1.5 select-none font-sans border-b border-gray-100 pb-1 mb-1">Select Cover Page Image to Import</div>
            {allImages.length === 0 ? (
              <div className="text-xs text-gray-400 p-2 italic">No cover page background images found. Upload or save designs in the Cover Pages module first.</div>
            ) : (
              allImages.map((img, idx) => (
                <div key={idx} className="p-2 border-b border-gray-100 flex gap-3.5 items-center hover:bg-slate-50 rounded-lg transition-colors">
                  <img src={img.url} className="w-12 h-12 rounded object-cover border border-slate-200 bg-slate-100" alt="Preview" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate" title={img.name}>{img.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{img.source}</p>
                    
                    <div className="flex gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const inlineHTML = `<div class="draft-suite-image-block" style="text-align: center; margin: 24px 0;"><img src="${img.url}" style="max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" alt="Cover Page Image" /><p style="font-size: 10px; color: #64748b; margin-top: 8px; font-family: sans-serif; font-style: italic;">Imported Cover Page Graphic</p></div><p><br/></p>`;
                          onInsertHTML(inlineHTML);
                          setShowCoverImages(false);
                        }}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded text-[9px] transition-colors cursor-pointer border border-purple-200"
                      >
                        Insert Inline
                      </button>
                      {onInsertImage && (
                        <button
                          type="button"
                          onClick={() => {
                            onInsertImage(img.url);
                            setShowCoverImages(false);
                          }}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[9px] transition-colors cursor-pointer border border-blue-200"
                        >
                          Floating Overlay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Graphs Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowGraphs(!showGraphs); setShowCovers(false); setShowCoverImages(false); }}
          className="flex flex-col items-center justify-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold border border-dashed border-gray-250 hover:border-green-300 transition-colors"
          title="Insert Saved Charts from Graph Lab Module"
        >
          <span className="text-base mb-0.5">📈</span>
          <span className="font-bold text-green-700">Muni Graph ({tenantGraphs.length})</span>
        </button>
        {showGraphs && (
          <div className="absolute top-12 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] p-2 text-slate-800 text-left max-h-60 overflow-y-auto">
            <div className="text-[9px] font-black uppercase text-gray-450 p-1.5 select-none font-sans">Select Graph to Insert</div>
            {tenantGraphs.length === 0 ? (
              <div className="text-xs text-gray-400 p-2 italic">No graph designs found for this municipality.</div>
            ) : (
              tenantGraphs.map((graph, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertGraph(graph)}
                  className="w-full text-left p-1.5 hover:bg-emerald-50 rounded text-xs transition-colors flex flex-col border-b border-gray-100 font-sans cursor-pointer"
                >
                  <span className="font-bold text-slate-850">{graph.title || 'Chart Design'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{graph.filename}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
