from PIL import Image

ref = Image.open('C:/Users/mukhe/.gemini/antigravity/brain/d9089432-09d1-43c7-816c-8192b862d011/.user_uploaded/media_1795254023731_cff33e6c.jpg')
ref_sec = ref.crop((0, 50, 1024, 576)) # (1024, 526)

s1440 = Image.open('test-artifacts/tech_section_1440.png')
# Let's inspect s1440 directly
# Header crop
ref_header = ref_sec.crop((20, 10, 550, 160))
ref_header.save('test-artifacts/check_ref_header.png')

# In s1440 (width 1440, height 622):
# Left padding is around 40px, top padding around 48px
s1440_header = s1440.crop((30, 10, 750, 190))
s1440_header.save('test-artifacts/check_s1440_header.png')

# Right wave crop
ref_wave = ref_sec.crop((650, 0, 1024, 160))
ref_wave.save('test-artifacts/check_ref_wave.png')
s1440_wave = s1440.crop((850, 0, 1440, 200))
s1440_wave.save('test-artifacts/check_s1440_wave.png')

# Card 1 crop
ref_c1 = ref_sec.crop((26, 162, 258, 316))
ref_c1.save('test-artifacts/check_ref_c1.png')

# Card 4 crop
ref_c4 = ref_sec.crop((764, 162, 996, 316))
ref_c4.save('test-artifacts/check_ref_c4.png')

# Card 8 crop
ref_c8 = ref_sec.crop((764, 327, 996, 481))
ref_c8.save('test-artifacts/check_ref_c8.png')

print("All diagnostic crops saved!")
