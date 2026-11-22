from PIL import Image
import numpy as np

ref_w = np.array(Image.open('test-artifacts/wave_comp_ref.png'))
view_w = np.array(Image.open('test-artifacts/wave_comp_view.png'))

print("ref_w shape:", ref_w.shape)
print("view_w shape:", view_w.shape)

# Let's see the bright pixel distribution in ref vs view:
# Across horizontal slices: x = 0..424 (which corresponds to orig x=600..1024)
print("Bright pixels count in 50px vertical blocks:")
for x in range(0, 424, 60):
    b_ref = np.sum(ref_w[:, x:x+60, 0] > 60)
    b_view = np.sum(view_w[:, x:x+60, 0] > 60)
    print(f"x={600+x}..{600+x+60}: ref={b_ref} view={b_view}")
