# Angel Bulldogs QA fix completion report

> **Superseded in part (October 17, 2026 final setup):** Color Lab is no longer footer-only. It must appear in **both the footer and the mobile side menu**, each marked **Coming soon**, linked to `/color-lab/`. See `reports/angel-bulldogs-final-setup-completion.md` for the follow-up that takes precedence on Color Lab, placement statuses, refund policy, public DOB, DNA wording, newsletter DOI, and content structure.

**Prepared:** October 17, 2026 (updated same day after footer/header growth bugfix)  
**Source revision:** `aba78b5` (working tree with uncommitted QA implementation)  
**Release boundary:** local implementation, checks, screenshots, and this report only. **Nothing was committed, pushed, or deployed.**

## Critical regression fixed before release

**Bug:** Sticky header height grew without bound (looked like the page/footer “kept expanding”), because JS wrote measured header height into `--header-h`, and `.header-inner { min-height: var(--header-h) }` fed that measurement back into the header size (ResizeObserver loop).

**Fix:** Introduced `--header-bar-min` for the visual bar; `--header-h` is only used for skip/fragment scroll offsets and must never size the header. Re-verified: page `scrollHeight` and header height stay stable across 14 routes on desktop/phone.

## Visitor-facing outcome

- Each available puppy has a shareable detail page with a compact gallery and inquiry CTA.
- Listing cards link to those pages instead of expanding inline.
- Mobile menu uses a viewport-level drawer/backdrop (outside the blurred sticky header).
- Color Lab was footer-only in this earlier pass (superseded by final setup: footer + mobile menu).
- Public copy matches owner-confirmed care, Serbia birthplace, mentorship, Kiki text-only, and private pricing.
- Newsletter posts to `/api/newsletter` with verified response handling (no iframe/timer success).
- Finished JPEG social image, sitemap, and updated privacy text are in place.

## Owner decisions implemented

| Decision | Status |
| --- | --- |
| Separate puppy detail pages | Implemented (`/puppies/<slug>/`) |
| Keep current lead photographs | Implemented (all `v5-primary.jpg` leads retained) |
| Color Lab footer only | Superseded: footer + mobile menu Coming soon |
| On-site newsletter signup | Implemented; Cloudflare function + setup doc |
| All five puppies available | Already true in data; status wording remains `Available` |
| Litter born in Serbia | Implemented in listing, litter lede, FAQ |
| Short Serbian mentorship note | Implemented; expanded family story removed |
| Bella max three litters | Retained with approved wording |
| Natural-delivery maternal line | Approved restrained wording applied |
| Care/records + KSS pedigree + optional arrangements | Canonical copy in `src/data/content.ts` |
| Support + Europe veterinary contacts | FAQ care/support answers |
| Kiki text-only | Portrait removed; no empty frame |
| No public pickup/readiness date | Not published |

## Conservative defaults / unresolved owner facts

| Topic | Handling |
| --- | --- |
| DNA-confirmed parentage | Removed from trust strip and FAQ; neutral “ask which records are available” |
| Litter DOB / public age | Still private (`dateOfBirth: null`; not shown on cards) |
| Newsletter confirmation mode | Endpoint requires explicit `BREVO_NEWSLETTER_MODE=doi\|direct`; production activation pending |

## Implementation map (main files)

| Area | Files |
| --- | --- |
| Config / nav | `src/config/site.ts`, `src/components/Header.astro`, `src/components/Footer.astro` |
| Drawer / skip / header offset | `src/scripts/mobile-nav.ts`, `src/scripts/skip-link.ts`, `src/layouts/BaseLayout.astro`, `src/styles/global.css` |
| Puppy pages | `src/pages/puppies/[slug].astro`, `src/components/PuppyCard.astro`, `src/scripts/puppy-gallery.ts` |
| Listing hierarchy | `src/pages/puppies.astro`, `src/components/LitterIntro.astro`, `src/components/LitterGallery.astro` |
| Facts / copy | `src/data/content.ts`, `src/data/faqs.ts`, `src/data/parents.ts`, `src/data/litter.ts`, `src/data/puppies.ts` |
| Forms | `src/components/ApplicationForm.astro`, `src/components/ContactForm.astro`, `src/scripts/prototype-form.ts`, `src/lib/formDelivery.ts` |
| Newsletter API | `functions/api/newsletter.ts`, `docs/newsletter-setup.md`, `src/components/NewsletterPrototype.astro` |
| SEO / privacy | `public/sitemap.xml`, `public/robots.txt`, `public/images/og-share.jpg`, `src/pages/privacy.astro` |

