import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Search, Phone, Video, Info, File, FileText, Image as ImageIcon, X, MessageSquare, Hash, User, Settings, Check, Users, MessageCircle, AlertCircle, ArrowLeftRight } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import type { User as AppUser } from '../types';
import { cn } from './Branding';
import { tenants } from '../data';

interface ChatProps {
  currentUser: AppUser;
  activeTenantId: string;
}

interface Message {
  id: string;
  tenantId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  content: string;
  type: string;
  fileUrl: string | null;
  createdAt: string;
}

interface ChatUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  source: string;
}

interface ChatTarget {
  type: 'channel' | 'dm';
  id: string; // room name or dm name
  name: string; // display name in main chat header
  email?: string; // participant email if DM
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150", 
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
];

const mockMzansiFlowUsers: ChatUser[] = [
  { id: 'mf-u1', fullName: 'Mike', email: 'mike@massivedynamixdistributors.com', department: 'Executive Director', role: 'Global Admin', source: 'system' },
  { id: 'mf-u2', fullName: 'Audrey', email: 'audrey@mzansiflow.co.za', department: 'Operations Manager', role: 'Global Admin', source: 'system' },
  { id: 'mf-u3', fullName: 'Delphine', email: 'delphine@mzansiflow.co.za', department: 'Operations / Quality Assurance', role: 'Global Admin', source: 'system' },
  { id: 'mf-u4', fullName: 'Qiniso', email: 'qiniso@mzansiflow.co.za', department: 'Solutions Architect', role: 'Global Admin', source: 'system' },
  { id: 'mf-u5', fullName: 'Marlan', email: 'marlan@mzansiflow.co.za', department: 'Project Coordinator', role: 'Global Admin', source: 'system' }
];

