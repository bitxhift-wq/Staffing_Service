import re

svg_path = r'c:\STAFFING\public\assets\AppliedMerit_Logo_Transparent.svg'
with open(svg_path, 'r', encoding='utf-8') as f:
    svg_content = f.read()

vb_match = re.search(r'viewBox="([^"]+)"', svg_content)
print('Current viewBox:', vb_match.group(1) if vb_match else 'None')

d_match = re.search(r'd="([^"]+)"', svg_content)
if d_match:
    d = d_match.group(1)
    numbers = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+', d)]
    xs = numbers[0::2]
    ys = numbers[1::2]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    w_art = x_max - x_min
    h_art = y_max - y_min
    print(f'Artwork bounds:')
    print(f'  X: {x_min} to {x_max} (Width: {w_art})')
    print(f'  Y: {y_min} to {y_max} (Height: {h_art})')
    print(f'  Artwork Aspect Ratio (w/h): {w_art / h_art:.4f}')

    vb = [float(x) for x in vb_match.group(1).split()]
    vb_min_x, vb_min_y, vb_w, vb_h = vb[0], vb[1], vb[2], vb[3]
    print(f'\nViewBox:')
    print(f'  viewBox: {vb_min_x} {vb_min_y} {vb_w} {vb_h}')
    print(f'  viewBox Aspect Ratio: {vb_w / vb_h:.4f}')

    left_pad = x_min - vb_min_x
    right_pad = (vb_min_x + vb_w) - x_max
    top_pad = y_min - vb_min_y
    bot_pad = (vb_min_y + vb_h) - y_max
    print(f'\nPadding:')
    print(f'  Left pad: {left_pad:.1f} ({left_pad/vb_w*100:.1f}%)')
    print(f'  Right pad: {right_pad:.1f} ({right_pad/vb_w*100:.1f}%)')
    print(f'  Top pad: {top_pad:.1f} ({top_pad/vb_h*100:.1f}%)')
    print(f'  Bottom pad: {bot_pad:.1f} ({bot_pad/vb_h*100:.1f}%)')
