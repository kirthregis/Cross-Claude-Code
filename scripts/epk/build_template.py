"""
Turn the bespoke DJ Emy press kit into a parameterised template.

The kit on E: (`EVG Artists\\DJ Emy\\EPK 2026\\EPK_source.html`) is written to ONE
target — "House of Yanos" — and that is why it lands. Pages 1, 3 and 4 are
generic; page 2 is the pitch. This lifts the target-specific strings out into
placeholders so a fresh, individually-argued kit can be rendered per venue.

Run once. Output: scripts/epk/template.html
"""
import pathlib
import re
import sys

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                   r"E:\EVG\EVG Artists\DJ Emy\EPK 2026\EPK_source.html")
OUT = pathlib.Path(__file__).parent / "template.html"

html = SRC.read_text(encoding="utf-8")

# The live site's apex does not answer; only www does, and the .com build still
# publishes the artist's personal number. Every rendered kit points at the
# Cloudflare Pages build, which carries the correct EVG booking line.
html = html.replace("emyvisiongroup.com &nbsp;&middot;&nbsp; @evgroup2026",
                    "emyvisiongroup.pages.dev &nbsp;&middot;&nbsp; @evgroup2026")

subs = [
    # cover + running foot
    ('<div class=eyebrow style="margin-bottom:4mm">Prepared for House of Yanos</div>',
     '<div class=eyebrow style="margin-bottom:4mm">Prepared for {{TARGET}}</div>'),
    ('<div class=foot><span>Prepared for House of Yanos</span><span>02</span></div>',
     '<div class=foot><span>Prepared for {{TARGET}}</span><span>02</span></div>'),

    # page 2 headline
    ('<h2>You built the house.<br><em>We&rsquo;re asking for one night in it.</em></h2>',
     '<h2>{{H2_LINE1}}<br><em>{{H2_LINE2}}</em></h2>'),

    # the pull-quote block: their own words, which is what makes it not a blast
    ('''    <div class=quote>
      <p>&ldquo;Instead of waiting to be included, we built our own house.&rdquo;</p>
      <span>House of Yanos</span>
    </div>''',
     '{{QUOTE_BLOCK}}'),

    ('<p style="margin-bottom:4mm">That line is the reason this document exists rather than a generic booking email.</p>',
     '<p style="margin-bottom:4mm">{{BRIDGE}}</p>'),

    ('<p style="margin-bottom:4mm">Nearly a decade. 120+ events. 300,000 people. Uncle Waffles, Focalistic, opening for Asake &mdash; and an entire region that now has somewhere to hear its own music properly, because you refused to wait for permission to build it.</p>',
     '<p style="margin-bottom:4mm">{{THEM}}</p>'),

    ('<p style="margin-bottom:6mm">Which is exactly what a house needs between the headliners: someone local who can warm the room, hold it, and grow the audience that shows up for the next flight in from Johannesburg.</p>',
     '<p style="margin-bottom:6mm">{{FIT}}</p>'),

    ('<p style="margin-top:2.5mm">It&rsquo;s yours to premiere. A House that built an embassy for African music in Dubai should be the room where a Gulf-made Amapiano record is played for the first time &mdash; not a streaming platform, and not somebody else&rsquo;s floor.</p>',
     '<p style="margin-top:2.5mm">{{PREMIERE}}</p>'),

    ('<div class=box style="padding:4.5mm"><h3 style="font-size:10.5pt">One night</h3><p style="font-size:9pt">Any Yanos event, any room. Start with one and judge her on the floor, not on this document.</p></div>',
     '<div class=box style="padding:4.5mm"><h3 style="font-size:10.5pt">One night</h3><p style="font-size:9pt">{{ASK_ONE_NIGHT}}</p></div>'),

    # The third proposal card repeated the premiere offer in Yanos's own words
    # ("Exclusive to the House"), so it shipped that promise to every target
    # even when the premiere box itself was hidden. It is now per-target.
    ('<div class=box style="padding:4.5mm"><h3 style="font-size:10.5pt">First play</h3><p style="font-size:9pt">Her unreleased record, premiered on your floor. Exclusive to the House on the night.</p></div>',
     '<div class=box style="padding:4.5mm"><h3 style="font-size:10.5pt">{{ASK_THIRD_TITLE}}</h3><p style="font-size:9pt">{{ASK_THIRD}}</p></div>'),

    # "not a South African import" is an Amapiano-origin framing that only makes
    # sense to a house built by southern Africans. Parameterised.
    ('<p style="margin-bottom:4mm">DJ Emy is not a South African import, and this kit won&rsquo;t pretend otherwise. She is <b style="color:#fff">the region&rsquo;s own</b> &mdash; a female Afro House and Amapiano DJ who has spent years holding Gulf floors in a market that filed the sound under &ldquo;niche,&rdquo; playing live every set, reading rooms in English and Arabic.</p>',
     '<p style="margin-bottom:4mm">{{IDENTITY}}</p>'),
]

missing = [old for old, _ in subs if old not in html]
if missing:
    for m in missing:
        print("NOT FOUND:", m[:90], file=sys.stderr)
    sys.exit(1)

for old, new in subs:
    html = html.replace(old, new)

# The "unreleased original Amapiano track" is a real, single asset — it can only
# be promised as a first play to ONE room. Kept as a flag, not a placeholder,
# so it is never silently offered to two venues at once.
html = html.replace(
    '<div class=box style="border-color:rgba(201,162,74,.45)">\n      <h3>The part that matters most</h3>',
    '{{PREMIERE_OPEN}}\n      <h3>The part that matters most</h3>')

# Chrome takes a PDF's Title metadata from <title>. The source kit has none, so
# every rendered kit was titled after its source file — a booker who downloaded
# it saw "kit.html" in their PDF reader.
if "<title>" not in html:
    html = ('<meta charset="utf-8">\n'
            '<title>DJ Emy — Press Kit — prepared for {{TARGET}}</title>\n') + html

OUT.write_text(html, encoding="utf-8")
print(f"template written: {OUT}  ({len(html):,} bytes)")
print("placeholders:", sorted(set(re.findall(r"\{\{[A-Z_0-9]+\}\}", html))))
