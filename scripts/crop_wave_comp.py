from PIL import Image

comp_header = Image.open('test-artifacts/compare_header.png')
# Dimensions: 1024 x 365
# Top half is ref (y=0..180), bottom half is view (y=185..365)
# Crop the right side containing the wave: x=650..1024
ref_wave_crop = comp_header.crop((600, 0, 1024, 180))
ref_wave_crop.save('test-artifacts/wave_comp_ref.png')

view_wave_crop = comp_header.crop((600, 185, 1024, 365))
view_wave_crop.save('test-artifacts/wave_comp_view.png')

print("Wave crops saved!")
