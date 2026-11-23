import re

svg_path = r'c:\STAFFING\src\assets\AppliedMerit_Logo_Transparent.svg'
with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'd="([^"]+)"', content)
if match:
    d = match.group(1)
    subpaths = [p.strip() for p in d.split('Z') if p.strip()]
    print(f'Total subpaths: {len(subpaths)}')
    for idx, sp in enumerate(subpaths):
        coords = re.findall(r'[-+]?(?:\d*\.\d+|\d+)', sp)
        nums = [float(c) for c in coords]
        xs = nums[0::2]
        ys = nums[1::2]
        if xs and ys:
            print(f'Subpath {idx:2d}: X=[{min(xs):6.1f}, {max(xs):6.1f}], Y=[{min(ys):5.1f}, {max(ys):5.1f}], pts={len(xs)}')
