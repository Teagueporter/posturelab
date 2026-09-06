# Launch Tracker

This file mirrors the launch issues that still need to be created in GitHub. The GitHub connector can search the repo but returned `403 Resource not accessible by integration` when creating issues, so the tasks are tracked here until issue creation permissions are available.

- [ ] Run `npm run launch:runbook` before starting live service setup.
- [ ] Run `npm run launch:next` to confirm the shortest current blocker list before each setup session.

## Connector Status

- Supabase connector: available; organizations, projects, and project cost were verified on 2026-09-06.
- Vercel connector: partially available, but deployment/project metadata returned scope authorization errors for `teagueporters-projects`; use the authenticated Vercel CLI until connector scope access is fixed.
- Stripe connector: no Stripe MCP create/list tools were exposed by Codex tool discovery in this session; use the Stripe skill guidance plus Stripe CLI/Dashboard for catalog, restricted key, and webhook setup.

## Supabase

- [x] Run `npm run supabase:project-plan` to confirm the connector-quoted project target before approval.
- [x] Re-verified with the Supabase connector on 2026-09-06 12:03 MDT: organization `teagueporter's projects` (`vercel_icfg_qqsgYASShKraJS8qi3PBxC9e`) and project cost `$0/month`.
- [x] Created Supabase project `posturelab` (`smvpegauglgjlnxytzkl`) in `teagueporter's projects` after explicit approval for the connector-quoted `$0/month` cost.
- [x] Run `npm run supabase:migration-plan` before applying SQL to the live project.
- [x] Apply `supabase/migrations/20260906052834_initial_production_schema.sql`.
- [ ] Run `npm run supabase:live-check` after local Supabase env vars are installed.
- [x] Confirm RLS, private `scan-images` storage, and folder-scoped storage policies.
- [x] Run Supabase security/performance advisors after migration. Current findings are INFO-only: webhook events intentionally has no user policies, and fresh indexes are unused because the project has no data yet.
- [ ] Add `http://localhost:3000/auth/callback` and `https://posturelab-six.vercel.app/auth/callback` as Supabase Auth redirect URLs.
- [ ] Capture service role key for local and Vercel server env.
- [x] Capture project URL and modern publishable key for local env.
- [x] Add public Supabase URL and publishable key to Vercel Production and Preview.

## Stripe

- [ ] Run `npm run stripe:cli-check`; if it fails, use Stripe Dashboard setup with the same settings from the plan commands.
- [ ] Run `npm run stripe:catalog-plan` and use its generated Stripe CLI commands for the Pro catalog.
- [ ] Create one `Posture Pro` product with monthly and yearly prices.
- [ ] Run `npm run stripe:key-plan` before creating the runtime restricted key.
- [ ] Create the restricted runtime key with Customers read/write, Checkout Sessions write, Customer Portal Sessions write, Subscriptions read/write, Prices read, and Products read.
- [ ] Run `npm run stripe:live-check` after local Stripe env vars are installed.
- [ ] Run `npm run stripe:webhook-plan` before creating the live webhook endpoint.
- [ ] Create the webhook endpoint at `https://posturelab-six.vercel.app/api/stripe/webhook`.
- [ ] Subscribe the webhook to checkout completion and subscription create/update/delete events.
- [ ] Review Stripe Tax before live charging. `automatic_tax` is intentionally not enabled yet.

## Vercel

- [ ] Add Supabase and Stripe env vars to Production and Preview.
- [x] Confirm Vercel Production is deployed from current commit `80ce0aca4081826af3e6ff99b2e1d758a5220366`.
- [ ] Run `npm run vercel:env-plan` locally before adding Vercel env vars so secret values are never printed in setup logs.
- [ ] Run `npm run vercel:env-check` after adding Vercel env vars.
- [ ] Redeploy production.
- [ ] Run `npm run vercel:deployment-check` after redeploying production.
- [ ] Run `npm run verify`.
- [ ] Run `npm run smoke:prod`.
- [ ] Run `npm run smoke:ready` after Vercel env vars are deployed.
- [ ] Run `npm run launch:ready` as the final combined readiness check.
- [ ] Confirm `/api/health` reports Supabase and Stripe as `configured`.
- [ ] Test login, checkout, customer portal, webhook sync, account export/delete, and cloud scan sync end to end.
- [ ] Decide whether to enable Vercel Web Analytics and Speed Insights in project settings.
- [ ] Use the Vercel dashboard for runtime logs unless connector access is fixed.
