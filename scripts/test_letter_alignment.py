import os
import re
import numpy as np
import matplotlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from matplotlib.path import Path

# Original letter centers and bounding boxes:
# P: 1157.8 - 1211.8 (mid 1184.8)
# O: 1259.3 - 1332.3 (mid 1295.8)
# W: 1379.0 - 1471.7 (mid 1425.3)
# E: 1520.2 - 1574.2 (mid 1547.2)
# R: 1626.3 - 1682.7 (mid 1654.5)
# E: 1733.2 - 1787.8 (mid 1760.5)
# D: 1836.5 - 1901.2 (mid 1868.8)
# B: 2020.0 - 2076.0 (mid 2048.0)
# Y: 2123.5 - 2185.0 (mid 2154.2)
# S: 2299.2 - 2351.3 (mid 2325.2)
# M: 2403.3 - 2492.7 (mid 2448.0)
# R: 2547.3 - 2604.8 (mid 2576.0)
# I: 2661.3 - 2679.7 (mid 2670.5)
# K: 2739.3 - 2799.2 (mid 2769.2)
# A: 2848.2 - 2922.0 (mid 2885.1)
# A: 2970.0 - 3039.0 (mid 3004.5)
# M: 3090.7 - 3179.3 (mid 3135.0)

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

fp = FontProperties(fname=r"C:\Windows\Fonts\bahnschrift.ttf", weight='bold')

# Test target Y: baseline 897.0, top 826.0 -> height = 71.0
TARGET_TOP = 826.0
TARGET_BOTTOM = 897.0
TARGET_HEIGHT = TARGET_BOTTOM - TARGET_TOP # 71.0

print(f"Target Height: {TARGET_HEIGHT}, Baseline: {TARGET_BOTTOM}")

letter_paths = []
for char, x_min, x_max in letter_targets:
    target_mid_x = (x_min + x_max) / 2.0
    target_w = x_max - x_min
    
    # Generate char textpath
    tp = TextPath((0, 0), char, size=100, prop=fp)
    bb = tp.get_extents()
    
    # Scale to match TARGET_HEIGHT
    char_h = bb.height
    scale_y = TARGET_HEIGHT / char_h
    # Scale X proportionally or slightly adjusted to match letter width
    scale_x = scale_y
    
    # Calculate offset
    rendered_w = bb.width * scale_x
    offset_x = target_mid_x - (bb.x0 * scale_x + rendered_w / 2.0)
    
    print(f"Char '{char}': target_w={target_w:.1f}, rendered_w={rendered_w:.1f}, offset_x={offset_x:.1f}")
