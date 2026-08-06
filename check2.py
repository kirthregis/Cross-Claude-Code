# -*- coding: utf-8 -*-
import os, subprocess

path = "src/app/studio/settings/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Find and fix the return statement header - add Save changes button
# The header div starts with the h1 Settings
old_header = '    <div className="space-y-5">'
new_header = '    <div className="space-y-5">'

# Find the exact header pattern currently in file
import re
# Find first div with h1 Settings
match = re.search(r'<div[^>]*>\s*<h1[^>]*>Settings</h1>.*?</div>', c, re.DOTALL)
if match:
    print("Found header at:", match.start(), "-", match.end())
    print("Current header:")
    print(c[match.start():match.end()])
else:
    print("Header not found with regex")
    # Try simple search
    idx = c.find("Settings</h1>")
    print("Settings</h1> at:", idx)
    print(c[max(0,idx-100):idx+200])
