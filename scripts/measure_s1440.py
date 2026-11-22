from PIL import Image
import numpy as np

s1440 = Image.open('test-artifacts/tech_section_1440.png')
# Dimensions: (1440, 622)
# Let's find card bounds in s1440
# Cards are at y around 210 to 570
# Let's find white card areas in s1440
arr = np.array(s1440)
# Look at y=300
row300 = arr[300, :, :]
# find white areas (>245 in R, G, B)
is_white = (row300[:, 0] > 245) & (row300[:, 1] > 245) & (row300[:, 2] > 245)

import itertools
segments = []
for k, g in itertools.groupby(enumerate(is_white), key=lambda x: x[1]):
    if k:
        l = list(g)
        segments.append((l[0][0], l[-1][0], l[-1][0] - l[0][0] + 1))
print("s1440 card x segments at y=300:")
for s in segments:
    if s[2] > 100:
        print(f"  x: {s[0]} to {s[1]} (width {s[2]})")

# Vertical extent of Card 1 at x=100
col100 = arr[:, 100, :]
is_white_col = (col100[:, 0] > 245) & (col100[:, 1] > 245) & (col100[:, 2] > 245)
segments_v = []
for k, g in itertools.groupby(enumerate(is_white_col), key=lambda x: x[1]):
    if k:
        l = list(g)
        segments_v.append((l[0][0], l[-1][0], l[-1][0] - l[0][0] + 1))
print("s1440 card vertical segments at x=100:")
for s in segments_v:
    if s[2] > 50:
        print(f"  y: {s[0]} to {s[1]} (height {s[2]})")