const mockNkangalaUsers: ChatUser[] = [
  { id: 'nk-u1', fullName: 'Sipho Mabena', email: 's.mabena@nkangaladm.gov.za', department: 'Corporate Services', role: 'Director', source: 'system' },
  { id: 'nk-u2', fullName: 'Lerato Ndlovu', email: 'l.ndlovu@nkangaladm.gov.za', department: 'Finance / BTO', role: 'Chief Financial Officer', source: 'system' },
  { id: 'nk-u3', fullName: 'Thabo Mokoena', email: 't.mokoena@nkangaladm.gov.za', department: 'Office of the MM', role: 'Municipal Manager', source: 'system' },
  { id: 'nk-u4', fullName: 'Zanele Khumalo', email: 'z.khumalo@nkangaladm.gov.za', department: 'Local Economic Development', role: 'LED Manager', source: 'system' },
  { id: 'nk-u5', fullName: 'Johan de Beer', email: 'j.debeer@nkangaladm.gov.za', department: 'Infrastructure Services', role: 'Technical Director', source: 'system' },
  { id: 'nk-u6', fullName: 'Nomsa Shabangu', email: 'n.shabangu@nkangaladm.gov.za', department: 'Budget & Treasury', role: 'Budget Manager', source: 'system' },
  { id: 'nk-u7', fullName: 'Pieter Botha', email: 'p.botha@nkangaladm.gov.za', department: 'Risk Management', role: 'Chief Risk Officer', source: 'system' },
  { id: 'nk-u8', fullName: 'Naledi Mashego', email: 'n.mashego@nkangaladm.gov.za', department: 'Corporate Services', role: 'HR Specialist', source: 'system' },
  { id: 'nk-u9', fullName: 'Zweli Mthembu', email: 'z.mthembu@nkangaladm.gov.za', department: 'Internal Audit', role: 'Chief Audit Executive', source: 'system' },
  { id: 'nk-u10', fullName: 'Gugu Nkosi', email: 'g.nkosi@nkangaladm.gov.za', department: 'Strategic Planning', role: 'IDP Coordinator', source: 'system' },
  { id: 'nk-u11', fullName: 'Bongani Cele', email: 'b.cele@nkangaladm.gov.za', department: 'Supply Chain Management', role: 'SCM Practitioner', source: 'system' },
  { id: 'nk-u12', fullName: 'Adriaan Coetzee', email: 'a.coetzee@nkangaladm.gov.za', department: 'Legal Services', role: 'Legal Advisor', source: 'system' },
  { id: 'nk-u13', fullName: 'Phumzile Masina', email: 'p.masina@nkangaladm.gov.za', department: 'Office of the Mayor', role: 'Executive Secretary', source: 'system' },
  { id: 'nk-u14', fullName: 'Kabelo Modise', email: 'k.modise@nkangaladm.gov.za', department: 'Information Technology', role: 'SLA Manager', source: 'system' },
  { id: 'nk-u15', fullName: 'Sibusiso Zulu', email: 's.zulu@nkangaladm.gov.za', department: 'Community Services', role: 'Social Dev Lead', source: 'system' },
  { id: 'nk-u16', fullName: 'Annelize van Dyk', email: 'a.vandyk@nkangaladm.gov.za', department: 'Performance Management', role: 'PMS Coordinator', source: 'system' },
  { id: 'nk-u17', fullName: 'Tshepo Morake', email: 't.morake@nkangaladm.gov.za', department: 'Budget & Treasury', role: 'Expenditure Head', source: 'system' },
  { id: 'nk-u18', fullName: 'Refilwe Phiri', email: 'r.phiri@nkangaladm.gov.za', department: 'Communication Services', role: 'Media Spokesperson', source: 'system' },
  { id: 'nk-u19', fullName: 'Jacobus Marais', email: 'j.marais@nkangaladm.gov.za', department: 'Risk Management', role: 'Risk Assessor', source: 'system' },
  { id: 'nk-u20', fullName: 'Thandiwe Ndaba', email: 't.ndaba@nkangaladm.gov.za', department: 'Corporate Services', role: 'Committee Clerk', source: 'system' },
  { id: 'nk-u21', fullName: 'Vusi Sibanda', email: 'v.sibanda@nkangaladm.gov.za', department: 'Local Economic Development', role: 'SME Support Specialist', source: 'system' },
  { id: 'nk-u22', fullName: 'Charmaine Pretorius', email: 'c.pretorius@nkangaladm.gov.za', department: 'Office of the Speaker', role: 'Council Secretary', source: 'system' },
  { id: 'nk-u23', fullName: 'Dumisani Nkosi', email: 'd.nkosi@nkangaladm.gov.za', department: 'Public Participation', role: 'Ward Support Officer', source: 'system' },
  { id: 'nk-u24', fullName: 'Mpho Baloyi', email: 'm.baloyi@nkangaladm.gov.za', department: 'Strategic Planning', role: 'M&E Practitioner', source: 'system' },
  { id: 'nk-u25', fullName: 'Liezel van der Merwe', email: 'l.vandermerwe@nkangaladm.gov.za', department: 'Finance / BTO', role: 'Revenue Accountant', source: 'system' }
];

