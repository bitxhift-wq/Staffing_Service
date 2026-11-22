# Generate a set of bezier curves for the dotted wave
paths = []
num_lines = 22
for i in range(num_lines):
    t = i / (num_lines - 1)
    # The wave in reference curves smoothly:
    # starts near x=0 (middle of the screen, around 65% width)
    # swoops down in a valley, then crests up high toward top right
    y_start = 135 + t * 6
    y_ctrl1 = 175 + t * 14
    y_ctrl2 = 55 + t * 45
    y_end = 5 + t * 105
    
    x0 = 30 + t * 25
    x1 = 130 + t * 10
    x2 = 280 - t * 20
    x3 = 460 + t * 20
    
    d = f"M {x0:.1f} {y_start:.1f} C {x1:.1f} {y_ctrl1:.1f}, {x2:.1f} {y_ctrl2:.1f}, {x3:.1f} {y_end:.1f}"
    # Opacity falls off at top and bottom edges
    opacity = 0.2 + 0.55 * (1 - abs(t - 0.45) * 1.5)
    opacity = max(0.08, min(0.75, opacity))
    paths.append(f'  <path d="{d}" stroke="rgba(255,255,255,{opacity:.2f})" strokeWidth="1.2" strokeDasharray="2.5 4.5" fill="none" />')

print(f"Generated {len(paths)} wave paths")
with open("test-artifacts/wave_paths.txt", "w") as f:
    f.write("\n".join(paths))
