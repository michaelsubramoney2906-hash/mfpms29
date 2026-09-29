import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  CheckCheck, 
  Trash2, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck, 
  FileText, 
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Filter,
  Send,
  Paperclip,
  Volume2,
  VolumeX,
  Plus,
  X,
  Mail,
  Download
} from 'lucide-react';

export interface IPMSNotification {
  id: string;
  threadId?: string;
  parentId?: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  kpiId?: string;
  kpiIds?: string[];
  kpiNo?: string;
  quarter?: string;
  actionType: 'submission' | 'approval' | 'revision_requested' | 'audit_request' | 'audit_completed' | 'info' | 'planner_grid_sync' | 'redo_unlocked';
  senderCapacity?: 'standard_user' | 'manager_as_self' | 'manager_as_subordinate' | 'internal_auditor';
  poeDocsCount?: number;
  employeeEmail?: string;
  attachments?: Array<{
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
  }>;
  createdAt: string;
  read?: boolean;
  readAt?: string;
}

interface IPMSWorkflowInboxProps {
  role: 'manager' | 'auditor' | 'employee';
  currentUser: any;
  activeTenantId: string;
  onSelectUserPlan?: (userId: string, kpiId?: string, quarter?: string, targetKpiIds?: string[]) => void;
  className?: string;
}

const playNotificationSound = (force = false) => {
  const isMuted = localStorage.getItem('ipms_sound_muted') === 'true';
  if (isMuted && !force) return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // A beautiful 3-tone chime for maximum elegance
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gainNode.gain.setValueAtTime(0.12, now + idx * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch (err) {
    console.warn("Sound play failed:", err);
  }
};

const playActionSound = (force = false) => {
  const isMuted = localStorage.getItem('ipms_sound_muted') === 'true';
  if (isMuted && !force) return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // A crisp, soft, rapid double-tone (E5 -> A5) for action completion feedback
    const notes = [659.25, 880.00]; // E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gainNode.gain.setValueAtTime(0.08, now + idx * 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  } catch (err) {
    console.warn("Action sound play failed:", err);
  }
};

const safeJson = async (res: Response) => {
  if (!res || res.bodyUsed) return null;
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
  } catch (e: any) {
    if (!String(e).includes('consumed')) {
      console.warn("Error parsing JSON:", e);
    }
  }
  return null;
};

