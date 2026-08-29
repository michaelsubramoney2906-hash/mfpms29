const fs = require('fs');
const path = 'src/components/IPMS/PerformanceAgreements.tsx';
let content = fs.readFileSync(path, 'utf8');

const fnCode = `
  const handleSendForReview = async () => {
    if (!currentUser?.email) return;
    
    // We send a notification to Manager & Internal Audit
    try {
      setLoading(true);
      const isTeam = agreementScope === 'team';
      const pTitle = isTeam ? 'Team Performance Agreement Draft Review' : 'Individual Performance Agreement Draft Review';
      const targetEmailStr = isTeam ? currentUser.email + '_team' : currentUser.email;

      await fetch(\`/api/tenant/\${activeTenantId}/ipms-notifications\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: targetEmailStr,
            senderName: currentUser.fullName || currentUser.email,
            recipientEmail: 'manager@nkangaladm.gov.za',
            recipientName: 'Manager',
            title: pTitle,
            message: \`\${currentUser.fullName || currentUser.email} has submitted their \${isTeam ? 'Team' : 'Individual'} Performance Agreement for review.\`,
            actionType: 'revision_requested',
            employeeEmail: targetEmailStr
          }
        })
      });

      await fetch(\`/api/tenant/\${activeTenantId}/ipms-notifications\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: targetEmailStr,
            senderName: currentUser.fullName || currentUser.email,
            recipientEmail: 'audit@nkangaladm.gov.za',
            recipientName: 'Internal Audit',
            title: pTitle,
            message: \`\${currentUser.fullName || currentUser.email} has submitted their \${isTeam ? 'Team' : 'Individual'} Performance Agreement for review.\`,
            actionType: 'audit_request',
            employeeEmail: targetEmailStr
          }
        })
      });

      alert(\`Successfully sent \${isTeam ? 'Team' : 'Individual'} Performance Agreement to Manager and Internal Audit for review.\`);
    } catch (e) {
      console.error(e);
      alert('Failed to send for review.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
`;

content = content.replace('  const renderHeader = () => (', fnCode);

const btnStr = `
        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-350 flex items-center gap-1.5 font-mono">
          Tenant <span className="text-green-300 font-bold">{activeTenantId}</span>
        </span>
        <button
          onClick={handleSendForReview}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition shadow shadow-purple-900"
        >
          <Send className="w-3.5 h-3.5" />
          Send for Review
        </button>
`;

content = content.replace(
  '        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-350 flex items-center gap-1.5 font-mono">\n          Tenant <span className="text-green-300 font-bold">{activeTenantId}</span>\n        </span>',
  btnStr
);

fs.writeFileSync(path, content);
console.log("PA header patched");
