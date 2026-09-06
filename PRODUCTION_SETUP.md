# Production Setup

This app is now structured for a web-first paid product using Supabase, Stripe, and Vercel.

Current Vercel production checkpoint:

- Project: `teagueporters-projects/posturelab`
- Production URL: `https://posturelab-six.vercel.app`
- Deployment ID: run `npm run vercel:deployment-check` for the current Ready deployment behind the production alias
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
- Auth callback fails closed if Supabase cannot create the user's profile row after email sign-in

The local scan flow still works without these services. When Supabase is configured and a user is signed in, new scans, check-ins, workout completions, and Pro weekly reviews also sync to Supabase. Cloud scan deletion fails closed if scan photo listing or removal fails before the scan row is deleted.

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
- `Prices`: read, for verifying configured price IDs during launch readiness
- `Products`: read, for verifying each configured price belongs to an active Product during launch readiness

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
npm run env:template-check
npm run setup:check
npm run launch:runbook
npm run supabase:schema-check
npm run supabase:live-check
npm run stripe:live-check
npm run vercel:deployment-check
npm run vercel:env-plan
npm run vercel:env-check
```

After each production deploy or environment-variable change, run:

```bash
npm run smoke:prod
```

This checks the deployed health endpoint, pricing checkout state, and unsigned Stripe webhook rejection without printing secrets.
Use `npm run vercel:deployment-check` after redeploying to confirm the production alias points at a Ready deployment.

After Supabase and Stripe env vars are configured in Vercel, run the stricter launch gate:

```bash
npm run smoke:ready
npm run launch:ready
```

This requires `/api/health` to report both Supabase and Stripe as configured, requires the pricing page to show live checkout controls, checks the live Supabase and Stripe setup from local env, confirms Vercel has the required env var names across production and preview, and exits nonzero until every readiness check passes.

## Supabase

Supabase connector state:

- Organization: `teagueporter's projects`
- Organization ID: `vercel_icfg_qqsgYASShKraJS8qi3PBxC9e`
- Plan: Free
- Project creation cost returned by the connector: `$0/month` as rechecked on September 6, 2026
- Existing visible projects are inactive and unrelated, so create a dedicated `posturelab` project instead of reusing them.

1. Run `npm run supabase:project-plan` to print the connector-confirmed project target, approval phrase, migration path, redirect URLs, and verification steps without printing keys.
2. Create a new Supabase project for this app after confirming the organization and cost.
3. Run `npm run supabase:migration-plan` to validate and summarize the migration before applying it to the live project.
4. Run the migration in `supabase/migrations/20260906052834_initial_production_schema.sql`.
5. Run `npm run supabase:live-check` after adding the Supabase env vars locally. It verifies the expected tables are reachable by the service role and confirms the `scan-images` bucket exists and is private without printing keys.
6. Confirm RLS is enabled on all public tables.
7. Confirm the `scan-images` bucket is private.
8. In Supabase Auth, add these redirect URLs:

```text
http://localhost:3000/auth/callback
https://posturelab-six.vercel.app/auth/callback
```

9. Copy the project URL, publishable key, and service role key into environment variables.

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

1. Run `npm run stripe:catalog-plan` to print the exact Stripe CLI commands for one `Posture Pro` product with monthly and yearly prices. The helper prints object names, amounts, lookup keys, and env var names, but never prints Stripe API keys.
2. Create a Product named `Posture Pro`.
3. Create a recurring monthly Price at `$4.99` and a recurring yearly Price at `$29` on that same Product.
4. Add the two Price IDs to `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_PRO_YEARLY_PRICE_ID`.
5. Run `npm run stripe:key-plan` before creating `STRIPE_RESTRICTED_KEY`. It prints the least-privilege permissions needed by the app runtime and launch readiness checks without printing keys.
6. Run `npm run stripe:live-check` after adding the Stripe env vars locally. It verifies the configured monthly and yearly price IDs are active recurring prices with the expected billing intervals, USD amounts, lookup keys, and active products without printing keys.
7. Run `npm run stripe:webhook-plan` to print the production webhook endpoint, subscribed events, and Stripe CLI command without printing keys.
8. Create a webhook endpoint:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

9. Subscribe the webhook to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

10. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
11. Confirm duplicate webhook deliveries return `200` and do not create duplicate subscription side effects. Stripe can send the same event more than once, and the app records processed event IDs in `stripe_webhook_events`.
12. Confirm failed webhook deliveries are retryable. The route only treats already processed events and fresh in-flight events as duplicates; failed events and stale processing claims are re-claimed for retry. If the route cannot sync subscription state or mark a processed event in Supabase, it returns `500` so Stripe retries instead of silently losing webhook bookkeeping. Checkout and billing portal actions also fail closed when Supabase cannot read or write the user's billing mapping.

Before going live, review Stripe Tax. The app intentionally does not enable `automatic_tax` until tax registrations are configured.

## Vercel

1. Push the working branch and confirm the GitHub Actions CI workflow passes.
2. Confirm the Vercel project `posturelab` is linked to the GitHub repo and uses the Next.js framework preset.
3. Enable only the observability products you want billed/active. The app already mounts the official Vercel Web Analytics and Speed Insights components. Vercel's September 2026 docs list Speed Insights as available on all plans with a free event allocation, while Web Analytics on Pro is event-billed after included usage.
4. Add the remaining environment variables for Production and Preview. Mark server secrets as sensitive where available. `NEXT_PUBLIC_APP_URL` is already set to `https://posturelab-six.vercel.app`. Use `npm run vercel:env-plan` after filling `.env.local`; it prints interactive `vercel env add` commands by variable name without printing secret values.
   After adding variables, run `npm run vercel:env-check` to confirm Vercel has every required variable name for production and preview without printing values.

```bash
npm run vercel:env-plan
npm run vercel:env-check
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

## Codex Connector Status

- Supabase connector: available; organizations, projects, and project cost were verified on 2026-09-06.
- Vercel connector: partially available. Runtime logs and project/deployment metadata returned scope authorization errors for `teagueporters-projects`; use the authenticated Vercel CLI until connector scope access is fixed.
- Stripe connector: no Stripe MCP create/list tools were exposed by Codex tool discovery in this session. Use the Stripe skill guidance plus Stripe CLI/Dashboard for catalog, restricted key, and webhook setup.

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

Before charging users, confirm:

- Privacy Policy legal review
- Terms of Service legal review
- Legal review of account export and deletion behavior
- Clear wellness-only, non-diagnostic language
- A short onboarding note explaining photo storage and privacy
- Confirm the final privacy policy names Vercel analytics/performance telemetry and excludes posture photos, pose landmarks, scan measurements, reports, payment credentials, and deletion confirmations from analytics inputs
- Domain/name decision, since there is already an App Store product named `PostureLab AI`

Authenticated account exports include database records plus short-lived signed URLs for scan photos, and the export fails closed if any stored scan photo URL cannot be signed. Deleting a cloud account removes scan image objects before deleting the Supabase Auth user, and the action fails closed if subscription lookup, storage cleanup, or Auth deletion returns a Supabase error.
