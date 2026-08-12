# Neat'n'Even Beauty Clinic — website

Static website. Plain HTML, CSS and JavaScript — no build step, no dependencies.
Open `index.html` in a browser, or upload the whole `site/` folder to any host.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, brand intro, 8 services, portfolio strip, academy teaser, testimonials |
| `about.html` | Brand story, the promise, Janet Ayisi profile, how we work |
| `services.html` | 8 services in detail, pricing packages, booking process, FAQ |
| `gallery.html` | 52-image portfolio, filterable by category, with lightbox |
| `academy.html` | Makeup & Sip class — curriculum, who it's for, tutor, FAQ |
| `contact.html` | Booking form (email + WhatsApp), contact details |

Supporting files: `css/styles.css`, `js/main.js`, `js/gallery-data.js`,
`assets/img/`, `robots.txt`, `sitemap.xml`.

## Things you need to fill in

### 1. Email delivery — ONE ACTION NEEDED FROM YOU

Booking enquiries are wired to **ayisijanet5@gmail.com** via FormSubmit, which
needs no account.

**Before it works, the address has to be confirmed once:**

1. Open the live site's Contact page and send yourself a test enquiry.
2. FormSubmit emails ayisijanet5@gmail.com an activation link. Open it and
   confirm. (Check spam if it isn't there.)
3. From then on every booking lands in that inbox, and hitting *Reply* goes
   straight back to the client.

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

### 3. Testimonials

The three quotes on `index.html` are placeholder text, marked with a
`PLACEHOLDER COPY` comment. Replace the quote, the name and the role with real
client reviews.

### 4. Academy cohort dates

`academy.html` shows "Next cohort — dates on request", since the July dates on
the original flyer have passed. The fee (GH₵800), format (two days from 9am) and
venue (El Beth Academy, Haatso) are live. Swap in real dates when you set them.

### 5. Your domain

Six files reference `https://neatneven.com` in their `<link rel="canonical">`,
Open Graph tags, `robots.txt` and `sitemap.xml`. Find and replace that with your
real domain once you have one.

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
