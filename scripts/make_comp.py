from PIL import Image

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
view = Image.open('test-artifacts/tech_section_ref_view.png')

comp = Image.new('RGB', (1024, 576 * 2 + 10), (128, 128, 128))
comp.paste(ref, (0, 0))
comp.paste(view, (0, 586))
comp.save('test-artifacts/ref_vs_rendered_direct.png')

# Also crop individual parts to compare side by side
# 1. Header (ref vs view)
c_header = Image.new('RGB', (1024, 180 * 2 + 5), (200, 200, 200))
c_header.paste(ref.crop((0, 50, 1024, 230)), (0, 0))
c_header.paste(view.crop((0, 50, 1024, 230)), (0, 185))
c_header.save('test-artifacts/compare_header.png')

# 2. Row 1 cards
c_row1 = Image.new('RGB', (1024, 170 * 2 + 5), (200, 200, 200))
c_row1.paste(ref.crop((0, 205, 1024, 375)), (0, 0))
c_row1.paste(view.crop((0, 205, 1024, 375)), (0, 175))
c_row1.save('test-artifacts/compare_row1.png')

# 3. Row 2 cards
c_row2 = Image.new('RGB', (1024, 170 * 2 + 5), (200, 200, 200))
c_row2.paste(ref.crop((0, 370, 1024, 540)), (0, 0))
c_row2.paste(view.crop((0, 370, 1024, 540)), (0, 175))
c_row2.save('test-artifacts/compare_row2.png')

print("Direct comparison and slice comparisons generated!")
