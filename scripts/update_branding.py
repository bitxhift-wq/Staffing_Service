import re

# 1. Update src/main.tsx
with open(r'c:\STAFFING\src\main.tsx', 'r', encoding='utf-8') as f:
    main_content = f.read()

main_content = main_content.replace('AppliedSkills_Logo.png', 'AppliedMerit_Logo_Transparent.svg')
main_content = main_content.replace('AppliedSkills_Logo.svg', 'AppliedMerit_Logo_Transparent.svg')
main_content = main_content.replace('smrikaam-appliedskills-schema', 'smrikaam-appliedmerit-schema')
main_content = main_content.replace('SMRIKAAM APPLIEDSKILLS', 'SMRIKAAM APPLIED MERIT')
main_content = main_content.replace('APPLIEDSKILLS — POWERED BY SMRIKAAM', 'APPLIED MERIT — POWERED BY SMRIKAAM')
main_content = main_content.replace('APPLIEDSKILLS NAVIGATION', 'APPLIED MERIT NAVIGATION')
main_content = main_content.replace('<h4>APPLIEDSKILLS</h4>', '<h4>APPLIED MERIT</h4>')
main_content = main_content.replace("name: 'APPLIEDSKILLS'", "name: 'APPLIED MERIT'")
main_content = main_content.replace("the APPLIEDSKILLS Talent Acquisition Desk", "the APPLIED MERIT Talent Acquisition Desk")
# width/height attributes for header logo
main_content = main_content.replace('width="1851"\n            height="346"', 'width="3486"\n            height="611"')
main_content = main_content.replace('width="165"\n            height="55"', 'width="3486"\n            height="611"')

with open(r'c:\STAFFING\src\main.tsx', 'w', encoding='utf-8') as f:
    f.write(main_content)
print("Updated src/main.tsx")

# 2. Update index.html
with open(r'c:\STAFFING\index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = html_content.replace('AppliedSkills_Logo.png', 'AppliedMerit_Logo_Transparent.svg')
html_content = html_content.replace('type="image/png"', 'type="image/svg+xml"')
html_content = html_content.replace('smrikaam-appliedskills-schema', 'smrikaam-appliedmerit-schema')
html_content = html_content.replace('SMRIKAAM APPLIEDSKILLS', 'SMRIKAAM APPLIED MERIT')
html_content = html_content.replace('APPLIEDSKILLS — POWERED BY SMRIKAAM', 'APPLIED MERIT — POWERED BY SMRIKAAM')
html_content = html_content.replace('"name": "APPLIEDSKILLS"', '"name": "APPLIED MERIT"')

with open(r'c:\STAFFING\index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
print("Updated index.html")

# 3. Update scripts/prerender.js
with open(r'c:\STAFFING\scripts\prerender.js', 'r', encoding='utf-8') as f:
    prerender_content = f.read()

prerender_content = prerender_content.replace('AppliedSkills_Logo.png', 'AppliedMerit_Logo_Transparent.svg')
prerender_content = prerender_content.replace('smrikaam-appliedskills-schema', 'smrikaam-appliedmerit-schema')
prerender_content = prerender_content.replace('SMRIKAAM APPLIEDSKILLS', 'SMRIKAAM APPLIED MERIT')
prerender_content = prerender_content.replace('APPLIEDSKILLS — POWERED BY SMRIKAAM', 'APPLIED MERIT — POWERED BY SMRIKAAM')
prerender_content = prerender_content.replace("'name': 'APPLIEDSKILLS'", "'name': 'APPLIED MERIT'")
prerender_content = prerender_content.replace("the APPLIEDSKILLS Talent Acquisition Desk", "the APPLIED MERIT Talent Acquisition Desk")

with open(r'c:\STAFFING\scripts\prerender.js', 'w', encoding='utf-8') as f:
    f.write(prerender_content)
print("Updated scripts/prerender.js")

# 4. Update src/styles.css
with open(r'c:\STAFFING\src\styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

css_content = css_content.replace('APPLIEDSKILLS — POWERED BY SMRIKAAM', 'APPLIED MERIT — POWERED BY SMRIKAAM')
with open(r'c:\STAFFING\src\styles.css', 'w', encoding='utf-8') as f:
    f.write(css_content)
print("Updated src/styles.css")
