import numpy as np
from PIL import Image, ImageDraw

# Create 1024x526 canvas (section dimensions without navbar)
W, H = 1024, 526
bg = Image.new('RGB', (W, H), (250, 250, 250)) # light grey base
draw = ImageDraw.Draw(bg)

# Let's inspect coordinates from our earlier measurements:
# Top edge:
# x ~ 59% (604px) light grey stripe starts
# x ~ 65.5% (670px) mid grey stripe starts
# x ~ 70.5% (722px) black area starts
# Bottom edge:
# x ~ 40% (410px) light grey stripe starts
# x ~ 46.5% (476px) mid grey stripe starts
# x ~ 51.5% (527px) black area starts

# 1. Light grey stripe: #e0e1e5
poly_light = [
    (int(0.585 * W), 0),
    (int(0.655 * W), 0),
    (int(0.470 * W), H),
    (int(0.400 * W), H)
]
draw.polygon(poly_light, fill=(225, 226, 230))

# 2. Mid grey stripe: #bfc1c6
poly_mid = [
    (int(0.650 * W), 0),
    (int(0.708 * W), 0),
    (int(0.520 * W), H),
    (int(0.465 * W), H)
]
draw.polygon(poly_mid, fill=(192, 194, 199))

# 3. Main deep charcoal / black area
poly_black = [
    (int(0.705 * W), 0),
    (W, 0),
    (W, H),
    (int(0.515 * W), H)
]
draw.polygon(poly_black, fill=(18, 19, 22))

# 4. Upper right facet (slightly lighter charcoal diagonal polygon)
poly_facet = [
    (int(0.810 * W), 0),
    (W, 0),
    (W, int(0.42 * H)),
    (int(0.880 * W), H),
    (int(0.740 * W), H),
    (int(0.705 * W), 0)
]
# draw with subtle lighter charcoal
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw_o = ImageDraw.Draw(overlay)
draw_o.polygon(poly_facet, fill=(42, 44, 49, 140))
bg.paste(Image.alpha_composite(bg.convert('RGBA'), overlay).convert('RGB'))

bg.save('test-artifacts/simulated_bg.png')
print('Simulated background saved to test-artifacts/simulated_bg.png')