## Detail routes

- `/puppies/aspy/`
- `/puppies/chloe/`
- `/puppies/coco/`
- `/puppies/hamilton/`
- `/puppies/romeo/`

Unknown slugs return HTTP **404** (verified against local preview).

## Finding disposition (F01–F18, R01–R08)

| ID | Status | Change / verification | Remaining dependency |
| --- | --- | --- | --- |
| F01 | implemented and verified | Drawer/overlay moved outside filtered header; focus/Escape/outside/close; scroll lock; open/close transition; phone screenshots | Real iPhone/Safari pass pending |
| F02 | implemented and verified | Global `.cluster` flex + gap restored; hero/CTA/FAQ use it | — |
| F03 | implemented and verified | Card actions bottom-aligned via flex stretch; consistent link layout | — |
| F04 | implemented and verified | Expansion removed; detail pages + return `#puppy-<slug>` | — |
| F05 | implemented and verified | No video blocks when `video` is null; internal “add video” hint removed with expansion | — |
| F06 | implemented and verified | Thumbs are `li > button` (no `role=listitem` on buttons); stronger selected/focus styles | — |
| F07 | implemented and verified | `#main` focusable; skip script; `--header-h` via ResizeObserver | — |
| F08 | implemented; owner configuration pending | Iframe/timer path removed; `/api/newsletter` returns honest states | Brevo mode/list/key bindings |
| F09 | implemented and verified | Inquiry/contact use real `action`/`method` when endpoint configured; enhanced handler sets `novalidate` only after init | — |
| F10 | implemented and verified | Hint/error IDs preserved in `aria-describedby`; checkbox errors supported | — |
| F11 | implemented and verified | Contact required asterisks + required-note | — |
| F12 | implemented and verified | Contact lede/inquiry link whitespace fixed | — |
| F13 | implemented and verified | DNA parentage claim removed; categories kept distinct in FAQ | Owner DNA records if stronger claims later |
| F14 | implemented and verified | Serbian placeholder art removed; Kiki text-only; hero uses real photo; OG JPEG | — |
| F15 | implemented; missing original asset / already upright | Current litter `v5-o-*` exports are upright 4:3; no EXIF orientation fix needed. Empty baked padding not re-exported from unpadded originals (none found beyond current v5 set) | Unpadded masters if further crop refinement desired |
| F16 | implemented and verified | Coco lead alt corrected to side-facing pose | — |
| F17 | implemented and verified | Newsletter feedback row separate from input/button row | — |
| F18 | implemented and verified | Public em dash sweep on main site pages/forms/gallery alts; Color Lab internal tool strings may still contain scientific/source dashes | Optional Color Lab-wide punctuation pass when tool relaunches |
| R01 | implemented and verified | Cards above extended litter gallery | — |
| R02 | implemented and verified | Inquiry `form-narrow`; Contact `contact-align`; Privacy measure column | — |
| R03 | implemented and verified | Color Lab removed from primary nav/drawer; kept in footer + route | — |
| R04 | implemented and verified | Mentorship / care / support wording from owner facts | — |
| R05 | content held pending owner facts | DOB publication not enabled | Owner DOB + publish permission |
| R06 | implemented and verified | Lead retained; contain fit; thumbs compact; restrained reveals | Responsive derivative pipeline not newly added (existing JPGs) |
| R07 | implemented and verified | Unique detail metadata; OG JPEG; sitemap + robots; 404 status | Social debugger pass not run |
| R08 | implemented and verified | Privacy rewritten for Formspree + `/api/newsletter` + no auto-subscribe | Confirm live analytics if host injects any |

