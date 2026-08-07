with open('server.ts', 'r') as f:
    content = f.read()

target = """3. For every extracted KPI, extract its exact properties from the document: National_KPA, Key Performance Indicator (description), Weight, Baseline, Annual Target, 1st Quarter planned target, 2nd Quarter planned target, 3rd Quarter planned target, 4th Quarter planned target, POE (Portfolio of Evidence), and Total Budget allocated.
4. Calculate a 'Data_Match_Percentage' between 0 and 100, representing your confidence that the extracted data exactly matches the provided document."""

replacement = """3. For every extracted KPI, extract its exact properties from the document: National_KPA, Key Performance Indicator (description), Weight, Baseline, Annual Target, 1st Quarter planned target, 2nd Quarter planned target, 3rd Quarter planned target, 4th Quarter planned target, POE (Portfolio of Evidence), and Total Budget allocated. If there is no baseline found for a specific KPI, ignore the fact that there is no baseline and extract it as an empty string. DO NOT input any fabricated data in place of that.
4. Calculate a 'Data_Match_Percentage' between 0 and 100, representing your confidence that the extracted data exactly matches the provided document."""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Replaced!")
else:
    print("Not found!")
