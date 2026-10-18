# Newsletter setup (Brevo DOI + Cloudflare Pages)

The footer signup posts to the same-origin route `/api/newsletter` (Cloudflare Pages Function). Success means Brevo accepted a **double opt-in confirmation request**. It does **not** mean the visitor is already on the marketing list.

Selected mode: **DOI only**. Direct subscription is not supported. Missing or invalid configuration returns HTTP 503 before any upstream call.

## Canonical sender / reply address

- **Address:** `angelbulldogs7@gmail.com`
- **Source file:** `src/config/site.ts` (`siteConfig.email`)
- Use this address as From and Reply-To once verified in Brevo. Do not invent a no-reply address.

## Cloudflare bindings

In Cloudflare Workers & Pages → your Pages project → Settings → Variables and Secrets (or equivalent):

| Binding | Kind | Required value |
| --- | --- | --- |
| `BREVO_API_KEY` | Encrypted secret | Private Brevo API key |
| `BREVO_NEWSLETTER_LIST_IDS` | Plain text | Comma-separated positive integer list IDs (example format: `12` or `12,34`) |
| `BREVO_NEWSLETTER_MODE` | Plain text | Exactly `doi` |
| `BREVO_DOI_TEMPLATE_ID` | Plain text | Positive integer DOI template ID |
| `BREVO_DOI_REDIRECT_URL` | Plain text | Absolute HTTPS URL, production: `https://angelbulldogs.com/newsletter/thanks/` |

Keep Preview and Production values deliberate and separate. Do not put these values in `PUBLIC_*` / browser code.

## Local development

1. Copy the binding names into a gitignored `.dev.vars` file at the project root (Wrangler convention). Use obvious placeholders until real values exist.
2. Build, then run Functions with the static output:

```bash
npm run build
npx wrangler pages dev dist --ip 0.0.0.0 --port 8788
```

Or: `npm run preview:functions` / `npm run preview:phone`.

`astro preview` serves static files only and does **not** run Pages Functions.

## Owner account checklist

1. Open Brevo → Contacts → Lists. Prefer an existing Angel Bulldogs updates list; otherwise create **Angel Bulldogs updates** and record its numeric ID privately.
2. Verify sender/domain for `angelbulldogs7@gmail.com`. Use only DNS records supplied by the Brevo account.
3. Create or reuse an active API DOI template:
   - **Name:** Angel Bulldogs newsletter confirmation
   - **From name:** Angel Bulldogs
   - **From / Reply-To:** the verified website contact email
   - **Subject:** Confirm your Angel Bulldogs updates
   - **Preview:** One quick step to receive puppy and litter updates
   - **Body:**

> You asked to receive puppy and litter updates from Angel Bulldogs.
>
> By confirming, you agree to receive these updates by email. You can unsubscribe at any time.
>
> **Confirm my email**
>
> If you did not request these updates, you can ignore this email.

4. Link the button with Brevo’s API DOI merge tag `{{ params.DOIurl }}` (not a fixed site URL). `redirectionUrl` is where Brevo sends the visitor after confirmation; the DOI link itself performs confirmation.
5. Enter the list ID, template ID, API key, mode `doi`, and redirect URL in Cloudflare bindings.
6. Confirm `/newsletter/thanks/` is reachable in the environment you will test (deployment is outside this task).

## Optional one-signup live test (owner-run later)

Do not run during automated QA.

1. Confirm the address is not already on the target marketing list.
2. Submit the footer form once.
3. UI must say to check email / confirm; it must not claim confirmed membership.
4. Check inbox/spam for the confirmation email.
5. Before clicking, confirm the address is not yet on the marketing list.
6. Click the genuine confirmation link.
7. Confirm the thanks page and list membership.
8. Record pass/fail privately. Do not paste the test email or keys into public reports.

If this is not run: **Provider delivery/confirmation not tested.**

## Related files

- Function: `functions/api/newsletter.ts`
- Client form: `src/components/NewsletterPrototype.astro`
- Thanks page: `src/pages/newsletter/thanks.astro` (noindex; not in sitemap)
