#!/usr/bin/env python3
"""
Pre-renders the portfolio grid into gallery/index.html.

The grid used to be built entirely in JavaScript, which meant the page shipped
an empty <div> to crawlers: 170 words and none of the 52 photographs. Google can
execute JS, but it is slower and far less reliable for image indexing — and the
portfolio is the strongest asset on the site.

This writes the chips and tiles straight into the HTML between marker comments.
js/main.js detects the existing markup and skips building, so filtering and the
lightbox still work exactly as before.

    python3 tools/gallery.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / 'gallery' / 'index.html'
DATA = ROOT / 'js' / 'gallery-data.js'

# Written for humans and for search: each says what the look actually is.
BLURB = {
    'bridal':        'Wedding-day bridal makeup — long-wear, photography-tested finishes for white weddings, traditional ceremonies and civil services in Accra.',
    'pre-wedding':   'Engagement portraits, pre-wedding shoots and save-the-date sessions, styled for the camera.',
    'bridesmaids':   'Bridal party and bridesmaids makeup, coordinated to complement the bride without competing.',
    'soft-glam':     'Soft glam — clean skin, a defined eye and a natural lip for church, corporate portraits and dinners.',
    'full-glam':     'Full glam — sculpted contour, dramatic eyes and lashes, built to last a long night.',
    'birthday-glam': 'Birthday and celebration glam, designed around your outfit and theme.',
    'avant-garde':   'Avant garde and editorial concepts — sculptural, colour-forward work made for the lens.',
    'photoshoot':    'Studio, campaign and artiste makeup for photographers, brands and media personalities.',
}

ALT = {
    'bridal':        'Bridal makeup look {n}',
    'pre-wedding':   'Pre-wedding shoot makeup look {n}',
    'bridesmaids':   'Bridesmaids makeup look {n}',
    'soft-glam':     'Soft glam makeup look {n}',
    'full-glam':     'Full glam makeup look {n}',
    'birthday-glam': 'Birthday glam makeup look {n}',
    'avant-garde':   'Avant garde editorial makeup look {n}',
    'photoshoot':    'Photoshoot makeup look {n}',
}

START_CHIPS, END_CHIPS = '<!-- CHIPS:START -->', '<!-- CHIPS:END -->'
START_GRID, END_GRID = '<!-- GRID:START -->', '<!-- GRID:END -->'
START_TEXT, END_TEXT = '<!-- CATTEXT:START -->', '<!-- CATTEXT:END -->'


def load():
    m = re.search(r'=\s*(\[.*\]);', DATA.read_text(), re.S)
    return json.loads(m.group(1))


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def build(data):
    flat = []
    for cat in data:
        for item in cat['items']:
            flat.append((cat['slug'], cat['label'], item))

    chips = [f'<button class="filter-chip" type="button" data-filter="all" aria-pressed="true">'
             f'All looks<span class="count">{len(flat)}</span></button>']
    for cat in data:
        chips.append(
            f'<button class="filter-chip" type="button" data-filter="{cat["slug"]}" '
            f'aria-pressed="false">{esc(cat["label"])}'
            f'<span class="count">{len(cat["items"])}</span></button>')

    tiles = []
    per_cat = {}
    for i, (slug, label, it) in enumerate(flat):
        per_cat[slug] = per_cat.get(slug, 0) + 1
        n = per_cat[slug]
        alt = ALT.get(slug, label + ' makeup look {n}').format(n=n)
        alt = f'{alt} by Neat&rsquo;n&rsquo;Even Beauty Clinic, Accra'
        tiles.append(
            f'<button class="masonry-item" type="button" data-index="{i}" data-slug="{slug}" '
            f'aria-label="View {esc(label)} look {n} full size">'
            f'<img src="../{it["thumb"]}" alt="{alt}" width="{it["tw"]}" height="{it["th"]}" '
            f'loading="lazy" decoding="async">'
            f'<span class="masonry-item__label">{esc(label)}</span>'
            f'</button>')

    # a short, real paragraph per category — crawlable context the page had none of
    text = ['<div class="container container--narrow" style="margin-top:clamp(2.5rem,5vw,4rem)">',
            '<h2 class="visually-hidden">Makeup categories in this portfolio</h2>',
            '<dl class="cat-notes">']
    for cat in data:
        b = BLURB.get(cat['slug'], '')
        text.append(f'<div><dt>{esc(cat["label"])} '
                    f'<span>({len(cat["items"])})</span></dt><dd>{esc(b)}</dd></div>')
    text += ['</dl>', '</div>']

    return '\n        '.join(chips), '\n        '.join(tiles), '\n      '.join(text)


def replace_block(t, start, end, payload):
    pat = re.compile(re.escape(start) + r'.*?' + re.escape(end), re.S)
    if not pat.search(t):
        raise SystemExit(f'marker {start} not found in {PAGE}')
    return pat.sub(f'{start}\n        {payload}\n        {end}', t, count=1)


def main():
    data = load()
    chips, tiles, text = build(data)
    t = PAGE.read_text()
    t = replace_block(t, START_CHIPS, END_CHIPS, chips)
    t = replace_block(t, START_GRID, END_GRID, tiles)
    t = replace_block(t, START_TEXT, END_TEXT, text)
    PAGE.write_text(t)
    total = sum(len(c['items']) for c in data)
    print(f'pre-rendered {total} tiles and {len(data) + 1} filter chips into {PAGE.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
