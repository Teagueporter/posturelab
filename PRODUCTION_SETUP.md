# Production Setup

This app is now structured for a web-first paid product using Supabase, Stripe, and Vercel.

Current Vercel production checkpoint:

- Project: `teagueporters-projects/posturelab`
- Production URL: `https://posturelab-six.vercel.app`
- Deployment ID: `dpl_GKpYRbuhGq579qa8H4mhgPHWzKaR`
- Status: deployed and responding; `NEXT_PUBLIC_APP_URL` is configured in Vercel; `/api/health` currently reports Supabase and Stripe as `missing-env`
- Latest smoke check: `npm run smoke:prod` passed against the production alias with disabled checkout and unsigned webhook rejection verified

## Current Architecture

- Next.js app hosted on Vercel
- Supabase Auth for user accounts
- Supabase Postgres for scans, measurements, weekly reviews, check-ins, completions, and subscription state
- Supabase Storage private bucket for scan photos
- Stripe Checkout for Pro subscriptions
- Stripe Customer Portal for self-service billing
- Stripe webhook for subscription status sync with Supabase-backed event deduplication
- Vercel Web Analytics and Speed Insights components mounted globally for launch observability
- Structured JSON logs on `/api/health`, `/api/account/export`, `/api/stripe/webhook`, login actions, checkout actions, billing portal actions, and account deletion actions with non-secret state only
- Server-aware entitlements: Free users get one saved scan; Pro users get unlimited scans plus weekly review/report export features

The local scan flow still works without these services. When Supabase is configured and a user is signed in, new scans, check-ins, workout completions, and Pro weekly reviews also sync to Supabase.

## Required Environment Variables

Set these in `.env.local` for local development and in Vercel for preview/production:

```bash
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_RESTRICTED_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
```

Use a Stripe restricted key when possible. Do not commit `.env.local` or real keys.

The runtime Stripe restricted key should be scoped to the smallest surface the app uses:

- `Customers`: read/write, for creating and reusing the Stripe customer mapped to a Supabase user
- `Checkout Sessions`: write, for creating hosted Pro subscription checkout
- `Customer Portal Sessions`: write, for opening billing self-service from Account
- `Subscriptions`: read/write, for webhook subscription retrieval and account-deletion cancellation

The app does not need a broad Stripe secret key for normal runtime billing. If a restricted key returns a Stripe `403` during test checkout, add only the missing permission shown in Stripe request logs and test again.

Expected value shapes:

- `NEXT_PUBLIC_APP_URL`: absolute `https://...` app URL with no trailing slash in production
- `NEXT_PUBLIC_SUPABASE_URL`: absolute Supabase project URL
- `STRIPE_RESTRICTED_KEY`: restricted key beginning with `rk_`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: publishable key beginning with `pk_`
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret beginning with `whsec_`
- Stripe price IDs: values beginning with `price_`

Check configured values without printing secrets:

```bash
npm run setup:check
npm run supabase:schema-check
npm run vercel:env-plan
```

After each production deploy or environment-variable change, run:

```bash
npm run smoke:prod
```

This checks the deployed health endpoint, pricing checkout state, and unsigned Stripe webhook rejection without printing secrets.

## Supabase

Supabase connector state:

- Organization: `teagueporter's projects`
- Organization ID: `vercel_icfg_qqsgYASShKraJS8qi3PBxC9e`
- Plan: Free
- Project creation cost returned by the connector: `$0/month` as rechecked on September 6, 2026
- Existing visible projects are inactive and unrelated, so create a dedicated `posturelab` project instead of reusing them.

1. Create a new Supabase project for this app after confirming the organization and cost.
2. Run the migration in `supabase/migrations/20260906052834_initial_production_schema.sql`.
3. Confirm RLS is enabled on all public tables.
4. Confirm the `scan-images` bucket is private.
5. In Supabase Auth, add these redirect URLs:

```text
http://localhost:3000/auth/callback
https://posturelab-six.vercel.app/auth/callback
```

6. Copy the project URL, publishable key, and service role key into environment variables.

The service role key is only used on the server for billing webhook/customer synchronization. It must never be exposed to the browser.

The migration explicitly grants authenticated Data API access only to the app tables that browser clients need, keeps `stripe_webhook_events` service-only through RLS, scopes storage objects to the signed-in user's folder, and drops/recreates policies by name so setup retries fail less noisily.

