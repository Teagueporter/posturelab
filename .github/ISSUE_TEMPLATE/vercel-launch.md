---
name: Vercel launch task
about: Wire production environment variables and final launch smoke tests
title: "Wire Vercel env vars and run final launch smoke tests"
labels: launch, vercel
assignees: ""
---

## Goal

Connect production Vercel configuration to Supabase and Stripe, then verify the paid web app end to end.

## Tasks

- [ ] Add Supabase env vars to Vercel Production and Preview:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` as sensitive
- [ ] Add Stripe env vars to Vercel Production and Preview:
  - `STRIPE_RESTRICTED_KEY` as sensitive
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` as sensitive
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- [ ] Redeploy production after env vars are set.
- [ ] Decide whether to enable Vercel Web Analytics and Speed Insights in project settings.
- [ ] Resolve or accept the current Vercel runtime-log connector limitation. It returned `403 Forbidden`; dashboard logs may be needed.

## Verification

- [ ] `npm run verify`
- [ ] `npm run smoke:prod`
- [ ] `/api/health` reports Supabase and Stripe as `configured`.
- [ ] `/login` sends a Supabase magic link.
- [ ] `/pricing` shows live checkout controls.
- [ ] Signed-out upgrade redirects through login and returns to checkout.
- [ ] `/account` export and delete controls work for a signed-in test user.
- [ ] `/scan`, `/plan`, `/report`, and `/results/[scanId]` still work after cloud sync is enabled.
