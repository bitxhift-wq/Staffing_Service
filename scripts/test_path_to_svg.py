import os
import matplotlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from matplotlib.path import Path

def path_to_svg_d(path):
    commands = []
    # Path vertices and codes
    # MOVETO = 1, LINETO = 2, CURVE3 = 3, CURVE4 = 4, CLOSEPOLY = 79
    verts = path.vertices
    codes = path.codes
    if codes is None:
        return ""
    
    i = 0
    while i < len(codes):
        code = codes[i]
        if code == Path.MOVETO:
            commands.append(f"M {verts[i][0]:.2f} {verts[i][1]:.2f}")
            i += 1
        elif code == Path.LINETO:
            commands.append(f"L {verts[i][0]:.2f} {verts[i][1]:.2f}")
            i += 1
        elif code == Path.CURVE3:
            commands.append(f"Q {verts[i][0]:.2f} {verts[i][1]:.2f} {verts[i+1][0]:.2f} {verts[i+1][1]:.2f}")
            i += 2
        elif code == Path.CURVE4:
            commands.append(f"C {verts[i][0]:.2f} {verts[i][1]:.2f} {verts[i+1][0]:.2f} {verts[i+1][1]:.2f} {verts[i+2][0]:.2f} {verts[i+2][1]:.2f}")
            i += 3
        elif code == Path.CLOSEPOLY:
            commands.append("Z")
            i += 1
        else:
            i += 1
    return " ".join(commands)

# Compare fonts: Bahnschrift vs Segoe UI Bold vs Arial Bold
for font_file in ["bahnschrift.ttf", "segoeuib.ttf", "arialbd.ttf"]:
    fp = FontProperties(fname=os.path.join(r"C:\Windows\Fonts", font_file))
    tp = TextPath((0, 0), "POWERED BY SMRIKAAM", size=71, prop=fp)
    d = path_to_svg_d(tp)
    print(f"Font {font_file}: path commands count = {len(d.split())}")
