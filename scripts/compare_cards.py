from PIL import Image

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
view = Image.open('test-artifacts/tech_section_ref_view.png')

# Let's save a 2x4 card grid comparing each card
# Card coords in ref and view:
for i, (r_box, v_box) in enumerate([
    ((26, 212, 258, 366), (28, 206, 258, 360)),
    ((272, 212, 504, 366), (270, 206, 500, 360)),
    ((518, 212, 750, 366), (510, 206, 740, 360)),
    ((764, 212, 996, 366), (752, 206, 982, 360)),
    ((26, 377, 258, 531), (28, 372, 258, 526)),
    ((272, 377, 504, 531), (270, 372, 500, 526)),
    ((518, 377, 750, 531), (510, 372, 740, 526)),
    ((764, 377, 996, 531), (752, 372, 982, 526)),
], 1):
    c_ref = ref.crop(r_box)
    c_view = view.crop(v_box)
    
    pair = Image.new('RGB', (c_ref.width, c_ref.height * 2 + 6), (180, 180, 180))
    pair.paste(c_ref, (0, 0))
    pair.paste(c_view, (0, c_ref.height + 6))
    pair.save(f'test-artifacts/card_pair_{i}.png')

print("All 8 card pairs saved to test-artifacts/card_pair_*.png")
