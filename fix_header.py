with open("src/app/studio/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'h-9 w-9 rounded-xl shadow-lg' in line:
        lines[i] = line.replace('h-9 w-9 rounded-xl shadow-lg', 'h-10 w-10 rounded-xl shadow-lg')
        print(f"Fixed img size on line {i}")
    if 'items-center gap-2' in line and i > 30:
        lines[i] = line.replace('items-center gap-2', 'items-center gap-3')
        print(f"Fixed gap on line {i}")
    if 'EMY Studio' in line and 'h1' in line:
        lines[i] = line.replace('EMY Studio', 'Emy Studio')
        print(f"Fixed text on line {i}")

with open("src/app/studio/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Done")
