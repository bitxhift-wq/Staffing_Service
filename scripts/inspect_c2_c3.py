from PIL import Image
import numpy as np

for num in [2, 3]:
    pair = Image.open(f'test-artifacts/card_pair_{num}.png')
    h = (pair.height - 6) // 2
    view_c = pair.crop((0, h + 6, pair.width, pair.height))
    view_c.save(f'test-artifacts/view_c{num}.png')
    # Let's inspect rows 35 to 65 of view_c
    arr = np.array(view_c)
    print(f"=== Card {num} view crop ===")
    for r in range(35, 65, 2):
        dark = np.where(arr[r, :, 0] < 50)[0]
        if len(dark):
            print(f"row {r}: text from {dark[0]} to {dark[-1]} (w={dark[-1]-dark[0]+1})")
