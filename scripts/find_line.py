with open("src/main.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if 'id="practice-areas"' in line:
            print(f"Line {i+1}: {line.strip()}")
