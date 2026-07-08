import React, { useState } from 'react';
import { 
  BarChart4, TrendingUp, PieChart as PieIcon, Paintbrush, 
  Layout, Database, Plus, Trash2, Sliders, Type, AlignLeft, 
  AlignCenter, AlignRight, Ruler, HelpCircle, CheckSquare, Sparkles
} from 'lucide-react';

interface DataEntity {
  id: string;
  label: string;
  value: number;
}

const PALETTES = {
  vibrant: {
    name: 'Vibrant',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'] // Blue, Green, Orange, Pink, Purple
  },
  alert: {
    name: 'Alert',
    colors: ['#EF4444', '#F97316', '#FBBF24', '#EA580C', '#991B1B'] // Red, Dark Orange, Orange, Medium Orange, Maroon
  },
  corporate: {
    name: 'Corporate',
    colors: ['#374151', '#4B5563', '#6B7280', '#9CA3AF', '#cbd5e1'] // Slate, Grey, Light Slate
  },
  modern: {
    name: 'Modern',
    colors: ['#06B6D4', '#3B82F6', '#6366F1', '#A855F7', '#D946EF'] // Cyan, Blue, Indigo, Purple, Pink
  }
};

interface GraphLabProps {
  currentUser?: any;
  activeTenantId?: string;
}