export function IPMSWorkflowInbox({
  role,
  currentUser,
  activeTenantId,
  onSelectUserPlan,
  className = ''
}: IPMSWorkflowInboxProps) {
  const [notifications, setNotifications] = useState<IPMSNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'action' | 'approval' | 'audit' | 'nkangala' | 'mzansiflow'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const userPrefix = userEmail.split('@')[0] || 'official';
  const nkangalaEmail = `${userPrefix}@nkangaladm.gov.za`;
  const mzansiflowEmail = `${userPrefix}@mzansiflow.co.za`;

  // Sender Domain Selection for Direct Message & Reply
  const [workflowSenderDomain, setWorkflowSenderDomain] = useState<'nkangala' | 'mzansiflow' | 'default'>('nkangala');
  const [workflowReplyDomain, setWorkflowReplyDomain] = useState<'nkangala' | 'mzansiflow' | 'default'>('nkangala');

  const getEffectiveWorkflowSender = (choice: 'nkangala' | 'mzansiflow' | 'default') => {
    if (choice === 'nkangala') return nkangalaEmail;
    if (choice === 'mzansiflow') return mzansiflowEmail;
    return currentUser?.email || nkangalaEmail;
  };

  // Sounds state
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem('ipms_sound_muted') === 'true');
  const prevUnreadCountRef = React.useRef<number | null>(null);

  // Direct Message & User Directory states
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [azureUsers, setAzureUsers] = useState<any[]>([]);
  const [searchingAzure, setSearchingAzure] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  // Debounced search for Azure AD user base
  useEffect(() => {
    if (!recipientSearch.trim()) {
      setAzureUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingAzure(true);
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(recipientSearch)}`);
        if (res.ok) {
          const data = await safeJson(res) || {};
          setAzureUsers(data || []);
        }
      } catch (err) {
        console.error("Error searching Azure AD user directory:", err);
      } finally {
        setSearchingAzure(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [recipientSearch]);

  // Consolidate both local tenant users and Azure AD directory search results uniquely by email
  const combinedSearchResults = React.useMemo(() => {
    const map = new Map<string, any>();
    tenantUsers.forEach(u => {
      if (u.email) map.set(u.email.toLowerCase().trim(), u);
    });
    azureUsers.forEach(u => {
      if (u.email) map.set(u.email.toLowerCase().trim(), u);
    });

    const q = recipientSearch.toLowerCase().trim();
    const list = Array.from(map.values());
    if (!q) return list;
    return list.filter(u => 
      (u.fullName || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q) ||
      (u.jobFunction || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q)
    );
  }, [tenantUsers, azureUsers, recipientSearch]);

  // Selective delete state
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);

  // Threading & Reply States
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  // Process reply attachments
  const handleReplyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    const errors: string[] = [];
    const newAttachments: any[] = [];

    for (const file of fileList) {
      if (file.size > 3.5 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 3.5MB size limit.`);
        continue;
      }
      try {
        const attachment = await new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl: reader.result as string
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newAttachments.push(attachment);
      } catch (err) {
        errors.push(`Failed to read "${file.name}".`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      setReplyAttachments(prev => [...prev, ...newAttachments]);
    }
    e.target.value = '';
  };

  // Fetch complete directory users (Azure AD & Mzansi Flow base)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let res = await fetch('/api/sharepoint/directory-users');
        if (!res.ok) {
          res = await fetch('/api/tenant/global/users');
        }
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await safeJson(res) || {};
            const list = Array.isArray(data) ? data : (data.users || []);
            setTenantUsers(list);
          }
        }
      } catch (e) {
        console.error("Error fetching directory users for messaging:", e);
      }
    };
    fetchUsers();
  }, [activeTenantId, currentUser]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const userEmail = (currentUser?.email || '').toLowerCase().trim();
      const isAuditor = role === 'auditor';
      const isManager = role === 'manager';

      const queryParams = new URLSearchParams({
        userEmail,
        role,
        isAuditor: String(isAuditor),
        isManager: String(isManager),
        t: String(Date.now())
      });

      const tenantToUse = (activeTenantId && activeTenantId !== 'undefined' && activeTenantId !== 'null')
        ? activeTenantId
        : (currentUser?.tenantId || 'nkangala_auto');

      const res = await fetch(`/api/tenant/${tenantToUse}/ipms-notifications?${queryParams.toString()}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await safeJson(res) || {};
          const nextNotifs = data.notifications || [];
          setNotifications(nextNotifs);

          // Check if unread count increased to play notification sound
          const currentUnread = nextNotifs.filter((n: any) => !n.read).length;
          if (prevUnreadCountRef.current !== null && currentUnread > prevUnreadCountRef.current) {
            playNotificationSound();
          }
          prevUnreadCountRef.current = currentUnread;
        } else {
          console.warn("Expected JSON response for inbox notifications but received:", contentType);
        }
      }
    } catch (e) {
      console.error("Error fetching inbox notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [currentUser?.email, activeTenantId, role]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId })
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      playActionSound();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      playActionSound();
    } catch (e) {
      console.error(e);
    }
  };

  // Selective & Single notification deletion
  const handleDeleteSelected = async (idsToDelete: string[]) => {
    console.log("[IPMS Delete UI] handleDeleteSelected called with IDs:", idsToDelete);
    if (idsToDelete.length === 0) return;

    // Resolve any nested replies in the selected threads so they are deleted together and don't orphan!
    const allIdsInThreads: string[] = [];
    idsToDelete.forEach(id => {
      const notif = notifications.find(n => n.id === id);
      const threadId = notif?.threadId || id;
      notifications.forEach(n => {
        const tId = n.threadId || n.id;
        if (tId === threadId) {
          allIdsInThreads.push(n.id);
        }
      });
    });

    const finalIdsToDelete = Array.from(new Set([...idsToDelete, ...allIdsInThreads]));
    console.log("[IPMS Delete UI] Final IDs to delete (including threads):", finalIdsToDelete);

    // Save previous state in case we need to rollback
    const previousNotifications = [...notifications];

    try {
      setLoading(true);
      // Optimistic UI state update so user gets instant confirmation
      console.log("[IPMS Delete UI] Mutating optimistic local state...");
      setNotifications(prev => prev.filter(n => n && n.id && !finalIdsToDelete.includes(n.id)));
      setSelectedNotifIds(prev => prev.filter(id => !finalIdsToDelete.includes(id)));

      console.log(`[IPMS Delete UI] Sending DELETE API call for tenant ${activeTenantId}...`);
      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: finalIdsToDelete })
      });
      
      if (res.ok) {
        console.log(`[IPMS Delete UI] Backend deletion successful.`);
        // Refresh silently from backend
        await fetchInbox();
        playActionSound();
      } else {
        const errorData = await safeJson(res) || {};
        console.error(`[IPMS Delete UI] Backend deletion failed:`, errorData);
        // Rollback state
        setNotifications(previousNotifications);
      }
    } catch (e: any) {
      console.error("[IPMS Delete UI] Network/Execution Error deleting notifications:", e);
      // Rollback state
      setNotifications(previousNotifications);
    } finally {
      setLoading(false);
      console.log("[IPMS Delete UI] Deletion lifecycle complete.");
    }
  };

  const handleClearAll = async () => {
    const visibleIds = filteredItems.map(item => item.id);
    console.log("[IPMS Delete UI] handleClearAll called. Visible IDs:", visibleIds);
    
    if (visibleIds.length === 0) {
      console.log("No notifications to delete in this view.");
      return;
    }
    await handleDeleteSelected(visibleIds);
  };

  // Attachments processing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    
    const errors: string[] = [];
    const newAttachments: any[] = [];

    for (const file of fileList) {
      if (file.size > 3.5 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 3.5MB size limit.`);
        continue;
      }

      try {
        const attachment = await new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl: reader.result as string
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newAttachments.push(attachment);
      } catch (err) {
        errors.push(`Failed to read "${file.name}".`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    
    e.target.value = '';
  };

  // Direct Message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) {
      alert("Please select a recipient from the user directory.");
      return;
    }
    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }
    if (!body.trim()) {
      alert("Please enter a message body.");
      return;
    }

    try {
      setSending(true);
      const recipientUser = tenantUsers.find(u => u.email === selectedRecipient);
      const senderName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'User';
      
      const effectiveSender = getEffectiveWorkflowSender(workflowSenderDomain);
      const payload = {
        notification: {
          senderEmail: effectiveSender,
          senderName: senderName,
          recipientEmail: selectedRecipient,
          recipientName: recipientUser?.fullName || recipientUser?.name || selectedRecipient,
          title: subject.trim(),
          message: body.trim(),
          actionType: 'info' as const, 
          poeDocsCount: attachments.length,
          attachments: attachments
        }
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubject('');
        setBody('');
        setAttachments([]);
        setSelectedRecipient('');
        setRecipientSearch('');
        setShowCompose(false);
        fetchInbox();
        playActionSound();
      } else {
        const err = await safeJson(res) || {};
        alert(`Failed to send message: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending the message.");
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (parent: IPMSNotification) => {
    if (!replyBody.trim()) {
      alert("Please type a reply message.");
      return;
    }

    try {
      setSendingReply(true);
      const isSenderCurrentUser = (parent.senderEmail || '').toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim() ||
        (parent.senderEmail || '').toLowerCase().trim() === nkangalaEmail.toLowerCase() ||
        (parent.senderEmail || '').toLowerCase().trim() === mzansiflowEmail.toLowerCase();
      const recipientEmail = isSenderCurrentUser ? parent.recipientEmail : parent.senderEmail;
      const recipientName = isSenderCurrentUser ? parent.recipientName : parent.senderName;
      const senderName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'User';

      const effectiveReplySender = getEffectiveWorkflowSender(workflowReplyDomain);
      const payload = {
        notification: {
          threadId: parent.threadId || parent.id,
          parentId: parent.id,
          senderEmail: effectiveReplySender,
          senderName: senderName,
          recipientEmail: recipientEmail,
          recipientName: recipientName,
          title: parent.title.startsWith('Re:') ? parent.title : `Re: ${parent.title}`,
          message: replyBody.trim(),
          actionType: 'info' as const, 
          poeDocsCount: replyAttachments.length,
          attachments: replyAttachments
        }
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReplyBody('');
        setReplyAttachments([]);
        setReplyingToId(null);
        // Automatically expand this thread
        setExpandedThreads(prev => ({ ...prev, [parent.threadId || parent.id]: true }));
        fetchInbox();
        playActionSound();
      } else {
        const err = await safeJson(res) || {};
        alert(`Failed to send reply: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending the reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const toggleSound = () => {
    const val = !soundMuted;
    setSoundMuted(val);
    localStorage.setItem('ipms_sound_muted', String(val));
    if (!val) {
      setTimeout(() => playNotificationSound(true), 100);
    }
  };

  // Filter by role to avoid manager receiving employee notifications in manager inbox, and vice versa
  const roleFilteredNotifications = React.useMemo(() => {
    return notifications.filter(n => {
      const rec = (n.recipientEmail || '').toLowerCase().trim();
      const user = (currentUser?.email || '').toLowerCase().trim();
      
      if (role === 'employee') {
        if (n.actionType === 'submission' && rec === user) return false;
        if (n.actionType === 'planner_grid_sync' && rec === user) return false;
        if (n.actionType === 'audit_request' && rec === user) return false;
      } else if (role === 'manager') {
        if (n.actionType === 'approval' && rec === user) return false;
        if (n.actionType === 'revision_requested' && rec === user) return false;
        if (n.actionType === 'redo_unlocked' && rec === user) return false;
      }
      return true;
    });
  }, [notifications, role, currentUser]);

  // Group replies by threadId
  const threadGroups = React.useMemo(() => {
    const groups: Record<string, IPMSNotification[]> = {};
    roleFilteredNotifications.forEach(n => {
      const tId = n.threadId || n.id;
      if (!groups[tId]) {
        groups[tId] = [];
      }
      groups[tId].push(n);
    });
    // Sort each group so oldest (root) is first, replies are ordered chronologically
    Object.keys(groups).forEach(tId => {
      groups[tId].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    });
    return groups;
  }, [notifications]);

  // Identify root messages (the earliest message of each threadGroup)
  const rootMessages = React.useMemo(() => {
    const roots: IPMSNotification[] = [];
    Object.keys(threadGroups).forEach(tId => {
      const group = threadGroups[tId];
      if (group.length > 0) {
        roots.push(group[0]);
      }
    });
    // Sort roots by newest first (based on the latest activity in the thread!)
    roots.sort((a, b) => {
      const threadA = threadGroups[a.threadId || a.id] || [];
      const threadB = threadGroups[b.threadId || b.id] || [];
      const latestA = threadA[threadA.length - 1]?.createdAt || a.createdAt;
      const latestB = threadB[threadB.length - 1]?.createdAt || b.createdAt;
      return new Date(latestB).getTime() - new Date(latestA).getTime();
    });
    return roots;
  }, [threadGroups]);

  // Filter items
  const filteredItems = rootMessages.filter(root => {
    const thread = threadGroups[root.threadId || root.id] || [root];
    
    // Check if any message in the thread matches search term
    const matchesSearch = !searchTerm || thread.some(item => 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!matchesSearch) return false;

    // Check action type filters on the root or any message in the thread
    if (filterCategory === 'action') {
      return thread.some(item => item.actionType === 'submission' || item.actionType === 'revision_requested' || item.actionType === 'audit_request');
    }
    if (filterCategory === 'approval') {
      return thread.some(item => item.actionType === 'approval' || item.actionType === 'audit_completed');
    }
    if (filterCategory === 'audit') {
      return thread.some(item => item.actionType === 'audit_request' || item.actionType === 'audit_completed');
    }
    if (filterCategory === 'nkangala') {
      return thread.some(item => 
        (item.senderEmail || '').toLowerCase().includes('nkangaladm.gov.za') ||
        (item.recipientEmail || '').toLowerCase().includes('nkangaladm.gov.za')
      );
    }
    if (filterCategory === 'mzansiflow') {
      return thread.some(item => 
        (item.senderEmail || '').toLowerCase().includes('mzansiflow.co.za') ||
        (item.recipientEmail || '').toLowerCase().includes('mzansiflow.co.za')
      );
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleHeader = () => {
    if (role === 'manager') {
      return {
        title: 'Line Manager Workflow Inbox',
        subtitle: 'Incoming subordinate KPI submissions & PoE verification alerts',
        badgeColor: 'bg-indigo-600 text-white',
        icon: UserCheck
      };
    }
    if (role === 'auditor') {
      return {
        title: 'Internal Audit Dispatch Inbox',
        subtitle: 'Line-approved KPI performance plans pushed for oversight & rating',
        badgeColor: 'bg-emerald-600 text-white',
        icon: ShieldCheck
      };
    }
    return {
      title: 'My Performance & Review Inbox',
      subtitle: 'Real-time manager evaluation feedback, PoE revisions, & audit sign-offs',
      badgeColor: 'bg-blue-600 text-white',
      icon: Bell
    };
  };

  const roleInfo = getRoleHeader();
  const HeaderIcon = roleInfo.icon;

  return (
    <div className={`bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-indigo-400">
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wide text-white m-0">
                {roleInfo.title}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 m-0 font-medium">
              {roleInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Sounds Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title={soundMuted ? "Unmute notification sounds" : "Mute notification sounds"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
          </button>

          {/* New DM Message Button */}
          <button
            type="button"
            onClick={() => setShowCompose(!showCompose)}
            className={`px-3 py-1.5 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 border cursor-pointer ${
              showCompose 
                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800' 
                : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-800'
            }`}
            title="Compose direct message with attachments"
          >
            {showCompose ? <X className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            <span>{showCompose ? 'Close Draft' : 'Compose DM'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchInbox}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl transition text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
              Mark Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={selectedNotifIds.length > 0 ? () => handleDeleteSelected(selectedNotifIds) : handleClearAll}
              className={`px-2.5 py-1.5 rounded-xl transition text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                selectedNotifIds.length > 0
                  ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border-rose-700'
                  : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800/80'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{selectedNotifIds.length > 0 ? `Delete Selected (${selectedNotifIds.length})` : 'Clear View'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <div className="mt-3 p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              New Direct Message
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Basis: User Directory</span>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-3">
            {/* Sender Domain Picker */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Send Communique As (From):
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setWorkflowSenderDomain('nkangala')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    workflowSenderDomain === 'nkangala'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                      : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
                  }`}
                >
                  <span>🏛️</span>
                  <span>{nkangalaEmail}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkflowSenderDomain('mzansiflow')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    workflowSenderDomain === 'mzansiflow'
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                      : 'bg-slate-950 text-slate-400 hover:text-indigo-300 border border-slate-800'
                  }`}
                >
                  <span>⚡</span>
                  <span>{mzansiflowEmail}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkflowSenderDomain('default')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    workflowSenderDomain === 'default'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>👤</span>
                  <span>{currentUser.email}</span>
                </button>
              </div>
            </div>

            {/* Searchable Recipient Picker */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Recipient</label>
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="text-slate-500 font-bold">Quick:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipient('mm@nkangaladm.gov.za'); setRecipientSearch(''); }}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    mm@nkangala
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipient('pms@nkangaladm.gov.za'); setRecipientSearch(''); }}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    pms@nkangala
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecipient('compliance@mzansiflow.co.za'); setRecipientSearch(''); }}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    compliance@mzansiflow
                  </button>
                </div>
              </div>

              {selectedRecipient ? (
                <div className="flex items-center justify-between bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {combinedSearchResults.find(u => u.email === selectedRecipient)?.fullName || selectedRecipient}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({selectedRecipient})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipient('');
                      setRecipientSearch('');
                    }}
                    className="text-rose-400 hover:text-rose-300 font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recipientSearch.trim()) {
                        e.preventDefault();
                        const target = recipientSearch.includes('@') ? recipientSearch.trim() : `${recipientSearch.trim()}@nkangaladm.gov.za`;
                        setSelectedRecipient(target);
                        setRecipientSearch('');
                      }
                    }}
                    placeholder="Search user, or type email e.g. mm@nkangaladm.gov.za..."
                    className="w-full pl-8 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {searchingAzure && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    </div>
                  )}
                  {recipientSearch.trim() && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/60">
                      {combinedSearchResults.slice(0, 25).map((u, idx) => {
                        const isNkangala = (u.email || '').toLowerCase().endsWith('@nkangaladm.gov.za');
                        const isMzansi = (u.email || '').toLowerCase().endsWith('@mzansiflow.co.za');

                        return (
                          <button
                            key={`wf-user-${u.email}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSelectedRecipient(u.email);
                              setRecipientSearch('');
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-800 transition text-xs flex justify-between items-center cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                                isNkangala
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                                  : isMzansi
                                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {(u.fullName || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-200 group-hover:text-indigo-300 transition truncate">{u.fullName || u.email}</span>
                                  <span className={`text-[8px] font-mono px-1 py-0.2 rounded border shrink-0 ${
                                    isNkangala
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800/40'
                                      : isMzansi
                                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                    {isNkangala ? '🏛️ Nkangala' : isMzansi ? '⚡ Mzansi' : 'External'}
                                  </span>
                                </div>
                                {u.jobFunction && (
                                  <span className="text-[9px] text-slate-400 block truncate">
                                    {u.jobFunction} {u.department ? `• ${u.department}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{u.email}</span>
                          </button>
                        );
                      })}

                      {/* Custom address option if user typed full valid email not in list */}
                      {recipientSearch.includes('@') && !combinedSearchResults.some(u => u.email.toLowerCase().trim() === recipientSearch.toLowerCase().trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecipient(recipientSearch.trim());
                            setRecipientSearch('');
                          }}
                          className="w-full text-left px-3 py-2 bg-slate-950/80 hover:bg-indigo-950/40 transition text-xs flex justify-between items-center text-slate-300 border-t border-slate-800 cursor-pointer"
                        >
                          <span className="font-mono text-[11px] text-indigo-300">
                            ✉️ Send to custom address: <b className="text-white">{recipientSearch.trim()}</b>
                          </span>
                          <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">Select</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject Line */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                required
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Attachments (Max 3.5MB per file)</label>
              
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-500">Attach PDFs, Word, Excel, images, etc.</span>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {attachments.map((file, fIdx) => (
                    <div key={fIdx} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-2">
                      <span className="text-indigo-300 font-medium truncate max-w-[150px]">{file.name}</span>
                      <span className="text-[9px] text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== fIdx))}
                        className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Controls */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  setShowCompose(false);
                  setSubject('');
                  setBody('');
                  setAttachments([]);
                }}
                className="px-3 py-1.5 hover:bg-slate-800/80 text-slate-400 rounded-xl transition text-[11px] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'all' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            All Messages ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('action')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'action' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            Action Needed
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('approval')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'approval' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            Approved & Verified
          </button>
          {role !== 'employee' && (
            <button
              type="button"
              onClick={() => setFilterCategory('audit')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === 'audit' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              Audit Requests
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterCategory('nkangala')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterCategory === 'nkangala' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/50'
            }`}
            title="Filter communique to/from @nkangaladm.gov.za"
          >
            <span>🏛️</span>
            <span>@nkangaladm.gov.za</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('mzansiflow')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterCategory === 'mzansiflow' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/50'
            }`}
            title="Filter communique to/from @mzansiflow.co.za"
          >
            <span>⚡</span>
            <span>@mzansiflow.co.za</span>
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inbox..."
            className="w-full pl-8 pr-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Multi-Select Status Ribbon */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-xl text-xs mt-3 text-slate-400">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filteredItems.length > 0 && filteredItems.every(item => selectedNotifIds.includes(item.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  const allVisibleIds = filteredItems.map(item => item.id);
                  setSelectedNotifIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                } else {
                  const allVisibleIds = filteredItems.map(item => item.id);
                  setSelectedNotifIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                }
              }}
              className="w-3.5 h-3.5 rounded border-slate-800 text-indigo-600 bg-slate-900 focus:ring-0 cursor-pointer"
            />
            <span className="font-bold text-[10px] uppercase tracking-wider">Select All Visible</span>
          </div>
          {selectedNotifIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-indigo-400 font-black tracking-wide font-mono">
                {selectedNotifIds.length} Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedNotifIds([])}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white text-[10px] text-slate-300 rounded-lg font-bold transition cursor-pointer"
                title="Deselect all messages"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSelected(selectedNotifIds)}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 hover:text-rose-100 text-[10px] rounded-lg font-bold transition cursor-pointer flex items-center gap-1 border border-rose-800/50"
                title="Delete selected conversation threads"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message List */}
      <div className="mt-3 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading workflow messages...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50 space-y-2">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400 m-0">No inbox items match this filter.</p>
            <p className="text-[11px] text-slate-500 m-0">
              {role === 'manager' && 'Subordinate KPI submissions and PoE verification requests will appear here automatically.'}
              {role === 'auditor' && 'Line-manager approved performance plans pushed for internal audit oversight will arrive here.'}
              {role === 'employee' && 'Line manager evaluation comments, score updates, and PoE feedback will show up here.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isUnread = !item.read;
            const isRevisionReq = item.actionType === 'revision_requested';
            const isApproval = item.actionType === 'approval' || item.actionType === 'audit_completed';
            const isAuditReq = item.actionType === 'audit_request';
            const isSubmission = item.actionType === 'submission';

            const rawCapacity = item.senderCapacity || (
              item.actionType === 'submission'
                ? ((item.senderEmail || '').toLowerCase().includes('khuboni') ? 'manager_as_self' : 'standard_user')
                : (['approval', 'revision_requested', 'redo_unlocked', 'audit_request', 'audit_dispatch', 'audit_completed'].includes(item.actionType) ? 'manager_as_subordinate' : 'standard_user')
            );
            
            const capacityBadge = (() => {
              switch (rawCapacity) {
                case 'standard_user':
                  return {
                    label: '👤 Standard User',
                    classes: 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  };
                case 'manager_as_self':
                  return {
                    label: '👔 Manager Self',
                    classes: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  };
                case 'manager_as_subordinate':
                  return {
                    label: '🛡️ Line Manager',
                    classes: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  };
                case 'internal_auditor':
                  return {
                    label: '🔒 Internal Audit Reviewer',
                    classes: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  };
                default:
                  return null;
              }
            })();

            const threadReplies = (threadGroups[item.threadId || item.id] || []).filter(r => r.id !== item.id);
            const hasReplies = threadReplies.length > 0;
            const isExpanded = !!expandedThreads[item.threadId || item.id];
            const isSenderCurrentUser = (item.senderEmail || '').toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim();

            return (
              <div key={item.id} className="space-y-2">
                {/* Root Message Card */}
                <div
                  className={`p-3.5 rounded-xl border transition flex gap-3 relative ${
                    isUnread 
                      ? 'bg-slate-800/95 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' 
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-750'
                  }`}
                >
                  {/* Multi-Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifIds.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifIds(prev => [...prev, item.id]);
                      } else {
                        setSelectedNotifIds(prev => prev.filter(id => id !== item.id));
                      }
                    }}
                    className="w-4 h-4 mt-1 rounded border-slate-700 text-indigo-600 bg-slate-950 focus:ring-0 cursor-pointer flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Top Row: Sender / Recipient + Status Pill + Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {item.senderName || item.senderEmail}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate hidden sm:inline font-mono">
                          ({item.senderEmail})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {capacityBadge && (
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${capacityBadge.classes}`}>
                            {capacityBadge.label}
                          </span>
                        )}

                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                          isRevisionReq ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          isApproval ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          isAuditReq ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          isSubmission ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-slate-800/90 text-slate-300 border border-slate-700'
                        }`}>
                          {isRevisionReq ? 'Revision Required' :
                           isApproval ? 'Approved & Signed' :
                           isAuditReq ? 'Audit Dispatch' :
                           isSubmission ? 'Subordinate KPI' :
                           'Direct Message'}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>

                        {/* Individual Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const thread = threadGroups[item.threadId || item.id] || [];
                            const ids = thread.map(t => t.id);
                            handleDeleteSelected(ids);
                          }}
                          className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition"
                          title="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Message Title & Content */}
                    <div>
                      <h4 className="font-bold text-xs text-white m-0 flex items-center gap-1.5">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 mb-0 leading-relaxed font-sans whitespace-pre-wrap select-text">
                        {item.message}
                      </p>
                    </div>

                    {/* Display Attachments if available */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/40 space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 m-0">Attachments:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.attachments.map((att, attIdx) => (
                            <button
                              key={attIdx}
                              type="button"
                              onClick={() => {
                                try {
                                  const link = document.createElement('a');
                                  link.href = att.dataUrl;
                                  link.download = att.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } catch (err) {
                                  console.error("Error downloading attachment:", err);
                                  alert("Failed to download attachment.");
                                }
                              }}
                              className="bg-slate-950 hover:bg-indigo-950 hover:border-indigo-800 text-[11px] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer font-medium max-w-[200px]"
                              title="Click to download attachment"
                            >
                              <Download className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{att.name}</span>
                              <span className="text-[9px] text-slate-500 shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        {item.kpiNo && <span>KPI #{item.kpiNo}</span>}
                        {item.quarter && <span className="bg-slate-850 px-1.5 py-0.5 rounded text-indigo-300 font-bold">{item.quarter}</span>}
                        {item.poeDocsCount ? <span>📎 {item.poeDocsCount} file(s)</span> : null}
                        
                        {/* Read Receipts for Root */}
                        {isSenderCurrentUser && (
                          <span className="flex items-center gap-1 text-[10px] font-bold">
                            {item.read ? (
                              <span className="text-emerald-400 flex items-center gap-0.5" title={item.readAt ? `Read at ${new Date(item.readAt).toLocaleString()}` : 'Read'}>
                                <CheckCheck className="w-3.5 h-3.5" /> Read
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <CheckCheck className="w-3.5 h-3.5" /> Sent
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasReplies && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedThreads(prev => ({
                                ...prev,
                                [item.threadId || item.id]: !prev[item.threadId || item.id]
                              }));
                            }}
                            className="text-[10px] text-slate-300 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded-md border border-slate-700/80"
                          >
                            <span>{isExpanded ? 'Hide Thread' : `Show Thread (${threadReplies.length})`}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (replyingToId === item.id) {
                              setReplyingToId(null);
                            } else {
                              setReplyingToId(item.id);
                              setReplyBody('');
                              setReplyAttachments([]);
                            }
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition cursor-pointer"
                        >
                          Reply
                        </button>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(item.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}

                        {onSelectUserPlan && (
                          <button
                            type="button"
                            onClick={() => {
                              handleMarkAsRead(item.id);
                              let targetUser = '';
                              if (role === 'auditor') {
                                if (item.employeeEmail) {
                                  targetUser = item.employeeEmail;
                                } else {
                                  const textToSearch = `${item.title || ''} ${item.message || ''}`;
                                  // Try to match Submitter / Owner / Employee email
                                  const submitterMatch = textToSearch.match(/(?:Submitter|Owner|Subordinate|Employee|User)[^:]*:\s*[^(\n]*\(([^)]+@[^)]+)\)/i) ||
                                                         textToSearch.match(/(?:Submitter|Owner|Subordinate|Employee|User)[^:]*:\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
                                  if (submitterMatch && submitterMatch[1]) {
                                    targetUser = submitterMatch[1].toLowerCase().trim();
                                  } else {
                                    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
                                    const matches = textToSearch.match(emailRegex) || [];
                                    const senderNorm = (item.senderEmail || '').toLowerCase().trim();
                                    const filtered = matches.filter((m: string) => {
                                      const mNorm = m.toLowerCase().trim();
                                      return mNorm !== senderNorm && 
                                             mNorm !== 'audit@system.local' && 
                                             !mNorm.includes('audit');
                                    });
                                    if (filtered.length > 0) {
                                      targetUser = filtered[0].toLowerCase().trim();
                                    } else {
                                      targetUser = item.senderEmail || item.recipientEmail;
                                    }
                                  }
                                }
                              } else {
                                targetUser = (role === 'manager' && item.employeeEmail)
                                  ? item.employeeEmail
                                  : item.senderEmail && role === 'manager' 
                                    ? item.senderEmail 
                                    : item.recipientEmail && role === 'employee' 
                                      ? currentUser.email 
                                      : item.senderEmail || item.recipientEmail;
                              }

                              // Extract KPI IDs / Numbers from all sources
                              const extractedIds: string[] = [];
                              if (Array.isArray(item.kpiIds) && item.kpiIds.length > 0) {
                                item.kpiIds.forEach((id: string) => { if (id && !extractedIds.includes(id)) extractedIds.push(id); });
                              }
                              if (item.kpiId && typeof item.kpiId === 'string' && item.kpiId.trim() && !extractedIds.includes(item.kpiId.trim())) {
                                extractedIds.push(item.kpiId.trim());
                              }
                              if (item.kpiNo && typeof item.kpiNo === 'string' && item.kpiNo.trim() && !extractedIds.includes(item.kpiNo.trim())) {
                                extractedIds.push(item.kpiNo.trim());
                              }

                              // If still empty or single KPI text, parse from title and message
                              const fullText = `${item.title || ''} ${item.message || ''}`;
                              const kpiRegexes = [
                                /(?:Single KPI|KPI\(s\)|PoE Submitted for KPI|dispatched single KPI|approved single KPI|approved KPI\(s\))\s*#?([a-zA-Z0-9_\-/]+)/gi,
                                /•\s*KPI\s*#?([a-zA-Z0-9_\-/]+):/gi,
                                /\bKPI\s*#([a-zA-Z0-9_\-/]+)\b/gi
                              ];
                              for (const reg of kpiRegexes) {
                                let match: RegExpExecArray | null;
                                while ((match = reg.exec(fullText)) !== null) {
                                  const num = match[1]?.trim();
                                  if (num && num.toLowerCase() !== 'and' && num.toLowerCase() !== 'the' && !extractedIds.includes(num)) {
                                    extractedIds.push(num);
                                  }
                                }
                              }

                              const resolvedKpiIds = extractedIds.length > 0 ? extractedIds : undefined;
                              const resolvedKpiId = extractedIds.length > 0 ? extractedIds[0] : (item.kpiId || undefined);
                              
                              onSelectUserPlan(targetUser, resolvedKpiId, item.quarter, resolvedKpiIds);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span>Open & Review</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thread Replies */}
                {isExpanded && threadReplies.length > 0 && (
                  <div className="mt-2.5 ml-6 pl-4 border-l-2 border-indigo-500/30 space-y-2">
                    {threadReplies.map((reply) => {
                      const isReplyUnread = !reply.read;
                      const isReplySenderMe = (reply.senderEmail || '').toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim();
                      
                      // Auto-read unread replies when expanded
                      if (isReplyUnread && (reply.recipientEmail || '').toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim()) {
                        handleMarkAsRead(reply.id);
                      }

                      return (
                        <div 
                          key={reply.id} 
                          className={`p-3 rounded-lg border transition ${
                            isReplyUnread 
                              ? 'bg-slate-800/90 border-indigo-500/50 shadow-sm' 
                              : 'bg-slate-950/40 border-slate-850'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-black text-[8px] flex items-center justify-center shrink-0">
                                {(reply.senderName || reply.senderEmail || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {reply.senderName || reply.senderEmail}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono hidden md:inline truncate">
                                ({reply.senderEmail})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteSelected([reply.id]);
                                }}
                                className="p-0.5 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition"
                                title="Delete reply"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 mt-1 mb-0 leading-relaxed font-sans whitespace-pre-wrap select-text">
                            {reply.message}
                          </p>

                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800/40 flex flex-wrap gap-1.5">
                              {reply.attachments.map((att, attIdx) => (
                                <button
                                  key={attIdx}
                                  type="button"
                                  onClick={() => {
                                    try {
                                      const link = document.createElement('a');
                                      link.href = att.dataUrl;
                                      link.download = att.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    } catch (err) {
                                      console.error("Error downloading attachment:", err);
                                    }
                                  }}
                                  className="bg-slate-950 hover:bg-indigo-950 hover:border-indigo-800 text-[10px] border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium max-w-[180px]"
                                >
                                  <Download className="w-2.5 h-2.5 text-indigo-400" />
                                  <span className="truncate">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {isReplySenderMe && (
                            <div className="flex items-center justify-end gap-1.5 mt-1 pt-1 border-t border-slate-850/60 text-[9px] font-mono">
                              {reply.read ? (
                                <span className="text-emerald-400 flex items-center gap-0.5" title={reply.readAt ? `Read at ${new Date(reply.readAt).toLocaleString()}` : 'Read'}>
                                  <CheckCheck className="w-3.5 h-3.5" /> Read
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-0.5">
                                  <CheckCheck className="w-3.5 h-3.5" /> Sent
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Thread Inline Reply Composer */}
                {replyingToId === item.id && (
                  <div className="mt-2 ml-6 p-3 bg-slate-950/60 border border-indigo-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Reply to conversation</span>
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-500 font-bold uppercase text-[9px]">Reply As:</span>
                        <button
                          type="button"
                          onClick={() => setWorkflowReplyDomain('nkangala')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-0.5 ${
                            workflowReplyDomain === 'nkangala'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                          title={nkangalaEmail}
                        >
                          <span>🏛️ @nkangaladm.gov.za</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkflowReplyDomain('mzansiflow')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-0.5 ${
                            workflowReplyDomain === 'mzansiflow'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-indigo-300'
                          }`}
                          title={mzansiflowEmail}
                        >
                          <span>⚡ @mzansiflow.co.za</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkflowReplyDomain('default')}
                          className={`px-1.5 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-0.5 ${
                            workflowReplyDomain === 'default'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={currentUser.email}
                        >
                          <span>👤 Default</span>
                        </button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setReplyingToId(null)}
                        className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your reply message here..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    />
                    
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                          <Paperclip className="w-3 h-3 text-indigo-400" />
                          <span>Attach</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleReplyFileChange}
                            className="hidden"
                          />
                        </label>
                        
                        {replyAttachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-indigo-300 font-bold">{replyAttachments.length} attached</span>
                            <button 
                              type="button" 
                              onClick={() => setReplyAttachments([])}
                              className="text-[9px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendReply(item)}
                        disabled={sendingReply}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg transition text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        {sendingReply ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Send</span>
                      </button>
                    </div>
                    
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {replyAttachments.map((f, fIdx) => (
                          <span key={fIdx} className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-400 font-mono truncate max-w-[150px]">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
