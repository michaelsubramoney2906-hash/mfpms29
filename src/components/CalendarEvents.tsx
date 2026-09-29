import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MessageSquare, Plus, Send, User as UserIcon, Building, Bot, CalendarDays } from 'lucide-react';
import type { User } from '../types';

interface CalendarEventsProps {
  currentUser: User;
  activeTenantId: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  time: string;
}

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'personal' | 'municipal';
  source: 'Microsoft Graph API' | 'Municipal Event API';
}

export function CalendarEvents({ currentUser, activeTenantId }: CalendarEventsProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      content: 'Hello! I am your Fred Assistant. I have access to your personal schedule via Microsoft Graph API and the Unified Municipal Calendar via the Municipal Event API. How can I help you plan your day?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  const [events, setEvents] = useState<Event[]>([
    { id: '1', title: 'Performance Review Prep', time: '09:00 AM - 10:00 AM', type: 'personal', source: 'Microsoft Graph API' },
    { id: '2', title: 'City Council Briefing', time: '11:00 AM - 12:30 PM', type: 'municipal', source: 'Municipal Event API' },
    { id: '3', title: 'Lunch with Department Head', time: '13:00 PM - 14:00 PM', type: 'personal', source: 'Microsoft Graph API' },
    { id: '4', title: 'Public Works Budget Hearing', time: '14:30 PM - 16:00 PM', type: 'municipal', source: 'Municipal Event API' },
  ]);

  const [showEventModal, setShowEventModal] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      let responseText = "I can help with that. Would you like me to schedule a new event or adjust an existing one?";
      
      if (newMsg.content.toLowerCase().includes('my day') || newMsg.content.toLowerCase().includes('schedule')) {
        responseText = "Here is your unified daily view. You have 2 personal meetings from your MS Graph calendar, and 2 municipal functions from the City Calendar.";
      } else if (newMsg.content.toLowerCase().includes('create') || newMsg.content.toLowerCase().includes('new event')) {
         responseText = "I can create that for you. Which calendar does this belong to: your Individual Calendar (Microsoft Graph) or the Unified Municipal Calendar?";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
      {/* Left panel: Calendar & Schedule */}
      <div className="w-1/2 md:w-2/3 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
              Unified Daily View
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Merging Microsoft Graph & Municipal Event API</p>
          </div>
          <button 
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {events.map(event => (
             <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow">
               <div className="w-24 shrink-0 flex flex-col items-center justify-center border-r border-slate-100 pr-4">
                 <Clock className="w-5 h-5 text-slate-400 mb-1" />
                 <span className="text-xs font-bold text-slate-600 text-center">{event.time}</span>
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                 <div className="flex gap-3 mt-2">
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${event.type === 'personal' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                     {event.type === 'personal' ? <UserIcon className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
                     {event.type === 'personal' ? 'Personal (Graph API)' : 'Municipal Function'}
                   </span>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Right panel: Fred Assistant Chat */}
      <div className="w-1/2 md:w-1/3 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Fred Assistant</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                {msg.sender === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Assistant</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={`text-[10px] mt-2 flex justify-end font-bold ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your day or create an event..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal for creating a new event */}
      {showEventModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Create New Event</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Event Calendar Destination</label>
                 <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-4 border border-blue-200 bg-blue-50/50 rounded-xl text-left hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><UserIcon className="w-5 h-5"/></div>
                        <div>
                          <p className="font-bold text-blue-900 text-sm">Individual Calendar</p>
                          <p className="text-xs text-blue-600">Microsoft Graph API</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border border-amber-200 bg-amber-50/50 rounded-xl text-left hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Building className="w-5 h-5"/></div>
                        <div>
                          <p className="font-bold text-amber-900 text-sm">Unified Municipal Calendar</p>
                          <p className="text-xs text-amber-600">Municipal Event API</p>
                        </div>
                      </div>
                    </button>
                 </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
