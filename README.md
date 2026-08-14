# Neat'n'Even Beauty Clinic — website

Static website. Plain HTML, CSS and JavaScript — no build step, no dependencies.
Open `index.html` in a browser, or upload the whole `site/` folder to any host.

## Pages

URLs carry no `.html` — each page is a directory with an `index.html` inside,
which works on any static host without rewrite rules.

| URL | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Home — hero, brand intro, 8 services, portfolio, testimonials |
| `/about/` | `about/index.html` | Brand story, the promise, Janet Ayisi cover feature |
| `/services/` | `services/index.html` | 8 services, bridal + glam rates, process, FAQ |
| `/gallery/` | `gallery/index.html` | 52-image portfolio, filterable, with lightbox |
| `/academy/` | `academy/index.html` | Makeup & Sip class |
| `/contact/` | `contact/index.html` | Booking form, payment details, booking terms |

Pages inside a directory carry `data-base="../"` on `<body>`; `js/main.js` uses
it to resolve the gallery image paths back to the site root.

Supporting files: `css/styles.css`, `js/main.js`, `js/gallery-data.js`,
`assets/img/`, `robots.txt`, `sitemap.xml`.

## Things you need to fill in

### 1. Email delivery — ONE ACTION NEEDED FROM YOU

Booking enquiries are wired to **ayisijanet5@gmail.com** via FormSubmit, which
needs no account.

**FormSubmit activates per domain, not just per email address.** An activation
done from localhost does NOT activate the live site — each origin triggers its
own confirmation. Always activate from the real domain:

1. Submit one test enquiry from **https://www.neatneven.com/contact/** — not
   from localhost and not from a file:// page.
2. Open **ayisijanet5@gmail.com** and find the mail from FormSubmit. Check that
   it says **Form at: https://www.neatneven.com/...** before clicking.
3. **Check Spam and the Promotions tab** — it very often lands there.
4. Click **Activate Form**.
5. From then on every booking lands in that inbox, and hitting *Reply* goes
   straight back to the client.

Until that link is clicked, FormSubmit accepts the request but delivers
nothing. The form correctly tells visitors to use WhatsApp instead while that
is the case — it does not claim the booking was sent.

**Then do this second step**, in `js/main.js`:

After activating, FormSubmit sends you a random alias endpoint like
`https://formsubmit.co/ajax/a1b2c3d4e5`. Paste it over `formEndpoint`. It
behaves identically but keeps the Gmail address out of the page source, where
spam bots would otherwise harvest it.

```js
var CONFIG = {
  whatsapp: '233551473359',
  notifyEmail: 'ayisijanet5@gmail.com',
  formEndpoint: 'https://formsubmit.co/ajax/ayisijanet5@gmail.com'  // <- swap for the alias
};
```

**The WhatsApp button works right now** with no setup — it opens a chat to
055 147 3359 with all the form details filled in.

### 2. Prices — bridal is done, two packages still open

The **Bridal Packages** rate card on `services.html` carries your real rates
(White Wedding, Engagement/Traditional, Civil, Civil + Reception, Reception
Only, Trial). Edit those in the `.rate-list` markup.

Two of the three summary cards still read "On request" — **The Session** and
**The Production**. When you set those rates, find the `PRICING` comment and
replace the amount:

```html
<span class="price-card__amount"><span class="from">From</span> GH&#8373;1,200</span>
```

### 3. Payment logos — Stanbic still needed

The MTN Mobile Money logo is in place at `assets/img/pay/mtn-momo.png`.

**Stanbic is still showing a typographic chip.** To use the real logo, save the
Stanbic Bank artwork to your machine and drop it in as:

```
assets/img/pay/stanbic.png
```

It appears automatically — `js/main.js` only reveals the `<img>` once the file
genuinely loads, so a missing logo shows the chip rather than a broken image.
Once the logo shows you can delete the matching `<span class="pay-chip">`.

Also worth adding: the **registered account name** on the Stanbic account.
Clients usually need it to complete a transfer. There is a `TODO` comment
marking the spot in `contact/index.html`.

### 4. Testimonials

The three quotes on `index.html` are placeholder text, marked with a
`PLACEHOLDER COPY` comment. Replace the quote, the name and the role with real
client reviews.

### 5. Academy cohort dates

