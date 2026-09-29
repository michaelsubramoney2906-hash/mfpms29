import React, { useState } from 'react';
import { User } from '../types';
import { LifeBuoy, Mail, MessageSquare, Plus, Search, Tag, Clock, ArrowRight, User as UserIcon, Send, X } from 'lucide-react';

interface HelpDeskSupportProps {
  currentUser: User;
  activeTenantId: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  category: string;
  messages: { sender: string; role: string; content: string; timestamp: string }[];
}

export function HelpDeskSupport({ currentUser, activeTenantId }: HelpDeskSupportProps) {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TKT-2026-001',
      subject: 'Cannot access the SDBIP module',
      status: 'Open',
      priority: 'High',
      createdAt: '2026-06-07T08:30:00Z',
      category: 'Access Issue',
      messages: [
        { sender: currentUser.fullName || currentUser.email, role: 'User', content: 'I am getting an error when trying to open the SDBIP module.', timestamp: '2026-06-07T08:30:00Z' }
      ]
    },
    {
      id: 'TKT-2026-002',
      subject: 'Update KPI target values',
      status: 'Resolved',
      priority: 'Medium',
      createdAt: '2026-06-05T14:15:00Z',
      category: 'Data Update',
      messages: [
        { sender: currentUser.fullName || currentUser.email, role: 'User', content: 'Please assist with updating my KPI targets for Q1.', timestamp: '2026-06-05T14:15:00Z' },
        { sender: 'System Admin', role: 'Support', content: 'This has been updated as requested.', timestamp: '2026-06-06T09:00:00Z' }
      ]
    }
  ]);

  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Ticket State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('General Query');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newMessage, setNewMessage] = useState('');

  // Reply State
  const [replyMessage, setReplyMessage] = useState('');

  const filteredTickets = tickets.filter(t => t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    
    const newTicket: Ticket = {
      id: `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newSubject,
      status: 'Open',
      priority: newPriority,
      createdAt: new Date().toISOString(),
      category: newCategory,
      messages: [
        { sender: currentUser.fullName || currentUser.email, role: 'User', content: newMessage, timestamp: new Date().toISOString() }
      ]
    };
    
    setTickets([newTicket, ...tickets]);
    setShowNewTicket(false);
    setNewSubject('');
    setNewMessage('');
    setActiveTicket(newTicket);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !activeTicket) return;
    
    const updatedTicket = { ...activeTicket };
    updatedTicket.messages.push({
      sender: currentUser.fullName || currentUser.email,
      role: 'User',
      content: replyMessage,
      timestamp: new Date().toISOString()
    });
    
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setActiveTicket(updatedTicket);
    setReplyMessage('');
  };

  const statusColors = {
    'Open': 'bg-emerald-100 text-emerald-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Resolved': 'bg-slate-100 text-slate-700',
    'Closed': 'bg-slate-100 text-slate-500',
  };

  const priorityColors = {
    'Low': 'bg-slate-100 text-slate-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-indigo-600" /> Help Desk & Support
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Get assistance from System Administrators and Global Support.</p>
          </div>
          <div className="flex items-center gap-3">
             <a href="mailto:support@mzansiflow.co.za" className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-200 transition">
                <Mail className="w-4 h-4" /> Email Support
             </a>
             <button onClick={() => setShowNewTicket(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition">
                <Plus className="w-4 h-4" /> New Ticket
             </button>
          </div>
        </div>

        {showNewTicket && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 animate-fade-in space-y-4">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="font-bold text-slate-800 uppercase text-sm">Create Support Ticket</h2>
                <button onClick={() => setShowNewTicket(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                   <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Brief summary of your issue..." />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                   <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                     <option>Access Issue</option>
                     <option>General Query</option>
                     <option>Data Update</option>
                     <option>Bug Report</option>
                     <option>Feature Request</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                   <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                     <option value="Critical">Critical</option>
                   </select>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                   <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe your issue in detail..."></textarea>
                </div>
             </div>
             
             <div className="flex justify-end pt-4 mt-2">
                <button onClick={handleCreateTicket} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800">Submit Ticket</button>
             </div>
          </div>
        )}

        {!activeTicket ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
               <div className="relative max-w-sm">
                 <input 
                   type="text" 
                   placeholder="Search tickets..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 />
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-4 border-b border-slate-200">Ticket ID</th>
                      <th className="p-4 border-b border-slate-200">Subject</th>
                      <th className="p-4 border-b border-slate-200">Status</th>
                      <th className="p-4 border-b border-slate-200">Priority</th>
                      <th className="p-4 border-b border-slate-200">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTickets.map(ticket => (
                      <tr key={ticket.id} onClick={() => setActiveTicket(ticket)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                        <td className="p-4 font-mono font-bold text-indigo-600 group-hover:text-indigo-700">{ticket.id}</td>
                        <td className="p-4 font-semibold">{ticket.subject}</td>
                        <td className="p-4">
                          <span className={`${statusColors[ticket.status]} px-2 py-1 rounded text-xs font-bold uppercase tracking-wider`}>{ticket.status}</span>
                        </td>
                        <td className="p-4">
                          <span className={`${priorityColors[ticket.priority]} px-2 py-1 rounded text-xs font-bold uppercase tracking-wider`}>{ticket.priority}</span>
                        </td>
                        <td className="p-4 text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No tickets found.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] animate-fade-in">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <button onClick={() => setActiveTicket(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm">
                   <ArrowRight className="w-4 h-4 rotate-180" /> Back to Tickets
                </button>
                <div className="flex gap-2">
                  <span className={`${statusColors[activeTicket.status]} px-2 py-1 rounded text-xs font-bold uppercase tracking-wider`}>{activeTicket.status}</span>
                  <span className={`${priorityColors[activeTicket.priority]} px-2 py-1 rounded text-xs font-bold uppercase tracking-wider`}>{activeTicket.priority}</span>
                </div>
             </div>
             
             <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="text-xs text-slate-500 font-mono mb-1">{activeTicket.id} &bull; {activeTicket.category}</div>
                <h2 className="text-xl font-bold text-slate-800">{activeTicket.subject}</h2>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {activeTicket.messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'User' ? '' : 'flex-row-reverse'}`}>
                     <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${msg.role === 'User' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-800 text-white'}`}>
                        {msg.role === 'User' ? <UserIcon className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}
                     </div>
                     <div className={`flex flex-col ${msg.role === 'User' ? 'items-start' : 'items-end'}`}>
                        <div className="text-xs text-slate-500 mb-1 font-medium">{msg.sender} &bull; {new Date(msg.timestamp).toLocaleString()}</div>
                        <div className={`p-4 rounded-2xl text-sm ${msg.role === 'User' ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm' : 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tr-sm shadow-sm'}`}>
                           {msg.content}
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <div className="relative">
                   <textarea 
                     value={replyMessage}
                     onChange={e => setReplyMessage(e.target.value)}
                     className="w-full border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[60px]" 
                     placeholder={activeTicket.status === 'Closed' ? 'Ticket is closed.' : "Type your reply..."}
                     disabled={activeTicket.status === 'Closed'}
                   ></textarea>
                   <button 
                     disabled={activeTicket.status === 'Closed' || !replyMessage.trim()}
                     onClick={handleSendReply}
                     className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                      <Send className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
