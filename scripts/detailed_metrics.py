from PIL import Image
import numpy as np

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
view = Image.open('test-artifacts/tech_section_ref_view.png')

arr_ref = np.array(ref)
arr_view = np.array(view)

# Compare header positions:
# In ref:
# Find y of title 'TECHNOLOGY AREAS WE HIRE FOR' in ref (x=60..100)
ref_title_y = np.where(arr_ref[50:200, 60, 0] < 50)[0] + 50
view_title_y = np.where(arr_view[50:200, 60, 0] < 50)[0] + 50
print(f"Ref title y range: {ref_title_y[0] if len(ref_title_y) else 'none'} to {ref_title_y[-1] if len(ref_title_y) else 'none'}")
print(f"View title y range: {view_title_y[0] if len(view_title_y) else 'none'} to {view_title_y[-1] if len(view_title_y) else 'none'}")

# Row 1 card y positions:
# Check Card 1 top border at x=100
ref_c1_y = np.where((arr_ref[200:300, 100, 0] > 240) & (arr_ref[200:300, 100, 1] > 240))[0] + 200
view_c1_y = np.where((arr_view[200:300, 100, 0] > 240) & (arr_view[200:300, 100, 1] > 240))[0] + 200
print(f"Ref card 1 y start: {ref_c1_y[0] if len(ref_c1_y) else 'none'}")
print(f"View card 1 y start: {view_c1_y[0] if len(view_c1_y) else 'none'}")

# Check 4 card x segments in view at y=250:
row_v = arr_view[250, :, :]
is_white_v = (row_v[:, 0] > 240) & (row_v[:, 1] > 240) & (row_v[:, 2] > 240)
import itertools
print("View card x-segments at y=250:")
for k, g in itertools.groupby(enumerate(is_white_v), key=lambda x: x[1]):
    if k:
        l = list(g)
        if l[-1][0] - l[0][0] + 1 > 50:
            print(f"  x={l[0][0]} to {l[-1][0]} (w={l[-1][0] - l[0][0] + 1})")

print("\nRef card x-segments at y=250:")
row_r = arr_ref[250, :, :]
is_white_r = (row_r[:, 0] > 240) & (row_r[:, 1] > 240) & (row_r[:, 2] > 240)
for k, g in itertools.groupby(enumerate(is_white_r), key=lambda x: x[1]):
    if k:
        l = list(g)
        if l[-1][0] - l[0][0] + 1 > 50:
            print(f"  x={l[0][0]} to {l[-1][0]} (w={l[-1][0] - l[0][0] + 1})")
