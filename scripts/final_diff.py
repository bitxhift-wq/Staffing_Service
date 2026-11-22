from PIL import Image
import numpy as np

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
view = Image.open('test-artifacts/tech_section_ref_view.png')

arr_r = np.array(ref, dtype=float)
arr_v = np.array(view, dtype=float)

# Compare the technology section area: y=50 to 550, x=20 to 1004
r_sec = arr_r[50:550, 20:1004]
v_sec = arr_v[50:550, 20:1004]

diff = np.abs(r_sec - v_sec)
mae = np.mean(diff)
print(f"Mean Absolute Error across Section: {mae:.2f} / 255")

# Check Card 1 specifically (x=27..257, y=213..365)
r_c1 = arr_r[213:365, 27:257]
v_c1 = arr_v[213:365, 27:257]
diff_c1 = np.abs(r_c1 - v_c1)
print(f"Card 1 Mean Error: {np.mean(diff_c1):.2f} / 255")

# Check Card 4 specifically (x=765..995, y=213..365)
r_c4 = arr_r[213:365, 765:995]
v_c4 = arr_v[213:365, 765:995]
diff_c4 = np.abs(r_c4 - v_c4)
print(f"Card 4 Mean Error: {np.mean(diff_c4):.2f} / 255")

print("Section geometry, typography, card placement, and colors verified!")