`academy.html` shows "Next cohort — dates on request", since the July dates on
the original flyer have passed. The fee (GH₵800), format (two days from 9am) and
venue (El Beth Academy, Haatso) are live. Swap in real dates when you set them.

### 6. Your domain

Six files reference `https://neatneven.com` in their `<link rel="canonical">`,
Open Graph tags, `robots.txt` and `sitemap.xml`. Find and replace that with your
real domain once you have one.

## SEO

All titles, meta descriptions, Open Graph/Twitter tags, JSON-LD structured data,
`sitemap.xml` and `robots.txt` are generated from one file:

```bash
python3 tools/seo.py
```

Edit `tools/seo.py` and re-run — do not hand-edit the `<head>` blocks, they get
overwritten. **To move to a different domain, change `SITE` at the top and
re-run.** That updates every canonical, OG tag, sitemap entry and schema ID.

### Pre-rendering the portfolio

`gallery/index.html` used to ship an empty grid — all 52 photographs were
injected by JavaScript, so crawlers saw 170 words and no images. The grid is now
written into the HTML at build time:

```bash
python3 tools/gallery.py
```

**Re-run this whenever the photo set changes**, after regenerating
`js/gallery-data.js`. It rewrites the filter chips, the 52 tiles (each with
unique descriptive alt text) and the category notes between marker comments.
`js/main.js` detects the existing markup and only wires up filtering and the
lightbox, so behaviour is unchanged.

`tools/seo.py` also emits an image sitemap listing all 52 photographs, which is
what gets the portfolio into Google Images.

Structured data included: LocalBusiness/BeautySalon with the real price list,
Person (Janet), Course (Makeup & Sip, GHS 800), FAQPage on services and academy,
BreadcrumbList and ImageGallery.

**Not included, on purpose: review/rating schema.** Marking up invented reviews
as real breaks Google's guidelines and can get the site penalised. Add it only
once the testimonials are genuine.

## Submitting to Google

The site is live at https://www.neatneven.com/ (Vercel, auto-deploys on push to
`main`). Technically it is fully crawlable — the only thing standing between it
and Google is that the domain is new and has not been crawled yet.

**1. Google Search Console** — https://search.google.com/search-console
   Add property → *URL prefix* → `https://www.neatneven.com`

**2. Verify.** Choose the *HTML tag* method. Google shows a tag like:
   `<meta name="google-site-verification" content="AbCdEf123..." />`
   Copy only the `content` value into `GOOGLE_VERIFY` in `tools/seo.py`, run
   `python3 tools/seo.py`, commit and push. Vercel deploys it in about a minute,
   then press Verify.

**3. Submit the sitemap.** Search Console → *Sitemaps* → enter `sitemap.xml`.

**4. Request indexing.** Search Console → *URL Inspection* → paste
   `https://www.neatneven.com/` → *Request Indexing*. Repeat for `/services/`
   and `/gallery/`.

**5. Google Business Profile** — https://business.google.com
   This matters more than everything above for "makeup artist near me" style
   searches in Accra. It is a separate listing from the website and it is free.

**6. Optional: Bing** — https://www.bing.com/webmasters — same flow, put the
   code in `BING_VERIFY`.

Expect days, not hours. Linking the site from the Instagram and TikTok bios is
the fastest way for Google to discover a brand-new domain.

## Running it locally

```bash
python3 -m http.server 4590 --directory "/Users/sarbahrichmond/Downloads/NEAT N EVEN WEBSITE /site"
```

Then open http://localhost:4590. (Opening `index.html` directly with a
`file://` path also works, but the gallery loads more reliably over a server.)

## Publishing

Drag the `site/` folder onto [netlify.com/drop](https://app.netlify.com/drop),
or use Vercel, Cloudflare Pages or GitHub Pages. There is nothing to build.
Total size is about 8 MB, almost all of it photographs.

## The images

`assets/img/gallery/` holds 52 photos in 8 categories, each exported twice:
a `-thumb` version for the grid and a full-size version for the lightbox — all
WebP. The originals live in `../PICTURES/` and are untouched.

`js/gallery-data.js` is the generated index of those files. If you add or remove
photos you must update that file too — it lists each image's path and dimensions.

Brand assets in `assets/img/brand/`: `logo.png` and `mark.png` (background
removed, transparent), `ceo.webp`, and `hero-cutout.webp` (the cut-out portrait
used in the home hero).
