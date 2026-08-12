#!/usr/bin/env python3
"""
Rewrites the <head> of every page: titles, meta, Open Graph, Twitter cards and
JSON-LD structured data. Single source of truth — edit here and re-run:

    python3 tools/seo.py

To move to a different domain, change SITE below and re-run.

Deliberately NOT emitted: aggregateRating / Review schema. The testimonials on
the site are placeholders, and marking invented reviews up as real is both
deceptive and a Google structured-data violation that can get a site penalised.
Add it only once the quotes are genuine.
"""
import json
import pathlib
import re
import datetime

SITE = 'https://www.neatneven.com'          # ← change to move domains
PHONE = '+233551473359'
IG = 'https://www.instagram.com/neat_n_even_'
TT = 'https://www.tiktok.com/@neat_n_even_'
TODAY = datetime.date.today().isoformat()

ORG_ID = f'{SITE}/#business'
PERSON_ID = f'{SITE}/#janet'

# ---------------------------------------------------------------- shared nodes
BUSINESS = {
    "@type": ["BeautySalon", "HealthAndBeautyBusiness"],
    "@id": ORG_ID,
    "name": "Neat'n'Even Beauty Clinic",
    "alternateName": ["Neat n Even", "NeatnEven", "Neat and Even",
                      "Neat'n'Even", "Neat n Even Beauty Clinic"],
    "url": SITE + '/',
    "logo": {"@type": "ImageObject", "url": f'{SITE}/assets/img/brand/logo.png'},
    "image": f'{SITE}/assets/img/brand/ceo.webp',
    "description": ("Ghanaian beauty brand specialising in professional makeup artistry for brides, "
                    "special occasions, photoshoots, artistes and media personalities."),
    "telephone": PHONE,
    "email": "ayisijanet5@gmail.com",
    "priceRange": "GHS 350 - GHS 4000",
    "currenciesAccepted": "GHS",
    "paymentAccepted": "Mobile Money, Bank Transfer, Cash",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Accra",
        "addressRegion": "Greater Accra",
        "addressCountry": "GH"
    },
    "areaServed": [
        {"@type": "City", "name": "Accra"},
        {"@type": "Country", "name": "Ghana"},
        {"@type": "Place", "name": "International"}
    ],
    "founder": {"@id": PERSON_ID},
    "sameAs": [IG, TT],
    "knowsLanguage": "en",
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Makeup services",
        "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Bridal Makeup — White Wedding"},
             "priceCurrency": "GHS", "priceSpecification": {
                 "@type": "PriceSpecification", "minPrice": 2000, "maxPrice": 4000, "priceCurrency": "GHS"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Engagement / Traditional Marriage Makeup"},
             "priceCurrency": "GHS", "priceSpecification": {
                 "@type": "PriceSpecification", "minPrice": 2000, "maxPrice": 3000, "priceCurrency": "GHS"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Civil Wedding Makeup"},
             "priceCurrency": "GHS", "price": 2500},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Bridal Trial"},
             "priceCurrency": "GHS", "price": 600},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Walk-in Glam"},
             "priceCurrency": "GHS", "priceSpecification": {
                 "@type": "PriceSpecification", "minPrice": 350, "maxPrice": 500, "priceCurrency": "GHS"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Home Service Glam"},
             "priceCurrency": "GHS", "priceSpecification": {
                 "@type": "PriceSpecification", "minPrice": 600, "maxPrice": 800, "priceCurrency": "GHS"}},
        ]
    }
}

WEBSITE = {
    "@type": "WebSite",
    "@id": f'{SITE}/#website',
    "url": SITE + '/',
    "name": "Neat'n'Even Beauty Clinic",
    "alternateName": ["Neat'n'Even", "NeatnEven", "Neat n Even"],
    "inLanguage": "en",
    "publisher": {"@id": ORG_ID}
}

PERSON = {
    "@type": "Person",
    "@id": PERSON_ID,
    "name": "Janet Ayisi",
    "jobTitle": "Founder & CEO",
    "worksFor": {"@id": ORG_ID},
    "image": f'{SITE}/assets/img/brand/ceo.webp',
    "description": ("Ghanaian professional makeup artist, cosmetologist and beauty entrepreneur; "
                    "founder of Neat'n'Even Beauty Clinic."),
    "knowsAbout": ["Bridal makeup", "Editorial makeup", "Artiste and media makeup",
                   "Cosmetology", "Makeup education"],
    "sameAs": [IG, TT]
}

def breadcrumbs(trail):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n,
             "item": SITE + u} for i, (n, u) in enumerate(trail)
        ]
    }

def faq(pairs):
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in pairs
        ]
    }

