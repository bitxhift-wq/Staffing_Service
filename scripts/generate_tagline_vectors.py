import re
import os
import matplotlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from matplotlib.transforms import Affine2D

# Test Bahnschrift or Segoe UI
font_path = r"C:\Windows\Fonts\bahnschrift.ttf"
if not os.path.exists(font_path):
    font_path = r"C:\Windows\Fonts\segoeuib.ttf"

print(f"Using font: {font_path}")
fp = FontProperties(fname=font_path, weight='bold')

# Target metrics from original SVG:
# Tagline: "POWERED BY SMRIKAAM"
# Target Y: top = 826.0, bottom = 897.0 (height = 71.0)
# Target X: start = 1157.8, end = 3179.3 (width = 2021.5)
# Midpoint X = 2168.5

words = ["POWERED", "BY", "SMRIKAAM"]
text = "POWERED BY SMRIKAAM"

# We want clean, bold geometric lettering
# Let's inspect TextPath output
tp = TextPath((0, 0), text, size=71, prop=fp)
bbox = tp.get_extents()
print("Original textpath extents:", bbox)
