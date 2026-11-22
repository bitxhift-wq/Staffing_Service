from PIL import Image
import numpy as np

for i in range(1, 9):
    pair = Image.open(f'test-artifacts/card_pair_{i}.png')
    h = (pair.height - 6) // 2
    ref_c = pair.crop((0, 0, pair.width, h))
    view_c = pair.crop((0, h + 6, pair.width, pair.height))
    
    # Check bottom-right corner pixel values of view_c
    arr_v = np.array(view_c)
    corner_val = arr_v[-10:, -10:, 0]
    has_corner_detail = np.any((corner_val > 215) & (corner_val < 240))
    
    # Check title lines in view_c (around y=40..75)
    title_strip = arr_v[40:75, 15:-15, 0]
    dark_y = np.where(np.min(title_strip, axis=1) < 50)[0]
    title_h = (dark_y[-1] - dark_y[0] + 1) if len(dark_y) else 0
    
    # Check desc lines in view_c (around y=75..145)
    desc_strip = arr_v[75:145, 15:-15, 0]
    line_count = 0
    in_line = False
    for v in np.min(desc_strip, axis=1):
        if v < 140 and not in_line:
            in_line = True
            line_count += 1
        elif v >= 140 and in_line:
            in_line = False

    print(f"Card {i}: Title height={title_h}px ({'1 line' if title_h <= 18 else '2+ lines'}), Desc lines={line_count}, Corner detail={'YES' if has_corner_detail else 'CHECK'}")
