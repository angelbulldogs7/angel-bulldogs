# Angel Bulldogs four final fixes completion report

**Prepared:** October 18, 2026 (America/Chicago)  
**Brief:** `angel-bulldogs-cursor-four-final-fixes.md`  
**Release boundary:** Owner approved commit, push to `main`, and Cloudflare Pages production deploy on October 18, 2026.

## 1. Four-fix disposition

| Fix | Disposition |
| --- | --- |
| 1. FAQ links (QA-01) | **Implemented and verified.** Linked FAQ items open and sit below the measured sticky header. |
| 2. Repeated content (QA-03) | **Implemented and verified.** Identified duplicates removed; useful facts and CTAs retained. |
| 3. Public implementation notes (QA-03/04) | **Implemented and verified.** Visitor-facing Bella and Privacy copy replaced where specified. |
| 4. Privacy / Cloudflare measurement (QA-02) | **Implemented and verified.** Policy matches observed Cloudflare hosting/measurement. Private Cloudflare account settings were **not** inspected. |

## 2. Changed files / visitor-facing effects

| Area | Files | Visitor effect |
| --- | --- | --- |
| FAQ anchors | `src/lib/faqAnchors.ts`, `src/scripts/faq-anchors.ts`, `src/pages/faq.astro`, `src/styles/global.css`, `src/lib/faqAnchors.test.ts`, `package.json` | `/faq/#…` opens the target disclosure and scrolls it below `--header-h`. |
| Newsletter footer | `src/components/NewsletterPrototype.astro` | Upper signup line once; lower hint is unsubscribe / no-reservation. |
| Color Lab | `src/pages/color-lab.astro` | One intro paragraph under Still in the works; Meet the puppies + Contact us kept. |
| Puppy grids | `src/components/PuppyCard.astro`, `src/components/PuppyGrid.astro`, `src/styles/global.css` | Shared pricing note once per grid; card actions stay bottom-aligned. |
| Puppy details | `src/pages/puppies/[slug].astro` | Card teaser no longer repeats above the full biography. |
| Homepage | `src/pages/index.astro`, `src/components/BellaFeature.astro` | Distinct Bella preview; standalone FAQ strip removed (process FAQ CTA remains). |
| Bella | `src/pages/bella.astro`, `src/data/parents.ts` | No photo-approval or implementer caveats; personality, three-litter, maternal, text-only Kiki retained. |
| Privacy | `src/pages/privacy.astro`, `src/data/content.ts` | Visitor newsletter wording; Site measurement and hosting section; revised date Oct 18, 2026. |

## 3. FAQ behavior

Verified against the **actual header bounds** (not a fixed 132px assumption) on local preview `http://127.0.0.1:4322/`.

| Case | Result |
| --- | --- |
| Direct `/faq/#records` (desktop 1363) | Open; summary ~48px below header (`--header-h` ≈ 133px) |
| Direct `/faq/#agree-hold` | Same |
| Profile → Read the full records answer | Same |
| Profile → How holds and deposits work | Same |
| Hash change records → agree-hold | Target visible below header |
| Browser Back / Forward | Correct target open and positioned |
| FAQ without hash | No disclosure forced open; no scroll jump |
| Unknown / malformed hash | No script error; no unrelated disclosure opened |
| Manual close / reopen after fragment init | Works |
| Keyboard Enter on summary | Native disclosure works |
| Phone 390 / landscape 844×390 / 320 / 768 | Target below measured header |

Reduced motion: tests used `reducedMotion: 'reduce'`; scroll uses `behavior: 'auto'` when preferred.

## 4. Copy before / after (identified issues)

| Issue | Before | After |
| --- | --- | --- |
| Newsletter hint | Same signup sentence above and below the input | Above: receive/confirm once. Below: unsubscribe anytime; joining does not reserve. |
| Color Lab | Same intro under hero and Still in the works | Intro once in the holding card |
| Detail teasers | Short card teaser + full bio on each detail page | Full bio only on detail; teaser remains on cards/metadata |
| Grid pricing | Full pricing paragraph on every card | Once above each grid; still on detail inquiry area |
| Bella homepage preview | Repeated name-origin explanation | Short personality invitation + Bella's story link |
| Homepage FAQ | Process FAQ CTA + second FAQ strip | Process FAQ CTA only |
| Kiki | “No approved photograph…” | Text-only sire retained without asset-approval note |
| Bella personality | Extra children/suitability implementer caveat | Owner personality paragraph only |
| Three-litter section | “program philosophy… does not guarantee…” | Program limit + maternal/natural delivery facts |
| Privacy newsletter | `/api/newsletter`, API key, bindings setup | Visitor DOI / Brevo / unsubscribe wording |
| Privacy analytics | “does not… in source” | Cloudflare hosting and performance measurement |

## 5. Privacy basis (Cloudflare)

| Evidence | Finding |
| --- | --- |
| Repository source | No analytics suite or advertising pixels committed. |
| Live Chromium (Oct 18, 2026) | Delivered document loads `https://static.cloudflareinsights.com/beacon.min.js/…` (Cloudflare Web Analytics / insights beacon). |
| Live response headers (curl) | `server: cloudflare`; NEL report-to `a.nel.cloudflare.com`. |
| Private Cloudflare dashboard | **Not inspected.** Exact account toggle (e.g. which Web Analytics product UI) unknown. |

Policy wording deliberately stays at the supported general level: Cloudflare hosting and performance measurement; ordinary host/CDN logs possible. No invented cookie, retention, advertising-pixel, or anonymity claims. No provider settings were changed.

## 6. Checks

| Command | Outcome |
| --- | --- |
| `npm run check` (Node 22.19.0) | Pass: 0 errors / 0 warnings / 0 hints |
| `npm test` | Pass: **150** tests (includes new FAQ fragment unit tests) |
| `npm run build` | Pass: 15 pages |

Focused FAQ placement and copy acceptance were run with Playwright Core + system Chrome against local preview (see section 3). Zero real form submissions.

## 7. Responsive evidence

| Viewport | Used for |
| --- | --- |
| 1363×936 | FAQ desktop, home/listing/detail/privacy/color-lab copy, footer |
| 390×844 | FAQ phone |
| 844×390 | FAQ phone landscape |
| 320×700, 768×700 | FAQ offset + listing pricing once |

Screenshots under `reports/screenshots/four-final-fixes/`:

| File | Subject |
| --- | --- |
| `01-faq-records-desktop.png` | Open `#records` below header (desktop) |
| `02-faq-records-phone.png` | Open `#records` below header (phone) |
| `03-footer-newsletter.png` | Revised footer signup copy |
| `04-color-lab.png` | Single intro Color Lab holding page |

**Real iPhone / Safari:** not run (pending). Chromium emulation is not claimed as a physical-device pass.

## 8. Form quota

| Form | Real submissions |
| --- | --- |
| Puppy Inquiry | **0** |
| Contact | **0** |
| Newsletter signup | **0** |
| Brevo confirmation-template test send | **0** |

Inquiry preselection for `?puppy=aspy` was inspected without submit. Inbox delivery / list membership: **not run**.

## 9. External status

| Item | Status |
| --- | --- |
| Real iPhone / Safari | Pending |
| Provider email delivery / DOI inbox | Pending / not run this patch |
| Cloudflare private account feature confirmation | Not inspected |

## 10. Release state

Owner approved release: commit to `main`, push to GitHub, and Cloudflare Pages production deploy (see deploy notes after push).
