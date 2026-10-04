# Angel Bulldogs

A static website for **Angel Bulldogs**, a small family-guided French Bulldog program in Chicago. Built with Astro, strict TypeScript, semantic HTML, and custom CSS. Hosted on Cloudflare Pages. Form delivery uses public Formspree and Brevo endpoints (no site backend). Payments stay off the public site.

## Local development

Use **Node.js 22.12+** (see `.nvmrc`). npm only.

```sh
nvm use
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local server, usually `http://localhost:4321` |
| `npm run check` | Astro + TypeScript check |
| `npm test` | Color Lab genetics unit tests (Node) |
| `npm run color-lab:manifest` | Regenerate the Color Lab visual manifest |
| `npm run color-lab:phenotypes` | Export deduplicated visible-signature phenotype rows for the image pipeline |
| `npm run build` | Type-check, then write static files to `dist/` |
| `npm run preview` | Serve the production build locally |

The site is static HTML/CSS/JS and can later be deployed to Cloudflare Pages. Do not deploy, connect a domain, or push to GitHub unless explicitly asked.

## Project structure

```text
src/
  config/site.ts          Public site settings (email, domain, hero media)
  data/puppies.ts         Puppy records and availability
  data/parents.ts         Bella and sire records
  data/faqs.ts            FAQ copy
  data/color-lab/         Locus catalog, presets, names, sources, visual registry
  lib/color-lab/          Resolver, naming, inheritance, visuals, storage, migration
  components/             Shared UI
  components/color-lab/   Frenchie Color Lab UI
  layouts/BaseLayout.astro
  pages/                  Public routes
  scripts/                Minimal vanilla TypeScript for nav, cards, forms
  scripts/color-lab/      Color Lab client behavior
  styles/global.css       Design tokens and layout
  styles/color-lab.css    Color Lab layout
public/placeholders/      Local SVG composition placeholders
public/images/color-lab/  Color Lab placeholder and future approved layers
frenchie-color-lab-image-library/  Color Lab manifest and retired v1 archive (not served)
```

## Routes

- `/` Home
- `/puppies` Available Puppies
- `/color-lab` Frenchie Color Lab
- `/bella` Meet Bella
- `/application` Puppy Application
- `/faq` Frequently Asked Questions
- `/contact` Contact
- Custom `404` page

Main navigation is those pages. Do not add Pricing, Shop, Blog, or Stud Services as top-level nav.

## How to edit content

### Replace placeholder puppies

1. Open `src/data/puppies.ts`.
2. The seeded Maple, Juniper, and Pebble records are **layout placeholders**. Replace or delete them.
3. Do not list a real puppy as available unless the owner confirms it.

### Mark a puppy available or unavailable

On each record:

- Available: `available: true` and `status: "available"`
- Hidden from the public grid: `available: false` and `status: "unavailable"`

If zero puppies are available, `/puppies` and the homepage preview automatically show the empty state.

### Change puppy photos

Replace files in `public/placeholders/` (or add real images under `public/media/`) and update `primaryImage` and `gallery` on the puppy record. Keep `width` and `height` accurate. Use the Astro image tools when real local photographs are added.

### Add a puppy video

Set `video` on the puppy record to a local file path, width, height, and alt text. Leave `video: null` until the file exists. Do not reference a missing file.

### Update Bella

Edit the `bella` object in `src/data/parents.ts`. Only fill fields that are verified. Leave unknown facts `null` and keep the TODOs.

### Add the sire’s verified information

Edit the `sire` object in `src/data/parents.ts`. The public label stays **The Sire** until `name` is set. Do not invent coat, DNA, registration, titles, or health details.

### Set the public email and future domain

In `src/config/site.ts`:

- `email` — leave empty until verified. An empty value shows an on-page development notice instead of a fake address.
- `domain` — hostname only, no protocol. Canonical URLs stay off until this is set.
- Then set `site` in `astro.config.mjs` to the verified origin.

### Replace the hero poster / video

- Poster: `siteConfig.heroPoster` (default `/placeholders/hero-bella-poster.svg`)
- Video: set `siteConfig.heroVideo` only when the file is in `public/`. Recommended: muted H.264, about 1600×900 or 1920×1080, no audio track, keep the file small (aim under ~4 MB).
- If `heroVideo` is `null`, the poster is used. Small screens, `prefers-reduced-motion`, and Save-Data still prefer the poster.

### Connect form delivery

Set these **public** build-time env vars (local `.env` and Cloudflare Pages → Environment variables):

