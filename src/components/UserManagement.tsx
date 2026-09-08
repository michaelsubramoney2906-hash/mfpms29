import React, { useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { tenants } from '../data';
import { 
  Users, UserPlus, FileSpreadsheet, Key, ShieldCheck, 
  RefreshCw, CheckCircle2, AlertTriangle, Upload, 
  Search, KeyRound, Edit, PenTool, Monitor, Globe, Activity
} from 'lucide-react';
import { cn } from './Branding';
import { PerformanceMonitor } from './Admin/PerformanceMonitor';

interface UserManagementProps {
  currentUser: User;
  activeTenantId: string;
  onImpersonate?: (user: User) => void;
}

const DIRECTORATES = [
  "Office of the Municipal Manager",
  "Corporate Services",
  "Financial Services",
  "Community Services",
  "Technical Services",
  "Planning and Economic Development"
];

export function UserManagement({ currentUser, activeTenantId, onImpersonate }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'azure' | 'sessions' | 'perf'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [azureConfig, setAzureConfig] = useState({
    clientId: '',
    directoryTenantId: '',
    secretValue: ''
  });
  const [azureStatus, setAzureStatus] = useState<{ type: 'success'|'error', msg: string } | null>(null);

  const [isWifiRestricted, setIsWifiRestricted] = useState(false);
  const [allowedWifiIps, setAllowedWifiIps] = useState('');
  const [currentClientIp, setCurrentClientIp] = useState('');
  const [wifiSaveStatus, setWifiSaveStatus] = useState<{ type: 'success'|'error', msg: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [municipalities, setMunicipalities] = useState<Tenant[]>(tenants);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const res = await fetch("/api/municipalities");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setMunicipalities(list);
          }
        }
      } catch (err) {
        console.error("Error fetching municipalities from Supabase:", err);
      }
    };
    fetchMunicipalities();
  }, []);

  const [azureTargetTenantId, setAzureTargetTenantId] = useState<string>(activeTenantId === 'global' ? tenants[0].id : activeTenantId);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionFetchTime, setSessionFetchTime] = useState<string>('');

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`/api/tenant/${azureTargetTenantId}/active-sessions`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.sessions || []).sort((a: any, b: any) => 
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
        );
        setActiveSessions(sorted);
        setSessionFetchTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Error loading active sessions:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchActiveSessions();
      const sInterval = setInterval(fetchActiveSessions, 10000);
      return () => clearInterval(sInterval);
    }
  }, [activeTab, azureTargetTenantId]);

  // Manual Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '',
    birthday: '',
    gender: '',
    cellPhone: '',
    residentialAddress: '',
    jobFunction: '',
    reportTo: '',
    directorate: '',
    manager: '',
    department: '',
    systemRole: 'Standard User',
    selectedTenant: activeTenantId, // For global admin
    level: '1'
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTenantId]);

  useEffect(() => {
    if (activeTenantId !== 'global') {
      setAzureTargetTenantId(activeTenantId);
    } else {
      // Just ensure it's a valid local tenant id when switching to global, maybe keep it same if it's already one of them
      if (!municipalities.find(t => t.id === azureTargetTenantId)) {
        setAzureTargetTenantId(municipalities[0]?.id || 'tenant-1');
      }
    }
  }, [activeTenantId, municipalities]);

  useEffect(() => {
    fetchAzureConfigFor(azureTargetTenantId);
  }, [azureTargetTenantId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Keep manual form tenant in sync if changed via top dropdown
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      selectedTenant: activeTenantId === 'global' ? (municipalities[0]?.id || 'tenant-1') : activeTenantId 
    }));
  }, [activeTenantId, municipalities]);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [reportToSearchQuery, setReportToSearchQuery] = useState('');
  const [jobSearchResults, setJobSearchResults] = useState<any[]>([]);
  const [managerSearchResults, setManagerSearchResults] = useState<any[]>([]);
  const [reportToSearchResults, setReportToSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobSearch = async () => {
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(jobSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setJobSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchJobSearch();
  }, [jobSearchQuery]);

  useEffect(() => {
    const fetchManagerSearch = async () => {
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(managerSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setManagerSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchManagerSearch();
  }, [managerSearchQuery]);

  useEffect(() => {
    const fetchReportToSearch = async () => {
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(reportToSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setReportToSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchReportToSearch();
  }, [reportToSearchQuery]);

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    jobFunction: '',
    reportTo: '',
    department: '',
    directorate: '',
    manager: '',
    systemRole: 'Standard User',
    signatureType: 'draw',
    signatureData: '',
    level: '1'
  });

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wacomCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const lastPosRef = React.useRef({ x: 0, y: 0 });
  const lastWacomPosRef = React.useRef<{ x: number, y: number } | null>(null);
  const isWacomDrawingRef = React.useRef(false);
  const wacomMaxXRef = React.useRef<number>(9600);
  const wacomMaxYRef = React.useRef<number>(6000);
  const wacomWsRef = React.useRef<WebSocket | null>(null);
  const wacomStrokesRef = React.useRef<{ x: number, y: number, pressure: number }[][]>([]);
  const wacomCurrentStrokeRef = React.useRef<{ x: number, y: number, pressure: number }[]>([]);
  const wacomSaveTimeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Clear Wacom buffer memory to prevent cross-user data remnants or leaks
    wacomStrokesRef.current = [];
    wacomCurrentStrokeRef.current = [];
    lastWacomPosRef.current = null;
    isWacomDrawingRef.current = false;
  }, [editingUser?.id]);

  const [wacomStatus, setWacomStatus] = useState<'searching' | 'connected' | 'offline'>('searching');
  const [wacomLog, setWacomLog] = useState<string>('');
  const [detectedSource, setDetectedSource] = useState<string>('Ready (Awaiting input...)');

  const updateSourceHeuristic = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') {
      setDetectedSource('Wacom STU-430/G Hardware Stylus');
      return;
    }
    
    if (e.pointerType === 'touch') {
      setDetectedSource('Internal Capacitive Touchscreen');
      return;
    }

    if (e.pointerType === 'mouse') {
      const hasDecimals = (e.clientX % 1 !== 0) || (e.clientY % 1 !== 0) || 
                          (e.movementX && e.movementX % 1 !== 0) || 
                          (e.movementY && e.movementY % 1 !== 0);
                          
      if (hasDecimals) {
        setDetectedSource('Internal Laptop Trackpad / Mouse');
      } else {
        setDetectedSource('External USB Mouse');
      }
    }
  };

  const wacomHidDeviceRef = React.useRef<any>(null);
  const wacomTabletRef = React.useRef<any>(null);

  const connectWacomHID = async (device: any) => {
    try {
      if (!device.opened) {
        await device.open();
      }
      setWacomStatus('connected');
      setWacomLog(`SUCCESS: Connected to Wacom ${device.productName || 'STU-430/G'} via native WebHID API!`);
      setDetectedSource(`Wacom WebHID (${device.productName || 'STU-430/G'})`);

      // Add input report listener with auto-detectable byte offsets and resilient pen state detection
      device.oninputreport = (event: any) => {
        const { data } = event;
        if (!data) return;

        let rawX = 0;
        let rawY = 0;
        let rawPressure = 0;
        let isPenDown = false;

        if (data.byteLength >= 7) {
          // Format 1 (Report ID stripped): Status at 0, X at 1-2, Y at 3-4, Pressure at 5-6
          const x1 = data.getUint16(1, true);
          const y1 = data.getUint16(3, true);
          const p1 = data.getUint16(5, true);

          // Format 2 (Report ID included / offset shifted): Status at 1, X at 2-3, Y at 4-5, Pressure at 6-7
          const x2 = data.byteLength >= 8 ? data.getUint16(2, true) : 0;
          const y2 = data.byteLength >= 8 ? data.getUint16(4, true) : 0;
          const p2 = data.byteLength >= 8 ? data.getUint16(6, true) : 0;

          // Determine formatting dynamically based on reasonable coordinate ranges for Wacom digitizers
          if (x1 > 0 && x1 <= 12000 && y1 > 0 && y1 <= 8000) {
            rawX = x1;
            rawY = y1;
            rawPressure = p1;
            isPenDown = (data.getUint8(0) & 0x01) === 1 || rawPressure > 0;
          } else if (x2 > 0 && x2 <= 12000 && y2 > 0 && y2 <= 8000) {
            rawX = x2;
            rawY = y2;
            rawPressure = p2;
            isPenDown = (data.getUint8(1) & 0x01) === 1 || rawPressure > 0;
          } else {
            // Default fallback
            rawX = x1;
            rawY = y1;
            rawPressure = p1;
            isPenDown = rawPressure > 0;
          }

          // Force touch state to pen down if positive contact pressure is registered
          if (rawPressure > 5) {
            isPenDown = true;
          }

          if (isPenDown && rawX > 0 && rawY > 0) {
            drawWacomPoint(rawX, rawY, rawPressure);
          } else {
            // Pen lifted or out of proximity range
            drawWacomPoint(rawX, rawY, 0);
          }
        }
      };

      wacomHidDeviceRef.current = device;
    } catch (err: any) {
      setWacomStatus('offline');
      setWacomLog("Failed to open WebHID device: " + err.message);
    }
  };

  const pairWacomWebHID = async () => {
    const nav = navigator as any;
    if (!nav.hid) {
      setWacomLog("Error: WebHID is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.");
      return;
    }
    try {
      setWacomStatus('searching');
      setWacomLog("Awaiting user permission to access Wacom STU device...");
      const devices = await nav.hid.requestDevice({
        filters: [
          { vendorId: 0x056a } // Wacom Co., Ltd.
        ]
      });
      if (devices && devices.length > 0) {
        await connectWacomHID(devices[0]);
      } else {
        setWacomStatus('offline');
        setWacomLog("No Wacom device selected.");
      }
    } catch (err: any) {
      setWacomStatus('offline');
      setWacomLog("WebHID connection failed: " + err.message);
    }
  };

  // Auto-connect to previously paired WebHID devices and cleanup
  useEffect(() => {
    if (!editingUser || editFormData.signatureType !== 'wacom') {
      return;
    }
    const checkPreviouslyPaired = async () => {
      const nav = navigator as any;
      if (nav.hid) {
        try {
          const devices = await nav.hid.getDevices();
          const wacomDevice = devices.find((d: any) => d.vendorId === 0x056a);
          if (wacomDevice) {
            setWacomLog("Found previously paired Wacom WebHID device. Connecting...");
            await connectWacomHID(wacomDevice);
          }
        } catch (e) {}
      }
    };
    checkPreviouslyPaired();

    // Clean up WebHID device on unmount/mode change
    return () => {
      if (wacomHidDeviceRef.current) {
        try {
          wacomHidDeviceRef.current.close();
        } catch (e) {}
        wacomHidDeviceRef.current = null;
      }
    };
  }, [editingUser, editFormData.signatureType]);

  const drawWacomGrid = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw signature line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Draw small "X" on the signature line
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('X', 40, canvas.height - 48);

    // Draw small helpful instructions on the bottom
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Wacom STU-430/G Interactive LCD Sign-Off Screen', canvas.width / 2, canvas.height - 15);
  };

  useEffect(() => {
    if (!editingUser || editFormData.signatureType !== 'wacom') {
      return;
    }
    
    let aborted = false;

    const startWacomSTU = async () => {
      if (aborted) return;
      setWacomStatus('searching');
      setWacomLog('Searching for local Wacom SigCaptX Web Service...');

      try {
        const WacomGSS = (window as any).WacomGSS;
        if (!WacomGSS || !WacomGSS.STU) {
          throw new Error("Wacom SigCaptX library not loaded. Make sure the Wacom service is installed and running.");
        }

        const isReady = await WacomGSS.STU.isDCAReady();
        if (!isReady) {
          throw new Error("Device Control App not ready. SigCaptX service might not be running locally.");
        }

        const devices = await WacomGSS.STU.getUsbDevices();
        if (!devices || devices.length === 0) {
          throw new Error("No Wacom STU devices found. Please plug in the pad.");
        }

        const usbDevice = devices[0];
        const isSupported = await WacomGSS.STU.isSupportedUsbDevice(usbDevice.idVendor, usbDevice.idProduct);
        if (!isSupported) {
          throw new Error("Unsupported Wacom STU device.");
        }

        const intf = new WacomGSS.STU.UsbInterface();
        await intf.Constructor();
        await intf.connect(usbDevice, true);

        const tablet = new WacomGSS.STU.Tablet();
        await tablet.Constructor(intf, null, null);

        if (aborted) {
          tablet.disconnect();
          return;
        }

        wacomTabletRef.current = tablet;

        const capability = await tablet.getCapability();
        wacomMaxXRef.current = capability.tabletMaxX;
        wacomMaxYRef.current = capability.tabletMaxY;

        const p = new WacomGSS.STU.Protocol();
        const supportsPenDataOptionMode = await tablet.isSupported(p.ReportId.ReportId_PenDataOptionMode);
        
        if (supportsPenDataOptionMode) {
          const productId = await tablet.getProductId();
          let penDataOptionMode = p.PenDataOptionMode.PenDataOptionMode_None;
          switch (productId) {
            case WacomGSS.STU.ProductId.ProductId_520A:
              penDataOptionMode = p.PenDataOptionMode.PenDataOptionMode_TimeCount;
              break;
            case WacomGSS.STU.ProductId.ProductId_430:
            case WacomGSS.STU.ProductId.ProductId_530:
            case WacomGSS.STU.ProductId.ProductId_540:
              penDataOptionMode = p.PenDataOptionMode.PenDataOptionMode_TimeCountSequence;
              break;
          }
          await tablet.setPenDataOptionMode(penDataOptionMode);
        }

        await tablet.setClearScreen();
        // Explicitly trigger setInkingMode(0x01) so ink renders on the pad
        await tablet.setInkingMode(0x01); 

        if (aborted) return;
        setWacomStatus('connected');
        setWacomLog(`SUCCESS: Connected to Wacom STU pad via SigCaptX! Ready to capture signatures.`);

        const reportHandler = new WacomGSS.STU.ProtocolHelper.ReportHandler();

        const onPenData = (report: any) => {
          if (aborted) return;
          const { x, y, pressure } = report;
          setDetectedSource('Wacom STU-430/G USB Hardware Tablet');
          drawWacomPoint(x, y, pressure);
        };

        reportHandler.onReportPenData = onPenData;
        reportHandler.onReportPenDataOption = onPenData;
        reportHandler.onReportPenDataTimeCountSequence = onPenData;
        reportHandler.onReportPenDataEncrypted = (report: any) => { onPenData(report.penData[0]); onPenData(report.penData[1]); };
        reportHandler.onReportPenDataEncryptedOption = reportHandler.onReportPenDataEncrypted;
        reportHandler.onReportPenDataTimeCountSequenceEncrypted = onPenData;

        await reportHandler.startReporting(tablet, true);

      } catch (err: any) {
        if (!aborted) {
          setWacomStatus('offline');
          setWacomLog(err.message || 'Wacom STU-430/G not detected. Make sure the Wacom SigCaptX service is running locally.');
        }
      }
    };

    startWacomSTU();

    return () => {
      aborted = true;
      if (wacomTabletRef.current) {
        try {
          wacomTabletRef.current.setClearScreen().then(() => {
             wacomTabletRef.current.disconnect();
             wacomTabletRef.current = null;
          }).catch(() => {
             wacomTabletRef.current.disconnect();
             wacomTabletRef.current = null;
          });
        } catch (e) {}
      }
    };
  }, [editingUser, editFormData.signatureType]);

  // Helper to draw a stroke of points smoothly
  const drawWacomStroke = (ctx: CanvasRenderingContext2D, strokePoints: { x: number, y: number, pressure: number }[], scale: number = 1) => {
    if (strokePoints.length === 0) return;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Premium dark charcoal blue ink
    ctx.lineWidth = 3.5 * scale; // Highly visible line width
    
    if (strokePoints.length === 1) {
      ctx.beginPath();
      ctx.arc(strokePoints[0].x * scale, strokePoints[0].y * scale, 1.75 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      return;
    }
    
    ctx.beginPath();
    ctx.moveTo(strokePoints[0].x * scale, strokePoints[0].y * scale);
    
    for (let i = 1; i < strokePoints.length; i++) {
      ctx.lineTo(strokePoints[i].x * scale, strokePoints[i].y * scale);
    }
    ctx.stroke();
  };

  const redrawAllWacomStrokes = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWacomGrid(canvas, ctx);
    
    // Draw all previously completed strokes
    wacomStrokesRef.current.forEach(stroke => {
      drawWacomStroke(ctx, stroke);
    });
    
    // Draw the active stroke in progress
    drawWacomStroke(ctx, wacomCurrentStrokeRef.current);
  };

  const drawWacomPoint = (x: number, y: number, pressure: number) => {
    const canvas = wacomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle physical pen lift / release
    if (pressure === 0) {
      if (wacomCurrentStrokeRef.current.length > 0) {
        wacomStrokesRef.current.push([...wacomCurrentStrokeRef.current]);
        wacomCurrentStrokeRef.current = [];
        isWacomDrawingRef.current = false;
        lastWacomPosRef.current = null;
      }
      return;
    }

    // Auto-detect coordinate scale dynamically:
    // 1. High-resolution coordinate space (e.g. STU-430 physical resolution 9600x6000)
    // 2. Local viewport coordinate space (e.g. 800x500 screen pixels)
    let mappedX = x;
    let mappedY = y;

    if (x > 1000 || y > 1000) {
      const maxX = Math.max(9600, wacomMaxXRef.current, x);
      const maxY = Math.max(6000, wacomMaxYRef.current, y);
      wacomMaxXRef.current = maxX;
      wacomMaxYRef.current = maxY;
      
      mappedX = (x / maxX) * canvas.width;
      mappedY = (y / maxY) * canvas.height;
    } else {
      const maxX = Math.max(800, wacomMaxXRef.current > 1000 ? 800 : wacomMaxXRef.current, x);
      const maxY = Math.max(500, wacomMaxYRef.current > 1000 ? 500 : wacomMaxYRef.current, y);
      
      let tempMaxX = wacomMaxXRef.current > 1000 ? 800 : wacomMaxXRef.current;
      let tempMaxY = wacomMaxYRef.current > 1000 ? 500 : wacomMaxYRef.current;
      
      wacomMaxXRef.current = Math.max(tempMaxX, x);
      wacomMaxYRef.current = Math.max(tempMaxY, y);
      
      mappedX = (x / wacomMaxXRef.current) * canvas.width;
      mappedY = (y / wacomMaxYRef.current) * canvas.height;
    }

    // Record point in active stroke
    wacomCurrentStrokeRef.current.push({ x: mappedX, y: mappedY, pressure });
    isWacomDrawingRef.current = true;

    // Redraw entire canvas with smoothed points
    redrawAllWacomStrokes(canvas, ctx);

    // Debounce state update to avoid high-frequency canvas.toDataURL() performance lag
    if (wacomSaveTimeoutRef.current) {
      clearTimeout(wacomSaveTimeoutRef.current);
    }
    wacomSaveTimeoutRef.current = setTimeout(() => {
      // Generate a high-resolution 1200x750 image instead of native canvas res
      const highResCanvas = document.createElement('canvas');
      highResCanvas.width = 1200;
      highResCanvas.height = 750;
      const highResCtx = highResCanvas.getContext('2d');
      if (highResCtx) {
        // Enable high-quality smoothing and anti-aliasing
        highResCtx.imageSmoothingEnabled = true;
        highResCtx.imageSmoothingQuality = 'high';
        
        // Calculate scale ratio relative to local display canvas (e.g. 1200 / 800 = 1.5)
        const scale = 1200 / canvas.width;
        
        // Draw strokes with upscaling for crisp lines
        wacomStrokesRef.current.forEach(stroke => {
          drawWacomStroke(highResCtx, stroke, scale);
        });
        drawWacomStroke(highResCtx, wacomCurrentStrokeRef.current, scale);
        
        setEditFormData(prev => ({ ...prev, signatureData: highResCanvas.toDataURL('image/png') }));
      }
    }, 150);
  };

  const autoDetectWacomHardware = () => {
    // Poll/retry hardware detection
    setWacomStatus('searching');
    setWacomLog('Scanning local secure loopback ports and SSL channels for physical Wacom STU-430/G hardware...');
    // Trigger state dependency refresh by temporarily changing signatureType
    setEditFormData(prev => ({ ...prev, signatureType: 'draw' }));
    setTimeout(() => {
      setEditFormData(prev => ({ ...prev, signatureType: 'wacom' }));
    }, 100);
  };

  useEffect(() => {
    if (editingUser && editFormData.signatureType === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (editFormData.signatureData) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = editFormData.signatureData;
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        } else {
          // Draw horizontal guideline
          ctx.strokeStyle = '#f1f5f9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(20, canvas.height - 30);
          ctx.lineTo(canvas.width - 20, canvas.height - 30);
          ctx.stroke();
        }
      }
    }
  }, [editingUser, editFormData.signatureType, editFormData.signatureData === '']);

  useEffect(() => {
    if (editingUser && editFormData.signatureType === 'wacom' && wacomCanvasRef.current) {
      const canvas = wacomCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Only reload the image if there are no live strokes currently in our drawing memory buffer
        if (wacomStrokesRef.current.length === 0 && wacomCurrentStrokeRef.current.length === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (editFormData.signatureData) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = editFormData.signatureData;
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
          } else {
            drawWacomGrid(canvas, ctx);
          }
        }
      }
    }
  }, [editingUser, editFormData.signatureType, editFormData.signatureData === '']);

  const saveUserEdits = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      let finalSignatureData = editFormData.signatureData;

      if (finalSignatureData && finalSignatureData.startsWith('data:image')) {
        try {
          const uploadRes = await fetch('/api/upload-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signatureData: finalSignatureData,
              userId: editingUser.id,
              tenantId: activeTenantId
            })
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            finalSignatureData = uploadData.url;
          } else {
            console.error("Signature upload failed:", uploadData.error);
          }
        } catch (uploadErr) {
          console.error("Error uploading signature:", uploadErr);
        }
      }

      const res = await fetch(`/api/tenant/${activeTenantId}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editFormData, signatureData: finalSignatureData })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        console.error("Failed to update user profile");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/users`);
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAzureConfigFor = async (targetTenantId: string) => {
    if (targetTenantId === 'global') return;
    try {
      const res = await fetch(`/api/tenant/${targetTenantId}/azure-config`);
      if (res.ok) {
        setAzureConfig(await res.json());
      } else {
        setAzureConfig({ clientId: '', directoryTenantId: '', secretValue: '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
    let birthday = formData.birthday;
    
    if (val.length >= 6) {
      const yy = parseInt(val.substring(0, 2), 10);
      const mm = val.substring(2, 4);
      const dd = val.substring(4, 6);
      const year = yy > (new Date().getFullYear() % 100) ? 1900 + yy : 2000 + yy;
      birthday = `${year}-${mm}-${dd}`;
    }

    setFormData({ ...formData, idNumber: val, birthday });
  };

  const submitManualUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emailLower = (formData.email || '').toLowerCase().trim();
      const isMzansiFlow = emailLower.endsWith('@mzansiflow.co.za') || emailLower.endsWith('@massivedynamixdistributors.com');

      const payload = {
        ...formData,
        directorate: formData.directorate || (isMzansiFlow ? 'MzansiFlow Corporate' : ''),
        department: formData.department || (isMzansiFlow ? 'MzansiFlow Workspace' : ''),
        jobFunction: formData.jobFunction || (isMzansiFlow ? 'MzansiFlow Specialist' : ''),
        idNumber: formData.idNumber || (isMzansiFlow ? 'N/A' : ''),
        birthday: formData.birthday || (isMzansiFlow ? '2000-01-01' : ''),
        gender: formData.gender || (isMzansiFlow ? 'Other' : ''),
        cellPhone: formData.cellPhone || (isMzansiFlow ? 'N/A' : ''),
        residentialAddress: formData.residentialAddress || (isMzansiFlow ? 'MzansiFlow HQ' : ''),
        level: formData.level || '0',
        systemRole: isMzansiFlow ? (formData.systemRole === 'Standard User' ? 'Global Administrator' : formData.systemRole) : formData.systemRole,
        selectedTenant: (isMzansiFlow || formData.systemRole === 'Global Administrator') 
          ? 'global' 
          : (currentUser.role === 'admin' ? formData.selectedTenant : activeTenantId)
      };

      const targetTenant = payload.selectedTenant;

      const res = await fetch(`/api/tenant/${targetTenant}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActiveTab('list');
        fetchUsers();
        setFormData({ ...formData, fullName: '', email: '', idNumber: '', birthday: '', cellPhone: '', residentialAddress: '', level: '1', directorate: '', department: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to register user profile.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAzureConfig = async () => {
    setIsLoading(true);
    setAzureStatus(null);
    try {
      const res = await fetch(`/api/tenant/${azureTargetTenantId}/azure-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureConfig)
      });
      if (res.ok) {
        setAzureStatus({ type: 'success', msg: 'Azure AD Configuration saved successfully.' });
      } else {
        const err = await res.json();
        setAzureStatus({ type: 'error', msg: err.error });
      }
    } catch (e) {
      setAzureStatus({ type: 'error', msg: 'Failed to save configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  const syncAzureUsers = async () => {
    setIsLoading(true);
    setAzureStatus(null);
    try {
      const res = await fetch(`/api/tenant/${azureTargetTenantId}/azure-sync`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setAzureStatus({ type: 'success', msg: `Successfully imported ${data.importedCount} users from Azure AD.` });
        if (activeTenantId === 'global' || activeTenantId === azureTargetTenantId) {
            fetchUsers();
        }
      } else {
        setAzureStatus({ type: 'error', msg: data.error });
      }
    } catch (e) {
      setAzureStatus({ type: 'error', msg: 'Failed to sync users. Check network and configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchWifiConfig = async () => {
      try {
        const res = await fetch(`/api/tenant/${azureTargetTenantId}/wifi-config`);
        if (res.ok) {
          const data = await res.json();
          setIsWifiRestricted(!!data.isEnabled);
          setAllowedWifiIps(data.allowedIps || '');
        }
      } catch (e) {
        console.error("Error loading Wifi config:", e);
      }
    };
    
    const fetchClientIp = async () => {
      try {
        const res = await fetch("/api/auth/client-ip");
        if (res.ok) {
          const data = await res.json();
          setCurrentClientIp(data.ip || '');
        }
      } catch (e) {
        console.error("Error loading Client IP:", e);
      }
    };

    if (activeTab === 'azure') {
      fetchWifiConfig();
      fetchClientIp();
    }
  }, [azureTargetTenantId, activeTab]);

  const saveWifiConfig = async () => {
    setIsLoading(true);
    setWifiSaveStatus(null);
    try {
      const res = await fetch(`/api/tenant/${azureTargetTenantId}/wifi-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: isWifiRestricted,
          allowedIps: allowedWifiIps
        })
      });
      if (res.ok) {
        setWifiSaveStatus({ type: 'success', msg: 'Network login restriction policy updated successfully.' });
      } else {
        const err = await res.json();
        setWifiSaveStatus({ type: 'error', msg: err.error });
      }
    } catch (e) {
      setWifiSaveStatus({ type: 'error', msg: 'Failed to update network policy.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.fullName || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.directorate || '').toLowerCase().includes(q) ||
      (u.jobFunction || '').toLowerCase().includes(q) ||
      (u.manager || '').toLowerCase().includes(q) ||
      (u.reportTo || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q);
  });
  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col overflow-hidden h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6 pt-4 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'list' ? 'border-green-600 text-green-700 bg-white rounded-t-xl shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Users className="w-4 h-4" /> User Base
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'manual' ? 'border-green-600 text-green-700 bg-white rounded-t-xl shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <UserPlus className="w-4 h-4" /> Add Manual User
        </button>
        <button 
          onClick={() => setActiveTab('azure')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'azure' ? 'border-green-600 text-green-700 bg-white rounded-t-xl shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <KeyRound className="w-4 h-4" /> Azure AD Integration
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'sessions' ? 'border-green-600 text-green-700 bg-white rounded-t-xl shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Monitor className="w-4 h-4 text-green-600" /> Active Logins & Supervision
        </button>
        <button 
          onClick={() => setActiveTab('perf')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'perf' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Activity className="w-4 h-4 text-emerald-600" /> Performance & Bottlenecks
        </button>
      </div>

      <div className="p-8 flex-1 overflow-y-auto hide-scrollbar">
        {/* Tab 1: User List */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Current Directory</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    await fetchUsers();
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  title="Refresh User Directory"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-600 outline-none w-64 transition-all" 
                  />
                </div>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Users className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <h3 className="text-gray-900 font-bold mb-1">No users found</h3>
                <p className="text-sm text-gray-500">Get started by creating a new user manually or integrating Azure AD.</p>
              </div>
            ) : (
              <div className="overflow-x-auto hide-scrollbar rounded-xl border border-gray-100 flex flex-col">
                <table className="w-full text-left text-sm text-gray-600 flex-1">
                  <thead className="bg-gray-50 text-gray-900 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Name & Email</th>
                      <th className="px-6 py-4">Directorate / Dept / Job / Mgr / Report To</th>
                      <th className="px-6 py-4">System Role</th>
                      <th className="px-6 py-4 text-center">Level</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.fullName}</div>
                          <div className="text-xs text-gray-500 mt-1">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 text-sm">{u.directorate || 'N/A Directorate'}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-bold text-gray-500 mr-1">Dept:</span>{u.department || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-bold text-gray-500 mr-1">Job:</span>{u.jobFunction || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            <span className="font-bold text-gray-500 mr-1">Manager:</span>{u.manager || 'No Manager Chosen'}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            <span className="font-bold text-gray-500 mr-1">Report To:</span>{u.reportTo || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{u.role || u.systemRole}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-xs font-black font-mono">
                            Level {u.level || '1'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${u.source === 'azure_ad' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                            {u.source === 'azure_ad' ? 'Azure AD' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(currentUser.role === 'admin' || currentUser.systemRole === 'Global Administrator') && onImpersonate && (
                              <button 
                                onClick={() => {
                                  const resolvedTenant = (u.tenantId === 'nkangala_auto' || u.email?.toLowerCase().includes('nkangala')) ? 'tenant-229' : (u.tenantId || municipalities[0]?.id || '');
                                  onImpersonate({
                                    email: u.email,
                                    fullName: u.fullName || '',
                                    role: u.role === 'Global Administrator' || u.role === 'admin' || u.role === 'Systems Administrator' ? 'admin' : 'tenant_user',
                                    tenantId: resolvedTenant,
                                    id: u.id,
                                    jobFunction: u.jobFunction || '',
                                    department: u.department || '',
                                    directorate: u.directorate || '',
                                    manager: u.manager || '',
                                    reportTo: u.reportTo || '',
                                    level: u.level || '1',
                                    systemRole: u.role || u.systemRole || 'Standard User',
                                    signatureType: u.signatureType || 'draw',
                                    signatureData: u.signatureData || ''
                                  });
                                }}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title={`Login as ${u.fullName}`}
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setEditingUser(u);
                                setEditFormData({
                                  fullName: u.fullName || '',
                                  email: u.email || '',
                                  jobFunction: u.jobFunction || '',
                                  reportTo: u.reportTo || '',
                                  directorate: u.directorate || '',
                                  department: u.department || '',
                                  manager: u.manager || '',
                                  systemRole: u.role || u.systemRole || 'Standard User',
                                  signatureType: u.signatureType || 'draw',
                                  signatureData: u.signatureData || '',
                                  level: u.level || '1'
                                });
                              }}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Edit User Profile"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-gray-100 p-4 flex justify-between items-center bg-gray-50 rounded-b-xl">
                  <span className="text-xs text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-gray-900">{filteredUsers.length}</span> personnel
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Entry */}
        {activeTab === 'manual' && (() => {
          const isMzansiFlowUser = (formData.email || '').toLowerCase().trim().endsWith('@mzansiflow.co.za') || 
                                   (formData.email || '').toLowerCase().trim().endsWith('@massivedynamixdistributors.com');

          return (
            <form onSubmit={submitManualUser} className="max-w-4xl space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Create Personnel Profile</h2>
                <p className="text-sm text-gray-500">Manually issue a system seat for a new employee.</p>
              </div>

              {isMzansiFlowUser && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-medium animate-fadeIn">
                  <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="font-bold uppercase tracking-wider block text-xs text-emerald-950 mb-0.5">
                      MzansiFlow Corporate Personnel Detected
                    </strong>
                    <span>
                      All <strong>@mzansiflow.co.za</strong> personnel work for MzansiFlow directly. Municipal assignment, Directorate, Department, RSA ID, and Directory Level requirements are automatically bypassed.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Picture Upload Mock */}
                <div className="md:col-span-2 flex items-center gap-6 p-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Profile Picture</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Upload a clean, professional headshot.</p>
                    <label className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm cursor-pointer hover:bg-gray-50">
                      Choose File
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Full Name</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder="e.g. Sipho Ndlovu" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder="ruannars@mzansiflow.co.za" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    RSA ID Number {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <input required={!isMzansiFlowUser} type="text" value={formData.idNumber} onChange={handleIdChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder={isMzansiFlowUser ? 'N/A (Corporate User)' : 'X X X X X X X X X X X X X'} maxLength={13} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Birthday {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <input required={!isMzansiFlowUser} type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} readOnly={!isMzansiFlowUser && !!formData.idNumber} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-700" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Gender {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <select required={!isMzansiFlowUser} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none">
                    <option value="">{isMzansiFlowUser ? 'Not Specified' : 'Select...'}</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Cell Phone Number {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <input required={!isMzansiFlowUser} type="tel" value={formData.cellPhone} onChange={e => setFormData({...formData, cellPhone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder={isMzansiFlowUser ? 'Optional' : '+27...'} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Residential Address {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <textarea required={!isMzansiFlowUser} value={formData.residentialAddress} onChange={e => setFormData({...formData, residentialAddress: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" rows={3} placeholder={isMzansiFlowUser ? 'Optional for MzansiFlow accounts' : ''}></textarea>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 my-2 pt-6"><h3 className="font-bold text-gray-900">Organizational Assignment</h3></div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Job Function {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Optional)</span>}
                  </label>
                  <input required={!isMzansiFlowUser} type="text" value={formData.jobFunction} onChange={e => setFormData({...formData, jobFunction: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder={isMzansiFlowUser ? 'e.g. Technical Specialist' : 'e.g. PMU Manager'} />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Report To</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-green-600 focus-within:bg-white">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search Azure AD for report to..." 
                        value={formData.reportTo}
                        onChange={e => {
                          setReportToSearchQuery(e.target.value);
                          setFormData({...formData, reportTo: e.target.value});
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800"
                      />
                    </div>
                    {reportToSearchQuery && reportToSearchResults.length > 0 && (
                      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xl space-y-1 z-10">
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {reportToSearchResults.map(aUser => (
                            <button
                              key={aUser.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, reportTo: aUser.fullName});
                                setReportToSearchQuery('');
                                setReportToSearchResults([]);
                              }}
                              className="w-full text-left px-3 py-2 bg-white hover:bg-green-50 hover:text-green-700 rounded-xl border border-gray-100 transition-colors text-xs font-medium"
                            >
                              {aUser.fullName} ({aUser.email})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Directorate {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Bypassed for MzansiFlow)</span>}
                  </label>
                  <select 
                    required={!isMzansiFlowUser} 
                    value={formData.directorate} 
                    onChange={e => setFormData({...formData, directorate: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                  >
                    <option value="">{isMzansiFlowUser ? 'None (MzansiFlow Corporate)' : 'Select Directorate...'}</option>
                    {DIRECTORATES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Department {isMzansiFlowUser && <span className="text-emerald-600 font-normal lowercase ml-1">(Bypassed for MzansiFlow)</span>}
                  </label>
                  <input required={!isMzansiFlowUser} type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors" placeholder={isMzansiFlowUser ? 'MzansiFlow Workspace' : 'Department name'} />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Direct Manager</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-green-600 focus-within:bg-white">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search Azure AD for manager..." 
                        value={formData.manager}
                        onChange={e => {
                          setManagerSearchQuery(e.target.value);
                          setFormData({...formData, manager: e.target.value});
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800"
                      />
                    </div>
                    {managerSearchQuery && managerSearchResults.length > 0 && (
                      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xl space-y-1 z-10">
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {managerSearchResults.map(aUser => (
                            <button
                              key={aUser.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, manager: aUser.fullName});
                                setManagerSearchQuery('');
                                setManagerSearchResults([]);
                              }}
                              className="w-full text-left px-3 py-2 bg-white hover:bg-green-50 hover:text-green-700 rounded-xl border border-gray-100 transition-colors text-xs font-medium"
                            >
                              {aUser.fullName} ({aUser.email})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Directory Level</label>
                  <select 
                    value={formData.level || '0'} 
                    onChange={e => setFormData({...formData, level: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                  >
                    <option value="0">0 (Corporate / HQ)</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 my-2 pt-6"><h3 className="font-bold text-gray-900">System Security</h3></div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">System Role</label>
                  <select value={formData.systemRole} onChange={e => setFormData({...formData, systemRole: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none">
                    <option>Standard User</option>
                    <option>Auditor</option>
                    <option>Systems Administrator</option>
                    {(currentUser.role === 'admin' || isMzansiFlowUser) && <option>Global Administrator</option>}
                  </select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Assigned Municipality</label>
                    <select 
                      value={isMzansiFlowUser ? 'global' : formData.selectedTenant} 
                      onChange={e => setFormData({...formData, selectedTenant: e.target.value})}
                      disabled={isMzansiFlowUser || currentUser.role !== 'admin' || formData.systemRole === 'Global Administrator'} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {isMzansiFlowUser || formData.systemRole === 'Global Administrator' ? (
                        <option value="global">System-Wide Access (MzansiFlow Global Workspace)</option>
                      ) : (
                        municipalities.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      )}
                    </select>
                    {isMzansiFlowUser && <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold">MzansiFlow corporate users do not belong to a specific municipality.</p>}
                    {!isMzansiFlowUser && currentUser.role !== 'admin' && <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Locked to your designated tenant.</p>}
                    {!isMzansiFlowUser && formData.systemRole === 'Global Administrator' && <p className="text-[10px] text-green-600 mt-1 uppercase font-bold">Global Administrators bypass municipal assignment.</p>}
                </div>

              </div>
              
              <div className="pt-4 flex justify-end">
                <button disabled={isLoading} className="px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors uppercase tracking-widest text-xs disabled:opacity-50">
                  {isLoading ? 'Processing...' : 'Register Profile'}
                </button>
              </div>
            </form>
          );
        })()}

        {/* Tab 3: Azure AD Integration */}
        {activeTab === 'azure' && (
          <div className="max-w-3xl space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Azure / Entra ID Connection</h2>
                <p className="text-sm text-gray-500">Configure OAuth 2.0 Client Credentials flow for Real-time Identity Sync</p>
              </div>
              {activeTenantId === 'global' && (
                <div className="w-64">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Target Municipality</label>
                  <select 
                    value={azureTargetTenantId} 
                    onChange={e => setAzureTargetTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-green-600 outline-none text-sm font-bold text-gray-900"
                  >
                    {municipalities.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {azureStatus && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${azureStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {azureStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-bold">{azureStatus.msg}</p>
              </div>
            )}

            <div className="bg-gray-900 text-white p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <KeyRound className="w-32 h-32" />
              </div>
              <h3 className="font-bold mb-6 text-green-400 border-b border-gray-800 pb-2">Tenant API Configuration</h3>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">App Client ID</label>
                  <input 
                    type="text" 
                    value={azureConfig.clientId}
                    onChange={e => setAzureConfig({...azureConfig, clientId: e.target.value})}
                    placeholder="e.g. 8a2b..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Directory Tenant ID</label>
                  <input 
                    type="text" 
                    value={azureConfig.directoryTenantId}
                    onChange={e => setAzureConfig({...azureConfig, directoryTenantId: e.target.value})}
                    placeholder="e.g. d7f4..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Secret Value (Client Secret)</label>
                  <input 
                    type="password" 
                    value={azureConfig.secretValue}
                    onChange={e => setAzureConfig({...azureConfig, secretValue: e.target.value})}
                    placeholder="••••••••••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl items-center">
              <div className="flex-1 flex gap-3">
                <button 
                  onClick={saveAzureConfig}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors uppercase tracking-wider text-[11px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Configuration
                </button>
                <button 
                  onClick={syncAzureUsers}
                  disabled={isLoading || !azureConfig.clientId}
                  className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors uppercase tracking-wider text-[11px] disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Execute Import Link
                </button>
              </div>
              <div className="text-[10px] text-gray-400 max-w-[200px] text-right uppercase font-bold">
                SSO & Auto-provisioning via Microsoft Graph
              </div>
            </div>

            {/* WiFi Access Lock Policy Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/85 shadow-md space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600 animate-pulse" /> Network Access & WiFi Lock Policy
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Secure Azure AD logins by restricting access to authorized municipal network IPs. This strictly prevents remote or off-premises authentication.
                </p>
              </div>

              {wifiSaveStatus && (
                <div className={`p-4 rounded-xl border text-xs font-semibold ${wifiSaveStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {wifiSaveStatus.msg}
                </div>
              )}

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isWifiRestricted} 
                    onChange={e => setIsWifiRestricted(e.target.checked)}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 mt-0.5"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-950 group-hover:text-green-700 transition-colors">
                      Strict Network Lock (Nkangala DM WiFi Restriction)
                    </span>
                    <span className="block text-xs text-gray-500">
                      When enabled, users logging in with <strong>nkangaladm.gov.za</strong> accounts can only authenticate from authorized IP addresses.
                    </span>
                  </div>
                </label>

                {isWifiRestricted && (
                  <div className="space-y-2 pl-7 duration-200">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Authorized Public IPs & Subnets (Comma-separated)
                    </label>
                    <textarea 
                      value={allowedWifiIps}
                      onChange={e => setAllowedWifiIps(e.target.value)}
                      placeholder="e.g. 197.97.10.22, 102.164.0.0/16, ::1, 127.0.0.1"
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-green-500 focus:bg-white outline-none text-gray-855"
                    />
                    <p className="text-[10px] text-gray-400">
                      Supports direct IPs (e.g. <code>102.164.120.45</code>), prefix wildcards (e.g. <code>102.164.*</code>), and subnets in CIDR format (e.g. <code>102.164.0.0/16</code>).
                    </p>
                  </div>
                )}

                {currentClientIp && (
                  <div className="pl-7 text-[11px] text-gray-600 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Your current visitor network IP: <strong className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">{currentClientIp}</strong></span>
                  </div>
                )}

                <div className="pl-7 flex justify-end">
                  <button 
                    onClick={saveWifiConfig}
                    disabled={isLoading}
                    className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Save Lock Policy
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 border-l-2 border-green-500 pl-4 py-2">
              <strong>Architecture Note:</strong> The Graph API connector uses Client Credentials grant type to asynchronously import Active Directory profiles bound to this municipality into the Mzansi Flow identity container. Subsequent authentication checks will map standard logins back to the Azure identity provider if 'SSO Enabled' is true.
            </div>
          </div>
        )}

        {/* Tab 4: Active Logins & Supervision */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Live Connected Sessions</h2>
                <p className="text-sm text-gray-500">
                  Real-time visibility into personnel currently logged into the Mzansi Flow municipality network.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {sessionFetchTime && (
                  <span className="text-xs text-gray-400 font-mono">
                    Last sync: {sessionFetchTime} (Auto-syncing active)
                  </span>
                )}
                <button 
                  onClick={fetchActiveSessions}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Force Sync
                </button>
              </div>
            </div>

            <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-xs text-green-800 font-semibold uppercase tracking-wider">
                Currently Active Session Channels: {activeSessions.length} Managed Node(s)
              </span>
            </div>

            <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    <th className="px-6 py-4">Personnel Profile</th>
                    <th className="px-6 py-4">Municipality Node</th>
                    <th className="px-6 py-4">Network IP Address</th>
                    <th className="px-6 py-4">Session Action Channel</th>
                    <th className="px-6 py-4 text-right">Last Verified</th>
                    <th className="px-6 py-4 text-center">Supervise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {activeSessions.map((session: any, idx: number) => {
                    const mappedTenant = municipalities.find(t => t.id === session.tenantId);
                    const tenantName = mappedTenant ? mappedTenant.name : 'Unknown Agency';
                    
                    return (
                      <tr key={session.id || `${session.email}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-600/10 text-green-700 flex items-center justify-center font-bold text-xs shadow-xs">
                              {session.fullName ? session.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-950">{session.fullName || session.email}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{session.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-full text-[10px] uppercase tracking-wider border border-gray-200">
                            {tenantName}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-400" /> {session.clientIp || '127.0.0.1'}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400 max-w-[200px] truncate" title={session.userAgent}>
                          {session.userAgent || 'Modern Web Browser'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-150 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            ACTIVE
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(currentUser.role === 'admin' || currentUser.systemRole === 'Global Administrator') && onImpersonate && (
                            <button 
                              onClick={() => {
                                const resolvedTenant = (session.tenantId === 'nkangala_auto' || session.email?.toLowerCase().includes('nkangala')) ? 'tenant-229' : (session.tenantId || municipalities[0]?.id || '');
                                onImpersonate({
                                  email: session.email,
                                  fullName: session.fullName || '',
                                  role: session.role === 'Global Administrator' || session.role === 'admin' || session.role === 'Systems Administrator' ? 'admin' : 'tenant_user',
                                  tenantId: resolvedTenant,
                                  id: session.userId || session.email,
                                  systemRole: session.systemRole || session.role || 'Standard User'
                                });
                              }}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title={`Login as ${session.fullName || session.email}`}
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {activeSessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 font-medium whitespace-pre">
                        No active logins recorded for this municipality.
                        <br />
                        <span className="text-[10px] font-normal block mt-1">Sessions expire dynamically if no tracking signals are broadcasted for more than 180 seconds.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Performance & Bottlenecks */}
        {activeTab === 'perf' && (
          <div className="rounded-2xl overflow-hidden min-h-[600px]">
            <PerformanceMonitor currentUser={currentUser} activeTenantId={activeTenantId} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl border border-gray-100 p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 p-2 rounded-full font-bold text-sm"
            >
              ✕
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Personnel Profile</h2>
              <p className="text-sm text-gray-500">Modify organizational placement, functions, reporting structure, and digital signature.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">User Identification</span>
                  <span className="font-bold text-gray-900 text-sm">{editFormData.fullName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</span>
                  <span className="text-gray-600 text-xs">{editFormData.email}</span>
                </div>
              </div>

              {/* Digital Signature Component */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Digital Signature Option</label>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200 text-xs font-semibold">
                    <button 
                      type="button"
                      onClick={() => setEditFormData({...editFormData, signatureType: 'draw', signatureData: ''})}
                      className={cn("px-3 py-1 rounded-md transition-colors", editFormData.signatureType === 'draw' ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >Draw</button>
                    <button 
                      type="button"
                      onClick={() => setEditFormData({...editFormData, signatureType: 'upload', signatureData: ''})}
                      className={cn("px-3 py-1 rounded-md transition-colors", editFormData.signatureType === 'upload' ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >Upload</button>
                    <button 
                      type="button"
                      onClick={() => setEditFormData({...editFormData, signatureType: 'wacom', signatureData: ''})}
                      className={cn("px-3 py-1 rounded-md transition-colors", editFormData.signatureType === 'wacom' ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >Wacom STU-430/G</button>
                  </div>
                </div>
                
                {editFormData.signatureType === 'draw' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={512}
                        height={160}
                        onPointerDown={(e) => {
                          try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
                          const rect = e.currentTarget.getBoundingClientRect();
                          isDrawingRef.current = true;
                          lastPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                          updateSourceHeuristic(e);
                        }}
                        onPointerMove={(e) => {
                          if (!isDrawingRef.current) return;
                          const canvas = canvasRef.current;
                          if (!canvas) return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          ctx.beginPath();
                          ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
                          ctx.lineTo(x, y);
                          ctx.strokeStyle = '#0f172a'; // charcoal for elegant hand drawing
                          
                          const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
                          ctx.lineWidth = 1.0 + pressure * 4.0;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          ctx.stroke();
                          lastPosRef.current = { x, y };
                          updateSourceHeuristic(e);
                        }}
                        onPointerUp={(e) => {
                          if (!isDrawingRef.current) return;
                          isDrawingRef.current = false;
                          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
                          if (canvasRef.current) {
                            setEditFormData(prev => ({ ...prev, signatureData: canvasRef.current!.toDataURL() }));
                          }
                        }}
                        onPointerLeave={(e) => {
                          if (!isDrawingRef.current) return;
                          isDrawingRef.current = false;
                          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
                          if (canvasRef.current) {
                            setEditFormData(prev => ({ ...prev, signatureData: canvasRef.current!.toDataURL() }));
                          }
                        }}
                        className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl cursor-crosshair shadow-inner touch-none"
                      />
                    </div>
                    {/* Active Source Device Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Source Device Detected: <strong className="text-emerald-700 uppercase font-mono">{detectedSource}</strong></span>
                      </div>
                      
                      {editFormData.signatureData && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditFormData({...editFormData, signatureData: ''});
                            setDetectedSource('Ready (Awaiting input...)');
                            const canvas = canvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.strokeStyle = '#f1f5f9';
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(20, canvas.height - 30);
                                ctx.lineTo(canvas.width - 20, canvas.height - 30);
                                ctx.stroke();
                              }
                            }
                          }} 
                          className="text-[10px] bg-red-100 text-red-600 px-2.5 py-1 rounded-md font-bold hover:bg-red-200 transition-colors shadow-xs cursor-pointer"
                        >
                          Clear Signature
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {editFormData.signatureType === 'upload' && (
                  <div className="w-full h-40 bg-white border border-gray-300 rounded-xl border-dashed flex items-center justify-center hover:bg-green-50/50 transition-colors relative">
                    {editFormData.signatureData ? (
                       <div className="relative w-full h-full">
                         <img src={editFormData.signatureData} alt="Signature" className="h-full w-full object-contain p-2" />
                         <button type="button" onClick={() => setEditFormData({...editFormData, signatureData: ''})} className="absolute top-3 right-3 text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200 transition-colors">Clear</button>
                       </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-green-600">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold">Click to upload signature image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setEditFormData({...editFormData, signatureData: reader.result as string});
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                )}

                {editFormData.signatureType === 'wacom' && (
                  <div className="space-y-4">
                    {/* Wacom Device Service Status Card */}
                    <div className="flex flex-col gap-3 p-4 bg-slate-100/90 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            wacomStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                            wacomStatus === 'searching' ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'
                          }`} />
                          <div>
                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Wacom STU-430/G Connector
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-md leading-normal">
                              {wacomLog}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={pairWacomWebHID}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            🔌 Pair USB (WebHID)
                          </button>
                          <button
                            type="button"
                            onClick={autoDetectWacomHardware}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" /> Re-Scan Ports
                          </button>
                        </div>
                      </div>

                      {wacomStatus === 'offline' && (
                        <div className="border-t border-slate-200/80 pt-2.5 mt-1 text-[10px] text-slate-600 space-y-2">
                          <p className="font-semibold text-amber-700">
                            💡 Connection Helper (SSL / HTTPS Authorization):
                          </p>
                          <p className="leading-relaxed">
                            Because this application is loaded over secure <strong>HTTPS</strong>, modern browsers automatically block standard <strong>WS</strong> loopbacks to local devices. 
                            If your Wacom device and SigCaptX/STU service are running but not detected:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <a 
                              href="https://localhost:21021/" 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded border border-amber-300 transition-colors text-[9px] uppercase tracking-wider"
                            >
                              Authorize Local Port 21021 ↗
                            </a>
                            <a 
                              href="https://localhost:8000/" 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded border border-amber-300 transition-colors text-[9px] uppercase tracking-wider"
                            >
                              Authorize Local Port 8000 ↗
                            </a>
                          </div>
                          <p className="text-[9px] text-slate-400 italic">
                            *Click either port link above, click "Advanced" on the browser warning page, choose "Proceed to localhost (unsafe)", then return here.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Wacom LCD Screen Canvas container */}
                    <div className="space-y-3">
                      <div className="relative">
                        <canvas
                          ref={wacomCanvasRef}
                          width={800}
                          height={500}
                          className="w-full aspect-[8/5] bg-slate-50 border border-slate-200 rounded-xl shadow-inner cursor-default select-none touch-none"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800/80 backdrop-blur-xs text-[8px] uppercase tracking-wider text-slate-200 rounded-md font-mono pointer-events-none">
                          USB HARDWARE INK ONLY
                        </div>
                      </div>
                      
                      {/* Active Source Device Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Source Device Detected: <strong className="text-emerald-700 uppercase font-mono">{detectedSource}</strong></span>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={async () => {
                            setEditFormData({...editFormData, signatureData: ''});
                            setDetectedSource('Ready (Awaiting input...)');
                            wacomMaxXRef.current = 9600;
                            wacomMaxYRef.current = 6000;
                            lastWacomPosRef.current = null;
                            isWacomDrawingRef.current = false;
                            wacomStrokesRef.current = [];
                            wacomCurrentStrokeRef.current = [];
                            
                            // 1. Clear on-screen HTML5 canvas
                            const canvas = wacomCanvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext('2d');
                              if (ctx) drawWacomGrid(canvas, ctx);
                            }

                            // 2. Clear physical Wacom tablet LCD screen (WebHID reset trick)
                            if (wacomHidDeviceRef.current) {
                              try {
                                const device = wacomHidDeviceRef.current;
                                await device.close();
                                await connectWacomHID(device);
                                setWacomLog("Success: Cleared local canvas and refreshed physical Wacom LCD display!");
                              } catch (err: any) {
                                setWacomLog("Cleared local canvas. (Note: Failed to refresh physical device LCD over USB: " + err.message + ")");
                              }
                            }

                            // 3. Clear physical Wacom tablet LCD screen (SigCaptX)
                            if (wacomTabletRef.current) {
                              try {
                                wacomTabletRef.current.setClearScreen();
                                setWacomLog("Success: Cleared local canvas and refreshed physical Wacom LCD display via SigCaptX!");
                              } catch (err: any) {
                                setWacomLog("Cleared local canvas. (Note: Failed to refresh physical device LCD over SigCaptX: " + err.message + ")");
                              }
                            }
                          }} 
                          className="text-[10px] bg-red-100 text-red-600 px-2.5 py-1 rounded-md font-bold hover:bg-red-200 transition-colors shadow-xs cursor-pointer"
                        >
                          Clear LCD Pad
                        </button>
                      </div>
                    </div>

                    {/* Connection Instructions */}
                    <div className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded-xl p-4 space-y-2 leading-relaxed">
                      <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px] mb-1">
                        How to connect your physical STU-430/G device:
                      </span>
                      <p>
                        1. Connect your Wacom STU-430/G device via USB to your local computer.
                      </p>
                      <p>
                        2. Ensure the <strong>Wacom STU SDK for Web</strong> or <strong>SigCaptX Web Service</strong> is installed and running on your local machine.
                      </p>
                      <p>
                        3. Once the local service is detected, this system will <strong>automatically integrate</strong> with the STU-430/G hardware. When drawing on the tablet stylus, coordinates are captured on the canvas and saved to the profile.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Directorate</label>
                <select 
                  value={editFormData.directorate} 
                  onChange={e => setEditFormData({...editFormData, directorate: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none text-sm" 
                >
                  <option value="">Select Directorate...</option>
                  {DIRECTORATES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Department</label>
                <input 
                  type="text" 
                  value={editFormData.department} 
                  onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Job Function</label>
                <p className="text-[10px] text-gray-500 mb-2">Type custom title, or search/select another user from the Azure AD Directory to link as their acting role.</p>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={editFormData.jobFunction} 
                    onChange={e => setEditFormData({...editFormData, jobFunction: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 focus:bg-white outline-none transition-colors text-sm" 
                    placeholder="e.g. Chief Financial Officer"
                  />
                  {jobSearchQuery && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs space-y-2 animate-fade-in relative">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 focus-within:border-green-600 focus-within:bg-white">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search Azure AD Directory..." 
                          value={jobSearchQuery}
                          onChange={e => setJobSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-xs text-gray-800"
                        />
                        <button 
                          type="button" 
                          onClick={() => setJobSearchQuery('')} 
                          className="text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                        >Clear</button>
                      </div>
                      
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {jobSearchResults.map(aUser => (
                          <button
                            key={aUser.id}
                            type="button"
                            onClick={() => {
                              setEditFormData({...editFormData, jobFunction: `Linked AAD Role: ${aUser.fullName}`});
                              setJobSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 bg-white hover:bg-green-50 hover:text-green-700 rounded-xl border border-gray-100 transition-colors text-xs font-medium flex items-center justify-between"
                          >
                            <span>{aUser.fullName}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{aUser.department || 'Azure AD User'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Report To</label>
                <p className="text-[10px] text-gray-500 mb-2">Select user from Azure AD for reporting hierarchy.</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-green-600 focus-within:bg-white">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search Azure AD for report to..." 
                      value={editFormData.reportTo}
                      onChange={e => {
                        setReportToSearchQuery(e.target.value);
                        setEditFormData({...editFormData, reportTo: e.target.value});
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800"
                    />
                  </div>
                  {reportToSearchQuery && reportToSearchResults.length > 0 && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xl space-y-1">
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {reportToSearchResults.map(aUser => (
                          <button
                            key={aUser.id}
                            type="button"
                            onClick={() => {
                              setEditFormData({...editFormData, reportTo: aUser.fullName});
                              setReportToSearchQuery('');
                              setReportToSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 bg-white hover:bg-green-50 hover:text-green-700 rounded-xl border border-gray-100 transition-colors text-xs font-medium"
                          >
                            {aUser.fullName} ({aUser.email})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Direct Manager</label>
                <p className="text-[10px] text-gray-500 mb-2">Establish line reporting and performance oversight relationships.</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-green-600 focus-within:bg-white">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search Azure AD for manager..." 
                      value={editFormData.manager}
                      onChange={e => {
                        setManagerSearchQuery(e.target.value);
                        setEditFormData({...editFormData, manager: e.target.value});
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800"
                    />
                  </div>
                  {managerSearchQuery && managerSearchResults.length > 0 && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xl space-y-1">
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {managerSearchResults.map(aUser => (
                          <button
                            key={aUser.id}
                            type="button"
                            onClick={() => {
                              setEditFormData({...editFormData, manager: aUser.fullName});
                              setManagerSearchQuery('');
                              setManagerSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 bg-white hover:bg-green-50 hover:text-green-700 rounded-xl border border-gray-100 transition-colors text-xs font-medium"
                          >
                            {aUser.fullName} ({aUser.email})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">System Role</label>
                <select 
                  value={editFormData.systemRole} 
                  onChange={e => setEditFormData({...editFormData, systemRole: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none text-sm cursor-pointer"
                >
                  <option>Standard User</option>
                  <option>Auditor</option>
                  <option>Systems Administrator</option>
                  <option>Global Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Directory Level</label>
                <select 
                  value={editFormData.level || '1'} 
                  onChange={e => setEditFormData({...editFormData, level: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-600 outline-none text-sm cursor-pointer"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 text-xs uppercase tracking-wider hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={saveUserEdits}
                disabled={isLoading}
                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors uppercase tracking-wider text-xs disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
