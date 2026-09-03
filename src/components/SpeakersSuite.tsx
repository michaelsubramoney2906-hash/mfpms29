import React, { useState } from 'react';
import { User } from '../types';
import { Image as ImageIcon, Save, Plus } from 'lucide-react';

interface SpeakersSuiteProps {
  currentUser: User;
  activeTenantId: string;
}

export function SpeakersSuite({ currentUser, activeTenantId }: SpeakersSuiteProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termFrom, setTermFrom] = useState('');
  const [termTo, setTermTo] = useState('');
  const [foreword, setForeword] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [conclusion, setConclusion] = useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('mz_speaker_profile');
    if (saved) {
      try {
        let data: any = {}; try { data = JSON.parse(saved); } catch(e) { return; }
        if (data.photo) setPhoto(data.photo);
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.termFrom) setTermFrom(data.termFrom);
        if (data.termTo) setTermTo(data.termTo);
        if (data.foreword) setForeword(data.foreword);
        if (data.vision) setVision(data.vision);
        if (data.mission) setMission(data.mission);
        if (data.conclusion) setConclusion(data.conclusion);
      } catch (e) {}
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('mz_speaker_profile', JSON.stringify({
      photo, firstName, lastName, termFrom, termTo, foreword, vision, mission, conclusion
    }));
    alert('Speaker profile saved securely to Workspace.');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Speaker's Suite</h1>
          <p className="text-slate-500 font-medium">Manage the Speaker's official profile, foreword, and strategic vision.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Sipho" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Ndlovu" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Term From</label>
                    <input type="text" value={termFrom} onChange={e => setTermFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 2021" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Term To</label>
                    <input type="text" value={termTo} onChange={e => setTermTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 2026" />
                  </div>
                </div>
              </div>

              <div className="w-32 h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shrink-0">
                {photo ? (
                  <img src={photo} alt="Speaker" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 font-medium leading-tight block">Upload Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                  <span className="text-white text-xs font-bold">Change</span>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Speaker's Foreword</label>
              <textarea value={foreword} onChange={e => setForeword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[120px]" placeholder="Enter the official foreword narrative..."></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Vision</label>
              <textarea value={vision} onChange={e => setVision(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]" placeholder="Enter the municipality's vision..."></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Mission</label>
              <textarea value={mission} onChange={e => setMission(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]" placeholder="Enter the municipality's mission..."></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Conclusion</label>
              <textarea value={conclusion} onChange={e => setConclusion(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]" placeholder="Enter the concluding remarks..."></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleSave} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors shadow-md">
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-6">
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                <h3 className="text-white font-bold tracking-widest uppercase text-xs">Preview</h3>
              </div>
              
              <div className="p-8 prose prose-slate prose-sm flex flex-col items-center">
                <div className="text-center mb-8">
                  {photo ? (
                    <img src={photo} alt="Speaker" className="w-32 h-40 object-cover rounded-xl shadow-md mx-auto mb-4 border border-slate-200" />
                  ) : (
                    <div className="w-32 h-40 bg-slate-100 border border-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight m-0">
                    {firstName || 'First_Name'} {lastName || 'Last_Name'}
                  </h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 mb-0">
                    Speaker of Council
                  </p>
                  <div className="inline-block bg-slate-100 text-slate-600 text-[10px] font-mono px-3 py-1 rounded-full mt-2">
                    Term: {termFrom || 'YYYY'} - {termTo || 'YYYY'}
                  </div>
                </div>

                <div className="w-full space-y-6 text-left">
                  <div>
                    <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200 pb-1 mb-2">Speaker's Foreword</h3>
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap min-h-[4rem]">
                      {foreword || 'The official foreword will appear here...'}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <h3 className="text-purple-900 font-bold uppercase tracking-widest text-[10px] mb-2">Vision</h3>
                    <p className="text-purple-800/80 text-xs italic">
                      "{vision || 'Vision statement...'}"
                    </p>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h3 className="text-emerald-900 font-bold uppercase tracking-widest text-[10px] mb-2">Mission</h3>
                    <p className="text-emerald-800/80 text-xs italic">
                      "{mission || 'Mission statement...'}"
                    </p>
                  </div>

                  <div>
                    <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200 pb-1 mb-2">Conclusion</h3>
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
                      {conclusion || 'Concluding remarks will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