## Checks run

| Command | Outcome |
| --- | --- |
| `npm run check` (Node 22.19.0) | Pass: 0 errors / 0 warnings / 0 hints |
| `npm test` | Pass: 128 tests |
| `npm run build` | Pass: 14 pages including five puppy details |
| Local preview | `http://127.0.0.1:4322/` |
| Unknown puppy path | HTTP 404 |
| OG image | `200 image/jpeg` for `/images/og-share.jpg` |

No pre-existing check failures blocked this work. Astro requires Node `>=22.12.0` (system Node 20 is insufficient).

## Browser verification

- Engine: Chromium via system Google Chrome + Playwright Core (headless)
- Viewports exercised for screenshots: 1363×936, 390×844/700/360
- Emulated reduced motion used for some captures
- **Not claimed:** real iPhone, Safari, or WebKit device pass; social-platform debugger pass

## Screenshots

Stored under `reports/screenshots/`:

| File | Route / state | Finding |
| --- | --- | --- |
| `01-home-desktop-1363.png` | `/` desktop | Hero + cluster actions (F02) |
| `02-home-phone-390.png` | `/` phone | Phone hero |
| `03-puppies-desktop-cards.png` | `/puppies` cards | Listing near top / aligned cards (R01, F03) |
| `04-puppies-phone-390.png` | `/puppies` phone | Phone cards |
| `05-detail-aspy-desktop.png` | `/puppies/aspy` desktop | Compact gallery + summary (F04) |
| `06-detail-aspy-phone.png` | `/puppies/aspy` phone | Gallery + summary close (F04) |
| `07-application-desktop.png` | `/application` | Inquiry column (R02) |
| `08-contact-desktop.png` | `/contact` | Contact alignment (R02, F12) |
| `09-privacy-desktop.png` | `/privacy` | Privacy doc (R08, F07 target) |
| `10-menu-phone-open.png` | `/` menu open | Drawer continuous surface (F01) |
| `11-menu-phone-short.png` | `/` short phone menu | Short-screen drawer (F01) |
| `12-footer-newsletter-normal.png` | footer | Newsletter row (F17) |
| `13-footer-newsletter-invalid.png` | footer invalid | Error below row (F17) |
| `14-og-share-asset.jpg` | social asset | Finished share image (F14, R07) |
| `15-color-lab-coming-soon.png` | `/color-lab` | Footer-only tool holding page (R03) |
| `16-bella-kiki-text.png` | `/bella` Kiki | Text-only sire (F14) |

## Real form submission ledger

| Form | Environment | Real attempts | Outcome |
| --- | --- | --- | --- |
| Puppy Inquiry (Formspree) | local preview | **0** | Not submitted |
| Contact (Formspree) | local preview | **0** | Not submitted |
| Newsletter (Brevo) | local preview | **0** | Client validation / unconfigured API only |

## Newsletter configuration still required

See `docs/newsletter-setup.md`. Required bindings:

- `BREVO_API_KEY` (secret)
- `BREVO_NEWSLETTER_LIST_IDS`
- `BREVO_NEWSLETTER_MODE` (`doi` or `direct` after owner confirmation)
- DOI-only: `BREVO_DOI_TEMPLATE_ID`, `BREVO_DOI_REDIRECT_URL`

Until configured, the API returns an honest unavailable state. Provider acceptance and inbox confirmation remain **unverified**.

## Image notes

- Leads preserved for all five puppies.
- Hero poster and OG image use real Bella lifestyle photography (JPEG).
- Litter older photos labeled “Earlier photograph” where applicable.
- No unpadded masters beyond the current v5 cream exports were found for further de-padding.

## Commit / push / deploy

**None.** Changes remain in the local working tree for owner review.
