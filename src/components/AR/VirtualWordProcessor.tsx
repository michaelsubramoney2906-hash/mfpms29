import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, Type, LayoutTemplate, Plus, FileText, Settings, Download,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, PaintBucket,
  Heading1, Heading2, TextQuote, Table as TableIcon, Square, Circle, ArrowRight, MessageSquare, Star,
  PieChart as PieChartIcon, BarChart3, LineChart, X, Trash2,
  Users, Radio, Globe, BookOpen, Clock, ChevronRight, Maximize2, Minimize2, ChevronLeft
} from 'lucide-react';

interface ChartData {
  type: 'pie' | 'bar' | 'line';
  labels: string[];
  values: number[];
}

interface TableData {
  rows: number;
  cols: number;
  cells: string[][];
}

interface ShapeState {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'callout' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

interface BlockState {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'image' | 'cover-title' | 'cover-subtitle' | 'table' | 'chart';
  content: string;
  style?: React.CSSProperties;
  tableData?: TableData;
  chartData?: ChartData;
}

interface PageState {
  id: string;
  type: 'standard' | 'cover' | 'back-cover';
  backgroundUrl?: string;
  blocks: BlockState[];
  shapes?: ShapeState[];
}

export const AVAILABLE_DRAFTS = [
  { id: 'Annual_Report_v1_Draft', name: 'Annual_Report_v1_Draft', label: 'Executive Summary & Strategy', category: 'Executive' },
  { id: 'Financial_Section_Draft', name: 'Financial_Section_Draft', label: 'Annual Financial Statements', category: 'Financial' },
  { id: 'Service_Delivery_Draft', name: 'Service_Delivery_Draft', label: 'Service Delivery Achievements', category: 'Operational' },
  { id: 'Governance_Record_Draft', name: 'Governance_Record_Draft', label: 'Governance & Compliance', category: 'Institutional' },
  { id: 'HR_Data_Draft', name: 'HR_Data_Draft', label: 'Organisational & Human Resources', category: 'HR' }
];

export const getSessionColor = (email: string) => {
  const colors = [
    { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold', text: 'text-rose-400', border: 'border-rose-500/20', raw: '#f43f5e' },
    { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold', text: 'text-amber-400', border: 'border-amber-500/20', raw: '#f59e0b' },
    { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold', text: 'text-emerald-400', border: 'border-emerald-500/20', raw: '#10b981' },
    { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold', text: 'text-sky-400', border: 'border-sky-500/20', raw: '#0ea5e9' },
    { bg: 'bg-violet-500/10 text-violet-400 border-violet-500/30 font-bold', text: 'text-violet-400', border: 'border-violet-500/20', raw: '#8b5cf6' },
  ];
  let sum = 0;
  for (let i = 0; i < email.length; i++) sum += email.charCodeAt(i);
  return colors[sum % colors.length];
};

export function VirtualWordProcessor({ currentUser, activeTenantId }: { currentUser?: any, activeTenantId?: string }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isPastingProgress, setIsPastingProgress] = useState<number | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('Annual_Report_v1_Draft');
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isWideMode, setIsWideMode] = useState<boolean>(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(false);

  // Local user custom representation
  const localEmail = currentUser?.email || 'editor@mzansiflow.co.za';
  const localName = currentUser?.full_name || currentUser?.name || 'Mzanzi Editor';

  // Master load effect
  useEffect(() => {
    async function loadDraft() {
        setIsLoadingDraft(true);
        try {
            if (!activeTenantId) {
                setIsLoadingDraft(false);
                return;
            }
            const res = await fetch(`/api/tenant/${activeTenantId}/ar-draft?draftId=${selectedDraftId}`);
            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data && data.draft && data.draft.pages && data.draft.pages.length > 0) {
                        setPages(data.draft.pages);
                        if (data.draft.headerConfig) setHeaderConfig(data.draft.headerConfig);
                        if (data.draft.footerConfig) setFooterConfig(data.draft.footerConfig);
                        if (data.draft.pageBorder) setPageBorder(data.draft.pageBorder);
                        setIsLoadingDraft(false);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error("Error loading ar draft", e);
        }
        
        // Generate initial template pages for the specific draft type if no saved state
        const initialPages: PageState[] = [];
        const draftObj = AVAILABLE_DRAFTS.find(d => d.id === selectedDraftId) || AVAILABLE_DRAFTS[0];
        
        for (let i = 0; i < 25; i++) {
            let type: 'cover' | 'standard' | 'back-cover' = 'standard';
            if (i === 0) type = 'cover';
            if (i === 24) type = 'back-cover';

            initialPages.push({
                id: `page-${selectedDraftId}-${i + 1}`,
                type,
                shapes: [],
                backgroundUrl: i === 0 ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop' : undefined,
                blocks: type === 'cover' ? [
                    { id: `block-${selectedDraftId}-${i}-title`, type: 'cover-title', content: `Nkangala District: ${draftObj.label}` },
                    { id: `block-${selectedDraftId}-${i}-subtitle`, type: 'cover-subtitle', content: 'Annual Budget Year 2026 - High-Performance Real-Time Working Draft' }
                ] : type === 'back-cover' ? [
                    { id: `block-${selectedDraftId}-${i}-title`, type: 'cover-title', content: 'End of Document' },
                    { id: `block-${selectedDraftId}-${i}-subtitle`, type: 'cover-subtitle', content: 'Official Record of Nkangala Municipal Council - Confidential Working Suite' }
                ] : [
                    { id: `block-${selectedDraftId}-${i}-1`, type: 'h1', content: `Section ${i + 1} - ${draftObj.label} Overview` },
                    { id: `block-${selectedDraftId}-${i}-2`, type: 'paragraph', content: `This working standard sheet forms part of the ${draftObj.label} suite for Nkangala's strategic auditing records. All updates are synchronized to Supabase securely in real-time under the @mzansiflow.co.za collaborative workspace.` },
                ]
            });
        }
        setPages(initialPages);
        setIsLoadingDraft(false);
    }
    loadDraft();
  }, [activeTenantId, selectedDraftId]);

  // Master save function
  const saveDraft = async () => {
      if (!activeTenantId) return;
      setIsSaving(true);
      try {
          await fetch(`/api/tenant/${activeTenantId}/ar-draft`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  draft: { pages, headerConfig, footerConfig, pageBorder },
                  draftId: selectedDraftId
              })
          });
      } catch (e) {
          console.error("Error saving ar draft", e);
      } finally {
          setIsSaving(false);
      }
  };

  // State Broadcasting core with throttle/debounce limits
  const lastStateRef = useRef({ pageIdx: -1, draftId: '' });
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastPresence = async (pageIdx: number, draftId: string) => {
      if (!activeTenantId) return;
      if (lastStateRef.current.pageIdx === pageIdx && lastStateRef.current.draftId === draftId) {
          return;
      }
      lastStateRef.current = { pageIdx, draftId };

      try {
          await fetch('/api/auth/ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: localEmail,
                  fullName: localName,
                  tenantId: activeTenantId,
                  documentId: draftId,
                  activePage: pageIdx + 1
              })
          });
      } catch (err) {
          console.error("Collaboration broadcast error", err);
      }
  };

  // Fetch collaboration sessions list
  useEffect(() => {
      if (!activeTenantId) return;

      const fetchSessions = async () => {
          try {
              const res = await fetch(`/api/tenant/${activeTenantId}/active-sessions`);
              if (res.ok) {
                  const contentType = res.headers.get("content-type");
                  if (contentType && contentType.includes("application/json")) {
                      const data = await res.json();
                      if (data && data.sessions) {
                          // Filter down to the @mzansiflow.co.za domain users
                          const relativeSessions = data.sessions.filter((s: any) => 
                              s.email && s.email.toLowerCase().endsWith('@mzansiflow.co.za')
                          );
                          setSessionsList(relativeSessions);
                      }
                  }
              }
          } catch (e) {
              console.error("Collaborators fetch query failure", e);
          }
      };

      fetchSessions();
      const interval = setInterval(fetchSessions, 4000);
      return () => clearInterval(interval);
  }, [activeTenantId]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const htmlData = e.clipboardData?.getData('text/html');
      const plainData = e.clipboardData?.getData('text/plain') || '';

      let elementsToParse: Element[] = [];

      if (htmlData) {
          try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlData, 'text/html');
              elementsToParse = Array.from(doc.body.children);
          } catch (err) {
              console.error("DOMParser error; falling back to plain text", err);
          }
      }

      if (elementsToParse.length === 0 && plainData) {
          const paragraphs = plainData.split(/\n+/).filter(p => p.trim().length > 0);
          const tempDiv = document.createElement('div');
          paragraphs.forEach(text => {
              const p = document.createElement('p');
              p.textContent = text;
              tempDiv.appendChild(p);
          });
          elementsToParse = Array.from(tempDiv.children);
      }

      if (elementsToParse.length === 0) return;

      setIsPastingProgress(0);

      const parsedPages: PageState[] = [];
      let currentPageBlocks: BlockState[] = [];
      let currentPageChars = 0;

      const finalizePage = () => {
          if (currentPageBlocks.length > 0) {
              parsedPages.push({
                  id: `page-paste-${Date.now()}-${parsedPages.length}`,
                  type: 'standard',
                  shapes: [],
                  blocks: currentPageBlocks
              });
              currentPageBlocks = [];
              currentPageChars = 0;
          }
      };

      const extractStyles = (el: Element): React.CSSProperties => {
          const style: React.CSSProperties = {};
          const styleAttr = el.getAttribute('style') || '';
          
          const inlineStyles: Record<string, string> = {};
          styleAttr.split(';').forEach(rule => {
              const parts = rule.split(':');
              if (parts.length === 2) {
                  inlineStyles[parts[0].trim().toLowerCase()] = parts[1].trim();
              }
          });

          const textAlignVal = inlineStyles['text-align'] || el.getAttribute('align') || '';
          if (['left', 'center', 'right', 'justify'].includes(textAlignVal.toLowerCase())) {
              style.textAlign = textAlignVal.toLowerCase() as any;
          }

          const colorVal = inlineStyles['color'] || '';
          if (colorVal) {
              style.color = colorVal;
          }

          const fontSizeVal = inlineStyles['font-size'] || '';
          if (fontSizeVal) {
              style.fontSize = fontSizeVal;
          }

          const elName = el.tagName.toLowerCase();
          if (elName === 'b' || elName === 'strong' || inlineStyles['font-weight'] === 'bold') {
              style.fontWeight = 'bold';
          }
          if (elName === 'i' || elName === 'em' || inlineStyles['font-style'] === 'italic') {
              style.fontStyle = 'italic';
          }
          if (elName === 'u' || inlineStyles['text-decoration']?.includes('underline')) {
              style.textDecoration = 'underline';
          }

          if (el.querySelector('b, strong') || el.className?.includes('bold')) {
              style.fontWeight = 'bold';
          }
          if (el.querySelector('i, em') || el.className?.includes('italic')) {
              style.fontStyle = 'italic';
          }
          if (el.querySelector('u') || el.className?.includes('underline')) {
              style.textDecoration = 'underline';
          }

          return style;
      };

      const batchSize = 15;
      let currentIndex = 0;

      const processBatch = () => {
          const end = Math.min(currentIndex + batchSize, elementsToParse.length);

          for (let i = currentIndex; i < end; i++) {
              const el = elementsToParse[i];
              const tagName = el.tagName.toLowerCase();
              const textContent = el.textContent || '';
              const elStyles = extractStyles(el);

              if (tagName === 'table') {
                  const rows = Array.from(el.querySelectorAll('tr'));
                  if (rows.length > 0) {
                      const rowCount = rows.length;
                      let colCount = 0;
                      const cells: string[][] = [];

                      rows.forEach(tr => {
                          const tds = Array.from(tr.querySelectorAll('td, th'));
                          colCount = Math.max(colCount, tds.length);
                          cells.push(tds.map(td => td.textContent?.trim() || ''));
                      });

                      cells.forEach(r => {
                          while (r.length < colCount) {
                              r.push('');
                          }
                      });

                      if (currentPageBlocks.length > 0) {
                          finalizePage();
                      }

                      currentPageBlocks.push({
                          id: `block-paste-tbl-${Date.now()}-${i}`,
                          type: 'table',
                          content: '',
                          style: elStyles,
                          tableData: {
                              rows: rowCount,
                              cols: colCount || 1,
                              cells: cells.map(row => row.map(cell => cell || ''))
                          }
                      });

                      finalizePage();
                  }
              } else if (tagName === 'ul' || tagName === 'ol') {
                  const lis = Array.from(el.querySelectorAll('li'));
                  lis.forEach((li, liIdx) => {
                      const liText = li.textContent || '';
                      const displayPrefix = tagName === 'ol' ? `${liIdx + 1}. ` : '• ';
                      const liStyles = extractStyles(li);

                      if (currentPageChars + liText.length > 1800 || currentPageBlocks.length >= 6) {
                          finalizePage();
                      }

                      currentPageBlocks.push({
                          id: `block-paste-li-${Date.now()}-${i}-${liIdx}`,
                          type: 'paragraph',
                          content: `${displayPrefix}${liText}`,
                          style: { ...liStyles, paddingLeft: '1.5rem' }
                      });

                      currentPageChars += liText.length + 4;
                  });
              } else if (tagName.startsWith('h')) {
                  const headingType = tagName === 'h1' ? 'h1' : 'h2';
                  
                  if (currentPageChars + textContent.length > 1800 || currentPageBlocks.length >= 6) {
                      finalizePage();
                  }

                  currentPageBlocks.push({
                      id: `block-paste-${headingType}-${Date.now()}-${i}`,
                      type: headingType,
                      content: textContent.trim(),
                      style: elStyles
                  });

                  currentPageChars += textContent.length;
              } else {
                  if (textContent.trim()) {
                      if (currentPageChars + textContent.length > 1800 || currentPageBlocks.length >= 6) {
                          finalizePage();
                      }

                      currentPageBlocks.push({
                          id: `block-paste-p-${Date.now()}-${i}`,
                          type: 'paragraph',
                          content: textContent.trim(),
                          style: elStyles
                      });

                      currentPageChars += textContent.length;
                  }
              }
          }

          currentIndex = end;
          const percent = Math.min(Math.round((currentIndex / elementsToParse.length) * 100), 100);
          setIsPastingProgress(percent);

          if (currentIndex < elementsToParse.length) {
              requestAnimationFrame(processBatch);
          } else {
              finalizePage();
              
              const originalLength = pages.length;
              setPages(prev => [...prev, ...parsedPages]);
              setIsPastingProgress(null);

              setTimeout(() => {
                  if (containerRef.current) {
                      containerRef.current.scrollTop = originalLength * TOTAL_PAGE_HEIGHT;
                  }
              }, 100);
          }
      };

      requestAnimationFrame(processBatch);
  };

  // Virtualization core
  const PAGE_HEIGHT = 1056; // Standard Letter format 816x1056
  const PAGE_MARGIN = 80; 
  const TOTAL_PAGE_HEIGHT = PAGE_HEIGHT + PAGE_MARGIN;
  
  // Document Configuration
  const [headerConfig, setHeaderConfig] = useState({ text: 'Annual Report 2026 - Executive Summary', align: 'center', fontFamily: 'sans-serif' });
  const [footerConfig, setFooterConfig] = useState({ text: 'Confidential - Internal Audit Use Only', align: 'center', fontFamily: 'sans-serif' });
  const [differentFirstPage, setDifferentFirstPage] = useState(true);

  // Formatting Selection
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<{pageId: string, blockId: string} | null>(null);
  const [selectedShapeInfo, setSelectedShapeInfo] = useState<{pageId: string, shapeId: string} | null>(null);

  const [pageBorder, setPageBorder] = useState({ style: 'none', width: 1, color: '#e5e7eb' });
  const [editingLayoutMode, setEditingLayoutMode] = useState<'header' | 'footer' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(1000);

  const [draggingShape, setDraggingShape] = useState<{pageId: string, shapeId: string, startX: number, startY: number, initialX: number, initialY: number} | null>(null);
  const [chartModalState, setChartModalState] = useState<{ isOpen: boolean, pageId: string, blockId: string, data: ChartData } | null>(null);

  const handleShapePointerDown = (e: React.PointerEvent, pageId: string, shapeId: string, currentX: number, currentY: number) => {
      e.stopPropagation();
      setSelectedShapeInfo({ pageId, shapeId });
      setSelectedBlockInfo(null);
      setDraggingShape({ pageId, shapeId, startX: e.clientX, startY: e.clientY, initialX: currentX, initialY: currentY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleShapePointerMove = (e: React.PointerEvent) => {
      if (!draggingShape) return;
      
      const dx = e.clientX - draggingShape.startX;
      const dy = e.clientY - draggingShape.startY;
      
      setPages(prev => prev.map(p => {
          if (p.id !== draggingShape.pageId) return p;
          return {
              ...p,
              shapes: (p.shapes || []).map(s => s.id === draggingShape.shapeId ? {
                  ...s,
                  x: draggingShape.initialX + dx,
                  y: draggingShape.initialY + dy
              } : s)
          };
      }));
  };

  const handleShapePointerUp = (e: React.PointerEvent) => {
      if (draggingShape) {
         (e.target as HTMLElement).releasePointerCapture(e.pointerId);
         setDraggingShape(null);
      }
  };
  
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
      
      const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
           setContainerHeight(entry.contentRect.height);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  const deleteBlock = (pageId: string, blockId: string) => {
      setPages(prev => prev.map(p => {
          if (p.id !== pageId) return p;
          return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) };
      }));
      setSelectedBlockInfo(null);
  };
  
  const deleteShape = (pageId: string, shapeId: string) => {
      setPages(prev => prev.map(p => {
          if (p.id !== pageId) return p;
          return { ...p, shapes: (p.shapes || []).filter(s => s.id !== shapeId) };
      }));
      setSelectedShapeInfo(null);
  };
  
  // Render active + 1 page above + 1 page below
  const startIndex = Math.max(0, Math.floor(scrollTop / TOTAL_PAGE_HEIGHT) - 1);
  const endIndex = Math.min(pages.length - 1, Math.floor((scrollTop + containerHeight) / TOTAL_PAGE_HEIGHT) + 1);
  const currentPageIndex = Math.max(0, Math.min(pages.length - 1, Math.floor((scrollTop + containerHeight / 2) / TOTAL_PAGE_HEIGHT)));

  // Handle local scrolling page Index changes
  useEffect(() => {
      broadcastPresence(currentPageIndex, selectedDraftId);
  }, [currentPageIndex, selectedDraftId]);

  const jumpToCollaborator = (s: any) => {
      if (!s) return;
      const pageIndex = s.activePage - 1;
      
      if (s.documentId && s.documentId !== selectedDraftId) {
          setSelectedDraftId(s.documentId);
          setTimeout(() => {
              if (containerRef.current) {
                  containerRef.current.scrollTop = pageIndex * TOTAL_PAGE_HEIGHT;
              }
          }, 350);
      } else {
          if (containerRef.current) {
              containerRef.current.scrollTop = pageIndex * TOTAL_PAGE_HEIGHT;
          }
      }
  };

  const visiblePages = pages.slice(startIndex, endIndex + 1);

  const handleBlockChange = (pageId: string, blockId: string, newContent: string) => {
    setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        return {
            ...p,
            blocks: p.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b)
        };
    }));

    if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
        broadcastPresence(currentPageIndex, selectedDraftId);
    }, 500);
  };

  const handleImageUpload = (pageIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Use URL.createObjectURL for massive 4K image performance (no base64 overhead)
      const objectUrl = URL.createObjectURL(file);
      
      setPages(prev => {
          const newPages = [...prev];
          if(newPages[pageIndex]) {
             newPages[pageIndex].blocks.push({
                 id: `block-img-${Date.now()}`,
                 type: 'image',
                 content: objectUrl
             });
          }
          return newPages;
      });
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      
      setPages(prev => {
          const newPages = [...prev];
          if(newPages[currentPageIndex]) {
             newPages[currentPageIndex].backgroundUrl = objectUrl;
          }
          return newPages;
      });
  };

  const insertPage = () => {
      setPages(prev => [
          ...prev, 
          { 
              id: `page-${Date.now()}`, 
              type: 'standard',
              shapes: [],
              blocks: [
                  { id: `block-new-title-${Date.now()}`, type: 'h1', content: 'New Page' },
                  { id: `block-new-p-${Date.now()}`, type: 'paragraph', content: '' }
              ] 
          }
      ]);
  };

  const insertTable = () => {
      if (!selectedBlockInfo) return;
      setPages(prev => prev.map(p => {
          if (p.id !== selectedBlockInfo.pageId) return p;
          const newBlock: BlockState = { 
              id: `block-${Date.now()}`, 
              type: 'table', 
              content: '',
              tableData: {
                  rows: 3, cols: 3, cells: Array(3).fill(['', '', ''])
              }
          };
          const blockIndex = p.blocks.findIndex(b => b.id === selectedBlockInfo.blockId);
          if (blockIndex === -1) {
              return { ...p, blocks: [...p.blocks, newBlock] };
          }
          const newBlocks = [...p.blocks];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          return { ...p, blocks: newBlocks };
      }));
  };

  const insertChart = (type: 'pie' | 'bar' | 'line') => {
      if (!selectedBlockInfo) return;
      setPages(prev => prev.map(p => {
          if (p.id !== selectedBlockInfo.pageId) return p;
          const newBlock: BlockState = { 
              id: `block-${Date.now()}`, 
              type: 'chart', 
              content: '',
              chartData: { type, labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [15, 30, 45, 60] }
          };
          const blockIndex = p.blocks.findIndex(b => b.id === selectedBlockInfo.blockId);
          if (blockIndex === -1) {
              return { ...p, blocks: [...p.blocks, newBlock] };
          }
          const newBlocks = [...p.blocks];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          return { ...p, blocks: newBlocks };
      }));
  };

  const insertShape = (type: 'rect' | 'circle' | 'arrow' | 'callout' | 'star') => {
      setPages(prev => {
          const newPages = [...prev];
          if(newPages[currentPageIndex]) {
             newPages[currentPageIndex].shapes = [
                ...(newPages[currentPageIndex].shapes || []),
                {
                    id: `shape-${Date.now()}`,
                    type,
                    x: 100, y: 100,
                    width: 100, height: 100,
                    fill: 'rgba(16, 185, 129, 0.2)',
                    stroke: '#10b981'
                }
             ];
          }
          return newPages;
      });
  };

  const insertBlock = (type: 'paragraph' | 'h1' | 'h2') => {
      if (!selectedBlockInfo) return;
      setPages(prev => prev.map(p => {
          if (p.id !== selectedBlockInfo.pageId) return p;
          const newBlock: BlockState = { id: `block-${Date.now()}`, type, content: type === 'paragraph' ? '' : 'New Heading' };
          const blockIndex = p.blocks.findIndex(b => b.id === selectedBlockInfo.blockId);
          if (blockIndex === -1) {
              return { ...p, blocks: [...p.blocks, newBlock] };
          }
          const newBlocks = [...p.blocks];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          return { ...p, blocks: newBlocks };
      }));
  };

  const applyStyleToSelected = (styleUpdate: React.CSSProperties) => {
      if (!selectedBlockInfo) return;
      setPages(prev => prev.map(p => {
          if (p.id !== selectedBlockInfo.pageId) return p;
          return {
              ...p,
              blocks: p.blocks.map(b => b.id === selectedBlockInfo.blockId ? { 
                  ...b, 
                  style: { ...(b.style || {}), ...styleUpdate } 
              } : b)
          };
      }));
  };

  return (
      <div className={`flex w-full transition-all duration-300 bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden shadow-2xl font-sans text-gray-200 ${isWideMode ? 'h-[95vh] min-h-[850px]' : 'h-[85vh] min-h-[700px]'}`}>
        
        {/* Elite Dark UI Sidebar */}
        <div className={`transition-all duration-300 bg-[#111] border-r border-[#222] flex flex-col shrink-0 overflow-hidden ${isLeftSidebarCollapsed ? 'w-0 p-0 border-r-0' : 'w-64 p-5'}`}>
            <h2 className="text-white text-[11px] font-black tracking-widest uppercase mb-6 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-emerald-500" />
                Drafting Engine
            </h2>
            
            <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide pr-2">
                <div>
                   <h3 className="text-[9px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-1">Insert Entities</h3>
                   <div className="grid grid-cols-2 gap-2">
                       <button className="flex flex-col items-center justify-center p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all group">
                           <Type className="w-4 h-4 mb-2 opacity-60 group-hover:opacity-100" />
                           <span className="text-[10px] font-semibold tracking-wide">Text</span>
                       </button>
                       <label className="flex flex-col items-center justify-center p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all group cursor-pointer">
                           <ImageIcon className="w-4 h-4 mb-2 opacity-60 group-hover:opacity-100" />
                           <span className="text-[10px] font-semibold tracking-wide text-center">4K Image Layer</span>
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(startIndex + 1, e)} />
                       </label>
                       <label className="flex col-span-2 flex-col items-center justify-center p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all group cursor-pointer">
                           <LayoutTemplate className="w-4 h-4 mb-2 opacity-60 group-hover:opacity-100" />
                           <span className="text-[10px] font-semibold tracking-wide">Set Page Background (Current)</span>
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBackgroundUpload(e)} />
                       </label>
                   </div>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                       <button onClick={insertTable} className="flex flex-col items-center justify-center p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all group">
                           <TableIcon className="w-4 h-4 mb-2 opacity-60 group-hover:opacity-100" />
                           <span className="text-[10px] font-semibold tracking-wide">Table</span>
                       </button>
                       <button onClick={() => insertChart('bar')} className="flex flex-col items-center justify-center p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all group">
                           <BarChart3 className="w-4 h-4 mb-2 opacity-60 group-hover:opacity-100" />
                           <span className="text-[10px] font-semibold tracking-wide">Chart</span>
                       </button>
                   </div>
                </div>

                <div>
                   <h3 className="text-[9px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-1">Smart Shapes</h3>
                   <div className="grid grid-cols-5 gap-2">
                        <button onClick={() => insertShape('rect')} className="p-2 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all flex justify-center items-center text-gray-400"><Square className="w-4 h-4" /></button>
                        <button onClick={() => insertShape('circle')} className="p-2 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all flex justify-center items-center text-gray-400"><Circle className="w-4 h-4" /></button>
                        <button onClick={() => insertShape('arrow')} className="p-2 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all flex justify-center items-center text-gray-400"><ArrowRight className="w-4 h-4" /></button>
                        <button onClick={() => insertShape('callout')} className="p-2 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all flex justify-center items-center text-gray-400"><MessageSquare className="w-4 h-4" /></button>
                        <button onClick={() => insertShape('star')} className="p-2 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-all flex justify-center items-center text-gray-400"><Star className="w-4 h-4" /></button>
                   </div>
                </div>

                <div>
                   <h3 className="text-[9px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-1">Page Architecture</h3>
                   <div className="space-y-2">
                       <button onClick={insertPage} className="w-full flex items-center justify-between p-3 bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500 hover:bg-[#1a1a1a] rounded-lg transition-all text-[11px] font-semibold">
                           <div className="flex items-center gap-2">
                               <Plus className="w-3.5 h-3.5 text-blue-400" />
                               Append Page
                           </div>
                       </button>
                   </div>
                </div>

                <div>
                   <h3 className="text-[9px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-1">Page Borders</h3>
                   <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 text-[10px] space-y-3">
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500">Style</span>
                           <select 
                               value={pageBorder.style} 
                               onChange={e => setPageBorder(prev => ({...prev, style: e.target.value}))}
                               className="bg-[#222] border border-[#333] text-gray-300 rounded px-1 py-0.5 min-w-[70px] outline-none focus:border-emerald-500"
                           >
                               <option value="none">None</option>
                               <option value="solid">Solid</option>
                               <option value="dashed">Dashed</option>
                               <option value="dotted">Dotted</option>
                               <option value="double">Double</option>
                           </select>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500">Width</span>
                           <input 
                               type="range" min="1" max="10" 
                               value={pageBorder.width} 
                               onChange={e => setPageBorder(prev => ({...prev, width: Number(e.target.value)}))}
                               className="w-16 accent-emerald-500"
                           />
                           <span className="text-white bg-[#222] px-1 rounded w-6 text-center">{pageBorder.width}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500">Color</span>
                           <input 
                               type="color" 
                               value={pageBorder.color} 
                               onChange={e => setPageBorder(prev => ({...prev, color: e.target.value}))}
                               className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                           />
                       </div>
                   </div>
                </div>

                <div>
                   <h3 className="text-[9px] uppercase font-bold text-gray-500 mb-3 tracking-widest pl-1">Engine Metrics</h3>
                   <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 text-[10px] space-y-2.5 font-mono">
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500">Virtual Pages</span>
                           <span className="text-white px-1.5 py-0.5 bg-[#222] rounded">{pages.length}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-gray-500">Rendered DOM</span>
                           <span className="text-emerald-400 px-1.5 py-0.5 bg-emerald-950/30 rounded">{visiblePages.length} Pages</span>
                       </div>
                       <div className="flex justify-between items-center text-emerald-500 opacity-80 pt-1 border-t border-[#2a2a2a]">
                           <span>Current Page Index</span>
                           <span>{currentPageIndex + 1}</span>
                       </div>
                   </div>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#222] flex flex-col gap-2">
                <button disabled={isSaving || isLoadingDraft} onClick={saveDraft} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wide py-2.5 rounded shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    <Download className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wide py-2.5 rounded shadow flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
            </div>
        </div>

        {/* Central Virtualized Canvas Viewport & Top Toolbar */}
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
            {/* Top Toolbar */}
            <div className="h-14 bg-[#111] border-b border-[#222] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {/* Typography */}
                    <div className="flex items-center gap-2 border-r border-[#222] pr-4">
                        <select 
                           className="bg-[#1a1a1a] border border-[#333] text-gray-300 text-[11px] rounded px-2 py-1 outline-none focus:border-emerald-500"
                           onChange={(e) => applyStyleToSelected({ fontFamily: e.target.value })}
                        >
                            <option value="inherit">Default Font</option>
                            <option value="'Inter', sans-serif">Inter</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Merriweather', serif">Merriweather</option>
                            <option value="monospace">Monospace</option>
                        </select>
                        
                        <select 
                           className="bg-[#1a1a1a] border border-[#333] text-gray-300 text-[11px] rounded px-2 py-1 outline-none focus:border-emerald-500 w-16"
                           onChange={(e) => applyStyleToSelected({ fontSize: e.target.value })}
                        >
                            <option value="">Size</option>
                            <option value="12px">12</option>
                            <option value="14px">14</option>
                            <option value="16px">16</option>
                            <option value="20px">20</option>
                            <option value="24px">24</option>
                            <option value="36px">36</option>
                            <option value="48px">48</option>
                        </select>
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-2 border-r border-[#222] pr-4">
                        <label className="flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors" title="Text Color">
                            <Palette className="w-4 h-4" />
                            <input 
                               type="color" 
                               className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                               onChange={(e) => applyStyleToSelected({ color: e.target.value })}
                            />
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer hover:text-amber-400 transition-colors" title="Highlight Color">
                            <PaintBucket className="w-4 h-4" />
                            <input 
                               type="color" 
                               className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                               onChange={(e) => applyStyleToSelected({ backgroundColor: e.target.value })}
                            />
                        </label>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-1 border-r border-[#222] pr-4">
                        <button onClick={() => applyStyleToSelected({ textAlign: 'left' })} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"><AlignLeft className="w-4 h-4" /></button>
                        <button onClick={() => applyStyleToSelected({ textAlign: 'center' })} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"><AlignCenter className="w-4 h-4" /></button>
                        <button onClick={() => applyStyleToSelected({ textAlign: 'right' })} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"><AlignRight className="w-4 h-4" /></button>
                        <button onClick={() => applyStyleToSelected({ textAlign: 'justify' })} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors"><AlignJustify className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => insertBlock('h1')} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors" title="Insert Heading 1"><Heading1 className="w-4 h-4" /></button>
                        <button onClick={() => insertBlock('h2')} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors" title="Insert Heading 2"><Heading2 className="w-4 h-4" /></button>
                        <button onClick={() => insertBlock('paragraph')} className="p-1.5 hover:bg-[#222] rounded text-gray-400 hover:text-white transition-colors" title="Insert Paragraph"><Type className="w-4 h-4" /></button>
                    </div>
                </div>                 <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[9px] uppercase font-bold text-gray-400" title="Different First Page Header/Footer">
                        <input type="checkbox" checked={differentFirstPage} onChange={e => setDifferentFirstPage(e.target.checked)} className="accent-emerald-500 w-3 h-3" />
                        First Pg Diff
                    </label>
                    <div className="flex bg-[#1a1a1a] rounded overflow-hidden border border-[#333] h-8 items-center">
                       <input 
                         type="text" 
                         value={headerConfig.text} 
                         onChange={e => setHeaderConfig({...headerConfig, text: e.target.value})} 
                         className="bg-transparent border-none outline-none text-[10px] text-gray-300 w-24 px-2 py-1 placeholder-gray-600 focus:bg-[#222]"
                         placeholder="Header text..."
                       />
                    </div>

                    <div className="flex items-center gap-1 border-l border-[#222] pl-2">
                        {/* Toggle Left Sidebar */}
                        <button 
                            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                            className={`p-1.5 rounded text-[10px] font-bold h-8 transition-all flex items-center gap-1 ${isLeftSidebarCollapsed ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'}`}
                            title={isLeftSidebarCollapsed ? "Show Left Panel (Drafting Tools)" : "Hide Left Panel (Drafting Tools)"}
                        >
                            <span>Left Tools</span>
                        </button>

                        {/* Toggle Wide Mode / Focus View */}
                        <button 
                            onClick={() => {
                                const newWide = !isWideMode;
                                setIsWideMode(newWide);
                                if (newWide) {
                                    setIsLeftSidebarCollapsed(true);
                                    setIsRightSidebarCollapsed(true);
                                } else {
                                    setIsLeftSidebarCollapsed(false);
                                    setIsRightSidebarCollapsed(false);
                                }
                            }}
                            className={`px-2.5 h-8 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isWideMode ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/70'}`}
                            title="Expand Editor Workspace (Height & Max Width)"
                        >
                            {isWideMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                            <span>{isWideMode ? "Compact Area" : "Expand Work Area"}</span>
                        </button>

                        {/* Toggle Right Sidebar */}
                        <button 
                            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                            className={`p-1.5 rounded text-[10px] font-bold h-8 transition-all flex items-center gap-1 ${isRightSidebarCollapsed ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'}`}
                            title={isRightSidebarCollapsed ? "Show Right Panel (Users)" : "Hide Right Panel (Users)"}
                        >
                            <span>Live Users</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Master Draft Activity Monitor Dashboard Banner */}
            <div className="bg-[#111111] border-b border-[#222222] p-4 text-[11px] shrink-0 font-sans select-none">
                <div className="flex items-center justify-between mb-3 border-b border-[#222222]/50 pb-2">
                    <div className="flex items-center gap-2">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-white font-bold tracking-widest uppercase text-[10px]">Master Draft Activity Dashboard</h4>
                        <span className="text-[9px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full">@mzansiflow.co.za Workspace</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-gray-300 font-mono text-[10px]">{sessionsList.length} Active Collaborators</span>
                    </div>
                </div>

                {/* Directory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {AVAILABLE_DRAFTS.map(draft => {
                        const isActive = selectedDraftId === draft.id;
                        // Find all collaborators on this draft
                        const draftUsers = sessionsList.filter(s => s.documentId === draft.id);

                        return (
                            <div 
                                key={draft.id}
                                onClick={() => setSelectedDraftId(draft.id)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group ${
                                    isActive 
                                    ? 'bg-emerald-950/25 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.12)]' 
                                    : 'bg-[#161616] border-[#222] hover:border-[#333]'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className={`text-[8px] uppercase tracking-wider font-extrabold ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>{draft.category}</span>
                                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                                    </div>
                                    <h5 className="font-bold text-gray-200 line-clamp-1 leading-tight text-[11px] group-hover:text-emerald-400 transition-colors">{draft?.label}</h5>
                                    <p className="text-[9px] text-gray-500 font-mono tracking-tighter truncate">{draft.id}.draft</p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-[#222222]/80 flex flex-col gap-1">
                                    <span className="text-[7.5px] text-gray-500 uppercase font-black tracking-widest">Collaborators</span>
                                    <div className="flex flex-wrap items-center gap-1.5 min-h-[20px]">
                                        {draftUsers.length === 0 ? (
                                            <span className="text-[9px] text-gray-600 italic">No editors now</span>
                                        ) : (
                                            draftUsers.map((collab, idx) => {
                                                const slot = getSessionColor(collab.email);
                                                const initials = collab.fullName ? collab.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : collab.email.substring(0, 2).toUpperCase();
                                                return (
                                                    <div 
                                                        key={`${collab.email}-${idx}`}
                                                        title={`${collab.fullName || collab.email} (Page ${collab.activePage})`}
                                                        className={`h-5 px-1.5 py-0.5 rounded border flex items-center gap-1 text-[8.5px] shadow-sm tracking-tight ${slot.bg} ${slot.border}`}
                                                    >
                                                        <span>{initials}</span>
                                                        <span className="font-bold opacity-85 font-mono text-[7.5px]">P{collab.activePage}</span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div 
              ref={containerRef}
              onScroll={handleScroll}
              onPaste={handlePaste}
              tabIndex={0}
              className="flex-1 overflow-y-auto relative no-scrollbar outline-none focus:ring-1 focus:ring-emerald-500/10"
            >
          {/* Spatial Container to establish correct scrollable height */}
          <div style={{ height: pages.length * TOTAL_PAGE_HEIGHT, position: 'relative', width: '100%' }}>
            
            {visiblePages.map((page, idx) => {
              const actualIndex = startIndex + idx;
              return (
                <div 
                  key={page.id}
                  className={`absolute left-1/2 transform -translate-x-1/2 bg-white shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-gray-800 transition-all ${page.type !== 'standard' ? 'bg-zinc-900 border-none' : ''}`}
                  style={{ 
                    top: actualIndex * TOTAL_PAGE_HEIGHT + PAGE_MARGIN / 2, 
                    width: '816px', 
                    height: '1056px', // 8.5x11 inches at ~96 PPI
                  }}
                >
                    {/* Render Page Background */}
                    {page.backgroundUrl && (
                        <div 
                          className="absolute inset-0 z-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${page.backgroundUrl})` }}
                        >
                            {/* Optional protective overlay */}
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>
                    )}

                    {/* Document Border */}
                    {pageBorder.style !== 'none' && page.type === 'standard' && (
                        <div 
                           className="absolute left-10 right-10 top-10 bottom-10 z-0 pointer-events-none rounded-sm"
                           style={{
                               borderStyle: pageBorder.style,
                               borderWidth: `${pageBorder.width}px`,
                               borderColor: pageBorder.color
                           }}
                        ></div>
                    )}

                    {/* Dim Overlay when editing layout */}
                    {editingLayoutMode && (
                        <div className="absolute inset-0 bg-white/70 z-10 pointer-events-none transition-all"></div>
                    )}

                    {/* Render Page Header */}
                    {page.type === 'standard' && !(actualIndex === 0 && differentFirstPage) && (
                        <div 
                          className="absolute top-8 left-24 right-24 border-b border-gray-200 pb-2 z-20 cursor-text group/header"
                          onDoubleClick={() => setEditingLayoutMode('header')}
                        >
                            {editingLayoutMode === 'header' ? (
                                <div className="relative pointer-events-auto">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#111] p-1 rounded shadow-xl border border-[#333]">
                                        <button onClick={() => setHeaderConfig({...headerConfig, align: 'left'})} className="p-1 text-gray-400 hover:text-white" title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                                        <button onClick={() => setHeaderConfig({...headerConfig, align: 'center'})} className="p-1 text-gray-400 hover:text-white" title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                                        <button onClick={() => setHeaderConfig({...headerConfig, align: 'right'})} className="p-1 text-gray-400 hover:text-white" title="Align Right"><AlignRight className="w-3 h-3" /></button>
                                        <button onClick={() => setHeaderConfig({...headerConfig, text: headerConfig.text + ' {PAGE_NUM}'})} className="p-1 text-gray-400 hover:text-emerald-400 font-bold text-[9px] uppercase tracking-wider ml-1 border-l border-gray-700 pl-2">Insert Pg#</button>
                                        <button onClick={() => setEditingLayoutMode(null)} className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold ml-2">Done</button>
                                    </div>
                                    <input 
                                        autoFocus
                                        value={headerConfig.text}
                                        onChange={e => setHeaderConfig({...headerConfig, text: e.target.value})}
                                        className="w-full text-[10px] font-bold text-gray-800 uppercase tracking-widest outline-none bg-emerald-50 border-b border-emerald-500 px-1 py-1"
                                        style={{ textAlign: headerConfig.align as any, fontFamily: headerConfig.fontFamily }}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: headerConfig.align as any, fontFamily: headerConfig.fontFamily }} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover/header:text-emerald-500 transition-colors">
                                    {headerConfig.text.replace('{PAGE_NUM}', `Page ${actualIndex + 1} of ${pages.length}`)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Render Page Content */}
                    <div className={`w-full h-full relative z-10 ${page.type === 'standard' ? 'pt-20 px-24 pb-20' : 'p-12 flex flex-col items-center justify-center text-center'} overflow-hidden group`}>
                        {page.type !== 'standard' && (
                            <div className="absolute top-12 left-12 right-12 bottom-12 border border-white/20 pointer-events-none"></div>
                        )}
                        
                        {/* Render Smart Shapes Overlay */}
                        {page.shapes && page.shapes.map(shape => (
                            <div 
                                key={shape.id}
                                className={`absolute z-20 cursor-move touch-none ${selectedShapeInfo?.shapeId === shape.id ? 'ring-2 ring-emerald-500' : ''}`}
                                style={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height }}
                                onPointerDown={(e) => handleShapePointerDown(e, page.id, shape.id, shape.x, shape.y)}
                                onPointerMove={handleShapePointerMove}
                                onPointerUp={handleShapePointerUp}
                                onPointerCancel={handleShapePointerUp}
                            >
                                {selectedShapeInfo?.shapeId === shape.id && (
                                    <button 
                                        onPointerDown={(e) => { e.stopPropagation(); deleteShape(page.id, shape.id); }} 
                                        className="absolute -top-8 right-0 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow z-50 pointer-events-auto transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                                    {shape.type === 'rect' && <rect x="0" y="0" width="100" height="100" fill={shape.fill} stroke={shape.stroke} strokeWidth="4" />}
                                    {shape.type === 'circle' && <circle cx="50" cy="50" r="48" fill={shape.fill} stroke={shape.stroke} strokeWidth="4" />}
                                    {shape.type === 'arrow' && <path d="M0,40 L60,40 L60,20 L100,50 L60,80 L60,60 L0,60 Z" fill={shape.fill} stroke={shape.stroke} strokeWidth="4" strokeLinejoin="round" />}
                                    {shape.type === 'callout' && <path d="M0,0 L100,0 L100,70 L60,70 L30,100 L40,70 L0,70 Z" fill={shape.fill} stroke={shape.stroke} strokeWidth="4" strokeLinejoin="round" />}
                                    {shape.type === 'star' && <polygon points="50,5 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill={shape.fill} stroke={shape.stroke} strokeWidth="4" strokeLinejoin="round" />}
                                </svg>
                            </div>
                        ))}

                        {page.blocks.map((block) => (
                            <div key={block.id} className={`${page.type === 'standard' ? 'mb-4' : 'mb-6 w-full max-w-3xl px-12'} group/block relative`}>
                                {block.type === 'h1' && (
                                    <input 
                                       className="text-4xl font-black border-none outline-none w-full bg-transparent placeholder-gray-300 focus:ring-2 focus:ring-emerald-500/20 rounded p-1 transition-all"
                                       style={{ color: '#111827', ...block.style }}
                                       value={block.content}
                                       onFocus={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                       onChange={(e) => handleBlockChange(page.id, block.id, e.target.value)}
                                       placeholder="Page Title"
                                    />
                                )}
                                {block.type === 'h2' && (
                                    <input 
                                       className="text-2xl font-bold border-none outline-none w-full bg-transparent placeholder-gray-300 focus:ring-2 focus:ring-emerald-500/20 rounded p-1 transition-all"
                                       style={{ color: '#374151', ...block.style }}
                                       value={block.content}
                                       onFocus={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                       onChange={(e) => handleBlockChange(page.id, block.id, e.target.value)}
                                       placeholder="Section Heading"
                                    />
                                )}
                                {block.type === 'cover-title' && (
                                    <input 
                                       className="text-6xl font-black border-none outline-none w-full bg-transparent placeholder-white/50 focus:ring-2 focus:ring-white/20 rounded p-1 transition-all text-center uppercase tracking-tighter"
                                       style={{ color: '#ffffff', textShadow: '0 4px 20px rgba(0,0,0,0.5)', ...block.style }}
                                       value={block.content}
                                       onFocus={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                       onChange={(e) => handleBlockChange(page.id, block.id, e.target.value)}
                                       placeholder="COVER TITLE"
                                    />
                                )}
                                {block.type === 'cover-subtitle' && (
                                    <input 
                                       className="text-2xl font-light border-none outline-none w-full bg-transparent placeholder-white/50 focus:ring-2 focus:ring-white/20 rounded p-1 transition-all text-center tracking-widest"
                                       style={{ color: '#e2e8f0', textShadow: '0 2px 10px rgba(0,0,0,0.5)', ...block.style }}
                                       value={block.content}
                                       onFocus={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                       onChange={(e) => handleBlockChange(page.id, block.id, e.target.value)}
                                       placeholder="Subtitle"
                                    />
                                )}
                                {block.type === 'paragraph' && (
                                    <textarea 
                                       className="text-[13px] leading-[1.8] border-none outline-none w-full bg-transparent resize-none overflow-hidden placeholder-gray-300 focus:ring-2 focus:ring-emerald-500/20 rounded p-1 transition-all"
                                       style={{ color: '#4b5563', minHeight: '3em', ...block.style }}
                                       onFocus={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                       value={block.content}
                                       onChange={(e) => {
                                           e.target.style.height = 'auto';
                                           e.target.style.height = e.target.scrollHeight + 'px';
                                           handleBlockChange(page.id, block.id, e.target.value);
                                       }}
                                       rows={2}
                                       placeholder="Enter paragraph text..."
                                    />
                                )}
                                {block.type === 'image' && (
                                    <div 
                                      className={`relative group/img rounded-lg overflow-hidden border ${selectedBlockInfo?.blockId === block.id ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-200'} mt-4 mb-4 cursor-pointer`} 
                                      style={{ height: '320px', ...block.style }}
                                      onClick={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                    >
                                        {selectedBlockInfo?.blockId === block.id && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteBlock(page.id, block.id); }} 
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow z-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <img src={block.content} className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]" alt="High Res 4K Content" />
                                    </div>
                                )}
                                {block.type === 'table' && block.tableData && (
                                    <div className={`w-full overflow-hidden mt-4 mb-4 border ${selectedBlockInfo?.blockId === block.id ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-300'} rounded relative`} onClick={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}>
                                        {selectedBlockInfo?.blockId === block.id && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteBlock(page.id, block.id); }} 
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow z-50 transition-colors pointer-events-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <table className={`w-full text-left border-collapse table-fixed ${selectedBlockInfo?.blockId === block.id ? 'mt-10' : ''}`}>
                                            <tbody>
                                                {block.tableData.cells.map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="border border-gray-300 p-2 relative group/cell">
                                                                <input 
                                                                    className="w-full bg-transparent border-none outline-none text-[13px] text-gray-700 focus:ring-0" 
                                                                    value={cell}
                                                                    style={{ color: block.style?.color }}
                                                                    placeholder="..."
                                                                    onChange={(e) => {
                                                                        const newVal = e.target.value;
                                                                        setPages(prev => prev.map(p => {
                                                                            if (p.id !== page.id) return p;
                                                                            return {
                                                                                ...p,
                                                                                blocks: p.blocks.map(b => {
                                                                                    if(b.id !== block.id || !b.tableData) return b;
                                                                                    const newCells = b.tableData.cells.map((r, rr) => r.map((c, cc) => rr === rIdx && cc === cIdx ? newVal : c));
                                                                                    return { ...b, tableData: { ...b.tableData, cells: newCells } };
                                                                                })
                                                                            }
                                                                        }));
                                                                    }}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {block.type === 'chart' && block.chartData && (
                                    <div 
                                        className={`w-full overflow-hidden mt-4 mb-4 border ${selectedBlockInfo?.blockId === block.id ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-200'} rounded-lg p-2 bg-white cursor-pointer relative group/chart hover:shadow-md transition-shadow`} 
                                        onClick={() => setSelectedBlockInfo({ pageId: page.id, blockId: block.id })}
                                        onDoubleClick={() => setChartModalState({ isOpen: true, pageId: page.id, blockId: block.id, data: block.chartData! })}
                                    >
                                        {selectedBlockInfo?.blockId === block.id && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteBlock(page.id, block.id); }} 
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow z-50 transition-colors pointer-events-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="absolute top-2 right-12 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/chart:opacity-100 transition-opacity z-10 pointer-events-none">
                                            Double Click to Edit Data
                                        </div>
                                        <svg viewBox="0 0 400 200" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                                            {(() => {
                                                const { type, labels, values } = block.chartData;
                                                // prevent max on empty
                                                const maxVal = Math.max(...(values.length ? values : [1]), 1);
                                                const W = 400; const H = 200;
                                                
                                                if (type === 'bar') {
                                                    const barW = (W - 40) / Math.max(values.length, 1) - 10;
                                                    return (
                                                        <g>
                                                            {values.map((v, i) => {
                                                                const h = (v / maxVal) * (H - 30);
                                                                return (
                                                                    <g key={i} transform={`translate(${30 + i * (barW + 10)}, ${H - Math.max(h, 1) - 15})`}>
                                                                        <rect width={barW} height={Math.max(h, 1)} fill="#10b981" rx="2" />
                                                                        <text x={barW/2} y={-5} textAnchor="middle" fontSize="10" fill="#6b7280">{v}</text>
                                                                        <text x={barW/2} y={Math.max(h, 1) + 12} textAnchor="middle" fontSize="10" fill="#6b7280">{labels[i] || `L${i}`}</text>
                                                                    </g>
                                                                )
                                                            })}
                                                            <line x1="20" y1={H - 14} x2={W - 10} y2={H - 14} stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
                                                        </g>
                                                    );
                                                }
                                                if (type === 'line') {
                                                    const spacing = (W - 60) / Math.max(values.length - 1, 1);
                                                    const points = values.map((v, i) => `${30 + i * spacing},${H - 20 - (v / maxVal) * (H - 40)}`).join(' ');
                                                    return (
                                                        <g>
                                                            <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" />
                                                            {values.map((v, i) => (
                                                                <g key={i}>
                                                                    <circle cx={30 + i * spacing} cy={H - 20 - (v / maxVal) * (H - 40)} r="4" fill="#3b82f6" />
                                                                    <text x={30 + i * spacing} y={H - 5} textAnchor="middle" fontSize="10" fill="#6b7280">{labels[i] || `L${i}`}</text>
                                                                </g>
                                                            ))}
                                                        </g>
                                                    );
                                                }
                                                if (type === 'pie') {
                                                    const sum = values.reduce((a, b) => a + Number(b), 0);
                                                    let currentAngle = 0;
                                                    const CX = W / 2; const CY = H / 2; const R = Math.min(W, H) / 2 - 20;
                                                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                                                    return (
                                                        <g>
                                                            {values.map((v, i) => {
                                                                const angle = sum > 0 ? (v / sum) * 360 : 0;
                                                                const startAngle = currentAngle;
                                                                currentAngle += angle;
                                                                
                                                                const x1 = CX + R * Math.cos((Math.PI * startAngle) / 180);
                                                                const y1 = CY + R * Math.sin((Math.PI * startAngle) / 180);
                                                                const x2 = CX + R * Math.cos((Math.PI * currentAngle) / 180);
                                                                const y2 = CY + R * Math.sin((Math.PI * currentAngle) / 180);
                                                                
                                                                const largeArcFlag = angle > 180 ? 1 : 0;
                                                                
                                                                // Label coords
                                                                const midAngle = startAngle + angle / 2;
                                                                const lx = CX + (R + 15) * Math.cos((Math.PI * midAngle) / 180);
                                                                const ly = CY + (R + 15) * Math.sin((Math.PI * midAngle) / 180);

                                                                const pathData = (values.length === 1 || angle >= 359.9)
                                                                    ? `M ${CX - R}, ${CY} a ${R},${R} 0 1,0 ${R*2},0 a ${R},${R} 0 1,0 -${R*2},0`
                                                                    : `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                                                return (
                                                                    <g key={i}>
                                                                        {angle > 0 && <path d={pathData} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />}
                                                                        {angle > 0 && <text x={lx} y={ly} textAnchor="middle" fontSize="10" fill="#4b5563" fontWeight="bold">{labels[i]}</text>}
                                                                    </g>
                                                                );
                                                            })}
                                                        </g>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Page Footer (Dynamic Numbering) */}
                    {page.type === 'standard' && !(actualIndex === 0 && differentFirstPage) && (
                        <div 
                           className="absolute bottom-8 left-24 right-24 border-t border-gray-200 pt-2 flex justify-between items-center z-20 cursor-text group/footer"
                           onDoubleClick={() => setEditingLayoutMode('footer')}
                        >
                            {editingLayoutMode === 'footer' ? (
                                <div className="flex-1 relative pointer-events-auto flex items-center justify-between w-full">
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#111] p-1 rounded shadow-xl border border-[#333]">
                                        <button onClick={() => setFooterConfig({...footerConfig, align: 'left'})} className="p-1 text-gray-400 hover:text-white" title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                                        <button onClick={() => setFooterConfig({...footerConfig, align: 'center'})} className="p-1 text-gray-400 hover:text-white" title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                                        <button onClick={() => setFooterConfig({...footerConfig, align: 'right'})} className="p-1 text-gray-400 hover:text-white" title="Align Right"><AlignRight className="w-3 h-3" /></button>
                                        <button onClick={() => setFooterConfig({...footerConfig, text: footerConfig.text + ' {PAGE_NUM}'})} className="p-1 text-gray-400 hover:text-emerald-400 font-bold text-[9px] uppercase tracking-wider ml-1 border-l border-gray-700 pl-2">Insert Pg#</button>
                                        <button onClick={() => setEditingLayoutMode(null)} className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold ml-2">Done</button>
                                    </div>
                                    <input 
                                        autoFocus
                                        value={footerConfig.text}
                                        onChange={e => setFooterConfig({...footerConfig, text: e.target.value})}
                                        className="w-full text-[10px] font-bold text-gray-800 uppercase tracking-widest outline-none bg-emerald-50 border-b border-emerald-500 px-1 py-1"
                                        style={{ textAlign: footerConfig.align as any, fontFamily: footerConfig.fontFamily }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full group-hover/footer:text-emerald-500 transition-colors">
                                    <div style={{ textAlign: footerConfig.align as any, fontFamily: footerConfig.fontFamily }} className="text-[10px] font-bold text-gray-400 tracking-widest uppercase flex-1">{footerConfig.text.replace('{PAGE_NUM}', `Page ${actualIndex + 1} of ${pages.length}`)}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Active Collaborators Panel */}
      <div className={`transition-all duration-300 bg-[#0c0c0c] border-l border-[#222] flex flex-col shrink-0 select-none ${isRightSidebarCollapsed ? 'w-14 px-1 py-3 items-center' : 'w-56 p-4'}`}>
          {isRightSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-4 w-full h-full">
                  <button 
                      onClick={() => setIsRightSidebarCollapsed(false)} 
                      title="Expand Collaborators"
                      className="p-1 rounded bg-[#161616] border border-[#222] hover:border-emerald-500 hover:text-emerald-400 text-gray-400 transition-colors"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex flex-col items-center gap-2 flex-1 w-full overflow-y-auto no-scrollbar">
                      {sessionsList.map((collab, idx) => {
                          const slot = getSessionColor(collab.email);
                          const initials = collab.fullName ? collab.fullName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : collab.email.substring(0,2).toUpperCase();
                          return (
                              <div 
                                  key={`${collab.email}-${idx}`}
                                  onClick={() => jumpToCollaborator(collab)}
                                  title={`${collab.fullName || collab.email} (Page ${collab.activePage} on ${collab.documentId})`}
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] uppercase font-bold shrink-0 cursor-pointer hover:scale-105 transition-transform ${slot.bg} ${slot.border}`}
                              >
                                  {initials}
                              </div>
                          );
                      })}
                      
                      {sessionsList.length === 0 && (
                          <span className="text-[8px] text-gray-600 font-mono rotate-90 my-4 tracking-widest uppercase">Offline</span>
                      )}
                  </div>
                  
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sync Status Live" />
              </div>
          ) : (
              <>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222222]/50">
                      <h2 className="text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          Live Users
                      </h2>
                      <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-gray-400 bg-gray-900 border border-gray-850 px-1.5 py-0.5 rounded-full font-mono">
                              {sessionsList.length}
                          </span>
                          <button 
                              onClick={() => setIsRightSidebarCollapsed(true)}
                              title="Collapse Panel"
                              className="p-1 rounded hover:bg-[#1f1f1f] text-gray-500 hover:text-white transition-colors"
                          >
                              <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                      </div>
                  </div>
                  
                  <p className="text-[9px] text-gray-500 mb-2.5 leading-relaxed">
                      Click to <span className="text-emerald-400 font-bold">jump to page</span> position:
                  </p>

                  {/* List area */}
                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-0.5">
                      {sessionsList.map((collab, idx) => {
                          const slot = getSessionColor(collab.email);
                          const isSelf = collab.email === localEmail;
                          const initials = collab.fullName ? collab.fullName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : collab.email.substring(0,2).toUpperCase();

                          return (
                              <div 
                                  key={`${collab.email}-${idx}`}
                                  onClick={() => jumpToCollaborator(collab)}
                                  className="bg-[#111111] hover:bg-[#151515] border border-[#222] hover:border-emerald-500/40 p-2 rounded text-[10px] cursor-pointer transition-all flex flex-col gap-1.5 relative group"
                              >
                                  <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] uppercase font-bold shrink-0 ${slot.bg} ${slot.border}`}>
                                          {initials}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                              <h4 className="font-bold text-gray-200 truncate pr-0.5 text-[10px]">
                                                  {collab.fullName || collab.email.split('@')[0]}
                                              </h4>
                                              {isSelf && (
                                                  <span className="text-[7px] bg-blue-900/30 text-blue-400 border border-blue-900/30 px-1 rounded uppercase font-black">Self</span>
                                              )}
                                          </div>
                                          <p className="text-[8px] text-gray-500 truncate lowercase leading-none">{collab.email}</p>
                                      </div>
                                  </div>

                                  <div className="flex flex-col gap-0.5 border-t border-[#1a1a1a] pt-1.5 text-[9px]">
                                      <div className="flex items-center justify-between">
                                          <span className="text-gray-500 text-[8px] uppercase tracking-wider font-extrabold font-sans">Draft</span>
                                          <span className="text-emerald-400 font-semibold bg-emerald-950/20 px-1 rounded font-mono text-[8px] truncate max-w-[90px]" title={collab.documentId}>
                                              {collab.documentId}
                                          </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                          <span className="text-gray-500 text-[8px] uppercase tracking-wider font-extrabold font-sans">Active Page</span>
                                          <span className="text-amber-400 font-bold font-mono">
                                              Page {collab.activePage}
                                          </span>
                                      </div>
                                  </div>

                                  {/* Hover integrated page jump overlay indicator */}
                                  <div className="absolute inset-0 bg-emerald-500/5 border border-emerald-500/30 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-[9px] font-black text-emerald-400 uppercase bg-[#0a0a0a] px-2 py-0.5 border border-emerald-500/30 rounded shadow-md tracking-wider">
                                          Jump
                                      </span>
                                  </div>
                              </div>
                          );
                      })}

                      {sessionsList.length === 0 && (
                          <div className="p-3 text-center border border-dashed border-[#222] rounded text-gray-600 text-[9px] italic">
                              Offline Mode
                          </div>
                      )}
                  </div>

                  {/* Bottom presence sync indicator */}
                  <div className="mt-2.5 pt-2 border-t border-[#222] flex items-center justify-between text-[9px]">
                      <span className="uppercase font-bold text-gray-500 flex items-center gap-1 font-mono">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                          Live Sync
                      </span>
                      <span className="text-gray-500 font-mono tracking-tight font-black uppercase bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#2a2a2a] text-[8px]">
                          V10
                      </span>
                  </div>
              </>
          )}
      </div>

      {chartModalState && chartModalState.isOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#111] border border-[#222] p-6 rounded-xl shadow-2xl w-[400px]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white text-sm font-bold uppercase tracking-widest">Chart Data Editor</h3>
                      <button onClick={() => setChartModalState(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                     {['bar', 'line', 'pie'].map(t => (
                         <button 
                            key={t}
                            onClick={() => setChartModalState(prev => prev ? {...prev, data: {...prev.data, type: t as any}} : null)}
                            className={`flex-1 py-1 text-xs uppercase font-bold tracking-wider rounded ${chartModalState.data.type === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-[#222] text-gray-500 border border-transparent hover:border-gray-600'}`}
                         >
                             {t}
                         </button>
                     ))}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto mb-4 border border-[#333] rounded">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-[#161616] text-gray-400">
                              <tr>
                                  <th className="p-2 border-b border-[#333]">Label</th>
                                  <th className="p-2 border-b border-[#333]">Value</th>
                                  <th className="p-2 border-b border-[#333] w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="bg-[#0f0f0f]">
                              {chartModalState.data.labels.map((lbl, idx) => (
                                 <tr key={idx} className="border-b border-[#222]">
                                     <td className="p-1">
                                         <input 
                                            value={lbl}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setChartModalState(prev => {
                                                    if(!prev) return prev;
                                                    const newLabels = [...prev.data.labels];
                                                    newLabels[idx] = v;
                                                    return {...prev, data: {...prev.data, labels: newLabels}};
                                                });
                                            }}
                                            className="w-full bg-transparent border-none outline-none text-white focus:bg-[#222] px-1 py-1 rounded"
                                         />
                                     </td>
                                     <td className="p-1">
                                         <input 
                                            type="number"
                                            value={chartModalState.data.values[idx] || 0}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setChartModalState(prev => {
                                                    if(!prev) return prev;
                                                    const newValues = [...prev.data.values];
                                                    newValues[idx] = v;
                                                    return {...prev, data: {...prev.data, values: newValues}};
                                                });
                                            }}
                                            className="w-full bg-transparent border-none outline-none text-white focus:bg-[#222] px-1 py-1 rounded"
                                         />
                                     </td>
                                     <td className="p-1 text-center">
                                         <button 
                                            onClick={() => {
                                                setChartModalState(prev => {
                                                    if(!prev) return prev;
                                                    const newLabels = prev.data.labels.filter((_, i) => i !== idx);
                                                    const newValues = prev.data.values.filter((_, i) => i !== idx);
                                                    return {...prev, data: {...prev.data, labels: newLabels, values: newValues}};
                                                });
                                            }}
                                            className="text-red-500 hover:text-red-400 p-1"
                                         >
                                             <X className="w-3 h-3" />
                                         </button>
                                     </td>
                                 </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="flex gap-2">
                      <button 
                          onClick={() => {
                              setChartModalState(prev => {
                                  if(!prev) return prev;
                                  return {...prev, data: {...prev.data, labels: [...prev.data.labels, `New ${prev.data.labels.length+1}`], values: [...prev.data.values, 10]}};
                              });
                          }}
                          className="flex-1 py-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded text-emerald-400 text-xs font-bold uppercase tracking-wider"
                      >
                          Add Row
                      </button>
                      <button 
                          onClick={() => {
                              setPages(prev => prev.map(p => {
                                  if (p.id !== chartModalState.pageId) return p;
                                  return {
                                      ...p,
                                      blocks: p.blocks.map(b => b.id === chartModalState.blockId ? { ...b, chartData: chartModalState.data } : b)
                                  }
                              }));
                              setChartModalState(null);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-wider"
                      >
                          Apply Data
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isPastingProgress !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
              <div className="bg-[#121212] border border-[#2a2a2a] p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-[450px] text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                      <h3 className="text-white text-lg font-bold tracking-tight">Ingesting Clipboard Content</h3>
                      <p className="text-gray-400 text-xs">Evaluating and transforming styled elements to native pages asynchronously...</p>
                  </div>
                  <div className="space-y-2">
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-300"
                             style={{ width: `${isPastingProgress}%` }}
                          ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                          <span>PARSING CONTENT</span>
                          <span>{isPastingProgress}% COMPLETED</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
