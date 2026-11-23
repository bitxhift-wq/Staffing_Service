from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties

fp_segoe = FontProperties(fname=r"C:\Windows\Fonts\segoeuib.ttf")
fp_arial = FontProperties(fname=r"C:\Windows\Fonts\arialbd.ttf")

for name, fp in [('Segoe UI Bold', fp_segoe), ('Arial Bold', fp_arial)]:
    print(f"\n--- {name} ---")
    for ch in ['O', 'W', 'M', 'A', 'S']:
        tp = TextPath((0, 0), ch, size=100, prop=fp)
        bb = tp.get_extents()
        scale = 71.0 / bb.height
        print(f"Char '{ch}': width={(bb.width * scale):.1f}")
