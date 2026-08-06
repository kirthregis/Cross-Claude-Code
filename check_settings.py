# -*- coding: utf-8 -*-
import os, subprocess

path = "src/app/studio/settings/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Check what the header looks like now
idx = c.find("Save changes")
if idx >= 0:
    print("Found Save changes at:", idx)
    print(c[max(0,idx-200):idx+200])
else:
    print("Save changes NOT in file")

# Check if saveAll exists
print("saveAll in file:", "saveAll" in c)
print("Button onClick={saveAll} in file:", "Button onClick={saveAll}" in c)
print("onClick={saveAll} in file:", "onClick={saveAll}" in c)
