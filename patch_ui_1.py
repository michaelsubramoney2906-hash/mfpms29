with open('src/components/FredExtractionAgent.tsx', 'r') as f:
    content = f.read()

target = """          {isExtracting && (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-md text-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Cognitive Extraction in Progress</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Fred is currently analyzing the document. This process requires complex schema mapping and semantic interpretation.
                </p>
              </div>
            </div>
          )}"""

replacement = """          {isExtracting && (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-md text-center py-24 space-y-6">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Cognitive Extraction in Progress</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Fred is currently analyzing the document. This process requires complex schema mapping and semantic interpretation.
                </p>
                
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-indigo-400">Processing Document</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-300">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/FredExtractionAgent.tsx', 'w') as f:
        f.write(content)
    print("Replaced isExtracting block!")
else:
    print("isExtracting target not found!")
