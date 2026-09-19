"""
Assemble the press-kit site for Cloudflare Pages.

A Pages deployment replaces the whole site, so everything that must stay live
has to be in the build directory. Two things are load-bearing:

  /DJ-Emy-Press-Kit.pdf  — this exact URL was DM'd to ~13 Instagram accounts in
                           late July. Those threads are still open and people
                           still click them. It must not 404.
  /og.jpg + index.html   — the Open Graph card that makes the link render as a
                           rich preview in an Instagram or WhatsApp DM.

On top of those, one page per target at /<slug>/, each carrying its own OG title
so the link preview in a DM shows that venue's own name rather than a generic one.
"""
import json
import pathlib
import shutil

HERE = pathlib.Path(__file__).parent
SITE = HERE / "site"
OUT = HERE / "out"

targets = json.loads((HERE / "targets.json").read_text(encoding="utf-8"))["targets"]

PAGE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DJ Emy — prepared for {target}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Emy Vision Group">
<meta property="og:title" content="DJ Emy — prepared for {target}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://evg-presskit.pages.dev/{slug}/">
<meta property="og:image" content="https://evg-presskit.pages.dev/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root{{--bg:#07090f;--ink:#eef1f6;--dim:#8b93a1;--gold:#c9a24a;--line:#242b38}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}}
  .wrap{{max-width:900px;margin:0 auto;padding:38px 20px 70px}}
  .eyebrow{{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);font-weight:600}}
  h1{{font-size:clamp(34px,7vw,58px);line-height:.95;margin:14px 0 6px;letter-spacing:-1.5px;font-weight:800}}
  .for{{color:var(--gold);font-size:clamp(15px,3vw,19px);margin-bottom:22px}}
  .tags{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px}}
  .tag{{border:1px solid var(--line);border-radius:20px;padding:4px 13px;font-size:12.5px;color:var(--dim)}}
  .cta{{display:inline-block;background:var(--gold);color:#07090f;text-decoration:none;
    font-weight:700;border-radius:9px;padding:14px 26px;font-size:15.5px}}
  .alt{{display:inline-block;margin-left:12px;color:var(--dim);text-decoration:none;font-size:14.5px;
    border-bottom:1px solid var(--line);padding-bottom:2px}}
  embed,iframe{{width:100%;height:78vh;min-height:460px;border:1px solid var(--line);
    border-radius:12px;margin-top:30px;background:#11151d}}
  .foot{{margin-top:34px;padding-top:20px;border-top:1px solid var(--line);color:var(--dim);font-size:14px}}
  .foot a{{color:var(--gold);text-decoration:none}}
  @media(max-width:600px){{embed,iframe{{display:none}} .alt{{display:block;margin:16px 0 0}}}}
</style>
</head><body>
<div class=wrap>
  <div class=eyebrow>Emy Vision Group &middot; Dubai, UAE &middot; Press Kit 2026</div>
  <h1>DJ EMY</h1>
  <div class=for>Prepared for {target}</div>
  <div class=tags><span class=tag>Amapiano</span><span class=tag>Afro House</span><span class=tag>Afro Tech</span><span class=tag>Live, every set</span></div>
  <a class=cta href="/kits/{slug}.pdf">Open the press kit</a>
  <a class=alt href="https://youtube.com/@DJEMY-o6d">Hear a live set</a>
  <embed src="/kits/{slug}.pdf" type="application/pdf">
  <div class=foot>
    Booking &amp; management &mdash; Emy Vision Group<br>
    Kirth, Business Development &middot;
    <a href="mailto:admin@emyvisiongroup.com">admin@emyvisiongroup.com</a><br>
    <a href="tel:+971503443281">+971 50 344 3281</a> &middot;
    <a href="tel:+97474767686">+974 7476 7686</a> &middot;
    <a href="https://instagram.com/evgroup2026">@evgroup2026</a>
  </div>
</div>
</body></html>
"""


def strip(html: str) -> str:
    """h2 lines carry entities and markup; the OG description must be plain."""
    for a, b in [("&rsquo;", "’"), ("&mdash;", "—"), ("&ldquo;", '"'),
                 ("&rdquo;", '"'), ("&middot;", "·"), ("&amp;", "&"), ('"', "")]:
        html = html.replace(a, b)
    return html.strip()


def main() -> None:
    (SITE / "kits").mkdir(parents=True, exist_ok=True)
    built = []
    for t in targets:
        slug = t["slug"]
        pdf = OUT / f"DJ_Emy_EPK_{slug}.pdf"
        if not pdf.exists():
            print(f"  skip {slug} — no rendered kit")
            continue
        shutil.copy(pdf, SITE / "kits" / f"{slug}.pdf")
        desc = strip(f'{t["h2_line1"]} {t["h2_line2"]}')
        page = SITE / slug
        page.mkdir(parents=True, exist_ok=True)
        (page / "index.html").write_text(
            PAGE.format(target=strip(t["target"]), slug=slug, desc=desc), encoding="utf-8")
        built.append(slug)

    # The root page still advertised the old booking line.
    root = SITE / "index.html"
    html = root.read_text(encoding="utf-8")
    html = (html.replace("tel:+971506607743", "tel:+971503443281")
                .replace("+971 50 660 7743", "+971 50 344 3281 · +974 7476 7686")
                .replace("+971506607743", "+971503443281"))
    root.write_text(html, encoding="utf-8")

    print(f"built {len(built)} target pages: {', '.join(built)}")
    total = sum(f.stat().st_size for f in SITE.rglob("*") if f.is_file())
    print(f"site: {sum(1 for f in SITE.rglob('*') if f.is_file())} files, {total/1e6:.1f} MB")


if __name__ == "__main__":
    main()