export function Chat({ currentUser, activeTenantId }: ChatProps) {
  const nkangalaTenantObj = tenants.find(t => t.name.includes("Nkangala"));
  const nkangalaId = nkangalaTenantObj ? nkangalaTenantObj.id : 'tenant-24';

  // State lists
  const [nkangalaUsers, setNkangalaUsers] = useState<ChatUser[]>([]);
  const [mzansiFlowUsers, setMzansiFlowUsers] = useState<ChatUser[]>([]);
  
  // Custom Profile updates states and presence tracker
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [onlineEmails, setOnlineEmails] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // My connection profile edit values
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileRAG, setProfileRAG] = useState('green');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Chat Target (Active room)
  const [chatTarget, setChatTarget] = useState<ChatTarget>({
    type: 'channel',
    id: 'nkangala_mzansiflow_shared',
    name: 'Municipal Collaboration Room'
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // Search and Paginations
  const [searchNkangalaQuery, setSearchNkangalaQuery] = useState('');
  const [searchMfQuery, setSearchMfQuery] = useState('');
  const [currentPageNkangala, setCurrentPageNkangala] = useState(1);

  // Chat Input features
  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  // Sync personal profile values on profiles maps updates
  useEffect(() => {
    const prof = userProfiles[currentUser.email.toLowerCase()] || {};
    setProfileAvatar(prof.avatarUrl || '');
    setProfileStatus(prof.statusMessage || '');
    setProfileRAG(prof.ragStatus || 'green');
  }, [userProfiles, currentUser.email]);

  // Load both organization folders/API directories
  const fetchUsersAndProfiles = async () => {
    try {
      setUsersLoading(true);
      // 1. Load Custom Profiles from Supabase (Persistent)
      try {
        const profRes = await fetch("/api/users/profiles");
        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfiles(profData || {});
        }
      } catch (pe) {
        console.error("Profiles load error", pe);
      }

      // 2. Fetch users for both endpoints in parallel
      const [globalRes, nkRes] = await Promise.all([
        fetch('/api/tenant/global/users'),
        fetch(`/api/tenant/${nkangalaId}/users`)
      ]);
      
      const dbGlobal = globalRes.ok ? await globalRes.json() : [];
      const dbNkangala = nkRes.ok ? await nkRes.json() : [];
      
      const mergedGlobal = Array.isArray(dbGlobal) ? dbGlobal : [];
      const mergedNkangala = Array.isArray(dbNkangala) ? dbNkangala : [];

      // 3. Assemble and merge directories safely
      // A. Mzansi Flow Staff
      const mfMap = new Map<string, ChatUser>();
      mergedGlobal.forEach(u => {
        const emailLower = (u.email || '').toLowerCase();
        if (emailLower.endsWith('mzansiflow.co.za') || emailLower.endsWith('massivedynamixdistributors.com')) {
          mfMap.set(emailLower, {
            id: u.id || u.email,
            fullName: u.fullName || u.full_name || u.email.split('@')[0],
            email: u.email,
            role: u.role || 'Employee',
            department: u.department || 'Administration',
            source: 'database'
          });
        }
      });
      mockMzansiFlowUsers.forEach(m => {
        const key = m.email.toLowerCase();
        if (!mfMap.has(key)) {
          mfMap.set(key, m);
        }
      });
      setMzansiFlowUsers(Array.from(mfMap.values()));

      // B. Nkangala DM Employees
      const nkMap = new Map<string, ChatUser>();
      mergedNkangala.forEach(u => {
        if ((u.email || '').toLowerCase().endsWith('nkangaladm.gov.za') || u.tenantId === nkangalaId) {
          nkMap.set(u.email.toLowerCase(), {
            id: u.id || u.email,
            fullName: u.fullName || u.full_name || u.email.split('@')[0],
            email: u.email,
            role: u.role || 'Employee',
            department: u.department || 'Corporate Services',
            source: 'database'
          });
        }
      });
      mockNkangalaUsers.forEach(m => {
        const key = m.email.toLowerCase();
        if (!nkMap.has(key)) {
          nkMap.set(key, m);
        }
      });
      setNkangalaUsers(Array.from(nkMap.values()));

    } catch (e) {
      console.error("Failed to fetch users and profiles", e);
      // Fallback
      setMzansiFlowUsers(mockMzansiFlowUsers);
      setNkangalaUsers(mockNkangalaUsers);
    } finally {
      setUsersLoading(false);
    }
  };

  const chatTargetRef = useRef<ChatTarget>(chatTarget);

  // Keep ref up to date
  useEffect(() => {
    chatTargetRef.current = chatTarget;
  }, [chatTarget]);

  // Sync users list and custom profiles on mount
  useEffect(() => {
    fetchUsersAndProfiles();
  }, []);

  // Hook up stable single WebSocket connection on mount
  useEffect(() => {
    const newSocket = io({
       path: '/socket.io/',
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { room: chatTargetRef.current.id, userEmail: currentUser.email });
    });

    // Merge WS Presence active list globally
    newSocket.on('presence', (emails: string[]) => {
       setOnlineEmails(emails || []);
    });

    newSocket.on('receive_message', (msg: Message) => {
      // Append if it corresponds to current target room using ref
      if (msg.tenantId === chatTargetRef.current.id) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(p => p.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser.email]);

  // Handle room switching / chat history fetching dynamically
  useEffect(() => {
    setLoadingHistory(true);
    
    // 1. Fetch Chat history for the selected room target
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/tenant/${chatTarget.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMessages(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch messages", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();

    // 2. Emit room join to existing socket
    if (socket) {
      socket.emit('join_room', { room: chatTarget.id, userEmail: currentUser.email });
    }
  }, [chatTarget.id, socket, currentUser.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset page layout on search
  useEffect(() => {
    setCurrentPageNkangala(1);
  }, [searchNkangalaQuery]);

  const handleSend = () => {
    if (!inputVal.trim() && !selectedFile) return;

    const sendMessage = (fileContent: string | null = null, msgType = 'text') => {
      if (socket) {
        socket.emit('send_message', {
          room: chatTarget.id,
          tenantId: chatTarget.id,
          senderId: currentUser.email,
          senderEmail: currentUser.email,
          senderName: currentUser.fullName || currentUser.email.split('@')[0], 
          content: inputVal.trim() || (selectedFile ? selectedFile.name : ''),
          type: msgType,
          fileUrl: fileContent
        });
        setInputVal('');
        setSelectedFile(null);
        setShowEmojiPicker(false);
      }
    };

    if (selectedFile) {
        if (selectedFile.size > 50 * 1024 * 1024) {
            alert("File size exceeds 50MB limit.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const isImage = selectedFile.type.startsWith('image/');
            sendMessage(result, isImage ? 'image' : 'document');
        };
        reader.readAsDataURL(selectedFile);
    } else {
        sendMessage();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInputVal(prev => prev + emojiData.emoji);
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    setUpdateSuccess(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          avatarUrl: profileAvatar,
          statusMessage: profileStatus,
          ragStatus: profileRAG
        })
      });
      if (res.ok) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        // Refresh profiles map immediately
        const profRes = await fetch("/api/users/profiles");
        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfiles(profData || {});
        }
      }
    } catch (e) {
      console.error("Save profile error", e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Directory Search & Filters: search by username, name or surname for Nkangala
  const filteredNkangala = nkangalaUsers.filter(u => {
    const searchLower = searchNkangalaQuery.toLowerCase();
    const username = (u.email || '').split('@')[0].toLowerCase();
    const fullName = (u.fullName || '').toLowerCase();
    
    const nameParts = (u.fullName || '').toLowerCase().split(' ');
    const firstName = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || '';

    return username.includes(searchLower) || 
           fullName.includes(searchLower) || 
           firstName.includes(searchLower) || 
           surname.includes(searchLower) ||
           (u.email || '').toLowerCase().includes(searchLower);
  });

  const totalPagesNkangala = Math.ceil(filteredNkangala.length / itemsPerPage);
  const paginatedNkangala = filteredNkangala.slice(
    (currentPageNkangala - 1) * itemsPerPage, 
    currentPageNkangala * itemsPerPage
  );

  // Filter for Mzansi Flow on the right (Optional filter)
  const filteredMf = mzansiFlowUsers.filter(u => {
    const searchLower = searchMfQuery.toLowerCase();
    const username = (u.email || '').split('@')[0].toLowerCase();
    const fullName = (u.fullName || '').toLowerCase();
    return username.includes(searchLower) || 
           fullName.includes(searchLower) || 
           (u.email || '').toLowerCase().includes(searchLower);
  });

  const initiateDM = (user: ChatUser) => {
    // Determine static sorted dm room id to guarantee dual match and avoid database varchar column length issues
    const email1 = (currentUser.email || '').toLowerCase().trim();
    const email2 = (user.email || '').toLowerCase().trim();
    const sorted = [email1, email2].sort();
    
    // Simple polynomial rolling hash to get a unique, short, safe string
    const combined = sorted.join('|');
    let hash1 = 5381;
    let hash2 = 33;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash1 = ((hash1 << 5) + hash1) + char;
      hash2 = ((hash2 << 5) + hash2) ^ char;
    }
    const part1 = Math.abs(hash1).toString(36);
    const part2 = Math.abs(hash2).toString(36);
    const dmRoomId = `dm_${part1}_${part2}`;
    
    setChatTarget({
      type: 'dm',
      id: dmRoomId,
      name: user.fullName || user.email.split('@')[0],
      email: user.email
    });
  };

  const switchToGlobalChannel = () => {
    setChatTarget({
      type: 'channel',
      id: 'nkangala_mzansiflow_shared',
      name: 'Municipal Collaboration Room'
    });
  };

  return (
    <div className="flex h-full w-full bg-slate-100 rounded-2xl overflow-hidden font-sans border border-slate-200 shadow-2xl text-slate-800">
      
      {/* 1. LEFT SIDEBAR: Nkangala District Municipality Employees */}
      <div className="w-80 h-full border-r border-slate-200 flex flex-col bg-slate-50/95 shrink-0 select-none">
        
        {/* Header - Non-scrolling */}
        <div className="p-4 border-b border-slate-200/80 bg-white shadow-xs shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] text-amber-800 font-extrabold tracking-wider uppercase">Nkangala DM Node</span>
          </div>
          <h2 className="text-sm font-black text-slate-900 leading-tight mb-2 truncate" title="Nkangala District Municipality">
            District Employees
          </h2>
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by username, name, surname..." 
              value={searchNkangalaQuery}
              onChange={(e) => setSearchNkangalaQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* Scrolling list for Left side (Independent) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
          {usersLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-2 bg-white/50 rounded-xl">
                  <div className="w-9 h-9 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedNkangala.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No matching employees found.
            </div>
          ) : (
            paginatedNkangala.map((u, i) => {
              const uKey = (u.email || '').toLowerCase();
              const uProf = userProfiles[uKey] || {};
              const uAvatar = uProf.avatarUrl;
              const uStatus = uProf.statusMessage;
              const uRAG = uProf.ragStatus || 'green';
              
              // Presence detection based on socket connection state
              const isOnline = onlineEmails.map(e => e.toLowerCase()).includes(uKey);
              const isActiveChat = chatTarget.type === 'dm' && chatTarget.email?.toLowerCase() === uKey;

              return (
                <div 
                  key={u.id ? `${u.id}-${i}` : u.email ? `${u.email}-${i}` : i} 
                  onClick={() => initiateDM(u)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border text-left scale-100 active:scale-98",
                    isActiveChat
                      ? "bg-amber-600 border-amber-700 text-white shadow-md shadow-amber-600/10" 
                      : "bg-white hover:bg-amber-50/50 border-slate-100 hover:border-amber-100 hover:shadow-xs"
                  )}
                >
                  {/* Avatar Frame with custom RAG outline ring */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-9 h-9 rounded-full overflow-hidden flex items-center justify-center p-0.5",
                      uRAG === 'green' ? 'ring-2 ring-emerald-500/80 ring-offset-1' : uRAG === 'amber' ? 'ring-2 ring-amber-500/80 ring-offset-1' : 'ring-2 ring-rose-500/85 ring-offset-1',
                      isActiveChat ? 'ring-white/80 ring-offset-slate-800' : ''
                    )}>
                      {uAvatar ? (
                        <img src={uAvatar} alt="" className="w-full h-full rounded-full object-cover bg-white" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={cn(
                          "w-full h-full rounded-full flex items-center justify-center text-[10px] font-black uppercase text-slate-700 bg-slate-200 border-2 border-white",
                          isActiveChat && 'bg-amber-500 text-white border-transparent'
                        )}>
                          {u.fullName?.charAt(0) || u.email?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Live Connected Presence Indicator */}
                    {isOnline ? (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                       <h4 className={cn("text-xs font-bold truncate leading-tight", isActiveChat ? "text-white" : "text-slate-900")}>
                         {u.fullName || 'Unknown'}
                       </h4>
                    </div>
                    {uStatus ? (
                      <p className={cn("text-[10px] italic truncate font-bold leading-normal mt-0.5", isActiveChat ? "text-amber-100" : "text-emerald-700")}>
                        💬 {uStatus}
                      </p>
                    ) : (
                      <p className={cn("text-[9px] truncate tracking-tight font-medium opacity-80 mt-0.5", isActiveChat ? "text-amber-50" : "text-slate-500")}>
                        {u.role} • {u.department || 'Corporate'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination at the bottom (Left Sidebar) */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[10px] text-slate-500 font-black tracking-wider uppercase shrink-0">
          <span>Page {currentPageNkangala} of {totalPagesNkangala || 1}</span>
          <div className="flex gap-1">
             <button 
               disabled={currentPageNkangala === 1} 
               onClick={() => setCurrentPageNkangala(p => p - 1)} 
               className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-200 text-[10px] font-extrabold"
             >
               Prev
             </button>
             <button 
               disabled={currentPageNkangala === totalPagesNkangala || totalPagesNkangala === 0} 
               onClick={() => setCurrentPageNkangala(p => p + 1)} 
               className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-200 text-[10px] font-extrabold"
             >
               Next
             </button>
          </div>
        </div>
      </div>


      {/* 2. CENTER: Main Chat Box Area (Does not scroll together with sidebars) */}
      <div className="flex-1 h-full min-w-0 flex flex-col bg-white relative">
        
        {/* Chat Area Header - Non-scrolling */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white shadow-xs z-10">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                {chatTarget.type === 'channel' ? <Hash className="w-5 h-5 text-slate-500" /> : <MessageCircle className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 leading-none truncate mb-0.5">{chatTarget.name}</h3>
                <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">
                  {chatTarget.type === 'channel' ? 'Public Room' : 'Direct Message'}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-2 shrink-0">
              {/* Back to Shared Group channel button */}
              {chatTarget.type === 'dm' && (
                <button 
                  onClick={switchToGlobalChannel}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-100"
                  title="Switch to Municipal Collaboration Channel"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Public Collab
                </button>
              )}

              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              
              <button 
                onClick={fetchUsersAndProfiles}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-full transition-colors"
                title="Refresh user directories and profiles"
              >
                <Settings className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Independent Scrollable Message viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 hide-scrollbar" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.015) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {loadingHistory ? (
             <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest gap-2">
                 <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                 <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-75" />
                 <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-150" />
                 Loading Node Chat Stream
             </div>
          ) : messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-350 select-none">
                 <MessageSquare className="w-12 h-12 mb-2 animate-pulse text-slate-300" />
                 <p className="text-xs font-black tracking-wider uppercase">Secure collaboration buffer</p>
                 <p className="text-[11px] text-slate-400 mt-1 font-medium">Type a message below to start sharing files and updates instantly.</p>
             </div>
          ) : (
            messages.map((m, i) => {
              const isMine = m.senderEmail.toLowerCase() === currentUser.email.toLowerCase();
              const d = new Date(m.createdAt);
              const timeString = isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const senderKey = (m.senderEmail || '').toLowerCase();
              const senderProf = userProfiles[senderKey] || {};
              const senderAvatar = senderProf.avatarUrl;

              return (
                <div key={m.id || i} className={cn("flex flex-col animate-fade-in", isMine ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                     {senderAvatar ? (
                       <img src={senderAvatar} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[8px] font-black flex items-center justify-center border border-white">
                         {(m.senderName || m.senderEmail || '?').charAt(0).toUpperCase()}
                       </div>
                     )}
                     <span className="text-[11px] font-black text-slate-800">{isMine ? 'You' : m.senderName}</span>
                     <span className="text-[9px] text-slate-400 font-bold">{timeString}</span>
                  </div>
                  
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs relative group border",
                    isMine 
                      ? "bg-slate-800 text-white rounded-tr-sm border-slate-800" 
                      : "bg-white border-slate-200/80 text-slate-800 rounded-tl-sm"
                  )}>
                    {m.type === 'image' && m.fileUrl && (
                       <img src={m.fileUrl} alt="Attachment" className="max-w-full rounded-xl mb-1.5 object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                    )}
                    {m.type === 'document' && m.fileUrl && (
                       <a href={m.fileUrl} download={m.content} className={cn("flex items-center gap-3 p-2.5 rounded-xl mb-1.5 border leading-tight transition-colors", isMine ? "bg-slate-755 border-slate-600 text-white hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100")}>
                          <FileText className="w-6 h-6 shrink-0 opacity-80" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block truncate max-w-[200px]">{m.content}</span>
                            <span className="text-[9px] block opacity-60">Payload Secure Sync</span>
                          </div>
                       </a>
                    )}
                    {(m.type === 'text' || (m.type !== 'text' && m.content && !m.content.includes('.'))) && (
                       <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-semibold">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Non-scrolling */}
        <div className="p-4 bg-white border-t border-slate-150 relative shrink-0">
          
          {showEmojiPicker && (
            <div className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-slate-200">
               <EmojiPicker onEmojiClick={handleEmojiClick} searchDisabled skinTonesDisabled />
            </div>
          )}

          {selectedFile && (
             <div className="absolute bottom-full left-4 mb-2 z-10 bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-2 flex items-center gap-3 text-xs font-bold">
                <File className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="font-extrabold text-slate-800 max-w-[200px] truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button onClick={() => setSelectedFile(null)} className="ml-2 w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3" />
                </button>
             </div>
          )}

          <div className="flex items-end gap-2 max-w-5xl mx-auto">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-end p-1 transition-all focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:bg-white relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Attach file (Up to 50MB)"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                   if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                }} 
              />
              
              <textarea 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={chatTarget.type === 'channel' ? "Broadcast message to all room users..." : `Type secure private message with ${chatTarget.name}...`}
                className="flex-1 w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-[13px] max-h-32 min-h-[44px] outline-none placeholder:text-slate-400 font-semibold"
                rows={1}
              />
              
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  showEmojiPicker ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={handleSend}
              disabled={!inputVal.trim() && !selectedFile}
              className="w-12 h-12 shrink-0 rounded-2xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 disabled:opacity-40 transition-all shadow-md active:scale-95"
            >
              <Send className="w-5 h-5 mr-0.5 mt-0.5" />
            </button>
          </div>
        </div>
      </div>


      {/* 3. RIGHT SIDEBAR: Mzansi Flow Users */}
      <div className="w-80 h-full border-l border-slate-200 flex flex-col bg-slate-50/95 shrink-0 select-none">
        
        {/* Header - Non-scrolling */}
        <div className="p-4 border-b border-slate-200/80 bg-white shadow-xs shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] text-rose-800 font-extrabold tracking-wider uppercase font-sans">Mzansi Flow Network</span>
          </div>
          <h2 className="text-sm font-black text-slate-900 leading-tight mb-2 truncate">
            Partners & Academy Staff
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter Flow directors & staff..." 
              value={searchMfQuery}
              onChange={(e) => setSearchMfQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* Scrolling list for Right side (Independent) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
          {usersLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-2 bg-white/50 rounded-xl">
                  <div className="w-9 h-9 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMf.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No matching partners found.
            </div>
          ) : (
            filteredMf.map((u, i) => {
              const uKey = (u.email || '').toLowerCase();
              const uProf = userProfiles[uKey] || {};
              const uAvatar = uProf.avatarUrl;
              const uStatus = uProf.statusMessage;
              const uRAG = uProf.ragStatus || 'green';
              
              // Presence detection based on socket connection state
              const isOnline = onlineEmails.map(e => e.toLowerCase()).includes(uKey);
              const isActiveChat = chatTarget.type === 'dm' && chatTarget.email?.toLowerCase() === uKey;

              return (
                <div 
                  key={u.id ? `${u.id}-${i}` : u.email ? `${u.email}-${i}` : i} 
                  onClick={() => initiateDM(u)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border text-left scale-100 active:scale-98 duration-200",
                    isActiveChat
                      ? "bg-rose-650 bg-slate-800 border-slate-900 text-white shadow-md shadow-rose-950/15" 
                      : "bg-white hover:bg-rose-50/40 border-slate-100 hover:border-rose-100 hover:shadow-xs"
                  )}
                >
                  {/* Avatar Frame with custom RAG outline ring */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-9 h-9 rounded-full overflow-hidden flex items-center justify-center p-0.5",
                      uRAG === 'green' ? 'ring-2 ring-emerald-500/80 ring-offset-1' : uRAG === 'amber' ? 'ring-2 ring-amber-500/80 ring-offset-1' : 'ring-2 ring-rose-500/85 ring-offset-1',
                      isActiveChat ? 'ring-white/80 ring-offset-slate-800' : ''
                    )}>
                      {uAvatar ? (
                        <img src={uAvatar} alt="" className="w-full h-full rounded-full object-cover bg-white" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={cn(
                          "w-full h-full rounded-full flex items-center justify-center text-[10px] font-black uppercase text-slate-700 bg-slate-200 border-2 border-white",
                          isActiveChat && 'bg-rose-500 text-white border-transparent'
                        )}>
                          {u.fullName?.charAt(0) || u.email?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Live Connected Presence Indicator */}
                    {isOnline ? (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                       <h4 className={cn("text-xs font-bold truncate leading-tight", isActiveChat ? "text-white" : "text-slate-900")}>
                         {u.fullName || 'Unknown'}
                       </h4>
                    </div>
                    {uStatus ? (
                      <p className={cn("text-[10px] italic truncate font-bold leading-normal mt-0.5", isActiveChat ? "text-rose-100" : "text-emerald-700")}>
                        💬 {uStatus}
                      </p>
                    ) : (
                      <p className={cn("text-[9px] truncate tracking-tight font-medium opacity-80 mt-0.5", isActiveChat ? "text-rose-50" : "text-slate-500")}>
                        {u.role} • {u.department || 'Creative'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic & Collapsible Connection Profile Editor setup */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 transition-all">
             <button
               onClick={() => setIsProfileOpen(!isProfileOpen)}
               className="w-full flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-wider outline-none"
             >
               <span className="flex items-center gap-1.5 focus:outline-none">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 My Connection Profile
               </span>
               <span className="text-slate-400 hover:text-slate-700 text-xs font-semibold select-none">
                 {isProfileOpen ? "Minimize ▲" : "Update Profile ▼"}
               </span>
             </button>

             {/* Unfolded state profile updater */}
             <div className={cn("mt-2 space-y-2", isProfileOpen ? "block" : "hidden")}>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <div className="relative shrink-0 select-none">
                    <div className={cn(
                      "w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-slate-100",
                      profileRAG === 'green' ? 'ring-2 ring-emerald-500' : profileRAG === 'amber' ? 'ring-2 ring-amber-400' : 'ring-2 ring-rose-500'
                    )}>
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-black uppercase text-slate-700 bg-slate-200 border border-white">
                          {(currentUser.fullName || currentUser.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                     <h4 className="text-xs font-black text-slate-900 truncate leading-tight">{currentUser.fullName || currentUser.email.split('@')[0]}</h4>
                     <p className="text-[9px] text-slate-500 truncate italic font-bold">{profileStatus || 'No current status'}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                   <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Focus message</label>
                     <input 
                       type="text" 
                       placeholder="Update connection status message..." 
                       value={profileStatus} 
                       onChange={(e) => setProfileStatus(e.target.value)}
                       className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 placeholder:text-slate-400"
                     />
                   </div>

                   {/* RAG Switch */}
                   <div>
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Focus priority (RAG Outline)</label>
                     <div className="grid grid-cols-3 gap-1 select-none">
                        <button 
                          type="button" 
                          onClick={() => setProfileRAG('green')}
                          className={cn(
                            "py-1 rounded-md text-[9px] font-extrabold flex items-center justify-center gap-0.5 border transition-all",
                            profileRAG === 'green' ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Green
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setProfileRAG('amber')}
                          className={cn(
                            "py-1 rounded-md text-[9px] font-extrabold flex items-center justify-center gap-0.5 border transition-all",
                            profileRAG === 'amber' ? "bg-amber-500 text-white border-amber-500 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Amber
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setProfileRAG('red')}
                          className={cn(
                            "py-1 rounded-md text-[9px] font-extrabold flex items-center justify-center gap-0.5 border transition-all",
                            profileRAG === 'red' ? "bg-rose-600 text-white border-rose-600 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Red
                        </button>
                     </div>
                   </div>

                   {/* Avatar Presets Selection */}
                   <div>
                     <div className="flex gap-1 items-center justify-between mb-1">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avatar Preset:</span>
                         <div className="flex gap-1 font-semibold">
                           {AVATAR_PRESETS.map((preset, idx) => (
                              <button 
                                key={idx}
                                type="button"
                                onClick={() => setProfileAvatar(preset)}
                                className={cn("w-4.5 h-4.5 rounded-full overflow-hidden border transition-all", profileAvatar === preset ? "border-emerald-600 ring-2 ring-emerald-100 scale-110" : "border-slate-200 hover:scale-105")}
                              >
                                <img src={preset} alt="" className="w-full h-full object-cover" />
                              </button>
                           ))}
                           <button
                             type="button"
                             onClick={() => setProfileAvatar('')}
                             className={cn("w-4.5 h-4.5 rounded-full border text-[7px] font-black text-slate-500 uppercase flex items-center justify-center bg-white", !profileAvatar ? "border-emerald-600" : "border-slate-200")}
                             title="Clear preset and use user initials"
                           >
                             Init
                           </button>
                         </div>
                     </div>
                     <input 
                       type="text" 
                       placeholder="Url of avatar picture..." 
                       value={profileAvatar} 
                       onChange={(e) => setProfileAvatar(e.target.value)}
                       className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-500 placeholder:text-slate-400"
                     />
                   </div>

                   <button 
                     type="button"
                     onClick={handleSaveProfile}
                     disabled={isUpdating}
                     className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 disabled:opacity-50 shadow-sm mt-2"
                   >
                     {isUpdating ? "Saving status..." : updateSuccess ? "Status Saved ✓" : "Commit Status"}
                   </button>
                </div>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