export function GraphLab({ currentUser, activeTenantId = 'global' }: GraphLabProps) {
  const [activeTab, setActiveTab ] = useState<'data' | 'layout' | 'theme'>('theme');
  const [graphType, setGraphType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof PALETTES>('vibrant');
  const [isSaving, setIsSaving] = useState(false);
  
  // Layout states
  const [title, setTitle] = useState('Performance Overview FY 2024/25');
  const [titleSize, setTitleSize] = useState(24);
  const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('center');
  const [xAxisLabel, setXAxisLabel] = useState('Fiscal Period');
  const [yAxisLabel, setYAxisLabel] = useState('Achievement %');
  const [showValues, setShowValues] = useState(true);

  const handleSaveGraph = async (format: 'png' | 'jpg') => {
    const svgElement = document.getElementById('graph-lab-svg-element');
    if (!svgElement) {
      alert("Could not find the graph SVG node to capture.");
      return;
    }
    
    setIsSaving(true);
    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const urlHelper = window.URL || (window as any).webkitURL;
      const blobURL = urlHelper.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 400;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          
          const fileType = format === 'jpg' ? 'image/jpeg' : 'image/png';
          const fileDataUrl = canvas.toDataURL(fileType, 0.95);
          
          const payload = {
            userEmail: currentUser?.email || 'guest@nkangaladm.gov.za',
            userName: currentUser?.fullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest User'),
            title: title || 'Performance Overview',
            graphType: graphType,
            selectedPalette: selectedPalette,
            entities: entities,
            xAxisLabel: xAxisLabel,
            yAxisLabel: yAxisLabel,
            showValues: showValues,
            filename: `graph_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_') || Date.now()}.${format}`,
            fileDataUrl: fileDataUrl
          };
          
          const response = await fetch(`/api/tenant/${activeTenantId}/graphs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            alert(`Success! Graph saved and exported as ${format.toUpperCase()} into this municipality's "graph lab" folder & all Drafting Suites.`);
          } else {
            alert("Error saving graph to Supabase database.");
          }
        }
        urlHelper.revokeObjectURL(blobURL);
        setIsSaving(false);
      };
      
      image.onerror = (e) => {
        console.error("Image load error during svg capture:", e);
        alert("Failed loading image buffer of the chart. Try again.");
        setIsSaving(false);
      };
      
      image.src = blobURL;
    } catch (err) {
      console.error("Capture failure:", err);
      alert("Failed capturing graph layout: " + String(err));
      setIsSaving(false);
    }
  };

  // Entities state - initialized with matching data from reference image
  const [entities, setEntities] = useState<DataEntity[]>([
    { id: '1', label: 'Q1', value: 75 },
    { id: '2', label: 'Q2', value: 82 },
    { id: '3', label: 'Q3', value: 91 },
    { id: '4', label: 'Q4', value: 88 }
  ]);

  const activeColors = PALETTES[selectedPalette].colors;

  const handleAddEntity = () => {
    const nextNum = entities.length + 1;
    const newEntity: DataEntity = {
      id: Math.random().toString(36).substring(2),
      label: `Q${nextNum}`,
      value: Math.floor(Math.random() * 40) + 60 // Default random value in sweet spot 60-100
    };
    setEntities([...entities, newEntity]);
  };

  const handleUpdateEntityLabel = (id: string, label: string) => {
    setEntities(entities.map(e => e.id === id ? { ...e, label } : e));
  };

  const handleUpdateEntityValue = (id: string, valStr: string) => {
    let intVal = parseInt(valStr, 10);
    if (isNaN(intVal)) intVal = 0;
    setEntities(entities.map(e => e.id === id ? { ...e, value: Math.max(0, intVal) } : e));
  };

  const handleDeleteEntity = (id: string) => {
    setEntities(entities.filter(e => e.id !== id));
  };

  const totalSum = entities.reduce((acc, curr) => acc + curr.value, 0);

  // Custom precise SVG styling
  const width = 640;
  const height = 400;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 60;
  const paddingBottom = 60;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute scale boundaries
  const maxVal = Math.max(100, ...entities.map(e => e.value), 1);

  // Path generator for bars with top-only rounded corners
  const getRoundedBarPath = (x: number, y: number, w: number, h: number, r: number) => {
    const realR = Math.min(r, w / 2, h);
    return `
      M ${x},${y + h}
      V ${y + realR}
      A ${realR},${realR} 0 0 1 ${x + realR},${y}
      H ${x + w - realR}
      A ${realR},${realR} 0 0 1 ${x + w},${y + realR}
      V ${y + h}
      Z
    `;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 min-h-[600px] flex flex-col lg:flex-row overflow-hidden">
      
      {/* LEFT: Dashboard Control Panel */}
      <div className="w-full lg:w-[380px] bg-gray-50 border-r border-gray-100 flex flex-col shrink-0">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white border-b border-gray-100 p-2 gap-1">
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'data' 
                ? 'bg-green-50 text-green-700 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Database className="w-4 h-4" />
            Data
          </button>
          <button 
            onClick={() => setActiveTab('layout')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'layout' 
                ? 'bg-green-50 text-green-700 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layout className="w-4 h-4" />
            Layout
          </button>
          <button 
            onClick={() => setActiveTab('theme')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'theme' 
                ? 'bg-green-50 text-green-700 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            Theme
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[580px] space-y-6 select-none">
          
          {/* 1. DATA PANEL */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Data Entities</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Customize records, ranges, and target outcomes</p>
                </div>
                <button 
                  onClick={handleAddEntity}
                  className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-500 active:scale-95 transition-all text-xs flex items-center justify-center shadow-md shadow-green-100"
                  title="Add Row Entry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {entities.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                  <Sliders className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">No data points created.</p>
                  <button 
                    onClick={handleAddEntity}
                    className="mt-3 px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors uppercase tracking-wider"
                  >
                    Add First Row
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {entities.map((ent, idx) => (
                    <div 
                      key={ent.id} 
                      className="flex items-center gap-2 bg-white rounded-2xl p-3 border border-gray-100 shadow-xs group transition-all hover:bg-gray-50"
                    >
                      <span className="w-5 h-5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input 
                        type="text" 
                        value={ent.label}
                        onChange={(e) => handleUpdateEntityLabel(ent.id, e.target.value)}
                        className="w-24 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 focus:bg-white focus:border-green-600 outline-none"
                        placeholder="Label"
                      />
                      <input 
                        type="number" 
                        value={ent.value}
                        onChange={(e) => handleUpdateEntityValue(ent.id, e.target.value)}
                        className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 focus:bg-white focus:border-green-600 text-right outline-none shrink-0"
                        min="0"
                      />
                      
                      <div className="flex flex-col text-[10px] text-gray-400 shrink-0">
                        <button 
                          onClick={() => handleUpdateEntityValue(ent.id, String(ent.value + 1))}
                          className="px-1 hover:text-green-600 font-bold leading-none select-none"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => handleUpdateEntityValue(ent.id, String(Math.max(0, ent.value - 1)))}
                          className="px-1 hover:text-green-600 font-bold leading-none select-none"
                        >
                          ▼
                        </button>
                      </div>

                      <button 
                        onClick={() => handleDeleteEntity(ent.id)}
                        className="ml-auto p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. LAYOUT PANEL */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Graph Title</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-green-600 outline-none text-xs font-bold text-gray-800"
                    placeholder="Enter Custom Title..."
                  />
                  <Type className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Size: {titleSize}PX</label>
                  
                  {/* Alignment Button Accents */}
                  <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-lg">
                    <button 
                      onClick={() => setTitleAlign('left')}
                      className={`p-1.5 rounded-md ${titleAlign === 'left' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setTitleAlign('center')}
                      className={`p-1.5 rounded-md ${titleAlign === 'center' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setTitleAlign('right')}
                      className={`p-1.5 rounded-md ${titleAlign === 'right' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input 
                  type="range"
                  min="16"
                  max="32"
                  value={titleSize}
                  onChange={(e) => setTitleSize(parseInt(e.target.value))}
                  className="w-full accent-green-600 h-1 rounded-lg bg-gray-200 appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Axis Definition</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1.5">X-Axis Label</label>
                  <input 
                    type="text"
                    value={xAxisLabel}
                    onChange={(e) => setXAxisLabel(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-green-600 outline-none text-xs font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1.5">Y-Axis Label</label>
                  <input 
                    type="text"
                    value={yAxisLabel}
                    onChange={(e) => setYAxisLabel(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-green-600 outline-none text-xs font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Show Values</span>
                  <span className="text-[10px] text-gray-400">Display item value annotations over nodes</span>
                </div>
                <button 
                  onClick={() => setShowValues(!showValues)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-green-400 ${
                    showValues ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showValues ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          {/* 3. THEME PANEL */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              
              {/* GRAPH TYPE CHOSER */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Graph Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setGraphType('bar')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      graphType === 'bar' 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <BarChart4 className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Bar</span>
                  </button>

                  <button 
                    onClick={() => setGraphType('line')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      graphType === 'line' 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Line</span>
                  </button>

                  <button 
                    onClick={() => setGraphType('pie')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      graphType === 'pie' 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <PieIcon className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Pie</span>
                  </button>
                </div>
              </div>

              {/* COLOR PALETTE */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Color Palette</h3>
                <div className="space-y-2">
                  {(Object.keys(PALETTES) as Array<keyof typeof PALETTES>).map((key) => {
                    const pal = PALETTES[key];
                    const isActive = selectedPalette === key;
                    return (
                      <button 
                        key={key}
                        onClick={() => setSelectedPalette(key)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                          isActive 
                            ? 'border-green-600 bg-green-50/50 shadow-xs ring-1 ring-green-600' 
                            : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-wider text-gray-800 uppercase pl-1">
                          {pal.name}
                        </span>
                        
                        {/* Circle Color Indicators */}
                        <div className="flex -space-x-1">
                          {pal.colors.slice(0, 5).map((color, cIdx) => (
                            <span 
                              key={cIdx} 
                              className="w-3.5 h-3.5 rounded-full border border-white shrink-0" 
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Dynamic Summary Stats Panel on Left Footer */}
        <div className="p-5 border-t border-gray-100 bg-white text-gray-600 text-xs font-semibold flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Quick Stats</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] text-gray-400 block tracking-tight uppercase leading-none text-right">Items</span>
              <span className="text-sm font-black text-gray-800 tracking-tight block text-right mt-0.5">{entities.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block tracking-tight uppercase leading-none text-right">Aggregate</span>
              <span className="text-sm font-black text-green-700 tracking-tight block text-right mt-0.5">{totalSum}</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT: Live Responsive Canvas Frame */}
      <div className="flex-1 bg-gray-100/50 p-8 lg:p-12 flex items-center justify-center relative min-h-[480px]">
        
        {/* White Mockup Canvas */}
        <div id="chart-canvas-mockup" className="bg-white rounded-[32px] shadow-2xl border border-gray-100/50 p-8 lg:p-10 w-full max-w-[700px] flex flex-col gap-6 relative transition-all overflow-hidden select-none">
          
          {/* Export & Save Action Bar */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 -mt-2">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> Live Canvas Preview
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSaveGraph('png')}
                disabled={isSaving}
                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 font-bold text-[10px] rounded-lg tracking-wider transition-all uppercase cursor-pointer"
              >
                {isSaving ? 'Processing...' : 'Export PNG'}
              </button>
              <button 
                onClick={() => handleSaveGraph('jpg')}
                disabled={isSaving}
                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 font-bold text-[10px] rounded-lg tracking-wider transition-all uppercase shadow-md shadow-green-100 cursor-pointer"
              >
                {isSaving ? 'Processing...' : 'Export JPG'}
              </button>
            </div>
          </div>

          {/* Header Title */}
          <div 
            className="w-full flex"
            style={{ 
              justifyContent: titleAlign === 'left' ? 'flex-start' : titleAlign === 'right' ? 'flex-end' : 'center',
              textAlign: titleAlign
            }}
          >
            <h2 
              className="text-gray-900 tracking-tight uppercase italic leading-tight"
              style={{ 
                fontSize: `${titleSize}px`,
                fontWeight: 900
              }}
            >
              {title || 'UNNAMED OUTCOME'}
            </h2>
          </div>

          {/* MAIN GRAPH CANVAS AREA */}
          <div className="relative flex-1 min-h-[280px] w-full flex items-center justify-center">
            
            {entities.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto animate-bounce" />
                <p className="text-xs font-semibold text-gray-400">Please append data models inside the control matrix left.</p>
              </div>
            ) : graphType === 'pie' ? (
              /* Pie Chart SVG */
              <svg id="graph-lab-svg-element" viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[300px]" style={{ fontFamily: 'Inter' }}>
                <g>
                  {(() => {
                    let cumulativeAngle = -90; // Start at 12 o'clock
                    const radius = 110;
                    const cx = width / 2;
                    const cy = height / 2 - 10;

                    return entities.map((ent, idx) => {
                      if (ent.value <= 0) return null;
                      const fraction = totalSum > 0 ? (ent.value / totalSum) : 0;
                      const angle = fraction * 360;

                      // Slice coordinates
                      const startRad = (cumulativeAngle * Math.PI) / 180;
                      const endRad = ((cumulativeAngle + angle) * Math.PI) / 180;

                      const x1 = cx + radius * Math.cos(startRad);
                      const y1 = cy + radius * Math.sin(startRad);
                      const x2 = cx + radius * Math.cos(endRad);
                      const y2 = cy + radius * Math.sin(endRad);

                      const largeArcFlag = angle > 180 ? 1 : 0;
                      const slicePath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                      // Mid-angle for annotation
                      const midRad = ((cumulativeAngle + angle / 2) * Math.PI) / 180;
                      const labelDistX = radius + 30;
                      const labelDistY = radius + 20;
                      const lx = cx + labelDistX * Math.cos(midRad);
                      const ly = cy + labelDistY * Math.sin(midRad);

                      const isRight = Math.cos(midRad) > 0;
                      const percentage = Math.round(fraction * 100);

                      cumulativeAngle += angle;
                      const sliceColor = activeColors[idx % activeColors.length];

                      return (
                        <g key={ent.id} className="transition-all duration-300 hover:opacity-90 cursor-pointer">
                          {/* Inner Pie Slice with tiny gap overlay */}
                          <path 
                            d={slicePath} 
                            fill={sliceColor}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />
                          
                          {/* Point indicators & label lines */}
                          {showValues && (
                            <>
                              {/* Anchor line connector to annotation */}
                              <line 
                                x1={cx + (radius - 5) * Math.cos(midRad)}
                                y1={cy + (radius - 5) * Math.sin(midRad)}
                                x2={cx + (radius + 15) * Math.cos(midRad)}
                                y2={cy + (radius + 15) * Math.sin(midRad)}
                                stroke={sliceColor}
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />

                              <text 
                                x={lx}
                                y={ly}
                                textAnchor={isRight ? 'start' : 'end'}
                                alignmentBaseline="middle"
                                className="font-sans font-extrabold text-[11px] tracking-tight"
                                fill={sliceColor}
                              >
                                {ent.label} ({percentage}%)
                              </text>
                            </>
                          )}
                        </g>
                      );
                    });
                  })()}
                </g>
              </svg>
            ) : (
              /* Bar or Line Chart SVG */
              <svg id="graph-lab-svg-element" viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[300px]" style={{ fontFamily: 'Inter' }}>
                
                {/* Horizontal Gridlines & Y-Axis Labeling */}
                <g>
                  {[0, 25, 50, 75, 100].map((percent) => {
                    // Normalize mapping height
                    const y = height - paddingBottom - (percent / 100) * chartHeight;
                    return (
                      <g key={percent}>
                        {/* Grid dashes */}
                        <line 
                          x1={paddingLeft}
                          y1={y}
                          x2={width - paddingRight}
                          y2={y}
                          stroke="#f3f4f6"
                          strokeWidth="1.5"
                        />
                        {/* Percent annotation */}
                        <text 
                          x={paddingLeft - 12}
                          y={y + 4}
                          textAnchor="end"
                          className="font-mono font-bold text-[10px] text-gray-400"
                        >
                          {percent}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Left Y Axis Label */}
                <g transform={`translate(${paddingLeft - 48}, ${paddingTop + chartHeight / 2}) rotate(-90)`}>
                  <text 
                    textAnchor="middle"
                    className="font-mono font-black text-[10px] text-gray-400 uppercase tracking-widest"
                  >
                    {yAxisLabel || 'Achievement %'}
                  </text>
                </g>

                {/* Bottom X-Axis line and label representation */}
                <line 
                  x1={paddingLeft}
                  y1={height - paddingBottom}
                  x2={width - paddingRight}
                  y2={height - paddingBottom}
                  stroke="#e5e7eb"
                  strokeWidth="1.5"
                />

                {/* Dynamic Data rendering - Bars or Lines */}
                <g>
                  {(() => {
                    const groupSpacing = chartWidth / entities.length;
                    
                    return entities.map((ent, idx) => {
                      const xCenter = paddingLeft + (idx * groupSpacing) + (groupSpacing / 2);
                      const barWidth = Math.min(80, groupSpacing * 0.55);
                      const valClamped = Math.min(maxVal, ent.value);
                      const itemHeight = (valClamped / maxVal) * chartHeight;
                      const yTop = height - paddingBottom - itemHeight;
                      const themeColor = activeColors[idx % activeColors.length];

                      return (
                        <g key={ent.id}>
                          {/* 1. Bar Chart Render element */}
                          {graphType === 'bar' && (
                            <path 
                              d={getRoundedBarPath(xCenter - barWidth / 2, yTop, barWidth, itemHeight, 10)}
                              fill={themeColor}
                              className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                            />
                          )}

                          {/* 2. Line Chart Render element (Dots & labels. Connecting path drawn separately) */}
                          {graphType === 'line' && (
                            <circle 
                              cx={xCenter}
                              cy={yTop}
                              r="7"
                              fill="#ffffff"
                              stroke={themeColor}
                              strokeWidth="4"
                              className="pointer-events-none"
                            />
                          )}

                          {/* Data Value above element */}
                          {showValues && (
                            <text 
                              x={xCenter}
                              y={yTop - 10}
                              textAnchor="middle"
                              className="font-sans font-black text-xs"
                              fill={graphType === 'line' ? '#3b82f6' : themeColor} // Match Line color of image or themeColor
                            >
                              {ent.value}
                            </text>
                          )}

                          {/* Tick labels */}
                          <text 
                            x={xCenter}
                            y={height - paddingBottom + 20}
                            textAnchor="middle"
                            className="font-mono font-bold text-[10px] text-gray-500 uppercase"
                          >
                            {ent.label}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </g>

                {/* Line Path connector for Line Chart */}
                {graphType === 'line' && (
                  <path 
                    d={(() => {
                      const groupSpacing = chartWidth / entities.length;
                      return entities.map((ent, idx) => {
                        const xCenter = paddingLeft + (idx * groupSpacing) + (groupSpacing / 2);
                        const valClamped = Math.min(maxVal, ent.value);
                        const itemHeight = (valClamped / maxVal) * chartHeight;
                        const yTop = height - paddingBottom - itemHeight;
                        return `${idx === 0 ? 'M' : 'L'} ${xCenter} ${yTop}`;
                      }).join(' ');
                    })()}
                    fill="none"
                    stroke="#1d4ed8" // Vibrant blue connector in reference line image
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                  />
                )}

                {/* Bottom X Axis Label */}
                <text 
                  x={paddingLeft + chartWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className="font-mono font-black text-[10px] text-gray-400 uppercase tracking-widest"
                >
                  {xAxisLabel || 'Fiscal Period'}
                </text>

              </svg>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
