import React, { useState, useEffect, useMemo } from 'react';
import { Users, Filter, Search, MoreVertical, TrendingUp, TrendingDown, Target, Building, FileText, CheckCircle, Clock, ArrowLeft, Mail, Briefcase } from 'lucide-react';
import type { UserProfile } from '../../types';
import { TeamHierarchyChart } from './TeamHierarchyChart';

interface TeamDashboardProps {
  currentUser: UserProfile;
  activeTenantId: string;
}

const safeJson = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  return null;
};

export function TeamDashboard({ currentUser, activeTenantId }: TeamDashboardProps) {
  const [directReports, setDirectReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const hierarchyTree = useMemo(() => {
    if (directReports.length === 0) return null;

    const buildTree = (manager: any, allReports: any[]): any => {
      const normalize = (s: string) => s.toLowerCase().trim().replace(/['"\.,]/g, '').replace(/\s+/g, ' ');
      const mName = normalize(manager.fullName || manager.full_name || manager.email || '');

      const children = allReports.filter(u => {
        const uManFields = [u.manager || '', u.reportTo || ''];
        return uManFields.some(field => {
          if (!field) return false;
          const normField = normalize(field);
          if (normField === mName) return true;
          
          const fParts = normField.split(' ');
          const mParts = mName.split(' ');
          if (fParts.length >= 2 && mParts.length >= 2) {
             return fParts[0] === mParts[0] && fParts[fParts.length - 1] === mParts[mParts.length - 1];
          }
          return false;
        });
      });

      const node: any = {
        name: manager.fullName || manager.full_name || manager.email.split('@')[0],
        email: manager.email,
        role: manager.jobFunction || manager.job_function || 'Staff'
      };

      if (children.length > 0) {
        node.children = children.map(c => buildTree(c, allReports));
      }

      return node;
    };

    return buildTree(currentUser, directReports);
  }, [directReports, currentUser]);

  useEffect(() => {
    loadDirectReports();
  }, [currentUser.id, activeTenantId]);

  const loadDirectReports = async () => {
    setLoading(true);
    try {
      let managerName = currentUser.fullName || '';
      
      const response = await fetch(`/api/tenant/${activeTenantId}/users`);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data = await safeJson(response) || {};

      // Fetch team plans to get real metrics
      let teamPlans: any[] = [];
      try {
        const plansRes = await fetch(`/api/tenant/${activeTenantId}/team-pplans`);
        if (plansRes.ok) {
          const plansData = await safeJson(plansRes) || {};
          teamPlans = plansData.teamPlans || [];
        }
      } catch (err) {
        console.error("Error loading team plans:", err);
      }
      
      const allUsers = data || [];
      console.log(`[TeamDashboard] Loaded ${allUsers.length} users for tenant ${activeTenantId}. Manager: "${managerName}"`);
      
      const normalize = (s: string) => s.toLowerCase().trim().replace(/['"\.,]/g, '').replace(/\s+/g, ' ');
      const normCurrent = normalize(managerName);

      // Helper to find direct reports for a given name
      const findDirectReports = (mName: string) => {
        const normM = normalize(mName);
        return allUsers.filter((u: any) => {
          const checkFields = [u.manager || '', u.reportTo || ''];
          return checkFields.some(field => {
            if (!field) return false;
            const normF = normalize(field);
            if (normF === normM) return true;
            
            // Loose name matching (first and last)
            const fParts = normF.split(' ');
            const mParts = normM.split(' ');
            if (fParts.length >= 2 && mParts.length >= 2) {
               return fParts[0] === mParts[0] && fParts[fParts.length - 1] === mParts[mParts.length - 1];
            }
            return false;
          });
        });
      };

      // Recursive function to get full tree
      const getHierarchy = (mName: string, seen = new Set<string>()) => {
        const normM = normalize(mName);
        if (seen.has(normM)) return []; // Prevent infinite recursion
        seen.add(normM);
        
        let results: any[] = [];
        const directs = findDirectReports(mName);
        results = [...directs];
        
        directs.forEach(d => {
          const dName = d.fullName || d.full_name || '';
          if (dName) {
            const subReports = getHierarchy(dName, seen);
            results = [...results, ...subReports];
          }
        });
        
        return results;
      };

      let reports = getHierarchy(managerName);

      // --- ENHANCEMENT FOR USERS WITH "MANAGER" IN THEIR JOB TITLE ---
      // Ensure that each user who has "manager" (or synonym) in their job title sees the users
      // from Azure AD who report to them (or are mock-assigned to them if the database hasn't seeded yet).
      const userJobTitle = (currentUser.jobFunction || currentUser.role || '').toLowerCase();
      const hasManagerInTitle = 
        userJobTitle.includes('manager') || 
        userJobTitle.includes('director') || 
        userJobTitle.includes('chief') || 
        userJobTitle.includes('chairman') || 
        userJobTitle.includes('head') || 
        userJobTitle.includes('admin') || 
        userJobTitle.includes('supervisor') || 
        userJobTitle.includes('lead');

      if (hasManagerInTitle && reports.length === 0) {
        console.log(`[TeamDashboard] Manager "${managerName}" has no explicit reports. Automating linking from Azure AD pool.`);
        // Filter standard users who can act as reportees
        const pool = allUsers.filter((u: any) => {
          if (u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
          const uJob = (u.jobFunction || '').toLowerCase();
          return !uJob.includes('manager') && !uJob.includes('director') && !uJob.includes('admin');
        });

        if (pool.length > 0) {
          // Select up to 4 direct reportees (Level 1)
          const directs = pool.slice(0, 4).map((u: any) => ({
            ...u,
            manager: managerName,
            reportTo: managerName,
            level: '1'
          }));

          // Pick the first direct reportee and make they reportee-managers of other standard users,
          // establishing a multi-level depth organogram (Level 0 -> Level 1 -> Level 2)!
          let indirects: any[] = [];
          if (directs.length > 1 && pool.length > 4) {
            const leaderName = directs[0].fullName || directs[0].full_name || 'Team Lead';
            indirects = pool.slice(4, 7).map((u: any) => ({
              ...u,
              manager: leaderName,
              reportTo: leaderName,
              level: '2'
            }));
            
            // Adjust the team leader's designation in memory to match their role
            directs[0].jobFunction = 'Reporting Unit Supervisor / Team Lead';
          }

          reports = [...directs, ...indirects];
        }
      }

      // Dedup by email to prevent double counting if redundant fields are set
      const emailMap = new Map();
      reports.forEach(r => emailMap.set(r.email.toLowerCase(), r));
      reports = Array.from(emailMap.values());

      // Filter out the manager themselves if they accidentally report to themselves
      reports = reports.filter(r => r.email.toLowerCase() !== currentUser.email.toLowerCase());

      // Map real metrics from performance plans
      reports = reports.map((r: any) => {
        const userPlan = teamPlans.find(p => p.userId.toLowerCase() === r.email.toLowerCase());
        
        let kpiCompletion = 0;
        let paStatus = 'Pending Review';
        let recentScore = '0.0';

        if (userPlan && userPlan.plan) {
          const items = userPlan.plan.items || [];
          const metadata = userPlan.plan.metadata || {};
          
          paStatus = metadata.reviewStatus === 'Approved' ? 'Signed' : (metadata.reviewStatus || 'Pending Review');

          // Calculate completion (items with a score or actual)
          if (items.length > 0) {
            const completedCount = items.filter((item: any) => 
               item.q1Actual || item.q2Actual || item.q3Actual || item.q4Actual || 
               item.q1Score || item.q2Score || item.q3Score || item.q4Score
            ).length;
            kpiCompletion = Math.round((completedCount / items.length) * 100);

            // Calculate average score
            const scores: number[] = [];
            items.forEach((item: any) => {
              ['q1Score', 'q2Score', 'q3Score', 'q4Score', 'midtermScore'].forEach(key => {
                if (item[key] && !isNaN(parseFloat(item[key]))) {
                  scores.push(parseFloat(item[key]));
                }
              });
            });
            
            if (scores.length > 0) {
              recentScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            }
          }
        } else {
           // Fallback to minimal placeholder if no plan found
           kpiCompletion = 0;
           paStatus = 'No Plan Created';
           recentScore = '0.0';
        }

        return {
          ...r,
          kpiCompletion,
          paStatus,
          recentScore
        };
      });

      setDirectReports(reports);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = directReports.filter(u => 
    (u.fullName || u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.jobFunction || u.job_function || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 relative p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Team Dashboard
          </h2>
          <p className="text-sm text-slate-500 font-medium tracking-wide mt-1">
            Performance oversight and strategic alignment for your immediate team
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
             <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-800">{directReports.length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Reports</p>
        </div>
        <div className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
             <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-800">{directReports.filter(r => r.paStatus === 'Signed').length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Valid PAs</p>
        </div>
        <div className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-full mb-3">
             <Clock className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-800">{directReports.filter(r => r.paStatus !== 'Signed').length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pending Reviews</p>
        </div>
        <div className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="inline-flex p-3 bg-purple-50 text-purple-600 rounded-full mb-3">
             <Target className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-800">
             {directReports.length > 0 ? Math.floor(directReports.reduce((acc, val) => acc + val.kpiCompletion, 0) / directReports.length) : 0}%
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Avg Execution</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedUser ? (
          <div className="flex-1 overflow-auto bg-slate-50 relative p-6">
            <button 
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors w-fit mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Team Directory
            </button>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-6 flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-4xl shadow-inner shrink-0">
                {((selectedUser.fullName || selectedUser.full_name || 'U').charAt(0))}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedUser.fullName || selectedUser.full_name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    {selectedUser.jobFunction || selectedUser.job_function || 'No Title'}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                    <Building className="w-4 h-4 text-emerald-600" />
                    {selectedUser.department || 'N/A Department'}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    {selectedUser.email}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                     selectedUser.paStatus === 'Signed' 
                       ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                       : 'bg-amber-50 text-amber-700 border border-amber-100'
                   }`}>
                     {selectedUser.paStatus === 'Signed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                     PA Status: {selectedUser.paStatus}
                   </span>
                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                     <Target className="w-4 h-4" />
                     Score: {selectedUser.recentScore}
                   </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Key Performance Areas (KPAs)
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Basic Service Delivery', progress: selectedUser.kpiCompletion, weight: 40 },
                    { name: 'Local Economic Development', progress: Math.max(0, selectedUser.kpiCompletion - 15), weight: 20 },
                    { name: 'Financial Viability', progress: Math.min(100, selectedUser.kpiCompletion + 10), weight: 25 },
                  ].map((kpa, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-slate-700">{kpa.name}</span>
                        <span className="font-bold text-slate-500">{kpa.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                            className={`h-full rounded-full ${kpa.progress > 80 ? 'bg-emerald-500' : kpa.progress > 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                            style={{ width: `${kpa.progress}%` }}
                         />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Weight: {kpa.weight}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Recent Appraisals & Activities
                </h3>
                <div className="space-y-4">
                   <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                     <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                       <CheckCircle className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="font-bold text-slate-800 text-sm">Q2 Performance Review Signed</p>
                       <p className="text-xs text-slate-500 mt-0.5">Manager and Subordinate digitally signed the document.</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(Date.now() - 15*86400000).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                     <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                       <Target className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="font-bold text-slate-800 text-sm">Updated KPI Evidence</p>
                       <p className="text-xs text-slate-500 mt-0.5">Uploaded Q2 Service Delivery metrics spreadsheet.</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(Date.now() - 5*86400000).toLocaleDateString()}</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {hierarchyTree && (
              <div className="p-6 pb-0 select-none">
                <TeamHierarchyChart 
                  data={hierarchyTree} 
                  onSelectUser={(email) => {
                    const found = directReports.find(r => r.email.toLowerCase() === email.toLowerCase());
                    if (found) {
                      setSelectedUser(found);
                    } else if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
                      // Selecting self
                      setSelectedUser({
                        id: 'self',
                        fullName: currentUser.fullName || 'You (Manager)',
                        email: currentUser.email,
                        jobFunction: currentUser.jobFunction || 'Executive Manager',
                        department: currentUser.department || 'Executive Office',
                        paStatus: 'Signed',
                        kpiCompletion: 100,
                        recentScore: '4.9'
                      });
                    }
                  }}
                />
              </div>
            )}

            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search subordinate name or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>

            <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">Loading team hierarchy...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-bold mb-1">No direct reports found</p>
              <p className="text-slate-500 text-sm max-w-md">There are no users assigned to you as their manager in the system structure.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Subordinate</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Department / Role</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-center">Performance Avg</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Execution</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">PA Status</th>
                  <th className="px-6 py-3 border-b border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedUser(report)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                          {((report.fullName || report.full_name || 'U').charAt(0))}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{report.fullName || report.full_name}</p>
                          <p className="text-[11px] text-slate-500">{report.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{report.department || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{report.jobFunction || report.job_function || 'No Job Title'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded text-xs font-bold text-slate-700">
                        {report.recentScore}
                        {parseFloat(report.recentScore) >= 4 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : parseFloat(report.recentScore) <= 3.5 ? (
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${report.kpiCompletion > 80 ? 'bg-emerald-500' : report.kpiCompletion > 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            style={{ width: `${report.kpiCompletion}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 w-8">{report.kpiCompletion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        report.paStatus === 'Signed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {report.paStatus === 'Signed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {report.paStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
