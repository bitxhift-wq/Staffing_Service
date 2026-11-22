from PIL import Image

for name in ['tablet', 'mobile']:
    im = Image.open(f'test-artifacts/tech_section_{name}.png')
    print(f"{name} screenshot size: {im.size}")