SERVICES_FAQ = [
    ("Do you travel outside Accra?",
     "Yes. We take bookings across Ghana and internationally. Travel, accommodation and early call "
     "times are quoted on top of the service rate, and always put in writing before you commit."),
    ("How far in advance should I book a makeup artist?",
     "For weddings, as early as you can — peak wedding months fill first. For sessions and shoots a "
     "week or two is usually comfortable, and short-notice bookings can often be accommodated."),
    ("Do you offer a bridal trial?",
     "Yes, and we recommend it. A trial tests the look in daylight and on camera, adjusts the finish "
     "for your skin, and locks in exactly what happens on the wedding morning. A bridal trial is GHS 600."),
    ("What if I have sensitive or acne-prone skin?",
     "Skin preparation is adjusted to your type, and we can work with non-comedogenic and "
     "fragrance-free products. Known allergies are patch tested in advance."),
    ("Do you do makeup for darker skin tones?",
     "Always. Foundation matching across the full range of deep and rich skin tones is core to how we "
     "work — no grey cast, no ashy finish and no mask line at the jaw."),
    ("How much does bridal makeup cost in Accra?",
     "White wedding makeup is GHS 2,000–4,000, engagement and traditional marriage GHS 2,000–3,000, "
     "civil wedding GHS 2,500, civil wedding with reception GHS 3,000–3,500 and reception only GHS 800. "
     "A bridal trial is GHS 600."),
    ("How do I secure my date?",
     "A GHS 100 booking deposit confirms the appointment and is deducted from your total on the day. "
     "Until it is received the date stays open to other enquiries."),
]

ACADEMY_FAQ = [
    ("Do I need my own makeup kit to attend the class?",
     "Not to attend. Products are provided for the practical sessions, and we talk through what to buy "
     "first when building your own kit."),
    ("Do I need a model for the makeup class?",
     "Depending on the cohort, students either pair up to practise on each other or work with a "
     "provided model. This is confirmed before the day."),
    ("How much is the makeup class in Accra?",
     "Registration for the Makeup & Sip class is GHS 800. It runs over two days from 9:00am at El Beth "
     "Academy, Haatso."),
    ("Can you run a private or group makeup class?",
     "Yes. Private one-to-one sessions and closed group bookings can be arranged around your schedule."),
]

# ---------------------------------------------------------------- per page
PAGES = {
    'index.html': dict(
        path='/',
        title="Bridal & Glam Makeup Artist in Accra, Ghana | Neat'n'Even",
        desc=("Professional makeup artist in Accra — bridal, soft and full glam, editorial and "
              "artiste makeup. Glam from GHS 350, bridal from GHS 2,000. Call 055 147 3359."),
        og_image='/assets/img/brand/ceo.webp',
        og_type='website',
        extra=[BUSINESS, WEBSITE, PERSON],
        trail=None),

    'about/index.html': dict(
        path='/about/',
        title="Janet Ayisi — Makeup Artist in Accra | Neat'n'Even",
        desc=("Meet Janet Ayisi, Ghanaian makeup artist, cosmetologist and founder of Neat'n'Even "
              "Beauty Clinic, Accra — bridal, editorial and artiste makeup."),
        og_image='/assets/img/brand/ceo.webp',
        og_type='profile',
        extra=[PERSON],
        trail=[('Home', '/'), ('About', '/about/')]),

    'services/index.html': dict(
        path='/services/',
        title="Bridal Makeup Prices in Accra, Ghana | Neat'n'Even",
        desc=("Makeup prices in Accra: white wedding GHS 2,000–4,000, civil wedding GHS 2,500, "
              "bridal trial GHS 600, walk-in glam GHS 350–500, home service GHS 600–800."),
        og_image='/assets/img/gallery/bridal/bridal-02.webp',
        og_type='website',
        extra=[faq(SERVICES_FAQ)],
        trail=[('Home', '/'), ('Services', '/services/')]),

    'gallery/index.html': dict(
        path='/gallery/',
        title="Makeup Portfolio — Bridal & Glam, Accra | Neat'n'Even",
        desc=("52 makeup looks from Accra — bridal, pre-wedding, bridesmaids, soft glam, full glam, "
              "birthday glam, avant garde and photoshoot work."),
        og_image='/assets/img/gallery/bridal/bridal-02.webp',
        og_type='website',
        extra=[{"@type": "ImageGallery", "name": "Neat'n'Even makeup portfolio",
                "description": "Bridal, glam, editorial and artiste makeup by Neat'n'Even Beauty Clinic, Accra.",
                "isPartOf": {"@id": ORG_ID}}],
        trail=[('Home', '/'), ('Portfolio', '/gallery/')]),

    'academy/index.html': dict(
        path='/academy/',
        title="Makeup Classes in Accra — Makeup & Sip | Neat'n'Even",
        desc=("Learn professional makeup in Accra. 11 modules from skin prep to client etiquette. "
              "GHS 800 registration, taught by Janet Ayisi at El Beth Academy, Haatso."),
        og_image='/assets/img/brand/ceo.webp',
        og_type='website',
        extra=[
            {"@type": "Course",
             "name": "Makeup & Sip Class",
             "description": ("Hands-on professional makeup class covering skin preparation, foundation "
                             "matching, base application, brows, eyeshadow blending, contour, lashes, "
                             "lips, finishing, client etiquette and content creation."),
             "provider": {"@id": ORG_ID},
             "inLanguage": "en",
             "offers": {"@type": "Offer", "price": 800, "priceCurrency": "GHS",
                        "category": "Registration",
                        "availability": "https://schema.org/InStock"},
             "hasCourseInstance": {
                 "@type": "CourseInstance",
                 "courseMode": "onsite",
                 "courseWorkload": "P2D",
                 "location": {"@type": "Place", "name": "El Beth Academy, Haatso",
                              "address": {"@type": "PostalAddress", "addressLocality": "Accra",
                                          "addressRegion": "Greater Accra", "addressCountry": "GH"}}}},
            faq(ACADEMY_FAQ)],
        trail=[('Home', '/'), ('Academy', '/academy/')]),

    'contact/index.html': dict(
        path='/contact/',
        title="Book a Makeup Artist in Accra | Neat'n'Even",
        desc=("Book makeup in Accra by form or WhatsApp — 055 147 3359. A GHS 100 deposit confirms "
              "your appointment. MTN Mobile Money and Stanbic Bank accepted."),
        og_image='/assets/img/brand/ceo.webp',
        og_type='website',
        extra=[{"@type": "ContactPage", "isPartOf": {"@id": ORG_ID}}],
        trail=[('Home', '/'), ('Contact', '/contact/')]),
}


