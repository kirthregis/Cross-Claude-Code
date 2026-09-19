"""
Render one press kit per target from template.html + targets.json.

    python scripts/epk/render.py            # all targets
    python scripts/epk/render.py jet-lag    # one

Output: scripts/epk/out/DJ_Emy_EPK_<slug>.pdf, rendered through headless Chrome
(the kit is a print-to-PDF design — @page size:A4, margin:0).
"""
import json
import pathlib
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
OUT = HERE / "out"
ASSETS = pathlib.Path(r"E:\EVG\EVG Artists\DJ Emy\EPK 2026")

CHROME = next((p for p in [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
] if pathlib.Path(p).exists()), None)

QUOTE_BLOCK = """    <div class=quote>
      <p>&ldquo;{quote}&rdquo;</p>
      <span>{src}</span>
    </div>"""

# The premiere box is the strongest page in the kit and it promises a single,
# real, unreleased record. Rendering it for two targets would promise the same
# first play twice, so it is opened only when the target holds it.
PREMIERE_OPEN = '<div class=box style="border-color:rgba(201,162,74,.45)">'
PREMIERE_HIDDEN = '<div class=box style="border-color:rgba(201,162,74,.45);display:none">'


def render(t: dict, template: str) -> pathlib.Path:
    html = template
    quote = (QUOTE_BLOCK.format(quote=t["quote"], src=t["quote_src"])
             if t.get("quote") else "")
    for key, val in {
        "{{TARGET}}": t["target"],
        "{{H2_LINE1}}": t["h2_line1"],
        "{{H2_LINE2}}": t["h2_line2"],
        "{{QUOTE_BLOCK}}": quote,
        "{{BRIDGE}}": t["bridge"],
        "{{THEM}}": t["them"],
        "{{FIT}}": t["fit"],
        "{{PREMIERE}}": t.get("premiere_para", ""),
        "{{PREMIERE_OPEN}}": PREMIERE_OPEN if t.get("premiere") else PREMIERE_HIDDEN,
        "{{ASK_ONE_NIGHT}}": t["ask_one_night"],
        "{{ASK_THIRD_TITLE}}": t["ask_third_title"],
        "{{ASK_THIRD}}": t["ask_third"],
        "{{IDENTITY}}": t["identity"],
    }.items():
        html = html.replace(key, val)

    if "{{" in html:
        raise SystemExit(f"{t['slug']}: unfilled placeholder remains")

    work = OUT / t["slug"]
    work.mkdir(parents=True, exist_ok=True)
    # Images are referenced relatively, so they must sit beside the HTML.
    for img in ASSETS.glob("*.jpg"):
        shutil.copy(img, work / img.name)
    for img in ASSETS.glob("*.png"):
        shutil.copy(img, work / img.name)

    src = work / "kit.html"
    src.write_text(html, encoding="utf-8")
    pdf = OUT / f"DJ_Emy_EPK_{t['slug']}.pdf"

    subprocess.run([
        CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--no-pdf-header-footer", f"--print-to-pdf={pdf}",
        "--virtual-time-budget=15000", src.as_uri(),
    ], check=True, capture_output=True, timeout=180)
    return pdf


def main() -> None:
    if not CHROME:
        raise SystemExit("Chrome not found — needed to render the kit to PDF")
    template = (HERE / "template.html").read_text(encoding="utf-8")
    data = json.loads((HERE / "targets.json").read_text(encoding="utf-8"))
    wanted = sys.argv[1:]
    targets = [t for t in data["targets"] if not wanted or t["slug"] in wanted]
    if not targets:
        raise SystemExit(f"no target matched {wanted}")

    held = [t["slug"] for t in data["targets"] if t.get("premiere")]
    if len(held) > 1:
        raise SystemExit(f"the unreleased record is offered to {len(held)} targets: {held}")

    for t in targets:
        pdf = render(t, template)
        flag = "  [holds the premiere]" if t.get("premiere") else ""
        print(f"{t['slug']:<18} {pdf.stat().st_size:>8,} bytes  {pdf}{flag}")


if __name__ == "__main__":
    main()
