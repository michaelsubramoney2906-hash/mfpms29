const fs = require('fs');
const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const injection = `
  const manualCommitToDatabase = async (scope: 'individual' | 'team') => {
    const saveEmail = scope === 'team' ? currentUser.email + '_team' : currentUser.email;
    setSaving(true);
    try {
      // 1. Commit KPIs
      await fetch(\`/api/tenant/\${activeTenantId}/kpis?userId=\${encodeURIComponent(saveEmail)}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis })
      });
      // 2. Commit Performance Plan
      await fetch(\`/api/tenant/\${activeTenantId}/pplan?userId=\${encodeURIComponent(saveEmail)}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pplanData.items, managerSignoffs: pplanData.managerSignoffs })
      });
      setNotification(\`Successfully committed KPIs and Performance Plan to \${scope === 'team' ? 'Team' : 'Personal'} Database.\`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Failed to commit database.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSaving(false);
    }
  };
`;

if (!content.includes('manualCommitToDatabase')) {
    content = content.replace(
      "  // Form states",
      injection + "\n  // Form states"
    );
}

const buttonsUI = `
        <div className="flex items-center gap-2">
          {isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={() => manualCommitToDatabase('individual')}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit Personal DB
              </button>
              <button
                onClick={() => manualCommitToDatabase('team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit Team DB
              </button>
            </div>
          ) : (
            <button
                onClick={() => manualCommitToDatabase('individual')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit to Database
              </button>
          )}
          <div className="bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-500/10 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Sync Status: Actively Linked to Performance Plan</span>
          </div>
        </div>
`;

content = content.replace(
    `<div className="flex items-center gap-2 bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-500/10 text-[11px] font-mono text-emerald-300">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Sync Status: Actively Linked to Performance Plan</span>
        </div>`,
    buttonsUI
);

fs.writeFileSync(path, content);
console.log("KPI patched");