def build_head(rel, cfg):
    depth = '' if rel == 'index.html' else '../'
    url = SITE + cfg['path']
    graph = [n for n in cfg['extra']]
    if cfg['trail']:
        graph.append(breadcrumbs(cfg['trail']))
    ld = {"@context": "https://schema.org", "@graph": graph}

    lines = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{cfg["title"]}</title>',
        f'<meta name="description" content="{cfg["desc"]}">',
        f'<link rel="canonical" href="{url}">',
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        '<meta name="author" content="Neat\'n\'Even Beauty Clinic">',
        '<meta name="geo.region" content="GH-AA">',
        '<meta name="geo.placename" content="Accra">',
        '',
        f'<meta property="og:type" content="{cfg["og_type"]}">',
        f'<meta property="og:site_name" content="Neat\'n\'Even Beauty Clinic">',
        f'<meta property="og:locale" content="en_GH">',
        f'<meta property="og:title" content="{cfg["title"]}">',
        f'<meta property="og:description" content="{cfg["desc"]}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{SITE}{cfg["og_image"]}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="1500">',
        f'<meta property="og:image:alt" content="Makeup by Neat\'n\'Even Beauty Clinic, Accra">',
        '',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{cfg["title"]}">',
        f'<meta name="twitter:description" content="{cfg["desc"]}">',
        f'<meta name="twitter:image" content="{SITE}{cfg["og_image"]}">',
        '',
        '<meta name="theme-color" content="#16110F">',
        f'<link rel="icon" href="{depth}assets/img/brand/mark.png" type="image/png">',
        f'<link rel="apple-touch-icon" href="{depth}assets/img/brand/mark.png">',
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;'
        '0,6..96,500;0,6..96,600;1,6..96,400;1,6..96,500&family=Manrope:wght@300;400;500;600;700;800'
        '&family=Parisienne&display=swap" rel="stylesheet">',
        "<script>document.documentElement.classList.add('js');</script>",
        f'<link rel="stylesheet" href="{depth}css/styles.css">',
    ]
    if rel == 'index.html':
        # the hero cut-out is the LCP element on the home page
        lines.append('<link rel="preload" as="image" href="assets/img/brand/hero-cutout.webp" '
                     'fetchpriority="high">')
    lines += ['<script type="application/ld+json">',
              json.dumps(ld, indent=2, ensure_ascii=False),
              '</script>']
    return '\n'.join(lines)


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    for rel, cfg in PAGES.items():
        f = root / rel
        t = f.read_text()
        head = build_head(rel, cfg)
        new, n = re.subn(r'<head>.*?</head>', '<head>\n' + head + '\n</head>', t, count=1, flags=re.S)
        if n == 0:
            print(f'!! FAILED — no <head> block found in {rel}')
            continue
        # unchanged is the normal case on a re-run; only a non-match is a problem
        state = 'unchanged' if new == t else 'updated  '
        f.write_text(new)
        print(f'{state} {rel:24} {cfg["title"][:48]}')

    # sitemap
    urls = [(cfg['path'], p) for p, cfg in
            [(v['path'], v) for v in PAGES.values()]]
    prio = {'/': '1.0', '/services/': '0.9', '/gallery/': '0.8',
            '/about/': '0.8', '/contact/': '0.8', '/academy/': '0.7'}
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for cfg in PAGES.values():
        p = cfg['path']
        xml += ['  <url>', f'    <loc>{SITE}{p}</loc>',
                f'    <lastmod>{TODAY}</lastmod>',
                f'    <changefreq>{"weekly" if p in ("/", "/gallery/") else "monthly"}</changefreq>',
                f'    <priority>{prio.get(p, "0.7")}</priority>', '  </url>']
    xml.append('</urlset>')
    (root / 'sitemap.xml').write_text('\n'.join(xml) + '\n')
    (root / 'robots.txt').write_text(
        'User-agent: *\nAllow: /\n\n'
        'Disallow: /thank-you/\n\n'
        f'Sitemap: {SITE}/sitemap.xml\n')
    print(f'✓ sitemap.xml + robots.txt for {SITE}')


if __name__ == '__main__':
    main()