| Variable | Service | Used by |
| --- | --- | --- |
| `PUBLIC_FORMSPREE_APPLICATION_ENDPOINT` | Formspree | `/application` |
| `PUBLIC_FORMSPREE_CONTACT_ENDPOINT` | Formspree | `/contact` |
| `PUBLIC_FORMSPREE_COLOR_LAB_ENDPOINT` | Formspree | Color Lab interest (when Color Lab is on) |
| `PUBLIC_BREVO_NEWSLETTER_ENDPOINT` | Brevo Simple HTML form action | Footer newsletter |

See `.env.example`. Formspree URLs must look like `https://formspree.io/f/…`. Brevo URLs must be a `sibforms.com/serve/…` action URL.

With `siteConfig.prototypeMode` set to `false` and valid endpoints present, forms POST for real and show success only after a successful response. Missing endpoints fall back to an honest “not connected” notice — never a fake success.

### Color Lab

The Frenchie Color Lab lives at `/color-lab` with two tabs: **Build a Frenchie** and **Breeding Calculator**. It is the simplified v2 model (ruleset 2.0.0):

- One `<select>` per gene with complete genotype pairs, in three sections (Color, Patterns, Coat & Rare Traits). Every gene starts filled in with the Masked Classic Fawn baseline, which resolves to **Fawn Solid**. There is no unknown state and no Guided/Advanced mode.
- Twelve genetic loci plus Big Rope, which is a visual preference only and never enters litter math.
- One data catalog (`src/data/color-lab/loci.ts`) feeds Build, Stud, Dam, the resolver, inheritance, and migration. Names are built from structured tokens (`src/lib/color-lab/naming.ts`), never from control order.
- DNA is **Assumed** unless the visitor checks the lab-report box for that dog. Any gene edit or preset clears it.
- Saved dogs stay in the browser (`angel-bulldogs.color-lab.v2`). Old v1 records migrate once, silently.

Lilac, Isabella, New Shade Rojo, New Shade Isabella, Platinum, and Big Rope are breeder-facing names over the DNA shown, not laboratory nomenclature.

Do not restore Guided/Advanced, Curl, Furnishings, lab sub-variant pickers, manual eyes, manual shades, or Brindle density. The retired v1 source is archived in `frenchie-color-lab-image-library/archive/excluded-color-lab-assets-v1/`.

**Images.** No puppy images are in the repository yet, so every visual shows the branded "Image coming soon" placeholder. Approved layers or composites are registered in `src/data/color-lab/visualRegistry.ts`. See `frenchie-color-lab-image-library/README.md`, and run `npm run color-lab:manifest` after changes.

**Interest delivery.** Set `PUBLIC_FORMSPREE_COLOR_LAB_ENDPOINT` to a real `https://formspree.io/f/…` URL at build time. Anything else is treated as not configured. Nothing is sent while the endpoint is missing or `siteConfig.prototypeMode` is `true`, and the drawer never shows success without a real `response.ok`.

## Integration boundaries

- **Application and contact** — Formspree via `PUBLIC_FORMSPREE_APPLICATION_ENDPOINT` / `PUBLIC_FORMSPREE_CONTACT_ENDPOINT`. Shared client logic in `src/scripts/prototype-form.ts` and `src/lib/formDelivery.ts`.
- **Newsletter** — footer only, Brevo via `PUBLIC_BREVO_NEWSLETTER_ENDPOINT`. Do not auto-subscribe anyone from the application or contact form.
- **Color Lab interest** — `PUBLIC_FORMSPREE_COLOR_LAB_ENDPOINT`. Sends only when the URL is valid **and** `prototypeMode` is `false`.
- **Payments** — stay off the public site. No cart, deposit button, or instant checkout. Paperwork and payment are coordinated privately after approval.

## Claim and content rules

Do not add AKC, OFA, CHIC, “health cleared,” champion bloodlines, licenses, veterinary credentials, delivery prices, or health guarantees unless the owner supplies proof and wording. DNA-confirmed parentage is not a comprehensive health claim. Public location is **Chicago, Illinois** only.

## Accessibility and motion

Target WCAG 2.2 AA. Keyboard-visible focus, skip link, labels on every field, and reduced-motion support are required. Puppy details expand inline; they are not hover-only.

## Cloudflare

`npm run build` emits static files in `dist/` suitable for Cloudflare Pages. Do not add Workers, Turnstile, or other Cloudflare functions unless explicitly approved.
