import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Award, ShieldCheck, CheckCircle2, AlertTriangle, 
  Search, Filter, Printer, FileText, ChevronRight, TrendingUp, BarChart3, Target
} from 'lucide-react';
import { cn } from '../Branding';

export interface DepartmentReportViewProps {
  allUsers: any[];
  teamPlans: any[];
  currentUser?: any;
  isExecutiveViewer?: boolean;
  activeFinancialYear?: string;
  onSelectUserForReport?: (user: any) => void;
}

export const DepartmentReportView: React.FC<DepartmentReportViewProps> = ({
  allUsers,
  teamPlans,
  currentUser,
  isExecutiveViewer = false,
  activeFinancialYear = '2026-2027',
  onSelectUserForReport
}) => {
  const isExecutive = isExecutiveViewer;
  const userDept = currentUser?.department || currentUser?.dept || 'Corporate Services';

  // Extract unique departments for executive view
  const departments = useMemo(() => {
    if (!isExecutive) {
      return [userDept];
    }
    const deptSet = new Set<string>();
    allUsers.forEach(u => {
      const d = u.department || u.dept || 'Corporate Services';
      if (d) deptSet.add(d);
    });
    return ['All', ...Array.from(deptSet).sort()];
  }, [allUsers, isExecutive, userDept]);

  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    isExecutive ? 'All' : userDept
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter dataset to manager's department if not executive
  const scopedUsers = useMemo(() => {
    if (isExecutive) {
      return allUsers;
    }
    return allUsers.filter(u => {
      const d = u.department || u.dept || 'Corporate Services';
      return d.toLowerCase().trim() === userDept.toLowerCase().trim();
    });
  }, [allUsers, isExecutive, userDept]);

  // Map users with plan evaluation metrics
  const evaluatedUsers = useMemo(() => {
    return scopedUsers.map(user => {
      const email = (user.email || '').toLowerCase().trim();
      const planObj = teamPlans.find(p => (p.userId || '').toLowerCase().trim() === email);
      const items: any[] = planObj?.plan?.items || [];

      // Calculate KPI status for selected quarter
      let metCount = 0;
      let exceededCount = 0;
      let unmetCount = 0;

      items.forEach(item => {
        let score = 0;
        let actual = '';
        let target = item.annualTarget || item.target || '';

        if (selectedQuarter === 'Q1') {
          score = parseFloat(item.q1Score || item.q1_score || '0');
          actual = item.q1Actual || item.q1_actual || '';
          target = item.q1Target || item.q1_target || target;
        } else if (selectedQuarter === 'Q2') {
          score = parseFloat(item.q2Score || item.q2_score || '0');
          actual = item.q2Actual || item.q2_actual || '';
          target = item.q2Target || item.q2_target || target;
        } else if (selectedQuarter === 'Q3') {
          score = parseFloat(item.q3Score || item.q3_score || '0');
          actual = item.q3Actual || item.q3_actual || '';
          target = item.q3Target || item.q3_target || target;
        } else if (selectedQuarter === 'Q4') {
          score = parseFloat(item.q4Score || item.q4_score || '0');
          actual = item.q4Actual || item.q4_actual || '';
          target = item.q4Target || item.q4_target || target;
        } else {
          const validScores = ['dpmcScore', 'internalAuditorScore', 'managerScore', 'q1Score', 'q2Score', 'q3Score', 'q4Score', 'score', 'evalScore']
            .map(k => parseFloat(item[k] || '0'))
            .filter(s => !isNaN(s) && s > 0);
          score = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
          actual = item.q4Actual || item.q3Actual || item.q2Actual || item.q1Actual || item.actualAchieved || item.actual || '';
          target = item.annualTarget || item.q4Target || item.q3Target || item.q2Target || item.q1Target || item.target || '';
        }

        if (score >= 4) {
          exceededCount++;
        } else if (score >= 3) {
          metCount++;
        } else if (score > 0 && score < 3) {
          unmetCount++;
        } else if (actual && target) {
          const aNum = parseFloat(actual);
          const tNum = parseFloat(target);
          if (!isNaN(aNum) && !isNaN(tNum)) {
            if (aNum > tNum * 1.1) exceededCount++;
            else if (aNum >= tNum) metCount++;
            else unmetCount++;
          }
        }
      });

      const totalKPIs = items.length;
      const qualifiedCount = metCount + exceededCount;
      const qualificationRate = totalKPIs > 0 ? Math.round((qualifiedCount / totalKPIs) * 100) : 0;
      const isBonusEligible = totalKPIs > 0 && qualificationRate >= 65;

      return {
        ...user,
        department: user.department || 'Corporate Services',
        totalKPIs,
        metCount,
        exceededCount,
        unmetCount,
        qualificationRate,
        isBonusEligible
      };
    });
  }, [scopedUsers, teamPlans, selectedQuarter]);

  // Filtered users by department & search query
  const filteredUsers = useMemo(() => {
    return evaluatedUsers.filter(u => {
      const matchDept = selectedDepartment === 'All' || u.department === selectedDepartment;
      const matchQuery = !searchQuery || 
        (u.fullName || u.full_name || u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.jobFunction || u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchQuery;
    });
  }, [evaluatedUsers, selectedDepartment, searchQuery]);

  // Departmental Aggregates
  const totalStaff = filteredUsers.length;
  const totalKPIsAll = filteredUsers.reduce((acc, u) => acc + u.totalKPIs, 0);
  const totalMetAll = filteredUsers.reduce((acc, u) => acc + u.metCount, 0);
  const totalExceededAll = filteredUsers.reduce((acc, u) => acc + u.exceededCount, 0);
  const totalUnmetAll = filteredUsers.reduce((acc, u) => acc + u.unmetCount, 0);

  const bonusQualifiedStaff = filteredUsers.filter(u => u.isBonusEligible).length;
  const deptBonusRate = totalStaff > 0 ? Math.round((bonusQualifiedStaff / totalStaff) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
              Departmental Oversight Suite
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">FY {activeFinancialYear}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Consolidated Department Performance Report
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time departmental performance aggregation, KPI compliance rates, and 65% bonus qualification analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quarter Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider",
                  selectedQuarter === q
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                )}
              >
                {q === 'all' ? 'Annual' : q}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Department Report
          </button>
        </div>
      </div>

      {/* KPI & Bonus Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Department Staff Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department Staff</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">{totalStaff}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Evaluated Personnel</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Bonus Qualification Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Bonus Qualified (≥65%)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">{bonusQualifiedStaff} <span className="text-sm text-slate-400 font-normal">/ {totalStaff}</span></h3>
            <p className="text-xs text-emerald-700 font-bold mt-1">{deptBonusRate}% Department Qualification Rate</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: KPIs Exceeded & Met */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">KPIs Met & Exceeded</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">{totalMetAll + totalExceededAll} <span className="text-sm text-slate-400 font-normal">/ {totalKPIsAll}</span></h3>
            <p className="text-xs text-indigo-700 font-bold mt-1">{totalExceededAll} Exceeded Target</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Unmet KPIs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Unmet / Off Target</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">{totalUnmetAll}</h3>
            <p className="text-xs text-rose-700 font-bold mt-1">Requires Intervention</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter Toolbar for Department Matrix */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Department Selector / Scope Badge */}
        {!isExecutive ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Scoped Department:</span>
            <span className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-2 border border-slate-900 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              {userDept}
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                Manager Scoped View
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Select Department:</span>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border",
                  selectedDepartment === dept
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

        {/* Search Field */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none font-medium"
          />
        </div>

      </div>

      {/* Department Personnel Performance Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Personnel Performance & Bonus Eligibility Matrix ({selectedDepartment})
          </h4>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredUsers.length} Staff Members
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-sm">
            No personnel found matching the selected department filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee Name</th>
                  <th className="px-5 py-3">Role & Department</th>
                  <th className="px-5 py-3 text-center">Assigned KPIs</th>
                  <th className="px-5 py-3 text-center">Met / Exceeded</th>
                  <th className="px-5 py-3 text-center">Compliance Rate</th>
                  <th className="px-5 py-3">Bonus Status (≥65%)</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-black flex items-center justify-center text-xs shadow-inner">
                          {(user.fullName || user.full_name || user.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">
                            {user.fullName || user.full_name || user.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 text-xs">{user.jobFunction || user.role || 'Staff'}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{user.department}</p>
                    </td>

                    {/* Assigned KPIs */}
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                      {user.totalKPIs}
                    </td>

                    {/* Met / Exceeded */}
                    <td className="px-5 py-3.5 text-center font-mono">
                      <span className="text-emerald-700 font-bold">{user.metCount} Met</span>
                      {user.exceededCount > 0 && <span className="text-indigo-700 font-bold ml-1.5">({user.exceededCount} Exceeded)</span>}
                    </td>

                    {/* Compliance Rate */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", user.isBonusEligible ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${Math.min(100, user.qualificationRate)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{user.qualificationRate}%</span>
                      </div>
                    </td>

                    {/* Bonus Eligibility Badge */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                        user.isBonusEligible
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      )}>
                        {user.isBonusEligible ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            QUALIFIED FOR BONUS
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            INELIGIBLE (&lt;65%)
                          </>
                        )}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      {onSelectUserForReport && (
                        <button
                          onClick={() => onSelectUserForReport(user)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          View Dossier
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
