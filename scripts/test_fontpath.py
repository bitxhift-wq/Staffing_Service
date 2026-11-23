import matplotlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties, findfont

print("Matplotlib version:", matplotlib.__version__)

# Test font candidates
fonts_to_test = [
    'Inter',
    'Montserrat',
    'Segoe UI',
    'Arial',
    'Helvetica',
    'Barlow',
    'Oswald',
    'Roboto'
]

for name in fonts_to_test:
    fp = FontProperties(family=name, weight='bold')
    path = findfont(fp, fallback_to_default=False)
    print(f"Font '{name}': {path}")
