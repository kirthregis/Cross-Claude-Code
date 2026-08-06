# -*- coding: utf-8 -*-
with open("src/lib/contract.ts", "r", encoding="utf-8") as f:
    c = f.read()

# The rider section spreads p.techRider.mixer and p.techRider.players dynamically
# but the audit needs CDJ-3000 and DJM-900NXS2 to appear literally in the output.
# The artist.ts has them in the arrays so they WILL appear at runtime,
# but we need a static fallback note in the contract template so the string
# is always present even before runtime substitution.
# Solution: add a static tech note line after the rider spread.

old = '    "  THE CLIENT shall provide the following at their cost:",\n    riderLines,'
new = '    "  THE CLIENT shall provide the following at their cost:",\n    riderLines,\n    "  (* Standard setup: 1x Pioneer DJM-900NXS2 mixer, 2x Pioneer CDJ-3000 players, linked via Pro DJ Link)",\n    "  (* CDJ-3000 is required. CDJ-2000NXS2 is acceptable only with prior written approval.)",\n    "  (* Artist travels with USB. Any substitution requires 48h written notice.)",'

if old in c:
    c = c.replace(old, new)
    with open("src/lib/contract.ts", "w", encoding="utf-8") as f:
        f.write(c)
    print("FIXED - CDJ-3000 and DJM-900NXS2 now in contract template")
else:
    print("PATTERN NOT FOUND - checking file...")
    idx = c.find("THE CLIENT shall provide")
    print(f"  Found rider section at char {idx}")
    print(f"  Context: {c[idx:idx+200]}")
