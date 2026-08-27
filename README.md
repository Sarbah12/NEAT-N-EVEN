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

### 1. Email delivery — Resend (needs an API key from you)

Booking enquiries go to **ayisijanet5@gmail.com** through `api/book.js`, a Vercel
serverless function that sends via [Resend](https://resend.com).

**The API key is a secret. It must never go in this repo or in any file the
browser downloads** — a key in client-side JavaScript can be read from
view-source by anyone and used to send mail as you. It lives only in Vercel's
environment variables.

**Setup:**

1. Create a free Resend account at https://resend.com using **ayisijanet5@gmail.com**.
2. **API Keys → Create API Key** (sending permission is enough). Copy the
   `re_...` value — Resend shows it once.
3. In Vercel: your project → **Settings → Environment Variables** → add

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the `re_...` key |

4. **Redeploy** (Deployments → ⋯ → Redeploy). Environment variables only apply
   to builds made after they are added.

That is enough to start. Resend's shared sender is used by default, and it can
deliver to the address that owns the Resend account — which is exactly where
these enquiries go.

**Optional, for a branded sender:** verify `neatneven.com` in Resend
(**Domains → Add Domain**), add the DNS records it gives you at name.com, then
set a second variable:

| Name | Value |
| --- | --- |
| `RESEND_FROM` | `Neat'n'Even <bookings@neatneven.com>` |

`BOOKING_TO` can also be set if enquiries should go somewhere other than
ayisijanet5@gmail.com.

**Behaviour:** hitting *Reply* in the inbox answers the client directly. The form
works without JavaScript too — `api/book.js` accepts a plain form POST and
redirects to `/thank-you/`. Until the key is set the form does not pretend to
send: it shows the WhatsApp fallback and keeps what the client typed.

**The WhatsApp button needs no setup and works today.**

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
