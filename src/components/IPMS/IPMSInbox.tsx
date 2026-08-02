import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Send, Inbox, Star, Trash2, Paperclip, Search, RefreshCw,
  Plus, Check, X, User as UserIcon, FileText, Image as ImageIcon,
  Download, ArrowLeft, Reply, CornerDownLeft, Shield, Users,
  CheckCircle2, Clock, Volume2, Sparkles, AlertCircle
} from 'lucide-react';
import type { User } from '../../types';
import { playWooshSound, playDingSound } from '../../utils/soundEffects';

interface IPMSInboxProps {
  currentUser: User;
  activeTenantId: string;
}

interface Attachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

interface InboxMessage {
  id: string;
  threadId: string;
  replyToId?: string;
  tenantId: string;
  senderEmail: string;
  senderName: string;
  senderJobTitle?: string;
  recipientEmails: string[];
  recipientNames: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
  createdAt: string;
  readBy?: string[];
  starredBy?: string[];
  trashedBy?: string[];
}

interface DirectoryUser {
  id?: string;
  email: string;
  fullName: string;
  jobFunction?: string;
  department?: string;
  avatarUrl?: string;
}

export function IPMSInbox({ currentUser, activeTenantId }: IPMSInboxProps) {
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  // Navigation / Folder state
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // Messages & Threads State
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Directory Users (Azure AD)
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<DirectoryUser[]>([]);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  // Reply State
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replying, setReplying] = useState(false);

  // Unread tracker for sound notification
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  // Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotify = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Directory Users
  const fetchDirectoryUsers = async () => {
    setDirectoryLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/users?minimal=true`);
      if (res.ok) {
        const data = await res.json();
        const userList = Array.isArray(data) ? data : (data.users || []);
        const formatted: DirectoryUser[] = userList.map((u: any) => ({
          email: u.email || '',
          fullName: u.fullName || u.email?.split('@')[0] || 'Directory User',
          jobFunction: u.jobFunction || u.systemRole || 'Staff Member',
          department: u.department || 'Municipal Administration',
          avatarUrl: u.avatarUrl
        })).filter((u: DirectoryUser) => u.email);
        setDirectoryUsers(formatted);
      }
    } catch (err) {
      console.warn("Failed to fetch directory users:", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  // Fetch Messages from Supabase
  const fetchInboxMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-inbox?userId=${encodeURIComponent(userEmail)}&t=${Date.now()}`);
      if (res.ok) {
        const data: InboxMessage[] = await res.json();
        const sorted = (data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Check for new incoming unread messages to trigger receive "ding" sound
        if (knownMessageIdsRef.current.size > 0) {
          const hasNewUnread = sorted.some(m => {
            const isForMe = (m.recipientEmails || []).some(e => e.toLowerCase() === userEmail);
            const isUnreadByMe = !(m.readBy || []).map(e => e.toLowerCase()).includes(userEmail);
            const isNew = !knownMessageIdsRef.current.has(m.id);
            return isForMe && isUnreadByMe && isNew;
          });

          if (hasNewUnread) {
            playDingSound();
            showNotify("New message received in IPMS Inbox!", "info");
          }
        }

        // Update known IDs
        sorted.forEach(m => knownMessageIdsRef.current.add(m.id));
        setMessages(sorted);
      }
    } catch (err) {
      console.error("Error fetching inbox messages:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectoryUsers();
    fetchInboxMessages();

    // Auto-poll for new messages every 12 seconds
    const interval = setInterval(() => {
      fetchInboxMessages(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [activeTenantId, userEmail]);

  // Handle Mark Action (Read, Star, Trash)
  const handleMessageAction = async (messageId: string, action: 'markRead' | 'markUnread' | 'toggleStar' | 'moveToTrash' | 'restore') => {
    // Optimistic state update
    setMessages(prev => prev.map(m => {
      if (m.id === messageId || m.threadId === messageId) {
        const readBy = new Set((m.readBy || []).map(e => e.toLowerCase()));
        const starredBy = new Set((m.starredBy || []).map(e => e.toLowerCase()));
        const trashedBy = new Set((m.trashedBy || []).map(e => e.toLowerCase()));

        if (action === 'markRead') readBy.add(userEmail);
        if (action === 'markUnread') readBy.delete(userEmail);
        if (action === 'toggleStar') {
          if (starredBy.has(userEmail)) starredBy.delete(userEmail);
          else starredBy.add(userEmail);
        }
        if (action === 'moveToTrash') trashedBy.add(userEmail);
        if (action === 'restore') trashedBy.delete(userEmail);

        return {
          ...m,
          readBy: Array.from(readBy),
          starredBy: Array.from(starredBy),
          trashedBy: Array.from(trashedBy)
        };
      }
      return m;
    }));

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-inbox/${messageId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userEmail })
      });
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  // Process File Uploads to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string
        };

        if (isReply) {
          setReplyAttachments(prev => [...prev, attachment]);
        } else {
          setComposeAttachments(prev => [...prev, attachment]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Send New Message
  const handleSendMessage = async () => {
    if (selectedRecipients.length === 0) {
      showNotify("Please add at least one recipient from the Azure AD Directory.", "error");
      return;
    }
    if (!composeSubject.trim()) {
      showNotify("Please enter a subject for your message.", "error");
      return;
    }
    if (!composeBody.trim()) {
      showNotify("Please write some message body content.", "error");
      return;
    }

    setSending(true);

    const payload = {
      senderEmail: currentUser.email,
      senderName: currentUser.fullName || currentUser.email.split('@')[0],
      senderJobTitle: currentUser.jobFunction || currentUser.systemRole || 'Municipal Official',
      recipientEmails: selectedRecipients.map(r => r.email),
      recipientNames: selectedRecipients.map(r => r.fullName),
      subject: composeSubject,
      body: composeBody,
      attachments: composeAttachments
    };

    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Play Woosh Sound on successful send!
        playWooshSound();

        showNotify("Message sent successfully!", "success");
        setIsComposeOpen(false);
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        setSelectedRecipients([]);
        setRecipientInput('');

        // Refresh list from Supabase
        await fetchInboxMessages(true);
      } else {
        const errData = await res.json();
        showNotify(errData.error || "Failed to send message.", "error");
      }
    } catch (err) {
      console.error("Send error:", err);
      showNotify("An unexpected error occurred while sending.", "error");
    } finally {
      setSending(false);
    }
  };

  // Send Reply in Thread
  const handleSendReply = async (threadMessages: InboxMessage[]) => {
    if (!replyBody.trim()) return;

    setReplying(true);
    const lastMsg = threadMessages[threadMessages.length - 1];

    // Determine recipients (all original thread participants except current user)
    const allParticipants = new Set<string>();
    threadMessages.forEach(m => {
      allParticipants.add(m.senderEmail.toLowerCase());
      (m.recipientEmails || []).forEach(r => allParticipants.add(r.toLowerCase()));
    });
    allParticipants.delete(userEmail);

    const replyRecipients = Array.from(allParticipants);
    if (replyRecipients.length === 0) {
      // Replying to oneself
      replyRecipients.push(userEmail);
    }

    const recipientNames = replyRecipients.map(e => {
      const found = directoryUsers.find(u => u.email.toLowerCase() === e);
      return found ? found.fullName : e.split('@')[0];
    });

    const payload = {
      senderEmail: currentUser.email,
      senderName: currentUser.fullName || currentUser.email.split('@')[0],
      senderJobTitle: currentUser.jobFunction || currentUser.systemRole || 'Municipal Official',
      recipientEmails: replyRecipients,
      recipientNames: recipientNames,
      subject: lastMsg.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject}`,
      body: replyBody,
      attachments: replyAttachments,
      threadId: lastMsg.threadId,
      replyToId: lastMsg.id
    };

    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Play Woosh sound on send!
        playWooshSound();

        setReplyBody('');
        setReplyAttachments([]);
        showNotify("Reply sent off!", "success");

        await fetchInboxMessages(true);
      } else {
        showNotify("Failed to send reply.", "error");
      }
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setReplying(false);
    }
  };

  // Filter messages based on active folder & search
  const filteredMessages = messages.filter(m => {
    const isSender = m.senderEmail.toLowerCase() === userEmail;
    const isRecipient = (m.recipientEmails || []).some(r => r.toLowerCase() === userEmail);
    const isStarred = (m.starredBy || []).map(e => e.toLowerCase()).includes(userEmail);
    const isTrashed = (m.trashedBy || []).map(e => e.toLowerCase()).includes(userEmail);

    // Folder filtering
    if (activeFolder === 'trash') {
      if (!isTrashed) return false;
    } else {
      if (isTrashed) return false;
      if (activeFolder === 'inbox' && !isRecipient) return false;
      if (activeFolder === 'sent' && !isSender) return false;
      if (activeFolder === 'starred' && !isStarred) return false;
    }

    // Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSubject = (m.subject || '').toLowerCase().includes(q);
      const matchBody = (m.body || '').toLowerCase().includes(q);
      const matchSender = (m.senderName || '').toLowerCase().includes(q) || (m.senderEmail || '').toLowerCase().includes(q);
      const matchRecipients = (m.recipientNames || []).some(r => r.toLowerCase().includes(q));
      if (!matchSubject && !matchBody && !matchSender && !matchRecipients) return false;
    }

    return true;
  });

  // Group filtered messages into threads
  const threadsMap: { [threadId: string]: InboxMessage[] } = {};
  filteredMessages.forEach(m => {
    const tid = m.threadId || m.id;
    if (!threadsMap[tid]) threadsMap[tid] = [];
    threadsMap[tid].push(m);
  });

  // Convert map to thread summaries sorted by latest message
  const threadSummaries = Object.keys(threadsMap).map(tid => {
    const threadMsgs = threadsMap[tid].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const latest = threadMsgs[threadMsgs.length - 1];
    const hasUnread = threadMsgs.some(m => {
      const isForMe = (m.recipientEmails || []).some(r => r.toLowerCase() === userEmail);
      const isUnreadByMe = !(m.readBy || []).map(e => e.toLowerCase()).includes(userEmail);
      return isForMe && isUnreadByMe;
    });
    const isStarred = threadMsgs.some(m => (m.starredBy || []).map(e => e.toLowerCase()).includes(userEmail));
    const totalAttachments = threadMsgs.reduce((acc, m) => acc + (m.attachments?.length || 0), 0);

    return {
      threadId: tid,
      messages: threadMsgs,
      latest,
      hasUnread,
      isStarred,
      totalAttachments,
      msgCount: threadMsgs.length
    };
  }).sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime());

  // Active Selected Thread
  const activeThread = selectedThreadId ? threadSummaries.find(t => t.threadId === selectedThreadId) : null;

  // Selected Thread Messages
  const activeThreadMsgs = activeThread ? activeThread.messages : [];

  // When opening a thread, auto mark messages as read
  useEffect(() => {
    if (activeThreadMsgs.length > 0) {
      activeThreadMsgs.forEach(m => {
        const isForMe = (m.recipientEmails || []).some(r => r.toLowerCase() === userEmail);
        const isUnreadByMe = !(m.readBy || []).map(e => e.toLowerCase()).includes(userEmail);
        if (isForMe && isUnreadByMe) {
          handleMessageAction(m.id, 'markRead');
        }
      });
    }
  }, [selectedThreadId]);

  // Statistics
  const unreadCount = messages.filter(m => {
    const isForMe = (m.recipientEmails || []).some(r => r.toLowerCase() === userEmail);
    const isUnreadByMe = !(m.readBy || []).map(e => e.toLowerCase()).includes(userEmail);
    const isTrashed = (m.trashedBy || []).map(e => e.toLowerCase()).includes(userEmail);
    return isForMe && isUnreadByMe && !isTrashed;
  }).length;

  const sentCount = messages.filter(m => m.senderEmail.toLowerCase() === userEmail).length;

  // Directory Search Filtered Users
  const filteredDirectoryUsers = directoryUsers.filter(u => {
    if (!recipientInput.trim()) return true;
    const q = recipientInput.toLowerCase().trim();
    const isAlreadySelected = selectedRecipients.some(sr => sr.email.toLowerCase() === u.email.toLowerCase());
    if (isAlreadySelected) return false;
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Top Banner & Quick Stats Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-4 lg:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">IPMS Messenger & Directory Inbox</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Supabase Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-400">Direct Municipal Directory Communication & Dynamic File Exchange</p>
          </div>
        </div>

        {/* Action Controls & Stats */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">{directoryUsers.length}</span> AD Directory Users
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Inbox className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">{unreadCount}</span> Unread
          </div>

          <button
            onClick={() => fetchInboxMessages()}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Compose Message
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/80 border-rose-800/80 text-rose-200' :
          'bg-indigo-950/80 border-indigo-800/80 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Inbox Workspace Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar Folders */}
        <div className="w-full md:w-56 bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex md:flex-col justify-between shrink-0">
          <div className="space-y-1 w-full flex md:block overflow-x-auto gap-2 md:gap-0">
            <button
              onClick={() => { setActiveFolder('inbox'); setSelectedThreadId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFolder === 'inbox' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
              </div>
              {unreadCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeFolder === 'inbox' ? 'bg-white text-indigo-600' : 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveFolder('sent'); setSelectedThreadId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFolder === 'sent' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Sent Items</span>
              </div>
              <span className="text-[10px] opacity-70">{sentCount}</span>
            </button>

            <button
              onClick={() => { setActiveFolder('starred'); setSelectedThreadId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFolder === 'starred' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                <span>Starred</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveFolder('trash'); setSelectedThreadId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFolder === 'trash' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </div>
            </button>
          </div>

          <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 px-2 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-400">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio Notifications</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Sending triggers a <span className="text-indigo-300 font-bold">woosh</span> sound effect. Receiving plays a crystal <span className="text-amber-300 font-bold">ding</span> chime.
            </p>
          </div>
        </div>

        {/* Middle Column: Threads & Messages List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50 ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Box */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search messages, subjects, senders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-medium">Loading Supabase Inbox...</p>
              </div>
            ) : threadSummaries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs font-bold text-slate-400">No messages found</p>
                <p className="text-[11px] text-slate-500">
                  {activeFolder === 'inbox' ? 'Your inbox is clear.' : `No items in ${activeFolder}.`}
                </p>
              </div>
            ) : (
              threadSummaries.map(summary => {
                const isSelected = summary.threadId === selectedThreadId;
                const { latest, hasUnread, isStarred, msgCount, totalAttachments } = summary;
                const isMyMessage = latest.senderEmail.toLowerCase() === userEmail;

                return (
                  <div
                    key={summary.threadId}
                    onClick={() => setSelectedThreadId(summary.threadId)}
                    className={`p-3.5 cursor-pointer transition relative hover:bg-slate-800/50 ${
                      isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : hasUnread ? 'bg-slate-800/30 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          {latest.senderName ? latest.senderName.charAt(0).toUpperCase() : 'U'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs truncate ${hasUnread ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                              {isMyMessage ? `To: ${(latest.recipientNames || []).join(', ')}` : latest.senderName}
                            </span>
                            {msgCount > 1 && (
                              <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
                                {msgCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {latest.senderJobTitle || 'Staff Member'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(latest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>

                        <div className="flex items-center gap-1">
                          {totalAttachments > 0 && (
                            <Paperclip className="w-3 h-3 text-slate-400" />
                          )}
                          {hasUnread && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className={`text-xs mb-1 truncate ${hasUnread ? 'font-bold text-indigo-200' : 'text-slate-300'}`}>
                      {latest.subject || '(No Subject)'}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                      {latest.body}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageAction(latest.id, 'toggleStar');
                          }}
                          className="hover:text-amber-400 transition"
                          title="Star message"
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageAction(latest.id, 'moveToTrash');
                        }}
                        className="hover:text-rose-400 transition"
                        title="Move to trash"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-rose-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Thread Workspace */}
        <div className={`flex-1 min-h-0 flex-col bg-slate-950/60 ${selectedThreadId ? 'flex' : 'hidden md:flex'}`}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-xl">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Select a Message Thread</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a conversation from the middle list to view message history, attachments, and reply directly.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Thread Header Bar */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedThreadId(null)}
                    className="md:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-white truncate">
                      {activeThread.latest.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>Thread ({activeThreadMsgs.length} messages)</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">
                        Recipients: {(activeThread.latest.recipientNames || []).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleMessageAction(activeThread.latest.id, 'toggleStar')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Star thread"
                  >
                    <Star className={`w-4 h-4 ${activeThread.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleMessageAction(activeThread.latest.id, 'moveToTrash')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition"
                    title="Move thread to trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thread Messages History List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-6">
                {activeThreadMsgs.map((msg, index) => {
                  const isMe = msg.senderEmail.toLowerCase() === userEmail;

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 lg:p-5 rounded-2xl border transition shadow-lg ${
                        isMe
                          ? 'bg-slate-900/90 border-indigo-500/30 ml-2 md:ml-8'
                          : 'bg-slate-900 border-slate-800 mr-2 md:mr-8'
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shadow-inner ${
                            isMe
                              ? 'bg-indigo-600 text-white border-indigo-400/40'
                              : 'bg-slate-800 text-indigo-400 border-slate-700'
                          }`}>
                            {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-white">{msg.senderName}</h4>
                              {isMe && (
                                <span className="px-2 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[9px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {msg.senderEmail} • {msg.senderJobTitle || 'Municipal Official'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {new Date(msg.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            To: {(msg.recipientNames || []).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Message Body Content */}
                      <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans my-3">
                        {msg.body}
                      </div>

                      {/* File Attachments Grid */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Attachments ({msg.attachments.length})</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.attachments.map((att, attIdx) => {
                              const isImage = att.type.startsWith('image/');

                              return (
                                <div
                                  key={attIdx}
                                  className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0">
                                      {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-200 truncate">{att.name}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        {(att.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>

                                  <a
                                    href={att.dataUrl}
                                    download={att.name}
                                    className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition"
                                    title="Download attachment"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Form */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-indigo-400" />
                      Quick Reply in Thread
                    </span>

                    <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-lg">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach File</span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Reply Attachments List */}
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {replyAttachments.map((att, idx) => (
                        <div key={idx} className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{att.name}</span>
                          <button
                            onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={3}
                    placeholder="Type your response here..."
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Sending triggers an audio <strong className="text-indigo-300">woosh</strong> notification.
                    </span>

                    <button
                      onClick={() => handleSendReply(activeThreadMsgs)}
                      disabled={replying || !replyBody.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                    >
                      {replying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Compose Message Modal Drawer */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">New IPMS Message</h3>
                  <p className="text-[11px] text-slate-400">Azure AD Directory Recipient Connection</p>
                </div>
              </div>

              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Recipient Picker connecting to Azure AD */}
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                  To (Recipients from Azure AD Directory):
                </label>

                {/* Selected Recipient Chips */}
                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl min-h-[46px] items-center">
                  {selectedRecipients.map((user, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <span>{user.fullName} ({user.email})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipients(prev => prev.filter((_, i) => i !== idx))}
                        className="text-indigo-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder={selectedRecipients.length === 0 ? "Type name or email to search Azure AD Directory..." : "Add another..."}
                    value={recipientInput}
                    onChange={e => {
                      setRecipientInput(e.target.value);
                      setShowDirectoryDropdown(true);
                    }}
                    onFocus={() => setShowDirectoryDropdown(true)}
                    className="flex-1 min-w-[200px] bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Azure AD Directory Suggestions Dropdown */}
                {showDirectoryDropdown && filteredDirectoryUsers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-800">
                    <div className="p-2 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Azure AD Directory Suggestions ({filteredDirectoryUsers.length})</span>
                      <button onClick={() => setShowDirectoryDropdown(false)} className="text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {filteredDirectoryUsers.map((user) => (
                      <div
                        key={user.email}
                        onClick={() => {
                          setSelectedRecipients(prev => [...prev, user]);
                          setRecipientInput('');
                          setShowDirectoryDropdown(false);
                        }}
                        className="p-3 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 text-xs font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{user.fullName}</p>
                            <p className="text-[10px] text-slate-400">{user.email} • {user.department || 'Municipal Staff'}</p>
                          </div>
                        </div>

                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded font-semibold">
                          {user.jobFunction || 'Official'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                  Subject:
                </label>
                <input
                  type="text"
                  placeholder="e.g. IPMS Performance Agreement Review / KPA Submission"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Message Body Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase block">
                    Message Body:
                  </label>
                  
                  {/* Quick Subject/Body Templates */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Quick Templates:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setComposeSubject("IPMS Performance Agreement Consultation");
                        setComposeBody("Dear Colleague,\n\nKindly review the attached Performance Agreement details and provide your input prior to sign-off.\n\nBest regards,\n" + (currentUser.fullName || 'Municipal Official'));
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-0.5 rounded font-semibold"
                    >
                      PA Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setComposeSubject("KPA & KPI Quarter Evaluation Clarification");
                        setComposeBody("Dear Team,\n\nPlease find the supporting proof of evidence (POE) attached for the quarterly KPI score evaluation.\n\nKind regards,\n" + (currentUser.fullName || 'Municipal Official'));
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded font-semibold"
                    >
                      KPA Evidence
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  placeholder="Type your official municipal message here..."
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase block">
                    Attachments ({composeAttachments.length}):
                  </label>

                  <label className="cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Upload Documents</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                {composeAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    {composeAttachments.map((att, idx) => (
                      <div key={idx} className="bg-slate-900 p-2.5 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{(att.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setComposeAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Messages are persistently saved to Supabase with sound triggers.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
