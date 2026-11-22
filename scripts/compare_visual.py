from PIL import Image
import numpy as np

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
view = Image.open('test-artifacts/tech_section_ref_view.png')

# Save side-by-side comparison of the full viewport:
side_by_side = Image.new('RGB', (1024 * 2 + 10, 576), (128, 128, 128))
side_by_side.paste(ref, (0, 0))
side_by_side.paste(view, (1034, 0))
side_by_side.save('test-artifacts/side_by_side_1024.png')

# Save stacked comparison:
stacked = Image.new('RGB', (1024, 576 * 2 + 10), (128, 128, 128))
stacked.paste(ref, (0, 0))
stacked.paste(view, (0, 586))
stacked.save('test-artifacts/stacked_1024.png')

print("Visual side-by-side and stacked comparisons saved!")