For local database testing, run:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:lint
npm run supabase:status
```

`npm run supabase:status` prints local values using `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` names for `.env.local`.

## Stripe

1. Create a Product named `Posture Pro Monthly`.
2. Add a recurring monthly Price, suggested starting price `$4.99`.
3. Create a Product named `Posture Pro Yearly`.
4. Add a recurring yearly Price, suggested starting price `$29`.
5. Add the two Price IDs to `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_PRO_YEARLY_PRICE_ID`.
6. Create a webhook endpoint:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

7. Subscribe the webhook to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

8. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
9. Confirm duplicate webhook deliveries return `200` and do not create duplicate subscription side effects. Stripe can send the same event more than once, and the app records processed event IDs in `stripe_webhook_events`.
10. Confirm failed webhook deliveries are retryable. The route only treats already processed events and fresh in-flight events as duplicates; failed events and stale processing claims are re-claimed for retry. If the route cannot mark a processed event in Supabase, it returns `500` so Stripe retries instead of silently losing webhook bookkeeping.

Before going live, review Stripe Tax. The app intentionally does not enable `automatic_tax` until tax registrations are configured.

## Vercel

1. Push the working branch and confirm the GitHub Actions CI workflow passes.
2. Confirm the Vercel project `posturelab` is linked to the GitHub repo and uses the Next.js framework preset.
3. Enable only the observability products you want billed/active. The app already mounts the official Vercel Web Analytics and Speed Insights components. Vercel's September 2026 docs list Speed Insights as available on all plans with a free event allocation, while Web Analytics on Pro is event-billed after included usage.
4. Add the remaining environment variables for Production and Preview. Mark server secrets as sensitive where available. `NEXT_PUBLIC_APP_URL` is already set to `https://posturelab-six.vercel.app`. Use `npm run vercel:env-plan` after filling `.env.local`; it prints interactive `vercel env add` commands by variable name without printing secret values.

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production,preview,development --value "https://PROJECT_REF.supabase.co" --no-sensitive --yes
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production,preview,development --value "sb_publishable_..." --no-sensitive --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview,development --value "..." --sensitive --yes

vercel env add STRIPE_RESTRICTED_KEY production,preview,development --value "rk_..." --sensitive --yes
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production,preview,development --value "pk_..." --no-sensitive --yes
vercel env add STRIPE_WEBHOOK_SECRET production,preview,development --value "whsec_..." --sensitive --yes
vercel env add STRIPE_PRO_MONTHLY_PRICE_ID production,preview,development --value "price_..." --no-sensitive --yes
vercel env add STRIPE_PRO_YEARLY_PRICE_ID production,preview,development --value "price_..." --no-sensitive --yes
```

5. Deploy a preview or production build.
6. Test these routes:

```text
/
/scan
/pricing
/login
/account
/plan
/report
/api/health
```

7. Test Stripe Checkout in test mode.
8. Test signed-out upgrade flow: click Upgrade, sign in by magic link, confirm it returns to `/pricing`, then start Checkout.
9. Test the Stripe webhook using Stripe CLI or Dashboard test events.
10. Switch Stripe and Supabase settings to production values only after the full flow passes.

The first Vercel production deployment was created from this machine. It is usable for smoke checks, but paid-account features will stay disabled until the required Supabase and Stripe environment variables are configured in Vercel.

Keep `.vercel/` local. It contains project-link metadata and is intentionally ignored by git.

The Vercel runtime-log connector returned `403 Forbidden` for this project during setup and again against deployment `dpl_Fps8LmZwgeWhqpQuzmMUBhNyY1EG`. Use the Vercel dashboard or grant the connector log access before relying on automated runtime-log checks.

## Domain Options

Checked through Vercel on September 6, 2026. No domains were purchased.

Available:

- `posturetrack.app`: `$9.99/year`
- `uprightscan.com`: `$11.25/year`
- `uprightscan.app`: `$9.99/year`
- `alignscan.app`: `$9.99/year`

Unavailable in the same check:

- `posturelab.app`
- `posturelab.co`
- `posturelab.fit`
- `posturescan.app`
- `posturecheck.app`
- `posturecoach.app`

`posturetrack.app` is the best fit if the product remains focused on posture trend tracking. `uprightscan.com` is stronger if the goal is a broader consumer brand with a `.com`.

## Security Headers

`next.config.ts` sets production security headers, including:

- Content Security Policy with Stripe and Supabase allowances
- MediaPipe runtime allowances for `cdn.jsdelivr.net` WASM/workers and `storage.googleapis.com` model assets
- `frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` allowing camera access only for this app

If Stripe Embedded Checkout, Link, or additional media hosts are added later, update the CSP deliberately instead of broadening it with `*`.

The Stripe webhook and account export routes are explicitly pinned to the Next.js Node.js runtime because they use server-only SDK, cookie, and database behavior.

## Runtime Logging

Launch-critical API routes and server actions emit compact JSON logs for start/done/failure states. Route logs include route, status, elapsed milliseconds, and Vercel request id when available. Action logs include action name, result, elapsed milliseconds, and safe state like selected billing interval or whether an email was provided. They intentionally do not include user emails, user ids, Stripe signatures, secret keys, or scan/photo payloads.

## Launch Readiness

Before charging users, add:

- Final Privacy Policy
- Final Terms of Service
- Legal review of account export and deletion behavior
- Clear wellness-only, non-diagnostic language
- A short onboarding note explaining photo storage and privacy
- Confirm the final privacy policy names Vercel analytics/performance telemetry and excludes posture photos, pose landmarks, scan measurements, reports, payment credentials, and deletion confirmations from analytics inputs
- Domain/name decision, since there is already an App Store product named `PostureLab AI`

Authenticated account exports include database records plus short-lived signed URLs for scan photos. Deleting a cloud account removes scan image objects before deleting the Supabase Auth user.
