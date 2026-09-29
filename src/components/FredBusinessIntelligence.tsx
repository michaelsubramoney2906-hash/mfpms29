import React, { useState, useRef, useEffect } from 'react';
import { Activity, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import type { User } from '../types';
import Markdown from 'react-markdown';

interface FredBusinessIntelligenceProps {
  currentUser: User;
  activeTenantId: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function FredBusinessIntelligence({ currentUser }: FredBusinessIntelligenceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    parts: [{ text: "Hello! I am Fred Business Intelligence. I am an expert AI assistant ready to discuss news, politics, weather, current events, sports, local government, PFMA, MFMA, MSA, COGTA, performance management, accounting, complex engineering, South Africa, Africa, and world events. How can I help you today?" }]
  }]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: inputVal.trim() }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/fred-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I encountered an error connecting to my intelligence core. Please ensure the COGNITIVE_API_KEY is configured on the server." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl select-none">
      <div className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Fred Business Intelligence
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">AI Intelligence Powered by Massive Dynamix Group</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-100/50 p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 max-w-4xl ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'}`}>
                {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`rounded-2xl px-6 py-4 shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'}`}>
                <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                  <Markdown>{m.parts[0].text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-4xl self-start">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-slate-900 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="rounded-2xl px-6 py-4 shadow-sm bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                 <span className="text-sm font-medium text-slate-500">Fred is analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-end gap-2">
          <textarea 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Fred about PFMA, world events, or complex engineering..."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-[15px] max-h-32 min-h-[48px] outline-none placeholder:text-slate-400"
            rows={1}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!inputVal.trim() || isLoading}
            className="w-12 h-12 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-0.5 mt-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
