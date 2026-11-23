import os
import re
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from matplotlib.path import Path

svg_path = r'c:\STAFFING\public\assets\AppliedMerit_Logo_Transparent.svg'
with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'd="([^"]+)"', content)
d = match.group(1)
subpaths = [p.strip() for p in d.split('Z') if p.strip()]

# Verify:
# subpath 0: right line
# subpath 1: left line
# subpaths 2..27: old tagline
# subpaths 28..44: APPLIED MERIT + emblem

# Let's verify kept subpaths
kept_flourishes = [subpaths[0], subpaths[1]]
kept_logo = subpaths[28:]

print(f"Kept flourishes: {len(kept_flourishes)}")
print(f"Kept logo paths: {len(kept_logo)}")

# Letter targets (char, x_min, x_max) from original SVG
letter_targets = [
    ('P', 1157.8, 1211.8),
    ('O', 1259.3, 1332.3),
    ('W', 1379.0, 1471.7),
    ('E', 1520.2, 1574.2),
    ('R', 1626.3, 1682.7),
    ('E', 1733.2, 1787.8),
    ('D', 1836.5, 1901.2),
    ('B', 2020.0, 2076.0),
    ('Y', 2123.5, 2185.0),
    ('S', 2299.2, 2351.3),
    ('M', 2403.3, 2492.7),
    ('R', 2547.3, 2604.8),
    ('I', 2661.3, 2679.7),
    ('K', 2739.3, 2799.2),
    ('A', 2848.2, 2922.0),
    ('A', 2970.0, 3039.0),
    ('M', 3090.7, 3179.3)
]

fp = FontProperties(fname=r"C:\Windows\Fonts\segoeuib.ttf")

TARGET_HEIGHT = 71.0
TARGET_BASELINE = 896.0

def path_to_svg_subpaths(path, offset_x, baseline_y, scale_x, scale_y):
    verts = path.vertices
    codes = path.codes
    subpaths_out = []
    current_cmds = []
    
    i = 0
    while i < len(codes):
        code = codes[i]
        if code == Path.MOVETO:
            if current_cmds:
                subpaths_out.append(" ".join(current_cmds))
                current_cmds = []
            x = offset_x + verts[i][0] * scale_x
            y = baseline_y - verts[i][1] * scale_y
            current_cmds.append(f"M {x:.1f} {y:.1f}")
            i += 1
        elif code == Path.LINETO:
            x = offset_x + verts[i][0] * scale_x
            y = baseline_y - verts[i][1] * scale_y
            current_cmds.append(f"L {x:.1f} {y:.1f}")
            i += 1
        elif code == Path.CURVE3:
            x1 = offset_x + verts[i][0] * scale_x
            y1 = baseline_y - verts[i][1] * scale_y
            x2 = offset_x + verts[i+1][0] * scale_x
            y2 = baseline_y - verts[i+1][1] * scale_y
            current_cmds.append(f"Q {x1:.1f} {y1:.1f} {x2:.1f} {y2:.1f}")
            i += 2
        elif code == Path.CURVE4:
            x1 = offset_x + verts[i][0] * scale_x
            y1 = baseline_y - verts[i][1] * scale_y
            x2 = offset_x + verts[i+1][0] * scale_x
            y2 = baseline_y - verts[i+1][1] * scale_y
            x3 = offset_x + verts[i+2][0] * scale_x
            y3 = baseline_y - verts[i+2][1] * scale_y
            current_cmds.append(f"C {x1:.1f} {y1:.1f} {x2:.1f} {y2:.1f} {x3:.1f} {y3:.1f}")
            i += 3
        elif code == Path.CLOSEPOLY:
            current_cmds.append("Z")
            subpaths_out.append(" ".join(current_cmds))
            current_cmds = []
            i += 1
        else:
            i += 1
    if current_cmds:
        subpaths_out.append(" ".join(current_cmds))
    return subpaths_out

new_tagline_subpaths = []
for char, x_min, x_max in letter_targets:
    target_mid_x = (x_min + x_max) / 2.0
    
    tp = TextPath((0, 0), char, size=100, prop=fp)
    bb = tp.get_extents()
    
    scale_y = TARGET_HEIGHT / bb.height
    scale_x = scale_y
    
    rendered_w = bb.width * scale_x
    offset_x = target_mid_x - (bb.x0 * scale_x + rendered_w / 2.0)
    
    # Generate subpaths
    sps = path_to_svg_subpaths(tp, offset_x, TARGET_BASELINE, scale_x, scale_y)
    new_tagline_subpaths.extend(sps)

print(f"Generated new tagline subpaths: {len(new_tagline_subpaths)}")

# Combine all subpaths:
# 1. Right flourish
# 2. Left flourish
# 3. New vector letters
# 4. Main logo paths
all_subpaths = [kept_flourishes[0] + " Z", kept_flourishes[1] + " Z"]
for sp in new_tagline_subpaths:
    if not sp.endswith("Z"):
        sp += " Z"
    all_subpaths.append(sp)
for sp in kept_logo:
    all_subpaths.append(sp + " Z")

full_d = " ".join(all_subpaths)

new_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="299.7 304.3 3582.8 632.0" width="3582.8" height="632" shape-rendering="geometricPrecision">
  <path d="{full_d}" fill="#FFFFFF" fill-rule="evenodd"/>
</svg>'''

# Save to public and src assets
for p in [r'c:\STAFFING\public\assets\AppliedMerit_Logo_Transparent.svg', r'c:\STAFFING\src\assets\AppliedMerit_Logo_Transparent.svg']:
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_svg)
    print(f"Updated {p}")
