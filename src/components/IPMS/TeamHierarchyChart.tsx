import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, List, HelpCircle } from 'lucide-react';

interface HierarchyNode {
  name: string;
  email: string;
  role: string;
  children?: HierarchyNode[];
  kpiCompletion?: number;
  recentScore?: string;
  isBonusEligible?: boolean;
}

interface TeamHierarchyChartProps {
  data: HierarchyNode;
  teamPlans?: any[];
  selectedQuarter?: string;
  onQuarterChange?: (q: string) => void;
  onSelectUser?: (email: string) => void;
  onViewUserReport?: (email: string) => void;
}

const getLevelStyles = (depth: number) => {
  switch (depth) {
    case 0:
      return {
        bg: 'bg-indigo-50 border-indigo-500 hover:bg-indigo-100/80',
        text: 'text-indigo-900',
        roleText: 'text-indigo-600',
        badge: 'bg-indigo-600 text-indigo-50',
        avatarBg: 'bg-indigo-200 text-indigo-800',
        dot: 'bg-indigo-500',
        levelLabel: 'Executive'
      };
    case 1:
      return {
        bg: 'bg-teal-50 border-teal-500 hover:bg-teal-100/80',
        text: 'text-teal-900',
        roleText: 'text-teal-600',
        badge: 'bg-teal-600 text-teal-50',
        avatarBg: 'bg-teal-200 text-teal-800',
        dot: 'bg-teal-500',
        levelLabel: 'Management'
      };
    case 2:
      return {
        bg: 'bg-rose-50 border-rose-500 hover:bg-rose-100/80',
        text: 'text-rose-900',
        roleText: 'text-rose-600',
        badge: 'bg-rose-600 text-rose-50',
        avatarBg: 'bg-rose-200 text-rose-800',
        dot: 'bg-rose-500',
        levelLabel: 'Team Lead'
      };
    case 3:
      return {
        bg: 'bg-sky-50 border-sky-500 hover:bg-sky-100/80',
        text: 'text-sky-900',
        roleText: 'text-sky-600',
        badge: 'bg-sky-600 text-sky-50',
        avatarBg: 'bg-sky-200 text-sky-800',
        dot: 'bg-sky-500',
        levelLabel: 'Senior Officer'
      };
    default:
      return {
        bg: 'bg-amber-50 border-amber-500 hover:bg-amber-100/80',
        text: 'text-amber-900',
        roleText: 'text-amber-600',
        badge: 'bg-amber-600 text-amber-50',
        avatarBg: 'bg-amber-200 text-amber-800',
        dot: 'bg-amber-500',
        levelLabel: 'Officer/Staff'
      };
  }
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

export const TeamHierarchyChart: React.FC<TeamHierarchyChartProps> = ({ 
  data, 
  teamPlans = [],
  selectedQuarter = 'all',
  onQuarterChange,
  onSelectUser,
  onViewUserReport
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isExpandedPanel, setIsExpandedPanel] = useState<boolean>(false);

  // Toggle collapse state on a node
  const toggleCollapse = (email: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      const key = email.toLowerCase();
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    setCollapsedNodes(new Set());
  };

  // Collapse all nodes (except the root)
  const collapseAll = () => {
    const collapsed = new Set<string>();
    const recurse = (node: HierarchyNode) => {
      if (node.children && node.children.length > 0) {
        collapsed.add(node.email.toLowerCase());
        node.children.forEach(recurse);
      }
    };
    recurse(data);
    setCollapsedNodes(collapsed);
  };

  // SVG calculations based on hierarchy layout
  const layout = useMemo(() => {
    if (!data) return null;

    // Use D3 to build hierarchy tree, omitting children for collapsed nodes
    const root = d3.hierarchy<HierarchyNode>(data, d => {
      const emailKey = d.email.toLowerCase();
      return collapsedNodes.has(emailKey) ? null : d.children;
    });

    // Vertical spacing 85px, Horizontal level separation 260px
    const treeLayout = d3.tree<HierarchyNode>().nodeSize([85, 260]);
    treeLayout(root);

    // Compute bounding boxes to perfectly center the tree in the SVG coordinates
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;

    root.each((d: any) => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
      if (d.y < y0) y0 = d.y;
      if (d.y > y1) y1 = d.y;
    });

    // Safe fallbacks for single nodes or lists
    if (x0 === Infinity) { x0 = -30; x1 = 30; }
    if (y0 === Infinity) { y0 = 0; y1 = 200; }

    const padding = 60;
    // Each node has width 190. Adding +220 avoids any overflow on the right
    const svgWidth = (y1 - y0) + padding * 2 + 220;
    const svgHeight = (x1 - x0) + padding * 2;

    const nodes = root.descendants();
    const links = root.links();

    return {
      nodes,
      links,
      svgWidth,
      svgHeight,
      offsetX: padding - y0,
      offsetY: padding - x0
    };
  }, [data, collapsedNodes]);

  const handleZoomIn = () => setZoomScale(z => Math.min(1.5, z + 0.1));
  const handleZoomOut = () => setZoomScale(z => Math.max(0.6, z - 0.1));
  const handleZoomReset = () => setZoomScale(1.0);

  if (!data || !layout) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-white border border-slate-200 rounded-xl">
        Waiting for organogram structure data...
      </div>
    );
  }

  const { nodes, links, svgWidth, svgHeight, offsetX, offsetY } = layout;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-col min-h-0">
      
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Interactive Organogram & Reporting Line
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Click on cards to view performance profiles. Use <span className="text-emerald-600 font-bold font-mono">+/-</span> badges to expand reporting branches.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Collapse/Expand States */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              onClick={expandAll}
              className="text-[10px] font-black text-slate-600 hover:bg-white hover:text-slate-900 transition-all rounded px-2 py-1 uppercase tracking-wider"
              title="Expand all nodes"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-[10px] font-black text-slate-600 hover:bg-white hover:text-slate-900 transition-all rounded px-2 py-1 uppercase tracking-wider"
              title="Collapse all reporting lines"
            >
              Collapse All
            </button>
          </div>

          {/* Zoom Level */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-600">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-white hover:text-slate-900 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 min-w-[36px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-white hover:text-slate-900 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleZoomReset}
              className="p-1 hover:bg-white hover:text-slate-900 rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sizing Toggle */}
          <button
            onClick={() => setIsExpandedPanel(!isExpandedPanel)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-950 border border-slate-200 rounded-lg transition-all uppercase tracking-wider"
            title="Toggle expanded fullscreen height"
          >
            {isExpandedPanel ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-rose-500" />
                Standard Pane
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                Expand Pane
              </>
            )}
          </button>
        </div>
      </div>

      {/* COLOR LEGEND */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50/55 rounded-xl border border-slate-100 p-2.5 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span className="text-slate-400 font-extrabold flex items-center gap-1">
          <List className="w-3 h-3 text-slate-500" /> Key:
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Executive
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Management
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Team Lead
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Sr. Officer
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Staff
        </span>
      </div>

      {/* CANVAS ELEMENT */}
      <div 
        className={`w-full bg-slate-50/60 rounded-2xl border border-slate-200 shadow-inner overflow-auto cursor-grab active:cursor-grabbing relative ${
          isExpandedPanel ? 'h-[620px]' : 'h-[360px]'
        } transition-all duration-300`}
      >
        <svg 
          style={{
            width: `${svgWidth * zoomScale}px`,
            height: `${svgHeight * zoomScale}px`,
            minWidth: '100%',
          }}
          className="mx-auto transition-all duration-150 transform-gpu"
        >
          {/* Inner Content holding all visual objects */}
          <g transform={`scale(${zoomScale})`}>
            {/* Translated Group to Center Coordinates */}
            <g transform={`translate(${offsetX}, ${offsetY})`}>
              
              {/* BEZIER LINES */}
              {links.map((link: any, idx) => {
                const s = { y: link.source.y, x: link.source.x };
                const t = { y: link.target.y, x: link.target.x };
                
                // Colors matching the destination node's depth level for beautiful gradient mapping
                const depthStyles = getLevelStyles(link.target.depth);
                
                const pathData = `M ${s.y + 190} ${s.x}
                                  C ${(s.y + t.y + 190) / 2} ${s.x},
                                    ${(s.y + t.y + 190) / 2} ${t.x},
                                    ${t.y} ${t.x}`;

                return (
                  <path
                    key={`link-${idx}`}
                    d={pathData}
                    fill="none"
                    stroke={link.target.depth === 1 ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth={link.target.depth === 1 ? 2.5 : 2}
                    className="transition-all duration-300 stroke-slate-300 opacity-80"
                  />
                );
              })}

              {/* CARD NODES */}
              {nodes.map((node: any, idx) => {
                const { x, y, depth } = node;
                const user = node.data;
                const styles = getLevelStyles(depth);
                
                const hasChildren = user.children && user.children.length > 0;
                const isCollapsed = collapsedNodes.has(user.email.toLowerCase());

                // Find matching user plan metrics
                const userEmail = (user.email || '').toLowerCase().trim();
                const userPlanObj = teamPlans.find(p => (p.userId || '').toLowerCase().trim() === userEmail);
                const items: any[] = userPlanObj?.plan?.items || [];

                let metExceededCount = 0;
                items.forEach(i => {
                  let s = 0;
                  if (selectedQuarter === 'Q1') {
                    s = parseFloat(i.q1Score || i.q1_score || '0');
                  } else if (selectedQuarter === 'Q2') {
                    s = parseFloat(i.q2Score || i.q2_score || '0');
                  } else if (selectedQuarter === 'Q3') {
                    s = parseFloat(i.q3Score || i.q3_score || '0');
                  } else if (selectedQuarter === 'Q4') {
                    s = parseFloat(i.q4Score || i.q4_score || '0');
                  } else {
                    const validScores = ['dpmcScore', 'internalAuditorScore', 'managerScore', 'q1Score', 'q2Score', 'q3Score', 'q4Score', 'score', 'evalScore']
                      .map(k => parseFloat(i[k] || '0'))
                      .filter(sc => !isNaN(sc) && sc > 0);
                    s = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
                  }
                  if (s >= 3) metExceededCount++;
                });

                const totalKpis = items.length;
                const qualRate = totalKpis > 0 ? Math.round((metExceededCount / totalKpis) * 100) : 0;
                const isBonusEligible = totalKpis > 0 && qualRate >= 65;

                return (
                  <g key={`node-${idx}`} className="transition-all duration-300">
                    
                    {/* SVG card container using standard foreignObject */}
                    <foreignObject
                      x={y}
                      y={x - 34} // Center-aligned vertically (68px height / 2)
                      width={210}
                      height={68}
                      className="overflow-visible"
                    >
                      <div 
                        onClick={() => onSelectUser && onSelectUser(user.email)}
                        className={`w-full h-full rounded-xl border-2 p-1.5 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 text-left group select-none relative ${styles.bg}`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Circle Avatar badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 shadow-inner ${styles.avatarBg}`}>
                            {getInitials(user.name)}
                          </div>

                          {/* Title and details */}
                          <div className="flex-1 min-w-0 pr-1">
                            <div className={`text-[10px] font-black truncate leading-tight group-hover:underline ${styles.text}`}>
                              {user.name}
                            </div>
                            <div className={`text-[8px] font-bold uppercase tracking-tight truncate mt-0.5 ${styles.roleText}`}>
                              {user.role}
                            </div>
                          </div>
                        </div>

                        {/* Real-time KPI & Bonus Badge Strip */}
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 mt-1 text-[8px] font-bold">
                          <span className={isBonusEligible ? "text-emerald-700 font-extrabold flex items-center gap-0.5" : "text-amber-700 flex items-center gap-0.5"}>
                            <span className={isBonusEligible ? "w-1.5 h-1.5 rounded-full bg-emerald-500" : "w-1.5 h-1.5 rounded-full bg-amber-500"} />
                            {isBonusEligible ? '★ Bonus Qualified' : `${qualRate}% Met (<65%)`}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewUserReport) onViewUserReport(user.email);
                            }}
                            className="px-1.5 py-0.5 bg-slate-900 text-white hover:bg-slate-800 rounded text-[7.5px] font-black uppercase tracking-wider cursor-pointer"
                            title="View Full Performance Report"
                          >
                            Report
                          </button>
                        </div>

                      </div>
                    </foreignObject>

                    {/* EXPANSION TOGGLE CIRCLE */}
                    {hasChildren && (
                      <g
                        className="cursor-pointer group/toggle"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleCollapse(user.email);
                        }}
                        transform={`translate(${y + 210}, ${x})`}
                      >
                        <circle
                          r={8}
                          className={`fill-white stroke-2 shadow transition-colors ${
                            isCollapsed
                              ? 'stroke-emerald-600 fill-emerald-50 group-hover/toggle:fill-emerald-100'
                              : 'stroke-rose-500 fill-rose-50 group-hover/toggle:fill-rose-100'
                          }`}
                        />
                        <text
                          textAnchor="middle"
                          dy=".33em"
                          className={`font-mono text-[9px] font-black select-none ${
                            isCollapsed ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                          style={{ pointerEvents: 'none' }}
                        >
                          {isCollapsed ? '+' : '-'}
                        </text>
                      </g>
                    )}

                  </g>
                );
              })}

            </g>
          </g>
        </svg>
      </div>

    </div>
  );
};
