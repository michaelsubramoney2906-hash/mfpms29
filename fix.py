import re

with open('src/components/FredExtractionAgent.tsx', 'r') as f:
    content = f.read()

content = content.replace("onChange={(e) => { /* Placeholder because fileInputRef is missing in this rewritten section but it is at top of component */ }}", "ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}")

content = content.replace("""const el = document.querySelector('input[type="file"]');
                if (el) el.click();""", "fileInputRef.current?.click();")

with open('src/components/FredExtractionAgent.tsx', 'w') as f:
    f.write(content)

