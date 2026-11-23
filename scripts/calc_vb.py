import re

# Exact artwork bounds
x_min, x_max = 324.7, 3857.5
y_min, y_max = 316.3, 924.3

# Tight viewBox with 1% clean optical padding
pad_x = 25.0
pad_y = 12.0

vb_x = round(x_min - pad_x, 1)
vb_y = round(y_min - pad_y, 1)
vb_w = round((x_max - x_min) + 2 * pad_x, 1)
vb_h = round((y_max - y_min) + 2 * pad_y, 1)

print(f'Tightly fitted viewBox: "{vb_x} {vb_y} {vb_w} {vb_h}"')
ratio = vb_w / vb_h
print(f'Aspect ratio: {ratio:.4f}')

for target_w in [230, 235, 240]:
    target_h = target_w / ratio
    print(f'At width={target_w}px: rendered height={target_h:.2f}px (in 82px header: top/bot pad={(82-target_h)/2:.2f}px)')
