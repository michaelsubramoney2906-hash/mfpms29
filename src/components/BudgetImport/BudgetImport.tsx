import React from 'react';

interface RiskItem {
  residual_impact: number;
  residual_likelihood: number;
}

interface RiskHeatmapDashboardProps {
  risks?: RiskItem[];
}

export function RiskHeatmapDashboard({ risks = [] }: RiskHeatmapDashboardProps) {
  // Mock data representing database aggregation of Impact x Likelihood
  const gridCells = Array.from({ length: 5 }, (_, i) => 5 - i); // 5 down to 1
  const cols = [1, 2, 3, 4, 5];

  const getCellColor = (impact: number, likelihood: number) => {
    const score = impact * likelihood;
    if (score >= 15) return 'bg-red-600 text-white font-bold animate-pulse'; // Critical Breach
    if (score >= 10) return 'bg-orange-500 text-white'; // High Risk
    if (score >= 5) return 'bg-yellow-400 text-gray-900'; // Medium Risk
    return 'bg-green-500 text-white'; // Low Risk
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-white shadow-2xl">
      <h2 className="text-xl font-bold mb-2">CRSA Engine: Residual Risk Heatmap Matrix</h2>
      <p className="text-sm text-slate-400 mb-6">Real-time council threshold breach monitoring (MFMA / ISO 31000)</p>
      
      <div className="grid grid-cols-6 gap-2 max-w-2xl mx-auto">
        <span className="text-center font-semibold text-slate-400 flex items-center justify-end pr-2">Impact ↓</span>
        {cols.map(c => <span key={c} className="text-center font-bold text-slate-400">L-{c}</span>)}
        
        {gridCells.map((impact) => (
          <React.Fragment key={impact}>
            <span className="font-bold self-center text-slate-400 text-right pr-2">I-{impact}</span>
            {cols.map((likelihood) => (
              <div 
                key={`${impact}-${likelihood}`} 
                className={`h-16 w-20 flex flex-col items-center justify-center rounded-lg text-xs transition-transform transform hover:scale-105 cursor-pointer ${getCellColor(impact, likelihood)}`}
              >
                <span>Score: {impact * likelihood}</span>
                <span className="text-[10px] opacity-80">
                  ({risks.filter(r => r.residual_impact === impact && r.residual_likelihood === likelihood).length} Risks)
                </span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
