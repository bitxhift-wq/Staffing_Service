# Improved wave generator matching reference image closely
paths = []
num_lines = 24
for i in range(num_lines):
    t = i / (num_lines - 1)
    # The wave curves smoothly:
    # starts near x=15 (relative to wave SVG viewBox 0 0 500 220)
    # swoops down in a valley, then crests up high toward top right
    y_start = 128 + t * 8
    y_ctrl1 = 170 + t * 18
    y_ctrl2 = 45 + t * 50
    y_end = 2 + t * 115
    
    x0 = 20 + t * 25
    x1 = 125 + t * 12
    x2 = 285 - t * 25
    x3 = 475 + t * 25
    
    d = f"M {x0:.1f} {y_start:.1f} C {x1:.1f} {y_ctrl1:.1f}, {x2:.1f} {y_ctrl2:.1f}, {x3:.1f} {y_end:.1f}"
    # Opacity falls off at top and bottom edges
    opacity = 0.22 + 0.60 * (1 - abs(t - 0.42) * 1.5)
    opacity = max(0.10, min(0.80, opacity))
    paths.append(f'              <path d="{d}" stroke="rgba(255,255,255,{opacity:.2f})" strokeWidth="1.2" strokeDasharray="2.5 4.5" fill="none" />')

# Let's also add 6 cross/secondary subtle echoing harmonics in the upper fan
for j in range(6):
    tj = j / 5.0
    y0 = 138 + tj * 5
    y1 = 160 + tj * 12
    y2 = 30 + tj * 35
    y_e = 0 + tj * 60
    d = f"M {35 + tj * 20:.1f} {y0:.1f} C {140 + tj * 10:.1f} {y1:.1f}, {295 - tj * 20:.1f} {y2:.1f}, {485 + tj * 15:.1f} {y_e:.1f}"
    paths.append(f'              <path d="{d}" stroke="rgba(255,255,255,{0.18 + tj * 0.22:.2f})" strokeWidth="1.1" strokeDasharray="2 5" fill="none" />')

with open("test-artifacts/wave_paths_new.txt", "w") as f:
    f.write("\n".join(paths))

print(f"Generated {len(paths)} wave paths in test-artifacts/wave_paths_new.txt")
