with open('src/components/FredExtractionAgent.tsx', 'r') as f:
    content = f.read()

target = """                )}

          {/* Idle Placeholder instructions */}"""

replacement = """                )}
              </div>
              <div className="bg-slate-900 text-slate-500 p-4 text-center text-[9px] border-t border-slate-800 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Extracted structures are successfully formatted and securely recorded in our Supabase messages ledger.</span>
              </div>
            </div>
          )}

          {/* Idle Placeholder instructions */}"""

content = content.replace(target, replacement)

with open('src/components/FredExtractionAgent.tsx', 'w') as f:
    f.write(content)
